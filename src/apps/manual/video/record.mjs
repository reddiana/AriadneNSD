// Records the user manual's videos: the web editor building the gallery's heap sort from an empty
// document, once by keys only and once by mouse only, in English or Korean. In the key version a
// pill shows each key combination with a short label (plain typing shows none); in the mouse
// version an overlay cursor follows the mouse, a ripple marks each click, and the pill names what
// was clicked. Not a test: no test runs it (lint and format checks do read it).
//
//   node apps/manual/video/record.mjs --mode keys|mouse --lang en|ko   (from src/, ffmpeg with
//   libx264 on PATH or $FFMPEG; --crf N changes the quality, default 23)
//
// It serves the app on port 5191 (unless something already answers there), captures PNG frames
// with the Chrome DevTools screencast, and encodes them to apps/manual/video/<lang>/
// heap-sort-<mode>.mp4 (H.264, 30 fps, 1080x1080) with a poster of the last frame next to it.
// The steps follow apps/web/promo/record.mjs (the LinkedIn video), which stays as it is.
/* global window, document -- the overlay and the box searches run in the page */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { chromium } from '@playwright/test';

const { values: options } = parseArgs({
  options: {
    mode: { type: 'string', default: 'keys' },
    lang: { type: 'string', default: 'en' },
    crf: { type: 'string', default: '23' },
  },
});
const mode = options.mode;
const lang = options.lang;
if (mode !== 'keys' && mode !== 'mouse') throw new Error('--mode is keys or mouse');
if (lang !== 'en' && lang !== 'ko') throw new Error('--lang is en or ko');

const port = 5191;
const url = `http://localhost:${String(port)}/`;
const webDir = fileURLToPath(new URL('../../web/', import.meta.url));
const outDir = fileURLToPath(new URL(`./${lang}/`, import.meta.url));
const name = `heap-sort-${mode}`;
const fps = 30;
// 864 CSS pixels at 1.25 keep the menu bar (it folds below 861) and give 1080 video pixels.
const size = 864;
const scale = 1.25;
/** The mouse version's click and move, for the final steps; `byMouse` fills it. */
const mouseState = {};

/** The gallery's words for each language (packages/editor/src/gallery/heap-sort.ts). */
const words = {
  en: { largestToBack: 'largest to the back', heapOrderHolds: 'heap order holds' },
  ko: { largestToBack: '가장 큰 것을 맨 뒤로', heapOrderHolds: '힙 조건을 지킴' },
}[lang];

/** The overlay's labels, and the app's own names the mouse version looks for on the screen. */
const text = {
  en: {
    method: 'Method…',
    addHeader: 'Add Method header',
    down: 'Down',
    edit: 'Edit block',
    insertFor: 'Insert For',
    insertWhile: 'Insert While',
    insertIf: 'Insert If',
    insertCall: 'Insert call',
    intoBody: 'Into the loop body',
    intoTrue: 'Into the true branch',
    newAfter: 'New block after',
    upToIf: 'Up to the If',
    up: 'Up',
    upToWhile: 'Up to the While',
    upToFor: 'Up to the For',
    extract: 'Extract to new Method',
    callSift: 'Call sift_down',
    zoomOut: 'Zoom out',
    click: 'Click',
    doubleClick: 'Double-click',
    tripleClick: 'Triple-click',
    selectArgs: 'Select the arguments',
    rightClick: 'Right-click',
    menu: 'Menu',
    contextMenu: 'Context menu',
    toolbar: 'Toolbar',
    zoomMenu: 'Zoom',
    // The app's names (en-US screen).
    app: {
      diagramMenu: 'Diagram',
      addMethodHeader: 'Add Method Header',
      insert: 'Insert',
      for: 'Insert For',
      call: 'Insert Call…',
      extract: 'Extract into New Method',
      zoomOut: 'Zoom Out',
      process: 'Process',
    },
  },
  ko: {
    method: 'Method…',
    addHeader: 'Method 헤더 달기',
    down: '아래로',
    edit: '블록 편집',
    insertFor: 'For 삽입',
    insertWhile: 'While 삽입',
    insertIf: 'If 삽입',
    insertCall: '호출 삽입',
    intoBody: '반복 본문으로',
    intoTrue: '참 분기로',
    newAfter: '뒤에 새 블록',
    upToIf: 'If로 올라가기',
    up: '위로',
    upToWhile: 'While로 올라가기',
    upToFor: 'For로 올라가기',
    extract: '새 Method로 빼기',
    callSift: 'sift_down 호출',
    zoomOut: '축소',
    click: '클릭',
    doubleClick: '더블클릭',
    tripleClick: '세 번 클릭',
    selectArgs: '인자를 모두 선택',
    rightClick: '오른쪽 클릭',
    menu: '메뉴',
    contextMenu: '컨텍스트 메뉴',
    toolbar: '툴바',
    zoomMenu: '확대',
    app: {
      diagramMenu: '다이어그램',
      addMethodHeader: 'Method 헤더 달기',
      insert: '삽입',
      for: 'For 삽입',
      call: '호출 삽입…',
      extract: '새 Method로 빼기',
      zoomOut: '축소',
      process: '처리',
    },
  },
}[lang];

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

/**
 * The overlays, put in the page from outside the app: the pill in the lower right corner, and
 * (when `withCursor`) an arrow cursor that follows the mouse with a ripple on each press.
 */
function overlayScript(withCursor) {
  const install = () => {
    const style = document.createElement('style');
    style.textContent = `
      #promo-keys { position: fixed; right: 20px; bottom: 44px; z-index: 2147483646;
        display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-radius: 12px;
        background: rgba(24, 28, 38, 0.9); color: #fff; pointer-events: none;
        font: 600 22px/1.2 system-ui, 'Segoe UI', 'Malgun Gothic', sans-serif;
        box-shadow: 0 6px 24px rgba(0,0,0,.25);
        opacity: 0; transform: translateY(6px); transition: opacity .15s, transform .15s; }
      #promo-keys.on { opacity: 1; transform: none; }
      #promo-keys kbd { font: 700 21px/1 ui-monospace, Consolas, 'Malgun Gothic', monospace;
        color: #1b1f2a; background: #f3f5f9; border-radius: 6px; padding: 5px 9px;
        box-shadow: inset 0 -2px 0 #c4cad6; }
      #promo-keys .plus { opacity: .7; font-weight: 400; }
      #promo-keys .label { margin-left: 4px; font-weight: 500; }
      #promo-cursor { position: fixed; left: 0; top: 0; z-index: 2147483647; pointer-events: none;
        width: 26px; height: 26px; display: none; will-change: transform; }
      .promo-ripple { position: fixed; z-index: 2147483645; pointer-events: none; width: 44px;
        height: 44px; margin: -22px 0 0 -22px; border-radius: 50%; border: 3px solid #e8590c;
        background: rgba(232, 89, 12, .18); animation: promo-ripple .5s ease-out forwards; }
      .promo-ripple.right { border-color: #1971c2; background: rgba(25, 113, 194, .18); }
      @keyframes promo-ripple { from { transform: scale(.3); opacity: 1; }
        to { transform: scale(1.1); opacity: 0; } }`;
    document.head.append(style);
    const box = document.createElement('div');
    box.id = 'promo-keys';
    document.body.append(box);
    let timer = 0;
    window.promoKeys = (keys, label, hold = 1600) => {
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
      const words = document.createElement('span');
      words.className = 'label';
      words.textContent = label;
      box.append(words);
      box.classList.add('on');
      clearTimeout(timer);
      timer = setTimeout(() => box.classList.remove('on'), hold);
    };
    window.promoKeysHide = () => box.classList.remove('on');
    if (!withCursor) return;
    const cursor = document.createElement('div');
    cursor.id = 'promo-cursor';
    cursor.innerHTML =
      '<svg width="26" height="26" viewBox="0 0 26 26"><path d="M3 2 L3 21 L8 16.5 L11.5 24 L15 22.5 L11.6 15.2 L18 15.2 Z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.append(cursor);
    const place = (event) => {
      cursor.style.display = 'block';
      cursor.style.transform = `translate(${String(event.clientX - 3)}px, ${String(event.clientY - 2)}px)`;
    };
    window.addEventListener('pointermove', place, true);
    window.addEventListener(
      'pointerdown',
      (event) => {
        place(event);
        const ripple = document.createElement('div');
        ripple.className = event.button === 2 ? 'promo-ripple right' : 'promo-ripple';
        ripple.style.left = `${String(event.clientX)}px`;
        ripple.style.top = `${String(event.clientY)}px`;
        document.body.append(ripple);
        setTimeout(() => ripple.remove(), 600);
      },
      true,
    );
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
}

const ffmpeg = findFfmpeg();
const server = await startServer();
const frames = mkdtempSync(join(tmpdir(), 'ans-manual-video-'));
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: scale,
    locale: lang === 'ko' ? 'ko-KR' : 'en-US',
    colorScheme: 'light',
  });
  await page.addInitScript(() => {
    localStorage.setItem('ariadne-nsd.setting.examples.welcomed', 'true');
  });
  await page.addInitScript(overlayScript, mode === 'mouse');
  await page.goto(url);
  await page.waitForSelector('html[data-ready="true"]');

  // Before recording: the drawing's labels in the video's language (ADR-0041) and a large zoom
  // (170%).
  await page.locator('.ans-menu-button').filter({ hasText: text.app.diagramMenu }).click();
  await page.getByRole('menuitem', { name: /Document Settings|문서 설정/ }).click();
  await page
    .locator('select[id="ans-setting-document.locale"]')
    .selectOption(lang === 'ko' ? '1' : '0');
  await page.keyboard.press('Escape');
  const canvas = page.locator('.ans-canvas[tabindex]');
  await canvas.focus();
  for (let i = 0; i < 7; i += 1) await page.keyboard.press('NumpadAdd');
  await page.mouse.move(size - 40, size / 2);
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

  try {
    if (mode === 'keys') await byKeys(page, wait);
    else await byMouse(page, wait);
  } catch (error) {
    await page.screenshot({ path: join(frames, '..', `ans-manual-video-failed.png`) });
    throw error;
  }

  // The whole drawing, then a clear selection: a click on the empty canvas below the drawing (no
  // status message, unlike Esc Esc); any notice left in the status bar is hidden for the hold.
  await page.evaluate(() => window.promoKeysHide());
  if (mode === 'keys') {
    await page.mouse.click(size / 2, size - 60);
    await page.mouse.move(size - 2, size / 2);
  } else {
    await mouseState.click({ x: size / 2, y: size - 70 }, null);
    await mouseState.glide(size - 60, size - 160, 500);
  }
  await wait(300);
  if ((await page.locator('.ans-statusbar .ans-notice').count()) > 0) {
    process.stdout.write('a status notice was showing: hidden for the final hold\n');
    await page.addStyleTag({ content: '.ans-statusbar .ans-notice { visibility: hidden; }' });
  }
  await wait(900);
  const drawing = await page.locator('.ans-document').boundingBox();
  process.stdout.write(`final drawing box (CSS px): ${JSON.stringify(drawing)}\n`);
  await wait(3200);
  const ended = Date.now() / 1000;
  await cdp.send('Page.stopScreencast');
  mkdirSync(outDir, { recursive: true });
  // The poster without the overlay cursor.
  await page.addStyleTag({ content: '#promo-cursor { display: none !important; }' });
  await page.screenshot({ path: join(outDir, `${name}.png`) });

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
  const output = join(outDir, `${name}.mp4`);
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
      options.crf,
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

/** The key version: the same steps as the LinkedIn video (apps/web/promo/record.mjs). */
async function byKeys(page, wait) {
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
  /** Typing: fast, no overlay; Enter ends the field. */
  const type = async (typed, end = 'Enter') => {
    await page.keyboard.type(typed, { delay: 22 });
    await wait(120);
    if (end !== null) await page.keyboard.press(end);
    await wait(250);
  };

  await wait(1500);
  // heap_sort: a Method header, then the first line.
  await step('m', text.method, 700);
  await step('2', text.addHeader, 500);
  await type('heap_sort(a)');
  await move('j', text.down);
  await step('Enter', text.edit, 250);
  await type('n = len(a)');
  // The first loop: the For first, then its body: the sift-down logic, written right there.
  await step('a f', text.insertFor, 700);
  await type('for i in range(n // 2 - 1, -1, -1)');
  await move('j', text.intoBody);
  await step('a w', text.insertWhile, 700);
  await type('True');
  await move('j', text.intoBody);
  await step('Enter', text.edit, 250);
  await type('largest = i');
  await step('o', text.newAfter, 300);
  await type('l, r = 2 * i + 1, 2 * i + 2');
  await step('a i', text.insertIf, 500);
  await type('l < n and a[l] > a[largest]');
  await wait(400);
  await move('j', text.intoTrue);
  await step('Enter', text.edit, 250);
  await type('largest = l');
  await step('Control+ArrowUp', text.upToIf, 600);
  await step('a i', text.insertIf, 500);
  await type('r < n and a[r] > a[largest]');
  await wait(300);
  await move('j', text.intoTrue);
  await step('Enter', text.edit, 250);
  await type('largest = r');
  await step('Control+ArrowUp', text.upToIf, 600);
  await step('a i', text.insertIf, 500);
  await type('largest == i');
  await wait(300);
  await move('j', text.intoTrue);
  await step('Enter', text.edit, 250);
  await type(`break    # ${words.heapOrderHolds}`);
  await step('Control+ArrowUp', text.upToIf, 600);
  await step('o', text.newAfter, 300);
  await type('a[i], a[largest] = a[largest], a[i]');
  await step('o', text.newAfter, 300);
  await type('i = largest');
  // Extract the While into a new Method.
  for (let i = 0; i < 6; i += 1) await step('Control+ArrowUp', text.up, 220);
  await step('k', text.upToWhile, 600);
  await wait(400);
  await step('m', text.extract, 700);
  await type('sift_down(a, i, n)');
  await wait(800);
  // The second loop: after the first one.
  await step('Control+ArrowUp', text.upToFor, 600);
  await step('a f', text.insertFor, 700);
  await type('for end in range(n - 1, 0, -1)');
  await move('j', text.intoBody);
  await step('Enter', text.edit, 250);
  await type(`a[0], a[end] = a[end], a[0]    # ${words.largestToBack}`);
  await step('a c', text.insertCall, 700);
  await step('2', text.callSift, 500);
  await page.keyboard.press('Control+a');
  await type('a, 0, end');
  await wait(600);
  // The whole drawing.
  for (let i = 0; i < 6; i += 1) await step('-', text.zoomOut, 200);
  await wait(600);
}

/**
 * The mouse version: the same drawing, every command by a click (toolbar, menu bar, context menu)
 * and each text field opened by a double-click. Only the text itself is typed; a field is
 * accepted by the next click elsewhere (the field accepts its text when it loses focus).
 */
async function byMouse(page, wait) {
  let at = { x: size - 40, y: size / 2 };
  /** Moves the mouse in visible steps (ease in and out). */
  const glide = async (x, y, ms = 420) => {
    const from = at;
    const count = Math.max(8, Math.round(ms / 20));
    for (let i = 1; i <= count; i += 1) {
      const t = i / count;
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      await page.mouse.move(from.x + (x - from.x) * eased, from.y + (y - from.y) * eased);
      await wait(ms / count);
    }
    at = { x, y };
  };
  /** The middle of a locator or a point, waiting until the element is drawn and still. */
  const pointOf = async (target) => {
    if (!('boundingBox' in target)) return target;
    await target.waitFor({ state: 'visible' });
    let last = null;
    for (let tries = 0; tries < 30; tries += 1) {
      const box = await target.boundingBox();
      if (box !== null && last !== null && box.x === last.x && box.y === last.y) {
        return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      }
      last = box;
      await wait(40);
    }
    throw new Error('the element did not settle');
  };
  /** Moves to the target and clicks it; the pill shows the action and `label` (null: none). */
  const click = async (
    target,
    label,
    { button = 'left', double = false, count = 1, pause = 500 } = {},
  ) => {
    const point = await pointOf(target);
    await glide(point.x, point.y);
    await wait(120);
    if (label !== null) {
      const action = double
        ? text.doubleClick
        : count === 3
          ? text.tripleClick
          : button === 'right'
            ? text.rightClick
            : text.click;
      await page.evaluate(([k, l]) => window.promoKeys(k, l, 1900), [[action], label]);
    }
    if (double) await page.mouse.dblclick(point.x, point.y);
    else await page.mouse.click(point.x, point.y, { button, clickCount: count });
    await wait(pause);
  };
  /** Moves onto a menu row and rests there (opens a submenu). */
  const hover = async (target) => {
    const point = await pointOf(target);
    await glide(point.x, point.y, 380);
    await wait(380);
    return point;
  };
  mouseState.click = click;
  mouseState.glide = glide;

  /** Typing: fast, no overlay; the next click accepts the field. */
  const type = async (typed) => {
    await page.keyboard.type(typed, { delay: 22 });
    await wait(300);
  };
  const drawn = (start) =>
    page
      .locator('.ans-document text')
      .filter({ hasText: new RegExp(`^${start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) })
      .first();
  /**
   * The empty block right below a drawn text (a loop body, or an If's true branch on the left):
   * the nearest text-less block under it that overlaps it sideways. `null`: any empty block; a
   * locator (the open text field) instead of the text: below that.
   */
  const emptyBelow = async (start) => {
    let box = { x: 0, y: 0, width: size * 4, height: 0 };
    if (start !== null) {
      const anchor = typeof start === 'string' ? drawn(start) : start;
      await pointOf(anchor);
      box = await anchor.boundingBox();
    }
    const point = await page.evaluate((anchor) => {
      const texts = [...document.querySelectorAll('.ans-document text')].map((t) =>
        t.getBoundingClientRect(),
      );
      const empty = [...document.querySelectorAll('.ans-document rect')]
        .map((r) => r.getBoundingClientRect())
        .filter((r) => r.height > 10 && r.height < 120)
        .filter(
          (r) =>
            !texts.some((t) => {
              const cx = t.x + t.width / 2;
              const cy = t.y + t.height / 2;
              return cx > r.left && cx < r.right && cy > r.top && cy < r.bottom;
            }),
        )
        .filter((r) => r.top >= anchor.y + anchor.height - 2)
        .filter((r) => r.left < anchor.x + anchor.width && r.right > anchor.x)
        .sort((a, b) => a.top - b.top || a.left - b.left);
      const best = empty[0];
      return best === undefined
        ? null
        : { x: best.left + Math.min(60, best.width / 2), y: best.top + best.height / 2 };
    }, box);
    if (point === null) throw new Error(`no empty block below ${start}`);
    return point;
  };
  const field = page.locator('.ans-inline-editor');
  const tool = (id) => page.locator(`[data-command="${id}"]`).first();
  const menuItem = (start) =>
    page
      .locator('[role=menuitem]')
      .filter({ hasText: new RegExp(`^${start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) })
      .first();
  const app = text.app;
  const viaToolbar = (block) => `${text.toolbar} › ${block}`;
  const viaMenu = (...path) => [text.menu, ...path].join(' › ');
  /** Diagram › Insert › <item>, by the menu bar. */
  const insertFromMenu = async (item) => {
    await click(page.locator('.ans-menu-button').filter({ hasText: app.diagramMenu }), null, {
      pause: 300,
    });
    const row = await hover(menuItem(app.insert));
    const target = await pointOf(menuItem(item));
    await glide(target.x, row.y, 300);
    await click(menuItem(item), viaMenu(app.diagramMenu, app.insert, item), { pause: 700 });
  };

  await wait(1200);
  // heap_sort: a Method header on the empty diagram, then the first line.
  const first = await emptyBelow(null); // the only block of the empty document
  await click(first, `${text.click}`, { pause: 300 });
  await click(page.locator('.ans-menu-button').filter({ hasText: app.diagramMenu }), null, {
    pause: 300,
  });
  await click(menuItem(app.addMethodHeader), viaMenu(app.diagramMenu, app.addMethodHeader), {
    pause: 500,
  });
  await type('heap_sort(a)');
  await click(await emptyBelow(field), text.edit, { double: true, pause: 300 });
  await type('n = len(a)');
  // The first loop: the For (not on the toolbar) from the menu bar, then its body.
  await insertFromMenu(app.for);
  await type('for i in range(n // 2 - 1, -1, -1)');
  await click(await emptyBelow(field), text.intoBody, { pause: 300 });
  await click(tool('block.insert.while'), viaToolbar('While'), { pause: 600 });
  await type('True');
  await click(await emptyBelow(field), text.edit, { double: true, pause: 300 });
  await type('largest = i');
  await click(tool('block.insert.process'), viaToolbar(app.process), { pause: 400 });
  await type('l, r = 2 * i + 1, 2 * i + 2');
  await click(tool('block.insert.if'), viaToolbar('If'), { pause: 500 });
  await type('l < n and a[l] > a[largest]');
  await click(await emptyBelow(field), text.intoTrue, { double: true, pause: 300 });
  await type('largest = l');
  await click(drawn('l < n and'), text.upToIf, { pause: 400 });
  await click(tool('block.insert.if'), viaToolbar('If'), { pause: 500 });
  await type('r < n and a[r] > a[largest]');
  await click(await emptyBelow(field), text.intoTrue, { double: true, pause: 300 });
  await type('largest = r');
  await click(drawn('r < n and'), text.upToIf, { pause: 400 });
  await click(tool('block.insert.if'), viaToolbar('If'), { pause: 500 });
  await type('largest == i');
  await click(await emptyBelow(field), text.intoTrue, { double: true, pause: 300 });
  await type(`break    # ${words.heapOrderHolds}`);
  await click(drawn('largest == i'), text.upToIf, { pause: 400 });
  await click(tool('block.insert.process'), viaToolbar(app.process), { pause: 400 });
  await type('a[i], a[largest] = a[largest], a[i]');
  await click(tool('block.insert.process'), viaToolbar(app.process), { pause: 400 });
  await type('i = largest');
  // Extract the While into a new Method, from its context menu.
  await click(drawn('True'), 'While', { button: 'right', pause: 500 });
  await click(menuItem(app.extract), `${text.contextMenu} › ${app.extract}`, { pause: 700 });
  await type('sift_down(a, i, n)');
  await wait(500);
  // The second loop: after the first one.
  await click(drawn('for i in range'), text.upToFor, { pause: 400 });
  await insertFromMenu(app.for);
  await type('for end in range(n - 1, 0, -1)');
  await click(await emptyBelow(field), text.edit, { double: true, pause: 300 });
  await type(`a[0], a[end] = a[end], a[0]    # ${words.largestToBack}`);
  // The call: the menu bar (a right-click on the block would land in its open text field).
  await insertFromMenu(app.call);
  await click(menuItem('sift_down'), text.callSift, {
    pause: 500,
  });
  // The arguments field opens with the Method's own ("a, i, n"): select them all to replace them.
  await click(field, text.selectArgs, { count: 3, pause: 300 });
  await page.keyboard.type('a, 0, end', { delay: 22 });
  await wait(600);
  // The whole drawing: Zoom Out from the toolbar's zoom menu.
  for (let i = 0; i < 6; i += 1) {
    await click(page.locator('.ans-tool').filter({ hasText: /%$/ }), null, { pause: 250 });
    await click(menuItem(app.zoomOut), `${text.toolbar} › ${text.zoomMenu} › ${app.zoomOut}`, {
      pause: 250,
    });
  }
  await wait(600);
}
