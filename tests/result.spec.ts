/**
 * Verdict rules and record-schema round-trips: every verdict combination a
 * scorer depends on is derived from the stages, and every durable record
 * validates against its zod schema (the dsh-score input contract).
 * @module dsh-test-drive/test/result.spec
 */

import { describe, expect, it } from 'vitest'
import { DriveResultSchema, MatrixRecordSchema, RESULT_SCHEMA, totalsOf, verdictOf } from '../src/result.ts'
import type { DriveResult } from '../src/result.ts'

/** A pass-shaped stage result; override pieces per scenario. */
function passResult(overrides: Partial<DriveResult> = {}): DriveResult {
  const stage = { status: 'pass' as const, exitCode: 0, durationMs: 1_000, attempts: 1, summary: 'ok (exit 0)', outputTail: '' }
  const result: DriveResult = {
    schema: RESULT_SCHEMA,
    run: {
      runId: 'tdr_test', startedAt: '2026-08-16T00:00:00.000Z', finishedAt: '2026-08-16T00:00:01.000Z',
      durationMs: 1_000, harnessVersion: '0.1.0-rc.6', pluginVersion: '0.1.0', platform: 'test', node: 'v22',
    },
    target: { kind: 'repo', spec: 'github:owner/repo' },
    isolation: { tempDshHome: true, tempWorkspace: true, tempStore: true, hostHomeTouched: false },
    stages: {
      install: { ...stage, allowBuildsNeeded: false },
      config: { ...stage, patchEffective: true, layers: ['dsh-x'] },
      smoke: { ...stage, bootFailed: false, taskCompleted: true },
      uninstall: { ...stage },
      cleanup: { status: 'pass', quarantined: true, removed: true, summary: 'removed' },
    },
    verdict: 'pass',
    verdictReason: 'install, patch, boot, task, and uninstall all verified',
  }
  return { ...result, ...overrides }
}

describe('verdictOf', () => {
  it('passes a fully verified run', () => {
    expect(verdictOf(passResult())[0]).toBe('pass')
  })

  it('passes a clean boot with an inconclusive task (boot-ok)', () => {
    const result = passResult()
    result.stages.smoke = { ...result.stages.smoke, status: 'boot-ok', exitCode: 1, taskCompleted: false, summary: 'no credentials' }
    const [verdict, reason] = verdictOf(result)
    expect(verdict).toBe('pass')
    expect(reason).toContain('inconclusive')
  })

  it('fails hard on install failure', () => {
    const result = passResult()
    result.stages.install = { ...result.stages.install, status: 'fail', exitCode: 1, summary: 'exit 1: pnpm failed' }
    const [verdict, reason] = verdictOf(result)
    expect(verdict).toBe('fail')
    expect(reason).toContain('install failed')
  })

  it('fails hard on a failed boot smoke', () => {
    const result = passResult()
    result.stages.smoke = { ...result.stages.smoke, status: 'fail', bootFailed: true, summary: 'boot failure markers found' }
    expect(verdictOf(result)[0]).toBe('fail')
  })

  it('partial when the patch was not effective', () => {
    const result = passResult()
    result.stages.config = { ...result.stages.config, patchEffective: false, summary: 'no layer mentions the package' }
    expect(verdictOf(result)[0]).toBe('partial')
  })

  it('partial when smoke is skipped by config', () => {
    const result = passResult()
    result.stages.smoke = { ...result.stages.smoke, status: 'skipped', exitCode: null, taskCompleted: false }
    expect(verdictOf(result)[0]).toBe('partial')
  })

  it('partial when uninstall failed', () => {
    const result = passResult()
    result.stages.uninstall = { ...result.stages.uninstall, status: 'fail', exitCode: 1 }
    expect(verdictOf(result)[0]).toBe('partial')
  })

  it('unknown when install never ran to completion', () => {
    const result = passResult()
    result.stages.install = { ...result.stages.install, status: 'skipped' }
    expect(verdictOf(result)[0]).toBe('unknown')
  })
})

describe('totalsOf', () => {
  it('tallies every verdict', () => {
    const totals = totalsOf([
      { target: 'a', kind: 'repo', verdict: 'pass', install: 'pass', smoke: 'pass', durationMs: 1, summary: '' },
      { target: 'b', kind: 'npm', verdict: 'fail', install: 'fail', smoke: 'skipped', durationMs: 1, summary: '' },
      { target: 'c', kind: 'path', verdict: 'partial', install: 'pass', smoke: 'skipped', durationMs: 1, summary: '' },
      { target: 'd', kind: 'tarball', verdict: 'unknown', install: 'skipped', smoke: 'skipped', durationMs: 1, summary: '' },
    ])
    expect(totals).toEqual({ total: 4, pass: 1, fail: 1, partial: 1, unknown: 1 })
  })
})

describe('durable record schemas', () => {
  it('accepts a pass-shaped drive result', () => {
    expect(DriveResultSchema.parse(passResult()).verdict).toBe('pass')
  })

  it('rejects a result with a wrong schema discriminator', () => {
    const wrong = { ...passResult(), schema: 'other/v1' }
    expect(() => DriveResultSchema.parse(wrong)).toThrow()
  })

  it('rejects a result whose hostHomeTouched is not false', () => {
    const wrong = passResult({ isolation: { tempDshHome: true, tempWorkspace: true, tempStore: true, hostHomeTouched: true as false } })
    expect(() => DriveResultSchema.parse(wrong)).toThrow()
  })

  it('accepts a matrix record', () => {
    const matrix = {
      schema: RESULT_SCHEMA,
      id: 'tdm_1',
      createdAt: '2026-08-16T00:00:00.000Z',
      durationMs: 10,
      rows: [],
      totals: { total: 0, pass: 0, fail: 0, partial: 0, unknown: 0 },
    }
    expect(MatrixRecordSchema.parse(matrix).id).toBe('tdm_1')
  })

  it('rejects a matrix with an unknown verdict', () => {
    const matrix = {
      schema: RESULT_SCHEMA,
      id: 'tdm_1',
      createdAt: '2026-08-16T00:00:00.000Z',
      durationMs: 10,
      rows: [{ target: 'x', kind: 'repo', verdict: 'meh', install: 'pass', smoke: 'pass', durationMs: 1, summary: '' }],
      totals: { total: 1, pass: 0, fail: 0, partial: 0, unknown: 1 },
    }
    expect(() => MatrixRecordSchema.parse(matrix)).toThrow()
  })
})
