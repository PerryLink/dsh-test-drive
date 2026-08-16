# dsh-test-drive

Testes isolados de instalação e inicialização para plugins do [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). Dado um repositório ou pacote npm, ele instala o alvo em um **perfil `DSH_HOME` descartável**, verifica o patch do bundle e os logs de inicialização, registra um **resultado estruturado de aprovação/falha** e remove tudo o que criou — sem nunca tocar seu `~/.dsh` real.

**Posicionamento (ZH)**: 在一次性隔离 DSH_HOME 中自动完成插件"安装 → 引导冒烟 → 卸载清理"实测并产出结构化结果矩阵。

[English](README.md) · [中文](README.zh.md) · [Español](README.es.md) · [हिन्दी](README.hi.md)

## Compatibility (Compatibilidade)

| Componente | Versão |
|---|---|
| DeepSeek Harness | `0.1.0-rc.6` (dependências peer fixadas) |
| Node.js | `^22.19.0 \|\| >=24.0.0` |
| Gerenciador de pacotes | `pnpm@11.7.0` |
| Plataforma | Windows / macOS / Linux (plugin apenas host) |
| Ferramentas externas | CLI `dsh` no PATH (autodetecção, shims npm analisados), `pnpm` no PATH |

## What you get (O que você obtém)

- Ferramenta `test_drive` — um alvo pelo pipeline completo: `dsh plugin add` → verificação do patch com `--dump-config` → inicialização headless (varredura de marcadores FAILED + tarefa opcional de uma frase) → `dsh plugin remove` → limpeza em quarentena. Retorna o registro estruturado de forma síncrona, ou `{ kind: 'background', jobId }` com `background: true`.
- Comando `/testdrive` — lote de alvos separados por espaços/vírgulas como tarefa em segundo plano `drive-batch` sobre `ctx.jobs`, produzindo um relatório matricial (JSON + Markdown).
- Ferramenta `drive_report` — busca qualquer execução (`tdr_...`), matriz (`tdm_...`) ou a matriz mais recente; renderizada em Markdown.
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
| `uninstallTimeoutMs` | `120000` | Prazo da etapa `dsh plugin remove`. |
| `outputTailBytes` | `8000` | Limite da cauda de saída saneada registrada por etapa. |
| `keepTempDirs` | `false` | Mantém os diretórios temporários em caso de falha para análise forense (a propriedade é abandonada; você limpa). |
| `maxBatchTargets` | `20` | Limite de lote do `/testdrive`. |
| `batchConcurrency` | `1` | Concorrência do lote (serial evita contenção no armazenamento pnpm). |

## Tools & surfaces (Ferramentas e superfícies)

### `test_drive`

```
test_drive(target: string, headlessTask?: string, background?: boolean)
```

- `target` — especificação git (`github:owner/repo#sha`, `git+https://...`), nome npm, caminho local ou tarball `.tgz`.
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

Regras de veredicto: falha de instalação ou de inicialização (`smoke.fail`) ⇒ `fail`; instalação aprovada + patch efetivo + inicialização limpa (`pass`/`boot-ok`) + desinstalação aprovada ⇒ `pass`; instalado mas sem alguma garantia posterior ⇒ `partial`; caso contrário ⇒ `unknown`.

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

- `typecheck` resolve `@deepseek-ai/*` pelo checkout local do harness; `typecheck:ci` verifica contra os tipos publicados `0.1.0-rc.6`.
- Os testes usam a pilha real `Context`/`Session`/`ToolRuntime`/`LocalJobRegistry`/armazenamento com um provedor de subprocesso roteirizado.
- End-to-end com CLI real (requer rede + `dsh` no PATH): `DSH_TESTDRIVE_E2E=1 pnpm run test:e2e` — testa o checkout deste próprio pacote pelo loop real de instalação e inicialização.
- Lançamento: `node scripts/release.mjs <x.y.z>` (sobe versão, carimba o CHANGELOG, repete a porta, commit + tag; nunca faz push).

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `plugin-testing`, `install-smoke`, `compatibility-matrix`, `ci`

## Contributors (Contribuidores)

[PerryLink](https://github.com/PerryLink) — design e implementação.

## License (Licença)

[Apache-2.0](LICENSE)
