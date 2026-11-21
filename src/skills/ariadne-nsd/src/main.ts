// The entry of the bundled `nsd.mjs` (scripts/build.mjs). The block font and the hb-subset wasm are
// inside it, brotli-compressed, so the script runs with plain `node` and no network or other file:
// claude.ai's skill sandbox has no network.
import { brotliDecompressSync } from 'node:zlib';

import { createSubsetter } from '@ariadne-nsd/fonts';
import { subsetWasm, ttf } from 'virtual:nsd-assets';

import { run } from './cli';
import { nodeIo } from './node-io';

const unpack = (base64: string): Uint8Array =>
  new Uint8Array(brotliDecompressSync(Buffer.from(base64, 'base64')));

const io = nodeIo(async () => ({
  ttf: unpack(ttf),
  subsetter: await createSubsetter(unpack(subsetWasm)),
}));

process.exitCode = await run(process.argv.slice(2), io);
