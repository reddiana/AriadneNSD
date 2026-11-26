// Where a drag would drop (03-editor 3.2, interaction rules 7). Pure: layout and document only.
import type {
  Box,
  DiagramLayout,
  Id,
  LayoutResult,
  NewBlockKind,
  Side,
  Target,
  WrapKind,
} from '@ariadne-nsd/core';

import type { DocIndex } from '../model/doc-index';
import { ancestorsOf, isEmptyBlock } from '../model/doc-index';
import type { Selection } from '../state/selection';
import { selectedBlocks, targetOf } from '../state/selection';
import type { Hit, Point } from './hit-test';
import { hitTest } from './hit-test';

/** The band at the top and bottom of a block that means "between blocks" (px). */
export const betweenBand = 8;

/** A block lower than this has only "between" halves, no "on the block" part (px). */
export const smallBlockHeight = 24;

/**
 * The band right under a diagram, as wide as its body, that means "at the end of the body" (px).
 * Narrower than the gap between diagrams (`space.diagram`), so it never reaches the next one.
 */
export const bodyEndBand = 12;

/** What is dragged: blocks of the diagram (a range), or a new block from a toolbar icon. */
export type DragSource =
  | { readonly kind: 'blocks'; readonly target: Target; readonly blocks: ReadonlyArray<Id> }
  | { readonly kind: 'new'; readonly blockKind: NewBlockKind };

/** What a drop does. Each is one command, so one undo step. */
export type DropAction =
  /**
   * Insert a new block next to `to`; on an empty block it takes its place. `outsideFolds`: at
   * the very start or end of a diagram body, it does not join a fold region ending there.
   */
  | {
      readonly kind: 'insert';
      readonly to: Id;
      readonly side: Side;
      readonly blockKind: NewBlockKind;
      readonly outsideFolds?: boolean;
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
    }
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
  if (hit === null || hit.kind === 'diagramHead' || hit.kind === 'toggle') {
    return null;
  }
  // A branch label row counts as the header of its If or Case.
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
    return between(source, id, box, zone);
  }
  if (source.kind === 'blocks') {
    return between(source, id, box, point.y < box.y + box.height / 2 ? 'before' : 'after');
  }
  const kind = source.blockKind;
  if (kind === 'process') {
    return between(source, id, box, 'after');
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

function between(source: DragSource, to: Id, box: Box, side: Side): Drop {
  return {
    action:
      source.kind === 'new'
        ? { kind: 'insert', to, side, blockKind: source.blockKind }
        : { kind: 'move', target: source.target, to, side },
    mark: {
      kind: 'line',
      x: box.x,
      y: side === 'before' ? box.y : box.y + box.height,
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
