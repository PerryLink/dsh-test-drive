/**
 * Real Loader composition (C3): the plugin itself mounted through a cordis.yml
 * with real service rows and no storageDomain — the registry contributions,
 * the /testdrive help behavior, and the optional-dependency degradation are
 * asserted in an independent process. The e2e suite covers the full real
 * profile loop; this pins the plugin's own composition path.
 * @module dsh-test-drive/tests/composition.spec
 */

import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { beforeAll, afterAll, describe, expect, it } from 'vitest'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const runner = join(repositoryRoot, 'scripts', 'loader-runner.mjs')
const entry = join(repositoryRoot, 'lib', 'index.js')

let temporaryRoot = ''

beforeAll(() => {
  const build = spawnSync('pnpm', ['run', 'build'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    timeout: 300_000,
  })
  if (build.status !== 0) {
    throw new Error(`build failed:\n${build.stdout}\n${build.stderr}`)
  }
  temporaryRoot = mkdtempSync(join(tmpdir(), 'dsh-test-drive-loader-'))
}, 360_000)

afterAll(() => {
  rmSync(temporaryRoot, { recursive: true, force: true })
})

function configFor(pluginRow: string): string {
  return [
    "- name: '@deepseek-ai/dsh-session'",
    "- name: '@deepseek-ai/dsh-system-prompt'",
    "- name: '@deepseek-ai/dsh-tools'",
    "- name: '@deepseek-ai/dsh-commands'",
    "- name: '@deepseek-ai/dsh-subprocess-local'",
    "- name: '@deepseek-ai/dsh-jobs-local'",
    `- name: ${JSON.stringify(pluginRow)}`,
    '',
  ].join('\n')
}

describe('real Loader composition of dsh-test-drive', () => {
  it('mounts tools and the /testdrive command without a storageDomain row', () => {
    const configPath = join(temporaryRoot, 'composition.yml')
    writeFileSync(configPath, configFor(pathToFileURL(entry).href))
    const result = spawnSync(process.execPath, [runner, configPath], {
      cwd: repositoryRoot,
      encoding: 'utf8',
      env: { ...process.env },
      timeout: 120_000,
    })
    expect(result.status, `stdout:\n${result.stdout}\nstderr:\n${result.stderr}`).toBe(0)
    const marker = result.stdout.match(/DSH_LOADER_RESULT (.+)$/mu)
    expect(marker).not.toBeNull()
    const summary = JSON.parse(marker?.[1] ?? '{}')
    expect(summary.tools).toEqual(['test_drive', 'drive_report'])
    expect(summary.command).toBe('testdrive')
    expect(summary.storageDomainAbsent).toBe(true)
  })
})
