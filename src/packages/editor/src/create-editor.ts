// Making an editor (03-editor 6): the shell calls `createEditor` and gets an `EditorHandle`.
import type { Doc, KeptSettings, Locale, PhaseTimer } from '@ariadne-nsd/core';
import {
  createDoc,
  isLocaleLoaded,
  loadLocale,
  resultSymbols,
  screenLocale,
  setSettings,
} from '@ariadne-nsd/core';

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
  PastedDocumentPort,
  Picker,
  PickerItem,
  ReadOnlyReason,
  SaveFonts,
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
import { cachedFonts, serializeDocument, serializeImage, snapshotDocument } from './save/serialize';
import type { ClipboardPort, Timers } from './session/session';
import { EditorSession } from './session/session';
import type { NewDocumentDefaults } from './read-document';
import { readDocument } from './read-document';
import {
  changedSettings,
  documentSettingIds,
  rememberedHeadStyle,
  settingIds,
  specsWithScreenLocale,
} from './settings';

export { settingIds, documentSettingIds, settingSpecs, rememberedHeadStyle } from './settings';
export type { NewDocumentDefaults, ReadDocument } from './read-document';
export { readDocument } from './read-document';

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
  /**
   * Addition: the shell that opens a document pasted as text (R-WEB-11, UX JP1 · JP2). Absent:
   * pasted text always becomes blocks.
   */
  readonly pastedDocument?: PastedDocumentPort;
  /** Addition: unexpected errors, for the problem report (R-REP-01). Default: nowhere. */
  readonly log?: (text: string, detail?: unknown) => void;
  /**
   * Addition: times the parts of an edit (the check mode `?perf` splits QA-07 into segments,
   * 06-web 9). Default: untimed.
   */
  readonly time?: PhaseTimer;
};

/** The product name, the title of the modal for a pasted document (UX JP2, as UX LG6). */
const productName = 'AriadneNSD';

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
  // The same rule as the shell's (core `screenLocale`), so the menus and the shell agree.
  const chosenLocale = (): Locale => screenLocale(settings.get(settingIds.locale), options.locale);
  // The screen shows a language once its strings are fetched (core `lazyCatalog`): until then the
  // one before, so a change of language never shows a screen with strings missing or in English.
  let shownLocale = chosenLocale();
  const locale = (): Locale => shownLocale;
  const showChosenLocale = (): void => {
    const wanted = chosenLocale();
    const show = (): void => {
      if (wanted === chosenLocale() && wanted !== shownLocale) {
        shownLocale = wanted;
        session.rerender();
      }
    };
    loadLocale(wanted).then(show, (error: unknown) => {
      // Offline: the strings that came show, the rest stay English, but the choice takes effect.
      log('Fetching the screen language failed', error);
      show();
    });
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
      ...(options.time === undefined ? {} : { time: options.time }),
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
  } else if (first.isDrawingEdited) {
    session.notify({ key: 'notice.drawingEdited', params: { name: store.name } }, 'warn');
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
    time: session.time,
  });
  session.runCommand = (id, args) => {
    registry.run(id, args);
  };

  // Status for the shell (03-editor 6.2).
  let readOnlyReason: ReadOnlyReason | undefined = options.doc.readOnlyReason;
  const status = (): DocStatus => ({
    name: store.name,
    dirty: session.state.dirty,
    readOnly: session.state.readOnly,
    ...(session.state.readOnly && readOnlyReason !== undefined ? { readOnlyReason } : {}),
    revision: session.state.revision,
    place: store.place ?? 'file',
  });
  const statusListeners = new Set<(s: DocStatus) => void>();
  let lastStatus = status();
  const emitStatus = (): void => {
    const next = status();
    if (
      next.name !== lastStatus.name ||
      next.dirty !== lastStatus.dirty ||
      next.readOnly !== lastStatus.readOnly ||
      next.readOnlyReason !== lastStatus.readOnlyReason ||
      next.revision !== lastStatus.revision ||
      next.place !== lastStatus.place
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
  /** The answer of a dialog: the text (`''` for a question), the third button, or cancelled. */
  type Answer = { readonly text: string } | 'other' | 'second' | null;
  const ask = (
    message: Message,
    input: string | null,
    buttons: {
      readonly confirm?: Message;
      readonly other?: Message;
      readonly second?: Message;
      readonly cancel?: Message;
      readonly title?: Message;
      readonly isMultiline?: boolean;
    },
  ): Promise<Answer> => {
    dialog?.answer(null);
    return new Promise((resolve) => {
      const id = nextDialogId++;
      const close = (answer: Answer): void => {
        if (dialog?.id !== id) {
          return;
        }
        dialog = null;
        emitChrome();
        view?.focus();
        resolve(answer);
      };
      dialog = {
        id,
        message,
        input,
        confirm: buttons.confirm ?? 'choice.ok',
        cancel: buttons.cancel ?? 'choice.cancel',
        other: buttons.other ?? null,
        ...(buttons.title === undefined ? {} : { title: buttons.title }),
        ...(buttons.isMultiline === true ? { isMultiline: true } : {}),
        answer: (value) => {
          close(value === null ? null : { text: value });
        },
        answerOther: () => {
          close('other');
        },
        ...(buttons.second === undefined
          ? {}
          : {
              second: buttons.second,
              answerSecond: () => {
                close('second');
              },
            }),
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
  const saveSource = (): { doc: Doc; kept: KeptSettings; rendering: typeof session.rendering } => ({
    doc: session.state.doc,
    kept: session.kept,
    rendering: session.rendering,
  });
  const serialize = async (): Promise<{ readonly svg: string; readonly doc: Doc }> => {
    const source = saveSource();
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
        if (result.message === undefined) {
          session.notify('notice.saveFailed', 'warn');
        } else {
          session.notifyMessage(result.message, 'warn');
        }
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
    ...(options.pastedDocument === undefined
      ? {}
      : {
          pastedDocument: options.pastedDocument,
          // UX JP2: "Open as New Document" is the default.
          askPastedDocument: async () => {
            const answer = await ask('question.pastedDocument', null, {
              confirm: 'choice.openAsNew',
              second: 'choice.pasteAsText',
              title: productName,
            });
            return answer === null ? 'cancel' : answer === 'second' ? 'text' : 'open';
          },
        }),
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
    if (key === settingIds.locale) {
      showChosenLocale();
    } else if (key === settingIds.focusOutline) {
      session.rerender();
    }
  });
  if (!isLocaleLoaded(shownLocale)) {
    // The host did not fetch the strings first: English until they come, then the screen redraws.
    loadLocale(shownLocale).then(
      () => {
        session.rerender();
      },
      (error: unknown) => {
        log('Fetching the screen language failed', error);
      },
    );
  }

  // Not chosen yet, the screen language shows the one in use (the browser's), not English: a
  // Korean browser shows 한국어, and choosing English is then a change.
  const settingsSchema: SettingsSchema = {
    list: () => specsWithScreenLocale(screenLocale(undefined, options.locale)),
  };

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
      readOnlyReason = opened.readOnlyReason;
      session.load(read.doc, {
        kept: read.kept,
        selection: read.selection,
        isDirty: read.isDirty,
        readOnly: opened.readOnly ?? false,
      });
      if (read.isDrawingEdited) {
        // After `load`, which empties the status bar (R-FMT-09).
        session.notify({ key: 'notice.drawingEdited', params: { name: store.name } }, 'warn');
      }
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
    serializeImage: () => serializeImage(saveSource(), fonts),
    rendering: () => session.rendering,
    snapshot: () => snapshotDocument({ doc: session.state.doc, kept: session.kept }),
    save,
    setReadOnly: (readOnly, reason) => {
      readOnlyReason = readOnly ? reason : undefined;
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
        case documentSettingIds.textOutlines:
          return current.textOutlines === true;
        case documentSettingIds.resultSymbol:
          return session.state.doc.view.resultSymbol;
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
      if (id === documentSettingIds.resultSymbol) {
        const symbol = resultSymbols.find((item) => item === value);
        const shown = session.state.doc.view;
        if (symbol !== undefined && symbol !== shown.resultSymbol) {
          session.setView({ ...shown, resultSymbol: symbol });
        }
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
    confirm: async (value, buttons = {}) => {
      const answer = await ask(value, null, buttons);
      return answer !== null && typeof answer !== 'string';
    },
    choose: async (value, buttons) => {
      const answer = await ask(value, null, buttons);
      return answer === null ? 'cancel' : typeof answer === 'string' ? answer : 'confirm';
    },
    prompt: async (value, initial, promptOptions = {}) => {
      const answer = await ask(value, initial, promptOptions);
      return answer === null || typeof answer === 'string' ? null : answer.text;
    },
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
