/**
 * The `test-drive` storage domain: the durable home of drive-run records and
 * batch matrices. Opened through `ctx.storageDomain` (a public service), with
 * record schemas validated at the durable boundary; the domain stays open for
 * the plugin's lifetime and closes through the registered effect.
 *
 * @module dsh-test-drive/domain
 */

import { z } from 'zod'
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain'
import { DriveResultSchema, MatrixRecordSchema } from './result.ts'

/** Domain name (also the backend unit name; UNIT_NAME_RE forbids hyphens). */
export const DOMAIN_NAME = 'test_drive'

/** Domain format version; bump when a record format changes incompatibly. */
export const DOMAIN_VERSION = 1

/** Latest-matrix pointer value; `''` id means "no matrix yet". */
export const LatestMatrixSchema = z.object({
  matrixId: z.string(),
  createdAt: z.string(),
})

/** Storage-domain spec: one table of per-run records, one of batch matrices, plus the latest pointer. */
export const driveDomainSpec = defineDomain({
  name: DOMAIN_NAME,
  version: DOMAIN_VERSION,
  global: { schema: LatestMatrixSchema, initial: { matrixId: '', createdAt: '' } },
  tables: {
    runs: domainTable(DriveResultSchema),
    matrices: domainTable(MatrixRecordSchema),
  },
})
