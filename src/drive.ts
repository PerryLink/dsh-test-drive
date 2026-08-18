/**
 * The single-target drive pipeline: create an owned temp workspace, run
 * install → dump-config → boot smoke → uninstall through the {@link DshDriver},
 * and ALWAYS finish with the quarantine cleanup ladder — also on abort and
 * unexpected pipeline errors (the `try/finally` discipline of §0.2). The
 * resulting {@link DriveResult} is the structured record downstream consumers
 * read.
 *
 * @module dsh-test-drive/drive
 */

import { randomBytes } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import type { Domain } from '@deepseek-ai/dsh-storage-domain'
import { analyzeSessionLog, buildCapabilityTask } from './capability.ts'
import type { CapabilitySpec } from './capability.ts'
import type { ResolvedConfig } from './config.ts'
import type { driveDomainSpec } from './domain.ts'
import { DshDriver, classifyTarget, dumpMentionsPackage, hasBootFailure, anchorLocalTarget } from './driver.ts'
import type { ChildRunResult } from './driver.ts'
import { RESULT_SCHEMA, verdictOf } from './result.ts'
import type {
  CapabilityStageResult,
  CleanupStageResult,
  ConfigStageResult,
  DriveResult,
  InstallStageResult,
  SmokeStageResult,
  StageStatus,
  UninstallStageResult,
} from './result.ts'
import { sanitizeOutput, sanitizeTarget, tailText } from './sanitize.ts'
import { VERSION } from './version.ts'
import { TempWorkspaceRegistry } from './workspace.ts'
import type { TempWorkspace } from './workspace.ts'

/** Cap on the session-log text the capability stage reads back. */
export const SESSION_READ_MAX_BYTES = 1024 * 1024

/** id prefix of a single drive run. */
export const RUN_ID_PREFIX = 'tdr_'

/** id prefix of a batch matrix. */
export const MATRIX_ID_PREFIX = 'tdm_'

/** Fresh unique id with one of the plugin's prefixes. */
export function freshId(prefix: typeof RUN_ID_PREFIX | typeof MATRIX_ID_PREFIX): string {
  return `${prefix}${randomBytes(12).toString('hex')}`
}

/** Everything the pipeline needs at runtime; assembled by `src/index.ts`. */
export interface DriveDeps {
  /** The mounting context (used for `ctx.subprocess`). */
  ctx: Context
  /** Resolved plugin config. */
  config: ResolvedConfig
  /** The CLI driver. */
  driver: DshDriver
  /** Owned temp workspace registry. */
  temp: TempWorkspaceRegistry
  /** Operator log sink. */
  log: (line: string) => void
  /** Lazily-opened report domain (single-flight). */
  domain: () => Promise<Domain<typeof driveDomainSpec>>
}

/** Per-drive overrides (tool args may tighten config for one run). */
export interface DriveOptions {
  /** Caller cancellation (tool signal or batch cancel). */
  signal?: AbortSignal | undefined
  /** Optional headless task override; empty string skips the smoke stage (config default when absent). */
  headlessTask?: string | undefined
  /** Optional capability assertion for this drive; overrides the config block entirely. */
  capability?: CapabilitySpec | undefined
}

/** Derive one line of batch progress from a settled result. */
export function progressLine(index: number, total: number, result: DriveResult): string {
  return `[${index}/${total}] ${result.target.spec} → ${result.verdict} (${result.verdictReason})`
}

/** Map one stage's process outcome to a plain stage record. */
function stageOf(
  run: ChildRunResult,
  tempRoot: string,
  outputTailBytes: number,
  okSummary: string,
): { status: StageStatus; exitCode: number | null; durationMs: number; attempts: number; summary: string; outputTail: string } {
  const outputTail = sanitizeOutput(`${run.stdout}\n${run.stderr}`, tempRoot, outputTailBytes)
  if (run.timedOut) {
    return { status: 'fail', exitCode: run.exitCode, durationMs: run.durationMs, attempts: 1, summary: `timed out after ${run.durationMs} ms`, outputTail }
  }
  if (run.exitCode === 0) {
    return { status: 'pass', exitCode: 0, durationMs: run.durationMs, attempts: 1, summary: okSummary, outputTail }
  }
  const firstLine = tailText(run.stderr || run.stdout, 160).split('\n')[0] ?? ''
  return {
    status: 'fail',
    exitCode: run.exitCode,
    durationMs: run.durationMs,
    attempts: 1,
    summary: `exit ${String(run.exitCode)}: ${firstLine || 'no output'}`,
    outputTail,
  }
}

/** Map the install stage, including the allowBuilds facts. */
function installStageOf(
  outcome: { run: ChildRunResult; attempts: number; allowBuildsNeeded: boolean },
  tempRoot: string,
  outputTailBytes: number,
): InstallStageResult {
  const base = stageOf(outcome.run, tempRoot, outputTailBytes,
    outcome.allowBuildsNeeded ? 'install ok after allowBuilds allowance' : 'install ok (exit 0)')
  return { ...base, attempts: outcome.attempts, allowBuildsNeeded: outcome.allowBuildsNeeded }
}

/** The not-reached record for every stage skipped after a pipeline error. */
const UNREACHED = { status: 'skipped' as const, exitCode: null, durationMs: 0, attempts: 0, outputTail: '', summary: 'not reached: earlier stage errored' }

/** A failed stage record for an unexpected pipeline error (no process facts). */
function erroredStage(summary: string): { status: StageStatus; exitCode: null; durationMs: number; attempts: number; summary: string; outputTail: string } {
  return { status: 'fail', exitCode: null, durationMs: 0, attempts: 1, summary: tailText(summary, 160), outputTail: '' }
}

/**
 * Drive one target through the complete install-smoke pipeline.
 *
 * @param target - raw target spec (repo, npm name, local path, tarball).
 * @param options - per-drive overrides.
 * @returns the structured result; never throws for expected stage failures.
 */
export class DriveRunner {
  private harnessVersion: Promise<string> | undefined

  constructor(private readonly deps: DriveDeps) {}

  /** Ask the CLI once per runner lifetime for its version. */
  private version(options: { home: string; cwd: string; storeDir: string; signal?: AbortSignal | undefined }): Promise<string> {
    this.harnessVersion ??= this.deps.driver.version({ ...options, timeoutMs: this.deps.config.configTimeoutMs }).catch(() => '')
    return this.harnessVersion
  }

  /** Persist one settled result; a failing medium is logged, never thrown. */
  private async record(result: DriveResult): Promise<void> {
    try {
      const domain = await this.deps.domain()
      await domain.table('runs').put(result.run.runId, result)
    } catch (error) {
      this.deps.log(`test-drive: failed to persist run ${result.run.runId}: ${String(error)}`)
    }
  }

  async drive(target: string, options: DriveOptions = {}): Promise<DriveResult> {
    const { config, driver, temp, log } = this.deps
    const startedAt = new Date()
    const startedMs = Date.now()
    const runId = freshId(RUN_ID_PREFIX)
    const spec = sanitizeTarget(target)
    if (spec.length === 0) throw new Error('dsh-test-drive: target must be a non-empty string')
    const kind = classifyTarget(spec)
    const addSpec = kind === 'path' ? anchorLocalTarget(spec) : spec

    const workspace: TempWorkspace = await temp.create(config.profileName)
    const base = { home: workspace.home, cwd: workspace.workspace, storeDir: workspace.store, signal: options.signal }

    let install: InstallStageResult = { ...UNREACHED, allowBuildsNeeded: false }
    let configStage: ConfigStageResult = { ...UNREACHED, patchEffective: false, layers: [] }
    let smoke: SmokeStageResult = { ...UNREACHED, bootFailed: false, taskCompleted: false }
    let capability: CapabilityStageResult = {
      status: 'skipped', exitCode: null, durationMs: 0, attempts: 0, outputTail: '',
      summary: 'not reached: earlier stage errored',
      capabilityKind: null, name: '', expectMatched: false, detail: 'not reached: earlier stage errored',
    }
    let uninstall: UninstallStageResult = { ...UNREACHED }
    let resolved: DriveResult['target']['resolved']
    let cleanup: CleanupStageResult = { status: 'fail', quarantined: false, removed: false, summary: 'cleanup not executed' }
    // Captured while the temp cwd still exists — the cleanup below deletes it.
    let harnessVersion = ''

    try {
      // install
      install = installStageOf(
        await driver.add(addSpec, { ...base, timeoutMs: config.installTimeoutMs }),
        workspace.root,
        config.outputTailBytes,
      )
      if (install.status === 'pass') {
        resolved = await driver.readInstalledPackage(workspace.profileDir).catch(() => undefined)
      }

      // config (dump)
      if (install.status === 'pass' && !(options.signal?.aborted ?? false)) {
        const dump = await driver.dumpConfig({ ...base, timeoutMs: config.configTimeoutMs })
        const stage = stageOf(dump, workspace.root, config.outputTailBytes, 'dump ok (exit 0)')
        const pkgName = resolved?.packageName ?? ''
        const mention = pkgName === '' ? { mentioned: false, layers: [] as string[] } : dumpMentionsPackage(`${dump.stdout}\n${dump.stderr}`, pkgName)
        configStage = { ...stage, patchEffective: mention.mentioned, layers: mention.layers }
      } else if (options.signal?.aborted ?? false) {
        configStage = { ...configStage, summary: 'run aborted before this stage' }
      } else {
        configStage = { ...configStage, summary: 'install did not pass' }
      }

      // smoke (boot + optional headless task)
      const task = options.headlessTask ?? config.headlessTask
      if (task === '') {
        smoke = { ...smoke, summary: 'boot smoke disabled by config (headlessTask is empty)' }
      } else if (install.status !== 'pass') {
        smoke = { ...smoke, summary: 'install did not pass' }
      } else if (options.signal?.aborted ?? false) {
        smoke = { ...smoke, summary: 'run aborted before this stage' }
      } else {
        const run = await driver.smokeTask(task, { ...base, timeoutMs: config.smokeTimeoutMs })
        const outputTail = sanitizeOutput(`${run.stdout}\n${run.stderr}`, workspace.root, config.outputTailBytes)
        const bootFailed = hasBootFailure(`${run.stdout}\n${run.stderr}`)
        if (run.timedOut) {
          smoke = { status: 'fail', exitCode: run.exitCode, durationMs: run.durationMs, attempts: 1, summary: `timed out after ${run.durationMs} ms`, outputTail, bootFailed: false, taskCompleted: false }
        } else if (bootFailed) {
          smoke = { status: 'fail', exitCode: run.exitCode, durationMs: run.durationMs, attempts: 1, summary: 'boot failure markers found (FAILED / failed to load / did not activate)', outputTail, bootFailed: true, taskCompleted: false }
        } else if (run.exitCode === 0) {
          smoke = { status: 'pass', exitCode: 0, durationMs: run.durationMs, attempts: 1, summary: 'booted cleanly and the headless task completed', outputTail, bootFailed: false, taskCompleted: true }
        } else {
          smoke = { status: 'boot-ok', exitCode: run.exitCode, durationMs: run.durationMs, attempts: 1, summary: 'booted without loader failures; headless task did not complete (credentials/model unreachable)', outputTail, bootFailed: false, taskCompleted: false }
        }
      }

      // capability assertion (registered → invoked → observed); needs a model,
      // so a missing credential skips instead of failing. Runs before uninstall
      // and before the cleanup deletes the throwaway home: the durable session
      // log is the observation surface.
      const capSpec: CapabilitySpec | undefined = options.capability
        ?? (config.capability.enabled
          ? { kind: config.capability.kind, name: config.capability.name, args: config.capability.args, expect: config.capability.expect }
          : undefined)
      if (capSpec === undefined) {
        capability = { ...capability, status: 'skipped', summary: 'capability assertion disabled (config.capability.enabled is false and no per-drive capability given)', detail: 'capability assertion disabled by config' }
      } else if (install.status !== 'pass') {
        capability = { ...capability, summary: 'install did not pass', detail: 'install did not pass' }
      } else if (smoke.status === 'fail') {
        capability = { ...capability, summary: 'boot smoke failed', detail: 'boot smoke failed before the capability stage' }
      } else if (options.signal?.aborted ?? false) {
        capability = { ...capability, summary: 'run aborted before this stage', detail: 'run aborted before this stage' }
      } else if (process.env.DEEPSEEK_API_KEY === undefined && !config.forwardEnv.includes('DEEPSEEK_API_KEY')) {
        capability = {
          ...capability,
          status: 'skipped',
          summary: 'DEEPSEEK_API_KEY not available — the capability task needs a model (set it on the host or list it in forwardEnv)',
          capabilityKind: capSpec.kind,
          name: capSpec.name,
          detail: 'no model credential available for the capability task',
        }
      } else {
        const run = await driver.smokeTask(buildCapabilityTask(capSpec), { ...base, timeoutMs: config.capabilityTimeoutMs })
        const outputTail = sanitizeOutput(`${run.stdout}\n${run.stderr}`, workspace.root, config.outputTailBytes)
        if (run.timedOut) {
          capability = {
            status: 'failed', exitCode: run.exitCode, durationMs: run.durationMs, attempts: 1,
            summary: `timed out after ${run.durationMs} ms`, outputTail,
            capabilityKind: capSpec.kind, name: capSpec.name, expectMatched: false,
            detail: 'capability task timed out',
          }
        } else if (run.exitCode !== 0) {
          const firstLine = tailText(run.stderr || run.stdout, 160).split('\n')[0] ?? ''
          capability = {
            status: 'failed', exitCode: run.exitCode, durationMs: run.durationMs, attempts: 1,
            summary: `exit ${String(run.exitCode)}: ${firstLine || 'no output'}`, outputTail,
            capabilityKind: capSpec.kind, name: capSpec.name, expectMatched: false,
            detail: 'capability task did not complete (model/credential failure)',
          }
        } else {
          const sessionLog = await driver.readNewestSession(workspace.home, SESSION_READ_MAX_BYTES)
          const analysis = analyzeSessionLog(sessionLog, capSpec)
          capability = {
            status: analysis.status, exitCode: 0, durationMs: run.durationMs, attempts: 1,
            summary: analysis.detail, outputTail,
            capabilityKind: capSpec.kind, name: capSpec.name, expectMatched: analysis.expectMatched,
            detail: analysis.detail,
          }
        }
      }

      // uninstall
      if (resolved?.packageName === undefined) {
        uninstall = { ...uninstall, summary: 'no installed package to remove' }
      } else {
        const remove = await driver.remove(resolved.packageName, { ...base, timeoutMs: config.uninstallTimeoutMs })
        uninstall = stageOf(remove, workspace.root, config.outputTailBytes, 'remove ok (exit 0)')
      }

      // CLI version for the report — must run before the cleanup deletes the cwd.
      harnessVersion = await this.version(base).catch(() => '')
    } catch (error) {
      // Promote an unexpected pipeline error into the stage that was in flight:
      // install fails first, then config, smoke, and uninstall in order.
      const summary = `pipeline error: ${tailText(String(error), 160)}`
      if (install.status === 'skipped') install = { ...erroredStage(summary), allowBuildsNeeded: false }
      else if (configStage.status === 'skipped') configStage = { ...erroredStage(summary), patchEffective: false, layers: [] }
      else if (smoke.status === 'skipped') smoke = { ...erroredStage(summary), bootFailed: false, taskCompleted: false }
      else if (capability.status === 'skipped') capability = { ...erroredStage(summary), status: 'failed' as const, capabilityKind: null, name: '', expectMatched: false, detail: summary }
      else uninstall = { ...erroredStage(summary) }
      log(`test-drive: pipeline error for ${spec}: ${String(error)}`)
    } finally {
      // Cleanup ALWAYS runs — abort, stage failure, and pipeline error alike.
      try {
        cleanup = config.keepTempDirs ? temp.keep(workspace.root) : await temp.quarantineAndRemove(workspace.root)
      } catch (error) {
        log(`test-drive: cleanup ladder failed for ${workspace.root}: ${String(error)}`)
        cleanup = { status: 'fail', quarantined: false, removed: false, summary: `cleanup refused: ${tailText(String(error), 120)}` }
      }
    }

    const finishedAt = new Date()
    const result: DriveResult = {
      schema: RESULT_SCHEMA,
      run: {
        runId,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: Date.now() - startedMs,
        harnessVersion,
        pluginVersion: VERSION,
        platform: process.platform,
        node: process.version,
      },
      target: { kind, spec: addSpec, ...resolved === undefined ? {} : { resolved } },
      isolation: { tempDshHome: true, tempWorkspace: true, tempStore: true, hostHomeTouched: false },
      stages: { install, config: configStage, smoke, capability, uninstall, cleanup },
      verdict: 'unknown',
      verdictReason: '',
    }
    const [verdict, reason] = verdictOf(result)
    result.verdict = verdict
    result.verdictReason = reason
    await this.record(result)
    return result
  }
}
