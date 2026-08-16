/**
 * Temporary-directory ownership for test drives. Every directory this plugin
 * ever touches under the OS temp dir is created here with {@link mkdtemp},
 * tracked in a live registry, and removed only through the
 * dry-run → quarantine-rename → delete ladder. Nothing in this module scans
 * the temp dir, guesses at foreign prefixes, or touches the real home:
 * ownership is a registry lookup plus a prefix and direct-child check, and a
 * path that fails any check is refused loudly.
 *
 * @module dsh-test-drive/workspace
 */

import { mkdtemp, mkdir, readdir, rm, rename, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'

/** Prefix of every owned temp root (`mkdtemp` appends the random suffix). */
export const OWNED_PREFIX = 'dsh-test-drive-'

/** Prefix of quarantine directories an owned root is renamed into before removal. */
export const QUARANTINE_PREFIX = 'dsh-test-drive-quarantine-'

/** Milliseconds between removal retries on Windows file-lock errors. */
export const REMOVE_RETRY_DELAY_MS = 100

/** Removal attempts before the cleanup stage reports failure. */
export const REMOVE_MAX_RETRIES = 3

/** Layout of one owned temp root: DSH_HOME, child cwd, and the pnpm store. */
export interface TempWorkspace {
  /** The owned root everything else lives under. */
  root: string
  /** Throwaway DSH_HOME passed to every child `dsh` process. */
  home: string
  /** Throwaway working directory for child processes. */
  workspace: string
  /** Redirected pnpm content-addressable store. */
  store: string
  /** Profile directory once `dsh plugin add` initializes it. */
  profileDir: string
}

/** One planned cleanup operation, printed to the operator log before execution. */
export interface CleanupPlan {
  /** Operation kind. */
  action: 'quarantine-rename' | 'remove' | 'keep'
  /** Full absolute target path. */
  path: string
  /** Note explaining why the target is safe to touch. */
  ownership: string
}

/** How the removal ladder ended. */
export interface CleanupOutcome {
  status: 'pass' | 'fail' | 'skipped'
  quarantined: boolean
  removed: boolean
  summary: string
}

/** Compare two absolute paths with the platform's case semantics. */
function samePath(a: string, b: string): boolean {
  const left = resolve(a)
  const right = resolve(b)
  return process.platform === 'win32' ? left.toLowerCase() === right.toLowerCase() : left === right
}

/**
 * The registry of temp roots this plugin instance owns. All mutations are
 * synchronous so the ownership set can never observe a half-registered root.
 */
export class TempWorkspaceRegistry {
  private readonly owned = new Set<string>()
  private readonly quarantined = new Set<string>()
  private sequence = 0

  /**
   * @param log - operator log sink (the plugin logger); receives the dry-run plan lines.
   * @param now - clock (test hook for deterministic quarantine names).
   */
  constructor(
    private readonly log: (line: string) => void,
    private readonly now: () => number = Date.now,
  ) {}

  /** Owned roots currently registered (for tests and diagnostics). */
  get size(): number {
    return this.owned.size
  }

  /** Create one owned temp root with the standard layout. */
  async create(profileName: string): Promise<TempWorkspace> {
    const root = await mkdtemp(join(tmpdir(), OWNED_PREFIX))
    const home = join(root, 'home')
    const workspace = join(root, 'workspace')
    const store = join(root, 'pnpm-store')
    const profileDir = join(home, 'profiles', profileName)
    this.owned.add(root)
    await mkdir(home, { recursive: true })
    await mkdir(workspace, { recursive: true })
    await mkdir(store, { recursive: true })
    this.log(`test-drive: created temp workspace ${root} (home=${home})`)
    return { root, home, workspace, store, profileDir }
  }

  /**
   * Assert that `path` is a directory this instance created and still owns.
   * Fails loud — never falls back to cwd, a parent, or a different prefix.
   */
  private assertOwned(path: string, what: 'root' | 'quarantine'): void {
    const normalized = resolve(path)
    const parent = dirname(normalized)
    if (!samePath(parent, tmpdir())) {
      throw new Error(`refusing temp cleanup: ${what} ${normalized} is not a direct child of the OS temp dir`)
    }
    const name = basename(normalized)
    const prefix = what === 'root' ? OWNED_PREFIX : QUARANTINE_PREFIX
    if (!name.startsWith(prefix)) {
      throw new Error(`refusing temp cleanup: ${what} ${normalized} does not carry the owned prefix ${prefix}`)
    }
    const registry = what === 'root' ? this.owned : this.quarantined
    const registered = [...registry].some(candidate => samePath(candidate, normalized))
    if (!registered) {
      throw new Error(`refusing temp cleanup: ${what} ${normalized} is not registered with this plugin instance`)
    }
  }

  /**
   * Compile and LOG the dry-run plan for one root before any mutation happens.
   * The returned quarantine path is the exact path the execution ladder uses,
   * so the logged plan always matches the performed operations.
   */
  private plan(root: string): string {
    this.assertOwned(root, 'root')
    const quarantine = join(tmpdir(), `${QUARANTINE_PREFIX}${this.now()}-${this.sequence += 1}`)
    this.log(`test-drive: cleanup dry-run — quarantine-rename: ${root} -> ${quarantine}`)
    this.log(`test-drive: cleanup dry-run — remove: ${quarantine} (owned quarantine dir, prefix ${QUARANTINE_PREFIX})`)
    return quarantine
  }

  /**
   * Remove one owned root via the quarantine ladder: assert ownership, log the
   * dry-run plan, rename into an owned quarantine directory, then remove it.
   * A root that fails removal stays registered as quarantine and is retried
   * on the next teardown.
   *
   * @param root - the owned root to remove.
   * @returns the sanitized outcome.
   */
  async quarantineAndRemove(root: string): Promise<CleanupOutcome> {
    const normalized = resolve(root)
    const quarantine = this.plan(normalized)
    try {
      await rename(normalized, quarantine)
    } catch (error) {
      // The root remains registered; a later teardown retries the ladder.
      return { status: 'fail', quarantined: false, removed: false, summary: `quarantine rename failed: ${String(error)}` }
    }
    this.owned.delete(normalized)
    this.quarantined.add(quarantine)
    try {
      await removeWithRetries(quarantine, REMOVE_MAX_RETRIES, REMOVE_RETRY_DELAY_MS)
    } catch (error) {
      this.log(`test-drive: quarantine removal failed, left for retry: ${quarantine} (${String(error)})`)
      return { status: 'fail', quarantined: true, removed: false, summary: 'quarantined but removal failed; path left under the OS temp dir (see host log)' }
    }
    this.quarantined.delete(quarantine)
    this.log(`test-drive: removed ${quarantine}`)
    return { status: 'pass', quarantined: true, removed: true, summary: 'owned temp root quarantined and removed' }
  }

  /**
   * Keep a root for forensics (config `keepTempDirs`): drop ownership without
   * touching the directory. The caller owns later manual cleanup.
   */
  keep(root: string): CleanupOutcome {
    const normalized = resolve(root)
    this.assertOwned(normalized, 'root')
    this.owned.delete(normalized)
    this.log(`test-drive: keeping temp workspace for forensics (ownership dropped): ${normalized}`)
    return { status: 'skipped', quarantined: false, removed: false, summary: `kept for forensics: ${basename(normalized)}` }
  }

  /** Best-effort teardown of every still-registered root and quarantine dir. */
  async disposeAll(): Promise<void> {
    const roots = [...this.owned]
    for (const root of roots) {
      try {
        await this.quarantineAndRemove(root)
      } catch (error) {
        this.log(`test-drive: teardown cleanup failed for ${root}: ${String(error)}`)
      }
    }
    const quarantines = [...this.quarantined]
    for (const quarantine of quarantines) {
      try {
        await removeWithRetries(quarantine, REMOVE_MAX_RETRIES, REMOVE_RETRY_DELAY_MS)
        this.quarantined.delete(quarantine)
      } catch (error) {
        this.log(`test-drive: teardown quarantine retry failed for ${quarantine}: ${String(error)}`)
      }
    }
  }
}

/** Remove a directory tree with bounded retries (Windows file-lock tolerance). */
export async function removeWithRetries(path: string, maxRetries: number, retryDelayMs: number): Promise<void> {
  let attempt = 0
  for (;;) {
    try {
      await rm(path, { recursive: true, force: true, maxRetries: 1 })
      return
    } catch (error) {
      attempt += 1
      if (attempt >= maxRetries) throw error
      await new Promise(resolveDelay => setTimeout(resolveDelay, retryDelayMs))
    }
  }
}

/** Verify a directory exists and is a directory (post-create sanity for tests). */
export async function dirExists(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory()
  } catch {
    return false
  }
}

/** List a directory (test helper for asserting leftovers). */
export async function listDir(path: string): Promise<string[]> {
  try {
    return await readdir(path)
  } catch {
    return []
  }
}
