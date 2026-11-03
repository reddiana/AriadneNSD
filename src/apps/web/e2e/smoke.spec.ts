import { expect, test } from './fixtures';

test('T-0292: the built web app opens a new document and loads the block font', async ({
  page,
}) => {
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await expect(page).toHaveTitle('Untitled.ns.svg – AriadneNSD');
  await expect(page.locator('.ans-brand')).toHaveText('AriadneNSD');
  await expect
    .poll(() =>
      page.evaluate(() =>
        [...document.fonts].some(
          (face) =>
            face.family.replaceAll('"', '') === 'AriadneNSD Mono' && face.status === 'loaded',
        ),
      ),
    )
    .toBe(true);
});
