import { defineConfig, devices } from '@playwright/test';

// Takes the pictures of the UX design documents (docs/02-ux-design/assets/*.png) from the real
// app, Korean screen, at twice the CSS pixels. Run after a change to the screen:
//   pnpm --filter @ariadne-nsd/web doc-shots
// It is not a test: the E2E run (playwright.config.ts) does not include it. The dev server runs on
// its own port (5190) so it does not clash with `pnpm dev` (5173).
const port = 5190;

export default defineConfig({
  testDir: './doc-shots',
  reporter: 'list',
  workers: 1,
  timeout: 120_000,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://localhost:${String(port)}/`,
    locale: 'ko-KR',
    deviceScaleFactor: 2,
    colorScheme: 'light',
  },
  webServer: {
    command: `pnpm dev --port ${String(port)} --strictPort`,
    url: `http://localhost:${String(port)}/`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
