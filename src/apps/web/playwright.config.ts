import { defineConfig, devices } from '@playwright/test';

// Coverage runs build with source maps, so they never reuse a server of a plain build.
const port = process.env.E2E_COVERAGE === undefined ? 4173 : 4175;
const isCi = process.env.CI !== undefined;

export default defineConfig({
  testDir: './e2e',
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  reporter: isCi ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${String(port)}/`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // E2E runs against the production build, the same files GitHub Pages serves.
  webServer: {
    command: `pnpm build && pnpm preview --port ${String(port)} --strictPort`,
    url: `http://localhost:${String(port)}/`,
    reuseExistingServer: !isCi,
    timeout: 120_000,
  },
});
