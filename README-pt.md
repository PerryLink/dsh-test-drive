<div align="center">

# 🧪 dsh-test-drive
- **Canal 1024 store**: `npm i -g dsh1024` uma vez, depois `dsh1024 plugin --profile web add dsh-test-drive` (conta para o ranking de instalações do [deepseek1024.com](https://deepseek1024.com)).

**Testes isolados de instalação e inicialização para plugins do DeepSeek Harness.**

*Instale, teste, verifique e limpe em um perfil descartável — seu `~/.dsh` real permanece intocado.*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-test-drive)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![dsh-doctor](https://raw.githubusercontent.com/PerryLink/dsh-plugin-doctor/main/badges/PerryLink__dsh-test-drive.svg)](https://github.com/PerryLink/dsh-plugin-doctor#verified-徽章)
[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-en.svg)](https://dsh.market/)
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


**📖 Base de conhecimento do ecossistema** — dados medidos, não marketing: [guia de desenvolvimento · dados de seleção · critérios de manutenção](https://perrylink.github.io/dsh-plugin-guide/).

<!-- star-cta -->
## Install & uninstall (Instalação e desinstalação)

```sh
dsh plugin --profile web add dsh-test-drive     # instalar (npm) — ou a forma git acima
dsh plugin --profile web remove dsh-test-drive  # desinstalar
```

## ⭐ 如果它帮到了你

Este plugin faz parte da [família de plugins DSH](https://github.com/PerryLink) (mais de 40, todos Apache-2.0). Se for útil, **deixe uma estrela**: não desbloqueia nada, mas ajuda a próxima pessoa a encontrá-lo.

*English:* part of a 95 plugin family for DeepSeek Harness. If it is useful, **a star helps the next person find it** — nothing is gated behind it.

## What is dsh-test-drive?

Testes isolados de instalação e inicialização para plugins do DeepSeek Harness.

Instale, teste, verifique e limpe em um perfil descartável — seu `~/.dsh` real permanece intocado.

![Demonstração de terminal do dsh-test-drive: dsh-test-drive — one isolated install-and-smoke drive](https://raw.githubusercontent.com/PerryLink/dsh-test-drive/main/docs/assets/dsh-test-drive-hero.png)

![Animated terminal demo of dsh-test-drive](https://raw.githubusercontent.com/PerryLink/dsh-test-drive/main/docs/assets/dsh-test-drive-demo.gif)

*A mesma execução, animada.*

## Compatibility (Compatibilidade)

| Componente | Versão |
|---|---|
| DeepSeek Harness | **`dsh-v0.2.1-alpha.1`** (tag do GitHub, verificado em 2026-09-11: cadeia completa de portas + smoke de instalação de perfil). Linhas de dependência npm `0.1.2-rc.1` e `0.1.7-rc.2` (dependências de pares `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0`). |
| Node.js | `^22.19.0 \|\| >=24.0.0` |
| Gerenciador de pacotes | `pnpm@11.7.0` |
| Plataforma | Windows / macOS / Linux (plugin apenas host) |
| Ferramentas externas | CLI `dsh` no PATH (autodetecção, shims npm analisados), `pnpm` no PATH |

## What you get (O que você obtém)

- Ferramenta `test_drive` — um alvo pelo pipeline completo: `dsh plugin add` → verificação do patch com `--dump-config` → inicialização headless (varredura de marcadores FAILED + tarefa opcional de uma frase) → asserção de capacidade opcional → `dsh plugin remove` → limpeza em quarentena. Retorna o registro estruturado de forma síncrona, ou `{ kind: 'background', jobId }` com `background: true`.
- Comando `/testdrive` — lote de alvos separados por espaços/vírgulas como tarefa em segundo plano `drive-batch` sobre `ctx.jobs`, produzindo um relatório matricial (JSON + Markdown).
- Ferramenta `drive_report` — busca qualquer execução (`tdr_...`), matriz (`tdm_...`) ou a matriz mais recente; renderizada em Markdown.
- Asserção de capacidade — além de “inicializou e saiu”: a etapa opcional `capability` faz o agente chamar a ferramenta nomeada (ou executar `/command`) e verifica no registro durável de sessão que a invocação ocorreu e que a saída observada contém `expect`. Uma inicialização limpa é só um teste de fumaça; `observed` prova que uma capacidade nomeada realmente funciona.
- Resultados estruturados — cada registro carrega o discriminador `schema: "dsh-test-drive/v1"` com campos de primeira classe: `stages.install.status` (`pass`/`fail`), `stages.smoke.status` (`pass`/`fail`/`boot-ok`/`skipped`), `durationMs` por etapa, `summary`/`outputTail` saneados e um `verdict` geral (`pass`/`fail`/`partial`/`unknown`). Este é o contrato legível por máquina consumido pelos pontuadores (dsh-score).
- Segurança por construção — cada diretório temporário é criado por este plugin sob um prefixo dedicado `dsh-test-drive-`, registrado em um registro de propriedade ativo e removido apenas pela escada dry-run → renomear para quarentena → excluir. O perfil do host nunca é lido nem gravado.

## Quick start (Início rápido)

### Canal git

```sh
dsh plugin --profile web add github:PerryLink/dsh-test-drive#<commit-sha>
```

O primeiro `add` falha porque o pnpm bloqueia a compilação `prepare` do pacote; copie a chave exata que o pnpm imprimiu no `pnpm-workspace.yaml` do perfil e execute novamente:

```yaml
allowBuilds:
  'dsh-test-drive': true
```

### Canal npm

```sh
dsh plugin --profile web add dsh-test-drive
```

Pacotes pré-compilados não precisam de permissão de compilação. Reinicie o perfil e use `test_drive` / `/testdrive` em uma sessão.

## Configuration (Configuração)

Todas as chaves são opcionais (padrões exibidos); valores inválidos falham ruidosamente no carregamento.

| Chave | Padrão | Descrição |
|---|---|---|
| `profileName` | `headless` | Modelo de perfil inicializado dentro de cada DSH_HOME descartável (bundles base + headless). |
| `dshBin` | `""` | Caminho absoluto que substitui o executável dsh; vazio autodetecta `dsh` no PATH. |
| `headlessTask` | `"Reply with exactly: ok"` | Tarefa de uma frase para a etapa de inicialização; vazio pula a etapa. |
| `forwardEnv` | `[]` | NOMES de variáveis de ambiente (nunca valores) repassados aos processos filhos do perfil de teste. |
| `allowBuilds` | `true` | Permite uma compilação `prepare` de git bloqueada no perfil de teste e tenta a instalação mais uma vez. |
| `installTimeoutMs` | `600000` | Prazo da etapa `dsh plugin add`. |
| `configTimeoutMs` | `60000` | Prazo da etapa `--dump-config`. |
| `smokeTimeoutMs` | `300000` | Prazo da etapa de inicialização headless. |
| `capabilityTimeoutMs` | `300000` | Prazo da tarefa de asserção de capacidade.
| `capability.enabled` | `false` | Executa a etapa de asserção de capacidade (registrado → invocado → observado).
| `capability.kind` | `tool` | O que afirmar: `tool` ou `command`.
| `capability.name` | `""` | Nome da ferramenta ou comando (sem a `/` inicial).
| `capability.args` | `""` | Texto de invocação: argumentos da ferramenta (estilo JSON) ou palavras do comando.
| `capability.expect` | `""` | Literal esperado na saída observada (substring sem distinção de maiúsculas).
| `uninstallTimeoutMs` | `120000` | Prazo da etapa `dsh plugin remove`. |
| `outputTailBytes` | `8000` | Limite da cauda de saída saneada registrada por etapa. |
| `keepTempDirs` | `false` | Mantém os diretórios temporários em caso de falha para análise forense (a propriedade é abandonada; você limpa). |
| `maxBatchTargets` | `20` | Limite de lote do `/testdrive`. |
| `batchConcurrency` | `1` | Concorrência do lote (serial evita contenção no armazenamento pnpm). |

## Tools & surfaces (Ferramentas e superfícies)

### `test_drive`

```
test_drive(target: string, headlessTask?: string, background?: boolean,
  capability?: { kind: 'tool' | 'command', name: string,
                 args: string, expect: string })
```

- `target` — especificação git (`github:owner/repo#sha`, `git+https://...`), nome npm, caminho local ou tarball `.tgz`.
- `capability` — asserção após o smoke: o agente chama `name` (ferramenta) com `args` ou executa `/name` (comando); a etapa lê o registro durável de sessão e exige que a saída observada contenha `expect`. Requer `DEEPSEEK_API_KEY` (ambiente do host ou `forwardEnv`); sem ela, a etapa fica `skipped`, nunca falha.
- Retorna o registro estruturado completo; exemplo abaixo.
- `background: true` inicia uma tarefa `drive-batch` e retorna seu id.

### `/testdrive <alvos...>`

Inicia uma tarefa de lote em segundo plano; o progresso flui pela saída da tarefa e a última linha nomeia o id da matriz para o `drive_report`.

### `drive_report(id?)`

Retorna um registro de execução (`tdr_...`), uma matriz (`tdm_...`) ou — sem id — a matriz mais recente.

### Exemplo de resultado estruturado

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

Regras de veredicto: falha de instalação, de inicialização (`smoke.fail`) ou uma etapa de capacidade que chegou a `not-registered`/`failed` ⇒ `fail`; instalação aprovada + patch efetivo + inicialização limpa (`pass`/`boot-ok`) + desinstalação aprovada ⇒ `pass` (com nota de capacidade quando `observed`); instalado mas sem alguma garantia posterior ⇒ `partial`; caso contrário ⇒ `unknown`.

## CI (GitHub Actions)

O repositório inclui um [`action.yml`](action.yml) composite reutilizável com `uses:` em qualquer repositório de plugins: executa o alvo em um perfil descartável e emite o par de relatórios que a CI consome — Markdown (comentário de PR) e JUnit XML (verificação de status). Entradas `target` (obrigatório)/`headless-task`/`dsh-version`; saídas `markdown`/`junit`/`verdict`. O drive não requer chave; apenas a asserção de capacidade precisa de `DEEPSEEK_API_KEY` e fica `skipped` (nunca falha) sem ela.

## Permissions & data (Permissões e dados)

- Apenas serviços públicos são consumidos: `ctx.subprocess`, `ctx.jobs`, `ctx.storageDomain`, `ctx.tools`, `ctx.commands`.
- Os relatórios são armazenados no domínio de armazenamento `test_drive` (tabelas `runs`, `matrices`; ponteiro de matriz mais recente). Quando a composição não tem `storageDomain` (ex.: o perfil headless oficial), as ferramentas continuam funcionando e a persistência é desativada com motivo registrado.
- Os processos filhos herdam um ambiente **sem credenciais**: segredos do host nunca chegam ao perfil testado, a menos que você os nomeie explicitamente em `forwardEnv`. Os valores nunca são registrados.
- Todas as strings de relatório/log passam por saneadores puros: literais de token, credenciais em URL e cabeçalhos bearer são redigidos, caminhos raiz temporários são substituídos por `<testdrive-temp>` e as caudas são limitadas por bytes.

## Security boundaries (Limites de segurança)

- **Isolamento.** Cada teste roda dentro de uma raiz `mkdtemp` nova sob o diretório temporário do SO: um `DSH_HOME` descartável, um diretório de trabalho descartável e um armazenamento pnpm redirecionado. O código do plugin testado só roda nesse perfil; seu perfil do host permanece intacto.
- **Propriedade.** Um registro ativo guarda cada raiz criada por esta instância. A limpeza recusa qualquer caminho que não seja um filho direto registrado do diretório temporário do SO com o prefixo `dsh-test-drive-` — sem varreduras de `%TEMP%`, sem prefixos alheios, sem caminhos do diretório real.
- **Escada de limpeza.** Antes de qualquer mutação, o plano dry-run completo é registrado (caminhos absolutos). A exclusão primeiro renomeia a raiz para um diretório `dsh-test-drive-quarantine-<ts>`, verifica e então exclui; falhas deixam o diretório em quarentena e são reportadas, nunca descartadas em silêncio. A limpeza roda em um `finally` em sucesso, falha, timeout e aborto, e novamente no desmonte do plugin.
- **`allowBuilds` é uma permissão real.** Permitir a compilação `prepare` de um pacote git executa o código desse pacote no momento da instalação. A permissão fica restrita ao perfil descartável, mas teste apenas alvos confiáveis e fixe commits.
- **A inicialização headless é sem chave por padrão.** A verificação de inicialização não precisa de credenciais; concluir a tarefa precisa. Repasse credenciais explicitamente (`forwardEnv`) e nunca as registre.

## Known limitations (Limitações conhecidas)

- Instalar alvos de registro/git requer acesso à rede a partir dos processos `dsh`/pnpm filhos.
- A tarefa de inicialização precisa de credenciais do modelo para chegar a `pass`; sem elas, reporta o honesto `boot-ok`.
- Em composições sem `storageDomain`, os relatórios não são persistidos (`drive_report` falha honestamente).
- `dsh` deve ser localizável no PATH (ou configure `dshBin`); no Windows o shim `.cmd`/`.bat` do npm é analisado automaticamente; uma resolução `.ps1` pede `dshBin`.
- Os lotes rodam em série por padrão; aumentar `batchConcurrency` só afeta a contenção de disco do armazenamento pnpm, não a corretude.

## Development (Desenvolvimento)

```sh
pnpm install
pnpm run typecheck && pnpm run typecheck:ci && pnpm test
pnpm run build && pnpm run verify:self-contained && pnpm run verify:artifacts && pnpm pack
```

- `typecheck` resolve `@deepseek-ai/*` pelo checkout local do harness; `typecheck:ci` verifica contra os tipos publicados `0.1.7-rc.2`.
- Os testes usam a pilha real `Context`/`Session`/`ToolRuntime`/`LocalJobRegistry`/armazenamento com um provedor de subprocesso roteirizado.
- End-to-end com CLI real (requer rede + `dsh` no PATH): `DSH_TESTDRIVE_E2E=1 pnpm run test:e2e` — testa o checkout deste próprio pacote pelo loop real de instalação e inicialização.
- Lançamento: `node scripts/release.mjs <x.y.z>` (sobe versão, carimba o CHANGELOG, repete a porta, commit + tag; nunca faz push).

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `plugin-testing`, `install-smoke`, `compatibility-matrix`, `ci`

## Contributors (Contribuidores)

[PerryLink](https://github.com/PerryLink) — design e implementação.

## PerryLink DSH Plugin Family

Este projeto é um dos **87 plugins ativamente mantidos** do DeepSeek Harness da [PerryLink](https://github.com/PerryLink). O registro da família tem **95** plugins — **5 congelados**, **3 retirados** — e fica recolhido abaixo para que cada README mantenha uma primeira tela curta. Expanda para ver cada linha, com o motivo na coluna Status.

<details>
<summary>Expandir os 95 plugins</summary>

| Plugin | Uma linha | Status |
|---|---|---|
| **[dsh-aqua-input-check](https://github.com/PerryLink/dsh-aqua-input-check)** | 水产养殖投入品记录核对（按投入品用量、休药期与起捕间隔核对记录自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-archive-check](https://github.com/PerryLink/dsh-archive-check)** | 档案归档完整性与保管期限核对（依据《档案法》及配套规定，仅提示差异，不作出定性结论） |  |
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | Second-model auto-review on the approval chain, fail-closed by default |  |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | Automatic strong/cheap model-tier routing with deterministic risk guards and a `/tier` command |  |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Durable background child agents with a Web UI sidebar, messaging and interrupt | 🚫 RETIRADO — ver o README do repositório |
| **[dsh-bid-ca-precheck](https://github.com/PerryLink/dsh-bid-ca-precheck)** | 投标文件符合性预检（按招标文件逐条核对响应情况，仅提示差异，不作出定性结论） |  |
| **[dsh-bid-qual-check](https://github.com/PerryLink/dsh-bid-qual-check)** | 投标人资格条件核对（按资格条件与证明材料核对逐条响应，仅提示差异，不作出定性结论） |  |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | Cost governance for DeepSeek Harness: budgets, carbon, and latency in one panel. | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** | Read-only MCP server exposing the certification registry: grades, snapshots and five-dimension evidence |  |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Claude Code /rewind-equivalent: snapshots, session forks, one-shot restore |  |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | Cross-platform native desktop control for DeepSeek Harness — Windows first. |  |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Terminal-style input history for the web composer: arrows, Ctrl+R search |  |
| **[dsh-contract-stance](https://github.com/PerryLink/dsh-contract-stance)** | 合同条款立场台账核对（按立场、风险等级与退让底线核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-customs-doc-check](https://github.com/PerryLink/dsh-customs-doc-check)** | 报关单证一致性核对（按公开的报关单填制规范核对单证间字段一致性，仅提示差异，不作出定性结论） |  |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | Dataset quality checks and citation cross-checks (the optional numeric bridge consumed here) |  |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | Prompt-injection, jailbreak, and secret-leak defense for DeepSeek Harness. | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-demurrage-ledger](https://github.com/PerryLink/dsh-demurrage-ledger)** | 滞箱费台账核对（按免箱期与费率核对超期天数与金额的自洽性，仅提示差异，不作出定性结论） |  |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | Engineering-discipline guard: requirements grill, test gates, adversary review |  |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | Unified static-image generation routing for DeepSeek Harness. | 🧊 CONGELADO — ver o README do repositório |
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
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | Multi-channel approval/question bridge: WeChat/Telegram/Feishu, session console | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-repair-order-qc](https://github.com/PerryLink/dsh-repair-order-qc)** | 维修工单结算核对（按项目金额、配件工时合计与结算总额核对算术自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | Verifiable research-report engine: content-addressed evidence ledger and sealed versions |  |
| **[dsh-review-reply-check](https://github.com/PerryLink/dsh-review-reply-check)** | 审稿意见逐条回应覆盖核对（按意见与回应一一对应核对覆盖完整性，仅提示差异，不作出定性结论） |  |
| **[dsh-rulefile-check](https://github.com/PerryLink/dsh-rulefile-check)** | 规则库文件自检核对（按条款引用纪律与效力上限核对规则库自身合规，仅提示差异，不作出定性结论） |  |
| **[dsh-safety-brief-check](https://github.com/PerryLink/dsh-safety-brief-check)** | 安全技术交底记录要素齐备性与签字闭环核对（依据公开的安全生产法规与检查标准，仅提示差异，不作出定性结论） |  |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | Multi-dimensional quality scoring for DeepSeek Harness plugins. |  |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Pin sessions in the Web sidebar with durable ordering | 🚫 RETIRADO — ver o README do repositório |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | Cross-device session sync for DeepSeek Harness — a dedicated git mirror of your session store. |  |
| **[dsh-site-log-check](https://github.com/PerryLink/dsh-site-log-check)** | 监理日志跨日连续性与旁站覆盖提示（依据 GB/T 50319-2013 等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | Security-audit skill pack: secret scan, dependency and supply-chain review |  |
| **[dsh-soe-decision-check](https://github.com/PerryLink/dsh-soe-decision-check)** | 三重一大决策台账核对（按前置研究、会议审议与决议记录核对程序留痕，仅提示差异，不作出定性结论） |  |
| **[dsh-soilwater-check](https://github.com/PerryLink/dsh-soilwater-check)** | 土壤与地下水监测台账核对（按点位、监测项目、限值与超标判定核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-sop-sync-check](https://github.com/PerryLink/dsh-sop-sync-check)** | 作业规程与 FMEA／控制计划一致性核对（按编号与版本核对三份文件是否同步，仅提示差异，不作出定性结论） |  |
| **[dsh-spc-gbt-adapter](https://github.com/PerryLink/dsh-spc-gbt-adapter)** | 控制图常数与过程能力指数核对（按 GB/T 4091 的常规控制图常数表核对控制限与 Cp/Cpk 的自洽性，仅提示差异，不作出定性结论） |  |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | Voice-first session loop for DeepSeek Harness: talk to it, hear it answer. |  |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | Cross-session team rooms: shared message bus, task board and timeline | 🚫 RETIRADO — ver o README do repositório |
| **[dsh-tender-extract](https://github.com/PerryLink/dsh-tender-extract)** | 招标文件条款摘录核对（按出处与原文逐字核对摘录完整性，仅提示差异，不作出定性结论） |  |
| **[dsh-tender-matrix](https://github.com/PerryLink/dsh-tender-matrix)** | 评标因素评分矩阵核对（按分值上限与合计核对矩阵自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | Isolated install-and-smoke test drives for DeepSeek Harness plugins. |  |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | TickTick/Dida365 task bridge: session-header panel + 11 tools |  |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | Vendor parameter translation and deterministic JSON repair for DeepSeek Harness. |  |
| **[dsh-warranty-calc](https://github.com/PerryLink/dsh-warranty-calc)** | 质保期与索赔金额核对（按质保期月数与里程、索赔金额算式核对自洽，仅提示差异，不作出定性结论） |  |

</details>

</details>

</details>

## License (Licença)

[Apache-2.0](LICENSE)

### Instalar a partir do mercado do DSH Desktop

Todos os plugins PerryLink podem ser explorados no mercado integrado do DSH Desktop: **Market → Sources → add source → colar** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ selecionar**. A instalação continua passando pela verificação de identidade npm do mercado e pela sua confirmação.
