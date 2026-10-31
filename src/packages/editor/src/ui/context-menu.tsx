// The context menu (03-editor 1 "팝업 레이어", 5): a right click on a block, or Shift+F10 and the
// context menu key, opens the commands whose `context` lists the kind of the selection. The
// order and the submenus are the menu bar's (03-editor 5.1); `j` `k` move like ↓ ↑ (UX K2).

import type { ReactElement } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { CommandView } from './command-view';
import type { DropdownItem } from './dropdown';
import { Dropdown } from './dropdown';
import type { ContextMenuRequest, SelectionKind } from './engine-api';
import { menuEntries, menuOrder } from './menu-model';
import { useChrome, useCommands } from './use-engine';

/**
 * The context menu's items for a kind of selection: the commands that list it, menu by menu in
 * menu-bar order, with a separator between the groups of each menu.
 */
export function contextMenuItems(
  commands: ReadonlyArray<CommandView>,
  kind: SelectionKind,
  submenuTitle: (submenu: string) => string,
): ReadonlyArray<DropdownItem> {
  const shown = commands.filter((command) => command.context.includes(kind));
  return menuOrder.flatMap((menu, menuIndex) =>
    menuEntries(shown, menu).map((entry): DropdownItem => {
      const group = menuIndex * 1000 + entry.group;
      return entry.kind === 'command'
        ? { ...entry, group }
        : {
            kind: 'submenu',
            group,
            title: submenuTitle(entry.submenu),
            items: entry.commands.map((command) => ({ kind: 'command', group: 0, command })),
          };
    }),
  );
}

/** The menu at a point of the page. Closes on Esc, on a click outside, and after a command. */
export function ContextMenu({
  request,
  onClose,
}: {
  readonly request: ContextMenuRequest;
  readonly onClose: () => void;
}): ReactElement | null {
  const { handle, text } = useChrome();
  const commands = useCommands();
  const rootRef = useRef<HTMLDivElement>(null);
  const kind = handle.commands.context().state.selection?.kind ?? null;
  const [place, setPlace] = useState({ left: request.x, top: request.y });

  // Keep the whole menu in the window: move it left or up when it would stick out.
  useLayoutEffect(() => {
    const menu = rootRef.current?.firstElementChild;
    const view = rootRef.current?.ownerDocument.defaultView;
    if (!menu || !view) return;
    const { width, height } = menu.getBoundingClientRect();
    const margin = 4;
    setPlace({
      left: Math.max(margin, Math.min(request.x, view.innerWidth - width - margin)),
      top: Math.max(margin, Math.min(request.y, view.innerHeight - height - margin)),
    });
  }, [request.x, request.y]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent): void {
      if (
        rootRef.current &&
        event.target instanceof Node &&
        !rootRef.current.contains(event.target)
      )
        onClose();
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [onClose]);

  if (kind === null) return null;
  const items = contextMenuItems(commands, kind, (submenu) =>
    text(`submenu.${submenu}` as Parameters<typeof text>[0]),
  );
  if (items.length === 0) return null;
  return (
    <div className="ans-context-menu" ref={rootRef} style={place}>
      <Dropdown
        items={items}
        label={text('contextMenu.label')}
        isFocusedOnOpen
        hasVimKeys
        onClose={onClose}
        onDone={onClose}
      />
    </div>
  );
}
