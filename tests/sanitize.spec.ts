/**
 * Sanitizer contract: secrets redacted, control characters stripped, temp
 * roots replaced, tails bounded — extreme inputs included (token literals,
 * credential-bearing URLs, hostile repo specs, machine-local paths).
 * @module dsh-test-drive/test/sanitize.spec
 */

import { describe, expect, it } from 'vitest'
import { REDACTED, redactSecrets, redactTempPath, sanitizeOutput, sanitizeTarget, tailText } from '../src/sanitize.ts'

describe('redactSecrets', () => {
  it('redacts GitHub and npm tokens', () => {
    expect(redactSecrets('push with ghp_placeholder_removed ok')).toContain(REDACTED)
    expect(redactSecrets('token npm_placeholder_removed end')).toContain(REDACTED)
    expect(redactSecrets('ghp_short')).toBe('ghp_short')
  })

  it('redacts API keys and bearer headers', () => {
    expect(redactSecrets('key sk-abcdefghijklmnop')).toContain(REDACTED)
    expect(redactSecrets('Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.abc')).toContain(REDACTED)
  })

  it('redacts credentials embedded in URLs but keeps scheme and host', () => {
    const out = redactSecrets('fetch https://user:hunter2@github.com/owner/repo.git now')
    expect(out).not.toContain('hunter2')
    expect(out).not.toContain('user')
    expect(out).toContain('https://')
    expect(out).toContain('github.com')
  })

  it('leaves ordinary text untouched', () => {
    const plain = 'github:PerryLink/dsh-test-drive#main installed fine (exit 0)'
    expect(redactSecrets(plain)).toBe(plain)
  })
})

describe('sanitizeTarget', () => {
  it('strips control characters including NUL and newlines', () => {
    expect(sanitizeTarget('dsh-foo\u0000\n\r')).toBe('dsh-foo')
  })

  it('redacts credentials inside the spec', () => {
    expect(sanitizeTarget('https://u:p@example.com/x.git')).not.toContain('u:p@')
  })

  it('caps the length', () => {
    expect(sanitizeTarget('x'.repeat(5_000)).length).toBeLessThanOrEqual(1_000)
  })
})

describe('tailText', () => {
  it('keeps short text verbatim', () => {
    expect(tailText('short', 100)).toBe('short')
  })

  it('keeps the END of long text with a marker', () => {
    const long = 'x'.repeat(500) + 'END'
    expect(tailText(long, 5)).toBe('…<truncated, showing last 5 chars>…xxEND')
  })

  it('trims trailing whitespace before measuring', () => {
    expect(tailText('ok  \n', 100)).toBe('ok')
  })
})

describe('redactTempPath', () => {
  it('replaces both separator styles of the temp root', () => {
    const root = 'C:\\Users\\x\\AppData\\Local\\Temp\\dsh-test-drive-abc'
    const out = redactTempPath(`log ${root}\\home\\profiles\\headless ok and ${root.replace(/\\/gu, '/')}/x`, root)
    expect(out).not.toContain('dsh-test-drive-abc')
    expect(out).toContain('<testdrive-temp>')
  })

  it('returns text unchanged for an empty root', () => {
    expect(redactTempPath('plain', '')).toBe('plain')
  })
})

describe('sanitizeOutput', () => {
  it('combines redaction and tail bounding', () => {
    const root = '/tmp/dsh-test-drive-1'
    const out = sanitizeOutput(`secret ghp_abcdefghijklmnopqrstuvwxyz at ${root}/x`, root, 64)
    expect(out).not.toContain('ghp_')
    expect(out).not.toContain(root)
    expect(out.length).toBeLessThanOrEqual(200)
  })
})
