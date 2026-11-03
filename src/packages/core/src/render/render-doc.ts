// The whole rendering pipeline in one call (02-layout, rendering pipeline).
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
 * The fixed words are in the document's drawing language `settings.locale` (ADR-0041).
 */
export function renderDoc(doc: Doc): Rendering {
  const result = layout(doc);
  const scene = buildScene(result, themeFor(doc.content.settings.theme));
  return { layout: result, scene, svg: toSvg(scene), codePoints: usedCodePoints(scene) };
}
