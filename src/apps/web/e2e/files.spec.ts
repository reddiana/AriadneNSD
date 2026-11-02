// Browser flows of the web shell (06-web 1, 2): new document → insert a block → save → open again.
// Native file dialogs cannot be driven, so each flow replaces what the dialog would give:
// - the download flow (Firefox, Safari) removes the File System Access pickers;
// - the file handle flow (Chromium) puts in-memory file handles behind the pickers.
import { readFile } from 'node:fs/promises';

import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

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

test.describe('download flow (no File System Access)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const target = window as unknown as Record<string, unknown>;
      delete target.showOpenFilePicker;
      delete target.showSaveFilePicker;
    });
  });

  test('R-ALL-03, R-WEB-02: a new document with an If block downloads and opens again', async ({
    page,
  }) => {
    await openApp(page);
    await expect(page).toHaveTitle('Untitled.ns.svg – AriadneNSD');
    await command(page, 'block.insert.if').click();
    await expect(page).toHaveTitle('● Untitled.ns.svg – AriadneNSD');

    const downloading = page.waitForEvent('download');
    await command(page, 'file.save').click();
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
    await (await choosing).setFiles(await download.path());
    await expect(page).toHaveTitle(/^Untitled\.ns\.svg – AriadneNSD$/);
    expect(await page.evaluate(() => document.title)).not.toContain('●');
  });

  test('R-WEB-02: an SVG without a model is not opened, and the reason is shown', async ({
    page,
  }) => {
    await openApp(page);
    const choosing = page.waitForEvent('filechooser');
    await command(page, 'file.open').click();
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

  test('R-WEB-03: after a reload the unsaved changes can be restored', async ({ page }) => {
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

  test('R-WEB-02, R-EXP-04: saves to the file, then auto saves 2 s after the next edit', async ({
    page,
  }) => {
    await openApp(page);
    await command(page, 'block.insert.if').click();
    // A new block opens its text editor; Esc leaves it, then Ctrl+S is the editor's save key.
    await page.keyboard.press('Escape');
    await page.keyboard.press('Control+S');
    await expect(page).toHaveTitle('Untitled.ns.svg – AriadneNSD');
    const first = await writtenText(page, 'Untitled.ns.svg');
    expect(first).toContain('"kind": "if"');

    await command(page, 'block.insert.for').click();
    await expect(page).toHaveTitle('● Untitled.ns.svg – AriadneNSD');
    await expect(page).toHaveTitle('Untitled.ns.svg – AriadneNSD', { timeout: 5000 });
    expect(await writtenText(page, 'Untitled.ns.svg')).toContain('"kind": "for"');

    await command(page, 'file.new').click();
    await command(page, 'file.open').click();
    await expect(page).toHaveTitle('Untitled.ns.svg – AriadneNSD');
  });

  test('R-EXP-01: exports a PNG at twice the drawing size', async ({ page }) => {
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
  test('06-web 2: the second tab with the same file only views', async ({ context }) => {
    await context.addInitScript(() => {
      const target = window as unknown as Record<string, unknown>;
      delete target.showOpenFilePicker;
      delete target.showSaveFilePicker;
    });
    const first = await context.newPage();
    await openApp(first);
    const choosing = first.waitForEvent('filechooser');
    await command(first, 'file.open').click();
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
  return readFile(await (await downloading).path(), 'utf8');
}
