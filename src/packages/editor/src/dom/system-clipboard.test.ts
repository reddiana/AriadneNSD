// The system clipboard (03-editor 3.3): the async Clipboard API, falling back to memory when the browser blocks it.
import { afterEach, describe, expect, it, vi } from 'vitest';

import { clipMimeType } from '../clipboard/clip-format';
import { createSystemClipboard } from './system-clipboard';

/** A fake ClipboardItem that keeps its blobs. */
class FakeItem {
  static supportsCustom = true;
  static supports(type: string): boolean {
    return type === 'text/plain' || FakeItem.supportsCustom;
  }
  readonly types: string[];
  constructor(readonly blobs: Record<string, Blob>) {
    this.types = Object.keys(blobs);
  }
  getType(type: string): Promise<Blob> {
    const blob = this.blobs[type];
    return blob === undefined ? Promise.reject(new Error('no such type')) : Promise.resolve(blob);
  }
}

/** A fake async clipboard holding items; `refuse` makes every call reject. */
function fakeClipboard(options: { readonly hasRead?: boolean } = {}) {
  const fake = {
    items: [] as FakeItem[],
    text: '',
    refuse: false,
    write: (items: FakeItem[]): Promise<void> => {
      if (fake.refuse) return Promise.reject(new Error('NotAllowedError'));
      fake.items = items;
      return Promise.resolve();
    },
    writeText: (text: string): Promise<void> => {
      if (fake.refuse) return Promise.reject(new Error('NotAllowedError'));
      fake.text = text;
      return Promise.resolve();
    },
    read: undefined as (() => Promise<FakeItem[]>) | undefined,
    readText: (): Promise<string> =>
      fake.refuse ? Promise.reject(new Error('NotAllowedError')) : Promise.resolve(fake.text),
  };
  if (options.hasRead !== false) {
    fake.read = () =>
      fake.refuse ? Promise.reject(new Error('NotAllowedError')) : Promise.resolve(fake.items);
  }
  return fake;
}

function withClipboard(clipboard: unknown, hasClipboardItem = true): void {
  vi.stubGlobal('navigator', clipboard === null ? {} : { clipboard });
  vi.stubGlobal('ClipboardItem', hasClipboardItem ? FakeItem : undefined);
}

const logs: string[] = [];
const log = (text: string): void => {
  logs.push(text);
};

afterEach(() => {
  vi.unstubAllGlobals();
  FakeItem.supportsCustom = true;
  logs.length = 0;
});

describe('createSystemClipboard', () => {
  it('T-0662: writes the text and the model JSON as one clipboard item', async () => {
    const system = fakeClipboard();
    withClipboard(system);
    const clipboard = createSystemClipboard(log);
    expect(await clipboard.write({ text: 'a\nb', json: '{"blocks":[]}' })).toBe('system');
    const [item] = system.items;
    expect(item?.types).toEqual(['text/plain', clipMimeType]);
    expect(await (await item?.getType(clipMimeType))?.text()).toBe('{"blocks":[]}');
    expect(await clipboard.read()).toEqual({ text: 'a\nb', json: '{"blocks":[]}' });
  });

  it('T-0663: a browser without the custom format gets the text only, and a read in this tab still finds the model', async () => {
    FakeItem.supportsCustom = false;
    const system = fakeClipboard();
    withClipboard(system);
    const clipboard = createSystemClipboard(log);
    await clipboard.write({ text: 'p', json: '{"m":1}' });
    expect(system.items[0]?.types).toEqual(['text/plain']);
    expect(await clipboard.read()).toEqual({ text: 'p', json: '{"m":1}' });
  });

  it('T-0664: text copied elsewhere after our copy is read as text without our model', async () => {
    FakeItem.supportsCustom = false;
    const system = fakeClipboard();
    withClipboard(system);
    const clipboard = createSystemClipboard(log);
    await clipboard.write({ text: 'ours', json: '{"m":1}' });
    system.items = [new FakeItem({ 'text/plain': new Blob(['theirs']) })];
    expect(await clipboard.read()).toEqual({ text: 'theirs', json: null });
  });

  it('T-0665: without ClipboardItem it writes and reads plain text', async () => {
    const system = fakeClipboard({ hasRead: false });
    withClipboard(system, false);
    const clipboard = createSystemClipboard(log);
    system.text = 'before';
    expect(await clipboard.write({ text: null, json: '{"m":1}' })).toBe('system');
    expect(system.text).toBe('');
    system.text = 'typed';
    expect(await clipboard.read()).toEqual({ text: 'typed', json: null });
  });

  it('T-0666: outside a secure context (no navigator.clipboard) it keeps the copy in memory', async () => {
    withClipboard(null);
    const clipboard = createSystemClipboard(log);
    expect(await clipboard.read()).toEqual({ text: null, json: null });
    expect(await clipboard.write({ text: 't', json: 'j' })).toBe('memory');
    expect(await clipboard.read()).toEqual({ text: 't', json: 'j' });
    expect(logs).toEqual([]);
  });

  it('T-0667: an item with only the model and no text reads as the model without text', async () => {
    const system = fakeClipboard();
    withClipboard(system);
    const clipboard = createSystemClipboard(log);
    system.items = [new FakeItem({ [clipMimeType]: new Blob(['{"m":2}']) })];
    expect(await clipboard.read()).toEqual({ text: null, json: '{"m":2}' });
  });

  it('T-0668: a copy without text writes an empty text item', async () => {
    const system = fakeClipboard();
    withClipboard(system);
    const clipboard = createSystemClipboard(log);
    await clipboard.write({ text: null, json: null });
    const [item] = system.items;
    expect(item?.types).toEqual(['text/plain']);
    expect(await (await item?.getType('text/plain'))?.text()).toBe('');
  });

  it('T-0669: a refused write keeps the copy in memory and logs why', async () => {
    const system = fakeClipboard();
    system.refuse = true;
    withClipboard(system);
    const clipboard = createSystemClipboard(log);
    expect(await clipboard.write({ text: 't', json: 'j' })).toBe('memory');
    expect(logs).toEqual(['The system clipboard refused a write; kept in memory']);
  });

  it('T-0670: a refused read falls back to the copy in memory, or to nothing, and logs why', async () => {
    const system = fakeClipboard();
    withClipboard(system);
    const clipboard = createSystemClipboard(log);
    system.refuse = true;
    expect(await clipboard.read()).toEqual({ text: null, json: null });
    system.refuse = false;
    await clipboard.write({ text: 't', json: 'j' });
    system.refuse = true;
    expect(await clipboard.read()).toEqual({ text: 't', json: 'j' });
    expect(logs).toEqual([
      'The system clipboard refused a read; using memory',
      'The system clipboard refused a read; using memory',
    ]);
  });

  it('T-0671: a read right after a write waits for the write to reach the clipboard (yyp)', async () => {
    const system = fakeClipboard();
    let finish: () => void = () => undefined;
    system.write = (items: FakeItem[]) =>
      new Promise<void>((resolve) => {
        finish = () => {
          system.items = items;
          resolve();
        };
      });
    withClipboard(system);
    const clipboard = createSystemClipboard(log);
    void clipboard.write({ text: 'x', json: '{"x":1}' });
    const read = clipboard.read();
    finish();
    expect(await read).toEqual({ text: 'x', json: '{"x":1}' });
  });
});
