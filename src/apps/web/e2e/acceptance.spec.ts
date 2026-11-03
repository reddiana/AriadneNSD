// The MVP acceptance tests AT-01 ~ AT-17 (01-requirements 5.2) in the browser, against the production
// build. Each test name starts with its AT id. AT-05, AT-08 and AT-10 also have a part for people
// (the reference device, other viewers, Firefox and Safari); the browser part is checked here.
import { readFile } from 'node:fs/promises';

import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

import {
  canvas,
  command,
  drawnText,
  middleOf,
  modelOf,
  onThisComputer,
  openApp,
  placesModal,
  outline,
  press,
  putFile,
  selection,
  statusBar,
  useDownloads,
  useFakeFiles,
  writeCount,
  writtenBlob,
  writtenText,
} from './support';

/**
 * Waits for the last edit (the ● mark), saves with Ctrl+S to the fake file system, waits for the
 * write, and returns the outline of the saved first diagram.
 */
async function savedOutline(page: Page, name = 'Untitled.ns.svg'): Promise<string> {
  await expect(page).toHaveTitle(/^● /);
  const writes = await writeCount(page);
  await page.keyboard.press('Control+S');
  // A new document's first save asks where first (UX BS1); later saves write at once.
  await expect
    .poll(async () => (await placesModal(page).count()) > 0 || (await writeCount(page)) > writes)
    .toBe(true);
  if ((await placesModal(page).count()) > 0) {
    await onThisComputer(page);
  }
  await expect.poll(() => writeCount(page)).toBe(writes + 1);
  await expect(page).toHaveTitle(`${name} – AriadneNSD`);
  const text = await writtenText(page, name);
  if (text === null) {
    throw new Error(`${name} was not written`);
  }
  return outline(modelOf(text).diagrams[0]?.body ?? []);
}

/** Types into the inline editor that a new block opened, and accepts it. */
async function typeText(page: Page, text: string): Promise<void> {
  await expect(page.locator('.ans-inline-editor')).toBeFocused();
  await page.keyboard.type(text);
  await page.keyboard.press('Enter');
  await expect(canvas(page)).toBeFocused();
}

/** A new document with process blocks `texts`, made with keys only. */
async function processBlocks(page: Page, ...texts: ReadonlyArray<string>): Promise<void> {
  const [first, ...rest] = texts;
  await page.keyboard.press('Enter');
  await typeText(page, first ?? '');
  for (const text of rest) {
    await page.keyboard.press('o');
    await typeText(page, text);
  }
}

/** A saved file with `count` process blocks, written like the app writes the model. */
function largeDocument(count: number): string {
  const body = Array.from({ length: count }, (_, index) => ({
    id: `b${String(index + 1)}`,
    kind: 'process',
    text: `step ${String(index + 1)}`,
  }));
  const model = {
    format: 'ariadne-nsd',
    version: 1,
    settings: { textKind: 'plain', theme: 'default', headStyle: 'shape' },
    diagrams: [{ id: 'd1', body }],
    view: { folded: [], opened: [], bands: true, resultSymbol: '←' },
  };
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">',
    '  <metadata>',
    `    <ans:document xmlns:ans="https://github.com/reddiana/AriadneNSD" version="1"><![CDATA[${JSON.stringify(model)}]]></ans:document>`,
    '  </metadata>',
    '</svg>',
  ].join('\n');
}

test.describe('in-memory files (Chromium: File System Access)', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await useFakeFiles(page);
    await openApp(page);
  });

  test('T-0001 · AT-01: makes a new diagram, inserts blocks and saves', async ({ page }) => {
    await processBlocks(page, 'old');
    await command(page, 'file.new').click();
    // The old document was never saved, so the app asks first (UX US1).
    await page.getByRole('dialog').getByRole('button', { name: 'Discard and Open' }).click();
    await expect(drawnText(page, 'old')).toHaveCount(0);
    await expect(selection(page)).toHaveText('Empty block');
    await command(page, 'block.insert.while').click();
    await typeText(page, 'i < n');
    await command(page, 'block.insert.process').click();
    await typeText(page, 'done');
    await expect(page).toHaveTitle('● Untitled.ns.svg – AriadneNSD');
    await command(page, 'file.save').click();
    await onThisComputer(page);
    await expect(page).toHaveTitle('Untitled.ns.svg – AriadneNSD');
    const saved = await writtenText(page, 'Untitled.ns.svg');
    expect(outline(modelOf(saved ?? '').diagrams[0]?.body ?? [])).toBe('W(i < n)[E] P(done)');
  });

  test('T-0002 · AT-02: a saved file opened again is the same drawing and saves the same bytes', async ({
    page,
  }) => {
    await processBlocks(page, 'read x', '한글 텍스트');
    await press(page, 'a', 'k');
    await typeText(page, 'x');
    await savedOutline(page);
    const first = await writtenText(page, 'Untitled.ns.svg');
    const drawn = await page.locator('.ans-document').innerHTML();

    await command(page, 'file.new').click();
    await command(page, 'file.open').click();
    await onThisComputer(page);
    await expect(drawnText(page, 'read x')).toBeVisible();
    expect(await page.locator('.ans-document').innerHTML()).toBe(drawn);
    await page.keyboard.press('Control+S');
    await expect(statusBar(page)).not.toContainText('Could not');
    expect(await writtenText(page, 'Untitled.ns.svg')).toBe(first);
  });

  test('T-0003 · AT-03: six block kinds, wrap and unwrap, copy and paste, add and delete branches, edit an If label', async ({
    page,
  }) => {
    await processBlocks(page, 'start', 'p1');
    for (const [letter, text] of [
      ['i', 'c1'],
      ['k', 'k1'],
      ['w', 'w1'],
      ['f', 'f1'],
      ['d', 'd1'],
    ] as const) {
      await press(page, 'a', letter);
      await typeText(page, text);
    }
    expect(await savedOutline(page)).toBe(
      'P(start) P(p1) I(c1)[Y: E | N: E] K(k1)[1: E | 2: E | D: E] W(w1)[E] F(f1)[E] D(d1)[E]',
    );

    // Wrap p1 in a While, then unwrap it again.
    await drawnText(page, 'p1').click();
    await press(page, 's', 'w');
    await typeText(page, 'w2');
    expect(await savedOutline(page)).toMatch(/^P\(start\) W\(w2\)\[P\(p1\)\] I\(c1\)/);
    await press(page, 'd', 's');
    expect(await savedOutline(page)).toMatch(/^P\(start\) P\(p1\) I\(c1\)/);

    // Copy p1 and paste it after itself.
    await drawnText(page, 'p1').click();
    await press(page, 'y', 'y', 'p');
    await expect(page.locator('.ans-document text').filter({ hasText: /^p1$/ })).toHaveCount(2);
    expect(await savedOutline(page)).toMatch(/^P\(start\) P\(p1\) P\(p1\) I\(c1\)/);

    // Add a branch to the Case and delete it again.
    await page.locator('.ans-document text').filter({ hasText: /^1$/ }).click();
    await expect(selection(page)).toContainText('Branch label');
    await page.keyboard.press('o');
    await typeText(page, '3');
    expect(await savedOutline(page)).toContain('K(k1)[1: E | 3: E | 2: E | D: E]');
    await page.keyboard.press('x');
    expect(await savedOutline(page)).toContain('K(k1)[1: E | 2: E | D: E]');

    // Edit the If's "true" label.
    await drawnText(page, 'true').dblclick();
    await typeText(page, 'yes');
    await expect(drawnText(page, 'yes')).toBeVisible();
    expect(await savedOutline(page)).toContain('I(c1)[yes: E | N: E]');
  });

  test('T-0004: AT-04, R-NFR-05: AT-01 with the keyboard only', async ({ page }) => {
    // No mouse: the keys go to the diagram from the start.
    await expect(canvas(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await typeText(page, 'read x');
    await press(page, 'a', 'i');
    await typeText(page, 'x > 0');
    await page.keyboard.press('j');
    // An empty branch is written into with Enter: o would put a block next to it (UX KP2).
    await page.keyboard.press('Enter');
    await typeText(page, 'print');
    await page.keyboard.press('l');
    await page.keyboard.press('Enter');
    await typeText(page, 'none');
    expect(await savedOutline(page)).toBe('P(read x) I(x > 0)[Y: P(print) | N: P(none)]');
  });

  test('T-0005 · AT-04: text typed right after a+i goes into the new block, even without a pause', async ({
    page,
  }) => {
    await page.keyboard.press('Enter');
    await page.keyboard.type('first');
    await page.keyboard.press('Enter');
    await press(page, 'a', 'i');
    await page.keyboard.type('x > 0');
    await page.keyboard.press('Enter');
    expect(await savedOutline(page)).toBe('P(first) I(x > 0)[Y: E | N: E]');
  });

  test('T-0006 · AT-04: Ctrl+S while typing accepts the text and saves', async ({ page }) => {
    await page.keyboard.press('Enter');
    await page.keyboard.type('typed, not accepted yet');
    await page.keyboard.press('Control+S');
    await onThisComputer(page);
    await expect(page).toHaveTitle('Untitled.ns.svg – AriadneNSD');
    const text = (await writtenText(page, 'Untitled.ns.svg')) ?? '';
    expect(outline(modelOf(text).diagrams[0]?.body ?? [])).toBe('P(typed, not accepted yet)');
  });

  test('T-0007 · AT-05: an edit in a document of 500 blocks is drawn within 100 ms', async ({
    page,
  }) => {
    // Recording the coverage slows the page down: the time is measured by `pnpm e2e` only.
    test.skip(process.env.E2E_COVERAGE !== undefined, 'coverage recording slows the page down');
    await putFile(page, 'large.ns.svg', largeDocument(500));
    await command(page, 'file.open').click();
    await onThisComputer(page);
    await expect(page).toHaveTitle('large.ns.svg – AriadneNSD');
    await drawnText(page, 'step 250').click();
    // From the key to the frame after the document layer changed (03-editor 1.2).
    const times = await page.evaluate(async () => {
      const area = document.querySelector<HTMLElement>('.ans-canvas[tabindex]');
      const layer = document.querySelector('.ans-document');
      if (area === null || layer === null) {
        return [];
      }
      const results: number[] = [];
      for (let round = 0; round < 5; round += 1) {
        const before = layer.innerHTML;
        const start = performance.now();
        area.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyO', key: 'o', bubbles: true }));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        if (layer.innerHTML === before) {
          return [];
        }
        results.push(performance.now() - start);
        // Accept the empty text and undo, so each round edits the same document.
        document.querySelector<HTMLTextAreaElement>('.ans-inline-editor')?.blur();
        area.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyU', key: 'u', bubbles: true }));
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      return results;
    });
    expect(times).toHaveLength(5);
    const sorted = [...times].sort((a, b) => a - b);
    expect(sorted[2]).toBeLessThan(100);
  });

  test('T-0008 · AT-06: a damaged file is not opened, the original stays and the editor keeps working', async ({
    page,
  }) => {
    await processBlocks(page, 'keep me');
    const damaged = largeDocument(1).replace('"kind":"process"', '"kind":"nonsense"');
    await putFile(page, 'damaged.ns.svg', damaged);
    await command(page, 'file.open').click();
    await onThisComputer(page);
    await expect(statusBar(page)).toContainText('“damaged.ns.svg” is damaged');
    await expect(page).toHaveTitle('● Untitled.ns.svg – AriadneNSD');
    expect(await writtenText(page, 'damaged.ns.svg')).toBe(damaged);
    await expect(drawnText(page, 'keep me')).toBeVisible();
    await page.keyboard.press('o');
    await typeText(page, 'still editing');
    await expect(drawnText(page, 'still editing')).toBeVisible();
  });

  test('T-0009 · AT-07: a failed save loses nothing; the next save writes it', async ({ page }) => {
    await processBlocks(page, 'first');
    await savedOutline(page);
    await page.evaluate(() => {
      (window as unknown as { testFailWrites: boolean }).testFailWrites = true;
    });
    await page.keyboard.press('o');
    await typeText(page, 'second');
    await page.keyboard.press('Control+S');
    await expect(statusBar(page)).toContainText('Could not save');
    await expect(page).toHaveTitle('● Untitled.ns.svg – AriadneNSD');
    await expect(drawnText(page, 'second')).toBeVisible();
    await page.evaluate(() => {
      (window as unknown as { testFailWrites: boolean }).testFailWrites = false;
    });
    expect(await savedOutline(page)).toBe('P(first) P(second)');
  });

  test('T-0010 · AT-08: the saved file draws what the screen draws, with its font inside', async ({
    page,
  }) => {
    await processBlocks(page, 'read x', '한글과 English');
    await press(page, 'a', 'i');
    await typeText(page, 'x > 0');
    await savedOutline(page);
    const saved = (await writtenText(page, 'Untitled.ns.svg')) ?? '';
    // The drawing part of the file and of the screen, written out by the same serializer.
    const [inFile, onScreen] = await page.evaluate((svg) => {
      const serializer = new XMLSerializer();
      const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml');
      const groups = [
        parsed.querySelector('g.ans-render'),
        document.querySelector('.ans-document g.ans-render'),
      ];
      return groups.map((group) =>
        group === null
          ? null
          : serializer
              .serializeToString(group)
              .replaceAll(' xmlns="http://www.w3.org/2000/svg"', ''),
      );
    }, saved);
    expect(inFile).not.toBeNull();
    expect(inFile).toBe(onScreen);
    expect(saved).toContain('@font-face { font-family: "AriadneNSD Mono"');
    // A plain viewer (an <img>, like GitHub) draws it at its size.
    const size = await page.evaluate(async (svg) => {
      const image = new Image();
      image.src = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      await image.decode();
      return { width: image.naturalWidth, height: image.naturalHeight };
    }, saved);
    const drawn = await page.locator('.ans-document svg').evaluate((svg) => ({
      width: Number(svg.getAttribute('width')),
      height: Number(svg.getAttribute('height')),
    }));
    expect(size).toEqual(drawn);
  });

  test('T-0011 · AT-09: exports a PNG at twice the drawing size', async ({ page }) => {
    await processBlocks(page, 'export me');
    await command(page, 'file.export.png').click();
    await expect(statusBar(page)).toContainText('Exported “Untitled.png”');
    const bytes = (await writtenBlob(page, 'Untitled.png')) ?? [];
    const png = await page.evaluate(async (data) => {
      const bitmap = await createImageBitmap(new Blob([new Uint8Array(data)]));
      return { width: bitmap.width, height: bitmap.height, head: data.slice(0, 8) };
    }, bytes);
    const drawn = await page.locator('.ans-document svg').evaluate((svg) => ({
      width: Number(svg.getAttribute('width')),
      height: Number(svg.getAttribute('height')),
    }));
    expect(png.head).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(png.width).toBe(drawn.width * 2);
    expect(png.height).toBe(drawn.height * 2);
  });

  test('T-0012 · AT-10 (Chromium part): the same document saves to the same bytes in another tab', async ({
    page,
    context,
  }) => {
    await processBlocks(page, 'same', '같은');
    await savedOutline(page);
    const first = (await writtenText(page, 'Untitled.ns.svg')) ?? '';
    const other = await context.newPage();
    await useFakeFiles(other);
    await openApp(other);
    await putFile(other, 'copy.ns.svg', first);
    await command(other, 'file.open').click();
    await onThisComputer(other);
    await expect(other).toHaveTitle('copy.ns.svg – AriadneNSD');
    await other.keyboard.press('Control+S');
    await expect(other).toHaveTitle('copy.ns.svg – AriadneNSD');
    expect(await writtenText(other, 'copy.ns.svg')).toBe(first);
  });

  test('T-0013 · AT-11: moves a block by dragging, and inserts and wraps by dragging block icons', async ({
    page,
  }) => {
    await processBlocks(page, 'A', 'B', 'C');
    // C onto the top band of A: C goes before A.
    const a = await middleOf(drawnText(page, 'A'));
    const c = await middleOf(drawnText(page, 'C'));
    await page.mouse.move(c.x, c.y);
    await page.mouse.down();
    await page.mouse.move(c.x, c.y - 10, { steps: 3 });
    await page.mouse.move(a.x, a.y - 12, { steps: 5 });
    await page.mouse.up();
    expect(await savedOutline(page)).toBe('P(C) P(A) P(B)');

    // The If icon onto the bottom band of B: a new If after B.
    const b = await middleOf(drawnText(page, 'B'));
    const ifIcon = await middleOf(command(page, 'block.insert.if'));
    await page.mouse.move(ifIcon.x, ifIcon.y);
    await page.mouse.down();
    await page.mouse.move(ifIcon.x + 10, ifIcon.y + 10, { steps: 3 });
    await page.mouse.move(b.x, b.y + 12, { steps: 8 });
    await page.mouse.up();
    await typeText(page, 'dropped');
    expect(await savedOutline(page)).toBe('P(C) P(A) P(B) I(dropped)[Y: E | N: E]');

    // The While icon onto the middle of A: A is wrapped in a While.
    const a2 = await middleOf(drawnText(page, 'A'));
    const whileIcon = await middleOf(command(page, 'block.insert.while'));
    await page.mouse.move(whileIcon.x, whileIcon.y);
    await page.mouse.down();
    await page.mouse.move(whileIcon.x + 10, whileIcon.y + 10, { steps: 3 });
    await page.mouse.move(a2.x, a2.y, { steps: 8 });
    await expect(page.locator('.ans-drag-label')).toHaveText('Wrap in While');
    await page.mouse.up();
    await typeText(page, 'loop');
    expect(await savedOutline(page)).toBe('P(C) W(loop)[P(A)] P(B) I(dropped)[Y: E | N: E]');
  });

  test('T-0014 · AT-12: pastes copied blocks as blocks, and plain text as one process block per line', async ({
    page,
  }) => {
    await processBlocks(page, 'one');
    await press(page, 'a', 'w');
    await typeText(page, 'loop');
    await page.keyboard.press('Control+C');
    await drawnText(page, 'one').click();
    await page.keyboard.press('Control+V');
    // Pasting reads the clipboard, which takes a moment.
    await expect(page.locator('.ans-document text').filter({ hasText: /^loop$/ })).toHaveCount(2);
    expect(await savedOutline(page)).toBe('P(one) W(loop)[E] W(loop)[E]');

    await page.evaluate(() => navigator.clipboard.writeText('first line\nsecond line'));
    await drawnText(page, 'one').click();
    await page.keyboard.press('p');
    await expect(drawnText(page, 'second line')).toBeVisible();
    expect(await savedOutline(page)).toBe(
      'P(one) P(first line) P(second line) W(loop)[E] W(loop)[E]',
    );
  });

  test('T-0015 · AT-14 (Chromium part): auto save writes the original file 2 s after an edit', async ({
    page,
  }) => {
    await processBlocks(page, 'first');
    await savedOutline(page);
    await page.keyboard.press('o');
    await typeText(page, 'auto');
    await expect(page).toHaveTitle('● Untitled.ns.svg – AriadneNSD');
    await expect(page).toHaveTitle('Untitled.ns.svg – AriadneNSD', { timeout: 5000 });
    const text = (await writtenText(page, 'Untitled.ns.svg')) ?? '';
    expect(outline(modelOf(text).diagrams[0]?.body ?? [])).toBe('P(first) P(auto)');
  });

  test('T-0016 · AT-15: opens a file again from Recent Files', async ({ page }) => {
    await processBlocks(page, 'remember me');
    await savedOutline(page);
    await command(page, 'file.new').click();
    await expect(drawnText(page, 'remember me')).toHaveCount(0);
    await page.getByRole('button', { name: 'File', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Recent Files' }).hover();
    await page.getByRole('menuitem', { name: 'Untitled.ns.svg' }).click();
    await expect(drawnText(page, 'remember me')).toBeVisible();
    await expect(page).toHaveTitle('Untitled.ns.svg – AriadneNSD');
  });

  test('T-0017 · AT-16: finds a command in the command palette and runs it', async ({ page }) => {
    await page.keyboard.press('Control+Shift+P');
    const palette = page.getByRole('combobox', { name: 'Command palette' });
    await expect(palette).toBeFocused();
    await palette.fill('insert whi');
    await expect(page.getByRole('option')).toHaveCount(2);
    await page.keyboard.press('Enter');
    await typeText(page, 'found');
    expect(await savedOutline(page)).toBe('W(found)[E]');
    // F1 opens it too, and the last command comes first.
    await page.keyboard.press('F1');
    await expect(page.getByRole('option').first()).toContainText('Insert While');
    await page.keyboard.press('Escape');
    await expect(canvas(page)).toBeFocused();
  });

  test('T-0018 · AT-17: ? opens the shortcut list, and Help opens the user guide', async ({
    page,
    context,
  }) => {
    await page.keyboard.press('Shift+Slash');
    const list = page.getByRole('dialog', { name: 'Keyboard Shortcuts' });
    await expect(list).toBeVisible();
    await expect(list.getByRole('row', { name: /Cut/ })).toContainText('dd');
    await page.keyboard.press('Escape');
    await expect(list).toHaveCount(0);
    await expect(canvas(page)).toBeFocused();

    const opening = context.waitForEvent('page');
    await page.getByRole('button', { name: 'Help', exact: true }).click();
    await page.getByRole('menuitem', { name: 'User Guide' }).click();
    const guide = await opening;
    expect(guide.url()).toMatch(/\/manual\/$/);
  });

  test('T-0019: undo and redo with keys and the toolbar', async ({ page }) => {
    await processBlocks(page, 'a', 'b');
    await page.keyboard.press('u');
    await expect(drawnText(page, 'b')).toHaveCount(0);
    await page.keyboard.press('Shift+U');
    await expect(drawnText(page, 'b')).toBeVisible();
    await page.keyboard.press('Control+Z');
    await expect(drawnText(page, 'b')).toHaveCount(0);
    await page.keyboard.press('Control+Y');
    await expect(drawnText(page, 'b')).toBeVisible();
    await command(page, 'edit.undo').click();
    await expect(drawnText(page, 'b')).toHaveCount(0);
    await command(page, 'edit.redo').click();
    await expect(drawnText(page, 'b')).toBeVisible();
  });

  test('T-0020: zoom with keys, Ctrl+wheel and the zoom menu', async ({ page }) => {
    const zoomButton = page.locator('button[title="Zoom"]');
    await expect(zoomButton).toContainText('100%');
    await press(page, 'Shift+Equal', 'Shift+Equal');
    await expect(zoomButton).toContainText('120%');
    await page.keyboard.press('-');
    await expect(zoomButton).toContainText('110%');
    const area = await canvas(page).boundingBox();
    if (area === null) {
      throw new Error('no canvas');
    }
    await page.mouse.move(area.x + 200, area.y + 200);
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, -100);
    await page.keyboard.up('Control');
    await expect(zoomButton).toContainText('120%');
    await zoomButton.click();
    await page.getByRole('menuitem', { name: /100%|Actual Size|Reset/ }).click();
    await expect(zoomButton).toContainText('100%');
  });

  test('T-0021: the context menu shows the commands for the selection', async ({ page }) => {
    await processBlocks(page, 'a', 'b');
    await drawnText(page, 'a').click({ button: 'right' });
    const menu = page.getByRole('menu', { name: 'Context menu' });
    await expect(menu).toBeVisible();
    await expect(selection(page)).toHaveText('Process block');
    await expect(menu.getByRole('menuitem', { name: /^Copy/ })).toBeVisible();
    await menu.getByRole('menuitem', { name: /^Delete/ }).click();
    await expect(menu).toHaveCount(0);
    await expect(drawnText(page, 'a')).toHaveCount(0);
    // From the keyboard: Shift+F10, j / k to move, Enter to run, Esc to close.
    await page.keyboard.press('Shift+F10');
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(canvas(page)).toBeFocused();
  });
});

test.describe('downloads (Firefox and Safari: no File System Access)', () => {
  test.beforeEach(async ({ page }) => {
    await useDownloads(page);
    await openApp(page);
  });

  test('T-0022 · AT-02: a downloaded file opened again downloads the same bytes', async ({
    page,
  }) => {
    await processBlocks(page, 'download', '내려받기');
    let downloading = page.waitForEvent('download');
    await page.keyboard.press('Control+S');
    await onThisComputer(page);
    const first = await readFile(await (await downloading).path(), 'utf8');

    await command(page, 'file.new').click();
    const choosing = page.waitForEvent('filechooser');
    await command(page, 'file.open').click();
    await onThisComputer(page);
    await (
      await choosing
    ).setFiles({ name: 'Untitled.ns.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(first) });
    await expect(drawnText(page, 'download')).toBeVisible();
    downloading = page.waitForEvent('download');
    await page.keyboard.press('Control+S');
    expect(await readFile(await (await downloading).path(), 'utf8')).toBe(first);
  });

  test('T-0023 · AT-07: Save As asks for the name in the editor, and cancelling keeps the edits', async ({
    page,
  }) => {
    await processBlocks(page, 'named');
    await page.keyboard.press('Control+Shift+S');
    await onThisComputer(page);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('File name to download');
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(page).toHaveTitle('● Untitled.ns.svg – AriadneNSD');
    await expect(canvas(page)).toBeFocused();

    await page.keyboard.press('Control+Shift+S');
    await onThisComputer(page);
    await page.getByRole('textbox').fill('renamed');
    const downloading = page.waitForEvent('download');
    await page.keyboard.press('Enter');
    expect((await downloading).suggestedFilename()).toBe('renamed.ns.svg');
    await expect(page).toHaveTitle('renamed.ns.svg – AriadneNSD');
  });

  test('T-0024 · AT-13: after a reload the local backup is restored', async ({ page }) => {
    await processBlocks(page, 'not saved yet');
    // The backup is written 0.5 s after the last edit.
    await page.waitForTimeout(1000);
    page.on('dialog', (dialog) => {
      void dialog.accept();
    });
    await page.reload();
    const ask = page.getByRole('dialog');
    await expect(ask).toContainText('Restore them?');
    await ask.getByRole('button', { name: 'Restore' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
    await expect(drawnText(page, 'not saved yet')).toBeVisible();
    await expect(page).toHaveTitle('● Untitled.ns.svg – AriadneNSD');
  });

  test('T-0025 · AT-14 (Chromium part): without File System Access, saving downloads and says so once', async ({
    page,
  }) => {
    await processBlocks(page, 'x');
    const downloading = page.waitForEvent('download');
    await command(page, 'file.save').click();
    await onThisComputer(page);
    await downloading;
    await expect(statusBar(page)).toContainText('This browser cannot write to the original file');
  });
});

test.describe('Korean screen', () => {
  test.use({ locale: 'ko-KR' });

  test('T-0026 · R-NFR-04: menus, status bar and the drawing words are Korean', async ({
    page,
  }) => {
    await openApp(page);
    await expect(page).toHaveTitle('제목 없음.ns.svg – AriadneNSD');
    await expect(selection(page)).toHaveText('빈 블록');
    await press(page, 'a', 'i');
    await typeText(page, '조건');
    await expect(drawnText(page, '참')).toBeVisible();
    await page.getByRole('button', { name: '다이어그램', exact: true }).click();
    await page.getByRole('menuitem', { name: '삽입', exact: true }).hover();
    await expect(page.getByRole('menuitem', { name: /^While 삽입/ })).toBeVisible();
  });
});
