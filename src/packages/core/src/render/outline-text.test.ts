// Text as outlines (R-FMT-10): glyphs placed by their advances, written as paths.
import type { Glyph, GlyphOutlines } from '@ariadne-nsd/fonts';
import { describe, expect, it } from 'vitest';

import { glyphPathData, placeGlyphs, syntheticBoldWidth } from './outline-text';
import type { TextElement } from './outline-text';
import type { Scene } from './scene';
import { toSvg } from './to-svg';
import { usedCodePoints } from './used-code-points';

/** A square glyph of 500 units for every letter but `?`, which the font lacks; a space is empty. */
const square: Glyph = {
  advance: 500,
  commands: [
    { kind: 'move', x: 0, y: 0 },
    { kind: 'line', x: 400, y: 0 },
    { kind: 'quad', cx: 400, cy: 700, x: 0, y: 700 },
    { kind: 'close' },
  ],
};
const space: Glyph = { advance: 500, commands: [] };
const outlines: GlyphOutlines = {
  unitsPerEm: 1000,
  glyphOf: (codePoint) => (codePoint === 0x3f ? null : codePoint === 0x20 ? space : square),
  notdef: space,
};

const text = (overrides: Partial<TextElement> = {}): TextElement => ({
  kind: 'text',
  blockId: 'b1',
  x: 10,
  y: 20,
  anchor: 'start',
  fontSize: 10,
  fill: '#151a22',
  runs: [{ text: 'ab', weight: 400 }],
  halo: null,
  ...overrides,
});

describe('placeGlyphs', () => {
  it('T-1045: puts glyphs side by side by their advances from the anchor', () => {
    expect(placeGlyphs(text(), outlines)?.map((glyph) => glyph.x)).toEqual([10, 15]);
    expect(placeGlyphs(text({ anchor: 'middle' }), outlines)?.map((glyph) => glyph.x)).toEqual([
      5, 10,
    ]);
    expect(placeGlyphs(text({ anchor: 'end' }), outlines)?.map((glyph) => glyph.x)).toEqual([0, 5]);
  });

  it('T-1046: keeps the weight of each run and the scale of the size', () => {
    const glyphs = placeGlyphs(
      text({
        runs: [
          { text: 'a', weight: 400 },
          { text: 'b', weight: 600 },
        ],
      }),
      outlines,
    );
    expect(glyphs?.map((glyph) => [glyph.weight, glyph.scale])).toEqual([
      [400, 0.01],
      [600, 0.01],
    ]);
  });

  it('T-1047: gives up on a character the font lacks, unless told what to draw instead', () => {
    expect(placeGlyphs(text({ runs: [{ text: 'a?', weight: 400 }] }), outlines)).toBeNull();
    const withMissing = placeGlyphs(text({ runs: [{ text: 'a?', weight: 400 }] }), outlines, space);
    expect(withMissing?.map((glyph) => glyph.glyph)).toEqual([square, space]);
  });
});

describe('glyphPathData', () => {
  it('T-1048: writes each glyph in drawing coordinates, y down, and nothing for a space', () => {
    const glyphs = placeGlyphs(text({ runs: [{ text: 'a b', weight: 400 }] }), outlines) ?? [];
    expect(glyphPathData(glyphs, String)).toBe(
      'M10 20L14 20Q14 13 10 13Z' + 'M20 20L24 20Q24 13 20 13Z',
    );
  });

  it('T-1049: covers the box the layout measured for the text', () => {
    const element = text({ runs: [{ text: 'abc', weight: 400 }] });
    const numbers = glyphPathData(placeGlyphs(element, outlines) ?? [], String)
      .split(/[MLQZ ]/)
      .filter((part) => part !== '')
      .map(Number);
    const xs = numbers.filter((_, index) => index % 2 === 0);
    const ys = numbers.filter((_, index) => index % 2 === 1);
    // Three advances of 5px from x = 10, no wider; the glyphs stand on the baseline.
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(10);
    expect(Math.max(...xs)).toBeLessThanOrEqual(10 + 3 * 5);
    expect(Math.max(...ys)).toBe(20);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(20 - element.fontSize);
  });
});

describe('syntheticBoldWidth', () => {
  it('T-1050: is 1/24 of the size up to 9px and 1/32 from 36px, as browsers embolden', () => {
    expect(syntheticBoldWidth(6)).toBeCloseTo(6 / 24);
    expect(syntheticBoldWidth(9)).toBeCloseTo(9 / 24);
    expect(syntheticBoldWidth(48)).toBeCloseTo(48 / 32);
    expect(syntheticBoldWidth(13)).toBeGreaterThan(13 / 32);
    expect(syntheticBoldWidth(13)).toBeLessThan(13 / 24);
  });
});

describe('toSvg with outlines', () => {
  const scene = (elements: Scene['elements']): Scene => ({
    width: 100,
    height: 40,
    paper: '#ffffff',
    fontFamily: 'AriadneNSD Mono',
    elements,
  });

  it('T-1051: writes text as paths, the halo first and bold with a stroke', () => {
    const element = text({
      runs: [
        { text: 'a', weight: 400 },
        { text: 'b', weight: 600 },
      ],
      halo: { color: '#ffffff', width: 2 },
    });
    const { content } = toSvg(scene([element]), { outlines });
    expect(content).not.toContain('<text');
    const paths = content.split('\n').filter((line) => line.startsWith('<path'));
    expect(paths).toHaveLength(4);
    expect(paths[0]).toContain('fill="none" stroke="#ffffff" stroke-width="4"');
    expect(paths[1]).toContain('fill="none" stroke="#ffffff"');
    expect(paths[2]).toContain('fill="#151a22"/>');
    expect(paths[3]).toContain('fill="#151a22" stroke="#151a22"');
  });

  it('T-1052: keeps the syntax colors of the runs, one path per color (02-layout 3.1)', () => {
    const element = text({
      runs: [
        { text: 'a', weight: 400, fill: '#1f45d6' },
        { text: 'b', weight: 400 },
        { text: 'a', weight: 400, fill: '#1f45d6' },
      ],
    });
    expect(placeGlyphs(element, outlines)?.map((glyph) => glyph.fill)).toEqual([
      '#1f45d6',
      '#151a22',
      '#1f45d6',
    ]);
    const paths = toSvg(scene([element]), { outlines })
      .content.split('\n')
      .filter((line) => line.startsWith('<path'));
    expect(paths).toHaveLength(2);
    expect(paths[0]).toMatch(/^<path d="M10 20.*M20 20.*" fill="#1f45d6"\/>$/);
    expect(paths[1]).toMatch(/^<path d="M15 20[^M]*" fill="#151a22"\/>$/);
  });

  it('T-1053: keeps as text an element with a character the font lacks, and only that one', () => {
    const lacking = text({ runs: [{ text: 'a?', weight: 400 }] });
    const { content } = toSvg(scene([text(), lacking]), { outlines });
    expect(content.match(/<text/g)).toHaveLength(1);
    expect(content).toContain('>a?</text>');
    expect(usedCodePoints(scene([text(), lacking]), outlines)).toEqual([0x3f, 0x61]);
  });

  it('T-1054: writes the same text without outlines', () => {
    expect(toSvg(scene([text()])).content).toContain('>ab</text>');
    expect(usedCodePoints(scene([text()]))).toEqual([0x61, 0x62]);
  });
});
