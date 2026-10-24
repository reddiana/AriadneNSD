// 조작 규칙(docs/02-ux-design/02-interaction-rules.md)의 "여러 블록 선택" 자동 확장 예시 그림을 프로토타입에서 찍는다
// 쓰는 법: node 2026-10-25-multiselect-shots.mjs file:///…/2026-10-10-ns-prototype.html <그림을 둘 폴더>
// 찍는 틀은 2026-10-16-visual-design-shots.mjs와 같다. 문서 A · B · While(C · D) · E를 넣고
// 1) A를 고름 2) While 안의 C를 Shift+클릭 → A ~ While 전체가 골라짐
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const page = process.argv[2], outDir = process.argv[3];
const port = 9346;
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${port}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'msshots-'))}`, '--window-size=1600,1100', 'about:blank',
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
const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval error'); return r.result.value; };

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1100, deviceScaleFactor: 2, mobile: false });
await send('Page.navigate', { url: page });
await sleep(3000);
await ev(`window.T = {
  click(id, shift) { const el = document.querySelector('#svg [data-id="' + id + '"]'); if (!el) throw new Error('no element ' + id); el.dispatchEvent(new MouseEvent('mousedown', { button: 0, detail: 1, shiftKey: !!shift, bubbles: true, cancelable: true })); },
};`);

async function shot(name, sel = '.paper') {
  await sleep(300);
  const r = await ev(`(() => { const b = document.querySelector('${sel}').getBoundingClientRect(); return { x: b.x + scrollX, y: b.y + scrollY, w: b.width, h: b.height }; })()`);
  const res = await send('Page.captureScreenshot', { format: 'png', clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 }, captureBeyondViewport: true });
  writeFileSync(join(outDir, name), Buffer.from(res.data, 'base64'));
  console.log('saved', name, Math.round(r.w), 'x', Math.round(r.h));
}

// 예시 문서: 머리 없는 다이어그램 하나. 프로토타입의 함수는 밖에서 부를 수 없어서,
// 프로토타입이 저장하는 자리(localStorage)에 문서를 넣고 페이지를 다시 연다
const P = (id, text) => ({ id, type: 'process', text });
const doc = { diagrams: [{ id: 'g1', event: null, body: [
  P('n1', 'A'), P('n2', 'B'),
  { id: 'n3', type: 'while', text: '조건', body: [P('n4', 'C'), P('n5', 'D')] },
  P('n6', 'E'),
] }] };
await ev(`localStorage.setItem('nsd-proto-doc', ${JSON.stringify(JSON.stringify({ doc, opts: { syntax: false, mono: false } }))});
  localStorage.setItem('nsd-proto-fold', '[]'); localStorage.setItem('nsd-proto-open', '[]'); location.reload();`);
await sleep(2500);
await ev(`window.T = { click(id, shift) { const el = document.querySelector('#svg [data-id="' + id + '"]'); if (!el) throw new Error('no element ' + id); el.dispatchEvent(new MouseEvent('mousedown', { button: 0, detail: 1, shiftKey: !!shift, bubbles: true, cancelable: true })); } };`);
const ids = { a: 'n1', c: 'n4' };

await ev(`T.click('${ids.a}')`);
await shot('interaction-multiselect-1.png');
await ev(`T.click('${ids.c}', true)`);
await shot('interaction-multiselect-2.png');

ws.close(); chrome.kill();
