// The toolbar (03-editor 5.2, 06-web 7): the registry's toolbar commands in their groups, the six
// block icons, then "감싸기 ▾", the zoom buttons [축소] [NN%] [확대] (M76 Z1) and "예제" (opens the
// examples modal). Narrow screens show
// the same buttons on more rows, with icons only, and a help button at the end (UX MB2).

import type { PointerEvent as ReactPointerEvent, ReactElement, ReactNode, RefObject } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { blockIconCommand, blockKindOfIcon, uiCommandIds, zoomCommandIds } from './command-ids';
import type { CommandView } from './command-view';
import { byPlace, groupRuns } from './command-view';
import type { DropdownItem } from './dropdown';
import { Dropdown } from './dropdown';
import type { ToolbarBlockKind } from './engine-api';
import { BlockIcon, hasStrokeIcon, StrokeIcon, WrapIcon } from './icons';
import { displayKey, menuKey } from './keys';
import { useChrome, useChromeState, useCommands } from './use-engine';

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

/** A toolbar button with a ▾ that opens a list of commands (감싸기 ▾). */
export function DropdownButton({
  icon,
  label,
  commands,
  className = '',
  isDimmedWhenNoneApply = false,
}: {
  readonly icon: ReactElement;
  readonly label: string;
  readonly commands: ReadonlyArray<CommandView>;
  readonly className?: string;
  /**
   * When no command applies, the button is dimmed like a command button: its tooltip is the
   * first command's reason, and a click runs that command instead of opening the list, so the
   * registry tells why in the status bar ("막지 않고 알린다", UX TB3).
   */
  readonly isDimmedWhenNoneApply?: boolean;
}): ReactElement | null {
  const { run } = useChrome();
  const [open, setOpen] = useState<{ byKeyboard: boolean } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = useRef(() => {
    setOpen(null);
  }).current;
  useOutsideClose(rootRef, open !== null, close);
  const first = commands[0];
  if (first === undefined) return null;
  const isDimmed = isDimmedWhenNoneApply && commands.every((command) => !command.isEnabled);
  const items: DropdownItem[] = commands.map((command) => ({ kind: 'command', group: 0, command }));
  return (
    <div className={`ans-tool-root ${className}`} ref={rootRef}>
      <button
        type="button"
        className="ans-tool"
        aria-haspopup="menu"
        aria-expanded={open !== null && !isDimmed}
        aria-disabled={isDimmed || undefined}
        // The tooltip holds the reason, so the name stays the label (narrow screens hide it).
        aria-label={isDimmed ? label : undefined}
        title={isDimmed ? (first.reason ?? label) : label}
        onClick={(event) => {
          if (isDimmed) {
            run(first.id);
            return;
          }
          setOpen(open ? null : { byKeyboard: event.detail === 0 });
        }}
      >
        {icon}
        <span className="ans-tool-label">{label}</span>
        <StrokeIcon icon="chevron" size={10} />
      </button>
      {open && !isDimmed && (
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

/**
 * The zoom level between [축소] and [확대] (M76 Z1): a click runs "100%" (`view.zoom.reset`). It
 * stays readable at 100% too, where the command does not apply, because it also shows the zoom;
 * the click then still runs the command, so the status bar tells why.
 */
function ZoomLevelButton({
  command,
  zoom,
}: {
  readonly command: CommandView;
  readonly zoom: number;
}): ReactElement {
  const { run, text } = useChrome();
  const label = text('toolbar.zoomReset');
  const key = menuKey(command.keys);
  return (
    <button
      type="button"
      className="ans-tool ans-zoom-level"
      aria-label={label}
      title={key === null ? label : `${label} (${displayKey(key)})`}
      data-command={command.id}
      onClick={() => {
        run(command.id);
      }}
    >
      <span className="ans-tool-label">{`${String(Math.round(zoom * 100))}%`}</span>
    </button>
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
      // On narrow screens too, with the icon only (BUG-04, 05-screen-layout).
      className="ans-tool ans-icon-on-narrow"
      aria-label={label}
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

/**
 * Hides the separators that the wrapping of a narrow toolbar leaves at the start or the end of a
 * row (UX MB2). One at a row's start is taken out; one at a row's end only goes invisible, so the
 * rows do not change and pull it back. Runs again when the toolbar changes size.
 */
function useWrappedSeparators(root: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const toolbar = root.current;
    if (!toolbar) return;
    function update(): void {
      if (!toolbar) return;
      const separators = [...toolbar.querySelectorAll<HTMLElement>('.ans-sep')];
      for (const separator of separators) separator.dataset.wrap = '';
      const items = [
        ...toolbar.querySelectorAll<HTMLElement>('.ans-sep, .ans-tool, .ans-tool-root'),
      ].filter((item) => item.offsetParent !== null);
      // Top to bottom: taking one out changes only the rows below it.
      for (const separator of separators) {
        const at = items.indexOf(separator);
        if (at < 0) continue;
        const before = items[at - 1];
        const after = items[at + 1];
        const top = separator.offsetTop;
        if (before === undefined || before.offsetTop + before.offsetHeight <= top) {
          separator.dataset.wrap = 'start';
          items.splice(at, 1);
        } else if (after === undefined || after.offsetTop >= top + separator.offsetHeight) {
          separator.dataset.wrap = 'end';
        }
      }
    }
    update();
    const view = toolbar.ownerDocument.defaultView;
    if (!view || !('ResizeObserver' in view)) return;
    const observer = new view.ResizeObserver(update);
    observer.observe(toolbar);
    return () => {
      observer.disconnect();
    };
  });
}

/** How far a wheel must scroll over the zoom group for one zoom step (a mouse notch is ~100px). */
export const zoomWheelStep = 50;

/** A wheel's deltaY in pixels, whatever its deltaMode (lines, pages). */
function wheelPixels(event: WheelEvent, pageHeight: number): number {
  if (event.deltaMode === 1) return event.deltaY * 16;
  if (event.deltaMode === 2) return event.deltaY * pageHeight;
  return event.deltaY;
}

/**
 * [−] [NN%] [+] as one tight group that never wraps apart (M76 Z1). A wheel over it zooms: up
 * runs "확대", down "축소", one step per mouse notch; a trackpad's small deltas add up to a step.
 * The listener is native and not passive, so the page and the canvas do not scroll at once.
 */
function ZoomGroup({ children }: { readonly children: ReactNode }): ReactElement {
  const { run, text } = useChrome();
  const rootRef = useRef<HTMLSpanElement>(null);
  const runRef = useRef(run);
  runRef.current = run;
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let sum = 0;
    function onWheel(event: WheelEvent): void {
      if (event.deltaY === 0) return;
      event.preventDefault();
      const delta = wheelPixels(event, root?.ownerDocument.defaultView?.innerHeight ?? 800);
      // A turn the other way starts over.
      sum = Math.sign(sum) === Math.sign(delta) ? sum + delta : delta;
      if (Math.abs(sum) < zoomWheelStep) return;
      const id = sum < 0 ? zoomCommandIds.in : zoomCommandIds.out;
      sum = 0;
      runRef.current(id);
    }
    root.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      root.removeEventListener('wheel', onWheel);
    };
  }, []);
  return (
    <span className="ans-zoom-group" role="group" aria-label={text('toolbar.zoom')} ref={rootRef}>
      {children}
    </span>
  );
}

/** A command the toolbar shows outside the registry's groups, drawn with the icon of its id. */
function withIcon(command: CommandView): CommandView {
  return { ...command, toolbar: { group: 0, order: 0, icon: command.id } };
}

/** The toolbar under the menu bar. */
export function Toolbar(): ReactElement {
  const rootRef = useRef<HTMLDivElement>(null);
  useWrappedSeparators(rootRef);
  const { handle, text } = useChrome();
  const { zoom: zoomLevel } = useChromeState(handle);
  const commands = useCommands();
  const placed = commands
    .flatMap((command) =>
      command.toolbar ? [{ ...command.toolbar, id: command.id, command }] : [],
    )
    .sort(byPlace);
  const byId = (id: string): CommandView | undefined =>
    commands.find((command) => command.id === id);
  const zoomOut = byId(zoomCommandIds.out);
  const zoomReset = byId(zoomCommandIds.reset);
  const zoomIn = byId(zoomCommandIds.in);
  // Narrow screens have no Help menu in sight, so the shortcut list gets a button (UX MB2).
  const help = commands.find((command) => command.id === uiCommandIds.shortcuts);

  return (
    <div className="ans-toolbar" role="toolbar" aria-label={text('toolbar.label')} ref={rootRef}>
      {groupRuns(placed).map((run, index) => {
        return (
          <span key={run[0]?.id ?? index} style={{ display: 'contents' }}>
            {index > 0 && <span className="ans-sep" aria-hidden="true" />}
            {run.map(({ icon, command }) => {
              const kind = blockKindOfIcon(icon);
              if (kind !== null) {
                return (
                  <BlockButton key={command.id} kind={kind} command={command} commands={commands} />
                );
              }
              return <CommandButton key={command.id} command={command} />;
            })}
          </span>
        );
      })}
      <span className="ans-sep" aria-hidden="true" />
      <DropdownButton
        icon={<WrapIcon />}
        label={text('toolbar.wrap')}
        commands={wrapCommands(commands)}
        className="ans-icon-on-narrow"
        isDimmedWhenNoneApply
      />
      <ZoomGroup>
        {zoomOut && <CommandButton command={withIcon(zoomOut)} />}
        {zoomReset && <ZoomLevelButton command={zoomReset} zoom={zoomLevel} />}
        {zoomIn && <CommandButton command={withIcon(zoomIn)} />}
      </ZoomGroup>
      <ExamplesButton command={commands.find((command) => command.id === uiCommandIds.examples)} />
      {help && (
        <CommandButton
          command={{ ...help, toolbar: { group: 0, order: 0, icon: 'help' } }}
          className="ans-tool ans-narrow-only"
        />
      )}
    </div>
  );
}
