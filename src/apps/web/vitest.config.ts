import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.{ts,tsx}', 'scripts/*.test.ts'],
    setupFiles: ['./src/test-setup.ts'],
  },
});
