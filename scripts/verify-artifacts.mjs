// Verify the built artifacts after `pnpm run build`: syntax-check the host
// bundle, import it under plain Node, and assert the shipped files exist.
// Guards against TypeScript-only syntax leaking into shipped output and
// against a tarball missing the bundle patch.
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

const required = [
  'lib/index.js',
  'lib/types/index.d.ts',
  'cordis.patch.yml',
  'LICENSE',
]
for (const rel of required) {
  if (!existsSync(path.join(root, rel))) throw new Error(`missing artifact: ${rel}`)
}

// 1. Syntax-check the host bundle (plain Node parse; no execution).
execFileSync(process.execPath, ['--check', path.join(root, 'lib/index.js')], { stdio: 'inherit' })

// 2. The ESM host face must import under plain Node (no tsx, no checkout paths).
const index = await import(pathToFileURL(path.join(root, 'lib/index.js')).href)
if (typeof index.apply !== 'function' || index.name !== 'dsh-test-drive') {
  throw new Error('lib/index.js exports an unexpected plugin face')
}

// 3. The bundle patch must reference the package by its own name.
const patch = (await import('node:fs')).readFileSync(path.join(root, 'cordis.patch.yml'), 'utf8')
if (!patch.includes('dsh-test-drive')) {
  throw new Error('cordis.patch.yml does not mount dsh-test-drive')
}

console.log('artifacts OK: syntax + ESM import + bundle patch present')
