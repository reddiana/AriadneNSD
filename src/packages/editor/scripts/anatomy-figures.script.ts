// The dimension figures of visual design 5 (docs/02-ux-design/04-visual-design.md): real blocks
// drawn by the renderer (layout → buildScene → toSvg, text as the bundled font's outlines) and
// the edit layer by `overlayContent`, with dimension lines laid over them from the layout boxes.
// So the figures follow the code; a dimension that no longer matches its token stops the script.
// Run again when the geometry changes, then commit the new files:
//   pnpm --filter @ariadne-nsd/editor anatomy-figures
import { writeFile } from 'node:fs/promises';

import type {
  Block,
  Box,
  Branch,
  Diagram,
  Doc,
  FoldMark,
  Head,
  Id,
  LayoutNode,
  LayoutResult,
  Path,
  Scene,
  SceneElement,
} from '@ariadne-nsd/core';
import { buildScene, geometry, layout, themeFor, toSvg } from '@ariadne-nsd/core';
import type { GlyphOutlines } from '@ariadne-nsd/fonts';
import { blockFont, readGlyphOutlines } from '@ariadne-nsd/fonts';
import { readFontFile } from '@ariadne-nsd/fonts/node';
import { it } from 'vitest';

import type { OverlayInput } from '../src/dom/overlay';
import { overlayContent } from '../src/dom/overlay';
import { findDrop } from '../src/input/drop';
import { indexDoc } from '../src/model/doc-index';
import { selectBlock } from '../src/state/selection';

const assets = new URL('../../../../docs/02-ux-design/assets/', import.meta.url);

const g = geometry;
/** Dimension lines and their labels: a green that no layer of the drawing uses. */
const dimColor = '#0a7d45';
const titleColor = '#1c2230';
const labelFont = "'IBM Plex Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif";
const paperColor = '#ffffff';

// Small builders of documents.

const p = (id: Id, text: string): Block => ({ id, kind: 'process', text });
const exit = (id: Id, text: string): Block => ({ id, kind: 'exit', text });
const seqOf = (blocks: ReadonlyArray<Block>, folds: ReadonlyArray<FoldMark> = []) => ({
  blocks,
  folds,
});
const br = (id: Id, blocks: ReadonlyArray<Block>, folds: ReadonlyArray<FoldMark> = []): Branch => ({
  id,
  body: seqOf(blocks, folds),
});
const ifOf = (id: Id, text: string, yes: Branch, no: Branch): Block => ({
  id,
  kind: 'if',
  text,
  yes,
  no,
});
const loopOf = (
  id: Id,
  kind: 'while' | 'doWhile' | 'for',
  text: string,
  blocks: ReadonlyArray<Block>,
): Block => ({ id, kind, text, body: seqOf(blocks) });
const fold = (id: Id, first: Id, last: Id, name?: string): FoldMark =>
  name === undefined ? { id, first, last } : { id, first, last, name };
const dia = (
  id: Id,
  blocks: ReadonlyArray<Block>,
  head: Head | null = null,
  folds: ReadonlyArray<FoldMark> = [],
): Diagram => ({ id, head, body: seqOf(blocks, folds) });

type DocOptions = {
  readonly headStyle?: 'shape' | 'title';
  readonly folded?: ReadonlyArray<Id>;
  readonly opened?: ReadonlyArray<Path>;
};

function docOf(diagrams: ReadonlyArray<Diagram>, options: DocOptions = {}): Doc {
  return {
    content: {
      settings: {
        textKind: 'plain',
        theme: 'default',
        headStyle: options.headStyle ?? 'title',
        locale: 'ko',
      },
      diagrams,
    },
    view: {
      folded: options.folded ?? [],
      opened: options.opened ?? [],
      bands: true,
      resultSymbol: '←',
    },
  };
}

/** Stops the script when a drawn dimension is not the value its label names. */
function expectPx(what: string, actual: number, expected: number): void {
  if (Math.abs(actual - expected) > 0.01) {
    throw new Error(`${what}: drawn ${String(actual)}px, the figure says ${String(expected)}px`);
  }
}

/** A rough width of a label, to size the figure. */
function textWidth(text: string, size: number): number {
  let width = 0;
  for (const char of text) {
    width += (char.codePointAt(0) ?? 0) >= 0x1100 ? size : size * 0.58;
  }
  return width;
}

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** A specimen placed in a figure: its layout, and its coordinates mapped into the figure. */
class Placed {
  constructor(
    readonly layout: LayoutResult,
    readonly scene: Scene,
    private readonly origin: { readonly x: number; readonly y: number },
    private readonly from: { readonly x: number; readonly y: number },
    readonly scale: number,
  ) {}

  /** Where the drawing's point (on the centre of its 1px lines) lands in the figure. */
  x(x: number): number {
    return this.origin.x + (x + 0.5 - this.from.x) * this.scale;
  }

  y(y: number): number {
    return this.origin.y + (y + 0.5 - this.from.y) * this.scale;
  }

  /** A box in figure coordinates: x, y on its left and top lines, right and bottom likewise. */
  map(box: Box): Box {
    return {
      x: this.x(box.x),
      y: this.y(box.y),
      width: box.width * this.scale,
      height: box.height * this.scale,
    };
  }

  /** The box of a block, branch, fold region or diagram, in figure coordinates. */
  box(id: Id): Box {
    const box = this.layout.boxes.get(id);
    if (box === undefined) throw new Error(`no box ${id}`);
    return this.map(box);
  }

  /** The drawing coordinates of a box (for checks against the tokens). */
  raw(id: Id): Box {
    const box = this.layout.boxes.get(id);
    if (box === undefined) throw new Error(`no box ${id}`);
    return box;
  }

  node<K extends LayoutNode['kind']>(kind: K, id: Id): Extract<LayoutNode, { kind: K }> {
    const found = this.layout.nodes.find(
      (node) => node.kind === kind && 'id' in node && node.id === id,
    );
    if (found === undefined) throw new Error(`no ${kind} node ${id}`);
    return found as Extract<LayoutNode, { kind: K }>;
  }

  elements(id: Id, kind: SceneElement['kind']): ReadonlyArray<SceneElement> {
    return this.scene.elements.filter((e) => e.blockId === id && e.kind === kind);
  }
}

type PlaceOptions = {
  /** Which diagram to show (the others are cut away). Default: the first. */
  readonly diagram?: number;
  /** Shows the whole picture with its paper margin instead of one diagram. */
  readonly whole?: boolean;
  readonly scale?: number;
  /** The edit layer over the specimen (the fold triangles are always drawn, as on screen). */
  readonly overlay?: (
    layout: LayoutResult,
    doc: Doc,
  ) => Partial<Omit<OverlayInput, 'layout' | 'index' | 'paper'>>;
};

class Figure {
  private readonly parts: string[] = [];
  private right = 0;
  private bottom = 0;

  constructor(private readonly outlines: GlyphOutlines) {}

  private grow(x: number, y: number): void {
    this.right = Math.max(this.right, x);
    this.bottom = Math.max(this.bottom, y);
  }

  /** Draws a document's diagram with its top left (on the lines) at (x, y). */
  place(doc: Doc, x: number, y: number, options: PlaceOptions = {}): Placed {
    const result = layout(doc);
    const scene = buildScene(result, themeFor(doc.content.settings.theme), 'plain');
    const svg = toSvg(scene, { outlines: this.outlines });
    const scale = options.scale ?? 1;
    const diagram = result.diagrams[options.diagram ?? 0];
    if (diagram === undefined) throw new Error('no diagram');
    // A margin around the diagram for the 3px frames, which reach 1px outside its box, and the
    // drop line's arrowheads, which stick out 7px.
    const margin = options.overlay === undefined ? 4 : 10;
    const view: Box =
      options.whole === true
        ? { x: 0, y: 0, width: result.width, height: result.height }
        : {
            x: diagram.box.x - margin,
            y: diagram.box.y - margin,
            width: diagram.box.width + 2 * margin + 1,
            height: diagram.box.height + 2 * margin + 1,
          };
    const from = options.whole === true ? { x: 0, y: 0 } : diagram.box;
    const placed = new Placed(result, scene, { x, y }, { x: from.x, y: from.y }, scale);
    const left = placed.x(view.x) - 0.5 * scale;
    const top = placed.y(view.y) - 0.5 * scale;
    const overlayInput = options.overlay?.(result, doc) ?? {};
    const overlay = overlayContent({
      layout: result,
      index: indexDoc(doc.content),
      selection: null,
      hover: null,
      drop: null,
      dragged: [],
      paper: paperColor,
      ...overlayInput,
    });
    this.parts.push(
      `<svg x="${String(left)}" y="${String(top)}" width="${String(view.width * scale)}" height="${String(view.height * scale)}" viewBox="${String(view.x)} ${String(view.y)} ${String(view.width)} ${String(view.height)}" overflow="hidden">`,
      svg.content,
      overlay,
      '</svg>',
    );
    this.grow(left + view.width * scale, top + view.height * scale);
    return placed;
  }

  /** A dashed line drawn on the whole paper's edge (for the figure of the paper margin). */
  outline(box: Box): void {
    this.parts.push(
      `<rect x="${String(box.x)}" y="${String(box.y)}" width="${String(box.width)}" height="${String(box.height)}" fill="none" stroke="#9aa3b5" stroke-width="1" stroke-dasharray="4 3"/>`,
    );
    this.grow(box.x + box.width, box.y + box.height);
  }

  title(x: number, y: number, text: string): void {
    this.parts.push(
      `<text x="${String(x)}" y="${String(y)}" font-family="${labelFont}" font-size="13" font-weight="600" fill="${titleColor}">${esc(text)}</text>`,
    );
    this.grow(x + textWidth(text, 13), y + 4);
  }

  /** A note in the dimension color; `\n` breaks lines. */
  note(
    x: number,
    y: number,
    text: string,
    anchor: 'start' | 'middle' | 'end' = 'start',
    color = dimColor,
  ): void {
    if (text === '') return;
    const lines = text.split('\n');
    const tspans = lines
      .map(
        (line, i) =>
          `<tspan x="${String(x)}" dy="${String(i === 0 ? 0 : 14)}">${esc(line)}</tspan>`,
      )
      .join('');
    this.parts.push(
      `<text x="${String(x)}" y="${String(y)}" font-family="${labelFont}" font-size="11" fill="${color}" text-anchor="${anchor}" stroke="${paperColor}" stroke-width="3" stroke-linejoin="round" paint-order="stroke">${tspans}</text>`,
    );
    const width = Math.max(...lines.map((line) => textWidth(line, 11)));
    const right = anchor === 'start' ? x + width : anchor === 'middle' ? x + width / 2 : x;
    this.grow(right, y + 14 * (lines.length - 1) + 4);
  }

  private path(d: string, dashed = false): void {
    this.parts.push(
      `<path d="${d}" fill="none" stroke="${dimColor}" stroke-width="1"${dashed ? ' stroke-dasharray="2 2" opacity="0.8"' : ''}/>`,
    );
  }

  /** A dashed extension line from what is measured to its dimension line. */
  ext(x1: number, y1: number, x2: number, y2: number): void {
    this.path(`M${String(x1)} ${String(y1)} L${String(x2)} ${String(y2)}`, true);
  }

  /** A small ring on a point (a vertex, a centre). */
  mark(x: number, y: number): void {
    this.parts.push(
      `<circle cx="${String(x)}" cy="${String(y)}" r="3" fill="none" stroke="${dimColor}" stroke-width="1.2"/>`,
    );
  }

  /** A vertical dimension from y1 to y2 at x, the label beside it. */
  dimV(x: number, y1: number, y2: number, label: string, side: 'left' | 'right' = 'right'): void {
    this.path(
      `M${String(x)} ${String(y1)} V${String(y2)} M${String(x - 3)} ${String(y1)} H${String(x + 3)} M${String(x - 3)} ${String(y2)} H${String(x + 3)}`,
    );
    this.note(
      side === 'right' ? x + 6 : x - 6,
      (y1 + y2) / 2 + 4,
      label,
      side === 'right' ? 'start' : 'end',
    );
    this.grow(x + 3, y2);
  }

  /**
   * A horizontal dimension from x1 to x2 at y. The label is above or below it: centred, or
   * starting at x1 (`start`), or ending at x2 (`end`); or beside it, right after x2 (`after`) or
   * right before x1 (`before`).
   */
  dimH(
    x1: number,
    x2: number,
    y: number,
    label: string,
    at: 'middle' | 'start' | 'end' | 'after' | 'before' = 'middle',
    pos: 'above' | 'below' = 'above',
  ): void {
    this.path(
      `M${String(x1)} ${String(y)} H${String(x2)} M${String(x1)} ${String(y - 3)} V${String(y + 3)} M${String(x2)} ${String(y - 3)} V${String(y + 3)}`,
    );
    const ly = at === 'after' || at === 'before' ? y + 4 : pos === 'above' ? y - 5 : y + 14;
    const [lx, anchor] =
      at === 'middle'
        ? [(x1 + x2) / 2, 'middle' as const]
        : at === 'start'
          ? [x1, 'start' as const]
          : at === 'end'
            ? [x2, 'end' as const]
            : at === 'after'
              ? [x2 + 6, 'start' as const]
              : [x1 - 6, 'end' as const];
    this.note(lx, ly, label, anchor);
    this.grow(x2 + 3, y + 3);
  }

  /**
   * Widths one after another from x along a block's top edge `top`: the first highest, each
   * next one a step lower, the labels right of each, so no extension line crosses a label.
   */
  chain(x: number, top: number, steps: ReadonlyArray<readonly [number, string]>): void {
    let at = x;
    steps.forEach(([width, label], i) => {
      const y = top - 12 - 16 * (steps.length - 1 - i);
      this.dimH(at, at + width, y, label, 'after');
      this.ext(at, y, at, top + (i === 0 ? 0 : 6));
      at += width;
      if (i === steps.length - 1) this.ext(at, y, at, top + 6);
    });
  }

  svg(): string {
    const width = Math.ceil(this.right + 24);
    const height = Math.ceil(this.bottom + 20);
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${String(width)}" height="${String(height)}" viewBox="0 0 ${String(width)} ${String(height)}">`,
      `<rect width="${String(width)}" height="${String(height)}" fill="${paperColor}"/>`,
      ...this.parts,
      '</svg>',
      '',
    ].join('\n');
  }
}

// The figures, in the order of visual design 5.

function processFigure(f: Figure): void {
  f.title(40, 30, '처리 블록');
  const a = f.place(docOf([dia('d1', [p('b1', 'tick++;')])]), 80, 70);
  const b = a.box('b1');
  expectPx('process height', a.raw('b1').height, 32);
  f.chain(b.x, b.y, [[10, 'space.pad-x 10']]);
  const r = b.x + b.width + 12;
  f.dimV(r, b.y, b.y + 7, 'space.pad-y 7');
  f.dimV(r, b.y + 7, b.y + 25, 'space.line 18');
  f.dimV(r, b.y + 25, b.y + 32, 'space.pad-y 7');
  f.dimV(b.x - 12, b.y, b.y + 32, '32', 'left');
  f.note(b.x, b.y + b.height + 22, '기준선은 줄의 아래 끝에서 5 위', 'start');

  f.title(40, 170, '여러 줄');
  const m = f.place(docOf([dia('d1', [p('b1', 'adc_start(CH0);\nadc_wait();')])]), 80, 190);
  const mb = m.box('b1');
  expectPx('two-line process height', m.raw('b1').height, 50);
  f.dimV(mb.x + mb.width + 12, mb.y, mb.y + mb.height, '50 = 2 × space.line + 2 × space.pad-y');

  f.title(40, 290, '호출 블록');
  const call: Block = {
    id: 'c1',
    kind: 'call',
    target: { kind: 'named', name: 'partition' },
    args: 'a, lo, hi',
    result: 'p',
    siteFolds: [],
  };
  const c = f.place(docOf([dia('d1', [call])]), 80, 350);
  const cb = c.box('c1');
  expectPx('call height', c.raw('c1').height, 32);
  f.chain(cb.x, cb.y, [
    [7, 'size.call-bar 7'],
    [10, 'space.pad-x 10'],
  ]);
  f.dimH(cb.x + cb.width - 7, cb.x + cb.width, cb.y - 12, '7', 'after');
  f.dimV(cb.x + cb.width + 12, cb.y, cb.y + 32, '32');
  f.note(
    cb.x,
    cb.y + cb.height + 22,
    '세로 이중선은 언제나 실선. 이름은 굵게, 결과 · 인자는 보통',
    'start',
  );
}

function ifFigure(f: Figure): void {
  const label = g['size.if-label'];
  const ifDims = (placed: Placed, id: Id, total: number, right: string): Box => {
    const node = placed.node('if', id);
    expectPx('If header height', node.head.height, total);
    const h = placed.map(node.head);
    const bottom = h.y + h.height;
    f.dimV(h.x + h.width + 12, h.y, bottom - label, right);
    f.dimV(h.x + h.width + 12, bottom - label, bottom, `size.if-label ${String(label)}`);
    f.dimV(h.x - 12, h.y, bottom, String(total), 'left');
    return h;
  };

  f.title(40, 30, 'If');
  const a = f.place(
    docOf([
      dia('d1', [
        ifOf(
          'i1',
          'btn == PRESSED',
          br('y1', [p('b1', 'led_on();')]),
          br('n1', [p('b2', 'led_off();')]),
        ),
      ]),
    ]),
    80,
    60,
  );
  const ah = ifDims(a, 'i1', 48, '조건 줄 32');
  const box = a.box('i1');
  const below = box.y + box.height;
  const inset = g['size.label-inset'];
  f.dimH(ah.x, ah.x + inset, below + 12, `size.label-inset ${String(inset)}`, 'start', 'below');
  f.ext(ah.x + inset, ah.y + ah.height, ah.x + inset, below + 12);
  f.dimH(ah.x + ah.width - inset, ah.x + ah.width, below + 12, String(inset), 'after');
  f.ext(ah.x + ah.width - inset, ah.y + ah.height, ah.x + ah.width - inset, below + 12);
  const node = a.node('if', 'i1');
  const vx = a.x(node.splitX);
  f.mark(vx, ah.y + ah.height);
  f.ext(vx, ah.y + ah.height + 3, vx, below + 40);
  f.note(
    vx,
    below + 52,
    '빗금의 꼭짓점 = 두 분기의 경계.\n조건은 그 위 가운데, 분기 라벨은 12px',
    'middle',
  );

  f.title(420, 30, '여러 줄 조건');
  const m = f.place(
    docOf([
      dia('d1', [
        ifOf(
          'i1',
          'count > 0 &&\nready',
          br('y1', [p('b1', 'go();')]),
          br('n1', [p('b2', 'wait();')]),
        ),
      ]),
    ]),
    460,
    60,
  );
  ifDims(m, 'i1', 66, '2 × 18 + 2 × 7 = 50');

  f.title(40, 250, '빈 분기');
  const e = f.place(
    docOf([dia('d1', [ifOf('i1', 'ok', br('y1', [p('b1', 'send();')]), br('n1', [p('b2', '')]))])]),
    80,
    280,
  );
  const circle = e.elements('b2', 'circle')[0];
  if (circle?.kind !== 'circle') throw new Error('no ∅');
  expectPx('∅ diameter', circle.r * 2, 7);
  expectPx('∅ line', circle.strokeWidth, 1.1);
  const cx = e.x(circle.cx);
  const cy = e.y(circle.cy);
  const eb = e.box('i1');
  f.ext(cx + 6, cy + 4, eb.x + eb.width + 14, eb.y + eb.height + 18);
  f.note(
    eb.x + eb.width + 16,
    eb.y + eb.height + 22,
    '∅ 지름 7, 선 1.1.\n빗금은 원을 둘러싼 사각형 밖으로 1',
  );

  f.title(420, 250, '조건 텍스트의 배경색 테두리');
  const h = f.place(
    docOf([
      dia('d1', [
        ifOf(
          'i1',
          'count >= limit + 10',
          br('y1', [p('b1', 'a();')]),
          br('n1', [p('b2', 'log_overflow(count, limit);')]),
        ),
      ]),
    ]),
    460,
    280,
  );
  const hb = h.box('i1');
  f.note(
    hb.x,
    hb.y + hb.height + 22,
    `size.text-halo ${String(g['size.text-halo'])}: 텍스트 바깥으로 3px를 조건 칸의 배경색으로.\n빗금에 닿는 곳에서만 빗금이 끊긴다`,
  );
}

function caseFigure(f: Figure): void {
  f.title(40, 30, 'Case');
  const a = f.place(
    docOf([
      dia('d1', [
        {
          id: 'k1',
          kind: 'case',
          text: 'state',
          arms: [
            { id: 'a1', label: 'IDLE', body: seqOf([p('b1', 'idle();')]) },
            { id: 'a2', label: 'RUN', body: seqOf([p('b2', 'run();')]) },
          ],
          otherwise: br('o1', [p('b3', 'stop();')]),
        },
      ]),
    ]),
    80,
    60,
  );
  const node = a.node('case', 'k1');
  const label = g['size.case-label'];
  expectPx('Case header height', node.head.height, 60);
  const h = a.map(node.head);
  const bottom = h.y + h.height;
  f.dimV(h.x + h.width + 12, h.y, bottom - label, '조건 줄 32');
  f.dimV(h.x + h.width + 12, bottom - label, bottom, `size.case-label ${String(label)}`);
  f.dimV(h.x - 12, h.y, bottom, '60', 'left');
  const box = a.box('k1');
  const below = box.y + box.height;
  const inset = g['size.label-inset'];
  f.dimH(h.x, h.x + inset, below + 12, `size.label-inset ${String(inset)}`, 'start', 'below');
  f.ext(h.x + inset, bottom, h.x + inset, below + 12);
  f.dimH(
    h.x + h.width - inset,
    h.x + h.width,
    below + 12,
    `${String(inset)} (default만 오른쪽)`,
    'after',
  );
  f.ext(h.x + h.width - inset, bottom, h.x + h.width - inset, below + 12);
  f.note(
    h.x,
    below + 46,
    '긴 빗금: 왼쪽 위 → default 칸의 왼쪽 아래, 짧은 빗금: 거기서 오른쪽 위.\n분기 사이의 세로선은 긴 빗금 위의 점에서 내려온다',
  );

  f.title(40, 270, 'default가 없는 Case');
  const n = f.place(
    docOf([
      dia('d1', [
        {
          id: 'k1',
          kind: 'case',
          text: 'cmd',
          arms: [{ id: 'a1', label: 'A', body: seqOf([p('b1', 'run();')]) }],
          otherwise: null,
        },
      ]),
    ]),
    80,
    300,
  );
  const nb = n.box('k1');
  f.note(nb.x, nb.y + nb.height + 22, 'default 칸을 비워 그리고 ∅');

  f.title(420, 270, 'default만 있는 Case');
  const o = f.place(
    docOf([
      dia('d1', [
        {
          id: 'k1',
          kind: 'case',
          text: 'mode',
          arms: [],
          otherwise: br('o1', [p('b1', 'run();')]),
        },
      ]),
    ]),
    460,
    300,
  );
  const ob = o.box('k1');
  f.note(ob.x, ob.y + ob.height + 22, '짧은 빗금 하나(오른쪽 위 → 왼쪽 아래)');
}

function loopFigure(f: Figure): void {
  const strip = g['size.loop-strip'];
  f.title(40, 30, 'While');
  const w = f.place(
    docOf([dia('d1', [loopOf('w1', 'while', 'i < n', [p('b1', 'a[i] = 0;'), p('b2', 'i++;')])])]),
    80,
    60,
  );
  const wn = w.node('loop', 'w1');
  expectPx('loop header', wn.head.height, 32);
  expectPx('loop strip', w.raw('b1').x - w.raw('w1').x, strip);
  const wb = w.box('w1');
  const wh = w.map(wn.head);
  f.dimV(wb.x + wb.width + 12, wh.y, wh.y + wh.height, '조건 칸 32');
  f.dimH(
    wb.x,
    wb.x + strip,
    wb.y + wb.height + 12,
    `size.loop-strip ${String(strip)}`,
    'start',
    'below',
  );

  f.title(420, 30, 'For');
  const fo = f.place(
    docOf([dia('d1', [loopOf('f1', 'for', 'for i ← 0 to n − 1', [p('b1', 'a[i] = 0;')])])]),
    460,
    60,
  );
  const fb = fo.box('f1');
  f.note(fb.x, fb.y + fb.height + 22, 'While과 같은 모양.\n조건 칸의 텍스트로만 구분한다');

  f.title(40, 230, 'Do-While');
  const d = f.place(
    docOf([dia('d1', [loopOf('w1', 'doWhile', 'i < n', [p('b1', 'i++;')])])]),
    80,
    260,
  );
  const dn = d.node('loop', 'w1');
  const dh = d.map(dn.head);
  f.dimV(dh.x + dh.width + 12, dh.y, dh.y + dh.height, '조건 칸 32 (아래)');

  f.title(420, 230, '접힌 본문 · 분기');
  const fd = f.place(
    docOf([dia('d1', [loopOf('w1', 'while', 'more', [p('b1', 'read();'), p('b2', 'store();')])])], {
      folded: ['w1'],
    }),
    460,
    260,
  );
  const folded = fd.node('foldedSeq', 'w1');
  expectPx('folded row', folded.box.height, 32);
  const r = fd.map(folded.box);
  const dots = fd.elements('w1', 'circle');
  expectPx('dots', dots.length, 3);
  f.dimH(r.x, r.x + 10, r.y + r.height + 12, '');
  f.dimH(r.x + 10, r.x + 26, r.y + r.height + 12, '');
  f.ext(r.x + 26, r.y + 20, r.x + 26, r.y + r.height + 12);
  f.note(r.x + 36, r.y + r.height + 16, 'space.pad-x 10, 세 점 16');
  f.dimV(r.x + r.width + 12, r.y, r.y + r.height, '32');
  f.note(
    r.x,
    r.y + r.height + 46,
    '세 점: 지름 1.2, 중심은 pad-x + 3 · 7 · 11.\n글자는 12px 기울임. If · Case의 분기도 같은 칸',
  );
}

function headFigure(f: Figure): void {
  const hat = g['size.hat'];
  f.title(40, 30, 'Event 헤더 (모자 · 아치)');
  const e = f.place(
    docOf([dia('d1', [p('b1', 'tick++;')], { kind: 'event', text: 'TIM2 인터럽트' })], {
      headStyle: 'shape',
    }),
    80,
    90,
  );
  const ed = e.layout.diagrams[0];
  if (ed === undefined || ed.head === null) throw new Error('no head');
  expectPx('shape header', ed.head.height, 48);
  const eh = e.map(ed.head);
  const hatW = Math.min(g['size.hat-w'], ed.head.width * 0.45);
  f.dimH(eh.x, eh.x + hatW, eh.y - 12, 'size.hat-w = min(110, 폭 × 0.45)', 'start');
  f.dimV(eh.x + eh.width + 12, eh.y, eh.y + hat, `size.hat ${String(hat)}`);
  f.dimV(eh.x + eh.width + 12, eh.y + hat, eh.y + eh.height, '줄 18 + 2 × 7');
  f.dimV(eh.x - 12, eh.y, eh.y + eh.height, '48', 'left');

  f.title(420, 30, 'Method 헤더 (모자 · 아치)');
  const m = f.place(
    docOf(
      [dia('d1', [p('b1', 'pivot = a[hi];')], { kind: 'method', text: 'partition(a, lo, hi)' })],
      {
        headStyle: 'shape',
      },
    ),
    460,
    90,
  );
  const md = m.layout.diagrams[0];
  if (md === undefined || md.head === null) throw new Error('no head');
  const mh = m.map(md.head);
  f.dimV(mh.x + mh.width + 12, mh.y, mh.y + mh.height, '48');
  const mb = m.box('d1');
  f.note(mb.x, mb.y + mb.height + 22, '폭 전체에 걸친 낮은 아치,\n색은 호출 블록과 같다');

  f.title(40, 250, 'Event 헤더 ("제목처럼")');
  const t = f.place(
    docOf([dia('d1', [p('b1', 'tick++;')], { kind: 'event', text: 'TIM2 인터럽트' })]),
    80,
    280,
  );
  const td = t.layout.diagrams[0];
  if (td === undefined || td.head === null) throw new Error('no head');
  expectPx('title header', td.head.height, 40);
  const th = t.map(td.head);
  const r = th.x + th.width + 12;
  f.dimV(r, th.y, th.y + 16, `size.title-tag ${String(g['size.title-tag'])}`);
  f.dimV(r, th.y + 16, th.y + 34, 'space.line 18');
  f.dimV(r, th.y + 34, th.y + 40, `size.title-gap ${String(g['size.title-gap'])}`);
  f.dimV(th.x - 12, th.y, th.y + 40, '40', 'left');
  const tb = t.box('d1');
  expectPx('diagram min width', t.raw('d1').width, g['size.diagram-min-w']);
  f.dimH(
    tb.x,
    tb.x + tb.width,
    tb.y + tb.height + 14,
    `size.diagram-min-w ${String(g['size.diagram-min-w'])}`,
    'middle',
    'below',
  );
  f.note(
    tb.x,
    tb.y + tb.height + 48,
    '글자는 다이어그램의 왼쪽 선에 맞춘다(pad-x 없음).\n배경은 칠하지 않고 아랫줄 1px',
  );

  f.title(420, 250, 'Method 헤더 ("제목처럼")');
  f.place(
    docOf([
      dia('d1', [p('b1', 'pivot = a[hi];')], { kind: 'method', text: 'partition(a, lo, hi)' }),
    ]),
    460,
    280,
  );
}

function foldFigure(f: Figure): void {
  const band = g['size.band'];
  f.title(40, 30, '펴진 접기 영역');
  const a = f.place(
    docOf([
      dia(
        'd1',
        [p('b1', 'adc_start(CH0);'), p('b2', 'adc_wait();'), p('b3', 'v = adc_read();')],
        null,
        [fold('f1', 'b1', 'b2', '센서 읽기')],
      ),
    ]),
    80,
    90,
  );
  const frame = a.node('foldFrame', 'f1');
  expectPx('band', frame.band.height, band);
  const fb = a.map(frame.band);
  const tx = g['size.band-text-x'];
  const room = g['size.band-icon-room'];
  f.chain(fb.x, fb.y, [
    [tx, `size.band-text-x ${String(tx)}`],
    [room, `size.band-icon-room ${String(room)}`],
  ]);
  f.dimV(fb.x + fb.width + 12, fb.y, fb.y + band, `size.band ${String(band)}`);
  const ab = a.box('f1');
  f.note(
    ab.x + ab.width + 12,
    ab.y + 50,
    `size.fold-edge ${String(g['size.fold-edge'])} 실선.\n안쪽 블록은 테두리에 붙는다`,
  );

  f.title(420, 30, '접힌 접기 영역');
  const b = f.place(
    docOf(
      [
        dia('d1', [p('b1', 'log(v);'), p('b2', 'flush();'), p('b3', 'done();')], null, [
          fold('f2', 'b1', 'b2', '로그 남기기'),
        ]),
      ],
      { folded: ['f2'] },
    ),
    460,
    90,
  );
  const cell = b.node('foldCell', 'f2');
  expectPx('fold cell', cell.box.height, 36);
  const cb = b.map(cell.box);
  f.chain(cb.x, cb.y, [
    [10, 'space.pad-x 10'],
    [g['size.fold-icon-room'], `size.fold-icon-room ${String(g['size.fold-icon-room'])}`],
  ]);
  f.dimV(cb.x + cb.width + 12, cb.y, cb.y + cb.height, '36 = 18 + 2 × 7 + 4');

  f.title(40, 250, '이름이 없는 접힌 영역');
  const c = f.place(
    docOf(
      [
        dia('d1', [p('b1', 'adc_start(CH0);'), p('b2', 'adc_wait();')], null, [
          fold('f3', 'b1', 'b2'),
        ]),
      ],
      {
        folded: ['f3'],
      },
    ),
    80,
    280,
  );
  const cc = c.box('d1');
  f.note(cc.x, cc.y + cc.height + 22, '기본 이름을 기울여 쓴다');

  f.title(420, 250, '펴 보인 호출 블록');
  const call: Block = {
    id: 'c1',
    kind: 'call',
    target: { kind: 'local', diagram: 'm1' },
    args: 'a, lo, hi',
    result: 'p',
    siteFolds: [],
  };
  const d = f.place(
    docOf(
      [
        dia('d1', [call, p('b9', 'sort(a, lo, p − 1);')]),
        dia('m1', [p('m2', 'pivot = a[hi];'), p('m3', 'return i;')], {
          kind: 'method',
          text: 'partition(a, lo, hi)',
        }),
      ],
      { opened: [['c1']] },
    ),
    460,
    280,
  );
  const peek = d.node('peek', 'c1');
  expectPx('peek band', peek.band.height, band);
  const pb = d.map(peek.band);
  const pbox = d.map(peek.box);
  f.dimV(pbox.x + pbox.width + 12, pb.y, pb.y + band, `size.band ${String(band)}`);
  f.note(
    pbox.x,
    d.box('d1').y + d.box('d1').height + 22,
    'peek.edge 3px 실선, 가운데가 바깥 선에서 1px 안.\n띠의 글자는 보라. 보통 블록은 테두리에 붙는다',
  );
  f.note(
    40,
    470,
    '펼침 삼각형은 편집 레이어에만 그린다(저장되는 그림에는 없음). 그 자리는 남는다.',
    'start',
    titleColor,
  );
}

function nestingFigure(f: Figure): void {
  const s = 2;
  const inset = g['size.nest-inset'];
  f.title(40, 30, '테두리 안의 테두리, 이어진 테두리 (2배)');
  const a = f.place(
    docOf([
      dia(
        'd1',
        [
          p('b1', 'adc_start(CH0);'),
          p('b2', 'adc_wait();'),
          p('b3', 'v = adc_read();'),
          p('b4', 'log(v);'),
        ],
        null,
        [
          fold('f1', 'b1', 'b4', '바깥 영역'),
          fold('f2', 'b2', 'b2', '안쪽 영역'),
          fold('f3', 'b3', 'b4', '이어진 영역'),
        ],
      ),
    ]),
    200,
    70,
    { scale: s },
  );
  const outer = a.raw('f1');
  const inner = a.raw('f2');
  const next = a.raw('f3');
  expectPx('nest inset', inner.x - outer.x, inset);
  expectPx('nest inset bottom', outer.y + outer.height - (next.y + next.height), inset);
  expectPx('gap between frames', next.y - (inner.y + inner.height), 2);
  const o = a.box('f1');
  const i = a.box('f2');
  const n = a.box('f3');
  f.dimH(o.x, i.x, i.y + 40, `size.nest-inset ${String(inset)}`, 'before');
  f.dimH(n.x + n.width, o.x + o.width, n.y + 40, String(inset), 'after');
  f.dimV(o.x + o.width + 30, i.y + i.height, n.y, '사이 2 (경계선 1 + size.nest-gap 1)');
  f.ext(i.x + i.width, i.y + i.height, o.x + o.width + 33, i.y + i.height);
  f.ext(n.x + n.width, n.y, o.x + o.width + 33, n.y);
  f.dimV(o.x + o.width + 30, n.y + n.height, o.y + o.height, String(inset));
  f.ext(n.x + n.width, n.y + n.height, o.x + o.width + 33, n.y + n.height);

  const ob = a.box('d1');
  f.title(40, ob.y + ob.height + 60, '제어 블록을 거쳐 겹친 테두리 (2배)');
  const b = f.place(
    docOf([
      dia(
        'd1',
        [
          ifOf(
            'i1',
            'ready',
            br('y1', [p('b1', 'skip();')]),
            br(
              'n1',
              [p('b2', 'send(cmd);'), p('b3', 'wait_ack();')],
              [fold('f2', 'b2', 'b3', '보내기')],
            ),
          ),
        ],
        null,
        [fold('f1', 'i1', 'i1', '검사')],
      ),
    ]),
    200,
    ob.y + ob.height + 100,
    { scale: s },
  );
  const bo = b.raw('f1');
  const bi = b.raw('f2');
  expectPx('nest inset via If (right)', bo.x + bo.width - (bi.x + bi.width), inset);
  expectPx('nest inset via If (bottom)', bo.y + bo.height - (bi.y + bi.height), inset);
  const O = b.box('f1');
  const I = b.box('f2');
  f.dimH(I.x + I.width, O.x + O.width, I.y + 50, String(inset), 'after');
  f.dimV(O.x + O.width + 30, I.y + I.height, O.y + O.height, String(inset));
  f.ext(I.x + I.width, I.y + I.height, O.x + O.width + 33, I.y + I.height);
  f.note(
    O.x,
    O.y + O.height + 24,
    '바깥 테두리의 변에 닿는 안쪽 테두리의 변만 같은 깊이로 들인다. 꼭짓점 쪽 왼쪽 변은 들이지 않는다.\n펴 보인 호출 블록 안도 같다(size.peek-inset 4)',
  );
}

function diagramsFigure(f: Figure): void {
  f.title(40, 30, '다이어그램 사이와 종이 둘레');
  const doc = docOf([
    dia('e1', [p('b1', 'init();')], { kind: 'event', text: '시작' }),
    dia('e2', [p('b2', 'step();')], { kind: 'event', text: '타이머' }),
    dia('m1', [p('b3', 'work();')], { kind: 'method', text: 'helper()' }),
  ]);
  const a = f.place(doc, 40, 60, { whole: true });
  f.outline({ x: 40, y: 60, width: a.layout.width, height: a.layout.height });
  const [e1, e2, m1] = a.layout.diagrams;
  if (e1 === undefined || e2 === undefined || m1 === undefined) throw new Error('no diagrams');
  const paper = g['space.paper'];
  expectPx('paper', e1.box.x, paper);
  expectPx('between diagrams', e2.box.y - (e1.box.y + e1.box.height), g['space.diagram']);
  expectPx('between kinds', m1.box.x - (e1.box.x + e1.box.width), g['space.kind-gap']);
  const A = a.map(e1.box);
  const B = a.map(e2.box);
  const C = a.map(m1.box);
  f.dimH(40, B.x, B.y + B.height + 12, `space.paper ${String(paper)}`, 'after');
  f.dimV(A.x + 30, 60, A.y, `space.paper ${String(paper)}`);
  f.dimV(A.x + 30, A.y + A.height, B.y, `space.diagram ${String(g['space.diagram'])}`);
  const y = C.y + C.height + 14;
  f.ext(A.x + A.width, A.y + A.height, A.x + A.width, y + 3);
  f.dimH(A.x + A.width, C.x, y, `space.kind-gap ${String(g['space.kind-gap'])}`, 'middle', 'below');
  f.note(
    40,
    60 + a.layout.height + 22,
    '점선: 그림의 끝(종이). 왼쪽 열에 Event, 오른쪽 열에 Method',
    'start',
    titleColor,
  );
}

function newBlocksFigure(f: Figure): void {
  const strip = g['size.loop-strip'];
  f.title(40, 30, '무한 반복');
  const e = f.place(
    docOf([
      dia('d1', [
        { id: 'l1', kind: 'endless', body: seqOf([p('b1', 'poll();'), exit('x1', 'break')]) },
      ]),
    ]),
    80,
    60,
  );
  const lb = e.raw('l1');
  const body = e.raw('b1');
  expectPx('endless top', body.y - lb.y, strip);
  expectPx('endless left', body.x - lb.x, strip);
  expectPx('endless bottom', lb.y + lb.height - (e.raw('x1').y + e.raw('x1').height), strip);
  expectPx('endless right', lb.x + lb.width, body.x + body.width);
  const L = e.box('l1');
  f.dimV(L.x - 12, L.y, L.y + strip, String(strip), 'left');
  f.dimV(L.x - 12, L.y + L.height - strip, L.y + L.height, String(strip), 'left');
  f.dimH(
    L.x,
    L.x + strip,
    L.y + L.height + 12,
    `size.loop-strip ${String(strip)} (위 · 왼쪽 · 아래)`,
    'start',
    'below',
  );
  f.note(L.x + L.width + 12, L.y + 30, '띠에는 글자가 없다.\n본문의 오른쪽은\n바깥 틀에 붙는다');

  f.title(420, 30, '탈출');
  const x = f.place(docOf([dia('d1', [exit('x1', 'return −1;')])]), 460, 90);
  const X = x.box('x1');
  const wedge = g['size.exit-wedge'];
  expectPx('exit height', x.raw('x1').height, 32);
  f.chain(X.x, X.y, [
    [wedge, `size.exit-wedge ${String(wedge)}`],
    [10, 'space.pad-x 10'],
  ]);
  f.dimV(X.x + X.width + 12, X.y, X.y + X.height, '32');
  f.mark(X.x, X.y + X.height / 2);
  f.note(
    X.x,
    X.y + X.height + 22,
    '쐐기: (14, 위) → (0, 가운데) → (14, 아래).\n폭 = max(52, 14 + 글자 + 2 × pad-x)',
  );

  const band = g['size.parallel-band'];
  f.title(40, 260, '병렬 처리 (위 띠에 글자 없음)');
  const pa = f.place(
    docOf([
      dia('d1', [
        {
          id: 'p1',
          kind: 'parallel',
          text: '',
          branches: [
            br('r1', [p('b1', 'motor();')]),
            br('r2', [p('b2', 'led();')]),
            br('r3', [p('b3', 'beep();')]),
          ],
        },
      ]),
    ]),
    80,
    300,
  );
  const pn = pa.node('parallel', 'p1');
  expectPx('parallel top band', pn.top.height, band);
  expectPx('parallel bottom band', pn.bottom.height, band);
  const P = pa.box('p1');
  f.dimH(P.x, P.x + band, P.y - 12, `빗금 ${String(band)}`, 'start');
  f.dimV(P.x + P.width + 12, P.y, P.y + band, `size.parallel-band ${String(band)}`);
  f.dimV(
    P.x + P.width + 12,
    P.y + P.height - band,
    P.y + P.height,
    `size.parallel-band ${String(band)}`,
  );
  f.note(
    P.x,
    P.y + P.height + 22,
    '띠의 양 끝을 띠 두께만큼 빗금으로 자른다.\n분기는 세로선으로 나뉜 칸',
  );

  f.title(420, 260, '병렬 처리 (위 띠에 글자)');
  const pt = f.place(
    docOf([
      dia('d1', [
        {
          id: 'p1',
          kind: 'parallel',
          text: '센서와 통신',
          branches: [br('r1', [p('b1', 'read();')]), br('r2', [p('b2', 'send();')])],
        },
      ]),
    ]),
    460,
    300,
  );
  const tn = pt.node('parallel', 'p1');
  expectPx('parallel top band with text', tn.top.height, 32);
  const T = pt.box('p1');
  f.dimV(T.x + T.width + 12, T.y, T.y + 32, '조건 칸 32');
  f.dimV(T.x + T.width + 12, T.y + T.height - band, T.y + T.height, String(band));
  f.note(T.x, T.y + T.height + 22, '글자는 위 띠의 가운데.\n폭 ≥ 글자 + 2 × pad-x + 2 × 18');
}

function editLayerFigure(f: Figure): void {
  const s = 2;
  let top = 30;
  let rowBottom = 0;
  /** One specimen with its edit layer, in two columns; a new row starts below the lowest. */
  const cell = (
    col: 0 | 1,
    title: string,
    doc: Doc,
    note: string,
    overlay: NonNullable<PlaceOptions['overlay']>,
  ): void => {
    if (col === 0 && rowBottom > 0) {
      top = rowBottom + 44;
      rowBottom = 0;
    }
    const x = col === 0 ? 40 : 420;
    f.title(x, top, title);
    const placed = f.place(doc, x + 24, top + 34, { scale: s, overlay });
    const box = placed.box('d1');
    f.note(x + 24, box.y + box.height + 24, note);
    const lines = note.split('\n').length;
    rowBottom = Math.max(rowBottom, box.y + box.height + 24 + 14 * (lines - 1));
  };
  const process = (text: string) => docOf([dia('d1', [p('b1', text)])]);
  const one = process('tick++;');
  cell(0, '선택한 블록', one, 'edit.select 3px 실선, 블록 안쪽.\n배경은 칠하지 않음', () => ({
    selection: selectBlock(indexDoc(one.content), 'b1'),
  }));
  cell(1, '호버', one, 'edit.hover 1px 실선, 바깥 선에서 1px 안', () => ({ hover: 'b1' }));
  const newProcess = { kind: 'new', blockKind: 'process' } as const;
  const two = docOf([dia('d1', [p('b1', 'a();'), p('b2', 'b();')])]);
  cell(
    0,
    '드롭 위치 (블록 사이)',
    two,
    'edit.drop 4px 줄, 흰 테두리 2px.\n양 끝의 화살촉은 블록 밖으로 7px',
    (result, doc) => {
      const box = result.boxes.get('b2');
      if (box === undefined) throw new Error('no b2');
      const point = { x: box.x + 20, y: box.y + 3 };
      const drop = findDrop(result, indexDoc(doc.content), point, newProcess, null);
      if (drop?.mark.kind !== 'line') throw new Error('no drop line');
      return { drop };
    },
  );
  const empty = docOf([
    dia('d1', [ifOf('i1', 'ok', br('y1', [p('b2', '')]), br('n1', [p('b3', 'b();')]))]),
  ]);
  cell(
    1,
    '블록 위에 드롭 (빈 칸 채우기)',
    empty,
    'edit.drop 4px 사각형, 흰 테두리.\n블록 안 2px에서 6px까지',
    (result, doc) => {
      const box = result.boxes.get('b2');
      if (box === undefined) throw new Error('no b2');
      const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      const drop = findDrop(result, indexDoc(doc.content), point, newProcess, null);
      if (drop?.mark.kind !== 'outline') throw new Error('no drop outline');
      return { drop };
    },
  );
  cell(0, '드래그 중인 블록', two, '제자리에서 불투명도 40%', () => ({ dragged: ['b1'] }));
  const head = docOf([dia('d1', [p('b1', 'tick++;')], { kind: 'event', text: 'TIM2 인터럽트' })]);
  cell(
    1,
    '"제목처럼" 헤더를 선택함',
    head,
    '왼쪽 · 위 · 오른쪽으로 4px 넓혀\n글자를 덮지 않음',
    () => ({
      selection: { kind: 'head', diagram: 'd1' },
    }),
  );
  const branch = docOf([
    dia('d1', [
      ifOf('i1', 'btn == PRESSED', br('y1', [p('b1', 'on();')]), br('n1', [p('b2', 'off();')])),
    ]),
  ]);
  cell(0, '분기 라벨을 선택함', branch, '분기 라벨 칸(If 16, Case 28)의 안쪽에 3px 실선', () => ({
    selection: { kind: 'branchLabel', branch: 'y1' },
  }));
  f.note(
    480,
    top + 60,
    '인라인 에디터는 DOM이라 이 그림에 없다\n(7.2의 편집하는 중 그림).',
    'start',
    titleColor,
  );
}

it('writes the anatomy figures of visual design 5', async () => {
  const outlines = readGlyphOutlines(await readFontFile(blockFont.files.ttf));
  const figures: ReadonlyArray<readonly [string, (f: Figure) => void]> = [
    ['process', processFigure],
    ['if', ifFigure],
    ['case', caseFigure],
    ['loop', loopFigure],
    ['head', headFigure],
    ['fold', foldFigure],
    ['nesting', nestingFigure],
    ['diagrams', diagramsFigure],
    ['endless-exit-parallel', newBlocksFigure],
    ['edit-layer', editLayerFigure],
  ];
  for (const [name, draw] of figures) {
    const figure = new Figure(outlines);
    draw(figure);
    await writeFile(new URL(`visual-design-anatomy-${name}.svg`, assets), figure.svg());
  }
});
