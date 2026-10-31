// The saved file (03-editor 6, 01-file-format 2): the drawing as shown, the model inside, and a
// subset of the block font holding only the characters used (ADR-0026, ADR-0039).
import type { Doc, KeptSettings, Rendering } from '@ariadne-nsd/core';
import { assembleSvgFile, serializeModelJson } from '@ariadne-nsd/core';
import { blockFont } from '@ariadne-nsd/fonts';

import type { SaveFonts } from '../contracts';

/** One document at one moment: what saving writes. */
export type SaveSource = {
  readonly doc: Doc;
  readonly kept: KeptSettings;
  readonly rendering: Rendering;
};

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

/** The `.ns.svg` text of a document. The same document always gives the same text (R-FMT-03). */
export async function serializeDocument(source: SaveSource, fonts: SaveFonts): Promise<string> {
  const { subsetter, ttf } = await fonts();
  const woff = subsetter.subsetToWoff(ttf, source.rendering.codePoints);
  return assembleSvgFile({
    doc: source.doc,
    kept: source.kept,
    drawing: source.rendering.svg,
    fonts: [{ family: blockFont.familyName, woff }],
  });
}

/** The model JSON of a document: the local backup (03-editor 6.3). No font, so it is light. */
export function snapshotDocument(source: Pick<SaveSource, 'doc' | 'kept'>): string {
  return serializeModelJson(source.doc, source.kept);
}
