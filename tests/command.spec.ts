/**
 * `/testdrive` parsing and the command handler: target splitting, batch-cap
 * enforcement, and the real jobs registry start behind the command.
 * @module dsh-test-drive/test/command.spec
 */

import { readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { JobId } from '@deepseek-ai/dsh-jobs'
import { CommandId } from '@deepseek-ai/dsh-commands'
import type { CommandInvocation } from '@deepseek-ai/dsh-commands'
import { afterEach, describe, expect, it } from 'vitest'
import { handleTestdrive, parseTargets } from '../src/command.ts'
import type { BatchDeps } from '../src/batch.ts'
import { DshDriver } from '../src/driver.ts'
import { resolveConfig } from '../src/config.ts'
import type { Config } from '../src/config.ts'
import { driveDomainSpec } from '../src/domain.ts'
import { TempWorkspaceRegistry } from '../src/workspace.ts'
import { FAKE_DSH_BIN, mountHarness, type Harness, type ScriptedSpawn } from './harness.ts'

async function ownedLeftovers(): Promise<string[]> {
  return (await readdir(tmpdir())).filter(name => name.startsWith('dsh-test-drive-'))
}

/** Wait for a batch's background pipeline to finish its cleanup. */
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

const MANIFEST = JSON.stringify({ name: 'p', private: true, dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', 'dsh-click'] } } })
const INSTALLED = JSON.stringify({ name: 'dsh-click', version: '0.2.0', dsh: { bundle: { patch: './cordis.patch.yml' } } })

const PASS_SCRIPTS: ScriptedSpawn[] = [
  { exitCode: 0, stdout: 'ok', write: { 'profiles/headless/package.json': MANIFEST, 'profiles/headless/node_modules/dsh-click/package.json': INSTALLED } },
  { exitCode: 0, stdout: '# == dsh-click\n' },
  { exitCode: 0, stdout: 'ok' },
  { exitCode: 0, stdout: 'removed' },
  { exitCode: 0, stdout: '0.1.0-rc.6\n' },
]

function invocation(rawInput: string, harness: Harness): CommandInvocation {
  return {
    commandId: CommandId('cmd-test'),
    agent: harness.agent,
    rawInput,
    // rc.8 CommandInvocation gains the durable attachments field; this plugin's
    // handler never consumes images, so fixtures pass the frozen empty list.
    attachments: [],
    signal: new AbortController().signal,
  }
}

describe('parseTargets', () => {
  it('splits on whitespace and commas', () => {
    expect(parseTargets('  a, b  c\t d\ne ')).toEqual(['a', 'b', 'c', 'd', 'e'])
  })
  it('returns an empty list for blank input', () => {
    expect(parseTargets('   , ')).toEqual([])
  })
})

describe('handleTestdrive', () => {
  it('rejects an empty target list', async () => {
    const harness = await mountHarness({ plugin: false })
    const result = handleTestdrive(batchDeps(harness), invocation('   ', harness))
    expect(result.kind).toBe('error')
    expect(result.text).toContain('Usage')
  })

  it('rejects a batch over the configured cap', async () => {
    const harness = await mountHarness({ plugin: false })
    const result = handleTestdrive(batchDeps(harness, { maxBatchTargets: 2 }), invocation('a b c', harness))
    expect(result.kind).toBe('error')
    expect(result.text).toContain('cap')
  })

  it('starts a drive-batch job that settles into a matrix', async () => {
    const harness = await mountHarness({ plugin: false, scripts: PASS_SCRIPTS })
    const deps = batchDeps(harness)
    const result = handleTestdrive(deps, invocation('dsh-click', harness))
    expect(result.kind).toBe('success')
    const jobId = JobId((result as { text: string }).text.match(/drive-batch-\d+/u)?.[0] ?? '')
    const snapshot = await harness.ctx.jobs.wait(jobId, 10_000, harness.agent)
    expect(snapshot.status).toBe('completed')
    expect(String(snapshot.detail)).toContain('1 pass')
    const domain = await deps.domain()
    const matrices = [...domain.table('matrices').entries()]
    expect(matrices).toHaveLength(1)
    expect(matrices[0]?.[1].totals.pass).toBe(1)
  })
})

/** Build the batch deps the command handler needs from a plugin-less harness. */
function batchDeps(harness: Harness, overrides: Config = {}): BatchDeps {
  const config = resolveConfig({ dshBin: FAKE_DSH_BIN, ...overrides })
  const log = (): void => {}
  const driver = new DshDriver({ ctx: harness.ctx, config, log })
  const temp = new TempWorkspaceRegistry(log)
  const domain = (async () => harness.ctx.storageDomain.open(driveDomainSpec))()
  return { ctx: harness.ctx, config, driver, temp, log, domain: () => domain }
}
