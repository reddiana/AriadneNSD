// Export and print in the browser (06-web 1.2, 1.4 to 1.6): SVG without the model (R-EXP-02), PDF and
// the print view (R-EXP-03), a drawing changed by another tool (R-FMT-09) and text saved as
// outlines (R-FMT-10). The download flow takes the files, as in Firefox and Safari.
import { readFile } from 'node:fs/promises';

import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';
import { canvas, command, onThisComputer, openApp } from './support';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const target = window as unknown as Record<string, unknown>;
    delete target.showOpenFilePicker;
    delete target.showSaveFilePicker;
    // The print dialog cannot be driven; count the calls instead.
    target.printCalls = 0;
    target.print = () => {
      (target as { printCalls: number }).printCalls += 1;
    };
  });
});

/** Opens File › Export ▸ and runs one of its items. */
async function exportAs(page: Page, name: string): Promise<string> {
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'File', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Export', exact: true }).hover();
  await page.getByRole('menuitem', { name }).click();
  const download = await downloading;
  return download.suggestedFilename() + '\n' + (await download.path());
}

/** Saves the document (a download) and gives the file's text. */
async function savedText(page: Page): Promise<string> {
  const downloading = page.waitForEvent('download');
  await command(page, 'file.save').click();
  // A first save asks where (R-WEB-09, UX BS1).
  await onThisComputer(page);
  return readFile(await (await downloading).path(), 'utf8');
}

async function openText(page: Page, name: string, text: string): Promise<void> {
  const choosing = page.waitForEvent('filechooser');
  await command(page, 'file.open').click();
  await onThisComputer(page);
  await (await choosing).setFiles({ name, mimeType: 'image/svg+xml', buffer: Buffer.from(text) });
}

test('T-0987: exports the drawing as an SVG without the model', async ({ page }) => {
  await openApp(page);
  await command(page, 'block.insert.if').click();
  await page.keyboard.press('Escape');
  const [name, path] = (await exportAs(page, 'Export as SVG (Drawing Only)…')).split('\n');
  expect(name).toBe('Untitled.svg');
  const svg = await readFile(path ?? '', 'utf8');
  expect(svg).toContain('<g class="ans-render"');
  expect(svg).toContain('@font-face');
  expect(svg).not.toContain('<metadata>');
  await expect(page.getByText('Exported “Untitled.svg”')).toBeVisible();
});

test('T-0988: exports a PDF cut into pages', async ({ page }) => {
  await openApp(page);
  await command(page, 'block.insert.if').click();
  await page.keyboard.press('Escape');
  const [name, path] = (await exportAs(page, 'Export as PDF…')).split('\n');
  expect(name).toBe('Untitled.pdf');
  const pdf = (await readFile(path ?? '')).toString('latin1');
  expect(pdf.startsWith('%PDF-1.4')).toBe(true);
  expect(pdf).toMatch(/\/Type \/Pages \/Kids \[[^\]]*\] \/Count 1/);
  await expect(page.getByText('Exported “Untitled.pdf”')).toBeVisible();
});

test('T-0989: prints through the print view, from the menu and with Ctrl+P', async ({ page }) => {
  await openApp(page);
  await command(page, 'block.insert.while').click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'File', exact: true }).click();
  await page.getByRole('menuitem', { name: /^Print…/ }).click();
  expect(await page.evaluate(() => (window as unknown as { printCalls: number }).printCalls)).toBe(
    1,
  );
  const view = page.locator('.ans-print');
  await expect(view.locator('.ans-print-page')).toHaveCount(1);
  // On screen the view is hidden; when printing only the view shows.
  await expect(view).toBeHidden();
  await page.emulateMedia({ media: 'print' });
  await expect(view.locator('.ans-print-page')).toBeVisible();
  await expect(page.locator('#root')).toBeHidden();
  await page.emulateMedia({ media: 'screen' });

  await canvas(page).focus();
  await page.keyboard.press('Control+p');
  expect(await page.evaluate(() => (window as unknown as { printCalls: number }).printCalls)).toBe(
    2,
  );
  await expect(page.locator('.ans-print')).toHaveCount(1);
});

test('T-0990: tells that a drawing changed by another tool differs from the model', async ({
  page,
}) => {
  await openApp(page);
  await command(page, 'block.insert.if').click();
  await page.keyboard.press('Escape');
  const text = await savedText(page);
  await openText(page, 'drawn.ns.svg', text.replace('</svg>', '<circle r="3"/></svg>'));
  await expect(
    page.getByText('The drawing in “drawn.ns.svg” was changed by another tool'),
  ).toBeVisible();

  await openText(page, 'same.ns.svg', text);
  await expect(page).toHaveTitle('same.ns.svg – AriadneNSD');
  await expect(page.getByText('was changed by another tool')).toHaveCount(0);
});

test('T-0991: saves text as outlines when the document setting is on', async ({ page }) => {
  await openApp(page);
  await command(page, 'block.insert.if').click();
  await page.keyboard.type('x > 0');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Diagram', exact: true }).click();
  await page.getByRole('menuitem', { name: /Document Settings/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Document Settings' });
  await dialog.getByLabel('Save text as outlines').selectOption({ label: 'On' });
  await page.keyboard.press('Escape');
  const text = await savedText(page);
  expect(text).toContain('"textOutlines": true');
  expect(text).not.toContain('<text');
  // The screen still draws text.
  await expect(page.locator('.ans-document text').first()).toBeVisible();
});
