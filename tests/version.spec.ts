/**
 * Version-consistency tripwire: the shipped report records `pluginVersion`
 * from `src/version.ts`, which must match `package.json` (release.mjs bumps
 * both together).
 * @module dsh-test-drive/test/version.spec
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { VERSION } from '../src/version.ts'

describe('version consistency', () => {
  it('src/version.ts matches package.json', () => {
    const root = join(import.meta.dirname, '..')
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version: string }
    expect(VERSION).toBe(pkg.version)
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })
})
