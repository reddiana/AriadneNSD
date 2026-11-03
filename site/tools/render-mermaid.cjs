// 문서의 Mermaid 그림 하나를 사이트와 같은 Mermaid 11.4.0으로 Chromium에서 그려 PNG로 찍고 크기를 알린다(그림의 배치를 볼 때).
// 쓰는 법: node site/tools/render-mermaid.cjs <그림.mmd> <결과.png>  (src/의 Playwright를 쓴다. Mermaid는 jsdelivr에서 받는다)
const fs = require('fs');
const { chromium } = require(require.resolve('@playwright/test', { paths: [require('path').join(__dirname, '../../src/apps/web')] }));
(async () => {
  const [inFile, outFile] = process.argv.slice(2);
  const code = fs.readFileSync(inFile, 'utf8');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.setContent(`<!doctype html><meta charset="utf-8"><body style="margin:0;background:#fff">
<pre class="mermaid">${code.replace(/</g, '&lt;')}</pre>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11.4.0/dist/mermaid.min.js"></script>
<script>mermaid.initialize({startOnLoad:true});</script>`);
  await page.waitForSelector('pre.mermaid svg', { timeout: 20000 });
  const box = await page.locator('pre.mermaid svg').boundingBox();
  console.log(`size ${Math.round(box.width)} x ${Math.round(box.height)}`);
  await page.locator('pre.mermaid svg').screenshot({ path: outFile });
  await browser.close();
})();
