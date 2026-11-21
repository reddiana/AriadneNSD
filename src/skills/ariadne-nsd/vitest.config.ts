import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts'],
    // T-1460 builds the bundle once, which takes a few seconds.
    testTimeout: 60_000,
  },
});
