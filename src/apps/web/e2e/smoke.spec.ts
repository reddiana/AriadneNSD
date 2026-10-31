import { expect, test } from '@playwright/test';

test('the built web app opens and loads the block font', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveTitle('AriadneNSD');
  await expect(page.getByRole('heading', { name: 'AriadneNSD' })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        [...document.fonts].some(
          (face) =>
            face.family.replaceAll('"', '') === 'AriadneNSD Block' && face.status === 'loaded',
        ),
      ),
    )
    .toBe(true);
});
