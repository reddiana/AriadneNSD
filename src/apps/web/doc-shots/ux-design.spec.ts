// The pictures of the UX design documents (docs/02-ux-design/*.md), taken in the real app with
// the Korean screen at twice the CSS pixels (playwright.doc-shots.config.ts). Each scene is a
// document opened through a share link (`#ns1.u.`), so it is the same every run; the examples
// are read out of the app first (File › Copy Share Link) and then changed (syntax, folds, peeks).
// Headers are drawn "as a title" (the new document's header shape) except where the picture is
// about the header shapes. Output: docs/02-ux-design/assets/<name>.png, which are committed.
//   pnpm --filter @ariadne-nsd/web doc-shots
import { inflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

import type { Browser, CDPSession, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import { drawnText, openApp, skipWelcome } from '../e2e/support';

const assets = new URL('../../../../docs/02-ux-design/assets/', import.meta.url);

function assetPath(name: string): string {
  return fileURLToPath(new URL(name, assets));
}

// ---------------------------------------------------------------------------------------------
// Models

type Json = Record<string, unknown>;
type Model = {
  settings: Json;
  diagrams: { id: string; head?: Json; body: Json[]; folds?: Json[] }[];
  view: { folded: string[]; opened: string[][]; bands: boolean; resultSymbol: string };
} & Json;

let blockId = 0;
function id(prefix: string): string {
  blockId += 1;
  return `${prefix}${String(blockId)}`;
}
function proc(text: string): Json {
  return { id: id('b'), kind: 'process', text };
}
function loop(kind: 'while' | 'doWhile' | 'for', text: string, body: Json[]): Json {
  return { id: id('b'), kind, text, body };
}
function ifBlock(text: string, yes: Json[], no: Json[]): Json {
  return {
    id: id('b'),
    kind: 'if',
    text,
    yes: { id: id('r'), body: yes },
    no: { id: id('r'), body: no },
  };
}
function caseBlock(text: string, arms: ReadonlyArray<readonly [string, Json[]]>): Json {
  const branches = arms.filter(([label]) => label !== 'default');
  const fallback = arms.find(([label]) => label === 'default');
  return {
    id: id('b'),
    kind: 'case',
    text,
    arms: branches.map(([label, body]) => ({ id: id('r'), label, body })),
    ...(fallback === undefined ? {} : { otherwise: { id: id('r'), body: fallback[1] } }),
  };
}

function model(
  diagrams: Model['diagrams'],
  settings: Json = {},
  view: Partial<Model['view']> = {},
): Model {
  return {
    format: 'ariadne-nsd',
    version: 1,
    settings: {
      textKind: 'plain',
      theme: 'default',
      headStyle: 'title',
      locale: 'ko',
      ...settings,
    },
    diagrams,
    view: { folded: [], opened: [], bands: true, resultSymbol: '←', ...view },
  };
}

/** A copy of an example as the app builds it (Korean, header as the user chose: "title"). */
async function exampleModel(browser: Browser, exampleId: string): Promise<Model> {
  const context = await browser.newContext({ locale: 'ko-KR' });
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const page = await context.newPage();
  await openApp(page);
  await page.locator('.ans-toolbar [data-command="help.examples"]').click();
  await page.locator(`[data-example="${exampleId}"]`).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: '파일' }).click();
  await page.getByRole('menuitem', { name: '공유 링크 복사' }).click();
  await expect(page.locator('.ans-statusbar')).toContainText('공유 링크');
  const link = await page.evaluate(() => navigator.clipboard.readText());
  await context.close();
  const packed = link.split('#ns1.d.')[1] ?? '';
  const envelope = JSON.parse(
    inflateRawSync(Buffer.from(packed, 'base64url')).toString('utf8'),
  ) as {
    model: Model;
  };
  return envelope.model;
}

/** Every block, branch and fold region of a model, depth first. */
function walk(value: unknown, visit: (node: Json) => void): void {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit);
    return;
  }
  if (value !== null && typeof value === 'object') {
    visit(value as Json);
    for (const child of Object.values(value)) walk(child, visit);
  }
}

function find(m: Model, test: (node: Json) => boolean): Json {
  let found: Json | undefined;
  walk(m.diagrams, (node) => {
    if (found === undefined && test(node)) found = node;
  });
  if (found === undefined) throw new Error('no such node in the model');
  return found;
}

// ---------------------------------------------------------------------------------------------
// The app

/** Opens `m` in the editor (a share link opens in view mode; "편집하기" leaves it). */
async function openModel(page: Page, m: Model, name = '예제.ns.svg'): Promise<void> {
  await skipWelcome(page);
  const envelope = JSON.stringify({ name, model: m });
  // A fresh load each time: on an open page a new fragment is a hash change, not a new start.
  await page.goto('about:blank');
  await page.goto(`./#ns1.u.${encodeURIComponent(envelope)}`);
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await page.locator('.ans-viewbar').getByRole('button', { name: '편집하기' }).click();
  await expect(page.locator('.ans-toolbar')).toBeVisible();
  await settle(page);
}

/** Waits for the fonts and a redraw, and parks the mouse where it shows no hover. */
async function settle(page: Page): Promise<void> {
  await page.mouse.move(page.viewportSize()?.width ?? 0, 300);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(350);
}

/** Lets go of the selection (Esc twice). */
async function deselect(page: Page): Promise<void> {
  await page.locator('.ans-canvas[tabindex]').focus();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await page.locator('.ans-canvas[tabindex]').evaluate((element) => {
    (element as HTMLElement).blur();
  });
}

async function select(page: Page, text: string): Promise<void> {
  await drawnText(page, text).click();
}

type Box = { x: number; y: number; width: number; height: number };

async function boxOf(page: Page, selector: string): Promise<Box> {
  const box = await page.locator(selector).first().boundingBox();
  if (box === null) throw new Error(`${selector} is not on the screen`);
  return box;
}

function union(...boxes: ReadonlyArray<Box>): Box {
  const x = Math.min(...boxes.map((b) => b.x));
  const y = Math.min(...boxes.map((b) => b.y));
  const right = Math.max(...boxes.map((b) => b.x + b.width));
  const bottom = Math.max(...boxes.map((b) => b.y + b.height));
  return { x, y, width: right - x, height: bottom - y };
}

function grow(box: Box, pad: number): Box {
  return {
    x: Math.floor(box.x - pad),
    y: Math.floor(box.y - pad),
    width: Math.ceil(box.width + 2 * pad),
    height: Math.ceil(box.height + 2 * pad),
  };
}

/**
 * The paper (`.ans-document`) has a 24px margin around the drawing (04-visual-design 5). Diagram
 * pictures keep 12px of it: white all round, the same in every picture.
 */
const paperTrim = 12;

/** Saves the drawing on its paper, with the common white margin. */
async function drawingShot(page: Page, name: string): Promise<Box> {
  await settle(page);
  const clip = grow(await boxOf(page, '.ans-document'), -paperTrim);
  await page.screenshot({ path: assetPath(name), clip });
  return clip;
}

/** The margin of a picture that shows the paper on the canvas (with a hint or a pointer). */
const canvasPad = 16;

/** Saves the paper and what floats over it on the canvas, with the common margin. */
async function canvasShot(page: Page, name: string, extra: ReadonlyArray<Box> = []): Promise<Box> {
  await settle(page);
  const clip = grow(union(await boxOf(page, '.ans-document'), ...extra), canvasPad);
  await page.screenshot({ path: assetPath(name), clip });
  return clip;
}

// ---------------------------------------------------------------------------------------------
// The scenes

test.use({ viewport: { width: 1366, height: 900 } });

test('the code example, the header shapes and the document layer', async ({ page, browser }) => {
  const timer = await exampleModel(browser, 'timer-interrupt');
  timer.settings.textKind = 'c';
  const writeLog = find(timer, (n) => n.name === '로그 남기기');
  timer.view.folded = [String(writeLog.id)];
  // 4.1: the code example, nothing selected.
  await openModel(page, timer);
  await deselect(page);
  await drawingShot(page, 'visual-design-code.png');

  // 7: the "true" branch of the first If folded.
  const firstIf = find(timer, (n) => n.kind === 'if');
  const yes = firstIf.yes as Json;
  await openModel(page, {
    ...timer,
    view: { ...timer.view, folded: [...timer.view.folded, String(yes.id)] },
  });
  await deselect(page);
  await drawingShot(page, 'visual-design-folded.png');

  // 7: the editing layer: one block, a range, editing a text.
  await openModel(page, timer);
  await page
    .locator('.ans-document text')
    .filter({ hasText: /^btn_read/ })
    .first()
    .click();
  await drawingShot(page, 'visual-design-select-one.png');
  await select(page, 'tick++;');
  await page.keyboard.press('v');
  await page.keyboard.press('j');
  await drawingShot(page, 'visual-design-select-range.png');
  await page.keyboard.press('Escape');
  await deselect(page);
  await select(page, 'tick++;');
  await page.keyboard.press('i');
  await page.keyboard.press('End');
  await drawingShot(page, 'visual-design-editing.png');
  await page.keyboard.press('Escape');
});

test('the focus ring when nothing is selected', async ({ page, browser }) => {
  const timer = await exampleModel(browser, 'timer-interrupt');
  timer.settings.textKind = 'c';
  await openModel(page, timer);
  await deselect(page);
  // Reach the canvas with the keyboard, so the ring is the :focus-visible one.
  await page.keyboard.press('Shift');
  await page.locator('.ans-canvas[tabindex]').focus();
  await settle(page);
  const canvas = await boxOf(page, '.ans-canvas');
  await page.screenshot({
    path: assetPath('visual-design-focus-none.png'),
    clip: { x: canvas.x, y: canvas.y, width: 560, height: 360 },
  });
});

test('quicksort: header shapes, the document layer, color vision', async ({ page, browser }) => {
  const quick = await exampleModel(browser, 'quicksort');
  quick.settings.textKind = 'c';
  // 4.1: the same quicksort with both header shapes.
  await openModel(page, { ...quick, settings: { ...quick.settings, headStyle: 'shape' } });
  await deselect(page);
  await drawingShot(page, 'visual-design-head-shape.png');
  await openModel(page, quick);
  await deselect(page);
  await drawingShot(page, 'visual-design-head-title.png');

  // 7: a peeked call block and a fold region "준비" in partition.
  const partition = quick.diagrams[1];
  if (partition === undefined) throw new Error('quicksort has no partition');
  const [first, , third] = partition.body;
  partition.folds = [{ id: 'f90', first: first?.id, last: third?.id, name: '준비' }];
  const call = find(quick, (n) => n.kind === 'call');
  await openModel(page, { ...quick, view: { ...quick.view, opened: [[String(call.id)]] } });
  await deselect(page);
  await drawingShot(page, 'visual-design-document-marks.png');

  // 3.4: the whole screen, light and dark screen colors (the paper keeps its theme).
  partition.folds = [];
  await page.setViewportSize({ width: 1366, height: 657 });
  await openModel(page, quick, '퀵소트.ns.svg');
  await select(page, 'j < hi');
  await settle(page);
  await page.screenshot({ path: assetPath('visual-design-screen-light.png') });
  await page.emulateMedia({ colorScheme: 'dark' });
  await settle(page);
  await page.screenshot({ path: assetPath('visual-design-screen-dark.png') });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.setViewportSize({ width: 1366, height: 900 });

  // 10.2: color vision (Chrome's vision deficiency emulation).
  await openModel(page, quick);
  await deselect(page);
  const cdp: CDPSession = await page.context().newCDPSession(page);
  for (const [type, name] of [
    ['achromatopsia', 'grayscale'],
    ['deuteranopia', 'deuteranopia'],
    ['protanopia', 'protanopia'],
    ['tritanopia', 'tritanopia'],
  ] as const) {
    await cdp.send('Emulation.setEmulatedVisionDeficiency', { type });
    await drawingShot(page, `visual-design-vision-${name}.png`);
  }
  await cdp.send('Emulation.setEmulatedVisionDeficiency', { type: 'none' });
});

test('Case and its branch label', async ({ page, browser }) => {
  const uart = await exampleModel(browser, 'uart-case');
  uart.settings.textKind = 'c';
  await openModel(page, uart);
  await deselect(page);
  await drawingShot(page, 'visual-design-case.png');
  await select(page, 'CMD_STOP');
  await drawingShot(page, 'interaction-branch-label.png');
});

test('the key hint', async ({ page }) => {
  const m = model([
    {
      id: 'd1',
      head: { kind: 'method', text: '평균(a, n)' },
      body: [
        proc('합 ← 0'),
        loop('for', 'i ← 0 to n − 1', [proc('합 ← 합 + a[i]')]),
        proc('평균 ← 합 / n'),
      ],
    },
  ]);
  await openModel(page, m, '평균.ns.svg');
  await select(page, '합 ← 0');
  await page.keyboard.press('a');
  await expect(page.locator('.ans-keyhint')).toBeVisible();
  await page.waitForTimeout(300);
  await canvasShot(page, 'visual-design-key-hint.png', [await boxOf(page, '.ans-keyhint')]);
  await page.keyboard.press('Escape');
});

test('Shift+click extends the selection to the same parent', async ({ page }) => {
  const m = model([
    {
      id: 'd1',
      body: [proc('A'), proc('B'), loop('while', '조건', [proc('C'), proc('D')]), proc('E')],
    },
  ]);
  await openModel(page, m, '선택.ns.svg');
  await select(page, 'A');
  await settle(page);
  // The pointer and its "Shift+클릭" tag, where the next click goes (on C).
  const c = await drawnText(page, 'C').boundingBox();
  if (c === null) throw new Error('C is not on the screen');
  const at = { x: c.x + 90, y: c.y + c.height / 2 };
  await page.evaluate(({ x, y }) => {
    const mark = document.createElement('div');
    mark.id = 'doc-shot-pointer';
    mark.style.cssText = `position:fixed;left:${String(x)}px;top:${String(y)}px;z-index:99;pointer-events:none;display:flex;align-items:flex-start;gap:4px`;
    mark.innerHTML =
      '<svg width="18" height="26" viewBox="0 0 18 26"><path d="M1 1 L1 20 L6 15.5 L9.5 24 L13 22.5 L9.6 14.2 L16 14 Z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>' +
      '<span style="margin-top:14px;padding:3px 8px;border-radius:6px;background:#2b3240;color:#fff;font:600 13px/1.3 system-ui,sans-serif;white-space:nowrap">Shift+클릭</span>';
    document.body.append(mark);
  }, at);
  const pointer = await boxOf(page, '#doc-shot-pointer');
  const clip = await canvasShot(page, 'interaction-multiselect-1.png', [pointer]);
  await page.evaluate(() => document.getElementById('doc-shot-pointer')?.remove());
  await drawnText(page, 'C').click({ modifiers: ['Shift'] });
  await settle(page);
  await page.screenshot({ path: assetPath('interaction-multiselect-2.png'), clip });
});

test('the command palette', async ({ page }) => {
  const m = model([{ id: 'd1', body: [proc('처리')] }]);
  await openModel(page, m);
  await select(page, '처리');
  await page.keyboard.press('Control+Shift+P');
  await page.keyboard.type('감싸');
  await page.waitForTimeout(200);
  await settle(page);
  await page.screenshot({
    path: assetPath('command-palette.png'),
    clip: grow(await boxOf(page, '.ans-palette'), 8),
  });
});

test('the four themes', async ({ page }) => {
  const sample = (theme: string): Model =>
    model(
      [
        {
          id: 'd1',
          head: { kind: 'method', text: '합계(a, n)' },
          body: [
            proc('합계 ← 0'),
            loop('while', 'i < n', [
              ifBlock('a[i] > 0', [proc('합계 ← 합계 + a[i]')], [proc('')]),
              proc('i ← i + 1'),
            ]),
            caseBlock('mode', [
              ['1', [proc('출력(합계)')]],
              ["'a'..'z'", [proc('')]],
              ['default', [proc('error')]],
            ]),
            loop('doWhile', 'retry > 0', [proc('retry ← retry − 1')]),
            loop('for', 'k ← 1 .. 10', [proc('print(k)')]),
          ],
        },
      ],
      { theme },
    );
  const shots: string[] = [];
  for (const theme of ['default', 'dark', 'high-contrast', 'print']) {
    blockId = 0;
    await openModel(page, sample(theme), '합계.ns.svg');
    await deselect(page);
    await settle(page);
    const clip = grow(await boxOf(page, '.ans-document'), -paperTrim);
    shots.push((await page.screenshot({ clip })).toString('base64'));
  }
  const labels = ['밝은 테마', '어두운 테마', '고대비', '흑백 인쇄'];
  await page.setContent(
    `<style>body{margin:0;background:#fff;font:500 13px/1.4 "Malgun Gothic",system-ui,sans-serif;color:#3b4252}
      .row{display:inline-flex;gap:16px;padding:12px}figure{margin:0;text-align:center}
      img{display:block;border:1px solid #d5dae2;border-radius:4px}figcaption{margin-top:6px}</style>
     <div class="row">${shots
       .map(
         (data, index) =>
           `<figure><img src="data:image/png;base64,${data}" onload="this.style.width=this.naturalWidth/2+'px'"><figcaption>${labels[index] ?? ''}</figcaption></figure>`,
       )
       .join('')}</div>`,
  );
  await page.waitForTimeout(300);
  await page.locator('.row').screenshot({ path: assetPath('visual-design-themes.png') });
});

// ---------------------------------------------------------------------------------------------
// The screen layout (05-screen-layout): the app with each part outlined and numbered

type Callout = {
  readonly n: number;
  readonly color: string;
  readonly boxes: ReadonlyArray<Box>;
  /** Where the number sits: in the margin above, right or left of the picture. */
  readonly side: 'top' | 'right' | 'left';
  /** The badge's x (top) or y (right, left) in page coordinates; the outline's middle if left out. */
  readonly at?: number;
};

type Margins = {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
};

const badgeRadius = 20;

/** Puts outlines, leader lines and number badges around a screenshot, in a margin of its own. */
async function annotate(
  page: Page,
  png: Buffer,
  size: { width: number; height: number },
  callouts: ReadonlyArray<Callout>,
  margins: Margins,
  name: string,
): Promise<void> {
  const width = margins.left + size.width + margins.right;
  const height = margins.top + size.height + margins.bottom;
  const shapes: string[] = [];
  for (const callout of callouts) {
    const rects = callout.boxes.map((box) => ({
      x: margins.left + box.x,
      y: margins.top + box.y,
      width: box.width,
      height: box.height,
    }));
    for (const r of rects)
      shapes.push(
        `<rect x="${String(r.x)}" y="${String(r.y)}" width="${String(r.width)}" height="${String(r.height)}" rx="4" fill="none" stroke="${callout.color}" stroke-width="2.5"/>`,
      );
    const first = rects[0];
    if (first === undefined) continue;
    let cx: number;
    let cy: number;
    let from: { x: number; y: number };
    let to: { x: number; y: number };
    if (callout.side === 'top') {
      cx = margins.left + (callout.at ?? first.x - margins.left + first.width / 2);
      cy = margins.top / 2;
      from = { x: cx, y: cy + badgeRadius };
      to = { x: cx, y: first.y };
    } else {
      cy = margins.top + (callout.at ?? first.y - margins.top + first.height / 2);
      if (callout.side === 'right') {
        cx = margins.left + size.width + margins.right / 2;
        from = { x: cx - badgeRadius, y: cy };
        to = { x: first.x + first.width, y: cy };
      } else {
        cx = margins.left / 2;
        from = { x: cx + badgeRadius, y: cy };
        to = { x: first.x, y: cy };
      }
    }
    shapes.push(
      `<line x1="${String(from.x)}" y1="${String(from.y)}" x2="${String(to.x)}" y2="${String(to.y)}" stroke="${callout.color}" stroke-width="2"/>`,
      `<circle cx="${String(to.x)}" cy="${String(to.y)}" r="3.5" fill="${callout.color}"/>`,
      `<circle cx="${String(cx)}" cy="${String(cy)}" r="${String(badgeRadius)}" fill="${callout.color}"/>`,
      `<text x="${String(cx)}" y="${String(cy)}" dy="0.36em" text-anchor="middle" fill="#fff" font-family="Segoe UI, Arial, sans-serif" font-weight="700" font-size="24">${String(callout.n)}</text>`,
    );
  }
  await page.setViewportSize({ width, height });
  await page.setContent(
    `<style>html,body{margin:0;background:#fff}</style>
     <div style="position:relative;width:${String(width)}px;height:${String(height)}px">
       <img src="data:image/png;base64,${png.toString('base64')}" style="position:absolute;left:${String(margins.left)}px;top:${String(margins.top)}px;width:${String(size.width)}px;height:${String(size.height)}px;box-shadow:0 0 0 1px #d5dae2">
       <svg style="position:absolute;left:0;top:0" width="${String(width)}" height="${String(height)}">${shapes.join('')}</svg>
     </div>`,
  );
  await page.waitForTimeout(200);
  await page.screenshot({ path: assetPath(name) });
}

/** The boxes of the toolbar's block icons, one box per row they wrap to. */
async function blockIconRows(page: Page): Promise<Box[]> {
  const rows = new Map<number, Box[]>();
  for (const icon of await page.locator('.ans-toolbar [data-command^="block.insert."]').all()) {
    const box = await icon.boundingBox();
    if (box !== null) rows.set(Math.round(box.y), [...(rows.get(Math.round(box.y)) ?? []), box]);
  }
  return [...rows.values()].map((row) => union(...row));
}

const bubbleSort = (): Model =>
  model([
    {
      id: 'd1',
      head: { kind: 'method', text: '버블 정렬(a, n)' },
      body: [
        loop('for', 'i ← 0 to n − 2', [
          loop('for', 'j ← 0 to n − 2 − i', [
            ifBlock('a[j] > a[j + 1]', [proc('a[j]와 a[j + 1]을 바꾼다')], [proc('')]),
          ]),
        ]),
        proc('a를 출력한다'),
      ],
    },
  ]);

const colors = {
  menu: '#e03131',
  file: '#7048e8',
  toolbar: '#1971c2',
  blocks: '#2f9e44',
  canvas: '#c2255c',
  status: '#0c8599',
};

test('the screen layout, laptop', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 657 });
  await openModel(page, bubbleSort(), '버블 정렬.ns.svg');
  await select(page, 'a를 출력한다');
  await settle(page);
  const menu = grow(union(await boxOf(page, '.ans-brand'), await boxOf(page, '.ans-menus')), 3);
  const file = grow(await boxOf(page, '.ans-file-name'), 3);
  const toolbar = grow(await boxOf(page, '.ans-toolbar'), -2);
  const blocks = (await blockIconRows(page)).map((row) => grow(row, 3));
  const canvas = grow(await boxOf(page, '.ans-canvas'), -2);
  const status = grow(await boxOf(page, '.ans-statusbar'), -2);
  const png = await page.screenshot();
  await annotate(
    page,
    png,
    { width: 1366, height: 657 },
    [
      { n: 1, color: colors.menu, boxes: [menu], side: 'top' },
      { n: 2, color: colors.file, boxes: [file], side: 'top' },
      { n: 3, color: colors.toolbar, boxes: [toolbar], side: 'right' },
      { n: 4, color: colors.blocks, boxes: blocks, side: 'top' },
      { n: 5, color: colors.canvas, boxes: [canvas], side: 'right' },
      { n: 6, color: colors.status, boxes: [status], side: 'right' },
    ],
    { top: 72, right: 72, bottom: 16, left: 16 },
    'web-screen-layout-annotated.png',
  );
});

test('the screen layout, phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openModel(page, bubbleSort(), '버블 정렬.ns.svg');
  await select(page, 'a를 출력한다');
  await settle(page);
  const menu = grow(await boxOf(page, '.ans-hamburger'), 3);
  const file = grow(await boxOf(page, '.ans-file-name'), 3);
  const toolbar = grow(await boxOf(page, '.ans-toolbar'), -2);
  // The block icons wrap: the longest row first, so the number points at it.
  const blocks = (await blockIconRows(page))
    .map((row) => grow(row, 3))
    .sort((a, b) => b.width - a.width);
  const canvas = grow(await boxOf(page, '.ans-canvas'), -2);
  const status = grow(await boxOf(page, '.ans-statusbar'), -2);
  const png = await page.screenshot();
  await annotate(
    page,
    png,
    { width: 390, height: 844 },
    [
      { n: 1, color: colors.menu, boxes: [menu], side: 'top' },
      { n: 2, color: colors.file, boxes: [file], side: 'top' },
      { n: 3, color: colors.toolbar, boxes: [toolbar], side: 'right' },
      { n: 4, color: colors.blocks, boxes: blocks, side: 'left' },
      { n: 5, color: colors.canvas, boxes: [canvas], side: 'right' },
      { n: 6, color: colors.status, boxes: [status], side: 'right' },
    ],
    { top: 72, right: 72, bottom: 16, left: 72 },
    'web-screen-layout-annotated-phone.png',
  );
});
