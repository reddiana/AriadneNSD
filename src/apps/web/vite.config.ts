import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig, runnerImport } from 'vite';

const here = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

/**
 * The files for AI assistants at the site's root (R-WEB-10, 06-web 3.1): `/llms.txt`, filled from
 * guide/llms.txt with core's lists of values, and `/model.schema.json`, core's JSON Schema of the
 * model (its source stays with the parser it describes). The short guide in index.html is filled
 * the same way. The dev server answers the same addresses.
 */
function guideForAi(): Plugin {
  const schema = here('../../packages/core/schema/model.schema.json');
  const template = here('guide/llms.txt');
  let fill: ((text: string) => string) | null = null;
  // The filler is TypeScript that imports core: Vite's module runner loads it.
  const filler = async (): Promise<(text: string) => string> => {
    if (fill === null) {
      const { module } = await runnerImport<{ fillGuide: (text: string) => string }>(
        here('src/files/llms-guide.ts'),
        { configFile: false, logLevel: 'error' },
      );
      fill = module.fillGuide;
    }
    return fill;
  };
  const guide = async (): Promise<string> => (await filler())(readFileSync(template, 'utf8'));
  return {
    name: 'ariadne-nsd-guide-for-ai',
    configureServer(server) {
      server.middlewares.use('/model.schema.json', (_request, response) => {
        response.setHeader('Content-Type', 'application/schema+json; charset=utf-8');
        response.end(readFileSync(schema));
      });
      server.middlewares.use('/llms.txt', (_request, response, next) => {
        guide().then((text) => {
          response.setHeader('Content-Type', 'text/plain; charset=utf-8');
          response.end(text);
        }, next);
      });
    },
    transformIndexHtml: {
      order: 'pre',
      handler: async (html) => (await filler())(html),
    },
    async generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: await guide() });
      this.emitFile({
        type: 'asset',
        fileName: 'model.schema.json',
        source: readFileSync(schema, 'utf8'),
      });
    },
  };
}

export default defineConfig({
  // Relative asset paths, so the build works under /AriadneNSD/app/ on GitHub Pages (DR-0013).
  base: './',
  plugins: [react(), guideForAi()],
  build: {
    outDir: 'dist',
    // Source maps only for measuring the browser tests' coverage (`pnpm e2e:coverage`).
    sourcemap: process.env.E2E_COVERAGE !== undefined,
  },
});
