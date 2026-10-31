// Builds the menu bar's tree from the command list (03-editor 5.1, ADR-0033).

import { byPlace } from './command-view';
import type { CommandView } from './command-view';
import type { MenuId, SubmenuId } from './engine-api';

/** The menus of the menu bar, left to right (03-editor 5.1). */
export const menuOrder: ReadonlyArray<MenuId> = ['file', 'edit', 'diagram', 'view', 'help'];

/** One line of a dropdown: a command, or a submenu (▸) with its own commands. */
export type MenuEntry =
  | { readonly kind: 'command'; readonly group: number; readonly command: CommandView }
  | {
      readonly kind: 'submenu';
      readonly group: number;
      readonly submenu: SubmenuId;
      readonly commands: ReadonlyArray<CommandView>;
    };

/**
 * The entries of one menu, in place order. A submenu sits where its first command sits,
 * and keeps that command's group (the separator lines of 5.1 fall between groups).
 */
export function menuEntries(
  commands: ReadonlyArray<CommandView>,
  menu: MenuId,
): ReadonlyArray<MenuEntry> {
  const placed = commands
    .flatMap((command) =>
      command.menu?.menu === menu ? [{ ...command.menu, id: command.id, command }] : [],
    )
    .sort(byPlace);
  const entries: MenuEntry[] = [];
  const submenus = new Map<SubmenuId, CommandView[]>();
  for (const { group, submenu, command } of placed) {
    if (submenu === undefined) {
      entries.push({ kind: 'command', group, command });
      continue;
    }
    const existing = submenus.get(submenu);
    if (existing) {
      existing.push(command);
      continue;
    }
    const list = [command];
    submenus.set(submenu, list);
    entries.push({ kind: 'submenu', group, submenu, commands: list });
  }
  return entries;
}
