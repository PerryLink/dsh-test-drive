/**
 * Session-store discovery and multi-frame Zstandard decoding for the
 * capability stage.
 *
 * The harness stores one artifact per session at
 * `$DSH_HOME/sessions/<projectKey>/<sessionId>/session[.vN].jsonl[.zstd]`
 * (host `packages/session/session-persistence-jsonl/src/format.ts:253-303`
 * on the `0.1.5-alpha.1` baseline), and writes the compressed form as a
 * CONCATENATED Zstandard container — one frame per durable batch — so Node's
 * whole-file `zstdDecompressSync` silently returns only the first frame
 * (`header`). Reading a real log therefore requires both the two-level
 * drill-down and per-frame decoding.
 *
 * Everything here is tolerant by contract: discovery degrades to `undefined`
 * and reading to `''`, never throwing into the drive pipeline.
 *
 * @module dsh-test-drive/session-log
 */

import { readFile, readdir, stat } from 'node:fs/promises'
import type { Dirent } from 'node:fs'
import { join } from 'node:path'
import { zstdDecompressSync } from 'node:zlib'

/**
 * Canonical generation log basename: `session.jsonl` (generation 0) or
 * `session.vN.jsonl` with N >= 1, optionally carrying the `.zstd` compression
 * suffix. Temporary, uppercase, leading-zero, and `.v0` names are not
 * canonical (host `session-format/src/filename.ts:5-17` plus the compression
 * suffix of `session-persistence-jsonl/src/format.ts:41-47`).
 */
export const GENERATION_LOG_NAME = /^session(?:\.v([1-9][0-9]*))?\.jsonl(\.zstd)?$/u

/** Zstandard frame magic, little-endian. */
const ZSTD_MAGIC = 0xFD2FB528

/** Byte range occupied by one structurally complete Zstandard frame. */
export interface ZstdFrameRange {
  /** Inclusive frame start. */
  start: number
  /** Exclusive frame end. */
  end: number
}

/** Structural scan result for a concatenated Zstandard stream. */
export interface ZstdFrameScan {
  /** Complete frames in file order. */
  frames: ZstdFrameRange[]
  /** Start of an incomplete final frame, when EOF interrupts one. */
  tornStart?: number
}

/**
 * Locate complete frames without decompressing their blocks. Invalid complete
 * structure rejects; EOF inside the final frame returns its start so a crashed
 * write still yields every earlier frame.
 *
 * Mirrored from DeepSeek Harness
 * `packages/session/session-persistence-jsonl/src/zstd.ts:48-104` (MIT, host
 * baseline `dsh-v0.1.5-alpha.1`, commit `19d2e38480`) because that helper is
 * not part of the published package surface; the license notice lives in
 * THIRD_PARTY_NOTICES.md.
 *
 * @param buffer - complete bytes currently present in the session artifact.
 * @param maxFrames - optional complete-frame limit for metadata-only readers.
 * @returns complete frame ranges and an optional incomplete-final-frame start.
 */
export function scanZstdFrames(buffer: Buffer, maxFrames = Number.POSITIVE_INFINITY): ZstdFrameScan {
  const frames: ZstdFrameRange[] = []
  let offset = 0

  while (offset < buffer.length) {
    const start = offset
    if (buffer.length - offset < 4) return { frames, tornStart: start }
    if (buffer.readUInt32LE(offset) !== ZSTD_MAGIC) {
      throw new Error(`corrupt Zstandard session log: invalid frame magic at byte ${offset}`)
    }
    offset += 4

    if (offset === buffer.length) return { frames, tornStart: start }
    const descriptor = buffer.readUInt8(offset)
    offset += 1
    if ((descriptor & 0x18) !== 0) {
      throw new Error(`corrupt Zstandard session log: reserved frame-header bit at byte ${offset - 1}`)
    }

    const contentSizeFlag = descriptor >>> 6
    const singleSegment = (descriptor & 0x20) !== 0
    const checksum = (descriptor & 0x04) !== 0
    const dictionaryFlag = descriptor & 0x03
    const dictionaryBytes = dictionaryFlag === 3 ? 4 : dictionaryFlag
    const contentSizeBytes = contentSizeFlag === 0
      ? (singleSegment ? 1 : 0)
      : 1 << contentSizeFlag
    const remainingHeaderBytes = (singleSegment ? 0 : 1) + dictionaryBytes + contentSizeBytes
    if (buffer.length - offset < remainingHeaderBytes) return { frames, tornStart: start }
    offset += remainingHeaderBytes

    for (;;) {
      if (buffer.length - offset < 3) return { frames, tornStart: start }
      const blockHeader = buffer.readUIntLE(offset, 3)
      offset += 3
      const lastBlock = (blockHeader & 1) !== 0
      const blockType = (blockHeader >>> 1) & 0x03
      const blockSize = blockHeader >>> 3
      if (blockType === 0x03) {
        throw new Error(`corrupt Zstandard session log: reserved block type at byte ${offset - 3}`)
      }
      const payloadBytes = blockType === 0x01 ? 1 : blockSize
      if (buffer.length - offset < payloadBytes) return { frames, tornStart: start }
      offset += payloadBytes
      if (lastBlock) break
    }

    if (checksum) {
      if (buffer.length - offset < 4) return { frames, tornStart: start }
      offset += 4
    }
    frames.push({ start, end: offset })
    if (frames.length === maxFrames) return { frames }
  }

  return { frames }
}

/**
 * Decode a concatenated Zstandard container frame by frame. A torn final
 * frame contributes nothing, while every complete frame before it still
 * decodes — Node's own whole-file API would silently return only the first.
 *
 * @param buffer - the artifact bytes.
 * @returns the concatenated plaintext of every complete frame.
 * @throws when a structurally complete frame fails validation (the caller
 *   applies the tolerant `''` contract).
 */
export function decodeZstdFrames(buffer: Buffer): string {
  const { frames } = scanZstdFrames(buffer)
  let text = ''
  for (const { start, end } of frames) text += zstdDecompressSync(buffer.subarray(start, end)).toString('utf8')
  return text
}

/** One canonical session artifact found in the store. */
export interface SessionLogFile {
  /** Absolute artifact path. */
  path: string
  /** True when the artifact carries the `.zstd` compression suffix. */
  zstd: boolean
  /** Canonical generation number (0 for `session.jsonl`). */
  generation: number
  /** Artifact modification time in milliseconds. */
  mtimeMs: number
}

/**
 * Newest canonical artifact inside one session directory: the highest
 * generation wins regardless of mtime, with mtime only breaking a tie between
 * two artifacts of the same generation (host
 * `resolveGenerationInDirectory`, `session-persistence-jsonl/src/index.ts:1369-1405`).
 */
async function newestGenerationIn(sessionDir: string): Promise<SessionLogFile | undefined> {
  let entries: Dirent[]
  try {
    entries = await readdir(sessionDir, { withFileTypes: true })
  } catch {
    return undefined
  }
  let best: SessionLogFile | undefined
  for (const entry of entries) {
    const match = GENERATION_LOG_NAME.exec(entry.name)
    if (match === null) continue
    const path = join(sessionDir, entry.name)
    try {
      const info = await stat(path)
      if (!info.isFile()) continue
      const candidate: SessionLogFile = {
        path,
        zstd: match[2] === '.zstd',
        generation: match[1] === undefined ? 0 : Number(match[1]),
        mtimeMs: info.mtimeMs,
      }
      if (best === undefined || candidate.generation > best.generation
        || (candidate.generation === best.generation && candidate.mtimeMs > best.mtimeMs)) best = candidate
    } catch {
      // Vanished between listing and stat — the next entry may still be valid.
    }
  }
  return best
}

/**
 * Find the newest canonical session artifact under `$DSH_HOME/sessions`.
 * The store is two levels deep (`<projectKey>/<sessionId>/`), so a flat scan
 * only ever sees project directories; `_no-cwd` is an ordinary project key.
 * A non-directory entry (root-level stray file, symlink) is skipped, matching
 * the host's `listProjectDirs`/`listSessionDirs` directory-only rule.
 *
 * @param home - the throwaway DSH_HOME.
 * @returns the newest artifact, or undefined when the store is missing/empty.
 */
export async function findNewestSessionLog(home: string): Promise<SessionLogFile | undefined> {
  const root = join(home, 'sessions')
  let projects: Dirent[]
  try {
    projects = await readdir(root, { withFileTypes: true })
  } catch {
    return undefined
  }
  let newest: SessionLogFile | undefined
  for (const project of projects) {
    if (!project.isDirectory()) continue
    const projectDir = join(root, project.name)
    let sessions: Dirent[]
    try {
      sessions = await readdir(projectDir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const session of sessions) {
      if (!session.isDirectory()) continue
      const candidate = await newestGenerationIn(join(projectDir, session.name))
      if (candidate !== undefined && (newest === undefined || candidate.mtimeMs > newest.mtimeMs)) newest = candidate
    }
  }
  return newest
}

/**
 * Read the newest session log text, decoding every Zstandard frame.
 *
 * Tolerant by contract: a missing store, an unreadable artifact, or a corrupt
 * container yields `''` so the capability stage degrades instead of throwing.
 *
 * @param home - the throwaway DSH_HOME.
 * @param maxBytes - cap on the returned text (tail end kept).
 * @returns the newest session file's text, or '' when none exists.
 */
export async function readNewestSessionLog(home: string, maxBytes: number): Promise<string> {
  const newest = await findNewestSessionLog(home)
  if (newest === undefined) return ''
  try {
    const text = newest.zstd
      ? decodeZstdFrames(await readFile(newest.path))
      : await readFile(newest.path, 'utf8')
    return text.length <= maxBytes ? text : text.slice(text.length - maxBytes)
  } catch {
    return ''
  }
}
