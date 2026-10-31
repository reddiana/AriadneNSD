// Text size from the bundled font's advance table (02-layout 1.2 and 2, ADR-0026).
// No browser text measurement: the same text has the same width everywhere.
import type { AdvanceTable } from '@ariadne-nsd/fonts';
import { advanceOf, blockFont } from '@ariadne-nsd/fonts';

/** Font sizes of the drawing (visual design 4.1). */
export const fontSizes = {
  /** Block text. */
  body: 13,
  /** Branch labels and other secondary text. */
  secondary: 12,
} as const;

/** The height of one line of block text (`space.line`). */
export const lineHeight = 18;

/** The measured size of a text, in whole px. */
export type TextSize = {
  /** The width of the longest line. */
  readonly width: number;
  /** Number of lines × `space.line`. */
  readonly height: number;
  /** The lines, split only at `\n` (UX LT1). An empty text is one empty line. */
  readonly lines: ReadonlyArray<string>;
};

/**
 * Splits a text into lines at `\n` only. Long lines are never wrapped (UX LT1).
 * An empty text is one empty line, so an empty block is not flat (02-layout 1.2).
 */
export function splitLines(text: string): ReadonlyArray<string> {
  return text.split('\n');
}

/**
 * Returns the width of one line in px, rounded up to a whole px.
 * Adds advance widths with no kerning (ADR-0026). Characters missing from the table count as
 * full width (02-layout 2.1).
 */
export function measureLine(
  line: string,
  fontSize: number = fontSizes.body,
  table: AdvanceTable = blockFont.advances,
): number {
  const advances = advanceCache(table);
  let units = 0;
  for (const character of line) {
    const codePoint = character.codePointAt(0);
    if (codePoint !== undefined) {
      let advance = advances.get(codePoint);
      if (advance === undefined) {
        advance = advanceOf(table, codePoint);
        advances.set(codePoint, advance);
      }
      units += advance;
    }
  }
  // Integer arithmetic before the one division keeps the result exact (6.5px is 6.5, not 6.4999).
  return Math.ceil((units * fontSize) / table.unitsPerEm);
}

// Advances already looked up, per table. Layout runs on every edit (ADR-0037) and measures the
// same few hundred characters again and again; a map lookup is cheaper than the binary search.
const advanceCaches = new WeakMap<AdvanceTable, Map<number, number>>();

function advanceCache(table: AdvanceTable): Map<number, number> {
  let cache = advanceCaches.get(table);
  if (cache === undefined) {
    cache = new Map();
    advanceCaches.set(table, cache);
  }
  return cache;
}

/**
 * Measures a possibly multi-line text (R-LAY-01): the longest line's width and lines × line height.
 */
export function measureText(text: string, fontSize: number = fontSizes.body): TextSize {
  const lines = splitLines(text);
  let width = 0;
  for (const line of lines) {
    width = Math.max(width, measureLine(line, fontSize));
  }
  return { width, height: lines.length * lineHeight, lines };
}
