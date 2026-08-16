/**
 * The batch producer over the REAL jobs registry: serial drives stream
 * progress through `readOutput`, settlement writes the matrix and the latest
 * pointer, and the completion notice carries the tallies.
 * @module dsh-test-drive/test/batch.spec
 */

import { readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { JobId } from '@deepseek-ai/dsh-jobs'
import { afterEach, describe, expect, it } from 'vitest'
import { matrixSummary, runBatch, startBatchJob } from '../src/batch.ts'
import type { BatchDeps } from '../src/batch.ts'
import { DshDriver } from '../src/driver.ts'
import { resolveConfig } from '../src/config.ts'
import { driveDomainSpec } from '../src/domain.ts'
import { TempWorkspaceRegistry } from '../src/workspace.ts'
import { FAKE_DSH_BIN, mountHarness, type Harness, type ScriptedSpawn } from './harness.ts'

async function ownedLeftovers(): Promise<string[]> {
  return (await readdir(tmpdir())).filter(name => name.startsWith('dsh-test-drive-'))
}

/** Wait for a cancelled batch's background pipeline to finish its cleanup. */
async function drainLeftovers(timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if ((await ownedLeftovers()).length === 0) return
    await new Promise(resolve => setTimeout(resolve, 50))
  }
}

afterEach(async () => {
  await drainLeftovers(5_000)
  for (const name of await ownedLeftovers()) {
    await rm(join(tmpdir(), name), { recursive: true, force: true, maxRetries: 3 }).catch(() => {})
  }
})

const MANIFEST_A = JSON.stringify({ name: 'p', private: true, dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', 'dsh-a'] } } })
const INSTALLED_A = JSON.stringify({ name: 'dsh-a', version: '1.0.0', dsh: { bundle: { patch: './cordis.patch.yml' } } })

/** Two targets: one passes, one fails to install. */
const MIXED_SCRIPTS: ScriptedSpawn[] = [
  { exitCode: 0, stdout: 'ok', write: { 'profiles/headless/package.json': MANIFEST_A, 'profiles/headless/node_modules/dsh-a/package.json': INSTALLED_A } },
  { exitCode: 0, stdout: '# == dsh-a\n' },
  { exitCode: 0, stdout: 'ok' },
  { exitCode: 0, stdout: 'removed' },
  { exitCode: 0, stdout: '0.1.0-rc.6\n' },
  { exitCode: 1, stderr: 'ERR_PNPM network error\n' },
  { exitCode: 0, stdout: '0.1.0-rc.6\n' },
]

function batchDeps(harness: Harness): BatchDeps {
  const config = resolveConfig({ dshBin: FAKE_DSH_BIN })
  const log = (): void => {}
  const driver = new DshDriver({ ctx: harness.ctx, config, log })
  const temp = new TempWorkspaceRegistry(log)
  const domain = (async () => harness.ctx.storageDomain.open(driveDomainSpec))()
  return { ctx: harness.ctx, config, driver, temp, log, domain: () => domain }
}

describe('runBatch', () => {
  it('drives every target and writes the matrix with tallies', async () => {
    const harness = await mountHarness({ plugin: false, scripts: MIXED_SCRIPTS })
    const deps = batchDeps(harness)
    const progress: string[] = []
    const settled = await runBatch(deps, ['dsh-a', 'dsh-b'], new AbortController().signal, line => { progress.push(line) })
    expect(settled.matrix.rows).toHaveLength(2)
    expect(settled.matrix.rows[0]?.verdict).toBe('pass')
    expect(settled.matrix.rows[1]?.verdict).toBe('fail')
    expect(settled.matrix.totals).toEqual({ total: 2, pass: 1, fail: 1, partial: 0, unknown: 0 })
    expect(progress.join('\n')).toContain('[1/2]')
    const domain = await deps.domain()
    expect(domain.table('matrices').get(settled.matrixId)).toBeDefined()
    expect(domain.global.get().matrixId).toBe(settled.matrixId)
    expect(matrixSummary(settled.matrix)).toContain('1 pass, 1 fail')
  })
})

describe('startBatchJob through the real registry', () => {
  it('streams progress, settles completed, and names the matrix', async () => {
    const harness = await mountHarness({ plugin: false, scripts: MIXED_SCRIPTS })
    const deps = batchDeps(harness)
    const jobId = startBatchJob(deps, ['dsh-a', 'dsh-b'], harness.agent, '/testdrive dsh-a dsh-b')
    expect(jobId).toMatch(/drive-batch-\d+/u)
    const snapshot = await harness.ctx.jobs.wait(JobId(String(jobId)), 10_000, harness.agent)
    expect(snapshot.status).toBe('completed')
    expect(String(snapshot.detail)).toContain('1 pass, 1 fail')
    const output = harness.ctx.jobs.read(JobId(String(jobId)), harness.agent)
    expect(output.text).toContain('matrix tdm_')
    expect(output.text).toContain('drive_report')
  })

  it('kills cleanly when cancelled', async () => {
    const harness = await mountHarness({ plugin: false, scripts: [{ hang: true }] })
    const deps = batchDeps(harness)
    const jobId = startBatchJob(deps, ['dsh-a', 'dsh-b'], harness.agent, 'batch')
    const kill = harness.ctx.jobs.kill(JobId(String(jobId)), harness.agent, 'test cancel')
    expect(kill).toBe('requested')
    const snapshot = await harness.ctx.jobs.wait(JobId(String(jobId)), 10_000, harness.agent)
    expect(snapshot.status).toBe('killed')
  })
})
