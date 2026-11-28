// The overlay layer (03-editor 1): the selection, the hover, the drop place and the dragged
// blocks, drawn as one SVG over the document layer. Never saved (ADR-0018). Pure: a string.
import type { Box, Id, LayoutResult, ThemeKind } from '@ariadne-nsd/core';
import { geometry, primitiveColors } from '@ariadne-nsd/core';

import type { Drop } from '../input/drop';
import { union } from '../input/drop';
import type { DocIndex } from '../model/doc-index';
import { screenIdIn } from '../model/shown-index';
import type { EditField } from '../state/editor-state';
import type { Selection } from '../state/selection';
import { selectedBlocks, selectedScreenIds } from '../state/selection';

/** The edit layer color tokens (visual design 3.4). */
export type EditColors = Readonly<
  Record<
    'edit.select' | 'edit.hover' | 'edit.field' | 'edit.drop' | 'edit.error' | 'edit.toggle',
    string
  >
>;

/**
 * The edit layer colors on light paper (visual design 3.4). The same on light and dark screens:
 * they are drawn on the paper, so they follow the theme's kind, not the screen (UX TM4).
 */
export const editColors: EditColors = {
  'edit.select': primitiveColors['orange.600'],
  'edit.hover': primitiveColors['orange.600'],
  'edit.field': primitiveColors['orange.600'],
  'edit.drop': primitiveColors['orange.600'],
  'edit.error': primitiveColors['red.700'],
  // The fold triangles are on the editing layer in the muted text color (visual design 3.3).
  'edit.toggle': primitiveColors['ink.500'],
};

/**
 * The edit layer colors on dark paper (the dark and high contrast themes, visual design 3.4).
 * The orange and red have no primitive of their own; the document's table gives their values.
 */
export const editColorsOnDark: EditColors = {
  'edit.select': '#f08a4b',
  'edit.hover': '#f08a4b',
  'edit.field': '#f08a4b',
  'edit.drop': '#f08a4b',
  'edit.error': '#ff7b72',
  // The muted text color of the dark theme.
  'edit.toggle': primitiveColors['ink.300'],
};

/** The edit layer colors for a theme's kind of paper. */
export function editColorsFor(kind: ThemeKind): EditColors {
  return kind === 'dark' ? editColorsOnDark : editColors;
}

/** What the overlay shows. */
export type OverlayInput = {
  readonly layout: LayoutResult;
  readonly index: DocIndex;
  readonly selection: Selection | null;
  /** The field the inline editor is open on. Default: none. */
  readonly editing?: EditField | null;
  /** The block under the pointer, or `null`. */
  readonly hover: Id | null;
  readonly drop: Drop | null;
  /** Blocks being dragged: drawn faded in place (visual design 7.1). */
  readonly dragged: ReadonlyArray<Id>;
  /**
   * Whether a drag is in progress (blocks or a toolbar icon). The selection outline is not drawn
   * meanwhile, so the drop place next to or on the selected block shows (sketch M85). Default: no.
   */
  readonly isDragging?: boolean;
  /** The paper color, to fade the dragged blocks with. */
  readonly paper: string;
  /** The edit layer colors for the document's theme (`editColorsFor`). Default: light paper. */
  readonly edit?: EditColors;
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
  if (selection.kind === 'peek' && selection.branch !== undefined) {
    const label = screenIdIn(selection.path, selection.branch);
    return branchBox(layout, isParallelBranch(index, selection.branch), label);
  }
  switch (selection.kind) {
    case 'blocks':
    case 'peek':
    case 'fold': {
      // A block hidden in something folded has that thing's box (02-layout 1.1).
      const boxes = selectedScreenIds(index, selection).flatMap((id) => {
        const box = layout.boxes.get(id);
        return box === undefined ? [] : [box];
      });
      return boxes.length === 0 ? null : union(boxes);
    }
    case 'branchLabel':
      return branchBox(layout, isParallelBranch(index, selection.branch), selection.branch);
    case 'missingDefault':
      return (
        layout.regions.find(
          (region) => region.kind === 'missingDefault' && region.blockId === selection.block,
        )?.box ?? null
      );
    case 'head': {
      // The whole header, like a block (visual design 7.1). A header like a title has its text
      // on the diagram's left edge, so its outline sits outside it and does not cover letters.
      const node = layout.nodes.find(
        (n): n is Extract<typeof n, { kind: 'diagramHead' }> =>
          n.kind === 'diagramHead' && n.id === selection.diagram,
      );
      if (node === undefined) {
        return null;
      }
      return node.style === 'title' ? grow(node.box, titleHeadOutset) : node.box;
    }
  }
}

/**
 * The box of a selected branch: an If or Case branch's label row, or a parallel block's whole
 * branch cell, which has no label (sketch M84 B1).
 */
function branchBox(layout: LayoutResult, isParallel: boolean, branch: Id): Box | null {
  if (isParallel) {
    return layout.boxes.get(branch) ?? null;
  }
  return (
    layout.regions.find((region) => region.kind === 'branchLabel' && region.branchId === branch)
      ?.box ?? null
  );
}

function isParallelBranch(index: DocIndex, branch: Id): boolean {
  return index.branches.get(branch)?.block.kind === 'parallel';
}

/** How far the selection outline of a header like a title stands outside it (3px line + 1px). */
const titleHeadOutset = 4;

function grow(box: Box, by: number): Box {
  return { x: box.x - by, y: box.y - by, width: box.width + 2 * by, height: box.height + by };
}

/**
 * The box the inline editor covers for a field: a process block's box, a control block's
 * header, a branch label row, the empty default cell, the name line of a diagram's header, the
 * inside of a call block's bars.
 */
export function fieldBox(layout: LayoutResult, field: EditField): Box | null {
  switch (field.kind) {
    case 'block': {
      const node = layout.nodes.find((n) => n.kind !== 'missingDefault' && n.id === field.block);
      if (node === undefined || node.kind === 'missingDefault') {
        return null;
      }
      if (node.kind === 'parallel') {
        return node.top;
      }
      if (node.kind === 'exit') {
        // The text starts right of the wedge (UX XB1).
        const wedge = geometry['size.exit-wedge'];
        return { ...node.box, x: node.box.x + wedge, width: node.box.width - wedge };
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
    case 'head': {
      const node = layout.nodes.find((n) => n.kind === 'diagramHead' && n.id === field.diagram);
      return node?.kind === 'diagramHead' ? headTextBox(node.box, node.style) : null;
    }
    case 'call': {
      const node = layout.nodes.find(
        (n) => (n.kind === 'call' || n.kind === 'peek') && n.id === field.block,
      );
      if (node?.kind === 'peek') {
        return node.band;
      }
      if (node?.kind !== 'call') {
        return null;
      }
      const bar = geometry['size.call-bar'];
      return { ...node.box, x: node.box.x + bar, width: node.box.width - 2 * bar };
    }
    case 'fold': {
      const id =
        (field.path ?? []).length === 0
          ? field.fold
          : [...(field.path ?? []), field.fold].join('/');
      const node = layout.nodes.find(
        (n) => (n.kind === 'foldCell' || n.kind === 'foldFrame') && n.id === id,
      );
      if (node?.kind === 'foldFrame') {
        return node.band;
      }
      return node?.kind === 'foldCell' ? node.box : null;
    }
  }
}

/**
 * Where a header's text is, as an inline editor box (whose padding is `space.pad-*`). A title
 * header writes its name at the diagram's left edge under the label; a hat or arch writes it
 * under the curve (02-layout 1.5).
 */
function headTextBox(head: Box, style: 'shape' | 'title'): Box {
  if (style === 'title') {
    const padX = geometry['space.pad-x'];
    const padY = geometry['space.pad-y'];
    const tag = geometry['size.title-tag'];
    const textHeight = head.height - tag - geometry['size.title-gap'];
    return {
      x: head.x - padX,
      y: head.y + tag - padY,
      width: head.width + padX,
      height: textHeight + 2 * padY,
    };
  }
  const hat = geometry['size.hat'];
  return { ...head, y: head.y + hat, height: head.height - hat };
}

/**
 * A rectangle whose stroke of `width` lies `inset` px inside the block's drawn edge. The document
 * is drawn half a pixel shifted (visual design 9.1), so a box's lines fill the pixels from x to
 * x + width + 1: the right and bottom lines lie one pixel past the box. The rectangle covers them
 * too, so the outline looks the same on all four sides.
 */
function insetRect(box: Box, inset: number, width: number, color: string): string {
  const offset = inset + width / 2;
  const w = Math.max(0, box.width + 1 - 2 * offset);
  const h = Math.max(0, box.height + 1 - 2 * offset);
  return `<rect x="${n(box.x + offset)}" y="${n(box.y + offset)}" width="${n(w)}" height="${n(h)}" fill="none" stroke="${color}" stroke-width="${n(width)}"/>`;
}

function n(value: number): string {
  return String(Math.round(value * 100) / 100);
}

/** Whether two boxes share some area; boxes that only touch do not. */
function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/**
 * A fold triangle in its click box (interaction rules 4): `▾` while open, `▸` while folded.
 * Only on the editing layer, so it is never saved (UX Q2). `▾` is centered in its band; `▸` is in
 * a folded cell, level with the first line of the name (UX FD11, BUG-17).
 */
function triangle(box: Box, isOpen: boolean, color: string): string {
  const cx = box.x + box.width / 2 + 1;
  const cy =
    box.y +
    (isOpen
      ? Math.min(box.height, geometry['size.band']) / 2
      : geometry['space.pad-y'] + geometry['space.line'] / 2);
  const points = isOpen
    ? [
        [cx - 4, cy - 2],
        [cx + 4, cy - 2],
        [cx, cy + 3],
      ]
    : [
        [cx - 2, cy - 4],
        [cx - 2, cy + 4],
        [cx + 3, cy],
      ];
  const d = points.map(([x = 0, y = 0]) => `${n(x)},${n(y)}`).join(' ');
  return `<polygon points="${d}" fill="${color}"/>`;
}

/**
 * The halo round a drop place on light paper: white, so the drop place stands apart from the
 * block lines it lies on (sketch M85). On dark paper the halo is the paper color: white there
 * would be a glaring stripe.
 */
const haloOnLight = '#ffffff';

/** How far a drop line's arrowheads stick out past the block's left and right edges (M85). */
const dropArrowOut = 7;

/**
 * A drop place between blocks (sketch M85): a 4px line on a 8px halo, and at both ends an
 * arrowhead with a thin halo outline that sticks out 7px past the block's edges and points in.
 * The block's right line fills the pixel past `x + width` (visual design 9.1).
 */
function dropLine(
  mark: { readonly x: number; readonly y: number; readonly width: number },
  color: string,
  halo: string,
): string {
  const { y } = mark;
  const x1 = mark.x - dropArrowOut;
  const x2 = mark.x + mark.width + 1 + dropArrowOut;
  return [
    `<line x1="${n(x1)}" y1="${n(y)}" x2="${n(x2)}" y2="${n(y)}" stroke="${halo}" stroke-width="8"/>`,
    `<line x1="${n(x1 + 6)}" y1="${n(y)}" x2="${n(x2 - 6)}" y2="${n(y)}" stroke="${color}" stroke-width="4"/>`,
    `<path d="M${n(x1)},${n(y - 6)} l8,6 l-8,6 z M${n(x2)},${n(y - 6)} l-8,6 l8,6 z" fill="${color}" stroke="${halo}" stroke-width="1.5" stroke-linejoin="round"/>`,
  ].join('');
}

/**
 * A drop place on a block (sketch M85): a solid 4px outline on a 8px halo, both centered 4px
 * inside the block, so the halo covers the block's lines and the 4px orange lies 2px to 6px in.
 */
function dropOutline(box: Box, color: string, halo: string): string {
  return insetRect(box, 0, 8, halo) + insetRect(box, 2, 4, color);
}

/** The overlay's SVG content (the inside of the overlay `<svg>`). */
export function overlayContent(input: OverlayInput): string {
  const parts: string[] = [];
  const { layout, index } = input;
  const colors = input.edit ?? editColors;
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
      parts.push(insetRect(box, 1, 1, colors['edit.hover']));
    }
  }
  for (const region of layout.regions) {
    if (region.kind === 'toggle') {
      parts.push(triangle(region.box, region.isOpen, colors['edit.toggle']));
    }
  }
  const box = selectionBox(layout, index, input.selection);
  const editing = input.editing ?? null;
  const field = editing === null ? null : fieldBox(layout, editing);
  // The inline editor has its own outline: two are not drawn in one place (visual design 7.1).
  if (box !== null && input.isDragging !== true && (field === null || !overlaps(box, field))) {
    parts.push(insetRect(box, 0, 3, colors['edit.select']));
  }
  const drop = input.drop;
  if (drop !== null) {
    const color = colors['edit.drop'];
    const halo = colors === editColorsOnDark ? input.paper : haloOnLight;
    switch (drop.mark.kind) {
      case 'line':
        parts.push(dropLine(drop.mark, color, halo));
        break;
      case 'outline':
        parts.push(dropOutline(drop.mark.box, color, halo));
        break;
    }
  }
  return parts.join('');
}
