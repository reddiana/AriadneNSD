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

test('T-0863 · R-LAY-06 · R-LAY-07: the block text language colors the keywords on screen, and undo takes it back', async ({
  page,
}) => {
  await openApp(page);
  await canvas(page).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.ans-inline-editor')).toBeFocused();
  await page.keyboard.type('return 0  # done');
  await page.keyboard.press('Enter');
  await expect(canvas(page)).toBeFocused();
  const colored = page.locator('.ans-document text tspan');
  await expect(colored).toHaveCount(0);

  await page.getByRole('button', { name: 'Diagram', exact: true }).click();
  await page.getByRole('menuitem', { name: /Document Settings/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Document Settings' });
  await expect(dialog.getByText('Syntax highlighting')).toBeVisible();
  const language = dialog.getByLabel('Block text language');
  await expect(language).toHaveValue('0');
  await language.selectOption({ label: 'Python' });
  await expect(colored.filter({ hasText: /^return$/ })).toHaveAttribute('fill', '#1f45d6');
  await expect(colored.filter({ hasText: /^0$/ })).toHaveAttribute('fill', '#8a5a00');
  await expect(colored.filter({ hasText: /^# done$/ })).toHaveAttribute('fill', '#22702a');

  await page.keyboard.press('Escape');
  await canvas(page).focus();
  await page.keyboard.press('Control+z');
  await expect(colored).toHaveCount(0);
});
