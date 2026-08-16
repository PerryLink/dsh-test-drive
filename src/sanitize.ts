/**
 * Pure sanitizers for every string that reaches a report, a log, or the model.
 * Nothing here reads the environment or the clock: report content is the only
 * caller, and the sanitizers must stay testable with extreme inputs (token
 * literals, credential-bearing URLs, hostile repo specs, temp-root paths).
 *
 * @module dsh-test-drive/sanitize
 */

/** GitHub personal access tokens (`ghp_` prefix, ≥20 body chars). */
const GITHUB_TOKEN = /ghp_[A-Za-z0-9]{20,}/gu

/** npm access tokens (`npm_` prefix, ≥20 body chars). */
const NPM_TOKEN = /npm_[A-Za-z0-9]{20,}/gu

/** OpenAI-style keys (`sk-` prefix, ≥16 body chars) and common jwt/aws/twilio shapes. */
const API_KEY = /(?:sk-[A-Za-z0-9_-]{16,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,})/gu

/** `scheme://user:pass@host` — keeps the scheme and host, drops the credentials. */
const URL_CREDENTIALS = /(\b[a-z][a-z0-9+.-]*:\/\/)[^/@\s:]+(?::[^/@\s]*)?@/giu

/** `Authorization: Bearer <token>`-style header lines. */
const BEARER = /\b(Bearer\s+)[A-Za-z0-9._~+/=-]{8,}/giu

/** Control characters that must never survive into a one-line report field. */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/gu

/** Maximum length of a sanitized target spec recorded in a report. */
export const MAX_TARGET_SPEC_LENGTH = 1_000

/** Marker substituted for every redacted secret. */
export const REDACTED = '***REDACTED***'

/**
 * Replace credential-shaped substrings with {@link REDACTED}.
 *
 * @param text - any output or user-supplied string.
 * @returns the same text with secrets redacted.
 */
export function redactSecrets(text: string): string {
  return text
    .replace(GITHUB_TOKEN, REDACTED)
    .replace(NPM_TOKEN, REDACTED)
    .replace(API_KEY, REDACTED)
    .replace(URL_CREDENTIALS, '$1***@')
    .replace(BEARER, `$1${REDACTED}`)
}

/**
 * Sanitize one user-supplied target spec for recording and display: strip
 * control characters, redact embedded credentials, cap the length, and keep
 * surrounding whitespace off the recorded value.
 *
 * @param spec - the raw target as the user supplied it.
 * @returns the sanitized spec; never throws.
 */
export function sanitizeTarget(spec: string): string {
  return redactSecrets(spec.replace(CONTROL_CHARS, ' ').trim()).slice(0, MAX_TARGET_SPEC_LENGTH)
}

/**
 * Bound a multi-line output stream to a short tail for one-line summaries.
 * The tail keeps the END of the text (errors and final results cluster there).
 *
 * @param text - collected output.
 * @param maxChars - retained character count.
 * @returns the tail, prefixed with a truncation marker when shortened.
 */
export function tailText(text: string, maxChars: number): string {
  const clean = text.replace(/\s+$/u, '')
  if (clean.length <= maxChars) return clean
  return `…<truncated, showing last ${maxChars} chars>…${clean.slice(-maxChars)}`
}

/**
 * Replace every occurrence of one run's temp root with a stable placeholder,
 * so recorded output never leaks machine-local absolute paths. Both
 * separator styles are matched (Windows backslashes vs forward slashes).
 *
 * @param text - output to scrub.
 * @param tempRoot - the exact temp root this run owns.
 * @returns the scrubbed text.
 */
export function redactTempPath(text: string, tempRoot: string): string {
  if (tempRoot.length === 0) return text
  const forward = tempRoot.replace(/\\/gu, '/')
  const backward = tempRoot.replace(/\//gu, '\\')
  return text.split(forward).join('<testdrive-temp>').split(backward).join('<testdrive-temp>')
}

/**
 * Scrub one stage's collected output for a report field: redact the temp
 * root, redact secrets, then keep only the bounded tail.
 *
 * @param text - raw collected output.
 * @param tempRoot - this run's temp root ('' for none).
 * @param maxChars - retained tail length.
 * @returns the report-safe tail.
 */
export function sanitizeOutput(text: string, tempRoot: string, maxChars: number): string {
  return tailText(redactSecrets(redactTempPath(text, tempRoot)), maxChars)
}
