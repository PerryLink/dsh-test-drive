/**
 * Temporary-directory ownership (the §0.2 discipline): dry-run logging before
 * any mutation, quarantine rename before removal, refusal of foreign paths,
 * and teardown sweeping only registered roots.
 * @module dsh-test-drive/test/workspace.spec
 */

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  OWNED_PREFIX,
  QUARANTINE_PREFIX,
  TempWorkspaceRegistry,
  dirExists,
  listDir,
  removeWithRetries,
} from '../src/workspace.ts'

const leftovers: string[] = []
const kept: string[] = []

async function trackedMkdtemp(prefix: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix))
  leftovers.push(dir)
  return dir
}

afterEach(async () => {
  for (const dir of leftovers.splice(0)) {
    await rm(dir, { recursive: true, force: true, maxRetries: 3 }).catch(() => {})
  }
  // Roots deliberately KEPT by the keep test are removed here, after the
  // test asserted the on-disk survival.
  for (const dir of kept.splice(0)) {
    await rm(dir, { recursive: true, force: true, maxRetries: 3 }).catch(() => {})
  }
})

function registry(logs: string[] = [], now: () => number = () => 42_000): TempWorkspaceRegistry {
  return new TempWorkspaceRegistry(line => { logs.push(line) }, now)
}

describe('TempWorkspaceRegistry.create', () => {
  it('creates an owned root with the standard layout', async () => {
    const logs: string[] = []
    const temp = registry(logs)
    const ws = await temp.create('headless')
    try {
      expect(basename(ws.root).startsWith(OWNED_PREFIX)).toBe(true)
      expect(ws.home).toBe(join(ws.root, 'home'))
      expect(ws.workspace).toBe(join(ws.root, 'workspace'))
      expect(ws.store).toBe(join(ws.root, 'pnpm-store'))
      expect(ws.profileDir).toBe(join(ws.root, 'home', 'profiles', 'headless'))
      expect(temp.size).toBe(1)
      expect(await dirExists(ws.workspace)).toBe(true)
      expect(logs.some(line => line.includes('created temp workspace'))).toBe(true)
    } finally {
      await temp.disposeAll()
    }
  })
})

describe('TempWorkspaceRegistry.quarantineAndRemove', () => {
  it('logs the dry-run plan BEFORE mutating, then quarantines and removes', async () => {
    const logs: string[] = []
    const temp = registry(logs)
    const ws = await temp.create('headless')
    const root = ws.root
    const outcome = await temp.quarantineAndRemove(root)
    expect(outcome).toEqual({ status: 'pass', quarantined: true, removed: true, summary: 'owned temp root quarantined and removed' })
    expect(await dirExists(root)).toBe(false)
    expect(temp.size).toBe(0)
    // The logged plan names the exact quarantine path used.
    const renamePlan = logs.find(line => line.includes('quarantine-rename'))
    const removePlan = logs.find(line => line.includes('dry-run — remove'))
    expect(renamePlan).toBeDefined()
    expect(removePlan).toBeDefined()
    const planIndex = logs.findIndex(line => line.includes('quarantine-rename'))
    const doneIndex = logs.findIndex(line => line.includes('removed'))
    expect(planIndex).toBeGreaterThanOrEqual(0)
    expect(doneIndex).toBeGreaterThan(planIndex)
    const quarantinePath = renamePlan?.split('->')[1]?.trim()
    expect(quarantinePath).toBeDefined()
    expect(basename(quarantinePath ?? '')).toContain(QUARANTINE_PREFIX)
  })

  it('removes the whole tree including nested files', async () => {
    const temp = registry()
    const ws = await temp.create('headless')
    await writeFile(join(ws.home, 'nested.txt'), 'x', 'utf8')
    await temp.quarantineAndRemove(ws.root)
    expect(await dirExists(ws.root)).toBe(false)
  })
})

describe('TempWorkspaceRegistry ownership refusals', () => {
  it('refuses an unregistered directory with the owned prefix', async () => {
    const foreign = await trackedMkdtemp(OWNED_PREFIX)
    const temp = registry()
    await expect(temp.quarantineAndRemove(foreign)).rejects.toThrow(/not registered/)
    expect(await dirExists(foreign)).toBe(true)
  })

  it('refuses a registered-looking path outside the OS temp dir', async () => {
    const elsewhere = await trackedMkdtemp('dsh-test-drive-')
    const temp = registry()
    const notRoot = join(elsewhere, 'inner')
    await mkdir(notRoot)
    await expect(temp.quarantineAndRemove(notRoot)).rejects.toThrow(/not a direct child/)
  })

  it('refuses a path whose basename lacks the owned prefix', async () => {
    const foreign = await trackedMkdtemp('someone-else-')
    const temp = registry()
    await expect(temp.quarantineAndRemove(foreign)).rejects.toThrow(/owned prefix/)
  })

  it('never touches a directory it refused', async () => {
    const foreign = await trackedMkdtemp(OWNED_PREFIX)
    const temp = registry()
    await expect(temp.quarantineAndRemove(foreign)).rejects.toThrow()
    expect(await dirExists(foreign)).toBe(true)
    expect(await listDir(tmpdir())).toContain(basename(foreign))
  })
})

describe('TempWorkspaceRegistry.keep', () => {
  it('drops ownership without touching the directory', async () => {
    const temp = registry()
    const ws = await temp.create('headless')
    const outcome = temp.keep(ws.root)
    kept.push(ws.root)
    expect(outcome.status).toBe('skipped')
    expect(temp.size).toBe(0)
    expect(await dirExists(ws.root)).toBe(true)
  })
})

describe('TempWorkspaceRegistry.disposeAll', () => {
  it('sweeps every registered root', async () => {
    const temp = registry()
    const first = await temp.create('headless')
    const second = await temp.create('headless')
    await temp.disposeAll()
    expect(await dirExists(first.root)).toBe(false)
    expect(await dirExists(second.root)).toBe(false)
    expect(temp.size).toBe(0)
  })
})

describe('removeWithRetries', () => {
  it('removes nested trees and tolerates already-missing paths', async () => {
    const dir = await trackedMkdtemp('dsh-test-drive-rm-')
    await mkdir(join(dir, 'a'), { recursive: true })
    await writeFile(join(dir, 'a', 'b.txt'), 'x', 'utf8')
    await removeWithRetries(dir, 3, 10)
    expect(await dirExists(dir)).toBe(false)
    await removeWithRetries(dir, 3, 10)
  })
})
