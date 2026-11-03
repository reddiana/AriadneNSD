// The web shell's `DocumentStore` (03-editor 6, 06-web 1). One store per open document.

import type { DocumentPlace, DocumentStore, WriteResult } from '../editor-contract';
import { documentMediaType, download } from './file-fallback';
import { documentFileName } from './file-name';
import { ensurePermission, pickDocumentToSave, writeToHandle } from './file-system-access';

/** What the store tells the shell after a successful write (to update recent files and backups). */
export type Written = {
  /** The document key before the write. A "save as" to a new file changes the key. */
  readonly previousKey: string;
  readonly key: string;
  readonly name: string;
  readonly svg: string;
  /** Chromium: the file that was written. Absent for downloads. */
  readonly handle?: FileSystemFileHandle;
  /** The document was written to this browser (R-WEB-09), not to a file. */
  readonly isBrowser?: true;
};

/** Where Save As writes (the open · save modal, UX BS1). */
export type SavePlace =
  | { readonly kind: 'computer' }
  /** A document in this browser: its name, and the key to write under (a replaced one's). */
  | { readonly kind: 'browser'; readonly name: string; readonly key: string };

/** The document being saved, for choosing where. */
export type SaveSubject = {
  readonly key: string;
  readonly name: string;
  readonly svg: string;
  readonly isBrowser: boolean;
};

/** What the store needs from the shell. */
export type StoreHost = {
  /** Whether this browser can write to the original file (06-web 1). */
  readonly canWriteInPlace: boolean;
  /** The name of a document that has none yet (with `.ns.svg`). */
  readonly untitledName: string;
  readonly newKey: () => string;
  readonly written: (written: Written) => void;
  /** Firefox and Safari: called before every download; the shell tells the user once (06-web 1). */
  readonly downloading: () => void;
  /** Firefox and Safari "save as": asks for a name, or `null` when the user cancelled. */
  readonly askDownloadName: (suggestedName: string) => Promise<string | null>;
  /**
   * Save As (and a new document's first save): asks where, or `null` when the user closed the
   * modal. Absent: always this computer.
   */
  readonly chooseSavePlace?: (subject: SaveSubject) => Promise<SavePlace | null>;
  /** Writes a document to this browser (R-WEB-09). */
  readonly writeBrowser?: (entry: {
    readonly key: string;
    readonly name: string;
    readonly svg: string;
  }) => Promise<WriteResult>;
  readonly log: (detail: string) => void;
};

/** Where the document lives. */
export type StoreOrigin =
  | { readonly kind: 'handle'; readonly handle: FileSystemFileHandle }
  /** Opened from `<input type="file">`, a dropped file without a handle, or a browser copy. */
  | { readonly kind: 'copy'; readonly text: string }
  /** A document kept in this browser under its key (R-WEB-09, UX BS2). */
  | { readonly kind: 'browser'; readonly text: string }
  /** A new document (R-ALL-03), or one restored without its file. */
  | { readonly kind: 'none' };

/**
 * A document's store. Chromium writes to the file handle; other browsers download.
 * `isQuiet` turns permission prompts off for auto save (no user gesture → 06-web 2).
 */
export class WebDocumentStore implements DocumentStore {
  #key: string;
  #name: string;
  #origin: StoreOrigin;
  #host: StoreHost;
  #isQuiet = false;
  #hasWritePermission = false;

  constructor(host: StoreHost, key: string, name: string, origin: StoreOrigin) {
    this.#host = host;
    this.#key = key;
    this.#name = name;
    this.#origin = origin;
  }

  get name(): string {
    return this.#name;
  }

  get canWriteInPlace(): boolean {
    return this.#host.canWriteInPlace;
  }

  /** The document key: of its recent-files entry and its local backup. */
  get key(): string {
    return this.#key;
  }

  /** Whether the document was never saved: a new document (or an example), not a file (UX US1). */
  get isNew(): boolean {
    return this.#origin.kind === 'none';
  }

  /** A document in this browser is "the original file" of its own kind (UX BS2). */
  get place(): DocumentPlace {
    return this.#origin.kind === 'browser' ? 'browser' : 'file';
  }

  /** A browser document's new name (renamed in the list). Changes nothing else. */
  renameBrowser(name: string): void {
    if (this.#origin.kind === 'browser') {
      this.#name = name;
    }
  }

  /** The file handle, when the document is a file this browser can write to. */
  get handle(): FileSystemFileHandle | null {
    return this.#origin.kind === 'handle' ? this.#origin.handle : null;
  }

  /**
   * Whether auto save may write now: a file handle whose write permission was granted
   * (by a save, or still granted from earlier) (06-web 2).
   */
  async canAutosave(): Promise<boolean> {
    if (this.#origin.kind === 'browser') {
      // No permission is needed, so every browser auto saves a browser document (UX BS2).
      return true;
    }
    const { handle } = this;
    if (handle === null) {
      return false;
    }
    if (!this.#hasWritePermission) {
      this.#hasWritePermission = await ensurePermission(handle, 'readwrite', false);
    }
    return this.#hasWritePermission;
  }

  /** Runs `work` with permission prompts turned off (auto save). */
  async quietly<T>(work: () => Promise<T>): Promise<T> {
    this.#isQuiet = true;
    try {
      return await work();
    } finally {
      this.#isQuiet = false;
    }
  }

  async read(): Promise<string> {
    switch (this.#origin.kind) {
      case 'handle': {
        const file = await this.#origin.handle.getFile();
        return file.text();
      }
      case 'copy':
      case 'browser':
        return this.#origin.text;
      case 'none':
        throw new Error('A new document has no file to read');
    }
  }

  async write(svg: string): Promise<WriteResult> {
    const { handle } = this;
    if (handle !== null) {
      return this.#writeHandle(handle, svg);
    }
    if (this.#origin.kind === 'browser') {
      return this.#writeBrowser(this.#key, this.#name, svg);
    }
    if (this.canWriteInPlace || (this.isNew && this.#host.chooseSavePlace !== undefined)) {
      // A new document's first save asks where, like Save As (06-web 1 table, UX BS1).
      return this.#isQuiet ? { ok: false, reason: 'denied' } : this.#saveAs(svg, this.#name, true);
    }
    return this.#download(this.#name, svg);
  }

  async writeAs(svg: string, suggestedName: string): Promise<WriteResult> {
    return this.#saveAs(svg, suggestedName, false);
  }

  /**
   * Asks where (when the shell has browser documents), then writes there. A new document's first
   * save that goes to this computer downloads at once in Firefox and Safari, as before (06-web 1).
   */
  async #saveAs(svg: string, suggestedName: string, isFirstSave: boolean): Promise<WriteResult> {
    const { chooseSavePlace } = this.#host;
    if (chooseSavePlace !== undefined) {
      const place = await chooseSavePlace({
        key: this.#key,
        name: this.#name,
        svg,
        isBrowser: this.#origin.kind === 'browser',
      });
      if (place === null) {
        return { ok: false, reason: 'cancelled' };
      }
      if (place.kind === 'browser') {
        return this.#writeBrowser(place.key, place.name, svg);
      }
    }
    if (isFirstSave && !this.canWriteInPlace) {
      return this.#download(this.#name, svg);
    }
    return this.#writeAsFile(svg, suggestedName);
  }

  async #writeAsFile(svg: string, suggestedName: string): Promise<WriteResult> {
    const name = documentFileName(suggestedName, this.#host.untitledName);
    if (!this.canWriteInPlace) {
      const chosen = await this.#host.askDownloadName(name);
      if (chosen === null) {
        return { ok: false, reason: 'cancelled' };
      }
      return this.#download(documentFileName(chosen, this.#host.untitledName), svg);
    }
    let handle: FileSystemFileHandle | null;
    try {
      handle = await pickDocumentToSave(name);
    } catch (error) {
      this.#host.log(`showSaveFilePicker failed: ${String(error)}`);
      return { ok: false, reason: 'failed', detail: String(error) };
    }
    if (handle === null) {
      return { ok: false, reason: 'cancelled' };
    }
    // The picker grants write permission to the file it returns.
    this.#hasWritePermission = true;
    const previousKey = this.#key;
    const isSameFile = this.handle !== null && (await this.handle.isSameEntry(handle));
    const key = isSameFile ? previousKey : this.#host.newKey();
    return this.#writeHandle(handle, svg, { previousKey, key });
  }

  readOther(): Promise<string | null> {
    // Other documents (R-BLK-09) come with the call block, after the MVP.
    return Promise.resolve(null);
  }

  async #writeHandle(
    handle: FileSystemFileHandle,
    svg: string,
    keys: { readonly previousKey: string; readonly key: string } = {
      previousKey: this.#key,
      key: this.#key,
    },
  ): Promise<WriteResult> {
    try {
      const isAllowed =
        (this.#hasWritePermission && this.handle === handle) ||
        (await ensurePermission(handle, 'readwrite', !this.#isQuiet));
      if (!isAllowed) {
        this.#hasWritePermission = false;
        return { ok: false, reason: 'denied' };
      }
      await writeToHandle(handle, svg);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        this.#hasWritePermission = false;
        return { ok: false, reason: 'denied', detail: error.message };
      }
      this.#host.log(`Writing ${handle.name} failed: ${String(error)}`);
      return { ok: false, reason: 'failed', detail: String(error) };
    }
    this.#hasWritePermission = true;
    this.#origin = { kind: 'handle', handle };
    this.#name = handle.name;
    this.#key = keys.key;
    this.#host.written({
      previousKey: keys.previousKey,
      key: keys.key,
      name: handle.name,
      svg,
      handle,
    });
    return { ok: true, name: handle.name };
  }

  async #writeBrowser(key: string, name: string, svg: string): Promise<WriteResult> {
    const { writeBrowser } = this.#host;
    if (writeBrowser === undefined) {
      throw new Error('This store has no browser documents');
    }
    const result = await writeBrowser({ key, name, svg });
    if (!result.ok) {
      return result;
    }
    const previousKey = this.#key;
    this.#origin = { kind: 'browser', text: svg };
    this.#name = name;
    this.#key = key;
    this.#host.written({ previousKey, key, name, svg, isBrowser: true });
    return { ok: true, name };
  }

  #download(name: string, svg: string): WriteResult {
    this.#host.downloading();
    try {
      download(name, svg, documentMediaType);
    } catch (error) {
      this.#host.log(`Download of ${name} failed: ${String(error)}`);
      return { ok: false, reason: 'failed', detail: String(error) };
    }
    const previousKey = this.#key;
    this.#origin = { kind: 'copy', text: svg };
    this.#name = name;
    this.#host.written({ previousKey, key: previousKey, name, svg });
    return { ok: true, name };
  }
}
