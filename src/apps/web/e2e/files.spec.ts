// Browser flows of the web shell (06-web 1, 2): new document → insert a block → save → open again.
// Native file dialogs cannot be driven, so each flow replaces what the dialog would give:
// - the download flow (Firefox, Safari) removes the File System Access pickers;
// - the file handle flow (Chromium) puts in-memory file handles behind the pickers.
import { readFile } from 'node:fs/promises';

import type { Page } from '@playwright/test';
import { strFromU8, unzipSync } from 'fflate';

import { expect, test } from './fixtures';
import { onThisComputer } from './support';

async function openApp(page: Page): Promise<void> {
  // The first visit's examples modal would cover the editor (UX EX2).
  await page.addInitScript(() => {
    localStorage.setItem('ariadne-nsd.setting.examples.welcomed', 'true');
  });
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
}

function command(page: Page, id: string) {
  return page.locator(`[data-command="${id}"]`).first();
}

test('T-0826 · UX US1: leaving an edited new document asks first; cancel keeps it, discard opens the other', async ({
  page,
}) => {
  await openApp(page);
  await command(page, 'block.insert.if').click();
  await page.keyboard.type('kept');
  await page.keyboard.press('Enter');
  await command(page, 'file.new').click();
  const question = page.getByRole('dialog');
  await expect(question).toContainText(
    '“Untitled.ns.svg” is a new document that has never been saved.',
  );
  // The close button ✕, then the four answers; Save is the default (Enter).
  await expect(question.getByRole('button')).toHaveText([
    '✕',
    'Discard and Open',
    'Cancel',
    'Save in Browser',
    'Save',
  ]);
  await question.getByRole('button', { name: 'Cancel' }).click();
  await expect(question).toHaveCount(0);
  await expect(page.locator('.ans-document text').filter({ hasText: /^kept$/ })).toHaveCount(1);
  await expect(page).toHaveTitle('● Untitled.ns.svg – AriadneNSD');

  await command(page, 'file.new').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Discard and Open' }).click();
  await expect(page.locator('.ans-document text').filter({ hasText: /^kept$/ })).toHaveCount(0);
  await expect(page).toHaveTitle('Untitled.ns.svg – AriadneNSD');
});

test.describe('download flow (no File System Access)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const target = window as unknown as Record<string, unknown>;
      delete target.showOpenFilePicker;
      delete target.showSaveFilePicker;
    });
  });

  test('T-0333: R-ALL-03, R-WEB-02: a new document with an If block downloads and opens again', async ({
    page,
  }) => {
    await openApp(page);
    await expect(page).toHaveTitle('Untitled.ns.svg – AriadneNSD');
    await command(page, 'block.insert.if').click();
    await expect(page).toHaveTitle('● Untitled.ns.svg – AriadneNSD');

    const downloading = page.waitForEvent('download');
    await command(page, 'file.save').click();
    await onThisComputer(page);
    const download = await downloading;
    expect(download.suggestedFilename()).toBe('Untitled.ns.svg');
    await expect(page.getByText('This browser cannot write to the original file')).toBeVisible();
    await expect(page).toHaveTitle('Untitled.ns.svg – AriadneNSD');
    const saved = await readFile(await download.path(), 'utf8');
    expect(saved).toContain('<ans:document');
    expect(saved).toContain('"kind": "if"');
    expect(saved).toContain('@font-face { font-family: "AriadneNSD Mono"');

    await command(page, 'file.new').click();
    const choosing = page.waitForEvent('filechooser');
    await command(page, 'file.open').click();
    await onThisComputer(page);
    await (await choosing).setFiles(await download.path());
    await expect(page).toHaveTitle(/^Untitled\.ns\.svg – AriadneNSD$/);
    expect(await page.evaluate(() => document.title)).not.toContain('●');
  });

  test('T-0334 · R-WEB-02: an SVG without a model is not opened, and the reason is shown', async ({
    page,
  }) => {
    await openApp(page);
    const choosing = page.waitForEvent('filechooser');
    await command(page, 'file.open').click();
    await onThisComputer(page);
    await (
      await choosing
    ).setFiles({
      name: 'plain.svg',
      mimeType: 'image/svg+xml',
      buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'),
    });
    await expect(page.getByText('“plain.svg” has no AriadneNSD model in it')).toBeVisible();
    await expect(page).toHaveTitle('Untitled.ns.svg – AriadneNSD');
  });

  test('T-0335 · R-WEB-03: after a reload the unsaved changes can be restored', async ({
    page,
  }) => {
    await openApp(page);
    await command(page, 'block.insert.while').click();
    // The backup is written 0.5 s after the last edit.
    await page.waitForTimeout(1000);
    // The browser's "leave site?" (the document is unsaved), then the editor's "restore?".
    page.on('dialog', (dialog) => {
      void dialog.accept();
    });
    await page.reload();
    await expect(page.getByRole('dialog')).toContainText('Restore them?');
    await page.getByRole('button', { name: 'Restore' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
    await expect(page).toHaveTitle('● Untitled.ns.svg – AriadneNSD');
  });
});

test.describe('file handle flow (File System Access)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      // In-memory files behind the pickers. `window.testFiles` is what was written.
      const files = new Map<string, Blob>();
      const fakeHandle = (name: string) => ({
        kind: 'file',
        name,
        getFile: () => Promise.resolve(new File([files.get(name) ?? ''], name)),
        createWritable: () => {
          let data: Blob = new Blob([]);
          return Promise.resolve({
            write: (chunk: string | Blob) => {
              data = new Blob([chunk]);
              return Promise.resolve();
            },
            close: () => {
              files.set(name, data);
              return Promise.resolve();
            },
          });
        },
        isSameEntry: (other: { name: string }) => Promise.resolve(other.name === name),
        queryPermission: () => Promise.resolve('granted'),
        requestPermission: () => Promise.resolve('granted'),
      });
      const target = window as unknown as Record<string, unknown>;
      target.testFiles = files;
      target.showSaveFilePicker = (options: { suggestedName: string }) =>
        Promise.resolve(fakeHandle(options.suggestedName));
      target.showOpenFilePicker = () => Promise.resolve([fakeHandle('Untitled.ns.svg')]);
    });
  });

  const writtenText = (page: Page, name: string) =>
    page.evaluate(async (file) => {
      const files = (window as unknown as { testFiles: Map<string, Blob> }).testFiles;
      return (await files.get(file)?.text()) ?? null;
    }, name);

  test('T-0336: R-WEB-02, R-EXP-04: saves to the file, then auto saves 2 s after the next edit', async ({
    page,
  }) => {
    await openApp(page);
    await command(page, 'block.insert.if').click();
    // A new block opens its text editor; Esc leaves it, then Ctrl+S is the editor's save key.
    await page.keyboard.press('Escape');
    await page.keyboard.press('Control+S');
    await onThisComputer(page);
    await expect(page).toHaveTitle('Untitled.ns.svg – AriadneNSD');
    const first = await writtenText(page, 'Untitled.ns.svg');
    expect(first).toContain('"kind": "if"');

    // For is inserted with keys or menus: the toolbar has no For icon (UX TB1).
    await expect(page.locator('.ans-toolbar [data-command="block.insert.for"]')).toHaveCount(0);
    await page.keyboard.press('a');
    await page.keyboard.press('f');
    await expect(page).toHaveTitle('● Untitled.ns.svg – AriadneNSD');
    await expect(page).toHaveTitle('Untitled.ns.svg – AriadneNSD', { timeout: 5000 });
    expect(await writtenText(page, 'Untitled.ns.svg')).toContain('"kind": "for"');

    await command(page, 'file.new').click();
    await command(page, 'file.open').click();
    await onThisComputer(page);
    await expect(page).toHaveTitle('Untitled.ns.svg – AriadneNSD');
  });

  test('T-0337 · R-EXP-01: exports a PNG at twice the drawing size', async ({ page }) => {
    await openApp(page);
    await command(page, 'block.insert.if').click();
    await command(page, 'file.export.png').click();
    await expect(page.getByText('Exported “Untitled.png”')).toBeVisible();
    const size = await page.evaluate(async () => {
      const files = (window as unknown as { testFiles: Map<string, Blob> }).testFiles;
      const png = files.get('Untitled.png');
      if (png === undefined) {
        return null;
      }
      const bitmap = await createImageBitmap(png);
      return { width: bitmap.width, height: bitmap.height, type: png.type };
    });
    expect(size).not.toBeNull();
    expect(size?.width).toBeGreaterThan(100);
  });
});

test.describe('two tabs', () => {
  test('T-0338: 06-web 2: the second tab with the same file only views', async ({ context }) => {
    await context.addInitScript(() => {
      const target = window as unknown as Record<string, unknown>;
      delete target.showOpenFilePicker;
      delete target.showSaveFilePicker;
    });
    const first = await context.newPage();
    await openApp(first);
    const choosing = first.waitForEvent('filechooser');
    await command(first, 'file.open').click();
    await onThisComputer(first);
    const file = {
      name: 'shared.ns.svg',
      mimeType: 'image/svg+xml',
      buffer: Buffer.from(await sampleDocument(first)),
    };
    await (await choosing).setFiles(file);
    await expect(first).toHaveTitle('shared.ns.svg – AriadneNSD');

    const second = await context.newPage();
    await openApp(second);
    await second.getByRole('button', { name: 'File', exact: true }).click();
    await second.getByRole('menuitem', { name: 'Recent Files' }).hover();
    await second.getByRole('menuitem', { name: /shared\.ns\.svg/ }).click();
    await expect(second.getByText('Another tab is editing this file')).toBeVisible();
  });
});

/** A saved document made by the app itself: download the new document. */
async function sampleDocument(page: Page): Promise<string> {
  const downloading = page.waitForEvent('download');
  await command(page, 'file.save').click();
  await onThisComputer(page);
  return readFile(await (await downloading).path(), 'utf8');
}

test.describe('documents in this browser (R-WEB-09)', () => {
  test.beforeEach(async ({ page }) => {
    // Firefox and Safari: no file to write, so the browser is where a document is saved.
    await page.addInitScript(() => {
      const target = window as unknown as Record<string, unknown>;
      delete target.showOpenFilePicker;
      delete target.showSaveFilePicker;
    });
  });

  test('T-0911 · R-WEB-09 · UX BS1 · UX BS2 · UX BS3 · UX BS4: saves in the browser, opens it after a reload, saves an edit, exports all and deletes', async ({
    page,
  }) => {
    await openApp(page);
    await command(page, 'block.insert.process').click();
    await page.keyboard.type('stored');
    await page.keyboard.press('Enter');

    // Save As asks where; the first time on this computer.
    await page.keyboard.press('Control+Shift+S');
    const modal = page.getByRole('dialog', { name: 'Save As' });
    await expect(modal.getByRole('tab', { name: 'Files on This Computer' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await modal.getByRole('tab', { name: 'This Browser' }).click();
    await expect(modal.getByRole('note')).toContainText('Kept only in this browser.');
    const name = modal.getByRole('textbox', { name: 'Name' });
    await expect(name).toHaveValue('Untitled');
    await name.fill('Merge Sort');
    await name.press('Enter');
    await expect(page).toHaveTitle('Merge Sort – AriadneNSD');
    await expect(page.getByTestId('file-name')).toHaveText('Merge SortBrowser');

    // After a reload Open… opens on the browser side, where the document is.
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
    await command(page, 'file.open').click();
    const open = page.getByRole('dialog', { name: 'Open' });
    const row = open.getByRole('row', { name: /Merge Sort/ });
    await expect(row).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Enter');
    await expect(page.locator('.ans-document text').filter({ hasText: /^stored$/ })).toHaveCount(1);
    await expect(page).toHaveTitle('Merge Sort – AriadneNSD');

    // Ctrl+S writes the browser document, even here where files cannot be written.
    await page
      .locator('.ans-document text')
      .filter({ hasText: /^stored$/ })
      .click();
    await page.keyboard.press('o');
    await page.keyboard.type('edited');
    await page.keyboard.press('Enter');
    await expect(page).toHaveTitle('● Merge Sort – AriadneNSD');
    await page.keyboard.press('Control+S');
    await expect(page).toHaveTitle('Merge Sort – AriadneNSD');
    await command(page, 'file.new').click();
    await expect(page.locator('.ans-document text').filter({ hasText: /^edited$/ })).toHaveCount(0);
    await command(page, 'file.open').click();
    await page.keyboard.press('Enter');
    await expect(page.locator('.ans-document text').filter({ hasText: /^edited$/ })).toHaveCount(1);

    // Export All to Files saves one zip with the document as a .ns.svg file.
    await command(page, 'file.open').click();
    await expect(open.getByRole('note')).toContainText('export them to files now and then');
    const downloading = page.waitForEvent('download');
    await open.getByRole('button', { name: 'Export All to Files (.zip)' }).click();
    const zip = await downloading;
    expect(zip.suggestedFilename()).toMatch(/^AriadneNSD-\d{4}-\d{2}-\d{2}\.zip$/);
    const files = unzipSync(new Uint8Array(await readFile(await zip.path())));
    expect(Object.keys(files)).toEqual(['Merge Sort.ns.svg']);
    expect(strFromU8(files['Merge Sort.ns.svg'] ?? new Uint8Array())).toContain('edited');

    // Delete asks first; the open document stays as a new one that is not saved.
    await open.getByRole('grid').press('Delete');
    const question = page.getByRole('dialog', { name: 'Question' });
    await expect(question).toContainText('Delete “Merge Sort” from this browser?');
    await question.getByRole('button', { name: 'Delete' }).click();
    await expect(open.getByText('No documents in this browser yet.')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(open).toHaveCount(0);
    await expect(page).toHaveTitle('● Merge Sort.ns.svg – AriadneNSD');
  });
});
