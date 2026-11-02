// The user guide's pictures for the reference part (DR-0020), taken in the real app, one run per
// screen language (playwright.manual.config.ts). Output goes to apps/manual/img/<lang>/ref-*.png.
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import { openApp } from '../e2e/support';

test.use({ viewport: { width: 1100, height: 700 } });

const manualDirectory = new URL('../../manual/', import.meta.url);

function lang(): 'ko' | 'en' {
  return test.info().project.name === 'ko' ? 'ko' : 'en';
}

async function pathOf(name: string): Promise<string> {
  const directory = new URL(`img/${lang()}/`, manualDirectory);
  await mkdir(directory, { recursive: true });
  return fileURLToPath(new URL(`ref-${name}.png`, directory));
}

/** Saves the diagrams with a margin, or the whole window. */
async function shot(page: Page, name: string, whole = false): Promise<void> {
  await page.waitForTimeout(300);
  if (whole) {
    await page.screenshot({ path: await pathOf(name) });
    return;
  }
  const box = await page.locator('.ans-document').boundingBox();
  if (box === null) throw new Error('the document is not on the screen');
  const pad = 20;
  await page.screenshot({
    path: await pathOf(name),
    clip: {
      x: box.x - pad,
      y: box.y - pad,
      width: box.width + 2 * pad,
      height: box.height + 2 * pad,
    },
  });
}

async function type(page: Page, text: string): Promise<void> {
  await expect(page.locator('.ans-inline-editor')).toBeFocused();
  await page.keyboard.type(text);
  await page.keyboard.press('Enter');
}

async function press(page: Page, ...keys: ReadonlyArray<string>): Promise<void> {
  for (const key of keys) await page.keyboard.press(key);
}

test('blocks, insert hint, branches, move', async ({ page }) => {
  await openApp(page);
  await page.keyboard.press('Enter');
  await type(page, 'x ← read()');
  // The insert hint: `a` and a pause shows the block kinds.
  await page.keyboard.press('a');
  await page.waitForTimeout(600);
  await shot(page, 'insert-hint', true);
  await page.keyboard.press('i');
  await type(page, 'x > 0');
  for (const [letter, text] of [
    ['k', 'cmd'],
    ['w', 'i < n'],
    ['f', 'for i ← 1 to n'],
    ['d', 'until done'],
  ] as const) {
    await press(page, 'a', letter);
    await type(page, text);
  }
  await shot(page, 'blocks');
  // Branches: the Case's first branch label, then a new branch after it.
  await press(page, 'g', 'g');
  await press(page, 'j', 'j', 'j', 'j', 'k');
  await shot(page, 'branch-label');
  await page.keyboard.press('o');
  await type(page, '3');
  await shot(page, 'branch-added');
});

test('move a block', async ({ page }) => {
  await openApp(page);
  await page.keyboard.press('Enter');
  await type(page, 'a');
  for (const text of ['b', 'c']) {
    await page.keyboard.press('o');
    await type(page, text);
  }
  await shot(page, 'move-before');
  await page.keyboard.press('Alt+k');
  await shot(page, 'move-after');
});

test('an example with an Event, a Method and a call', async ({ page }) => {
  await openApp(page);
  await page.locator('.ans-toolbar [data-command="help.examples"]').click();
  await page.locator('[data-example="binary-search"]').click();
  await page.waitForTimeout(500);
  await shot(page, 'event-method');
});

test('menus: file, context menu, command palette', async ({ page }) => {
  await openApp(page);
  await page.keyboard.press('Enter');
  await type(page, lang() === 'ko' ? '처리' : 'step');
  await page
    .getByRole('menubar')
    .getByText(lang() === 'ko' ? '파일' : 'File', { exact: true })
    .click();
  await shot(page, 'file-menu', true);
  await page.keyboard.press('Escape');
  await page.locator('.ans-canvas[tabindex]').focus();
  await page.keyboard.press('Shift+F10');
  await shot(page, 'context-menu', true);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+Shift+P');
  await page.keyboard.type(lang() === 'ko' ? '감싸' : 'wrap');
  await shot(page, 'palette', true);
});
