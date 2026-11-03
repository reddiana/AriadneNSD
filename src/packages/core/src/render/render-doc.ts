// The whole rendering pipeline in one call (02-layout, rendering pipeline).
import type { GlyphOutlines } from '@ariadne-nsd/fonts';

import { layout } from '../layout/layout';
import type { LayoutResult } from '../layout/types';
import type { Doc } from '../model/types';
import { buildScene } from './build-scene';
import type { Scene } from './scene';
import { themeFor } from './theme';
import type { RenderedSvg } from './to-svg';
import { toSvg } from './to-svg';
import { usedCodePoints } from './used-code-points';

/** Everything one rendering produces. */
export type Rendering = {
  /** For hit testing and the overlay layer (03-editor 3.1). */
  readonly layout: LayoutResult;
  readonly scene: Scene;
  /** The drawing part of the SVG, the same for the screen and the saved file (ADR-0030). */
  readonly svg: RenderedSvg;
  /** The code points the subset font must contain (R-FMT-07). */
  readonly codePoints: ReadonlyArray<number>;
};

/**
 * Lays out and draws a document with the theme of its settings: layout → buildScene → toSvg.
 * The fixed words are in the document's drawing language `settings.locale` (ADR-0041), and block
 * text is highlighted in the language `settings.textKind` (R-LAY-07).
 */
export function renderDoc(doc: Doc): Rendering {
  const result = layout(doc);
  const { settings } = doc.content;
  const scene = buildScene(result, themeFor(settings.theme), settings.textKind);
  return { layout: result, scene, svg: toSvg(scene), codePoints: usedCodePoints(scene) };
}

/** The drawing part of a saved file and the code points its subset font must hold. */
export type SavedDrawing = {
  readonly svg: RenderedSvg;
  readonly codePoints: ReadonlyArray<number>;
};

/**
 * What a saved file draws (ADR-0018): the rendering as shown, or with `outlines` its text as the
 * bundled font's outlines (R-FMT-10, the document setting `textOutlines`). Then the subset font
 * holds only the characters of text that stays text (characters the font lacks).
 */
export function savedDrawing(rendering: Rendering, outlines: GlyphOutlines | null): SavedDrawing {
  return outlines === null
    ? { svg: rendering.svg, codePoints: rendering.codePoints }
    : {
        svg: toSvg(rendering.scene, { outlines }),
        codePoints: usedCodePoints(rendering.scene, outlines),
      };
}
