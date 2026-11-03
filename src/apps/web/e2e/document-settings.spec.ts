// Document Settings (UX W5): the settings saved in the file, such as the language of drawn labels.
import { expect, test } from './fixtures';

import { canvas, drawnText, openApp, press } from './support';

test('T-0812: ADR-0041 · UX Q9: the language of drawn labels redraws the If branches, and undo puts them back', async ({
  page,
}) => {
  await openApp(page);
  await canvas(page).focus();
  await press(page, 'a', 'i');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(drawnText(page, 'true')).toBeVisible();

  await page.getByRole('button', { name: 'Diagram', exact: true }).click();
  await page.getByRole('menuitem', { name: /Document Settings/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Document Settings' });
  await expect(dialog.getByText('true · false, ⋯ n blocks')).toBeVisible();
  await dialog.getByLabel('Language of drawn labels').selectOption({ label: '한국어' });
  await expect(drawnText(page, '참')).toBeVisible();
  await expect(drawnText(page, '거짓')).toBeVisible();
  // The menus stay in the screen language.
  await expect(dialog.getByRole('heading', { name: 'Document Settings' })).toBeVisible();

  await page.keyboard.press('Escape');
  await canvas(page).focus();
  await page.keyboard.press('Control+z');
  await expect(drawnText(page, 'true')).toBeVisible();
  await expect(drawnText(page, '참')).toHaveCount(0);
});
