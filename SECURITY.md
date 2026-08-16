# Security Policy

## Reporting a vulnerability

Please report vulnerabilities privately through the GitHub Security Advisory
interface: **Security → Report a vulnerability** on
[github.com/PerryLink/dsh-test-drive](https://github.com/PerryLink/dsh-test-drive/security/advisories/new).

**Sanitize before you paste.** Logs, transcripts, and reproductions must be
redacted first: remove tokens, API keys, passwords, authorization headers,
personal data, and full machine-local paths. Never include secrets in the
report body; describe them by kind and position instead.

## What to expect

- First response (acknowledgment): typically within 7 days.
- The reporter receives credit in the advisory and release notes unless they
  ask to stay anonymous.
- Fixes are released through the normal release flow with a
  `SECURITY:`-tagged changelog entry and a GitHub Security Advisory.

## Security model of this plugin

`dsh-test-drive` deliberately executes third-party plugin code (the tested
target) inside throwaway profiles. Its own boundaries are:

- **Isolation:** every drive runs in a fresh `mkdtemp` root under the OS temp
  directory (throwaway `DSH_HOME`, working directory, and pnpm store). The
  host profile is never read or written.
- **Ownership:** cleanup touches only directories this plugin instance created
  and still tracks — direct children of the OS temp directory carrying the
  `dsh-test-drive-` prefix. It never scans the temp directory or foreign
  prefixes.
- **Cleanup ladder:** a dry-run plan is logged before any mutation; removal
  goes rename-to-quarantine first, then delete; failures are reported, never
  silently dropped.
- **Credential hygiene:** child processes inherit a credential-scrubbed
  environment; the only way a secret reaches a tested profile is an explicit
  `forwardEnv` name, and values are never logged.
- **`allowBuilds`:** allowing a git package's `prepare` build runs that
  package's code at install time. The allowance is scoped to the throwaway
  profile, but treat it as a real permission: only test targets you trust and
  pin commits.

## Out of scope

The tested plugin's own behavior is not a vulnerability of this package — the
point of the tool is to measure exactly that in isolation. Report issues in
this plugin's driver, isolation, cleanup, or reporting code.

## Acknowledgments & disclosure

Fixes follow coordinated disclosure: the advisory goes out with the release
that contains the fix. Security researchers who follow this policy are
thanked in the advisory and the changelog.
