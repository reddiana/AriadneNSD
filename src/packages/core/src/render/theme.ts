// Design tokens from visual design 3 (docs/02-ux-design/04-visual-design.md).
// Code uses semantic and component tokens only; primitives are the palette they point to (3.1).
import type { ThemeId } from '../model/types';

/** The primitive palette (visual design 3.2). Colors with no meaning of their own. */
const palette = {
  'ink.900': '#151a22',
  'ink.700': '#343b48',
  'ink.600': '#4b5567',
  'ink.550': '#555e70',
  'ink.500': '#5a6476',
  'slate.500': '#5b77ad',
  'blue.700': '#1f45d6',
  'blue.600': '#2c55c9',
  'blue.500': '#4f74d6',
  'violet.500': '#7a5fb8',
  'green.700': '#22702a',
  'amber.800': '#8a5a00',
  'fill.paper': '#ffffff',
  'fill.snow': '#fbfcfe',
  'fill.slate': '#edf0f5',
  'fill.sand': '#f6ebdc',
  'fill.mint': '#e2efdf',
  'fill.lilac': '#ebe7f4',
  'fill.sky': '#dce6f6',
  'fill.ice': '#e6ecfb',
  'fill.lilac-strong': '#ddd4ef',
} as const;

type PaletteToken = keyof typeof palette;

/** The semantic and component color tokens of the document layer (visual design 3.3). */
export type ColorToken =
  | 'paper'
  | 'block.process'
  | 'block.branch'
  | 'block.loop'
  | 'block.event'
  | 'block.call'
  | 'block.folded'
  | 'line.structure'
  | 'text.primary'
  | 'text.secondary'
  | 'text.muted'
  | 'syntax.keyword'
  | 'syntax.comment'
  | 'syntax.literal'
  | 'fold.edge'
  | 'fold.band'
  | 'fold.name'
  | 'peek.edge'
  | 'peek.fill'
  | 'peek.halo'
  | 'peek.band'
  | 'peek.text';

/** A theme: the color of every token. Themes change colors only, never geometry (principle 6). */
export type Theme = {
  readonly id: ThemeId;
  readonly colors: Readonly<Record<ColorToken, string>>;
};

const lightDefault: Readonly<Record<ColorToken, PaletteToken>> = {
  paper: 'fill.paper',
  'block.process': 'fill.slate',
  'block.branch': 'fill.sand',
  'block.loop': 'fill.sky',
  'block.event': 'fill.mint',
  'block.call': 'fill.lilac',
  'block.folded': 'fill.snow',
  'line.structure': 'slate.500',
  'text.primary': 'ink.900',
  'text.secondary': 'ink.600',
  'text.muted': 'ink.500',
  'syntax.keyword': 'blue.700',
  'syntax.comment': 'green.700',
  'syntax.literal': 'amber.800',
  'fold.edge': 'blue.500',
  'fold.band': 'fill.ice',
  'fold.name': 'blue.600',
  'peek.edge': 'violet.500',
  'peek.fill': 'fill.paper',
  'peek.halo': 'fill.paper',
  'peek.band': 'fill.lilac-strong',
  'peek.text': 'ink.550',
};

function resolve(mapping: Readonly<Record<ColorToken, PaletteToken>>): Record<ColorToken, string> {
  const colors = {} as Record<ColorToken, string>;
  for (const token of Object.keys(mapping) as ColorToken[]) {
    colors[token] = palette[mapping[token]];
  }
  return colors;
}

/** The light default theme (visual design 3.3). File format v1 uses only this one. */
export const defaultTheme: Theme = { id: 'default', colors: resolve(lightDefault) };

const themes: ReadonlyMap<ThemeId, Theme> = new Map([[defaultTheme.id, defaultTheme]]);

/**
 * Returns the theme for a theme id. Unknown ids fall back to the default theme; choosing a theme
 * comes after the MVP (visual design 12).
 */
export function themeFor(id: ThemeId): Theme {
  return themes.get(id) ?? defaultTheme;
}
