// Builders and a DOM-free editor for the engine tests. Not part of the public API.
import type { Arm, Block, Branch, Case, Content, Doc, Id, If, Seq } from '@ariadne-nsd/core';

import type { ClipboardData } from './clipboard/clip-format';
import { editorCommands } from './commands/editor-commands';
import type { EditorRegistry } from './commands/registry';
import { createRegistry } from './commands/registry';
import type { DocumentStore, PickerItem, SettingsStore, WriteResult } from './contracts';
import type { EditorMessage } from './i18n/messages';
import { keyBindings } from './input/keys';
import type { ClipboardPort, LoadOptions } from './session/session';
import { EditorSession } from './session/session';
import type { Selection } from './state/selection';

export const seq = (blocks: ReadonlyArray<Block>): Seq => ({ blocks, folds: [] });

export const proc = (id: Id, text = id): Block => ({ id, kind: 'process', text });

export const empty = (id: Id): Block => ({ id, kind: 'process', text: '' });

export const branch = (id: Id, blocks: ReadonlyArray<Block>, label?: string): Branch =>
  label === undefined ? { id, body: seq(blocks) } : { id, label, body: seq(blocks) };

export const ifBlock = (id: Id, yes: Branch, no: Branch, text = 'c'): If => ({
  id,
  kind: 'if',
  text,
  yes,
  no,
});

export const arm = (id: Id, label: string, blocks: ReadonlyArray<Block>): Arm => ({
  id,
  label,
  body: seq(blocks),
});

export const caseBlock = (
  id: Id,
  arms: ReadonlyArray<Arm>,
  otherwise: Branch | null,
  text = 'k',
): Case => ({ id, kind: 'case', text, arms, otherwise });

export const whileBlock = (id: Id, blocks: ReadonlyArray<Block>, text = 'w'): Block => ({
  id,
  kind: 'while',
  text,
  body: seq(blocks),
});

/** A content of headerless diagrams `d1`, `d2` … with these bodies. */
export const contentOf = (...bodies: ReadonlyArray<ReadonlyArray<Block>>): Content => ({
  settings: { textKind: 'plain', theme: 'default', headStyle: 'title' },
  diagrams: bodies.map((body, i) => ({ id: `d${String(i + 1)}`, head: null, body: seq(body) })),
});

export const docOf = (content: Content): Doc => ({
  content,
  view: { folded: [], opened: [], bands: true, resultSymbol: '←' },
});

/** A clipboard in memory. */
export function memoryClipboard(): ClipboardPort & { data: ClipboardData } {
  const clipboard = {
    data: { text: null, json: null } as ClipboardData,
    write: (data: ClipboardData): Promise<'system'> => {
      clipboard.data = data;
      return Promise.resolve('system');
    },
    read: (): Promise<ClipboardData> => Promise.resolve(clipboard.data),
  };
  return clipboard;
}

/** Timers the test runs by hand. */
export function manualTimers(): {
  set: (callback: () => void, ms: number) => unknown;
  clear: (handle: unknown) => void;
  runAll: () => void;
} {
  const pending = new Map<number, () => void>();
  let next = 1;
  return {
    set: (callback) => {
      const id = next++;
      pending.set(id, callback);
      return id;
    },
    clear: (handle) => {
      pending.delete(handle as number);
    },
    runAll: () => {
      const callbacks = [...pending.values()];
      pending.clear();
      for (const callback of callbacks) {
        callback();
      }
    },
  };
}

/** A store that keeps what was written. */
export function memoryStore(
  name = 'test.ns.svg',
  canWriteInPlace = true,
): DocumentStore & {
  written: string[];
  result: WriteResult | null;
} {
  const store = {
    name,
    canWriteInPlace,
    written: [] as string[],
    result: null as WriteResult | null,
    read: () => Promise.resolve(store.written.at(-1) ?? ''),
    write: (svg: string): Promise<WriteResult> => {
      store.written.push(svg);
      return Promise.resolve(store.result ?? { ok: true, name: store.name });
    },
    writeAs: (svg: string, suggested: string): Promise<WriteResult> => {
      store.written.push(svg);
      store.name = suggested;
      return Promise.resolve(store.result ?? { ok: true, name: suggested });
    },
    readOther: () => Promise.resolve(null),
  };
  return store;
}

/** Settings in memory. */
export function memorySettings(values: Record<string, unknown> = {}): SettingsStore {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- the contract's shape
    get: <T>(key: string) => values[key] as T | undefined,
    set: (key, value) => {
      values[key] = value;
    },
    onChange: () => () => undefined,
  };
}

/** A list the engine asked to choose from, waiting for the test's answer. */
export type TestPicker = {
  readonly title: EditorMessage;
  readonly items: ReadonlyArray<PickerItem>;
  readonly active: number;
  /** Answers with an item's index, or `null` to close the list. */
  choose(index: number | null): void;
};

/** A session with the editor's commands, and no DOM. */
export type TestEngine = {
  /** The list waiting for an answer, or `null`. */
  readonly picker: () => TestPicker | null;
  readonly session: EditorSession;
  readonly registry: EditorRegistry;
  readonly clipboard: ReturnType<typeof memoryClipboard>;
  readonly timers: ReturnType<typeof manualTimers>;
  readonly logs: string[];
  /** The content at each save, in order. */
  readonly saves: Content[];
  /** Presses keys (strokes as in the key table). Returns whether each was used. */
  keys(...strokes: ReadonlyArray<string>): ReadonlyArray<boolean>;
  run(id: string, args?: unknown): void;
  select(selection: Selection | null): void;
  /** Lets pending promises (the clipboard) finish. */
  settle(): Promise<void>;
  content(): Content;
};

/** Makes a test engine on a content. */
export function testEngine(content: Content, load: Partial<LoadOptions> = {}): TestEngine {
  const clipboard = memoryClipboard();
  const timers = manualTimers();
  const logs: string[] = [];
  const saves: Content[] = [];
  const store = memoryStore();
  const settings = memorySettings();
  let picker: TestPicker | null = null;
  const session = new EditorSession(
    docOf(content),
    {
      locale: () => 'en',
      clipboard,
      timers,
      isKeyHintEnabled: () => true,
      log: (text) => {
        logs.push(text);
      },
      keyBindings,
    },
    { kept: {}, selection: null, isDirty: false, readOnly: false, ...load },
  );
  const registry = createRegistry({
    context: () => ({ state: session.state, store, settings }),
    keyBindings,
    refuse: (reason) => {
      session.notifyMessage(reason, 'warn');
    },
    beforeRun: () => undefined,
    onError: (error) => {
      throw error;
    },
  });
  session.runCommand = (id, args) => {
    registry.run(id, args);
  };
  for (const spec of editorCommands({
    session,
    clipboard,
    locale: () => 'en',
    save: () => {
      saves.push(session.state.doc.content);
      return Promise.resolve({ ok: true, name: 'test.ns.svg' });
    },
    saveAs: () => Promise.resolve({ ok: true, name: 'test.ns.svg' }),
    zoomTo: (zoom) => {
      session.setZoom(zoom);
    },
    pick: (title, items, active) =>
      new Promise((resolve) => {
        picker = {
          title,
          items,
          active,
          choose: (index) => {
            picker = null;
            resolve(index);
          },
        };
      }),
  })) {
    registry.register(spec);
  }
  return {
    picker: () => picker,
    session,
    registry,
    clipboard,
    timers,
    logs,
    saves,
    keys: (...strokes) => strokes.map((stroke) => session.handleKey(stroke)),
    run: (id, args) => {
      registry.run(id, args);
    },
    select: (selection) => {
      session.select(selection);
    },
    settle: async () => {
      for (let i = 0; i < 5; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    },
    content: () => session.state.doc.content,
  };
}
