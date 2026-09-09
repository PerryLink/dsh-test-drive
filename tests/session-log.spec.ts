/**
 * Session-log discovery and decoding contract: the harness layout
 * (`sessions/<projectKey>/<sessionId>/session[.vN].jsonl[.zstd]`), canonical
 * generation preference, concatenated-frame Zstandard decoding, and the
 * tolerant `''` degradation. Every fixture is a synthetic tree under the OS
 * temp dir — the real home is never read.
 * @module dsh-test-drive/test/session-log.spec
 */

import { mkdir, mkdtemp, rm, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { constants, zstdCompressSync } from 'node:zlib'
import { afterEach, describe, expect, it } from 'vitest'
import {
  GENERATION_LOG_NAME,
  decodeZstdFrames,
  findNewestSessionLog,
  readNewestSessionLog,
  scanZstdFrames,
} from '../src/session-log.ts'

const homes: string[] = []

async function tempHome(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-test-drive-spec-'))
  homes.push(dir)
  return dir
}

afterEach(async () => {
  for (const dir of homes.splice(0)) {
    await rm(dir, { recursive: true, force: true, maxRetries: 3 }).catch(() => {})
  }
})

/** Distinct, deterministic mtimes (ms) so ordering never depends on wall clock. */
const T1 = Date.parse('2026-01-01T00:00:00Z')
const T2 = Date.parse('2026-02-01T00:00:00Z')
const T3 = Date.parse('2026-03-01T00:00:00Z')
const T4 = Date.parse('2026-04-01T00:00:00Z')

const HEADER = '{"type":"session","version":3}'
const TOOL_CALL = '{"type":"tool/call","data":{"name":"plugin_vet","callId":"c1"}}'
const TOOL_RESULT = '{"type":"tool/result","data":{"callId":"c1","output":"license: MIT, verdict pass"}}'
const DONE = '{"type":"assistant/message","data":{"text":"capability-check-done"}}'

/** Concatenated-frame container: one frame per durable batch, exactly as the host writes it. */
function zstdFrames(...lines: string[]): Buffer {
  return Buffer.concat(lines.map(line => zstdCompressSync(`${line}\n`)))
}

/** Checksummed frames, matching the host backend's `compressZstdFrame` options. */
function hostZstdFrames(...lines: string[]): Buffer {
  const options = { params: { [constants.ZSTD_c_checksumFlag]: 1 } }
  return Buffer.concat(lines.map(line => zstdCompressSync(`${line}\n`, options)))
}

/** Write one artifact at `sessions/<project>/<session>/<filename>` with an explicit mtime. */
async function writeSessionFile(
  home: string,
  project: string,
  session: string,
  filename: string,
  content: string | Buffer,
  mtimeMs: number,
): Promise<string> {
  const dir = join(home, 'sessions', project, session)
  await mkdir(dir, { recursive: true })
  const path = join(dir, filename)
  await writeFile(path, content)
  const stamp = new Date(mtimeMs)
  await utimes(path, stamp, stamp)
  return path
}

describe('GENERATION_LOG_NAME', () => {
  it('accepts canonical generation names and rejects everything else', () => {
    expect(GENERATION_LOG_NAME.exec('session.jsonl')?.[1]).toBeUndefined()
    expect(GENERATION_LOG_NAME.exec('session.v3.jsonl')?.[1]).toBe('3')
    expect(GENERATION_LOG_NAME.exec('session.v3.jsonl.zstd')?.[2]).toBe('.zstd')
    for (const name of ['session.v0.jsonl', 'session.V3.jsonl', 'session.v03.jsonl', 'session.jsonl.tmp', 'session.jsonl.zstd.tmp', 'other.jsonl']) {
      expect(GENERATION_LOG_NAME.exec(name)).toBeNull()
    }
  })
})

describe('scanZstdFrames / decodeZstdFrames', () => {
  it('scans every frame of a concatenated container and decodes all of them', () => {
    const buffer = zstdFrames(HEADER, TOOL_CALL, TOOL_RESULT)
    expect(scanZstdFrames(buffer).frames).toHaveLength(3)
    expect(decodeZstdFrames(buffer)).toBe([HEADER, TOOL_CALL, TOOL_RESULT].map(line => `${line}\n`).join(''))
  })

  it('returns no frames for an empty artifact', () => {
    expect(scanZstdFrames(Buffer.alloc(0))).toEqual({ frames: [] })
    expect(decodeZstdFrames(Buffer.alloc(0))).toBe('')
  })

  it('decodes the checksummed frames the host backend writes', () => {
    const buffer = hostZstdFrames(HEADER, TOOL_CALL, TOOL_RESULT)
    expect(scanZstdFrames(buffer).frames).toHaveLength(3)
    expect(decodeZstdFrames(buffer)).toContain(TOOL_RESULT)
  })

  it('rejects a corrupt container instead of guessing', () => {
    expect(() => scanZstdFrames(Buffer.from('not a zstd frame at all'))).toThrow(/invalid frame magic/)
  })
})

describe('readNewestSessionLog', () => {
  it('drills project/session levels and decodes every zstd frame of the newest session', async () => {
    const home = await tempHome()
    await writeSessionFile(home, '--projA--', 'sess-1', 'session.v3.jsonl', '{"type":"assistant/message","data":{"text":"older plaintext session"}}\n', T1)
    await writeSessionFile(home, '--projA--', 'sess-2', 'session.v3.jsonl.zstd', zstdFrames(HEADER, TOOL_CALL, TOOL_RESULT, DONE), T2)

    const text = await readNewestSessionLog(home, 1024 * 1024)
    // Frames after the header are the regression: a whole-file decode returns only frame one.
    expect(text).toContain(TOOL_CALL)
    expect(text).toContain(TOOL_RESULT)
    expect(text).toContain('capability-check-done')
    expect(text).not.toContain('older plaintext session')
  })

  it('ignores the legacy flat layout and every non-canonical name', async () => {
    const home = await tempHome()
    await writeSessionFile(home, '--projA--', 'sess-1', 'session.v3.jsonl', '{"type":"assistant/message","data":{"text":"older plaintext session"}}\n', T1)
    await writeSessionFile(home, '_no-cwd', 'sess-3', 'session.jsonl', '{"type":"assistant/message","data":{"text":"v0 generation session"}}\n', T2)
    await writeSessionFile(home, '--projA--', 'sess-1', 'session.jsonl.tmp', '{"type":"assistant/message","data":{"text":"non-canonical tmp"}}\n', T3)
    // Root-level flat legacy artifact (the pre-fix scan target) and a stray project file.
    await mkdir(join(home, 'sessions'), { recursive: true })
    await writeFile(join(home, 'sessions', 'legacy.jsonl'), '{"type":"assistant/message","data":{"text":"flat legacy"}}\n')
    await utimes(join(home, 'sessions', 'legacy.jsonl'), new Date(T4), new Date(T4))
    await writeFile(join(home, 'sessions', '--projA--', 'notes.txt'), 'not a session\n')

    const text = await readNewestSessionLog(home, 1024 * 1024)
    expect(text).toContain('v0 generation session')
    expect(text).not.toContain('flat legacy')
    expect(text).not.toContain('non-canonical tmp')
    expect(text).not.toContain('older plaintext session')

    const found = await findNewestSessionLog(home)
    expect(found?.path.endsWith(join('_no-cwd', 'sess-3', 'session.jsonl'))).toBe(true)
    expect(found?.generation).toBe(0)
    expect(found?.zstd).toBe(false)
  })

  it('prefers the highest canonical generation even when a lower one is newer', async () => {
    const home = await tempHome()
    await writeSessionFile(home, '--proj--', 'sess-1', 'session.v3.jsonl', '{"type":"assistant/message","data":{"text":"generation three"}}\n', T1)
    await writeSessionFile(home, '--proj--', 'sess-1', 'session.jsonl', '{"type":"assistant/message","data":{"text":"generation zero"}}\n', T3)

    const text = await readNewestSessionLog(home, 1024 * 1024)
    expect(text).toContain('generation three')
    expect(text).not.toContain('generation zero')
  })

  it('keeps every complete frame when the final frame is torn by a crashed write', async () => {
    const home = await tempHome()
    const complete = zstdFrames(HEADER, TOOL_CALL, DONE)
    await writeSessionFile(home, '--proj--', 'sess-1', 'session.v3.jsonl.zstd', complete.subarray(0, complete.length - 3), T1)

    const text = await readNewestSessionLog(home, 1024 * 1024)
    expect(text).toContain(TOOL_CALL)
    expect(text).not.toContain('capability-check-done')
  })

  it('keeps the tail when the log exceeds maxBytes', async () => {
    const home = await tempHome()
    const full = `${'a'.repeat(200)}TAIL-MARKER`
    await writeSessionFile(home, '--proj--', 'sess-1', 'session.v3.jsonl', full, T1)

    const text = await readNewestSessionLog(home, 24)
    expect(text).toHaveLength(24)
    expect(text).toBe(full.slice(full.length - 24))
  })

  it('returns empty text for an empty store, a missing store, and a corrupt artifact', async () => {
    const empty = await tempHome()
    await mkdir(join(empty, 'sessions'), { recursive: true })
    expect(await readNewestSessionLog(empty, 1024)).toBe('')

    const missing = await tempHome()
    expect(await readNewestSessionLog(missing, 1024)).toBe('')
    expect(await findNewestSessionLog(missing)).toBeUndefined()

    const corrupt = await tempHome()
    await writeSessionFile(corrupt, '--proj--', 'sess-1', 'session.v3.jsonl.zstd', Buffer.from('definitely not zstd'), T1)
    expect(await readNewestSessionLog(corrupt, 1024)).toBe('')
  })
})
