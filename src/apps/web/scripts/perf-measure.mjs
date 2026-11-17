// Runs the check mode (`?perf`, 06-web 9) in Chromium and prints its results as Markdown: the
// times of AT-05 and their segments (QA-07). `--throttle=4` slows the CPU 4 times (Chrome's
// DevTools throttling), to see where a slower device spends the time.
//
//   pnpm build && pnpm preview --port 4173 &   (or any server of the built app)
//   node scripts/perf-measure.mjs --throttle=1 --rounds=10 [--url=http://localhost:4173/]
//
// Measure only when nothing else heavy runs on the machine (coding guide: timing tests).
import { chromium } from '@playwright/test';

const options = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [name, value = ''] = argument.replace(/^--/, '').split('=');
    return [name, value];
  }),
);
const throttle = Number(options.throttle ?? '1');
const rounds = Number(options.rounds ?? '10');
const base = options.url ?? 'http://localhost:4173/';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, locale: 'en-US' });
  const session = await page.context().newCDPSession(page);
  await page.goto(`${base}?perf&rounds=${String(rounds)}`);
  await page.locator('html[data-ready="true"]').waitFor();
  await session.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  await page.getByRole('button', { name: 'Start Measuring' }).click();
  await page.locator('.ans-perf-verdict').waitFor({ timeout: 30 * 60_000 });
  await session.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const tables = await page.evaluate(() =>
    [...globalThis.document.querySelectorAll('.ans-perf-table')].map((table) =>
      [...table.querySelectorAll('tr')].map((row) =>
        [...row.querySelectorAll('th, td')].map((cell) =>
          (cell.innerText ?? '').replace(/\s+/g, ' ').trim(),
        ),
      ),
    ),
  );
  const verdict = await page.locator('.ans-perf-verdict').textContent();
  const line = (cells) => `| ${cells.join(' | ')} |`;
  console.log(`## CPU ×${String(throttle)}, ${String(rounds)} rounds per place\n`);
  console.log(`${verdict ?? ''}\n`);
  for (const rows of tables) {
    const [head = [], ...body] = rows;
    console.log(line(head));
    console.log(line(head.map(() => '---')));
    for (const row of body) console.log(line(row));
    console.log('');
  }
} finally {
  await browser.close();
}
