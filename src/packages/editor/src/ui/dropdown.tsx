// A dropdown menu: the menu bar's menus, submenus (▸), the toolbar's "감싸기 ▾" · "확대 ▾" and
// the narrow screen's ☰. Items that do not apply are dimmed but still run, so the registry can
// tell why in the status bar (03-editor 3: "막지 않고 알린다").

import type { KeyboardEvent, ReactElement } from 'react';
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { CommandView } from './command-view';
import { displayKey, menuKey } from './keys';
import { useChrome } from './use-engine';

export type DropdownItem =
  | { readonly kind: 'command'; readonly group: number; readonly command: CommandView }
  | {
      readonly kind: 'submenu';
      readonly group: number;
      readonly title: string;
      readonly items: ReadonlyArray<DropdownItem>;
    };

type DropdownProps = {
  readonly items: ReadonlyArray<DropdownItem>;
  readonly label: string;
  /** Closes this dropdown (and, for a submenu, only the submenu). */
  readonly onClose: () => void;
  /** Called after a command ran: closes the whole tree. */
  readonly onDone: () => void;
  /** Move focus into the first item when it opens (opened by keyboard). */
  readonly isFocusedOnOpen?: boolean;
  /** `j` / `k` move like ↓ / ↑, `h` / `l` like ← / → (the context menu, 03-keymap UX K2). */
  readonly hasVimKeys?: boolean;
  /** A submenu beside its item: it turns to the left or moves up to stay in the window. */
  readonly isSubmenu?: boolean;
};

/** How far a submenu stays from the window's edge, in px. */
const windowMargin = 4;

function menuItems(list: HTMLElement): HTMLElement[] {
  return [
    ...list.querySelectorAll<HTMLElement>(
      ':scope > li > [role="menuitem"], :scope > li > [role="menuitemcheckbox"]',
    ),
  ];
}

/** A list of commands and submenus that opens under (or beside) its button. */
export function Dropdown({
  items,
  label,
  onClose,
  onDone,
  isFocusedOnOpen = false,
  hasVimKeys = false,
  isSubmenu = false,
}: DropdownProps): ReactElement {
  const { run } = useChrome();
  const listRef = useRef<HTMLUListElement>(null);
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const [isSubmenuFocused, setIsSubmenuFocused] = useState(false);

  const [place, setPlace] = useState<{ flip: boolean; shift: number; lift: number }>({
    flip: false,
    shift: 0,
    lift: 0,
  });

  useEffect(() => {
    if (isFocusedOnOpen && listRef.current) menuItems(listRef.current)[0]?.focus();
  }, [isFocusedOnOpen]);

  // A submenu that would stick out of the window opens to the left of its item when there is
  // room there, otherwise moves left over its menu; one that would stick out below moves up.
  useLayoutEffect(() => {
    const list = listRef.current;
    const view = list?.ownerDocument.defaultView;
    const item = list?.parentElement;
    if (!isSubmenu || !list || !view || !item) return;
    const box = list.getBoundingClientRect();
    const right = view.innerWidth - windowMargin;
    const flip = box.right > right && item.getBoundingClientRect().left - box.width >= windowMargin;
    const shift = box.right > right && !flip ? box.right - right : 0;
    const below = box.bottom - (view.innerHeight - windowMargin);
    const lift = below > 0 ? Math.min(below, box.top - windowMargin) : 0;
    setPlace({ flip, shift, lift });
  }, [isSubmenu]);

  function onKeyDown(event: KeyboardEvent<HTMLUListElement>): void {
    const list = listRef.current;
    if (!list) return;
    const buttons = menuItems(list);
    const current = buttons.indexOf(document.activeElement as HTMLElement);
    if (current === -1) return; // the key belongs to a submenu below
    const vimArrows: Readonly<Record<string, string>> = {
      j: 'ArrowDown',
      k: 'ArrowUp',
      h: 'ArrowLeft',
    };
    const key = (hasVimKeys ? vimArrows[event.key] : undefined) ?? event.key;
    switch (key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        const step = key === 'ArrowDown' ? 1 : -1;
        buttons[(current + step + buttons.length) % buttons.length]?.focus();
        break;
      }
      case 'ArrowLeft':
      case 'Escape':
        onClose();
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <ul
      className={place.flip ? 'ans-dropdown ans-flipped' : 'ans-dropdown'}
      role="menu"
      aria-label={label}
      ref={listRef}
      style={
        place.shift > 0 || place.lift > 0
          ? {
              ...(place.shift > 0 ? { marginLeft: 2 - place.shift } : {}),
              ...(place.lift > 0 ? { marginTop: -place.lift } : {}),
            }
          : undefined
      }
      onKeyDown={onKeyDown}
    >
      {items.map((item, index) => {
        const previous = items[index - 1];
        const separator =
          previous && previous.group !== item.group ? (
            <li role="separator" className="ans-separator">
              <hr />
            </li>
          ) : null;
        if (item.kind === 'command') {
          const { command } = item;
          const key = menuKey(command.keys);
          return (
            <Fragment key={command.id}>
              {separator}
              <li>
                <button
                  type="button"
                  className="ans-item"
                  role={command.checked === null ? 'menuitem' : 'menuitemcheckbox'}
                  aria-checked={command.checked ?? undefined}
                  aria-disabled={!command.isEnabled}
                  title={command.reason ?? undefined}
                  onMouseEnter={() => {
                    setOpenSubmenu(null);
                  }}
                  onClick={() => {
                    run(command.id);
                    onDone();
                  }}
                >
                  <span className="ans-check" aria-hidden="true">
                    {command.checked === true ? '✓' : ''}
                  </span>
                  <span className="ans-title">{command.title}</span>
                  {key !== null && <kbd>{displayKey(key)}</kbd>}
                </button>
              </li>
            </Fragment>
          );
        }
        const isOpen = openSubmenu === index;
        return (
          <Fragment key={`submenu-${item.title}`}>
            {separator}
            <li>
              <button
                type="button"
                className="ans-item"
                role="menuitem"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                onMouseEnter={() => {
                  setOpenSubmenu(index);
                  setIsSubmenuFocused(false);
                }}
                onClick={() => {
                  setOpenSubmenu(isOpen ? null : index);
                  setIsSubmenuFocused(false);
                }}
                onKeyDown={(event) => {
                  const isOpenKey =
                    event.key === 'ArrowRight' ||
                    event.key === 'Enter' ||
                    event.key === ' ' ||
                    (hasVimKeys && event.key === 'l');
                  if (isOpenKey) {
                    event.preventDefault();
                    event.stopPropagation();
                    setOpenSubmenu(index);
                    setIsSubmenuFocused(true);
                  }
                }}
              >
                <span className="ans-check" aria-hidden="true" />
                <span className="ans-title">{item.title}</span>
                <span className="ans-more" aria-hidden="true">
                  ▸
                </span>
              </button>
              {isOpen && (
                <Dropdown
                  items={item.items}
                  label={item.title}
                  isFocusedOnOpen={isSubmenuFocused}
                  hasVimKeys={hasVimKeys}
                  isSubmenu
                  onClose={() => {
                    setOpenSubmenu(null);
                    if (listRef.current) menuItems(listRef.current)[index]?.focus();
                  }}
                  onDone={onDone}
                />
              )}
            </li>
          </Fragment>
        );
      })}
    </ul>
  );
}
