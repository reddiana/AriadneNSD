// The built script, plugin/skills/ariadne-nsd/scripts/nsd.mjs, is what the skill runs. It is
// committed so the skill folder installs as it is (claude.ai's upload, ~/.claude/skills, the
// plugin marketplace), so this test keeps it the build of the current sources, and runs it the
// way the skill does: plain `node`, in an empty folder, with nothing but Node's own modules.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire, isBuiltin } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliDecompressSync } from 'node:zlib';

import { openSvgFile } from '@ariadne-nsd/core';
import { blockFont } from '@ariadne-nsd/fonts';
import type { Rolldown } from 'vite';
import { build } from 'vite';
import { describe, expect, it } from 'vitest';

import { maxModel } from './test-support';

const root = fileURLToPath(new URL('../', import.meta.url));
const script = join(root, 'plugin/skills/ariadne-nsd/scripts/nsd.mjs');

/** The lines of the bundle that hold the packed files (virtual:nsd-assets). */
const assetLine = /^(var (ttf|subsetWasm) = )"([A-Za-z0-9+/=]*)";$/gm;

const unpack = (base64: string): Buffer => brotliDecompressSync(Buffer.from(base64, 'base64'));

describe('the built script', () => {
  it('T-1472 · R-SKILL-01: is the build of the current sources (run `pnpm --filter @ariadne-nsd/skill build` after a change)', async () => {
    const built = (await build({
      configFile: join(root, 'vite.config.ts'),
      build: { write: false },
    })) as Rolldown.RolldownOutput;
    const [chunk] = built.output;
    expect(chunk.fileName).toBe('nsd.mjs');
    const committed = readFileSync(script, 'utf8');
    // The code is compared as text. The packed files are compared unpacked: another Node's
    // brotli may pack the same bytes differently (CI runs Node 24).
    const withoutAssets = (code: string): string => code.replace(assetLine, '$1"…";');
    expect(withoutAssets(chunk.code)).toBe(withoutAssets(committed));
    const assets = new Map(
      [...committed.matchAll(assetLine)].map((match) => [match[2], unpack(match[3] ?? '')]),
    );
    const require = createRequire(join(root, '../../packages/fonts/package.json'));
    const ttf = readFileSync(join(root, '../../packages/fonts', blockFont.files.ttf));
    const wasm = readFileSync(require.resolve('harfbuzzjs/dist/harfbuzz-subset.wasm'));
    // Not toEqual: a failure would print megabytes.
    expect(assets.get('ttf')?.equals(ttf)).toBe(true);
    expect(assets.get('subsetWasm')?.equals(wasm)).toBe(true);
  });

  it('T-1473 · R-SKILL-01: runs with plain node in an empty folder: save, link and read give back the model', () => {
    const imports = [...readFileSync(script, 'utf8').matchAll(/^import .* from "([^"]+)";$/gm)];
    expect(imports.map((match) => match[1]).filter((name) => !isBuiltin(name ?? ''))).toEqual([]);
    const folder = mkdtempSync(join(tmpdir(), 'ariadne-nsd-skill-'));
    try {
      const node = (...args: string[]): string =>
        execFileSync(process.execPath, [script, ...args], { cwd: folder, encoding: 'utf8' });
      writeFileSync(join(folder, 'max.json'), maxModel);
      expect(node('save', 'max.json')).toMatch(/^Saved max\.ns\.svg/);
      expect(openSvgFile(readFileSync(join(folder, 'max.ns.svg'), 'utf8'))).toMatchObject({
        ok: true,
      });
      const link = node('link', 'max.ns.svg').trim();
      expect(JSON.parse(node('read', link))).toEqual(JSON.parse(maxModel));
    } finally {
      rmSync(folder, { recursive: true, force: true });
    }
  });
});
