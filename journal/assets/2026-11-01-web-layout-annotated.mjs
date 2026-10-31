// 화면 배치(docs/02-ux-design/05-screen-layout.md)의 주석 단 스크린숏을 MVP 화면에서 찍는다 (2026-11-01)
// 실제 화면 위에 부분마다 색 테두리와 번호 딱지(①②③…)를 얹는다. 테두리의 자리는 그 부분의 DOM 위치
// (getBoundingClientRect)에서 읽으므로, 화면이 바뀌어도 다시 찍기만 하면 맞는다.
// 쓰는 법: src/에서 `pnpm build` 뒤
//   node journal/assets/2026-11-01-web-layout-annotated.mjs [src/apps/web/dist] [docs/02-ux-design/assets]
// 빌드한 앱을 이 스크립트가 띄우는 작은 정적 서버로 연다. Playwright는 src/apps/web의 것을 쓴다.
// 찍는 것: 노트북 브라우저(1366 × 657)와 휴대폰(390 × 844), 둘 다 한국어 화면, 2배 해상도
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = join(here, '..', '..');
const require = createRequire(join(root, 'src', 'apps', 'web', 'package.json'));
const { chromium } = require('@playwright/test');

const [dist = join(root, 'src', 'apps', 'web', 'dist'), out = join(root, 'docs', '02-ux-design', 'assets')] =
  process.argv.slice(2);

// --- 빌드한 앱을 띄우는 정적 서버 ---
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.wasm': 'application/wasm', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.json': 'application/json',
};
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = normalize(join(dist, path));
  if (!file.startsWith(normalize(dist))) { res.writeHead(403).end(); return; }
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(dist, 'index.html');
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/`;

// --- 예제 문서: 2026-11-01-mvp-shots.mjs의 버블 정렬 예제를 줄인 것 ---
const example = {
  format: 'ariadne-nsd',
  version: 1,
  settings: { textKind: 'plain', theme: 'default', headStyle: 'shape' },
  diagrams: [
    {
      id: 'd1',
      body: [
        { id: 'b1', kind: 'process', text: 'n ← 배열의 길이' },
        {
          id: 'b2', kind: 'for', text: 'i = 0 to n − 2',
          body: [
            {
              id: 'b3', kind: 'for', text: 'j = 0 to n − 2 − i',
              body: [
                {
                  id: 'b4', kind: 'if', text: 'a[j] > a[j + 1]',
                  yes: { id: 'r1', body: [{ id: 'b5', kind: 'process', text: 'a[j]와 a[j + 1]을 바꾼다' }] },
                  no: { id: 'r2', body: [{ id: 'b6', kind: 'process', text: '' }] },
                },
              ],
            },
          ],
        },
        {
          id: 'b11', kind: 'while', text: '입력이 남았다',
          body: [{ id: 'b12', kind: 'process', text: '한 줄을 읽는다' }],
        },
        { id: 'b13', kind: 'process', text: '배열을 출력한다' },
      ],
    },
  ],
  view: { folded: [], opened: [], bands: true, resultSymbol: '←' },
};
const exampleFile = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><metadata>',
  `<ans:document xmlns:ans="https://github.com/reddiana/AriadneNSD" version="1"><![CDATA[${JSON.stringify(example)}]]></ans:document>`,
  '</metadata></svg>',
].join('\n');

// --- 테두리와 번호 딱지 ---
// parts: { n: 번호, color, select: 그 부분의 CSS 선택자(여럿이면 모두를 감싸는 상자), badge: 딱지의 자리, inset: 테두리를 안으로 들이는 px }
// badge: 'right' = 상자 오른쪽 바깥 가운데, 'left' = 상자 왼쪽 안쪽 가운데, 'below' = 상자 아래 가운데, 'above' = 상자 위 가운데,
//        'in-tl' = 상자 안 왼쪽 위, 'in-tr' = 상자 안 오른쪽 위, 'in-br' = 상자 안 오른쪽 아래, 'in-r' = 상자 안 오른쪽 가운데
function annotate(parts) {
  const circled = '①②③④⑤⑥⑦⑧⑨';
  const layer = document.createElement('div');
  layer.id = 'shot-annotations';
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;';
  document.body.appendChild(layer);
  for (const part of parts) {
    const rects = part.select.flatMap((s) => [...document.querySelectorAll(s)])
      .map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0);
    if (rects.length === 0) throw new Error(`no element for part ${part.n}: ${part.select}`);
    const inset = part.inset ?? 1;
    // perRow: 줄이 바뀐 요소(휴대폰에서 두 줄로 접힌 툴바)는 줄마다 테두리를 따로 두르고, 딱지는 badgeRow 번째 줄에 단다
    const rows = part.perRow
      ? [...new Set(rects.map((r) => Math.round(r.top)))].map((t) => rects.filter((r) => Math.round(r.top) === t))
      : [rects];
    const boxes = rows.map((rs) => ({
      left: Math.min(...rs.map((r) => r.left)) + inset, top: Math.min(...rs.map((r) => r.top)) + inset,
      right: Math.max(...rs.map((r) => r.right)) - inset, bottom: Math.max(...rs.map((r) => r.bottom)) - inset,
    }));
    for (const b of boxes) {
      const frame = document.createElement('div');
      frame.style.cssText = `position:absolute;left:${b.left}px;top:${b.top}px;width:${b.right - b.left}px;height:${b.bottom - b.top}px;border:2.5px solid ${part.color};border-radius:5px;box-sizing:border-box;`;
      layer.appendChild(frame);
    }
    const box = boxes[part.badgeRow ?? 0];
    const size = 22;
    const cx = { right: box.right + 4, left: box.left + 4, below: (box.left + box.right) / 2 - size / 2, above: (box.left + box.right) / 2 - size / 2,
      'in-tl': box.left + 6, 'in-tr': box.right - size - 6, 'in-br': box.right - size - 6, 'in-r': box.right - size - 6 }[part.badge];
    const cy = { right: (box.top + box.bottom) / 2 - size / 2, left: (box.top + box.bottom) / 2 - size / 2, below: box.bottom + 3, above: box.top - size - 3,
      'in-tl': box.top + 6, 'in-tr': box.top + 6, 'in-br': box.bottom - size - 6, 'in-r': (box.top + box.bottom) / 2 - size / 2 }[part.badge];
    const badge = document.createElement('div');
    badge.textContent = circled[part.n - 1];
    badge.style.cssText = `position:absolute;left:${cx + (part.dx ?? 0)}px;top:${cy + (part.dy ?? 0)}px;width:${size}px;height:${size}px;border-radius:50%;background:${part.color};color:#fff;font:700 15px/22px system-ui,sans-serif;text-align:center;box-shadow:0 0 0 2px #fff;`;
    layer.appendChild(badge);
  }
}

const colors = ['#d9480f', '#7048e8', '#1971c2', '#2f9e44', '#c2255c', '#e67700', '#0c8599'];
const browser = await chromium.launch();

async function shoot(viewport, parts, file) {
  const context = await browser.newContext({ viewport, locale: 'ko-KR', deviceScaleFactor: 2, hasTouch: viewport.width < 600 });
  const page = await context.newPage();
  // 열기 창 대신 브라우저의 OPFS에 둔 예제 파일을 돌려준다.
  await page.addInitScript(() => {
    window.showOpenFilePicker = async () => [
      await (await navigator.storage.getDirectory()).getFileHandle('예제.ns.svg', { create: true }),
    ];
  });
  await page.goto(url);
  await page.locator('html[data-ready="true"]').waitFor();
  await page.evaluate(async (text) => {
    const handle = await (await navigator.storage.getDirectory()).getFileHandle('예제.ns.svg', { create: true });
    const writable = await handle.createWritable();
    await writable.write(text);
    await writable.close();
  }, exampleFile);
  await page.locator('[data-command="file.open"]').click();
  await page.locator('.ans-document text', { hasText: '한 줄을 읽는다' }).waitFor();
  // 블록 하나를 더해 저장 안 됨(●)이 보이게 하고, 그 블록을 선택한 채로 둔다
  await page.locator('.ans-document text', { hasText: '한 줄을 읽는다' }).click();
  await page.keyboard.press('o');
  await page.keyboard.type('줄 수를 센다');
  await page.keyboard.press('Enter');
  await page.mouse.move(viewport.width - 5, viewport.height / 2);   // 툴팁 · 호버가 남지 않게
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.evaluate(annotate, parts);
  await page.waitForTimeout(100);
  await page.screenshot({ path: join(out, file) });
  console.log('saved', file);
  await context.close();
}

const blocks = ['process', 'if', 'case', 'while', 'for', 'doWhile'].map((k) => `.ans-toolbar [data-command="block.insert.${k}"]`);

// 노트북 브라우저: ① 메뉴 바 ② 파일 이름과 ● ③ 툴바 ④ 블록 아이콘 ⑤ 캔버스 ⑥ 상태 표시줄
await shoot({ width: 1366, height: 657 }, [
  { n: 1, color: colors[0], select: ['.ans-brand', '.ans-menus'], badge: 'right', inset: -2 },
  { n: 2, color: colors[1], select: ['.ans-file-name'], badge: 'left', inset: -3, dx: -32 },
  { n: 3, color: colors[2], select: ['.ans-toolbar'], badge: 'in-r', inset: 2 },
  { n: 4, color: colors[3], select: blocks, badge: 'above', inset: -2, dy: 2 },
  { n: 5, color: colors[4], select: ['.ans-canvas'], badge: 'in-tr', inset: 4 },
  { n: 6, color: colors[5], select: ['.ans-statusbar'], badge: 'in-r', inset: 2 },
], 'web-screen-layout-annotated.png');

// 휴대폰: ① ☰ 메뉴 ② 파일 이름과 ● ③ 툴바 ④ 블록 아이콘 ⑤ 캔버스 ⑥ 상태 표시줄 ⑦ 아래 줄
await shoot({ width: 390, height: 844 }, [
  { n: 1, color: colors[0], select: ['.ans-hamburger'], badge: 'right', inset: -2 },
  { n: 2, color: colors[1], select: ['.ans-file-name'], badge: 'left', inset: -3, dx: -32 },
  { n: 3, color: colors[2], select: ['.ans-toolbar'], badge: 'in-br', inset: 1, dx: 4, dy: 6 },
  { n: 4, color: colors[3], select: blocks, badge: 'right', inset: -2, perRow: true },
  { n: 5, color: colors[4], select: ['.ans-canvas'], badge: 'in-br', inset: 4 },
  { n: 6, color: colors[5], select: ['.ans-statusbar'], badge: 'in-r', inset: 1 },
  { n: 7, color: colors[6], select: ['.ans-bottombar'], badge: 'in-tr', inset: 2 },
], 'web-screen-layout-annotated-phone.png');

await browser.close();
server.close();
