/**
 * `dsh-test-drive` — isolated install-and-smoke test drives for DeepSeek
 * Harness plugins.
 *
 * Host-only function plugin — no default export (the Loader unwraps
 * `exports.default ?? exports`). It drives one target at a time through a
 * throwaway profile: `dsh plugin add` → `--dump-config` patch check →
 * headless boot smoke (FAILED-marker scan) → `dsh plugin remove` → owned
 * quarantine cleanup. Results land as structured records (JSON) in the
 * `test-drive` storage domain, render as Markdown, and feed scoring
 * pipelines; batches run as `drive-batch` background jobs over `ctx.jobs`.
 *
 * @module dsh-test-drive
 */

import type { Context } from '@deepseek-ai/cordis'
import type { CommandInvocation } from '@deepseek-ai/dsh-commands'
import type {} from '@deepseek-ai/dsh-tools'
import type { Domain } from '@deepseek-ai/dsh-storage-domain'
import type { BatchDeps } from './batch.ts'
import { handleTestdrive } from './command.ts'
import { Config, resolveConfig } from './config.ts'
import { driveDomainSpec } from './domain.ts'
import { DriveRunner } from './drive.ts'
import { DshDriver } from './driver.ts'
import { allTools } from './tools.ts'
import type { ToolServices } from './tools.ts'
import { TempWorkspaceRegistry } from './workspace.ts'

export const name = 'dsh-test-drive'

/**
 * Public services only. `storageDomain` is deliberately OPTIONAL: the shipped
 * `dsh-base` bundle (headless profile) does not mount it, and the plugin must
 * still boot there — report persistence degrades to disabled with a logged
 * reason, tools keep working.
 */
export const inject = ['tools', 'commands', 'subprocess', 'jobs']

export { VERSION } from './version.ts'
export { Config, resolveConfig } from './config.ts'
export { RESULT_SCHEMA, verdictOf, DriveResultSchema, MatrixRecordSchema, totalsOf } from './result.ts'
export type { DriveResult, MatrixRecord, MatrixRow, StageStatus, SmokeStatus, DriveVerdict, TargetKind, StageResult } from './result.ts'
export { sanitizeTarget, sanitizeOutput, redactSecrets, tailText, redactTempPath, REDACTED } from './sanitize.ts'
export { TempWorkspaceRegistry, OWNED_PREFIX, QUARANTINE_PREFIX, removeWithRetries } from './workspace.ts'
export type { TempWorkspace, CleanupOutcome } from './workspace.ts'
export { DshDriver, classifyTarget, parseNpmShim, parseDumpLayers, dumpMentionsPackage, hasBootFailure, isGitLike, parseIgnoredBuildScript, TEMPLATE_BUNDLES, BOOT_FAILURE_MARKERS, anchorLocalTarget } from './driver.ts'
export type { ChildRunResult, InstalledPackage } from './driver.ts'
export { DriveRunner, freshId, progressLine, RUN_ID_PREFIX, MATRIX_ID_PREFIX } from './drive.ts'
export type { DriveDeps, DriveOptions } from './drive.ts'
export { DRIVE_BATCH_KIND, startBatchJob, runBatch, matrixSummary } from './batch.ts'
export { renderDriveResult, renderMatrix, statusMark, formatDuration } from './report.ts'
export { parseTargets } from './command.ts'
export { driveDomainSpec, DOMAIN_NAME, DOMAIN_VERSION } from './domain.ts'

/**
 * Mount the plugin: resolve config, open the report domain (lazily), register
 * the tools and the `/testdrive` command as effects, and own every temp
 * directory through the quarantine registry (teardown sweeps leftovers).
 *
 * @param ctx - context carrying tools/commands/subprocess/jobs/storageDomain.
 * @param config - raw loader config; defaults applied through {@link resolveConfig}.
 */
export function apply(ctx: Context, config: Config): void {
  const resolved = resolveConfig(config)
  const log = (line: string): void => { ctx.logger('test-drive').info(line) }

  const temp = new TempWorkspaceRegistry(log)
  ctx.effect(() => () => {
    void temp.disposeAll().catch((error: unknown) => log(`teardown cleanup failed: ${String(error)}`))
  }, 'dsh-test-drive temp registry teardown')

  // Single-flight domain open; failures surface at first use (the earliest
  // resolvable point for an async open) and are logged once.
  const storageDomain = ctx.get('storageDomain')
  const domainPromise: Promise<Domain<typeof driveDomainSpec>> = storageDomain === undefined
    ? Promise.reject(new Error('dsh-test-drive: storageDomain service not mounted in this composition; reports disabled'))
    : (async () => storageDomain.open(driveDomainSpec))()
  domainPromise.catch((error: unknown) => { log(`report domain unavailable: ${String(error)}`) })
  const domain = (): typeof domainPromise => domainPromise
  ctx.effect(() => () => {
    void domainPromise.then(handle => handle.close()).catch(() => { /* open failure has nothing to close */ })
  }, 'dsh-test-drive report domain close')

  const driver = new DshDriver({ ctx, config: resolved, log })
  const deps: BatchDeps = { ctx, config: resolved, driver, temp, log, domain }
  const runner = new DriveRunner(deps)
  const services: ToolServices = { ...deps, runner }

  for (const tool of allTools(services)) {
    ctx.effect(() => ctx.tools.register(tool), `dsh-test-drive: ${tool.name} tool`)
  }

  ctx.effect(() => ctx.commands.register({
    name: 'testdrive',
    description: 'Batch test-drive plugin targets in isolated throwaway profiles (background job + matrix report)',
    input: { hint: 'repo or npm targets, space-separated' },
    handler: (invocation: CommandInvocation) => handleTestdrive(services, invocation),
  }), 'dsh-test-drive: /testdrive command')

  // Warm the dsh location once at load: a missing CLI then fails the first
  // drive immediately instead of mid-pipeline.
  void driver.locate().catch((error: unknown) => { log(`dsh CLI unavailable: ${String(error)}`) })
}
