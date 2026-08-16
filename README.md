# dsh-test-drive

Isolated install-and-smoke test drives for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugins. Given a repo or npm package, it installs the target into a **throwaway `DSH_HOME` profile**, verifies the bundle patch and boot logs, records a **structured pass/fail result**, and removes everything it created — never touching your real `~/.dsh`.

**一句话定位 (中文)**: 在一次性隔离 DSH_HOME 中自动完成插件"安装 → 引导冒烟 → 卸载清理"实测并产出结构化结果矩阵。

[Español](README.es.md) · [Português](README.pt.md) · [हिन्दी](README.hi.md) · [中文](README.zh.md)

## Compatibility

| Component | Version |
|---|---|
| DeepSeek Harness | `0.1.0-rc.6` (peer dependencies pinned) |
| Node.js | `^22.19.0 \|\| >=24.0.0` |
| Package manager | `pnpm@11.7.0` |
| Platform | Windows / macOS / Linux (host-only plugin) |
| External tools | `dsh` CLI on PATH (auto-detected, npm shims parsed), `pnpm` on PATH |

## What you get

- `test_drive` tool — one target through the complete pipeline: `dsh plugin add` → `--dump-config` patch check → headless boot smoke (FAILED-marker scan + optional one-shot task) → `dsh plugin remove` → quarantined cleanup. Returns the structured record synchronously, or `{ kind: 'background', jobId }` with `background: true`.
- `/testdrive` command — batch drive of a whitespace/comma-separated target list as a `drive-batch` background job over `ctx.jobs`, producing a matrix report (JSON + Markdown).
- `drive_report` tool — fetch any stored run (`tdr_...`), matrix (`tdm_...`), or the latest matrix; rendered as Markdown.
- Structured results — every record carries the discriminator `schema: "dsh-test-drive/v1"` with first-class fields: `stages.install.status` (`pass`/`fail`), `stages.smoke.status` (`pass`/`fail`/`boot-ok`/`skipped`), per-stage `durationMs`, sanitized `summary`/`outputTail`, and an overall `verdict` (`pass`/`fail`/`partial`/`unknown`). This is the machine-readable contract downstream scorers (dsh-score) consume.
- Safety by construction — every temp directory is created by this plugin under a dedicated `dsh-test-drive-` prefix, tracked in a live ownership registry, and removed only through a dry-run → quarantine-rename → delete ladder. The host profile is never read or written.

## Quick start

### Git channel

```sh
dsh plugin --profile web add github:PerryLink/dsh-test-drive#<commit-sha>
```

The first `add` fails because pnpm blocks the package's `prepare` build; copy the exact key pnpm printed into the profile's `pnpm-workspace.yaml` and re-run:

```yaml
allowBuilds:
  'dsh-test-drive': true
```

### npm channel

```sh
dsh plugin --profile web add dsh-test-drive
```

Prebuilt packages need no build allowance. Restart the profile, then use `test_drive` / `/testdrive` from a session.

## Install & uninstall

```sh
dsh plugin --profile web add dsh-test-drive     # install (npm) — or the git form above
dsh plugin --profile web remove dsh-test-drive  # uninstall
```

## Configuration

All keys are optional (defaults shown); invalid values fail loudly at load.

| Key | Default | Description |
|---|---|---|
| `profileName` | `headless` | Profile template initialized inside each throwaway DSH_HOME (base + headless bundles). |
| `dshBin` | `""` | Absolute dsh executable override; empty auto-detects `dsh` on PATH. |
| `headlessTask` | `"Reply with exactly: ok"` | One-shot task for the boot-smoke stage; empty skips the stage. |
| `forwardEnv` | `[]` | Environment VARIABLE NAMES (never values) forwarded into test-profile child processes. |
| `allowBuilds` | `true` | Allowlist a blocked git `prepare` build in the test profile and retry the install once. |
| `installTimeoutMs` | `600000` | `dsh plugin add` stage deadline. |
| `configTimeoutMs` | `60000` | `--dump-config` stage deadline. |
| `smokeTimeoutMs` | `300000` | Headless boot-smoke stage deadline. |
| `uninstallTimeoutMs` | `120000` | `dsh plugin remove` stage deadline. |
| `outputTailBytes` | `8000` | Cap on the sanitized output tail recorded per stage. |
| `keepTempDirs` | `false` | Keep temp dirs on failure for forensics (ownership is dropped; you clean up). |
| `maxBatchTargets` | `20` | `/testdrive` batch cap. |
| `batchConcurrency` | `1` | Batch concurrency (serial avoids pnpm-store contention). |

## Tools & surfaces

### `test_drive`

```
test_drive(target: string, headlessTask?: string, background?: boolean)
```

- `target` — git spec (`github:owner/repo#sha`, `git+https://...`), npm name, local path, or `.tgz` tarball.
- Returns the full structured record; see the sample below.
- `background: true` starts a `drive-batch` job and returns its id.

### `/testdrive <targets...>`

Starts one background batch job; progress streams through the job output, and the final line names the matrix id for `drive_report`.

### `drive_report(id?)`

Returns a run record (`tdr_...`), a matrix (`tdm_...`), or — with no id — the latest matrix.

### Structured result sample

```json
{
  "schema": "dsh-test-drive/v1",
  "run": { "runId": "tdr_9f2c...", "startedAt": "2026-08-16T00:00:00.000Z",
           "finishedAt": "2026-08-16T00:00:45.120Z", "durationMs": 45120,
           "harnessVersion": "0.1.0-rc.6", "pluginVersion": "0.1.0",
           "platform": "win32", "node": "v22.22.3" },
  "target": { "kind": "repo", "spec": "github:owner/dsh-click#abc123",
              "resolved": { "packageName": "dsh-click", "packageVersion": "0.1.0",
                            "hasBundleManifest": true } },
  "isolation": { "tempDshHome": true, "tempWorkspace": true, "tempStore": true,
                 "hostHomeTouched": false },
  "stages": {
    "install":   { "status": "pass", "exitCode": 0, "durationMs": 30412, "attempts": 2,
                   "summary": "install ok after allowBuilds allowance", "outputTail": "",
                   "allowBuildsNeeded": true },
    "config":    { "status": "pass", "exitCode": 0, "durationMs": 2310, "attempts": 1,
                   "summary": "dump ok (exit 0)", "outputTail": "",
                   "patchEffective": true, "layers": ["dsh-click"] },
    "smoke":     { "status": "boot-ok", "exitCode": 1, "durationMs": 4123, "attempts": 1,
                   "summary": "booted without loader failures; headless task did not complete (credentials/model unreachable)",
                   "outputTail": "", "bootFailed": false, "taskCompleted": false },
    "uninstall": { "status": "pass", "exitCode": 0, "durationMs": 5123, "attempts": 1,
                   "summary": "remove ok (exit 0)", "outputTail": "" },
    "cleanup":   { "status": "pass", "quarantined": true, "removed": true,
                   "summary": "owned temp root quarantined and removed" }
  },
  "verdict": "pass",
  "verdictReason": "install, patch, boot, and uninstall verified; headless task inconclusive (see smoke.summary)"
}
```

Verdict rules: install failure or boot failure (`smoke.fail`) ⇒ `fail`; install pass + patch effective + clean boot (`pass`/`boot-ok`) + uninstall pass ⇒ `pass`; anything installed but missing a later assurance ⇒ `partial`; otherwise `unknown`.

## Permissions & data

- Only public services are consumed: `ctx.subprocess`, `ctx.jobs`, `ctx.storageDomain`, `ctx.tools`, `ctx.commands`.
- Reports are stored in the `test_drive` storage-domain (tables `runs`, `matrices`; latest-matrix pointer). When the composition has no `storageDomain` (e.g. the shipped headless profile), tools still work and report persistence is disabled with a logged reason.
- Child processes inherit a credential-scrubbed environment: host secrets never reach a tested profile unless you explicitly name them in `forwardEnv`. Values are never logged.
- All report/log strings pass through pure sanitizers: token literals, URL credentials, and bearer headers are redacted, temp-root paths are replaced with `<testdrive-temp>`, and tails are byte-capped.

## Security boundaries

- **Isolation.** Each drive runs inside a fresh `mkdtemp` root under the OS temp dir: a throwaway `DSH_HOME`, a throwaway working directory, and a redirected pnpm store. The tested plugin's code only ever runs in that profile; your host profile is untouched.
- **Ownership.** A live registry records every root this plugin instance creates. Cleanup refuses anything that is not a registered direct child of the OS temp dir carrying the `dsh-test-drive-` prefix — no `%TEMP%` sweeps, no foreign prefixes, no real-home paths.
- **Cleanup ladder.** Before any mutation the full dry-run plan is logged (absolute paths). Removal renames the root into a `dsh-test-drive-quarantine-<ts>` directory first, verifies, then deletes; failures leave the directory quarantined and reported, never silently dropped. Cleanup runs in a `finally` on success, failure, timeout, and abort, and again on plugin teardown.
- **`allowBuilds` is a real permission.** Allowing a git package's `prepare` build executes that package's code at install time. The allowance is scoped to the throwaway profile only, but only test targets you trust, and pin commits.
- **Headless smoke is keyless by default.** The boot check needs no credentials; completing the one-shot task does. Forward credentials explicitly (`forwardEnv`) and never log them.

## Known limitations

- Installing registry/git targets requires network access from the child `dsh`/pnpm processes.
- The smoke task needs model credentials to reach `pass`; without them it reports the honest `boot-ok`.
- In compositions without `storageDomain`, reports are not persisted (`drive_report` fails honestly).
- `dsh` must be locatable on PATH (or set `dshBin`); on Windows the npm `.cmd`/`.bat` shim is parsed automatically, a bare `.ps1` resolution asks for `dshBin`.
- Batches default to serial execution; raising `batchConcurrency` shares the pnpm-store disk, not correctness.

## Development

```sh
pnpm install
pnpm run typecheck && pnpm run typecheck:ci && pnpm test
pnpm run build && pnpm run verify:self-contained && pnpm run verify:artifacts && pnpm pack
```

- `typecheck` resolves `@deepseek-ai/*` through the local harness checkout; `typecheck:ci` checks against the published `0.1.0-rc.6` types.
- Tests use the real `Context`/`Session`/`ToolRuntime`/`LocalJobRegistry`/storage stack with a scripted subprocess provider.
- Real-CLI end-to-end (requires network + `dsh` on PATH): `DSH_TESTDRIVE_E2E=1 pnpm run test:e2e` — drives this package's own checkout through the real install-smoke loop.
- Release: `node scripts/release.mjs <x.y.z>` (bumps, stamps CHANGELOG, re-runs the gate, commits + tags; never pushes).

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `plugin-testing`, `install-smoke`, `compatibility-matrix`, `ci`

## Contributors

[PerryLink](https://github.com/PerryLink) — design and implementation.

## License

[Apache-2.0](LICENSE)
