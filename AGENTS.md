# AGENTS.md

Standalone DeepSeek Harness plugin repository (`dsh-test-drive`). Development follows the dsh-plugin-guide skill and the official plugin contract; this file records repo-local decisions.

## Layout

- `src/capability.ts` — the capability-assertion stage's pure logic: task-text builder and the tolerant session-log analyzer (tool `tool/call` → `tool/result` pairing by `callId`; command invocation → reply scanning). Never throws on hostile or truncated logs.
- `src/index.ts` — function-plugin contract (`name`/`inject`/`Config`/`apply`; NO default export). Injects `tools`, `commands`, `subprocess`, `jobs`; `storageDomain` is deliberately OPTIONAL (`ctx.get`): the published `dsh-base` bundle (0.1.2-rc.1 line) does not mount it, while host HEAD mounts storage-domain (0.1.3-alpha.1) — the plugin must still boot on the published line, so report persistence degrades to disabled with a logged reason when the service is absent.
- `src/config.ts` — Schemastery schema + explicit `resolveConfig` (no hidden `?? default` in `run()` paths); every default and bound is re-judged there so plain-JS mounts fail loud too.
- `src/result.ts` — the structured result contract `dsh-test-drive/v1`. The zod schemas are the single source of truth: `z.infer` types the runtime, the same schemas validate records at the durable boundary of the `test_drive` storage domain. Any record-shape change bumps `DOMAIN_VERSION` in `src/domain.ts` — EXCEPT backward-compatible additions: the capability stage shipped as an OPTIONAL `stages.capability` field (pre-capability records still validate and dsh-score keeps reading them), so no domain bump.
- `src/workspace.ts` — temp-directory ownership (§0.2 discipline): `mkdtemp` roots under the OS temp dir with the `dsh-test-drive-` prefix, a live registry, dry-run logging before any mutation, and the quarantine-rename → delete cleanup ladder. `assertOwned` refuses anything that is not a registered direct child of the OS temp dir with the owned prefix.
- `src/driver.ts` — the `dsh` CLI driver: config-override/PATH/npm-shim location, argv-only spawning (never a shell — hostile specs stay argv entries), the allowBuilds retry, dump-layer parsing, and boot-failure markers.
- `src/drive.ts` — the single-target pipeline; cleanup runs in a `finally` on success, failure, timeout, and abort. `src/batch.ts` — the `drive-batch` job producer over `ctx.jobs`. `src/tools.ts` / `src/command.ts` — the two tools and `/testdrive`.
- `tests/` — vitest; real Cordis `Context` + real `SessionStore`/`Session`/`ToolRuntime`/`AgentRegistry`/`LocalJobRegistry`/`Storage`+`DomainFacility` from the `0.1.2-rc.1` peers; the subprocess provider is a scripted subclass of the REAL `SubprocessRuntime` (or the real `LocalSubprocessRuntime` in `e2e.spec.ts`).

## Hard rules applied here

- **§0.2 red lines are load-bearing.** Cleanup only ever targets directories this plugin created and still tracks; the dry-run plan (absolute paths) is logged before any mutation; removal is quarantine-first; nothing scans `%TEMP%`, foreign prefixes, or the real home. The ownership assertions are unit-tested with hostile paths.
- **Isolation by construction.** Every drive runs inside one owned temp root: throwaway `DSH_HOME` (child env `DSH_HOME`), throwaway cwd, redirected pnpm store (`npm_config_store_dir`). The host profile is never read or written; the structured record asserts `isolation.hostHomeTouched: false`.
- **Credentials never leak.** Child env is the provider's scrubbed base plus `DSH_HOME`/store entries plus explicitly named `forwardEnv` variables; values are never logged, and every report string passes the sanitizers (token literals, URL credentials, bearer headers, temp paths, byte-capped tails).
- **Model-visible ⟺ logged.** The only model-visible content is tool output (durable `tool/result`) and job progress/notices (the jobs runtime); the plugin registers no session events and never injects agent context.
- **Registration = effect.** Tools and the command register through `ctx.tools.register` / `ctx.commands.register` inside `ctx.effect`; the domain closes and the temp registry sweeps leftovers through effect disposers.
- **Waterfall discipline.** This plugin registers no waterfall listeners today; if it ever does, allow/passthrough MUST call `next()`.
- **Loud misconfiguration.** Out-of-bounds numbers, invalid env names, and bad profile names fail `resolveConfig` at load, never silently.

## Checks

`pnpm run typecheck && pnpm run typecheck:ci && pnpm test && pnpm run build && pnpm run verify:self-contained && pnpm run verify:artifacts && pnpm pack`

- `typecheck` resolves `@deepseek-ai/*` through tsconfig paths to the local harness checkout; `typecheck:ci` clears the paths and checks against the published `0.1.2-rc.1` types. Both must stay green.
- `test` runs the scripted suites (fileParallelism off: leftover-scan assertions observe the shared OS temp dir). Real-CLI evidence: `DSH_TESTDRIVE_E2E=1 pnpm run test:e2e` (needs network + `dsh`/`pnpm` on PATH) — this drives the package's own checkout through the real loop.
- `verify:artifacts` proves the tarball's ESM face imports under plain Node and the bundle patch ships.

## Release

`node scripts/release.mjs <x.y.z>` bumps package.json + `src/version.ts`, stamps the CHANGELOG `[Unreleased]` section, re-runs the full gate, and commits + tags (never pushes). `git push origin main --follow-tags` triggers `.github/workflows/release.yml`, which re-runs the gate, publishes to npm with provenance, and creates the GitHub Release from the stamped CHANGELOG section.

## Docs

- Five-language READMEs (`README.md`, `README.zh.md`, `README.es.md`, `README.pt.md`, `README.hi.md`) — keep all five in sync; the English file is the source of truth.
- GitHub topics mirror `package.json` keywords (`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `plugin-testing`, `install-smoke`, `compatibility-matrix`, `ci`).
- License is Apache-2.0 (`LICENSE` + the package.json `license` field). `THIRD_PARTY_NOTICES.md` documents the runtime/build dependencies.
