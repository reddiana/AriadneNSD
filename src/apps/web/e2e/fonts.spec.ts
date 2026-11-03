// The screen font in slices (ADR-0040): the browser downloads only the slices whose characters
// are on screen, so a first visit does not wait for all of Hangul.
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import { command, openApp } from './support';

/** The slice numbers of the screen font the page has downloaded, in order. */
function loadedSlices(page: Page): Promise<number[]> {
  return page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .flatMap((entry) => /mono-regular\.(\d\d)-[\w-]+\.woff2/.exec(entry.name)?.[1] ?? [])
      .map(Number)
      .sort((a, b) => a - b),
  );
}

test('T-0524: an empty document downloads only slice 0 of the screen font', async ({ page }) => {
  await openApp(page);
  await expect.poll(() => loadedSlices(page)).toEqual([0]);
});

test('T-0525: Korean text downloads the Hangul slices it uses, not all of them', async ({
  page,
}) => {
  await openApp(page);
  await command(page, 'block.insert.process').click();
  await page.keyboard.type('정렬한다');
  await page.keyboard.press('Escape');
  // 정 · 렬 · 한 · 다 are common syllables: slices 3 and up, a few of the 38.
  await expect.poll(async () => (await loadedSlices(page)).length).toBeGreaterThan(1);
  const slices = await loadedSlices(page);
  expect(slices[0]).toBe(0);
  expect(slices.length).toBeLessThanOrEqual(5);
  expect(slices.slice(1).every((slice) => slice >= 3)).toBe(true);
  // The drawn text uses the block font, not a fallback.
  const isLoaded = await page.evaluate(() =>
    document.fonts.check("13px 'AriadneNSD Mono'", '정렬'),
  );
  expect(isLoaded).toBe(true);
});
