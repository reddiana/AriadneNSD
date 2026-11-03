// Shared helpers of the browser tests: opening the app, replacing the browser's file pickers,
// reading the model out of a saved file, and finding blocks on the screen.
import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Marks the first visit's welcome (the examples modal, UX EX2) as already shown, so it does not
 * cover the editor. Call before the page loads; `openApp` does.
 */
export async function skipWelcome(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('ariadne-nsd.setting.examples.welcomed', 'true');
  });
}

/** Opens the app and waits until the editor and the block font are ready. */
export async function openApp(page: Page): Promise<void> {
  await skipWelcome(page);
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
}

/** A toolbar button, menu item or other control that runs the command `id`. */
export function command(page: Page, id: string): Locator {
  return page.locator(`[data-command="${id}"]`).first();
}

/** The diagram area (the element that takes the editor's keys). */
export function canvas(page: Page): Locator {
  return page.locator('.ans-canvas[tabindex]');
}

/** The status bar's "what is selected". */
export function selection(page: Page): Locator {
  return page.getByTestId('selection');
}

/** The status bar. */
export function statusBar(page: Page): Locator {
  return page.locator('.ans-statusbar');
}

/** The open · save modal that File › Open…, Save As… and a new document's first save show (UX BS1). */
export function placesModal(page: Page): Locator {
  return page.locator('.ans-backdrop[data-kind="places"]');
}

/**
 * Answers the open · save modal with "Files on This Computer" and its one button, so the
 * computer's own file dialog (or the download) follows as before the modal (06-web 1).
 */
export async function onThisComputer(page: Page): Promise<void> {
  const modal = placesModal(page);
  await modal.locator('#ans-places-tab-computer').click();
  await modal.locator('#ans-places-panel-computer [data-default="true"]').click();
  await expect(modal).toHaveCount(0);
}

/** Takes the File System Access pickers away: the download flow of Firefox and Safari. */
export async function useDownloads(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const target = window as unknown as Record<string, unknown>;
    delete target.showOpenFilePicker;
    delete target.showSaveFilePicker;
  });
}

/**
 * Puts the origin private file system (OPFS) behind the pickers: real file handles that the app
 * can write and keep in IndexedDB, like files on disk in Chromium. The save picker returns the
 * suggested name, the open picker `window.testOpenName`. `window.testFailWrites = true` makes
 * writes fail; `window.testWrites` counts the finished writes.
 */
export async function useFakeFiles(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const target = window as unknown as Record<string, unknown>;
    const handle = async (name: string) =>
      (await navigator.storage.getDirectory()).getFileHandle(name, { create: true });
    // eslint-disable-next-line @typescript-eslint/unbound-method -- called with its `this` below
    const original = FileSystemFileHandle.prototype.createWritable;
    FileSystemFileHandle.prototype.createWritable = async function createWritable(
      this: FileSystemFileHandle,
      ...args: Parameters<typeof original>
    ) {
      if (target.testFailWrites === true) {
        throw new Error('Disk full (test)');
      }
      const writable = await original.apply(this, args);
      const close = writable.close.bind(writable);
      writable.close = async () => {
        await close();
        target.testWrites = Number(target.testWrites ?? 0) + 1;
      };
      return writable;
    };
    target.testOpenName = 'Untitled.ns.svg';
    target.testWrites = 0;
    target.showSaveFilePicker = (options: { suggestedName: string }) =>
      handle(options.suggestedName);
    target.showOpenFilePicker = async () => [await handle(String(target.testOpenName))];
  });
}

/** The text of a file in the fake file system (`useFakeFiles`), or `null`. */
export function writtenText(page: Page, name: string): Promise<string | null> {
  return page.evaluate(async (file) => {
    try {
      const directory = await navigator.storage.getDirectory();
      return await (await (await directory.getFileHandle(file)).getFile()).text();
    } catch {
      return null;
    }
  }, name);
}

/** The bytes of a file in the fake file system, or `null`. */
export function writtenBlob(page: Page, name: string): Promise<number[] | null> {
  return page.evaluate(async (file) => {
    try {
      const directory = await navigator.storage.getDirectory();
      const blob = await (await directory.getFileHandle(file)).getFile();
      return [...new Uint8Array(await blob.arrayBuffer())];
    } catch {
      return null;
    }
  }, name);
}

/** How many writes finished (`useFakeFiles`). */
export function writeCount(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { testWrites: number }).testWrites);
}

/** Puts a file in the fake file system and behind the open picker (`useFakeFiles`). */
export async function putFile(page: Page, name: string, text: string): Promise<void> {
  await page.evaluate(
    async ({ file, content }) => {
      const directory = await navigator.storage.getDirectory();
      const writable = await (
        await directory.getFileHandle(file, { create: true })
      ).createWritable();
      await writable.write(content);
      await writable.close();
      (window as unknown as { testOpenName: string }).testOpenName = file;
    },
    { file: name, content: text },
  );
}

/** A block of the model, as much as the tests read. */
export type ModelBlock = {
  readonly kind: string;
  readonly text?: string;
  readonly body?: ReadonlyArray<ModelBlock>;
  readonly yes?: ModelBranch;
  readonly no?: ModelBranch;
  readonly arms?: ReadonlyArray<ModelBranch>;
  readonly otherwise?: ModelBranch;
};
type ModelBranch = { readonly label?: string; readonly body: ReadonlyArray<ModelBlock> };

/** The model JSON inside a saved `.ns.svg` (01-file-format 2). */
export function modelOf(svg: string): {
  readonly diagrams: ReadonlyArray<{ readonly body: ReadonlyArray<ModelBlock> }>;
} {
  const match = /<ans:document[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/ans:document>/.exec(svg);
  if (match?.[1] === undefined) {
    throw new Error('No model in the saved file');
  }
  return JSON.parse(match[1].replaceAll(']]]]><![CDATA[>', ']]>')) as ReturnType<typeof modelOf>;
}

/**
 * A short outline of a block list, to compare structures in one line:
 * `P(a) I(c)[Y: P(b) | N: E] K(k)[1: E | D: E] W(w)[E]`. `E` is an empty block; `Y` and `N` are
 * If branches without their own label.
 */
export function outline(blocks: ReadonlyArray<ModelBlock>): string {
  return blocks.map(outlineBlock).join(' ');
}

function outlineBlock(block: ModelBlock): string {
  const letters: Readonly<Record<string, string>> = {
    process: 'P',
    if: 'I',
    case: 'K',
    while: 'W',
    for: 'F',
    doWhile: 'D',
  };
  if (block.kind === 'process' && (block.text ?? '') === '') {
    return 'E';
  }
  const head = `${letters[block.kind] ?? block.kind}(${block.text ?? ''})`;
  switch (block.kind) {
    case 'if':
      return `${head}[${block.yes?.label ?? 'Y'}: ${outline(block.yes?.body ?? [])} | ${block.no?.label ?? 'N'}: ${outline(block.no?.body ?? [])}]`;
    case 'case': {
      const arms = (block.arms ?? []).map((arm) => `${arm.label ?? ''}: ${outline(arm.body)}`);
      const otherwise =
        block.otherwise === undefined ? [] : [`D: ${outline(block.otherwise.body)}`];
      return `${head}[${[...arms, ...otherwise].join(' | ')}]`;
    }
    case 'while':
    case 'for':
    case 'doWhile':
      return `${head}[${outline(block.body ?? [])}]`;
    default:
      return head;
  }
}

/** A text of the drawing on the screen (the document layer), matched whole. */
export function drawnText(page: Page, text: string): Locator {
  const whole = new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
  return page.locator('.ans-document text').filter({ hasText: whole }).first();
}

/** The middle of a drawn text, in page coordinates. */
export async function middleOf(locator: Locator): Promise<{ x: number; y: number }> {
  // The document layer is redrawn after each edit, so wait until the element is there
  // and its box is stable before reading it.
  await locator.waitFor({ state: 'visible' });
  for (let tries = 0; tries < 20; tries += 1) {
    const box = await locator.boundingBox();
    if (box !== null) {
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    }
    await locator.page().waitForTimeout(50);
  }
  throw new Error('The element is not on the screen');
}

/** Presses keys one after another (`'a'`, `'i'`, `'Control+S'` …). */
export async function press(page: Page, ...keys: ReadonlyArray<string>): Promise<void> {
  for (const key of keys) {
    await page.keyboard.press(key);
  }
}
