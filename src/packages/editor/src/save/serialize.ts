// The saved file (03-editor 6, 01-file-format 2): the drawing as shown, the model inside, and a
// subset of the block font holding only the characters used (ADR-0026, ADR-0039). With the
// document setting "text as outlines" (R-FMT-10) the text is drawn with the font's outlines.
import type { Doc, EmbeddedFont, KeptSettings, Rendering, SavedDrawing } from '@ariadne-nsd/core';
import {
  assembleImageSvg,
  assembleSvgFile,
  savedDrawing,
  serializeModelJson,
} from '@ariadne-nsd/core';
import type { GlyphOutlines, Subsetter } from '@ariadne-nsd/fonts';
import { blockFont } from '@ariadne-nsd/fonts';

import type { SaveFonts } from '../contracts';

/** One document at one moment: what saving writes. */
export type SaveSource = {
  readonly doc: Doc;
  readonly kept: KeptSettings;
  readonly rendering: Rendering;
};

/** The loaded fonts: the subsetter and the TTF, and the TTF's outlines once they are read. */
type Fonts = Awaited<ReturnType<SaveFonts>>;

/**
 * Loads the subsetter and the font once and keeps them. A failed load is not kept, so the next
 * save tries again.
 */
export function cachedFonts(load: SaveFonts): SaveFonts {
  let loading: ReturnType<SaveFonts> | null = null;
  return async () => {
    loading ??= load();
    try {
      return await loading;
    } catch (error) {
      loading = null;
      throw error;
    }
  };
}

/** The outlines of each TTF, read once (the reader is loaded only when outlines are used). */
const outlinesByFont = new WeakMap<Uint8Array, GlyphOutlines>();

/** The glyph outlines of the bundled font. The reader is loaded on first use (bundle size). */
export async function outlinesOf(ttf: Uint8Array): Promise<GlyphOutlines> {
  let outlines = outlinesByFont.get(ttf);
  if (outlines === undefined) {
    const { readGlyphOutlines } = await import('./glyph-outlines');
    outlines = readGlyphOutlines(ttf);
    outlinesByFont.set(ttf, outlines);
  }
  return outlines;
}

/** The drawing to write and the subset font for the text that stays text. */
async function drawingAndFonts(
  source: SaveSource,
  fonts: Fonts,
): Promise<{ readonly drawn: SavedDrawing; readonly embedded: ReadonlyArray<EmbeddedFont> }> {
  const isOutlined = source.doc.content.settings.textOutlines === true;
  const drawn = savedDrawing(source.rendering, isOutlined ? await outlinesOf(fonts.ttf) : null);
  // With every character as outlines no font is left to embed; otherwise always the subset.
  const embedded =
    isOutlined && drawn.codePoints.length === 0
      ? []
      : [subsetFont(fonts.subsetter, fonts.ttf, drawn.codePoints)];
  return { drawn, embedded };
}

function subsetFont(
  subsetter: Subsetter,
  ttf: Uint8Array,
  codePoints: ReadonlyArray<number>,
): EmbeddedFont {
  return { family: blockFont.familyName, woff: subsetter.subsetToWoff(ttf, codePoints) };
}

/** The `.ns.svg` text of a document. The same document always gives the same text (R-FMT-03). */
export async function serializeDocument(source: SaveSource, fonts: SaveFonts): Promise<string> {
  const { drawn, embedded } = await drawingAndFonts(source, await fonts());
  return assembleSvgFile({
    doc: source.doc,
    kept: source.kept,
    drawing: drawn.svg,
    fonts: embedded,
  });
}

/**
 * The pure SVG of a document (R-EXP-02): the same drawing and font as the saved file, without
 * the model, so it opens as a picture anywhere and not as a document.
 */
export async function serializeImage(source: SaveSource, fonts: SaveFonts): Promise<string> {
  const { drawn, embedded } = await drawingAndFonts(source, await fonts());
  return assembleImageSvg(drawn.svg, embedded);
}

/** The model JSON of a document: the local backup (03-editor 6.3). No font, so it is light. */
export function snapshotDocument(source: Pick<SaveSource, 'doc' | 'kept'>): string {
  return serializeModelJson(source.doc, source.kept);
}
