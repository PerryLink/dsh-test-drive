# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2026-08-19

### Fixed

- The e2e pipeline read `pluginVersion` from `src/version.ts` instead of a hardcoded literal that went stale at 0.1.0, so the real-CLI drive verifies the version the package actually reports.

### Added

- Capability-config negative suite (empty name, invalid kind, non-alphanumeric name, over-length args/expect), lifecycle gates, and coverage/lint/README CI; declaration-specifier rewrite for NodeNext consumers.

## [0.2.0] - 2026-08-18

### Added

- Capability-assertion stage: after the boot smoke, the pipeline can drive one headless task that calls a named tool (or runs a `/command`) and verify the durable session log recorded the invocation and that the observed output contains `expect` (case-insensitive substring of the serialized event). Status ladder `observed` → `invoked` → `not-registered`, plus `skipped` (disabled or no `DEEPSEEK_API_KEY`) and `failed` (task failure); `not-registered`/`failed` fail the drive verdict. Config block `capability.*` + `capabilityTimeoutMs`, per-drive `capability` tool argument, and the stage record is an OPTIONAL `stages.capability` field (backward-compatible: pre-capability v1 records still validate, no domain-version bump).

## [0.1.0] - 2026-08-16

### Added

- `test_drive` tool: isolated install → dump-config → boot smoke → uninstall → cleanup pipeline for one target (repo, npm package, local path, or tarball), with a background-job branch.
- `/testdrive` slash command: batch drive over `ctx.jobs` producing a matrix report (JSON + Markdown).
- `drive_report` tool: fetch runs (`tdr_...`), matrices (`tdm_...`), or the latest matrix.
- Structured result contract `dsh-test-drive/v1`: per-stage status/duration/summary fields plus an overall verdict, stored in the `test_drive` storage domain.
- Owned temp-directory discipline: `dsh-test-drive-` prefix registry, dry-run logging, quarantine-rename → delete ladder, teardown sweep.
- Sanitizers for token literals, URL credentials, bearer headers, temp-root paths, and output tails.
- Five-language README, cordis.patch.yml with per-key comments, CI/compat/release workflows, and the full gate chain.
- Issue forms (bug/feature), pull request template, and repository badges.
