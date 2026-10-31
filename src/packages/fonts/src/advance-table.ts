/**
 * A run of consecutive code points that share one advance width: [first, last, advance].
 * Both ends are inclusive. The advance is in font units.
 */
export type AdvanceRange = readonly [first: number, last: number, advance: number];

/**
 * Advance widths of a font as ranges (02-layout 2.1).
 * Code points outside every range use `defaultAdvance`.
 */
export type AdvanceTable = {
  readonly unitsPerEm: number;
  /** Full width. Also used for characters the font does not have (ADR-0037). */
  readonly defaultAdvance: number;
  /** Sorted by `first`, not overlapping. */
  readonly ranges: ReadonlyArray<AdvanceRange>;
};

/**
 * Returns the advance width of one code point in font units.
 * Characters missing from the table count as `defaultAdvance` (full width, 02-layout 2.1).
 */
export function advanceOf(table: AdvanceTable, codePoint: number): number {
  const { ranges } = table;
  let low = 0;
  let high = ranges.length - 1;
  while (low <= high) {
    const middle = (low + high) >>> 1;
    const range = ranges[middle];
    if (range === undefined) {
      break;
    }
    const [first, last, advance] = range;
    if (codePoint < first) {
      high = middle - 1;
    } else if (codePoint > last) {
      low = middle + 1;
    } else {
      return advance;
    }
  }
  return table.defaultAdvance;
}
