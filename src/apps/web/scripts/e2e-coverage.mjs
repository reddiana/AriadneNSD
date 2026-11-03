// How much of the code the browser tests run (07-testing). Builds with source maps, runs every
// browser test with `E2E_COVERAGE` set (e2e/fixtures.ts saves each page's V8 coverage) and maps
// the coverage back to the source files. Writes coverage-e2e/coverage-final.json (istanbul) and
// coverage-e2e/coverage-summary.json, and prints the totals.
//   pnpm --filter @ariadne-nsd/web e2e:coverage            run the tests, then report
//   pnpm --filter @ariadne-nsd/web e2e:coverage --report   report the last run again
// It serves on port 4175, so it never reuses the plain build that `pnpm e2e` serves on 4173.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { basename, join } from 'node:path';

import MCR from 'monocart-coverage-reports';

const outputDir = 'coverage-e2e';
const rawDir = 'coverage-e2e-raw';
const distAssets = join('dist', 'assets');

if (!process.argv.includes('--report')) {
  rmSync(rawDir, { recursive: true, force: true });
  const run = spawnSync('pnpm exec playwright test', {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, E2E_COVERAGE: '1' },
  });
  if (run.status !== 0) {
    // Still report, but end with a failure so `pnpm coverage --check` sees it.
    process.exitCode = 1;
    console.error('Some browser tests failed; the coverage is of the rest.');
  }
}

const mcr = MCR({
  name: 'Browser tests (E2E)',
  outputDir,
  reports: ['json', 'json-summary', 'console-summary'],
  cleanCache: true,
  // Only our code: the app's chunks, mapped back to packages/* and apps/web/src.
  entryFilter: (entry) => entry.url.includes('/assets/') && entry.url.endsWith('.js'),
  sourceFilter: (path) =>
    !path.includes('node_modules') && /(^|\/)(packages\/[^/]+\/src|src)\/.*\.tsx?$/.test(path),
  // The source maps name this app's files `src/…` and the packages' `packages/…`; name both from
  // the workspace root (`src/`), as Vitest's coverage does.
  sourcePath: (path) =>
    path.replace(/^.*?(packages\/[^/]+\/src\/)/, '$1').replace(/^(\.\.\/)*src\//, 'apps/web/src/'),
});

const maps = new Map();
function sourceMapOf(url) {
  const file = join(distAssets, `${basename(new URL(url).pathname)}.map`);
  if (!maps.has(file))
    maps.set(file, existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : undefined);
  return maps.get(file);
}

for (const name of readdirSync(rawDir)) {
  const entries = JSON.parse(readFileSync(join(rawDir, name), 'utf8'))
    .filter((entry) => entry.url.includes('/assets/') && entry.url.endsWith('.js'))
    .map((entry) => ({ ...entry, sourceMap: sourceMapOf(entry.url) }));
  if (entries.length > 0) await mcr.add(entries);
}
await mcr.generate();
