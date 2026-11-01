// The toolbar (03-editor 5.2, 06-web 7): the registry's toolbar commands in their groups, the six
// block icons, then "감싸기 ▾", "확대 ▾" and "예제" (opens the examples modal). On narrow screens undo · redo · wrap move to the
// bottom bar (UX MB1).

import type { PointerEvent as ReactPointerEvent, ReactElement, RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

import { blockIconCommand, blockKindOfIcon, uiCommandIds, zoomCommandIds } from './command-ids';
import type { CommandView } from './command-view';
import { byPlace, groupRuns } from './command-view';
import type { DropdownItem } from './dropdown';
import { Dropdown } from './dropdown';
import type { ToolbarBlockKind } from './engine-api';
import { BlockIcon, hasStrokeIcon, StrokeIcon } from './icons';
import { displayKey, menuKey } from './keys';
import { useChrome, useChromeState, useCommands } from './use-engine';

/** Icons that go to the bottom bar on narrow screens (06-web 7 "좁은 화면"). */
const bottomBarIcons: ReadonlySet<string> = new Set(['edit.undo', 'edit.redo']);

/** How far the pointer must move before a press on a block icon becomes a drag (03-editor 3.2). */
const dragThreshold = 4;

function keyText(commands: ReadonlyArray<CommandView>, id: string): string {
  const key = menuKey(commands.find((command) => command.id === id)?.keys ?? []);
  return key === null ? '—' : displayKey(key);
}

function BlockButton({
  kind,
  command,
  commands,
}: {
  readonly kind: ToolbarBlockKind;
  readonly command: CommandView;
  readonly commands: ReadonlyArray<CommandView>;
}): ReactElement {
  const { handle, run, text } = useChrome();
  const press = useRef<{ x: number; y: number } | null>(null);
  const hasDragged = useRef(false);

  const name = text(`block.${kind}`);
  const tip = text(kind === 'process' ? 'toolbar.processTip' : 'toolbar.blockTip', {
    name,
    after: keyText(
      commands,
      blockIconCommand(kind, { shiftKey: false, ctrlKey: false, metaKey: false }),
    ),
    before: keyText(
      commands,
      blockIconCommand(kind, { shiftKey: true, ctrlKey: false, metaKey: false }),
    ),
    wrap: keyText(
      commands,
      blockIconCommand(kind, { shiftKey: false, ctrlKey: true, metaKey: false }),
    ),
  });

  function onPointerMove(event: ReactPointerEvent<HTMLButtonElement>): void {
    const start = press.current;
    if (start === null) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) <= dragThreshold) return;
    press.current = null;
    hasDragged.current = true;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    handle.startBlockDrag(kind, event.nativeEvent);
  }

  return (
    <button
      type="button"
      className="ans-tool"
      aria-label={name}
      aria-disabled={!command.isEnabled}
      title={command.reason ?? tip}
      data-command={command.id}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        press.current = { x: event.clientX, y: event.clientY };
        hasDragged.current = false;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={onPointerMove}
      onPointerUp={() => {
        press.current = null;
      }}
      onPointerCancel={() => {
        press.current = null;
      }}
      onClick={(event) => {
        if (hasDragged.current) {
          hasDragged.current = false;
          return;
        }
        run(blockIconCommand(kind, event));
      }}
    >
      <BlockIcon kind={kind} />
    </button>
  );
}

/** A toolbar button for one command. */
export function CommandButton({
  command,
  className = 'ans-tool',
}: {
  readonly command: CommandView;
  readonly className?: string;
}): ReactElement {
  const { run } = useChrome();
  const icon = command.toolbar?.icon ?? '';
  const key = menuKey(command.keys);
  const tip = key === null ? command.title : `${command.title} (${displayKey(key)})`;
  return (
    <button
      type="button"
      className={className}
      aria-label={command.title}
      aria-disabled={!command.isEnabled}
      title={command.reason ?? tip}
      data-command={command.id}
      onClick={() => {
        run(command.id);
      }}
    >
      {hasStrokeIcon(icon) ? (
        <StrokeIcon icon={icon} />
      ) : (
        <span className="ans-tool-label">{command.title}</span>
      )}
    </button>
  );
}

function useOutsideClose(
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
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [root, isOpen, close]);
}

/** A toolbar button with a ▾ that opens a list of commands (감싸기 ▾, 확대 ▾). */
export function DropdownButton({
  icon,
  label,
  commands,
  caption,
  className = '',
}: {
  readonly icon: string;
  readonly label: string;
  /** Text on the button instead of the label (the zoom shows "100%"). */
  readonly caption?: string;
  readonly commands: ReadonlyArray<CommandView>;
  readonly className?: string;
}): ReactElement | null {
  const [open, setOpen] = useState<{ byKeyboard: boolean } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = useRef(() => {
    setOpen(null);
  }).current;
  useOutsideClose(rootRef, open !== null, close);
  if (commands.length === 0) return null;
  const items: DropdownItem[] = commands.map((command) => ({ kind: 'command', group: 0, command }));
  return (
    <div className={`ans-tool-root ${className}`} ref={rootRef}>
      <button
        type="button"
        className="ans-tool"
        aria-haspopup="menu"
        aria-expanded={open !== null}
        title={label}
        onClick={(event) => {
          setOpen(open ? null : { byKeyboard: event.detail === 0 });
        }}
      >
        <StrokeIcon icon={icon} />
        <span className="ans-tool-label">{caption ?? label}</span>
        <StrokeIcon icon="chevron" size={10} />
      </button>
      {open && (
        <Dropdown
          items={items}
          label={label}
          isFocusedOnOpen={open.byKeyboard}
          onClose={close}
          onDone={close}
        />
      )}
    </div>
  );
}

/** The wrap commands of the "감싸기 ▸" submenu, for "감싸기 ▾". */
export function wrapCommands(commands: ReadonlyArray<CommandView>): ReadonlyArray<CommandView> {
  return commands
    .filter((command) => command.menu?.submenu === 'wrap')
    .sort((a, b) => (a.menu?.order ?? 0) - (b.menu?.order ?? 0));
}

/** "예제": opens the examples modal, the same one as Help › Examples… (UX EX3). */
function ExamplesButton({
  command,
}: {
  readonly command: CommandView | undefined;
}): ReactElement | null {
  const { run, text } = useChrome();
  if (command === undefined) return null;
  const label = text('toolbar.examples');
  return (
    <button
      type="button"
      className="ans-tool ans-wide-only"
      aria-haspopup="dialog"
      title={command.title}
      data-command={command.id}
      onClick={() => {
        run(command.id);
      }}
    >
      <StrokeIcon icon="examples" />
      <span className="ans-tool-label">{label}</span>
    </button>
  );
}

/** The toolbar under the menu bar. */
export function Toolbar(): ReactElement {
  const { handle, text } = useChrome();
  const { zoom: zoomLevel } = useChromeState(handle);
  const commands = useCommands();
  const placed = commands
    .flatMap((command) =>
      command.toolbar ? [{ ...command.toolbar, id: command.id, command }] : [],
    )
    .sort(byPlace);
  const zoom = zoomCommandIds.flatMap((id) => commands.filter((command) => command.id === id));

  return (
    <div className="ans-toolbar" role="toolbar" aria-label={text('toolbar.label')}>
      {groupRuns(placed).map((run, index) => {
        const isBottomBarGroup = run.every(({ icon }) => bottomBarIcons.has(icon));
        const className = isBottomBarGroup ? 'ans-wide-only' : undefined;
        return (
          <span key={run[0]?.id ?? index} style={{ display: 'contents' }}>
            {index > 0 && <span className={`ans-sep ${className ?? ''}`} aria-hidden="true" />}
            {run.map(({ icon, command }) => {
              const kind = blockKindOfIcon(icon);
              if (kind !== null) {
                return (
                  <BlockButton key={command.id} kind={kind} command={command} commands={commands} />
                );
              }
              return (
                <CommandButton
                  key={command.id}
                  command={command}
                  className={bottomBarIcons.has(icon) ? 'ans-tool ans-wide-only' : 'ans-tool'}
                />
              );
            })}
          </span>
        );
      })}
      <span className="ans-sep" aria-hidden="true" />
      <DropdownButton
        icon="wrap"
        label={text('toolbar.wrap')}
        commands={wrapCommands(commands)}
        className="ans-wide-only"
      />
      <DropdownButton
        icon="zoom"
        label={text('toolbar.zoom')}
        caption={`${String(Math.round(zoomLevel * 100))}%`}
        commands={zoom}
      />
      <ExamplesButton command={commands.find((command) => command.id === uiCommandIds.examples)} />
    </div>
  );
}

/** The bar at the bottom on narrow screens: undo · redo · wrap · help (06-web 7, UX MB1). */
export function BottomBar(): ReactElement {
  const { text } = useChrome();
  const commands = useCommands();
  const undoRedo = commands
    .filter((command) => command.toolbar && bottomBarIcons.has(command.toolbar.icon))
    .sort((a, b) => (a.toolbar?.order ?? 0) - (b.toolbar?.order ?? 0));
  const help = commands.find((command) => command.id === uiCommandIds.shortcuts);
  return (
    <div className="ans-bottombar">
      {undoRedo.map((command) => (
        <CommandButton key={command.id} command={command} />
      ))}
      <DropdownButton icon="wrap" label={text('toolbar.wrap')} commands={wrapCommands(commands)} />
      {help && (
        <CommandButton command={{ ...help, toolbar: { group: 0, order: 0, icon: 'help' } }} />
      )}
    </div>
  );
}
