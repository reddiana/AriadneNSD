// The editor ↔ shell contract as the web shell uses it (03-editor 6, ADR-0031, ADR-0033).
// The shell's modules read these types only; `main.tsx` binds them to @ariadne-nsd/editor.
// They are the members the shell calls, written after 03-editor 6, so the editor's own types
// (which have more members) can be passed wherever these are expected.

import type { Doc } from '@ariadne-nsd/core';

/** A screen string. The shell passes plain text (from its own catalog). */
export type Message =
  string | { readonly key: string; readonly params?: Readonly<Record<string, string | number>> };

/** The host's brightness and UI font (03-editor 6). */
export type Appearance = { readonly scheme: 'light' | 'dark'; readonly uiFont: string };

/** The result of a write (03-editor 6). `cancelled` is not a failure. */
export type WriteResult =
  | { readonly ok: true; readonly name: string }
  | {
      readonly ok: false;
      readonly reason: 'cancelled' | 'denied' | 'failed';
      readonly detail?: string;
    };

/** One document's reading and writing, implemented by the shell (03-editor 6). */
export type DocumentStore = {
  readonly name: string;
  readonly canWriteInPlace: boolean;
  read(): Promise<string>;
  write(svg: string): Promise<WriteResult>;
  writeAs(svg: string, suggestedName: string): Promise<WriteResult>;
  readOther(path: string): Promise<string | null>;
};

/** User settings, implemented by the shell (03-editor 6). Reads are synchronous. */
export type SettingsStore = {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- the signature of 03-editor 6.
  get<T>(key: string): T | undefined;
  set(key: string, value: unknown): void;
  onChange(listener: (key: string) => void): () => void;
};

/** What the shell gives `open` (03-editor 6). */
export type OpenedDocument = {
  readonly store: DocumentStore;
  /** `.ns.svg` or `.ns` text. `null`: a new document (R-ALL-03). */
  readonly text: string | null;
  readonly readOnly?: boolean;
  /** A local backup's snapshot (model JSON). Opened instead of `text`, as dirty (03-editor 6.3). */
  readonly restored?: string;
  /** A ready-made document (an example, R-EDIT-25), opened new and clean instead of `text`. */
  readonly doc?: Doc;
};

/** The document's state (03-editor 6.2). */
export type DocStatus = {
  readonly name: string;
  readonly dirty: boolean;
  readonly readOnly: boolean;
  readonly revision: number;
};

/** Where a command sits in the menu bar (03-editor 5, with the UI's submenu extension). */
export type MenuPlace = {
  readonly menu: 'file' | 'edit' | 'diagram' | 'view' | 'help';
  readonly group: number;
  readonly order: number;
  readonly submenu?: 'recent' | 'export' | 'insert' | 'insertBefore' | 'wrap';
};

/** One command (03-editor 5). The shell's commands do not read the context. */
export type CommandSpec = {
  readonly id: string;
  readonly title: Message;
  readonly keys: ReadonlyArray<string>;
  readonly menu?: MenuPlace;
  readonly toolbar?: { readonly group: number; readonly order: number; readonly icon: string };
  readonly edits: boolean;
  when(context: unknown): true | Message;
  run(context: unknown, args?: unknown): void | Promise<void>;
};

/** The command list (03-editor 6). The shell only adds to it. */
export type CommandRegistry = {
  register(spec: CommandSpec): () => void;
  run(id: string, args?: unknown): void;
};

/** The editor's handle, the members the shell calls (03-editor 6). */
export type EditorHandle = {
  readonly commands: CommandRegistry;
  /** `false`: the text could not be opened; the document did not change. */
  open(doc: OpenedDocument): boolean;
  status(): DocStatus;
  onStatus(listener: (status: DocStatus) => void): () => void;
  /** The `.ns.svg` text (makes the subset font, so it is asynchronous). */
  serialize(): Promise<string>;
  snapshot(): string;
  save(): Promise<WriteResult>;
  setReadOnly(readOnly: boolean): void;
  setAppearance(appearance: Appearance): void;
  /** Shows a message in the editor's status bar (the one place for notices, 06-web 7). */
  notify(message: Message, level?: 'info' | 'warn'): void;
  /** Asks a yes/no question in the editor's modal. */
  confirm(
    message: Message,
    buttons?: { readonly confirm?: Message; readonly cancel?: Message },
  ): Promise<boolean>;
  /** Asks for a text in the editor's modal; `null` when cancelled. */
  prompt(message: Message, value: string): Promise<string | null>;
};
