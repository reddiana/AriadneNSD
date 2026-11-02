// The canvas: what clicks and focus do around the keys (UX K4, CF1).
import { expect, test } from '@playwright/test';

import { canvas, drawnText, middleOf, openApp } from './support';

test('BUG-08: a click on the empty canvas closes the key hint of a waiting a', async ({ page }) => {
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

test('UX CF1: with nothing selected the canvas draws no focus outline', async ({ page }) => {
  await openApp(page);
  const area = canvas(page);
  await area.focus();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(area).toHaveCSS('box-shadow', 'none');
  await expect(area).toHaveCSS('outline-style', 'none');
});

test('BUG-09: dragging a block does not select the drawn text', async ({ page }) => {
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
