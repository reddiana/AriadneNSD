// @vitest-environment happy-dom
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { paletteRows } from './command-palette';
import type { CommandView } from './command-view';
import { fakeEngine, memorySettings, renderApp, spec } from './test-support';

afterEach(() => {
  cleanup();
});

const editCommands = [
  spec({ id: 'view.zoom.in', title: 'command.view.zoom.in', keys: ['+'] }),
  spec({
    id: 'edit.undo',
    title: 'command.edit.undo',
    keys: ['u', 'Ctrl+Z'],
    menu: { menu: 'edit', group: 0, order: 0 },
    toolbar: { group: 1, order: 0, icon: 'edit.undo' },
  }),
  spec({
    id: 'edit.cut',
    title: 'command.edit.cut',
    keys: ['d d', 'Ctrl+X'],
    menu: { menu: 'edit', group: 1, order: 0 },
  }),
  spec({
    id: 'block.wrap.if',
    title: 'command.block.wrap.if',
    keys: ['s i'],
    menu: { menu: 'diagram', group: 1, order: 0, submenu: 'wrap' },
    when: () => 'reason.notContiguous',
  }),
  spec({
    id: 'block.insert.if',
    title: 'command.block.insert.if',
    keys: ['a i'],
    menu: { menu: 'diagram', group: 0, order: 1, submenu: 'insert' },
    toolbar: { group: 3, order: 1, icon: 'block.if' },
  }),
  spec({
    id: 'block.insert.process',
    title: 'command.block.insert.process',
    keys: ['o'],
    toolbar: { group: 3, order: 0, icon: 'block.process' },
  }),
];

describe('menu bar', () => {
  it('T-0293: 03-editor 5.1: opens a menu with its items and the standard key, and runs a click', () => {
    const engine = fakeEngine(editCommands);
    renderApp(engine);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const menu = screen.getByRole('menu', { name: 'Edit' });
    const cut = within(menu).getByRole('menuitem', { name: /Cut/ });
    expect(cut.textContent).toContain('Ctrl+X');
    expect(cut.textContent).not.toContain('dd');
    // The UI's own command joins the Edit menu after the engine's groups.
    expect(within(menu).getByRole('menuitem', { name: /Command Palette/ })).toBeTruthy();
    fireEvent.click(cut);
    expect(engine.ran).toEqual(['edit.cut']);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('T-0294: 03-editor 3: dims a command that does not apply and still runs it so the engine can tell why', () => {
    const engine = fakeEngine(editCommands);
    renderApp(engine);
    fireEvent.click(screen.getByRole('button', { name: 'Diagram' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Wrap/ }));
    const wrapIf = screen.getByRole('menuitem', { name: /Wrap in If/ });
    expect(wrapIf.getAttribute('aria-disabled')).toBe('true');
    expect(wrapIf.getAttribute('title')).toBe('Select blocks next to each other under one parent.');
    fireEvent.click(wrapIf);
    expect(engine.ran).toEqual(['block.wrap.if']);
  });

  it('T-0295 · UX W3: shows the file name with ● while unsaved', () => {
    const engine = fakeEngine(editCommands);
    renderApp(engine);
    const name = screen.getByTestId('file-name');
    expect(name.textContent).toBe('example.ns.svg');
    act(() => {
      engine.setStatus({ dirty: true });
    });
    expect(name.textContent).toBe('example.ns.svg●');
  });

  it('T-0296 · R-NFR-04: names the menus in the screen language', () => {
    renderApp(fakeEngine(editCommands), { locale: 'ko' });
    expect(screen.getByRole('button', { name: '편집' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '다이어그램' })).toBeTruthy();
  });
});

describe('toolbar block icons', () => {
  it('T-0297 · R-EDIT-01: click inserts after, Shift+click before, Ctrl+click wraps; process cannot wrap', () => {
    const engine = fakeEngine(editCommands);
    renderApp(engine);
    const ifIcon = screen.getByRole('button', { name: 'If' });
    fireEvent.click(ifIcon);
    fireEvent.click(ifIcon, { shiftKey: true });
    fireEvent.click(ifIcon, { ctrlKey: true });
    fireEvent.click(screen.getByRole('button', { name: 'Process' }), { ctrlKey: true });
    expect(engine.ran).toEqual([
      'block.insert.if',
      'block.insertBefore.if',
      'block.wrap.if',
      'block.insert.process',
    ]);
  });

  it('T-0298 · R-EDIT-09: a press that moves past 4 px hands a drag to the engine instead of clicking', () => {
    const engine = fakeEngine(editCommands);
    renderApp(engine);
    const ifIcon = screen.getByRole('button', { name: 'If' });
    fireEvent.pointerDown(ifIcon, { button: 0, clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent.pointerMove(ifIcon, { clientX: 12, clientY: 12, pointerId: 1 });
    expect(engine.drags).toEqual([]);
    fireEvent.pointerMove(ifIcon, { clientX: 20, clientY: 10, pointerId: 1 });
    fireEvent.pointerUp(ifIcon, { pointerId: 1 });
    fireEvent.click(ifIcon);
    expect(engine.drags).toEqual(['if']);
    expect(engine.ran).toEqual([]);
  });

  it('T-0299: 02-interaction-rules: the tooltip names the block and the keys that do the same', () => {
    renderApp(fakeEngine(editCommands));
    expect(screen.getByRole('button', { name: 'If' }).getAttribute('title')).toContain('(ai)');
  });
});

describe('command palette', () => {
  const views: ReadonlyArray<CommandView> = ['Undo', 'Cut', 'Wrap in If', 'Wrap in While'].map(
    (title) => ({
      id: title,
      title,
      keys: [],
      menu: null,
      toolbar: null,
      context: [],
      isEnabled: true,
      reason: null,
      checked: null,
    }),
  );

  it('T-0300 · R-EDIT-24: finds commands by part of the name, recent ones first', () => {
    expect(paletteRows(views, 'wrap', []).map((row) => row.id)).toEqual([
      'Wrap in If',
      'Wrap in While',
    ]);
    expect(paletteRows(views, 'WRAP', ['Wrap in While']).map((row) => row.id)).toEqual([
      'Wrap in While',
      'Wrap in If',
    ]);
    expect(paletteRows(views, '', []).length).toBe(4);
  });

  it('T-0301 · R-EDIT-24: opens from its command, shows Vim keys, runs the picked row with Enter', () => {
    const engine = fakeEngine(editCommands);
    renderApp(engine);
    act(() => {
      engine.handle.commands.run('edit.commandPalette');
    });
    const input = screen.getByRole('combobox', { name: 'Command palette' });
    fireEvent.change(input, { target: { value: 'cut' } });
    // "Cut" and "Keyboard Shortcuts" both contain "cut"; the first row is picked.
    const options = screen.getAllByRole('option');
    expect(options[0]?.textContent).toBe('CutddCtrl+X');
    expect(options[0]?.getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(engine.ran).toEqual(['edit.commandPalette', 'edit.cut']);
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('T-0302 · R-EDIT-24: moves with ↑ ↓ and closes with Esc without running', () => {
    const engine = fakeEngine(editCommands);
    renderApp(engine);
    act(() => {
      engine.handle.commands.run('edit.commandPalette');
    });
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'insert' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const selected = screen
      .getAllByRole('option')
      .find((option) => option.getAttribute('aria-selected') === 'true');
    expect(selected?.textContent).toContain('Insert Process');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(engine.ran).toEqual(['edit.commandPalette']);
  });
});

describe('status bar', () => {
  it('T-0303: 06-web 7: shows what is selected and the latest notice', () => {
    const engine = fakeEngine(editCommands);
    renderApp(engine);
    expect(screen.getByTestId('selection').textContent).toBe('Nothing selected');
    act(() => {
      engine.setChrome({
        selection: 'selection.if',
        notice: { id: 1, message: { key: 'notice.copied', params: { count: 2 } }, level: 'info' },
      });
    });
    expect(screen.getByTestId('selection').textContent).toBe('If block');
    expect(screen.getByRole('status').textContent).toContain('Copied 2 block(s).');
  });

  it('T-0304: 04-visual-design 7.1: shows the editing mode and the zoom', () => {
    const engine = fakeEngine(editCommands);
    renderApp(engine);
    act(() => {
      engine.setChrome({ mode: 'editing', zoom: 1.5 });
    });
    expect(screen.getByRole('status').textContent).toContain('-- EDIT --');
    expect(screen.getByRole('button', { name: /150%/ })).toBeTruthy();
  });

  it('T-0305 · UX MD3: asks If ↔ Case with buttons and passes the answer to the engine', () => {
    const engine = fakeEngine(editCommands);
    renderApp(engine);
    const choose = vi.fn();
    act(() => {
      engine.setChrome({
        question: {
          id: 1,
          message: 'question.convertIfToCase',
          choices: [
            { title: 'choice.convertToCase', isDefault: true, choose },
            { title: 'choice.keepIf', choose: () => undefined },
          ],
          dismiss: () => undefined,
        },
      });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Convert to Case' }));
    expect(choose).toHaveBeenCalledOnce();
  });
});

describe('key hint', () => {
  it('T-0306 · R-EDIT-04: lists the second keys when the engine says the hint is due, and hides after', () => {
    const engine = fakeEngine(editCommands);
    renderApp(engine);
    act(() => {
      engine.setChrome({ pendingKeys: 'a' });
    });
    expect(screen.queryByRole('note')).toBeNull();
    act(() => {
      engine.setChrome({ isKeyHintShown: true, keyHintTitle: 'keyHint.a' });
    });
    const hint = screen.getByRole('note');
    expect(hint.textContent).toContain('Insert after');
    expect(hint.textContent).toContain('iInsert If');
    act(() => {
      engine.setChrome({ pendingKeys: null, isKeyHintShown: false });
    });
    expect(screen.queryByRole('note')).toBeNull();
  });
});

describe('modals', () => {
  it('T-0307 · R-EDIT-21: `?` opens the key table with Vim and standard columns, Esc closes it', () => {
    const engine = fakeEngine(editCommands);
    renderApp(engine);
    act(() => {
      engine.handle.commands.run('help.shortcuts');
    });
    const dialog = screen.getByRole('dialog', { name: 'Keyboard Shortcuts' });
    const cutRow = within(dialog).getByText('Cut').closest('tr');
    expect(cutRow?.textContent).toBe('CutddCtrl+X');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('T-0308 · UX W5: preferences show the user settings and write a change to the settings store', () => {
    const settings = memorySettings();
    const engine = fakeEngine(editCommands, [
      {
        id: 'keyHint',
        title: 'setting.keyHint',
        values: [true, false],
        defaultValue: true,
        scope: 'user',
      },
      {
        id: 'headerStyle',
        title: 'setting.autoSave',
        values: ['box', 'title'],
        defaultValue: 'box',
        scope: 'document',
      },
    ]);
    renderApp(engine, { settings });
    act(() => {
      engine.handle.commands.run('file.preferences');
    });
    const dialog = screen.getByRole('dialog', { name: 'Preferences' });
    expect(within(dialog).queryByLabelText('Save automatically')).toBeNull();
    fireEvent.change(within(dialog).getByLabelText('Show the key hint'), {
      target: { value: '1' },
    });
    expect(settings.get('keyHint')).toBe(false);
  });

  it('T-0309 · UX W5: document settings write through the engine', () => {
    const engine = fakeEngine(editCommands, [
      {
        id: 'headerStyle',
        title: 'setting.autoSave',
        values: ['box', 'title'],
        defaultValue: 'box',
        scope: 'document',
      },
    ]);
    renderApp(engine);
    act(() => {
      engine.handle.commands.run('diagram.documentSettings');
    });
    fireEvent.change(screen.getByLabelText('Save automatically'), { target: { value: '1' } });
    expect(engine.handle.documentSetting('headerStyle')).toBe('title');
    expect(screen.getByLabelText<HTMLSelectElement>('Save automatically').value).toBe('1');
  });

  it('T-0813: ADR-0041: the language of drawn labels shows a faint hint and each language in its own name', () => {
    const engine = fakeEngine(editCommands, [
      {
        id: 'document.locale',
        title: 'setting.documentLocale',
        hint: 'setting.documentLocale.hint',
        values: ['en', 'ko'],
        valueTitles: ['setting.uiLocale.en', 'setting.uiLocale.ko'],
        defaultValue: 'en',
        scope: 'document',
      },
    ]);
    renderApp(engine, { locale: 'ko' });
    act(() => {
      engine.handle.commands.run('diagram.documentSettings');
    });
    const select = screen.getByLabelText<HTMLSelectElement>('그림 문구의 언어');
    const hint = screen.getByText('참 · 거짓, ⋯ 블록 n개');
    expect(hint.className).toBe('ans-field-hint');
    expect(select.getAttribute('aria-describedby')).toBe(hint.id);
    expect([...select.options].map((option) => option.textContent)).toEqual(['English', '한국어']);
    fireEvent.change(select, { target: { value: '1' } });
    expect(engine.handle.documentSetting('document.locale')).toBe('ko');
  });
});

describe('canvas slot', () => {
  it('T-0310: ADR-0010: puts the engine element between the toolbar and the status bar', () => {
    renderApp(fakeEngine(editCommands));
    const canvas = screen.getByTestId('engine-canvas');
    expect(canvas.parentElement?.className).toBe('ans-canvas-slot');
  });
});

describe('context menu', () => {
  const contextCommands = [
    ...editCommands.map((command) =>
      command.id === 'edit.cut' || command.id === 'block.insert.if'
        ? { ...command, context: ['blocks' as const] }
        : command,
    ),
  ];

  it('T-0311: 03-editor 5: lists the commands for the selection in menu order, with submenus', () => {
    const engine = fakeEngine(contextCommands);
    renderApp(engine);
    act(() => {
      engine.openContextMenu({ x: 40, y: 50 });
    });
    const menu = screen.getByRole('menu', { name: 'Context menu' });
    const [cut, insert, ...others] = within(menu).getAllByRole('menuitem');
    if (cut === undefined || insert === undefined) throw new Error('two items expected');
    expect(others).toEqual([]);
    expect(cut.textContent).toContain('Cut');
    expect(insert.textContent).toContain('Insert');
    // Opened from the keyboard or the mouse, the first item has the focus; j moves down.
    expect(document.activeElement).toBe(cut);
    fireEvent.keyDown(cut, { key: 'j' });
    expect(document.activeElement).toBe(insert);
    fireEvent.click(cut);
    expect(engine.ran).toEqual(['edit.cut']);
    expect(screen.queryByRole('menu', { name: 'Context menu' })).toBeNull();
  });

  it('T-0312: closes on Esc', () => {
    const engine = fakeEngine(contextCommands);
    renderApp(engine);
    act(() => {
      engine.openContextMenu({ x: 40, y: 50 });
    });
    const [first] = screen.getAllByRole('menuitem');
    if (first === undefined) throw new Error('an item expected');
    fireEvent.keyDown(first, { key: 'Escape' });
    expect(screen.queryByRole('menu', { name: 'Context menu' })).toBeNull();
  });
});

describe('dialogs and notices from the shell', () => {
  it('T-0313: 06-web 2: a dialog asks in a modal; the confirm button answers', () => {
    const engine = fakeEngine(editCommands);
    renderApp(engine);
    const answers: (string | null)[] = [];
    act(() => {
      engine.setChrome({
        dialog: {
          id: 1,
          message: 'Restore them?',
          input: null,
          confirm: 'Restore',
          cancel: 'Discard',
          answer: (value) => answers.push(value),
        },
      });
    });
    expect(screen.getByRole('dialog').textContent).toContain('Restore them?');
    fireEvent.click(screen.getByRole('button', { name: 'Restore' }));
    expect(answers).toEqual(['']);
  });

  it('T-0314: 06-web 1: a text dialog answers the typed text, Esc cancels', () => {
    const engine = fakeEngine(editCommands);
    renderApp(engine);
    const answers: (string | null)[] = [];
    act(() => {
      engine.setChrome({
        dialog: {
          id: 2,
          message: 'File name:',
          input: 'a.ns.svg',
          confirm: 'choice.ok',
          cancel: 'choice.cancel',
          answer: (value) => answers.push(value),
        },
      });
    });
    const box = screen.getByRole('textbox');
    fireEvent.change(box, { target: { value: 'b.ns.svg' } });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(answers).toEqual(['b.ns.svg', null]);
  });

  it('T-0315: 06-web 7: a warning stays in the status bar until it is closed', () => {
    vi.useFakeTimers();
    try {
      const engine = fakeEngine(editCommands);
      renderApp(engine);
      act(() => {
        engine.setChrome({ notice: { id: 7, message: 'Saved as a copy.', level: 'warn' } });
      });
      act(() => {
        vi.advanceTimersByTime(20_000);
      });
      expect(screen.getByText('Saved as a copy.')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Close the message' }));
      expect(screen.queryByText('Saved as a copy.')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('picker (interaction rules "호출 블록")', () => {
  const pickerOf = (answers: (number | null)[]) => ({
    id: 1,
    title: 'picker.callTarget',
    items: [
      { title: 'sort(xs)', isLiteral: true },
      { title: 'merge(a, b)', isLiteral: true },
      { title: 'picker.newMethod', isLiteral: false },
    ],
    x: 40,
    y: 50,
    active: 1,
    choose: (index: number | null) => answers.push(index),
  });

  it('T-0316 · R-BLK-07: lists the Methods and "new Method"; j k move from the active one, Enter chooses', () => {
    const engine = fakeEngine(editCommands);
    renderApp(engine);
    const answers: (number | null)[] = [];
    act(() => {
      engine.setChrome({ picker: pickerOf(answers) });
    });
    const menu = screen.getByRole('menu', { name: 'Method to call' });
    const items = within(menu).getAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'sort(xs)1',
      'merge(a, b)2',
      'New Method, and call it3',
    ]);
    expect(document.activeElement).toBe(items[1]);
    fireEvent.keyDown(menu, { key: 'j' });
    expect(document.activeElement).toBe(items[2]);
    fireEvent.keyDown(menu, { key: 'j' });
    expect(document.activeElement).toBe(items[0]);
    const [first] = items;
    if (first === undefined) throw new Error('an item expected');
    fireEvent.click(first);
    expect(answers).toEqual([0]);
  });

  it('T-0317: 03-keymap: a digit chooses at once, Esc closes', () => {
    const engine = fakeEngine(editCommands);
    renderApp(engine);
    const answers: (number | null)[] = [];
    act(() => {
      engine.setChrome({ picker: pickerOf(answers) });
    });
    const menu = screen.getByRole('menu', { name: 'Method to call' });
    fireEvent.keyDown(menu, { key: '3' });
    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(answers).toEqual([2, null]);
  });
});
