// Records the promo video for LinkedIn: the web editor building the gallery's heap sort (English)
// from an empty document, by the keys a user would press. A key overlay shows each key combination
// with a short label; plain typing shows none. Not a test: `pnpm e2e` and `pnpm check` skip it.
//
//   node apps/web/promo/record.mjs            (from src/, ffmpeg with libx264 on PATH or $FFMPEG)
//
// It serves the app on port 5190 (unless something already answers there), captures PNG frames
// with the Chrome DevTools screencast, and encodes them to journal/assets/<name>.mp4 (H.264, 30 fps,
// 1080x1080) with a poster frame of the finished diagram next to it.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const port = 5190;
const url = `http://localhost:${String(port)}/`;
const webDir = fileURLToPath(new URL('..', import.meta.url));
const assets = fileURLToPath(new URL('../../../../journal/assets/', import.meta.url));
const name = '2026-11-22-linkedin-heap-sort';
const fps = 30;
// 864 CSS pixels at 1.25 keep the menu bar (it folds below 861) and give 1080 video pixels.
const size = 864;
const scale = 1.25;

function findFfmpeg() {
  const candidates = [
    process.env.FFMPEG,
    'ffmpeg',
    join(
      process.env.LOCALAPPDATA ?? '',
      'Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.1-full_build/bin/ffmpeg.exe',
    ),
  ];
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === '') continue;
    const probe = spawnSync(candidate, ['-hide_banner', '-encoders'], { encoding: 'utf8' });
    if (probe.status === 0 && probe.stdout.includes('libx264')) return candidate;
  }
  throw new Error('ffmpeg with libx264 not found: put it on PATH or set FFMPEG');
}

async function isUp() {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
}

async function startServer() {
  if (await isUp()) return null;
  const server = spawn('pnpm', ['exec', 'vite', '--port', String(port), '--strictPort'], {
    cwd: webDir,
    shell: true,
    stdio: 'ignore',
  });
  for (let i = 0; i < 120; i += 1) {
    if (await isUp()) return server;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('the dev server did not start');
}

function stopServer(server) {
  if (server === null || server.pid === undefined) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(server.pid), '/t', '/f'], { stdio: 'ignore' });
  } else {
    server.kill();
  }
}

/** The key overlay: a pill in the lower right corner, put in the page from outside the app. */
function overlayScript() {
  const install = () => {
    const style = document.createElement('style');
    style.textContent = `
      #promo-keys { position: fixed; right: 20px; bottom: 44px; z-index: 2147483647;
        display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-radius: 12px;
        background: rgba(24, 28, 38, 0.9); color: #fff; pointer-events: none;
        font: 600 22px/1.2 system-ui, 'Segoe UI', sans-serif; box-shadow: 0 6px 24px rgba(0,0,0,.25);
        opacity: 0; transform: translateY(6px); transition: opacity .15s, transform .15s; }
      #promo-keys.on { opacity: 1; transform: none; }
      #promo-keys kbd { font: 700 21px/1 ui-monospace, Consolas, monospace; color: #1b1f2a;
        background: #f3f5f9; border-radius: 6px; padding: 5px 9px; box-shadow: inset 0 -2px 0 #c4cad6; }
      #promo-keys .plus { opacity: .7; font-weight: 400; }
      #promo-keys .label { margin-left: 4px; font-weight: 500; }`;
    document.head.append(style);
    const box = document.createElement('div');
    box.id = 'promo-keys';
    document.body.append(box);
    let timer = 0;
    window.promoKeys = (keys, label) => {
      box.replaceChildren();
      keys.forEach((key, index) => {
        if (index > 0) box.append(' ');
        for (const [partIndex, part] of key.split('+').entries()) {
          if (partIndex > 0) {
            const plus = document.createElement('span');
            plus.className = 'plus';
            plus.textContent = '+';
            box.append(plus);
          }
          const kbd = document.createElement('kbd');
          kbd.textContent = part;
          box.append(kbd);
        }
      });
      const text = document.createElement('span');
      text.className = 'label';
      text.textContent = label;
      box.append(text);
      box.classList.add('on');
      clearTimeout(timer);
      timer = setTimeout(() => box.classList.remove('on'), 1600);
    };
    window.promoKeysHide = () => box.classList.remove('on');
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
}

const ffmpeg = findFfmpeg();
const server = await startServer();
const frames = mkdtempSync(join(tmpdir(), 'ans-promo-'));
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: scale,
    locale: 'en-US',
    colorScheme: 'light',
  });
  await page.addInitScript(() => {
    localStorage.setItem('ariadne-nsd.setting.examples.welcomed', 'true');
  });
  await page.addInitScript(overlayScript);
  await page.goto(url);
  await page.waitForSelector('html[data-ready="true"]');

  // Before recording: the drawing's labels in English (true · false, ADR-0041) and a large zoom (170%).
  await page.getByRole('button', { name: 'Diagram', exact: true }).click();
  await page.getByRole('menuitem', { name: /Document Settings/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Document Settings' });
  await dialog.getByLabel('Language of drawn labels').selectOption({ label: 'English' });
  await page.keyboard.press('Escape');
  const canvas = page.locator('.ans-canvas[tabindex]');
  await canvas.focus();
  for (let i = 0; i < 7; i += 1) await page.keyboard.press('NumpadAdd');
  await page.mouse.move(size - 2, size / 2);
  await page.waitForTimeout(800);

  // Recording: the screencast sends a PNG frame whenever the screen changes.
  const cdp = await page.context().newCDPSession(page);
  const shots = [];
  cdp.on('Page.screencastFrame', (frame) => {
    const file = join(frames, `f${String(shots.length).padStart(5, '0')}.png`);
    writeFileSync(file, Buffer.from(frame.data, 'base64'));
    shots.push({ file, time: frame.metadata.timestamp ?? Date.now() / 1000 });
    cdp.send('Page.screencastFrameAck', { sessionId: frame.sessionId }).catch(() => undefined);
  });
  await cdp.send('Page.startScreencast', {
    format: 'png',
    maxWidth: size * scale,
    maxHeight: size * scale,
    everyNthFrame: 1,
  });
  const started = Date.now() / 1000;

  const wait = (ms) => page.waitForTimeout(ms);
  const names = { Control: 'Ctrl', ArrowUp: '↑', ArrowDown: '↓', Escape: 'Esc', '-': '−' };
  const pretty = (press) =>
    press
      .split('+')
      .map((part) => names[part] ?? part)
      .join('+');
  /** A key or a key sequence ('y y') with its overlay, then a pause to follow it. */
  const step = async (keys, label, pause = 800) => {
    const presses = keys.split(' ');
    const shown = presses.map(pretty);
    await page.evaluate(([k, l]) => window.promoKeys(k, l), [shown, label]);
    for (const press of presses) await page.keyboard.press(press);
    await wait(pause);
  };
  const move = (keys, label) => step(keys, label, 380);
  /** Typing: fast, no overlay; Enter (or Tab) ends the field. */
  const type = async (text, end = 'Enter') => {
    await page.keyboard.type(text, { delay: 22 });
    await wait(120);
    if (end !== null) await page.keyboard.press(end);
    await wait(250);
  };

  await wait(1500);
  // heap_sort: a Method header, then the first line.
  await step('m', 'Method…', 700);
  await step('2', 'Add Method header', 500);
  await type('heap_sort(a)');
  await move('j', 'Down');
  await step('Enter', 'Edit block', 250);
  await type('n = len(a)');
  // The call to sift_down, by a written name.
  await step('a c', 'Insert call', 700);
  await step('3', 'Call by a written name', 400);
  await type('sift_down', 'Tab');
  await type('a, i, n');
  await step('s f', 'Wrap in For', 500);
  await type('for i in range(n // 2 - 1, -1, -1)');
  await wait(400);
  await step('o', 'New block after', 300);
  await type('a[0], a[end] = a[end], a[0]    # largest to the back');
  // Copy the call below the swap, give it other arguments.
  await move('k', 'Up');
  await step('y y', 'Copy', 500);
  await move('j', 'Down');
  await step('p', 'Paste after', 700);
  await step('Enter', 'Edit arguments', 250);
  await type('a, 0, end');
  await step('Shift+ArrowUp', 'Select two blocks', 700);
  await step('s f', 'Wrap in For', 500);
  await type('for end in range(n - 1, 0, -1)');
  await wait(500);
  // sift_down: made from the call.
  await move('k', 'Up');
  await step('g d', 'Create Method from call', 1200);
  await move('j', 'Down');
  await step('Enter', 'Edit block', 250);
  await type('largest = i');
  await step('o', 'New block after', 300);
  await type('l, r = 2 * i + 1, 2 * i + 2');
  await step('a i', 'Insert If', 500);
  await type('l < n and a[l] > a[largest]');
  await wait(400);
  await move('j', 'Into the true branch');
  await step('Enter', 'Edit block', 250);
  await type('largest = l');
  await step('Control+ArrowUp', 'Up to the If', 600);
  await step('a i', 'Insert If', 500);
  await type('r < n and a[r] > a[largest]');
  await wait(300);
  await move('j', 'Into the true branch');
  await step('Enter', 'Edit block', 250);
  await type('largest = r');
  await step('Control+ArrowUp', 'Up to the If', 600);
  await step('a i', 'Insert If', 500);
  await type('largest == i');
  await wait(300);
  await move('j', 'Into the true branch');
  await step('Enter', 'Edit block', 250);
  await type('return    # heap order holds');
  await step('Control+ArrowUp', 'Up to the If', 600);
  await step('o', 'New block after', 300);
  await type('a[i], a[largest] = a[largest], a[i]');
  await step('o', 'New block after', 300);
  await type('i = largest');
  // Select the whole body and wrap it in a While.
  for (let i = 0; i < 6; i += 1) {
    await step('Shift+ArrowUp', 'Select blocks', 220);
  }
  await wait(500);
  await step('s w', 'Wrap in While', 500);
  await type('True');
  await wait(600);
  // The whole drawing.
  for (let i = 0; i < 6; i += 1) {
    await step('-', 'Zoom out', 200);
  }
  await wait(600);
  // Clear the selection by clicking the empty canvas below the drawing (no status message, unlike
  // Esc Esc); any notice left in the status bar is hidden for the final hold.
  await page.evaluate(() => window.promoKeysHide());
  await page.mouse.click(size / 2, size - 60);
  await wait(300);
  if ((await page.locator('.ans-statusbar .ans-notice').count()) > 0) {
    process.stdout.write('a status notice was showing: hidden for the final hold\n');
    await page.addStyleTag({ content: '.ans-statusbar .ans-notice { visibility: hidden; }' });
  }
  await page.mouse.move(size - 2, size / 2);
  await wait(900);
  const drawing = await page.locator('.ans-document').boundingBox();
  process.stdout.write(`final drawing box (CSS px): ${JSON.stringify(drawing)}\n`);
  await wait(3200);
  const ended = Date.now() / 1000;
  await cdp.send('Page.stopScreencast');
  await page.screenshot({ path: join(assets, `${name}-final.png`) });

  // Constant 30 fps: each output frame shows the last screencast frame at or before its time.
  if (shots.length === 0) throw new Error('no frames');
  const timeline = shots.map((shot) => ({ ...shot, time: Math.max(shot.time, started) }));
  const lines = [];
  for (let index = 0; index < timeline.length; index += 1) {
    const next = index + 1 < timeline.length ? timeline[index + 1].time : ended;
    const duration = Math.max(0, next - timeline[index].time);
    lines.push(
      `file '${timeline[index].file.replaceAll('\\', '/')}'`,
      `duration ${duration.toFixed(4)}`,
    );
  }
  lines.push(`file '${timeline.at(-1).file.replaceAll('\\', '/')}'`);
  const list = join(frames, 'list.txt');
  writeFileSync(list, `${lines.join('\n')}\n`);
  mkdirSync(assets, { recursive: true });
  const output = join(assets, `${name}.mp4`);
  if (existsSync(output)) rmSync(output);
  const encode = spawnSync(
    ffmpeg,
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      list,
      '-vf',
      `fps=${String(fps)},scale=1080:1080:flags=lanczos,format=yuv420p`,
      '-c:v',
      'libx264',
      '-preset',
      'slow',
      '-crf',
      '18',
      '-tune',
      'stillimage',
      '-movflags',
      '+faststart',
      '-an',
      output,
    ],
    { stdio: 'inherit' },
  );
  if (encode.status !== 0) throw new Error('ffmpeg failed');
  process.stdout.write(
    `${output}: ${(ended - started).toFixed(1)} s, ${String(shots.length)} screencast frames\n`,
  );
} finally {
  await browser.close();
  stopServer(server);
  rmSync(frames, { recursive: true, force: true });
}
