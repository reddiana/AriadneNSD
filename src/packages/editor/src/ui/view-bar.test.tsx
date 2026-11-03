// @vitest-environment happy-dom
// View mode (R-WEB-06): only the diagram and one bar with the name, the notice and "Edit".
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fakeEngine, renderApp, spec } from './test-support';

afterEach(() => {
  cleanup();
});

const commands = [
  spec({
    id: 'edit.undo',
    title: 'command.edit.undo',
    keys: ['u', 'Ctrl+Z'],
    menu: { menu: 'edit', group: 0, order: 0 },
    toolbar: { group: 1, order: 0, icon: 'edit.undo' },
  }),
];

describe('view mode', () => {
  it('T-0887: shows the diagram with one bar instead of the menu bar, the toolbar and the status bar', () => {
    const engine = fakeEngine(commands);
    const { container } = renderApp(engine, { onEdit: () => undefined });
    expect(container.querySelector('.ans-menubar')).toBeNull();
    expect(container.querySelector('.ans-toolbar')).toBeNull();
    expect(container.querySelector('.ans-statusbar')).toBeNull();
    expect(container.querySelector('.ans-app')?.getAttribute('data-mode')).toBe('view');
    expect(screen.getByTestId('engine-canvas')).toBeTruthy();
    expect(screen.getByRole('toolbar', { name: 'View mode' })).toBeTruthy();
    expect(screen.getByTestId('file-name').textContent).toBe('example.ns.svg');
  });

  it('T-0888: "Edit" calls the shell and gives the keys back to the diagram', () => {
    const engine = fakeEngine(commands);
    const focus = vi.spyOn(engine.handle, 'focus');
    const onEdit = vi.fn();
    renderApp(engine, { onEdit });
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalled();
  });

  it('T-0889: shows the latest notice in the bar, such as why a key does nothing here', () => {
    const engine = fakeEngine(commands);
    renderApp(engine, { onEdit: () => undefined, locale: 'ko' });
    act(() => {
      engine.setChrome({ notice: { id: 3, message: 'reason.readOnly', level: 'warn' } });
    });
    expect(screen.getByRole('status').textContent).not.toBe('');
    expect(screen.getByRole('button', { name: '편집하기' })).toBeTruthy();
  });

  it('T-0890: does not open the context menu', () => {
    const engine = fakeEngine(commands);
    const { container } = renderApp(engine, { onEdit: () => undefined });
    act(() => {
      engine.openContextMenu({ x: 10, y: 10 });
    });
    expect(container.querySelector('.ans-context-menu')).toBeNull();
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('T-0891: without view mode, the editing UI is there', () => {
    const engine = fakeEngine(commands);
    const { container } = renderApp(engine);
    expect(container.querySelector('.ans-menubar')).not.toBeNull();
    expect(container.querySelector('.ans-statusbar')).not.toBeNull();
    expect(container.querySelector('.ans-viewbar')).toBeNull();
    expect(container.querySelector('.ans-app')?.getAttribute('data-mode')).toBe('edit');
  });
});
