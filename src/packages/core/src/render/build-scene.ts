// Scene building (ADR-0030): layout result + theme → display list. Pure.
// Shapes follow visual design 5 and 6 and the prototype's drawing.
import { blockFont } from '@ariadne-nsd/fonts';

import { geometry } from '../layout/geometry';
import { foldedDotsRoom, headLabel } from '../layout/layout';
import type { Box, BranchLabel, LayoutNode, LayoutResult, PlacedText } from '../layout/types';
import type { Id, TextKind } from '../model/types';
import { fontSizes, lineHeight } from '../text/measure-text';
import type { TokenKind } from '../text/syntax';
import { tokenize, tokenLines } from '../text/syntax';
import type { PathSegment, Point, Scene, SceneElement, TextRun } from './scene';
import type { ColorToken, Theme } from './theme';

/**
 * The font family list of the drawing: the bundled block font first, then fonts likely to be
 * installed, so text still fits its box where the embedded font is not loaded (R-FMT-07).
 */
export const drawingFontFamily = [
  `'${blockFont.familyName}'`,
  'D2Coding',
  'Consolas',
  "'Malgun Gothic'",
  "'Apple SD Gothic Neo'",
  'monospace',
].join(', ');

const padX = geometry['space.pad-x'];
const padY = geometry['space.pad-y'];
const labelInset = geometry['size.label-inset'];
const callBar = geometry['size.call-bar'];
/** The baseline sits this far above the bottom of its 18px line (the prototype's drawing). */
const baselineFromLineBottom = 5;
/** Structure lines are 1px (visual design 6). */
const structureWidth = 1;
/** The radius of the `∅` circle: 7px across, the slash 1px beyond it on each side (UX E1). */
const emptyRadius = 3.5;
const emptyStrokeWidth = 1.1;
/** The condition text sits this much higher than block text (the prototype's drawing). */
const conditionRaise = 2;
const band = geometry['size.band'];
const bandTextX = geometry['size.band-text-x'] + geometry['size.band-icon-room'];
const foldEdge = geometry['size.fold-edge'];
const foldIconRoom = geometry['size.fold-icon-room'];
const peekHalo = geometry['size.peek-halo'];
/** The dashed border of an opened call block: 6 drawn, 4 left out (visual design 6). */
const peekDash: readonly [number, number] = [6, 4];

/**
 * Builds the scene of a laid-out document with a theme. All color and shape decisions are made
 * here, so a rendering backend only translates the result (ADR-0030). Block text is highlighted
 * in the language `textKind` (R-LAY-07); `plain` is not.
 */
export function buildScene(
  result: LayoutResult,
  theme: Theme,
  textKind: TextKind = 'plain',
): Scene {
  const elements: SceneElement[] = [];
  const ctx: Painter = { elements, colors: theme.colors, textKind };
  for (const node of result.nodes) {
    paint(ctx, node);
  }
  return {
    width: result.width,
    height: result.height,
    paper: theme.colors.paper,
    fontFamily: drawingFontFamily,
    elements,
  };
}

/** The output list and the theme's colors, passed to every painting function. */
type Painter = {
  readonly elements: SceneElement[];
  readonly colors: Theme['colors'];
  /** The language block text is highlighted in (R-LAY-07). */
  readonly textKind: TextKind;
};

/** The color token of each token kind (visual design 3.3); `null` keeps the text's color. */
const syntaxTokens: Readonly<Record<TokenKind, ColorToken | null>> = {
  keyword: 'syntax.keyword',
  comment: 'syntax.comment',
  string: 'syntax.literal',
  number: 'syntax.literal',
  other: null,
};

/**
 * The runs of each line of a block text, colored by the syntax of the document's language
 * (R-LAY-07, ADR-0032). The text is tokenized as a whole, so a comment may span lines.
 */
function highlightedLines(ctx: Painter, text: PlacedText): ReadonlyArray<ReadonlyArray<TextRun>> {
  if (ctx.textKind === 'plain') {
    return text.lines.map((line) => (line === '' ? [] : [{ text: line, weight: 400 }]));
  }
  const lines = tokenLines(tokenize(text.lines.join('\n'), ctx.textKind));
  return lines.map((tokens) =>
    tokens.map((token): TextRun => {
      const color = syntaxTokens[token.kind];
      return color === null
        ? { text: token.text, weight: 400 }
        : { text: token.text, weight: 400, fill: ctx.colors[color] };
    }),
  );
}

function paint(ctx: Painter, node: LayoutNode): void {
  const colors = ctx.colors;
  switch (node.kind) {
    case 'process':
      rect(ctx, node.id, node.box, colors['block.process']);
      blockText(
        written(ctx, node),
        node.id,
        node.text,
        node.box.x + padX,
        node.box.y + padY,
        ink(ctx, node),
      );
      if (node.isEmptyBranch) {
        emptyMark(ctx, node.id, node.box);
      }
      return;
    case 'diagramHead':
      diagramHead(ctx, node);
      return;
    case 'missingDefault':
      rect(ctx, node.caseId, node.box, colors['block.process']);
      emptyMark(ctx, node.caseId, node.box);
      return;
    case 'call':
      call(ctx, node);
      return;
    case 'loop':
      rect(ctx, node.id, node.box, colors['block.loop']);
      blockText(
        written(ctx, node),
        node.id,
        node.text,
        node.head.x + padX,
        node.head.y + padY,
        ink(ctx, node),
      );
      return;
    case 'if':
      ifHead(ctx, node);
      return;
    case 'case':
      caseHead(ctx, node);
      return;
    case 'foldedSeq':
      foldedSeq(ctx, node);
      return;
    case 'foldCell':
      foldCell(ctx, node);
      return;
    case 'foldFrame':
      foldFrame(ctx, node);
      return;
    case 'peek':
      peek(ctx, node);
      return;
  }
}

/** The text color of a node: grey inside an opened call block (visual design 3.3 `peek.text`). */
function ink(ctx: Painter, node: { readonly isPeeked?: true }): string {
  return node.isPeeked === true ? ctx.colors['peek.text'] : ctx.colors['text.primary'];
}

/**
 * The painter for a node's text: an opened Method's blocks (a peek) are not highlighted
 * (visual design 7.1, UX SY1).
 */
function written(ctx: Painter, node: { readonly isPeeked?: true }): Painter {
  return node.isPeeked === true && ctx.textKind !== 'plain' ? { ...ctx, textKind: 'plain' } : ctx;
}

/** Slanted text for what has no name of its own yet (visual design 4.2). */
function slant(isNamed: boolean): { readonly isItalic?: true } {
  return isNamed ? {} : { isItalic: true };
}

/**
 * A folded branch or loop body: a pale cell with three dots and "n blocks" slanted in the muted
 * color (visual design 7.1). The dots are shapes, so a viewer without the glyph still shows them.
 */
function foldedSeq(ctx: Painter, node: Extract<LayoutNode, { kind: 'foldedSeq' }>): void {
  const colors = ctx.colors;
  const { box } = node;
  rect(ctx, node.id, box, colors['block.folded']);
  const y = baseline(box.y + padY, 0) - 3.5;
  for (const dx of [3, 7, 11]) {
    ctx.elements.push({
      kind: 'circle',
      blockId: node.id,
      cx: box.x + padX + dx,
      cy: y,
      r: 0.6,
      stroke: colors['text.muted'],
      strokeWidth: 1.2,
    });
  }
  ctx.elements.push({
    kind: 'text',
    blockId: node.id,
    x: box.x + padX + foldedDotsRoom,
    y: baseline(box.y + padY, 0),
    anchor: 'start',
    fontSize: fontSizes.secondary,
    fill: colors['text.muted'],
    runs: [{ text: node.text, weight: 400, isItalic: true }],
    halo: null,
  });
}

/** A folded fold region: a pale cell and its name; a default name is slanted (visual design 7.1). */
function foldCell(ctx: Painter, node: Extract<LayoutNode, { kind: 'foldCell' }>): void {
  const { box } = node;
  rect(ctx, node.id, box, ctx.colors['block.folded']);
  const fill = ink(ctx, node);
  node.name.lines.forEach((text, index) => {
    if (text === '') {
      return;
    }
    ctx.elements.push({
      kind: 'text',
      blockId: node.id,
      x: box.x + foldIconRoom,
      y: baseline(box.y + padY, index),
      anchor: 'start',
      fontSize: fontSizes.body,
      fill,
      runs: [{ text, weight: 400, ...slant(node.isNamed) }],
      halo: null,
    });
  });
}

/**
 * An unfolded fold region with name bands on: the name band on top and a 3px border whose middle
 * is 1px inside the box, so it starts on the same pixel line as the thin lines (visual design 6,
 * 9.1). Painted after the blocks inside, over their outer lines.
 */
function foldFrame(ctx: Painter, node: Extract<LayoutNode, { kind: 'foldFrame' }>): void {
  const colors = ctx.colors;
  const { box, band: bandBox } = node;
  ctx.elements.push({
    kind: 'rect',
    blockId: node.id,
    x: bandBox.x,
    y: bandBox.y,
    width: bandBox.width,
    height: bandBox.height,
    fill: colors['fold.band'],
    stroke: colors['fold.band'],
    strokeWidth: structureWidth,
  });
  const name = node.name.lines[0] ?? '';
  if (name !== '') {
    ctx.elements.push({
      kind: 'text',
      blockId: node.id,
      x: bandBox.x + bandTextX,
      y: bandBox.y + band - baselineFromLineBottom,
      anchor: 'start',
      fontSize: fontSizes.secondary,
      fill: colors['fold.name'],
      runs: [{ text: name, weight: 600, ...slant(node.isNamed) }],
      halo: null,
    });
  }
  const offset = (foldEdge - 1) / 2;
  ctx.elements.push({
    kind: 'rect',
    blockId: node.id,
    x: box.x + offset,
    y: box.y + offset,
    width: box.width - 2 * offset,
    height: box.height - 2 * offset,
    fill: 'none',
    stroke: colors['fold.edge'],
    strokeWidth: foldEdge,
  });
}

/**
 * An opened call block (visual design 6): a white 3px line under a 1px dashed border 1px inside
 * the outer line, which hides the outer lines of the blocks inside so the dashes stand alone,
 * and the band with the call's text on top. The double bars are not drawn while it is open.
 */
function peek(ctx: Painter, node: Extract<LayoutNode, { kind: 'peek' }>): void {
  const colors = ctx.colors;
  const { box, band: bandBox } = node;
  const inner: ReadonlyArray<Point> = [
    [box.x + 1, box.y + 1],
    [box.x + box.width - 1, box.y + 1],
    [box.x + box.width - 1, box.y + box.height - 1],
    [box.x + 1, box.y + box.height - 1],
    [box.x + 1, box.y + 1],
  ];
  ctx.elements.push(
    {
      kind: 'polyline',
      blockId: node.id,
      points: inner,
      stroke: colors['peek.halo'],
      strokeWidth: peekHalo,
      dash: null,
      isRoundCap: false,
    },
    {
      kind: 'rect',
      blockId: node.id,
      x: bandBox.x,
      y: bandBox.y,
      width: bandBox.width,
      height: bandBox.height,
      fill: colors['peek.band'],
      stroke: colors['line.structure'],
      strokeWidth: structureWidth,
    },
    {
      kind: 'polyline',
      blockId: node.id,
      points: inner,
      stroke: colors['peek.edge'],
      strokeWidth: structureWidth,
      dash: peekDash,
      isRoundCap: false,
    },
  );
  const runs: TextRun[] = [
    { text: node.before, weight: 400 },
    { text: node.name, weight: 600 },
    { text: node.after, weight: 400 },
  ].filter((run): run is TextRun => run.text !== '');
  ctx.elements.push({
    kind: 'text',
    blockId: node.id,
    x: bandBox.x + bandTextX,
    y: bandBox.y + band - baselineFromLineBottom,
    anchor: 'start',
    fontSize: fontSizes.secondary,
    fill: colors['peek.text'],
    runs,
    halo: null,
  });
}

/**
 * The header of a diagram (visual design principle 2, 02-layout 1.5). Shape: the Event's hat
 * rises on the left, the Method's low arch spans the width (the prototype's curves). Title: a
 * muted label, the bold name and a 1px rule, on the paper.
 */
function diagramHead(ctx: Painter, node: Extract<LayoutNode, { kind: 'diagramHead' }>): void {
  const colors = ctx.colors;
  const { x, y, width: w, height: h } = node.box;
  if (node.style === 'title') {
    const tag = geometry['size.title-tag'];
    ctx.elements.push({
      kind: 'text',
      blockId: node.id,
      x,
      y: y + tag - 4,
      anchor: 'start',
      fontSize: fontSizes.secondary,
      fill: colors['text.muted'],
      runs: [{ text: headLabel(node.headKind), weight: 400 }],
      halo: null,
    });
    node.text.lines.forEach((line, index) => {
      if (line === '') {
        return;
      }
      ctx.elements.push({
        kind: 'text',
        blockId: node.id,
        x,
        y: baseline(y + tag, index),
        anchor: 'start',
        fontSize: fontSizes.body,
        fill: colors['text.primary'],
        runs: [{ text: line, weight: 600 }],
        halo: null,
      });
    });
    polyline(ctx, node.id, [
      [x, y + h],
      [x + w, y + h],
    ]);
    return;
  }
  const top = y + geometry['size.hat'];
  const segments: PathSegment[] =
    node.headKind === 'method'
      ? [
          { kind: 'move', to: [x, top] },
          { kind: 'curve', c1: [x + w * 0.2, y + 1], c2: [x + w * 0.8, y + 1], to: [x + w, top] },
          { kind: 'line', to: [x + w, y + h] },
          { kind: 'line', to: [x, y + h] },
        ]
      : hatSegments(x, y, w, h, top);
  ctx.elements.push({
    kind: 'path',
    blockId: node.id,
    segments,
    fill: node.headKind === 'method' ? colors['block.call'] : colors['block.event'],
    stroke: colors['line.structure'],
    strokeWidth: structureWidth,
  });
  // The header is a name, not code: it is not highlighted (visual design 3.3).
  blockText(
    { ...ctx, textKind: 'plain' },
    node.id,
    node.text,
    x + padX,
    top + padY,
    colors['text.primary'],
  );
}

/** The Event hat: a bump `min(size.hat-w, 45%)` wide on the left, then the flat top. */
function hatSegments(x: number, y: number, w: number, h: number, top: number): PathSegment[] {
  const hat = Math.min(geometry['size.hat-w'], w * 0.45);
  return [
    { kind: 'move', to: [x, top] },
    { kind: 'curve', c1: [x + 22, y - 2], c2: [x + hat - 22, y - 2], to: [x + hat, top] },
    { kind: 'line', to: [x + w, top] },
    { kind: 'line', to: [x + w, y + h] },
    { kind: 'line', to: [x, y + h] },
  ];
}

function call(ctx: Painter, node: Extract<LayoutNode, { kind: 'call' }>): void {
  const colors = ctx.colors;
  const { box } = node;
  rect(ctx, node.id, box, colors['block.call']);
  // The double bars of the NS chart call symbol; dashed when the target is lost.
  for (const x of [box.x + callBar, box.x + box.width - callBar]) {
    ctx.elements.push({
      kind: 'polyline',
      blockId: node.id,
      points: [
        [x, box.y],
        [x, box.y + box.height],
      ],
      stroke: colors['line.structure'],
      strokeWidth: structureWidth,
      dash: node.isLost ? [3, 3] : null,
      isRoundCap: false,
    });
  }
  const runs: TextRun[] = [
    { text: node.before, weight: 400 },
    { text: node.name, weight: 600 },
    { text: node.after, weight: 400 },
  ].filter((run): run is TextRun => run.text !== '');
  ctx.elements.push({
    kind: 'text',
    blockId: node.id,
    x: box.x + padX + callBar,
    y: baseline(box.y + padY, 0),
    anchor: 'start',
    fontSize: fontSizes.body,
    fill: ink(ctx, node),
    runs,
    halo: null,
  });
}

function ifHead(ctx: Painter, node: Extract<LayoutNode, { kind: 'if' }>): void {
  const colors = ctx.colors;
  const { head } = node;
  rect(ctx, node.id, head, colors['block.branch']);
  polyline(ctx, node.id, [
    [head.x, head.y],
    [node.splitX, head.y + head.height],
    [head.x + head.width, head.y],
  ]);
  condition(written(ctx, node), node.id, node.text, head, node.splitX, ink(ctx, node));
  branchLabel(ctx, node.id, node.yes, head, 'start');
  branchLabel(ctx, node.id, node.no, head, 'end');
}

function caseHead(ctx: Painter, node: Extract<LayoutNode, { kind: 'case' }>): void {
  const colors = ctx.colors;
  const { head, columns } = node;
  const defaultX = columns[columns.length - 1]?.label.column.x ?? head.x;
  const bottom = head.y + head.height;
  rect(ctx, node.id, head, colors['block.branch']);
  if (defaultX === head.x) {
    // Only a default: the long diagonal has no length, so only the short one is drawn (UX CD2).
    polyline(ctx, node.id, [
      [head.x + head.width, head.y],
      [head.x, bottom],
    ]);
  } else {
    polyline(ctx, node.id, [
      [head.x, head.y],
      [defaultX, bottom],
      [head.x + head.width, head.y],
    ]);
    // Lines between arms come down from the long diagonal (02-layout 1.4).
    for (const column of columns.slice(1, -1)) {
      const x = column.label.column.x;
      const y = head.y + (head.height * (x - head.x)) / (defaultX - head.x);
      polyline(ctx, node.id, [
        [x, y],
        [x, bottom],
      ]);
    }
  }
  condition(written(ctx, node), node.id, node.text, head, defaultX, ink(ctx, node));
  for (const column of columns) {
    // Arm labels go on the left of their cell, the default's on the right (UX Q25).
    branchLabel(ctx, node.id, column.label, head, column.isDefault ? 'end' : 'start');
  }
}

/**
 * The condition is centered over the diagonals' vertex but kept inside the header's padding.
 * A background-colored halo hides the diagonals where a long condition touches them (UX BH1).
 */
function condition(
  ctx: Painter,
  blockId: Id,
  text: PlacedText,
  head: Box,
  vertexX: number,
  fill: string,
): void {
  const colors = ctx.colors;
  const half = text.width / 2;
  const x = Math.min(Math.max(vertexX, head.x + half + padX), head.x + head.width - half - padX);
  const top = head.y + padY - conditionRaise;
  highlightedLines(ctx, text).forEach((runs, index) => {
    if (runs.length === 0) {
      return;
    }
    ctx.elements.push({
      kind: 'text',
      blockId,
      x,
      y: baseline(top, index),
      anchor: 'middle',
      fontSize: fontSizes.body,
      fill,
      runs,
      halo: { color: colors['block.branch'], width: geometry['size.text-halo'] },
    });
  });
}

function branchLabel(
  ctx: Painter,
  blockId: Id,
  label: BranchLabel,
  head: Box,
  anchor: 'start' | 'end',
): void {
  if (label.text === '') {
    return;
  }
  const { column } = label;
  ctx.elements.push({
    kind: 'text',
    blockId,
    x: anchor === 'start' ? column.x + labelInset : column.x + column.width - labelInset,
    y: head.y + head.height - baselineFromLineBottom,
    anchor,
    fontSize: fontSizes.secondary,
    fill: ctx.colors['text.secondary'],
    runs: [{ text: label.text, weight: 400 }],
    halo: null,
  });
}

function blockText(
  ctx: Painter,
  blockId: Id,
  text: PlacedText,
  x: number,
  top: number,
  fill: string,
): void {
  highlightedLines(ctx, text).forEach((runs, index) => {
    if (runs.length === 0) {
      return;
    }
    ctx.elements.push({
      kind: 'text',
      blockId,
      x,
      y: baseline(top, index),
      anchor: 'start',
      fontSize: fontSizes.body,
      fill,
      runs,
      halo: null,
    });
  });
}

/** The `∅` of an empty branch, centered in the cell (UX E1, R-LAY-09). */
function emptyMark(ctx: Painter, blockId: Id, box: Box): void {
  const stroke = ctx.colors['text.muted'];
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const reach = emptyRadius + 1;
  ctx.elements.push(
    { kind: 'circle', blockId, cx, cy, r: emptyRadius, stroke, strokeWidth: emptyStrokeWidth },
    {
      kind: 'polyline',
      blockId,
      points: [
        [cx - reach, cy + reach],
        [cx + reach, cy - reach],
      ],
      stroke,
      strokeWidth: emptyStrokeWidth,
      dash: null,
      isRoundCap: true,
    },
  );
}

function rect(ctx: Painter, blockId: Id, box: Box, fill: string): void {
  ctx.elements.push({
    kind: 'rect',
    blockId,
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    fill,
    stroke: ctx.colors['line.structure'],
    strokeWidth: structureWidth,
  });
}

function polyline(ctx: Painter, blockId: Id, points: ReadonlyArray<Point>): void {
  ctx.elements.push({
    kind: 'polyline',
    blockId,
    points,
    stroke: ctx.colors['line.structure'],
    strokeWidth: structureWidth,
    dash: null,
    isRoundCap: false,
  });
}

/** The baseline of line `index` of a text whose first line starts at `top`. */
function baseline(top: number, index: number): number {
  return top + (index + 1) * lineHeight - baselineFromLineBottom;
}
