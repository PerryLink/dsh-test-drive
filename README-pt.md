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

## DSH Desktop não é um host de teste suportado

`test_drive` precisa de um CLI `dsh` capaz de iniciar um **segundo** processo headless do DSH.
O launcher `dsh.CMD` do DSH Desktop só permite `dsh plugin …`, `--dump-config` e `--version`;
por política ele rejeita um segundo boot headless. Aponte `config.dshBin` para um CLI `dsh`
instalado por npm/pnpm (ou Node + entrada JS do dsh). O erro agora diz isso explicitamente,
em vez de “cannot parse npm shim”.

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

Este projeto faz parte da família de plugins do DeepSeek Harness da [PerryLink](https://github.com/PerryLink). O registro fica recolhido abaixo para que cada README mantenha uma primeira tela curta; expanda para ver cada linha e seu status.

<details>
<summary>Expandir todos os plugins</summary>

| Plugin | Status |
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
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | 🚫 RETIRADO — ver o README do repositório |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | 🚫 RETIRADO — ver o README do repositório |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | 🚫 RETIRADO — ver o README do repositório |

</details>

## License (Licença)

[Apache-2.0](LICENSE)

### Instalar a partir do mercado do DSH Desktop

Todos os plugins PerryLink podem ser explorados no mercado integrado do DSH Desktop: **Market → Sources → add source → colar** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ selecionar**. A instalação continua passando pela verificação de identidade npm do mercado e pela sua confirmação.
