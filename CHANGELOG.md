# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.11] - 2026-09-10

### Changed

- Pin the `@deepseek-ai/dsh-*` dev/test dependencies to the published `0.1.5-rc.1` line and record `0.1.5-rc.1` in `dshWorkshop.compatibility.dshVersions`; the monthly Compat workflow now runs against `0.1.5-rc.1`. The peer range `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0` is unchanged, so no supported host line is dropped.

### Docs

- Refresh the five-language README compatibility baseline to `dsh-v0.1.5-rc.1` (verified 2026-09-10).

## [0.3.10] - 2026-09-09

### Fixed

- Read the newest durable session log from the harness's real layout. `DshDriver.readNewestSession` scanned only `.jsonl` files directly under `$DSH_HOME/sessions`, but the harness stores one artifact per session at `sessions/<projectKey>/<sessionId>/session[.vN].jsonl[.zstd]`, so on a real profile the lookup always returned `''` and the capability stage reported `not-registered` for every tool and command — a false negative with no test coverage. The new `src/session-log.ts` drills both directory levels, accepts only canonical generation names (`session.jsonl` / `session.vN.jsonl`, N >= 1, optional `.zstd`), prefers the highest generation inside a session directory (mtime breaks ties and orders sessions), and skips root-level stray files, symlinks, and non-canonical names. The legacy flat layout is not read: the harness itself rejects it, so a stray root-level `*.jsonl` can no longer be mistaken for a session.
- Decode every frame of a compressed session artifact. The harness writes `.jsonl.zstd` as a concatenated Zstandard container (one header frame plus one frame per durable batch), and Node's whole-file `zstdDecompressSync` silently returns only the first frame — measured on this baseline (4 frames / 256 bytes → 41 bytes, header only). `src/session-log.ts` scans the frame structure and decodes frame by frame, so `tool/call`/`tool/result` lines after the header are visible again; a torn final frame still yields every earlier frame, and a corrupt container degrades to `''` instead of throwing (the pre-fix tolerant contract).

### Changed

- Capability semantics: `stages.capability.status` now reflects what the headless task actually recorded instead of a structural false negative, so downstream `dsh-score` reads a real `observed`/`invoked`/`not-registered` verdict from new runs. Existing records and the `dsh-test-drive/v1` shape are unchanged (`DOMAIN_VERSION` stays `1`).

### Docs

- `THIRD_PARTY_NOTICES.md` records the MIT-licensed Zstandard frame scanner mirrored from DeepSeek Harness (`packages/session/session-persistence-jsonl/src/zstd.ts`, host `dsh-v0.1.5-alpha.1`) with the full MIT notice; `AGENTS.md` documents the new module; the five READMEs refresh the structured-result sample to `pluginVersion` `0.3.10`.
- New tests: `tests/session-log.spec.ts` covers the layout and decoding contract on synthetic fixtures only (two-level drill-down, `_no-cwd`, generation preference over newer mtimes, checksummed multi-frame containers, torn-tail recovery, tail truncation, empty/missing store, corrupt artifact, ignored flat legacy layout), and `tests/driver.spec.ts` closes the decode → `analyzeSessionLog` → `observed` loop through the driver.

## [0.3.9] - 2026-09-09

### Fixed

- Adapt the shared test harness to the DeepSeek Harness `0.1.5-alpha.1` seam: `Inbox` is now a type-only interface (the concrete class moved loop-internal), so the fake agent carries the official `unsupportedInbox()` shape — empty `nextTurn`/`nextStep` lists and six mutation methods that throw — instead of `new Inbox(...)`; `SubprocessHandle` no longer declares `pid`, so the scripted handle drops it. No plugin behavior change: `src/` never touched either API, and the 24 previously failing tests were all this one fixture cascade.

### Changed

- Pin the 13 `@deepseek-ai/dsh-*` devDependencies to `0.1.5-alpha.1`, widen the six `@deepseek-ai/dsh-*` peer ranges to `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0` (one band cannot resolve both prerelease lines under registry-driven resolution), and add `0.1.5-alpha.1` to `dshWorkshop.compatibility.dshVersions`. The seam re-check found no consumer-facing break: `DOMAIN_VERSION` stays `1` and the `dsh-test-drive/v1` record shape is unchanged, so `dsh-score` keeps reading existing `test_drive` records.
- Raise the compat workflow's `@deepseek-ai/dsh` CLI and `dsh-base`/`dsh-headless` profile installs to `0.1.5-alpha.1`, so the monthly compatibility job verifies the declared baseline.

### Docs

- Move the verified host baseline in all five READMEs to `dsh-v0.1.5-alpha.1` (2026-09-09: full gate chain + profile install smoke), record both published dependency lines and the composite peer range, refresh the `typecheck:ci` target, and update the structured-result sample (`harnessVersion` `0.1.5-alpha.1` / `pluginVersion` `0.3.9`).
- Align the repo `AGENTS.md` facts with the new baseline (peer line, harness peers, `typecheck:ci` target, storage-domain mounting).

## [0.3.8] - 2026-09-07

### Docs

- Fix the DSH plugin badge URL: shields.io rejects the four-segment static badge form with "404 badge not found"; the label now uses the documented double-dash form (`dsh--plugin`), rendering identically; no behavior change.

## [0.3.7] - 2026-09-07

### Fixed

- Align the `@deepseek-ai/dsh-*` peer ranges to `>=0.1.2-rc.1 <0.2.0`: the older `>=0.1.0-rc.8 <0.2.0` band resolved to only the `0.1.0-rc.8` prerelease under registry-driven resolution and broke fresh tarball installs; no behavior change.

### Docs

- Refresh the five-language README support-version wording: the verified GitHub tag `dsh-v0.1.3-alpha.1` now leads the compatibility claim, while npm `0.1.2-rc.1` stays the published dependency-pin line (peers `>=0.1.2-rc.1 <0.2.0`); no behavior change.


## [0.3.6] - 2026-09-04

### Changed

- Align the devDependency pins to the published dsh `0.1.2-rc.1` line (13 `@deepseek-ai/dsh-*` packages), the `dshWorkshop` compatibility list, and the compat workflow's CLI/base/headless installs; the five-language READMEs record the rc.1 facts. No behavior change (the seam re-check on the 0.1.3-alpha.1 checkout found no consumer-facing break; `DOMAIN_VERSION` stays `1`, so dsh-score keeps reading existing `test_drive` records unchanged).

## [0.3.5] - 2026-09-02

### Docs

- Sync the five-language READMEs to the 0.1.2-alpha.5 facts; no behavior change.

## [0.3.4] - 2026-09-02

### Changed

- Align the devDependency pins to the published dsh 0.1.2-alpha.5 line and re-verify the adaptation claims; no behavior change.

## [0.3.3] - 2026-09-01

### Changed

- Align the devDependency pins to the published dsh `0.1.2-alpha.3` line (14 `@deepseek-ai/dsh-*` packages), align `cordis`/`schemastery` to `^4.0.2`/`^3.18.2`, and raise the compat probe pins and `dshWorkshop.compatibility.dshVersions` to `0.1.2-alpha.3`. The real-CLI e2e anchor now expects `harnessVersion` `0.1.2-alpha.3`. No behavior change.

## [0.3.2] - 2026-08-30

### Changed

- Compatibility: verified against host checkout `0.1.2-alpha.1` (2026-08-30) — all 12 consumed seams unchanged; the five-language README compatibility tables note the verified checkout baseline while the published baseline stays `0.1.1-rc.2`. `storageDomain` remains deliberately optional: the published `dsh-base` bundle does not mount it, host HEAD does (since `3a4232a8fa`), and the plugin boots on either line.

### Fixed

- Test harness: derive synthetic tool-call ids from `tools.execute`'s input type instead of importing `CallId` (renamed to `ToolCallId` on host HEAD), keeping `typecheck` (checkout) and `typecheck:ci` (published `0.1.1-rc.2`) both green.

## [0.3.1] - 2026-08-29

### Changed

- Verification release: trusted publishing (npm provenance) enabled in the publish workflow; no code changes.

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
