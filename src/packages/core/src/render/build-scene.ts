// Scene building (ADR-0030): layout result + theme → display list. Pure.
// Shapes follow visual design 5 and 6 and the prototype's drawing.
import { blockFont } from '@ariadne-nsd/fonts';

import { geometry } from '../layout/geometry';
import { headLabel } from '../layout/layout';
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
      blockText(ctx, node.id, node.text, node.box.x + padX, node.box.y + padY);
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
      blockText(ctx, node.id, node.text, node.head.x + padX, node.head.y + padY);
      return;
    case 'if':
      ifHead(ctx, node);
      return;
    case 'case':
      caseHead(ctx, node);
      return;
  }
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
  blockText({ ...ctx, textKind: 'plain' }, node.id, node.text, x + padX, top + padY);
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
    fill: colors['text.primary'],
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
  condition(ctx, node.id, node.text, head, node.splitX);
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
  condition(ctx, node.id, node.text, head, defaultX);
  for (const column of columns) {
    // Arm labels go on the left of their cell, the default's on the right (UX Q25).
    branchLabel(ctx, node.id, column.label, head, column.isDefault ? 'end' : 'start');
  }
}

/**
 * The condition is centered over the diagonals' vertex but kept inside the header's padding.
 * A background-colored halo hides the diagonals where a long condition touches them (UX BH1).
 */
function condition(ctx: Painter, blockId: Id, text: PlacedText, head: Box, vertexX: number): void {
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
      fill: colors['text.primary'],
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

function blockText(ctx: Painter, blockId: Id, text: PlacedText, x: number, top: number): void {
  const fill = ctx.colors['text.primary'];
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
