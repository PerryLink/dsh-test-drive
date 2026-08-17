<div align="center">

# 🧪 dsh-test-drive

**面向 DeepSeek Harness 插件的隔离式安装冒烟实测。**

*在一次性 profile 中完成安装、冒烟、验证与清理——绝不触碰你真实的 `~/.dsh`。*

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

## Compatibility（兼容性）

| 组件 | 版本 |
|---|---|
| DeepSeek Harness | `0.1.0-rc.6`（peer 依赖钉版） |
| Node.js | `^22.19.0 \|\| >=24.0.0` |
| 包管理器 | `pnpm@11.7.0` |
| 平台 | Windows / macOS / Linux（纯 host 插件） |
| 外部工具 | PATH 上的 `dsh` CLI（自动探测，可解析 npm shim）、PATH 上的 `pnpm` |

## What you get（你能得到什么）

- `test_drive` 工具 —— 单个目标跑完整流水线：`dsh plugin add` → `--dump-config` patch 校验 → headless 引导冒烟（FAILED 标记扫描 + 可选一句任务）→ `dsh plugin remove` → 隔离清理。同步返回结构化记录；传 `background: true` 则返回 `{ kind: 'background', jobId }`。
- `/testdrive` 命令 —— 把空格/逗号分隔的目标列表作为 `drive-batch` 后台任务（`ctx.jobs`）批量跑，产出矩阵报告（JSON + Markdown）。
- `drive_report` 工具 —— 按 id 取回任意单次记录（`tdr_...`）、矩阵（`tdm_...`）或最新矩阵；以 Markdown 渲染。
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

## Install & uninstall（安装与卸载）

```sh
dsh plugin --profile web add dsh-test-drive     # 安装（npm）——或上面的 git 形式
dsh plugin --profile web remove dsh-test-drive  # 卸载
```

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
| `uninstallTimeoutMs` | `120000` | `dsh plugin remove` 阶段时限。 |
| `outputTailBytes` | `8000` | 每阶段记录的脱敏输出尾部上限（字节）。 |
| `keepTempDirs` | `false` | 失败时保留临时目录供取证（所有权被放弃，由你清理）。 |
| `maxBatchTargets` | `20` | `/testdrive` 批上限。 |
| `batchConcurrency` | `1` | 批并发度（串行可避免 pnpm-store 争用）。 |

## Tools & surfaces（工具与界面）

### `test_drive`

```
test_drive(target: string, headlessTask?: string, background?: boolean)
```

- `target` —— git 规格（`github:owner/repo#sha`、`git+https://...`）、npm 包名、本地路径或 `.tgz` 压缩包。
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

判定规则：安装失败或启动失败（`smoke.fail`）⇒ `fail`；安装通过 + patch 生效 + 启动干净（`pass`/`boot-ok`）+ 卸载通过 ⇒ `pass`；已安装但后续保证缺失 ⇒ `partial`；其余 ⇒ `unknown`。

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

- `typecheck` 经本地 harness checkout 解析 `@deepseek-ai/*`；`typecheck:ci` 对照已发布的 `0.1.0-rc.6` 类型检查。
- 测试使用真实 `Context`/`Session`/`ToolRuntime`/`LocalJobRegistry`/storage 栈 + 脚本化 subprocess provider。
- 真实 CLI 端到端（需网络 + PATH 上的 `dsh`）：`DSH_TESTDRIVE_E2E=1 pnpm run test:e2e` —— 用真实安装冒烟循环实测本包自身 checkout。
- 发布：`node scripts/release.mjs <x.y.z>`（升版本、CHANGELOG 落日期、重跑门禁、commit + tag；不 push）。

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `plugin-testing`, `install-smoke`, `compatibility-matrix`, `ci`

## Contributors（贡献者）

[PerryLink](https://github.com/PerryLink) —— 设计与实现。

## PerryLink DSH Plugin Family

本项目是由 [PerryLink](https://github.com/PerryLink) 维护的 [29 个 DeepSeek Harness 插件](https://github.com/PerryLink)之一。如果这个对你有用，其他插件很可能也会：

| Plugin | One-liner |
|---|---|
| [dsh-auto-review](https://github.com/PerryLink/dsh-auto-review) | 审批链上的第二模型自动审查，默认失败关闭 |
| [dsh-background-agents](https://github.com/PerryLink/dsh-background-agents) | 持久化后台子代理，带 Web UI 侧边栏、消息与打断 |
| [dsh-budget](https://github.com/PerryLink/dsh-budget) | DeepSeek Harness 的成本治理：预算、碳排与延迟一屏呈现。 |
| [dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind) | Claude Code /rewind 等价物：快照、会话分叉、一次性恢复 |
| [dsh-claude-move](https://github.com/PerryLink/dsh-claude-move) | 将 Claude Code 会话、记忆、技能与 CLAUDE.md 迁入 DSH |
| [dsh-click](https://github.com/PerryLink/dsh-click) | 跨平台原生桌面控制（DeepSeek Harness），Windows 优先。 |
| [dsh-composer-history](https://github.com/PerryLink/dsh-composer-history) | Web 输入框的终端式输入历史：方向键、Ctrl+R 搜索 |
| [dsh-defend](https://github.com/PerryLink/dsh-defend) | DeepSeek Harness 的提示注入、越狱与密钥泄露防护。 |
| [dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck) | 工程纪律门禁：需求质询、测试门禁、对抗式审查 |
| [dsh-draw](https://github.com/PerryLink/dsh-draw) | DeepSeek Harness 的统一静态图像生成路由。 |
| [dsh-fast](https://github.com/PerryLink/dsh-fast) | DeepSeek Harness 的只读性能诊断。 |
| [dsh-github](https://github.com/PerryLink/dsh-github) | DSH 的 GitHub PR/issue 集成，每次写入都经审批门 |
| [dsh-library](https://github.com/PerryLink/dsh-library) | DeepSeek Harness 的本地文档知识库。 |
| [dsh-local-ai](https://github.com/PerryLink/dsh-local-ai) | DeepSeek Harness 的本地模型（Ollama）接入。 |
| [dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions) | 经语言服务器的 LSP 诊断、格式化、补全、代码操作与重命名 |
| [dsh-mask](https://github.com/PerryLink/dsh-mask) | DeepSeek Harness 的 PII 脱敏中间件——数据到模型前匿名化，展示层还原。 |
| [dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel) | 只读 MCP 运行时面板：/mcp 命令 + 带状态、工具与错误的设置页 |
| [dsh-memento](https://github.com/PerryLink/dsh-memento) | 带审批门的跨会话记忆：ctx.memory 接缝 + SQLite + memory 工具 |
| [dsh-observe](https://github.com/PerryLink/dsh-observe) | DeepSeek Harness 的 OpenTelemetry 与 Langfuse 可观测导出器。 |
| [dsh-output-styles](https://github.com/PerryLink/dsh-output-styles) | Claude Code outputStyles 等价的运行时样式切换 |
| [dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules) | Claude Code 风格声明式 allow/deny/ask 权限规则，带审计 |
| [dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide) | 按需 agent 技能形式的插件开发知识库 |
| [dsh-score](https://github.com/PerryLink/dsh-score) | DeepSeek Harness 插件的多指标质量评分。 |
| [dsh-session-pin](https://github.com/PerryLink/dsh-session-pin) | 在 Web 侧边栏置顶会话，顺序持久化 |
| [dsh-session-sync](https://github.com/PerryLink/dsh-session-sync) | DeepSeek Harness 的跨设备会话同步——会话存储的专用 git 镜像。 |
| [dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security) | 安全审计技能包：密钥扫描、依赖与供应链审查 |
| [dsh-talk](https://github.com/PerryLink/dsh-talk) | DeepSeek Harness 的语音优先会话闭环：对它说，听它答。 |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | DeepSeek Harness 插件的隔离式安装冒烟实测。 |
| [dsh-translate](https://github.com/PerryLink/dsh-translate) | DeepSeek Harness 的厂商参数翻译与确定性 JSON 修复。 |

## License（许可证）

[Apache-2.0](LICENSE)
