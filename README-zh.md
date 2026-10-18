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

本项目是 [PerryLink](https://github.com/PerryLink) 维护的 DeepSeek Harness 插件家族成员：**87 个活跃维护**，名册共 **95** 个，其中 **5 个已冻结**、**3 个已退役**。完整名单默认折叠，避免每个 README 的首屏被长表淹没；点击展开可查看每一行，原因见「状态」列。

<details>
<summary>展开全部 95 个插件</summary>

| 插件 | 一句话 | 状态 |
|---|---|---|
| **[dsh-aqua-input-check](https://github.com/PerryLink/dsh-aqua-input-check)** | 水产养殖投入品记录核对（按投入品用量、休药期与起捕间隔核对记录自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-archive-check](https://github.com/PerryLink/dsh-archive-check)** | 档案归档完整性与保管期限核对（依据《档案法》及配套规定，仅提示差异，不作出定性结论） |  |
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | Second-model auto-review on the approval chain, fail-closed by default |  |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | Automatic strong/cheap model-tier routing with deterministic risk guards and a `/tier` command |  |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Durable background child agents with a Web UI sidebar, messaging and interrupt | 🚫 已退役 — 见仓库 README |
| **[dsh-bid-ca-precheck](https://github.com/PerryLink/dsh-bid-ca-precheck)** | 投标文件符合性预检（按招标文件逐条核对响应情况，仅提示差异，不作出定性结论） |  |
| **[dsh-bid-qual-check](https://github.com/PerryLink/dsh-bid-qual-check)** | 投标人资格条件核对（按资格条件与证明材料核对逐条响应，仅提示差异，不作出定性结论） |  |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | Cost governance for DeepSeek Harness: budgets, carbon, and latency in one panel. | 🧊 已冻结 — 见仓库 README |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** | Read-only MCP server exposing the certification registry: grades, snapshots and five-dimension evidence |  |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Claude Code /rewind-equivalent: snapshots, session forks, one-shot restore |  |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH | 🧊 已冻结 — 见仓库 README |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | Cross-platform native desktop control for DeepSeek Harness — Windows first. |  |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Terminal-style input history for the web composer: arrows, Ctrl+R search |  |
| **[dsh-contract-stance](https://github.com/PerryLink/dsh-contract-stance)** | 合同条款立场台账核对（按立场、风险等级与退让底线核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-customs-doc-check](https://github.com/PerryLink/dsh-customs-doc-check)** | 报关单证一致性核对（按公开的报关单填制规范核对单证间字段一致性，仅提示差异，不作出定性结论） |  |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | Dataset quality checks and citation cross-checks (the optional numeric bridge consumed here) |  |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | Prompt-injection, jailbreak, and secret-leak defense for DeepSeek Harness. | 🧊 已冻结 — 见仓库 README |
| **[dsh-demurrage-ledger](https://github.com/PerryLink/dsh-demurrage-ledger)** | 滞箱费台账核对（按免箱期与费率核对超期天数与金额的自洽性，仅提示差异，不作出定性结论） |  |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | Engineering-discipline guard: requirements grill, test gates, adversary review |  |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | Unified static-image generation routing for DeepSeek Harness. | 🧊 已冻结 — 见仓库 README |
| **[dsh-drill-script-check](https://github.com/PerryLink/dsh-drill-script-check)** | 应急演练脚本核对（按阶段、响应分级、指挥与资源要素核对脚本齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-eia-guide-check](https://github.com/PerryLink/dsh-eia-guide-check)** | 环评导则适用性核对（按要素、导则名称与执行标准核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-emergency-plan](https://github.com/PerryLink/dsh-emergency-plan)** | 应急预案要素齐备性与条款级页码定位（依据 GB/T 29639-2020 等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-essay-rubric-check](https://github.com/PerryLink/dsh-essay-rubric-check)** | 作文量表评分核对（按评分项、原文定位与分值算术核对评分自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-evidence-check](https://github.com/PerryLink/dsh-evidence-check)** | 证据清单齐备性核对（按待证事实与证据要素核对清单自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-export-ctl-check](https://github.com/PerryLink/dsh-export-ctl-check)** | 出口管制物项核对（按管制清单、最终用途与许可证核对台账齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** | Read-only performance diagnostics for DeepSeek Harness. |  |
| **[dsh-fmea-table-check](https://github.com/PerryLink/dsh-fmea-table-check)** | FMEA 分析表要素齐备性与风险顺序数一致性核对（按公开的 FMEA 方法标准核对表内自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-forecast-penalty](https://github.com/PerryLink/dsh-forecast-penalty)** | 预测准确率考核核对（按准确率、门槛与考核单价核对考核费用的算术自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** | Deterministic research reports for Chinese public mutual funds |  |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** | GitHub PR/issues integration for DSH, every write gated by approval |  |
| **[dsh-gongwen-flow-check](https://github.com/PerryLink/dsh-gongwen-flow-check)** | 公文流转与办理时限核对（按公开的公文处理规范核对环节完整性与时限，仅提示差异，不作出定性结论） |  |
| **[dsh-gongwen-word-check](https://github.com/PerryLink/dsh-gongwen-word-check)** | 公文格式要素核对（按公开的党政机关公文格式标准核对版头与主体要素，仅提示差异，不作出定性结论） |  |
| **[dsh-guard-plan-qc](https://github.com/PerryLink/dsh-guard-plan-qc)** | 劳动保护与安全防护用品配置表核对（按公开的配备标准核对品名规格与配置数量，仅提示差异，不作出定性结论） |  |
| **[dsh-hazchem-check](https://github.com/PerryLink/dsh-hazchem-check)** | 危险化学品临界量与重大危险源辨识核对（按储存量与临界量核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-hazplan-check](https://github.com/PerryLink/dsh-hazplan-check)** | HAZOP 分析表要素齐备性与偏差推导一致性核对（依据公开的危险与可操作性分析标准，仅提示差异，不作出定性结论） |  |
| **[dsh-hidden-risk-map](https://github.com/PerryLink/dsh-hidden-risk-map)** | 安全隐患台账→《工贸企业重大事故隐患判定标准》（应急管理部令第10号）条款映射提示（仅提示差异，不作出定性结论） |  |
| **[dsh-hs-classify](https://github.com/PerryLink/dsh-hs-classify)** | 商品归类层级一致性核对（按章、品目、子目与商品编号的层级关系核对自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-icd-rule-check](https://github.com/PerryLink/dsh-icd-rule-check)** | ICD 合并编码与星剑号配对提示（依据 GB/T 14396-2016 与公开的 ICD 使用说明，仅提示差异，不作出定性结论） |  |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** | Industry research orchestration that seals its deliverables through this plugin's `ctx.researchReport.assemble` |  |
| **[dsh-lawcite-adapter](https://github.com/PerryLink/dsh-lawcite-adapter)** | 法条引用与文书要素核对（按名称、条号、原文与效力状态核对引用可核验性，仅提示差异，不作出定性结论） |  |
| **[dsh-laya](https://github.com/PerryLink/dsh-laya)** | Laya typed decisions (`noul`/`choice`/`score`) as a first-class Cordis service and model-visible tools |  |
| **[dsh-lc-doc-check](https://github.com/PerryLink/dsh-lc-doc-check)** | 信用证单据条款核对（按单据种类、份数、期限与不符点核对交单自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-learning-gap-check](https://github.com/PerryLink/dsh-learning-gap-check)** | 能力差距与培养计划核对（按能力等级差、培养措施与完成期限核对台账闭环，仅提示差异，不作出定性结论） |  |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** | Local document knowledge base for DeepSeek Harness. |  |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** | Local-model (Ollama) integration for DeepSeek Harness. |  |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** | LSP diagnostics, formatting, completion, code actions and rename over language servers |  |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** | PII masking middleware: anonymize at the model boundary, restore at the display layer |  |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** | Read-only MCP runtime panel: /mcp command + Settings tab with status, tools and errors |  |
| **[dsh-medrec-qc](https://github.com/PerryLink/dsh-medrec-qc)** | 病案首页形式质控与逻辑矛盾提示（依据国卫办医发〔2016〕24号等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** | Approval-gated cross-session memory: ctx.memory seam + SQLite + memory tool |  |
| **[dsh-nsfc-form-check](https://github.com/PerryLink/dsh-nsfc-form-check)** | 国家自然科学基金申请书形式审查与匿名化提示（依据《国家自然科学基金条例》与申请人导入的当年指南，仅提示差异，不作出定性结论） |  |
| **[dsh-nurse-record-check](https://github.com/PerryLink/dsh-nurse-record-check)** | 护理记录时限、签名与评估表完整性校验（依据《病历书写基本规范》等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** | OpenTelemetry and Langfuse observability exporter for DeepSeek Harness. |  |
| **[dsh-origin-rvc-check](https://github.com/PerryLink/dsh-origin-rvc-check)** | 原产地区域价值成分核对（按 RVC 定义式与门槛核对原产地判定自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-ota-review-check](https://github.com/PerryLink/dsh-ota-review-check)** | 在线点评回复台账核对（按回复时限、问题分类与整改状态核对台账闭环，仅提示差异，不作出定性结论） |  |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** | Claude Code outputStyles-equivalent runtime style switching |  |
| **[dsh-paper-doc-adapter](https://github.com/PerryLink/dsh-paper-doc-adapter)** | 试卷解析结构核对（按题型、答案、分值与 yotta 标识核对试卷结构自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** | Claude Code-style declarative allow/deny/ask permission rules with audit |  |
| **[dsh-permit-report-check](https://github.com/PerryLink/dsh-permit-report-check)** | 行政许可办理核对（按申请材料、法定时限与决定记录核对台账闭环，仅提示差异，不作出定性结论） |  |
| **[dsh-pipeline-check](https://github.com/PerryLink/dsh-pipeline-check)** | 项目全流程文件链条核对（按环节先后与金额口径核对链条自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-pleading-draft](https://github.com/PerryLink/dsh-pleading-draft)** | 起诉状要素齐备性核对（按诉请、事实、证据、法条四要素核对文书齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** | Zero-dependency static + sandbox smoke detector for DSH plugins |  |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** | Plugin-development knowledge base as an on-demand agent skill |  |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** | Shared zero-runtime-dependency toolkit for the PerryLink DSH plugins |  |
| **[dsh-plugin-upgrade](https://github.com/PerryLink/dsh-plugin-upgrade)** | One-package, one-corridor-index plugin upgrade skill: routes a repository to the matching closed corridor card |  |
| **[dsh-policy-brief-draft](https://github.com/PerryLink/dsh-policy-brief-draft)** | 政策专报要素核对（按观点、依据、出处与建议核对专报齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-power-loss-split](https://github.com/PerryLink/dsh-power-loss-split)** | 线损电量拆分与考核表核对（依据公开的线损计算口径，仅提示差异，不作出定性结论） |  |
| **[dsh-power-ticket-check](https://github.com/PerryLink/dsh-power-ticket-check)** | 电力工作票要素齐备性与签发许可顺序核对（依据现行电力安全工作规程，仅提示差异，不作出定性结论） |  |
| **[dsh-ppap-check](https://github.com/PerryLink/dsh-ppap-check)** | PPAP 提交要素齐备性核对（按公开的 PPAP 手册与提交等级核对要素齐备与版本填写，仅提示差异，不作出定性结论） |  |
| **[dsh-protest-deadline](https://github.com/PerryLink/dsh-protest-deadline)** | 质疑与投诉期限核对（按公开的政府采购质疑投诉规定核对期限与台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-railway-window](https://github.com/PerryLink/dsh-railway-window)** | 铁路施工天窗台账核对（按时间窗、时长算术与命令号核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | Multi-channel approval/question bridge: WeChat/Telegram/Feishu, session console | 🧊 已冻结 — 见仓库 README |
| **[dsh-repair-order-qc](https://github.com/PerryLink/dsh-repair-order-qc)** | 维修工单结算核对（按项目金额、配件工时合计与结算总额核对算术自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | Verifiable research-report engine: content-addressed evidence ledger and sealed versions |  |
| **[dsh-review-reply-check](https://github.com/PerryLink/dsh-review-reply-check)** | 审稿意见逐条回应覆盖核对（按意见与回应一一对应核对覆盖完整性，仅提示差异，不作出定性结论） |  |
| **[dsh-rulefile-check](https://github.com/PerryLink/dsh-rulefile-check)** | 规则库文件自检核对（按条款引用纪律与效力上限核对规则库自身合规，仅提示差异，不作出定性结论） |  |
| **[dsh-safety-brief-check](https://github.com/PerryLink/dsh-safety-brief-check)** | 安全技术交底记录要素齐备性与签字闭环核对（依据公开的安全生产法规与检查标准，仅提示差异，不作出定性结论） |  |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | Multi-dimensional quality scoring for DeepSeek Harness plugins. |  |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Pin sessions in the Web sidebar with durable ordering | 🚫 已退役 — 见仓库 README |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | Cross-device session sync for DeepSeek Harness — a dedicated git mirror of your session store. |  |
| **[dsh-site-log-check](https://github.com/PerryLink/dsh-site-log-check)** | 监理日志跨日连续性与旁站覆盖提示（依据 GB/T 50319-2013 等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | Security-audit skill pack: secret scan, dependency and supply-chain review |  |
| **[dsh-soe-decision-check](https://github.com/PerryLink/dsh-soe-decision-check)** | 三重一大决策台账核对（按前置研究、会议审议与决议记录核对程序留痕，仅提示差异，不作出定性结论） |  |
| **[dsh-soilwater-check](https://github.com/PerryLink/dsh-soilwater-check)** | 土壤与地下水监测台账核对（按点位、监测项目、限值与超标判定核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-sop-sync-check](https://github.com/PerryLink/dsh-sop-sync-check)** | 作业规程与 FMEA／控制计划一致性核对（按编号与版本核对三份文件是否同步，仅提示差异，不作出定性结论） |  |
| **[dsh-spc-gbt-adapter](https://github.com/PerryLink/dsh-spc-gbt-adapter)** | 控制图常数与过程能力指数核对（按 GB/T 4091 的常规控制图常数表核对控制限与 Cp/Cpk 的自洽性，仅提示差异，不作出定性结论） |  |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | Voice-first session loop for DeepSeek Harness: talk to it, hear it answer. |  |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | Cross-session team rooms: shared message bus, task board and timeline | 🚫 已退役 — 见仓库 README |
| **[dsh-tender-extract](https://github.com/PerryLink/dsh-tender-extract)** | 招标文件条款摘录核对（按出处与原文逐字核对摘录完整性，仅提示差异，不作出定性结论） |  |
| **[dsh-tender-matrix](https://github.com/PerryLink/dsh-tender-matrix)** | 评标因素评分矩阵核对（按分值上限与合计核对矩阵自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | Isolated install-and-smoke test drives for DeepSeek Harness plugins. |  |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | TickTick/Dida365 task bridge: session-header panel + 11 tools |  |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | Vendor parameter translation and deterministic JSON repair for DeepSeek Harness. |  |
| **[dsh-warranty-calc](https://github.com/PerryLink/dsh-warranty-calc)** | 质保期与索赔金额核对（按质保期月数与里程、索赔金额算式核对自洽，仅提示差异，不作出定性结论） |  |

</details>

</details>

</details>## License（许可证）

[Apache-2.0](LICENSE)

### 从 DSH Desktop 市场安装

所有 PerryLink 插件均可在 DSH Desktop 内置市场中浏览：**市场 → 来源 → 添加来源 → 粘贴** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ 选中**。安装仍需通过市场的 npm 身份校验与你的确认。
