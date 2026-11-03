// The web shell's `DocumentStore` (03-editor 6, 06-web 1). One store per open document.

import type { DocumentStore, WriteResult } from '../editor-contract';
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
  readonly log: (detail: string) => void;
};

/** Where the document lives. */
export type StoreOrigin =
  | { readonly kind: 'handle'; readonly handle: FileSystemFileHandle }
  /** Opened from `<input type="file">`, a dropped file without a handle, or a browser copy. */
  | { readonly kind: 'copy'; readonly text: string }
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

  /** The file handle, when the document is a file this browser can write to. */
  get handle(): FileSystemFileHandle | null {
    return this.#origin.kind === 'handle' ? this.#origin.handle : null;
  }

  /**
   * Whether auto save may write now: a file handle whose write permission was granted
   * (by a save, or still granted from earlier) (06-web 2).
   */
  async canAutosave(): Promise<boolean> {
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
    if (this.canWriteInPlace) {
      // A new document's first save shows the save dialog (06-web 1 table).
      return this.#isQuiet ? { ok: false, reason: 'denied' } : this.writeAs(svg, this.#name);
    }
    return this.#download(this.#name, svg);
  }

  async writeAs(svg: string, suggestedName: string): Promise<WriteResult> {
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
