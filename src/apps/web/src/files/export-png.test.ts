import { describe, expect, it } from 'vitest';

import { pngSize, svgSize } from './export-png';

describe('PNG export size', () => {
  it('T-0379 · R-EXP-01: reads the size of the saved SVG', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="320.5" height="200" viewBox="0 0 320.5 200">';
    expect(svgSize(svg)).toEqual({ width: 320.5, height: 200 });
  });

  it('T-0380: gives null for an SVG without a size', () => {
    expect(svgSize('<svg viewBox="0 0 10 10"></svg>')).toBeNull();
    expect(svgSize('not svg')).toBeNull();
  });

  it('T-0381 · R-EXP-01: draws at twice the size by default, in whole pixels', () => {
    expect(pngSize({ width: 320.5, height: 200 }, 2)).toEqual({
      width: 641,
      height: 400,
      scale: 2,
    });
  });

  it('T-0382: lowers the scale for a drawing larger than a canvas can be', () => {
    const size = pngSize({ width: 10_000, height: 500 }, 2);
    expect(size.width).toBe(16_384);
    expect(size.scale).toBeCloseTo(1.6384);
  });
});
