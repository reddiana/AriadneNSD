// docs/의 캡처를 프로토타입 65번째 판과 시안 M44에서 찍는다 (2026-10-16-visual-design-shots.mjs를 이어받음)
// 쓰는 법: node 2026-11-01-docs-shots.mjs <프로토타입 file:// 주소> <M44 file:// 주소> <docs 폴더>
// 그림은 2배 해상도 PNG. 64번째 판부터 머리 모양의 기본이 "제목처럼"이라, 먼저 "모자 · 아치"를 골라 둔다(그 선택은 기억된다)
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [page, m44, docs] = process.argv.slice(2);
const UX = join(docs, '02-ux-design', 'assets'), DS = join(docs, '04-design', 'assets');
mkdirSync(DS, { recursive: true });
const port = 9346;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${port}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'docshots-'))}`, '--window-size=1600,1100', 'about:blank',
], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let url;
for (let i = 0; i < 40 && !url; i++) { try { url = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page')?.webSocketDebuggerUrl; } catch {} await sleep(250); }
const ws = new WebSocket(url);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let seq = 0; const pending = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m.error); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval error'); return r.result.value; };

const HELPERS = `window.T = {
  key(code, o = {}) { (o.editor ? document.querySelector('#editor') : document).dispatchEvent(new KeyboardEvent('keydown', { code, key: o.key || code, shiftKey: !!o.shift, bubbles: true, cancelable: true })); },
  click(id) { const el = document.querySelector('#svg [data-id="' + id + '"]'); if (!el) throw new Error('no element ' + id); el.dispatchEvent(new MouseEvent('mousedown', { button: 0, detail: 1, bubbles: true, cancelable: true })); },
  label(id, i) { document.querySelector('#svg [data-id="' + id + '"][data-label="' + i + '"]').dispatchEvent(new MouseEvent('mousedown', { button: 0, detail: 1, bubbles: true, cancelable: true })); },
  cmd(c) { document.querySelector('button[data-cmd="' + c + '"]').click(); },
  doc() { return JSON.parse(localStorage.getItem('nsd-proto-doc')).doc; },
  type(v) { const e = document.querySelector('#editor'); e.value = v; T.key('Enter', { editor: true, key: 'Enter' }); },
  clear() { T.key('Escape'); T.key('Escape'); },
  head(v) { const o = document.querySelector('#optHead'); o.value = v; o.dispatchEvent(new Event('change')); },
};`;
const keys = async (...ks) => { for (const k of ks) await ev(`T.key('${k.replace(/^\+/, '')}', { shift: ${k.startsWith('+')} })`); };
async function shot(dir, name, sel = '.paper', pad = 0, clip = null) {
  await sleep(300);
  const r = await ev(`(() => { const b = document.querySelector('${sel}').getBoundingClientRect(); return { x: b.x + scrollX, y: b.y + scrollY, w: b.width, h: b.height }; })()`);
  const c = { x: r.x - pad, y: r.y - pad, width: (clip?.w ?? r.w) + 2 * pad, height: (clip?.h ?? r.h) + 2 * pad, scale: 1 };
  const res = await send('Page.captureScreenshot', { format: 'png', clip: c, captureBeyondViewport: true });
  writeFileSync(join(dir, name), Buffer.from(res.data, 'base64'));
  console.log('saved', name, Math.round(c.width), 'x', Math.round(c.height));
}

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1100, deviceScaleFactor: 2, mobile: false });
await send('Page.navigate', { url: page }); await sleep(3000);
await ev(`localStorage.clear()`);
await send('Page.navigate', { url: page + '?shots' }); await sleep(3000);
await ev(HELPERS);
await ev(`T.head('shape')`);

// 1. 블록의 모양과 구문 강조: 코드식 예제, 아무것도 선택하지 않음 (빈 갈래의 ∅, 조건 글자 뒤 바탕이 보임)
await ev(`T.cmd('exCode')`); await ev(`T.clear()`);
await shot(UX, 'visual-design-code.png');
// 2. Case (갈래 이름은 칸의 왼쪽, default만 오른쪽, 짧은 갈래는 고르게 늘림)
await ev(`T.cmd('exCase')`); await ev(`T.clear()`);
await shot(UX, 'visual-design-case.png');
// 3. 문서의 표시: Method 머리, 호출 블록, 펴 보인 호출 블록, 펴진 접기 영역
await ev(`T.cmd('exQuick')`);
let d = await ev(`T.doc()`);
const [pc] = d.diagrams[0].body[0].yes.map(n => n.id), pb = d.diagrams[1].body.map(n => n.id);
await ev(`T.click('${pc}'); T.key('KeyF')`);
await ev(`T.click('${pb[0]}'); T.key('ArrowDown', { shift: true }); T.key('ArrowDown', { shift: true }); T.key('KeyZ'); T.key('KeyF')`);
await ev(`T.type('준비')`);
await ev(`T.key('KeyF')`);
await ev(`T.clear()`);
await shot(UX, 'visual-design-document-marks.png');
// 4. 접힌 제어 블록과 접힌 접기 영역(펼침 삼각형 ▸)
await ev(`T.cmd('exCode')`);
d = await ev(`T.doc()`);
const ctl = d.diagrams[0].body.find(n => n.type === 'if');
await ev(`T.click('${ctl.id}'); T.key('KeyZ'); T.key('KeyA')`);
await ev(`T.clear()`);
await shot(UX, 'visual-design-folded.png');
// 5. 편집 레이어: 블록 하나 선택 / 여러 블록 선택 / 글자를 고치는 중
await ev(`T.cmd('exCode')`);
d = await ev(`T.doc()`);
const b = d.diagrams[0].body;
await ev(`T.click('${b[1].id}')`);
await shot(UX, 'visual-design-select-one.png');
await ev(`T.click('${b[0].id}')`); await keys('KeyV', 'KeyJ', 'KeyJ');
await shot(UX, 'visual-design-select-range.png');
await ev(`T.clear()`);
await ev(`T.click('${b[0].id}')`); await keys('KeyI');
await shot(UX, 'visual-design-editing.png');
await ev(`T.key('Escape', { editor: true, key: 'Escape' })`); await ev(`T.clear()`);
// 6. 편집 화면 전체: 밝은 화면과 어두운 화면 (프로토타입의 화면. 제품의 화면 배치는 06-web)
await ev(`T.cmd('exCode')`); await ev(`T.click(T.doc().diagrams[0].body[1].id)`);
await ev(`document.documentElement.dataset.theme = 'light'`);
await shot(UX, 'visual-design-screen-light.png', '.app');
await ev(`document.documentElement.dataset.theme = 'dark'`);
await shot(UX, 'visual-design-screen-dark.png', '.app');
await ev(`document.documentElement.dataset.theme = 'light'`);
// 7. 색각 이상과 흑백
await ev(`T.cmd('exQuick')`); await ev(`T.clear()`);
for (const [type, name] of [['achromatopsia', 'grayscale'], ['deuteranopia', 'deuteranopia'], ['protanopia', 'protanopia'], ['tritanopia', 'tritanopia']]) {
  await send('Emulation.setEmulatedVisionDeficiency', { type });
  await shot(UX, `visual-design-vision-${name}.png`);
}
await send('Emulation.setEmulatedVisionDeficiency', { type: 'none' });
// 8. 선택한 것이 없을 때의 키보드 포커스: 캔버스 안쪽 테두리 (65번째 판은 Tab이면 첫 블록을 선택하므로, 포커스만 옮김)
await ev(`T.cmd('exCode')`); await ev(`T.clear()`);
await ev(`document.querySelector('.stage').focus({ focusVisible: true }); { const st = document.createElement('style'); st.id = 'shot-focus'; st.textContent = '.stage.nosel { box-shadow: inset 0 0 0 2px var(--accent) }'; document.head.appendChild(st); }`);  // 스크립트로 옮긴 포커스는 :focus-visible이 되지 않아, 같은 모습을 씌운다
await shot(UX, 'visual-design-focus-none.png', '.stage', 0, { w: 560, h: 360 });
await ev(`document.querySelector('.stage').blur(); document.getElementById('shot-focus').remove()`);
// 9. 새로: 머리 모양 "제목처럼" (퀵소트, Method 딱지와 굵은 이름)
await ev(`T.cmd('exQuick')`); await ev(`T.head('title')`); await ev(`T.clear()`);
await shot(UX, 'visual-design-head-title.png');
await ev(`T.head('shape')`);
// 10. 새로: 갈래 이름 선택 (Case의 CMD_STOP)
await ev(`T.cmd('exCase')`); await ev(`T.label(T.doc().diagrams[0].body[1].id, 1)`);
await shot(UX, 'interaction-branch-label.png');
// 11. 새로: 키 힌트 (a를 누르고 0.5초 기다림). 캔버스 아래쪽을 자름
await ev(`T.cmd('exCode')`); await ev(`T.click(T.doc().diagrams[0].body[0].id)`);
await ev(`document.querySelector('.stage').focus()`);
await keys('KeyA'); await sleep(700);
await shot(UX, 'visual-design-key-hint.png', '#keyhint', 8);
await ev(`T.key('Escape')`);

// 12. 새로: 웹 화면 배치 (시안 M44의 W1 · 1번. 넓은 화면과 휴대폰)
await send('Page.navigate', { url: m44 }); await sleep(2500);
await shot(DS, 'web-screen-layout.png', '.card.pick .fig.wide .scr', 0);
await shot(DS, 'web-screen-layout-phone.png', '.card.pick .fig.narrow .ph', 0);
await shot(DS, 'web-command-palette.png', '#w6 .card.pick .scr', 0);

ws.close(); chrome.kill(); process.exit(0);
