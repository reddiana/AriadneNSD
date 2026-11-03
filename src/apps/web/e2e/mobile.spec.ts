// The web app on a phone (R-NFR-08 · R-NFR-09, QA-18 · QA-20; the start of the page is in boot.spec.ts). Chromium made to look like an
// Android phone: its screen, touch and user agent. A real phone is on the release checklist
// (07-testing 5); these catch what a desktop-sized test cannot (inbox 2026-11-01: the MVP did not
// appear on a Galaxy S26).
import type { Page } from '@playwright/test';
import { devices, expect, test } from '@playwright/test';

import { canvas, command, drawnText, middleOf, selection, skipWelcome } from './support';

// The phone's screen, touch and user agent. `defaultBrowserType` is a project-wide setting and
// cannot be set in a test file, so it is left out.
const galaxy = devices['Galaxy S9+'];
test.use({
  viewport: galaxy.viewport,
  deviceScaleFactor: galaxy.deviceScaleFactor,
  isMobile: galaxy.isMobile,
  hasTouch: galaxy.hasTouch,
  userAgent: galaxy.userAgent,
});

/** Lighthouse's mobile run: a CPU four times slower and "slow 4G". */
async function slowPhone(page: Page): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: 1.6e6 / 8,
    uploadThroughput: 750e3 / 8,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
}

/** Records, in the page, when the editor and the block font are there (ms from navigation). */
async function watchStart(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const times: Record<string, number> = {};
    (window as unknown as { startTimes: Record<string, number> }).startTimes = times;
    new MutationObserver(() => {
      if (times.editor === undefined && document.querySelector('.ans-toolbar') !== null) {
        times.editor = performance.now();
      }
      if (times.font === undefined && document.documentElement.dataset.ready === 'true') {
        times.font = performance.now();
      }
    }).observe(document, { subtree: true, childList: true, attributes: true });
  });
}

test('T-0287 · QA-18: on a slow phone the editor shows within 3 s and the block font within 5 s', async ({
  page,
}) => {
  await skipWelcome(page);
  await watchStart(page);
  await slowPhone(page);
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
  const times = await page.evaluate(
    () => (window as unknown as { startTimes: Record<string, number> }).startTimes,
  );
  expect(times.editor).toBeLessThan(3000);
  expect(times.font).toBeLessThan(5000);
});

test('T-0288 · QA-20: a first visit on a phone opens an example with a tap', async ({ page }) => {
  await page.goto('./');
  const modal = page.locator('.ans-backdrop[data-kind="examples"] .ans-modal');
  await expect(modal.locator('h2')).toHaveText('Welcome to AriadneNSD');
  await modal.locator('[data-example="merge-sort"]').tap();
  await expect(modal).toHaveCount(0);
  await expect(page).toHaveTitle('Merge sort.ns.svg – AriadneNSD');
});

test('T-0289 · QA-20: on a phone a block is inserted from the toolbar and selected with a tap', async ({
  page,
}) => {
  await skipWelcome(page);
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await command(page, 'block.insert.process').tap();
  await expect(page.locator('.ans-inline-editor')).toBeFocused();
  await page.keyboard.type('tapped');
  await page.keyboard.press('Enter');
  await expect(canvas(page)).toBeFocused();
  await expect(drawnText(page, 'tapped')).toBeVisible();

  await page.keyboard.press('Escape');
  const { x, y } = await middleOf(drawnText(page, 'tapped'));
  await page.touchscreen.tap(x, y);
  await expect(selection(page)).toHaveText('Process block');
});

test('T-0290 · BUG-04 · QA-20: on a phone the toolbar shows "Examples", and a tap opens the modal', async ({
  page,
}) => {
  await skipWelcome(page);
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const button = page.getByRole('toolbar').getByRole('button', { name: 'Examples' });
  await expect(button).toBeVisible();
  await button.tap();
  const modal = page.locator('.ans-backdrop[data-kind="examples"] .ans-modal');
  await expect(modal.locator('h2')).toHaveText('Open an Example');
});

test('T-0291 · QA-20: on a phone undo, redo, wrap and help are in the toolbar, with no bar at the bottom', async ({
  page,
}) => {
  await skipWelcome(page);
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const toolbar = page.getByRole('toolbar');
  for (const id of ['edit.undo', 'edit.redo', 'help.shortcuts']) {
    await expect(toolbar.locator(`[data-command="${id}"]`)).toBeVisible();
  }
  await expect(toolbar.locator('button[title="Wrap"]')).toBeVisible();
  await expect(page.locator('.ans-bottombar')).toHaveCount(0);
});

test('T-0523: on a phone no separator is left at the start or the end of a toolbar row', async ({
  page,
}) => {
  await skipWelcome(page);
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const toolbar = page.getByRole('toolbar');
  // The phone's toolbar takes more than one row (UX MB2).
  expect((await toolbar.boundingBox())?.height ?? 0).toBeGreaterThan(50);
  const stray = await toolbar.evaluate((root) => {
    const shown = (item: Element): boolean =>
      item instanceof HTMLElement &&
      item.offsetParent !== null &&
      getComputedStyle(item).visibility !== 'hidden';
    const items = [...root.querySelectorAll('.ans-sep, .ans-tool, .ans-tool-root')].filter(shown);
    return items.flatMap((item, at) => {
      if (!item.classList.contains('ans-sep') || !(item instanceof HTMLElement)) return [];
      const before = items[at - 1];
      const after = items[at + 1];
      const top = item.getBoundingClientRect().top;
      const bottom = item.getBoundingClientRect().bottom;
      const isStart = before === undefined || before.getBoundingClientRect().bottom <= top;
      const isEnd = after === undefined || after.getBoundingClientRect().top >= bottom;
      return isStart || isEnd ? [at] : [];
    });
  });
  expect(stray).toEqual([]);
});
