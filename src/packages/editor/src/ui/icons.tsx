// Inline SVG icons. The block icons are the blocks' own shapes and colours made small
// (06-web 7, sketch M44); the other toolbar icons are plain strokes in the text colour.

import type { ReactElement } from 'react';

import type { ToolbarBlockKind } from './engine-api';

// The default light theme's colours (04-visual-design 3.3): the icon shows the block as drawn.
const fill = {
  process: '#edf0f5', // block.process
  branch: '#f6ebdc', // block.branch
  loop: '#dce6f6', // block.loop
};
const line = '#5b77ad'; // line.structure

const width = 22;
const height = 16;

function frame(background: string): ReactElement {
  return (
    <rect x=".5" y=".5" width={width - 1} height={height - 1} fill={background} stroke={line} />
  );
}

function blockShape(kind: ToolbarBlockKind): ReactElement {
  switch (kind) {
    case 'process':
      return frame(fill.process);
    case 'if':
      return (
        <>
          {frame(fill.process)}
          <rect x=".5" y=".5" width={width - 1} height="7" fill={fill.branch} stroke={line} />
          <path d="M.5 .5 L11 7.5 L21.5 .5 M11 7.5 V15.5" fill="none" stroke={line} />
        </>
      );
    case 'case':
      return (
        <>
          {frame(fill.process)}
          <rect x=".5" y=".5" width={width - 1} height="7" fill={fill.branch} stroke={line} />
          <path
            d="M.5 .5 L15.8 7.5 L21.5 .5 M5.3 7.5 V15.5 M10.6 7.5 V15.5 M15.8 7.5 V15.5"
            fill="none"
            stroke={line}
          />
        </>
      );
    case 'while':
      return (
        <>
          {frame(fill.loop)}
          <rect x="5.5" y="5.5" width="16" height="10" fill={fill.process} stroke={line} />
        </>
      );
    case 'for':
      return (
        <>
          {frame(fill.loop)}
          <rect x="5.5" y="5.5" width="16" height="10" fill={fill.process} stroke={line} />
          <path d="M2 2.5 h3 M2 4 h3" stroke={line} strokeWidth=".8" />
        </>
      );
    case 'doWhile':
      return (
        <>
          {frame(fill.loop)}
          <rect x="5.5" y=".5" width="16" height="10" fill={fill.process} stroke={line} />
        </>
      );
  }
}

/** The small picture of a block for its toolbar icon. */
export function BlockIcon({ kind }: { readonly kind: ToolbarBlockKind }): ReactElement {
  return (
    <svg
      className="ans-block-icon"
      width={width}
      height={height}
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      aria-hidden="true"
    >
      {blockShape(kind)}
    </svg>
  );
}

// Stroke paths on a 24 × 24 grid, keyed by the toolbar icon id the registry gives.
const strokePaths: Readonly<Record<string, string>> = {
  'file.new': 'M6 3h8l4 4v14H6z M14 3v4h4 M12 11v6 M9 14h6',
  'file.open': 'M3 7h6l2 2h10v10H3z',
  'file.save': 'M5 4h11l3 3v13H5z M8 4v5h7V4 M8 20v-6h8v6',
  'file.export': 'M12 4v11 M8 11l4 4 4-4 M5 19h14',
  'edit.undo': 'M9 8H5V4 M5 8a8 8 0 1 1 1.8 8.5',
  'edit.redo': 'M15 8h4V4 M19 8a8 8 0 1 0 -1.8 8.5',
  'edit.cut': 'M6 20a2.5 2.5 0 1 0 0-.1 M18 20a2.5 2.5 0 1 0 0-.1 M7.5 18L17 4 M16.5 18L7 4',
  'edit.copy': 'M9 9h11v11H9z M5 15H4V4h11v1',
  'edit.paste': 'M8 5H5v16h14V5h-3 M9 3h6v4H9z',
  wrap: 'M4 6h16v12H4z M8 9h8v6H8z',
  zoom: 'M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13 M15.5 15.5L20 20 M8 10.5h5 M10.5 8v5',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
  help: 'M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7v.5 M12 17v.5',
  chevron: 'M7 10l5 5 5-5',
};

/** Whether the UI has a drawn icon for a toolbar icon id. */
export function hasStrokeIcon(icon: string): boolean {
  return icon in strokePaths;
}

/** A plain toolbar icon. An unknown id draws nothing (the button shows its title instead). */
export function StrokeIcon({
  icon,
  size = 16,
}: {
  readonly icon: string;
  readonly size?: number;
}): ReactElement | null {
  const path = strokePaths[icon];
  if (path === undefined) return null;
  return (
    <svg
      className="ans-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}
