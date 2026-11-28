import { defineConfig } from 'vitest/config';

// Scripts that run once by hand, not tests: `pnpm --filter @ariadne-nsd/editor readme-images`,
// `anatomy-figures`
// and `example-flowcharts`.
export default defineConfig({
  test: { environment: 'node', globals: false, include: ['scripts/*.script.ts'] },
});
