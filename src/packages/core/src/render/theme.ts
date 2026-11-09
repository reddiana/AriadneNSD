// Design tokens from visual design 3 (docs/02-ux-design/04-visual-design.md).
// Code uses semantic and component tokens only; primitives are the palette they point to (3.1).
// The themes (visual design 8, R-LAY-08, R-NFR-07) map the same tokens to other primitives.
import type { ThemeId } from '../model/types';

/** The primitive palette (visual design 3.2). Colors with no meaning of their own. */
const palette = {
  // Light: the light default theme and the edges of the others.
  'ink.900': '#151a22',
  'ink.700': '#343b48',
  'ink.600': '#4b5567',
  'ink.550': '#555e70',
  'ink.500': '#5a6476',
  'slate.500': '#5b77ad',
  'blue.700': '#1f45d6',
  'blue.600': '#2c55c9',
  'blue.500': '#4f74d6',
  // The edit layer on light paper (visual design 3.4): the selection and the error.
  'orange.600': '#d0500b',
  'red.700': '#b42318',
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
  // Dark: the dark default theme (visual design 3.5).
  'ink.50': '#e6e9ef',
  'ink.200': '#b4bccb',
  'ink.250': '#b0b8c6',
  'ink.300': '#a3acbc',
  'slate.300': '#7d93c4',
  'blue.200': '#a9c0ff',
  'blue.300': '#9db8ff',
  'blue.400': '#7f9cf0',
  'violet.300': '#a58be0',
  'green.300': '#82c98a',
  'amber.300': '#e3b862',
  'night.paper': '#171a21',
  'night.snow': '#1c2029',
  'night.slate': '#232833',
  'night.sand': '#3a3226',
  'night.mint': '#213328',
  'night.lilac': '#2c2840',
  'night.sky': '#22304a',
  'night.ice': '#1f2a45',
  'night.lilac-strong': '#3a3158',
  // High contrast (visual design 3.6) and black and white print (9.3).
  black: '#000000',
  white: '#ffffff',
  'gray.100': '#f0f0f0',
  'gray.150': '#dcdcdc',
  'gray.200': '#d6d6d6',
  'gray.700': '#404040',
  'sky.200': '#9fd0ff',
  'sky.300': '#6cb6ff',
  'cyan.200': '#8fd0ff',
  'violet.200': '#d2a8ff',
  'green.200': '#7ee08a',
  'yellow.300': '#ffd84d',
  'deep.snow': '#0f0f0f',
  'deep.sand': '#1f1a00',
  'deep.mint': '#002208',
  'deep.lilac': '#1c0d33',
  'deep.sky': '#00183d',
  'deep.lilac-strong': '#2a1747',
} as const;

/** A primitive color token (visual design 3.2), such as `ink.900`. */
export type PaletteToken = keyof typeof palette;

/**
 * The primitive palette (visual design 3.2), for the layers that are not a theme: the edit layer
 * picks its colors from it by the kind of paper (editor overlay). Documents use `Theme` instead.
 */
export const primitiveColors: Readonly<Record<PaletteToken, string>> = palette;

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

/**
 * Whether a theme's paper is light or dark (visual design 8). The edit layer picks its colors by
 * it, so the selection stands out on every paper (editor overlay).
 */
export type ThemeKind = 'light' | 'dark';

/** A theme: the color of every token. Themes change colors only, never geometry (principle 6). */
export type Theme = {
  readonly id: ThemeId;
  readonly kind: ThemeKind;
  readonly colors: Readonly<Record<ColorToken, string>>;
};

type Mapping = Readonly<Record<ColorToken, PaletteToken>>;

/** The light default theme (visual design 3.3). */
const light: Mapping = {
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

/** The dark default theme (visual design 3.5): the same hues on dark paper, AA kept. */
const dark: Mapping = {
  paper: 'night.paper',
  'block.process': 'night.slate',
  'block.branch': 'night.sand',
  'block.loop': 'night.sky',
  'block.event': 'night.mint',
  'block.call': 'night.lilac',
  'block.folded': 'night.snow',
  'line.structure': 'slate.300',
  'text.primary': 'ink.50',
  'text.secondary': 'ink.200',
  'text.muted': 'ink.300',
  'syntax.keyword': 'blue.300',
  'syntax.comment': 'green.300',
  'syntax.literal': 'amber.300',
  'fold.edge': 'blue.400',
  'fold.band': 'night.ice',
  'fold.name': 'blue.200',
  'peek.edge': 'violet.300',
  'peek.fill': 'night.paper',
  'peek.halo': 'night.paper',
  'peek.band': 'night.lilac-strong',
  'peek.text': 'ink.250',
};

/** The high contrast theme (visual design 3.6, R-NFR-07): 7:1 for texts and lines. */
const highContrast: Mapping = {
  paper: 'black',
  'block.process': 'black',
  'block.branch': 'deep.sand',
  'block.loop': 'deep.sky',
  'block.event': 'deep.mint',
  'block.call': 'deep.lilac',
  'block.folded': 'deep.snow',
  'line.structure': 'white',
  'text.primary': 'white',
  'text.secondary': 'gray.100',
  'text.muted': 'gray.200',
  'syntax.keyword': 'cyan.200',
  'syntax.comment': 'green.200',
  'syntax.literal': 'yellow.300',
  'fold.edge': 'sky.300',
  'fold.band': 'deep.sky',
  'fold.name': 'sky.200',
  'peek.edge': 'violet.200',
  'peek.fill': 'black',
  'peek.halo': 'black',
  'peek.band': 'deep.lilac-strong',
  'peek.text': 'gray.150',
};

/**
 * Black and white print (visual design 9.3): every background white, lines and texts black,
 * no syntax colors. Dotted lines and border widths stay, so the meaning stays (principle 2).
 */
const print: Mapping = {
  paper: 'white',
  'block.process': 'white',
  'block.branch': 'white',
  'block.loop': 'white',
  'block.event': 'white',
  'block.call': 'white',
  'block.folded': 'white',
  'line.structure': 'black',
  'text.primary': 'black',
  'text.secondary': 'black',
  'text.muted': 'black',
  'syntax.keyword': 'black',
  'syntax.comment': 'black',
  'syntax.literal': 'black',
  'fold.edge': 'black',
  'fold.band': 'white',
  'fold.name': 'black',
  'peek.edge': 'black',
  'peek.fill': 'white',
  'peek.halo': 'white',
  'peek.band': 'white',
  'peek.text': 'gray.700',
};

function theme(id: ThemeId, kind: ThemeKind, mapping: Mapping): Theme {
  const colors = {} as Record<ColorToken, string>;
  for (const token of Object.keys(mapping) as ColorToken[]) {
    colors[token] = palette[mapping[token]];
  }
  return { id, kind, colors };
}

/** The light default theme (visual design 3.3). New documents start with it. */
export const defaultTheme: Theme = theme('default', 'light', light);

/** Every theme, in the order the document settings list them (visual design 8). */
export const themes: ReadonlyArray<Theme> = [
  defaultTheme,
  theme('dark', 'dark', dark),
  theme('high-contrast', 'dark', highContrast),
  theme('print', 'light', print),
];

/** The names of the themes, in the order of `themes`. */
export const themeIds: ReadonlyArray<ThemeId> = themes.map((t) => t.id);

/** Whether a theme name is one of the themes (an unknown name is kept but drawn as default). */
export function isKnownTheme(id: ThemeId): boolean {
  return themes.some((t) => t.id === id);
}

/**
 * Returns the theme for a theme name. Unknown names fall back to the default theme; the name is
 * kept in the file as it is (01-file-format 3.3, ADR-0044).
 */
export function themeFor(id: ThemeId): Theme {
  return themes.find((t) => t.id === id) ?? defaultTheme;
}
