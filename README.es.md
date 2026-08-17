<div align="center">

# 🧪 dsh-test-drive

**Pruebas de instalación y arranque aisladas para complementos de DeepSeek Harness.**

*Instala, prueba, verifica y limpia en un perfil desechable — tu `~/.dsh` real permanece intacto.*

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

## Compatibility (Compatibilidad)

| Componente | Versión |
|---|---|
| DeepSeek Harness | `0.1.0-rc.6` (dependencias peer fijadas) |
| Node.js | `^22.19.0 \|\| >=24.0.0` |
| Gestor de paquetes | `pnpm@11.7.0` |
| Plataforma | Windows / macOS / Linux (complemento solo host) |
| Herramientas externas | CLI `dsh` en PATH (autodetección, shims de npm analizados), `pnpm` en PATH |

## What you get (Qué obtienes)

- Herramienta `test_drive` — un objetivo por el flujo completo: `dsh plugin add` → verificación del parche con `--dump-config` → arranque headless (escaneo de marcadores FAILED + tarea opcional de una frase) → `dsh plugin remove` → limpieza en cuarentena. Devuelve el registro estructurado de forma síncrona, o `{ kind: 'background', jobId }` con `background: true`.
- Comando `/testdrive` — lote de objetivos separados por espacios/comas como tarea en segundo plano `drive-batch` sobre `ctx.jobs`, produciendo un informe matricial (JSON + Markdown).
- Herramienta `drive_report` — recupera cualquier ejecución (`tdr_...`), matriz (`tdm_...`) o la última matriz; se renderiza en Markdown.
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

## Install & uninstall (Instalación y desinstalación)

```sh
dsh plugin --profile web add dsh-test-drive     # instalar (npm) — o la forma git de arriba
dsh plugin --profile web remove dsh-test-drive  # desinstalar
```

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
| `uninstallTimeoutMs` | `120000` | Plazo de la etapa `dsh plugin remove`. |
| `outputTailBytes` | `8000` | Límite de la cola de salida saneada registrada por etapa. |
| `keepTempDirs` | `false` | Conserva los directorios temporales ante fallos para análisis forense (se abandona la propiedad; tú limpias). |
| `maxBatchTargets` | `20` | Límite de lote de `/testdrive`. |
| `batchConcurrency` | `1` | Concurrencia del lote (en serie evita contención del almacén pnpm). |

## Tools & surfaces (Herramientas y superficies)

### `test_drive`

```
test_drive(target: string, headlessTask?: string, background?: boolean)
```

- `target` — especificación git (`github:owner/repo#sha`, `git+https://...`), nombre npm, ruta local o tarball `.tgz`.
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

Reglas de veredicto: fallo de instalación o de arranque (`smoke.fail`) ⇒ `fail`; instalación aprobada + parche efectivo + arranque limpio (`pass`/`boot-ok`) + desinstalación aprobada ⇒ `pass`; instalado pero sin alguna garantía posterior ⇒ `partial`; en otro caso ⇒ `unknown`.

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

- `typecheck` resuelve `@deepseek-ai/*` a través del checkout local del harness; `typecheck:ci` comprueba contra los tipos publicados `0.1.0-rc.6`.
- Las pruebas usan la pila real `Context`/`Session`/`ToolRuntime`/`LocalJobRegistry`/almacenamiento con un proveedor de subprocesos guionizado.
- End-to-end con CLI real (requiere red + `dsh` en PATH): `DSH_TESTDRIVE_E2E=1 pnpm run test:e2e` — prueba el checkout de este propio paquete por el bucle real de instalación y arranque.
- Lanzamiento: `node scripts/release.mjs <x.y.z>` (sube versión, sella CHANGELOG, repite la puerta, commit + tag; nunca hace push).

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `plugin-testing`, `install-smoke`, `compatibility-matrix`, `ci`

## Contributors (Contribuidores)

[PerryLink](https://github.com/PerryLink) — diseño e implementación.

## License (Licencia)

[Apache-2.0](LICENSE)
