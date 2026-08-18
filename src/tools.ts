/**
 * The two model tools: `test_drive` (one target through the full pipeline,
 * optionally as a background job) and `drive_report` (fetch a stored run or
 * matrix record by id, or the latest matrix). Canonical outputs are the
 * structured records themselves; the renderers turn them into Markdown.
 *
 * @module dsh-test-drive/tools
 */

import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { Domain } from '@deepseek-ai/dsh-storage-domain'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { ToolRunContext } from '@deepseek-ai/dsh-tools'
import { startBatchJob } from './batch.ts'
import type { BatchDeps } from './batch.ts'
import { CAPABILITY_NAME_PATTERN, MAX_CAPABILITY_ARGS_LENGTH, MAX_CAPABILITY_EXPECT_LENGTH, MAX_CAPABILITY_NAME_LENGTH } from './capability.ts'
import type { CapabilityKind } from './capability.ts'
import { MAX_HEADLESS_TASK_LENGTH } from './config.ts'
import type { ResolvedConfig } from './config.ts'
import type { driveDomainSpec } from './domain.ts'
import { DriveRunner } from './drive.ts'
import type { DriveDeps } from './drive.ts'
import { renderDriveResult, renderMatrix } from './report.ts'
import { RESULT_SCHEMA } from './result.ts'
import type { DriveResult, MatrixRecord } from './result.ts'
import { sanitizeTarget } from './sanitize.ts'

/** Everything both tools need; assembled by `src/index.ts`. */
export interface ToolServices extends BatchDeps, DriveDeps {
  /** The mounting context. */
  ctx: Context
  /** Resolved plugin config. */
  config: ResolvedConfig
  /** Lazily-opened report domain. */
  domain: () => Promise<Domain<typeof driveDomainSpec>>
  /** The drive pipeline. */
  runner: DriveRunner
}

/** Shared JSON-schema fragment for one stage record inside the drive result. */
const stageRecordSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: { type: 'string' },
    exitCode: { oneOf: [{ type: 'integer' }, { type: 'null' }] },
    durationMs: { type: 'integer' },
    attempts: { type: 'integer' },
    summary: { type: 'string' },
    outputTail: { type: 'string' },
  },
} as const

/**
 * Full JSON-schema fragment for the drive-result branch of both tool outputs.
 * Explicit properties with `additionalProperties: false` — the compiled type
 * doubles as the compile-time assertion that the canonical `DriveResult`
 * value matches the declared tool contract.
 */
const driveResultSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    schema: { type: 'string', const: RESULT_SCHEMA },
    run: {
      type: 'object',
      additionalProperties: false,
      properties: {
        runId: { type: 'string' },
        startedAt: { type: 'string' },
        finishedAt: { type: 'string' },
        durationMs: { type: 'integer' },
        harnessVersion: { type: 'string' },
        pluginVersion: { type: 'string' },
        platform: { type: 'string' },
        node: { type: 'string' },
      },
    },
    target: {
      type: 'object',
      additionalProperties: false,
      properties: {
        kind: { type: 'string' },
        spec: { type: 'string' },
        resolved: {
          oneOf: [
            {
              type: 'object',
              additionalProperties: false,
              properties: {
                packageName: { type: 'string' },
                packageVersion: { type: 'string' },
                hasBundleManifest: { type: 'boolean' },
              },
            },
            { type: 'null' },
          ],
        },
      },
    },
    isolation: {
      type: 'object',
      additionalProperties: false,
      properties: {
        tempDshHome: { type: 'boolean' },
        tempWorkspace: { type: 'boolean' },
        tempStore: { type: 'boolean' },
        hostHomeTouched: { type: 'boolean', const: false },
      },
    },
    stages: {
      type: 'object',
      additionalProperties: false,
      properties: {
        install: {
          ...stageRecordSchema,
          properties: { ...stageRecordSchema.properties, allowBuildsNeeded: { type: 'boolean' } },
        },
        config: {
          ...stageRecordSchema,
          properties: {
            ...stageRecordSchema.properties,
            patchEffective: { type: 'boolean' },
            layers: { type: 'array', items: { type: 'string' } },
          },
        },
        smoke: {
          ...stageRecordSchema,
          properties: {
            ...stageRecordSchema.properties,
            bootFailed: { type: 'boolean' },
            taskCompleted: { type: 'boolean' },
          },
        },
        capability: {
          oneOf: [
            {
              ...stageRecordSchema,
              properties: {
                ...stageRecordSchema.properties,
                capabilityKind: { oneOf: [{ type: 'string', const: 'tool' }, { type: 'string', const: 'command' }, { type: 'null' }] },
                name: { type: 'string' },
                expectMatched: { type: 'boolean' },
                detail: { type: 'string' },
              },
            },
            { type: 'null' },
          ],
        },
        uninstall: stageRecordSchema,
        cleanup: {
          type: 'object',
          additionalProperties: false,
          properties: {
            status: { type: 'string' },
            quarantined: { type: 'boolean' },
            removed: { type: 'boolean' },
            summary: { type: 'string' },
          },
        },
      },
    },
    verdict: {
      oneOf: [
        { type: 'string', const: 'pass' },
        { type: 'string', const: 'fail' },
        { type: 'string', const: 'partial' },
        { type: 'string', const: 'unknown' },
      ],
    },
    verdictReason: { type: 'string' },
  },
} as const

/**
 * Full JSON-schema fragment for the matrix-report branch of `drive_report`.
 */
const matrixReportSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    schema: { type: 'string', const: RESULT_SCHEMA },
    id: { type: 'string' },
    createdAt: { type: 'string' },
    durationMs: { type: 'integer' },
    rows: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          target: { type: 'string' },
          kind: { type: 'string' },
          verdict: { type: 'string' },
          install: { type: 'string' },
          smoke: { type: 'string' },
          durationMs: { type: 'integer' },
          summary: { type: 'string' },
        },
      },
    },
    totals: {
      type: 'object',
      additionalProperties: false,
      properties: {
        total: { type: 'integer' },
        pass: { type: 'integer' },
        fail: { type: 'integer' },
        partial: { type: 'integer' },
        unknown: { type: 'integer' },
      },
    },
  },
} as const

/** Canonical background branch returned when `test_drive` runs as a job. */
export interface BackgroundHandle {
  kind: 'background'
  jobId: string
}

/** Render one `test_drive` result (drive record or background handle). */
function renderDrive(value: DriveResult | BackgroundHandle): { type: 'text'; text: string }[] {
  if ((value as BackgroundHandle).kind === 'background') {
    return [{ type: 'text', text: `Started background test drive job ${(value as BackgroundHandle).jobId}. Read its output for progress; the matrix id in the final line feeds drive_report.` }]
  }
  return [{ type: 'text', text: renderDriveResult(value as DriveResult) }]
}

/** Render one `drive_report` result (matrix or run record). */
function renderReport(value: DriveResult | MatrixRecord): { type: 'text'; text: string }[] {
  const text = 'totals' in value ? renderMatrix(value) : renderDriveResult(value)
  return [{ type: 'text', text }]
}

/** The deadline for one foreground drive: the sum of every stage deadline plus a buffer. */
function driveDeadlineMs(config: ResolvedConfig): number {
  return config.installTimeoutMs + config.configTimeoutMs + config.smokeTimeoutMs + config.capabilityTimeoutMs + config.uninstallTimeoutMs + 60_000
}

/** Owner for a background branch; background work needs a live agent to collect it. */
function requireOwner(exec: ToolRunContext): Agent {
  if (exec.agent === undefined) throw new Error('dsh-test-drive: background test drive requires an owning agent')
  return exec.agent
}

/** Build both tool definitions over the shared services. */
export function allTools(services: ToolServices) {
  const testDrive = defineTool({
    name: 'test_drive',
    description:
      'Install-and-smoke test one DeepSeek Harness plugin target (a git repo spec, an npm package name, a local path, or a tarball) in an ISOLATED throwaway DSH_HOME: `dsh plugin add` → `--dump-config` patch check → headless boot smoke (FAILED-marker scan) → `dsh plugin remove` → quarantined cleanup. The host profile and real ~/.dsh are never touched. Returns a structured result (install/smoke pass/fail, durations, failure summaries) consumable by scoring pipelines. Use background: true for a long target.',
    parameters: {
      target: {
        type: 'string',
        required: true as const,
        description: 'Plugin target: a git spec (github:owner/repo#sha, git+https://...), an npm package name, a local path, or a .tgz tarball.',
      },
      headlessTask: {
        type: 'string',
        description: 'One-shot task text for the boot-smoke stage; empty string skips the smoke stage. Defaults to the plugin config.',
      },
      capability: {
        type: 'object',
        additionalProperties: false,
        description:
          'Capability assertion: after the boot smoke, drive one headless task that calls the named tool (or runs the /command), then verify the durable session log records the invocation and that the observed output contains `expect`. Requires DEEPSEEK_API_KEY (host env or forwardEnv); without it the stage is skipped, never failed.',
        properties: {
          kind: { type: 'string', enum: ['tool', 'command'], description: 'What to assert: a registered model tool, or a /name command.' },
          name: { type: 'string', description: 'The tool or command name (without the leading /).' },
          args: { type: 'string', description: 'Invocation text: tool arguments (JSON-ish) or command words.' },
          expect: { type: 'string', description: 'Literal expected in the observed output (case-insensitive substring of the logged event).' },
        },
      },
      background: {
        type: 'boolean',
        description: 'Run the drive as a background job and return its job id instead of waiting.',
      },
    },
    output: {
      schema: {
        oneOf: [
          driveResultSchema,
          {
            type: 'object',
            additionalProperties: false,
            properties: { kind: { type: 'string', const: 'background' }, jobId: { type: 'string' } },
          },
        ],
      },
      render: (_args, value) => renderDrive(value as unknown as DriveResult | BackgroundHandle),
    },
    timeoutMs: driveDeadlineMs(services.config),
    async execute(args, exec) {
      const target = sanitizeTarget(args.target)
      if (target.length === 0) throw new Error('dsh-test-drive: target must be a non-empty string')
      const headlessTask = (args as { headlessTask?: string | null }).headlessTask
      if (headlessTask !== undefined && headlessTask !== null && headlessTask.length > MAX_HEADLESS_TASK_LENGTH) {
        throw new Error(`dsh-test-drive: headlessTask must be at most ${MAX_HEADLESS_TASK_LENGTH} characters`)
      }
      const capabilityArg = (args as { capability?: { kind?: unknown; name?: unknown; args?: unknown; expect?: unknown } }).capability
      let capability
      if (capabilityArg !== undefined && capabilityArg !== null) {
        const kind = capabilityArg.kind as CapabilityKind
        if (kind !== 'tool' && kind !== 'command') throw new Error("dsh-test-drive: capability.kind must be 'tool' or 'command'")
        const name = capabilityArg.name
        if (typeof name !== 'string' || name.length === 0 || name.length > MAX_CAPABILITY_NAME_LENGTH || !CAPABILITY_NAME_PATTERN.test(name)) {
          throw new Error(`dsh-test-drive: capability.name must be at most ${MAX_CAPABILITY_NAME_LENGTH} characters of [a-zA-Z0-9._/-] starting alphanumerically`)
        }
        const capArgs = capabilityArg.args
        if (typeof capArgs !== 'string' || capArgs.length > MAX_CAPABILITY_ARGS_LENGTH) {
          throw new Error(`dsh-test-drive: capability.args must be a string of at most ${MAX_CAPABILITY_ARGS_LENGTH} characters`)
        }
        const expect = capabilityArg.expect
        if (typeof expect !== 'string' || expect.length > MAX_CAPABILITY_EXPECT_LENGTH) {
          throw new Error(`dsh-test-drive: capability.expect must be a string of at most ${MAX_CAPABILITY_EXPECT_LENGTH} characters`)
        }
        capability = { kind, name, args: capArgs, expect }
      }
      if (args.background === true) {
        const owner = requireOwner(exec)
        const label = `test_drive ${target}`
        const jobId = startBatchJob(services, [target], owner, label)
        return { kind: 'background' as const, jobId: String(jobId) }
      }
      const result = await services.runner.drive(target, {
        signal: exec.signal,
        ...headlessTask === undefined || headlessTask === null ? {} : { headlessTask },
        ...capability === undefined ? {} : { capability },
      })
      // The tool contract declares `resolved` as an object-or-null field; the
      // domain record keeps it optional, so project it before returning.
      return { ...result, target: { ...result.target, resolved: result.target.resolved ?? null } }
    },
  })

  const driveReport = defineTool({
    name: 'drive_report',
    description:
      'Fetch a stored test-drive record by id: a single run (tdr_...), a batch matrix (tdm_...), or — with no id — the latest matrix. Returns the structured record and renders it as Markdown.',
    parameters: {
      id: {
        type: 'string',
        description: 'Run id (tdr_...), matrix id (tdm_...); omitted = the latest matrix.',
      },
    },
    output: {
      schema: { oneOf: [driveResultSchema, matrixReportSchema] },
      render: (_args, value) => renderReport(value as unknown as DriveResult | MatrixRecord),
    },
    async execute(args) {
      const domain = await services.domain()
      if (args.id === undefined || args.id === '') {
        const latest = domain.global.get()
        if (latest.matrixId === '') throw new Error('dsh-test-drive: no matrix recorded yet — run /testdrive or test_drive first')
        const matrix = domain.table('matrices').get(latest.matrixId)
        if (matrix === undefined) throw new Error(`dsh-test-drive: latest matrix ${latest.matrixId} not found`)
        return matrix
      }
      if (args.id.startsWith('tdr_')) {
        const run = domain.table('runs').get(args.id)
        if (run === undefined) throw new Error(`dsh-test-drive: no run recorded with id ${args.id}`)
        return { ...run, target: { ...run.target, resolved: run.target.resolved ?? null } }
      }
      if (args.id.startsWith('tdm_')) {
        const matrix = domain.table('matrices').get(args.id)
        if (matrix === undefined) throw new Error(`dsh-test-drive: no matrix recorded with id ${args.id}`)
        return matrix
      }
      throw new Error(`dsh-test-drive: unknown report id ${args.id} (expected tdr_... run or tdm_... matrix)`)
    },
  })

  return [testDrive, driveReport]
}
