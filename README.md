<div align="center">

# 🧪 dsh-test-drive
- **1024 store channel**: `npm i -g dsh1024` once, then `dsh1024 plugin --profile web add dsh-test-drive` (counts toward the [deepseek1024.com](https://deepseek1024.com) install ranking).
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-test-drive)

**Isolated install-and-smoke test drives for DeepSeek Harness plugins.**

*Install, smoke, verify, and clean up in a throwaway profile — your real `~/.dsh` stays untouched.*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh-plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-test-drive/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-test-drive/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-test-drive?label=version)](https://github.com/PerryLink/dsh-test-drive/releases)
[![npm version](https://img.shields.io/npm/v/dsh-test-drive)](https://www.npmjs.com/package/dsh-test-drive)
[![npm downloads](https://img.shields.io/npm/dm/dsh-test-drive)](https://www.npmjs.com/package/dsh-test-drive)

[English](README.md) · [简体中文](README.zh.md) · [Español](README.es.md) · [Português](README.pt.md) · [हिन्दी](README.hi.md)

</div>

---

## Compatibility

| Component | Version |
|---|---|
| DeepSeek Harness | `0.1.2-alpha.5` (adapted 2026-09-02; peer dependencies ≥ 0.1.0-rc.8) |
| Node.js | `^22.19.0 \|\| >=24.0.0` |
| Package manager | `pnpm@11.7.0` |
| Platform | Windows / macOS / Linux (host-only plugin) |
| External tools | `dsh` CLI on PATH (auto-detected, npm shims parsed), `pnpm` on PATH |

## What you get

- `test_drive` tool — one target through the complete pipeline: `dsh plugin add` → `--dump-config` patch check → headless boot smoke (FAILED-marker scan + optional one-shot task) → optional capability assertion → `dsh plugin remove` → quarantined cleanup. Returns the structured record synchronously, or `{ kind: 'background', jobId }` with `background: true`.
- `/testdrive` command — batch drive of a whitespace/comma-separated target list as a `drive-batch` background job over `ctx.jobs`, producing a matrix report (JSON + Markdown).
- `drive_report` tool — fetch any stored run (`tdr_...`), matrix (`tdm_...`), or the latest matrix; rendered as Markdown.
- Capability assertion — beyond "booted and exited": the optional `capability` stage drives one headless task that calls a named tool (or runs a `/command`) and verifies the durable session log recorded the invocation and the observed output contains `expect`. A clean boot is only a smoke test; `observed` proves a named capability really works.
- Structured results — every record carries the discriminator `schema: "dsh-test-drive/v1"` with first-class fields: `stages.install.status` (`pass`/`fail`), `stages.smoke.status` (`pass`/`fail`/`boot-ok`/`skipped`), `stages.capability.status` (`observed`/`invoked`/`not-registered`/`skipped`/`failed`), per-stage `durationMs`, sanitized `summary`/`outputTail`, and an overall `verdict` (`pass`/`fail`/`partial`/`unknown`). This is the machine-readable contract downstream scorers (dsh-score) consume.
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
| `capabilityTimeoutMs` | `300000` | Capability-assertion task deadline. |
| `capability.enabled` | `false` | Run the capability-assertion stage (registered → invoked → observed). |
| `capability.kind` | `tool` | What to assert: `tool` or `command`. |
| `capability.name` | `""` | Tool or command name (no leading `/`). |
| `capability.args` | `""` | Invocation text: tool arguments (JSON-ish) or command words. |
| `capability.expect` | `""` | Literal expected in the observed output (case-insensitive substring). |
| `uninstallTimeoutMs` | `120000` | `dsh plugin remove` stage deadline. |
| `outputTailBytes` | `8000` | Cap on the sanitized output tail recorded per stage. |
| `keepTempDirs` | `false` | Keep temp dirs on failure for forensics (ownership is dropped; you clean up). |
| `maxBatchTargets` | `20` | `/testdrive` batch cap. |
| `batchConcurrency` | `1` | Batch concurrency (serial avoids pnpm-store contention). |

## Tools & surfaces

### `test_drive`

```
test_drive(target: string, headlessTask?: string, background?: boolean,
           capability?: { kind: 'tool' | 'command', name: string,
                          args: string, expect: string })
```

- `target` — git spec (`github:owner/repo#sha`, `git+https://...`), npm name, local path, or `.tgz` tarball.
- `capability` — assertion after the boot smoke: the agent calls `name` (tool) or runs `/name` (command) with `args`; the stage reads the durable session log and requires the observed output to contain `expect`. Needs `DEEPSEEK_API_KEY` (host env or `forwardEnv`); without it the stage is `skipped`, never failed.
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
           "harnessVersion": "0.1.1-rc.2", "pluginVersion": "0.1.0",
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
    "capability": { "status": "observed", "exitCode": 0, "durationMs": 8123, "attempts": 1,
                    "summary": "tool \"plugin_vet\" called and its result contains the expectation",
                    "outputTail": "", "capabilityKind": "tool", "name": "plugin_vet",
                    "expectMatched": true,
                    "detail": "tool \"plugin_vet\" called and its result contains the expectation" },
    "uninstall": { "status": "pass", "exitCode": 0, "durationMs": 5123, "attempts": 1,
                   "summary": "remove ok (exit 0)", "outputTail": "" },
    "cleanup":   { "status": "pass", "quarantined": true, "removed": true,
                   "summary": "owned temp root quarantined and removed" }
  },
  "verdict": "pass",
  "verdictReason": "install, patch, boot, and uninstall verified; headless task inconclusive (see smoke.summary)"
}
```

Verdict rules: install failure, boot failure (`smoke.fail`), or a capability stage that reached `not-registered`/`failed` ⇒ `fail`; install pass + patch effective + clean boot (`pass`/`boot-ok`) + uninstall pass ⇒ `pass` (with a capability note when `observed`); anything installed but missing a later assurance ⇒ `partial`; otherwise `unknown`.

## CI (GitHub Actions)

The repository ships a composite [`action.yml`](action.yml) that reuses `dsh-test-drive` in any plugin repo. It drives a target in an isolated throwaway profile and emits the report pair CI consumes: Markdown (PR comment) and JUnit XML (test reporter / status check).

```yaml
# .github/workflows/test-drive.yml
name: test-drive
on: [pull_request, workflow_dispatch]
jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Drive this plugin
        id: drive
        uses: PerryLink/dsh-test-drive@v0.2.4
        with:
          target: github:${{ github.repository }}#${{ github.sha }}
      - name: Publish JUnit
        uses: EnricoMi/publish-unit-test-result-action@v2
        with:
          files: ${{ steps.drive.outputs.junit }}
      - name: Comment the report
        run: cat "${{ steps.drive.outputs.markdown }}"
```

`action.yml` inputs: `target` (required), `headless-task` (optional smoke task), `dsh-version` (the `dsh` CLI spec). Outputs: `markdown`, `junit` (report paths), and `verdict` (`pass`/`fail`/`partial`/`unknown`). The drive itself stays keyless (install → patch check → boot smoke → uninstall → cleanup); a capability assertion is the only stage that needs `DEEPSEEK_API_KEY`, and it is `skipped`, never failed, without one.

The same report pair is available programmatically: `renderDriveResult` / `renderMatrix` (Markdown) and `renderDriveJUnitXml` / `renderMatrixJUnitXml` (JUnit) are exported from the package root over a settled `DriveResult` or `MatrixRecord`.

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

- `typecheck` resolves `@deepseek-ai/*` through the local harness checkout; `typecheck:ci` checks against the published `0.1.2-alpha.5` types.
- Tests use the real `Context`/`Session`/`ToolRuntime`/`LocalJobRegistry`/storage stack with a scripted subprocess provider.
- Real-CLI end-to-end (requires network + `dsh` on PATH): `DSH_TESTDRIVE_E2E=1 pnpm run test:e2e` — drives this package's own checkout through the real install-smoke loop.
- Release: `node scripts/release.mjs <x.y.z>` (bumps, stamps CHANGELOG, re-runs the gate, commits + tags; never pushes).

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `plugin-testing`, `install-smoke`, `compatibility-matrix`, `ci`

## Contributors

[PerryLink](https://github.com/PerryLink) — design and implementation.

## PerryLink DSH Plugin Family

This project is one of the [33 DeepSeek Harness plugins](https://github.com/PerryLink) maintained by [PerryLink](https://github.com/PerryLink). If this one helps you, the others likely will too:

| Plugin | One-liner |
|---|---|
| **[dsh-dsh-auto-review](https://github.com/PerryLink/dsh-dsh-auto-review)** | Second-model auto-review on the approval chain, fail-closed by default | |
| **[dsh-dsh-background-agents](https://github.com/PerryLink/dsh-dsh-background-agents)** | Durable background child agents with a Web UI sidebar, messaging and interrupt | |
| **[dsh-dsh-budget](https://github.com/PerryLink/dsh-dsh-budget)** | Cost governance for DeepSeek Harness: budgets, carbon, and latency in one panel. | |
| **[dsh-dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-dsh-checkpoint-rewind)** | Claude Code /rewind-equivalent: snapshots, session forks, one-shot restore | |
| **[dsh-dsh-claude-move](https://github.com/PerryLink/dsh-dsh-claude-move)** | Migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH | |
| **[dsh-dsh-click](https://github.com/PerryLink/dsh-dsh-click)** | Cross-platform native desktop control for DeepSeek Harness — Windows first. | |
| **[dsh-dsh-composer-history](https://github.com/PerryLink/dsh-dsh-composer-history)** | Terminal-style input history for the web composer: arrows, Ctrl+R search | |
| **[dsh-dsh-data-quality](https://github.com/PerryLink/dsh-dsh-data-quality)** | Dataset quality checks and citation cross-checks (the optional numeric bridge consumed here) | |
| **[dsh-dsh-defend](https://github.com/PerryLink/dsh-dsh-defend)** | Prompt-injection, jailbreak, and secret-leak defense for DeepSeek Harness. | |
| **[dsh-dsh-doublecheck](https://github.com/PerryLink/dsh-dsh-doublecheck)** | Engineering-discipline guard: requirements grill, test gates, adversary review | |
| **[dsh-dsh-draw](https://github.com/PerryLink/dsh-dsh-draw)** | Unified static-image generation routing for DeepSeek Harness. | |
| **[dsh-dsh-fast](https://github.com/PerryLink/dsh-dsh-fast)** | Read-only performance diagnostics for DeepSeek Harness. | |
| **[dsh-dsh-fund-research](https://github.com/PerryLink/dsh-dsh-fund-research)** | Deterministic research reports for Chinese public mutual funds | |
| **[dsh-dsh-github](https://github.com/PerryLink/dsh-dsh-github)** | GitHub PR/issues integration for DSH, every write gated by approval | |
| **[dsh-dsh-industry-research](https://github.com/PerryLink/dsh-dsh-industry-research)** | Industry research orchestration that seals its deliverables through this plugin's `ctx.researchReport.assemble` | |
| **[dsh-dsh-library](https://github.com/PerryLink/dsh-dsh-library)** | Local document knowledge base for DeepSeek Harness. | |
| **[dsh-dsh-local-ai](https://github.com/PerryLink/dsh-dsh-local-ai)** | Local-model (Ollama) integration for DeepSeek Harness. | |
| **[dsh-dsh-lsp-actions](https://github.com/PerryLink/dsh-dsh-lsp-actions)** | LSP diagnostics, formatting, completion, code actions and rename over language servers | |
| **[dsh-dsh-mask](https://github.com/PerryLink/dsh-dsh-mask)** | PII masking middleware: anonymize at the model boundary, restore at the display layer | |
| **[dsh-dsh-mcp-panel](https://github.com/PerryLink/dsh-dsh-mcp-panel)** | Read-only MCP runtime panel: /mcp command + Settings tab with status, tools and errors | |
| **[dsh-dsh-memento](https://github.com/PerryLink/dsh-dsh-memento)** | Approval-gated cross-session memory: ctx.memory seam + SQLite + memory tool | |
| **[dsh-dsh-observe](https://github.com/PerryLink/dsh-dsh-observe)** | OpenTelemetry and Langfuse observability exporter for DeepSeek Harness. | |
| **[dsh-dsh-output-styles](https://github.com/PerryLink/dsh-dsh-output-styles)** | Claude Code outputStyles-equivalent runtime style switching | |
| **[dsh-dsh-permission-rules](https://github.com/PerryLink/dsh-dsh-permission-rules)** | Claude Code-style declarative allow/deny/ask permission rules with audit | |
| **[dsh-dsh-plugin-guide](https://github.com/PerryLink/dsh-dsh-plugin-guide)** | Plugin-development knowledge base as an on-demand agent skill | |
| **[dsh-dsh-research-report](https://github.com/PerryLink/dsh-dsh-research-report)** | Verifiable research-report engine: content-addressed evidence ledger and sealed versions | |
| **[dsh-dsh-score](https://github.com/PerryLink/dsh-dsh-score)** | Multi-dimensional quality scoring for DeepSeek Harness plugins. | |
| **[dsh-dsh-session-pin](https://github.com/PerryLink/dsh-dsh-session-pin)** | Pin sessions in the Web sidebar with durable ordering | |
| **[dsh-dsh-session-sync](https://github.com/PerryLink/dsh-dsh-session-sync)** | Cross-device session sync for DeepSeek Harness — a dedicated git mirror of your session store. | |
| **[dsh-dsh-skill-pack-security](https://github.com/PerryLink/dsh-dsh-skill-pack-security)** | Security-audit skill pack: secret scan, dependency and supply-chain review | |
| **[dsh-dsh-talk](https://github.com/PerryLink/dsh-dsh-talk)** | Voice-first session loop for DeepSeek Harness: talk to it, hear it answer. | |
| **[dsh-dsh-translate](https://github.com/PerryLink/dsh-dsh-translate)** | Vendor parameter translation and deterministic JSON repair for DeepSeek Harness. | |

## License

[Apache-2.0](LICENSE)
