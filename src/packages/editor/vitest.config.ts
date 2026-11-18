import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Pure tests run in Node. Tests that need a DOM pick happy-dom in their file (02-test-architecture).
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
