// The overlay layer (03-editor 1): the selection, the hover, the drop place and the dragged
// blocks, drawn as one SVG over the document layer. Never saved (ADR-0018). Pure: a string.
import type { Box, Id, LayoutResult } from '@ariadne-nsd/core';

import type { Drop } from '../input/drop';
import { union } from '../input/drop';
import type { DocIndex } from '../model/doc-index';
import type { EditField } from '../state/editor-state';
import type { Selection } from '../state/selection';
import { selectedBlocks } from '../state/selection';

/** The edit layer colors (visual design 3.4). The same on light and dark screens. */
export const editColors = {
  'edit.select': '#d0500b',
  'edit.hover': '#d0500b',
  'edit.field': '#d0500b',
  'edit.drop': '#d0500b',
  'edit.error': '#b42318',
} as const;

/** What the overlay shows. */
export type OverlayInput = {
  readonly layout: LayoutResult;
  readonly index: DocIndex;
  readonly selection: Selection | null;
  /** The block under the pointer, or `null`. */
  readonly hover: Id | null;
  readonly drop: Drop | null;
  /** Blocks being dragged: drawn faded in place (visual design 7.1). */
  readonly dragged: ReadonlyArray<Id>;
  /** The paper color, to fade the dragged blocks with. */
  readonly paper: string;
};

/** The box a selection is drawn around, or `null`. */
export function selectionBox(
  layout: LayoutResult,
  index: DocIndex,
  selection: Selection | null,
): Box | null {
  if (selection === null) {
    return null;
  }
  switch (selection.kind) {
    case 'blocks': {
      const boxes = selectedBlocks(index, selection).flatMap((id) => {
        const box = layout.boxes.get(id);
        return box === undefined ? [] : [box];
      });
      return boxes.length === 0 ? null : union(boxes);
    }
    case 'branchLabel':
      return (
        layout.regions.find(
          (region) => region.kind === 'branchLabel' && region.branchId === selection.branch,
        )?.box ?? null
      );
    case 'missingDefault':
      return (
        layout.regions.find(
          (region) => region.kind === 'missingDefault' && region.blockId === selection.block,
        )?.box ?? null
      );
    case 'head':
    case 'fold':
      return null;
  }
}

/**
 * The box the inline editor covers for a field: a process block's box, a control block's
 * header, a branch label row, the empty default cell.
 */
export function fieldBox(layout: LayoutResult, field: EditField): Box | null {
  switch (field.kind) {
    case 'block': {
      const node = layout.nodes.find((n) => n.kind !== 'missingDefault' && n.id === field.block);
      if (node === undefined || node.kind === 'missingDefault') {
        return null;
      }
      return 'head' in node ? node.head : node.box;
    }
    case 'branchLabel':
      return (
        layout.regions.find(
          (region) => region.kind === 'branchLabel' && region.branchId === field.branch,
        )?.box ?? null
      );
    case 'missingDefault':
      return (
        layout.regions.find(
          (region) => region.kind === 'missingDefault' && region.blockId === field.block,
        )?.box ?? null
      );
  }
}

/** A rectangle whose stroke of `width` lies `inset` px inside the box edge. */
function insetRect(box: Box, inset: number, width: number, color: string): string {
  const offset = inset + width / 2;
  const w = Math.max(0, box.width - 2 * offset);
  const h = Math.max(0, box.height - 2 * offset);
  return `<rect x="${n(box.x + offset)}" y="${n(box.y + offset)}" width="${n(w)}" height="${n(h)}" fill="none" stroke="${color}" stroke-width="${n(width)}"/>`;
}

function n(value: number): string {
  return String(Math.round(value * 100) / 100);
}

/** The overlay's SVG content (the inside of the overlay `<svg>`). */
export function overlayContent(input: OverlayInput): string {
  const parts: string[] = [];
  const { layout, index } = input;
  for (const id of input.dragged) {
    const box = layout.boxes.get(id);
    if (box !== undefined) {
      // 40% opacity in place: paper at 60% over it.
      parts.push(
        `<rect x="${n(box.x)}" y="${n(box.y)}" width="${n(box.width)}" height="${n(box.height)}" fill="${input.paper}" fill-opacity="0.6"/>`,
      );
    }
  }
  const selected = selectedBlocks(index, input.selection);
  if (input.hover !== null && !selected.includes(input.hover) && input.drop === null) {
    const box = layout.boxes.get(input.hover);
    if (box !== undefined) {
      // 1px, 1px inside the block's outer line.
      parts.push(insetRect(box, 1, 1, editColors['edit.hover']));
    }
  }
  const box = selectionBox(layout, index, input.selection);
  if (box !== null) {
    parts.push(insetRect(box, 0, 3, editColors['edit.select']));
  }
  const drop = input.drop;
  if (drop !== null) {
    const color = editColors['edit.drop'];
    switch (drop.mark.kind) {
      case 'line': {
        const { x, y, width } = drop.mark;
        parts.push(
          `<line x1="${n(x)}" y1="${n(y)}" x2="${n(x + width)}" y2="${n(y)}" stroke="${color}" stroke-width="2"/>`,
          `<line x1="${n(x + 1)}" y1="${n(y - 4)}" x2="${n(x + 1)}" y2="${n(y + 4)}" stroke="${color}" stroke-width="2"/>`,
          `<line x1="${n(x + width - 1)}" y1="${n(y - 4)}" x2="${n(x + width - 1)}" y2="${n(y + 4)}" stroke="${color}" stroke-width="2"/>`,
        );
        break;
      }
      case 'outline':
        // 2px, 1px inside the block's outer line, like the hover.
        parts.push(insetRect(drop.mark.box, 1, 2, color));
        break;
    }
  }
  return parts.join('');
}
