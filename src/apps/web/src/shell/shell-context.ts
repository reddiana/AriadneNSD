// What the parts of the web shell share (web-shell.ts builds it once): the options, the state
// they read and change, the shell's messages in the screen language and the status-bar notices.
// Kept apart from web-shell.ts so the parts can use these types without importing it (no cycle).

import type { Locale } from '@ariadne-nsd/core';

import type { EditorHandle, ReadOnlyReason, SettingsStore } from '../editor-contract';
import type { ShareHost } from '../files/share-command';
import type { StoreOrigin, WebDocumentStore } from '../files/web-document-store';
import type { BrowserDb } from '../storage/browser-db';
import type { RecentFile } from '../storage/recent-files';
import type { ShellMessageKey } from './messages';
import type { Channel } from './tab-lock';
import type { Autosave, Clock } from './timers';

/** What the shell is built from. Browser APIs are passed in where tests or the adapter need it. */
export type WebShellOptions = {
  readonly db: BrowserDb;
  readonly settings: SettingsStore;
  readonly locale: Locale;
  readonly canWriteInPlace: boolean;
  /** Tabs of this site tell each other which file they edit (06-web 2). `null`: no such API. */
  readonly channel: Channel | null;
  readonly tabId: string;
  readonly wait: (milliseconds: number) => Promise<void>;
  readonly clock: Clock;
  readonly newKey: () => string;
  readonly now: () => number;
  /** Sets the browser tab title. */
  readonly setTitle: (title: string) => void;
  readonly log: (detail: string) => void;
  /** Making share links (R-WEB-05): this page's address, the compressor and the clipboard. */
  readonly share: Pick<ShareHost, 'page' | 'deflate' | 'copyText'>;
  /**
   * Asks the browser not to clear this site's storage first when space runs low
   * (`navigator.storage.persist`). Absent: the browser has no such API.
   */
  readonly persistStorage?: () => Promise<boolean>;
  /** The bundled TTF, whose outlines draw the text of a PDF (R-EXP-03). Loaded once. */
  readonly fontFile: () => Promise<Uint8Array>;
  /** The browser's language (`navigator.language`): the paper of PDF and print. */
  readonly languageTag: string;
  /** File › Print… (R-EXP-03): `false` if the pages could not be made. */
  readonly print: () => boolean;
};

/**
 * How the current document is left for another (UX US1): its changes kept in the local backup,
 * or discarded because the user chose so.
 */
export type Leave = 'keep' | 'discard';

/** Makes the store of a document (web-shell.ts). */
export type NewStore = (key: string, name: string, origin: StoreOrigin) => WebDocumentStore;

/** The product name, in the browser tab title. */
export const appName = 'AriadneNSD';

/** The shell's state that more than one part reads or changes. */
export type ShellState = {
  /** Set by `start`. */
  editor: EditorHandle | null;
  /** The open document's store. */
  store: WebDocumentStore;
  /** The screen language (preferences can change it). */
  locale: Locale;
  recent: ReadonlyArray<RecentFile>;
  /** Recent files that could not be found when opened. */
  readonly missingKeys: Set<string>;
  lastRevision: number;
  isReadOnly: boolean;
  /** Why it is view only, when another tab holds the file (a share link has no reason to tell). */
  readOnlyReason: ReadOnlyReason | undefined;
  /** View mode (R-WEB-06): a share link's document, read only, without the editing UI. */
  isViewing: boolean;
  /** A notice to show after the next document opens (it empties the status bar). */
  pendingNotice: string | null;
  /** US1 "Save in Browser": the next save goes to this browser without the modal. */
  isNextSaveToBrowser: boolean;
  autosave: Autosave;
};

export type ShellContext = {
  readonly options: WebShellOptions;
  readonly state: ShellState;
  /** The shell's message in the screen language. */
  readonly text: (key: ShellMessageKey, values?: Readonly<Record<string, string>>) => string;
  /** Tells the user in the editor's status bar (06-web 7: one place for notices). */
  readonly notices: { readonly show: (message: string, level: 'info' | 'warn') => void };
  /** A new document's file name, in the screen language when the shell was made. */
  readonly untitledName: string;
};
