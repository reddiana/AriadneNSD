// Layout in two passes (02-layout 1.1, ADR-0037): measure the smallest size of every block from
// the inside out, then place from the outside in, giving each child its real box.
// The whole document is laid out again on every edit; there is no incremental layout.
// What is folded, opened and banded comes from the view state (02-layout 1.6, `shown.ts`).
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
  While,
} from '../model/types';
import { fontSizes, measureLine, measureText } from '../text/measure-text';
import type { TextSize } from '../text/measure-text';
import type { CallTextContext } from './call-text';
import { callParts, callText } from './call-text';
import { geometry } from './geometry';
import type { ShownAt, ShownFold, ShownItem, ShownView } from './shown';
import {
  countBlocks,
  innerSeqs,
  insideCall,
  screenId,
  shownItems,
  shownView,
  topLevel,
} from './shown';
import type {
  Box,
  BranchLabel,
  CallWords,
  CaseColumn,
  DiagramLayout,
  HitRegion,
  LayoutNode,
  LayoutResult,
  PlacedText,
} from './types';

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
const band = geometry['size.band'];
const bandTextX = geometry['size.band-text-x'];
const bandIconRoom = geometry['size.band-icon-room'];
const foldIconRoom = geometry['size.fold-icon-room'];
const foldExtraHeight = geometry['size.fold-extra-h'];
const nestGap = geometry['size.nest-gap'];
const nestInset = geometry['size.nest-inset'];
const peekInset = geometry['size.peek-inset'];

/** The three dots of a folded row, drawn as shapes before its words (visual design 2). */
export const foldedDotsRoom = 16;

/** How far the fold triangle's click box reaches into a band or a folded cell. */
const toggleWidth = 18;

/** The size of an empty process block: the stand-in for a Case's missing default (UX CD1). */
const emptyBlockSize = {
  width: Math.max(blockMinWidth, 2 * padX),
  height: line + 2 * padY,
};

type Size = { readonly width: number; readonly height: number };

type Measure =
  | (Size & { readonly kind: 'process'; readonly text: TextSize })
  | (Size & CallWords & { readonly kind: 'call' })
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
    })
  /** An opened call block: the band and the called Method's body below it. */
  | (Size & CallWords & { readonly kind: 'peek'; readonly inside: ShownAt; readonly body: Seq });

/** A fold region's size: a folded cell, or a frame with its name band. */
type FoldMeasure =
  | (Size & { readonly kind: 'cell'; readonly name: TextSize; readonly isNamed: boolean })
  | (Size & { readonly kind: 'frame'; readonly name: PlacedText; readonly isNamed: boolean });

/** What both passes need besides the tree. */
type Context = {
  readonly locale: Locale;
  readonly shown: ShownView;
  readonly words: CallTextContext;
  /** Every call block of the document by id: the outermost call of an opened path. */
  readonly calls: ReadonlyMap<Id, Call>;
  /** Block measures by screen id. */
  readonly measures: Map<Id, Measure>;
  /** Fold region measures by screen id. */
  readonly folds: Map<Id, FoldMeasure>;
  /** Shown items by sequence and place, so both passes see the same. */
  readonly items: Map<Seq, Map<string, ReadonlyArray<ShownItem>>>;
  readonly boxes: Map<Id, Box>;
  readonly regions: HitRegion[];
  readonly nodes: LayoutNode[];
};

/**
 * Lays out a document: every block's bounding box, the click regions and what to draw
 * (02-layout 1). Pure: the same document gives the same result (R-FMT-03). The fixed words
 * ("true" / "false") are in the document's drawing language `settings.locale` (ADR-0041).
 * Folded branches, loop bodies and fold regions, opened call blocks and name bands follow the
 * view state (02-layout 1.6); ids the view names that are gone are ignored.
 */
export function layout(doc: Doc): LayoutResult {
  const diagrams = new Map(doc.content.diagrams.map((diagram) => [diagram.id, diagram]));
  const context: Context = {
    locale: doc.content.settings.locale,
    shown: shownView(doc.view),
    words: { locale: doc.content.settings.locale, resultSymbol: doc.view.resultSymbol, diagrams },
    calls: callsOf(doc.content.diagrams),
    measures: new Map(),
    folds: new Map(),
    items: new Map(),
    boxes: new Map(),
    regions: [],
    nodes: [],
  };

  const headStyle = doc.content.settings.headStyle;
  const measuredDiagrams = doc.content.diagrams.map((diagram) =>
    measureDiagram(context, diagram, headStyle),
  );
  const arrangement = arrange(measuredDiagrams);

  const placed: DiagramLayout[] = [];
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
    placeSeq(context, diagram.body, body, topLevel, 0, false);
    context.boxes.set(diagram.id, box);
    placed.push({ id: diagram.id, box, head, body });
  }

  return {
    width: paper + arrangement.width + paper,
    height: paper + arrangement.height + paper,
    diagrams: placed,
    boxes: context.boxes,
    regions: context.regions,
    nodes: context.nodes,
  };
}

function callsOf(diagrams: ReadonlyArray<Diagram>): ReadonlyMap<Id, Call> {
  const calls = new Map<Id, Call>();
  const visit = (seq: Seq): void => {
    for (const block of seq.blocks) {
      if (block.kind === 'call') {
        calls.set(block.id, block);
      }
      for (const inner of innerSeqs(block)) {
        visit(inner);
      }
    }
  };
  for (const diagram of diagrams) {
    visit(diagram.body);
  }
  return calls;
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
  const body = measureSeq(context, diagram.body, topLevel, 0);
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

// What a sequence shows.

function itemsOf(context: Context, seq: Seq, at: ShownAt): ReadonlyArray<ShownItem> {
  let byPlace = context.items.get(seq);
  if (byPlace === undefined) {
    byPlace = new Map();
    context.items.set(seq, byPlace);
  }
  let items = byPlace.get(at.prefix);
  if (items === undefined) {
    items = shownItems(seq, at, context.shown);
    byPlace.set(at.prefix, items);
  }
  return items;
}

/** Where an opened call block shows its Method, or `null` when it is not opened (or cannot be). */
function openedInside(context: Context, block: Call, at: ShownAt): ShownAt | null {
  const id = screenId(at.prefix, block.id);
  if (!context.shown.opened.has(id) || block.target.kind !== 'local') {
    return null;
  }
  const method = context.words.diagrams.get(block.target.diagram);
  const outermost = at.site === null ? block : context.calls.get(at.site.call);
  if (method?.head?.kind !== 'method' || outermost === undefined) {
    return null;
  }
  return insideCall(at, block, id, method, outermost);
}

/** Whether an item is drawn with a border: an unfolded fold region's frame, an opened call. */
function isFramed(context: Context, item: ShownItem, at: ShownAt): boolean {
  if (item.kind === 'fold') {
    return !item.fold.isFolded;
  }
  return (
    item.block.kind === 'call' &&
    context.measures.get(screenId(at.prefix, item.block.id))?.kind === 'peek'
  );
}

/**
 * The name drawn for a fold region: its own name, or the default name "the first block's text
 * and n more" (interaction rules "접기 · 펼치기"), in the drawing language.
 */
export function foldLabel(
  words: CallTextContext,
  fold: { readonly name?: string; readonly blocks: ReadonlyArray<Block> },
): { readonly text: string; readonly isNamed: boolean } {
  if (fold.name !== undefined && fold.name !== '') {
    return { text: fold.name, isNamed: true };
  }
  return { text: defaultFoldName(words, fold.blocks), isNamed: false };
}

/** The default name of a region holding `blocks`: "the first block's text and n more". */
export function defaultFoldName(words: CallTextContext, blocks: ReadonlyArray<Block>): string {
  const [first] = blocks;
  const raw =
    first === undefined ? '' : first.kind === 'call' ? callText(words, first) : first.text;
  const text = raw.split('\n')[0] ?? '';
  const shown = text === '' ? drawingMessage(words.locale, 'fold.empty') : text;
  const rest = blocks.length - 1;
  return rest > 0 ? drawingMessage(words.locale, 'fold.more', { text: shown, count: rest }) : shown;
}

/** The words of a folded row: "n blocks" in the drawing language. */
function foldedWords(context: Context, seq: Seq): string {
  return drawingMessage(context.locale, 'folded.count', { count: countBlocks(seq) });
}

// Pass 1: measure (inside out).

/**
 * Measures a sequence. `inset` is how far framed children sit inside the frame holding the
 * sequence (0 outside frames): they are inset at both sides and at the bottom, and two framed
 * children in a row keep a gap (02-layout 1.6).
 */
function measureSeq(context: Context, seq: Seq, at: ShownAt, inset: number): Size {
  return measureItems(context, itemsOf(context, seq, at), at, inset);
}

function measureItems(
  context: Context,
  items: ReadonlyArray<ShownItem>,
  at: ShownAt,
  inset: number,
): Size {
  let width = 0;
  let height = 0;
  let wasFramed = false;
  items.forEach((item, index) => {
    const size = measureItem(context, item, at);
    const framed = isFramed(context, item, at);
    width = Math.max(width, size.width + (framed ? 2 * inset : 0));
    height += size.height + (framed && wasFramed ? gapBetweenFrames : 0);
    if (framed && index === items.length - 1) {
      height += inset;
    }
    wasFramed = framed;
  });
  return { width, height };
}

/** Two frames in a row: the shared line splits into two, with a 1px gap between (02-layout 1.6). */
const gapBetweenFrames = 1 + nestGap;

function measureItem(context: Context, item: ShownItem, at: ShownAt): Size {
  if (item.kind === 'block') {
    return measureBlock(context, item.block, at);
  }
  return measureFold(context, item.fold, item.items, at);
}

function measureFold(
  context: Context,
  fold: ShownFold,
  items: ReadonlyArray<ShownItem>,
  at: ShownAt,
): Size {
  const label = foldLabel(context.words, fold);
  let measure: FoldMeasure;
  if (fold.isFolded) {
    const name = measureText(label.text);
    measure = {
      kind: 'cell',
      name,
      isNamed: label.isNamed,
      width: name.width + 2 * padX + foldIconRoom,
      height: name.height + 2 * padY + foldExtraHeight,
    };
  } else {
    const inner = measureItems(context, items, at, nestInset);
    const text = oneLine(label.text);
    const nameWidth = measureLine(text, fontSizes.secondary);
    measure = {
      kind: 'frame',
      name: { lines: [text], width: nameWidth },
      isNamed: label.isNamed,
      width: Math.max(inner.width, bandTextWidth(nameWidth)),
      height: band + inner.height,
    };
  }
  context.folds.set(fold.screenId, measure);
  return measure;
}

/** The smallest width of a band holding text this wide: room, the triangle, the text, padding. */
function bandTextWidth(textWidth: number): number {
  return bandTextX + bandIconRoom + textWidth + padX;
}

function oneLine(text: string): string {
  return text.replace(/\r\n|\r|\n/g, ' ');
}

function measureBlock(context: Context, block: Block, at: ShownAt): Measure {
  const measure = measureBlockOnce(context, block, at);
  context.measures.set(screenId(at.prefix, block.id), measure);
  return measure;
}

function measureBlockOnce(context: Context, block: Block, at: ShownAt): Measure {
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
      return measureCall(context, block, at);
    case 'while':
    case 'doWhile':
    case 'for':
      return measureLoop(context, block, at);
    case 'if':
      return measureIf(context, block, at);
    case 'case':
      return measureCase(context, block, at);
  }
}

/**
 * Measures the body of a branch or loop: one row "⋯ n blocks" when it is folded (R-EDIT-13),
 * otherwise its sequence.
 */
function measureBody(context: Context, owner: Id, seq: Seq, at: ShownAt): Size {
  if (context.shown.folded.has(owner)) {
    return {
      width:
        padX + foldedDotsRoom + measureLine(foldedWords(context, seq), fontSizes.secondary) + padX,
      height: line + 2 * padY,
    };
  }
  return measureSeq(context, seq, at, 0);
}

function measureLoop(context: Context, block: While | DoWhile | For, at: ShownAt): Measure {
  const text = measureText(block.text);
  const headHeight = text.height + 2 * padY;
  const body = measureBody(context, block.id, block.body, at);
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

function measureIf(context: Context, block: If, at: ShownAt): Measure {
  const text = measureText(block.text);
  const headHeight = text.height + 2 * padY + geometry['size.if-label'];
  const headWidth = text.width + 2 * padX + geometry['size.if-head-extra'];
  const labels = [
    block.yes.label ?? drawingMessage(context.locale, 'if.yes'),
    block.no.label ?? drawingMessage(context.locale, 'if.no'),
  ] as const;
  const yes = measureBody(context, block.yes.id, block.yes.body, at);
  const no = measureBody(context, block.no.id, block.no.body, at);
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

function measureCase(context: Context, block: Case, at: ShownAt): Measure {
  const text = measureText(block.text);
  const headHeight = text.height + 2 * padY + geometry['size.case-label'];
  const headWidth = text.width + 2 * padX + geometry['size.case-head-extra'];
  const labels: string[] = [];
  const columnWidths: number[] = [];
  let bodyHeight = 0;
  for (const arm of block.arms) {
    const size = measureBody(context, arm.id, arm.body, at);
    labels.push(arm.label);
    columnWidths.push(columnWidth(size.width, arm.label));
    bodyHeight = Math.max(bodyHeight, size.height);
  }
  const defaultLabel = block.otherwise?.label ?? drawingMessage(context.locale, 'case.default');
  const defaultSize = block.otherwise
    ? measureBody(context, block.otherwise.id, block.otherwise.body, at)
    : emptyBlockSize;
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

function measureCall(context: Context, block: Call, at: ShownAt): Measure {
  const parts = callParts(context.words, block);
  const inside = openedInside(context, block, at);
  if (inside !== null && block.target.kind === 'local') {
    const method = context.words.diagrams.get(block.target.diagram);
    if (method !== undefined) {
      const inner = measureSeq(context, method.body, inside, peekInset);
      const words = measureLine(parts.before + parts.name + parts.after, fontSizes.secondary);
      return {
        kind: 'peek',
        ...parts,
        inside,
        body: method.body,
        width: Math.max(inner.width, bandTextWidth(words)),
        height: band + inner.height,
      };
    }
  }
  const width =
    measureLine(parts.before) +
    measureLine(parts.name) +
    measureLine(parts.after) +
    2 * padX +
    2 * callBar;
  return { kind: 'call', ...parts, width, height: line + 2 * padY };
}

// Pass 2: place (outside in).

/** Marks a node as drawn inside an opened call block. */
function peeked(at: ShownAt): { readonly isPeeked?: true } {
  return at.prefix === '' ? {} : { isPeeked: true };
}

/**
 * Places a sequence in its box. Every block gets the full width. When the box is taller than the
 * blocks, the leftover height is shared equally and the last item takes the remainder
 * (02-layout 1.3, UX SB1). Framed items sit `inset` inside (02-layout 1.6).
 */
function placeSeq(
  context: Context,
  seq: Seq,
  box: Box,
  at: ShownAt,
  inset: number,
  isBranch: boolean,
): void {
  const items = itemsOf(context, seq, at);
  const [only] = items;
  const isEmptyBranch =
    isBranch && items.length === 1 && only?.kind === 'block' && isEmptyBlock(only.block);
  placeItems(context, items, box, at, inset, isEmptyBranch);
}

function placeItems(
  context: Context,
  items: ReadonlyArray<ShownItem>,
  box: Box,
  at: ShownAt,
  inset: number,
  isEmptyBranch: boolean,
): void {
  const count = items.length;
  const framed = items.map((item) => isFramed(context, item, at));
  let needed = 0;
  items.forEach((item, index) => {
    needed += itemHeight(context, item, at);
    if (framed[index] === true && framed[index - 1] === true) {
      needed += gapBetweenFrames;
    }
  });
  if (framed[count - 1] === true) {
    needed += inset;
  }
  const each = Math.floor(Math.max(0, box.height - needed) / count);
  let y = box.y;
  items.forEach((item, index) => {
    const isFrame = framed[index] === true;
    if (isFrame && framed[index - 1] === true) {
      y += gapBetweenFrames;
    }
    const isLast = index === count - 1;
    const height = isLast
      ? box.y + box.height - y - (isFrame ? inset : 0)
      : itemHeight(context, item, at) + each;
    const side = isFrame ? inset : 0;
    const itemBox: Box = { x: box.x + side, y, width: box.width - 2 * side, height };
    if (item.kind === 'block') {
      placeBlock(context, item.block, itemBox, at, isEmptyBranch);
    } else {
      placeFold(context, item.fold, item.items, itemBox, at);
    }
    y += height;
  });
}

function itemHeight(context: Context, item: ShownItem, at: ShownAt): number {
  if (item.kind === 'block') {
    return measured(context, screenId(at.prefix, item.block.id)).height;
  }
  return foldMeasured(context, item.fold.screenId).height;
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

function foldMeasured(context: Context, id: Id): FoldMeasure {
  const measure = context.folds.get(id);
  if (measure === undefined) {
    throw new Error(`Layout: fold region ${id} was not measured`);
  }
  return measure;
}

function placeFold(
  context: Context,
  fold: ShownFold,
  items: ReadonlyArray<ShownItem>,
  box: Box,
  at: ShownAt,
): void {
  const measure = foldMeasured(context, fold.screenId);
  context.boxes.set(fold.screenId, box);
  if (measure.kind === 'cell') {
    context.nodes.push({
      kind: 'foldCell',
      id: fold.screenId,
      box,
      name: placedText(measure.name),
      isNamed: measure.isNamed,
      ...peeked(at),
    });
    context.regions.push(
      { kind: 'fold', foldId: fold.screenId, isFolded: true, box },
      toggle('fold', fold.screenId, false, box, measure.name.height + 2 * padY),
    );
    for (const block of fold.blocks) {
      hide(context, block, at.prefix, box);
    }
    return;
  }
  const bandBox: Box = { x: box.x, y: box.y, width: box.width, height: band };
  context.regions.push(
    { kind: 'fold', foldId: fold.screenId, isFolded: false, box: bandBox },
    toggle('fold', fold.screenId, true, bandBox, band),
  );
  placeItems(
    context,
    items,
    { x: box.x, y: box.y + band, width: box.width, height: box.height - band },
    at,
    nestInset,
    false,
  );
  // The frame goes over the blocks it holds, so its thick line covers their outer lines.
  context.nodes.push({
    kind: 'foldFrame',
    id: fold.screenId,
    box,
    band: bandBox,
    name: measure.name,
    isNamed: measure.isNamed,
  });
}

/** The click box of a fold triangle at the left of a band or a folded cell. */
function toggle(
  what: 'fold' | 'peek',
  target: Id,
  isOpen: boolean,
  box: Box,
  height: number,
): HitRegion {
  return {
    kind: 'toggle',
    what,
    target,
    isOpen,
    box: { x: box.x + 1, y: box.y, width: toggleWidth, height: Math.min(height, box.height) },
  };
}

/**
 * Gives a block hidden in a folded branch, loop body or region (and everything in it) the box of
 * what is drawn in its place, so selecting it outlines that (02-layout 1.1).
 */
function hide(context: Context, block: Block, prefix: string, box: Box): void {
  context.boxes.set(screenId(prefix, block.id), box);
  for (const inner of innerOwners(block)) {
    context.boxes.set(screenId(prefix, inner.owner), box);
    for (const child of inner.seq.blocks) {
      hide(context, child, prefix, box);
    }
  }
}

/** The sequences inside a block with the ids that own them (branches; a loop owns its body). */
function innerOwners(block: Block): ReadonlyArray<{ readonly owner: Id; readonly seq: Seq }> {
  switch (block.kind) {
    case 'process':
    case 'call':
      return [];
    case 'if':
      return [
        { owner: block.yes.id, seq: block.yes.body },
        { owner: block.no.id, seq: block.no.body },
      ];
    case 'case':
      return [...block.arms, ...(block.otherwise === null ? [] : [block.otherwise])].map(
        (branch) => ({ owner: branch.id, seq: branch.body }),
      );
    case 'while':
    case 'doWhile':
    case 'for':
      return [{ owner: block.id, seq: block.body }];
  }
}

function placeBlock(
  context: Context,
  block: Block,
  box: Box,
  at: ShownAt,
  isEmptyBranch: boolean,
): void {
  const id = screenId(at.prefix, block.id);
  context.boxes.set(id, box);
  const measure = measured(context, id);
  switch (block.kind) {
    case 'process':
      if (measure.kind === 'process') {
        context.nodes.push({
          kind: 'process',
          id,
          box,
          text: placedText(measure.text),
          isEmptyBranch,
          ...peeked(at),
        });
        context.regions.push({ kind: 'block', blockId: id, box });
      }
      return;
    case 'call':
      if (measure.kind === 'call') {
        context.nodes.push({
          kind: 'call',
          id,
          box,
          before: measure.before,
          name: measure.name,
          after: measure.after,
          isLost: block.target.kind === 'lost',
          ...peeked(at),
        });
        context.regions.push({ kind: 'block', blockId: id, box });
      } else if (measure.kind === 'peek') {
        placePeek(context, id, box, measure, at);
      }
      return;
    case 'while':
    case 'doWhile':
    case 'for':
      if (measure.kind === 'loop') {
        placeLoop(context, block, box, measure, at);
      }
      return;
    case 'if':
      if (measure.kind === 'if') {
        placeIf(context, block, box, measure, at);
      }
      return;
    case 'case':
      if (measure.kind === 'case') {
        placeCase(context, block, box, measure, at);
      }
      return;
  }
}

/** An opened call block: its band on top, the called Method's blocks below (02-layout 1.6). */
function placePeek(
  context: Context,
  id: Id,
  box: Box,
  measure: Extract<Measure, { kind: 'peek' }>,
  at: ShownAt,
): void {
  const bandBox: Box = { x: box.x, y: box.y, width: box.width, height: band };
  context.regions.push(
    { kind: 'peekBand', blockId: id, box: bandBox },
    toggle('peek', id, true, bandBox, band),
  );
  placeSeq(
    context,
    measure.body,
    { x: box.x, y: box.y + band, width: box.width, height: box.height - band },
    measure.inside,
    peekInset,
    false,
  );
  context.nodes.push({
    kind: 'peek',
    id,
    box,
    band: bandBox,
    before: measure.before,
    name: measure.name,
    after: measure.after,
    ...peeked(at),
  });
}

function placedText(text: TextSize): PlacedText {
  return { lines: text.lines, width: text.width };
}

/**
 * Places a branch's or loop's body: the row "⋯ n blocks" when it is folded, which the blocks
 * inside then point at (02-layout 1.1), otherwise its sequence.
 */
function placeBody(
  context: Context,
  owner: Id,
  seq: Seq,
  box: Box,
  at: ShownAt,
  isBranch: boolean,
): void {
  if (!context.shown.folded.has(owner)) {
    placeSeq(context, seq, box, at, 0, isBranch);
    return;
  }
  const id = screenId(at.prefix, owner);
  context.nodes.push({
    kind: 'foldedSeq',
    id,
    box,
    text: foldedWords(context, seq),
    ...peeked(at),
  });
  context.regions.push({ kind: 'foldedSeq', owner: id, box });
  for (const block of seq.blocks) {
    hide(context, block, at.prefix, box);
  }
}

function placeLoop(
  context: Context,
  block: While | DoWhile | For,
  box: Box,
  measure: Extract<Measure, { kind: 'loop' }>,
  at: ShownAt,
): void {
  const id = screenId(at.prefix, block.id);
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
    id,
    loop: block.kind,
    box,
    head,
    text: placedText(measure.text),
    ...peeked(at),
  });
  context.regions.push({ kind: 'head', blockId: id, box: head });
  // Extra height goes to the body, not the header (02-layout 1.3).
  placeBody(
    context,
    block.id,
    block.body,
    {
      x: box.x + loopStrip,
      y: isBottom ? box.y : box.y + headHeight,
      width: box.width - loopStrip,
      height: box.height - headHeight,
    },
    at,
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
  at: ShownAt,
): void {
  const id = screenId(at.prefix, block.id);
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
    id,
    box,
    head,
    text: placedText(measure.text),
    splitX: noBox.x,
    yes,
    no,
    ...peeked(at),
  });
  context.regions.push({ kind: 'head', blockId: id, box: head });
  const rowHeight = geometry['size.if-label'];
  context.regions.push(
    branchLabelRegion(id, screenId(at.prefix, block.yes.id), 0, labelRow(yesBox, head, rowHeight)),
    branchLabelRegion(id, screenId(at.prefix, block.no.id), 1, labelRow(noBox, head, rowHeight)),
  );
  placeBranch(context, block.yes, yesBox, at);
  placeBranch(context, block.no, noBox, at);
}

function branchLabelRegion(blockId: Id, branchId: Id | null, index: number, box: Box): HitRegion {
  return { kind: 'branchLabel', blockId, branchId, index, box };
}

function placeBranch(context: Context, branch: Branch, box: Box, at: ShownAt): void {
  context.boxes.set(screenId(at.prefix, branch.id), box);
  placeBody(context, branch.id, branch.body, box, at, true);
}

function placeCase(
  context: Context,
  block: Case,
  box: Box,
  measure: Extract<Measure, { kind: 'case' }>,
  at: ShownAt,
): void {
  const id = screenId(at.prefix, block.id);
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
      branchId: branch === null ? null : screenId(at.prefix, branch.id),
      isDefault: index === branches.length - 1,
      label: { text: measure.labels[index] ?? '', column },
    });
    x += width;
  });

  context.nodes.push({
    kind: 'case',
    id,
    box,
    head,
    text: placedText(measure.text),
    columns,
    ...peeked(at),
  });
  context.regions.push({ kind: 'head', blockId: id, box: head });
  const rowHeight = geometry['size.case-label'];
  columns.forEach((column, index) => {
    context.regions.push(
      branchLabelRegion(id, column.branchId, index, labelRow(column.label.column, head, rowHeight)),
    );
  });

  branches.forEach((branch, index) => {
    const column = columns[index]?.label.column;
    if (column === undefined) {
      return;
    }
    if (branch === null) {
      // A Case without a default draws an empty default cell, measured as an empty block (UX CD1).
      context.nodes.push({ kind: 'missingDefault', caseId: id, box: column, ...peeked(at) });
      context.regions.push({ kind: 'missingDefault', blockId: id, box: column });
    } else {
      placeBranch(context, branch, column, at);
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
