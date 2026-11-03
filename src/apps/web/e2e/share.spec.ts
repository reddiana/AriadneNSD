// Share links and view mode in the browser (R-WEB-05, R-WEB-06): copy the link, open it in a new
// page, see the diagram without the editing UI, then "Edit" and change it.
import { expect, test } from './fixtures';
import { command, openApp } from './support';

test('copies a share link that opens in view mode, and "Edit" makes it editable', async ({
  page,
  context,
  browser,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openApp(page);
  await command(page, 'block.insert.if').click();
  await page.keyboard.type('shared text');
  await page.keyboard.press('Enter');

  await page.getByRole('button', { name: 'File' }).click();
  await page.getByRole('menuitem', { name: 'Copy Share Link' }).click();
  await expect(page.locator('.ans-statusbar')).toContainText('Copied the share link.');
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toMatch(/^http:\/\/localhost:\d+\/#ns1\.d\.[A-Za-z0-9_-]+$/);

  // Another person's browser, on a first visit: a link does not show the examples' welcome.
  const reader = await (await browser.newContext()).newPage();
  await reader.goto(link);
  await expect(reader.locator('html')).toHaveAttribute('data-ready', 'true');
  await expect(reader.locator('.ans-viewbar')).toBeVisible();
  await expect(reader.locator('.ans-menubar')).toHaveCount(0);
  await expect(reader.locator('.ans-toolbar')).toHaveCount(0);
  await expect(reader.locator('.ans-statusbar')).toHaveCount(0);
  await expect(reader.locator('.ans-backdrop')).toHaveCount(0);
  await expect(
    reader.locator('.ans-document text').filter({ hasText: /^shared text$/ }),
  ).toHaveCount(1);
  await expect(reader).toHaveTitle('Untitled.ns.svg – AriadneNSD');

  // Keys that edit do nothing in view mode and say why in the bar.
  await reader.locator('.ans-canvas[tabindex]').focus();
  await reader.keyboard.press('j');
  await reader.keyboard.press('Delete');
  await expect(
    reader.locator('.ans-document text').filter({ hasText: /^shared text$/ }),
  ).toHaveCount(1);

  await reader.getByTestId('view-edit').click();
  await expect(reader.locator('.ans-viewbar')).toHaveCount(0);
  await expect(reader.locator('.ans-menubar')).toBeVisible();
  // The link leaves the address bar: a reload restores the local backup of the edits instead.
  expect(new URL(reader.url()).hash).toBe('');
  await command(reader, 'block.insert.process').click();
  await reader.keyboard.type('added');
  await reader.keyboard.press('Enter');
  await expect(reader.locator('.ans-document text').filter({ hasText: /^added$/ })).toHaveCount(1);
  await expect(reader).toHaveTitle('● Untitled.ns.svg – AriadneNSD');
});

test('a damaged share link says why and opens the editor as usual', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ariadne-nsd.setting.examples.welcomed', 'true');
  });
  await page.goto('./#ns1.d.AAAA');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.ans-viewbar')).toHaveCount(0);
  await expect(page.locator('.ans-statusbar')).toContainText('This share link is damaged');
});

test('a share link pasted into the address bar of an open page opens in view mode', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openApp(page);
  await page.getByRole('button', { name: 'File' }).click();
  await page.getByRole('menuitem', { name: 'Copy Share Link' }).click();
  await expect(page.locator('.ans-statusbar')).toContainText('Copied the share link.');
  const link = await page.evaluate(() => navigator.clipboard.readText());
  // Only the fragment changes: the page is not loaded again.
  await page.evaluate((hash) => {
    window.location.hash = hash;
  }, new URL(link).hash);
  await expect(page.locator('.ans-viewbar')).toBeVisible();
});
