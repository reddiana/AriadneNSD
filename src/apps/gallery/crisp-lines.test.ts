// The gallery's copy of the editor's crisp lines (M88, pages/crisp-lines.js): the same cases as the
// editor's T-1480, T-1481 and T-1483, so the gallery shows lines as the editor does.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type Shape = {
  localName: string;
  attributes: Record<string, string>;
  getAttribute: (name: string) => string | null;
  style: { strokeWidth: string; shapeRendering: string };
};
type Crisp = {
  crispStrokeWidth: (width: number, scale: number) => number;
  isAxisAlignedPath: (data: string) => boolean;
  snapCrispStrokes: (
    root: { querySelectorAll: (selector: string) => Shape[] },
    scale: number,
  ) => void;
};

const code = readFileSync(new URL('pages/crisp-lines.js', import.meta.url), 'utf8');
// The page script is plain JS with no exports: run it and take its functions.
// eslint-disable-next-line @typescript-eslint/no-implied-eval -- see above
const load = new Function(
  `${code}\nreturn { crispStrokeWidth, isAxisAlignedPath, snapCrispStrokes };`,
) as () => Crisp;
const crisp = load();

const shape = (localName: string, attributes: Record<string, string>): Shape => ({
  localName,
  attributes,
  getAttribute: (name) => attributes[name] ?? null,
  style: { strokeWidth: '', shapeRendering: '' },
});

describe('gallery crisp lines', () => {
  it('T-1630: gives every stroke a whole number of device pixels at the display scale, as the editor does', () => {
    for (const scale of [1, 1.1, 1.25, 1.5, 1.75, 2, 2.5]) {
      for (const width of [1, 3]) {
        const pixels = crisp.crispStrokeWidth(width, scale) * scale;
        expect(pixels).toBeCloseTo(Math.round(pixels), 9);
        expect(Math.round(pixels)).toBeGreaterThanOrEqual(1);
      }
    }
    expect(crisp.crispStrokeWidth(1, 1)).toBe(1);
    expect(crisp.isAxisAlignedPath('M24 64 L186 64')).toBe(true);
    expect(crisp.isAxisAlignedPath('M77 49.44 L77 84')).toBe(true);
    expect(crisp.isAxisAlignedPath('M0 0 L10 0 L10 -5.5')).toBe(true);
    expect(crisp.isAxisAlignedPath('M24 24 L99 84 L184 24')).toBe(false);
    expect(crisp.isAxisAlignedPath('M137 104.5 L146 95.5')).toBe(false);
    expect(crisp.isAxisAlignedPath('M0 0 C1 1 2 2 3 3 Z')).toBe(false);
    expect(crisp.isAxisAlignedPath('M0 0')).toBe(false);
  });

  it('T-1631: snaps crisp-edged shapes and straight unfilled paths, leaves diagonals, and clears the width at 100%', () => {
    const rect = shape('rect', { 'stroke-width': '1', 'shape-rendering': 'crispEdges' });
    const bar = shape('path', { d: 'M31 64 L31 96', fill: 'none', 'stroke-width': '1' });
    const diagonal = shape('path', { d: 'M418 244 L662 292', fill: 'none', 'stroke-width': '1' });
    const icon = shape('path', { d: 'M708 312.5 L717 303.5', fill: 'none', 'stroke-width': '1.1' });
    const root = { querySelectorAll: () => [rect, bar, diagonal, icon] };
    crisp.snapCrispStrokes(root, 1.5);
    expect(rect.style.strokeWidth).toBe(`${String(2 / 1.5)}px`);
    expect(bar.style.strokeWidth).toBe(`${String(2 / 1.5)}px`);
    expect(bar.style.shapeRendering).toBe('crispEdges');
    for (const line of [diagonal, icon]) {
      expect(line.style).toEqual({ strokeWidth: '', shapeRendering: '' });
    }
    crisp.snapCrispStrokes(root, 1);
    expect(rect.style.strokeWidth).toBe('');
    expect(bar.style.strokeWidth).toBe('');
    crisp.snapCrispStrokes(root, Number.NaN);
    expect(rect.style.strokeWidth).toBe('');
  });
});
