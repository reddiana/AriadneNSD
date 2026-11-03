// The canvas: what clicks and focus do around the keys (UX K4, CF2, CM1), and its context menu.
import { expect, test } from '@playwright/test';

import { canvas, drawnText, middleOf, openApp, press } from './support';

test('T-0203 · BUG-08: a click on the empty canvas closes the key hint of a waiting a', async ({
  page,
}) => {
  await openApp(page);
  const area = canvas(page);
  await area.focus();
  await page.keyboard.press('a');
  const hint = page.locator('.ans-keyhint');
  await expect(hint).toBeVisible();
  const box = await area.boundingBox();
  if (box === null) {
    throw new Error('no canvas');
  }
  // Far right and low: empty canvas, away from the diagram.
  await page.mouse.click(box.x + box.width - 20, box.y + box.height - 20);
  await expect(hint).toHaveCount(0);
});

test('T-0204 · UX CF2: with nothing selected the focus outline shows for a moment only', async ({
  page,
}) => {
  await openApp(page);
  const area = canvas(page);
  await area.focus();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  // A key that does nothing shows it, and it goes after a second.
  await page.keyboard.press('q');
  await expect(area).toHaveClass(/ans-focus-flash/);
  await expect(area).not.toHaveClass(/ans-focus-flash/, { timeout: 3000 });
  await expect(area).toHaveCSS('box-shadow', 'none');
  // A click on the empty canvas shows it too.
  const box = await area.boundingBox();
  if (box === null) {
    throw new Error('no canvas');
  }
  await page.mouse.click(box.x + box.width - 20, box.y + box.height - 20);
  await expect(area).toHaveClass(/ans-focus-flash/);
});

test('T-0205 · BUG-09: dragging a block does not select the drawn text', async ({ page }) => {
  await openApp(page);
  await canvas(page).focus();
  await page.keyboard.press('Enter');
  await page.keyboard.type('first');
  await page.keyboard.press('Enter');
  for (const text of ['second', 'third']) {
    await page.keyboard.press('o');
    await page.keyboard.type(text);
    await page.keyboard.press('Enter');
  }
  const from = await middleOf(drawnText(page, 'first'));
  const to = await middleOf(drawnText(page, 'third'));
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y + 10, { steps: 10 });
  expect(await page.evaluate(() => window.getSelection()?.toString() ?? '')).toBe('');
  await page.mouse.up();
});

test('T-0206 · UX CM1: a right click on the empty canvas shows the File and Help menus', async ({
  page,
}) => {
  await openApp(page);
  const area = canvas(page);
  const box = await area.boundingBox();
  if (box === null) {
    throw new Error('no canvas');
  }
  await page.mouse.click(box.x + box.width - 20, box.y + box.height - 20, { button: 'right' });
  const menu = page.getByRole('menu', { name: 'Context menu' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: /^Save/ }).first()).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: /^Examples/ })).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: /^Copy/ })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
});

test('T-0522: a submenu near the right edge stays in the window, and h / l close and open it', async ({
  page,
}) => {
  // Narrow, so the submenu has no room on the right of the context menu.
  await page.setViewportSize({ width: 480, height: 700 });
  await openApp(page);
  await press(page, 'a', 'p');
  await page.keyboard.type('edge');
  await page.keyboard.press('Escape');
  await drawnText(page, 'edge').click({ button: 'right' });
  const menu = page.getByRole('menu', { name: 'Context menu' });
  await expect(menu).toBeVisible();
  const insert = menu.getByRole('menuitem', { name: 'Insert', exact: true });
  await insert.focus();
  await page.keyboard.press('l');
  const submenu = page.getByRole('menu', { name: 'Insert', exact: true });
  await expect(submenu).toBeVisible();
  const box = await submenu.boundingBox();
  expect(box).not.toBeNull();
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(480);
  expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
  await page.keyboard.press('h');
  await expect(submenu).toHaveCount(0);
  await expect(insert).toBeFocused();
});
