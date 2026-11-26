// The diagram area in the DOM (03-editor 1, 3): the document layer, the overlay layer, zoom and
// scrolling. Outside React (ADR-0010). The input (canvas-input.ts), drag and drop (canvas-drag.ts)
// and the inline editor (inline-editor.ts) are parts of it; everything they decide goes through
// the session or the command registry.
import type { Box, Id, Locale } from '@ariadne-nsd/core';
import { themeFor } from '@ariadne-nsd/core';

import type { Appearance, ContextMenuRequest } from '../contracts';
import type { DragSource } from '../input/drop';
import type { Point } from '../input/hit-test';
import type { EditorSession } from '../session/session';
import { clampZoom } from '../state/editor-state';
import type { Selection } from '../state/selection';
import { CanvasDrag } from './canvas-drag';
import { CanvasInput } from './canvas-input';
import type { EditColors } from './overlay';
import { editColorsFor, overlayContent, selectionBox } from './overlay';
import { InlineEditor } from './inline-editor';
import { snapCrispElements, snapCrispStrokes } from './crisp-lines';
import { DocumentLayer } from './document-layer';
import { canvasMargin } from './styles';

export { autoScrollEdge, dragThreshold } from './canvas-drag';

/** What the view needs. */
export type ViewOptions = {
  readonly host: HTMLElement;
  readonly session: EditorSession;
  readonly run: (id: string, args?: unknown) => void;
  readonly locale: () => Locale;
  readonly appearance: Appearance;
  /** Opens the context menu at a page point (the UI draws it). */
  readonly contextMenu: (request: ContextMenuRequest) => void;
  /** The preference: keep the canvas focus outline while nothing is selected (UX CF2). */
  readonly isFocusOutlineKept: () => boolean;
};

const svgNamespace = 'http://www.w3.org/2000/svg';

/** The diagram area of one editor. */
export class CanvasView {
  readonly canvas: HTMLDivElement;
  private readonly sizer: HTMLDivElement;
  private readonly stage: HTMLDivElement;
  private readonly documentLayer: HTMLDivElement;
  private readonly layer: DocumentLayer;
  private readonly overlay: SVGSVGElement;
  private readonly inlineEditor: InlineEditor;
  private readonly dragLabel: HTMLDivElement;
  private readonly drag: CanvasDrag;
  private readonly input: CanvasInput;
  private readonly events = new AbortController();
  private readonly unsubscribe: () => void;
  private drawn: {
    rendering: unknown;
    zoom: number;
    /** Device pixels per drawing unit that the crisp lines were snapped to. */
    scale: number;
    selection: Selection | null | undefined;
  } = {
    rendering: null,
    zoom: 0,
    scale: 0,
    selection: undefined,
  };
  private frame: number | null = null;
  /** The theme setting `applyTheme` last applied. */
  private appliedTheme: string | null = null;
  /** The overlay's markup now: an unchanged overlay is not parsed again (hover, drag). */
  private overlayMarkup: string | null = null;
  private hover: Id | null = null;
  private editColors: EditColors = editColorsFor('light');

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
    this.layer = new DocumentLayer(this.documentLayer);
    this.overlay = document.createElementNS(svgNamespace, 'svg');
    this.overlay.setAttribute('class', 'ans-overlay');
    this.overlay.setAttribute('aria-hidden', 'true');
    this.inlineEditor = new InlineEditor(document, {
      session: options.session,
      locale: options.locale,
      run: options.run,
      focus: () => {
        this.focus();
      },
      scrollIntoView: (box) => {
        this.scrollIntoView(box);
      },
    });
    this.dragLabel = document.createElement('div');
    this.dragLabel.className = 'ans-drag-label';
    this.dragLabel.style.display = 'none';
    this.stage.append(this.documentLayer, this.overlay, this.inlineEditor.element);
    this.sizer.append(this.stage);
    this.canvas.append(this.sizer, this.dragLabel);
    options.host.append(this.canvas);
    this.drag = new CanvasDrag({
      canvas: this.canvas,
      dragLabel: this.dragLabel,
      session: options.session,
      locale: options.locale,
      toDrawing: (clientX, clientY) => this.toDrawing(clientX, clientY),
      schedule: () => {
        this.schedule();
      },
      focus: () => {
        this.focus();
      },
      clearHover: () => {
        this.hover = null;
      },
    });
    this.input = new CanvasInput({
      canvas: this.canvas,
      session: options.session,
      run: options.run,
      contextMenu: options.contextMenu,
      drag: this.drag,
      inlineEditor: this.inlineEditor,
      focus: () => {
        this.focus();
      },
      toDrawing: (clientX, clientY) => this.toDrawing(clientX, clientY),
      zoomTo: (zoom, anchor) => {
        this.zoomTo(zoom, anchor);
      },
      selectionAnchor: () => this.selectionAnchor(),
      schedule: () => {
        this.schedule();
      },
      hover: () => this.hover,
      setHover: (block) => {
        this.hover = block;
      },
    });
    this.setAppearance(options.appearance);
    this.input.listen(this.events.signal);
    this.watchPixelRatio();
    this.unsubscribe = options.session.subscribe((state) => {
      // The inline editor opens at once, not at the next frame: keys typed right after `a i`
      // must go into the text, not run as commands on the diagram.
      if (state.editing !== this.inlineEditor.shown) {
        this.inlineEditor.sync(state.editing);
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
    return this.inlineEditor.text();
  }

  /** Gives the keyboard focus to the diagram, or to the inline editor while it is open. */
  focus(): void {
    if (this.session.state.editing !== null && this.inlineEditor.shown !== null) {
      this.inlineEditor.focus();
      return;
    }
    this.canvas.focus({ preventScroll: true });
  }

  /**
   * The inline editor and the edit layer follow the document's theme: they are drawn on the
   * paper (visual design 3.4, UX TM4). Set whenever the drawing changes to another theme.
   */
  private applyTheme(): void {
    const setting = this.session.state.doc.content.settings.theme;
    if (setting === this.appliedTheme) {
      return;
    }
    this.appliedTheme = setting;
    const theme = themeFor(setting);
    this.editColors = editColorsFor(theme.kind);
    const style = this.canvas.style;
    style.setProperty('--ans-edit-field', this.editColors['edit.field']);
    style.setProperty('--ans-edit-error', this.editColors['edit.error']);
    style.setProperty('--ans-field-paper', theme.colors.paper);
    style.setProperty('--ans-field-text', theme.colors['text.primary']);
    style.setProperty('--ans-field-muted', theme.colors['text.muted']);
    this.canvas.dataset.theme = theme.id;
  }

  /** Follows the host's brightness (03-editor 6). */
  setAppearance(appearance: Appearance): void {
    this.canvas.dataset.scheme = appearance.scheme;
    this.dragLabel.style.fontFamily = appearance.uiFont;
  }

  /** Device pixels per CSS pixel: browser zoom and display scaling. */
  private pixelRatio(): number {
    return this.canvas.ownerDocument.defaultView?.devicePixelRatio ?? 1;
  }

  /**
   * Draws again when the device pixel ratio changes (browser zoom, a move to another display), so
   * the lines are snapped to the new pixels. A media query matches only one ratio, so each change
   * watches the next one.
   */
  private watchPixelRatio(): void {
    const window = this.canvas.ownerDocument.defaultView;
    if (window === null || typeof window.matchMedia !== 'function') {
      return;
    }
    const query = window.matchMedia(`(resolution: ${String(window.devicePixelRatio)}dppx)`);
    query.addEventListener(
      'change',
      () => {
        this.watchPixelRatio();
        this.schedule();
      },
      { once: true, signal: this.events.signal },
    );
  }

  private schedule(): void {
    this.frame ??= requestAnimationFrame(() => {
      this.frame = null;
      this.draw();
    });
  }

  /** Draws what changed: the document layer only when the rendering changed (03-editor 1.2). */
  draw(): void {
    this.session.time('dom', () => {
      this.drawNow();
    });
  }

  private drawNow(): void {
    if (this.frame !== null) {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }
    const state = this.session.state;
    const rendering = this.session.rendering;
    const svg = rendering.svg;
    const zoom = state.zoom;
    const isNewRendering = rendering !== this.drawn.rendering;
    // The elements the new rendering added or changed; `null`: all of them.
    let changed: ReadonlyArray<Element> | null = [];
    if (isNewRendering || zoom !== this.drawn.zoom) {
      if (isNewRendering) {
        changed = this.layer.draw(svg);
        this.applyTheme();
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
    // Lines of one width at any zoom and device pixel ratio (crisp-lines.ts).
    const scale = zoom * this.pixelRatio();
    if (scale !== this.drawn.scale || changed === null) {
      snapCrispStrokes(this.documentLayer, scale);
      this.drawn = { ...this.drawn, scale };
    } else {
      snapCrispElements(changed, scale);
    }
    const drag = this.drag.current;
    const overlayMarkup = overlayContent({
      layout: state.layout,
      index: this.session.index(),
      selection: state.selection,
      editing: state.editing?.field ?? null,
      hover: this.hover,
      drop: drag?.drop ?? null,
      dragged: drag?.source.kind === 'blocks' ? drag.source.blocks : [],
      paper: svg.paper,
      edit: this.editColors,
    });
    if (overlayMarkup !== this.overlayMarkup) {
      this.overlay.innerHTML = overlayMarkup;
      this.overlayMarkup = overlayMarkup;
    }
    this.canvas.classList.toggle('ans-has-selection', state.selection !== null);
    this.canvas.classList.toggle('ans-focus-kept', this.options.isFocusOutlineKept());
    this.inlineEditor.sync(state.editing);
    if (state.selection !== this.drawn.selection) {
      this.drawn = { ...this.drawn, selection: state.selection };
      const box = selectionBox(state.layout, this.session.index(), state.selection);
      if (box !== null && this.drag.current === null) {
        this.scrollIntoView(box);
      }
    }
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

  /** Starts dragging a new block from a toolbar icon (the UI calls this after 4 px). */
  startNewBlockDrag(source: DragSource, label: string, event: PointerEvent): void {
    this.drag.startNewBlockDrag(source, label, event);
  }

  /** Removes the view and its listeners. */
  dispose(): void {
    this.input.dispose();
    this.drag.endDrag(false);
    this.events.abort();
    this.unsubscribe();
    if (this.frame !== null) {
      cancelAnimationFrame(this.frame);
    }
    this.canvas.remove();
  }
}
