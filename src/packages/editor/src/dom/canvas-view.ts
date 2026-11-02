// The diagram area in the DOM (03-editor 1, 3): the document layer, the overlay layer, the inline
// editor, and the pointer, wheel and key input. Outside React (ADR-0010). Everything it decides
// goes through the session or the command registry; this file only translates DOM events.
import type { Box, Id, Locale, RenderedSvg } from '@ariadne-nsd/core';

import { runDrop } from '../commands/drop-command';
import type { Appearance, ContextMenuRequest } from '../contracts';
import { formatMessage } from '../i18n/messages';
import type { DragSource, Drop } from '../input/drop';
import { findDrop } from '../input/drop';
import type { Point } from '../input/hit-test';
import { hitTest, selectionOfHit } from '../input/hit-test';
import { strokeOf } from '../input/keys';
import { ancestorsOf } from '../model/doc-index';
import type { EditorSession } from '../session/session';
import type { Editing, EditField } from '../state/editor-state';
import { clampZoom } from '../state/editor-state';
import type { Selection } from '../state/selection';
import { extendTo, selectBlock, selectedBlocks, targetOf } from '../state/selection';
import { fieldBox, overlayContent, selectionBox } from './overlay';
import { canvasMargin } from './styles';

/** What the view needs. */
export type ViewOptions = {
  readonly host: HTMLElement;
  readonly session: EditorSession;
  readonly run: (id: string, args?: unknown) => void;
  readonly locale: () => Locale;
  readonly appearance: Appearance;
  /** Opens the context menu at a page point (the UI draws it). */
  readonly contextMenu: (request: ContextMenuRequest) => void;
};

/** A press of the primary button that may become a click or a drag. */
type Press = {
  readonly pointerId: number;
  readonly x: number;
  readonly y: number;
  readonly block: Id | null;
  /** A click inside a selected range selects only on release, so the range can be dragged. */
  readonly deferred: Selection | null;
};

type DragState = {
  readonly source: DragSource;
  readonly label: string;
  drop: Drop | null;
  client: Point;
  scrollFrame: number | null;
  /** Window listeners of a drag that came from the toolbar. */
  readonly stop: AbortController | null;
};

/** A press must move this far before it is a drag (03-editor 3.2). */
export const dragThreshold = 4;

/** Dragging this close to the canvas edge scrolls that way (03-editor 3.2). */
export const autoScrollEdge = 32;

const svgNamespace = 'http://www.w3.org/2000/svg';

/**
 * The keys that still run their command while the inline editor is open: they do not type
 * anything, so the text is accepted first (like a click elsewhere) and the command runs.
 */
const editingKeys: ReadonlyMap<string, string> = new Map([
  ['Ctrl+S', 'file.save'],
  ['Ctrl+Shift+S', 'file.saveAs'],
  ['Ctrl+Shift+P', 'edit.commandPalette'],
  ['F1', 'edit.commandPalette'],
]);

function drawingMarkup(svg: RenderedSvg): string {
  return `<svg xmlns="${svgNamespace}" width="${String(svg.width)}" height="${String(svg.height)}" viewBox="${svg.viewBox}"><rect width="100%" height="100%" fill="${svg.paper}"/>${svg.content}</svg>`;
}

/** The diagram area of one editor. */
export class CanvasView {
  readonly canvas: HTMLDivElement;
  private readonly sizer: HTMLDivElement;
  private readonly stage: HTMLDivElement;
  private readonly documentLayer: HTMLDivElement;
  private readonly overlay: SVGSVGElement;
  private readonly editor: HTMLTextAreaElement;
  private readonly dragLabel: HTMLDivElement;
  private readonly events = new AbortController();
  private readonly unsubscribe: () => void;
  private drawn: { rendering: unknown; zoom: number; selection: Selection | null | undefined } = {
    rendering: null,
    zoom: 0,
    selection: undefined,
  };
  private frame: number | null = null;
  private hover: Id | null = null;
  private press: Press | null = null;
  private drag: DragState | null = null;
  private wheelRest = 0;
  private shownEditing: Editing | null = null;

  constructor(private readonly options: ViewOptions) {
    const document = options.host.ownerDocument;
    this.canvas = document.createElement('div');
    this.canvas.className = 'ans-canvas';
    this.canvas.tabIndex = 0;
    this.sizer = document.createElement('div');
    this.sizer.className = 'ans-sizer';
    this.stage = document.createElement('div');
    this.stage.className = 'ans-stage';
    this.documentLayer = document.createElement('div');
    this.documentLayer.className = 'ans-document';
    this.overlay = document.createElementNS(svgNamespace, 'svg');
    this.overlay.setAttribute('class', 'ans-overlay');
    this.overlay.setAttribute('aria-hidden', 'true');
    this.editor = document.createElement('textarea');
    this.editor.className = 'ans-inline-editor';
    this.editor.spellcheck = false;
    this.editor.style.display = 'none';
    this.dragLabel = document.createElement('div');
    this.dragLabel.className = 'ans-drag-label';
    this.dragLabel.style.display = 'none';
    this.stage.append(this.documentLayer, this.overlay, this.editor);
    this.sizer.append(this.stage);
    this.canvas.append(this.sizer, this.dragLabel);
    options.host.append(this.canvas);
    this.setAppearance(options.appearance);
    this.listen();
    this.unsubscribe = options.session.subscribe((state) => {
      // The inline editor opens at once, not at the next frame: keys typed right after `a i`
      // must go into the text, not run as commands on the diagram.
      if (state.editing !== this.shownEditing) {
        this.syncEditor(state.editing);
      }
      this.schedule();
    });
    this.draw();
  }

  private get session(): EditorSession {
    return this.options.session;
  }

  /** The inline editor's text now (to close it from outside, 03-editor 3.4). */
  editorText(): string {
    return this.editor.value;
  }

  /** Gives the keyboard focus to the diagram, or to the inline editor while it is open. */
  focus(): void {
    if (this.session.state.editing !== null && this.shownEditing !== null) {
      this.editor.focus({ preventScroll: true });
      return;
    }
    this.canvas.focus({ preventScroll: true });
  }

  /** Follows the host's brightness (03-editor 6). */
  setAppearance(appearance: Appearance): void {
    this.canvas.dataset.scheme = appearance.scheme;
    this.dragLabel.style.fontFamily = appearance.uiFont;
  }

  private schedule(): void {
    this.frame ??= requestAnimationFrame(() => {
      this.frame = null;
      this.draw();
    });
  }

  /** Draws what changed: the document layer only when the rendering changed (03-editor 1.2). */
  draw(): void {
    if (this.frame !== null) {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }
    const state = this.session.state;
    const rendering = this.session.rendering;
    const svg = rendering.svg;
    const zoom = state.zoom;
    if (rendering !== this.drawn.rendering || zoom !== this.drawn.zoom) {
      if (rendering !== this.drawn.rendering) {
        this.documentLayer.innerHTML = drawingMarkup(svg);
      }
      this.stage.style.width = `${String(svg.width)}px`;
      this.stage.style.height = `${String(svg.height)}px`;
      this.stage.style.transform = `scale(${String(zoom)})`;
      this.sizer.style.width = `${String(svg.width * zoom + 2 * canvasMargin)}px`;
      this.sizer.style.height = `${String(svg.height * zoom + 2 * canvasMargin)}px`;
      this.overlay.setAttribute('width', String(svg.width));
      this.overlay.setAttribute('height', String(svg.height));
      this.overlay.setAttribute('viewBox', svg.viewBox);
      this.drawn = { ...this.drawn, rendering, zoom };
    }
    this.overlay.innerHTML = overlayContent({
      layout: state.layout,
      index: this.session.index(),
      selection: state.selection,
      hover: this.hover,
      drop: this.drag?.drop ?? null,
      dragged: this.drag?.source.kind === 'blocks' ? this.drag.source.blocks : [],
      paper: svg.paper,
    });
    this.canvas.classList.toggle('ans-has-selection', state.selection !== null);
    this.syncEditor(state.editing);
    if (state.selection !== this.drawn.selection) {
      this.drawn = { ...this.drawn, selection: state.selection };
      const box = selectionBox(state.layout, this.session.index(), state.selection);
      if (box !== null && this.drag === null) {
        this.scrollIntoView(box);
      }
    }
  }

  // The inline editor (03-editor 3.4).

  private syncEditor(editing: Editing | null): void {
    if (editing === this.shownEditing) {
      return;
    }
    this.shownEditing = editing;
    if (editing === null) {
      const hadFocus = this.editor.ownerDocument.activeElement === this.editor;
      this.editor.style.display = 'none';
      if (hadFocus) {
        this.focus();
      }
      return;
    }
    const state = this.session.state;
    const box = fieldBox(state.layout, editing.field) ?? { x: 0, y: 0, width: 120, height: 32 };
    const style = this.editor.style;
    style.left = `${String(box.x)}px`;
    style.top = `${String(box.y)}px`;
    style.width = `${String(Math.max(box.width, 60))}px`;
    style.height = `${String(box.height)}px`;
    style.textAlign = this.isCentered(editing.field) ? 'center' : 'left';
    style.display = 'block';
    // A refused header name is drawn as an input that cannot be accepted (visual design 7.1).
    this.editor.classList.toggle('ans-is-rejected', editing.isRejected === true);
    this.editor.placeholder = this.placeholderOf(editing.field);
    this.editor.value = editing.text;
    this.editor.dataset.minHeight = String(box.height);
    this.editor.focus({ preventScroll: true });
    switch (editing.caret) {
      case 'selectAll':
        this.editor.select();
        break;
      case 'start':
        this.editor.setSelectionRange(0, 0);
        break;
      case 'end':
        this.editor.setSelectionRange(editing.text.length, editing.text.length);
        break;
    }
    this.fitEditor();
    this.scrollIntoView(box);
  }

  /** A call block's field says which one it is while empty: "Arguments", "Result". */
  private placeholderOf(field: EditField): string {
    if (field.kind !== 'call') {
      return '';
    }
    const key = field.part === 'args' ? 'field.callArgs' : 'field.callResult';
    return formatMessage(this.options.locale(), key);
  }

  /** If and Case conditions are drawn centered; other text starts at the left. */
  private isCentered(field: EditField): boolean {
    if (field.kind !== 'block') {
      return false;
    }
    const kind = this.session.index().blocks.get(field.block)?.block.kind;
    return kind === 'if' || kind === 'case';
  }

  private fitEditor(): void {
    const minHeight = Number(this.editor.dataset.minHeight ?? '0');
    this.editor.style.height = `${String(minHeight)}px`;
    this.editor.style.height = `${String(Math.max(minHeight, this.editor.scrollHeight))}px`;
  }

  private commitEditor(isFromKey: boolean): void {
    if (this.session.state.editing === null) {
      return;
    }
    const text = this.editor.value;
    if (isFromKey) {
      this.focus();
    }
    this.session.commitEditing(text);
  }

  // Coordinates and scrolling (03-editor 1.1, 3.1).

  /** A client point in drawing coordinates (scroll, zoom and the canvas margin taken off). */
  toDrawing(clientX: number, clientY: number): Point {
    const rect = this.stage.getBoundingClientRect();
    const zoom = this.session.state.zoom;
    return { x: (clientX - rect.left) / zoom, y: (clientY - rect.top) / zoom };
  }

  /** Scrolls the nearest way so a drawing box is in view, like `scrollIntoView({ block: 'nearest' })`. */
  private scrollIntoView(box: Box): void {
    const zoom = this.session.state.zoom;
    const pad = 8;
    const left = canvasMargin + box.x * zoom;
    const top = canvasMargin + box.y * zoom;
    const right = left + box.width * zoom;
    const bottom = top + box.height * zoom;
    const canvas = this.canvas;
    if (left - pad < canvas.scrollLeft) {
      canvas.scrollLeft = left - pad;
    } else if (right + pad > canvas.scrollLeft + canvas.clientWidth) {
      canvas.scrollLeft = Math.min(left - pad, right + pad - canvas.clientWidth);
    }
    if (top - pad < canvas.scrollTop) {
      canvas.scrollTop = top - pad;
    } else if (bottom + pad > canvas.scrollTop + canvas.clientHeight) {
      canvas.scrollTop = Math.min(top - pad, bottom + pad - canvas.clientHeight);
    }
  }

  /**
   * Zooms, keeping a point in place: the pointer for Ctrl+wheel, otherwise the selection, or the
   * middle of the canvas (03-editor 1.1).
   */
  zoomTo(zoom: number, anchor: Point | null = null): void {
    const before = this.session.state.zoom;
    const next = clampZoom(zoom);
    if (next === before) {
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    let ax = this.canvas.clientWidth / 2;
    let ay = this.canvas.clientHeight / 2;
    if (anchor !== null) {
      ax = anchor.x - rect.left;
      ay = anchor.y - rect.top;
    } else {
      const state = this.session.state;
      const box = selectionBox(state.layout, this.session.index(), state.selection);
      if (box !== null) {
        ax = canvasMargin + (box.x + box.width / 2) * before - this.canvas.scrollLeft;
        ay = canvasMargin + (box.y + box.height / 2) * before - this.canvas.scrollTop;
      }
    }
    const drawingX = (this.canvas.scrollLeft + ax - canvasMargin) / before;
    const drawingY = (this.canvas.scrollTop + ay - canvasMargin) / before;
    this.session.setZoom(next);
    this.draw();
    this.canvas.scrollLeft = drawingX * next + canvasMargin - ax;
    this.canvas.scrollTop = drawingY * next + canvasMargin - ay;
  }

  // Input.

  private listen(): void {
    const signal = this.events.signal;
    const canvas = this.canvas;
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
        this.endDrag(false);
      },
      { signal },
    );
    canvas.addEventListener(
      'pointerleave',
      () => {
        if (this.hover !== null) {
          this.hover = null;
          this.schedule();
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
    const editor = this.editor;
    editor.addEventListener(
      'keydown',
      (event) => {
        event.stopPropagation();
        // An Enter that ends an IME composition (Korean input) does not accept (03-editor 3.4).
        const isComposing = event.isComposing;
        // Enter and Esc both accept what was typed (DR-0009); Shift+Enter is a new line.
        if (event.key === 'Enter' && !event.shiftKey && !isComposing) {
          event.preventDefault();
          this.commitEditor(true);
        } else if (event.key === 'Escape' && !isComposing) {
          event.preventDefault();
          if (this.session.state.editing?.isRejected === true) {
            // Only in a field opened again for a clashing name, Esc puts the old name back
            // (interaction rules "Event 헤더", UX Q3).
            this.focus();
            this.session.cancelEditing();
          } else {
            this.commitEditor(true);
          }
        } else if (event.key === 'Tab') {
          event.preventDefault();
          // Tab goes to the other field of a call block (03-keymap).
          if (!isComposing) {
            this.session.switchCallPart(this.editor.value);
          }
        } else {
          // Save, the palette and help keys still work while typing: accept the text, then run.
          const stroke = strokeOf(event);
          const id = stroke === null || isComposing ? undefined : editingKeys.get(stroke);
          if (id !== undefined) {
            event.preventDefault();
            this.commitEditor(true);
            this.options.run(id);
          }
        }
      },
      { signal },
    );
    editor.addEventListener(
      'input',
      () => {
        this.fitEditor();
      },
      { signal },
    );
    editor.addEventListener(
      'blur',
      () => {
        this.commitEditor(false);
      },
      { signal },
    );
    editor.addEventListener(
      'pointerdown',
      (event) => {
        event.stopPropagation();
      },
      { signal },
    );
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.target !== this.canvas) {
      return;
    }
    if (this.drag !== null) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.endDrag(false);
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
  }

  /**
   * Right click: selects what is under the pointer unless it is inside the selection, then asks
   * for the context menu (03-editor 5: `CommandSpec.context`). The empty canvas has no menu.
   */
  private onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    if (this.drag !== null) {
      return;
    }
    if (this.session.state.editing !== null) {
      this.commitEditor(false);
    }
    this.focus();
    const state = this.session.state;
    const index = this.session.index();
    const hit = hitTest(state.layout, index, this.toDrawing(event.clientX, event.clientY));
    if (hit === null) {
      this.session.select(null);
      return;
    }
    const selected = selectedBlocks(index, state.selection);
    const isInSelection =
      hit.kind === 'block' && ancestorsOf(index, hit.block).some((id) => selected.includes(id));
    if (!isInSelection) {
      this.session.select(selectionOfHit(index, hit));
    }
    this.options.contextMenu({ x: event.clientX, y: event.clientY });
  }

  private openContextMenuAtSelection(): void {
    const at = this.selectionAnchor();
    if (at !== null) {
      this.options.contextMenu(at);
    }
  }

  /**
   * The page point just under the selection's left end, where menus opened from the keyboard
   * appear (03-editor 1). `null` when nothing is selected.
   */
  selectionAnchor(): Point | null {
    const state = this.session.state;
    const box = selectionBox(state.layout, this.session.index(), state.selection);
    if (box === null) {
      return null;
    }
    const rect = this.stage.getBoundingClientRect();
    const zoom = state.zoom;
    return {
      x: rect.left + (box.x + Math.min(box.width, 24)) * zoom,
      y: rect.top + (box.y + box.height) * zoom,
    };
  }

  /** The page y of the selection's top edge, for a popup that flips above it. */
  selectionTop(): number | null {
    const state = this.session.state;
    const box = selectionBox(state.layout, this.session.index(), state.selection);
    if (box === null) {
      return null;
    }
    return this.stage.getBoundingClientRect().top + box.y * state.zoom;
  }

  /** The page point near the canvas's top left corner, for a menu when nothing is selected. */
  canvasAnchor(): Point {
    const rect = this.canvas.getBoundingClientRect();
    return { x: rect.left + canvasMargin, y: rect.top + canvasMargin };
  }

  private onPointerDown(event: PointerEvent): void {
    // A click drops a waiting first key (`a`) and its key hint (UX K4).
    this.session.clearPending();
    if (event.button !== 0) {
      return;
    }
    if (this.session.state.editing !== null) {
      this.commitEditor(false);
    }
    this.focus();
    const state = this.session.state;
    const index = this.session.index();
    const hit = hitTest(state.layout, index, this.toDrawing(event.clientX, event.clientY));
    if (hit === null) {
      // The empty canvas clears the selection (interaction rules 2).
      this.session.select(null);
      return;
    }
    const clicked = selectionOfHit(index, hit);
    const selected = selectedBlocks(index, state.selection);
    const isInRange =
      hit.kind === 'block' &&
      selected.length > 1 &&
      ancestorsOf(index, hit.block).some((id) => selected.includes(id));
    if (event.shiftKey && hit.kind === 'block') {
      this.session.select(extendTo(index, state.selection, hit.block));
    } else if (!isInRange) {
      this.session.select(clicked);
    }
    this.press = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      block: hit.kind === 'block' ? hit.block : null,
      deferred: isInRange && !event.shiftKey ? clicked : null,
    };
    this.canvas.setPointerCapture(event.pointerId);
  }

  private onPointerMove(event: PointerEvent): void {
    if (this.drag !== null && this.drag.stop === null) {
      this.moveDrag(event.clientX, event.clientY);
      return;
    }
    const press = this.press;
    if (press !== null && press.pointerId === event.pointerId) {
      const distance = Math.hypot(event.clientX - press.x, event.clientY - press.y);
      if (distance > dragThreshold && press.block !== null && !this.session.state.readOnly) {
        this.startBlocksDrag(press.block, event);
      }
      return;
    }
    const state = this.session.state;
    const hit = hitTest(
      state.layout,
      this.session.index(),
      this.toDrawing(event.clientX, event.clientY),
    );
    const hover = hit?.kind === 'block' ? hit.block : null;
    if (hover !== this.hover) {
      this.hover = hover;
      this.schedule();
    }
  }

  private onPointerUp(event: PointerEvent): void {
    if (this.drag !== null && this.drag.stop === null) {
      this.endDrag(true);
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
    const index = this.session.index();
    const hit = hitTest(state.layout, index, this.toDrawing(event.clientX, event.clientY));
    if (hit === null) {
      return;
    }
    // Double-click edits text everywhere (UX Q2).
    let field: EditField;
    switch (hit.kind) {
      case 'block':
        field = this.session.blockField(hit.block);
        break;
      case 'diagramHead':
        field = { kind: 'head', diagram: hit.diagram };
        break;
      case 'branchLabel':
        field =
          hit.branch === null
            ? { kind: 'missingDefault', block: hit.block }
            : { kind: 'branchLabel', branch: hit.branch };
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

  private onWheel(event: WheelEvent): void {
    if (event.ctrlKey || event.metaKey) {
      // Ctrl+wheel zooms around the pointer (interaction rules 2).
      event.preventDefault();
      const step = event.deltaY < 0 ? 0.1 : -0.1;
      this.zoomTo(this.session.state.zoom + step, { x: event.clientX, y: event.clientY });
      return;
    }
    const state = this.session.state;
    const isVertical = Math.abs(event.deltaY) > Math.abs(event.deltaX);
    if (state.selection === null || state.editing !== null || event.shiftKey || !isVertical) {
      return;
    }
    // With something selected, one wheel notch is one Up or Down (interaction rules 2).
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
      this.options.run(this.wheelRest > 0 ? 'select.down' : 'select.up');
      this.wheelRest = 0;
    }
  }

  // Drag and drop (03-editor 3.2).

  private startBlocksDrag(block: Id, event: PointerEvent): void {
    const index = this.session.index();
    const state = this.session.state;
    const selected = selectedBlocks(index, state.selection);
    const target = targetOf(state.selection);
    let source: DragSource;
    if (target !== null && ancestorsOf(index, block).some((id) => selected.includes(id))) {
      source = { kind: 'blocks', target, blocks: selected };
    } else {
      this.session.select(selectBlock(index, block));
      source = {
        kind: 'blocks',
        target: { kind: 'blocks', first: block, last: block },
        blocks: [block],
      };
    }
    const [first] = source.blocks;
    const firstBlock = first === undefined ? undefined : index.blocks.get(first)?.block;
    const text = firstBlock !== undefined && 'text' in firstBlock ? firstBlock.text : '';
    this.press = null;
    this.beginDrag(source, text.split('\n')[0] ?? '', null, event);
  }

  /** Starts dragging a new block from a toolbar icon (the UI calls this after 4 px). */
  startNewBlockDrag(source: DragSource, label: string, event: PointerEvent): void {
    if (this.session.state.readOnly) {
      this.session.notify('reason.readOnly', 'warn');
      return;
    }
    const stop = new AbortController();
    const window = this.canvas.ownerDocument.defaultView;
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
    this.hover = null;
    this.drag = {
      source,
      label,
      drop: null,
      client: { x: event.clientX, y: event.clientY },
      scrollFrame: null,
      stop,
    };
    this.canvas.classList.add('ans-is-dragging');
    this.moveDrag(event.clientX, event.clientY);
  }

  private moveDrag(clientX: number, clientY: number): void {
    const drag = this.drag;
    if (drag === null) {
      return;
    }
    drag.client = { x: clientX, y: clientY };
    const rect = this.canvas.getBoundingClientRect();
    const isInside =
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom;
    const state = this.session.state;
    drag.drop = isInside
      ? findDrop(
          state.layout,
          this.session.index(),
          this.toDrawing(clientX, clientY),
          drag.source,
          state.selection,
        )
      : null;
    this.canvas.classList.toggle('ans-cannot-drop', drag.drop === null);
    const wraps = drag.drop?.wraps ?? null;
    const label =
      wraps === null ? drag.label : formatMessage(this.options.locale(), `drag.wrap.${wraps}`);
    this.dragLabel.textContent = label;
    this.dragLabel.style.display = label === '' ? 'none' : 'block';
    this.dragLabel.style.left = `${String(clientX + 14)}px`;
    this.dragLabel.style.top = `${String(clientY + 14)}px`;
    if (isInside && drag.scrollFrame === null) {
      this.autoScroll();
    }
    this.schedule();
  }

  private autoScroll(): void {
    const drag = this.drag;
    if (drag === null) {
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
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
    this.canvas.scrollBy(dx, dy);
    drag.scrollFrame = requestAnimationFrame(() => {
      if (this.drag === drag) {
        drag.scrollFrame = null;
        this.moveDrag(drag.client.x, drag.client.y);
      }
    });
  }

  /** Ends a drag; `isDrop` runs what the drop place says, otherwise nothing happens. */
  private endDrag(isDrop: boolean): void {
    const drag = this.drag;
    if (drag === null) {
      return;
    }
    this.drag = null;
    drag.stop?.abort();
    if (drag.scrollFrame !== null) {
      cancelAnimationFrame(drag.scrollFrame);
    }
    this.canvas.classList.remove('ans-is-dragging', 'ans-cannot-drop');
    this.dragLabel.style.display = 'none';
    if (isDrop && drag.drop !== null) {
      runDrop(this.session, drag.drop.action);
      this.focus();
    }
    this.schedule();
  }

  /** Removes the view and its listeners. */
  dispose(): void {
    this.endDrag(false);
    this.events.abort();
    this.unsubscribe();
    if (this.frame !== null) {
      cancelAnimationFrame(this.frame);
    }
    this.canvas.remove();
  }
}
