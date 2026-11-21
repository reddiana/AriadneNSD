import { defineConfig } from 'vitest/config';

// Scripts that run once by hand, not tests: `pnpm --filter @ariadne-nsd/web thumbnails` and
// `gallery-images`.
export default defineConfig({
  test: { environment: 'node', globals: false, include: ['scripts/*.script.ts'] },
});
