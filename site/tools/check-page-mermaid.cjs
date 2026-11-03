// 펴낸 사이트의 페이지를 Chromium으로 열어 Mermaid 그림이 오류 없이 그려졌는지 본다.
// 쓰는 법: node site/tools/check-page-mermaid.cjs <페이지 주소> [<스크린숏.png>]
//   예: bash site/build.sh --serve 를 띄운 뒤 http://localhost:8080/docs/04-design/07-testing
// Quartz는 코드 블록 안의 %% 도 Obsidian 주석으로 지우므로, Mermaid만 따로 그려서는 사이트의 오류를 못 잡는다(2026-11-03).
const { chromium } = require(
  require.resolve('@playwright/test', { paths: [require('path').join(__dirname, '../../src/apps/web')] }),
);
(async () => {
  const [url, shot] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const result = await page.evaluate(() =>
    [...document.querySelectorAll('pre:has(code.mermaid), .mermaid')].map((el) => ({
      error: /Syntax error|Parse error/i.test(el.textContent ?? ''),
      svg: el.querySelector('svg') !== null,
    })),
  );
  console.log(JSON.stringify(result));
  if (shot) {
    const svg = page.locator('.mermaid svg, pre svg').first();
    if ((await svg.count()) > 0) await svg.screenshot({ path: shot });
  }
  await browser.close();
  process.exit(result.some((r) => r.error) ? 1 : 0);
})();
