// Folding in the browser (interaction rules 4, R-EDIT-13, R-EDIT-14, R-EDIT-23, R-FMT-11): fold
// regions made, named, folded and saved as they are shown.
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

import {
  canvas,
  drawnText,
  middleOf,
  openApp,
  selection,
  statusBar,
  useFakeFiles,
  writeCount,
  writtenText,
} from './support';

/** Types into the open inline editor and closes it with Enter. */
async function typeText(page: Page, text: string): Promise<void> {
  await expect(page.locator('.ans-inline-editor')).toBeFocused();
  await page.keyboard.type(text);
  await page.keyboard.press('Enter');
  await expect(canvas(page)).toBeFocused();
}

/** Writes three process blocks "one" "two" "three" into a new document. */
async function threeBlocks(page: Page): Promise<void> {
  await canvas(page).focus();
  await page.keyboard.press('Enter');
  await typeText(page, 'one');
  for (const text of ['two', 'three']) {
    await page.keyboard.press('o');
    await typeText(page, text);
  }
}

test('fold region: zf folds the selected blocks into a named cell, the triangle unfolds it, and the file keeps it', async ({
  page,
}) => {
  await useFakeFiles(page);
  await openApp(page);
  await threeBlocks(page);
  const one = await middleOf(drawnText(page, 'one'));
  await page.mouse.click(one.x, one.y);
  await page.keyboard.press('Shift+ArrowDown');
  await page.keyboard.press('z');
  await page.keyboard.press('f');
  await expect(statusBar(page)).toContainText('Made a fold region.');
  await typeText(page, 'start');
  await expect(selection(page)).toHaveText('Fold region "start"');
  // Folded: the name in one cell, the blocks are not drawn.
  await expect(drawnText(page, 'start')).toBeVisible();
  await expect(drawnText(page, 'two')).toHaveCount(0);
  await expect(page.locator('.ans-overlay polygon')).toHaveCount(1);

  const writes = await writeCount(page);
  await page.keyboard.press('Control+S');
  await expect.poll(() => writeCount(page)).toBe(writes + 1);
  const saved = await writtenText(page, 'Untitled.ns.svg');
  const match = /<!\[CDATA\[([\s\S]*?)\]\]>/.exec(saved ?? '');
  const model = JSON.parse(match?.[1] ?? '{}') as {
    readonly diagrams: ReadonlyArray<{
      readonly folds?: ReadonlyArray<{ readonly name?: string }>;
    }>;
    readonly view: { readonly folded: ReadonlyArray<string> };
  };
  expect(model.diagrams[0]?.folds?.[0]?.name).toBe('start');
  expect(model.view.folded).toHaveLength(1);
  // The saved drawing is the screen: the cell with the name, not the blocks.
  expect(saved).toContain('>start</text>');
  expect(saved).not.toContain('>two</text>');

  // The triangle unfolds it: a frame with the name band, the blocks back.
  const triangle = await middleOf(page.locator('.ans-overlay polygon'));
  await page.mouse.click(triangle.x, triangle.y);
  await expect(drawnText(page, 'two')).toBeVisible();
  await expect(statusBar(page)).toContainText('Unfolded.');
});

test('fold: f on a While folds its body into one row; arrow keys pass it as one block', async ({
  page,
}) => {
  await openApp(page);
  await threeBlocks(page);
  const two = await middleOf(drawnText(page, 'two'));
  await page.mouse.click(two.x, two.y);
  await page.keyboard.press('Shift+ArrowDown');
  await page.keyboard.press('s');
  await page.keyboard.press('w');
  await typeText(page, 'i < n');
  await page.keyboard.press('f');
  await expect(drawnText(page, '2 blocks')).toBeVisible();
  await expect(drawnText(page, 'three')).toHaveCount(0);
  await page.keyboard.press('j');
  await expect(selection(page)).toHaveText('2 blocks');
  // Double-clicking the folded row unfolds it.
  const row = await middleOf(drawnText(page, '2 blocks'));
  await page.mouse.dblclick(row.x, row.y);
  await expect(drawnText(page, 'three')).toBeVisible();
});
