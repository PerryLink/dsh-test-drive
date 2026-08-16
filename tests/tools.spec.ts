/**
 * Tool surface through the REAL registry: registration, canonical output
 * values, render content, `drive_report` reads (run id, matrix id, latest
 * matrix), and honest errors for unknown ids.
 * @module dsh-test-drive/test/tools.spec
 */

import { JobId } from '@deepseek-ai/dsh-jobs'
import { CallId } from '@deepseek-ai/dsh-llm'
import type { ToolExecutionResult } from '@deepseek-ai/dsh-tools'
import { describe, expect, it } from 'vitest'
import { mountHarness, type Harness, type ScriptedSpawn } from './harness.ts'

const MANIFEST = JSON.stringify({ name: 'p', private: true, dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', 'dsh-click'] } } })
const INSTALLED = JSON.stringify({ name: 'dsh-click', version: '0.2.0', dsh: { bundle: { patch: './cordis.patch.yml' } } })

const PASS_SCRIPTS: ScriptedSpawn[] = [
  { exitCode: 0, stdout: 'ok', write: { 'profiles/headless/package.json': MANIFEST, 'profiles/headless/node_modules/dsh-click/package.json': INSTALLED } },
  { exitCode: 0, stdout: '# == dsh-click\n' },
  { exitCode: 0, stdout: 'ok' },
  { exitCode: 0, stdout: 'removed' },
  { exitCode: 0, stdout: '0.1.0-rc.6\n' },
]

let callCounter = 0

async function callTool(harness: Harness, name: string, args: unknown): Promise<ToolExecutionResult> {
  callCounter += 1
  return harness.ctx.tools.execute({
    callId: CallId(`tools-spec-${callCounter}`),
    name,
    arguments: args,
    agent: harness.agent,
    signal: new AbortController().signal,
  })
}

describe('registration', () => {
  it('registers test_drive and drive_report', async () => {
    const harness = await mountHarness()
    expect(harness.ctx.tools.get('test_drive')).toBeDefined()
    expect(harness.ctx.tools.get('drive_report')).toBeDefined()
  })
})

describe('test_drive render', () => {
  it('renders the structured result as Markdown', async () => {
    const harness = await mountHarness({ scripts: PASS_SCRIPTS })
    const result = await callTool(harness, 'test_drive', { target: 'dsh-click' })
    expect(result.isError).toBe(false)
    const text = result.content.map(block => ('text' in block ? block.text : '')).join('')
    expect(text).toContain('# Test drive')
    expect(text).toContain('| install |')
  })
})

describe('drive_report', () => {
  it('returns a stored run by id', async () => {
    const harness = await mountHarness({ scripts: PASS_SCRIPTS })
    const drive = await callTool(harness, 'test_drive', { target: 'dsh-click' })
    const runId = (drive.value as Record<string, unknown>).run as Record<string, unknown>
    const report = await callTool(harness, 'drive_report', { id: runId.runId })
    expect(report.isError).toBe(false)
    const value = report.value as Record<string, unknown>
    expect(value.schema).toBe('dsh-test-drive/v1')
    expect((value.run as Record<string, unknown>).runId).toBe(runId.runId)
  })

  it('returns the latest matrix with no id after a batch job', async () => {
    const harness = await mountHarness({ scripts: PASS_SCRIPTS })
    const background = await callTool(harness, 'test_drive', { target: 'dsh-click', background: true })
    const jobId = String((background.value as Record<string, unknown>).jobId)
    await harness.ctx.jobs.wait(JobId(jobId), 10_000, harness.agent)
    const report = await callTool(harness, 'drive_report', {})
    expect(report.isError).toBe(false)
    const value = report.value as Record<string, unknown>
    expect(value.id).toMatch(/^tdm_/)
    const totals = value.totals as Record<string, unknown>
    expect(totals.pass).toBe(1)
    const text = report.content.map(block => ('text' in block ? block.text : '')).join('')
    expect(text).toContain('# Test drive matrix')
  })

  it('returns a matrix by id', async () => {
    const harness = await mountHarness({ scripts: PASS_SCRIPTS })
    const background = await callTool(harness, 'test_drive', { target: 'dsh-click', background: true })
    const jobId = String((background.value as Record<string, unknown>).jobId)
    await harness.ctx.jobs.wait(JobId(jobId), 10_000, harness.agent)
    const latest = await callTool(harness, 'drive_report', {})
    const matrixId = (latest.value as Record<string, unknown>).id
    const byId = await callTool(harness, 'drive_report', { id: matrixId })
    expect(byId.isError).toBe(false)
    expect((byId.value as Record<string, unknown>).id).toBe(matrixId)
  })

  it('fails honestly for unknown and malformed ids', async () => {
    const harness = await mountHarness({ scripts: [] })
    const unknown = await callTool(harness, 'drive_report', { id: 'tdr_nope' })
    expect(unknown.isError).toBe(true)
    const malformed = await callTool(harness, 'drive_report', { id: 'whatever' })
    expect(malformed.isError).toBe(true)
  })

  it('fails honestly when no matrix exists yet', async () => {
    const harness = await mountHarness({ scripts: [] })
    const empty = await callTool(harness, 'drive_report', {})
    expect(empty.isError).toBe(true)
  })
})
