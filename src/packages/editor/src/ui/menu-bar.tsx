// The menu bar: File · Edit · Diagram · View · Help, and on the right the file name with the
// unsaved mark ● (06-web 7, UX W3). On narrow screens the menus fold into ☰ (UX MB1).

import type { ReactElement, RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

import type { CommandView } from './command-view';
import type { DropdownItem } from './dropdown';
import { Dropdown } from './dropdown';
import type { MenuId } from './engine-api';
import { StrokeIcon } from './icons';
import type { MenuEntry } from './menu-model';
import { menuEntries, menuOrder } from './menu-model';
import type { Chrome } from './use-engine';

/** The product name on the menu bar. A name, so it is not translated. */
const productName = 'AriadneNSD';
import { useChrome, useCommands, useDocStatus } from './use-engine';

function dropdownItems(entries: ReadonlyArray<MenuEntry>, text: Chrome['text']): DropdownItem[] {
  return entries.map((entry) =>
    entry.kind === 'command'
      ? entry
      : {
          kind: 'submenu',
          group: entry.group,
          title: text(`submenu.${entry.submenu}`),
          items: entry.commands.map((command) => ({ kind: 'command', group: 0, command })),
        },
  );
}

/** The menus that have at least one command, with their dropdown items. */
function useMenus(commands: ReadonlyArray<CommandView>, text: Chrome['text']) {
  return menuOrder
    .map((menu) => ({ menu, items: dropdownItems(menuEntries(commands, menu), text) }))
    .filter(({ items }) => items.length > 0);
}

/**
 * Closes an open menu when the pointer goes down outside `root`, or on Escape wherever the focus
 * is. A menu opened with the mouse leaves the focus on its title button, not in the menu (BUG-05).
 */
function useCloseMenu(
  root: RefObject<HTMLElement | null>,
  isOpen: boolean,
  close: () => void,
): void {
  useEffect(() => {
    if (!isOpen) return;
    function onPointerDown(event: PointerEvent): void {
      if (root.current && event.target instanceof Node && !root.current.contains(event.target))
        close();
    }
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') close();
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [root, isOpen, close]);
}

type OpenMenu = { readonly menu: MenuId | 'all'; readonly byKeyboard: boolean };

/** The menu bar at the top of the editor. */
export function MenuBar(): ReactElement {
  const chrome = useChrome();
  const { handle, text } = chrome;
  const status = useDocStatus(handle);
  const commands = useCommands();
  const menus = useMenus(commands, text);
  const [open, setOpen] = useState<OpenMenu | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = useRef(() => {
    setOpen(null);
  }).current;
  useCloseMenu(rootRef, open !== null, close);

  function button(menu: MenuId | 'all', title: ReactElement | string, isIcon = false) {
    const isOpen = open?.menu === menu;
    return (
      <button
        type="button"
        className={isIcon ? 'ans-menu-button ans-hamburger' : 'ans-menu-button'}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={isIcon ? text('menu.all') : undefined}
        onClick={(event) => {
          // A click from the keyboard (Enter, Space) has no pointer position.
          setOpen(isOpen ? null : { menu, byKeyboard: event.detail === 0 });
        }}
        onMouseEnter={() => {
          if (open !== null && !isOpen && menu !== 'all') setOpen({ menu, byKeyboard: false });
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen({ menu, byKeyboard: true });
          }
        }}
      >
        {title}
      </button>
    );
  }

  function dropdown(menu: MenuId | 'all', items: ReadonlyArray<DropdownItem>, label: string) {
    if (open?.menu !== menu) return null;
    return (
      <Dropdown
        items={items}
        label={label}
        isFocusedOnOpen={open.byKeyboard}
        onClose={close}
        onDone={close}
      />
    );
  }

  const allItems: DropdownItem[] = menus.map(({ menu, items }) => ({
    kind: 'submenu',
    group: 0,
    title: text(`menu.${menu}`),
    items,
  }));

  return (
    <div className="ans-menubar" ref={rootRef}>
      <span className="ans-brand">{productName}</span>
      <div className="ans-menu-root">
        {button('all', <StrokeIcon icon="menu" />, true)}
        {dropdown('all', allItems, text('menu.all'))}
      </div>
      <nav className="ans-menus" role="menubar">
        {menus.map(({ menu, items }) => (
          <div className="ans-menu-root" key={menu}>
            {button(menu, text(`menu.${menu}`))}
            {dropdown(menu, items, text(`menu.${menu}`))}
          </div>
        ))}
      </nav>
      <span className="ans-file-name" data-testid="file-name">
        {status.name}
        {status.dirty && (
          <span
            className="ans-dirty"
            title={text('status.unsaved')}
            aria-label={text('status.unsaved')}
          >
            ●
          </span>
        )}
        {status.readOnly && <span className="ans-read-only">{text('status.readOnly')}</span>}
      </span>
    </div>
  );
}
