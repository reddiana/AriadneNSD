// Finds where the CPU goes while the web app starts (backlog: "cut the start's CPU time"). Runs
// the returning visit (no welcome modal) in Chromium with a slowed CPU, records a CPU profile
// from the navigation until the block font is ready, and prints the functions that took the most
// time, by self time and by total time. Run against a preview server:
// `pnpm build && pnpm preview --port 4173`, then
// `node scripts/profile-startup.mjs [url] [cpu slowdown] [first|returning] [save path]`.
// With a save path, the raw profile is written there too (open it in Chrome DevTools › Performance).
import { writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'http://localhost:4173/';
const cpuRate = Number(process.argv[3] ?? 6);
const isFirstVisit = (process.argv[4] ?? 'returning') === 'first';
const savePath = process.argv[5];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 412, height: 915 } });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuRate });
if (!isFirstVisit) {
  await page.addInitScript(() => {
    localStorage.setItem('ariadne-nsd.setting.examples.welcomed', 'true');
  });
}
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 100 });
await cdp.send('Profiler.start');
await page.goto(url);
await page.waitForSelector('html[data-ready="true"]', { timeout: 120_000 });
if (isFirstVisit) await page.waitForTimeout(3000);
const { profile } = await cdp.send('Profiler.stop');
await browser.close();
if (savePath !== undefined) writeFileSync(savePath, JSON.stringify(profile));

// Self time of each node: the samples that landed on it times the interval between them.
const selfTime = new Map();
for (let index = 0; index < profile.samples.length; index += 1) {
  const id = profile.samples[index];
  const delta = profile.timeDeltas[index + 1] ?? 0;
  selfTime.set(id, (selfTime.get(id) ?? 0) + delta);
}
const nodes = new Map(profile.nodes.map((node) => [node.id, node]));
const parent = new Map();
for (const node of profile.nodes)
  for (const child of node.children ?? []) parent.set(child, node.id);

const label = (node) => {
  const frame = node.callFrame;
  const file = frame.url.split('/').pop() || '(native)';
  return `${frame.functionName || '(anonymous)'}  ${file}:${String(frame.lineNumber + 1)}:${String(frame.columnNumber + 1)}`;
};

const selfByLabel = new Map();
const totalByLabel = new Map();
for (const [id, time] of selfTime) {
  selfByLabel.set(label(nodes.get(id)), (selfByLabel.get(label(nodes.get(id))) ?? 0) + time);
  // Total time: count the sample once for every distinct function on its stack.
  const seen = new Set();
  for (let at = id; at !== undefined; at = parent.get(at)) {
    const name = label(nodes.get(at));
    if (seen.has(name)) continue;
    seen.add(name);
    totalByLabel.set(name, (totalByLabel.get(name) ?? 0) + time);
  }
}

const ms = (microseconds) => (microseconds / 1000).toFixed(1).padStart(8);
const top = (map, count) => [...map].sort((a, b) => b[1] - a[1]).slice(0, count);
const all = [...selfTime.values()].reduce((sum, time) => sum + time, 0);
console.log(`CPU ×${String(cpuRate)}, ${isFirstVisit ? 'first' : 'returning'} visit, ${url}`);
console.log(`profiled ${ms(all)} ms\n\nself time (ms)`);
for (const [name, time] of top(selfByLabel, 30)) console.log(`${ms(time)}  ${name}`);
console.log('\ntotal time (ms)');
for (const [name, time] of top(totalByLabel, 40)) console.log(`${ms(time)}  ${name}`);
