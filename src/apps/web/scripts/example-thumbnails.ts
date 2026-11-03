// The examples' thumbnails, made ahead of time (R-EDIT-25, QA-18): the examples modal shows these
// images instead of laying out ten examples while the page starts. One per example and screen
// language, in src/examples/thumbnails. Each is drawn as SVG (the renderer, with a subset of the
// block font inside), then turned into a WebP picture by Chromium: the browser decodes a picture
// off the main thread, but lays out and draws an SVG's text on it (a first visit on a slow phone
// waited about 1.5 s more for ten SVGs). `sources.json` keeps a hash of each SVG, so
// `example-thumbnails.test.ts` sees without a browser when a picture no longer matches the
// examples or the renderer; then run `pnpm --filter @ariadne-nsd/web thumbnails`.
import { createHash } from 'node:crypto';

import type { Locale } from '@ariadne-nsd/core';
import { examples, exampleThumbnailSvg } from '@ariadne-nsd/editor';
import { blockFont } from '@ariadne-nsd/fonts';
import { createNodeSubsetter, readFontFile } from '@ariadne-nsd/fonts/node';

export const thumbnailDir = new URL('../src/examples/thumbnails/', import.meta.url);

/** The file that maps each picture to the hash of the SVG it was made from. */
export const sourcesFile = 'sources.json';

/**
 * The largest picture, in pixels: the modal's thumbnail box (16 : 9) is about 205 × 115 CSS
 * pixels on a laptop, so this is twice that. Pictures keep the diagram's proportions inside it.
 */
export const pictureBox = { width: 440, height: 248 } as const;

/** WebP quality (0 ~ 1). At 0.9 the ten pictures of a language take about 84 KB, like the SVGs. */
export const pictureQuality = 0.9;

const locales: ReadonlyArray<Locale> = ['en', 'ko'];

/** The SVG each picture is made from: picture file name → SVG text. */
export async function thumbnailSources(): Promise<Map<string, string>> {
  const subsetter = await createNodeSubsetter();
  const ttf = await readFontFile(blockFont.files.ttf);
  const files = new Map<string, string>();
  for (const example of examples) {
    for (const locale of locales) {
      files.set(
        `${example.id}.${locale}.webp`,
        exampleThumbnailSvg(example, locale, (codePoints) =>
          subsetter.subsetToWoff(ttf, codePoints),
        ),
      );
    }
  }
  return files;
}

/** The hash `sources.json` keeps for an SVG. */
export function sourceHash(svg: string): string {
  return createHash('sha256').update(svg).digest('hex');
}
