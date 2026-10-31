// A small fake engine for the UI tests. It keeps the same contract as engine-api.ts.

import { render } from '@testing-library/react';

import { EditorApp } from './editor-app';
import type {
  ChromeState,
  CommandContext,
  CommandRegistry,
  CommandSpec,
  ContextMenuRequest,
  DocStatus,
  EditorHandle,
  SettingSpec,
  SettingsStore,
} from './engine-api';

type Listener = () => void;

// The fake registry's commands ignore their context; the context menu reads the selection.
const noContext = { state: { selection: { kind: 'blocks' } } } as unknown as CommandContext;

/** A command spec with defaults for the fields a test does not care about. */
export function spec(fields: Partial<CommandSpec> & Pick<CommandSpec, 'id'>): CommandSpec {
  return {
    title: 'command.edit.undo',
    keys: [],
    edits: true,
    when: () => true,
    run: () => undefined,
    ...fields,
  };
}

export type FakeEngine = {
  readonly handle: EditorHandle;
  /** The ids passed to `commands.run`, in order. */
  readonly ran: string[];
  readonly drags: string[];
  setStatus(status: Partial<DocStatus>): void;
  setChrome(state: Partial<ChromeState>): void;
  /** Tells the UI that "applies now" may have changed. */
  changeCommands(): void;
  /** The engine asks for the context menu (a right click on a block). */
  openContextMenu(request: ContextMenuRequest): void;
};

export function fakeEngine(
  specs: ReadonlyArray<CommandSpec>,
  settingSpecs: ReadonlyArray<SettingSpec> = [],
): FakeEngine {
  const registered = [...specs];
  const commandListeners = new Set<Listener>();
  const statusListeners = new Set<(status: DocStatus) => void>();
  const chromeListeners = new Set<Listener>();
  const documentSettings = new Map<string, unknown>();
  const ran: string[] = [];
  const drags: string[] = [];
  let status: DocStatus = { name: 'example.ns.svg', dirty: false, readOnly: false, revision: 0 };
  let chrome: ChromeState = {
    selection: null,
    notice: null,
    question: null,
    pendingKeys: null,
    mode: 'normal',
    isKeyHintShown: false,
    keyHintTitle: null,
    zoom: 1,
    dialog: null,
  };

  const contextMenuListeners = new Set<(request: ContextMenuRequest) => void>();

  const commands: CommandRegistry = {
    list: () => registered,
    run: (id) => {
      ran.push(id);
      const found = registered.find((command) => command.id === id);
      if (found?.when(noContext) === true) void found.run(noContext);
    },
    register: (added) => {
      registered.push(added);
      for (const listener of commandListeners) listener();
      return () => {
        registered.splice(registered.indexOf(added), 1);
        for (const listener of commandListeners) listener();
      };
    },
    onChange: (listener) => {
      commandListeners.add(listener);
      return () => commandListeners.delete(listener);
    },
    context: () => noContext,
  };

  const handle: EditorHandle = {
    commands,
    settingsSchema: { list: () => settingSpecs },
    status: () => status,
    onStatus: (listener) => {
      statusListeners.add(listener);
      return () => statusListeners.delete(listener);
    },
    chromeState: () => chrome,
    onChromeState: (listener) => {
      chromeListeners.add(listener);
      return () => chromeListeners.delete(listener);
    },
    documentSetting: (id) => documentSettings.get(id),
    setDocumentSetting: (id, value) => {
      documentSettings.set(id, value);
      status = { ...status, revision: status.revision + 1 };
      for (const listener of statusListeners) listener(status);
    },
    startBlockDrag: (kind) => {
      drags.push(kind);
    },
    focus: () => undefined,
    onContextMenu: (listener) => {
      contextMenuListeners.add(listener);
      return () => contextMenuListeners.delete(listener);
    },
  };

  return {
    handle,
    ran,
    drags,
    setStatus: (next) => {
      status = { ...status, ...next };
      for (const listener of statusListeners) listener(status);
    },
    setChrome: (next) => {
      chrome = { ...chrome, ...next };
      for (const listener of chromeListeners) listener();
    },
    openContextMenu: (request) => {
      for (const listener of contextMenuListeners) listener(request);
    },
    changeCommands: () => {
      for (const listener of commandListeners) listener();
    },
  };
}

/** A settings store in memory. */
export function memorySettings(initial: Readonly<Record<string, unknown>> = {}): SettingsStore {
  const values = new Map(Object.entries(initial));
  const listeners = new Set<(key: string) => void>();
  return {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- matches SettingsStore.get<T>
    get: <T,>(key: string) => values.get(key) as T | undefined,
    set: (key, value) => {
      values.set(key, value);
      for (const listener of listeners) listener(key);
    },
    onChange: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** Renders the whole UI around a fake engine. */
export function renderApp(
  engine: FakeEngine,
  options: { readonly locale?: 'en' | 'ko'; readonly settings?: SettingsStore } = {},
) {
  const canvas = document.createElement('div');
  canvas.dataset.testid = 'engine-canvas';
  canvas.tabIndex = 0;
  return render(
    <EditorApp
      handle={engine.handle}
      canvas={canvas}
      locale={options.locale ?? 'en'}
      appearance={{ scheme: 'light', uiFont: 'sans-serif' }}
      settings={options.settings ?? memorySettings()}
    />,
  );
}
