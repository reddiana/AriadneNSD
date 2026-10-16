// 시각 디자인 문서(docs/02-ux-design/03-visual-design.md)에 넣을 그림을 프로토타입에서 찍는다
// 쓰는 법: node 2026-10-16-visual-design-shots.mjs file:///…/2026-10-10-ns-prototype.html <그림을 둘 폴더>
// 그림은 2배 해상도 PNG. 장면마다 프로토타입의 예제를 열고, 키를 눌러 상태를 만든 뒤 종이(.paper)나 화면 일부를 자른다
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const page = process.argv[2], outDir = process.argv[3];
const port = 9345;
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${port}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'vdshots-'))}`, '--window-size=1600,1100', 'about:blank',
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
  key(code, o = {}) { (o.editor ? document.querySelector('#editor') : document).dispatchEvent(new KeyboardEvent('keydown', { code, key: o.key || code, shiftKey: !!o.shift, bubbles: true, cancelable: true })); },
  click(id) { const el = document.querySelector('#svg [data-id="' + id + '"]'); if (!el) throw new Error('no element ' + id); el.dispatchEvent(new MouseEvent('mousedown', { button: 0, detail: 1, bubbles: true, cancelable: true })); },
  cmd(c) { document.querySelector('button[data-cmd="' + c + '"]').click(); },
  doc() { return JSON.parse(localStorage.getItem('nsd-proto-doc')).doc; },
  type(v) { const e = document.querySelector('#editor'); e.value = v; T.key('Enter', { editor: true, key: 'Enter' }); },
  clear() { T.key('Escape'); T.key('Escape'); },
};`);
const keys = async (...ks) => { for (const k of ks) await ev(`T.key('${k.replace(/^\+/, '')}', { shift: ${k.startsWith('+')} })`); };

// 고른 요소의 둘레를 잘라 찍는다 (pad: 둘레 여백, clip: 잘라 낼 크기를 줄이고 싶을 때)
async function shot(name, sel = '.paper', pad = 0, clip = null) {
  await sleep(300);
  const r = await ev(`(() => { const b = document.querySelector('${sel}').getBoundingClientRect(); return { x: b.x + scrollX, y: b.y + scrollY, w: b.width, h: b.height }; })()`);
  const c = { x: r.x - pad, y: r.y - pad, width: (clip?.w ?? r.w) + 2 * pad, height: (clip?.h ?? r.h) + 2 * pad, scale: 1 };
  const res = await send('Page.captureScreenshot', { format: 'png', clip: c, captureBeyondViewport: true });
  writeFileSync(join(outDir, name), Buffer.from(res.data, 'base64'));
  console.log('saved', name, Math.round(c.width), 'x', Math.round(c.height));
}

// 1. 블록의 모양과 구문 강조: 코드식 예제, 아무것도 고르지 않음
await ev(`T.cmd('exCode')`); await ev(`T.clear()`);
await shot('visual-design-code.png');

// 2. Case
await ev(`T.cmd('exCase')`); await ev(`T.clear()`);
await shot('visual-design-case.png');

// 3. 문서의 표시: Method 머리, 호출 블록, 펴 보인 호출 블록, 펴진 접기 영역
await ev(`T.cmd('exQuick')`);
let d = await ev(`T.doc()`);
const [pc] = d.diagrams[0].body[0].yes.map(n => n.id), pb = d.diagrams[1].body.map(n => n.id);
await ev(`T.click('${pc}'); T.key('KeyF')`);
await ev(`T.click('${pb[0]}'); T.key('ArrowDown', { shift: true }); T.key('ArrowDown', { shift: true }); T.key('KeyZ'); T.key('KeyF')`);
await ev(`T.type('준비')`);
await ev(`T.key('KeyF')`);
await ev(`T.clear()`);
await shot('visual-design-document-marks.png');

// 4. 접힌 제어 블록: 코드식 예제의 첫 If를 접음 (접힌 접기 영역 "로그 남기기"는 예제에 이미 있음)
await ev(`T.cmd('exCode')`);
d = await ev(`T.doc()`);
const ctl = d.diagrams[0].body.find(n => n.type === 'if');
await ev(`T.click('${ctl.id}'); T.key('KeyZ'); T.key('KeyA')`);
await ev(`T.clear()`);
await shot('visual-design-folded.png');

// 5. 편집 층: 블록 하나를 고름 / 여러 블록을 고름 / 글자를 고치는 중
await ev(`T.cmd('exCode')`);
d = await ev(`T.doc()`);
const b = d.diagrams[0].body;
await ev(`T.click('${b[1].id}')`);
await shot('visual-design-select-one.png');
await ev(`T.click('${b[0].id}')`); await keys('KeyV', 'KeyJ', 'KeyJ');
await shot('visual-design-select-range.png');
await ev(`T.clear()`);
await ev(`T.click('${b[0].id}')`); await keys('KeyI');
await shot('visual-design-editing.png');
await ev(`T.key('Escape', { editor: true, key: 'Escape' })`); await ev(`T.clear()`);

// 6. 편집 화면 전체: 밝은 화면과 어두운 화면. 종이는 어두운 화면에서도 흰색
await ev(`T.cmd('exCode')`); await ev(`T.click(T.doc().diagrams[0].body[1].id)`);
await ev(`document.documentElement.dataset.theme = 'light'`);
await shot('visual-design-screen-light.png', '.app');
await ev(`document.documentElement.dataset.theme = 'dark'`);
await shot('visual-design-screen-dark.png', '.app');

ws.close(); chrome.kill();
