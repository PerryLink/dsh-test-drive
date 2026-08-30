/**
 * The full drive pipeline through the REAL tool runtime: scripted CLI stages
 * produce the structured result, the verdict rules fold the stages, cleanup
 * always runs (success, failure, timeout, keep-for-forensics), and no owned
 * temp directory survives.
 * @module dsh-test-drive/test/drive.spec
 */

import { readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { JobId } from '@deepseek-ai/dsh-jobs'
import type { ToolExecutionResult } from '@deepseek-ai/dsh-tools'
import { afterEach, describe, expect, it } from 'vitest'
import { FakeSubprocessRuntime, mountHarness, type Harness, type ScriptedSpawn } from './harness.ts'

/**
 * Brand a synthetic tool-call id without naming the host line's brand: the
 * published `0.1.1-rc.2` line exports `CallId` while host HEAD renamed it to
 * `ToolCallId` — deriving the type from `tools.execute` keeps both typecheck
 * rulers green.
 */
type ToolExecInput = Parameters<Harness['ctx']['tools']['execute']>[0]
const makeCallId = (id: string): ToolExecInput['callId'] => id as ToolExecInput['callId']

const MANIFEST = JSON.stringify({ name: 'dsh-profile-headless', private: true, dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', 'dsh-click'] } } })
const INSTALLED = JSON.stringify({ name: 'dsh-click', version: '0.2.0', dsh: { bundle: { patch: './cordis.patch.yml' } } })

/** The spawn script for a fully passing drive. */
const PASS_SCRIPTS: ScriptedSpawn[] = [
  { exitCode: 0, stdout: 'installed\n', write: { 'profiles/headless/package.json': MANIFEST, 'profiles/headless/node_modules/dsh-click/package.json': INSTALLED } },
  { exitCode: 0, stdout: '# == dsh-click\n- insert:\n    - id: click\n      name: dsh-click\n' },
  { exitCode: 0, stdout: 'ok' },
  { exitCode: 0, stdout: 'removed' },
  { exitCode: 0, stdout: '0.1.0-rc.6\n' },
]

async function callTool(harness: Harness, name: string, args: unknown, counter: { n: number }): Promise<ToolExecutionResult> {
  counter.n += 1
  return harness.ctx.tools.execute({
    callId: makeCallId(`drive-spec-${counter.n}`),
    name,
    arguments: args,
    agent: harness.agent,
    signal: new AbortController().signal,
  })
}

/** Temp-dir entries matching the plugin's owned prefixes. */
async function ownedLeftovers(): Promise<string[]> {
  const entries = await readdir(tmpdir())
  return entries.filter(name => name.startsWith('dsh-test-drive-'))
}

/**
 * Assert the temp dir drains of owned entries. Foreground drives clean up
 * before the tool returns; the poll only absorbs background stragglers from
 * other spec files (sequential execution keeps the window tiny).
 */
async function expectNoOwnedLeftovers(timeoutMs = 3_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  let leftovers = await ownedLeftovers()
  while (leftovers.length > 0 && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 50))
    leftovers = await ownedLeftovers()
  }
  expect(leftovers).toEqual([])
}

afterEach(async () => {
  // Harness teardown sweeps registered roots; this belt-and-braces pass
  // removes any forensics-kept leftover this suite itself created.
  for (const name of await ownedLeftovers()) {
    await rm(join(tmpdir(), name), { recursive: true, force: true, maxRetries: 3 }).catch(() => {})
  }
})

describe('test_drive through the real pipeline', () => {
  it('records a fully passing install→config→smoke→uninstall→cleanup run', async () => {
    const harness = await mountHarness({ scripts: PASS_SCRIPTS })
    const counter = { n: 0 }
    const result = await callTool(harness, 'test_drive', { target: 'github:owner/dsh-click#abc' }, counter)
    expect(result.isError).toBe(false)
    const value = result.value as Record<string, unknown>
    expect(value.schema).toBe('dsh-test-drive/v1')
    expect(value.verdict).toBe('pass')
    const stages = value.stages as Record<string, Record<string, unknown>>
    expect(stages.install?.status).toBe('pass')
    expect(stages.config?.status).toBe('pass')
    expect(stages.config?.patchEffective).toBe(true)
    expect(stages.config?.layers).toEqual(['dsh-click'])
    expect(stages.smoke?.status).toBe('pass')
    expect(stages.smoke?.taskCompleted).toBe(true)
    expect(stages.smoke?.bootFailed).toBe(false)
    expect(stages.uninstall?.status).toBe('pass')
    expect(stages.cleanup?.status).toBe('pass')
    const isolation = value.isolation as Record<string, unknown>
    expect(isolation.tempDshHome).toBe(true)
    expect(isolation.hostHomeTouched).toBe(false)
    const target = value.target as Record<string, unknown>
    expect(target.resolved).toEqual({ packageName: 'dsh-click', packageVersion: '0.2.0', hasBundleManifest: true })
    const run = value.run as Record<string, unknown>
    expect(run.harnessVersion).toBe('0.1.0-rc.6')
    await expectNoOwnedLeftovers()
  })

  it('fails hard on an install failure and still cleans up', async () => {
    const harness = await mountHarness({
      scripts: [
        { exitCode: 1, stderr: 'ERR_PNPM network error\n' },
        { exitCode: 0, stdout: '0.1.0-rc.6\n' },
      ],
    })
    const counter = { n: 0 }
    const result = await callTool(harness, 'test_drive', { target: 'dsh-missing' }, counter)
    expect(result.isError).toBe(false)
    const value = result.value as Record<string, unknown>
    expect(value.verdict).toBe('fail')
    const stages = value.stages as Record<string, Record<string, unknown>>
    expect(stages.install?.status).toBe('fail')
    expect(stages.config?.status).toBe('skipped')
    expect(stages.smoke?.status).toBe('skipped')
    expect(stages.uninstall?.status).toBe('skipped')
    expect(stages.cleanup?.status).toBe('pass')
    await expectNoOwnedLeftovers()
  })

  it('fails on loader-failure markers in the smoke output', async () => {
    const harness = await mountHarness({
      scripts: [
        { exitCode: 0, stdout: 'ok', write: { 'profiles/headless/package.json': MANIFEST, 'profiles/headless/node_modules/dsh-click/package.json': INSTALLED } },
        { exitCode: 0, stdout: '# == dsh-click\n' },
        { exitCode: 1, stderr: 'dsh: plugin(s) failed to load: dsh-click\n' },
        { exitCode: 0, stdout: 'removed' },
        { exitCode: 0, stdout: '0.1.0-rc.6\n' },
      ],
    })
    const counter = { n: 0 }
    const result = await callTool(harness, 'test_drive', { target: 'dsh-click' }, counter)
    const value = result.value as Record<string, unknown>
    expect(value.verdict).toBe('fail')
    const smoke = (value.stages as Record<string, Record<string, unknown>>).smoke
    expect(smoke?.status).toBe('fail')
    expect(smoke?.bootFailed).toBe(true)
  })

  it('records boot-ok when the boot is clean but the task is inconclusive', async () => {
    const harness = await mountHarness({
      scripts: [
        { exitCode: 0, stdout: 'ok', write: { 'profiles/headless/package.json': MANIFEST, 'profiles/headless/node_modules/dsh-click/package.json': INSTALLED } },
        { exitCode: 0, stdout: '# == dsh-click\n' },
        { exitCode: 1, stderr: 'model unavailable: no credentials\n' },
        { exitCode: 0, stdout: 'removed' },
        { exitCode: 0, stdout: '0.1.0-rc.6\n' },
      ],
    })
    const counter = { n: 0 }
    const result = await callTool(harness, 'test_drive', { target: 'dsh-click' }, counter)
    const value = result.value as Record<string, unknown>
    expect(value.verdict).toBe('pass')
    expect(String(value.verdictReason)).toContain('inconclusive')
    const smoke = (value.stages as Record<string, Record<string, unknown>>).smoke
    expect(smoke?.status).toBe('boot-ok')
  })

  it('records a timeout as a stage failure and terminates the tree', async () => {
    const harness = await mountHarness({
      config: { installTimeoutMs: 1_000 },
      scripts: [
        { hang: true },
        { exitCode: 0, stdout: '0.1.0-rc.6\n' },
      ],
    })
    const counter = { n: 0 }
    const result = await callTool(harness, 'test_drive', { target: 'dsh-slow' }, counter)
    const value = result.value as Record<string, unknown>
    const install = (value.stages as Record<string, Record<string, unknown>>).install
    expect(install?.status).toBe('fail')
    expect(String(install?.summary)).toContain('timed out')
    expect((harness.subprocess as FakeSubprocessRuntime).terminated).toContain(7777)
    await expectNoOwnedLeftovers()
  })

  it('keeps the temp root for forensics when configured', async () => {
    const harness = await mountHarness({ config: { keepTempDirs: true }, scripts: PASS_SCRIPTS })
    const counter = { n: 0 }
    const result = await callTool(harness, 'test_drive', { target: 'dsh-click' }, counter)
    const value = result.value as Record<string, unknown>
    const cleanup = (value.stages as Record<string, Record<string, unknown>>).cleanup
    expect(cleanup?.status).toBe('skipped')
    const leftovers = await ownedLeftovers()
    expect(leftovers.length).toBeGreaterThan(0)
    expect(leftovers.every(name => name.startsWith('dsh-test-drive-'))).toBe(true)
  })

  it('marks the verdict partial when the installed package has no bundle layer', async () => {
    const harness = await mountHarness({
      scripts: [
        { exitCode: 0, stdout: 'ok', write: { 'profiles/headless/package.json': JSON.stringify({ name: 'p', private: true, dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', 'plain-lib'] } } }), 'profiles/headless/node_modules/plain-lib/package.json': JSON.stringify({ name: 'plain-lib', version: '1.0.0' }) } },
        { exitCode: 0, stdout: '# == @deepseek-ai/dsh-base\n' },
        { exitCode: 0, stdout: 'ok' },
        { exitCode: 0, stdout: 'removed' },
        { exitCode: 0, stdout: '0.1.0-rc.6\n' },
      ],
    })
    const counter = { n: 0 }
    const result = await callTool(harness, 'test_drive', { target: 'plain-lib' }, counter)
    const value = result.value as Record<string, unknown>
    expect(value.verdict).toBe('partial')
    const config = (value.stages as Record<string, Record<string, unknown>>).config
    expect(config?.patchEffective).toBe(false)
  })

  it('degrades to working tools when storageDomain is not mounted (headless base)', async () => {
    const harness = await mountHarness({ storage: false, scripts: PASS_SCRIPTS })
    const counter = { n: 0 }
    const result = await callTool(harness, 'test_drive', { target: 'dsh-click' }, counter)
    expect(result.isError).toBe(false)
    expect((result.value as Record<string, unknown>).verdict).toBe('pass')
    // Reports are unavailable: drive_report must fail honestly.
    const report = await callTool(harness, 'drive_report', {}, counter)
    expect(report.isError).toBe(true)
  })

  it('rejects an empty target as a tool error', async () => {
    const harness = await mountHarness({ scripts: [] })
    const counter = { n: 0 }
    const result = await callTool(harness, 'test_drive', { target: '   ' }, counter)
    expect(result.isError).toBe(true)
  })

  it('starts a background job instead of waiting when background is set', async () => {
    const harness = await mountHarness({ scripts: PASS_SCRIPTS })
    const counter = { n: 0 }
    const result = await callTool(harness, 'test_drive', { target: 'dsh-click', background: true }, counter)
    expect(result.isError).toBe(false)
    const value = result.value as Record<string, unknown>
    expect(value.kind).toBe('background')
    expect(String(value.jobId)).toMatch(/^drive-batch-/)
    const snapshot = await harness.ctx.jobs.wait(JobId(String(value.jobId)), 10_000, harness.agent)
    expect(snapshot.status).toBe('completed')
    expect(String(snapshot.detail)).toContain('1 pass')
  })
})
