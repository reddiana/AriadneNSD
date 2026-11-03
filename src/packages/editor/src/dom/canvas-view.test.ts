// @vitest-environment happy-dom
// The diagram area (03-editor 1, 3): clicks, drag and drop, wheel, focus, scrolling and the inline editor as DOM events.
import type { Box, Content } from '@ariadne-nsd/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ContextMenuRequest } from '../contracts';
import type { TestEngine } from '../engine-test-support';
import {
  arm,
  branch,
  caseBlock,
  contentOf,
  ifBlock,
  proc,
  testEngine,
} from '../engine-test-support';
import { selectBlock, selectRange } from '../state/selection';
import { CanvasView } from './canvas-view';
import { canvasMargin } from './styles';

type Made = {
  readonly engine: TestEngine;
  readonly view: CanvasView;
  readonly host: HTMLElement;
  readonly canvas: HTMLDivElement;
  readonly runs: string[];
  readonly menus: ContextMenuRequest[];
};

const views: CanvasView[] = [];

/** A view on a content. The stage sits at the page origin (happy-dom has no layout). */
function make(content: Content, options: { readonly isFocusOutlineKept?: boolean } = {}): Made {
  const engine = testEngine(content);
  const host = document.createElement('div');
  document.body.append(host);
  const runs: string[] = [];
  const menus: ContextMenuRequest[] = [];
  const view = new CanvasView({
    host,
    session: engine.session,
    run: (id, args) => {
      runs.push(id);
      engine.run(id, args);
    },
    locale: () => 'en',
    appearance: { scheme: 'light', uiFont: 'sans-serif' },
    contextMenu: (request) => menus.push(request),
    isFocusOutlineKept: () => options.isFocusOutlineKept === true,
  });
  views.push(view);
  // The canvas is a 1000 × 600 box at the page origin, so drags inside it can drop.
  const canvas = view.canvas;
  canvas.getBoundingClientRect = () => new DOMRect(0, 0, 1000, 600);
  Object.defineProperty(canvas, 'clientWidth', { value: 1000, configurable: true });
  Object.defineProperty(canvas, 'clientHeight', { value: 600, configurable: true });
  return { engine, view, host, canvas, runs, menus };
}

afterEach(() => {
  for (const view of views.splice(0)) {
    view.dispose();
  }
  document.body.innerHTML = '';
  vi.useRealTimers();
});

function boxOf(made: Made, id: string): Box {
  const box = made.engine.session.state.layout.boxes.get(id);
  if (box === undefined) throw new Error(`no box ${id}`);
  return box;
}

/** The middle of a block, in client coordinates (the stage is at the origin, zoom 1). */
function middleOf(made: Made, id: string): { clientX: number; clientY: number } {
  const box = boxOf(made, id);
  return { clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 };
}

const nowhere = { clientX: 990, clientY: 590 };

function pointer(
  target: EventTarget,
  type: string,
  at: { clientX: number; clientY: number },
  init: PointerEventInit = {},
): PointerEvent {
  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    button: 0,
    ...at,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

function key(target: EventTarget, init: KeyboardEventInit): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

function wheel(target: EventTarget, init: WheelEventInit): WheelEvent {
  const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init });
  // happy-dom drops the modifier keys of a WheelEvent.
  for (const name of ['ctrlKey', 'metaKey', 'shiftKey'] as const) {
    Object.defineProperty(event, name, { value: init[name] === true });
  }
  target.dispatchEvent(event);
  return event;
}

function editorOf(made: Made): HTMLTextAreaElement {
  const textarea = made.host.querySelector('textarea');
  if (textarea === null) throw new Error('no inline editor');
  return textarea;
}

const blockIds = (made: Made): string[] =>
  (made.engine.content().diagrams[0]?.body.blocks ?? []).map((b) => b.id);

const three = (): Content => contentOf([proc('b1'), proc('b2'), proc('b3')]);

describe('CanvasView: the layers', () => {
  it('T-0586: builds the canvas in the host with the document, the overlay and a hidden inline editor', () => {
    const made = make(three());
    expect(made.host.querySelector('.ans-canvas')).toBe(made.canvas);
    expect(made.canvas.tabIndex).toBe(0);
    expect(made.canvas.dataset.scheme).toBe('light');
    expect(made.host.querySelector('.ans-document svg rect')?.getAttribute('fill')).toBe(
      made.engine.session.rendering.svg.paper,
    );
    expect(made.host.querySelector('.ans-overlay')?.getAttribute('aria-hidden')).toBe('true');
    expect(editorOf(made).style.display).toBe('none');
  });

  it('T-0587: follows the host appearance', () => {
    const made = make(three());
    made.view.setAppearance({ scheme: 'dark', uiFont: 'serif' });
    expect(made.canvas.dataset.scheme).toBe('dark');
  });

  it('T-0588: marks whether something is selected and whether the focus outline is kept', () => {
    const made = make(three(), { isFocusOutlineKept: true });
    made.view.draw();
    expect(made.canvas.classList.contains('ans-has-selection')).toBe(false);
    expect(made.canvas.classList.contains('ans-focus-kept')).toBe(true);
    made.engine.select(selectBlock(made.engine.session.index(), 'b1'));
    made.view.draw();
    expect(made.canvas.classList.contains('ans-has-selection')).toBe(true);
  });

  it('T-0589: sizes the stage by the drawing and the zoom, with the canvas margin around it', () => {
    const made = make(three());
    const { width, height } = made.engine.session.rendering.svg;
    made.engine.session.setZoom(2);
    made.view.draw();
    const stage = made.host.querySelector<HTMLElement>('.ans-stage');
    const sizer = made.host.querySelector<HTMLElement>('.ans-sizer');
    expect(stage?.style.transform).toBe('scale(2)');
    expect(stage?.style.width).toBe(`${String(width)}px`);
    expect(sizer?.style.width).toBe(`${String(width * 2 + 2 * canvasMargin)}px`);
    expect(sizer?.style.height).toBe(`${String(height * 2 + 2 * canvasMargin)}px`);
  });

  it('T-0590: dispose removes the canvas and stops listening', () => {
    const made = make(three());
    const canvas = made.canvas;
    made.view.dispose();
    views.splice(views.indexOf(made.view), 1);
    expect(made.host.querySelector('.ans-canvas')).toBeNull();
    pointer(canvas, 'pointerdown', middleOf(made, 'b2'));
    expect(made.engine.session.state.selection).toBeNull();
  });
});

describe('CanvasView: clicks (interaction rules 2)', () => {
  it('T-0591: a click on a block selects it and focuses the canvas', () => {
    const made = make(three());
    pointer(made.canvas, 'pointerdown', middleOf(made, 'b2'));
    expect(made.engine.session.state.selection).toMatchObject({ anchor: 'b2', focus: 'b2' });
    expect(document.activeElement).toBe(made.canvas);
  });

  it('T-0592 · UX CF2: a click on the empty canvas clears the selection and flashes the focus outline for a second', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const made = make(three());
    made.engine.select(selectBlock(made.engine.session.index(), 'b1'));
    pointer(made.canvas, 'pointerdown', nowhere);
    expect(made.engine.session.state.selection).toBeNull();
    expect(made.canvas.classList.contains('ans-focus-flash')).toBe(true);
    vi.advanceTimersByTime(999);
    expect(made.canvas.classList.contains('ans-focus-flash')).toBe(true);
    vi.advanceTimersByTime(1);
    expect(made.canvas.classList.contains('ans-focus-flash')).toBe(false);
  });

  it('T-0593 · UX CF2: a second flash restarts the second', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const made = make(three());
    pointer(made.canvas, 'pointerdown', nowhere);
    vi.advanceTimersByTime(600);
    pointer(made.canvas, 'pointerdown', nowhere);
    vi.advanceTimersByTime(600);
    expect(made.canvas.classList.contains('ans-focus-flash')).toBe(true);
    vi.advanceTimersByTime(400);
    expect(made.canvas.classList.contains('ans-focus-flash')).toBe(false);
  });

  it('T-0594 · UX CF2: with a selection, focusing the canvas does not flash the outline', () => {
    const made = make(three());
    made.engine.select(selectBlock(made.engine.session.index(), 'b1'));
    made.canvas.dispatchEvent(new FocusEvent('focus'));
    expect(made.canvas.classList.contains('ans-focus-flash')).toBe(false);
  });

  it('T-0595 · UX K4: any button drops a waiting first key; only the primary button selects', () => {
    const made = make(three());
    made.engine.select(selectBlock(made.engine.session.index(), 'b1'));
    key(made.canvas, { code: 'KeyA' });
    expect(made.engine.session.state.pendingKeys).not.toBeNull();
    pointer(made.canvas, 'pointerdown', middleOf(made, 'b3'), { button: 2 });
    expect(made.engine.session.state.pendingKeys).toBeNull();
    expect(made.engine.session.state.selection).toMatchObject({ anchor: 'b1' });
  });

  it('T-0596 · R-EDIT-05: a shift click extends the selection to the clicked block', () => {
    const made = make(three());
    made.engine.select(selectBlock(made.engine.session.index(), 'b1'));
    pointer(made.canvas, 'pointerdown', middleOf(made, 'b3'), { shiftKey: true });
    expect(made.engine.session.state.selection).toMatchObject({ anchor: 'b1', focus: 'b3' });
  });

  it('T-0597: a click inside a selected range keeps the range until release, then selects the clicked block', () => {
    const made = make(three());
    made.engine.select(selectRange(made.engine.session.index(), 'b1', 'b3'));
    pointer(made.canvas, 'pointerdown', middleOf(made, 'b2'));
    expect(made.engine.session.state.selection).toMatchObject({ anchor: 'b1', focus: 'b3' });
    pointer(made.canvas, 'pointerup', middleOf(made, 'b2'));
    expect(made.engine.session.state.selection).toMatchObject({ anchor: 'b2', focus: 'b2' });
  });

  it('T-0598: a click on a block commits the open inline editor first', () => {
    const made = make(three());
    made.engine.select(selectBlock(made.engine.session.index(), 'b1'));
    key(made.canvas, { code: 'KeyI' });
    editorOf(made).value = 'typed';
    pointer(made.canvas, 'pointerdown', middleOf(made, 'b3'));
    expect(made.engine.session.state.editing).toBeNull();
    const first = made.engine.content().diagrams[0]?.body.blocks[0];
    expect(first?.kind === 'process' ? first.text : null).toBe('typed');
    expect(made.engine.session.state.selection).toMatchObject({ anchor: 'b3' });
  });

  it('T-0599: the hover outline follows the pointer and goes when it leaves the canvas', () => {
    const made = make(three());
    const overlay = made.host.querySelector('.ans-overlay');
    pointer(made.canvas, 'pointermove', middleOf(made, 'b2'));
    made.view.draw();
    expect(overlay?.innerHTML).toContain('stroke-width="1"');
    made.canvas.dispatchEvent(new PointerEvent('pointerleave'));
    made.view.draw();
    expect(overlay?.innerHTML).toBe('');
  });
});

describe('CanvasView: double click (UX Q2)', () => {
  it('T-0600 · R-EDIT-01: a double click on a block opens its text with all of it selected', () => {
    const made = make(three());
    made.canvas.dispatchEvent(
      new MouseEvent('dblclick', { ...middleOf(made, 'b2'), bubbles: true }),
    );
    expect(made.engine.session.state.editing).toMatchObject({
      field: { kind: 'block', block: 'b2' },
      caret: 'selectAll',
    });
    const textarea = editorOf(made);
    expect(textarea.style.display).toBe('block');
    expect(textarea.value).toBe('b2');
    expect(document.activeElement).toBe(textarea);
    expect(textarea.selectionStart).toBe(0);
    expect(textarea.selectionEnd).toBe(2);
  });

  it('T-0601: a double click on the empty canvas opens nothing', () => {
    const made = make(three());
    made.canvas.dispatchEvent(new MouseEvent('dblclick', { ...nowhere, bubbles: true }));
    expect(made.engine.session.state.editing).toBeNull();
  });

  it('T-0602 · R-EDIT-12: a double click on a branch label opens the label; on the missing default, that cell', () => {
    const made = make(
      contentOf([
        ifBlock('i1', branch('y', [proc('p1')]), branch('n', [proc('p2')])),
        caseBlock('c1', [arm('a1', '1', [proc('p3')])], null),
      ]),
    );
    const regions = made.engine.session.state.layout.regions;
    const label = regions.find((r) => r.kind === 'branchLabel' && r.branchId === 'y');
    const missing = regions.find((r) => r.kind === 'missingDefault' && r.blockId === 'c1');
    if (label === undefined || missing === undefined) throw new Error('no regions');
    const at = (box: Box) => ({ clientX: box.x + 2, clientY: box.y + box.height / 2 });
    made.canvas.dispatchEvent(new MouseEvent('dblclick', { ...at(label.box), bubbles: true }));
    expect(made.engine.session.state.editing?.field).toEqual({ kind: 'branchLabel', branch: 'y' });
    key(editorOf(made), { key: 'Enter' });
    made.canvas.dispatchEvent(new MouseEvent('dblclick', { ...at(missing.box), bubbles: true }));
    expect(made.engine.session.state.editing?.field).toEqual({
      kind: 'missingDefault',
      block: 'c1',
    });
  });

  it("T-0603: a double click on a diagram's header opens its name", () => {
    const base = three();
    const made = make({
      ...base,
      diagrams: base.diagrams.map((d) => ({ ...d, head: { kind: 'event', text: 'click' } })),
    });
    const node = made.engine.session.state.layout.nodes.find((n) => n.kind === 'diagramHead');
    if (node === undefined) throw new Error('no header');
    made.canvas.dispatchEvent(
      new MouseEvent('dblclick', {
        clientX: node.box.x + node.box.width / 2,
        clientY: node.box.y + node.box.height / 2,
        bubbles: true,
      }),
    );
    expect(made.engine.session.state.editing?.field).toEqual({ kind: 'head', diagram: 'd1' });
    expect(editorOf(made).value).toBe('click');
  });

  it('T-0604: in view only a double click opens nothing and the status bar says why', () => {
    const made = make(three());
    made.engine.session.setReadOnly(true);
    made.canvas.dispatchEvent(
      new MouseEvent('dblclick', { ...middleOf(made, 'b1'), bubbles: true }),
    );
    expect(made.engine.session.state.editing).toBeNull();
    expect(made.engine.session.chrome().notice).toMatchObject({ level: 'warn' });
  });
});

describe('CanvasView: the context menu (03-editor 5)', () => {
  it('T-0605 · UX CM1: a right click on the empty canvas clears the selection and asks for the menu there', () => {
    const made = make(three());
    made.engine.select(selectBlock(made.engine.session.index(), 'b1'));
    const event = new MouseEvent('contextmenu', { ...nowhere, bubbles: true, cancelable: true });
    made.canvas.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(made.engine.session.state.selection).toBeNull();
    expect(made.menus).toEqual([{ x: nowhere.clientX, y: nowhere.clientY }]);
  });

  it('T-0606: a right click inside the selection keeps the selection', () => {
    const made = make(three());
    made.engine.select(selectRange(made.engine.session.index(), 'b1', 'b3'));
    made.canvas.dispatchEvent(
      new MouseEvent('contextmenu', { ...middleOf(made, 'b2'), bubbles: true, cancelable: true }),
    );
    expect(made.engine.session.state.selection).toMatchObject({ anchor: 'b1', focus: 'b3' });
    expect(made.menus).toHaveLength(1);
  });

  it('T-0607: a right click while typing accepts the text first', () => {
    const made = make(three());
    made.engine.select(selectBlock(made.engine.session.index(), 'b1'));
    key(made.canvas, { code: 'KeyI' });
    editorOf(made).value = 'typed';
    made.canvas.dispatchEvent(
      new MouseEvent('contextmenu', { ...middleOf(made, 'b3'), bubbles: true, cancelable: true }),
    );
    expect(made.engine.session.state.editing).toBeNull();
    const first = made.engine.content().diagrams[0]?.body.blocks[0];
    expect(first?.kind === 'process' ? first.text : null).toBe('typed');
    expect(made.engine.session.state.selection).toMatchObject({ anchor: 'b3' });
    expect(made.menus).toHaveLength(1);
  });

  it('T-0608: a right click during a drag opens no menu', () => {
    const made = make(three());
    pointer(made.canvas, 'pointerdown', middleOf(made, 'b1'));
    pointer(made.canvas, 'pointermove', middleOf(made, 'b3'));
    const event = new MouseEvent('contextmenu', {
      ...middleOf(made, 'b3'),
      bubbles: true,
      cancelable: true,
    });
    made.canvas.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(made.menus).toEqual([]);
  });

  it('T-0609: the ContextMenu key and Shift+F10 open the menu under the selection; with nothing selected, no menu', () => {
    const made = make(three());
    key(made.canvas, { key: 'ContextMenu', code: 'ContextMenu' });
    expect(made.menus).toEqual([]);
    made.engine.select(selectBlock(made.engine.session.index(), 'b2'));
    const box = boxOf(made, 'b2');
    const anchor = { x: box.x + Math.min(box.width, 24), y: box.y + box.height };
    expect(made.view.selectionAnchor()).toEqual(anchor);
    key(made.canvas, { key: 'ContextMenu', code: 'ContextMenu' });
    key(made.canvas, { key: 'F10', code: 'F10', shiftKey: true });
    expect(made.menus).toEqual([anchor, anchor]);
  });

  it('T-0610: the anchors for popups: the top of the selection and the canvas corner', () => {
    const made = make(three());
    expect(made.view.selectionTop()).toBeNull();
    expect(made.view.selectionAnchor()).toBeNull();
    made.engine.select(selectBlock(made.engine.session.index(), 'b3'));
    expect(made.view.selectionTop()).toBe(boxOf(made, 'b3').y);
    expect(made.view.canvasAnchor()).toEqual({ x: canvasMargin, y: canvasMargin });
  });
});

describe('CanvasView: keys on the canvas', () => {
  it('T-0611: a used key stops the browser action; a key from a child element is ignored', () => {
    const made = make(three());
    made.engine.select(selectBlock(made.engine.session.index(), 'b1'));
    expect(key(made.canvas, { key: 'ArrowDown', code: 'ArrowDown' }).defaultPrevented).toBe(true);
    expect(made.engine.session.state.selection).toMatchObject({ anchor: 'b2' });
    const child = made.host.querySelector('.ans-stage');
    if (child === null) throw new Error('no stage');
    key(child, { key: 'ArrowDown', code: 'ArrowDown' });
    expect(made.engine.session.state.selection).toMatchObject({ anchor: 'b2' });
  });

  it('T-0612 · UX CF2: a key that leaves nothing selected flashes the focus outline', () => {
    const made = make(three());
    made.engine.select(selectBlock(made.engine.session.index(), 'b1'));
    key(made.canvas, { key: 'Escape', code: 'Escape' });
    key(made.canvas, { key: 'Escape', code: 'Escape' });
    expect(made.engine.session.state.selection).toBeNull();
    expect(made.canvas.classList.contains('ans-focus-flash')).toBe(true);
  });

  it('T-0613: leaving the canvas drops a waiting first key', () => {
    const made = make(three());
    made.engine.select(selectBlock(made.engine.session.index(), 'b1'));
    key(made.canvas, { code: 'KeyA' });
    made.canvas.dispatchEvent(new FocusEvent('blur'));
    expect(made.engine.session.state.pendingKeys).toBeNull();
  });
});

describe('CanvasView: the inline editor (03-editor 3.4)', () => {
  function editing(made: Made): HTMLTextAreaElement {
    made.engine.select(selectBlock(made.engine.session.index(), 'b1'));
    key(made.canvas, { code: 'KeyI' });
    return editorOf(made);
  }

  it('T-0614: DR-0009: Esc accepts what was typed, like Enter, and gives the focus back to the canvas', () => {
    const made = make(three());
    const textarea = editing(made);
    textarea.value = 'x';
    key(textarea, { key: 'Escape' });
    expect(made.engine.session.state.editing).toBeNull();
    const first = made.engine.content().diagrams[0]?.body.blocks[0];
    expect(first?.kind === 'process' ? first.text : null).toBe('x');
    expect(textarea.style.display).toBe('none');
    expect(document.activeElement).toBe(made.canvas);
  });

  it('T-0615: Shift+Enter is a new line and an Enter that ends an IME composition does not accept', () => {
    const made = make(three());
    const textarea = editing(made);
    expect(key(textarea, { key: 'Enter', shiftKey: true }).defaultPrevented).toBe(false);
    key(textarea, { key: 'Enter', isComposing: true });
    key(textarea, { key: 'Escape', isComposing: true });
    expect(made.engine.session.state.editing).not.toBeNull();
  });

  it('T-0616: keys typed in the editor do not reach the canvas', () => {
    const made = make(three());
    const textarea = editing(made);
    const seen: string[] = [];
    made.canvas.addEventListener('keydown', (event) => seen.push(event.key));
    key(textarea, { key: 'j', code: 'KeyJ' });
    expect(seen).toEqual([]);
  });

  it('T-0617: F1 while typing accepts the text and opens the command palette', () => {
    const made = make(three());
    const textarea = editing(made);
    textarea.value = 'y';
    expect(key(textarea, { key: 'F1', code: 'F1' }).defaultPrevented).toBe(true);
    expect(made.runs).toEqual(['edit.commandPalette']);
    expect(made.engine.session.state.editing).toBeNull();
    const first = made.engine.content().diagrams[0]?.body.blocks[0];
    expect(first?.kind === 'process' ? first.text : null).toBe('y');
  });

  it('T-0618: Tab stays in the editor of a block that is not a call', () => {
    const made = make(three());
    const textarea = editing(made);
    expect(key(textarea, { key: 'Tab', code: 'Tab' }).defaultPrevented).toBe(true);
    expect(made.engine.session.state.editing?.field).toEqual({ kind: 'block', block: 'b1' });
  });

  it('T-0619: a press inside the editor stays in the editor', () => {
    const made = make(three());
    const textarea = editing(made);
    pointer(textarea, 'pointerdown', { clientX: 0, clientY: 0 });
    expect(made.engine.session.state.editing).not.toBeNull();
  });

  it('T-0620: typing keeps the editor at least as high as its field', () => {
    const made = make(three());
    const textarea = editing(made);
    const height = textarea.style.height;
    textarea.value = 'a\nb';
    textarea.dispatchEvent(new Event('input'));
    expect(textarea.style.height).toBe(height);
    expect(height).toBe(`${String(boxOf(made, 'b1').height)}px`);
  });

  it('T-0621: Tab during an IME composition does not switch fields', () => {
    const made = make(three());
    const textarea = editing(made);
    expect(key(textarea, { key: 'Tab', isComposing: true }).defaultPrevented).toBe(true);
    expect(made.engine.session.state.editing?.field).toEqual({ kind: 'block', block: 'b1' });
  });

  it('T-0622: leaving the editor accepts the text', () => {
    const made = make(three());
    const textarea = editing(made);
    textarea.value = 'z';
    textarea.dispatchEvent(new FocusEvent('blur'));
    expect(made.engine.session.state.editing).toBeNull();
    const first = made.engine.content().diagrams[0]?.body.blocks[0];
    expect(first?.kind === 'process' ? first.text : null).toBe('z');
  });

  it('T-0623: an If condition is centered and the caret goes to the end of a new block', () => {
    const made = make(
      contentOf([ifBlock('i1', branch('y', [proc('p1')]), branch('n', [proc('p2')]))]),
    );
    made.engine.session.startEditing({ kind: 'block', block: 'i1' }, 'end');
    const textarea = editorOf(made);
    expect(textarea.style.textAlign).toBe('center');
    expect(textarea.selectionStart).toBe(1);
    expect(textarea.selectionEnd).toBe(1);
    key(textarea, { key: 'Enter' });
    made.engine.session.startEditing({ kind: 'block', block: 'p1' }, 'start');
    expect(textarea.style.textAlign).toBe('left');
    expect(textarea.selectionEnd).toBe(0);
  });

  it('T-0624: focus() goes to the open inline editor, otherwise to the canvas', () => {
    const made = make(three());
    const textarea = editing(made);
    made.view.focus();
    expect(document.activeElement).toBe(textarea);
    expect(made.view.editorText()).toBe('b1');
    key(textarea, { key: 'Enter' });
    made.view.focus();
    expect(document.activeElement).toBe(made.canvas);
  });
});

describe('CanvasView: the wheel (interaction rules 2)', () => {
  it('T-0625: Ctrl+wheel zooms by 10% around the pointer', () => {
    const made = make(three());
    const event = wheel(made.canvas, { deltaY: -100, ctrlKey: true, clientX: 100, clientY: 50 });
    expect(event.defaultPrevented).toBe(true);
    expect(made.engine.session.state.zoom).toBeCloseTo(1.1);
    wheel(made.canvas, { deltaY: 100, metaKey: true });
    expect(made.engine.session.state.zoom).toBeCloseTo(1);
  });

  it('T-0626: with something selected, 50px of wheel is one Down or Up; less waits for more', () => {
    const made = make(three());
    made.engine.select(selectBlock(made.engine.session.index(), 'b2'));
    expect(wheel(made.canvas, { deltaY: 30 }).defaultPrevented).toBe(true);
    expect(made.runs).toEqual([]);
    wheel(made.canvas, { deltaY: 30 });
    expect(made.runs).toEqual(['select.down']);
    // A turn the other way starts again from zero.
    wheel(made.canvas, { deltaY: 30 });
    wheel(made.canvas, { deltaY: -40 });
    expect(made.runs).toEqual(['select.down']);
    wheel(made.canvas, { deltaY: -10 });
    expect(made.runs).toEqual(['select.down', 'select.up']);
  });

  it('T-0627: a wheel counted in lines or pages moves at once', () => {
    const made = make(three());
    made.engine.select(selectBlock(made.engine.session.index(), 'b2'));
    wheel(made.canvas, { deltaY: 2, deltaMode: 1 });
    wheel(made.canvas, { deltaY: -1, deltaMode: 2 });
    expect(made.runs).toEqual(['select.down', 'select.up']);
  });

  it('T-0628: without a selection, with Shift, sideways or while typing, the wheel scrolls as usual', () => {
    const made = make(three());
    expect(wheel(made.canvas, { deltaY: 100 }).defaultPrevented).toBe(false);
    made.engine.select(selectBlock(made.engine.session.index(), 'b2'));
    expect(wheel(made.canvas, { deltaY: 100, shiftKey: true }).defaultPrevented).toBe(false);
    expect(wheel(made.canvas, { deltaY: 10, deltaX: 100 }).defaultPrevented).toBe(false);
    key(made.canvas, { code: 'KeyI' });
    expect(wheel(made.canvas, { deltaY: 100 }).defaultPrevented).toBe(false);
    expect(made.runs).toEqual([]);
  });
});

describe('CanvasView: zoom and scrolling (03-editor 1.1)', () => {
  it('T-0629: zooming keeps the middle of the canvas in place when nothing is selected', () => {
    const made = make(three());
    made.canvas.scrollLeft = 0;
    made.canvas.scrollTop = 0;
    made.view.zoomTo(2);
    expect(made.engine.session.state.zoom).toBe(2);
    // The drawing point under the middle (500, 300) stays under it.
    expect(made.canvas.scrollLeft).toBe((500 - canvasMargin) * 2 + canvasMargin - 500);
    expect(made.canvas.scrollTop).toBe((300 - canvasMargin) * 2 + canvasMargin - 300);
  });

  it('T-0630: zooming keeps the middle of the selection in place', () => {
    const made = make(three());
    made.engine.select(selectBlock(made.engine.session.index(), 'b2'));
    made.view.draw();
    made.canvas.scrollLeft = 0;
    made.canvas.scrollTop = 0;
    const box = boxOf(made, 'b2');
    const ax = canvasMargin + box.x + box.width / 2;
    const ay = canvasMargin + box.y + box.height / 2;
    made.view.zoomTo(2);
    expect(made.canvas.scrollLeft).toBeCloseTo((ax - canvasMargin) * 2 + canvasMargin - ax);
    expect(made.canvas.scrollTop).toBeCloseTo((ay - canvasMargin) * 2 + canvasMargin - ay);
  });

  it('T-0631: zooming to the same step, or past the limits, does nothing more', () => {
    const made = make(three());
    made.view.zoomTo(1.02);
    expect(made.engine.session.state.zoom).toBe(1);
    made.view.zoomTo(99);
    expect(made.engine.session.state.zoom).toBe(3);
  });

  it('T-0632: selecting a block out of view scrolls the nearest way to show it', () => {
    const made = make(contentOf(Array.from({ length: 40 }, (_, i) => proc(`b${String(i + 1)}`))));
    made.view.draw();
    made.canvas.scrollTop = 0;
    made.engine.select(selectBlock(made.engine.session.index(), 'b40'));
    made.view.draw();
    const box = boxOf(made, 'b40');
    const bottom = canvasMargin + box.y + box.height;
    expect(made.canvas.scrollTop).toBe(bottom + 8 - 600);
    made.engine.select(selectBlock(made.engine.session.index(), 'b1'));
    made.view.draw();
    expect(made.canvas.scrollTop).toBe(canvasMargin + boxOf(made, 'b1').y - 8);
  });
});

describe('CanvasView: dragging blocks (03-editor 3.2, R-EDIT-09)', () => {
  /** A point in the bottom band of a block: drops after it. */
  function below(made: Made, id: string): { clientX: number; clientY: number } {
    const box = boxOf(made, id);
    return { clientX: box.x + box.width / 2, clientY: box.y + box.height - 2 };
  }

  it('T-0633 · R-EDIT-09: dragging a block past 4px and releasing it moves it, in one undo step', () => {
    const made = make(three());
    pointer(made.canvas, 'pointerdown', middleOf(made, 'b1'));
    pointer(made.canvas, 'pointermove', below(made, 'b3'));
    expect(made.canvas.classList.contains('ans-is-dragging')).toBe(true);
    made.view.draw();
    // The dragged block is faded in place and the drop place is a line.
    const overlay = made.host.querySelector('.ans-overlay')?.innerHTML ?? '';
    expect(overlay).toContain('fill-opacity="0.6"');
    expect(overlay).toContain('<line');
    const label = made.host.querySelector<HTMLElement>('.ans-drag-label');
    expect(label?.textContent).toBe('b1');
    expect(label?.style.display).toBe('block');
    pointer(made.canvas, 'pointerup', below(made, 'b3'));
    expect(blockIds(made)).toEqual(['b2', 'b3', 'b1']);
    expect(made.engine.session.state.undo).toHaveLength(1);
    expect(made.canvas.classList.contains('ans-is-dragging')).toBe(false);
    expect(label?.style.display).toBe('none');
  });

  it('T-0634: a move of 4px or less is still a click', () => {
    const made = make(three());
    const at = middleOf(made, 'b1');
    pointer(made.canvas, 'pointerdown', at);
    pointer(made.canvas, 'pointermove', { clientX: at.clientX + 3, clientY: at.clientY + 2 });
    expect(made.canvas.classList.contains('ans-is-dragging')).toBe(false);
  });

  it('T-0635: dragging inside a selected range drags the whole range', () => {
    const made = make(three());
    made.engine.select(selectRange(made.engine.session.index(), 'b1', 'b2'));
    pointer(made.canvas, 'pointerdown', middleOf(made, 'b2'));
    pointer(made.canvas, 'pointermove', below(made, 'b3'));
    pointer(made.canvas, 'pointerup', below(made, 'b3'));
    expect(blockIds(made)).toEqual(['b3', 'b1', 'b2']);
    expect(made.engine.session.state.selection).toMatchObject({ anchor: 'b1', focus: 'b2' });
  });

  it('T-0636: when the selection changes under a press, the pressed block is selected and dragged alone', () => {
    const made = make(three());
    made.engine.select(selectBlock(made.engine.session.index(), 'b2'));
    pointer(made.canvas, 'pointerdown', middleOf(made, 'b3'), { shiftKey: true });
    made.engine.select(selectBlock(made.engine.session.index(), 'b2'));
    // The selection changed under the press (a key): the pressed block is dragged alone.
    const top = { clientX: middleOf(made, 'b1').clientX, clientY: boxOf(made, 'b1').y + 1 };
    pointer(made.canvas, 'pointermove', top);
    expect(made.engine.session.state.selection).toMatchObject({ anchor: 'b3', focus: 'b3' });
    pointer(made.canvas, 'pointerup', top);
    expect(blockIds(made)).toEqual(['b3', 'b1', 'b2']);
  });

  it('T-0637: Esc during a drag cancels it; nothing moves', () => {
    const made = make(three());
    pointer(made.canvas, 'pointerdown', middleOf(made, 'b1'));
    pointer(made.canvas, 'pointermove', below(made, 'b3'));
    expect(key(made.canvas, { key: 'Escape', code: 'Escape' }).defaultPrevented).toBe(true);
    expect(made.canvas.classList.contains('ans-is-dragging')).toBe(false);
    pointer(made.canvas, 'pointerup', below(made, 'b3'));
    expect(blockIds(made)).toEqual(['b1', 'b2', 'b3']);
    expect(made.engine.session.state.undo).toHaveLength(0);
  });

  it('T-0638: other keys during a drag do nothing', () => {
    const made = make(three());
    pointer(made.canvas, 'pointerdown', middleOf(made, 'b1'));
    pointer(made.canvas, 'pointermove', below(made, 'b3'));
    key(made.canvas, { key: 'ArrowDown', code: 'ArrowDown' });
    expect(made.engine.session.state.selection).toMatchObject({ anchor: 'b1' });
    expect(made.canvas.classList.contains('ans-is-dragging')).toBe(true);
  });

  it('T-0639: a cancelled pointer ends the drag without a drop', () => {
    const made = make(three());
    pointer(made.canvas, 'pointerdown', middleOf(made, 'b1'));
    pointer(made.canvas, 'pointermove', below(made, 'b3'));
    made.canvas.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1 }));
    expect(made.canvas.classList.contains('ans-is-dragging')).toBe(false);
    expect(blockIds(made)).toEqual(['b1', 'b2', 'b3']);
  });

  it('T-0640: outside the canvas, or on the dragged block itself, there is no drop place', () => {
    const made = make(three());
    pointer(made.canvas, 'pointerdown', middleOf(made, 'b1'));
    pointer(made.canvas, 'pointermove', { clientX: 2000, clientY: 2000 });
    expect(made.canvas.classList.contains('ans-cannot-drop')).toBe(true);
    pointer(made.canvas, 'pointermove', below(made, 'b3'));
    expect(made.canvas.classList.contains('ans-cannot-drop')).toBe(false);
    pointer(made.canvas, 'pointermove', { clientX: 2000, clientY: 2000 });
    pointer(made.canvas, 'pointerup', { clientX: 2000, clientY: 2000 });
    expect(blockIds(made)).toEqual(['b1', 'b2', 'b3']);
    expect(made.canvas.classList.contains('ans-cannot-drop')).toBe(false);
  });

  it('T-0641: in view only a press does not become a drag', () => {
    const made = make(three());
    made.engine.session.setReadOnly(true);
    pointer(made.canvas, 'pointerdown', middleOf(made, 'b1'));
    pointer(made.canvas, 'pointermove', below(made, 'b3'));
    expect(made.canvas.classList.contains('ans-is-dragging')).toBe(false);
  });

  it('T-0642: a drag near the canvas edge scrolls that way', async () => {
    const made = make(three());
    const scrolls: [number, number][] = [];
    made.canvas.scrollBy = ((x: number, y: number) => {
      scrolls.push([x, y]);
    }) as typeof made.canvas.scrollBy;
    pointer(made.canvas, 'pointerdown', middleOf(made, 'b1'));
    pointer(made.canvas, 'pointermove', below(made, 'b3'));
    expect(scrolls).toEqual([]);
    pointer(made.canvas, 'pointermove', { clientX: 500, clientY: 600 - 8 });
    // 8px from the bottom edge: (32 - 8) / 32 × 16 = 12px a frame, downward.
    expect(scrolls).toEqual([[0, 12]]);
    // It keeps scrolling each frame while the pointer stays there.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(scrolls.length).toBeGreaterThan(1);
    key(made.canvas, { key: 'Escape', code: 'Escape' });
    const stopped = scrolls.length;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(scrolls).toHaveLength(stopped);
  });
});

describe('CanvasView: dragging a new block from the toolbar (03-editor 3.2)', () => {
  function start(
    made: Made,
    blockKind: 'if' | 'process',
    at: { clientX: number; clientY: number },
  ) {
    made.view.startNewBlockDrag(
      { kind: 'new', blockKind },
      blockKind,
      new PointerEvent('pointermove', at),
    );
  }

  it('T-0643 · R-EDIT-09: dropping between blocks inserts the new block there and opens its text', () => {
    const made = make(three());
    const box = boxOf(made, 'b1');
    const at = { clientX: box.x + 10, clientY: box.y + box.height - 2 };
    start(made, 'process', at);
    expect(made.canvas.classList.contains('ans-is-dragging')).toBe(true);
    window.dispatchEvent(new PointerEvent('pointermove', at));
    window.dispatchEvent(new PointerEvent('pointerup', at));
    const blocks = made.engine.content().diagrams[0]?.body.blocks ?? [];
    expect(blocks).toHaveLength(4);
    expect(blocks[0]?.id).toBe('b1');
    expect(made.engine.session.state.editing?.field).toEqual({
      kind: 'block',
      block: blocks[1]?.id,
    });
    // The window listeners are gone with the drag.
    window.dispatchEvent(new PointerEvent('pointerup', at));
    expect(made.engine.content().diagrams[0]?.body.blocks).toHaveLength(4);
  });

  it('T-0644 · R-EDIT-06: dropping a control block on a block wraps it; the label says so', () => {
    const made = make(contentOf([{ id: 'b1', kind: 'process', text: 'tall\n\n\n\n' }]));
    const box = boxOf(made, 'b1');
    const at = { clientX: box.x + 10, clientY: box.y + box.height / 2 };
    start(made, 'if', at);
    expect(made.host.querySelector('.ans-drag-label')?.textContent).toBe('Wrap in If');
    window.dispatchEvent(new PointerEvent('pointerup', at));
    const [made1] = made.engine.content().diagrams[0]?.body.blocks ?? [];
    expect(made1?.kind).toBe('if');
  });

  it('T-0645: Esc on the window cancels the toolbar drag and stops it there', () => {
    const made = make(three());
    const at = middleOf(made, 'b1');
    start(made, 'process', at);
    const esc = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    window.dispatchEvent(esc);
    expect(esc.defaultPrevented).toBe(true);
    expect(made.canvas.classList.contains('ans-is-dragging')).toBe(false);
    window.dispatchEvent(new PointerEvent('pointerup', at));
    expect(made.engine.content().diagrams[0]?.body.blocks).toHaveLength(3);
  });

  it('T-0646: a cancelled pointer ends the toolbar drag without a drop', () => {
    const made = make(three());
    const at = middleOf(made, 'b1');
    start(made, 'process', at);
    window.dispatchEvent(new PointerEvent('pointercancel'));
    expect(made.canvas.classList.contains('ans-is-dragging')).toBe(false);
    expect(made.engine.content().diagrams[0]?.body.blocks).toHaveLength(3);
  });

  it('T-0647: in view only the toolbar drag does not start and the status bar says why', () => {
    const made = make(three());
    made.engine.session.setReadOnly(true);
    start(made, 'process', middleOf(made, 'b1'));
    expect(made.canvas.classList.contains('ans-is-dragging')).toBe(false);
    expect(made.engine.session.chrome().notice).toMatchObject({
      message: 'reason.readOnly',
      level: 'warn',
    });
  });
});
