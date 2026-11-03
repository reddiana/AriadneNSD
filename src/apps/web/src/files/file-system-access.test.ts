// File System Access (06-web 1): the Chromium pickers, permissions and writes to the original file.

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  droppedHandle,
  ensurePermission,
  hasFileSystemAccess,
  isFileHandle,
  pickDocumentToSave,
  pickFileToOpen,
  pickPngToSave,
  writeToHandle,
} from './file-system-access';

const abort = (): Promise<never> => Promise.reject(new DOMException('closed', 'AbortError'));

/** A handle whose permission answers are `query` and then `request`. */
function permissionHandle(query: PermissionState, request?: PermissionState) {
  const asked: string[] = [];
  const handle = {
    queryPermission: ({ mode }: { mode: string }) => {
      asked.push(`query ${mode}`);
      return Promise.resolve(query);
    },
    ...(request === undefined
      ? {}
      : {
          requestPermission: ({ mode }: { mode: string }) => {
            asked.push(`request ${mode}`);
            return Promise.resolve(request);
          },
        }),
  };
  return { handle: handle as unknown as FileSystemHandle, asked };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('File System Access', () => {
  it('T-0755: 06-web 1: is there only when the browser has both pickers', () => {
    expect(hasFileSystemAccess({ showOpenFilePicker: 1, showSaveFilePicker: 1 })).toBe(true);
    expect(hasFileSystemAccess({ showOpenFilePicker: 1 })).toBe(false);
    expect(hasFileSystemAccess({})).toBe(false);
  });

  it('T-0756 · R-WEB-02: the open dialog shows one .ns.svg or .ns file and gives its handle', async () => {
    const handle = { name: 'a.ns.svg' };
    const calls: unknown[] = [];
    vi.stubGlobal('window', {
      showOpenFilePicker: (options: unknown) => {
        calls.push(options);
        return Promise.resolve([handle]);
      },
    });
    expect(await pickFileToOpen()).toBe(handle);
    expect(calls).toEqual([
      {
        types: [{ description: 'AriadneNSD', accept: { 'image/svg+xml': ['.ns.svg', '.ns'] } }],
        multiple: false,
        id: 'ariadne-nsd',
      },
    ]);
  });

  it('T-0757: closing a dialog is not a failure; other errors are', async () => {
    vi.stubGlobal('window', { showOpenFilePicker: abort, showSaveFilePicker: abort });
    expect(await pickFileToOpen()).toBeNull();
    expect(await pickDocumentToSave('a.ns.svg')).toBeNull();
    vi.stubGlobal('window', {
      showOpenFilePicker: () => Promise.reject(new DOMException('no', 'SecurityError')),
    });
    await expect(pickFileToOpen()).rejects.toThrow('no');
  });

  it('T-0758: an open dialog that gives no file gives null', async () => {
    vi.stubGlobal('window', { showOpenFilePicker: () => Promise.resolve([]) });
    expect(await pickFileToOpen()).toBeNull();
  });

  it('T-0759 · R-EXP-01: the save dialogs suggest the name and filter by type', async () => {
    const calls: unknown[] = [];
    vi.stubGlobal('window', {
      showSaveFilePicker: (options: unknown) => {
        calls.push(options);
        return Promise.resolve({ name: 'x' });
      },
    });
    await pickDocumentToSave('a.ns.svg');
    await pickPngToSave('a.png');
    expect(calls).toEqual([
      {
        types: [{ description: 'AriadneNSD', accept: { 'image/svg+xml': ['.ns.svg', '.ns'] } }],
        suggestedName: 'a.ns.svg',
        id: 'ariadne-nsd',
      },
      {
        types: [{ description: 'PNG', accept: { 'image/png': ['.png'] } }],
        suggestedName: 'a.png',
        id: 'ariadne-nsd',
      },
    ]);
  });
});

describe('permissions', () => {
  it('T-0760: 06-web 2: a granted permission is not asked again', async () => {
    const { handle, asked } = permissionHandle('granted', 'granted');
    expect(await ensurePermission(handle, 'readwrite', true)).toBe(true);
    expect(asked).toEqual(['query readwrite']);
  });

  it('T-0761: 06-web 2: asks the user when allowed to prompt', async () => {
    const { handle, asked } = permissionHandle('prompt', 'granted');
    expect(await ensurePermission(handle, 'read', true)).toBe(true);
    expect(asked).toEqual(['query read', 'request read']);
  });

  it('T-0762: 06-web 2: does not ask without a user gesture', async () => {
    const { handle, asked } = permissionHandle('prompt', 'granted');
    expect(await ensurePermission(handle, 'readwrite', false)).toBe(false);
    expect(asked).toEqual(['query readwrite']);
  });

  it('T-0763: a refused prompt, or no way to ask, is no permission', async () => {
    expect(await ensurePermission(permissionHandle('prompt', 'denied').handle, 'read', true)).toBe(
      false,
    );
    expect(await ensurePermission(permissionHandle('prompt').handle, 'read', true)).toBe(false);
  });

  it('T-0764: a browser without permission methods allows access', async () => {
    expect(await ensurePermission({} as FileSystemHandle, 'readwrite', false)).toBe(true);
  });
});

describe('handles', () => {
  it('T-0765 · R-WEB-02: writes to the file and closes it, even when the write fails', async () => {
    const log: string[] = [];
    const handle = (fails: boolean) =>
      ({
        createWritable: () =>
          Promise.resolve({
            write: (data: string) => {
              log.push(`write ${data}`);
              return fails ? Promise.reject(new Error('disk full')) : Promise.resolve();
            },
            close: () => {
              log.push('close');
              return Promise.resolve();
            },
          }),
      }) as unknown as FileSystemFileHandle;
    await writeToHandle(handle(false), 'a');
    await expect(writeToHandle(handle(true), 'b')).rejects.toThrow('disk full');
    expect(log).toEqual(['write a', 'close', 'write b', 'close']);
  });

  it('T-0766: 06-web 1: reads the handle of a dropped file where the browser has it', async () => {
    const handle = { kind: 'file' };
    const withHandle = { getAsFileSystemHandle: () => Promise.resolve(handle) };
    expect(await droppedHandle(withHandle as unknown as DataTransferItem)).toBe(handle);
    expect(droppedHandle({} as DataTransferItem)).toBeNull();
  });

  it('T-0767: tells a file from a folder', () => {
    expect(isFileHandle({ kind: 'file' } as FileSystemHandle)).toBe(true);
    expect(isFileHandle({ kind: 'directory' } as FileSystemHandle)).toBe(false);
  });
});
