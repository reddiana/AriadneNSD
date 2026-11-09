// M56 (2026-11-10): opens the experiment's own u links, as the models wrote them, in the real app
// (the link format the app reads since R-WEB-10), and prints whether each opens in view mode or
// what reason the app shows. Serve a build first: cd src/apps/web && npx vite preview --port 4176
//   node journal/assets/2026-11-10-llm-guide-open-u.mjs "$(pwd)"
import { readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const repo = process.argv[2];
const web = join(repo, 'src', 'apps', 'web');
const require = createRequire(join(web, 'package.json'));
const pw = await import(pathToFileURL(require.resolve('@playwright/test')).href);
const chromium = pw.chromium ?? pw.default.chromium;
const runs = join(repo, 'journal', 'assets', '2026-11-09-llm-guide-runs');
const results = JSON.parse(await readFile(join(repo, 'journal/assets/2026-11-09-llm-guide-results.json'), 'utf8'));
const browser = await chromium.launch();
for (const r of results) {
  const good = r.links.filter((l) => l.packing === 'u');
  if (good.length === 0) continue;
  const text = await readFile(join(runs, `${r.run}.md`), 'utf8');
  const m = text.match(/https:\/\/ariadnensd\.com\/#ns1\.u\.[^\s<>`)]+/);
  if (!m) continue;
  const link = m[0].replace('https://ariadnensd.com/', 'http://localhost:4176/');
  const page = await (await browser.newContext()).newPage();
  await page.goto(link);
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true' || document.querySelector('[role=dialog]'), null, { timeout: 15000 });
  const view = await page.locator('.ans-viewbar').count();
  const texts = await page.locator('.ans-document text').count();
  const dialog = await page.locator('[role=dialog]').count();
  const reason = dialog ? (await page.locator('[role=dialog] p').innerText()).replace(/\n/g,' | ').slice(0,160) : '';
  console.log(`${r.run.padEnd(26)} expected:${good[0].ok ? 'ok  ' : 'FAIL'} app:${view === 1 && texts > 0 ? 'opens' : 'no'} (${texts} texts) ${reason}`);
  await page.close();
}
await browser.close();
