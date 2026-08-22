// scripts/loader-runner.mjs — real Loader composition runner (C3) for
// dsh-test-drive itself: an independent process boots the vendored Loader
// over a cordis.yml with real service rows + the plugin row, then asserts the
// tool/command contributions and executes the /testdrive help path. The
// storageDomain row is deliberately ABSENT — the plugin must still boot
// (optional-dependency degradation is part of its contract).
//
// Usage: node scripts/loader-runner.mjs <cordis.yml>
// Exit 0 prints DSH_LOADER_RESULT <json>; failures exit non-zero.

import { Context } from '@deepseek-ai/cordis'
import Include from '@deepseek-ai/cordis-plugin-include'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const configArgument = process.argv[2]
if (configArgument === undefined) {
  console.error('usage: loader-runner.mjs <cordis.yml>')
  process.exit(2)
}
const configPath = resolve(configArgument)
const configRequire = createRequire(resolve(import.meta.dirname, '../package.json'))

const ctx = new Context()
try {
  ctx.baseUrl = `${pathToFileURL(dirname(configPath)).href}/`
  await ctx.plugin(Loader)
  ctx.loader.internal = /** @type {any} */ ({
    version: 'v2',
    async import(specifier) {
      if (specifier.startsWith('file:')) return import(specifier)
      if (specifier.startsWith('node:')) return import(specifier)
      const absolute = /^([a-zA-Z]:)?[\\/]/u.test(specifier)
      return import(pathToFileURL(absolute ? specifier : configRequire.resolve(specifier)).href)
    },
  })
  ctx.loader.builtins.include = Include
  await ctx.loader.create({
    name: 'cordis:include',
    config: { path: pathToFileURL(configPath).href },
  })
  await ctx.loader.await()

  for (const name of ['test_drive', 'drive_report']) {
    if (ctx.tools.get(name) === undefined) {
      throw new Error(`Loader composition: ${name} tool is missing`)
    }
  }
  const session = ctx.sessions.create()
  const agent = /** @type {any} */ ({
    id: session.id,
    options: { provider: 'deepseek', model: 'demo-model' },
    session,
    inbox: {},
    status: 'idle',
    ctx,
    cancel: () => undefined,
    whenIdle: async () => undefined,
    runMaintenance: async (task) => task(new AbortController().signal),
    send: () => undefined,
    followup: () => undefined,
    steer: () => undefined,
    inject: () => undefined,
  })
  const descriptor = ctx.commands.list(agent).find(entry => entry.name === 'testdrive')
  if (descriptor === undefined) {
    throw new Error('Loader composition: /testdrive command is missing')
  }
  // rc.2 commands.execute gains the images parameter (durable attachments);
  // plain invocations pass the empty list.
  const execution = await ctx.commands.execute(agent, '/testdrive', [], new AbortController().signal)
  const text = execution?.result?.text ?? ''
  if (!text.includes('Usage: /testdrive')) {
    throw new Error(`Loader composition: /testdrive returned ${JSON.stringify(execution?.result)}`)
  }
  // Optional-dependency degradation: storageDomain is absent and the plugin
  // still boots.
  if (ctx.get('storageDomain') !== undefined) {
    throw new Error('Loader composition: storageDomain unexpectedly present')
  }

  const summary = {
    tools: ctx.tools.schemas().map(schema => schema.name).filter(name => name === 'test_drive' || name === 'drive_report'),
    command: descriptor.name,
    storageDomainAbsent: true,
  }
  process.stdout.write(`DSH_LOADER_RESULT ${JSON.stringify(summary)}\n`)
} catch (error) {
  const detail = (err) => (err instanceof Error ? err.message : String(err))
  console.error(detail(error))
  if (typeof error === 'object' && error !== null && Array.isArray(/** @type {any} */ (error).errors)) {
    for (const inner of /** @type {any} */ (error).errors) console.error(`- ${detail(inner)}`)
  }
  process.exit(1)
} finally {
  await ctx.fiber.dispose()
}
