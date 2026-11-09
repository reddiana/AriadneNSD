import { defineConfig } from 'vitest/config';

/**
 * True while the run records coverage (`pnpm coverage`, which passes `--coverage.enabled`).
 * Recording slows the code down, so the tests that time it (QA-07) skip their time assertions
 * then, as the browser test T-0007 does (07-testing 5).
 */
const isCoverageRun = process.argv.some((arg) => arg.startsWith('--coverage'));

declare module 'vitest' {
  // Only an interface merges into Vitest's own `ProvidedContext`.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  export interface ProvidedContext {
    coverageRun: boolean;
  }
}

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts', 'node/**/*.test.ts'],
    provide: { coverageRun: isCoverageRun },
  },
});
