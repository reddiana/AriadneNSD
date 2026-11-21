// Builds the skill's script, plugin/skills/ariadne-nsd/scripts/nsd.mjs: one file with core, the
// fonts' code, the web shell's share link, and the font and hb-subset wasm as base64 of brotli
// (virtual:nsd-assets), so it runs with plain `node` and nothing else. The same sources always give the same file.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants } from 'node:zlib';

import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

const here = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

/** A file as base64 of its brotli (best quality: it is built once and read every run). */
function packed(path: string): string {
  return brotliCompressSync(readFileSync(path), {
    params: { [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY },
  }).toString('base64');
}

function embeddedAssets(): Plugin {
  const id = 'virtual:nsd-assets';
  return {
    name: 'ariadne-nsd-skill-assets',
    resolveId: (source) => (source === id ? `\0${id}` : null),
    load(loaded) {
      if (loaded !== `\0${id}`) {
        return null;
      }
      const require = createRequire(here('../../packages/fonts/package.json'));
      const ttf = here('../../packages/fonts/assets/ariadne-nsd-mono-regular.ttf');
      const wasm = require.resolve('harfbuzzjs/dist/harfbuzz-subset.wasm');
      return [
        `export const ttf = ${JSON.stringify(packed(ttf))};`,
        `export const subsetWasm = ${JSON.stringify(packed(wasm))};`,
      ].join('\n');
    },
  };
}

export default defineConfig({
  plugins: [embeddedAssets()],
  logLevel: 'warn',
  build: {
    ssr: here('src/main.ts'),
    outDir: here('plugin/skills/ariadne-nsd/scripts'),
    emptyOutDir: false,
    target: 'node20',
    minify: false,
    rolldownOptions: {
      // Packing the font takes most of the build: that is expected, not worth a warning.
      checks: { bundlerTimings: false },
      output: { entryFileNames: 'nsd.mjs', format: 'es', codeSplitting: false },
    },
  },
  ssr: { noExternal: true, target: 'node' },
});
