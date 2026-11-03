// The examples' thumbnails, made ahead of time (R-EDIT-25, QA-18): the examples modal shows these
// SVG images instead of laying out ten examples while the page starts. One per example and
// screen language, in src/examples/thumbnails. `example-thumbnails.test.ts` fails when they no
// longer match the examples or the renderer; then run `pnpm --filter @ariadne-nsd/web thumbnails`.
import type { Locale } from '@ariadne-nsd/core';
import { examples, exampleThumbnailSvg } from '@ariadne-nsd/editor';
import { blockFont } from '@ariadne-nsd/fonts';
import { createNodeSubsetter, readFontFile } from '@ariadne-nsd/fonts/node';

export const thumbnailDir = new URL('../src/examples/thumbnails/', import.meta.url);

const locales: ReadonlyArray<Locale> = ['en', 'ko'];

/** The thumbnails as they should be: file name → SVG text. */
export async function expectedThumbnails(): Promise<Map<string, string>> {
  const subsetter = await createNodeSubsetter();
  const ttf = await readFontFile(blockFont.files.ttf);
  const files = new Map<string, string>();
  for (const example of examples) {
    for (const locale of locales) {
      files.set(
        `${example.id}.${locale}.svg`,
        exampleThumbnailSvg(example, locale, (codePoints) =>
          subsetter.subsetToWoff(ttf, codePoints),
        ),
      );
    }
  }
  return files;
}
