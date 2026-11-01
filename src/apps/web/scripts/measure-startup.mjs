// Measures how long the web app takes to start on a slow phone (inbox 2026-11-01: "slow on an
// Android phone"). Chromium with a slowed CPU and a slow 4G network, the way Lighthouse's mobile
// run does. Run against a preview server: `pnpm build && pnpm preview --port 4173`, then
// `node scripts/measure-startup.mjs [url] [cpu slowdown] [runs]`. Prints the median of the runs.
//
// What it times, from the start of the navigation:
//   toolbar  the editor is on the screen (the diagram is drawn, maybe still in a fallback font)
//   modal    the welcome modal's cards are on the screen (first visit)
//   thumbs   all ten thumbnails are drawn (first visit)
//   font     the block font is loaded (html[data-ready])
import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'http://localhost:4173/';
const cpuRate = Number(process.argv[3] ?? 6);
const runs = Number(process.argv[4] ?? 3);
// Lighthouse's "slow 4G": 150 ms round trip, 1.6 Mbps down, 750 kbps up.
const slow4g = { latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 };

function watch() {
  const times = {};
  window.__startup = times;
  const checks = {
    toolbar: () => document.querySelector('.ans-toolbar') !== null,
    modal: () => document.querySelector('.ans-example-card') !== null,
    thumbs: () => document.querySelectorAll('.ans-example-thumb svg').length >= 10,
    font: () => document.documentElement.dataset.ready === 'true',
  };
  new MutationObserver(() => {
    for (const [name, check] of Object.entries(checks)) {
      if (times[name] === undefined && check()) times[name] = Math.round(performance.now());
    }
  }).observe(document, { subtree: true, childList: true, attributes: true });
}

async function once({ isFirstVisit, network }) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 412, height: 915 } });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (network !== null) {
    await cdp.send('Network.emulateNetworkConditions', { offline: false, ...network });
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuRate });
  await page.addInitScript(watch);
  if (!isFirstVisit) {
    await page.addInitScript(() => {
      localStorage.setItem('ariadne-nsd.setting.examples.welcomed', 'true');
    });
  }
  await page.goto(url);
  await page.waitForSelector('html[data-ready="true"]', { timeout: 120_000 });
  if (isFirstVisit) {
    await page.waitForFunction(() => window.__startup.thumbs !== undefined, null, {
      timeout: 120_000,
    });
  }
  const times = await page.evaluate(() => window.__startup);
  await browser.close();
  return times;
}

function median(values) {
  const sorted = values.filter((value) => value !== undefined).sort((a, b) => a - b);
  return sorted.length === 0 ? '-' : String(sorted[Math.floor(sorted.length / 2)]);
}

async function scenario(label, options) {
  const all = [];
  for (let index = 0; index < runs; index += 1) all.push(await once(options));
  const names = ['toolbar', 'modal', 'thumbs', 'font'];
  const cells = names.map(
    (name) => `${name} ${median(all.map((times) => times[name])).padStart(5)}`,
  );
  console.log(`${label.padEnd(34)} ${cells.join('   ')}  (ms)`);
}

console.log(`CPU ×${String(cpuRate)}, median of ${String(runs)} runs, ${url}`);
await scenario('First visit, slow 4G', { isFirstVisit: true, network: slow4g });
await scenario('Returning visit, slow 4G', { isFirstVisit: false, network: slow4g });
await scenario('First visit, CPU only', { isFirstVisit: true, network: null });
await scenario('Returning visit, CPU only', { isFirstVisit: false, network: null });
