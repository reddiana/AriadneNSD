// Writes the examples modal's thumbnails (see example-thumbnails.ts):
//   pnpm --filter @ariadne-nsd/web thumbnails
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';

import { chromium } from '@playwright/test';
import { it } from 'vitest';

import {
  pictureBox,
  pictureQuality,
  sourceHash,
  sourcesFile,
  thumbnailDir,
  thumbnailSources,
} from './example-thumbnails';

/* global document, Image -- these run in the page */
it('writes the thumbnails', { timeout: 120_000 }, async () => {
  await mkdir(thumbnailDir, { recursive: true });
  for (const name of await readdir(thumbnailDir)) {
    await rm(new URL(name, thumbnailDir));
  }
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const hashes: Record<string, string> = {};
  for (const [name, svg] of await thumbnailSources()) {
    const base64 = await page.evaluate(
      async ({ svg, box, quality }) => {
        const image = new Image();
        image.src = `data:image/svg+xml;base64,${btoa(String.fromCodePoint(...new TextEncoder().encode(svg)))}`;
        await image.decode();
        const scale = Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.naturalWidth * scale);
        canvas.height = Math.round(image.naturalHeight * scale);
        const context = canvas.getContext('2d');
        if (context === null) throw new Error('No 2D canvas');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/webp', quality).split(',')[1] ?? '';
      },
      { svg, box: pictureBox, quality: pictureQuality },
    );
    await writeFile(new URL(name, thumbnailDir), Buffer.from(base64, 'base64'));
    hashes[name] = sourceHash(svg);
  }
  await browser.close();
  await writeFile(new URL(sourcesFile, thumbnailDir), `${JSON.stringify(hashes, null, 2)}\n`);
});
