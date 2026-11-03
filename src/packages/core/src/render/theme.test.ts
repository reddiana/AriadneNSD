// Contrast of the themes (visual design 3.3, 8 and 10.1, QA-16): every text and every
// line with a meaning stands out from what it is drawn on (WCAG 2.2: text 4.5:1, lines 3:1).
import { describe, expect, it } from 'vitest';

import type { ColorToken, Theme } from './theme';
import { defaultTheme, isKnownTheme, themeFor, themeIds, themes } from './theme';

/** WCAG 2.2 relative luminance of a `#rrggbb` color. */
function luminance(hex: string): number {
  const channel = (offset: number): number => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** WCAG 2.2 contrast ratio of two `#rrggbb` colors, from 1 to 21. */
function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

/** The paper and the block backgrounds: what the block texts and lines are drawn on. */
const blockBackgrounds: ReadonlyArray<ColorToken> = [
  'paper',
  'block.process',
  'block.branch',
  'block.loop',
  'block.event',
  'block.call',
  'block.folded',
];

const textOnBlocks: ReadonlyArray<ColorToken> = [
  'text.primary',
  'text.secondary',
  'text.muted',
  'syntax.keyword',
  'syntax.comment',
  'syntax.literal',
  'peek.text',
];

const linesOnBlocks: ReadonlyArray<ColorToken> = ['line.structure', 'fold.edge', 'peek.edge'];

/** Pairs off the block backgrounds (visual design 3.3: the fold's band and the peek's band). */
const otherPairs: ReadonlyArray<{
  readonly fore: ColorToken;
  readonly back: ColorToken;
  readonly min: number;
}> = [
  { fore: 'fold.name', back: 'fold.band', min: 4.5 },
  { fore: 'peek.text', back: 'peek.band', min: 4.5 },
];

describe('the light default theme (visual design 3.3)', () => {
  const colors = defaultTheme.colors;

  it('T-0536 · QA-16 · R-NFR-05: block texts have 4.5:1 on the paper and every block background', () => {
    for (const fore of textOnBlocks) {
      for (const back of blockBackgrounds) {
        expect(contrast(colors[fore], colors[back]), `${fore} on ${back}`).toBeGreaterThanOrEqual(
          4.5,
        );
      }
    }
  });

  it('T-0537 · QA-16 · R-NFR-05: lines with a meaning have 3:1 on the paper and every block background', () => {
    for (const fore of linesOnBlocks) {
      for (const back of blockBackgrounds) {
        expect(contrast(colors[fore], colors[back]), `${fore} on ${back}`).toBeGreaterThanOrEqual(
          3,
        );
      }
    }
  });

  it('T-0538 · QA-16 · R-NFR-05: texts on the fold and peek bands have 4.5:1', () => {
    for (const { fore, back, min } of otherPairs) {
      expect(contrast(colors[fore], colors[back]), `${fore} on ${back}`).toBeGreaterThanOrEqual(
        min,
      );
    }
  });

  it('T-0539: computes the WCAG ratio of the table (text.primary on paper 17.46)', () => {
    expect(contrast(colors['text.primary'], colors.paper)).toBeCloseTo(17.46, 1);
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
  });
});

/** The least contrast each theme keeps: AA for all (4.5:1 text, 3:1 lines), 7:1 for high contrast. */
function minimums(theme: Theme): { readonly text: number; readonly line: number } {
  return theme.id === 'high-contrast' ? { text: 7, line: 7 } : { text: 4.5, line: 3 };
}

describe('every theme (visual design 8, R-LAY-08, R-NFR-07)', () => {
  it('T-0980 · R-LAY-08: has the light, dark, high contrast and print themes, light first', () => {
    expect(themeIds).toEqual(['default', 'dark', 'high-contrast', 'print']);
    expect(themes[0]).toBe(defaultTheme);
  });

  it('T-0981: draws an unknown theme name with the default theme', () => {
    expect(themeFor('midnight')).toBe(defaultTheme);
    expect(isKnownTheme('midnight')).toBe(false);
    expect(themeFor('dark').id).toBe('dark');
    expect(isKnownTheme('print')).toBe(true);
  });

  for (const theme of themes) {
    const colors = theme.colors;
    const least = minimums(theme);

    it(`T-0982: ${theme.id}: every token is a #rrggbb color and the kind matches the paper`, () => {
      for (const [token, value] of Object.entries(colors)) {
        expect(value, token).toMatch(/^#[0-9a-f]{6}$/);
      }
      expect(Object.keys(colors).sort()).toEqual(Object.keys(defaultTheme.colors).sort());
      expect(luminance(colors.paper) > 0.5 ? 'light' : 'dark').toBe(theme.kind);
    });

    it(`T-0983 · QA-16 · R-LAY-08 · R-NFR-07: ${theme.id}: block texts stand out from the paper and every block background`, () => {
      for (const fore of textOnBlocks) {
        for (const back of blockBackgrounds) {
          expect(contrast(colors[fore], colors[back]), `${fore} on ${back}`).toBeGreaterThanOrEqual(
            least.text,
          );
        }
      }
    });

    it(`T-0984 · QA-16 · R-LAY-08 · R-NFR-07: ${theme.id}: lines with a meaning stand out from the paper and every block background`, () => {
      for (const fore of linesOnBlocks) {
        for (const back of blockBackgrounds) {
          expect(contrast(colors[fore], colors[back]), `${fore} on ${back}`).toBeGreaterThanOrEqual(
            least.line,
          );
        }
      }
    });

    it(`T-0985 · QA-16 · R-LAY-08 · R-NFR-07: ${theme.id}: texts on the fold and peek bands stand out`, () => {
      for (const { fore, back } of otherPairs) {
        expect(contrast(colors[fore], colors[back]), `${fore} on ${back}`).toBeGreaterThanOrEqual(
          least.text,
        );
      }
    });
  }

  it('T-0986: print has white backgrounds, black lines and texts, and no syntax colors', () => {
    const colors = themeFor('print').colors;
    for (const back of blockBackgrounds) {
      expect(colors[back], back).toBe('#ffffff');
    }
    for (const fore of ['line.structure', 'text.primary', 'fold.edge', 'peek.edge'] as const) {
      expect(colors[fore], fore).toBe('#000000');
    }
    expect(colors['syntax.keyword']).toBe(colors['text.primary']);
    expect(contrast(colors['peek.text'], colors.paper)).toBeCloseTo(10.4, 1);
  });
});
