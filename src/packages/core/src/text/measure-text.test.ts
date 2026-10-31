import { describe, expect, it } from 'vitest';

import { measureLine, measureText } from './measure-text';

describe('text width', () => {
  it('R-LAY-04: matches the 13px examples of 02-layout 2.1', () => {
    expect(measureLine('n > 0')).toBe(33);
    expect(measureLine('a[j] <= pivot && j < hi')).toBe(150);
    expect(measureLine('i ← i + 1')).toBe(59);
  });

  it('R-LAY-04: counts Hangul as full width and Latin as half width', () => {
    expect(measureLine('참')).toBe(13);
    expect(measureLine('값 x')).toBe(26);
    expect(measureLine('거짓', 12)).toBe(24);
  });

  it('02-layout 2.1: counts characters missing from the table as full width', () => {
    expect(measureLine('漢')).toBe(13);
    // One emoji is one code point (a surrogate pair in UTF-16), so one full width.
    expect(measureLine('😀')).toBe(13);
  });

  it('ADR-0026: rounds the line width up to a whole px', () => {
    expect(measureLine('a')).toBe(7);
    expect(measureLine('ab')).toBe(13);
  });

  it('R-LAY-01: measures several lines: the longest width, lines × 18px', () => {
    expect(measureText('ab\nabcd\nc')).toEqual({
      width: 26,
      height: 54,
      lines: ['ab', 'abcd', 'c'],
    });
  });

  it('02-layout 1.2: an empty text is one line high', () => {
    expect(measureText('')).toEqual({ width: 0, height: 18, lines: [''] });
  });

  it('UX LT1: never wraps a long line', () => {
    const long = 'x'.repeat(200);
    expect(measureText(long)).toEqual({ width: 1300, height: 18, lines: [long] });
  });

  it('UX LT1: keeps spaces as written', () => {
    expect(measureLine('    x')).toBe(33);
  });
});
