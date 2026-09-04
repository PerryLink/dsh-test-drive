<div align="center">

# 🧪 dsh-test-drive
- **Canal 1024 store**: `npm i -g dsh1024` uma vez, depois `dsh1024 plugin --profile web add dsh-test-drive` (conta para o ranking de instalações do [deepseek1024.com](https://deepseek1024.com)).

**Testes isolados de instalação e inicialização para plugins do DeepSeek Harness.**

*Instale, teste, verifique e limpe em um perfil descartável — seu `~/.dsh` real permanece intocado.*

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

## Compatibility (Compatibilidade)

| Componente | Versão |
|---|---|
| DeepSeek Harness | `0.1.2-rc.1` (adaptado em 2026-09-04; dependências peer ≥ 0.1.0-rc.8): o envelope de sessão mantém seu campo ignorable apenas para compatibilidade de leitura de logs armazenados - o Session.append ainda não consegue estampá-lo, então o comportamento da porta não muda. |
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

## Install & uninstall (Instalação e desinstalação)

```sh
dsh plugin --profile web add dsh-test-drive     # instalar (npm) — ou a forma git acima
dsh plugin --profile web remove dsh-test-drive  # desinstalar
```

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
           "harnessVersion": "0.1.2-rc.1", "pluginVersion": "0.3.6",
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

- `typecheck` resolve `@deepseek-ai/*` pelo checkout local do harness; `typecheck:ci` verifica contra os tipos publicados `0.1.2-rc.1`.
- Os testes usam a pilha real `Context`/`Session`/`ToolRuntime`/`LocalJobRegistry`/armazenamento com um provedor de subprocesso roteirizado.
- End-to-end com CLI real (requer rede + `dsh` no PATH): `DSH_TESTDRIVE_E2E=1 pnpm run test:e2e` — testa o checkout deste próprio pacote pelo loop real de instalação e inicialização.
- Lançamento: `node scripts/release.mjs <x.y.z>` (sobe versão, carimba o CHANGELOG, repete a porta, commit + tag; nunca faz push).

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `plugin-testing`, `install-smoke`, `compatibility-matrix`, `ci`

## Contributors (Contribuidores)

[PerryLink](https://github.com/PerryLink) — design e implementação.

## PerryLink DSH Plugin Family

Este projeto é um dos [33 plugins de DeepSeek Harness](https://github.com/PerryLink) mantidos por [PerryLink](https://github.com/PerryLink). Se este ajuda você, os outros provavelmente também:

| Plugin | One-liner |
|---|---|
| **[dsh-dsh-auto-review](https://github.com/PerryLink/dsh-dsh-auto-review)** | Auto-revisão de segundo modelo na cadeia de aprovação, com falha fechada por padrão | |
| **[dsh-dsh-background-agents](https://github.com/PerryLink/dsh-dsh-background-agents)** | Agentes filhos em segundo plano duráveis com barra lateral de UI web, mensagens e interrupção | |
| **[dsh-dsh-budget](https://github.com/PerryLink/dsh-dsh-budget)** | Governança de custos para DeepSeek Harness: orçamentos, carbono e latência em um painel. | |
| **[dsh-dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-dsh-checkpoint-rewind)** | Equivalente ao /rewind do Claude Code: instantâneos, bifurcações de sessão, restauração de uso único | |
| **[dsh-dsh-claude-move](https://github.com/PerryLink/dsh-dsh-claude-move)** | Migre sessões, memória, habilidades e CLAUDE.md do Claude Code para o DSH | |
| **[dsh-dsh-click](https://github.com/PerryLink/dsh-dsh-click)** | Controle de desktop nativo multiplataforma para DeepSeek Harness — Windows primeiro. | |
| **[dsh-dsh-composer-history](https://github.com/PerryLink/dsh-dsh-composer-history)** | Histórico de entrada estilo terminal para o compositor web: setas, busca Ctrl+R | |
| **[dsh-dsh-data-quality](https://github.com/PerryLink/dsh-dsh-data-quality)** | Verificações de qualidade de datasets e verificação de citações (a ponte numérica opcional consumida aqui) | |
| **[dsh-dsh-defend](https://github.com/PerryLink/dsh-dsh-defend)** | Defesa contra injeção de prompt, jailbreak e vazamento de segredos para DeepSeek Harness. | |
| **[dsh-dsh-doublecheck](https://github.com/PerryLink/dsh-dsh-doublecheck)** | Guardião de disciplina de engenharia: sabatina de requisitos, portões de teste, revisão adversária | |
| **[dsh-dsh-draw](https://github.com/PerryLink/dsh-dsh-draw)** | Roteamento unificado de geração de imagens estáticas para DeepSeek Harness. | |
| **[dsh-dsh-fast](https://github.com/PerryLink/dsh-dsh-fast)** | Diagnóstico de desempenho só de leitura para DeepSeek Harness. | |
| **[dsh-dsh-fund-research](https://github.com/PerryLink/dsh-dsh-fund-research)** | Relatórios de pesquisa deterministas para fundos mútuos públicos chineses | |
| **[dsh-dsh-github](https://github.com/PerryLink/dsh-dsh-github)** | Integração de PR/issues do GitHub para o DSH, cada escrita controlada por aprovação | |
| **[dsh-dsh-industry-research](https://github.com/PerryLink/dsh-dsh-industry-research)** | Orquestração de pesquisa setorial que sela as suas entregas através do `ctx.researchReport.assemble` deste plugin | |
| **[dsh-dsh-library](https://github.com/PerryLink/dsh-dsh-library)** | Base de conhecimento documental local para DeepSeek Harness. | |
| **[dsh-dsh-local-ai](https://github.com/PerryLink/dsh-dsh-local-ai)** | Integração de modelos locais (Ollama) para DeepSeek Harness. | |
| **[dsh-dsh-lsp-actions](https://github.com/PerryLink/dsh-dsh-lsp-actions)** | Diagnósticos, formatação, autocompletar, ações de código e renomeação LSP sobre servidores de linguagem | |
| **[dsh-dsh-mask](https://github.com/PerryLink/dsh-dsh-mask)** | Middleware de mascaramento de PII: anonimiza no limite do modelo, restaura na camada de exibição | |
| **[dsh-dsh-mcp-panel](https://github.com/PerryLink/dsh-dsh-mcp-panel)** | Painel de tempo de execução MCP somente leitura: comando /mcp + aba Settings com status, ferramentas e erros | |
| **[dsh-dsh-memento](https://github.com/PerryLink/dsh-dsh-memento)** | Memória entre sessões controlada por aprovação: costura ctx.memory + SQLite + ferramenta de memória | |
| **[dsh-dsh-observe](https://github.com/PerryLink/dsh-dsh-observe)** | Exportador de observabilidade OpenTelemetry e Langfuse para DeepSeek Harness. | |
| **[dsh-dsh-output-styles](https://github.com/PerryLink/dsh-dsh-output-styles)** | Troca de estilo em tempo de execução equivalente ao outputStyles do Claude Code | |
| **[dsh-dsh-permission-rules](https://github.com/PerryLink/dsh-dsh-permission-rules)** | Regras de permissão declarativas allow/deny/ask estilo Claude Code com auditoria | |
| **[dsh-dsh-plugin-guide](https://github.com/PerryLink/dsh-dsh-plugin-guide)** | Base de conhecimento de desenvolvimento de plugins como habilidade de agente sob demanda | |
| **[dsh-dsh-research-report](https://github.com/PerryLink/dsh-dsh-research-report)** | Motor de relatórios de pesquisa verificáveis com evidência endereçada por conteúdo | |
| **[dsh-dsh-score](https://github.com/PerryLink/dsh-dsh-score)** | Pontuação de qualidade multidimensional para plugins de DeepSeek Harness. | |
| **[dsh-dsh-session-pin](https://github.com/PerryLink/dsh-dsh-session-pin)** | Fixe sessões na barra lateral web com ordenação durável | |
| **[dsh-dsh-session-sync](https://github.com/PerryLink/dsh-dsh-session-sync)** | Sincronização de sessões entre dispositivos para DeepSeek Harness — um espelho git dedicado do seu armazenamento de sessões. | |
| **[dsh-dsh-skill-pack-security](https://github.com/PerryLink/dsh-dsh-skill-pack-security)** | Pacote de habilidades de auditoria de segurança: varredura de segredos, revisão de dependências e cadeia de suprimentos | |
| **[dsh-dsh-talk](https://github.com/PerryLink/dsh-dsh-talk)** | Loop de sessão com voz para DeepSeek Harness: fale e ouça a resposta. | |
| **[dsh-dsh-translate](https://github.com/PerryLink/dsh-dsh-translate)** | Tradução de parâmetros entre fornecedores e reparo determinístico de JSON para DeepSeek Harness. | |

## License (Licença)

[Apache-2.0](LICENSE)

### Instalar a partir do mercado do DSH Desktop

Todos os plugins PerryLink podem ser explorados no mercado integrado do DSH Desktop: **Market → Sources → add source → colar** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ selecionar**. A instalação continua passando pela verificação de identidade npm do mercado e pela sua confirmação.
