// Writes the examples modal's thumbnails (see example-thumbnails.ts):
//   pnpm --filter @ariadne-nsd/web thumbnails
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';

import { it } from 'vitest';

import { expectedThumbnails, thumbnailDir } from './example-thumbnails';

it('writes the thumbnails', async () => {
  await mkdir(thumbnailDir, { recursive: true });
  for (const name of await readdir(thumbnailDir)) {
    await rm(new URL(name, thumbnailDir));
  }
  for (const [name, text] of await expectedThumbnails()) {
    await writeFile(new URL(name, thumbnailDir), text);
  }
});
