// The two NS charts on the README's first screen, saved as the web app saves them (.ns.svg):
// the Dijkstra and merge sort examples, header shape "title". Korean for README.ko.md, English
// (true / false, English comments) for the English README.md.
// Run again when the drawing changes, then commit the new files:
//   pnpm --filter @ariadne-nsd/editor readme-images
import { writeFile } from 'node:fs/promises';

import { assembleSvgFile, renderDoc } from '@ariadne-nsd/core';
import { blockFont } from '@ariadne-nsd/fonts';
import { createNodeSubsetter, readFontFile } from '@ariadne-nsd/fonts/node';
import { it } from 'vitest';

import { examples } from '../src/examples/examples';

const assets = new URL('../../../../journal/assets/', import.meta.url);

it('writes the README images', async () => {
  const subsetter = await createNodeSubsetter();
  const ttf = await readFontFile(blockFont.files.ttf);
  const outputs = [
    { locale: 'ko', name: (id: string) => `2026-11-02-readme-${id}.ns.svg` },
    { locale: 'en', name: (id: string) => `2026-11-22-readme-${id}.en.ns.svg` },
  ] as const;
  for (const { locale, name } of outputs)
    for (const id of ['dijkstra', 'merge-sort']) {
      const example = examples.find((e) => e.id === id);
      if (example === undefined) throw new Error(`no example ${id}`);
      const doc = example.build({ headStyle: 'title', locale });
      const rendering = renderDoc(doc);
      const woff = subsetter.subsetToWoff(ttf, rendering.codePoints);
      const file = assembleSvgFile({
        doc,
        drawing: rendering.svg,
        fonts: [{ family: blockFont.familyName, woff }],
      });
      await writeFile(new URL(name(id), assets), file);
    }
});
