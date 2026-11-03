import { describe, expect, it } from 'vitest';

import { advanceOf } from './advance-table';
import { blockFont } from './block-font';

const advance = (character: string): number =>
  advanceOf(blockFont.advances, character.codePointAt(0) ?? 0);

describe('block font advance table', () => {
  it('T-0512: ADR-0034: Latin, Greek and Cyrillic are half width', () => {
    expect(advance('a')).toBe(500);
    expect(advance('é')).toBe(500);
    expect(advance('λ')).toBe(500);
    expect(advance('ж')).toBe(500);
  });

  it('T-0513: ADR-0034: Hangul and kana are full width', () => {
    expect(advance('한')).toBe(1000);
    expect(advance('ア')).toBe(1000);
  });

  it('T-0514: 02-layout 2.1: characters missing from the font count as full width', () => {
    expect(advance('漢')).toBe(1000);
    expect(advance('😀')).toBe(1000);
  });

  it('T-0515: 02-layout 2.1: ranges are sorted and do not overlap', () => {
    const { ranges } = blockFont.advances;
    for (let index = 1; index < ranges.length; index += 1) {
      const previous = ranges[index - 1];
      const current = ranges[index];
      expect(previous?.[1]).toBeLessThan(current?.[0] ?? Number.NaN);
    }
  });

  it('T-0516: 02-layout 2.1: 13 px text widths match the design examples', () => {
    const px = (text: string): number => {
      let units = 0;
      for (const character of text) {
        units += advance(character);
      }
      return Math.ceil((units * 13) / blockFont.advances.unitsPerEm);
    };
    expect(px('n > 0')).toBe(33);
    expect(px('a[j] <= pivot && j < hi')).toBe(150);
    expect(px('i ← i + 1')).toBe(59);
  });
});
