// 첫 방문 모달 시안(M46)의 예제 썸네일을 프로토타입이 그린 그림에서 찍는다
// 쓰는 법: node 2026-11-01-example-thumbs.mjs file:///…/2026-10-10-ns-prototype.html <그림을 둘 폴더>
// 예제마다 프로토타입의 예제 함수를 부르고, 캔버스의 SVG(#svg)만 2배 해상도 PNG로 찍는다
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [page, outDir] = process.argv.slice(2);
// 모달에 놓는 순서(쉬운 것에서 어려운 것으로). 이름은 파일 이름, 식은 프로토타입의 메뉴로 그 예제를 여는 코드
// (프로토타입의 함수는 바깥에서 보이지 않아, 파일 › 예제의 단추와 "더 보기…" 목록을 쓴다)
const EXAMPLES = [
  ['01-merge-sort', 'more(7)'],
  ['02-dijkstra', 'more(5)'],
  ['03-uart-case', "cmd('exCase')"],
  ['04-timer-interrupt', "cmd('exCode')"],
  ['05-binary-search', 'more(2)'],
  ['06-quicksort', "cmd('exQuick')"],
  ['07-maze', 'more(6)'],
  ['08-vending-machine', 'more(1)'],
  ['09-elevator', 'more(3)'],
  ['10-raft', "cmd('exRaft')"],
];
const port = 9347;
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${port}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'exthumbs-'))}`, '--window-size=2400,1800', 'about:blank',
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
await send('Emulation.setDeviceMetricsOverride', { width: 2400, height: 1800, deviceScaleFactor: 2, mobile: false });
await send('Page.navigate', { url: page });
await sleep(2500);
await ev(`window.cmd = c => document.querySelector('button[data-cmd="' + c + '"]').click();
window.more = n => { const s = document.querySelector('#exMore'); s.value = String(n); s.dispatchEvent(new Event('change')); }; true`);
await ev('document.fonts.ready.then(() => true)');
for (const [name, call] of EXAMPLES) {
  await ev(`(${call}, true)`);
  await sleep(400);
  // 그림이 있는 자리만: SVG 안의 내용 상자
  const r = await ev(`(() => { const s = document.querySelector('#svg'); const b = s.getBBox(); const o = s.getBoundingClientRect(); const z = s.getScreenCTM(); return { x: o.left + b.x * z.a - 4, y: o.top + b.y * z.d - 4, w: b.width * z.a + 8, h: b.height * z.d + 8 }; })()`);
  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: Math.max(0, r.x), y: Math.max(0, r.y), width: r.w, height: r.h, scale: 1 } });
  const file = join(outDir, `2026-11-01-example-thumb-${name}.png`);
  writeFileSync(file, Buffer.from(shot.data, 'base64'));
  console.log(file, Math.round(r.w) + 'x' + Math.round(r.h));
}
chrome.kill();
process.exit(0);
