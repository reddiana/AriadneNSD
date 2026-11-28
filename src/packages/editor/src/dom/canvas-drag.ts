// Drag and drop on the diagram area (03-editor 3.2): dragging blocks of the diagram and new blocks
// from the toolbar, the drag label, and scrolling at the canvas edge. The canvas view draws the
// drop place from `current`.
import type { Id, Locale } from '@ariadne-nsd/core';

import { runDrop } from '../commands/drop-command';
import { formatMessage } from '../i18n/messages';
import type { DragSource, Drop } from '../input/drop';
import { findDrop } from '../input/drop';
import type { Point } from '../input/hit-test';
import { ancestorsOf } from '../model/doc-index';
import type { EditorSession } from '../session/session';
import { foldBlocks, selectBlock, selectFold, selectedBlocks, targetOf } from '../state/selection';

/** A press must move this far before it is a drag (03-editor 3.2). */
export const dragThreshold = 4;

/** Dragging this close to the canvas edge scrolls that way (03-editor 3.2). */
export const autoScrollEdge = 32;

/** A drag in progress. */
export type DragState = {
  readonly source: DragSource;
  readonly label: string;
  drop: Drop | null;
  client: Point;
  scrollFrame: number | null;
  /** Window listeners of a drag that came from the toolbar. */
  readonly stop: AbortController | null;
};

/** What dragging needs from the canvas view. */
export type DragHost = {
  readonly canvas: HTMLDivElement;
  readonly dragLabel: HTMLDivElement;
  readonly session: EditorSession;
  readonly locale: () => Locale;
  readonly toDrawing: (clientX: number, clientY: number) => Point;
  readonly schedule: () => void;
  readonly focus: () => void;
  readonly clearHover: () => void;
};

/** The drag of one canvas view. */
export class CanvasDrag {
  private drag: DragState | null = null;

  constructor(private readonly host: DragHost) {}

  /** The drag in progress, or `null`. */
  get current(): DragState | null {
    return this.drag;
  }

  /** Starts dragging the selection, or `block` alone when it is outside the selection. */
  startBlocksDrag(block: Id, event: PointerEvent): void {
    const session = this.host.session;
    const index = session.index();
    const state = session.state;
    const selected = selectedBlocks(index, state.selection);
    const target = targetOf(state.selection);
    let source: DragSource;
    if (target !== null && ancestorsOf(index, block).some((id) => selected.includes(id))) {
      source = { kind: 'blocks', target, blocks: selected };
    } else {
      session.select(selectBlock(index, block));
      source = {
        kind: 'blocks',
        target: { kind: 'blocks', first: block, last: block },
        blocks: [block],
      };
    }
    const [first] = source.blocks;
    const firstBlock = first === undefined ? undefined : index.blocks.get(first)?.block;
    const text = firstBlock !== undefined && 'text' in firstBlock ? firstBlock.text : '';
    this.beginDrag(source, text.split('\n')[0] ?? '', null, event);
  }

  /**
   * Starts dragging a whole fold region of the model: pressed on its name band or its folded
   * cell (M87 F2). The region and its blocks move together, by the drop rules of blocks.
   */
  startFoldDrag(fold: Id, event: PointerEvent): void {
    const session = this.host.session;
    const index = session.index();
    const blocks = foldBlocks(index, fold);
    if (blocks.length === 0) {
      return;
    }
    session.select(selectFold(fold, []));
    const owner = index.folds.get(fold);
    const mark =
      owner === undefined
        ? undefined
        : index.seqs.get(owner)?.seq.folds.find((item) => item.id === fold);
    const [first] = blocks;
    const firstBlock = first === undefined ? undefined : index.blocks.get(first)?.block;
    // The label is the region's name, or its first block's text as for dragged blocks.
    const blockText = firstBlock !== undefined && 'text' in firstBlock ? firstBlock.text : '';
    const text = mark?.name ?? blockText;
    const label = text.split('\n')[0] ?? '';
    this.beginDrag({ kind: 'blocks', target: { kind: 'fold', fold }, blocks }, label, null, event);
  }

  /** Starts dragging a new block from a toolbar icon (the UI calls this after 4 px). */
  startNewBlockDrag(source: DragSource, label: string, event: PointerEvent): void {
    if (this.host.session.state.readOnly) {
      this.host.session.notify('reason.readOnly', 'warn');
      return;
    }
    const stop = new AbortController();
    const window = this.host.canvas.ownerDocument.defaultView;
    if (window === null) {
      return;
    }
    window.addEventListener(
      'pointermove',
      (e) => {
        this.moveDrag(e.clientX, e.clientY);
      },
      { signal: stop.signal },
    );
    window.addEventListener(
      'pointerup',
      () => {
        this.endDrag(true);
      },
      { signal: stop.signal },
    );
    window.addEventListener(
      'pointercancel',
      () => {
        this.endDrag(false);
      },
      { signal: stop.signal },
    );
    window.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          this.endDrag(false);
        }
      },
      { signal: stop.signal, capture: true },
    );
    this.beginDrag(source, label, stop, event);
  }

  private beginDrag(
    source: DragSource,
    label: string,
    stop: AbortController | null,
    event: PointerEvent,
  ): void {
    this.endDrag(false);
    this.host.clearHover();
    this.drag = {
      source,
      label,
      drop: null,
      client: { x: event.clientX, y: event.clientY },
      scrollFrame: null,
      stop,
    };
    this.host.canvas.classList.add('ans-is-dragging');
    this.moveDrag(event.clientX, event.clientY);
  }

  moveDrag(clientX: number, clientY: number): void {
    const drag = this.drag;
    if (drag === null) {
      return;
    }
    const { canvas, dragLabel, session } = this.host;
    drag.client = { x: clientX, y: clientY };
    const rect = canvas.getBoundingClientRect();
    const isInside =
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom;
    const state = session.state;
    drag.drop = isInside
      ? findDrop(
          state.layout,
          session.index(),
          this.host.toDrawing(clientX, clientY),
          drag.source,
          state.selection,
        )
      : null;
    canvas.classList.toggle('ans-cannot-drop', drag.drop === null);
    const wraps = drag.drop?.wraps ?? null;
    const label =
      wraps === null ? drag.label : formatMessage(this.host.locale(), `drag.wrap.${wraps}`);
    dragLabel.textContent = label;
    dragLabel.style.display = label === '' ? 'none' : 'block';
    dragLabel.style.left = `${String(clientX + 14)}px`;
    dragLabel.style.top = `${String(clientY + 14)}px`;
    if (isInside && drag.scrollFrame === null) {
      this.autoScroll();
    }
    this.host.schedule();
  }

  private autoScroll(): void {
    const drag = this.drag;
    if (drag === null) {
      return;
    }
    const canvas = this.host.canvas;
    const rect = canvas.getBoundingClientRect();
    const speed = (distance: number): number =>
      distance < autoScrollEdge
        ? Math.ceil(((autoScrollEdge - distance) / autoScrollEdge) * 16)
        : 0;
    const { x, y } = drag.client;
    const dx = speed(x - rect.left) > 0 ? -speed(x - rect.left) : speed(rect.right - x);
    const dy = speed(y - rect.top) > 0 ? -speed(y - rect.top) : speed(rect.bottom - y);
    if (dx === 0 && dy === 0) {
      drag.scrollFrame = null;
      return;
    }
    canvas.scrollBy(dx, dy);
    drag.scrollFrame = requestAnimationFrame(() => {
      if (this.drag === drag) {
        drag.scrollFrame = null;
        this.moveDrag(drag.client.x, drag.client.y);
      }
    });
  }

  /** Ends a drag; `isDrop` runs what the drop place says, otherwise nothing happens. */
  endDrag(isDrop: boolean): void {
    const drag = this.drag;
    if (drag === null) {
      return;
    }
    this.drag = null;
    drag.stop?.abort();
    if (drag.scrollFrame !== null) {
      cancelAnimationFrame(drag.scrollFrame);
    }
    this.host.canvas.classList.remove('ans-is-dragging', 'ans-cannot-drop');
    this.host.dragLabel.style.display = 'none';
    if (isDrop && drag.drop !== null) {
      runDrop(this.host.session, drag.drop.action);
      this.host.focus();
    }
    this.host.schedule();
  }
}
