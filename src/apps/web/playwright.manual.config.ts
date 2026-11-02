import { defineConfig, devices } from '@playwright/test';

import base from './playwright.config';

// Takes the user guide's pictures and shortcut table from the real app (DR-0020), into
// apps/manual/img and apps/manual/generated. Run after a change to the screen or the keys:
//   pnpm --filter @ariadne-nsd/web manual-shots
// It is not a test: the E2E run (playwright.config.ts) does not include it.
export default defineConfig({
  ...base,
  testDir: './manual-shots',
  reporter: 'list',
  projects: [
    { name: 'ko', use: { ...devices['Desktop Chrome'], locale: 'ko-KR' } },
    { name: 'en', use: { ...devices['Desktop Chrome'], locale: 'en-US' } },
  ],
});
