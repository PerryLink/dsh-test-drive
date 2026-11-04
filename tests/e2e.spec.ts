/**
 * REAL end-to-end test drive: mounts the plugin over the REAL local
 * subprocess provider (no scripted CLI), points `test_drive` at THIS package's
 * checkout, and asserts the full install → dump → smoke → uninstall → cleanup
 * loop against the real `dsh` CLI and pnpm. Requires network (profile pnpm
 * install) and a usable `dsh` on PATH — gated behind `DSH_TESTDRIVE_E2E=1`,
 * run locally for evidence; CI runs the scripted suites instead.
 * @module dsh-test-drive/test/e2e.spec
 */

import { readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { mountHarness, type Harness } from './harness.ts'
import { VERSION } from '../src/version.ts'

/**
 * Brand a synthetic tool-call id without naming the host line's brand: the
 * published lines export `CallId`/`ToolCallId` under different names —
 * deriving the type from `tools.execute`'s batch input keeps both typecheck
 * rulers green.
 */
type ToolCallInput = Parameters<Harness['ctx']['tools']['execute']>[0]['calls'][number]
const makeCallId = (id: string): ToolCallInput['id'] => id as ToolCallInput['id']

/**
 * Execute one tool call through the 0.2.2 batch runtime: the runtime takes a
 * raw `ToolCallBlock` batch and settles one correlated result per call;
 * arguments travel as the model's JSON string.
 */
async function callTool(harness: Harness, id: string, name: string, args: unknown) {
  const batch = await harness.ctx.tools.execute({
    calls: [{ type: 'tool-call', id: makeCallId(id), name, arguments: JSON.stringify(args) }],
    agent: harness.agent,
    signal: new AbortController().signal,
  })
  const settled = batch.results[0]
  if (settled === undefined) throw new Error(`tool batch settled no result for ${name}`)
  return settled.result
}

const e2e = process.env.DSH_TESTDRIVE_E2E === '1' ? describe : describe.skip

async function ownedLeftovers(): Promise<string[]> {
  const entries = await readdir(tmpdir())
  return entries.filter(name => name.startsWith('dsh-test-drive-'))
}

// Belt-and-braces: an aborted e2e run must not leak owned temp dirs.
afterAll(async () => {
  for (const name of await ownedLeftovers()) {
    await rm(join(tmpdir(), name), { recursive: true, force: true, maxRetries: 3 }).catch(() => {})
  }
})

e2e('real CLI', () => {
  it('drives this package checkout through install → dump → smoke → uninstall → cleanup', async () => {
    const harness: Harness = await mountHarness({
      localSubprocess: true,
      config: { headlessTask: 'Reply with exactly: ok' },
    })
    const repoRoot = join(import.meta.dirname, '..')
    const result = await callTool(harness, 'e2e-drive', 'test_drive', { target: repoRoot })
    expect(result.isError).toBe(false)
    const value = result.value as Record<string, unknown>
    expect(value.schema).toBe('dsh-test-drive/v1')
    const stages = value.stages as Record<string, Record<string, unknown>>
    // The real install of this checkout: pnpm in the throwaway profile installs
    // it (with its build deps), the bundle patch must show in the dump, the
    // headless boot has no loader failures (no credentials → boot-ok), remove
    // succeeds, cleanup leaves nothing behind.
    expect(stages.install?.status).toBe('pass')
    expect(stages.config?.status).toBe('pass')
    expect(stages.config?.patchEffective).toBe(true)
    expect(stages.smoke?.status === 'pass' || stages.smoke?.status === 'boot-ok').toBe(true)
    expect(stages.smoke?.bootFailed).toBe(false)
    expect(stages.uninstall?.status).toBe('pass')
    expect(stages.cleanup?.status).toBe('pass')
    expect(value.verdict).toBe('pass')
    const target = value.target as Record<string, unknown>
    expect((target.resolved as Record<string, unknown>).packageName).toBe('dsh-test-drive')
    expect((target.resolved as Record<string, unknown>).hasBundleManifest).toBe(true)
    const run = value.run as Record<string, unknown>
    expect(run.harnessVersion).toBe('0.1.2-alpha.3')
    // The producer version lives in src/version.ts (lockstep with
    // package.json via scripts/release.mjs); hardcoding it here broke when
    // the package moved 0.1.0 → 0.2.0.
    expect(run.pluginVersion).toBe(VERSION)
    expect(await ownedLeftovers()).toEqual([])
  }, 900_000)

  it('leaves nothing behind after a failed install target', async () => {
    const harness: Harness = await mountHarness({ localSubprocess: true })
    const result = await callTool(harness, 'e2e-drive-fail', 'test_drive', { target: 'dsh-package-that-cannot-exist-4f2c9e1' })
    expect(result.isError).toBe(false)
    const value = result.value as Record<string, unknown>
    expect(value.verdict).toBe('fail')
    const cleanup = (value.stages as Record<string, Record<string, unknown>>).cleanup
    expect(cleanup?.status).toBe('pass')
    expect(await ownedLeftovers()).toEqual([])
  }, 900_000)
})
