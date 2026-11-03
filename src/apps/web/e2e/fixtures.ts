// The browser tests' `test`: Playwright's, plus JS coverage when `E2E_COVERAGE` is set
// (`pnpm e2e:coverage`). Every page of a test records which code ran; `scripts/e2e-coverage.mjs`
// maps it back to the source files through the build's source maps.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Page, TestInfo } from '@playwright/test';
import { test as base } from '@playwright/test';

export { expect } from '@playwright/test';

/** Where each test writes its raw V8 coverage, or undefined when coverage is off. */
const rawDir = process.env.E2E_COVERAGE === undefined ? undefined : 'coverage-e2e-raw';

/** The pages whose coverage has started, and the promise of that start. */
const started = new WeakMap<Page, Promise<void>>();

function start(page: Page): Promise<void> {
  let promise = started.get(page);
  if (promise === undefined) {
    promise = page.coverage.startJSCoverage({ resetOnNavigation: false }).catch(() => undefined);
    started.set(page, promise);
  }
  return promise;
}

let written = 0;

/** Stops a page's coverage and writes it; nothing when the page is already closed. */
async function save(page: Page, testInfo: TestInfo): Promise<void> {
  if (rawDir === undefined || !started.has(page) || page.isClosed()) return;
  const entries = await page.coverage.stopJSCoverage().catch(() => []);
  if (entries.length === 0) return;
  mkdirSync(rawDir, { recursive: true });
  written += 1;
  const file = `${testInfo.testId}-${String(process.pid)}-${String(written)}.json`;
  writeFileSync(join(rawDir, file), JSON.stringify(entries));
}

export const test = base.extend({
  context: async ({ context }, provide, testInfo) => {
    if (rawDir !== undefined) {
      // Pages the test or the app opens besides `page` (a second tab).
      context.on('page', (page) => void start(page));
    }
    await provide(context);
    for (const page of context.pages()) await save(page, testInfo);
  },
  page: async ({ page }, provide, testInfo) => {
    if (rawDir !== undefined) await start(page);
    await provide(page);
    // `page` closes before the context, so its coverage is saved here.
    await save(page, testInfo);
  },
});
