/**
 * The `drive-batch` background-job producer over `ctx.jobs`. One job drives a
 * list of targets (serially or with bounded concurrency), streams per-target
 * progress lines through `readOutput`, and on settlement writes the matrix
 * record (JSON) into the storage domain and the latest-matrix pointer, so
 * `drive_report` can fetch the Markdown/JSON pair by id.
 *
 * @module dsh-test-drive/batch
 */

import type { Agent } from '@deepseek-ai/dsh-agent'
import type { Context } from '@deepseek-ai/cordis'
import type { JobHooks, JobId, JobKind, JobOutcome } from '@deepseek-ai/dsh-jobs'
import type { DriveDeps } from './drive.ts'
import { DriveRunner, MATRIX_ID_PREFIX, freshId, progressLine } from './drive.ts'
import { RESULT_SCHEMA, totalsOf } from './result.ts'
import type { MatrixRecord, MatrixRow } from './result.ts'
import { sanitizeTarget } from './sanitize.ts'

/** The job kind this producer registers (declaration-merged into JobKindMap). */
export const DRIVE_BATCH_KIND = 'drive-batch' as const

declare module '@deepseek-ai/dsh-jobs' {
  interface JobKindMap {
    'drive-batch': typeof DRIVE_BATCH_KIND
  }
}

/** Everything one batch job needs; assembled by `src/index.ts`. */
export interface BatchDeps extends DriveDeps {
  /** The jobs registry (public service). */
  ctx: Context
}

/** Settled matrix-write facts (tests assert the pointer landed). */
export interface BatchSettlement {
  /** The matrix id written into the domain (also named in the job output). */
  matrixId: string
  /** The final matrix record. */
  matrix: MatrixRecord
}

/** The batch work function shared by the job producer and direct tests. */
export async function runBatch(
  deps: BatchDeps,
  targets: readonly string[],
  signal: AbortSignal,
  onProgress: (line: string) => void,
): Promise<BatchSettlement> {
  const { config, log } = deps
  const runner = new DriveRunner(deps)
  const matrixId = freshId(MATRIX_ID_PREFIX)
  const startedMs = Date.now()
  const rows: MatrixRow[] = []
  const queue = [...targets]

  async function worker(): Promise<void> {
    for (;;) {
      if (signal.aborted) return
      const target = queue.shift()
      if (target === undefined) return
      const result = await runner.drive(target, { signal })
      rows.push({
        target: result.target.spec,
        kind: result.target.kind,
        verdict: result.verdict,
        install: result.stages.install.status,
        smoke: result.stages.smoke.status,
        durationMs: result.run.durationMs,
        summary: result.verdictReason,
      })
      onProgress(progressLine(rows.length, targets.length, result))
    }
  }

  const workers = Array.from({ length: config.batchConcurrency }, () => worker())
  await Promise.all(workers)

  const matrix: MatrixRecord = {
    schema: RESULT_SCHEMA,
    id: matrixId,
    createdAt: new Date().toISOString(),
    durationMs: Date.now() - startedMs,
    rows,
    totals: totalsOf(rows),
  }
  try {
    const domain = await deps.domain()
    await domain.table('matrices').put(matrixId, matrix)
    await domain.global.set({ matrixId, createdAt: matrix.createdAt })
  } catch (error) {
    log(`test-drive: failed to persist matrix ${matrixId}: ${String(error)}`)
  }
  return { matrixId, matrix }
}

/** One-line settlement summary for notices and the final flush. */
export function matrixSummary(matrix: MatrixRecord): string {
  const { totals } = matrix
  return `matrix ${matrix.id}: ${totals.pass} pass, ${totals.fail} fail, ${totals.partial} partial, ${totals.unknown} unknown (of ${totals.total})`
}

/**
 * Start one `drive-batch` background job. The returned id doubles as the
 * handle the model uses to read output and, via the final flush line, to find
 * the matrix record for `drive_report`.
 *
 * @param deps - batch dependencies.
 * @param targets - sanitized target specs.
 * @param owner - the owning agent (from the command invocation).
 * @param label - one-line model-facing label.
 * @returns the registry-issued job id.
 */
export function startBatchJob(deps: BatchDeps, targets: readonly string[], owner: Agent, label: string): JobId {
  const sanitized = targets.map(sanitizeTarget).filter(spec => spec.length > 0)
  const kind: JobKind = DRIVE_BATCH_KIND
  return deps.ctx.jobs.start({
    kind,
    label,
    owner,
    run: (): JobHooks => {
      const abort = new AbortController()
      const progress: string[] = []
      const done = Promise.withResolvers<JobOutcome>()
      let settled = false
      const settle = (outcome: JobOutcome): JobOutcome => {
        if (settled) return outcome
        settled = true
        progress.push(`${outcome.status === 'completed' ? 'batch finished' : 'batch stopped'}: ${outcome.detail ?? ''}`)
        done.resolve(outcome)
        return outcome
      }
      void runBatch(deps, sanitized, abort.signal, line => { progress.push(line) })
        .then(({ matrixId, matrix }) => {
          progress.push(`matrix ${matrixId} — fetch with drive_report("${matrixId}")`)
          settle({ status: 'completed', detail: matrixSummary(matrix) })
        })
        .catch((error: unknown) => {
          deps.log(`test-drive: batch job failed: ${String(error)}`)
          settle({ status: 'failed', detail: tailDetail(String(error)) })
        })
      return {
        cancel(reason?: string): void {
          abort.abort(reason ?? 'cancelled')
          progress.push(`cancelling (${reason ?? 'no reason given'})`)
          settle({ status: 'killed', detail: `cancelled: ${reason ?? 'no reason given'}` })
        },
        done: done.promise,
        readOutput: (): string => {
          if (progress.length === 0) return ''
          return `${progress.splice(0, progress.length).join('\n')}\n`
        },
      }
    },
  })
}

/** Bound an error message for job detail lines. */
function tailDetail(text: string): string {
  const clean = text.replace(/\s+/gu, ' ').trim()
  return clean.length <= 200 ? clean : `${clean.slice(0, 197)}…`
}
