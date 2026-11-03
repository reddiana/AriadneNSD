// The characters a drawing uses: what the per-document subset font must contain (R-FMT-07, ADR-0026).
import type { GlyphOutlines } from '@ariadne-nsd/fonts';

import { placeGlyphs } from './outline-text';
import type { Scene } from './scene';

/**
 * Returns the code points of all text in a scene, sorted ascending and without repeats.
 * Fixed words such as branch labels are included, in the locale they were drawn in.
 * With `outlines` (text as outlines, R-FMT-10), only the text that stays text counts: the text
 * elements with a character the font lacks.
 */
export function usedCodePoints(scene: Scene, outlines?: GlyphOutlines): ReadonlyArray<number> {
  const codePoints = new Set<number>();
  for (const element of scene.elements) {
    if (element.kind !== 'text') {
      continue;
    }
    if (outlines !== undefined && placeGlyphs(element, outlines) !== null) {
      continue;
    }
    for (const run of element.runs) {
      for (const character of run.text) {
        const codePoint = character.codePointAt(0);
        if (codePoint !== undefined) {
          codePoints.add(codePoint);
        }
      }
    }
  }
  return [...codePoints].sort((a, b) => a - b);
}
