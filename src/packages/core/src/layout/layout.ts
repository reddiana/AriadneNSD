// Layout in two passes (02-layout 1.1, ADR-0037): measure the smallest size of every block from
// the inside out, then place from the outside in, giving each child its real box.
// The whole document is laid out again on every edit; there is no incremental layout.
import type { Locale } from '../i18n/messages';
import { drawingMessage } from '../i18n/messages';
import type {
  Block,
  Branch,
  Call,
  Case,
  Diagram,
  Doc,
  DoWhile,
  For,
  Id,
  If,
  Seq,
  View,
  While,
} from '../model/types';
import { fontSizes, measureLine, measureText } from '../text/measure-text';
import type { TextSize } from '../text/measure-text';
import { callParts } from './call-text';
import { geometry } from './geometry';
import type {
  Box,
  BranchLabel,
  CaseColumn,
  DiagramLayout,
  HitRegion,
  LayoutNode,
  LayoutResult,
  PlacedText,
} from './types';

/** Options of `layout`. */
export type LayoutOptions = {
  /** The language of the fixed words in the drawing ("true" / "false"), R-NFR-04. */
  readonly locale: Locale;
};

const padX = geometry['space.pad-x'];
const padY = geometry['space.pad-y'];
const line = geometry['space.line'];
const blockMinWidth = geometry['size.block-min-w'];
const loopStrip = geometry['size.loop-strip'];
const labelRoom = geometry['size.label-room'];
const callBar = geometry['size.call-bar'];
const diagramMinWidth = geometry['size.diagram-min-w'];
const diagramGap = geometry['space.diagram'];
const paper = geometry['space.paper'];

/** The size of an empty process block: the stand-in for a Case's missing default (UX CD1). */
const emptyBlockSize = {
  width: Math.max(blockMinWidth, 2 * padX),
  height: line + 2 * padY,
};

type Size = { readonly width: number; readonly height: number };

type Measure =
  | (Size & { readonly kind: 'process'; readonly text: TextSize })
  | (Size & {
      readonly kind: 'call';
      readonly before: string;
      readonly name: string;
      readonly after: string;
    })
  | (Size & { readonly kind: 'loop'; readonly text: TextSize; readonly headHeight: number })
  | (Size & {
      readonly kind: 'if';
      readonly text: TextSize;
      readonly headHeight: number;
      readonly labels: readonly [string, string];
      /** Smallest widths of the true and false branches, label room included. */
      readonly branchWidths: readonly [number, number];
    })
  | (Size & {
      readonly kind: 'case';
      readonly text: TextSize;
      readonly headHeight: number;
      /** Arms, then the default (drawn even when the model has none, UX CD1). */
      readonly labels: ReadonlyArray<string>;
      readonly columnWidths: ReadonlyArray<number>;
    });

/** What both passes need besides the tree. */
type Context = {
  readonly locale: Locale;
  readonly view: View;
  readonly diagrams: ReadonlyMap<Id, Diagram>;
  readonly measures: Map<Id, Measure>;
  readonly boxes: Map<Id, Box>;
  readonly regions: HitRegion[];
  readonly nodes: LayoutNode[];
};

/**
 * Lays out a document: every block's bounding box, the click regions and what to draw
 * (02-layout 1). Pure: the same document and options give the same result (R-FMT-03).
 *
 * MVP scope: fold regions are drawn as if their name bands were off (02-layout 1.6), and folded
 * things are drawn unfolded.
 */
export function layout(doc: Doc, options: LayoutOptions): LayoutResult {
  const context: Context = {
    locale: options.locale,
    view: doc.view,
    diagrams: new Map(doc.content.diagrams.map((diagram) => [diagram.id, diagram])),
    measures: new Map(),
    boxes: new Map(),
    regions: [],
    nodes: [],
  };

  const headStyle = doc.content.settings.headStyle;
  const measuredDiagrams = doc.content.diagrams.map((diagram) =>
    measureDiagram(context, diagram, headStyle),
  );
  const arrangement = arrange(measuredDiagrams);

  const diagrams: DiagramLayout[] = [];
  for (const { measure, x, y } of arrangement.placed) {
    const { diagram, width, headHeight, bodyHeight, headText } = measure;
    const box: Box = { x: paper + x, y: paper + y, width, height: headHeight + bodyHeight };
    let head: Box | null = null;
    if (diagram.head !== null && headText !== null) {
      head = { x: box.x, y: box.y, width, height: headHeight };
      context.nodes.push({
        kind: 'diagramHead',
        id: diagram.id,
        headKind: diagram.head.kind,
        style: headStyle,
        box: head,
        text: placedText(headText),
      });
      context.regions.push({ kind: 'diagramHead', diagramId: diagram.id, box: head });
    }
    const body: Box = { x: box.x, y: box.y + headHeight, width, height: bodyHeight };
    placeSeq(context, diagram.body, body, false);
    context.boxes.set(diagram.id, box);
    diagrams.push({ id: diagram.id, box, head, body });
  }

  return {
    width: paper + arrangement.width + paper,
    height: paper + arrangement.height + paper,
    diagrams,
    boxes: context.boxes,
    regions: context.regions,
    nodes: context.nodes,
  };
}

/** A diagram measured as a whole: its header and body heights and its width (02-layout 1.5). */
type DiagramMeasure = {
  readonly diagram: Diagram;
  readonly width: number;
  readonly headHeight: number;
  readonly bodyHeight: number;
  /** The measured header text, or `null` without a header. */
  readonly headText: TextSize | null;
};

function measureDiagram(
  context: Context,
  diagram: Diagram,
  headStyle: 'shape' | 'title',
): DiagramMeasure {
  const body = measureSeq(context, diagram.body);
  let width = Math.max(body.width, diagramMinWidth);
  if (diagram.head === null) {
    return { diagram, width, headHeight: 0, bodyHeight: body.height, headText: null };
  }
  const text = measureText(diagram.head.text);
  let headHeight: number;
  if (headStyle === 'title') {
    // A label line, the bold name, and a gap above the rule. The text lines up with the
    // diagram's left edge, so no padding is added (visual design 5).
    const label = measureLine(headLabel(diagram.head.kind), fontSizes.secondary);
    width = Math.max(width, text.width, label);
    headHeight = geometry['size.title-tag'] + text.height + geometry['size.title-gap'];
  } else {
    width = Math.max(width, text.width + 2 * padX + geometry['size.hat-room']);
    headHeight = geometry['size.hat'] + text.height + 2 * padY;
  }
  return { diagram, width, headHeight, bodyHeight: body.height, headText: text };
}

/** The small label above a header drawn like a title. The same words in every language. */
export function headLabel(kind: 'event' | 'method'): string {
  return kind === 'event' ? 'Event' : 'Method';
}

type Placed = { readonly measure: DiagramMeasure; readonly x: number; readonly y: number };
type Stacked = { readonly width: number; readonly height: number; readonly placed: Placed[] };

/**
 * Places the diagrams (02-layout 1.7): Events and diagrams without a header on the left, Methods
 * on the right. Each group is stacked top to bottom and wraps into a new column past the column
 * height. The column height is chosen, in 4px steps, so the whole picture is closest to 16 : 10.
 * Coordinates are relative to the paper margin.
 */
function arrange(measures: ReadonlyArray<DiagramMeasure>): Stacked {
  const left = measures.filter((m) => m.diagram.head?.kind !== 'method');
  const right = measures.filter((m) => m.diagram.head?.kind === 'method');
  const heightOf = (m: DiagramMeasure): number => m.headHeight + m.bodyHeight;
  const tallest = Math.max(0, ...measures.map(heightOf));
  const oneColumn = (group: ReadonlyArray<DiagramMeasure>): number =>
    sum(group.map(heightOf)) + Math.max(0, group.length - 1) * diagramGap;
  const lowest = Math.max(geometry['size.column-min'], tallest);
  const highest = Math.max(lowest, oneColumn(left), oneColumn(right));

  const tryLimit = (limit: number) => {
    const a = stack(left, limit, heightOf);
    const b = stack(right, limit, heightOf);
    const gap = a.width > 0 && b.width > 0 ? geometry['space.kind-gap'] : 0;
    const width = a.width + gap + b.width;
    const height = Math.max(a.height, b.height);
    const score = height === 0 ? 0 : Math.abs(width / height - 1.6);
    return { score, a, b, width, height };
  };
  let best = tryLimit(lowest);
  for (let limit = lowest + 4; limit <= highest + 3; limit += 4) {
    const candidate = tryLimit(limit);
    if (candidate.score < best.score - 1e-9) {
      best = candidate;
    }
  }
  const shift =
    best.a.width + (best.a.width > 0 && best.b.width > 0 ? geometry['space.kind-gap'] : 0);
  return {
    width: best.width,
    height: best.height,
    placed: [...best.a.placed, ...best.b.placed.map((p) => ({ ...p, x: p.x + shift }))],
  };
}

/** Stacks one group in columns no taller than `limit` (the first diagram of a column may be). */
function stack(
  group: ReadonlyArray<DiagramMeasure>,
  limit: number,
  heightOf: (m: DiagramMeasure) => number,
): Stacked {
  let x = 0;
  let y = 0;
  let widest = 0;
  let bottom = 0;
  const placed: Placed[] = [];
  for (const measure of group) {
    const height = heightOf(measure);
    if (y > 0 && y + height > limit) {
      x += widest + diagramGap;
      y = 0;
      widest = 0;
    }
    placed.push({ measure, x, y });
    widest = Math.max(widest, measure.width);
    bottom = Math.max(bottom, y + height);
    y += height + diagramGap;
  }
  return { width: group.length > 0 ? x + widest : 0, height: bottom, placed };
}

// Pass 1: measure (inside out).

function measureSeq(context: Context, seq: Seq): Size {
  let width = 0;
  let height = 0;
  for (const block of seq.blocks) {
    const size = measureBlock(context, block);
    width = Math.max(width, size.width);
    height += size.height;
  }
  return { width, height };
}

function measureBlock(context: Context, block: Block): Measure {
  const measure = measureBlockOnce(context, block);
  context.measures.set(block.id, measure);
  return measure;
}

function measureBlockOnce(context: Context, block: Block): Measure {
  switch (block.kind) {
    case 'process': {
      const text = measureText(block.text);
      return {
        kind: 'process',
        text,
        width: Math.max(blockMinWidth, text.width + 2 * padX),
        height: text.height + 2 * padY,
      };
    }
    case 'call':
      return measureCall(context, block);
    case 'while':
    case 'doWhile':
    case 'for':
      return measureLoop(context, block);
    case 'if':
      return measureIf(context, block);
    case 'case':
      return measureCase(context, block);
  }
}

function measureLoop(context: Context, block: While | DoWhile | For): Measure {
  const text = measureText(block.text);
  const headHeight = text.height + 2 * padY;
  const body = measureSeq(context, block.body);
  return {
    kind: 'loop',
    text,
    headHeight,
    width: Math.max(text.width + 2 * padX, loopStrip + body.width),
    height: headHeight + body.height,
  };
}

/** The smallest width of a branch column: its sequence, or its label plus room (02-layout 1.4). */
function columnWidth(sequenceWidth: number, label: string): number {
  return Math.max(sequenceWidth, measureLine(label, fontSizes.secondary) + labelRoom);
}

function measureIf(context: Context, block: If): Measure {
  const text = measureText(block.text);
  const headHeight = text.height + 2 * padY + geometry['size.if-label'];
  const headWidth = text.width + 2 * padX + geometry['size.if-head-extra'];
  const labels = [
    block.yes.label ?? drawingMessage(context.locale, 'if.yes'),
    block.no.label ?? drawingMessage(context.locale, 'if.no'),
  ] as const;
  const yes = measureSeq(context, block.yes.body);
  const no = measureSeq(context, block.no.body);
  const branchWidths = [
    columnWidth(yes.width, labels[0]),
    columnWidth(no.width, labels[1]),
  ] as const;
  return {
    kind: 'if',
    text,
    headHeight,
    labels,
    branchWidths,
    width: Math.max(headWidth, branchWidths[0] + branchWidths[1]),
    height: headHeight + Math.max(yes.height, no.height),
  };
}

function measureCase(context: Context, block: Case): Measure {
  const text = measureText(block.text);
  const headHeight = text.height + 2 * padY + geometry['size.case-label'];
  const headWidth = text.width + 2 * padX + geometry['size.case-head-extra'];
  const labels: string[] = [];
  const columnWidths: number[] = [];
  let bodyHeight = 0;
  for (const arm of block.arms) {
    const size = measureSeq(context, arm.body);
    labels.push(arm.label);
    columnWidths.push(columnWidth(size.width, arm.label));
    bodyHeight = Math.max(bodyHeight, size.height);
  }
  const defaultLabel = block.otherwise?.label ?? drawingMessage(context.locale, 'case.default');
  const defaultSize = block.otherwise ? measureSeq(context, block.otherwise.body) : emptyBlockSize;
  labels.push(defaultLabel);
  columnWidths.push(columnWidth(defaultSize.width, defaultLabel));
  bodyHeight = Math.max(bodyHeight, defaultSize.height);
  return {
    kind: 'case',
    text,
    headHeight,
    labels,
    columnWidths,
    width: Math.max(headWidth, sum(columnWidths)),
    height: headHeight + bodyHeight,
  };
}

function measureCall(context: Context, block: Call): Measure {
  const parts = callParts(
    { locale: context.locale, resultSymbol: context.view.resultSymbol, diagrams: context.diagrams },
    block,
  );
  const width =
    measureLine(parts.before) +
    measureLine(parts.name) +
    measureLine(parts.after) +
    2 * padX +
    2 * callBar;
  return { kind: 'call', ...parts, width, height: line + 2 * padY };
}

// Pass 2: place (outside in).

/**
 * Places a sequence in its box. Every block gets the full width. When the box is taller than the
 * blocks, the leftover height is shared equally and the last block takes the remainder
 * (02-layout 1.3, UX SB1).
 */
function placeSeq(context: Context, seq: Seq, box: Box, isBranch: boolean): void {
  const count = seq.blocks.length;
  let needed = 0;
  for (const block of seq.blocks) {
    needed += measured(context, block.id).height;
  }
  const each = Math.floor(Math.max(0, box.height - needed) / count);
  const isEmptyBranch = isBranch && count === 1 && isEmptyBlock(seq.blocks[0]);
  let y = box.y;
  seq.blocks.forEach((block, index) => {
    const isLast = index === count - 1;
    const height = isLast ? box.y + box.height - y : measured(context, block.id).height + each;
    placeBlock(context, block, { x: box.x, y, width: box.width, height }, isEmptyBranch);
    y += height;
  });
}

function isEmptyBlock(block: Block | undefined): boolean {
  return block?.kind === 'process' && block.text === '';
}

function measured(context: Context, id: Id): Measure {
  const measure = context.measures.get(id);
  if (measure === undefined) {
    throw new Error(`Layout: block ${id} was not measured`);
  }
  return measure;
}

function placeBlock(context: Context, block: Block, box: Box, isEmptyBranch: boolean): void {
  context.boxes.set(block.id, box);
  const measure = measured(context, block.id);
  switch (block.kind) {
    case 'process':
      if (measure.kind === 'process') {
        context.nodes.push({
          kind: 'process',
          id: block.id,
          box,
          text: placedText(measure.text),
          isEmptyBranch,
        });
        context.regions.push({ kind: 'block', blockId: block.id, box });
      }
      return;
    case 'call':
      if (measure.kind === 'call') {
        context.nodes.push({
          kind: 'call',
          id: block.id,
          box,
          before: measure.before,
          name: measure.name,
          after: measure.after,
          isLost: block.target.kind === 'lost',
        });
        context.regions.push({ kind: 'block', blockId: block.id, box });
      }
      return;
    case 'while':
    case 'doWhile':
    case 'for':
      if (measure.kind === 'loop') {
        placeLoop(context, block, box, measure);
      }
      return;
    case 'if':
      if (measure.kind === 'if') {
        placeIf(context, block, box, measure);
      }
      return;
    case 'case':
      if (measure.kind === 'case') {
        placeCase(context, block, box, measure);
      }
      return;
  }
}

function placedText(text: TextSize): PlacedText {
  return { lines: text.lines, width: text.width };
}

function placeLoop(
  context: Context,
  block: While | DoWhile | For,
  box: Box,
  measure: Extract<Measure, { kind: 'loop' }>,
): void {
  const isBottom = block.kind === 'doWhile';
  const headHeight = measure.headHeight;
  const head: Box = {
    x: box.x,
    y: isBottom ? box.y + box.height - headHeight : box.y,
    width: box.width,
    height: headHeight,
  };
  context.nodes.push({
    kind: 'loop',
    id: block.id,
    loop: block.kind,
    box,
    head,
    text: placedText(measure.text),
  });
  context.regions.push({ kind: 'head', blockId: block.id, box: head });
  // Extra height goes to the body, not the header (02-layout 1.3).
  placeSeq(
    context,
    block.body,
    {
      x: box.x + loopStrip,
      y: isBottom ? box.y : box.y + headHeight,
      width: box.width - loopStrip,
      height: box.height - headHeight,
    },
    false,
  );
}

/**
 * Splits a width among columns in proportion to their smallest widths; the last column takes the
 * remainder so the total stays exact (02-layout 1.4).
 */
function splitWidth(total: number, minimums: ReadonlyArray<number>): number[] {
  const minimumSum = sum(minimums);
  const extra = total - minimumSum;
  const widths: number[] = [];
  let used = 0;
  minimums.forEach((minimum, index) => {
    const width =
      index === minimums.length - 1
        ? total - used
        : Math.round(minimum + (extra * minimum) / minimumSum);
    widths.push(width);
    used += width;
  });
  return widths;
}

function labelRow(column: Box, head: Box, rowHeight: number): Box {
  return {
    x: column.x,
    y: head.y + head.height - rowHeight,
    width: column.width,
    height: rowHeight,
  };
}

function placeIf(
  context: Context,
  block: If,
  box: Box,
  measure: Extract<Measure, { kind: 'if' }>,
): void {
  const head: Box = { x: box.x, y: box.y, width: box.width, height: measure.headHeight };
  const [yesWidth = 0] = splitWidth(box.width, measure.branchWidths);
  const bodyY = box.y + measure.headHeight;
  const bodyHeight = box.height - measure.headHeight;
  const yesBox: Box = { x: box.x, y: bodyY, width: yesWidth, height: bodyHeight };
  const noBox: Box = {
    x: box.x + yesWidth,
    y: bodyY,
    width: box.width - yesWidth,
    height: bodyHeight,
  };
  const yes: BranchLabel = { text: measure.labels[0], column: yesBox };
  const no: BranchLabel = { text: measure.labels[1], column: noBox };
  context.nodes.push({
    kind: 'if',
    id: block.id,
    box,
    head,
    text: placedText(measure.text),
    splitX: noBox.x,
    yes,
    no,
  });
  context.regions.push({ kind: 'head', blockId: block.id, box: head });
  const rowHeight = geometry['size.if-label'];
  context.regions.push(
    branchLabelRegion(block.id, block.yes.id, 0, labelRow(yesBox, head, rowHeight)),
    branchLabelRegion(block.id, block.no.id, 1, labelRow(noBox, head, rowHeight)),
  );
  placeBranch(context, block.yes, yesBox);
  placeBranch(context, block.no, noBox);
}

function branchLabelRegion(blockId: Id, branchId: Id | null, index: number, box: Box): HitRegion {
  return { kind: 'branchLabel', blockId, branchId, index, box };
}

function placeBranch(context: Context, branch: Branch, box: Box): void {
  context.boxes.set(branch.id, box);
  placeSeq(context, branch.body, box, true);
}

function placeCase(
  context: Context,
  block: Case,
  box: Box,
  measure: Extract<Measure, { kind: 'case' }>,
): void {
  const head: Box = { x: box.x, y: box.y, width: box.width, height: measure.headHeight };
  const widths = splitWidth(box.width, measure.columnWidths);
  const bodyY = box.y + measure.headHeight;
  const bodyHeight = box.height - measure.headHeight;
  const branches: ReadonlyArray<Branch | null> = [...block.arms, block.otherwise];
  const columns: CaseColumn[] = [];
  let x = box.x;
  branches.forEach((branch, index) => {
    const width = widths[index] ?? 0;
    const column: Box = { x, y: bodyY, width, height: bodyHeight };
    columns.push({
      branchId: branch?.id ?? null,
      isDefault: index === branches.length - 1,
      label: { text: measure.labels[index] ?? '', column },
    });
    x += width;
  });

  context.nodes.push({
    kind: 'case',
    id: block.id,
    box,
    head,
    text: placedText(measure.text),
    columns,
  });
  context.regions.push({ kind: 'head', blockId: block.id, box: head });
  const rowHeight = geometry['size.case-label'];
  columns.forEach((column, index) => {
    context.regions.push(
      branchLabelRegion(
        block.id,
        column.branchId,
        index,
        labelRow(column.label.column, head, rowHeight),
      ),
    );
  });

  branches.forEach((branch, index) => {
    const column = columns[index]?.label.column;
    if (column === undefined) {
      return;
    }
    if (branch === null) {
      // A Case without a default draws an empty default cell, measured as an empty block (UX CD1).
      context.nodes.push({ kind: 'missingDefault', caseId: block.id, box: column });
      context.regions.push({ kind: 'missingDefault', blockId: block.id, box: column });
    } else {
      placeBranch(context, branch, column);
    }
  });
}

function sum(values: ReadonlyArray<number>): number {
  let total = 0;
  for (const value of values) {
    total += value;
  }
  return total;
}
