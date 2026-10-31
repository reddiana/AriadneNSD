// 시안 M43(MVP 전에 정할 조작 물음)의 그림을 프로토타입 64번째 판에서 뽑는다
// 장면마다 예제를 열고 조작한 뒤, 화면의 SVG(고른 표시 포함)와 고치는 칸 · 표시할 상자 · 상태 줄 글을 모아 JSON으로 쓴다
// 쓰는 법: node journal/assets/2026-10-31-mvp-ux-questions-shots.mjs <프로토타입 file:// 주소> <내보낼 json>
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const page = process.argv[2], outFile = process.argv[3], port = 9352;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'm43-'))}`, '--window-size=2000,1400', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let url;
for (let i = 0; i < 40 && !url; i++) { try { url = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page')?.webSocketDebuggerUrl; } catch {} await sleep(250); }
const ws = new WebSocket(url);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let seq = 0; const pend = new Map(), errors = [];
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result ?? m.error); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description); });
const send = (method, params = {}) => new Promise(r => { const id = ++seq; pend.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const ev = async x => { const r = await send('Runtime.evaluate', { expression: x, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || x); return r.result.value; };

const HELPERS = `window.T = {
  key(code, o = {}) { document.dispatchEvent(new KeyboardEvent('keydown', { code, key: o.key || code, shiftKey: !!o.shift, ctrlKey: !!o.ctrl, altKey: !!o.alt, bubbles: true, cancelable: true })); },
  keys(s) { for (const c of s) { const up = c !== c.toLowerCase(); T.key('Key' + c.toUpperCase(), { shift: up, key: c }); } },
  click(id, n = 1) { const el = document.querySelector('#svg [data-id="' + id + '"]'); el.dispatchEvent(new MouseEvent('mousedown', { button: 0, detail: n, bubbles: true, cancelable: true })); },
  cmd(c) { document.querySelector('button[data-cmd="' + c + '"]').click(); },
  doc() { return JSON.parse(localStorage.getItem('nsd-proto-doc')); },
  editor(v) { const e = document.querySelector('#editor'); e.value = v; },
  enter() { document.querySelector('#editor').dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true, cancelable: true })); },
};`;
await send('Page.enable'); await send('Runtime.enable');
await send('Page.navigate', { url: page }); await sleep(2500);
await ev(`localStorage.clear()`);
await send('Page.navigate', { url: page + '?m43' }); await sleep(2500);
await ev(HELPERS);
// 머리 모양은 모자 · 아치로 (64번째 판의 기본은 제목처럼이지만, 물음과 상관없는 그림을 짧게)
await ev(`{ const o = document.querySelector('#optHead'); o.value = 'shape'; o.dispatchEvent(new Event('change')); }`);

// 모델을 고친 뒤 다시 열어 그린다 (아직 없는 동작의 결과 그림)
async function setDoc(fnSrc, folded) {
  await ev(`{ const s = T.doc(); const f = ${fnSrc}; f(s.doc); localStorage.setItem('nsd-proto-doc', JSON.stringify(s)); ${folded ? `localStorage.setItem('nsd-proto-fold', JSON.stringify(${JSON.stringify(folded)}));` : ''} }`);
  await send('Page.reload'); await sleep(1800); await ev(HELPERS);
}
// 화면을 모은다: SVG, 고치는 칸(있으면), 표시할 상자, 상태 줄
async function grab(marks = []) {
  return ev(`(() => {
    const svg = document.querySelector('#svg'), m = svg.getScreenCTM().inverse();
    const toSvg = r => { const p = new DOMPoint(r.left, r.top).matrixTransform(m), q = new DOMPoint(r.right, r.bottom).matrixTransform(m); return { x: p.x, y: p.y, w: q.x - p.x, h: q.y - p.y }; };
    const ed = document.querySelector('#editor');
    const editor = ed.hidden ? null : { ...toSvg(ed.getBoundingClientRect()), value: ed.value };
    const marks = ${JSON.stringify(marks)}.map(s => { const el = document.querySelector('#svg ' + s); return el ? toSvg(el.getBoundingClientRect()) : null; }).filter(Boolean);
    return { svg: svg.outerHTML, editor, marks, msg: document.querySelector('#msg').textContent };
  })()`);
}
const S = {};
const scene = async (name, ex, steps, marks) => {
  if (ex) await ev(`T.cmd('${ex}')`);
  for (const s of steps) { await ev(s); await sleep(60); }
  await sleep(150);
  S[name] = await grab(marks);
};

// Q2 더블클릭: 접힌 칸 "로그 남기기"(n14)
await scene('q2-start', 'exCode', [`T.click('n14')`]);
await scene('q2-opt1', 'exCode', [`T.click('n14')`, `T.key('Enter', { key: 'Enter' })`]);   // 1번의 결과 = 지금의 Enter와 같다
await scene('q2-opt2', 'exCode', [`T.click('n14')`, `T.click('n14', 2)`]);

// Q4 머리의 이름을 비움: partition(a, lo, hi) (g18)
await scene('q4-start', 'exQuick', [`T.click('g18')`, `T.key('Enter', { key: 'Enter' })`, `T.editor('')`]);
await scene('q4-opt2', null, [`T.enter()`]);
// 다시 열린 칸에서 Esc는 고치기 전의 이름으로 되돌린다. 칸을 닫고 다음 장면으로
await ev(`document.querySelector('#editor').dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true, cancelable: true }))`);
await scene('q4-opt1', 'exQuick', [`T.click('g18')`]);

// Q6 옮기기: 블록 "i = lo - 1;"(n7)을 위로, Case 갈래 1과 2를 맞바꿈
await scene('q6-start', 'exQuick', [`T.click('n7')`]);
await setDoc(`d => { const b = d.diagrams[1].body; [b[0], b[1]] = [b[1], b[0]]; }`);
await scene('q6-opt1-block', null, [`T.click('n7')`]);
await scene('q6-case-start', 'exCase', [`T.click('n5')`]);
await setDoc(`d => { const c = d.diagrams[0].body[1]; [c.c0, c.c1] = [c.c1, c.c0]; [c.labels[0], c.labels[1]] = [c.labels[1], c.labels[0]]; }`);
await scene('q6-opt1-lane', null, [`T.click('n5')`]);

// Q5 Case 갈래를 앞에 넣기: 첫 갈래(n3)에서
await scene('q5-start', 'exCase', [`T.click('n3')`]);
await scene('q5-now', 'exCase', [`T.click('n3')`, `T.key('Equal', { key: '+', shift: true })`, `T.enter()`]);
await setDoc(`d => { const c = d.diagrams[0].body[1]; [c.c0, c.c1] = [c.c1, c.c0]; [c.labels[0], c.labels[1]] = [c.labels[1], c.labels[0]]; }`);
await scene('q5-before', null, [`T.click(T.doc().doc.diagrams[0].body[1].c0[0].id)`]);

// Q8 접기 영역 안의 블록을 고르고 "접기 영역 풀기"(zd): "센서 읽기"(n9) 안의 n10
await scene('q8-start', 'exCode', [`T.click('n10')`], ['[data-id="n9"]']);
await scene('q8-now', 'exCode', [`T.click('n10')`, `T.keys('zd')`]);

// Q11 좌우: Case 안 If의 거짓 갈래(n8)에서 → 와 Ctrl+→
await scene('q11-start', 'exCase', [`T.click('n8')`]);
await scene('q11-right', 'exCase', [`T.click('n8')`, `T.key('ArrowRight')`]);
await scene('q11-ctrl', 'exCase', [`T.click('n8')`, `T.key('ArrowRight', { ctrl: true })`]);

// Q19 명령 뒤에 무엇이 골라지는가: 지우기, 풀기, 실행 취소
await scene('q19-del-start', 'exQuick', [`T.click('n7')`]);
await scene('q19-del-now', 'exQuick', [`T.click('n7')`, `T.key('Delete')`]);
await scene('q19-ds-start', 'exQuick', [`T.click('n10')`]);
await scene('q19-ds-now', 'exQuick', [`T.click('n10')`, `T.keys('ds')`]);
await scene('q19-undo-now', null, [`T.keys('u')`]);

// Q10 갈래 이름 고르기: Case 머리의 갈래 이름 "2"(n2의 1번), If의 "참"
await scene('q10-case', 'exCase', [], ['[data-id="n2"][data-label="1"]']);
await scene('q10-if', 'exQuick', [], ['[data-id="n1"][data-label="0"]']);
await scene('q10-pass', 'exCase', [], ['[data-id="n2"][data-label="0"]']);

writeFileSync(outFile, JSON.stringify(S));
console.log(Object.entries(S).map(([k, v]) => `${k}: ${v.msg}${v.editor ? ' [editor "' + v.editor.value + '"]' : ''} marks ${v.marks.length}`).join('\n'));
if (errors.length) console.log('ERR', errors);
ws.close(); chrome.kill(); process.exit(0);
