// Text as outlines (R-FMT-10, R-EXP-03): a text element of the scene drawn with the bundled
// font's glyph outlines instead of a font. Glyphs sit side by side by their advances, with no
// kerning and no shaping, exactly as the layout measured them (02-layout 2.1, ADR-0026).
import type { Glyph, GlyphCommand, GlyphOutlines } from '@ariadne-nsd/fonts';

import type { SceneElement } from './scene';

/** A text element of the scene. */
export type TextElement = Extract<SceneElement, { kind: 'text' }>;

/**
 * How far a slanted glyph leans: font units to the right per font unit above the baseline. The
 * bundled font has no italic face (ADR-0034), so the screen shows italics as the browser's
 * synthetic oblique; 1/4 (about 14 degrees) is the skew browsers use for it (UX SL1). An exact
 * binary fraction, so the coordinates are the same on every engine (R-FMT-03).
 */
const italicShear = 0.25;

/** One glyph put in place: drawing coordinates of its origin (on the baseline) and its scale. */
export type PlacedGlyph = {
  readonly glyph: Glyph;
  /** The origin of the glyph, in drawing px. */
  readonly x: number;
  readonly y: number;
  /** Drawing px per font unit: `fontSize / unitsPerEm`. */
  readonly scale: number;
  readonly weight: 400 | 600;
  /** Its run is slanted: the outline leans about the baseline, the advance stays (UX SL1). */
  readonly isItalic: boolean;
  /** The color of its run: a syntax color (02-layout 3.1), or the element's. */
  readonly fill: string;
};

/**
 * The glyphs of a text element, in place. When the font lacks one of its characters, that
 * character is `missing`, or without it the result is `null`: then the element stays text,
 * drawn by a fallback font (02-layout 2.1).
 */
export function placeGlyphs(
  element: TextElement,
  outlines: GlyphOutlines,
  missing?: Glyph,
): ReadonlyArray<PlacedGlyph> | null {
  const scale = element.fontSize / outlines.unitsPerEm;
  const glyphs: Omit<PlacedGlyph, 'x' | 'y' | 'scale'>[] = [];
  for (const run of element.runs) {
    for (const character of run.text) {
      const glyph = outlines.glyphOf(character.codePointAt(0) ?? 0) ?? missing ?? null;
      if (glyph === null) {
        return null;
      }
      glyphs.push({
        glyph,
        weight: run.weight,
        isItalic: run.isItalic === true,
        fill: run.fill ?? element.fill,
      });
    }
  }
  const width = glyphs.reduce((sum, { glyph }) => sum + glyph.advance, 0) * scale;
  let x =
    element.anchor === 'start'
      ? element.x
      : element.anchor === 'middle'
        ? element.x - width / 2
        : element.x - width;
  return glyphs.map((unplaced) => {
    const placed = { ...unplaced, x, y: element.y, scale };
    x += unplaced.glyph.advance * scale;
    return placed;
  });
}

/**
 * A glyph's outline leaning about the baseline, in font units (y up): points on the baseline stay,
 * so the text keeps its place and width.
 */
export function slantedCommands(
  commands: ReadonlyArray<GlyphCommand>,
): ReadonlyArray<GlyphCommand> {
  const lean = (x: number, y: number): number => x + y * italicShear;
  return commands.map((command) => {
    switch (command.kind) {
      case 'move':
      case 'line':
        return { ...command, x: lean(command.x, command.y) };
      case 'quad':
        return {
          ...command,
          cx: lean(command.cx, command.cy),
          x: lean(command.x, command.y),
        };
      case 'close':
        return command;
    }
  });
}

/**
 * The stroke width that makes a regular glyph look bold, as browsers do when a font has no bold
 * face (synthetic bold: 1/24 of the size at 9px down to 1/32 at 36px). The bundled font is
 * regular only (ADR-0034), so the screen shows bold text this way too.
 */
export function syntheticBoldWidth(fontSize: number): number {
  const t = Math.min(1, Math.max(0, (fontSize - 9) / (36 - 9)));
  return fontSize * (1 / 24 + t * (1 / 32 - 1 / 24));
}

/**
 * The path data of placed glyphs in drawing coordinates (y down), numbers through `format`.
 * Glyphs without an outline (a space) add nothing, slanted ones lean. `''` if nothing is drawn.
 */
export function glyphPathData(
  glyphs: ReadonlyArray<PlacedGlyph>,
  format: (value: number) => string,
): string {
  const parts: string[] = [];
  for (const { glyph, x, y, scale, isItalic } of glyphs) {
    const point = (gx: number, gy: number): string =>
      `${format(x + gx * scale)} ${format(y - gy * scale)}`;
    for (const command of isItalic ? slantedCommands(glyph.commands) : glyph.commands) {
      switch (command.kind) {
        case 'move':
          parts.push(`M${point(command.x, command.y)}`);
          break;
        case 'line':
          parts.push(`L${point(command.x, command.y)}`);
          break;
        case 'quad':
          parts.push(`Q${point(command.cx, command.cy)} ${point(command.x, command.y)}`);
          break;
        case 'close':
          parts.push('Z');
          break;
      }
    }
  }
  return parts.join('');
}
