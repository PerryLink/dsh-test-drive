/**
 * Lifecycle and export-contract suite: the HMR-safety test (dispose the
 * contributing fiber, re-query the authoritative tool registry and the
 * commands registry) and the default-export guard (module namespace + Loader
 * unwrap round-trip).
 * @module dsh-test-drive/test/lifecycle.spec
 */

import Loader from '@deepseek-ai/cordis-plugin-loader'
import { describe, expect, it } from 'vitest'
import { FakeCommandsRuntime, mountHarness } from './harness.ts'

async function loadPlugin(): Promise<typeof import('../src/index.ts')> {
  return await import('../src/index.ts')
}

// ---------------------------------------------------------------------------
// C2: the function-plugin namespace must survive Loader unwrapping
// ---------------------------------------------------------------------------

describe('export contract', () => {
  it('carries no default export and Loader unwrap round-trips the namespace', async () => {
    const plugin = await loadPlugin()
    expect('default' in plugin).toBe(false)
    const loader = Object.create(Loader.prototype) as { unwrapExports: (mod: unknown) => unknown }
    const unwrapped = loader.unwrapExports(plugin)
    expect(unwrapped).toBe(plugin)
    expect((unwrapped as { name: string }).name).toBe('dsh-test-drive')
    expect((unwrapped as { inject: string[] }).inject).toEqual(['tools', 'commands', 'subprocess', 'jobs'])
    expect(typeof (unwrapped as { apply: unknown }).apply).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// C1: disposing the contributing fiber removes every registry contribution
// ---------------------------------------------------------------------------

describe('fiber disposal', () => {
  it('removes the drive tools and the /testdrive command when the plugin fiber is disposed', async () => {
    const harness = await mountHarness({ plugin: false })
    const plugin = await loadPlugin()
    const fiber = await harness.ctx.plugin(plugin as never, {} as never)
    try {
      expect(harness.ctx.tools.get('test_drive')).toBeDefined()
      expect(harness.ctx.tools.get('drive_report')).toBeDefined()
      expect((harness.commands as FakeCommandsRuntime).definitions.has('testdrive')).toBe(true)

      await fiber.dispose()

      expect(harness.ctx.tools.get('test_drive')).toBeUndefined()
      expect(harness.ctx.tools.get('drive_report')).toBeUndefined()
      expect((harness.commands as FakeCommandsRuntime).definitions.has('testdrive')).toBe(false)
    } finally {
      await harness.ctx.fiber.dispose()
    }
  })
})
