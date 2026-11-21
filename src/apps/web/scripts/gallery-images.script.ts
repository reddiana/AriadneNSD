// The algorithm gallery's pictures and links, for the gallery page to come: for each gallery entry
// and screen language, the diagram saved as the web app saves it (.ns.svg, header shape "title")
// and a share link that opens it on the site, made by the app's own share link code (R-WEB-05).
// `gallery.json` lists them. Run again when the gallery or the drawing changes, then commit:
//   pnpm --filter @ariadne-nsd/web gallery-images
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';

import { assembleSvgFile, locales, renderDoc, serializeModelJson } from '@ariadne-nsd/core';
import { gallery } from '@ariadne-nsd/editor';
import { blockFont } from '@ariadne-nsd/fonts';
import { createNodeSubsetter, readFontFile } from '@ariadne-nsd/fonts/node';
import { it } from 'vitest';

import { siteAddress } from '../src/files/pasted-document';
import { browserDeflate, shareLinkUrl, writeShareLink } from '../src/files/share-link';

const outDir = new URL('../../gallery/generated/', import.meta.url);

it('writes the gallery images and links', { timeout: 120_000 }, async () => {
  await mkdir(outDir, { recursive: true });
  for (const name of await readdir(outDir)) {
    await rm(new URL(name, outDir));
  }
  const subsetter = await createNodeSubsetter();
  const ttf = await readFontFile(blockFont.files.ttf);
  const site = new URL(siteAddress);
  const manifest = [];
  for (const entry of gallery) {
    const files: Record<string, string> = {};
    const links: Record<string, string> = {};
    const sizes: Record<string, { width: number; height: number }> = {};
    for (const locale of locales) {
      const doc = entry.build({ headStyle: 'title', locale });
      const rendering = renderDoc(doc);
      const file = assembleSvgFile({
        doc,
        drawing: rendering.svg,
        fonts: [
          { family: blockFont.familyName, woff: subsetter.subsetToWoff(ttf, rendering.codePoints) },
        ],
      });
      const fileName = `${entry.id}.${locale}.ns.svg`;
      await writeFile(new URL(fileName, outDir), file);
      const fragment = await writeShareLink(
        serializeModelJson(doc),
        `${entry.id}.ns.svg`,
        browserDeflate(),
      );
      files[locale] = fileName;
      links[locale] = shareLinkUrl(site, fragment);
      sizes[locale] = { width: rendering.svg.width, height: rendering.svg.height };
    }
    manifest.push({
      id: entry.id,
      category: entry.category,
      name: entry.name,
      what: entry.what,
      files,
      sizes,
      links,
    });
  }
  await writeFile(new URL('gallery.json', outDir), `${JSON.stringify(manifest, null, 2)}\n`);
});
