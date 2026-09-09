/**
 * CLI driver contract: target classification, npm shim parsing, allowBuilds
 * retry, dump parsing, boot-failure markers, and the subprocess spec each
 * stage spawns (argv, env, cwd — no shell, hostile specs stay argv entries).
 * @module dsh-test-drive/test/driver.spec
 */

import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { zstdCompressSync } from 'node:zlib'
import { Context } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it } from 'vitest'
import { analyzeSessionLog } from '../src/capability.ts'
import { resolveConfig } from '../src/config.ts'
import { DshDriver, anchorLocalTarget, classifyTarget, dumpMentionsPackage, hasBootFailure, isGitLike, parseDumpLayers, parseIgnoredBuildScript, parseNpmShim } from '../src/driver.ts'
import { FAKE_DSH_BIN, FakeSubprocessRuntime } from './harness.ts'

const homes: string[] = []

async function tempHome(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-test-drive-spec-'))
  homes.push(dir)
  return dir
}

afterEach(async () => {
  for (const dir of homes.splice(0)) {
    await rm(dir, { recursive: true, force: true, maxRetries: 3 }).catch(() => {})
  }
})

describe('classifyTarget', () => {
  it('classifies git specs', () => {
    expect(classifyTarget('github:owner/repo#abc123')).toBe('repo')
    expect(classifyTarget('git+https://example.com/r.git')).toBe('repo')
    expect(classifyTarget('git@github.com:o/r.git')).toBe('repo')
    expect(classifyTarget('https://example.com/r.git#v1')).toBe('repo')
  })
  it('classifies npm packages', () => {
    expect(classifyTarget('dsh-click')).toBe('npm')
    expect(classifyTarget('@scope/pkg@1.2.3')).toBe('npm')
  })
  it('classifies paths and tarballs', () => {
    expect(classifyTarget('./plugin')).toBe('path')
    expect(classifyTarget('pkg.tgz')).toBe('tarball')
    expect(classifyTarget('file:pkg.tgz')).toBe('tarball')
    expect(classifyTarget('file:C:/p')).toBe('path')
  })
  it('classifies windows drive paths as local paths on win32', (ctx) => {
    if (process.platform !== 'win32') return ctx.skip()
    expect(classifyTarget('C:\\p\\plugin')).toBe('path')
  })
})

describe('isGitLike', () => {
  it('matches only git-hosted forms', () => {
    expect(isGitLike('github:a/b')).toBe(true)
    expect(isGitLike('git+https://x')).toBe(true)
    expect(isGitLike('dsh-click')).toBe(false)
    expect(isGitLike('./x')).toBe(false)
  })
})

describe('parseNpmShim', () => {
  const shim = [
    '@ECHO off',
    'GOTO start',
    ':find_dp0',
    'SET dp0=%~dp0',
    'EXIT /b',
    ':start',
    'SETLOCAL',
    'CALL :find_dp0',
    '',
    'IF EXIST "%dp0%\\node.exe" (',
    '  SET "_prog=%dp0%\\node.exe"',
    ') ELSE (',
    '  SET "_prog=node"',
    '  SET PATHEXT=%PATHEXT:;.JS;=;%',
    ')',
    '',
    'endLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & "%_prog%"  "%dp0%\\node_modules\\@deepseek-ai\\dsh\\bin\\dsh.js" %*',
    '',
  ].join('\r\n')

  it('extracts the JS target relative to the shim directory on win32', (ctx) => {
    if (process.platform !== 'win32') return ctx.skip()
    expect(parseNpmShim('C:\\npm\\dsh.cmd', shim)).toBe(join('C:\\npm', 'node_modules', '@deepseek-ai', 'dsh', 'bin', 'dsh.js'))
  })

  it('fails loud when no dp0 target exists', () => {
    expect(() => parseNpmShim('x.cmd', 'echo nothing here')).toThrow(/cannot parse npm shim/)
  })
})

describe('parseIgnoredBuildScript', () => {
  it('extracts the blocked package name', () => {
    expect(parseIgnoredBuildScript('Ignored build scripts: dsh-click. Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.')).toBe('dsh-click')
  })
  it('returns undefined without the hint', () => {
    expect(parseIgnoredBuildScript('ERR_PNPM network error')).toBeUndefined()
  })
})

describe('parseDumpLayers / dumpMentionsPackage', () => {
  const dump = [
    '# == @deepseek-ai/dsh-base',
    '- id: base',
    '# == dsh-click',
    '- insert:',
    '    - id: click',
    '      name: dsh-click',
    '# == C:\\profile\\cordis.patch.yml',
    '- id: user-row',
  ].join('\n')

  it('collects layer labels', () => {
    expect(parseDumpLayers(dump)).toEqual(['@deepseek-ai/dsh-base', 'dsh-click', 'C:\\profile\\cordis.patch.yml'])
  })

  it('detects the package via layer label and via row name', () => {
    expect(dumpMentionsPackage(dump, 'dsh-click').mentioned).toBe(true)
    expect(dumpMentionsPackage(dump, 'dsh-click').layers).toEqual(['dsh-click'])
    const noLayer = '- id: x\n  name: dsh-other\n- id: y\n  name: dsh-click\n'
    expect(dumpMentionsPackage(noLayer, 'dsh-click').mentioned).toBe(true)
  })

  it('does not match a package name inside another name', () => {
    expect(dumpMentionsPackage(dump, 'dsh-clicks').mentioned).toBe(false)
  })
})

describe('hasBootFailure', () => {
  it('matches every loader-failure marker', () => {
    expect(hasBootFailure('dsh: plugin(s) failed to load: dsh-x')).toBe(true)
    expect(hasBootFailure('dsh: 2 entries did not activate')).toBe(true)
    expect(hasBootFailure('row status FAILED')).toBe(true)
    expect(hasBootFailure('could not be resolved')).toBe(true)
  })
  it('ignores ordinary output', () => {
    expect(hasBootFailure('install ok (exit 0)')).toBe(false)
  })
})

describe('DshDriver.run', () => {
  it('spawns the configured dshBin through node with argv/env/cwd isolation', async () => {
    const ctx = new Context()
    const subprocess = new FakeSubprocessRuntime(ctx)
    const home = await tempHome()
    const storeDir = join(home, 'pnpm-store')
    const cwd = join(home, 'workspace')
    const config = resolveConfig({ dshBin: FAKE_DSH_BIN, forwardEnv: ['DEEPSEEK_API_KEY'] })
    process.env.DEEPSEEK_API_KEY = 'test-key-value'
    try {
      const driver = new DshDriver({ ctx, config, log: () => {} })
      const run = await driver.run(['plugin', '--profile', 'headless', 'add', 'a;rm -rf /'], {
        home, cwd, storeDir, timeoutMs: 10_000,
      })
      expect(run.exitCode).toBe(0)
      const spawn = subprocess.spawns[0]
      expect(spawn).toBeDefined()
      expect(spawn?.argv[0]).toBe(process.execPath)
      expect(spawn?.argv[1]).toBe(FAKE_DSH_BIN)
      expect(spawn?.argv.slice(2)).toEqual(['plugin', '--profile', 'headless', 'add', 'a;rm -rf /'])
      expect(spawn?.cwd).toBe(cwd)
      expect(spawn?.env?.DSH_HOME).toBe(home)
      expect(spawn?.env?.npm_config_store_dir).toBe(storeDir)
      expect(spawn?.env?.DEEPSEEK_API_KEY).toBe('test-key-value')
    } finally {
      delete process.env.DEEPSEEK_API_KEY
    }
  })

  it('reports a locate/spawn failure without throwing', async () => {
    const ctx = new Context()
    const subprocess = new FakeSubprocessRuntime(ctx)
    const home = await tempHome()
    // locate() refuses a relative dshBin; run() converts that into a failure record.
    const bad = new DshDriver({ ctx, config: resolveConfig({ dshBin: 'relative/dsh.js' }), log: () => {} })
    const run = await bad.run(['--version'], { home, cwd: join(home, 'w'), storeDir: join(home, 's'), timeoutMs: 1_000 })
    expect(run.exitCode).toBeNull()
    expect(run.stderr).toContain('spawn failed')
    expect(subprocess.spawns).toHaveLength(0)
  })
})

describe('DshDriver.add allowBuilds retry', () => {
  it('allowlists the blocked package and retries once', async () => {
    const ctx = new Context()
    const subprocess = new FakeSubprocessRuntime(ctx, [
      { exitCode: 1, stderr: 'ERR_PNPM_BLOCKED Ignored build scripts: dsh-click. Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.' },
      { exitCode: 0, stdout: 'ok' },
    ])
    const home = await tempHome()
    const config = resolveConfig({ dshBin: FAKE_DSH_BIN })
    const driver = new DshDriver({ ctx, config, log: () => {} })
    const outcome = await driver.add('github:owner/dsh-click#abc', {
      home, cwd: join(home, 'w'), storeDir: join(home, 's'), timeoutMs: 5_000,
    })
    expect(outcome.attempts).toBe(2)
    expect(outcome.allowBuildsNeeded).toBe(true)
    expect(outcome.run.exitCode).toBe(0)
    expect(subprocess.spawns).toHaveLength(2)
    const workspaceYaml = await readFile(join(home, 'profiles', 'headless', 'pnpm-workspace.yaml'), 'utf8')
    expect(workspaceYaml).toContain("'dsh-click': true")
  })

  it('does not retry a non-git failure or when allowBuilds is disabled', async () => {
    const ctx = new Context()
    const subprocess = new FakeSubprocessRuntime(ctx, [
      { exitCode: 1, stderr: 'ERR_PNPM network error' },
    ])
    const home = await tempHome()
    const driver = new DshDriver({ ctx, config: resolveConfig({ dshBin: FAKE_DSH_BIN }), log: () => {} })
    const outcome = await driver.add('github:o/r#sha', { home, cwd: join(home, 'w'), storeDir: join(home, 's'), timeoutMs: 5_000 })
    expect(outcome.attempts).toBe(1)
    expect(subprocess.spawns).toHaveLength(1)
  })
})

describe('DshDriver.readInstalledPackage', () => {
  it('reads name, version, and bundle manifest from the profile node_modules', async () => {
    const ctx = new Context()
    new FakeSubprocessRuntime(ctx)
    const home = await tempHome()
    const profileDir = join(home, 'profiles', 'headless')
    const { mkdirSync, writeFileSync } = await import('node:fs')
    mkdirSync(join(profileDir, 'node_modules', 'dsh-click'), { recursive: true })
    writeFileSync(join(profileDir, 'package.json'), JSON.stringify({
      dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', 'dsh-click'] } },
    }))
    writeFileSync(join(profileDir, 'node_modules', 'dsh-click', 'package.json'), JSON.stringify({
      name: 'dsh-click', version: '0.2.0', dsh: { bundle: { patch: './cordis.patch.yml' } },
    }))
    const driver = new DshDriver({ ctx, config: resolveConfig({ dshBin: FAKE_DSH_BIN }), log: () => {} })
    const pkg = await driver.readInstalledPackage(profileDir)
    expect(pkg).toEqual({ packageName: 'dsh-click', packageVersion: '0.2.0', hasBundleManifest: true })
  })

  it('returns undefined when no out-of-tree bundle is installed', async () => {
    const ctx = new Context()
    new FakeSubprocessRuntime(ctx)
    const home = await tempHome()
    const profileDir = join(home, 'profiles', 'headless')
    const { mkdirSync, writeFileSync } = await import('node:fs')
    mkdirSync(profileDir, { recursive: true })
    writeFileSync(join(profileDir, 'package.json'), JSON.stringify({ dsh: { profile: { bundles: ['@deepseek-ai/dsh-base'] } } }))
    const driver = new DshDriver({ ctx, config: resolveConfig({ dshBin: FAKE_DSH_BIN }), log: () => {} })
    expect(await driver.readInstalledPackage(profileDir)).toBeUndefined()
  })
})

describe('DshDriver.readNewestSession', () => {
  it('reads the newest session from the project/session layout and closes the decode → analyze loop', async () => {
    const ctx = new Context()
    new FakeSubprocessRuntime(ctx)
    const home = await tempHome()
    const dir = join(home, 'sessions', '--proj--', 'sess-1')
    await mkdir(dir, { recursive: true })
    const lines = [
      '{"type":"session","version":3}',
      '{"type":"tool/call","data":{"name":"plugin_vet","callId":"c1"}}',
      '{"type":"tool/result","data":{"callId":"c1","output":"license: MIT, verdict pass"}}',
      '{"type":"assistant/message","data":{"text":"capability-check-done"}}',
    ]
    // The host writes one frame per durable batch: a whole-file decode sees only the header.
    await writeFile(join(dir, 'session.v3.jsonl.zstd'), Buffer.concat(lines.map(line => zstdCompressSync(`${line}\n`))))

    const driver = new DshDriver({ ctx, config: resolveConfig({ dshBin: FAKE_DSH_BIN }), log: () => {} })
    const text = await driver.readNewestSession(home, 1024 * 1024)
    expect(text).toContain('"type":"tool/call"')
    const analysis = analyzeSessionLog(text, { kind: 'tool', name: 'plugin_vet', expect: 'verdict pass' })
    expect(analysis.status).toBe('observed')
    expect(analysis.expectMatched).toBe(true)
  })

  it('returns empty text when the store has no session artifact', async () => {
    const ctx = new Context()
    new FakeSubprocessRuntime(ctx)
    const home = await tempHome()
    await mkdir(join(home, 'sessions'), { recursive: true })
    const driver = new DshDriver({ ctx, config: resolveConfig({ dshBin: FAKE_DSH_BIN }), log: () => {} })
    expect(await driver.readNewestSession(home, 1024)).toBe('')
  })
})

describe('anchorLocalTarget', () => {
  it('resolves relative path targets against the host cwd', () => {
    expect(anchorLocalTarget('./pkg')).toBe(join(process.cwd(), 'pkg'))
  })
})
