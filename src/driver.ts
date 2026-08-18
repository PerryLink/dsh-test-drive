/**
 * The `dsh` CLI driver: locates a spawnable dsh executable (config override,
 * PATH lookup, or npm shim parsing on Windows), runs each stage as a managed
 * subprocess with a throwaway DSH_HOME, and interprets the outputs the stages
 * produce (the pnpm allowBuilds gate, the config-dump layer list, and boot
 * failure markers). No shell is ever involved — argv is passed directly — so
 * hostile target specs cannot inject commands.
 *
 * @module dsh-test-drive/driver
 */

import { access, readFile, readdir, stat, writeFile, mkdir } from 'node:fs/promises'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type { SubprocessSpawnSpec } from '@deepseek-ai/dsh-subprocess'
import type { ResolvedConfig } from './config.ts'
import type { TargetKind } from './result.ts'

/** Cap on collected output per stream (in-memory tail). */
export const COLLECT_MAX_BYTES = 64 * 1024

/** Cap on the complete spill file per stream. */
export const SPILL_MAX_BYTES = 1024 * 1024

/** Grace between SIGTERM and SIGKILL for a stage process. */
export const STAGE_GRACE_MS = 5_000

/** Bootstrap bundles the `dsh plugin` template may add; the installed plugin is any OTHER bundle. */
export const TEMPLATE_BUNDLES: readonly string[] = ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-headless', '@deepseek-ai/dsh-web-app']

/** Loader-failure markers that make a boot smoke fail regardless of exit code. */
export const BOOT_FAILURE_MARKERS: readonly RegExp[] = [
  /plugin\(s\) failed to load/iu,
  /did not activate/iu,
  /\bFAILED\b/u,
  /could not be resolved/iu,
  /fiber state/iu,
]

/** Outcome of one spawned stage process. */
export interface ChildRunResult {
  /** Exit code; null when the tree was terminated or the spawn failed. */
  exitCode: number | null
  /** Collected stdout tail (unbounded head recoverable via spill). */
  stdout: string
  /** Collected stderr tail. */
  stderr: string
  /** True when either stream exceeded the in-memory tail window. */
  truncated: boolean
  /** Wall-clock duration in milliseconds. */
  durationMs: number
  /** True when the stage's own timeout (not the caller's signal) stopped the process. */
  timedOut: boolean
}

/** Everything one stage needs about this run's isolation. */
export interface StageRunOptions {
  /** Throwaway DSH_HOME. */
  home: string
  /** Child working directory. */
  cwd: string
  /** Redirected pnpm store. */
  storeDir: string
  /** Stage deadline in milliseconds. */
  timeoutMs: number
  /** Caller-owned cancellation (tool signal, batch cancel). */
  signal?: AbortSignal | undefined
}

/** One install stage attempt plus the allowBuilds facts. */
export interface AddOutcome {
  /** The final attempt's process outcome. */
  run: ChildRunResult
  /** Number of `add` spawns (2 when the allowBuilds retry ran). */
  attempts: number
  /** True when pnpm blocked a git prepare build and the retry allowlisted it. */
  allowBuildsNeeded: boolean
}

/** Facts read from the installed package's own manifest. */
export interface InstalledPackage {
  /** Package name (may be scoped). */
  packageName: string
  /** Package version. */
  packageVersion: string
  /** True when the manifest declares `dsh.bundle.patch` (a bundle layer). */
  hasBundleManifest: boolean
}

/** Parse the JS target out of an npm-generated `.cmd`/`.bat` shim. */
export function parseNpmShim(shimPath: string, shimText: string): string {
  // The invocation line is the only `"%dp0%\node_modules\..."` reference —
  // the earlier `IF EXIST "%dp0%\node.exe"` probe must not match.
  const match = /"%dp0%\\(?<rel>node_modules\\[^"]+\.(?:js|cjs|mjs))"/u.exec(shimText)
  const rel = match?.groups?.rel
  if (rel === undefined) {
    throw new Error(`dsh-test-drive: cannot parse npm shim ${shimPath} (no dp0-relative JS target found)`)
  }
  return join(dirname(shimPath), rel)
}

/** Regex escape for layer/row matching against package names. */
export function escapeRegex(source: string): string {
  return source.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
}

/** Whether a target spec names a git-hosted source (subject to pnpm's prepare gate). */
export function isGitLike(target: string): boolean {
  return /^git\+|^github:|^git@|\.git(?:#|$)/u.test(target)
}

/**
 * Classify a sanitized target spec by how `dsh plugin add` addresses it.
 * Pure: no filesystem or network access.
 *
 * @param spec - the sanitized target.
 * @returns the address kind.
 */
export function classifyTarget(spec: string): TargetKind {
  if (/\.tgz$/u.test(spec)) return 'tarball'
  if (/^file:/u.test(spec)) return spec.endsWith('.tgz') ? 'tarball' : 'path'
  if (/^git\+|^github:|^git@|\.git(?:#|$)/u.test(spec)) return 'repo'
  if (isAbsolute(spec) || spec.startsWith('.')) return 'path'
  if (/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*(@.+)?$/u.test(spec)) return 'npm'
  return 'repo'
}

/** Extract the package name pnpm reports as blocked: `Ignored build scripts: <name>.` */
export function parseIgnoredBuildScript(output: string): string | undefined {
  return /ignored build scripts:?\s*([a-z0-9][a-z0-9@/._-]*?)\s*\./iu.exec(output)?.[1]
}

/** Extract `# == <label>` layer labels from a `--dump-config` output. */
export function parseDumpLayers(dump: string): string[] {
  const layers: string[] = []
  for (const match of dump.matchAll(/^# == (.+)$/gmu)) {
    const label = match[1]
    if (label !== undefined) layers.push(label.trim())
  }
  return layers
}

/**
 * Whether the dump proves the installed package's patch took effect: a layer
 * label mentions it, or a row names it.
 */
export function dumpMentionsPackage(dump: string, packageName: string): { mentioned: boolean; layers: string[] } {
  const namePattern = new RegExp(`(^|[^a-z0-9@/._-])${escapeRegex(packageName)}([^a-z0-9@/._-]|$)`, 'iu')
  const rowPattern = new RegExp(`^\\s*name:\\s*["']?${escapeRegex(packageName)}["']?\\s*$`, 'mu')
  const layers = parseDumpLayers(dump).filter(label => namePattern.test(label))
  return { mentioned: layers.length > 0 || rowPattern.test(dump), layers }
}

/** Whether the text contains any loader-failure marker. */
export function hasBootFailure(text: string): boolean {
  return BOOT_FAILURE_MARKERS.some(marker => marker.test(text))
}

/** Driver dependencies: the subprocess seam and the resolved config. */
export interface DshDriverDeps {
  /** Context carrying `ctx.subprocess`. */
  ctx: Context
  /** Resolved plugin config. */
  config: ResolvedConfig
  /** Operator log sink. */
  log: (line: string) => void
}

/**
 * Locate and run the `dsh` CLI. The located argv prefix is cached per driver
 * instance, so every stage reuses one resolution.
 */
export class DshDriver {
  private located: Promise<readonly string[]> | undefined

  constructor(private readonly deps: DshDriverDeps) {}

  /** Resolve the spawn argv prefix `[program, ...args]` for the dsh CLI. */
  locate(): Promise<readonly string[]> {
    this.located ??= this.resolveLocation()
    return this.located
  }

  private async resolveLocation(): Promise<readonly string[]> {
    const { config, ctx, log } = this.deps
    if (config.dshBin !== '') {
      if (!isAbsolute(config.dshBin)) throw new Error(`dsh-test-drive: config.dshBin must be an absolute path (got ${JSON.stringify(config.dshBin)})`)
      if (/\.(?:[cm]?js)$/u.test(config.dshBin)) return [process.execPath, config.dshBin]
      log(`test-drive: using config.dshBin ${config.dshBin}`)
      return [config.dshBin]
    }
    const found = await ctx.subprocess.resolveExecutable('dsh')
    if (process.platform === 'win32' && /\.(?:cmd|bat)$/iu.test(found)) {
      const shimText = await readFile(found, 'utf8')
      const target = parseNpmShim(found, shimText)
      await access(target)
      log(`test-drive: dsh resolved to ${target} (via npm shim ${found})`)
      return [process.execPath, target]
    }
    if (/\.ps1$/iu.test(found)) {
      throw new Error(`dsh-test-drive: dsh resolved to the PowerShell shim ${found}; set config.dshBin to the JS entry (or the .cmd shim)`)
    }
    log(`test-drive: dsh resolved to ${found}`)
    return [found]
  }

  /** Compile the child environment: throwaway home, redirected store, deliberate forwards only. */
  buildEnv(home: string, storeDir: string): Record<string, string> {
    const env: Record<string, string> = { DSH_HOME: home, npm_config_store_dir: storeDir }
    for (const name of this.deps.config.forwardEnv) {
      const value = process.env[name]
      if (value !== undefined) env[name] = value
    }
    return env
  }

  /**
   * Run one dsh CLI invocation as a managed subprocess.
   *
   * @param args - dsh arguments (argv entries, never shell-interpreted).
   * @param options - isolation facts and the stage deadline.
   * @returns the collected outcome.
   */
  async run(args: readonly string[], options: StageRunOptions): Promise<ChildRunResult> {
    const started = Date.now()
    const outer = options.signal
    const deadline = AbortSignal.timeout(options.timeoutMs)
    const signal = outer === undefined ? deadline : AbortSignal.any([outer, deadline])
    let handle
    try {
      const [program, ...prefix] = await this.locate()
      if (program === undefined) throw new Error('dsh location resolved to an empty argv')
      const spec: SubprocessSpawnSpec = {
        argv: [program, ...prefix, ...args],
        cwd: options.cwd,
        stdio: {
          stdin: 'ignore',
          stdout: { maxBytes: COLLECT_MAX_BYTES, spill: { maxBytes: SPILL_MAX_BYTES } },
          stderr: { maxBytes: COLLECT_MAX_BYTES, spill: { maxBytes: SPILL_MAX_BYTES } },
        },
        graceMs: STAGE_GRACE_MS,
        signal,
        env: this.buildEnv(options.home, options.storeDir),
      }
      handle = this.deps.ctx.subprocess.spawn(spec)
    } catch (error) {
      // Locate or spawn failure: no process facts exist, so record it as a failure.
      return {
        exitCode: null,
        stdout: '',
        stderr: `spawn failed: ${String(error)}`,
        truncated: false,
        durationMs: Date.now() - started,
        timedOut: false,
      }
    }
    let outcome
    try {
      outcome = await handle.done
    } catch (error) {
      return {
        exitCode: null,
        stdout: '',
        stderr: `spawn failed: ${String(error)}`,
        truncated: false,
        durationMs: Date.now() - started,
        timedOut: false,
      }
    }
    const stdoutRead = handle.collected.stdout?.readFrom(0)
    const stderrRead = handle.collected.stderr?.readFrom(0)
    const stdout = stdoutRead?.text ?? ''
    const stderr = stderrRead?.text ?? ''
    const truncated = (stdoutRead?.lossy ?? false) || (stderrRead?.lossy ?? false)
    return {
      exitCode: outcome.exitCode,
      stdout,
      stderr,
      truncated,
      durationMs: Date.now() - started,
      timedOut: deadline.aborted && (outer === undefined || !outer.aborted),
    }
  }

  /** Write the profile's pnpm-workspace.yaml allowBuilds entry for one package. */
  async writeAllowBuilds(profileDir: string, packageName: string): Promise<void> {
    await mkdir(profileDir, { recursive: true })
    const key = packageName.replace(/'/gu, "''")
    await writeFile(join(profileDir, 'pnpm-workspace.yaml'), `allowBuilds:\n  '${key}': true\n`, 'utf8')
    this.deps.log(`test-drive: allowlisted prepare build for ${packageName} in ${join(profileDir, 'pnpm-workspace.yaml')}`)
  }

  /**
   * Run the install stage: `dsh plugin --profile <name> add <target>`, with the
   * documented allowBuilds retry for git-hosted sources.
   */
  async add(target: string, options: StageRunOptions): Promise<AddOutcome> {
    const { config } = this.deps
    const args = ['plugin', '--profile', config.profileName, 'add', target]
    const first = await this.run(args, options)
    const combined = `${first.stdout}\n${first.stderr}`
    const blocked = config.allowBuilds ? parseIgnoredBuildScript(combined) : undefined
    if (first.exitCode === 0 || blocked === undefined) {
      return { run: first, attempts: 1, allowBuildsNeeded: false }
    }
    await this.writeAllowBuilds(join(options.home, 'profiles', config.profileName), blocked)
    const second = await this.run(args, options)
    return { run: second, attempts: 2, allowBuildsNeeded: true }
  }

  /** Run the config stage: `dsh --profile <name> --dump-config`. */
  async dumpConfig(options: StageRunOptions): Promise<ChildRunResult> {
    return this.run(['--profile', this.deps.config.profileName, '--dump-config'], options)
  }

  /** Run the boot-smoke stage: `dsh --profile <name> <task>`. */
  async smokeTask(task: string, options: StageRunOptions): Promise<ChildRunResult> {
    return this.run(['--profile', this.deps.config.profileName, task], options)
  }

  /**
   * Read the newest durable session log from a throwaway home's session store.
   * Used by the capability stage to observe what the headless task actually
   * did (tool calls, command replies). Tolerant by contract: a missing or
   * empty store yields '' so the stage degrades instead of throwing.
   *
   * @param home - the throwaway DSH_HOME.
   * @param maxBytes - cap on the returned text (tail end kept).
   * @returns the newest session file's text, or '' when none exists.
   */
  async readNewestSession(home: string, maxBytes: number): Promise<string> {
    let entries: string[]
    try {
      entries = await readdir(join(home, 'sessions'))
    } catch {
      return ''
    }
    let newest: { path: string; mtimeMs: number } | undefined
    for (const entry of entries) {
      if (!/\.jsonl$/u.test(entry)) continue
      const path = join(home, 'sessions', entry)
      try {
        const info = await stat(path)
        if (info.isFile() && (newest === undefined || info.mtimeMs > newest.mtimeMs)) newest = { path, mtimeMs: info.mtimeMs }
      } catch {
        // Vanished between listing and stat — the next entry may still be valid.
      }
    }
    if (newest === undefined) return ''
    try {
      const text = await readFile(newest.path, 'utf8')
      return text.length <= maxBytes ? text : text.slice(text.length - maxBytes)
    } catch {
      return ''
    }
  }

  /** Run the uninstall stage: `dsh plugin --profile <name> remove <pkg>`. */
  async remove(packageName: string, options: StageRunOptions): Promise<ChildRunResult> {
    return this.run(['plugin', '--profile', this.deps.config.profileName, 'remove', packageName], options)
  }

  /** Ask the CLI for its version (cached per driver instance). */
  async version(options: StageRunOptions): Promise<string> {
    const run = await this.run(['--version'], options)
    return run.stdout.trim().split('\n').at(-1)?.trim() ?? ''
  }

  /**
   * Read the installed plugin's own manifest from the profile's node_modules.
   *
   * @param profileDir - the profile directory `dsh plugin` manages.
   * @returns the package facts, or undefined when no out-of-tree bundle is installed.
   */
  async readInstalledPackage(profileDir: string): Promise<InstalledPackage | undefined> {
    let manifestPath: string
    let text: string
    try {
      manifestPath = join(profileDir, 'package.json')
      text = await readFile(manifestPath, 'utf8')
    } catch {
      return undefined
    }
    const manifest = JSON.parse(text) as { dsh?: { profile?: { bundles?: string[] } } }
    const bundles = manifest.dsh?.profile?.bundles ?? []
    const installed = bundles.filter(name => !TEMPLATE_BUNDLES.includes(name))
    if (installed.length === 0) return undefined
    const name = installed[installed.length - 1]
    if (name === undefined) return undefined
    const segments = name.split('/')
    try {
      const pkgPath = join(profileDir, 'node_modules', ...segments, 'package.json')
      const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as {
        version?: unknown
        dsh?: { bundle?: { patch?: unknown } }
      }
      return {
        packageName: name,
        packageVersion: typeof pkg.version === 'string' ? pkg.version : 'unknown',
        hasBundleManifest: typeof pkg.dsh?.bundle?.patch === 'string',
      }
    } catch {
      return { packageName: name, packageVersion: 'unknown', hasBundleManifest: false }
    }
  }
}

/** Resolve a relative local path target against the host's invoking directory. */
export function anchorLocalTarget(target: string): string {
  return resolve(process.cwd(), target)
}
