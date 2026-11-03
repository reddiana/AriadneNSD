// The start of the page (R-NFR-10, QA-19; inbox 2026-11-01: the MVP did not appear on an Android
// phone): a database that never answers must not keep the screen empty, and a failure shows on the
// screen.
import { expect, test } from './fixtures';

test('T-0278 · BUG-03 · QA-19: the editor appears when indexedDB.open never answers', async ({
  page,
}) => {
  await page.addInitScript(() => {
    // An open request that fires no event at all.
    indexedDB.open = () => ({}) as IDBOpenDBRequest;
  });
  await page.goto('./');
  await expect(page.locator('.ans-toolbar')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('T-0279 · BUG-03 · QA-19: a failure at start is shown on the boot screen', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'crypto', { value: {} });
  });
  await page.goto('./');
  const boot = page.locator('#ans-boot');
  await expect(boot).toContainText('AriadneNSD could not start');
  await expect(boot.locator('pre')).toContainText('step:');
});
