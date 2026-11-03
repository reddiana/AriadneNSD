// The thumbnails in src/examples/thumbnails match the examples and the renderer.
import { readdir, readFile } from 'node:fs/promises';

import { expect, it } from 'vitest';

import { sourceHash, sourcesFile, thumbnailDir, thumbnailSources } from './example-thumbnails';

it("T-0529: the examples modal's thumbnails are up to date", async () => {
  const sources = await thumbnailSources();
  const hint = 'Run `pnpm --filter @ariadne-nsd/web thumbnails` and commit the files.';
  expect((await readdir(thumbnailDir)).sort(), hint).toEqual(
    [...sources.keys(), sourcesFile].sort(),
  );
  const hashes = JSON.parse(await readFile(new URL(sourcesFile, thumbnailDir), 'utf8')) as Record<
    string,
    string
  >;
  for (const [name, svg] of sources) {
    expect(hashes[name], `${name}: ${hint}`).toBe(sourceHash(svg));
  }
});
