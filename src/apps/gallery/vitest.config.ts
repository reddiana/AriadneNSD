import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['*.test.ts'],
    // build.test.ts and gallery-page.test.ts both run build.mjs into dist/: one file at a time, so
    // one does not rebuild dist/ while the other reads it.
    fileParallelism: false,
  },
});
