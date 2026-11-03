import { afterEach, describe, expect, it, vi } from 'vitest';

import { pngSize, svgSize, svgToPng } from './export-png';

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

/** Stands in for the browser's image, canvas and object URLs; records what was drawn. */
function fakeBrowser(options: { context?: boolean; blob?: boolean; decode?: boolean } = {}) {
  const seen = {
    sources: [] as string[],
    canvas: { width: 0, height: 0 },
    drawn: [] as number[][],
    types: [] as string[],
    created: [] as Blob[],
    revoked: [] as string[],
  };
  const png = new Blob(['png'], { type: 'image/png' });
  vi.stubGlobal(
    'Image',
    class {
      set src(value: string) {
        seen.sources.push(value);
      }
      decode(): Promise<void> {
        return options.decode === false
          ? Promise.reject(new Error('bad image'))
          : Promise.resolve();
      }
    },
  );
  vi.stubGlobal('document', {
    createElement: () => ({
      set width(value: number) {
        seen.canvas.width = value;
      },
      set height(value: number) {
        seen.canvas.height = value;
      },
      getContext: () =>
        options.context === false
          ? null
          : {
              drawImage: (_image: unknown, ...rest: number[]) => {
                seen.drawn.push(rest);
              },
            },
      toBlob: (callback: (blob: Blob | null) => void, type: string) => {
        seen.types.push(type);
        callback(options.blob === false ? null : png);
      },
    }),
  });
  vi.stubGlobal('URL', {
    createObjectURL: (blob: Blob) => {
      seen.created.push(blob);
      return 'blob:svg';
    },
    revokeObjectURL: (url: string) => seen.revoked.push(url),
  });
  return { seen, png };
}

const sizedSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"></svg>';

describe('PNG drawing', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('T-0746 · R-EXP-01: draws the saved SVG at the scale and gives a PNG', async () => {
    const { seen, png } = fakeBrowser();
    expect(await svgToPng(sizedSvg, 3)).toBe(png);
    expect(seen.created[0]?.type).toBe('image/svg+xml');
    expect(await seen.created[0]?.text()).toBe(sizedSvg);
    expect(seen.sources).toEqual(['blob:svg']);
    expect(seen.canvas).toEqual({ width: 300, height: 150 });
    expect(seen.drawn).toEqual([[0, 0, 300, 150]]);
    expect(seen.types).toEqual(['image/png']);
    expect(seen.revoked).toEqual(['blob:svg']);
  });

  it('T-0747 · R-EXP-01: draws at twice the size by default', async () => {
    const { seen } = fakeBrowser();
    await svgToPng(sizedSvg);
    expect(seen.canvas).toEqual({ width: 200, height: 100 });
  });

  it('T-0748: fails for an SVG without a size, before making anything', async () => {
    const { seen } = fakeBrowser();
    await expect(svgToPng('<svg/>')).rejects.toThrow('The saved SVG has no width and height');
    expect(seen.created).toEqual([]);
  });

  it('T-0749: fails without a canvas, an image or a PNG, and lets go of the image address', async () => {
    for (const [options, message] of [
      [{ context: false }, 'No 2D canvas context'],
      [{ blob: false }, 'canvas.toBlob gave no PNG'],
      [{ decode: false }, 'bad image'],
    ] as const) {
      const { seen } = fakeBrowser(options);
      await expect(svgToPng(sizedSvg)).rejects.toThrow(message);
      expect(seen.revoked).toEqual(['blob:svg']);
    }
  });
});
