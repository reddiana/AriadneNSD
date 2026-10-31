// MVP 웹 앱의 화면을 실제 Chromium에서 찍는다 (2026-11-01, MVP 통합)
// 쓰는 법: src/에서 `pnpm build` 뒤 `pnpm --filter @ariadne-nsd/web preview --port 4173`을 띄워 두고
//   node journal/assets/2026-11-01-mvp-shots.mjs http://localhost:4173/ journal/assets
// 찍는 것: 빈 새 문서, 블록 여러 개인 예제, 커맨드 팔레트, 한국어 메뉴 (1366 × 657, 노트북 브라우저)
// Playwright는 src/apps/web의 것을 쓴다.
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(join(here, '..', '..', 'src', 'apps', 'web', 'package.json'));
const { chromium } = require('@playwright/test');

const [url = 'http://localhost:4173/', out = here] = process.argv.slice(2);
const viewport = { width: 1366, height: 657 };

// 예제: 버블 정렬과 결과 알리기. 블록 여섯 종류가 모두 들어 있다.
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
          id: 'b2',
          kind: 'for',
          text: 'i = 0 to n − 2',
          body: [
            {
              id: 'b3',
              kind: 'for',
              text: 'j = 0 to n − 2 − i',
              body: [
                {
                  id: 'b4',
                  kind: 'if',
                  text: 'a[j] > a[j + 1]',
                  yes: { id: 'r1', body: [{ id: 'b5', kind: 'process', text: 'a[j]와 a[j + 1]을 바꾼다' }] },
                  no: { id: 'r2', body: [{ id: 'b6', kind: 'process', text: '' }] },
                },
              ],
            },
          ],
        },
        {
          id: 'b7',
          kind: 'case',
          text: '결과',
          arms: [
            { id: 'r3', label: '정렬됨', body: [{ id: 'b8', kind: 'process', text: '배열을 출력한다' }] },
            { id: 'r4', label: '비었음', body: [{ id: 'b9', kind: 'process', text: '"빈 배열"을 알린다' }] },
          ],
          otherwise: { id: 'r5', body: [{ id: 'b10', kind: 'process', text: '오류를 남긴다' }] },
        },
        {
          id: 'b11',
          kind: 'while',
          text: '입력이 남았다',
          body: [{ id: 'b12', kind: 'process', text: '한 줄을 읽는다' }],
        },
        {
          id: 'b13',
          kind: 'doWhile',
          text: '다시 할까?',
          body: [{ id: 'b14', kind: 'process', text: '사용자에게 묻는다' }],
        },
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

const browser = await chromium.launch();

async function open(locale, withPickers = false) {
  const context = await browser.newContext({ viewport, locale, deviceScaleFactor: 1 });
  const page = await context.newPage();
  if (withPickers) {
    // 열기 창 대신 브라우저의 OPFS에 둔 예제 파일을 돌려준다.
    await page.addInitScript(() => {
      window.showOpenFilePicker = async () => [
        await (await navigator.storage.getDirectory()).getFileHandle('예제.ns.svg', { create: true }),
      ];
    });
  }
  await page.goto(url);
  await page.locator('html[data-ready="true"]').waitFor();
  return page;
}

// 1. 빈 새 문서 (영어 화면)
{
  const page = await open('en-US');
  await page.screenshot({ path: join(out, '2026-11-01-mvp-empty.png') });
}

// 2. 예제 (한국어 화면): 블록 여섯 종류, If 블록을 선택한 채
{
  const page = await open('ko-KR', true);
  await page.evaluate(async (text) => {
    const handle = await (await navigator.storage.getDirectory()).getFileHandle('예제.ns.svg', {
      create: true,
    });
    const writable = await handle.createWritable();
    await writable.write(text);
    await writable.close();
  }, exampleFile);
  await page.locator('[data-command="file.open"]').click();
  await page.locator('.ans-document text', { hasText: 'a[j] > a[j + 1]' }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(out, '2026-11-01-mvp-example.png') });

  // 4. 한국어 메뉴: 다이어그램 › 삽입
  await page.getByRole('button', { name: '다이어그램', exact: true }).click();
  await page.getByRole('menuitem', { name: '삽입', exact: true }).hover();
  await page.waitForTimeout(200);
  await page.screenshot({ path: join(out, '2026-11-01-mvp-menu-ko.png') });
}

// 3. 커맨드 팔레트 (영어 화면): "wrap"을 찾는 중
{
  const page = await open('en-US');
  await page.keyboard.press('Control+Shift+P');
  await page.keyboard.type('wrap');
  await page.waitForTimeout(200);
  await page.screenshot({ path: join(out, '2026-11-01-mvp-palette.png') });
}

await browser.close();
