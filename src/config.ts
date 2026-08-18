/**
 * Plugin configuration and its explicit resolve step. `resolveConfig` re-judges
 * every default and bound so programmatic construction that bypasses
 * Schemastery normalization still fails loud instead of running with hidden
 * defaults (the explicit-resolve contract).
 *
 * @module dsh-test-drive/config
 */

import z from '@deepseek-ai/schemastery'

import {
  CAPABILITY_NAME_PATTERN,
  MAX_CAPABILITY_ARGS_LENGTH,
  MAX_CAPABILITY_EXPECT_LENGTH,
  MAX_CAPABILITY_NAME_LENGTH,
} from './capability.ts'
import type { CapabilityKind } from './capability.ts'

/** Default profile template used inside each throwaway DSH_HOME. */
export const DEFAULT_PROFILE_NAME = 'headless'

/** Default headless task text; the boot smoke runs a one-shot task with it. */
export const DEFAULT_HEADLESS_TASK = 'Reply with exactly: ok'

/** Maximum length of the user-supplied headless task. */
export const MAX_HEADLESS_TASK_LENGTH = 2_000

/** Default per-stage timeout in milliseconds for the install (`dsh plugin add`). */
export const DEFAULT_INSTALL_TIMEOUT_MS = 600_000

/** Default per-stage timeout for `--dump-config`. */
export const DEFAULT_CONFIG_TIMEOUT_MS = 60_000

/** Default per-stage timeout for the headless boot smoke. */
export const DEFAULT_SMOKE_TIMEOUT_MS = 300_000

/** Default per-stage timeout for the capability-assertion task. */
export const DEFAULT_CAPABILITY_TIMEOUT_MS = 300_000

/** Default per-stage timeout for `dsh plugin remove`. */
export const DEFAULT_UNINSTALL_TIMEOUT_MS = 120_000

/** Bounds shared by every stage timeout. */
export const MIN_STAGE_TIMEOUT_MS = 1_000
export const MAX_STAGE_TIMEOUT_MS = 3_600_000

/** Default cap on the sanitized output tail recorded per stage. */
export const DEFAULT_OUTPUT_TAIL_BYTES = 8_000

/** Bounds for the sanitized output-tail cap. */
export const MIN_OUTPUT_TAIL_BYTES = 256
export const MAX_OUTPUT_TAIL_BYTES = 256_000

/** Default cap on targets one `/testdrive` batch accepts. */
export const DEFAULT_MAX_BATCH_TARGETS = 20

/** Ceiling on batch targets (a job's row cap, not a model-input cap). */
export const MAX_BATCH_TARGETS = 200

/** Default batch concurrency (serial: each target gets its own pnpm run). */
export const DEFAULT_BATCH_CONCURRENCY = 1

/** Ceiling on batch concurrency. */
export const MAX_BATCH_CONCURRENCY = 4

/** Default: a forwarded environment-name list is empty, so child profiles never see host credentials. */
export const DEFAULT_FORWARD_ENV: readonly string[] = []

/** Configuration for the dsh-test-drive install-smoke tools. */
export interface Config {
  /** Profile template initialized inside each throwaway DSH_HOME (default 'headless': base + headless bundles). */
  profileName?: string
  /** Absolute path to a dsh executable override; empty auto-detects the `dsh` on PATH (default ''). */
  dshBin?: string
  /** Headless task text for the boot-smoke stage; empty skips that stage entirely (default 'Reply with exactly: ok'). */
  headlessTask?: string
  /** Environment VARIABLE NAMES (never values) forwarded from the host into test-profile child processes (default []). */
  forwardEnv?: string[]
  /** Whether a blocked git `prepare` build is allowlisted in the test profile's pnpm-workspace.yaml and retried (default true). */
  allowBuilds?: boolean
  /** Per-stage timeout for `dsh plugin add` in milliseconds (default 600000). */
  installTimeoutMs?: number
  /** Per-stage timeout for `--dump-config` in milliseconds (default 60000). */
  configTimeoutMs?: number
  /** Per-stage timeout for the headless boot smoke in milliseconds (default 300000). */
  smokeTimeoutMs?: number
  /** Per-stage timeout for the capability-assertion task in milliseconds (default 300000). */
  capabilityTimeoutMs?: number
  /** Capability assertion: prove one named tool/command is registered, invoked, and observed (default disabled). */
  capability?: {
    /** Master switch; false (default) skips the capability stage entirely. */
    enabled?: boolean
    /** What to assert: a registered model tool, or a `/name` command. */
    kind?: CapabilityKind
    /** The tool or command name (without the leading `/`). */
    name?: string
    /** Invocation text: tool arguments (JSON-ish) or command words. */
    args?: string
    /** Literal expected in the observed output (case-insensitive substring). */
    expect?: string
  }
  /** Per-stage timeout for `dsh plugin remove` in milliseconds (default 120000). */
  uninstallTimeoutMs?: number
  /** Cap on the sanitized output tail recorded per stage in bytes (default 8000). */
  outputTailBytes?: number
  /** Keep temp dirs on failure instead of quarantining them, for forensics (default false). */
  keepTempDirs?: boolean
  /** Maximum targets one `/testdrive` batch accepts (default 20). */
  maxBatchTargets?: number
  /** Batch concurrency; targets share nothing, so >1 only adds pnpm-store contention (default 1). */
  batchConcurrency?: number
}

/** Fully resolved configuration captured at plugin load. */
export interface ResolvedConfig {
  /** Profile template name used inside each throwaway DSH_HOME. */
  profileName: string
  /** Absolute dsh executable override, or '' for auto-detection. */
  dshBin: string
  /** Headless task text; '' skips the boot-smoke stage. */
  headlessTask: string
  /** Forwarded environment names. */
  forwardEnv: readonly string[]
  /** Whether a blocked git prepare build is allowlisted and retried. */
  allowBuilds: boolean
  /** Per-stage timeout for `dsh plugin add` in milliseconds. */
  installTimeoutMs: number
  /** Per-stage timeout for `--dump-config` in milliseconds. */
  configTimeoutMs: number
  /** Per-stage timeout for the headless boot smoke in milliseconds. */
  smokeTimeoutMs: number
  /** Per-stage timeout for the capability-assertion task in milliseconds. */
  capabilityTimeoutMs: number
  /** Capability assertion policy: resolved defaults (disabled) or the validated spec. */
  capability: {
    /** Whether the capability stage runs. */
    enabled: boolean
    /** What to assert (tool or command). */
    kind: CapabilityKind
    /** The asserted tool or command name; '' while disabled. */
    name: string
    /** Invocation text for the asserted capability. */
    args: string
    /** Literal expected in the observed output. */
    expect: string
  }
  /** Per-stage timeout for `dsh plugin remove` in milliseconds. */
  uninstallTimeoutMs: number
  /** Cap on the sanitized output tail recorded per stage in bytes. */
  outputTailBytes: number
  /** Whether temp dirs survive a failed run for forensics. */
  keepTempDirs: boolean
  /** Maximum targets one batch accepts. */
  maxBatchTargets: number
  /** Batch concurrency. */
  batchConcurrency: number
}

/** Schemastery schema for loader-validated configuration. */
export const Config: z<Config> = z.object({
  profileName: z.string().default(DEFAULT_PROFILE_NAME),
  dshBin: z.string().default(''),
  headlessTask: z.string().default(DEFAULT_HEADLESS_TASK),
  forwardEnv: z.array(z.string()).default([...DEFAULT_FORWARD_ENV]),
  allowBuilds: z.boolean().default(true),
  installTimeoutMs: z.number().min(MIN_STAGE_TIMEOUT_MS).max(MAX_STAGE_TIMEOUT_MS).default(DEFAULT_INSTALL_TIMEOUT_MS),
  configTimeoutMs: z.number().min(MIN_STAGE_TIMEOUT_MS).max(MAX_STAGE_TIMEOUT_MS).default(DEFAULT_CONFIG_TIMEOUT_MS),
  smokeTimeoutMs: z.number().min(MIN_STAGE_TIMEOUT_MS).max(MAX_STAGE_TIMEOUT_MS).default(DEFAULT_SMOKE_TIMEOUT_MS),
  capabilityTimeoutMs: z.number().min(MIN_STAGE_TIMEOUT_MS).max(MAX_STAGE_TIMEOUT_MS).default(DEFAULT_CAPABILITY_TIMEOUT_MS),
  capability: z.object({
    enabled: z.boolean().default(false),
    kind: z.union([z.const('tool'), z.const('command')]).default('tool' as const),
    name: z.string().default(''),
    args: z.string().default(''),
    expect: z.string().default(''),
  }).default({ enabled: false, kind: 'tool' as const, name: '', args: '', expect: '' }),
  uninstallTimeoutMs: z.number().min(MIN_STAGE_TIMEOUT_MS).max(MAX_STAGE_TIMEOUT_MS).default(DEFAULT_UNINSTALL_TIMEOUT_MS),
  outputTailBytes: z.number().min(MIN_OUTPUT_TAIL_BYTES).max(MAX_OUTPUT_TAIL_BYTES).default(DEFAULT_OUTPUT_TAIL_BYTES),
  keepTempDirs: z.boolean().default(false),
  maxBatchTargets: z.number().min(1).max(MAX_BATCH_TARGETS).default(DEFAULT_MAX_BATCH_TARGETS),
  batchConcurrency: z.number().min(1).max(MAX_BATCH_CONCURRENCY).default(DEFAULT_BATCH_CONCURRENCY),
})

/** Throw the standard fail-loud config error for one invalid field. */
function invalid(field: string, detail: string): never {
  throw new Error(`dsh-test-drive: config.${field} ${detail}`)
}

/**
 * Resolve raw config to the runtime policy, re-validating defaults and bounds.
 *
 * @param config - raw loader config; `undefined` for a bare row.
 * @returns the frozen resolved config.
 */
export function resolveConfig(config: Config | undefined): ResolvedConfig {
  const profileName = config?.profileName ?? DEFAULT_PROFILE_NAME
  if (profileName.length === 0) invalid('profileName', 'must be a non-empty profile template name')
  if (!/^[a-zA-Z0-9._-]+$/.test(profileName)) invalid('profileName', `contains unsupported characters (got ${JSON.stringify(profileName)})`)

  const dshBin = config?.dshBin ?? ''
  if (typeof dshBin !== 'string') invalid('dshBin', 'must be a string path or empty')

  const headlessTask = config?.headlessTask ?? DEFAULT_HEADLESS_TASK
  if (typeof headlessTask !== 'string' || headlessTask.length > MAX_HEADLESS_TASK_LENGTH) {
    invalid('headlessTask', `must be a string of at most ${MAX_HEADLESS_TASK_LENGTH} characters (empty skips the smoke stage)`)
  }

  const forwardEnv = [...(config?.forwardEnv ?? DEFAULT_FORWARD_ENV)]
  for (const name of forwardEnv) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) invalid('forwardEnv', `entry ${JSON.stringify(name)} is not a valid environment variable name`)
  }

  const allowBuilds = config?.allowBuilds ?? true
  if (typeof allowBuilds !== 'boolean') invalid('allowBuilds', 'must be a boolean')

  const installTimeoutMs = config?.installTimeoutMs ?? DEFAULT_INSTALL_TIMEOUT_MS
  if (!Number.isFinite(installTimeoutMs) || installTimeoutMs < MIN_STAGE_TIMEOUT_MS || installTimeoutMs > MAX_STAGE_TIMEOUT_MS) {
    invalid('installTimeoutMs', `must be a finite number between ${MIN_STAGE_TIMEOUT_MS} and ${MAX_STAGE_TIMEOUT_MS}`)
  }

  const configTimeoutMs = config?.configTimeoutMs ?? DEFAULT_CONFIG_TIMEOUT_MS
  if (!Number.isFinite(configTimeoutMs) || configTimeoutMs < MIN_STAGE_TIMEOUT_MS || configTimeoutMs > MAX_STAGE_TIMEOUT_MS) {
    invalid('configTimeoutMs', `must be a finite number between ${MIN_STAGE_TIMEOUT_MS} and ${MAX_STAGE_TIMEOUT_MS}`)
  }

  const smokeTimeoutMs = config?.smokeTimeoutMs ?? DEFAULT_SMOKE_TIMEOUT_MS
  if (!Number.isFinite(smokeTimeoutMs) || smokeTimeoutMs < MIN_STAGE_TIMEOUT_MS || smokeTimeoutMs > MAX_STAGE_TIMEOUT_MS) {
    invalid('smokeTimeoutMs', `must be a finite number between ${MIN_STAGE_TIMEOUT_MS} and ${MAX_STAGE_TIMEOUT_MS}`)
  }

  const capabilityTimeoutMs = config?.capabilityTimeoutMs ?? DEFAULT_CAPABILITY_TIMEOUT_MS
  if (!Number.isFinite(capabilityTimeoutMs) || capabilityTimeoutMs < MIN_STAGE_TIMEOUT_MS || capabilityTimeoutMs > MAX_STAGE_TIMEOUT_MS) {
    invalid('capabilityTimeoutMs', `must be a finite number between ${MIN_STAGE_TIMEOUT_MS} and ${MAX_STAGE_TIMEOUT_MS}`)
  }

  const capabilityEnabled = config?.capability?.enabled ?? false
  if (typeof capabilityEnabled !== 'boolean') invalid('capability.enabled', 'must be a boolean')
  const capabilityKind = config?.capability?.kind ?? 'tool'
  if (capabilityKind !== 'tool' && capabilityKind !== 'command') invalid('capability.kind', `must be 'tool' or 'command' (got ${JSON.stringify(capabilityKind)})`)
  const capabilityName = config?.capability?.name ?? ''
  const capabilityArgs = config?.capability?.args ?? ''
  const capabilityExpect = config?.capability?.expect ?? ''
  if (capabilityEnabled) {
    if (capabilityName.length === 0) invalid('capability.name', 'is required when capability.enabled is true')
    if (capabilityName.length > MAX_CAPABILITY_NAME_LENGTH || !CAPABILITY_NAME_PATTERN.test(capabilityName)) {
      invalid('capability.name', `must be at most ${MAX_CAPABILITY_NAME_LENGTH} characters of [a-zA-Z0-9._/-] starting alphanumerically`)
    }
    if (capabilityArgs.length > MAX_CAPABILITY_ARGS_LENGTH) invalid('capability.args', `must be at most ${MAX_CAPABILITY_ARGS_LENGTH} characters`)
    if (capabilityExpect.length > MAX_CAPABILITY_EXPECT_LENGTH) invalid('capability.expect', `must be at most ${MAX_CAPABILITY_EXPECT_LENGTH} characters`)
  }

  const uninstallTimeoutMs = config?.uninstallTimeoutMs ?? DEFAULT_UNINSTALL_TIMEOUT_MS
  if (!Number.isFinite(uninstallTimeoutMs) || uninstallTimeoutMs < MIN_STAGE_TIMEOUT_MS || uninstallTimeoutMs > MAX_STAGE_TIMEOUT_MS) {
    invalid('uninstallTimeoutMs', `must be a finite number between ${MIN_STAGE_TIMEOUT_MS} and ${MAX_STAGE_TIMEOUT_MS}`)
  }

  const outputTailBytes = config?.outputTailBytes ?? DEFAULT_OUTPUT_TAIL_BYTES
  if (!Number.isInteger(outputTailBytes) || outputTailBytes < MIN_OUTPUT_TAIL_BYTES || outputTailBytes > MAX_OUTPUT_TAIL_BYTES) {
    invalid('outputTailBytes', `must be an integer between ${MIN_OUTPUT_TAIL_BYTES} and ${MAX_OUTPUT_TAIL_BYTES}`)
  }

  const keepTempDirs = config?.keepTempDirs ?? false
  if (typeof keepTempDirs !== 'boolean') invalid('keepTempDirs', 'must be a boolean')

  const maxBatchTargets = config?.maxBatchTargets ?? DEFAULT_MAX_BATCH_TARGETS
  if (!Number.isInteger(maxBatchTargets) || maxBatchTargets < 1 || maxBatchTargets > MAX_BATCH_TARGETS) {
    invalid('maxBatchTargets', `must be an integer between 1 and ${MAX_BATCH_TARGETS}`)
  }

  const batchConcurrency = config?.batchConcurrency ?? DEFAULT_BATCH_CONCURRENCY
  if (!Number.isInteger(batchConcurrency) || batchConcurrency < 1 || batchConcurrency > MAX_BATCH_CONCURRENCY) {
    invalid('batchConcurrency', `must be an integer between 1 and ${MAX_BATCH_CONCURRENCY}`)
  }

  return Object.freeze({
    profileName,
    dshBin,
    headlessTask,
    forwardEnv: Object.freeze(forwardEnv),
    allowBuilds,
    installTimeoutMs,
    configTimeoutMs,
    smokeTimeoutMs,
    capabilityTimeoutMs,
    capability: Object.freeze({
      enabled: capabilityEnabled,
      kind: capabilityKind,
      name: capabilityName,
      args: capabilityArgs,
      expect: capabilityExpect,
    }),
    uninstallTimeoutMs,
    outputTailBytes,
    keepTempDirs,
    maxBatchTargets,
    batchConcurrency,
  })
}
