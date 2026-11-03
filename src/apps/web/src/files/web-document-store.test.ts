import { afterEach, describe, expect, it, vi } from 'vitest';

import { download } from './file-fallback';
import type { StoreHost, Written } from './web-document-store';
import { WebDocumentStore } from './web-document-store';

vi.mock('./file-fallback', () => ({
  download: vi.fn(),
  documentMediaType: 'image/svg+xml',
}));

/** A file handle in memory. `permission` is what queryPermission answers. */
function fakeHandle(name: string, permission: PermissionState) {
  const state = { text: '', permission, prompted: 0 };
  const handle = {
    kind: 'file',
    name,
    getFile: () => Promise.resolve({ text: () => Promise.resolve(state.text) }),
    createWritable: () =>
      Promise.resolve({
        write: (data: string) => {
          state.text = data;
          return Promise.resolve();
        },
        close: () => Promise.resolve(),
      }),
    isSameEntry: (other: { name: string }) => Promise.resolve(other.name === name),
    queryPermission: () => Promise.resolve(state.permission),
    requestPermission: () => {
      state.prompted += 1;
      state.permission = 'granted';
      return Promise.resolve(state.permission);
    },
  };
  return { handle: handle as unknown as FileSystemFileHandle, state };
}

function host(canWriteInPlace: boolean, written: Written[]): StoreHost {
  return {
    canWriteInPlace,
    untitledName: 'Untitled.ns.svg',
    newKey: () => 'new-key',
    written: (item) => written.push(item),
    downloading: () => undefined,
    askDownloadName: (name) => Promise.resolve(`renamed-${name}`),
    log: () => undefined,
  };
}

describe('web document store', () => {
  it('T-0339 · R-WEB-02: writes to the original file, asking for permission on a save', async () => {
    const written: Written[] = [];
    const { handle, state } = fakeHandle('a.ns.svg', 'prompt');
    const store = new WebDocumentStore(host(true, written), 'k', 'a.ns.svg', {
      kind: 'handle',
      handle,
    });
    expect(await store.write('<svg/>')).toEqual({ ok: true, name: 'a.ns.svg' });
    expect(state.text).toBe('<svg/>');
    expect(state.prompted).toBe(1);
    expect(written[0]).toMatchObject({ key: 'k', previousKey: 'k', name: 'a.ns.svg' });
  });

  it('T-0340: 06-web 2: auto save never asks for permission; without it the write is denied', async () => {
    const { handle, state } = fakeHandle('a.ns.svg', 'prompt');
    const store = new WebDocumentStore(host(true, []), 'k', 'a.ns.svg', { kind: 'handle', handle });
    expect(await store.canAutosave()).toBe(false);
    const result = await store.quietly(() => store.write('<svg/>'));
    expect(result).toEqual({ ok: false, reason: 'denied' });
    expect(state.prompted).toBe(0);
  });

  it('T-0341: 06-web 2: auto save may write once the permission is granted', async () => {
    const { handle } = fakeHandle('a.ns.svg', 'granted');
    const store = new WebDocumentStore(host(true, []), 'k', 'a.ns.svg', { kind: 'handle', handle });
    expect(await store.canAutosave()).toBe(true);
  });

  it('T-0342: 06-web 1: without File System Access, saving downloads under the same name', async () => {
    const written: Written[] = [];
    const store = new WebDocumentStore(host(false, written), 'k', 'a.ns.svg', {
      kind: 'copy',
      text: '',
    });
    expect(store.canWriteInPlace).toBe(false);
    expect(await store.write('<svg/>')).toEqual({ ok: true, name: 'a.ns.svg' });
    expect(download).toHaveBeenCalledWith('a.ns.svg', '<svg/>', 'image/svg+xml');
    expect(await store.read()).toBe('<svg/>');
    expect(await store.canAutosave()).toBe(false);
  });

  it('T-0343: 06-web 1: "download as" asks for a name and keeps the document extension', async () => {
    const store = new WebDocumentStore(host(false, []), 'k', 'a.ns.svg', { kind: 'none' });
    expect(await store.writeAs('<svg/>', 'a.ns.svg')).toEqual({
      ok: true,
      name: 'renamed-a.ns.svg',
    });
    expect(store.name).toBe('renamed-a.ns.svg');
  });
});

/** A save dialog that gives `handle`, or throws `error`; records the suggested names. */
function stubSavePicker(result: { handle?: FileSystemFileHandle; error?: Error }) {
  const suggested: string[] = [];
  vi.stubGlobal('window', {
    showSaveFilePicker: (options: { suggestedName: string }) => {
      suggested.push(options.suggestedName);
      return result.error === undefined
        ? Promise.resolve(result.handle)
        : Promise.reject(result.error);
    },
  });
  return suggested;
}

/** A handle whose writes fail with `error`. */
function failingHandle(name: string, error: Error): FileSystemFileHandle {
  const { handle } = fakeHandle(name, 'granted');
  return Object.assign(handle, { createWritable: () => Promise.reject(error) });
}

describe('web document store: Chromium', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('T-0680: 06-web 1: the first save of a new document shows the save dialog and takes a new key', async () => {
    const written: Written[] = [];
    // The picked file comes with write permission.
    const { handle, state } = fakeHandle('Chosen.ns.svg', 'granted');
    const suggested = stubSavePicker({ handle });
    const store = new WebDocumentStore(host(true, written), 'old', 'Untitled.ns.svg', {
      kind: 'none',
    });
    expect(await store.write('<svg/>')).toEqual({ ok: true, name: 'Chosen.ns.svg' });
    expect(suggested).toEqual(['Untitled.ns.svg']);
    expect(state.prompted).toBe(0);
    expect(state.text).toBe('<svg/>');
    expect(written[0]).toMatchObject({ previousKey: 'old', key: 'new-key', handle });
    expect(store).toMatchObject({ key: 'new-key', name: 'Chosen.ns.svg', handle });
    expect(await store.canAutosave()).toBe(true);
  });

  it('T-0681: 06-web 2: auto save never shows the save dialog for a new document', async () => {
    const suggested = stubSavePicker({});
    const store = new WebDocumentStore(host(true, []), 'k', 'Untitled.ns.svg', { kind: 'none' });
    expect(await store.quietly(() => store.write('<svg/>'))).toEqual({
      ok: false,
      reason: 'denied',
    });
    expect(suggested).toEqual([]);
    expect(await store.canAutosave()).toBe(false);
  });

  it('T-0682: closing the save dialog cancels the save', async () => {
    stubSavePicker({ error: new DOMException('closed', 'AbortError') });
    const store = new WebDocumentStore(host(true, []), 'k', 'a.ns.svg', { kind: 'none' });
    expect(await store.writeAs('<svg/>', 'a')).toEqual({ ok: false, reason: 'cancelled' });
  });

  it('T-0683: a save dialog that fails is a failed save', async () => {
    stubSavePicker({ error: new DOMException('no', 'SecurityError') });
    const store = new WebDocumentStore(host(true, []), 'k', 'a.ns.svg', { kind: 'none' });
    expect(await store.writeAs('<svg/>', 'a')).toMatchObject({ ok: false, reason: 'failed' });
  });

  it('T-0684: 06-web 1: "save as" onto the same file keeps the document key', async () => {
    const written: Written[] = [];
    const { handle } = fakeHandle('a.ns.svg', 'granted');
    const { handle: again } = fakeHandle('a.ns.svg', 'granted');
    stubSavePicker({ handle: again });
    const store = new WebDocumentStore(host(true, written), 'k', 'a.ns.svg', {
      kind: 'handle',
      handle,
    });
    await store.writeAs('<svg/>', 'a.ns.svg');
    expect(written[0]).toMatchObject({ previousKey: 'k', key: 'k' });
  });

  it('T-0685: 06-web 1: "save as" suggests the name with the document extension', async () => {
    const suggested = stubSavePicker({ error: new DOMException('closed', 'AbortError') });
    const store = new WebDocumentStore(host(true, []), 'k', 'a.ns.svg', { kind: 'none' });
    await store.writeAs('<svg/>', 'plan');
    await store.writeAs('<svg/>', 'old.ns');
    expect(suggested).toEqual(['plan.ns.svg', 'old.ns']);
  });

  it('T-0686: 06-web 2: a refused permission is a denied save', async () => {
    const { handle } = fakeHandle('a.ns.svg', 'prompt');
    const refusing = Object.assign(handle, { requestPermission: () => Promise.resolve('denied') });
    const store = new WebDocumentStore(host(true, []), 'k', 'a.ns.svg', {
      kind: 'handle',
      handle: refusing,
    });
    expect(await store.write('<svg/>')).toEqual({ ok: false, reason: 'denied' });
  });

  it('T-0687: 06-web 2: a write the browser does not allow is denied; other write errors fail', async () => {
    const denied = new WebDocumentStore(host(true, []), 'k', 'a.ns.svg', {
      kind: 'handle',
      handle: failingHandle('a.ns.svg', new DOMException('lost', 'NotAllowedError')),
    });
    expect(await denied.write('<svg/>')).toEqual({ ok: false, reason: 'denied', detail: 'lost' });
    const written: Written[] = [];
    const failed = new WebDocumentStore(host(true, written), 'k', 'a.ns.svg', {
      kind: 'handle',
      handle: failingHandle('a.ns.svg', new Error('disk full')),
    });
    expect(await failed.write('<svg/>')).toEqual({
      ok: false,
      reason: 'failed',
      detail: 'Error: disk full',
    });
    expect(written).toEqual([]);
  });

  it('T-0688: reads the file it was opened from', async () => {
    const { handle, state } = fakeHandle('a.ns.svg', 'granted');
    state.text = '<svg>file</svg>';
    const store = new WebDocumentStore(host(true, []), 'k', 'a.ns.svg', { kind: 'handle', handle });
    expect(await store.read()).toBe('<svg>file</svg>');
  });
});

describe('web document store: other browsers', () => {
  it('T-0689: 06-web 1: tells the shell before every download', async () => {
    let downloads = 0;
    const counting: StoreHost = {
      ...host(false, []),
      downloading: () => {
        downloads += 1;
      },
    };
    const store = new WebDocumentStore(counting, 'k', 'a.ns.svg', { kind: 'none' });
    await store.write('<svg/>');
    await store.write('<svg/>');
    expect(downloads).toBe(2);
  });

  it('T-0690: 06-web 1: a cancelled "download as" changes nothing', async () => {
    const written: Written[] = [];
    const cancelling: StoreHost = {
      ...host(false, written),
      askDownloadName: () => Promise.resolve(null),
    };
    const store = new WebDocumentStore(cancelling, 'k', 'a.ns.svg', { kind: 'none' });
    expect(await store.writeAs('<svg/>', 'a.ns.svg')).toEqual({ ok: false, reason: 'cancelled' });
    expect(store.name).toBe('a.ns.svg');
    expect(written).toEqual([]);
  });

  it('T-0691: a download that fails is a failed save', async () => {
    vi.mocked(download).mockImplementationOnce(() => {
      throw new Error('blocked');
    });
    const written: Written[] = [];
    const store = new WebDocumentStore(host(false, written), 'k', 'a.ns.svg', { kind: 'none' });
    expect(await store.write('<svg/>')).toEqual({
      ok: false,
      reason: 'failed',
      detail: 'Error: blocked',
    });
    expect(written).toEqual([]);
  });

  it('T-0692: a new document has no file to read, and no other documents are read yet', async () => {
    const store = new WebDocumentStore(host(false, []), 'k', 'a.ns.svg', { kind: 'none' });
    await expect(store.read()).rejects.toThrow('A new document has no file to read');
    expect(await store.readOther()).toBeNull();
  });
});
