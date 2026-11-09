// M56: opens the real `j` and `d` links of the experiment's results in the local app
// (`pnpm dev`, http://localhost:5173) with Playwright and checks that the diagram shows in view mode.
//   node journal/assets/2026-11-09-llm-guide-open.mjs
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const web = join(here, '..', '..', 'src', 'apps', 'web');
const require = createRequire(join(web, 'package.json'));
const playwright = await import(pathToFileURL(require.resolve("@playwright/test")).href);
const chromium = playwright.chromium ?? playwright.default.chromium;

const results = JSON.parse(await readFile(join(here, '2026-11-09-llm-guide-results.json'), 'utf8'));
const browser = await chromium.launch();
try {
  for (const result of results.filter((r) => r.real !== undefined)) {
    const outcome = [];
    for (const packing of ['j', 'd']) {
      const link = result.real[packing].replace('https://ariadnensd.com/', 'http://localhost:5173/');
      const page = await (await browser.newContext()).newPage();
      await page.goto(link);
      await page.waitForSelector('html[data-ready="true"]');
      const viewBar = await page.locator('.ans-viewbar').count();
      const texts = await page.locator('.ans-document text').count();
      outcome.push(`${packing}:${viewBar === 1 && texts > 0 ? 'ok' : 'FAIL'}(${String(texts)} texts)`);
      await page.close();
    }
    console.log(`${result.run}  ${outcome.join(' ')}`);
  }
} finally {
  await browser.close();
}
