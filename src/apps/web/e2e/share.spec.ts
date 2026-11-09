// Share links and view mode in the browser (R-WEB-05, R-WEB-06): copy the link, open it in a new
// page, see the diagram without the editing UI, then "Edit" and change it.
import { expect, test } from './fixtures';
import { command, openApp } from './support';

test('T-0892: copies a share link that opens in view mode, and "Edit" makes it editable', async ({
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

test('T-0893: a damaged share link says why and opens the editor as usual', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ariadne-nsd.setting.examples.welcomed', 'true');
  });
  await page.goto('./#ns1.d.AAAA');
  // The reason, in a modal (UX LG6); the editor starts as usual once it is closed.
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('This share link is damaged');
  await expect(dialog).toContainText('Reason: the link does not unpack');
  await dialog.locator('.ans-dialog-buttons').getByRole('button', { name: 'Close' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.ans-viewbar')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('T-1128 · R-WEB-10 · UX LG2 · UX LG6: a link another AI wrote by hand (u) opens in view mode; a broken one says why and copies the reason', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const model = {
    format: 'ariadne-nsd',
    version: 1,
    settings: { textKind: 'plain', theme: 'default', headStyle: 'title', locale: 'ko' },
    diagrams: [
      {
        id: 'd1',
        head: { kind: 'method', text: '최댓값(a, n)' },
        body: [
          { id: 'b1', kind: 'process', text: 'm = a[0]' },
          {
            id: 'b2',
            kind: 'if',
            text: 'a[1] > m',
            yes: { id: 'r1', body: [{ id: 'b3', kind: 'process', text: 'm = a[1]' }] },
            no: { id: 'r2', body: [{ id: 'b4', kind: 'process', text: '' }] },
          },
        ],
      },
    ],
    view: { folded: [], opened: [], bands: true, resultSymbol: '←' },
  };
  const envelope = JSON.stringify({ name: '최댓값.ns.svg', model });
  await page.goto(`./#ns1.u.${encodeURIComponent(envelope)}`);
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.ans-viewbar')).toBeVisible();
  await expect(page.locator('.ans-document text').filter({ hasText: /^m = a\[1\]$/ })).toHaveCount(
    1,
  );
  await expect(page).toHaveTitle('최댓값.ns.svg – AriadneNSD');

  // The same link with its last "}" missing, pasted into the address bar.
  await page.evaluate(
    (hash) => {
      window.location.hash = hash;
    },
    `ns1.u.${encodeURIComponent(envelope.slice(0, -1))}`,
  );
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText("Reason: the link's JSON does not read");
  await expect(dialog).toContainText('"{" but');
  await dialog.getByRole('button', { name: 'Copy Reason' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // The notice shows in view mode's bar once the clipboard has it.
  await expect(page.locator('.ans-viewbar')).toContainText('Copied the reason.');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(/^AriadneNSD could not open the share link \(damaged\): /);
  expect(copied).toMatch(/How to make a link that opens: http:\/\/localhost:\d+\/llms\.txt$/);
  // The document that was open stays.
  await expect(page.locator('.ans-document text').filter({ hasText: /^m = a\[1\]$/ })).toHaveCount(
    1,
  );
});

test('T-0894: a share link pasted into the address bar of an open page opens in view mode', async ({
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
