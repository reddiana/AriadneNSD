import { defineConfig } from 'vitest/config';

// Scripts that run once by hand, not tests: `pnpm --filter @ariadne-nsd/web thumbnails`.
export default defineConfig({
  test: { environment: 'node', globals: false, include: ['scripts/*.script.ts'] },
});
