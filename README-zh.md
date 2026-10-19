<div align="center">

# 🧪 dsh-test-drive
- **1024 商店渠道**：先 `npm i -g dsh1024`，再 `dsh1024 plugin --profile web add dsh-test-drive`（计入 [deepseek1024.com](https://deepseek1024.com) 安装排行）。

**面向 DeepSeek Harness 插件的隔离式安装冒烟实测。**

*在一次性 profile 中完成安装、冒烟、验证与清理——绝不触碰你真实的 `~/.dsh`。*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-test-drive)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![dsh-doctor](https://raw.githubusercontent.com/PerryLink/dsh-plugin-doctor/main/badges/PerryLink__dsh-test-drive.svg)](https://github.com/PerryLink/dsh-plugin-doctor#verified-徽章)
[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-zh.svg)](https://dsh.market/)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-test-drive/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-test-drive/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-test-drive?label=version)](https://github.com/PerryLink/dsh-test-drive/releases)
[![npm version](https://img.shields.io/npm/v/dsh-test-drive)](https://www.npmjs.com/package/dsh-test-drive)
[![npm downloads](https://img.shields.io/npm/dm/dsh-test-drive)](https://www.npmjs.com/package/dsh-test-drive)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

```sh
dsh plugin --profile <name> add dsh-test-drive
```


</div>

---


**📖 生态实测知识库**（实测数据，不是营销）：[插件开发指南 · 选型实测数据 · 维护取舍判据](https://perrylink.github.io/dsh-plugin-guide/)。

<!-- star-cta -->
## Install & uninstall（安装与卸载）

```sh
dsh plugin --profile web add dsh-test-drive     # 安装（npm）——或上面的 git 形式
dsh plugin --profile web remove dsh-test-drive  # 卸载
```

## ⭐ 如果它帮到了你

这个插件是 [DSH 插件家族](https://github.com/PerryLink)的一员（95 个，全部 Apache-2.0）。如果你在用，**给个 star** —— 它不会解锁任何功能，但会让下一个人在搜索里更容易找到它。

*English:* part of a 95 plugin family for DeepSeek Harness. If it is useful, **a star helps the next person find it** — nothing is gated behind it.

## What is dsh-test-drive?

面向 DeepSeek Harness 插件的隔离式安装冒烟实测。

在一次性 profile 中完成安装、冒烟、验证与清理——绝不触碰你真实的 `~/.dsh`。

![dsh-test-drive 终端演示：dsh-test-drive — one isolated install-and-smoke drive](https://raw.githubusercontent.com/PerryLink/dsh-test-drive/main/docs/assets/dsh-test-drive-hero.png)

![Animated terminal demo of dsh-test-drive](https://raw.githubusercontent.com/PerryLink/dsh-test-drive/main/docs/assets/dsh-test-drive-demo.gif)

*同一次运行，动图版。*

## Compatibility（兼容性）

| 组件 | 版本 |
|---|---|
| DeepSeek Harness | **`dsh-v0.2.1-alpha.1`**（GitHub tag，2026-09-11 已核验：完整门禁链 + profile 安装冒烟）。npm 依赖线 `0.1.2-rc.1` 与 `0.1.7-rc.2`（peer 依赖 `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0`）。 |
| Node.js | `^22.19.0 \|\| >=24.0.0` |
| 包管理器 | `pnpm@11.7.0` |
| 平台 | Windows / macOS / Linux（纯 host 插件） |
| 外部工具 | PATH 上的 `dsh` CLI（自动探测，可解析 npm shim）、PATH 上的 `pnpm` |

## What you get（你能得到什么）

- `test_drive` 工具 —— 单个目标跑完整流水线：`dsh plugin add` → `--dump-config` patch 校验 → headless 引导冒烟（FAILED 标记扫描 + 可选一句任务）→ 可选能力断言 → `dsh plugin remove` → 隔离清理。同步返回结构化记录；传 `background: true` 则返回 `{ kind: 'background', jobId }`。
- `/testdrive` 命令 —— 把空格/逗号分隔的目标列表作为 `drive-batch` 后台任务（`ctx.jobs`）批量跑，产出矩阵报告（JSON + Markdown）。
- `drive_report` 工具 —— 按 id 取回任意单次记录（`tdr_...`）、矩阵（`tdm_...`）或最新矩阵；以 Markdown 渲染。
- 能力断言 —— 不止于“启动并退出”：可选的 `capability` 阶段让 agent 调用指定工具（或运行 `/command`），并核对持久会话日志确实记录了调用、观察输出包含 `expect`。干净启动只是冒烟；`observed` 才证明具名能力真实可用。
- 结构化结果 —— 每条记录带判别符 `schema: "dsh-test-drive/v1"`，关键字段均为一级字段：`stages.install.status`（`pass`/`fail`）、`stages.smoke.status`（`pass`/`fail`/`boot-ok`/`skipped`）、各阶段 `durationMs`、脱敏后的 `summary`/`outputTail` 以及总判定 `verdict`（`pass`/`fail`/`partial`/`unknown`）。这是下游评分方（dsh-score）消费的机器可读契约。
- 结构安全 —— 每个临时目录都由本插件以专属前缀 `dsh-test-drive-` 创建、登记在活跃所有权注册表中，且只经「dry-run → 隔离改名 → 删除」阶梯清理。宿主机 profile 永不被读取或写入。

## Quick start（快速开始）

### git 通道

```sh
dsh plugin --profile web add github:PerryLink/dsh-test-drive#<commit-sha>
```

首次 `add` 会因 pnpm 拦截该包的 `prepare` 构建而失败；把 pnpm 打印的精确键复制进 profile 的 `pnpm-workspace.yaml` 后重跑：

```yaml
allowBuilds:
  'dsh-test-drive': true
```

### npm 通道

```sh
dsh plugin --profile web add dsh-test-drive
```

预构建包无需构建许可。重启 profile 后，即可在会话中使用 `test_drive` / `/testdrive`。

## DSH Desktop 不是受支持的测试宿主

`test_drive` 需要一个能启动**第二个** headless DSH 进程的 `dsh` CLI。DSH Desktop 的
`dsh.CMD` 只允许 `dsh plugin …`、`--dump-config` 和 `--version`，会按策略拒绝第二次
headless 启动。请把 `config.dshBin` 指向 npm/pnpm 安装的 `dsh` CLI（或普通 Node + dsh
JS 入口）。现在的报错会明确说明这一点，而不是“cannot parse npm shim”。

## Configuration（配置）

所有键均可选（下列为默认值）；非法值在加载期响亮失败。

| 键 | 默认值 | 说明 |
|---|---|---|
| `profileName` | `headless` | 每次一次性 DSH_HOME 内初始化的 profile 模板（base + headless bundles）。 |
| `dshBin` | `""` | dsh 可执行文件的绝对路径覆盖；为空则自动探测 PATH 上的 `dsh`。 |
| `headlessTask` | `"Reply with exactly: ok"` | 引导冒烟阶段的一句任务；为空则跳过该阶段。 |
| `forwardEnv` | `[]` | 转发进测试 profile 子进程的环境变量**名**（绝不转发值）。 |
| `allowBuilds` | `true` | 在测试 profile 中放行被拦截的 git `prepare` 构建并重试一次安装。 |
| `installTimeoutMs` | `600000` | `dsh plugin add` 阶段时限。 |
| `configTimeoutMs` | `60000` | `--dump-config` 阶段时限。 |
| `smokeTimeoutMs` | `300000` | headless 引导冒烟阶段时限。 |
| `capabilityTimeoutMs` | `300000` | 能力断言任务时限。
| `capability.enabled` | `false` | 运行能力断言阶段（注册 → 调用 → 观察到）。
| `capability.kind` | `tool` | 断言对象：`tool` 或 `command`。
| `capability.name` | `""` | 工具或命令名（不带前导 `/`）。
| `capability.args` | `""` | 调用文本：工具参数（JSON 风格）或命令参数。
| `capability.expect` | `""` | 期望出现在观察输出中的字面量（不区分大小写子串）。
| `uninstallTimeoutMs` | `120000` | `dsh plugin remove` 阶段时限。 |
| `outputTailBytes` | `8000` | 每阶段记录的脱敏输出尾部上限（字节）。 |
| `keepTempDirs` | `false` | 失败时保留临时目录供取证（所有权被放弃，由你清理）。 |
| `maxBatchTargets` | `20` | `/testdrive` 批上限。 |
| `batchConcurrency` | `1` | 批并发度（串行可避免 pnpm-store 争用）。 |

## Tools & surfaces（工具与界面）

### `test_drive`

```
test_drive(target: string, headlessTask?: string, background?: boolean,
  capability?: { kind: 'tool' | 'command', name: string,
                 args: string, expect: string })
```

- `target` —— git 规格（`github:owner/repo#sha`、`git+https://...`）、npm 包名、本地路径或 `.tgz` 压缩包。
- `capability` —— 冒烟后的断言：agent 以 `args` 调用 `name`（tool）或运行 `/name`（command）；阶段读取持久会话日志并要求观察输出包含 `expect`。需要 `DEEPSEEK_API_KEY`（宿主环境或 `forwardEnv`）；缺失时该阶段为 `skipped`，绝不算失败。
- 返回完整结构化记录，样例见下。
- `background: true` 启动一个 `drive-batch` 任务并返回其 id。

### `/testdrive <目标...>`

启动一个后台批任务；进度经任务输出流式推送，最后一行给出供 `drive_report` 使用的矩阵 id。

### `drive_report(id?)`

返回单次记录（`tdr_...`）、矩阵（`tdm_...`），或不传 id 时返回最新矩阵。

### 结构化结果样例

```json
{
  "schema": "dsh-test-drive/v1",
  "run": { "runId": "tdr_9f2c...", "startedAt": "2026-08-16T00:00:00.000Z",
           "finishedAt": "2026-08-16T00:00:45.120Z", "durationMs": 45120,
           "harnessVersion": "0.1.7-rc.2", "pluginVersion": "0.3.10",
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

判定规则：安装失败、启动失败（`smoke.fail`）或能力阶段到达 `not-registered`/`failed` ⇒ `fail`；安装通过 + patch 生效 + 启动干净（`pass`/`boot-ok`）+ 卸载通过 ⇒ `pass`（`observed` 时附能力说明）；已安装但后续保证缺失 ⇒ `partial`；其余 ⇒ `unknown`。

## CI (GitHub Actions)

仓库内置一个 composite [`action.yml`](action.yml)，可在任意插件仓库里 `uses:` 复用：它在一次性隔离 profile 里驱动目标，并输出 CI 消费的报告对 —— Markdown（PR 评论）与 JUnit XML（状态检查）。输入 `target`（必填）/`headless-task`/`dsh-version`；输出 `markdown`/`junit`/`verdict`。驱动本身无需密钥；只有 capability 断言需要 `DEEPSEEK_API_KEY`，缺省时该阶段 `skipped` 而非失败。

## Permissions & data（权限与数据）

- 只消费公开服务：`ctx.subprocess`、`ctx.jobs`、`ctx.storageDomain`、`ctx.tools`、`ctx.commands`。
- 报告存于 `test_drive` storage-domain（表 `runs`、`matrices`；latest-matrix 指针）。组合中没有 `storageDomain` 时（如官方 headless profile），工具照常工作，报告持久化被禁用并记录原因。
- 子进程继承的是**已剥离凭据**的环境：除非你在 `forwardEnv` 中显式点名，宿主机密钥永远不会进入被测 profile；值永不落日志。
- 所有报告/日志字符串都经纯函数脱敏：令牌字面量、URL 凭据与 bearer 头被涂红，临时根路径被替换为 `<testdrive-temp>`，输出尾部按字节封顶。

## Security boundaries（安全边界）

- **隔离**：每次实测在 OS 临时目录下全新 `mkdtemp` 根内进行：一次性 `DSH_HOME`、一次性工作目录、重定向的 pnpm store。被测插件代码只在那个 profile 中运行；宿主机 profile 不受影响。
- **所有权**：活跃注册表记录本插件实例创建的每个根目录。清理会拒绝任何「非注册的、不在 OS 临时目录直接子级、不携带 `dsh-test-drive-` 前缀」的路径——不扫 `%TEMP%` 全量、不碰他人前缀、不碰真实家目录。
- **清理阶梯**：任何变更前先打印完整 dry-run 计划（绝对路径）。删除先把根目录改名为 `dsh-test-drive-quarantine-<时间戳>` 隔离目录，核验后再删；失败则目录保持隔离并如实上报，绝不静默丢弃。成功、失败、超时、中止的所有路径都在 `finally` 中执行清理，插件卸载时再次清扫。
- **`allowBuilds` 是真实权限**：放行 git 包的 `prepare` 构建意味着在安装时执行该包的代码。放行范围仅限一次性 profile，但仍只测你信任的目标，并固定 commit。
- **headless 冒烟默认无密钥**：启动检查不需要凭据；完成一句任务才需要。要转发凭据请显式配置 `forwardEnv`，且绝不记录其值。

## Known limitations（已知限制）

- 安装 registry/git 目标需要子进程 `dsh`/pnpm 具备网络访问。
- 冒烟任务需要模型凭据才能到 `pass`；没有时如实上报 `boot-ok`。
- 没有 `storageDomain` 的组合不持久化报告（`drive_report` 会诚实报错）。
- `dsh` 必须能在 PATH 上定位（或配置 `dshBin`）；Windows 下自动解析 npm 的 `.cmd`/`.bat` shim，若只解析到 `.ps1` 会要求配置 `dshBin`。
- 批默认串行执行；提高 `batchConcurrency` 只影响 pnpm-store 磁盘争用，不影响正确性。

## Development（开发）

```sh
pnpm install
pnpm run typecheck && pnpm run typecheck:ci && pnpm test
pnpm run build && pnpm run verify:self-contained && pnpm run verify:artifacts && pnpm pack
```

- `typecheck` 经本地 harness checkout 解析 `@deepseek-ai/*`；`typecheck:ci` 对照已发布的 `0.1.7-rc.2` 类型检查。
- 测试使用真实 `Context`/`Session`/`ToolRuntime`/`LocalJobRegistry`/storage 栈 + 脚本化 subprocess provider。
- 真实 CLI 端到端（需网络 + PATH 上的 `dsh`）：`DSH_TESTDRIVE_E2E=1 pnpm run test:e2e` —— 用真实安装冒烟循环实测本包自身 checkout。
- 发布：`node scripts/release.mjs <x.y.z>`（升版本、CHANGELOG 落日期、重跑门禁、commit + tag；不 push）。

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `plugin-testing`, `install-smoke`, `compatibility-matrix`, `ci`

## Contributors（贡献者）

[PerryLink](https://github.com/PerryLink) —— 设计与实现。

## PerryLink DSH Plugin Family

本项目是 [PerryLink](https://github.com/PerryLink) 维护的 DeepSeek Harness 插件家族成员。完整名单默认折叠，避免每个 README 的首屏被长表淹没；点击展开可查看每一行及其状态。

<details>
<summary>展开全部插件</summary>

| 插件 | 状态 |
|---|---|
| **[dsh-aqua-input-check](https://github.com/PerryLink/dsh-aqua-input-check)** |  |
| **[dsh-archive-check](https://github.com/PerryLink/dsh-archive-check)** |  |
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** |  |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** |  |
| **[dsh-bid-ca-precheck](https://github.com/PerryLink/dsh-bid-ca-precheck)** |  |
| **[dsh-bid-qual-check](https://github.com/PerryLink/dsh-bid-qual-check)** |  |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** |  |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** |  |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** |  |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** |  |
| **[dsh-contract-stance](https://github.com/PerryLink/dsh-contract-stance)** |  |
| **[dsh-customs-doc-check](https://github.com/PerryLink/dsh-customs-doc-check)** |  |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** |  |
| **[dsh-demurrage-ledger](https://github.com/PerryLink/dsh-demurrage-ledger)** |  |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** |  |
| **[dsh-drill-script-check](https://github.com/PerryLink/dsh-drill-script-check)** |  |
| **[dsh-eia-guide-check](https://github.com/PerryLink/dsh-eia-guide-check)** |  |
| **[dsh-emergency-plan](https://github.com/PerryLink/dsh-emergency-plan)** |  |
| **[dsh-essay-rubric-check](https://github.com/PerryLink/dsh-essay-rubric-check)** |  |
| **[dsh-evidence-check](https://github.com/PerryLink/dsh-evidence-check)** |  |
| **[dsh-export-ctl-check](https://github.com/PerryLink/dsh-export-ctl-check)** |  |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** |  |
| **[dsh-fmea-table-check](https://github.com/PerryLink/dsh-fmea-table-check)** |  |
| **[dsh-forecast-penalty](https://github.com/PerryLink/dsh-forecast-penalty)** |  |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** |  |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** |  |
| **[dsh-gongwen-flow-check](https://github.com/PerryLink/dsh-gongwen-flow-check)** |  |
| **[dsh-gongwen-word-check](https://github.com/PerryLink/dsh-gongwen-word-check)** |  |
| **[dsh-guard-plan-qc](https://github.com/PerryLink/dsh-guard-plan-qc)** |  |
| **[dsh-hazchem-check](https://github.com/PerryLink/dsh-hazchem-check)** |  |
| **[dsh-hazplan-check](https://github.com/PerryLink/dsh-hazplan-check)** |  |
| **[dsh-hidden-risk-map](https://github.com/PerryLink/dsh-hidden-risk-map)** |  |
| **[dsh-hs-classify](https://github.com/PerryLink/dsh-hs-classify)** |  |
| **[dsh-icd-rule-check](https://github.com/PerryLink/dsh-icd-rule-check)** |  |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** |  |
| **[dsh-lawcite-adapter](https://github.com/PerryLink/dsh-lawcite-adapter)** |  |
| **[dsh-laya](https://github.com/PerryLink/dsh-laya)** |  |
| **[dsh-lc-doc-check](https://github.com/PerryLink/dsh-lc-doc-check)** |  |
| **[dsh-learning-gap-check](https://github.com/PerryLink/dsh-learning-gap-check)** |  |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** |  |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** |  |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** |  |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** |  |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** |  |
| **[dsh-medrec-qc](https://github.com/PerryLink/dsh-medrec-qc)** |  |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** |  |
| **[dsh-nsfc-form-check](https://github.com/PerryLink/dsh-nsfc-form-check)** |  |
| **[dsh-nurse-record-check](https://github.com/PerryLink/dsh-nurse-record-check)** |  |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** |  |
| **[dsh-origin-rvc-check](https://github.com/PerryLink/dsh-origin-rvc-check)** |  |
| **[dsh-ota-review-check](https://github.com/PerryLink/dsh-ota-review-check)** |  |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** |  |
| **[dsh-paper-doc-adapter](https://github.com/PerryLink/dsh-paper-doc-adapter)** |  |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** |  |
| **[dsh-permit-report-check](https://github.com/PerryLink/dsh-permit-report-check)** |  |
| **[dsh-pipeline-check](https://github.com/PerryLink/dsh-pipeline-check)** |  |
| **[dsh-pleading-draft](https://github.com/PerryLink/dsh-pleading-draft)** |  |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** |  |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** |  |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** |  |
| **[dsh-plugin-upgrade](https://github.com/PerryLink/dsh-plugin-upgrade)** |  |
| **[dsh-policy-brief-draft](https://github.com/PerryLink/dsh-policy-brief-draft)** |  |
| **[dsh-power-loss-split](https://github.com/PerryLink/dsh-power-loss-split)** |  |
| **[dsh-power-ticket-check](https://github.com/PerryLink/dsh-power-ticket-check)** |  |
| **[dsh-ppap-check](https://github.com/PerryLink/dsh-ppap-check)** |  |
| **[dsh-protest-deadline](https://github.com/PerryLink/dsh-protest-deadline)** |  |
| **[dsh-railway-window](https://github.com/PerryLink/dsh-railway-window)** |  |
| **[dsh-repair-order-qc](https://github.com/PerryLink/dsh-repair-order-qc)** |  |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** |  |
| **[dsh-review-reply-check](https://github.com/PerryLink/dsh-review-reply-check)** |  |
| **[dsh-rulefile-check](https://github.com/PerryLink/dsh-rulefile-check)** |  |
| **[dsh-safety-brief-check](https://github.com/PerryLink/dsh-safety-brief-check)** |  |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** |  |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** |  |
| **[dsh-site-log-check](https://github.com/PerryLink/dsh-site-log-check)** |  |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** |  |
| **[dsh-soe-decision-check](https://github.com/PerryLink/dsh-soe-decision-check)** |  |
| **[dsh-soilwater-check](https://github.com/PerryLink/dsh-soilwater-check)** |  |
| **[dsh-sop-sync-check](https://github.com/PerryLink/dsh-sop-sync-check)** |  |
| **[dsh-spc-gbt-adapter](https://github.com/PerryLink/dsh-spc-gbt-adapter)** |  |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** |  |
| **[dsh-tender-extract](https://github.com/PerryLink/dsh-tender-extract)** |  |
| **[dsh-tender-matrix](https://github.com/PerryLink/dsh-tender-matrix)** |  |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** |  |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** |  |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** |  |
| **[dsh-warranty-calc](https://github.com/PerryLink/dsh-warranty-calc)** |  |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | 🧊 已冻结 — 见仓库 README |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | 🧊 已冻结 — 见仓库 README |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | 🧊 已冻结 — 见仓库 README |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | 🧊 已冻结 — 见仓库 README |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | 🧊 已冻结 — 见仓库 README |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | 🚫 已退役 — 见仓库 README |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | 🚫 已退役 — 见仓库 README |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | 🚫 已退役 — 见仓库 README |

</details>

## License（许可证）

[Apache-2.0](LICENSE)

### 从 DSH Desktop 市场安装

所有 PerryLink 插件均可在 DSH Desktop 内置市场中浏览：**市场 → 来源 → 添加来源 → 粘贴** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ 选中**。安装仍需通过市场的 npm 身份校验与你的确认。
