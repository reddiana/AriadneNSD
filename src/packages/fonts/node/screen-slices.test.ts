// The screen font in slices (ADR-0040): every character of the font is in exactly one slice.
import { describe, expect, it } from 'vitest';

import { screenSlices, unicodeRangeOf } from '../src/index';
import { readFontFile } from './index';

/** The code points of a unicode-range string. */
function codesOf(range: string): number[] {
  return range.split(', ').flatMap((part) => {
    const [first = '', end = first] = part.slice(2).split('-');
    const lo = Number.parseInt(first, 16);
    const hi = Number.parseInt(end, 16);
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  });
}

describe('screen slices', () => {
  it('T-0526: writes runs of code points as a unicode-range', () => {
    expect(unicodeRangeOf([0x20, 0x21, 0x22, 0xac00, 0xac02])).toBe('U+20-22, U+AC00, U+AC02');
  });

  it('T-0527: holds each character in one slice, as many as the build counted', () => {
    const seen = new Set<number>();
    for (const slice of screenSlices) {
      const codes = codesOf(slice.unicodeRange);
      expect(codes.length, slice.file).toBe(slice.count);
      for (const code of codes) {
        expect(seen.has(code), `U+${code.toString(16)}`).toBe(false);
        seen.add(code);
      }
    }
    // All Hangul syllables, and Latin in slice 0, the one loaded at start.
    for (let code = 0xac00; code <= 0xd7a3; code += 1) {
      expect(seen.has(code)).toBe(true);
    }
    expect(codesOf(screenSlices[0]?.unicodeRange ?? '')).toContain(0x41);
  });

  it('T-0528: has a woff2 file for each slice', async () => {
    for (const slice of screenSlices) {
      const bytes = await readFontFile(`assets/screen/${slice.file}`);
      expect(new TextDecoder().decode(bytes.subarray(0, 4)), slice.file).toBe('wOF2');
    }
  });
});
