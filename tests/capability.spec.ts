import { describe, expect, it } from 'vitest'

import {
  analyzeSessionLog,
  buildCapabilityTask,
  CAPABILITY_DONE_MARKER,
  escapeRegex,
} from '../src/capability.ts'

/** One durable session-log line in the rc.8 JSONL shape. */
function line(type: string, data: unknown): string {
  return JSON.stringify({ type, data })
}

const toolCall = line('tool/call', { turn: 1, step: 1, callId: 'call-1', name: 'plugin_vet', arguments: '{"owner":"a","repo":"b"}' })
const toolResult = (text: string): string => line('tool/result', {
  turn: 1,
  step: 1,
  message: { role: 'user', content: [{ type: 'tool-result', toolCallId: 'call-1', content: [{ type: 'text', text }], isError: false }] },
})
const userMessage = (text: string): string => line('user/message', {
  message: { role: 'user', content: [{ type: 'text', text }] },
})
const assistantMessage = (text: string): string => line('assistant/message', {
  turn: 1,
  step: 2,
  message: { role: 'assistant', content: [{ type: 'text', text }] },
})

describe('buildCapabilityTask', () => {
  it('names the tool and demands the done marker', () => {
    const task = buildCapabilityTask({ kind: 'tool', name: 'plugin_vet', args: '{"owner":"a"}' })
    expect(task).toContain('plugin_vet')
    expect(task).toContain('{"owner":"a"}')
    expect(task).toContain(CAPABILITY_DONE_MARKER)
  })

  it('renders a command invocation with and without arguments', () => {
    expect(buildCapabilityTask({ kind: 'command', name: 'fast', args: 'status' })).toContain('/fast status')
    expect(buildCapabilityTask({ kind: 'command', name: 'mask', args: '' })).toContain('/mask.')
  })
})

describe('analyzeSessionLog (tool kind)', () => {
  it('reports observed when the paired result contains the expectation', () => {
    const log = [toolCall, toolResult('license: MIT, verdict pass'), assistantMessage('capability-check-done')].join('\n')
    expect(analyzeSessionLog(log, { kind: 'tool', name: 'plugin_vet', expect: 'verdict pass' })).toMatchObject({
      status: 'observed',
      expectMatched: true,
    })
  })

  it('matches the expectation case-insensitively', () => {
    const log = [toolCall, toolResult('LICENSE: MIT, VERDICT PASS')].join('\n')
    expect(analyzeSessionLog(log, { kind: 'tool', name: 'plugin_vet', expect: 'verdict pass' })).toMatchObject({
      status: 'observed',
      expectMatched: true,
    })
  })

  it('reports invoked when the call ran but the expectation is missing', () => {
    const log = [toolCall, toolResult('something else')].join('\n')
    expect(analyzeSessionLog(log, { kind: 'tool', name: 'plugin_vet', expect: 'verdict pass' })).toMatchObject({
      status: 'invoked',
      expectMatched: false,
    })
  })

  it('reports not-registered when no call names the tool', () => {
    const log = [toolCall.replace('plugin_vet', 'other_tool'), toolResult('x')].join('\n')
    expect(analyzeSessionLog(log, { kind: 'tool', name: 'plugin_vet', expect: 'x' })).toMatchObject({
      status: 'not-registered',
      expectMatched: false,
    })
  })

  it('ignores unparseable and unrelated lines without throwing', () => {
    const log = ['not json at all', '', '{"type":"unknown","data":{}}', toolCall, toolResult('yes ok')].join('\n')
    expect(analyzeSessionLog(log, { kind: 'tool', name: 'plugin_vet', expect: 'yes ok' })).toMatchObject({ status: 'observed' })
  })

  it('never matches results from a different call id', () => {
    const other = line('tool/result', {
      message: { role: 'user', content: [{ type: 'tool-result', toolCallId: 'other-call', content: [{ type: 'text', text: 'expected text' }], isError: false }] },
    })
    const log = [other].join('\n')
    expect(analyzeSessionLog(log, { kind: 'tool', name: 'plugin_vet', expect: 'expected text' })).toMatchObject({ status: 'not-registered' })
  })
})

describe('analyzeSessionLog (command kind)', () => {
  it('reports observed when a reply after the invocation contains the expectation', () => {
    const log = [userMessage('please run /fast status'), assistantMessage('here is the fast report: ok')].join('\n')
    expect(analyzeSessionLog(log, { kind: 'command', name: 'fast', expect: 'fast report: ok' })).toMatchObject({ status: 'observed' })
  })

  it('reports invoked when the command ran but no reply matched (unknown command or empty output)', () => {
    const log = [userMessage('please run /fast status'), assistantMessage('no such command')].join('\n')
    expect(analyzeSessionLog(log, { kind: 'command', name: 'fast', expect: 'report' })).toMatchObject({ status: 'invoked' })
  })

  it('reports not-registered when the command text never appears', () => {
    const log = [userMessage('hello world'), assistantMessage('hi')].join('\n')
    expect(analyzeSessionLog(log, { kind: 'command', name: 'fast', expect: 'x' })).toMatchObject({ status: 'not-registered' })
  })
})

describe('escapeRegex', () => {
  it('escapes regex metacharacters', () => {
    expect(escapeRegex('a.b/c')).toBe('a\\.b/c')
  })
})
