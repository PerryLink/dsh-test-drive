/**
 * The capability-assertion stage: beyond "booted and exited", prove one NAMED
 * capability of the installed plugin is registered, invoked, and its effect
 * OBSERVED — the omdsh-INTAKE principle that a clean boot is only a smoke
 * test. The stage runs one headless task that asks the agent to call a tool
 * (or run a command), then analyzes the durable session log for the paired
 * `tool/call` → `tool/result` events (or the command invocation and reply) and
 * matches a caller-supplied expectation against the observed output.
 *
 * Everything here is pure and tolerant: the analyzer never throws on hostile
 * or truncated log lines (it skips them), so the capability stage itself can
 * only fail through its own process outcome, never through log parsing.
 *
 * @module dsh-test-drive/capability
 */

import { z } from 'zod'

/** The capability kinds the stage can assert. */
export const CapabilityKindSchema = z.union([z.literal('tool'), z.literal('command')])
export type CapabilityKind = z.infer<typeof CapabilityKindSchema>

/** Outcome of the capability stage (registered + invoked + observed, in order). */
export const CapabilityStatusSchema = z.union([
  z.literal('observed'),
  z.literal('invoked'),
  z.literal('not-registered'),
  z.literal('skipped'),
  z.literal('failed'),
])
export type CapabilityStatus = z.infer<typeof CapabilityStatusSchema>

/** The exact reply the task text demands; also the run-completion marker. */
export const CAPABILITY_DONE_MARKER = 'capability-check-done'

/** Maximum length of the `args` payload handed to the capability task. */
export const MAX_CAPABILITY_ARGS_LENGTH = 4_000

/** Maximum length of the `expect` literal matched against the observed output. */
export const MAX_CAPABILITY_EXPECT_LENGTH = 2_000

/** Maximum length of the asserted tool or command name. */
export const MAX_CAPABILITY_NAME_LENGTH = 200

/** Allowed characters for an asserted tool or command name. */
export const CAPABILITY_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/

/** The capability spec the stage works from (config or per-drive override). */
export interface CapabilitySpec {
  /** What to invoke: a registered model tool, or a `/name` command. */
  kind: CapabilityKind
  /** The tool or command name (without the leading `/`). */
  name: string
  /** Raw arguments text for the invocation (tool: JSON-ish argument text; command: argument words). */
  args: string
  /** Literal expected in the observed output (case-insensitive substring of the serialized event). */
  expect: string
}

/** Regex-escape a literal for embedding in a pattern. */
export function escapeRegex(source: string): string {
  return source.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
}

/**
 * Compile the headless task text that makes the agent exercise the capability.
 *
 * @param spec - the capability to exercise.
 * @returns the task text; never empty.
 */
export function buildCapabilityTask(spec: Pick<CapabilitySpec, 'kind' | 'name' | 'args'>): string {
  if (spec.kind === 'tool') {
    return [
      `Call the tool "${spec.name}" with exactly these arguments:`,
      spec.args === '' ? '(no arguments)' : spec.args,
      `After the tool returns, reply with exactly: ${CAPABILITY_DONE_MARKER}`,
    ].join('\n')
  }
  return [
    `Run the command /${spec.name}${spec.args === '' ? '' : ` ${spec.args}`}.`,
    `Then reply with exactly: ${CAPABILITY_DONE_MARKER}`,
  ].join('\n')
}

/** The settled analysis of one session log against one capability spec. */
export interface CapabilityAnalysis {
  /** Highest reached status. */
  status: Extract<CapabilityStatus, 'observed' | 'invoked' | 'not-registered'>
  /** One-line sanitized explanation. */
  detail: string
  /** Whether the expectation literal was found in the observed output. */
  expectMatched: boolean
}

/** Parse one JSONL line into `{ type, data }` or undefined for unparseable lines. */
function parseLine(line: string): { type: string; data: unknown } | undefined {
  try {
    const value = JSON.parse(line) as { type?: unknown; data?: unknown }
    if (typeof value.type !== 'string' || value.data === undefined) return undefined
    return { type: value.type, data: value.data }
  } catch {
    return undefined
  }
}

/** Lowercased serialization of one event payload for expectation matching. */
function haystack(data: unknown): string {
  return JSON.stringify(data).toLowerCase()
}

/** Whether the serialized payload contains the expectation (case-insensitive). */
function matchesExpect(data: unknown, expect: string): boolean {
  return expect !== '' && haystack(data).includes(expect.toLowerCase())
}

/**
 * Analyze a durable session log against one capability spec. Tolerant: every
 * unparseable or unrelated line is skipped, and missing evidence degrades to
 * the highest status actually reached (`not-registered` when the invocation
 * never appears, `invoked` when it ran but the expectation never appeared,
 * `observed` only when both hold).
 *
 * @param log - the raw JSONL session text (as persisted by the harness).
 * @param spec - the asserted capability.
 * @returns the settled analysis; never throws.
 */
export function analyzeSessionLog(log: string, spec: Pick<CapabilitySpec, 'kind' | 'name' | 'expect'>): CapabilityAnalysis {
  const lines: { type: string; data: unknown }[] = []
  for (const line of log.split('\n')) {
    const parsed = parseLine(line)
    if (parsed !== undefined) lines.push(parsed)
  }
  if (spec.kind === 'tool') {
    const callIds: string[] = []
    for (const line of lines) {
      if (line.type !== 'tool/call') continue
      const data = line.data as { name?: unknown; callId?: unknown }
      if (data.name === spec.name && typeof data.callId === 'string') callIds.push(data.callId)
    }
    if (callIds.length === 0) {
      return {
        status: 'not-registered',
        detail: `no tool/call event names "${spec.name}" — the tool was never registered or the agent never invoked it`,
        expectMatched: false,
      }
    }
    for (const line of lines) {
      if (line.type !== 'tool/result') continue
      const serialized = JSON.stringify(line.data)
      const paired = callIds.some(callId => serialized.includes(callId))
      if (!paired) continue
      if (matchesExpect(line.data, spec.expect)) {
        return { status: 'observed', detail: `tool "${spec.name}" called and its result contains the expectation`, expectMatched: true }
      }
    }
    return {
      status: 'invoked',
      detail: `tool "${spec.name}" was called (${callIds.length} call(s)) but no paired result contains the expectation`,
      expectMatched: false,
    }
  }
  // command: the invocation is a user message containing "/name", the reply an
  // assistant message after it; unknown commands still produce the invocation,
  // so they surface as 'invoked' with a missing expectation, never as
  // 'not-registered' (the harness logs the text before the command resolves).
  const commandPattern = new RegExp(`/${escapeRegex(spec.name)}(?:\\s|$)`, 'u')
  let invokedAt = -1
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    if (line === undefined) continue
    if (line.type !== 'user/message') continue
    if (commandPattern.test(JSON.stringify(line.data))) {
      invokedAt = i
      break
    }
  }
  if (invokedAt === -1) {
    return {
      status: 'not-registered',
      detail: `no user message invoking /${spec.name} — the agent never ran the command`,
      expectMatched: false,
    }
  }
  for (let i = invokedAt + 1; i < lines.length; i += 1) {
    const line = lines[i]
    if (line === undefined) continue
    if (line.type === 'assistant/message' && matchesExpect(line.data, spec.expect)) {
      return { status: 'observed', detail: `command /${spec.name} ran and a reply contains the expectation`, expectMatched: true }
    }
  }
  return {
    status: 'invoked',
    detail: `command /${spec.name} was invoked but no reply contains the expectation (unknown command or empty output)`,
    expectMatched: false,
  }
}
