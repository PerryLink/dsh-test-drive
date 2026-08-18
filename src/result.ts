/**
 * The structured test-drive result: one record per driven target, plus the
 * batch matrix that aggregates them. This is the machine-readable output
 * contract that downstream consumers (dsh-score and other scoring pipelines)
 * read from the `test-drive` storage domain — every field a scorer needs
 * (install/smoke status, durations, failure summaries) is a first-class
 * field, never prose to be parsed.
 *
 * The zod schemas are the single source of truth for both the domain record
 * types (validated at the durable boundary by `dsh-storage-domain`) and the
 * TypeScript record types (`z.infer`), so the written records and the typed
 * runtime can never drift.
 *
 * @module dsh-test-drive/result
 */

import { z } from 'zod'

import { CapabilityKindSchema, CapabilityStatusSchema } from './capability.ts'

/** Schema discriminator of every record this plugin writes (version 1). */
export const RESULT_SCHEMA = 'dsh-test-drive/v1' as const

/** How the target was addressed. */
export const TargetKindSchema = z.union([z.literal('repo'), z.literal('npm'), z.literal('path'), z.literal('tarball')])
export type TargetKind = z.infer<typeof TargetKindSchema>

/** Outcome of an ordinary stage: it ran and passed, ran and failed, or was skipped by config. */
export const StageStatusSchema = z.union([z.literal('pass'), z.literal('fail'), z.literal('skipped')])
export type StageStatus = z.infer<typeof StageStatusSchema>

/** Boot-smoke outcome: clean boot plus completed task, failed boot, clean boot with an inconclusive task, or skipped. */
export const SmokeStatusSchema = z.union([z.literal('pass'), z.literal('fail'), z.literal('boot-ok'), z.literal('skipped')])
export type SmokeStatus = z.infer<typeof SmokeStatusSchema>

/** Overall verdict of one drive run. */
export const DriveVerdictSchema = z.union([z.literal('pass'), z.literal('fail'), z.literal('partial'), z.literal('unknown')])
export type DriveVerdict = z.infer<typeof DriveVerdictSchema>

/** Shared stage facts: exit, duration, attempts, and sanitized summary/tail. */
export const StageResultSchema = z.object({
  /** How the stage ended. */
  status: StageStatusSchema,
  /** Process exit code; null when the stage never produced a process outcome (timeout or spawn failure). */
  exitCode: z.number().int().nullable(),
  /** Wall-clock duration of the stage in milliseconds. */
  durationMs: z.number().finite(),
  /** Spawn attempts (the allowBuilds retry is attempt 2). */
  attempts: z.number().int().min(1),
  /** One-line sanitized verdict, e.g. `exit 0 after allowBuilds allowance`. */
  summary: z.string(),
  /** Sanitized output tail (secrets and temp paths redacted). */
  outputTail: z.string(),
})
export type StageResult = z.infer<typeof StageResultSchema>

/** Install stage extras: whether the pnpm allowBuilds gate was hit and allowed. */
export const InstallStageResultSchema = StageResultSchema.extend({
  /** True when pnpm blocked a git prepare build and the retry allowlisted it. */
  allowBuildsNeeded: z.boolean(),
})
export type InstallStageResult = z.infer<typeof InstallStageResultSchema>

/** Config-dump stage extras: whether the bundle patch provably took effect. */
export const ConfigStageResultSchema = StageResultSchema.extend({
  /** True when the dump contains the installed package as a layer or a row. */
  patchEffective: z.boolean(),
  /** Sanitized layer labels in the dump that mention the package. */
  layers: z.array(z.string()),
})
export type ConfigStageResult = z.infer<typeof ConfigStageResultSchema>

/** Boot-smoke stage: loader-failure facts plus the optional task completion. */
export const SmokeStageResultSchema = StageResultSchema.extend({
  /** `pass`/`fail`/`boot-ok`/`skipped`, see {@link SmokeStatus}. */
  status: SmokeStatusSchema,
  /** True when loader-failure markers (FAILED / failed to load / did not activate) appeared. */
  bootFailed: z.boolean(),
  /** True when the headless one-shot task reported completion (exit 0). */
  taskCompleted: z.boolean(),
})
export type SmokeStageResult = z.infer<typeof SmokeStageResultSchema>

/** Uninstall stage result. */
export const UninstallStageResultSchema = StageResultSchema
export type UninstallStageResult = z.infer<typeof UninstallStageResultSchema>

/** Capability-assertion stage: one named tool or command, registered → invoked → observed. */
export const CapabilityStageResultSchema = StageResultSchema.extend({
  /** `observed`/`invoked`/`not-registered`/`skipped`/`failed`. */
  status: CapabilityStatusSchema,
  /** What was asserted (tool or command); null when the stage never ran. */
  capabilityKind: CapabilityKindSchema.nullable(),
  /** The asserted tool or command name; '' when the stage never ran. */
  name: z.string(),
  /** Whether the expectation literal was found in the observed output. */
  expectMatched: z.boolean(),
  /** One-line sanitized explanation of the reached status. */
  detail: z.string(),
})
export type CapabilityStageResult = z.infer<typeof CapabilityStageResultSchema>

/** Re-export of the capability status union for stage renderers. */
export type CapabilityStatus = z.infer<typeof CapabilityStatusSchema>

/** Cleanup stage: quarantine/removal facts for the temp directory this run owned. */
export const CleanupStageResultSchema = z.object({
  /** `pass` when the owned temp root was removed; `skipped` when keepTempDirs was set. */
  status: z.union([z.literal('pass'), z.literal('fail'), z.literal('skipped')]),
  /** True when the root was renamed into the owned quarantine directory first. */
  quarantined: z.boolean(),
  /** True when the quarantined root was fully removed from disk. */
  removed: z.boolean(),
  /** One-line sanitized summary (dry-run plan on failure). */
  summary: z.string(),
})
export type CleanupStageResult = z.infer<typeof CleanupStageResultSchema>

/** Facts about the runner that produced the record. */
export const RunMetaSchema = z.object({
  /** Unique id of this drive run (also the `runs` table key). */
  runId: z.string().min(1),
  /** ISO-8601 start timestamp. */
  startedAt: z.string().min(1),
  /** ISO-8601 finish timestamp. */
  finishedAt: z.string().min(1),
  /** Total wall-clock duration in milliseconds. */
  durationMs: z.number().finite(),
  /** `dsh --version` of the CLI that ran the stages ('' when unknown). */
  harnessVersion: z.string(),
  /** dsh-test-drive's own version. */
  pluginVersion: z.string().min(1),
  /** Runner platform (`process.platform`). */
  platform: z.string().min(1),
  /** Runner Node version (`process.version`). */
  node: z.string().min(1),
})
export type RunMeta = z.infer<typeof RunMetaSchema>

/** What was driven, and what the install revealed about it. */
export const DriveTargetSchema = z.object({
  /** Address kind, see {@link TargetKind}. */
  kind: TargetKindSchema,
  /** Sanitized target spec exactly as passed to `dsh plugin add`. */
  spec: z.string().min(1),
  /** Install-revealed package facts; absent when the install never materialized the package. */
  resolved: z.object({
    /** Installed package name (authoritative: read from the profile manifest). */
    packageName: z.string().min(1),
    /** Installed package version. */
    packageVersion: z.string().min(1),
    /** Whether the package declares `dsh.bundle.patch` (a bundle layer exists). */
    hasBundleManifest: z.boolean(),
  }).optional(),
})
export type DriveTarget = z.infer<typeof DriveTargetSchema>

/** Isolation facts asserted by construction: every path the child touched was inside the owned temp root. */
export const IsolationFactsSchema = z.object({
  /** The child processes used a throwaway DSH_HOME inside the owned temp root. */
  tempDshHome: z.boolean(),
  /** The child cwd was a throwaway workspace inside the owned temp root. */
  tempWorkspace: z.boolean(),
  /** The pnpm store was redirected inside the owned temp root. */
  tempStore: z.boolean(),
  /** Host home untouched — always true: no code path reads or writes the real profile home. */
  hostHomeTouched: z.literal(false),
})
export type IsolationFacts = z.infer<typeof IsolationFactsSchema>

/** One drive run: install → dump-config → boot smoke → uninstall → cleanup. */
export const DriveResultSchema = z.object({
  /** Discriminator {@link RESULT_SCHEMA}. */
  schema: z.literal(RESULT_SCHEMA),
  /** Runner facts. */
  run: RunMetaSchema,
  /** Target facts. */
  target: DriveTargetSchema,
  /** Isolation facts. */
  isolation: IsolationFactsSchema,
  /** Stage outcomes in execution order. */
  stages: z.object({
    install: InstallStageResultSchema,
    config: ConfigStageResultSchema,
    smoke: SmokeStageResultSchema,
    /**
     * Optional capability-assertion stage (added after v1 records existed;
     * optional so pre-capability records still validate at the durable
     * boundary — no domain-version bump for a backward-compatible addition).
     */
    capability: CapabilityStageResultSchema.optional(),
    uninstall: UninstallStageResultSchema,
    cleanup: CleanupStageResultSchema,
  }),
  /** Overall verdict derived from the stages by {@link verdictOf}. */
  verdict: DriveVerdictSchema,
  /** One-line sanitized explanation of the verdict. */
  verdictReason: z.string().min(1),
})
export type DriveResult = z.infer<typeof DriveResultSchema>

/** One row of a batch matrix: the per-target verdict plus the fields a matrix table needs. */
export const MatrixRowSchema = z.object({
  /** Sanitized target spec. */
  target: z.string().min(1),
  /** Address kind. */
  kind: TargetKindSchema,
  /** Per-target verdict. */
  verdict: DriveVerdictSchema,
  /** Install stage status. */
  install: StageStatusSchema,
  /** Smoke stage status. */
  smoke: SmokeStatusSchema,
  /** Per-target wall-clock duration in milliseconds. */
  durationMs: z.number().finite(),
  /** One-line sanitized summary (the target's verdict reason). */
  summary: z.string(),
})
export type MatrixRow = z.infer<typeof MatrixRowSchema>

/** Aggregated batch record keyed by the batch id. */
export const MatrixRecordSchema = z.object({
  /** Discriminator {@link RESULT_SCHEMA}. */
  schema: z.literal(RESULT_SCHEMA),
  /** Matrix id — named by the producing batch job's final output line. */
  id: z.string().min(1),
  /** ISO-8601 creation timestamp. */
  createdAt: z.string().min(1),
  /** Total wall-clock duration of the batch in milliseconds. */
  durationMs: z.number().finite(),
  /** Per-target rows in drive order. */
  rows: z.array(MatrixRowSchema),
  /** Verdict tallies over `rows`. */
  totals: z.object({
    total: z.number().int().min(0),
    pass: z.number().int().min(0),
    fail: z.number().int().min(0),
    partial: z.number().int().min(0),
    unknown: z.number().int().min(0),
  }),
})
export type MatrixRecord = z.infer<typeof MatrixRecordSchema>

/** Compile the tallies for one matrix record. */
export function totalsOf(rows: readonly MatrixRow[]): MatrixRecord['totals'] {
  const totals = { total: rows.length, pass: 0, fail: 0, partial: 0, unknown: 0 }
  for (const row of rows) {
    switch (row.verdict) {
      case 'pass': totals.pass += 1; break
      case 'fail': totals.fail += 1; break
      case 'partial': totals.partial += 1; break
      default: totals.unknown += 1; break
    }
  }
  return totals
}

/**
 * Derive the overall verdict of one drive run from its stage outcomes.
 *
 * Rules, in order:
 * 1. A failed install, a failed boot (`smoke.fail`), or a capability stage
 *    that reached `not-registered`/`failed` is a hard `fail`.
 * 2. `pass` needs install pass + patch effective + a clean boot (`pass` or
 *    `boot-ok`) + a successful uninstall.
 * 3. `partial` covers everything that installed but missed a later assurance
 *    (patch not visible, smoke skipped by config, uninstall failed).
 * 4. `unknown` is the honest answer when nothing decisive ran.
 *
 * @param result - the complete drive result.
 * @returns `[verdict, reason]`.
 */
export function verdictOf(result: DriveResult): [verdict: DriveVerdict, reason: string] {
  const { install, config, smoke, uninstall, capability } = result.stages
  if (install.status === 'fail') return ['fail', `install failed: ${install.summary}`]
  if (smoke.status === 'fail') return ['fail', `boot smoke failed: ${smoke.summary}`]
  if (capability !== undefined && (capability.status === 'not-registered' || capability.status === 'failed')) {
    return ['fail', `capability assertion failed (${capability.name}): ${capability.detail}`]
  }
  if (install.status === 'pass' && config.status === 'pass' && config.patchEffective
    && (smoke.status === 'pass' || smoke.status === 'boot-ok') && uninstall.status === 'pass') {
    const capabilityNote = capability !== undefined && capability.status === 'observed'
      ? `; capability "${capability.name}" registered, invoked, and observed`
      : ''
    if (smoke.status === 'boot-ok') return ['pass', `install, patch, boot, and uninstall verified${capabilityNote}; headless task inconclusive (see smoke.summary)`]
    return ['pass', `install, patch, boot, task, and uninstall all verified${capabilityNote}`]
  }
  if (install.status !== 'pass') return ['unknown', 'install never ran to completion']
  if (config.status !== 'pass' || !config.patchEffective) {
    return ['partial', `install passed but the bundle patch was not verified (${config.summary})`]
  }
  if (smoke.status === 'skipped') return ['partial', 'install passed but the boot smoke was skipped by config']
  if (uninstall.status !== 'pass') return ['partial', `install and smoke passed but uninstall failed (${uninstall.summary})`]
  return ['unknown', 'stage combination not covered by the verdict rules']
}
