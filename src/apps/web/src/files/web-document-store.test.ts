import { describe, expect, it, vi } from 'vitest';

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
  it('R-WEB-02: writes to the original file, asking for permission on a save', async () => {
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

  it('06-web 2: auto save never asks for permission; without it the write is denied', async () => {
    const { handle, state } = fakeHandle('a.ns.svg', 'prompt');
    const store = new WebDocumentStore(host(true, []), 'k', 'a.ns.svg', { kind: 'handle', handle });
    expect(await store.canAutosave()).toBe(false);
    const result = await store.quietly(() => store.write('<svg/>'));
    expect(result).toEqual({ ok: false, reason: 'denied' });
    expect(state.prompted).toBe(0);
  });

  it('06-web 2: auto save may write once the permission is granted', async () => {
    const { handle } = fakeHandle('a.ns.svg', 'granted');
    const store = new WebDocumentStore(host(true, []), 'k', 'a.ns.svg', { kind: 'handle', handle });
    expect(await store.canAutosave()).toBe(true);
  });

  it('06-web 1: without File System Access, saving downloads under the same name', async () => {
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

  it('06-web 1: "download as" asks for a name and keeps the document extension', async () => {
    const store = new WebDocumentStore(host(false, []), 'k', 'a.ns.svg', { kind: 'none' });
    expect(await store.writeAs('<svg/>', 'a.ns.svg')).toEqual({
      ok: true,
      name: 'renamed-a.ns.svg',
    });
    expect(store.name).toBe('renamed-a.ns.svg');
  });
});
