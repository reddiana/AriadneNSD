// Where a drag would drop (03-editor 3.2, interaction rules 7). Pure: layout and document only.
import type {
  Box,
  DiagramLayout,
  FoldMark,
  Id,
  LayoutResult,
  NewBlockKind,
  Seq,
  Side,
  Target,
  WrapKind,
} from '@ariadne-nsd/core';
import { foldRange, geometry } from '@ariadne-nsd/core';

import type { DocIndex } from '../model/doc-index';
import { ancestorsOf, branchTarget, isEmptyBlock } from '../model/doc-index';
import type { Selection } from '../state/selection';
import { selectedBlocks, targetOf } from '../state/selection';
import type { Hit, Point } from './hit-test';
import { contains, hitTest } from './hit-test';

/** The band at the top and bottom of a block that means "between blocks" (px). */
export const betweenBand = 8;

/** A block lower than this has only "between" halves, no "on the block" part (px). */
export const smallBlockHeight = 24;

/**
 * The band right under a diagram, as wide as its body, that means "at the end of the body" (px).
 * Narrower than the gap between diagrams (`space.diagram`), so it never reaches the next one.
 */
export const bodyEndBand = 12;

/**
 * How far outside a fold region's border the line of a drop next to the region is drawn (px,
 * M86 N2): the blocks go outside it. The same next to an opened call block (M87 F3).
 */
export const foldOutsideGap = 3;

/**
 * How far above a fold region's bottom edge the line of a drop at its inside end is drawn (px,
 * M86 N2): inside the border, which is `size.fold-edge` thick.
 */
export const foldInsideEndGap = 6;

const foldEdge = geometry['size.fold-edge'];

/** What is dragged: blocks of the diagram (a range), or a new block from a toolbar icon. */
export type DragSource =
  | { readonly kind: 'blocks'; readonly target: Target; readonly blocks: ReadonlyArray<Id> }
  | { readonly kind: 'new'; readonly blockKind: NewBlockKind };

/** What a drop does. Each is one command, so one undo step. */
export type DropAction =
  /**
   * Insert a new block next to `to`; on an empty block it takes its place. `outsideFolds`: at
   * the very start or end of a diagram body, it does not join a fold region ending there.
   * `outsideFold`: next to that fold region, outside it (and the regions inside it).
   */
  | {
      readonly kind: 'insert';
      readonly to: Id;
      readonly side: Side;
      readonly blockKind: NewBlockKind;
      readonly outsideFolds?: boolean;
      readonly outsideFold?: Id;
    }
  /** Wrap blocks in a new control block. */
  | { readonly kind: 'wrap'; readonly target: Target; readonly blockKind: WrapKind }
  /** Move the dragged blocks next to `to`; on an empty block they take its place. */
  | {
      readonly kind: 'move';
      readonly target: Target;
      readonly to: Id;
      readonly side: Side;
      readonly outsideFolds?: boolean;
      readonly outsideFold?: Id;
    }
  /**
   * Make a branch beside `branch` (an If becomes a Case) and put the new or dragged blocks in it
   * (UX BL5), as an insert or a paste on its label does.
   */
  | { readonly kind: 'intoNewBranch'; readonly branch: Id; readonly source: DragSource }
  /** Make the missing default of a Case (UX CD1) and put the new or dragged blocks in it. */
  | {
      readonly kind: 'intoMissingDefault';
      readonly caseBlock: Id;
      readonly source: DragSource;
    };

/** How the overlay shows the drop place (visual design 7.1). */
export type DropMark =
  /** Between blocks: a 2px line with 4px ticks at both ends. */
  | { readonly kind: 'line'; readonly x: number; readonly y: number; readonly width: number }
  /** On a block: a 2px border 1px inside it. */
  | { readonly kind: 'outline'; readonly box: Box };

/** A possible drop. `wraps` names the block kind when the drop wraps, for the cursor's label. */
export type Drop = {
  readonly action: DropAction;
  readonly mark: DropMark;
  readonly wraps: WrapKind | null;
};

/**
 * Finds what dropping at a point would do, or `null` where nothing can be dropped (outside the
 * diagrams, or inside the dragged blocks themselves).
 */
export function findDrop(
  layout: LayoutResult,
  index: DocIndex,
  point: Point,
  source: DragSource,
  selection: Selection | null,
): Drop | null {
  const hit = hitTest(layout, index, point);
  const atEnd = bodyEndOf(layout, hit, point);
  if (atEnd !== null) {
    return dropAtBodyEnd(layout, index, atEnd.diagram, atEnd.side, source);
  }
  // Nothing is dropped on the rest of a diagram's header (blocks go into its body) or a fold
  // triangle.
  if (hit?.kind === 'diagramHead' || hit?.kind === 'toggle') {
    return null;
  }
  const atFold = foldEdgeOf(layout, index, hit, point);
  if (atFold !== null) {
    return dropAtFoldEdge(index, atFold, source);
  }
  const atCall = openedCallOf(layout, index, point);
  if (atCall !== null) {
    return dropAtOpenedCall(index, atCall, point, source);
  }
  if (hit === null) {
    return null;
  }
  // The empty default of a Case is made first (UX CD1), from its cell or its label.
  if (hit.kind === 'missingDefault' || (hit.kind === 'branchLabel' && hit.branch === null)) {
    return {
      action: { kind: 'intoMissingDefault', caseBlock: hit.block, source },
      mark: { kind: 'outline', box: hit.box },
      wraps: null,
    };
  }
  const id = hit.block;
  const place = index.blocks.get(id);
  const box = layout.boxes.get(id);
  if (place === undefined || box === undefined) {
    return null;
  }
  if (source.kind === 'blocks' && ancestorsOf(index, id).some((a) => source.blocks.includes(a))) {
    return null;
  }
  if (isEmptyBlock(place.block)) {
    return {
      action:
        source.kind === 'new'
          ? { kind: 'insert', to: id, side: 'after', blockKind: source.blockKind }
          : { kind: 'move', target: source.target, to: id, side: 'after' },
      mark: { kind: 'outline', box },
      wraps: null,
    };
  }
  const zone = zoneOf(box, point);
  if (zone !== 'on') {
    return between(layout, index, source, id, box, zone);
  }
  // A branch label is its branch, as for the keys (interaction rules T1, UX BL5).
  if (hit.kind === 'branchLabel' && hit.branch !== null) {
    return dropOnBranchLabel(layout, index, hit.branch, hit.box, source);
  }
  if (source.kind === 'blocks') {
    const side = point.y < box.y + box.height / 2 ? 'before' : 'after';
    return between(layout, index, source, id, box, side);
  }
  const kind = source.blockKind;
  // A process or exit block holds nothing, so it goes below instead of wrapping (UX XB1).
  if (kind === 'process' || kind === 'exit') {
    return between(layout, index, source, id, box, 'after');
  }
  // On one of the selected blocks, the whole selection is wrapped (interaction rules 7).
  const selected = selectedBlocks(index, selection);
  const target = targetOf(selection);
  if (target !== null && selected.includes(id)) {
    const boxes = selected.flatMap((s) => {
      const b = layout.boxes.get(s);
      return b === undefined ? [] : [b];
    });
    return {
      action: { kind: 'wrap', target, blockKind: kind },
      mark: { kind: 'outline', box: union(boxes) },
      wraps: kind,
    };
  }
  return {
    action: { kind: 'wrap', target: { kind: 'blocks', first: id, last: id }, blockKind: kind },
    mark: { kind: 'outline', box },
    wraps: kind,
  };
}

/**
 * A drop on a branch label (UX BL5): a control block icon wraps the blocks of the branch; a
 * process or exit icon, and dragged blocks, go into a new branch beside it. The outline is
 * drawn around the branch, its label and its blocks.
 */
function dropOnBranchLabel(
  layout: LayoutResult,
  index: DocIndex,
  branch: Id,
  label: Box,
  source: DragSource,
): Drop | null {
  const column = layout.boxes.get(branch);
  const mark: DropMark = {
    kind: 'outline',
    box: union(column === undefined ? [label] : [label, column]),
  };
  if (source.kind === 'new' && source.blockKind !== 'process' && source.blockKind !== 'exit') {
    const target = branchTarget(index, branch);
    const kind = source.blockKind;
    return target === null
      ? null
      : { action: { kind: 'wrap', target, blockKind: kind }, mark, wraps: kind };
  }
  return { action: { kind: 'intoNewBranch', branch, source }, mark, wraps: null };
}

/**
 * Whether a point means the very start or end of a diagram body (M75 P2): the bottom band of the
 * header inside it (`betweenBand`), or the band right under the diagram (`bodyEndBand`) where
 * nothing else is hit. A diagram without a header has only the end; its start is the first
 * block's top band, as before.
 */
function bodyEndOf(
  layout: LayoutResult,
  hit: Hit | null,
  point: Point,
): { readonly diagram: DiagramLayout; readonly side: Side } | null {
  if (hit?.kind === 'diagramHead') {
    const diagram = layout.diagrams.find((d) => d.id === hit.diagram);
    const isLow = point.y >= hit.box.y + hit.box.height - betweenBand;
    return diagram !== undefined && isLow ? { diagram, side: 'before' } : null;
  }
  if (hit !== null) {
    return null;
  }
  for (const diagram of layout.diagrams) {
    const { body } = diagram;
    const bottom = body.y + body.height;
    if (
      point.x >= body.x &&
      point.x <= body.x + body.width &&
      point.y > bottom &&
      point.y <= bottom + bodyEndBand
    ) {
      return { diagram, side: 'after' };
    }
  }
  return null;
}

/**
 * A drop before the first or after the last block of a diagram body, whatever kind the block
 * is. The line is drawn on the body's top (the header's bottom) or the diagram's bottom. An empty
 * body takes the drop in its empty block, as a drop on any empty block does. The blocks do not
 * join a fold region ending there, as with an insert at the diagram's end (`diagramEnd`).
 */
function dropAtBodyEnd(
  layout: LayoutResult,
  index: DocIndex,
  diagram: DiagramLayout,
  side: Side,
  source: DragSource,
): Drop | null {
  const blocks = index.seqs.get(diagram.id)?.seq.blocks ?? [];
  const block = side === 'before' ? blocks[0] : blocks.at(-1);
  if (block === undefined) {
    return null;
  }
  // Dragged blocks already at that end stay where they are.
  if (source.kind === 'blocks' && source.blocks.includes(block.id)) {
    return null;
  }
  const { body } = diagram;
  if (isEmptyBlock(block)) {
    return {
      action:
        source.kind === 'new'
          ? { kind: 'insert', to: block.id, side: 'after', blockKind: source.blockKind }
          : { kind: 'move', target: source.target, to: block.id, side: 'after' },
      mark: { kind: 'outline', box: layout.boxes.get(block.id) ?? body },
      wraps: null,
    };
  }
  return {
    action:
      source.kind === 'new'
        ? { kind: 'insert', to: block.id, side, blockKind: source.blockKind, outsideFolds: true }
        : { kind: 'move', target: source.target, to: block.id, side, outsideFolds: true },
    mark: {
      kind: 'line',
      x: body.x,
      y: side === 'before' ? body.y : body.y + body.height,
      width: body.width,
    },
    wraps: null,
  };
}

/** Which part of a block a point is in: the top band, the bottom band, or on the block. */
export function zoneOf(box: Box, point: Point): 'before' | 'after' | 'on' {
  if (box.height < smallBlockHeight) {
    return point.y < box.y + box.height / 2 ? 'before' : 'after';
  }
  if (point.y < box.y + betweenBand) {
    return 'before';
  }
  if (point.y > box.y + box.height - betweenBand) {
    return 'after';
  }
  return 'on';
}

function between(
  layout: LayoutResult,
  index: DocIndex,
  source: DragSource,
  to: Id,
  box: Box,
  side: Side,
): Drop {
  // After the last block of an open fold region the blocks join it (UX MD1), so the line is
  // drawn inside its border (M86 N2).
  const frame = side === 'after' ? frameEndingAt(layout, index, to) : null;
  const mark: DropMark =
    frame === null
      ? {
          kind: 'line',
          x: box.x,
          y: side === 'before' ? box.y : box.y + box.height,
          width: box.width,
        }
      : {
          kind: 'line',
          x: frame.x + foldEdge,
          y: frame.y + frame.height - foldInsideEndGap,
          width: frame.width - 2 * foldEdge,
        };
  return {
    action:
      source.kind === 'new'
        ? { kind: 'insert', to, side, blockKind: source.blockKind }
        : { kind: 'move', target: source.target, to, side },
    mark,
    wraps: null,
  };
}

/** The whole box of a fold region drawn with its border and name band, or `null`. */
function frameOf(layout: LayoutResult, fold: Id): Box | null {
  const isFramed = layout.regions.some(
    (region) => region.kind === 'fold' && region.foldId === fold && !region.isFolded,
  );
  return isFramed ? (layout.boxes.get(fold) ?? null) : null;
}

/** The innermost bordered fold region whose last block is `block`, or `null`. */
function frameEndingAt(layout: LayoutResult, index: DocIndex, block: Id): Box | null {
  const place = index.blocks.get(block);
  const seq = place === undefined ? undefined : index.seqs.get(place.owner)?.seq;
  let inner: Box | null = null;
  for (const fold of seq?.folds ?? []) {
    const box = fold.last === block ? frameOf(layout, fold.id) : null;
    if (box !== null && (inner === null || area(box) < area(inner))) {
      inner = box;
    }
  }
  return inner;
}

const area = (box: Box): number => box.width * box.height;

/** A drop next to a fold region, outside it: which region, its box, and which side. */
type FoldEdge = {
  readonly fold: Id;
  readonly box: Box;
  readonly side: Side;
  /** At the region's inside end: after its last block, inside it (M86 N3). */
  readonly isInside?: boolean;
};

/**
 * Whether a point means an edge of a fold region (M86 N1, N3): the name band of an open region
 * (before it, outside), the upper or lower half of a folded cell (before or after it, outside),
 * the bottom band inside an open region's box (after it, outside) or the band above that (after
 * its last block, inside it). Of the open regions whose box holds the point the innermost
 * answers. Regions without a name band are not drawn as regions, so they have no edge here.
 */
function foldEdgeOf(
  layout: LayoutResult,
  index: DocIndex,
  hit: Hit | null,
  point: Point,
): FoldEdge | null {
  if (hit?.kind === 'block' && index.folds.has(hit.block)) {
    const fold = hit.block;
    if (hit.isHead) {
      const box = layout.boxes.get(fold);
      return box === undefined ? null : { fold, box, side: 'before' };
    }
    const isUpper = point.y < hit.box.y + hit.box.height / 2;
    return { fold, box: hit.box, side: isUpper ? 'before' : 'after' };
  }
  let inner: { readonly fold: Id; readonly box: Box } | null = null;
  for (const region of layout.regions) {
    if (region.kind !== 'fold' || region.isFolded || !index.folds.has(region.foldId)) {
      continue;
    }
    const box = layout.boxes.get(region.foldId);
    if (
      box !== undefined &&
      contains(box, point) &&
      point.y >= box.y + box.height - 2 * betweenBand &&
      (inner === null || area(box) < area(inner.box))
    ) {
      inner = { fold: region.foldId, box };
    }
  }
  if (inner === null) {
    return null;
  }
  const isInside = point.y <= inner.box.y + inner.box.height - betweenBand;
  return { ...inner, side: 'after', isInside };
}

/**
 * A drop before or after a fold region, outside it: next to its first or last block, without
 * joining it or the regions inside it; regions around it still take the blocks in. The line is
 * drawn just outside its border (M86 N2). Dragged blocks at that edge (or holding it) stay put.
 */
function dropAtFoldEdge(index: DocIndex, edge: FoldEdge, source: DragSource): Drop | null {
  const owner = index.folds.get(edge.fold);
  const seq = owner === undefined ? undefined : index.seqs.get(owner)?.seq;
  const mark = seq?.folds.find((fold) => fold.id === edge.fold);
  if (seq === undefined || mark === undefined) {
    return null;
  }
  const { side, box, fold } = edge;
  const to = side === 'before' ? mark.first : mark.last;
  if (source.kind === 'blocks' && ancestorsOf(index, to).some((a) => source.blocks.includes(a))) {
    return null;
  }
  if (edge.isInside === true) {
    return dropAtInsideEnd(seq, mark, box, source);
  }
  return {
    action:
      source.kind === 'new'
        ? { kind: 'insert', to, side, blockKind: source.blockKind, outsideFold: fold }
        : { kind: 'move', target: source.target, to, side, outsideFold: fold },
    mark: {
      kind: 'line',
      x: box.x,
      y: side === 'before' ? box.y - foldOutsideGap : box.y + box.height + foldOutsideGap,
      width: box.width,
    },
    wraps: null,
  };
}

/**
 * A drop at the inside end of an open fold region (M86 N3): after its last block, joining it and
 * the regions around it but not the regions inside it ending there, never wrapping. The line is
 * drawn inside its border, as after its last block (M86 N2).
 */
function dropAtInsideEnd(seq: Seq, fold: FoldMark, box: Box, source: DragSource): Drop {
  const to = fold.last;
  const within = innerFoldAtEnd(seq, fold);
  const keepOut = within === null ? {} : { outsideFold: within };
  return {
    action:
      source.kind === 'new'
        ? { kind: 'insert', to, side: 'after', blockKind: source.blockKind, ...keepOut }
        : { kind: 'move', target: source.target, to, side: 'after', ...keepOut },
    mark: {
      kind: 'line',
      x: box.x + foldEdge,
      y: box.y + box.height - foldInsideEndGap,
      width: box.width - 2 * foldEdge,
    },
    wraps: null,
  };
}

/** The outermost fold region inside `fold` (not `fold` itself) that ends where it ends. */
function innerFoldAtEnd(seq: Seq, fold: FoldMark): Id | null {
  const range = foldRange(seq, fold);
  if (range === null) {
    return null;
  }
  let outer: { readonly id: Id; readonly first: number } | null = null;
  for (const other of seq.folds) {
    const r = other.id === fold.id ? null : foldRange(seq, other);
    if (
      r !== null &&
      r[1] === range[1] &&
      r[0] >= range[0] &&
      (outer === null || r[0] < outer.first)
    ) {
      outer = { id: other.id, first: r[0] };
    }
  }
  return outer?.id ?? null;
}

/** An opened (peeked) call block of the model: its whole box and its band. */
type OpenedCall = { readonly call: Id; readonly box: Box; readonly band: Box };

/** The opened call block of the model whose box holds the point, or `null`. */
function openedCallOf(layout: LayoutResult, index: DocIndex, point: Point): OpenedCall | null {
  let inner: OpenedCall | null = null;
  for (const region of layout.regions) {
    if (region.kind !== 'peekBand' || !index.blocks.has(region.blockId)) {
      continue;
    }
    const box = layout.boxes.get(region.blockId);
    if (
      box !== undefined &&
      contains(box, point) &&
      (inner === null || area(box) < area(inner.box))
    ) {
      inner = { call: region.blockId, box, band: region.box };
    }
  }
  return inner;
}

/**
 * A drop on an opened call block counts like one on an open fold region (M87 F3): its band puts
 * the blocks before the call block, the bottom band inside its box after it; the line is drawn
 * just outside its border. The blocks shown inside are the Method's: nothing is dropped there,
 * and nothing goes into the Method.
 */
function dropAtOpenedCall(
  index: DocIndex,
  opened: OpenedCall,
  point: Point,
  source: DragSource,
): Drop | null {
  const { call, box, band } = opened;
  const side: Side | null = contains(band, point)
    ? 'before'
    : point.y > box.y + box.height - betweenBand
      ? 'after'
      : null;
  if (side === null) {
    return null;
  }
  if (source.kind === 'blocks' && ancestorsOf(index, call).some((a) => source.blocks.includes(a))) {
    return null;
  }
  return {
    action:
      source.kind === 'new'
        ? { kind: 'insert', to: call, side, blockKind: source.blockKind }
        : { kind: 'move', target: source.target, to: call, side },
    mark: {
      kind: 'line',
      x: box.x,
      y: side === 'before' ? box.y - foldOutsideGap : box.y + box.height + foldOutsideGap,
      width: box.width,
    },
    wraps: null,
  };
}

/** The smallest box holding all the boxes. */
export function union(boxes: ReadonlyArray<Box>): Box {
  const [first] = boxes;
  if (first === undefined) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  let left = first.x;
  let top = first.y;
  let right = first.x + first.width;
  let bottom = first.y + first.height;
  for (const box of boxes) {
    left = Math.min(left, box.x);
    top = Math.min(top, box.y);
    right = Math.max(right, box.x + box.width);
    bottom = Math.max(bottom, box.y + box.height);
  }
  return { x: left, y: top, width: right - left, height: bottom - top };
}
