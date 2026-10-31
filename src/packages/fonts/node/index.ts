import { readFile } from 'node:fs/promises';

/**
 * Reads a bundled font file in Node (tests, scripts). Browsers load the same files by URL:
 * `import url from '@ariadne-nsd/fonts/assets/<file>?url'` (Vite).
 * `path` is one of `blockFont.files`.
 */
export async function readFontFile(path: string): Promise<Uint8Array> {
  const buffer = await readFile(new URL(`../${path}`, import.meta.url));
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}
