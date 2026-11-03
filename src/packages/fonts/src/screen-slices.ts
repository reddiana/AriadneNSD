// The screen font in slices (ADR-0040): the browser downloads only the slices whose characters
// are on screen. The build (scripts/build-fonts.py) writes the slices short; this module turns
// them into the CSS unicode-range each FontFace needs.

import { screenSliceData } from './generated/screen-slices';
import type { ScreenSlice, ScreenSliceData } from './screen-slice-types';

const hex = (code: number): string => code.toString(16).toUpperCase();

/** The unicode-range of code points in increasing order, runs joined (`U+AC00-AC02, U+AC05`). */
export function unicodeRangeOf(codes: ReadonlyArray<number>): string {
  const runs: [number, number][] = [];
  for (const code of codes) {
    const last = runs.at(-1);
    if (last?.[1] === code - 1) {
      last[1] = code;
    } else {
      runs.push([code, code]);
    }
  }
  return runs
    .map(([first, end]) => (first === end ? `U+${hex(first)}` : `U+${hex(first)}-${hex(end)}`))
    .join(', ');
}

/** The slices with their unicode-range, slice 0 first. */
export function screenSlicesOf(data: ReadonlyArray<ScreenSliceData>): ReadonlyArray<ScreenSlice> {
  const common = new Set<number>();
  for (const slice of data) {
    if ('chars' in slice) {
      for (const char of slice.chars) {
        common.add(char.codePointAt(0) ?? 0);
      }
    }
  }
  return data.map((slice) => {
    let unicodeRange: string;
    if ('unicodeRange' in slice) {
      unicodeRange = slice.unicodeRange;
    } else if ('chars' in slice) {
      // Hangul syllables only: one code point each.
      const codes = Array.from(slice.chars, (char) => char.codePointAt(0) ?? 0);
      unicodeRange = unicodeRangeOf(codes.sort((a, b) => a - b));
    } else {
      const codes: number[] = [];
      for (let code = slice.from; code <= slice.to; code += 1) {
        if (!common.has(code)) {
          codes.push(code);
        }
      }
      unicodeRange = unicodeRangeOf(codes);
    }
    return { file: slice.file, unicodeRange, count: slice.count };
  });
}

/** The screen font's slices. Slice 0 (Latin, punctuation, symbols) is loaded at start. */
export const screenSlices: ReadonlyArray<ScreenSlice> = screenSlicesOf(screenSliceData);
