// What the pointer points at (03-editor 3.1). Computed from the layout's click regions, not the
// DOM, so it is tested in Node.
import type { Box, Id, LayoutResult } from '@ariadne-nsd/core';

import type { DocIndex } from '../model/doc-index';
import type { Selection } from '../state/selection';
import { selectBlock } from '../state/selection';

/** A point in drawing coordinates (px, origin at the paper's top left). */
export type Point = { readonly x: number; readonly y: number };

/** What a point hits. */
export type Hit =
  /** A block: a process block's box, a control block's header (or its loop strip). */
  | { readonly kind: 'block'; readonly block: Id; readonly box: Box; readonly isHead: boolean }
  /** The label row of a branch. `branch` is `null` for the drawn default of a Case without one. */
  | {
      readonly kind: 'branchLabel';
      readonly block: Id;
      readonly branch: Id | null;
      readonly box: Box;
    }
  /** The empty default cell of a Case without a default (UX CD1). */
  | { readonly kind: 'missingDefault'; readonly block: Id; readonly box: Box };

/** Whether a box holds a point. Edges count as inside. */
export function contains(box: Box, point: Point): boolean {
  return (
    point.x >= box.x &&
    point.x <= box.x + box.width &&
    point.y >= box.y &&
    point.y <= box.y + box.height
  );
}

const area = (box: Box): number => box.width * box.height;

/**
 * Finds the innermost thing under a point (03-editor 3.1). Among the click regions holding the
 * point the smallest wins, so a branch label row beats the header around it. A point on a loop's
 * strip, which has no click region, hits the innermost block box holding it. `null`: nothing
 * (the empty canvas, or the paper outside the diagrams).
 */
export function hitTest(layout: LayoutResult, index: DocIndex, point: Point): Hit | null {
  let best: Hit | null = null;
  let bestArea = Infinity;
  for (const region of layout.regions) {
    if (!contains(region.box, point) || area(region.box) > bestArea) {
      continue;
    }
    bestArea = area(region.box);
    switch (region.kind) {
      case 'block':
        best = { kind: 'block', block: region.blockId, box: region.box, isHead: false };
        break;
      case 'head':
        best = { kind: 'block', block: region.blockId, box: region.box, isHead: true };
        break;
      case 'branchLabel':
        best = {
          kind: 'branchLabel',
          block: region.blockId,
          branch: region.branchId,
          box: region.box,
        };
        break;
      case 'missingDefault':
        best = { kind: 'missingDefault', block: region.blockId, box: region.box };
        break;
    }
  }
  if (best !== null) {
    return best;
  }
  let inner: { readonly id: Id; readonly box: Box } | null = null;
  for (const [id, box] of layout.boxes) {
    if (
      index.blocks.has(id) &&
      contains(box, point) &&
      (inner === null || area(box) < area(inner.box))
    ) {
      inner = { id, box };
    }
  }
  return inner === null ? null : { kind: 'block', block: inner.id, box: inner.box, isHead: false };
}

/** The selection a click on a hit makes. */
export function selectionOfHit(index: DocIndex, hit: Hit): Selection {
  switch (hit.kind) {
    case 'block':
      return selectBlock(index, hit.block);
    case 'branchLabel':
      return hit.branch === null
        ? { kind: 'missingDefault', block: hit.block }
        : { kind: 'branchLabel', branch: hit.branch };
    case 'missingDefault':
      return { kind: 'missingDefault', block: hit.block };
  }
}
