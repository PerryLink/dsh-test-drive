/**
 * Build face for dsh-test-drive: one host bundle (`src/index.ts` → `lib/index.js`).
 * The plugin is host-only — no browser half, no client bundle.
 *
 * The only runtime imports are `node:` builtins and `@deepseek-ai/*` peers
 * (cordis/schemastery/dsh-*), which tsdown externalizes by default. Nothing
 * third-party is bundled; THIRD_PARTY_NOTICES.md records exactly that.
 */

import { defineConfig } from 'tsdown'

/** Plugin id: the cordis.yml bare row id and the stamped bundle entry name must match. */
const PLUGIN_ID = 'dsh-test-drive'

export default defineConfig({
  name: PLUGIN_ID,
  entry: { index: 'src/index.ts' },
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  dts: false,
  clean: false,
  // ESM output under a "type": "module" package must land on .js, not .mjs.
  fixedExtension: false,
  deps: {
    neverBundle: [/^node:/, /^@deepseek-ai\//],
  },
})
