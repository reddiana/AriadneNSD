// Loaded when the user exports a PDF (R-EXP-03): the page cutter, the PDF writer and the glyph
// reader stay out of the first download (06-web 5).
import type { Rendering } from '@ariadne-nsd/core';
import { paginate, paperForLanguage } from '@ariadne-nsd/core';
import { writePdf } from '@ariadne-nsd/core/pdf';
import { readGlyphOutlines } from '@ariadne-nsd/fonts';

/** The PDF of a rendering: its pages on the paper of the browser's language. */
export function makePdf(
  rendering: Rendering,
  ttf: Uint8Array,
  options: { readonly title: string; readonly languageTag: string },
): Uint8Array<ArrayBuffer> {
  const pagination = paginate(rendering.layout, paperForLanguage(options.languageTag));
  return writePdf(rendering.scene, pagination, readGlyphOutlines(ttf), { title: options.title });
}
