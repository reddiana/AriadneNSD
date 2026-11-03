// The picture of an example for the examples modal (R-EDIT-25): its drawing with the header shape
// "제목처럼" and the subset of the block font it uses, as one SVG image without the model. A shell
// can make these ahead of time and show them as images, so the modal does not lay out ten
// examples while the page starts (the web app does: apps/web/scripts/example-thumbnails).

import type { Locale } from '@ariadne-nsd/core';
import { assembleImageSvg, renderDoc } from '@ariadne-nsd/core';
import { blockFont } from '@ariadne-nsd/fonts';

import type { ExampleInfo } from './examples';

/** Cuts the block font down to the code points (a WOFF), as the subsetter does. */
export type SubsetToWoff = (codePoints: ReadonlyArray<number>) => Uint8Array;

/** The example's picture as SVG text. The same example, locale and font give the same text. */
export function exampleThumbnailSvg(
  example: ExampleInfo,
  locale: Locale,
  subsetToWoff: SubsetToWoff,
): string {
  const rendering = renderDoc(example.build('title'), { locale });
  return assembleImageSvg(rendering.svg, [
    { family: blockFont.familyName, woff: subsetToWoff(rendering.codePoints) },
  ]);
}
