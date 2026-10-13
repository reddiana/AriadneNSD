// 글자 폭 스파이크 페이지를 헤드리스 브라우저(Chrome, Edge)로 열어 잰 값(JSON)을 찍는다. 화면도 찍어 둘 수 있다
// 쓰는 법: node 2026-10-13-text-width-spike-measure.mjs <브라우저 exe> <페이지 주소> [화면을 찍어 둘 png] [창 폭]
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [exe, page, shot, width = '1400'] = process.argv.slice(2);
const port = 9300 + Math.floor(Math.random() * 400);
const browser = spawn(exe, [
  '--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${port}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'nsdspike-'))}`, `--window-size=${width},1800`, 'about:blank',
], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function target() {
  for (let i = 0; i < 60; i++) {
    try { const p = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); if (p) return p.webSocketDebuggerUrl; } catch {}
    await sleep(250);
  }
  throw new Error('browser did not start');
}
const ws = new WebSocket(await target());
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let seq = 0; const pending = new Map(); const errors = [];
ws.addEventListener('message', ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m.error); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
});
const send = (method, params = {}) => new Promise(r => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const ev = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.value;

await send('Page.enable'); await send('Runtime.enable');
await send('Page.navigate', { url: page });
let raw = '';
for (let i = 0; i < 60 && !raw; i++) { await sleep(250); raw = await ev(`document.getElementById('raw')?.textContent || ''`); }
if (shot) {
  await sleep(1200);
  const h = await ev('document.documentElement.scrollHeight');
  await send('Emulation.setDeviceMetricsOverride', { width: +width, height: Math.min(h, 6000), deviceScaleFactor: 1, mobile: false });
  await sleep(300);
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(shot, Buffer.from(r.data, 'base64'));
}
console.log(raw || 'NO RESULT');
if (errors.length) console.error('page errors:', errors);
ws.close(); browser.kill();
