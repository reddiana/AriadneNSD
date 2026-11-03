// The thumbnails in src/examples/thumbnails match the examples and the renderer.
import { readdir, readFile } from 'node:fs/promises';

import { expect, it } from 'vitest';

import { expectedThumbnails, thumbnailDir } from './example-thumbnails';

it("T-0529: the examples modal's thumbnails are up to date", async () => {
  const expected = await expectedThumbnails();
  const hint = 'Run `pnpm --filter @ariadne-nsd/web thumbnails` and commit the files.';
  expect((await readdir(thumbnailDir)).sort(), hint).toEqual([...expected.keys()].sort());
  for (const [name, text] of expected) {
    expect(await readFile(new URL(name, thumbnailDir), 'utf8'), `${name}: ${hint}`).toBe(text);
  }
});
