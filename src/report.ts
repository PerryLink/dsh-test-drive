/**
 * Pure Markdown renderers for drive results and batch matrices. These are the
 * human-readable half of the report pair (JSON is the canonical record in the
 * storage domain); the renderers are pure functions of their inputs so they
 * stay replay-safe and trivially testable.
 *
 * @module dsh-test-drive/report
 */

import type { DriveResult, MatrixRecord, SmokeStatus, StageStatus, DriveVerdict } from './result.ts'

/** Emoji/symbol mark for a stage or verdict status. */
export function statusMark(status: StageStatus | SmokeStatus | DriveVerdict): string {
  switch (status) {
    case 'pass': return '✅'
    case 'fail': return '❌'
    case 'boot-ok': return '🟡'
    case 'partial': return '🟠'
    case 'skipped': return '⏭️'
    default: return '❓'
  }
}

/** Human-duration rendering for one number of milliseconds. */
export function formatDuration(ms: number): string {
  if (ms < 1_000) return `${ms} ms`
  return `${(ms / 1_000).toFixed(1)} s`
}

/** Render one drive result as a Markdown report block. */
export function renderDriveResult(result: DriveResult): string {
  const { run, target, stages, verdict, verdictReason } = result
  const lines = [
    `# Test drive ${run.runId}`,
    '',
    `- Target: \`${target.spec}\` (${target.kind})`,
    `- Verdict: ${statusMark(verdict)} ${verdict} — ${verdictReason}`,
    `- Duration: ${formatDuration(run.durationMs)} (harness ${run.harnessVersion || 'unknown'}, plugin ${run.pluginVersion})`,
    ...(target.resolved != null
      ? [`- Installed: ${target.resolved.packageName}@${target.resolved.packageVersion}${target.resolved.hasBundleManifest ? '' : ' (no dsh.bundle manifest)'}`]
      : []),
    `- Isolation: throwaway DSH_HOME + workspace + pnpm store; host profile untouched`,
    '',
    '| Stage | Result | Exit | Duration | Summary |',
    '|---|---|---|---|---|',
    `| install | ${statusMark(stages.install.status)} ${stages.install.status} | ${String(stages.install.exitCode)} | ${formatDuration(stages.install.durationMs)} | ${stages.install.summary} |`,
    `| config (--dump-config) | ${statusMark(stages.config.status)} ${stages.config.status} | ${String(stages.config.exitCode)} | ${formatDuration(stages.config.durationMs)} | ${stages.config.patchEffective ? `patch effective: ${stages.config.layers.join(', ')}` : stages.config.summary} |`,
    `| smoke (headless boot) | ${statusMark(stages.smoke.status)} ${stages.smoke.status} | ${String(stages.smoke.exitCode)} | ${formatDuration(stages.smoke.durationMs)} | ${stages.smoke.summary} |`,
    `| uninstall | ${statusMark(stages.uninstall.status)} ${stages.uninstall.status} | ${String(stages.uninstall.exitCode)} | ${formatDuration(stages.uninstall.durationMs)} | ${stages.uninstall.summary} |`,
    `| cleanup | ${statusMark(stages.cleanup.status)} ${stages.cleanup.status} | — | — | ${stages.cleanup.summary} |`,
    '',
  ]
  if (stages.install.status === 'fail' && stages.install.outputTail !== '') {
    lines.push('## Install output (tail, sanitized)', '', '```', stages.install.outputTail, '```', '')
  }
  if ((stages.smoke.status === 'fail' || stages.smoke.status === 'boot-ok') && stages.smoke.outputTail !== '') {
    lines.push('## Smoke output (tail, sanitized)', '', '```', stages.smoke.outputTail, '```', '')
  }
  return lines.join('\n')
}

/** Render one batch matrix as a Markdown report. */
export function renderMatrix(matrix: MatrixRecord): string {
  const lines = [
    `# Test drive matrix ${matrix.id}`,
    '',
    `- Created: ${matrix.createdAt}`,
    `- Duration: ${formatDuration(matrix.durationMs)}`,
    `- Totals: ${matrix.totals.pass} pass, ${matrix.totals.fail} fail, ${matrix.totals.partial} partial, ${matrix.totals.unknown} unknown (of ${matrix.totals.total})`,
    '',
    '| # | Target | Install | Smoke | Verdict | Duration | Summary |',
    '|---|---|---|---|---|---|---|',
  ]
  matrix.rows.forEach((row, index) => {
    lines.push(`| ${index + 1} | \`${row.target}\` | ${statusMark(row.install)} ${row.install} | ${statusMark(row.smoke)} ${row.smoke} | ${statusMark(row.verdict)} ${row.verdict} | ${formatDuration(row.durationMs)} | ${row.summary} |`)
  })
  const failures = matrix.rows.filter(row => row.verdict === 'fail' || row.verdict === 'partial')
  if (failures.length > 0) {
    lines.push('', '## Attention', '')
    for (const row of failures) {
      lines.push(`- ${statusMark(row.verdict)} \`${row.target}\`: ${row.summary}`)
    }
  }
  return lines.join('\n')
}
