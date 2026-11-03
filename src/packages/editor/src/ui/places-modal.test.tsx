// @vitest-environment happy-dom
// The open · save modal (R-WEB-09, UX BS1 · BS3 · BS4) and the "Browser" chip (UX BS2).
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { BrowserDocumentInfo, PlacesAnswer, PlacesHost, PlacesRequest } from './places-modal';
import { formatSavedAt, formatSize } from './places-modal';
import { fakeEngine, renderApp } from './test-support';

afterEach(() => {
  cleanup();
});

const now = Date.now();
const documents: BrowserDocumentInfo[] = [
  { key: 'k1', name: 'Merge Sort', savedAt: now - 1000, size: 18 * 1024 },
  { key: 'k2', name: 'Sum and Average', savedAt: now - 3 * 24 * 3600 * 1000, size: 6 * 1024 },
];

/** A host that records what the modal asked for. */
function fakeHost(list: BrowserDocumentInfo[] = documents) {
  let request: PlacesRequest | null = null;
  const listeners = new Set<() => void>();
  const answers: PlacesAnswer[] = [];
  const actions: string[] = [];
  const action = (name: string) => (key?: string) => {
    actions.push(key === undefined ? name : `${name} ${key}`);
    return Promise.resolve();
  };
  const host: PlacesHost = {
    request: () => request,
    onRequest: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    answer: (value) => {
      answers.push(value);
      request = null;
      for (const listener of listeners) listener();
    },
    documents: () => Promise.resolve(list),
    rename: action('rename'),
    exportDocument: action('export'),
    remove: action('remove'),
    exportAll: action('exportAll'),
    importFiles: action('import'),
  };
  const ask = (fields: Partial<PlacesRequest> = {}): void => {
    request = {
      id: (request?.id ?? 0) + 1,
      mode: 'open',
      side: 'browser',
      name: '',
      currentKey: null,
      isDownload: false,
      ...fields,
    };
    act(() => {
      for (const listener of listeners) listener();
    });
  };
  return { host, ask, answers, actions };
}

async function openModal(fields: Partial<PlacesRequest> = {}, list?: BrowserDocumentInfo[]) {
  const places = fakeHost(list);
  const engine = fakeEngine([]);
  renderApp(engine, { places: places.host });
  places.ask(fields);
  await screen.findByRole('dialog');
  if ((fields.side ?? 'browser') === 'browser' && (list ?? documents).length > 0) {
    await screen.findByText('Merge Sort');
  }
  return { ...places, engine };
}

describe('the open · save modal', () => {
  it('T-0923 · R-WEB-09 · UX BS1: open asks where; the computer side hands over to the file dialog', async () => {
    const places = await openModal({ side: 'computer' });
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Files on This Computer', 'This Browser']);
    expect(tabs[0]?.getAttribute('aria-selected')).toBe('true');
    const choose = screen.getByRole('button', { name: 'Choose a File…' });
    expect(document.activeElement).toBe(choose);
    const before = places.engine.focused();
    fireEvent.click(choose);
    expect(places.answers).toEqual([{ kind: 'computer' }]);
    expect(screen.queryByRole('dialog')).toBeNull();
    // The keys go back to the diagram.
    expect(places.engine.focused()).toBe(before + 1);
  });

  it('T-0924 · UX BS1: the arrow keys move between the two sides; Esc closes without an answer', async () => {
    const places = await openModal({ side: 'computer' });
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Files on This Computer' }), {
      key: 'ArrowRight',
    });
    expect(screen.getByRole('tab', { name: 'This Browser' }).getAttribute('aria-selected')).toBe(
      'true',
    );
    await screen.findByText('Merge Sort');
    fireEvent.keyDown(screen.getByRole('tab', { name: 'This Browser' }), { key: 'ArrowLeft' });
    expect(screen.getByRole('button', { name: 'Choose a File…' })).toBeTruthy();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(places.answers).toEqual([null]);
  });

  it('T-0925 · UX BS3: the browser side lists name, modified and size, with the first row selected', async () => {
    await openModal({ currentKey: 'k2' });
    const grid = screen.getByRole('grid', { name: 'Documents in this browser' });
    const rows = within(grid).getAllByRole('row');
    expect(rows.map((row) => row.textContent)).toEqual([
      'NameModifiedSize',
      expect.stringMatching(/^Merge Sort.*18 KB$/) as unknown as string,
      expect.stringMatching(/^Sum and Average.*6 KB$/) as unknown as string,
    ]);
    expect(rows[1]?.getAttribute('aria-selected')).toBe('true');
    // The document open now is bold.
    expect(rows[2]?.getAttribute('data-current')).toBe('true');
    expect(document.activeElement).toBe(grid);
    expect(screen.getByRole('note').textContent).toContain('export them to files now and then');
  });

  it('T-0926 · UX BS3 · UX K2: j k and the arrows select, round past the ends; Enter and double-click open', async () => {
    const places = await openModal();
    const grid = screen.getByRole('grid');
    fireEvent.keyDown(grid, { key: 'ArrowDown' });
    fireEvent.keyDown(grid, { key: 'j' });
    fireEvent.keyDown(grid, { key: 'k' });
    fireEvent.keyDown(grid, { key: 'ArrowUp' });
    // Past the first row to the last (UX K2).
    fireEvent.keyDown(grid, { key: 'ArrowUp' });
    fireEvent.keyDown(grid, { key: 'Enter' });
    expect(places.answers).toEqual([{ kind: 'open', key: 'k2' }]);
    places.ask();
    fireEvent.doubleClick(await screen.findByText('Merge Sort'));
    expect(places.answers.at(-1)).toEqual({ kind: 'open', key: 'k1' });
  });

  it('T-0927 · UX BS3 · UX BS4: the buttons rename, export, delete, export all and import', async () => {
    const places = await openModal();
    fireEvent.click(screen.getByText('Sum and Average'));
    for (const name of ['Rename…', 'Export to File', 'Delete']) {
      fireEvent.click(screen.getByRole('button', { name }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name }).hasAttribute('disabled')).toBe(false);
      });
    }
    fireEvent.click(screen.getByRole('button', { name: 'Export All to Files (.zip)' }));
    await waitFor(() => {
      expect(places.actions).toContain('exportAll');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Import from Files…' }));
    await waitFor(() => {
      expect(places.actions).toEqual([
        'rename k2',
        'export k2',
        'remove k2',
        'exportAll',
        'import',
      ]);
    });
    fireEvent.keyDown(screen.getByRole('grid'), { key: 'Delete' });
    await waitFor(() => {
      expect(places.actions.at(-1)).toBe('remove k2');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(places.answers).toEqual([{ kind: 'open', key: 'k2' }]);
  });

  it('T-0928 · UX BS3: an empty browser says so and has nothing to open or export', async () => {
    await openModal({}, []);
    expect(await screen.findByText('No documents in this browser yet.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open' }).hasAttribute('disabled')).toBe(true);
    expect(
      screen.getByRole('button', { name: 'Export All to Files (.zip)' }).hasAttribute('disabled'),
    ).toBe(true);
  });

  it('T-0929 · R-WEB-09 · UX BS4: saving asks for a name, warns, and a row fills the name', async () => {
    const places = await openModal({ mode: 'save', name: 'Bubble Sort' });
    expect(screen.getByRole('heading').textContent).toBe('Save As');
    const field = screen.getByRole('textbox', { name: 'Name' });
    expect((field as HTMLInputElement).value).toBe('Bubble Sort');
    expect(document.activeElement).toBe(field);
    expect(screen.getByRole('note').textContent).toBe(
      '⚠Kept only in this browser. Clearing the browser’s site data deletes it too.',
    );
    fireEvent.click(screen.getByText('Merge Sort'));
    expect((field as HTMLInputElement).value).toBe('Merge Sort');
    fireEvent.change(field, { target: { value: 'Quick Sort' } });
    fireEvent.submit(field);
    expect(places.answers).toEqual([{ kind: 'save', name: 'Quick Sort' }]);
    places.ask({ mode: 'save', name: 'X' });
    fireEvent.doubleClick(await screen.findByText('Sum and Average'));
    expect(places.answers.at(-1)).toEqual({ kind: 'save', name: 'Sum and Average' });
    places.ask({ mode: 'save', name: 'X' });
    await screen.findByText('Merge Sort');
    fireEvent.keyDown(screen.getByRole('grid'), { key: 'Enter' });
    expect(places.answers.at(-1)).toEqual({ kind: 'save', name: 'X' });
    places.ask({ mode: 'save', name: 'X' });
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(places.answers.at(-1)).toBeNull();
  });

  it('T-0930 · UX BS1: saving on the computer side picks a place, or downloads in other browsers', async () => {
    const places = await openModal({ mode: 'save', side: 'computer' });
    fireEvent.click(screen.getByRole('button', { name: 'Choose Where to Save…' }));
    places.ask({ mode: 'save', side: 'computer', isDownload: true });
    expect(await screen.findByText(/downloads a .ns.svg file/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Download…' }));
    expect(places.answers).toEqual([{ kind: 'computer' }, { kind: 'computer' }]);
  });

  it('T-0931 · UX BS3: the backdrop closes the modal', async () => {
    const places = await openModal();
    const backdrop = document.querySelector('[data-kind="places"]');
    expect(backdrop).not.toBeNull();
    if (backdrop !== null) fireEvent.pointerDown(backdrop);
    expect(places.answers).toEqual([null]);
  });
});

describe('the list formats (UX BS3)', () => {
  it('T-0932: "Modified" is the time today, Yesterday, the day this year, the date before', () => {
    const at = new Date(2026, 10, 3, 14, 2).getTime();
    expect(formatSavedAt(at - 60_000, at, 'en', 'Yesterday')).toBe('14:01');
    expect(formatSavedAt(at - 24 * 3600 * 1000, at, 'en', 'Yesterday')).toBe('Yesterday');
    expect(formatSavedAt(new Date(2026, 9, 28).getTime(), at, 'en', 'Yesterday')).toBe('Oct 28');
    expect(formatSavedAt(new Date(2025, 9, 28).getTime(), at, 'en', 'Yesterday')).toBe(
      'Oct 28, 2025',
    );
  });

  it('T-0933: the size is whole KB, at least 1, and MB from 1 MB', () => {
    expect(formatSize(10)).toBe('1 KB');
    expect(formatSize(18 * 1024 + 100)).toBe('18 KB');
    expect(formatSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });
});

describe('the place chip and the fourth button', () => {
  it('T-0934 · UX BS2: a document in this browser has a "Browser" chip next to its name', () => {
    const engine = fakeEngine([]);
    renderApp(engine);
    expect(screen.getByTestId('file-name').textContent).toBe('example.ns.svg');
    act(() => {
      engine.setStatus({ name: 'Merge Sort', place: 'browser' });
    });
    expect(screen.getByTestId('file-name').textContent).toBe('Merge SortBrowser');
  });

  it('T-0935 · UX US1: a question with four answers puts the fourth between cancel and confirm', () => {
    const engine = fakeEngine([]);
    renderApp(engine);
    const answers: string[] = [];
    act(() => {
      engine.setChrome({
        dialog: {
          id: 4,
          message: 'Save it?',
          input: null,
          confirm: 'Save',
          cancel: 'choice.cancel',
          other: 'Discard and Open',
          second: 'Save in Browser',
          answer: () => answers.push('answer'),
          answerOther: () => answers.push('other'),
          answerSecond: () => answers.push('second'),
        },
      });
    });
    const buttons = within(screen.getByRole('dialog')).getAllByRole('button');
    expect(buttons.map((button) => button.textContent).slice(-4)).toEqual([
      'Discard and Open',
      'Cancel',
      'Save in Browser',
      'Save',
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Save in Browser' }));
    expect(answers).toEqual(['second']);
  });
});
