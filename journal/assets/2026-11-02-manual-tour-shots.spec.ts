// One-off: screenshots of the "5분 둘러보기" draft (M49), taken in the real app (Korean screen).
// A copy lives in journal/assets/2026-11-02-manual-tour-shots.spec.ts.
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { openApp } from './support';

const out = '../../../journal/assets/2026-11-02-manual-tour-';
test.use({ locale: 'ko-KR', viewport: { width: 1100, height: 700 } });

async function shot(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(250);
  const box = await page.locator('.ans-document').boundingBox();
  if (box === null) throw new Error('no document');
  const pad = 20;
  await page.screenshot({
    path: `${out}${name}.png`,
    clip: { x: box.x - pad, y: box.y - pad, width: box.width + 2 * pad, height: box.height + 2 * pad + 40 },
  });
}

async function type(page: Page, text: string): Promise<void> {
  await expect(page.locator('.ans-inline-editor')).toBeFocused();
  await page.keyboard.type(text);
}

test('tour', async ({ page }) => {
  await openApp(page);
  await page.screenshot({ path: `${out}0-screen.png` });
  await shot(page, '1a-empty');
  await page.keyboard.press('Enter');
  await type(page, 'sum ← 0');
  await shot(page, '1b-typing');
  await page.keyboard.press('Enter');
  await shot(page, '1c-done');
  for (const text of ['i ← 0', 'sum ← sum + a[i]', 'i ← i + 1']) {
    await page.keyboard.press('o');
    await type(page, text);
    await page.keyboard.press('Enter');
  }
  await shot(page, '2-more');
  await page.screenshot({ path: `${out}2-more-full.png` });
  await page.keyboard.press('Shift+ArrowUp');
  await shot(page, '3a-selected');
  await page.screenshot({ path: `${out}3a-selected-full.png` });
  await page.keyboard.press('s');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}3b-hint.png` });
  await page.keyboard.press('w');
  await type(page, 'i < n');
  await shot(page, '3c-typing');
  await page.keyboard.press('Enter');
  await shot(page, '3d-done');
  await page.screenshot({ path: `${out}3d-done-full.png` });
  await page.keyboard.press('a');
  await page.keyboard.press('i');
  await type(page, 'n > 0');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await shot(page, '4a-branch');
  await page.keyboard.press('Enter');
  await type(page, 'avg ← sum / n');
  await page.keyboard.press('Enter');
  await shot(page, '4b-done');
  await page.screenshot({ path: `${out}5-screen.png` });
});
