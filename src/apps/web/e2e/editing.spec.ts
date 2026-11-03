// Editing commands in the browser that the acceptance tests do not cover: extracting blocks into
// a new Method (R-EDIT-19, interaction rules "새 Method로 빼기와 새 다이어그램").
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

import {
  canvas,
  drawnText,
  middleOf,
  onThisComputer,
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

test('T-0839 · R-EDIT-19 · UX XM1 · UX XM2: m extracts the selected blocks; after the name the call block is selected and the Method sits right after its source', async ({
  page,
}) => {
  await useFakeFiles(page);
  await openApp(page);
  await canvas(page).focus();
  // A Method "sort" with three blocks, then a Method "show".
  await page.keyboard.press('Shift+M');
  await typeText(page, 'sort');
  await page.keyboard.press('j');
  await page.keyboard.press('Enter');
  await typeText(page, 'one');
  for (const text of ['two', 'three']) {
    await page.keyboard.press('o');
    await typeText(page, text);
  }
  await page.keyboard.press('Shift+M');
  await typeText(page, 'show');

  const two = await middleOf(drawnText(page, 'two'));
  await page.mouse.click(two.x, two.y);
  await page.keyboard.press('Shift+ArrowDown');
  await expect(selection(page)).toHaveText('2 blocks');
  await page.keyboard.press('m');
  await expect(statusBar(page)).toContainText(
    'Extracted 2 block(s) into a new Method. Type its name.',
  );
  await typeText(page, 'merge');
  await expect(selection(page)).toHaveText('Call block');
  await expect(statusBar(page)).toContainText('Extracted 2 block(s) into the new Method merge.');

  const writes = await writeCount(page);
  await page.keyboard.press('Control+S');
  await onThisComputer(page);
  await expect.poll(() => writeCount(page)).toBe(writes + 1);
  const saved = await writtenText(page, 'Untitled.ns.svg');
  const match = /<!\[CDATA\[([\s\S]*?)\]\]>/.exec(saved ?? '');
  const model = JSON.parse(match?.[1] ?? '{}') as {
    readonly diagrams: ReadonlyArray<{ readonly head?: { readonly text: string } }>;
  };
  expect(model.diagrams.map((d) => d.head?.text ?? null)).toEqual(['sort', 'merge', 'show']);

  // One undo puts the blocks back.
  await page.keyboard.press('u');
  await expect(drawnText(page, 'merge')).toHaveCount(0);
  await expect(drawnText(page, 'two')).toBeVisible();
});

test('T-0840 · R-EDIT-19 · UX XM3: in a diagram without a header m asks; Esc cancels, 2 adds a Method header, Enter extracts', async ({
  page,
}) => {
  await openApp(page);
  await canvas(page).focus();
  await page.keyboard.press('Enter');
  await typeText(page, 'step');
  const list = page.getByRole('menu', { name: 'Method' });

  await page.keyboard.press('m');
  await expect(list.getByRole('menuitem')).toHaveText([
    /Extract into New Method\s*1/,
    /Add Method Header\s*2/,
  ]);
  await expect(list.getByRole('menuitem').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(list).toHaveCount(0);
  await expect(drawnText(page, 'Method 1')).toHaveCount(0);

  await page.keyboard.press('m');
  await page.keyboard.press('2');
  await typeText(page, 'main');
  await expect(selection(page)).toHaveText('Method header "main"');
  // Adding the header and naming it are two undo steps.
  await page.keyboard.press('u');
  await page.keyboard.press('u');
  await expect(drawnText(page, 'main')).toHaveCount(0);
  await expect(drawnText(page, 'Method 1')).toHaveCount(0);

  const step = await middleOf(drawnText(page, 'step'));
  await page.mouse.click(step.x, step.y);
  await page.keyboard.press('m');
  await page.keyboard.press('Enter');
  await expect(statusBar(page)).toContainText('Extracted 1 block(s) into a new Method.');
  await typeText(page, 'work');
  await expect(selection(page)).toHaveText('Call block');
});
