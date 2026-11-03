// The interfaces between the editor and a shell (03-editor 6, ADR-0031, ADR-0033).
// Required interfaces (ports) are implemented by the shell; provided ones by the editor.
import type { Doc } from '@ariadne-nsd/core';
import type { Subsetter } from '@ariadne-nsd/fonts';

import type { Message } from './i18n/messages';
import type { EditorState } from './state/editor-state';
import type { SelectionKind } from './state/selection';

// Required interfaces: the shell implements these and passes them in.

/** Reads and writes one document (03-editor 6). Errors come back as values, never thrown. */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- a contract the shell implements (coding guide 4)
export interface DocumentStore {
  /** The file name shown on the screen ("example.ns.svg"). Changes after "Save As". */
  readonly name: string;
  /** Whether the original file can be written (false in Firefox and Safari on the web). */
  readonly canWriteInPlace: boolean;
  read(): Promise<string>;
  /** Writes to the original place. If it cannot, the shell does something else (download). */
  write(svg: string): Promise<WriteResult>;
  writeAs(svg: string, suggestedName: string): Promise<WriteResult>;
  /** Another document (R-BLK-09). `null` when it cannot be read. */
  readOther(path: string): Promise<string | null>;
}

/** The result of a write. The user closing the save dialog (`cancelled`) is not an error. */
export type WriteResult =
  | { readonly ok: true; readonly name: string }
  | {
      readonly ok: false;
      readonly reason: 'cancelled' | 'denied' | 'failed';
      readonly detail?: string;
    };

/** The user settings the shell keeps (03-editor 6). Reading is synchronous. */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- a contract the shell implements (coding guide 4)
export interface SettingsStore {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- as in 03-editor 6
  get<T>(key: string): T | undefined;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- as in 03-editor 6
  set<T>(key: string, value: T): void;
  /** A setting changed elsewhere (another window, a settings screen). */
  onChange(listener: (key: string) => void): () => void;
}

/** A document to open (03-editor 6). */
export type OpenedDocument = {
  readonly store: DocumentStore;
  /** The `.ns.svg` or `.ns` text. `null` makes a new document (R-ALL-03). */
  readonly text: string | null;
  /** View only (03-editor 6.4). */
  readonly readOnly?: boolean;
  /** Model JSON from the local backup (`snapshot()`); opened instead of `text`, as dirty. */
  readonly restored?: string;
  /**
   * A ready-made document opened as a new, unsaved-but-clean document instead of `text`: an
   * example (R-EDIT-25). Nothing is selected (UX OP1).
   */
  readonly doc?: Doc;
};

/** The screen brightness and UI font from the host (03-editor 6). */
export type Appearance = { readonly scheme: 'light' | 'dark'; readonly uiFont: string };

/**
 * What saving needs to make the subset font (ADR-0026, ADR-0039). The editor asks once, on the
 * first save, and keeps the answer. On the web: `createBrowserSubsetter()` from
 * `@ariadne-nsd/fonts/browser` and the bytes of `blockFont.files.ttf`.
 */
export type SaveFonts = () => Promise<{ readonly subsetter: Subsetter; readonly ttf: Uint8Array }>;

// Provided interfaces: the editor makes these and hands them to the shell.

/** What a command's `when`, `title` and `run` receive. */
export type CommandContext = {
  readonly state: EditorState;
  readonly store: DocumentStore;
  readonly settings: SettingsStore;
};

/** The menus of the menu bar (03-editor 5.1). */
export type MenuId = 'file' | 'edit' | 'diagram' | 'view' | 'help';

/** Submenus inside a menu (03-editor 5.1: "삽입 ▸", "감싸기 ▸", "최근 파일 ▸", "내보내기 ▸"). */
export type SubmenuId = 'recent' | 'export' | 'insert' | 'insertBefore' | 'wrap';

/** Where a command sits in the menu bar. Groups are separated by a line. */
export type MenuPlace = {
  readonly menu: MenuId;
  readonly group: number;
  readonly order: number;
  readonly submenu?: SubmenuId;
};

/** Where a command sits in the toolbar (03-editor 5.2, 06-web 7). */
export type ToolbarPlace = {
  readonly group: number;
  readonly order: number;
  readonly icon: string;
};

/**
 * One command (03-editor 5). Menus, the toolbar, the context menu, the command palette and the
 * key table are all made from the list of these (ADR-0033).
 */
export type CommandSpec = {
  /** `'block.insert.if'`, `'edit.cut'` … */
  readonly id: string;
  /** The name in the screen language (R-NFR-04). A function when it depends on the situation. */
  readonly title: Message | ((ctx: CommandContext) => Message);
  /** The keys, for display. The key table of the editor fills them for its commands. */
  readonly keys: ReadonlyArray<string>;
  readonly menu?: MenuPlace;
  readonly toolbar?: ToolbarPlace;
  /** The kinds of selection the context menu shows this command for. */
  readonly context?: ReadonlyArray<SelectionKind>;
  /** Whether it changes the document. Read-only documents refuse these (03-editor 6.4). */
  readonly edits: boolean;
  /** Whether it applies now, or why not. */
  when(ctx: CommandContext): true | Message;
  run(ctx: CommandContext, args?: unknown): void | Promise<void>;
  /** A menu item with a check mark ("접기 영역 보기 ✓"). */
  checked?(ctx: CommandContext): boolean;
};

/** The command list (03-editor 6). */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- a contract the shell implements (coding guide 4)
export interface CommandRegistry {
  /** Every command, with the keys of the key table filled in. */
  list(): ReadonlyArray<CommandSpec>;
  /** Runs a command. If it does not apply, the reason goes to the status bar. */
  run(id: string, args?: unknown): void;
  /** Adds a shell's command (new, open, recent files). The returned function removes it. */
  register(spec: CommandSpec): () => void;
  /** "Applies now" may have changed (the shell redraws its menus). */
  onChange(listener: () => void): () => void;
  /** The context to evaluate `when`, `title` and `checked` with now. */
  context(): CommandContext;
}

/** One user or document setting (03-editor 6, UX W5). */
export type SettingSpec = {
  readonly id: string;
  readonly title: Message;
  /** Addition: a faint line under the title that says what the setting changes. */
  readonly hint?: Message;
  /** The allowed values. A boolean setting lists `[true, false]`. */
  readonly values: ReadonlyArray<string | number | boolean>;
  /** A screen name per allowed value, in the same order. */
  readonly valueTitles?: ReadonlyArray<Message>;
  readonly defaultValue: string | number | boolean;
  /** `user`: the preferences (`SettingsStore`); `document`: the model's settings. */
  readonly scope: 'user' | 'document';
};

/** The settings the editor knows (03-editor 6). */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- a contract the shell implements (coding guide 4)
export interface SettingsSchema {
  list(): ReadonlyArray<SettingSpec>;
}

/** The document's state for the shell (03-editor 6.2). */
export type DocStatus = {
  readonly name: string;
  readonly dirty: boolean;
  readonly readOnly: boolean;
  /** Grows by one whenever the content or the view state changes. */
  readonly revision: number;
};

/** A short message in the status bar (03-editor 3: "막지 않고 알린다"). */
export type Notice = {
  readonly id: number;
  readonly message: Message;
  readonly level: 'info' | 'warn';
};

/** A question in the status bar with buttons (If ↔ Case, UX MD3). */
export type Question = {
  readonly id: number;
  readonly message: Message;
  readonly choices: ReadonlyArray<{
    readonly title: Message;
    readonly isDefault?: boolean;
    choose(): void;
  }>;
  /** The user dismissed it (Esc, or another key). */
  dismiss(): void;
};

/** What the status bar and the key hint show, besides `DocStatus`. */
export type ChromeState = {
  /** What is selected ("If block", "3 blocks"); `null` when nothing is. */
  readonly selection: Message | null;
  readonly notice: Notice | null;
  readonly question: Question | null;
  /** The first key of a two-key sequence waiting for the second (`'d'`), or `null`. */
  readonly pendingKeys: string | null;
  /** `editing` while the inline editor is open, `visual` while selecting a range. */
  readonly mode: 'normal' | 'editing' | 'visual';
  /** The key hint is due: 0.4 s passed since the first key (UX K1) and the setting is on. */
  readonly isKeyHintShown: boolean;
  /** The title of the waiting key's group ("Insert after"), for the key hint. */
  readonly keyHintTitle: Message | null;
  /** The zoom, 0.4 ~ 3. */
  readonly zoom: number;
  /** A dialog a shell asked for (`confirm`, `prompt`), or `null`. The UI shows it as a modal. */
  readonly dialog: Dialog | null;
  /**
   * Addition: a list to choose one item from, such as the Methods a call block can call
   * (interaction rules "호출 블록"), or `null`. The UI shows it like a context menu.
   */
  readonly picker: Picker | null;
};

/**
 * A list the editor asks the user to choose from (addition to 03-editor 6). `j` `k` and the
 * arrow keys move, Enter or a digit chooses, Esc closes (03-keymap, UX K2).
 */
export type Picker = {
  readonly id: number;
  /** What is chosen ("Method to call"). */
  readonly title: Message;
  readonly items: ReadonlyArray<PickerItem>;
  /** Where the list opens, in page (client) coordinates. */
  readonly x: number;
  readonly y: number;
  /** The item that starts active, such as the Method a call block calls now. */
  readonly active: number;
  /** The user's answer: the index of the chosen item, or `null` when the list was closed. */
  choose(index: number | null): void;
};

/** One item of a `Picker`. */
export type PickerItem = {
  readonly title: Message;
  /** The title is the user's own text (a header), shown as it is, never looked up. */
  readonly isLiteral: boolean;
};

/**
 * A modal question from a shell ("Restore last time's changes?", "File name to download:").
 * Addition to 03-editor 6: the shell asks through the editor's UI instead of `window.confirm`.
 */
export type Dialog = {
  readonly id: number;
  readonly message: Message;
  /** `null` for a yes/no question; otherwise a text box that starts with this value. */
  readonly input: string | null;
  readonly confirm: Message;
  readonly cancel: Message;
  /** The user's answer: the text (or `''` for a yes/no question), or `null` when cancelled. */
  answer(value: string | null): void;
};

/** Where the context menu opens, in page (client) coordinates. */
export type ContextMenuRequest = { readonly x: number; readonly y: number };

/** The block kinds of the toolbar's block icons. */
export type ToolbarBlockKind = 'process' | 'if' | 'case' | 'while' | 'for' | 'doWhile';

/** The editor as the shell sees it (03-editor 6). */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- a contract the shell implements (coding guide 4)
export interface EditorHandle {
  readonly commands: CommandRegistry;
  readonly settingsSchema: SettingsSchema;
  /** Shows another document. Undo and the selection are emptied. `false`: it could not be opened. */
  open(doc: OpenedDocument): boolean;
  status(): DocStatus;
  onStatus(listener: (status: DocStatus) => void): () => void;
  /** The whole editor state, for the UI. Called again after every `onChange`. */
  state(): EditorState;
  /** The state changed (selection, document, zoom, editing …). */
  onChange(listener: (state: EditorState) => void): () => void;
  chromeState(): ChromeState;
  onChromeState(listener: () => void): () => void;
  /** The `.ns.svg` text of the document (saving, auto-save). Makes the subset font. */
  serialize(): Promise<string>;
  /** The model JSON of the document (local backup). No font, so it is light. */
  snapshot(): string;
  /** "Save": serialize → `store.write` → on success the document is no longer dirty. */
  save(): Promise<WriteResult>;
  setReadOnly(readOnly: boolean): void;
  setAppearance(appearance: Appearance): void;
  /** The value of a document setting (`scope: 'document'`). */
  documentSetting(id: string): unknown;
  /** Changes a document setting; undoable when it is part of the content (UX W5). */
  setDocumentSetting(id: string, value: unknown): void;
  /**
   * Starts dragging a new block from a toolbar icon (R-EDIT-09). Call it once the pointer has
   * moved past 4 px; the editor follows the pointer, shows the drop place and runs the insert or
   * wrap on release. Esc cancels.
   */
  startBlockDrag(kind: ToolbarBlockKind, event: PointerEvent): void;
  /** Gives the keyboard focus to the diagram (after a dialog closes). */
  focus(): void;
  /**
   * Addition: shows a shell's message in the status bar (06-web 7: the status bar is the one
   * place for notices). `warn` stays until the next notice or until closed.
   */
  notify(message: Message, level?: Notice['level']): void;
  /** Addition: asks a yes/no question in a modal. Resolves `true` for the confirm button. */
  confirm(
    message: Message,
    buttons?: { readonly confirm?: Message; readonly cancel?: Message },
  ): Promise<boolean>;
  /** Addition: asks for a text in a modal. Resolves `null` when cancelled. */
  prompt(message: Message, value: string): Promise<string | null>;
  /** Addition: the diagram asks for the context menu (right click, Shift+F10). */
  onContextMenu(listener: (request: ContextMenuRequest) => void): () => void;
  /**
   * Addition: the page point where a popup for the keyboard appears: just under the selection's
   * left end, or near the canvas's top left corner when nothing is selected (the key hint, UX K3).
   * `top` is the selection's top edge, where a popup that does not fit below goes above.
   */
  popupAnchor(): { readonly x: number; readonly y: number; readonly top: number };
  dispose(): void;
}
