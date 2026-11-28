// The input of the diagram area (03-editor 3): keys, focus, the context menu, pointer presses and
// moves, double clicks and the wheel. It only translates DOM events; what they do goes through the
// session, the command registry, the drag and the inline editor.
import type { Id } from '@ariadne-nsd/core';

import type { ContextMenuRequest } from '../contracts';
import type { Hit, Point } from '../input/hit-test';
import { hitTest, selectionOfHit } from '../input/hit-test';
import { strokeOf } from '../input/keys';
import { ancestorsOf } from '../model/doc-index';
import { hasFurther } from '../navigation/navigate';
import { toShown } from '../navigation/shown-selection';
import type { EditorSession } from '../session/session';
import type { EditField } from '../state/editor-state';
import type { Selection } from '../state/selection';
import { extendPeekTo, extendTo, foldPath, selectedBlocks } from '../state/selection';
import type { CanvasDrag } from './canvas-drag';
import { dragThreshold } from './canvas-drag';
import type { InlineEditor } from './inline-editor';

/** How long the canvas focus outline shows after a focus, a click or a key that did nothing. */
const focusFlashMs = 1000;

/** A press of the primary button that may become a click or a drag. */
type Press = {
  readonly pointerId: number;
  readonly x: number;
  readonly y: number;
  readonly block: Id | null;
  /** A fold region of the model pressed on its name band or folded cell: dragged whole (M87 F2). */
  readonly fold: Id | null;
  /** The blocks of a folded row of the model that was pressed: dragged together (UX DF4). */
  readonly row: Selection | null;
  /** A click inside a selected range selects only on release, so the range can be dragged. */
  readonly deferred: Selection | null;
};

/** A field's call path, left out outside opened call blocks. */
function pathPart(path: ReadonlyArray<Id>): { readonly path?: ReadonlyArray<Id> } {
  return path.length === 0 ? {} : { path };
}

/** What the input needs from the canvas view. */
export type InputHost = {
  readonly canvas: HTMLDivElement;
  readonly session: EditorSession;
  readonly run: (id: string, args?: unknown) => void;
  readonly contextMenu: (request: ContextMenuRequest) => void;
  readonly drag: CanvasDrag;
  readonly inlineEditor: InlineEditor;
  readonly focus: () => void;
  readonly toDrawing: (clientX: number, clientY: number) => Point;
  readonly zoomTo: (zoom: number, anchor: Point | null) => void;
  readonly selectionAnchor: () => Point | null;
  readonly schedule: () => void;
  /** The block (or parallel branch) under the pointer, drawn by the edit layer. */
  readonly hover: () => Id | null;
  readonly setHover: (block: Id | null) => void;
};

/** The input of one canvas view. */
export class CanvasInput {
  private focusFlash: ReturnType<typeof setTimeout> | null = null;
  private press: Press | null = null;
  private wheelRest = 0;

  constructor(private readonly host: InputHost) {}

  private get session(): EditorSession {
    return this.host.session;
  }

  /** Listens to the canvas, then to the inline editor. */
  listen(signal: AbortSignal): void {
    const canvas = this.host.canvas;
    canvas.addEventListener(
      'keydown',
      (event) => {
        this.onKeyDown(event);
      },
      { signal },
    );
    canvas.addEventListener(
      'pointerdown',
      (event) => {
        this.onPointerDown(event);
      },
      { signal },
    );
    canvas.addEventListener(
      'focus',
      () => {
        this.flashFocus();
      },
      { signal },
    );
    canvas.addEventListener(
      'blur',
      () => {
        // Leaving the canvas (a click on the toolbar or outside) drops a waiting first key too.
        this.session.clearPending();
      },
      { signal },
    );
    canvas.addEventListener(
      'pointermove',
      (event) => {
        this.onPointerMove(event);
      },
      { signal },
    );
    canvas.addEventListener(
      'pointerup',
      (event) => {
        this.onPointerUp(event);
      },
      { signal },
    );
    canvas.addEventListener(
      'pointercancel',
      () => {
        this.press = null;
        this.host.drag.endDrag(false);
      },
      { signal },
    );
    canvas.addEventListener(
      'pointerleave',
      () => {
        if (this.host.hover() !== null) {
          this.host.setHover(null);
          this.host.schedule();
        }
      },
      { signal },
    );
    canvas.addEventListener(
      'contextmenu',
      (event) => {
        this.onContextMenu(event);
      },
      { signal },
    );
    canvas.addEventListener(
      'dblclick',
      (event) => {
        this.onDoubleClick(event);
      },
      { signal },
    );
    canvas.addEventListener(
      'wheel',
      (event) => {
        this.onWheel(event);
      },
      { signal, passive: false },
    );
    this.host.inlineEditor.listen(signal);
  }

  /** Stops the focus flash timer. */
  dispose(): void {
    if (this.focusFlash !== null) {
      clearTimeout(this.focusFlash);
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.target !== this.host.canvas) {
      return;
    }
    if (this.host.drag.current !== null) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.host.drag.endDrag(false);
      }
      return;
    }
    if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
      // The context menu from the keyboard opens at the selection (or the canvas corner).
      event.preventDefault();
      this.openContextMenuAtSelection();
      return;
    }
    const stroke = strokeOf(event);
    if (stroke !== null && this.session.handleKey(stroke)) {
      event.preventDefault();
    }
    if (stroke !== null) {
      // A key that left nothing selected shows where the keys go (UX CF2).
      const after = this.session.state;
      if (after.selection === null && after.editing === null && after.pendingKeys === null) {
        this.flashFocus();
      }
    }
  }

  /**
   * Shows the canvas focus outline for a moment while nothing is selected (UX CF2): the diagram
   * stays clear to read, and a keyboard user still sees where the keys go.
   */
  private flashFocus(): void {
    if (this.session.state.selection !== null) {
      return;
    }
    if (this.focusFlash !== null) {
      clearTimeout(this.focusFlash);
    }
    const canvas = this.host.canvas;
    canvas.classList.add('ans-focus-flash');
    this.focusFlash = setTimeout(() => {
      this.focusFlash = null;
      canvas.classList.remove('ans-focus-flash');
    }, focusFlashMs);
  }

  /**
   * Right click: selects what is under the pointer unless it is inside the selection, then asks
   * for the context menu (03-editor 5: `CommandSpec.context`). The empty canvas has no menu.
   */
  private onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    if (this.host.drag.current !== null) {
      return;
    }
    if (this.session.state.editing !== null) {
      this.host.inlineEditor.commit(false);
    }
    this.host.focus();
    const state = this.session.state;
    const index = this.session.index();
    const shown = this.session.shown();
    const hit = hitTest(
      state.layout,
      shown.index,
      this.host.toDrawing(event.clientX, event.clientY),
    );
    if (hit === null) {
      // The empty canvas: the File and Help menus (UX CM1).
      this.session.select(null);
      this.host.contextMenu({ x: event.clientX, y: event.clientY });
      return;
    }
    const selected = selectedBlocks(index, state.selection);
    const isInSelection =
      hit.kind === 'block' &&
      index.blocks.has(hit.block) &&
      ancestorsOf(index, hit.block).some((id) => selected.includes(id));
    if (!isInSelection) {
      this.session.select(selectionOfHit(shown, index, hit));
    }
    this.host.contextMenu({ x: event.clientX, y: event.clientY });
  }

  private openContextMenuAtSelection(): void {
    const at = this.host.selectionAnchor();
    if (at !== null) {
      this.host.contextMenu(at);
    }
  }

  private onPointerDown(event: PointerEvent): void {
    // A click drops a waiting first key (`a`) and its key hint (UX K4).
    this.session.clearPending();
    if (event.button !== 0) {
      return;
    }
    if (this.session.state.editing !== null) {
      this.host.inlineEditor.commit(false);
    }
    this.host.focus();
    const state = this.session.state;
    const index = this.session.index();
    const shown = this.session.shown();
    const hit = hitTest(
      state.layout,
      shown.index,
      this.host.toDrawing(event.clientX, event.clientY),
    );
    if (hit === null) {
      // The empty canvas clears the selection (interaction rules 2) and shows the focus (CF2).
      this.session.select(null);
      this.flashFocus();
      return;
    }
    const clicked = selectionOfHit(shown, index, hit);
    if (hit.kind === 'toggle') {
      // The fold triangle folds or unfolds what it is on (interaction rules 4).
      this.session.select(clicked);
      this.host.run('view.fold.toggle');
      return;
    }
    // Blocks, folded rows (UX DF4) and fold regions (M87 F2) of the model are dragged; blocks and
    // the blocks shown in an opened call widen a range with Shift.
    const fold =
      clicked?.kind === 'fold' && foldPath(clicked).length === 0 && index.folds.has(clicked.fold)
        ? clicked.fold
        : null;
    const isModelBlock = hit.kind === 'block' && index.blocks.has(hit.block);
    const isModelRow =
      hit.kind === 'block' &&
      shown.meanings.get(hit.block)?.kind === 'row' &&
      clicked?.kind === 'blocks';
    const selected = selectedBlocks(index, state.selection);
    const isInRange =
      isModelBlock &&
      selected.length > 1 &&
      ancestorsOf(index, hit.block).some((id) => selected.includes(id));
    if (event.shiftKey && isModelBlock) {
      this.session.select(extendTo(index, state.selection, hit.block));
    } else if (event.shiftKey && clicked?.kind === 'peek') {
      // Inside an opened call block the range widens the same way, at that call path.
      this.session.select(extendPeekTo(index, state.selection, clicked));
    } else if (!isInRange) {
      this.session.select(clicked);
    }
    this.press = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      block: isModelBlock ? hit.block : null,
      fold: event.shiftKey ? null : fold,
      row: isModelRow && !event.shiftKey ? clicked : null,
      deferred: isInRange && !event.shiftKey ? clicked : null,
    };
    this.host.canvas.setPointerCapture(event.pointerId);
  }

  private onPointerMove(event: PointerEvent): void {
    const drag = this.host.drag;
    const current = drag.current;
    if (current !== null && current.stop === null) {
      drag.moveDrag(event.clientX, event.clientY);
      return;
    }
    const press = this.press;
    if (press !== null && press.pointerId === event.pointerId) {
      const distance = Math.hypot(event.clientX - press.x, event.clientY - press.y);
      if (distance > dragThreshold && !this.session.state.readOnly) {
        // The press becomes the drag.
        if (press.block !== null) {
          this.press = null;
          drag.startBlocksDrag(press.block, event);
        } else if (press.fold !== null) {
          this.press = null;
          drag.startFoldDrag(press.fold, event);
        } else if (press.row !== null) {
          this.press = null;
          drag.startRowDrag(press.row, event);
        }
      }
      return;
    }
    const state = this.session.state;
    const hit = hitTest(
      state.layout,
      this.session.shown().index,
      this.host.toDrawing(event.clientX, event.clientY),
    );
    const hover = this.hoverOf(hit);
    if (hover !== this.host.hover()) {
      this.host.setHover(hover);
      this.host.schedule();
    }
  }

  /**
   * What the hover outline goes on: a block, or a parallel block's branch when the pointer is on
   * the part of the top band that selects it (UX PH1).
   */
  private hoverOf(hit: Hit | null): Id | null {
    if (hit?.kind === 'block') {
      return hit.block;
    }
    if (hit?.kind !== 'branchLabel' || hit.branch === null) {
      return null;
    }
    const isParallel =
      this.session.shown().index.branches.get(hit.branch)?.block.kind === 'parallel';
    return isParallel ? hit.branch : null;
  }

  private onPointerUp(event: PointerEvent): void {
    const current = this.host.drag.current;
    if (current !== null && current.stop === null) {
      this.host.drag.endDrag(true);
    } else if (
      this.press !== null &&
      this.press.deferred !== null &&
      this.press.pointerId === event.pointerId
    ) {
      this.session.select(this.press.deferred);
    }
    this.press = null;
  }

  private onDoubleClick(event: MouseEvent): void {
    const state = this.session.state;
    const shown = this.session.shown();
    const hit = hitTest(
      state.layout,
      shown.index,
      this.host.toDrawing(event.clientX, event.clientY),
    );
    if (hit === null || hit.kind === 'toggle') {
      return;
    }
    // Double-click edits text everywhere (UX Q2); a folded row has none and unfolds.
    let field: EditField;
    switch (hit.kind) {
      case 'block': {
        const meaning = shown.meanings.get(hit.block);
        if (meaning?.kind === 'row') {
          event.preventDefault();
          this.host.run('view.fold.toggle');
          return;
        }
        if (meaning?.kind === 'peek') {
          this.session.notify('reason.peekReadOnly', 'warn');
          return;
        }
        field =
          meaning?.kind === 'fold'
            ? { kind: 'fold', fold: meaning.fold, ...pathPart(meaning.path) }
            : this.session.blockField(hit.block);
        break;
      }
      case 'diagramHead':
        field = { kind: 'head', diagram: hit.diagram };
        break;
      case 'branchLabel':
        if (hit.branch === null) {
          field = { kind: 'missingDefault', block: hit.block };
        } else if (shown.index.branches.get(hit.branch)?.block.kind === 'parallel') {
          // A parallel branch has no label: its top band holds the block's text (M84 B1).
          field = this.session.blockField(hit.block);
        } else {
          field = { kind: 'branchLabel', branch: hit.branch };
        }
        break;
      case 'missingDefault':
        field = { kind: 'missingDefault', block: hit.block };
        break;
    }
    event.preventDefault();
    const started = this.session.startEditing(field, 'selectAll');
    if (started !== true) {
      this.session.notify(started, 'warn');
    }
  }

  private isOverDiagram(event: MouseEvent): boolean {
    const { x, y } = this.host.toDrawing(event.clientX, event.clientY);
    return this.session.state.layout.diagrams.some(
      ({ box }) => x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height,
    );
  }

  private onWheel(event: WheelEvent): void {
    if (event.ctrlKey || event.metaKey) {
      // Ctrl+wheel zooms around the pointer (interaction rules 2).
      event.preventDefault();
      const step = event.deltaY < 0 ? 0.1 : -0.1;
      this.host.zoomTo(this.session.state.zoom + step, { x: event.clientX, y: event.clientY });
      return;
    }
    const state = this.session.state;
    const isVertical = Math.abs(event.deltaY) > Math.abs(event.deltaX);
    if (state.selection === null || state.editing !== null || event.shiftKey || !isVertical) {
      return;
    }
    // Over a diagram, with something selected, one wheel notch is one Up or Down; with nothing
    // further that way, and over the empty canvas, the canvas scrolls (UX WH1).
    const direction = event.deltaY < 0 ? 'up' : 'down';
    const shown = this.session.shown();
    const selection = toShown(shown, this.session.index(), state.selection);
    if (
      selection === null ||
      !this.isOverDiagram(event) ||
      !hasFurther(shown.index, selection, direction)
    ) {
      this.wheelRest = 0;
      return;
    }
    event.preventDefault();
    const pixels =
      event.deltaMode === 1
        ? event.deltaY * 40
        : event.deltaMode === 2
          ? event.deltaY * 400
          : event.deltaY;
    this.wheelRest =
      Math.sign(pixels) === Math.sign(this.wheelRest) ? this.wheelRest + pixels : pixels;
    if (Math.abs(this.wheelRest) >= 50) {
      this.host.run(this.wheelRest > 0 ? 'select.down' : 'select.up');
      this.wheelRest = 0;
    }
  }
}
