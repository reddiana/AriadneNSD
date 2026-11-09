// The measuring of the check mode (`?perf`, 06-web 9, AT-05): opens the large document in the
// real editor and times common commands at its start, middle and end. A time is what T-0007
// measures: from the key event to the frame after the document layer changed (03-editor 1.2):
// `performance.now()` before the key, then two animation frames (the editor draws in the first).

import type { DocumentStore, EditorHandle } from '@ariadne-nsd/editor';

import { largeDocumentBlockId, largeDocumentFile } from './large-document';
import type { PerfCommandId } from './perf-report';
import { perfCommandIds } from './perf-report';

/** How much to measure. */
export type PerfPlan = {
  /** Blocks in the document (QA-07: 500). At least 4. */
  readonly blocks: number;
  /** Measured runs of each command at each of the three places. */
  readonly rounds: number;
  /** Runs before those at each place, left out (the browser compiles and warms its caches). */
  readonly warmup: number;
};

/** 500 blocks, 3 places × 10 runs = 30 times per command, 2 warm-up runs per place. */
export const defaultPerfPlan: PerfPlan = { blocks: 500, rounds: 10, warmup: 2 };

/**
 * The plan of a measuring from the page address: `?perf` alone is the plan of AT-05. For the
 * browser tests, `&rounds=` (1 ~ 100) changes the runs per place and `&blocks=` (4 ~ 2000) the
 * size of the document, so a test that only checks the page can be short and light.
 */
export function perfPlanFrom(search: string): PerfPlan {
  const parameters = new URLSearchParams(search);
  const number = (name: string, min: number, max: number, fallback: number): number => {
    const value = Number(parameters.get(name));
    return Number.isInteger(value) && value >= min && value <= max ? value : fallback;
  };
  return {
    ...defaultPerfPlan,
    rounds: number('rounds', 1, 100, defaultPerfPlan.rounds),
    blocks: number('blocks', 4, 2000, defaultPerfPlan.blocks),
  };
}

/** The blocks the commands run on: near the start, the middle and near the end (1-based). */
export function perfPlaces(blocks: number): ReadonlyArray<number> {
  return [2, Math.ceil(blocks / 2), blocks - 1];
}

/** How far the measuring has got. */
export type PerfProgress = {
  readonly command: PerfCommandId | null;
  readonly done: number;
  readonly total: number;
};

/** The editor to measure, the element it draws in, and the store of the measured document. */
export type PerfTarget = {
  readonly handle: EditorHandle;
  readonly host: HTMLElement;
  readonly store: DocumentStore;
};

/** The parts of a key event the editor reads (`strokeOf`). */
type Key = {
  readonly code: string;
  readonly key: string;
  readonly shiftKey?: boolean;
  readonly altKey?: boolean;
};

const keys = {
  o: { code: 'KeyO', key: 'o' },
  x: { code: 'KeyX', key: 'x' },
  u: { code: 'KeyU', key: 'u' },
  redo: { code: 'KeyU', key: 'U', shiftKey: true },
  s: { code: 'KeyS', key: 's' },
  i: { code: 'KeyI', key: 'i' },
  moveDown: { code: 'KeyJ', key: 'j', altKey: true },
  y: { code: 'KeyY', key: 'y' },
  p: { code: 'KeyP', key: 'p' },
  enter: { code: 'Enter', key: 'Enter' },
} as const satisfies Record<string, Key>;

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

async function frames(count: number): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    await nextFrame();
  }
}

function press(target: HTMLElement, key: Key): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { ...key, bubbles: true, cancelable: true }));
}

/**
 * Times the commands. Each run starts from the same document with the same block selected:
 * what a run changed is undone (or, failing that, the document opened again) before the next.
 * Resolves the measured times (ms) of each command; rejects when a command did not change the
 * drawing, which would make its time meaningless.
 */
export async function measureEdits(
  target: PerfTarget,
  plan: PerfPlan,
  onProgress: (progress: PerfProgress) => void,
): Promise<ReadonlyMap<PerfCommandId, ReadonlyArray<number>>> {
  const { handle, host, store } = target;
  const text = largeDocumentFile(plan.blocks);
  const places = perfPlaces(plan.blocks);
  const total = places.length * perfCommandIds.length * (plan.warmup + plan.rounds);
  const samples = new Map<PerfCommandId, number[]>(perfCommandIds.map((id) => [id, []]));

  const find = (selector: string): HTMLElement => {
    const element = host.querySelector<HTMLElement>(selector);
    if (element === null) {
      throw new Error(`The editor has no ${selector}`);
    }
    return element;
  };
  const canvas = (): HTMLElement => find('.ans-canvas[tabindex]');
  const inlineEditor = (): HTMLTextAreaElement => {
    const element = find('.ans-inline-editor');
    if (!(element instanceof HTMLTextAreaElement)) {
      throw new Error('The inline editor is not a text area');
    }
    return element;
  };

  const open = async (): Promise<string> => {
    if (!handle.open({ store, text })) {
      throw new Error('The editor could not open the large document');
    }
    await frames(2);
    return handle.snapshot();
  };
  const selectedBlock = (): string | null => {
    const selection = handle.state().selection;
    return selection?.kind === 'blocks' && selection.anchor === selection.focus
      ? selection.focus
      : null;
  };
  const select = (place: number): void => {
    const id = largeDocumentBlockId(place);
    handle.commands.run(place <= plan.blocks / 2 ? 'select.first' : 'select.last');
    for (let step = 0; step <= plan.blocks && selectedBlock() !== id; step += 1) {
      const current = Number(/^b(\d+)$/.exec(selectedBlock() ?? '')?.[1] ?? 0);
      handle.commands.run(current < place ? 'select.down' : 'select.up');
    }
    if (selectedBlock() !== id) {
      throw new Error(`Could not select block ${id}`);
    }
  };
  let baseline = await open();
  /** Back to the measured document with `place` selected and the keys on the canvas. */
  const restore = async (place: number): Promise<void> => {
    const editing = host.querySelector<HTMLTextAreaElement>('.ans-inline-editor');
    if (editing !== null && document.activeElement === editing) {
      editing.blur();
    }
    for (let undo = 0; undo < 3 && handle.snapshot() !== baseline; undo += 1) {
      handle.commands.run('edit.undo');
    }
    if (handle.snapshot() !== baseline) {
      baseline = await open();
    }
    if (selectedBlock() !== largeDocumentBlockId(place)) {
      select(place);
    }
    handle.focus();
    await frames(2);
  };
  /** Presses a key that prepares a command without timing it. */
  const prepare = async (key: Key, on: HTMLElement = canvas()): Promise<void> => {
    press(on, key);
    await frames(2);
  };
  /** Presses the key of the command and times it. */
  const timed = async (
    command: PerfCommandId,
    key: Key,
    on: HTMLElement = canvas(),
  ): Promise<number> => {
    let isChanged = false;
    const observer = new MutationObserver(() => {
      isChanged = true;
    });
    observer.observe(find('.ans-document'), {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    });
    const start = performance.now();
    press(on, key);
    await frames(2);
    const elapsed = performance.now() - start;
    isChanged ||= observer.takeRecords().length > 0;
    observer.disconnect();
    if (!isChanged) {
      throw new Error(`“${command}” did not change the drawing`);
    }
    return elapsed;
  };
  const run = async (command: PerfCommandId): Promise<number> => {
    switch (command) {
      case 'insert':
        return timed(command, keys.o);
      case 'delete':
        return timed(command, keys.x);
      case 'undo':
        await prepare(keys.x);
        return timed(command, keys.u);
      case 'redo':
        await prepare(keys.x);
        await prepare(keys.u);
        return timed(command, keys.redo);
      case 'wrap':
        await prepare(keys.s);
        return timed(command, keys.i);
      case 'move':
        return timed(command, keys.moveDown);
      case 'paste':
        await prepare(keys.y);
        await prepare(keys.y);
        return timed(command, keys.p);
      case 'text': {
        await prepare(keys.enter);
        const editor = inlineEditor();
        editor.value = 'edited';
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        return timed(command, keys.enter, editor);
      }
    }
  };

  let done = 0;
  onProgress({ command: null, done, total });
  for (const place of places) {
    select(place);
    for (const command of perfCommandIds) {
      for (let round = 0; round < plan.warmup + plan.rounds; round += 1) {
        await restore(place);
        const time = await run(command);
        if (round >= plan.warmup) {
          samples.get(command)?.push(time);
        }
        done += 1;
        onProgress({ command, done, total });
      }
    }
  }
  await restore(places[0] ?? 1);
  return samples;
}
