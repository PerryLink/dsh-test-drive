/**
 * Markdown renderers: pure functions of their inputs, replay-safe, and
 * covering the stage table and failure sections.
 * @module dsh-test-drive/test/report.spec
 */

import { describe, expect, it } from 'vitest'
import { formatDuration, renderDriveJUnitXml, renderDriveResult, renderMatrix, renderMatrixJUnitXml, statusMark } from '../src/report.ts'
import { RESULT_SCHEMA } from '../src/result.ts'
import type { DriveResult, MatrixRecord } from '../src/result.ts'

function resultFixture(): DriveResult {
  return {
    schema: RESULT_SCHEMA,
    run: {
      runId: 'tdr_a1', startedAt: '2026-08-16T00:00:00.000Z', finishedAt: '2026-08-16T00:00:02.000Z',
      durationMs: 2_000, harnessVersion: '0.1.0-rc.6', pluginVersion: '0.1.0', platform: 'test', node: 'v22',
    },
    target: { kind: 'npm', spec: 'dsh-click', resolved: { packageName: 'dsh-click', packageVersion: '0.1.0', hasBundleManifest: true } },
    isolation: { tempDshHome: true, tempWorkspace: true, tempStore: true, hostHomeTouched: false },
    stages: {
      install: { status: 'pass', exitCode: 0, durationMs: 500, attempts: 1, summary: 'install ok (exit 0)', outputTail: '', allowBuildsNeeded: false },
      config: { status: 'pass', exitCode: 0, durationMs: 100, attempts: 1, summary: 'dump ok (exit 0)', outputTail: '', patchEffective: true, layers: ['dsh-click'] },
      smoke: { status: 'boot-ok', exitCode: 1, durationMs: 900, attempts: 1, summary: 'no credentials', outputTail: '', bootFailed: false, taskCompleted: false },
      uninstall: { status: 'pass', exitCode: 0, durationMs: 200, attempts: 1, summary: 'remove ok (exit 0)', outputTail: '' },
      cleanup: { status: 'pass', quarantined: true, removed: true, summary: 'owned temp root quarantined and removed' },
    },
    verdict: 'pass',
    verdictReason: 'install, patch, boot, and uninstall verified; headless task inconclusive (see smoke.summary)',
  }
}

describe('statusMark', () => {
  it('maps every status', () => {
    expect(statusMark('pass')).toBe('✅')
    expect(statusMark('fail')).toBe('❌')
    expect(statusMark('boot-ok')).toBe('🟡')
    expect(statusMark('partial')).toBe('🟠')
    expect(statusMark('skipped')).toBe('⏭️')
    expect(statusMark('unknown')).toBe('❓')
  })
})

describe('formatDuration', () => {
  it('renders sub-second and second-scale durations', () => {
    expect(formatDuration(500)).toBe('500 ms')
    expect(formatDuration(2_500)).toBe('2.5 s')
  })
})

describe('renderDriveResult', () => {
  it('renders the header, stage table, and verdict', () => {
    const text = renderDriveResult(resultFixture())
    expect(text).toContain('# Test drive tdr_a1')
    expect(text).toContain('| install | ✅ pass |')
    expect(text).toContain('patch effective: dsh-click')
    expect(text).toContain('host profile untouched')
  })

  it('renders install output tails on failure', () => {
    const result = resultFixture()
    result.stages.install = { ...result.stages.install, status: 'fail', exitCode: 1, outputTail: 'ERR boom' }
    const text = renderDriveResult(result)
    expect(text).toContain('## Install output')
    expect(text).toContain('ERR boom')
  })
})

describe('renderMatrix', () => {
  it('renders the row table and attention section', () => {
    const matrix: MatrixRecord = {
      schema: RESULT_SCHEMA,
      id: 'tdm_9',
      createdAt: '2026-08-16T00:00:00.000Z',
      durationMs: 10_000,
      rows: [
        { target: 'a', kind: 'repo', verdict: 'pass', install: 'pass', smoke: 'pass', durationMs: 100, summary: 'ok' },
        { target: 'b', kind: 'npm', verdict: 'fail', install: 'fail', smoke: 'skipped', durationMs: 200, summary: 'exit 1' },
      ],
      totals: { total: 2, pass: 1, fail: 1, partial: 0, unknown: 0 },
    }
    const text = renderMatrix(matrix)
    expect(text).toContain('# Test drive matrix tdm_9')
    expect(text).toContain('1 pass, 1 fail')
    expect(text).toContain('## Attention')
    expect(text).toContain('`b`: exit 1')
  })
})

describe('JUnit renderers', () => {
  it('renders a drive result as a testsuite with one testcase per stage', () => {
    const xml = renderDriveJUnitXml(resultFixture())
    expect(xml).toContain('<?xml version="1.0"')
    expect(xml).toContain('<testsuite')
    expect(xml).toContain('name="install"')
    expect(xml).toContain('name="smoke"')
    expect(xml).toContain('failures="0"')
  })

  it('renders a matrix as a testsuite with failing targets as failures', () => {
    const matrix: MatrixRecord = {
      schema: RESULT_SCHEMA,
      id: 'tdm_9',
      createdAt: '2026-08-16T00:00:00.000Z',
      durationMs: 10_000,
      rows: [
        { target: 'a', kind: 'repo', verdict: 'pass', install: 'pass', smoke: 'pass', durationMs: 100, summary: 'ok' },
        { target: 'b', kind: 'npm', verdict: 'fail', install: 'fail', smoke: 'skipped', durationMs: 200, summary: 'exit 1' },
      ],
      totals: { total: 2, pass: 1, fail: 1, partial: 0, unknown: 0 },
    }
    const xml = renderMatrixJUnitXml(matrix)
    expect(xml).toContain('tests="2"')
    expect(xml).toContain('failures="1"')
    expect(xml).toContain('name="b"')
    expect(xml).toContain('<failure message="exit 1"')
  })

  it('escapes XML special characters in targets and summaries', () => {
    const matrix: MatrixRecord = {
      schema: RESULT_SCHEMA,
      id: 'tdm_x',
      createdAt: '2026-08-16T00:00:00.000Z',
      durationMs: 1_000,
      rows: [
        { target: 'a<b>&"c"', kind: 'repo', verdict: 'fail', install: 'fail', smoke: 'skipped', durationMs: 100, summary: 'a<b' },
      ],
      totals: { total: 1, pass: 0, fail: 1, partial: 0, unknown: 0 },
    }
    const xml = renderMatrixJUnitXml(matrix)
    expect(xml).toContain('a&lt;b&gt;&amp;&quot;c&quot;')
    expect(xml).toContain('message="a&lt;b"')
    expect(xml).not.toContain('a<b>&"c"')
  })
})
