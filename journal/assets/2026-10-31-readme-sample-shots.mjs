// README 첫 화면의 다이어그램 그림을 M41 시안(프로토타입의 그리는 코드)에서 2배 해상도 PNG로 찍는다
// 쓰는 법: node 2026-10-31-readme-sample-shots.mjs file:///…/2026-10-31-readme-sample-study.html <그림을 둘 폴더> 5 7
// 시안 주소에 #shot=번호를 붙이면 그 후보의 그림만 흰 바탕에 그린다. 웹 글꼴을 기다리느라 스크립트가 늦을 수 있어 넉넉히 기다린다
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [page, outDir, ...nos] = process.argv.slice(2);
const port = 9346;
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${port}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'readmeshots-'))}`, '--window-size=1600,1200', 'about:blank',
], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function target() {
  for (let i = 0; i < 40; i++) {
    try { const p = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); if (p) return p.webSocketDebuggerUrl; } catch {}
    await sleep(250);
  }
  throw new Error('chrome did not start');
}
const ws = new WebSocket(await target());
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let seq = 0; const pending = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m.error); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval error'); return r.result.value; };

await send('Page.enable'); await send('Runtime.enable');
for (const no of nos) {
  await send('Page.navigate', { url: `${page}#shot=${no}` });
  await send('Page.reload', { ignoreCache: true });
  let size = null;
  for (let i = 0; i < 40 && !size; i++) { await sleep(250); size = await ev('window.SHOT || null'); }
  if (!size) throw new Error('no shot ' + no);
  await ev('document.fonts.ready.then(() => true)');
  await send('Emulation.setDeviceMetricsOverride', { width: size.w, height: size.h, deviceScaleFactor: 2, mobile: false });
  await sleep(300);
  const r = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: size.w, height: size.h, scale: 1 } });
  const file = join(outDir, `readme-sample-${no}.png`);
  writeFileSync(file, Buffer.from(r.data, 'base64'));
  console.log(file, size.w + 'x' + size.h);
}
chrome.kill();
process.exit(0);
