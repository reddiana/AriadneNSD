// What the check mode (`?perf`, 06-web 9) gives the editor in place of the web shell. Nothing of
// it writes anywhere: the measured document is thrown away, and the user's files, local backup,
// recent files, documents in this browser, settings and clipboard are left as they are.

import type {
  ClipboardData,
  ClipboardPort,
  DocumentStore,
  SaveFonts,
  WriteResult,
} from '@ariadne-nsd/editor';

import type { KeyValueStorage } from '../storage/settings-store';

/**
 * The browser's storage for reading only: the settings store reads the user's preferences from it
 * (screen language, theme), and its writes stay in memory (the preferences window of the page).
 */
export function readOnlyStorage(storage: KeyValueStorage | null): KeyValueStorage | null {
  if (storage === null) {
    return null;
  }
  return {
    getItem: (key) => storage.getItem(key),
    key: (index) => storage.key(index),
    get length() {
      return storage.length;
    },
    setItem: () => undefined,
    removeItem: () => undefined,
  };
}

const notSaved: WriteResult = { ok: false, reason: 'denied', detail: 'check mode saves nothing' };

/** The measured document's store: it reads nothing and writes nothing. */
export function perfDocumentStore(name: string): DocumentStore {
  return {
    name,
    canWriteInPlace: false,
    read: () => Promise.resolve(''),
    write: () => Promise.resolve(notSaved),
    writeAs: () => Promise.resolve(notSaved),
    readOther: () => Promise.resolve(null),
  };
}

/** A clipboard in memory: copying a block while measuring leaves the system clipboard alone. */
export function memoryClipboard(): ClipboardPort {
  let kept: ClipboardData = { text: null, json: null };
  return {
    write: (data) => {
      kept = data;
      return Promise.resolve('memory');
    },
    read: () => Promise.resolve(kept),
  };
}

/** Saving fails: the check mode never makes a file, so it never fetches the save font. */
export const noSaveFonts: SaveFonts = () =>
  Promise.reject(new Error('The check mode does not save'));
