// Page events (06-web 1, 7): dropping a file on the page, and leaving it with unsaved changes.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isFileDrag, watchFileDrops, watchPageExit } from './page-events';

/** A drag event of `types` (`Files` for files from the desktop). */
function dragEvent(type: string, types: ReadonlyArray<string>) {
  const event = new Event(type, { cancelable: true }) as Event & { dataTransfer: unknown };
  event.dataTransfer = { types, dropEffect: 'none' };
  return event as Event & { dataTransfer: { types: string[]; dropEffect: string } };
}

beforeEach(() => {
  // The page: an event target standing in for `window`.
  vi.stubGlobal('window', new EventTarget());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('file drag detection', () => {
  it('T-0768: a drag with files is a file drag; a block dragged in the diagram is not', () => {
    expect(isFileDrag({ types: ['Files'] } as unknown as DataTransfer)).toBe(true);
    expect(isFileDrag({ types: ['text/plain'] } as unknown as DataTransfer)).toBe(false);
    expect(isFileDrag(null)).toBe(false);
  });
});

describe('file drops on the page', () => {
  function watch() {
    const dragging: boolean[] = [];
    const dropped: DataTransfer[] = [];
    const stop = watchFileDrops(
      {
        openDropped: (transfer) => {
          dropped.push(transfer);
        },
      },
      (isDragging) => dragging.push(isDragging),
    );
    return { dragging, dropped, stop };
  }

  it('T-0769: 06-web 1: shows the drop hint while a file is over the page, through nested elements', () => {
    const { dragging } = watch();
    window.dispatchEvent(dragEvent('dragenter', ['Files']));
    window.dispatchEvent(dragEvent('dragenter', ['Files']));
    window.dispatchEvent(dragEvent('dragleave', ['Files']));
    expect(dragging).toEqual([true, true]);
    window.dispatchEvent(dragEvent('dragleave', ['Files']));
    expect(dragging).toEqual([true, true, false]);
    // A stray leave does not go below zero.
    window.dispatchEvent(dragEvent('dragleave', ['Files']));
    window.dispatchEvent(dragEvent('dragenter', ['Files']));
    expect(dragging.at(-1)).toBe(true);
  });

  it('T-0770: 06-web 1: lets a file be dropped as a copy', () => {
    watch();
    const over = dragEvent('dragover', ['Files']);
    window.dispatchEvent(over);
    expect(over.defaultPrevented).toBe(true);
    expect(over.dataTransfer.dropEffect).toBe('copy');
  });

  it('T-0771: 06-web 1: opens a dropped file and hides the hint', () => {
    const { dragging, dropped } = watch();
    window.dispatchEvent(dragEvent('dragenter', ['Files']));
    window.dispatchEvent(dragEvent('dragenter', ['Files']));
    const drop = dragEvent('drop', ['Files']);
    window.dispatchEvent(drop);
    expect(drop.defaultPrevented).toBe(true);
    expect(dropped).toEqual([drop.dataTransfer]);
    expect(dragging.at(-1)).toBe(false);
    // The count starts again from zero after a drop.
    window.dispatchEvent(dragEvent('dragenter', ['Files']));
    window.dispatchEvent(dragEvent('dragleave', ['Files']));
    expect(dragging.at(-1)).toBe(false);
  });

  it('T-0772: leaves drags without files to the diagram', () => {
    const { dragging, dropped } = watch();
    const events = ['dragenter', 'dragover', 'dragleave', 'drop'].map((type) =>
      dragEvent(type, ['text/plain']),
    );
    for (const event of events) {
      window.dispatchEvent(event);
    }
    expect(dragging).toEqual([]);
    expect(dropped).toEqual([]);
    expect(events.some((event) => event.defaultPrevented)).toBe(false);
  });

  it('T-0773: stops listening when told to', () => {
    const { dragging, dropped, stop } = watch();
    stop();
    window.dispatchEvent(dragEvent('dragenter', ['Files']));
    window.dispatchEvent(dragEvent('drop', ['Files']));
    expect(dragging).toEqual([]);
    expect(dropped).toEqual([]);
  });
});

describe('leaving the page', () => {
  function watch(isDirty: boolean) {
    const calls: string[] = [];
    watchPageExit({
      suspend: () => calls.push('suspend'),
      isDirty: () => isDirty,
      dispose: () => calls.push('dispose'),
    });
    return calls;
  }

  it('T-0774: 06-web 7: writes the backup and asks "Leave site?" when the document is not saved', () => {
    const calls = watch(true);
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(calls).toEqual(['suspend']);
    expect(event.defaultPrevented).toBe(true);
  });

  it('T-0775: 06-web 7: does not ask when the document is saved', () => {
    watch(false);
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('T-0776: 06-web 7: a hidden page writes the backup, and closes the shell unless it is kept', () => {
    const calls = watch(false);
    const kept = Object.assign(new Event('pagehide'), { persisted: true });
    window.dispatchEvent(kept);
    expect(calls).toEqual(['suspend']);
    const gone = Object.assign(new Event('pagehide'), { persisted: false });
    window.dispatchEvent(gone);
    expect(calls).toEqual(['suspend', 'suspend', 'dispose']);
  });
});
