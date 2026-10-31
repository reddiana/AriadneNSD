import { describe, expect, it } from 'vitest';

import type { CommandView } from './command-view';
import { menuEntries } from './menu-model';

function view(id: string, menu: CommandView['menu']): CommandView {
  return {
    id,
    title: id,
    keys: [],
    menu,
    toolbar: null,
    context: [],
    isEnabled: true,
    reason: null,
    checked: null,
  };
}

describe('menuEntries', () => {
  it('03-editor 5.1: orders a menu by group and order and gathers submenus in place', () => {
    const commands = [
      view('block.unwrap', { menu: 'diagram', group: 1, order: 1 }),
      view('block.insert.if', { menu: 'diagram', group: 0, order: 1, submenu: 'insert' }),
      view('block.insert.process', { menu: 'diagram', group: 0, order: 0, submenu: 'insert' }),
      view('block.wrap.if', { menu: 'diagram', group: 1, order: 0, submenu: 'wrap' }),
      view('edit.undo', { menu: 'edit', group: 0, order: 0 }),
      view('palette.only', null),
    ];
    const entries = menuEntries(commands, 'diagram');
    expect(
      entries.map((entry) => (entry.kind === 'command' ? entry.command.id : entry.submenu)),
    ).toEqual(['insert', 'wrap', 'block.unwrap']);
    const insert = entries[0];
    expect(insert?.kind === 'submenu' && insert.commands.map((command) => command.id)).toEqual([
      'block.insert.process',
      'block.insert.if',
    ]);
    expect(entries.map((entry) => entry.group)).toEqual([0, 1, 1]);
  });
});
