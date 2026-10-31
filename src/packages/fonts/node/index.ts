import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

import { createSubsetter } from '../src/subset';
import type { Subsetter } from '../src/subset';

/**
 * Reads a bundled font file in Node (tests, scripts). Browsers load the same files by URL:
 * `import url from '@ariadne-nsd/fonts/assets/<file>?url'` (Vite).
 * `path` is one of `blockFont.files`.
 */
export async function readFontFile(path: string): Promise<Uint8Array> {
  return readBytes(new URL(`../${path}`, import.meta.url));
}

/** Reads the hb-subset wasm that `createSubsetter` instantiates (ADR-0026). */
export async function readSubsetWasm(): Promise<Uint8Array> {
  const require = createRequire(import.meta.url);
  return readBytes(require.resolve('harfbuzzjs/dist/harfbuzz-subset.wasm'));
}

/** Creates a subsetter in Node: reads the hb-subset wasm from `harfbuzzjs` and instantiates it. */
export async function createNodeSubsetter(): Promise<Subsetter> {
  return createSubsetter(await readSubsetWasm());
}

async function readBytes(path: URL | string): Promise<Uint8Array> {
  const buffer = await readFile(path);
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}
