// The examples (R-EDIT-25, 05-screen-layout "예제", UX EX1 ~ EX3): the first visit's welcome,
// Help › Examples… and the toolbar's "Examples ▾".
import { expect, test } from '@playwright/test';

import { command, openApp } from './support';

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

test('UX EX3: the toolbar\'s "Examples ▾" lists the ten examples in order', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Examples' }).click();
  const items = page.locator('.ans-dropdown [role="menuitem"]');
  await expect(items).toHaveCount(10);
  await expect(items.first()).toContainText('Merge sort');
  await expect(items.last()).toContainText('Raft consensus');
  await items.nth(1).click();
  await expect(page).toHaveTitle("Dijkstra's shortest path.ns.svg – AriadneNSD");
  expect(await command(page, 'file.new').count()).toBeGreaterThan(0);
});
