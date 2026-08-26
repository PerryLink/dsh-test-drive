# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-08-26

### Added

- **JUnit output.** `renderDriveJUnitXml` / `renderMatrixJUnitXml` render a settled `DriveResult` / `MatrixRecord` as JUnit XML (one testcase per stage / per target; failing stages/targets become `<failure>` entries with XML-escaped text) for GitHub Actions test reporters.
- **Composite CI action.** A root [`action.yml`](action.yml) (`uses: PerryLink/dsh-test-drive@<version>`) drives a target in an isolated throwaway profile and emits the report pair CI consumes — Markdown (PR comment) and JUnit (status check) — via the `scripts/ci-report.mjs` converter. The isolation/ownership/cleanup red lines are untouched: the action only runs the existing pipeline and serializes its already-settled result.

## [0.2.3] - 2026-08-22

### Changed

- **DeepSeek Harness 0.1.1-rc.2 compatibility release.** All `@deepseek-ai/dsh-*` devDependencies pin the exact `0.1.1-rc.2` line; the workshop compatibility manifest, the compat workflow, and the five-language READMEs declare the rc.2 baseline (harness peerDependencies stay `>=0.1.0-rc.8 <0.2.0` — the plugin requires no rc.2-only API). Full gate (typecheck, typecheck:ci against the published rc.2 types, tests, build, verify, pack) and a real rc.2 headless smoke run pass.

## [0.2.2] - 2026-08-21

### Changed

- **DeepSeek Harness 0.1.0-rc.8 compatibility release.** All `@deepseek-ai/dsh-*` devDependencies pin the exact `0.1.0-rc.8` line and the harness peerDependencies widen to `>=0.1.0-rc.8 <0.2.0`; the workshop compatibility manifest and the five-language READMEs declare the rc.8 baseline. Full gate (typecheck, typecheck:ci against the published rc.8 types, tests, build, verify, pack) and a real rc.8 headless smoke run pass.

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
