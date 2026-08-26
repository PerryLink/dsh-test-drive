#!/usr/bin/env node
/**
 * Convert one stored test-drive result (a drive record or a batch matrix) into
 * the CI report pair the composite action emits: `*.md` (Markdown) and
 * `*.junit.xml` (JUnit). Pure serialization — the drive pipeline, the isolation
 * guarantees, and the cleanup red lines are untouched; this script only reads
 * an already-settled JSON result and renders it.
 *
 * Usage:
 *   node ci-report.mjs --input result.json --out-dir ./reports
 *
 * The renderers are imported from the published `dsh-test-drive` package
 * (installed by the composite action before this script runs).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, basename } from 'node:path'
import { renderDriveResult, renderDriveJUnitXml, renderMatrix, renderMatrixJUnitXml } from 'dsh-test-drive'

function parseArgs(argv) {
  let input = null
  let outDir = '.'
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--input') { input = argv[++i]; continue }
    if (argv[i] === '--out-dir') { outDir = argv[++i]; continue }
    if (!argv[i].startsWith('-') && input === null) input = argv[i]
  }
  return { input, outDir }
}

const { input, outDir } = parseArgs(process.argv.slice(2))
if (input === null) {
  process.stderr.write('ci-report: --input <result.json> is required\n')
  process.exit(2)
}

const value = JSON.parse(readFileSync(input, 'utf8'))
const isMatrix = typeof value.totals === 'object' && value.totals !== null
const markdown = isMatrix ? renderMatrix(value) : renderDriveResult(value)
const junit = isMatrix ? renderMatrixJUnitXml(value) : renderDriveJUnitXml(value)

mkdirSync(outDir, { recursive: true })
const stem = basename(input).replace(/\.json$/, '')
const markdownPath = join(outDir, `${stem}.md`)
const junitPath = join(outDir, `${stem}.junit.xml`)
writeFileSync(markdownPath, markdown)
writeFileSync(junitPath, junit)

const verdict = isMatrix
  ? (value.totals.fail > 0 ? 'fail' : value.totals.partial > 0 ? 'partial' : 'pass')
  : value.verdict

console.log(JSON.stringify({ markdown: markdownPath, junit: junitPath, verdict }))
