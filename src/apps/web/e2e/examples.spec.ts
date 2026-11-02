// The examples (R-EDIT-25, 05-screen-layout "예제", UX EX1 ~ EX3): the first visit's welcome,
// Help › Examples… and the toolbar's "Examples", which open the same modal.
import { expect, test } from '@playwright/test';

import { canvas, command, openApp } from './support';

const modal = '.ans-backdrop[data-kind="examples"] .ans-modal';

test('R-EDIT-25: a first visit is welcomed with ten examples, a blank document and open file', async ({
  page,
}) => {
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const dialog = page.locator(modal);
  await expect(dialog.locator('h2')).toHaveText('Welcome to AriadneNSD');
  await expect(dialog.locator('.ans-example-card')).toHaveCount(12);
  await expect(dialog.locator('.ans-example-name').first()).toContainText('Merge sort');

  await dialog.locator('[data-example="merge-sort"]').click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveTitle('Merge sort.ns.svg – AriadneNSD');
  await expect(page.locator('.ans-canvas svg text', { hasText: 'Method' }).first()).toBeVisible();

  // Answered once: not asked again.
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator(modal)).toHaveCount(0);
});

test('UX EX2: closing the welcome with Esc keeps the new document and does not ask again', async ({
  page,
}) => {
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator(modal)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator(modal)).toHaveCount(0);
  await expect(page).toHaveTitle('Untitled.ns.svg – AriadneNSD');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator(modal)).toHaveCount(0);
});

test('UX EX3: Help › Examples… opens the same modal with its own words', async ({ page }) => {
  await openApp(page);
  await expect(page.locator(modal)).toHaveCount(0);
  await page.getByRole('button', { name: 'Help' }).click();
  await page.getByRole('menuitem', { name: 'Examples…' }).click();
  const dialog = page.locator(modal);
  await expect(dialog.locator('h2')).toHaveText('Open an Example');
  await expect(dialog.locator('[data-example="blank"]')).toContainText('Blank document');
  await dialog.locator('[data-example="raft"]').click();
  await expect(page).toHaveTitle('Raft consensus.ns.svg – AriadneNSD');
});

test('UX EX3: the toolbar\'s "Examples" opens the examples modal', async ({ page }) => {
  await openApp(page);
  await page.getByRole('toolbar').getByRole('button', { name: 'Examples' }).click();
  const dialog = page.locator(modal);
  await expect(dialog.locator('h2')).toHaveText('Open an Example');
  await expect(dialog.locator('.ans-example-card')).toHaveCount(12);
  await expect(dialog.locator('.ans-example-name').first()).toContainText('Merge sort');
  await dialog.locator('[data-example="dijkstra"]').click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveTitle("Dijkstra's shortest path.ns.svg – AriadneNSD");
  expect(await command(page, 'file.new').count()).toBeGreaterThan(0);
});

test("BUG-02: the toolbar's dropdown opens over the canvas, not inside the toolbar", async ({
  page,
}) => {
  await openApp(page);
  await page.locator('.ans-toolbar button[title="Zoom"]').click();
  const last = page.locator('.ans-dropdown [role="menuitem"]').last();
  await expect(last).toBeVisible();
  // The toolbar must not clip it: the element seen at the item's centre is the item.
  const isOnTop = await last.evaluate((item) => {
    const box = item.getBoundingClientRect();
    const seen = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    return seen !== null && item.contains(seen);
  });
  expect(isOnTop).toBe(true);
});

test('BUG-01: a diagram larger than the window scrolls in the canvas', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 600 });
  await openApp(page);
  await page.getByRole('toolbar').getByRole('button', { name: 'Examples' }).click();
  await page.locator(`${modal} [data-example="raft"]`).click();
  await expect(page).toHaveTitle('Raft consensus.ns.svg – AriadneNSD');
  const area = canvas(page);
  await expect(area).toHaveCSS('overflow', 'auto');
  const sizes = await area.evaluate((element) => ({
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
  }));
  expect(sizes.scrollHeight).toBeGreaterThan(sizes.clientHeight);
  await area.evaluate((element) => {
    element.scrollTop = 200;
  });
  expect(await area.evaluate((element) => element.scrollTop)).toBe(200);
});

test('BUG-05: Escape closes a menu opened with the mouse', async ({ page }) => {
  await openApp(page);
  await page.getByRole('menubar').getByText('File', { exact: true }).click();
  const menu = page.getByRole('menu', { name: 'File' });
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
});
