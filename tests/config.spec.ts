/**
 * `resolveConfig` re-judges every default and bound so programmatic mounts
 * (bypassing Schemastery normalization) still fail loud.
 * @module dsh-test-drive/test/config.spec
 */

import { describe, expect, it } from 'vitest'
import {
  DEFAULT_BATCH_CONCURRENCY,
  DEFAULT_CONFIG_TIMEOUT_MS,
  DEFAULT_FORWARD_ENV,
  DEFAULT_HEADLESS_TASK,
  DEFAULT_INSTALL_TIMEOUT_MS,
  DEFAULT_MAX_BATCH_TARGETS,
  DEFAULT_OUTPUT_TAIL_BYTES,
  DEFAULT_PROFILE_NAME,
  DEFAULT_SMOKE_TIMEOUT_MS,
  DEFAULT_UNINSTALL_TIMEOUT_MS,
  MAX_STAGE_TIMEOUT_MS,
  MIN_STAGE_TIMEOUT_MS,
  resolveConfig,
} from '../src/config.ts'

describe('resolveConfig defaults', () => {
  it('applies every documented default on an empty config', () => {
    const resolved = resolveConfig(undefined)
    expect(resolved.profileName).toBe(DEFAULT_PROFILE_NAME)
    expect(resolved.dshBin).toBe('')
    expect(resolved.headlessTask).toBe(DEFAULT_HEADLESS_TASK)
    expect(resolved.forwardEnv).toEqual([...DEFAULT_FORWARD_ENV])
    expect(resolved.allowBuilds).toBe(true)
    expect(resolved.installTimeoutMs).toBe(DEFAULT_INSTALL_TIMEOUT_MS)
    expect(resolved.configTimeoutMs).toBe(DEFAULT_CONFIG_TIMEOUT_MS)
    expect(resolved.smokeTimeoutMs).toBe(DEFAULT_SMOKE_TIMEOUT_MS)
    expect(resolved.uninstallTimeoutMs).toBe(DEFAULT_UNINSTALL_TIMEOUT_MS)
    expect(resolved.outputTailBytes).toBe(DEFAULT_OUTPUT_TAIL_BYTES)
    expect(resolved.keepTempDirs).toBe(false)
    expect(resolved.maxBatchTargets).toBe(DEFAULT_MAX_BATCH_TARGETS)
    expect(resolved.batchConcurrency).toBe(DEFAULT_BATCH_CONCURRENCY)
  })

  it('honors every override', () => {
    const resolved = resolveConfig({
      profileName: 'web',
      dshBin: '/opt/dsh',
      headlessTask: 'Say hi',
      forwardEnv: ['DEEPSEEK_API_KEY'],
      allowBuilds: false,
      installTimeoutMs: 60_000,
      configTimeoutMs: 10_000,
      smokeTimeoutMs: 30_000,
      uninstallTimeoutMs: 20_000,
      outputTailBytes: 1_024,
      keepTempDirs: true,
      maxBatchTargets: 5,
      batchConcurrency: 2,
    })
    expect(resolved.profileName).toBe('web')
    expect(resolved.dshBin).toBe('/opt/dsh')
    expect(resolved.headlessTask).toBe('Say hi')
    expect(resolved.forwardEnv).toEqual(['DEEPSEEK_API_KEY'])
    expect(resolved.allowBuilds).toBe(false)
    expect(resolved.installTimeoutMs).toBe(60_000)
    expect(resolved.configTimeoutMs).toBe(10_000)
    expect(resolved.smokeTimeoutMs).toBe(30_000)
    expect(resolved.uninstallTimeoutMs).toBe(20_000)
    expect(resolved.outputTailBytes).toBe(1_024)
    expect(resolved.keepTempDirs).toBe(true)
    expect(resolved.maxBatchTargets).toBe(5)
    expect(resolved.batchConcurrency).toBe(2)
  })
})

describe('resolveConfig fails loud', () => {
  it('rejects an empty profile name', () => {
    expect(() => resolveConfig({ profileName: '' })).toThrow(/config\.profileName/)
  })

  it('rejects profile names with path separators or spaces', () => {
    expect(() => resolveConfig({ profileName: 'a/b' })).toThrow(/config\.profileName/)
    expect(() => resolveConfig({ profileName: 'a b' })).toThrow(/config\.profileName/)
  })

  it('rejects stage timeouts outside the bounds', () => {
    expect(() => resolveConfig({ installTimeoutMs: MIN_STAGE_TIMEOUT_MS - 1 })).toThrow(/config\.installTimeoutMs/)
    expect(() => resolveConfig({ smokeTimeoutMs: MAX_STAGE_TIMEOUT_MS + 1 })).toThrow(/config\.smokeTimeoutMs/)
    expect(() => resolveConfig({ configTimeoutMs: Number.NaN })).toThrow(/config\.configTimeoutMs/)
  })

  it('rejects an output tail cap outside the bounds', () => {
    expect(() => resolveConfig({ outputTailBytes: 10 })).toThrow(/config\.outputTailBytes/)
    expect(() => resolveConfig({ outputTailBytes: 2.5 })).toThrow(/config\.outputTailBytes/)
  })

  it('rejects invalid forwarded environment names', () => {
    expect(() => resolveConfig({ forwardEnv: ['9LIVES'] })).toThrow(/config\.forwardEnv/)
    expect(() => resolveConfig({ forwardEnv: ['A-B'] })).toThrow(/config\.forwardEnv/)
  })

  it('rejects batch bounds violations', () => {
    expect(() => resolveConfig({ maxBatchTargets: 0 })).toThrow(/config\.maxBatchTargets/)
    expect(() => resolveConfig({ batchConcurrency: 9 })).toThrow(/config\.batchConcurrency/)
  })

  it('rejects a headless task longer than the cap', () => {
    expect(() => resolveConfig({ headlessTask: 'x'.repeat(2_001) })).toThrow(/config\.headlessTask/)
  })

  it('rejects a capability assertion enabled without a name', () => {
    expect(() => resolveConfig({ capability: { enabled: true, name: '' } })).toThrow(/config\.capability\.name/)
  })

  it('rejects an invalid capability kind', () => {
    expect(() => resolveConfig({ capability: { kind: 'bogus' } as never })).toThrow(/config\.capability\.kind/)
  })

  it('rejects a capability name that does not start alphanumerically', () => {
    expect(() => resolveConfig({ capability: { enabled: true, name: '-bad' } })).toThrow(/config\.capability\.name/)
  })

  it('rejects capability args/expect beyond their length caps', () => {
    expect(() => resolveConfig({ capability: { enabled: true, name: 'tool', args: 'x'.repeat(4_001) } })).toThrow(/config\.capability\.args/)
    expect(() => resolveConfig({ capability: { enabled: true, name: 'tool', expect: 'x'.repeat(2_001) } })).toThrow(/config\.capability\.expect/)
  })
})
