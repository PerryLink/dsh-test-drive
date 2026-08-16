/**
 * The `/testdrive` slash command: parse a whitespace/comma-separated target
 * list from the command input and start one `drive-batch` background job over
 * `ctx.jobs`. The command itself never runs the drives — the job owns the
 * work, the progress stream, and the final matrix.
 *
 * @module dsh-test-drive/command
 */

import type { CommandInvocation, CommandResult } from '@deepseek-ai/dsh-commands'
import type { BatchDeps } from './batch.ts'
import { startBatchJob } from './batch.ts'

/** Split raw command input into target specs (whitespace and commas separate). */
export function parseTargets(rawInput: string): string[] {
  return rawInput
    .split(/[\s,]+/u)
    .map(token => token.trim())
    .filter(token => token.length > 0)
}

/**
 * Execute `/testdrive <targets...>`: validate the target list against the
 * configured batch cap and start the batch job for the invoking agent.
 *
 * @param deps - batch dependencies.
 * @param invocation - the command invocation.
 * @returns the command result naming the started job.
 */
export function handleTestdrive(deps: BatchDeps, invocation: CommandInvocation): CommandResult {
  const targets = parseTargets(invocation.rawInput)
  if (targets.length === 0) {
    return { kind: 'error', text: 'Usage: /testdrive <target> [<target> ...] — one or more plugin repos, npm packages, paths, or tarballs' }
  }
  if (targets.length > deps.config.maxBatchTargets) {
    return { kind: 'error', text: `Too many targets: ${targets.length} exceeds the configured batch cap of ${deps.config.maxBatchTargets}` }
  }
  const jobId = startBatchJob(deps, targets, invocation.agent, `/testdrive ${targets.join(' ')}`)
  return {
    kind: 'success',
    text: `Started background batch job ${String(jobId)} for ${targets.length} target(s). Progress streams through the job output; the final line names the matrix id for drive_report.`,
  }
}
