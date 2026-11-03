// Making an editor (03-editor 6): the shell calls `createEditor` and gets an `EditorHandle`.
import type { Doc, KeptSettings, Locale, Settings } from '@ariadne-nsd/core';
import { createDoc, locales, openSvgFile, parseModelJson, setSettings } from '@ariadne-nsd/core';

import { editorCommands } from './commands/editor-commands';
import { createRegistry } from './commands/registry';
import type {
  Appearance,
  ChromeState,
  CommandContext,
  ContextMenuRequest,
  Dialog,
  DocStatus,
  DocumentStore,
  EditorHandle,
  OpenedDocument,
  Picker,
  PickerItem,
  SaveFonts,
  SettingSpec,
  SettingsSchema,
  SettingsStore,
  ToolbarBlockKind,
  WriteResult,
} from './contracts';
import { CanvasView } from './dom/canvas-view';
import { installStyles } from './dom/styles';
import { createSystemClipboard } from './dom/system-clipboard';
import type { EditorMessage, Message } from './i18n/messages';
import { formatMessage } from './i18n/messages';
import { keyBindings } from './input/keys';
import { indexDoc } from './model/doc-index';
import { cachedFonts, serializeDocument, snapshotDocument } from './save/serialize';
import type { ClipboardPort, Timers } from './session/session';
import { EditorSession } from './session/session';
import type { Selection } from './state/selection';
import { selectBlock } from './state/selection';

/** What `createEditor` takes (03-editor 6, with the additions marked). */
export type EditorOptions = {
  /** Where the editor draws. The editor fills it. */
  readonly host: HTMLElement;
  readonly settings: SettingsStore;
  readonly appearance: Appearance;
  /** The document to show first. */
  readonly doc: OpenedDocument;
  /** Addition: the subsetter and the TTF for saved files, loaded on the first save. */
  readonly fonts: SaveFonts;
  /** Addition: the screen language when the setting `ui.locale` is not set. Default English. */
  readonly locale?: Locale;
  /** Addition: the URL of the block font's WOFF2 for the screen (`@font-face`). */
  readonly screenFontUrl?: string;
  /** Addition: the clipboard; by default the system clipboard with a fallback in memory. */
  readonly clipboard?: ClipboardPort;
  /** Addition: unexpected errors, for the problem report (R-REP-01). Default: nowhere. */
  readonly log?: (text: string, detail?: unknown) => void;
};

/**
 * The setting ids the editor reads (03-editor 6, UX W5). `headStyle` is the header shape the
 * user chose last (UX HS1): the editor writes it when a document's header shape is changed, and
 * a new document starts with it. It is remembered, not shown in the preferences.
 */
export const settingIds = {
  locale: 'ui.locale',
  keyHint: 'editor.keyHint',
  focusOutline: 'editor.focusOutline',
  autoSave: 'file.autoSave',
  headStyle: 'editor.headStyle',
} as const;

/** The document setting ids (scope `document`): the model's `settings` (UX W5). */
export const documentSettingIds = {
  headStyle: 'document.headStyle',
  locale: 'document.locale',
  textKind: 'document.textKind',
  theme: 'document.theme',
} as const;

/** The settings the editor knows. `file.autoSave` is used by the web shell. */
export const settingSpecs: ReadonlyArray<SettingSpec> = [
  {
    id: settingIds.locale,
    title: 'setting.uiLocale',
    values: locales,
    valueTitles: locales.map((locale) => `setting.uiLocale.${locale}` as const),
    defaultValue: 'en',
    scope: 'user',
  },
  {
    id: settingIds.keyHint,
    title: 'setting.keyHint',
    values: [true, false],
    defaultValue: true,
    scope: 'user',
  },
  {
    id: settingIds.focusOutline,
    title: 'setting.focusOutline',
    values: [false, true],
    defaultValue: false,
    scope: 'user',
  },
  {
    id: settingIds.autoSave,
    title: 'setting.autoSave',
    values: [true, false],
    defaultValue: true,
    scope: 'user',
  },
  {
    // After the block text's language (not shown in the MVP): the language of the drawn words.
    id: documentSettingIds.locale,
    title: 'setting.documentLocale',
    hint: 'setting.documentLocale.hint',
    values: locales,
    valueTitles: locales.map((locale) => `setting.uiLocale.${locale}` as const),
    defaultValue: 'en',
    scope: 'document',
  },
  {
    id: documentSettingIds.headStyle,
    title: 'setting.headStyle',
    values: ['title', 'shape'],
    valueTitles: ['setting.headStyle.title', 'setting.headStyle.shape'],
    defaultValue: 'title',
    scope: 'document',
  },
];

/** The header shape a new document starts with: the one chosen last, or "title" (UX HS1). */
export function rememberedHeadStyle(settings: SettingsStore): Settings['headStyle'] {
  return settings.get<string>(settingIds.headStyle) === 'shape' ? 'shape' : 'title';
}

/** A document read from an `OpenedDocument`, or why it cannot be edited. */
export type ReadDocument =
  | {
      readonly ok: true;
      readonly doc: Doc;
      readonly kept: KeptSettings;
      readonly isDirty: boolean;
      readonly selection: Selection | null;
    }
  | { readonly ok: false; readonly message: EditorMessage; readonly detail: string };

/** What a new document starts with, and the drawing language of a file without one. */
export type NewDocumentDefaults = {
  /** The header shape chosen last (UX HS1). */
  readonly headStyle: Settings['headStyle'];
  /** The screen language of the one who opens or creates the document (ADR-0041). */
  readonly locale: Locale;
};

/**
 * Reads what to open: the local backup first (dirty), then a ready-made document (an example,
 * clean, nothing selected), a new document for `text: null` (its empty block selected, UX OP1)
 * with the header shape and drawing language of `defaults` (UX HS1, ADR-0041), otherwise the
 * file (nothing selected). A file without a drawing language opens in `defaults.locale`.
 */
export function readDocument(
  opened: OpenedDocument,
  defaults: NewDocumentDefaults = { headStyle: 'title', locale: 'en' },
): ReadDocument {
  const { locale } = defaults;
  if (opened.restored !== undefined) {
    const result = parseModelJson(opened.restored, { locale });
    return result.ok
      ? { ok: true, ...result.value, isDirty: true, selection: null }
      : { ok: false, message: openMessage(result.reason), detail: result.detail };
  }
  if (opened.doc !== undefined) {
    return { ok: true, doc: opened.doc, kept: {}, isDirty: false, selection: null };
  }
  if (opened.text === null) {
    const doc = createDoc(defaults);
    const first = doc.content.diagrams[0]?.body.blocks[0];
    return {
      ok: true,
      doc,
      kept: {},
      isDirty: false,
      selection: first === undefined ? null : selectBlock(indexDoc(doc.content), first.id),
    };
  }
  const result = openSvgFile(opened.text, { locale });
  return result.ok
    ? { ok: true, ...result.value, isDirty: false, selection: null }
    : { ok: false, message: openMessage(result.reason), detail: result.detail };
}

function openMessage(reason: 'noModel' | 'prototype' | 'damaged' | 'newerVersion'): EditorMessage {
  switch (reason) {
    case 'noModel':
      return 'notice.openNoModel';
    case 'prototype':
      return 'notice.openPrototype';
    case 'damaged':
      return 'notice.openDamaged';
    case 'newerVersion':
      return 'notice.openNewerVersion';
  }
}

const browserTimers: Timers = {
  set: (callback, milliseconds) => setTimeout(callback, milliseconds),
  clear: (handle) => {
    clearTimeout(handle as ReturnType<typeof setTimeout>);
  },
};

/**
 * Makes an editor in `host` and shows `doc` (03-editor 6). A file that cannot be opened is not
 * edited: the editor shows a new document, view only, so the original is never overwritten, and
 * says why in the status bar.
 */
export function createEditor(options: EditorOptions): EditorHandle {
  const { settings } = options;
  const log = options.log ?? (() => undefined);
  const locale = (): Locale => {
    const chosen = settings.get<string>(settingIds.locale);
    return chosen === 'ko' || chosen === 'en' ? chosen : (options.locale ?? 'en');
  };
  const clipboard = options.clipboard ?? createSystemClipboard(log);
  const fonts = cachedFonts(options.fonts);
  let store: DocumentStore = options.doc.store;

  const defaults = (): NewDocumentDefaults => ({
    headStyle: rememberedHeadStyle(settings),
    locale: locale(),
  });
  const first = readDocument(options.doc, defaults());
  const session = new EditorSession(
    first.ok ? first.doc : createDoc(defaults()),
    {
      clipboard,
      timers: browserTimers,
      isKeyHintEnabled: () => settings.get<boolean>(settingIds.keyHint) !== false,
      log,
      keyBindings,
    },
    first.ok
      ? {
          kept: first.kept,
          selection: first.selection,
          isDirty: first.isDirty,
          readOnly: options.doc.readOnly ?? false,
        }
      : { kept: {}, selection: null, isDirty: false, readOnly: true },
  );
  if (!first.ok) {
    log(`Could not open ${store.name}`, first.detail);
    session.notify(first.message, 'warn');
  }

  const context = (): CommandContext => ({ state: session.state, store, settings });
  let view: CanvasView | null = null;
  const registry = createRegistry({
    context,
    keyBindings,
    refuse: (reason) => {
      session.notifyMessage(reason, 'warn');
    },
    beforeRun: () => {
      if (session.state.editing !== null && view !== null) {
        session.commitEditing(view.editorText());
      }
    },
    onError: (error, id) => {
      log(`Command ${id} threw`, error);
      session.notify('notice.internalError', 'warn');
    },
  });
  session.runCommand = (id, args) => {
    registry.run(id, args);
  };

  // Status for the shell (03-editor 6.2).
  const status = (): DocStatus => ({
    name: store.name,
    dirty: session.state.dirty,
    readOnly: session.state.readOnly,
    revision: session.state.revision,
  });
  const statusListeners = new Set<(s: DocStatus) => void>();
  let lastStatus = status();
  const emitStatus = (): void => {
    const next = status();
    if (
      next.name !== lastStatus.name ||
      next.dirty !== lastStatus.dirty ||
      next.readOnly !== lastStatus.readOnly ||
      next.revision !== lastStatus.revision
    ) {
      lastStatus = next;
      for (const listener of [...statusListeners]) {
        listener(next);
      }
    }
  };
  const chromeListeners = new Set<() => void>();
  const changeListeners = new Set<(state: typeof session.state) => void>();
  const emitChrome = (): void => {
    for (const listener of [...chromeListeners]) {
      listener();
    }
  };
  session.subscribe((state) => {
    emitStatus();
    registry.changed();
    emitChrome();
    for (const listener of [...changeListeners]) {
      listener(state);
    }
  });

  // Dialogs a shell asks for (restore?, a file name). One at a time; a new one cancels the old.
  let dialog: Dialog | null = null;
  let nextDialogId = 1;
  const ask = (
    message: Message,
    input: string | null,
    buttons: { readonly confirm?: Message; readonly cancel?: Message },
  ): Promise<string | null> => {
    dialog?.answer(null);
    return new Promise((resolve) => {
      const id = nextDialogId++;
      dialog = {
        id,
        message,
        input,
        confirm: buttons.confirm ?? 'choice.ok',
        cancel: buttons.cancel ?? 'choice.cancel',
        answer: (value) => {
          if (dialog?.id !== id) {
            return;
          }
          dialog = null;
          emitChrome();
          view?.focus();
          resolve(value);
        },
      };
      emitChrome();
    });
  };
  const contextMenuListeners = new Set<(request: ContextMenuRequest) => void>();

  // A list to choose from (the Method to call). One at a time; a new one closes the old.
  let picker: Picker | null = null;
  let nextPickerId = 1;
  const pick = (
    title: EditorMessage,
    items: ReadonlyArray<PickerItem>,
    active: number,
  ): Promise<number | null> => {
    picker?.choose(null);
    const at = handle.popupAnchor();
    return new Promise((resolve) => {
      const id = nextPickerId++;
      picker = {
        id,
        title,
        items,
        x: at.x,
        y: at.y,
        active,
        choose: (index) => {
          if (picker?.id !== id) {
            return;
          }
          picker = null;
          emitChrome();
          view?.focus();
          resolve(index !== null && index >= 0 && index < items.length ? index : null);
        },
      };
      emitChrome();
    });
  };

  // Saving (03-editor 6, 6.3).
  const serialize = async (): Promise<{ readonly svg: string; readonly doc: Doc }> => {
    const source = { doc: session.state.doc, kept: session.kept, rendering: session.rendering };
    return { svg: await serializeDocument(source, fonts), doc: source.doc };
  };
  const tellWrite = (result: WriteResult, isQuiet: boolean): void => {
    if (result.ok) {
      if (!isQuiet) {
        session.notify({ key: 'notice.saved', params: { name: result.name } });
      }
      return;
    }
    switch (result.reason) {
      case 'cancelled':
        return;
      case 'denied':
        session.notify('notice.saveDenied', 'warn');
        return;
      case 'failed':
        log('Saving failed', result.detail);
        session.notify('notice.saveFailed', 'warn');
        return;
    }
  };
  const save = async (): Promise<WriteResult> => {
    if (session.state.readOnly) {
      return { ok: false, reason: 'denied', detail: 'view only' };
    }
    const saved = await serialize();
    const result = await store.write(saved.svg);
    if (result.ok) {
      session.markSaved(saved.doc);
    }
    tellWrite(result, true);
    emitStatus();
    return result;
  };
  const saveAs = async (): Promise<WriteResult> => {
    const saved = await serialize();
    const result = await store.writeAs(saved.svg, store.name);
    if (result.ok && !session.state.readOnly) {
      session.markSaved(saved.doc);
    }
    tellWrite(result, false);
    emitStatus();
    return result;
  };

  for (const spec of editorCommands({
    session,
    clipboard,
    save,
    saveAs,
    zoomTo: (zoom) => {
      view?.zoomTo(zoom);
    },
    pick,
  })) {
    registry.register(spec);
  }

  installStyles(options.host.ownerDocument, options.screenFontUrl ?? null);
  view = new CanvasView({
    host: options.host,
    session,
    run: (id, args) => {
      registry.run(id, args);
    },
    contextMenu: (request) => {
      for (const listener of [...contextMenuListeners]) {
        listener(request);
      }
    },
    locale,
    appearance: options.appearance,
    isFocusOutlineKept: () => settings.get<boolean>(settingIds.focusOutline) === true,
  });

  const stopSettings = settings.onChange((key) => {
    if (key === settingIds.locale || key === settingIds.focusOutline) {
      session.rerender();
    }
  });

  const settingsSchema: SettingsSchema = { list: () => settingSpecs };

  const handle: EditorHandle = {
    commands: registry,
    settingsSchema,
    open: (opened) => {
      picker?.choose(null);
      const read = readDocument(opened, defaults());
      if (!read.ok) {
        log(`Could not open ${opened.store.name}`, read.detail);
        session.notify(read.message, 'warn');
        return false;
      }
      store = opened.store;
      session.load(read.doc, {
        kept: read.kept,
        selection: read.selection,
        isDirty: read.isDirty,
        readOnly: opened.readOnly ?? false,
      });
      emitStatus();
      return true;
    },
    status,
    onStatus: (listener) => {
      statusListeners.add(listener);
      return () => {
        statusListeners.delete(listener);
      };
    },
    state: () => session.state,
    onChange: (listener) => {
      changeListeners.add(listener);
      return () => {
        changeListeners.delete(listener);
      };
    },
    chromeState: (): ChromeState => ({ ...session.chrome(), dialog, picker }),
    onChromeState: (listener) => {
      chromeListeners.add(listener);
      return () => {
        chromeListeners.delete(listener);
      };
    },
    serialize: async () => (await serialize()).svg,
    snapshot: () => snapshotDocument({ doc: session.state.doc, kept: session.kept }),
    save,
    setReadOnly: (readOnly) => {
      session.setReadOnly(readOnly);
      emitStatus();
    },
    setAppearance: (appearance) => {
      view?.setAppearance(appearance);
    },
    documentSetting: (id) => {
      const current = session.state.doc.content.settings;
      switch (id) {
        case documentSettingIds.headStyle:
          return current.headStyle;
        case documentSettingIds.locale:
          return current.locale;
        case documentSettingIds.textKind:
          return current.textKind;
        case documentSettingIds.theme:
          return current.theme;
        default:
          return undefined;
      }
    },
    setDocumentSetting: (id, value) => {
      const content = session.state.doc.content;
      const next = changedSettings(content.settings, id, value);
      if (session.state.readOnly) {
        session.notify('reason.readOnly', 'warn');
        return;
      }
      if (next === null) {
        return;
      }
      // Document settings are content: undoable (UX W5, Q9).
      const isApplied = session.commit(setSettings(content, next), () => ({
        selection: session.state.selection,
      }));
      if (isApplied && id === documentSettingIds.headStyle) {
        // The shape chosen last is the one new documents start with (UX HS1).
        settings.set(settingIds.headStyle, next.headStyle);
      }
    },
    startBlockDrag: (kind: ToolbarBlockKind, event: PointerEvent) => {
      view?.startNewBlockDrag(
        { kind: 'new', blockKind: kind },
        formatMessage(locale(), `command.block.insert.${kind}`),
        event,
      );
    },
    focus: () => {
      view?.focus();
    },
    notify: (value, level = 'info') => {
      session.notifyMessage(value, level);
    },
    confirm: async (value, buttons = {}) => (await ask(value, null, buttons)) !== null,
    prompt: (value, initial) => ask(value, initial, {}),
    popupAnchor: () => {
      const at = view?.selectionAnchor() ?? view?.canvasAnchor() ?? { x: 0, y: 0 };
      return { ...at, top: view?.selectionTop() ?? at.y };
    },
    onContextMenu: (listener) => {
      contextMenuListeners.add(listener);
      return () => {
        contextMenuListeners.delete(listener);
      };
    },
    dispose: () => {
      dialog?.answer(null);
      picker?.choose(null);
      contextMenuListeners.clear();
      stopSettings();
      view?.dispose();
      view = null;
      session.dispose();
      statusListeners.clear();
      chromeListeners.clear();
      changeListeners.clear();
    },
  };
  return handle;
}

/** The settings with one document setting changed, or `null` if the value is not allowed. */
function changedSettings(settings: Settings, id: string, value: unknown): Settings | null {
  switch (id) {
    case documentSettingIds.headStyle:
      return value === 'shape' || value === 'title' ? { ...settings, headStyle: value } : null;
    case documentSettingIds.locale: {
      const chosen = locales.find((locale) => locale === value);
      return chosen === undefined ? null : { ...settings, locale: chosen };
    }
    case documentSettingIds.theme:
      return value === 'default' ? { ...settings, theme: value } : null;
    case documentSettingIds.textKind:
      return value === 'plain' ? { ...settings, textKind: value } : null;
    default:
      return null;
  }
}
