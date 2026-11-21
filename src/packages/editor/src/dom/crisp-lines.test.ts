// @vitest-environment happy-dom
// Even straight lines on the screen at any scale (visual design 9.1, 9.2): crisp-edged strokes of whole device pixels.
import { describe, expect, it } from 'vitest';

import { crispStrokeWidth, isAxisAlignedPath, snapCrispStrokes } from './crisp-lines';

describe('crispStrokeWidth', () => {
  it('T-1480: gives every width a whole number of device pixels, at least one, at any scale', () => {
    // App zoom 40 ~ 300 % times device pixel ratios of browser zoom and display scaling.
    const zooms = [0.4, 0.5, 0.9, 1, 1.1, 1.2, 1.3, 1.5, 1.7, 2, 2.5, 3];
    const ratios = [1, 1.1, 1.25, 1.5, 1.75, 2];
    for (const zoom of zooms) {
      for (const ratio of ratios) {
        const scale = zoom * ratio;
        for (const width of [1, 3]) {
          const pixels = crispStrokeWidth(width, scale) * scale;
          expect(pixels).toBeCloseTo(Math.round(pixels), 9);
          expect(Math.round(pixels)).toBeGreaterThanOrEqual(1);
          // Never more than half a pixel away from the width the drawing asks for.
          expect(Math.abs(Math.round(pixels) - Math.max(1, width * scale))).toBeLessThanOrEqual(
            0.5,
          );
        }
      }
    }
    expect(crispStrokeWidth(1, 1)).toBe(1);
    expect(crispStrokeWidth(3, 2)).toBe(3);
  });
});

describe('snapCrispStrokes', () => {
  it('T-1481: snaps crisp-edged shapes and straight unfilled paths, leaves diagonals, and clears the width where none is needed', () => {
    const root = document.createElement('div');
    root.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg">' +
      '<rect stroke-width="1" shape-rendering="crispEdges"/>' +
      '<rect stroke-width="3" shape-rendering="crispEdges"/>' +
      '<path d="M77 49.44 L77 84" fill="none" stroke-width="1"/>' +
      '<path d="M24 24 L149 84 L215 24" fill="none" stroke-width="1"/>' +
      '<path d="M0 0 L10 0 L10 10 Z" fill="#fff" stroke-width="1"/>' +
      '</svg>';
    const [thin, thick] = root.querySelectorAll<SVGElement>('rect');
    const [line, diagonal, filled] = root.querySelectorAll<SVGElement>('path');
    snapCrispStrokes(root, 1.1);
    expect(thin?.style.strokeWidth).toBe(`${String(1 / 1.1)}px`);
    expect(thick?.style.strokeWidth).toBe(`${String(3 / 1.1)}px`);
    expect(line?.style.strokeWidth).toBe(`${String(1 / 1.1)}px`);
    expect(line?.style.shapeRendering).toBe('crispEdges');
    // Diagonals stay anti-aliased at the width of the drawing; filled outlines are not lines.
    for (const shape of [diagonal, filled]) {
      expect(shape?.style.strokeWidth).toBe('');
      expect(shape?.style.shapeRendering).toBe('');
    }
    snapCrispStrokes(root, 1);
    expect(thin?.style.strokeWidth).toBe('');
    expect(thick?.style.strokeWidth).toBe('');
    expect(line?.style.strokeWidth).toBe('');
    snapCrispStrokes(root, Number.NaN);
    expect(thin?.style.strokeWidth).toBe('');
  });

  it('T-1483: tells paths of horizontal and vertical lines from diagonals and curves', () => {
    expect(isAxisAlignedPath('M24 64 L186 64')).toBe(true);
    expect(isAxisAlignedPath('M77 49.44 L77 84')).toBe(true);
    expect(isAxisAlignedPath('M0 0 L10 0 L10 -5.5')).toBe(true);
    expect(isAxisAlignedPath('M24 24 L99 84 L184 24')).toBe(false);
    expect(isAxisAlignedPath('M137 104.5 L146 95.5')).toBe(false);
    expect(isAxisAlignedPath('M0 0 C1 1 2 2 3 3 Z')).toBe(false);
    expect(isAxisAlignedPath('M0 0')).toBe(false);
  });
});
