// What the pointer points at (03-editor 3.1). Computed from the layout's click regions, not the
// DOM, so it is tested in Node. Ids are the shown tree's (screen ids, `shown-index.ts`).
import type { Box, Id, LayoutResult } from '@ariadne-nsd/core';

import type { DocIndex } from '../model/doc-index';
import type { ShownIndex } from '../model/shown-index';
import { rowId } from '../model/shown-index';
import { fromShown, selectionOfScreenId } from '../navigation/shown-selection';
import type { Selection } from '../state/selection';

/** A point in drawing coordinates (px, origin at the paper's top left). */
export type Point = { readonly x: number; readonly y: number };

/** What a point hits. */
export type Hit =
  /**
   * A shown block: a process block's box, a control block's header (or its loop strip), the row
   * of a folded branch or loop body, a fold region's band or folded cell, an opened call's band.
   * `block` is the shown id (`shown-index.ts`).
   */
  | { readonly kind: 'block'; readonly block: Id; readonly box: Box; readonly isHead: boolean }
  /** The label row of a branch. `branch` is `null` for the drawn default of a Case without one. */
  | {
      readonly kind: 'branchLabel';
      readonly block: Id;
      readonly branch: Id | null;
      readonly box: Box;
    }
  /** The empty default cell of a Case without a default (UX CD1). */
  | { readonly kind: 'missingDefault'; readonly block: Id; readonly box: Box }
  /** The header of a diagram (Event or Method). */
  | { readonly kind: 'diagramHead'; readonly diagram: Id; readonly box: Box }
  /** The fold triangle of a fold region or an opened call block (interaction rules 4). */
  | {
      readonly kind: 'toggle';
      readonly what: 'fold' | 'peek';
      readonly target: Id;
      readonly isOpen: boolean;
      readonly box: Box;
    };

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
 * point the smallest wins, so a branch label row beats the header around it and a fold triangle
 * the band it is on. A point on a loop's strip, which has no click region, hits the innermost
 * shown box holding it. `null`: nothing (the empty canvas, or the paper outside the diagrams).
 * `index` is the shown tree's index.
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
      case 'diagramHead':
        best = { kind: 'diagramHead', diagram: region.diagramId, box: region.box };
        break;
      case 'foldedSeq':
        best = { kind: 'block', block: rowId(region.owner), box: region.box, isHead: false };
        break;
      case 'fold':
        best = { kind: 'block', block: region.foldId, box: region.box, isHead: !region.isFolded };
        break;
      case 'peekBand':
        best = { kind: 'block', block: region.blockId, box: region.box, isHead: true };
        break;
      case 'toggle':
        best = {
          kind: 'toggle',
          what: region.what,
          target: region.target,
          isOpen: region.isOpen,
          box: region.box,
        };
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

/** The selection a click on a hit makes, in the model (`real`). */
export function selectionOfHit(shown: ShownIndex, real: DocIndex, hit: Hit): Selection | null {
  switch (hit.kind) {
    case 'block':
      return selectionOfScreenId(shown, real, hit.block);
    case 'toggle':
      return selectionOfScreenId(shown, real, hit.target);
    case 'branchLabel':
      return fromShown(
        shown,
        real,
        hit.branch === null
          ? { kind: 'missingDefault', block: hit.block }
          : { kind: 'branchLabel', branch: hit.branch },
      );
    case 'missingDefault':
      return fromShown(shown, real, { kind: 'missingDefault', block: hit.block });
    case 'diagramHead':
      return { kind: 'head', diagram: hit.diagram };
  }
}
