import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The fake DOM (happy-dom or jsdom) is undecided (07-testing). Pure tests run in Node for now.
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
