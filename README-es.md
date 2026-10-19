<div align="center">

# 🧪 dsh-test-drive
- **Canal 1024 store**: `npm i -g dsh1024` una vez, luego `dsh1024 plugin --profile web add dsh-test-drive` (cuenta para el ranking de instalaciones de [deepseek1024.com](https://deepseek1024.com)).

**Pruebas de instalación y arranque aisladas para complementos de DeepSeek Harness.**

*Instala, prueba, verifica y limpia en un perfil desechable — tu `~/.dsh` real permanece intacto.*

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


**📖 Base de conocimiento del ecosistema** — datos medidos, no marketing: [guía de desarrollo · datos de selección · criterios de mantenimiento](https://perrylink.github.io/dsh-plugin-guide/).

<!-- star-cta -->
## Install & uninstall (Instalación y desinstalación)

```sh
dsh plugin --profile web add dsh-test-drive     # instalar (npm) — o la forma git de arriba
dsh plugin --profile web remove dsh-test-drive  # desinstalar
```

## ⭐ 如果它帮到了你

Este plugin forma parte de la [familia de plugins DSH](https://github.com/PerryLink) (más de 40, todos Apache-2.0). Si te resulta útil, **dale una estrella**: no desbloquea nada, pero ayuda a que la siguiente persona lo encuentre antes.

*English:* part of a 95 plugin family for DeepSeek Harness. If it is useful, **a star helps the next person find it** — nothing is gated behind it.

## What is dsh-test-drive?

Pruebas de instalación y arranque aisladas para complementos de DeepSeek Harness.

Instala, prueba, verifica y limpia en un perfil desechable — tu `~/.dsh` real permanece intacto.

![Demostración de terminal de dsh-test-drive: dsh-test-drive — one isolated install-and-smoke drive](https://raw.githubusercontent.com/PerryLink/dsh-test-drive/main/docs/assets/dsh-test-drive-hero.png)

![Animated terminal demo of dsh-test-drive](https://raw.githubusercontent.com/PerryLink/dsh-test-drive/main/docs/assets/dsh-test-drive-demo.gif)

*La misma ejecución, animada.*

## Compatibility (Compatibilidad)

| Componente | Versión |
|---|---|
| DeepSeek Harness | **`dsh-v0.2.1-alpha.1`** (etiqueta de GitHub, verificado el 2026-09-11: cadena completa de puertas + smoke de instalación de perfil). Líneas de dependencia npm `0.1.2-rc.1` y `0.1.7-rc.2` (dependencias entre pares `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0`). |
| Node.js | `^22.19.0 \|\| >=24.0.0` |
| Gestor de paquetes | `pnpm@11.7.0` |
| Plataforma | Windows / macOS / Linux (complemento solo host) |
| Herramientas externas | CLI `dsh` en PATH (autodetección, shims de npm analizados), `pnpm` en PATH |

## What you get (Qué obtienes)

- Herramienta `test_drive` — un objetivo por el flujo completo: `dsh plugin add` → verificación del parche con `--dump-config` → arranque headless (escaneo de marcadores FAILED + tarea opcional de una frase) → aserción de capacidad opcional → `dsh plugin remove` → limpieza en cuarentena. Devuelve el registro estructurado de forma síncrona, o `{ kind: 'background', jobId }` con `background: true`.
- Comando `/testdrive` — lote de objetivos separados por espacios/comas como tarea en segundo plano `drive-batch` sobre `ctx.jobs`, produciendo un informe matricial (JSON + Markdown).
- Herramienta `drive_report` — recupera cualquier ejecución (`tdr_...`), matriz (`tdm_...`) o la última matriz; se renderiza en Markdown.
- Aserción de capacidad — más allá de “arrancó y salió”: la etapa opcional `capability` hace que el agente llame a la herramienta nombrada (o ejecute `/command`) y verifica que el registro durable de sesión contenga la invocación y que la salida observada contenga `expect`. Un arranque limpio es solo una prueba de humo; `observed` demuestra que una capacidad con nombre realmente funciona.
- Resultados estructurados — cada registro lleva el discriminador `schema: "dsh-test-drive/v1"` con campos de primera clase: `stages.install.status` (`pass`/`fail`), `stages.smoke.status` (`pass`/`fail`/`boot-ok`/`skipped`), `durationMs` por etapa, `summary`/`outputTail` saneados y un `verdict` global (`pass`/`fail`/`partial`/`unknown`). Este es el contrato legible por máquina que consumen los puntuadores (dsh-score).
- Seguridad por construcción — cada directorio temporal lo crea este complemento bajo un prefijo dedicado `dsh-test-drive-`, se registra en un registro de propiedad activo y solo se elimina mediante la escalera dry-run → renombrado a cuarentena → borrado. El perfil del host nunca se lee ni se escribe.

## Quick start (Inicio rápido)

### Canal git

```sh
dsh plugin --profile web add github:PerryLink/dsh-test-drive#<commit-sha>
```

El primer `add` falla porque pnpm bloquea la compilación `prepare` del paquete; copia la clave exacta que pnpm imprimió en el `pnpm-workspace.yaml` del perfil y vuelve a ejecutar:

```yaml
allowBuilds:
  'dsh-test-drive': true
```

### Canal npm

```sh
dsh plugin --profile web add dsh-test-drive
```

Los paquetes precompilados no necesitan permiso de compilación. Reinicia el perfil y usa `test_drive` / `/testdrive` desde una sesión.

## DSH Desktop no es un host de prueba compatible

`test_drive` necesita un CLI `dsh` capaz de iniciar un **segundo** proceso headless de DSH.
El lanzador `dsh.CMD` de DSH Desktop solo permite `dsh plugin …`, `--dump-config` y
`--version`; por política rechaza un segundo arranque headless. Configura `config.dshBin`
con un CLI `dsh` instalado por npm/pnpm (o Node + entrada JS de dsh). El error ahora lo dice
explícitamente en lugar de “cannot parse npm shim”.

## Configuration (Configuración)

Todas las claves son opcionales (se muestran los valores por defecto); los valores inválidos fallan ruidosamente al cargar.

| Clave | Por defecto | Descripción |
|---|---|---|
| `profileName` | `headless` | Plantilla de perfil inicializada dentro de cada DSH_HOME desechable (bundles base + headless). |
| `dshBin` | `""` | Ruta absoluta que reemplaza al ejecutable dsh; vacío autodetecta `dsh` en PATH. |
| `headlessTask` | `"Reply with exactly: ok"` | Tarea de una frase para la etapa de arranque; vacío omite la etapa. |
| `forwardEnv` | `[]` | NOMBRES de variables de entorno (nunca valores) reenviados a los procesos hijos del perfil de prueba. |
| `allowBuilds` | `true` | Permite una compilación `prepare` de git bloqueada en el perfil de prueba y reintenta la instalación una vez. |
| `installTimeoutMs` | `600000` | Plazo de la etapa `dsh plugin add`. |
| `configTimeoutMs` | `60000` | Plazo de la etapa `--dump-config`. |
| `smokeTimeoutMs` | `300000` | Plazo de la etapa de arranque headless. |
| `capabilityTimeoutMs` | `300000` | Plazo de la tarea de aserción de capacidad.
| `capability.enabled` | `false` | Ejecuta la etapa de aserción de capacidad (registrado → invocado → observado).
| `capability.kind` | `tool` | Qué afirmar: `tool` o `command`.
| `capability.name` | `""` | Nombre de herramienta o comando (sin la `/` inicial).
| `capability.args` | `""` | Texto de invocación: argumentos de herramienta (estilo JSON) o palabras del comando.
| `capability.expect` | `""` | Literal esperado en la salida observada (subcadena sin distinción de mayúsculas).
| `uninstallTimeoutMs` | `120000` | Plazo de la etapa `dsh plugin remove`. |
| `outputTailBytes` | `8000` | Límite de la cola de salida saneada registrada por etapa. |
| `keepTempDirs` | `false` | Conserva los directorios temporales ante fallos para análisis forense (se abandona la propiedad; tú limpias). |
| `maxBatchTargets` | `20` | Límite de lote de `/testdrive`. |
| `batchConcurrency` | `1` | Concurrencia del lote (en serie evita contención del almacén pnpm). |

## Tools & surfaces (Herramientas y superficies)

### `test_drive`

```
test_drive(target: string, headlessTask?: string, background?: boolean,
  capability?: { kind: 'tool' | 'command', name: string,
                 args: string, expect: string })
```

- `target` — especificación git (`github:owner/repo#sha`, `git+https://...`), nombre npm, ruta local o tarball `.tgz`.
- `capability` — aserción posterior al arranque: el agente llama a `name` (herramienta) con `args` o ejecuta `/name` (comando); la etapa lee el registro durable de sesión y exige que la salida observada contenga `expect`. Requiere `DEEPSEEK_API_KEY` (entorno del host o `forwardEnv`); sin ella, la etapa queda `skipped`, nunca falla.
- Devuelve el registro estructurado completo; ejemplo más abajo.
- `background: true` inicia una tarea `drive-batch` y devuelve su id.

### `/testdrive <objetivos...>`

Inicia una tarea por lotes en segundo plano; el progreso fluye por la salida de la tarea y la última línea nombra el id de matriz para `drive_report`.

### `drive_report(id?)`

Devuelve un registro de ejecución (`tdr_...`), una matriz (`tdm_...`) o — sin id — la última matriz.

### Ejemplo de resultado estructurado

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

Reglas de veredicto: fallo de instalación, de arranque (`smoke.fail`) o una etapa de capacidad que llegó a `not-registered`/`failed` ⇒ `fail`; instalación aprobada + parche efectivo + arranque limpio (`pass`/`boot-ok`) + desinstalación aprobada ⇒ `pass` (con nota de capacidad cuando `observed`); instalado pero sin alguna garantía posterior ⇒ `partial`; en otro caso ⇒ `unknown`.

## CI (GitHub Actions)

El repositorio incluye un [`action.yml`](action.yml) composite reutilizable con `uses:` en cualquier repositorio de plugins: impulsa el objetivo en un perfil desechable y emite el par de informes que CI consume — Markdown (comentario de PR) y JUnit XML (verificación de estado). Entradas `target` (obligatorio)/`headless-task`/`dsh-version`; salidas `markdown`/`junit`/`verdict`. El drive no requiere clave; solo la aserción de capacidad necesita `DEEPSEEK_API_KEY` y queda `skipped` (nunca falla) sin ella.

## Permissions & data (Permisos y datos)

- Solo se consumen servicios públicos: `ctx.subprocess`, `ctx.jobs`, `ctx.storageDomain`, `ctx.tools`, `ctx.commands`.
- Los informes se guardan en el dominio de almacenamiento `test_drive` (tablas `runs`, `matrices`; puntero de última matriz). Si la composición no tiene `storageDomain` (p. ej. el perfil headless oficial), las herramientas siguen funcionando y la persistencia se desactiva con motivo registrado.
- Los procesos hijos heredan un entorno **sin credenciales**: los secretos del host nunca llegan al perfil probado salvo que los nombres explícitamente en `forwardEnv`. Los valores nunca se registran.
- Todas las cadenas de informes/registros pasan por saneadores puros: literales de token, credenciales en URL y cabeceras bearer se redactan, las rutas raíz temporales se sustituyen por `<testdrive-temp>` y las colas se limitan por bytes.

## Security boundaries (Límites de seguridad)

- **Aislamiento.** Cada prueba se ejecuta dentro de una raíz `mkdtemp` nueva bajo el directorio temporal del SO: un `DSH_HOME` desechable, un directorio de trabajo desechable y un almacén pnpm redirigido. El código del complemento probado solo se ejecuta en ese perfil; tu perfil del host queda intacto.
- **Propiedad.** Un registro activo guarda cada raíz creada por esta instancia. La limpieza rechaza cualquier ruta que no sea hija directa registrada del directorio temporal del SO con el prefijo `dsh-test-drive-` — sin barridos de `%TEMP%`, sin prefijos ajenos, sin rutas del hogar real.
- **Escalera de limpieza.** Antes de cualquier mutación se registra el plan dry-run completo (rutas absolutas). El borrado primero renombra la raíz a un directorio `dsh-test-drive-quarantine-<ts>`, verifica y luego elimina; los fallos dejan el directorio en cuarentena y se informan, nunca se descartan en silencio. La limpieza se ejecuta en un `finally` ante éxito, fallo, timeout y aborto, y de nuevo al desmontar el complemento.
- **`allowBuilds` es un permiso real.** Permitir la compilación `prepare` de un paquete git ejecuta el código de ese paquete en el momento de la instalación. El permiso se limita al perfil desechable, pero prueba solo objetivos de confianza y fija commits.
- **El arranque headless es sin clave por defecto.** La comprobación de arranque no necesita credenciales; completar la tarea sí. Reenvía credenciales explícitamente (`forwardEnv`) y nunca las registres.

## Known limitations (Limitaciones conocidas)

- Instalar objetivos de registro/git requiere acceso a red desde los procesos `dsh`/pnpm hijos.
- La tarea de arranque necesita credenciales del modelo para llegar a `pass`; sin ellas informa el honesto `boot-ok`.
- En composiciones sin `storageDomain` los informes no se persisten (`drive_report` falla honestamente).
- `dsh` debe poder localizarse en PATH (o configura `dshBin`); en Windows el shim `.cmd`/`.bat` de npm se analiza automáticamente; una resolución `.ps1` pide `dshBin`.
- Los lotes se ejecutan en serie por defecto; subir `batchConcurrency` solo afecta a la contención de disco del almacén pnpm, no a la corrección.

## Development (Desarrollo)

```sh
pnpm install
pnpm run typecheck && pnpm run typecheck:ci && pnpm test
pnpm run build && pnpm run verify:self-contained && pnpm run verify:artifacts && pnpm pack
```

- `typecheck` resuelve `@deepseek-ai/*` a través del checkout local del harness; `typecheck:ci` comprueba contra los tipos publicados `0.1.7-rc.2`.
- Las pruebas usan la pila real `Context`/`Session`/`ToolRuntime`/`LocalJobRegistry`/almacenamiento con un proveedor de subprocesos guionizado.
- End-to-end con CLI real (requiere red + `dsh` en PATH): `DSH_TESTDRIVE_E2E=1 pnpm run test:e2e` — prueba el checkout de este propio paquete por el bucle real de instalación y arranque.
- Lanzamiento: `node scripts/release.mjs <x.y.z>` (sube versión, sella CHANGELOG, repite la puerta, commit + tag; nunca hace push).

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `plugin-testing`, `install-smoke`, `compatibility-matrix`, `ci`

## Contributors (Contribuidores)

[PerryLink](https://github.com/PerryLink) — diseño e implementación.

## Familia de plugins DSH de PerryLink

Este proyecto forma parte de la familia de plugins de DeepSeek Harness de [PerryLink](https://github.com/PerryLink). El registro permanece plegado abajo para que cada README conserve una primera pantalla corta; expándelo para ver cada fila y su estado.

<details>
<summary>Expandir todos los plugins</summary>

| Plugin | Estado |
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
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | 🧊 CONGELADO — ver el README del repositorio |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | 🧊 CONGELADO — ver el README del repositorio |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | 🧊 CONGELADO — ver el README del repositorio |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | 🧊 CONGELADO — ver el README del repositorio |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | 🧊 CONGELADO — ver el README del repositorio |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | 🚫 RETIRADO — ver el README del repositorio |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | 🚫 RETIRADO — ver el README del repositorio |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | 🚫 RETIRADO — ver el README del repositorio |

</details>## License (Licencia)

[Apache-2.0](LICENSE)

### Instalar desde el mercado de DSH Desktop

Todos los plugins de PerryLink pueden explorarse en el mercado integrado de DSH Desktop: **Market → Sources → add source → pegar** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ seleccionarlo**. La instalación sigue pasando por la verificación de identidad npm del mercado y tu confirmación.
