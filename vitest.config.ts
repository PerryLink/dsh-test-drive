import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts'],
    environment: 'node',
    pool: 'forks',
    // The leftover-scan assertions in workspace/drive specs observe the
    // SHARED OS temp dir, so spec files must not run concurrently.
    fileParallelism: false,
  },
})
