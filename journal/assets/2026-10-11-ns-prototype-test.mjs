// 프로토타입의 Event / Method / 호출 블록(ADR-0022) 동작과, 접기 영역의 막대 · 호출 블록 펴 보기를 헤드리스 Chrome에서 눌러 본다
// 쓰는 법: node 2026-10-11-ns-prototype-test.mjs file:///…/2026-10-10-ns-prototype.html <화면을 찍어 둘 폴더>
// 헤드리스 Chrome이 웹 글꼴을 기다리다 스크립트가 돌지 않으면(첫 검사에서 doc이 null), 글꼴 link 줄을 뺀 사본을 만들어 그 주소로 돌린다
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const page = process.argv[2], outDir = process.argv[3];
const port = 9344;
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${port}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'protoem-'))}`, '--window-size=2300,1500', 'about:blank',
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
let seq = 0; const pending = new Map(); const errors = [];
ws.addEventListener('message', ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m.error); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
});
const send = (method, params = {}) => new Promise(r => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval error'); return r.result.value; };

await send('Page.enable'); await send('Runtime.enable');
await send('Page.navigate', { url: page });
await sleep(2500);

// 페이지 안에서 쓸 도우미: 키 누르기, 블록 고르기, 문서 읽기
const HELPERS = `
window.T = {
  key(code, o = {}) { (o.editor ? document.querySelector('#editor') : document).dispatchEvent(new KeyboardEvent('keydown', { code, key: o.key || code, shiftKey: !!o.shift, ctrlKey: !!o.ctrl, altKey: !!o.alt, bubbles: true, cancelable: true })); },
  click(id) { const el = document.querySelector('#svg [data-id="' + id + '"]'); if (!el) throw new Error('no element ' + id); el.dispatchEvent(new MouseEvent('mousedown', { button: 0, detail: 1, bubbles: true, cancelable: true })); },
  cmd(c) { document.querySelector('button[data-cmd="' + c + '"]').click(); },
  doc() { return JSON.parse(localStorage.getItem('nsd-proto-doc')).doc; },
  type(v) { const e = document.querySelector('#editor'); if (e.hidden) throw new Error('editor closed'); e.value = v; T.key('Enter', { editor: true, key: 'Enter' }); },
  editing() { const e = document.querySelector('#editor'); return e.hidden ? null : e.value; },
  picked() { const e = document.querySelector('#editor'); return e.value.slice(e.selectionStart, e.selectionEnd); },
  msg() { return document.querySelector('#msg').textContent; },
  svg() { return document.querySelector('#svg').innerHTML; },
  calls(d) { const out = []; const walk = l => l.forEach(n => { if (n.type === 'call') out.push(n); for (const k of ['yes', 'no', 'body', 'children', 'c0', 'c1', 'c2', 'c3']) if (Array.isArray(n[k])) walk(n[k]); }); d.diagrams.forEach(x => walk(x.body)); return out; },
  // 호출 블록이 화면에 보이는 글자: 결과 ← 이름(인자). 이름은 부르는 Method의 머리에서 온다
  line(c, d) { const t = c.target ? d.diagrams.find(x => x.id === c.target) : null; const e = t ? t.event.trim() : ''; const i = e.indexOf('('); const name = t ? (i > 0 ? e.slice(0, i).trim() : e) : c.name; return (c.result ? c.result + ' ← ' : '') + name + (c.args || (t && i > 0) ? '(' + (c.args || '') + ')' : ''); },
  sum() { const d = T.doc(); return { dias: d.diagrams.map(x => x.kind + ':' + x.event), calls: T.calls(d).map(c => T.line(c, d) + ' -> ' + (c.target ? d.diagrams.find(x => x.id === c.target)?.event : 'X')) }; },
};`;
await ev(HELPERS);

const results = [];
const check = (name, ok, detail) => { results.push({ name, ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : '  ' + JSON.stringify(detail))); };
const shot = async name => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(outDir, name), Buffer.from(r.data, 'base64')); };

// a. 퀵소트 예제: 호출 블록은 결과 ← 이름(인자)
await ev(`T.cmd('exQuick')`);
let s = await ev(`T.sum()`);
check('퀵소트: Method 둘', s.dias.length === 2 && s.dias.every(d => d.startsWith('method:')), s);
check('퀵소트: 호출 셋이 이어지고 인자와 결과가 따로', s.calls.join('|') === 'p ← partition(a, lo, hi) -> partition(a, lo, hi)|quicksort(a, lo, p - 1) -> quicksort(a, lo, hi)|quicksort(a, p + 1, hi) -> quicksort(a, lo, hi)', s);
check('퀵소트: 호출 블록에 글자(text)가 없음', (await ev(`T.calls(T.doc()).every(c => !('text' in c))`)) === true);
check('퀵소트: 이름을 굵게 그림', (await ev(`T.svg().includes('<tspan font-weight="600">partition</tspan>')`)) === true);
await shot('em-quick.png');
let d = await ev(`T.doc()`);
const pId = d.diagrams[1].id;
await ev(`T.click('${pId}'); T.key('Enter', { key: 'Enter' })`);
await ev(`T.type('quicksort(x)')`);
check('머리 이름이 겹침(이름만으로 견줌): 받아들이지 않음', (await ev(`T.editing()`)) === 'quicksort(x)' && (await ev(`T.msg()`)).includes('같은 이름'), await ev(`T.msg()`));
await ev(`T.type('split(a, lo, hi)')`);
s = await ev(`T.sum()`);
check('머리 이름을 고침: 호출 블록의 이름이 따라 바뀌고 인자와 결과는 남음', s.calls[0] === 'p ← split(a, lo, hi) -> split(a, lo, hi)', s);
await shot('em-quick-renamed.png');

// b. Raft 예제
await ev(`T.cmd('exRaft')`);
s = await ev(`T.sum()`);
check('Raft: Event 일곱, Method 셋', s.dias.filter(d => d.startsWith('event:')).length === 7 && s.dias.filter(d => d.startsWith('method:')).length === 3, s);
check('Raft: 호출이 모두 Method에 이어짐', s.calls.length === 9 && s.calls.every(c => !c.endsWith('X')), s);
check('Raft: 받는 것이 없으면 이름만 보임', s.calls.every(c => { const [l, r] = c.split(' -> '); return l === r; }), s);
await shot('em-raft.png');

// c. 코드식 예제에서 블록을 고르고 M: 새 Method로 빠짐
await ev(`T.cmd('exCode')`);
d = await ev(`T.doc()`);
check('코드식: Event 하나', d.diagrams.length === 1 && d.diagrams[0].kind === 'event', d.diagrams.map(x => x.kind));
const first = d.diagrams[0].body[0].id;
await ev(`T.click('${first}'); T.key('KeyE')`);
check('블록을 고르고 E: 빼지 않고 알려 줌', (await ev(`T.doc().diagrams.length`)) === 1 && (await ev(`T.msg()`)).includes('m을 누르세요'), await ev(`T.msg()`));
await ev(`T.key('KeyM')`);
check('블록을 고르고 M: 머리 이름을 묻는 칸이 열림', (await ev(`T.editing()`)) === 'Method 1', await ev(`T.editing()`));
await ev(`T.key('Enter', { editor: true, key: 'Enter' })`);
s = await ev(`T.sum()`);
check('M으로 뺌: 새 Method와 이어진 호출 블록', s.dias[1] === 'method:Method 1' && s.calls.join() === 'Method 1 -> Method 1', s);
d = await ev(`T.doc()`);
const mId = d.diagrams[1].id, callId = d.diagrams[0].body[0].id;

// d. 부르는 호출이 있는 Method는 Event로 못 바꿈
await ev(`T.click('${mId}'); T.key('KeyE')`);
check('부르는 호출이 있으면 Event로 못 바꿈', (await ev(`T.doc().diagrams[1].kind`)) === 'method' && (await ev(`T.msg()`)).includes('바꿀 수 없습니다'), await ev(`T.msg()`));

// e. Shift+E 새 Event, 머리에서 M / E로 종류 바꾸기
await ev(`T.key('KeyE', { shift: true })`);
check('Shift+E: 새 Event의 이름 칸 (기본 이름은 Event 1)', (await ev(`T.editing()`)) === 'Event 1', await ev(`T.editing()`));
await ev(`T.type('버튼을 누르면')`);
d = await ev(`T.doc()`);
const eDia = d.diagrams.find(x => x.event === '버튼을 누르면');
check('새 Event 다이어그램', !!eDia && eDia.kind === 'event', d.diagrams.map(x => x.kind + ':' + x.event));
await ev(`T.click('${eDia.id}'); T.key('KeyM')`);
check('머리에서 M: Method로', (await ev(`T.doc().diagrams.find(x => x.id === '${eDia.id}').kind`)) === 'method');
await ev(`T.key('KeyE')`);
check('머리에서 E: 다시 Event로', (await ev(`T.doc().diagrams.find(x => x.id === '${eDia.id}').kind`)) === 'event');

// f. 받는 것이 없는 Method를 부르는 호출 블록: 결과 칸 하나만 열린다. 이름은 칸이 아니다 (62번째 판: 칸 둘)
await ev(`T.click('${callId}'); T.key('Enter', { key: 'Enter' })`);
check('62: 받는 것이 없는 호출 블록에서 Enter: 결과 칸이 빈 채로 열림', (await ev(`T.editing()`)) === '' && (await ev(`T.msg()`)).includes('결과 칸'), [await ev(`T.editing()`), await ev(`T.msg()`)]);
await ev(`T.key('Tab', { editor: true, key: 'Tab' })`);
check('62: 받는 것이 없으면 Tab으로 인자 칸에 가지 않음', (await ev(`T.msg()`)).includes('결과 칸만'), await ev(`T.msg()`));
await ev(`T.type('n')`);
s = await ev(`T.sum()`);
check('결과만 적음: n ← Method 1', s.calls.join() === 'n ← Method 1 -> Method 1', s);

// g. 호출을 하나 더 넣고(C, 1번), 머리에 괄호를 붙이면 이름이 따라 바뀌고 빈 인자가 채워짐
await ev(`T.click('${callId}'); T.key('KeyA'); T.key('KeyC'); T.key('Digit1')`);
s = await ev(`T.sum()`);
check('C로 넣은 호출: 받는 것이 없으면 인자를 묻지 않음', s.calls.length === 2 && s.calls[1] === 'Method 1 -> Method 1' && (await ev(`T.editing()`)) === null, s);
await ev(`T.click('${mId}'); T.key('Enter', { key: 'Enter' })`);
await ev(`T.type('count_up(n)')`);
s = await ev(`T.sum()`);
check('머리를 count_up(n)으로: 호출 블록 모두 이름이 바뀌고 인자가 채워짐', s.calls.join('|') === 'n ← count_up(n) -> count_up(n)|count_up(n) -> count_up(n)', s);
await ev(`T.click('${callId}'); T.key('KeyA'); T.key('KeyC'); T.key('Digit1')`);
check('62: C로 넣은 호출: 받는 것이 있으면 인자 칸이 고른 채로 열림', (await ev(`T.editing()`)) === 'n' && (await ev(`T.picked()`)) === 'n', [await ev(`T.editing()`), await ev(`T.picked()`)]);
await ev(`T.type('5')`);
s = await ev(`T.sum()`);
check('인자를 적음', s.calls.join('|') === 'n ← count_up(n) -> count_up(n)|count_up(5) -> count_up(n)|count_up(n) -> count_up(n)', s);
await ev(`T.click('${callId}'); T.key('Enter', { key: 'Enter' })`);
check('62: 호출 블록에서 Enter: 인자 칸에서 시작', (await ev(`T.editing()`)) === 'n' && (await ev(`T.msg()`)).includes('인자 칸'), [await ev(`T.editing()`), await ev(`T.msg()`)]);
await ev(`document.querySelector('#editor').value = 'n + 1'; T.key('Tab', { editor: true, key: 'Tab' })`);
check('62: Tab으로 결과 칸으로 (결과 칸의 글자만 보임)', (await ev(`T.editing()`)) === 'n' && (await ev(`T.msg()`)).includes('결과 칸'), [await ev(`T.editing()`), await ev(`T.msg()`)]);
await ev(`T.type('total')`);
s = await ev(`T.sum()`);
check('62: 두 칸을 한꺼번에 받아들임', s.calls[0] === 'total ← count_up(n + 1) -> count_up(n)', s);
await ev(`T.key('KeyZ', { ctrl: true })`);
s = await ev(`T.sum()`);
check('되돌리면 고치기 전으로', s.calls[0] === 'n ← count_up(n) -> count_up(n)', s);
await ev(`T.click('${callId}'); T.key('Enter', { key: 'Enter' })`);
await ev(`T.type('')`);
s = await ev(`T.sum()`);
check('62: 인자 칸을 비우면 머리의 괄호 안 글자가 다시 들어감', s.calls[0] === 'n ← count_up(n) -> count_up(n)', s);
await ev(`{ const o = document.querySelector('#optSym'); o.value = '='; o.dispatchEvent(new Event('change')); }`);
check('62: 결과 기호를 = 로: 그림에 n = count_up(n)', (await ev(`T.svg().includes('n = <tspan font-weight="600">count_up</tspan>(n)')`)) === true);
await ev(`const o = document.querySelector('#optSym'); o.value = '←'; o.dispatchEvent(new Event('change'))`);

// h. R로 부를 Method 바꾸기: 새 Method를 만들고 호출. 이름만 바뀌고 인자는 남는다
d = await ev(`T.doc()`);
const call2 = d.diagrams[0].body[1].id;
await ev(`T.click('${call2}'); T.key('KeyR'); T.key('Digit2')`);
check('R → 새 Method: 이름 칸이 열림', (await ev(`T.editing()`)) === 'Method 1', await ev(`T.editing()`));
await ev(`T.type('reset()')`);
s = await ev(`T.sum()`);
check('R로 바꿈: 이름만 바뀌고 인자는 남음', s.calls.join('|') === 'n ← count_up(n) -> count_up(n)|reset(5) -> reset()|count_up(n) -> count_up(n)', s);

// i. Method의 머리를 떼면 호출 블록은 보이던 글자 그대로 남고 끊김, 되돌리면 다시 이어짐
d = await ev(`T.doc()`);
const rId = d.diagrams.find(x => x.event === 'reset()').id;
await ev(`T.click('${rId}'); T.key('Delete')`);
s = await ev(`T.sum()`);
check('머리를 떼면 호출은 글자만 남음 (점선)', s.calls[1] === 'reset(5) -> X' && (await ev(`T.svg().includes('stroke-dasharray="3 3"')`)) === true, s);
await ev(`T.click('${call2}'); T.key('Enter', { key: 'Enter' })`);
check('끊긴 호출 블록은 고치지 않고 알려 줌', (await ev(`T.editing()`)) === null && (await ev(`T.msg()`)).includes('이어진 Method가 없습니다'), await ev(`T.msg()`));
await ev(`T.key('KeyZ', { ctrl: true })`);
s = await ev(`T.sum()`);
check('되돌리면 다시 이어짐', s.calls[1] === 'reset(5) -> reset()', s);

// k. 펴진 접기 영역: 굵은 테두리와 이름 띠. 보통 블록은 테두리에 붙는다 (46번째 판. 그 전에는 왼쪽 막대였다)
await ev(`T.cmd('exCode')`);
d = await ev(`T.doc()`);
const reg = d.diagrams[0].body[2];
const geo = `(() => {
  const at = el => el && ['x', 'y', 'width', 'height'].map(a => +el.getAttribute(a));
  const q = s => document.querySelector('#svg ' + s);
  return { band: at(q('rect[data-band][data-id="${reg.id}"]')), edge: at(q('rect[data-edge="${reg.id}"]')), kid: at(q('rect[data-id="${reg.children[0].id}"]')),
    last: at(q('rect[data-id="${reg.children[reg.children.length - 1].id}"]')), sw: q('rect[data-edge="${reg.id}"]')?.getAttribute('stroke-width') };
})()`;
const saved = `(() => { T.cmd('svg'); const v = document.querySelector('#svgText').value; T.cmd('closeModal'); return v; })()`;
let g = await ev(geo);
check('접기 영역: 굵기 3의 테두리가 영역의 맨 위부터 끝까지 두름 (선의 가운데가 반 픽셀)', !!g.edge && g.sw === '3' && g.edge[0] === g.kid[0] + 1 && g.edge[2] === g.kid[2] - 2 && g.edge[1] === g.kid[1] - 18 + 1 && g.edge[1] + g.edge[3] === g.last[1] + g.last[3] - 1, g);
check('접기 영역: 보통 블록은 테두리에 붙고(들이지 않음) 띠는 폭 전체', g.kid[0] === g.band[0] + .5 && g.kid[1] === g.band[1] + 18.5 && g.band[2] === g.kid[2] + 1, g);
check('저장되는 그림에 테두리와 띠가 들어감', (await ev(`(v => v.includes('stroke="#4f74d6" stroke-width="3"') && v.includes('#e6ecfb'))(${saved})`)) === true);
const bandX = g.band[0];
await ev(`document.querySelector('#optRanges').click()`);
g = await ev(geo);
check('이름 띠를 끄면 테두리도 사라짐', g.band === null && g.edge === null && g.kid[0] === bandX + .5, g);
check('이름 띠를 끄면 저장되는 그림에도 없음', (await ev(`(v => !v.includes('stroke="#4f74d6" stroke-width="3"') && !v.includes('#e6ecfb'))(${saved})`)) === true);
await ev(`document.querySelector('#optRanges').click()`);

// l. 호출 블록 펴 보기: 보기만 바뀌고 모델은 그대로
await ev(`T.cmd('exQuick')`);
d = await ev(`T.doc()`);
const [pc, q1] = d.diagrams[0].body[0].yes.map(n => n.id), pb = d.diagrams[1].body.map(n => n.id);
const has = id => ev(`!!document.querySelector('#svg [data-id="${id}"]')`);
const press = (id, code, o = '{}') => ev(`T.click('${id}'); T.key('${code}', ${o})`);
const model = () => ev(`JSON.stringify(T.doc())`);
const m0 = await model();
await press(pc, 'KeyF');
check('호출 블록에서 F: Method의 블록이 그 자리에 보임', (await has(`${pc}>${pb[0]}`)) && (await ev(`T.svg().includes('stroke="#7a5fb8"') && T.svg().includes('stroke-dasharray="6 4"') && T.svg().includes('fill="#555e70"')`)) === true, await ev(`T.msg()`));
check('펴 보인 호출 블록: 띠에 호출 블록의 글자 (이름은 굵게)', (await ev(`T.svg().includes('▾ p ← <tspan font-weight="600">partition</tspan>(a, lo, hi)')`)) === true);
check('펴 보기는 모델을 바꾸지 않음', (await model()) === m0);
await press(pc, 'KeyF');
check('다시 F: 접힘', !(await has(`${pc}>${pb[0]}`)) && (await ev(`!T.svg().includes('#7a5fb8')`)) === true);
await press(pc, 'KeyF');

// m. 펴 보인 블록은 고를 수 있지만 고칠 수 없다
const ghost = `${pc}>${pb[0]}`;
await press(pc, 'ArrowDown');
check('방향키로 펴 보인 블록에 들어감', (await ev(`document.querySelector('#where').textContent`)).includes('펴 보인'), await ev(`document.querySelector('#where').textContent`));
await press(ghost, 'Enter', `{ key: 'Enter' }`);
check('펴 보인 블록에서 Enter: 고치지 않고 알려 줌', (await ev(`T.editing()`)) === null && (await ev(`T.msg()`)).includes('펴 보인 블록은 고칠 수 없습니다'), await ev(`T.msg()`));
await ev(`T.click('${pb[1]}'); T.key('KeyC', { ctrl: true })`);
for (const [code, o] of [['Delete', '{}'], ['KeyO', '{}'], ['KeyO', '{ shift: true }'], ['KeyP', '{}'], ['KeyM', '{}'], ['KeyX', '{ ctrl: true }'], ['KeyV', '{ ctrl: true }']]) await press(ghost, code, o);
for (const [k1, k2] of [['KeyA', 'KeyI'], ['KeyA', 'KeyC'], ['KeyD', 'KeyD'], ['KeyD', 'KeyS'], ['KeyS', 'KeyW']]) await ev(`T.click('${ghost}'); T.key('${k1}'); T.key('${k2}')`);
check('펴 보인 블록: 넣기 · 지우기 · 감싸기 · 붙여넣기가 아무것도 바꾸지 않음', (await model()) === m0 && (await ev(`T.editing()`)) === null && (await ev(`T.msg()`)).includes('펴 보인 블록은 고칠 수 없습니다'), await ev(`T.msg()`));
await press(ghost, 'KeyC', '{ ctrl: true }');
await press(pb[pb.length - 1], 'KeyV', '{ ctrl: true }');
d = await ev(`T.doc()`);
const pasted = d.diagrams[1].body[pb.length];
check('펴 보인 블록을 복사해 붙이면 보통 블록', d.diagrams[1].body.length === pb.length + 1 && pasted.text === 'pivot = a[hi];' && !pasted.id.includes('>') && !('rid' in pasted), pasted);
await ev(`T.key('KeyZ', { ctrl: true })`);
check('되돌리면 붙이기 전으로, 펴짐은 그대로', (await model()) === m0 && (await has(ghost)));

// n. gd: 펴 보인 블록에서 원래 블록으로
await ev(`T.click('${ghost}'); T.key('KeyG'); T.key('KeyD')`);
await ev(`T.key('Enter', { key: 'Enter' })`);
check('펴 보인 블록에서 G: 원래 블록을 고름 (거기서는 고쳐짐)', (await ev(`T.editing()`)) === 'pivot = a[hi];', [await ev(`T.editing()`), await ev(`T.msg()`)]);
await ev(`T.type('pivot = a[lo];')`);
check('Method를 고치면 펴 보인 곳도 따라 바뀜', (await ev(`T.svg().includes('fill="#555e70" xml:space="preserve" style="white-space:pre" pointer-events="none">pivot = a[lo];</text>')`)) === true);
await ev(`T.key('KeyZ', { ctrl: true })`);
check('실행 취소는 내용만 되돌리고 펴짐은 그대로', (await model()) === m0 && (await has(ghost)) && (await ev(`T.svg().includes('>pivot = a[hi];</text>')`)) === true);
await press(pc, 'KeyF');

// o. 안쪽 펴기와 재귀 경고. 펴짐은 겹마다 따로 기억한다
await press(q1, 'KeyF');
check('quicksort 안의 quicksort를 폄 (두 겹째): 경고 없음', (await has(`${q1}>${pc}`)) && !(await ev(`T.msg()`)).includes('겹째'), await ev(`T.msg()`));
await press(`${q1}>${pc}`, 'KeyF');
check('펴 보인 안쪽의 호출 블록을 폄: 다른 Method라 경고 없음', (await has(`${q1}>${pc}>${pb[0]}`)) && !(await ev(`T.msg()`)).includes('겹째'), await ev(`T.msg()`));
check('같은 호출 블록이라도 경로가 다르면 따로: 바깥의 partition 호출은 접힌 채', !(await has(`${pc}>${pb[0]}`)));
await press(`${q1}>${q1}`, 'KeyF');
check('세 겹째: 펴고 나서 경고', (await has(`${q1}>${q1}>${pc}`)) && (await ev(`T.msg()`)).includes('quicksort') && (await ev(`T.msg()`)).includes('세 겹째'), await ev(`T.msg()`));
await press(`${q1}>${q1}>${q1}`, 'KeyF');
check('네 겹째: 펼 때마다 경고', (await has(`${q1}>${q1}>${q1}>${pc}`)) && (await ev(`T.msg()`)).includes('네 겹째'), await ev(`T.msg()`));
await press(`${q1}>${q1}`, 'KeyF');
check('가운데 겹을 접으면 그 안쪽도 안 보임', !(await has(`${q1}>${q1}>${pc}`)) && (await has(`${q1}>${pc}>${pb[0]}`)));
await press(`${q1}>${q1}`, 'KeyF');
check('다시 펴면 안쪽 겹의 펴짐이 남아 있음', await has(`${q1}>${q1}>${q1}>${pc}`));
await press(`${q1}>${q1}`, 'KeyF');
check('모델은 처음 그대로', (await model()) === m0);

// p. 확인 장면: partition 호출과 재귀 호출 하나를 펴고, partition 안에 접기 영역 하나를 펴 둔다
await press(pc, 'KeyF');
await ev(`T.click('${pb[0]}'); T.key('ArrowDown', { shift: true }); T.key('ArrowDown', { shift: true }); T.key('KeyZ'); T.key('KeyF')`);
await ev(`T.type('준비')`);
await ev(`T.key('KeyF')`);
check('펴 보인 쪽의 접기 영역은 Method의 접힘대로 (펴짐)', (await ev(`document.querySelectorAll('#svg rect[data-edge]').length`)) === 3, await ev(`document.querySelectorAll('#svg rect[data-edge]').length`));
await shot('p37-quick-open.png');
await ev(`T.key('KeyF')`);
check('펴 보인 쪽의 접기 영역은 Method의 접힘대로 (접힘)', (await ev(`document.querySelectorAll('#svg rect[data-edge]').length`)) === 0 && !(await has(`${pc}>${pb[0]}`)) && (await has(`${pc}>${pb[3]}`)));
await ev(`T.key('KeyF')`);

// q. 저장했다 다시 열면 펴짐이 남는다. 저장되는 그림에도 펴진 모습 그대로
const shownIds = `[...document.querySelectorAll('#svg [data-id*=">"]')].map(e => e.dataset.id).sort().join()`;
const before = await ev(shownIds);
const file = await ev(saved);
check('저장되는 그림과 보기 상태에 펴짐이 들어감', file.includes('#7a5fb8') && file.includes('fill="#555e70"') && /"opened": \[\s*"/.test(file), file.slice(0, 400));
await ev(`T.cmd('new')`);
check('새 문서: 펴 보인 것이 없음', (await ev(shownIds)) === '');
// 파일 고르기 창 대신, 저장한 파일을 '열기'의 파일 칸에 직접 넣는다
writeFileSync(join(outDir, 'p37-saved.ns.svg'), file);
const root = (await send('DOM.getDocument')).root.nodeId;
await send('DOM.setFileInputFiles', { files: [join(outDir, 'p37-saved.ns.svg')], nodeId: (await send('DOM.querySelector', { nodeId: root, selector: '#file' })).nodeId });
await sleep(500);
check('저장한 파일을 다시 열면 펴짐이 남음', before !== '' && (await ev(shownIds)) === before, [await ev(`T.msg()`), await ev(shownIds)]);
await ev(`location.reload()`);
await sleep(2500);
await ev(HELPERS);
check('페이지를 다시 열어도 펴짐이 남음', (await ev(shownIds)) === before, await ev(shownIds));

// r. 부르는 Method의 머리를 떼면 펴짐이 풀리고, 끊긴 호출 블록은 펴지 않는다
d = await ev(`T.doc()`);
await press(d.diagrams[1].id, 'Delete');
check('머리를 떼면 그 Method를 펴 보인 곳이 모두 풀림', !(await ev(shownIds)).includes(pc + '>') && (await ev(shownIds)) !== '', await ev(shownIds));
await press(pc, 'KeyF');
check('끊긴 호출 블록은 펴지 않음', !(await ev(shownIds)).includes(pc + '>') && (await ev(`T.msg()`)).includes('펼 수 없습니다'), await ev(`T.msg()`));

// j. 예전 문서 열기: 종류가 없으면 불리는 다이어그램은 Method로, 호출 블록의 자유 글자는 결과와 인자로 가름
await ev(`localStorage.setItem('nsd-proto-doc', JSON.stringify({ doc: { diagrams: [
  { id: 'g1', event: '타이머', body: [
    { id: 'n1', type: 'call', target: 'g2', text: '센서 읽기' },
    { id: 'n3', type: 'call', target: 'g3', text: 'y = calc(3);' },
    { id: 'n4', type: 'call', target: 'g3', text: 'v = f(x + 1)' },
    { id: 'n5', type: 'call', target: 'g3', text: '그냥 글자' },
    { id: 'n6', type: 'call', target: null, text: '없어진 것' } ] },
  { id: 'g2', event: '센서 읽기', body: [{ id: 'n2', type: 'process', text: 'adc_start();' }] },
  { id: 'g3', event: 'calc(x)', body: [{ id: 'n7', type: 'process', text: 'return x * 2;' }] } ] }, opts: {} })); location.reload()`);
await sleep(2500);
await ev(HELPERS);
const old = await ev(`(() => { document.querySelector('#optSyntax').dispatchEvent(new Event('change')); const d = T.doc(), cs = d.diagrams[0].body; return d.diagrams.map(x => x.kind + ':' + x.event).join('|') + ' / ' + cs.map(c => T.line(c, d)).join('|') + ' / ' + cs.some(c => 'text' in c); })()`);
check('예전 문서: 종류를 가르고, 자유 글자를 결과와 인자로 가름', old === 'event:타이머|method:센서 읽기|method:calc(x) / 센서 읽기|y ← calc(3)|v ← calc(x + 1)|calc(그냥 글자)|없어진 것 / false', old);

// v. Vim 키: 키 배열은 하나이고, 표준 키 위에 Vim 키가 얹혀 있다 (ADR-0025)
await ev(`T.cmd('exCode')`);
const texts = `T.doc().diagrams[0].body.map(n => n.type === 'process' ? n.text : n.type).join('|')`;
const where = `document.querySelector('#where').textContent`;
const mode = `document.querySelector('#mode').textContent`;
const keys = async (...ks) => { for (const k of ks) await ev(`T.key('${k.replace(/^\+/, '')}', { shift: ${k.startsWith('+')} })`); };
const t0 = await ev(texts);
d = await ev(`T.doc()`);
const b0 = d.diagrams[0].body[0].id, hd = d.diagrams[0].id;
check('끄고 켜는 스위치가 없음', await ev(`!document.querySelector('#optVim') && document.querySelectorAll('dl.keys').length === 1`));
await ev(`T.click('${b0}')`); await keys('KeyJ');
check('j: 아래 블록으로', (await ev(where)) === 'If', await ev(where));
await keys('KeyK', 'KeyK');
check('k: 위로 (머리까지)', (await ev(where)) === 'Event 머리', await ev(where));
await keys('+KeyG');
check('G: 마지막 블록', (await ev(where)) === '처리', await ev(where));
await keys('KeyG'); check('g를 누르면 기다림', (await ev(mode)) === 'g', await ev(mode));
await keys('KeyG');
check('gg: 머리로', (await ev(where)) === 'Event 머리' && (await ev(mode)) === '', await ev(where));
await ev(`T.click('${b0}')`); await keys('KeyP');
check('p: 붙일 것이 없으면 넣지 않음 (처리 넣기가 아님)', (await ev(texts)) === t0 && (await ev(`T.msg()`)).includes('붙일 것이 없습니다'), await ev(`T.msg()`));
await keys('KeyO'); check('o: 고치기 표시', (await ev(mode)) === '-- 고치기 --', await ev(mode));
await ev(`T.type('x1')`);
check('o: 처리 블록을 뒤에 넣고 바로 적음', (await ev(texts)).startsWith('tick++;|x1|if'), await ev(texts));
await keys('+KeyO');
await ev(`document.querySelector('#editor').value = 'x0'; T.key('Escape', { editor: true, key: 'Escape' })`);
check('O: 앞에 넣음. Esc는 적은 대로 받아들임', (await ev(texts)).startsWith('tick++;|x0|x1|if') && (await ev(`T.editing()`)) === null, await ev(texts));
await keys('KeyA', 'KeyW'); await ev(`T.type('c1')`);
check('a w: While을 뒤에', (await ev(texts)).startsWith('tick++;|x0|while|x1'), await ev(texts));
await keys('+KeyA', 'KeyI'); await ev(`T.type('c2')`);
check('A i: If를 앞에', (await ev(texts)).startsWith('tick++;|x0|if|while|x1'), await ev(texts));
await keys('KeyD', 'KeyD');
check('dd: 잘라내기', (await ev(texts)).startsWith('tick++;|x0|while|x1'), await ev(texts));
await keys('KeyP');
check('p: 뒤에 붙이기 (ddp는 한 칸 아래로)', (await ev(texts)).startsWith('tick++;|x0|while|if|x1'), await ev(texts));
await keys('KeyY', 'KeyY', '+KeyP');
check('yy P: 복사해 앞에 붙이기', (await ev(texts)).startsWith('tick++;|x0|while|if|if|x1'), await ev(texts));
await keys('KeyU');
check('u: 되돌리기', (await ev(texts)).startsWith('tick++;|x0|while|if|x1'), await ev(texts));
await keys('+KeyU');
check('U: 다시', (await ev(texts)).startsWith('tick++;|x0|while|if|if|x1'), await ev(texts));
await ev(`T.click(T.doc().diagrams[0].body[3].id)`);   // 다시 하기 뒤에는 고른 것이 남지 않는다
await keys('KeyV'); check('v: 영역 표시', (await ev(mode)) === '-- 영역 --', await ev(mode));
await keys('KeyJ');
check('v j: 영역을 넓힘', (await ev(where)) === '2개 고름', await ev(where));
await keys('KeyD');
check('v j d: 고른 영역을 잘라냄', (await ev(texts)).startsWith('tick++;|x0|while|x1') && (await ev(mode)) === '', await ev(texts));
await ev(`T.click('${b0}')`); await keys('KeyJ', 'KeyS', 'KeyD'); await ev(`T.type('c3')`);
check('s d: Do-While로 감싸기', (await ev(texts)).startsWith('tick++;|dowhile|while|x1'), await ev(texts));
await keys('KeyD', 'KeyS');
check('ds: 제어 블록 풀기', (await ev(texts)).startsWith('tick++;|x0|while|x1'), await ev(texts));
await ev(`T.click('${b0}')`); await keys('KeyV', 'KeyJ', 'KeyZ', 'KeyF');
await ev(`document.querySelector('#editor').value = '묶음'; T.key('Escape', { editor: true, key: 'Escape' })`);
check('v j zf: 접기 영역 만들기. Esc가 이름을 받아들임', await ev(`T.doc().diagrams[0].body[0].type === 'range' && T.doc().diagrams[0].body[0].name === '묶음'`), await ev(texts));
const foldedN = `JSON.parse(localStorage.getItem('nsd-proto-fold')).length`;
const f0 = await ev(foldedN);
await keys('KeyZ', 'KeyA');
check('za: 접기 · 펴기', (await ev(foldedN)) === f0 - 1, [f0, await ev(foldedN)]);
await keys('KeyZ', 'KeyD');
check('zd: 접기 영역 풀기', (await ev(texts)).startsWith('tick++;|x0|while|x1'), await ev(texts));
await ev(`T.click('${b0}')`); await keys('KeyZ', 'KeyQ');
check('없는 둘째 키: 그만두고 아무 일도 없음', (await ev(`T.msg()`)).includes('없는 키') && (await ev(mode)) === '' && (await ev(texts)).startsWith('tick++;|x0|while|x1'), await ev(`T.msg()`));
await keys('Escape');
check('고른 상태의 Esc: 고른 것을 풀지 않음', (await ev(where)) === '처리', await ev(where));
await ev(`T.click('${hd}')`); await keys('KeyI');
await ev(`T.type('')`);
check('머리 이름을 비움: 고치기 전 이름으로 돌아가고 칸은 닫힘 (65번째 판부터, Q4)', (await ev(`T.editing()`)) === null && /비울 수 없어/.test(await ev(`T.msg()`)), await ev(`T.msg()`));
await ev(`T.key('Escape', { editor: true, key: 'Escape' })`);
check('다시 열린 칸에서 Esc: 그만두기 (갇히지 않음)', (await ev(`T.editing()`)) === null && (await ev(`T.doc().diagrams[0].event`)) === 'TIM2 인터럽트 (1ms)', await ev(`T.doc().diagrams[0].event`));
await ev(`T.cmd('exQuick')`);
d = await ev(`T.doc()`);
await ev(`T.click('${d.diagrams[0].body[0].yes[0].id}')`); await keys('KeyG', 'KeyD');
check('gd: 부르는 Method로', (await ev(where)) === 'Method 머리' && (await ev(`T.msg()`)) !== '', await ev(where));
await keys('BracketLeft', 'BracketLeft');
const atFirst = await ev(where);
await keys('BracketRight', 'BracketRight', 'KeyJ');
check('[[ ]]: 앞 · 뒤 다이어그램', atFirst === 'Method 머리' && (await ev(where)) === '처리', [atFirst, await ev(where)]);
await ev(`T.cmd('exCode')`);
d = await ev(`T.doc()`);
await ev(`T.click('${d.diagrams[0].body[0].id}')`); await keys('KeyW', '+KeyK', 'KeyC', '+KeyD');
check('옛 한 글자 키(W, K, C, D)는 아무것도 넣지 않음 (W는 59번째 판에서 되살렸다가 60번째 판에서 다시 뺌)', (await ev(texts)) === t0 && (await ev(`T.editing()`)) === null, [await ev(texts), await ev(`T.editing()`)]);

// y. Vim에 맞춘 것 (2026-10-13): ds가 호출 블록을 풀고 안쪽에서도 들음, i · cc, Ctrl+R, V, zo · zc
await ev(`T.cmd('exQuick')`);
d = await ev(`T.doc()`);
{
  const call = d.diagrams[0].body[0].yes[0].id, nMeth = d.diagrams[1].body.length;
  await ev(`T.click('${call}')`); await keys('KeyD', 'KeyS');
  let q = await ev(`T.doc()`);
  check('호출 블록에서 ds: Method의 블록들로 바뀜 (글자 그대로, Method는 남음)', q.diagrams[0].body[0].yes.length === nMeth + 2 && q.diagrams[0].body[0].yes[0].text === 'pivot = a[hi];' && q.diagrams[1].body.length === nMeth && q.diagrams[0].body[0].yes[0].id !== q.diagrams[1].body[0].id, q.diagrams[0].body[0].yes.map(n => n.type));
  await ev(`T.key('KeyR', { ctrl: true })`);
  await keys('KeyU');
  q = await ev(`T.doc()`);
  check('u 한 번으로 되돌림', q.diagrams[0].body[0].yes.length === 3 && q.diagrams[0].body[0].yes[0].type === 'call', q.diagrams[0].body[0].yes.map(n => n.type));
  await ev(`T.key('KeyR', { ctrl: true })`);
  check('Ctrl+R: 다시 하기', (await ev(`T.doc().diagrams[0].body[0].yes.length`)) === nMeth + 2);
  await keys('KeyU');
  await ev(`T.click('${d.diagrams[1].id}')`); await keys('KeyX');
  await ev(`T.click('${call}')`); await keys('KeyD', 'KeyS');
  check('이어진 곳이 없는 호출 블록에서 ds: 풀 수 없음', (await ev(`T.msg()`)).includes('풀 수 없습니다') && (await ev(`T.doc().diagrams[0].body[0].yes[0].type`)) === 'call', await ev(`T.msg()`));
}
await ev(`T.cmd('exCode')`);
d = await ev(`T.doc()`);
{
  const inIf = d.diagrams[0].body[1].yes[1].yes[0].id;
  await ev(`T.click('${inIf}')`); await keys('KeyD', 'KeyS');
  const q = await ev(`T.doc()`);
  check('안쪽 블록에서 ds: 가장 가까운 제어 블록이 벗겨지고 고른 것은 그대로', q.diagrams[0].body[1].type === 'if' && q.diagrams[0].body[1].yes.map(n => n.type).join() === 'process,process,process' && (await ev(where)) === '처리', q.diagrams[0].body[1].yes.map(n => n.type));
  await ev(`T.click('${d.diagrams[0].body[0].id}')`); await keys('KeyD', 'KeyS');
  check('담은 제어 블록이 없으면 ds는 아무것도 하지 않음', (await ev(`T.msg()`)).includes('벗길 제어 블록이 없습니다'), await ev(`T.msg()`));
  await keys('KeyI');
  const caret = await ev(`(() => { const e = document.querySelector('#editor'); return [e.value, e.selectionStart, e.selectionEnd].join('|'); })()`);
  await ev(`T.key('Escape', { editor: true, key: 'Escape' })`);
  check('i: 글자를 두고 커서를 맨 앞에', caret === 'tick++;|0|0' && (await ev(`T.doc().diagrams[0].body[0].text`)) === 'tick++;', caret);
  await ev(`T.key('Enter', { key: 'Enter' })`);
  check('Enter: 글자 전체를 고른 채로', (await ev(`T.picked()`)) === 'tick++;');
  await ev(`T.key('Escape', { editor: true, key: 'Escape' })`);
  await keys('KeyC', 'KeyC');
  check('cc: 비우고 새로 적기', (await ev(`T.editing()`)) === '');
  await ev(`T.type('tock++;')`);
  check('cc로 적은 글자가 들어감', (await ev(`T.doc().diagrams[0].body[0].text`)) === 'tock++;');
  await keys('+KeyV', 'KeyJ');
  check('V: 영역 고르기', (await ev(where)) === '2개 고름', await ev(where));
  await keys('Escape');
  const fN = `JSON.parse(localStorage.getItem('nsd-proto-fold')).length`;
  await ev(`T.click(T.doc().diagrams[0].body[2].children[0].id)`);
  const n0 = await ev(fN);
  await keys('KeyZ', 'KeyO');
  const n1 = await ev(fN), m1 = await ev(`T.msg()`);
  await keys('KeyZ', 'KeyC');
  const n2 = await ev(fN);
  await keys('KeyZ', 'KeyC');
  const n3 = await ev(fN), m3 = await ev(`T.msg()`);
  await keys('KeyZ', 'KeyO');
  check('zo · zc: 펴기만 / 접기만', n1 === n0 && m1.includes('이미 펴져') && n2 === n0 + 1 && n3 === n2 && m3.includes('이미 접혀') && (await ev(fN)) === n0, [n0, n1, m1, n2, n3, m3, await ev(fN)]);
}

// z. zR · zM: 모두 펴기 / 모두 접기
await ev(`T.cmd('exCode')`);
{
  const fN = `JSON.parse(localStorage.getItem('nsd-proto-fold')).length`, shownBlocks = `document.querySelectorAll('#svg [data-id]').length`;
  const m0 = await ev(`JSON.stringify(T.doc())`), v0 = await ev(shownBlocks);
  await ev(`T.click(T.doc().diagrams[0].body[2].children[0].id)`); await keys('KeyZ', '+KeyM');
  const nM = await ev(fN), vM = await ev(shownBlocks), wM = await ev(where);
  await keys('KeyZ', '+KeyR');
  const nR = await ev(fN), vR = await ev(shownBlocks);
  await keys('KeyZ', '+KeyR');
  check('zM: 접기 영역과 접을 수 있는 제어 블록이 모두 접히고, 숨은 블록 대신 그 접기 영역이 골라짐', nM >= 4 && vM < v0 && wM.startsWith('접기 영역 (접힘)'), [nM, v0, vM, wM]);
  check('zR: 모두 펴짐. 한 번 더 누르면 알려 줌', nR === 0 && vR > v0 && (await ev(`T.msg()`)).includes('접힌 곳이 없습니다'), [nR, vR, await ev(`T.msg()`)]);
  check('zR · zM은 내용을 바꾸지 않음', (await ev(`JSON.stringify(T.doc())`)) === m0);
}
await ev(`T.cmd('exQuick')`);
d = await ev(`T.doc()`);
{
  const call = d.diagrams[0].body[0].yes[0].id, inner = d.diagrams[1].body[0].id;
  await ev(`T.click('${call}')`); await keys('KeyZ', 'KeyA', 'KeyZ', '+KeyM');
  const closed = !(await has(`${call}>${inner}`));
  await keys('KeyZ', '+KeyR');
  check('zM은 펴 보인 호출 블록도 접고, zR은 호출 블록을 펴 보이지 않음', closed && !(await has(`${call}>${inner}`)));
}

// x. 펴 보인 안쪽에서 za: 가장 가까운 펴 보인 호출 블록이 접힘
await ev(`T.cmd('exQuick')`);
d = await ev(`T.doc()`);
{
  const call = d.diagrams[0].body[0].yes[0].id, inner = d.diagrams[1].body[0].id;
  await ev(`T.click('${call}')`); await keys('KeyZ', 'KeyA');
  const opened = await has(`${call}>${inner}`);
  await ev(`T.click('${call}>${inner}')`); await keys('KeyZ', 'KeyA');
  check('펴 보인 안쪽에서 za: 그 호출 블록이 접히고 호출 블록이 골라짐', opened && !(await has(`${call}>${inner}`)) && (await ev(where)) === '호출', [opened, await ev(where), await ev(`T.msg()`)]);
}

// w. inbox(2026-10-13): 위·아래로는 옆 갈래로 넘어가지 않음, 머리에서 dd, 접기 영역 보기가 꺼졌을 때의 안내
await ev(`T.cmd('exCode')`);
d = await ev(`T.doc()`);
const if1 = d.diagrams[0].body[1], if2 = d.diagrams[0].body[1].yes[1];
await ev(`T.click('${if2.yes[1].id}')`); await keys('KeyJ');
check('안쪽 If의 참 갈래 끝에서 j: 거짓 갈래가 아니라 바깥 If의 다음 블록으로', (await ev(where)) === '처리  ·  접기 영역: 센서 읽기', await ev(where));
await ev(`T.click('${if1.no[0].id}')`); await keys('KeyK');
check('거짓 갈래의 처음에서 k: 참 갈래가 아니라 그 갈래 이름으로 (65번째 판부터, Q10-b)', (await ev(where)).includes('갈래 이름 "거짓"'), await ev(where));
await keys('KeyK');
check('거짓 갈래 이름에서 k: 그 If로', (await ev(where)) === 'If', await ev(where));
await ev(`T.click('${if1.no[0].id}')`); await keys('KeyJ');
check('거짓 갈래의 끝에서 j: If의 다음 블록으로', (await ev(where)) === '처리  ·  접기 영역: 센서 읽기', await ev(where));
await ev(`T.click('${if1.yes[0].id}')`); await keys('KeyJ');
check('갈래 안에서 j: 그대로 아래 블록으로', (await ev(where)) === 'If', await ev(where));
await ev(`T.click('${if1.yes[0].id}')`); await keys('KeyL');
check('l: 옆 갈래로는 좌우로', (await ev(where)) === '처리' && (await ev(`T.msg()`)) !== '', await ev(where));
await ev(`T.click('${d.diagrams[0].id}')`); await keys('KeyD', 'KeyD');
check('머리에서 dd: 머리 떼기 (Delete와 같음)', (await ev(`T.doc().diagrams[0].event`)) === null, await ev(`T.msg()`));
await keys('KeyU');
await ev(`T.click('${d.diagrams[0].id}')`); await keys('KeyX');
check('머리에서 x: 머리 떼기 (Delete와 같음)', (await ev(`T.doc().diagrams[0].event`)) === null, await ev(`T.msg()`));
await keys('KeyU');
await ev(`T.click('${d.diagrams[0].body[0].id}')`); await keys('KeyX');
check('블록에서 x: 복사 없이 지움 (Delete와 같음)', (await ev(`T.doc().diagrams[0].body[0].type`)) === 'if', await ev(`T.msg()`));
await keys('KeyP');
check('x로 지운 것은 붙일 수 없음', await ev(`T.doc().diagrams[0].body.every(n => n.text !== 'tick++;')`), await ev(`T.msg()`));
const nBefore = await ev(`T.doc().diagrams[0].body.length`);
await ev(`T.click(T.doc().diagrams[0].body[0].id)`); await keys('KeyV', 'KeyJ', 'KeyX');
check('v j x: 고른 영역을 지움', (await ev(`T.doc().diagrams[0].body.length`)) === nBefore - 2, await ev(texts));
await ev(`T.cmd('exCode')`);
await ev(`T.click('${d.diagrams[0].body[0].id}')`); await keys('KeyK');
const noHint = await ev(`T.key('ArrowUp', { shift: true }); T.msg()`);
await ev(`document.querySelector('#optRanges').click()`);
await ev(`T.click('${d.diagrams[0].body[0].id}')`);
const hint = await ev(`T.key('ArrowUp', { shift: true }); T.msg()`);
await ev(`document.querySelector('#optRanges').click()`);
check('영역을 넓힐 수 없을 때: 접기 영역 보기가 꺼져 있으면 그것도 알림', !noHint.includes('접기 영역 보기') && hint.includes('같은 부모 안에서만') && hint.includes('"접기 영역 보기"가 꺼져'), [noHint, hint]);
check('설정의 이름은 "접기 영역 보기"', (await ev(`document.querySelector('#optRanges').parentElement.textContent.trim()`)) === '접기 영역 보기');

// z. 46번째 판: 겹친 테두리의 틈, 펴 보인 곳에만 있는 접기 영역
await ev(`T.cmd('exQuick')`);
d = await ev(`T.doc()`);
{
  const call = d.diagrams[0].body[0].yes[0].id, part = d.diagrams[1], pid = part.body.map(n => n.id);
  const gid = id => `${call}>${id}`;
  const sf = () => ev(`T.doc().sfolds || []`);
  const box = sel => ev(`(el => el && ['x', 'y', 'width', 'height'].map(a => +el.getAttribute(a)))(document.querySelector('#svg ${sel}'))`);
  const m0 = JSON.stringify((await ev(`T.doc()`)).diagrams);
  await ev(`T.click('${call}')`); await keys('KeyZ', 'KeyA');
  await ev(`T.click('${gid(pid[0])}'); T.key('ArrowDown', { shift: true })`); await keys('KeyZ', 'KeyF');
  check('펴 보인 곳에서 zf: 이름을 묻는 칸이 열림', (await ev(`T.editing()`)) !== null, await ev(`T.msg()`));
  await ev(`T.type('피벗 준비')`);
  let f = await sf();
  check('펴 보인 곳에서 zf: 이 자리의 접기 영역이 생기고 Method는 그대로', f.length === 1 && f[0].pre === call && f[0].name === '피벗 준비' && f[0].rids.join() === pid.slice(0, 2).join() && JSON.stringify((await ev(`T.doc()`)).diagrams) === m0, f);
  const lid = `${call}>${f[0].id}`;
  check('이 자리의 접기 영역: 만들면 접힌 채, 원본 다이어그램에는 없음', (await has(lid)) && !(await has(gid(pid[0]))) && (await has(pid[0])) && (await ev(`document.querySelectorAll('#svg rect[data-edge]').length`)) === 0);
  await ev(`T.click('${lid}')`); await keys('KeyZ', 'KeyA');
  const e1 = await box(`rect[data-edge="${lid}"]`), dash = await box(`rect[data-dash="${call}"]`);
  check('이 자리의 접기 영역을 za로 폄: 접기 영역과 같은 테두리', (await has(gid(pid[0]))) && !!e1, e1);
  const outer = await box(`rect[data-id="${gid(pid[2])}"]`);
  check('펴 보인 호출 블록: 점선이 바깥 선에서 1px 안으로 (보통 블록의 왼쪽 선 + 2가 점선 자리의 가운데)', !!outer && dash[0] === outer[0] + 2, [outer, dash]);
  check('겹친 테두리: 양옆에 틈 1px (점선 자리 + 틈 1 + 테두리의 가운데)', !!e1 && !!dash && e1[0] - dash[0] === 3 && (dash[0] + dash[2]) - (e1[0] + e1[2]) === 3, [e1, dash]);
  await ev(`T.click('${gid(pid[0])}')`); await keys('KeyZ', 'KeyA');
  check('이 자리의 접기 영역 안에서 za: 호출 블록이 아니라 그 접기 영역이 접힘', (await has(lid)) && !(await has(gid(pid[0]))) && (await has(gid(pid[2]))), await ev(`T.msg()`));
  await ev(`T.click('${lid}')`); await keys('KeyI');
  check('이 자리의 접기 영역: i로 이름을 고침', (await ev(`T.editing()`)) === '피벗 준비', await ev(`T.msg()`));
  await ev(`T.type('준비')`);
  check('이 자리의 접기 영역: 고친 이름이 남음', (await sf())[0].name === '준비', await sf());
  await ev(`T.click('${lid}')`); await keys('KeyD', 'KeyD');
  check('이 자리의 접기 영역에서 dd: 고칠 수 없다고 알림', (await sf()).length === 1 && JSON.stringify((await ev(`T.doc()`)).diagrams) === m0 && (await ev(`T.msg()`)).includes('펴 보인 블록은 고칠 수 없습니다'), await ev(`T.msg()`));
  // Method에서 묶인 블록 하나를 지우면 줄어든다
  await ev(`T.click('${pid[1]}')`); await keys('KeyX');
  await ev(`T.click('${lid}')`); await keys('KeyZ', 'KeyA');
  check('Method에서 묶인 블록 하나를 지움: 접기 영역이 남은 블록으로 줄어듦', (await sf()).length === 1 && (await has(gid(pid[0]))) && !(await has(gid(pid[1]))) && !!(await box(`rect[data-edge="${lid}"]`)), await ev(`T.msg()`));
  await ev(`T.click('${pid[0]}')`); await keys('KeyX');
  check('묶인 블록이 모두 지워짐: 이 자리의 접기 영역이 사라짐', (await sf()).length === 0, await sf());
  await keys('KeyU', 'KeyU');
  check('되돌리면 이 자리의 접기 영역도 돌아옴', (await sf()).length === 1 && JSON.stringify((await ev(`T.doc()`)).diagrams) === m0, await sf());
  // 저장했다 다시 열기
  const file2 = await ev(saved);
  check('저장되는 파일에 이 자리의 접기 영역이 들어감', file2.includes('"siteFolds"') && file2.includes('"준비"'), file2.slice(0, 300));
  // zd: 이 자리의 것만 풀린다
  await ev(`T.click('${gid(pid[0])}')`); await keys('KeyZ', 'KeyD');
  check('이 자리의 접기 영역에서 zd: 풀림, Method는 그대로', (await sf()).length === 0 && JSON.stringify((await ev(`T.doc()`)).diagrams) === m0, await ev(`T.msg()`));
  await keys('KeyU');
  // ds: 보통 접기 영역이 되어 함께 들어온다
  await ev(`T.click('${call}')`); await keys('KeyD', 'KeyS');
  const yes = (await ev(`T.doc()`)).diagrams[0].body[0].yes;
  check('호출 블록을 ds로 풂: 이 자리의 접기 영역이 보통 접기 영역으로 들어옴', yes[0].type === 'range' && yes[0].name === '준비' && yes[0].children.length === 2 && !yes[0].id.includes('>') && !('local' in yes[0]) && (await sf()).length === 0, yes[0]);
  await keys('KeyU');
  check('되돌리면 호출 블록과 이 자리의 접기 영역이 돌아옴', (await sf()).length === 1 && JSON.stringify((await ev(`T.doc()`)).diagrams) === m0);
  // 호출 블록을 지우면 함께 사라진다
  await ev(`T.click('${call}')`); await keys('KeyX');
  check('호출 블록을 지움: 이 자리의 접기 영역도 사라짐', (await sf()).length === 0, await sf());
  await keys('KeyU');
  await shot('p46-site-fold.png');
}
// Method에 원래 있던 접기 영역은 펴 보인 곳에서 풀 수 없다
{
  d = await ev(`T.doc()`);
  const call = d.diagrams[0].body[0].yes[0].id, pid = d.diagrams[1].body.map(n => n.id);
  await ev(`T.click('${pid[2]}'); T.key('ArrowDown', { shift: true })`); await keys('KeyZ', 'KeyF');
  await ev(`T.type('끝내기')`);
  const orig = (await ev(`T.doc()`)).diagrams[1].body.find(n => n.type === 'range');
  await ev(`T.click('${orig.id}')`); await keys('KeyZ', 'KeyA');
  await ev(`T.click('${call}')`); await keys('KeyZ', 'KeyO');   // ds를 되돌려도 펴짐(보기 상태)은 돌아오지 않으므로 다시 편다
  const before = JSON.stringify(await ev(`T.doc()`));
  await ev(`T.click('${call}>${orig.children[0].id}')`); await keys('KeyZ', 'KeyD');
  check('펴 보인 곳에서 Method의 접기 영역에 zd: 풀지 않고 알림', JSON.stringify(await ev(`T.doc()`)) === before && (await ev(`T.msg()`)).includes('여기서 풀 수 없습니다'), await ev(`T.msg()`));
  await shot('p46-borders.png');
}

// 47번째 판: 블록 하나도 접기 영역으로, 판 번호가 보임
await ev(`T.cmd('exQuick')`);
{
  const one = (await ev(`T.doc()`)).diagrams[1].body[0];
  await ev(`T.click('${one.id}')`); await keys('KeyZ', 'KeyF');
  await ev(`T.type('피벗')`);
  const g1 = (await ev(`T.doc()`)).diagrams[1].body[0];
  check('블록 하나에서 zf: 접기 영역이 됨', g1.type === 'range' && g1.name === '피벗' && g1.children.length === 1 && g1.children[0].id === one.id, g1);
  await ev(`T.click('${g1.id}')`); await keys('KeyZ', 'KeyA');
  check('블록 하나짜리 접기 영역을 폄: 테두리가 보임', (await ev(`!!document.querySelector('#svg rect[data-edge="${g1.id}"]')`)) === true);
  check('판 번호가 화면에 보임', /^\d+번째 판$/.test(await ev(`document.querySelector('#edition').textContent`)), await ev(`document.querySelector('#edition').textContent`));
}

// 52번째 판: 고른 것 풀기(Esc 두 번, 빈 캔버스), 휠로 이동, If · Case 아래에서 k는 가장 왼쪽 갈래로
{
  // 지금 고른 블록의 id: 고른 칸의 왼쪽 위 안쪽에 있는 블록
  const selId = `(() => { const b = document.querySelector('#svg [data-selbox]'); if (!b) return null; const r = b.getBoundingClientRect(); const el = document.elementFromPoint(r.left + 4, r.top + 4); return el && el.closest('[data-id]') ? el.closest('[data-id]').dataset.id : '?'; })()`;
  // 아래에 블록이 있는 If · Case와, 그 아래 블록, 가장 왼쪽 · 가장 오른쪽 갈래의 맨 아래 블록
  const findIf = `(() => { const sl = n => n.type === 'case' ? n.labels.map((_, i) => 'c' + i) : n.type === 'if' ? ['yes', 'no'] : [];
    const bot = (n, left) => { if (n.type === 'range') return bot(n.children[n.children.length - 1], left); const s = sl(n); if (!s.length) return n.id; const l = n[left ? s[0] : s[s.length - 1]]; return bot(l[l.length - 1], left); };
    for (const d of T.doc().diagrams) { const b = d.body; for (let i = 0; i + 1 < b.length; i++) if (sl(b[i]).length && b[i + 1].type === 'process') return { below: b[i + 1].id, left: bot(b[i], true), right: bot(b[i], false) }; } return null; })()`;
  let f = null;
  for (const ex of ['exCode', 'exCase', 'exRaft']) { await ev(`T.cmd('${ex}')`); if ((f = await ev(findIf))) break; }
  check('52: 아래에 블록이 있는 If · Case를 예제에서 찾음', !!f && f.left !== f.right, f);
  await ev(`T.click('${f.below}')`); await keys('KeyK');
  check('52: If · Case 아래에서 k: 가장 왼쪽 갈래의 맨 아래 블록', (await ev(selId)) === f.left, { got: await ev(selId), f });
  await ev(`T.click('${f.below}')`); await keys('ArrowUp');
  check('52: ↑도 같음', (await ev(selId)) === f.left, await ev(selId));

  await ev(`T.click('${f.below}')`); await keys('Escape');
  check('52: Esc 한 번: 고른 채로 두고 안내', (await ev(selId)) === f.below && (await ev(`T.msg()`)).includes('한 번 더'), await ev(`T.msg()`));
  await keys('Escape');
  check('52: Esc 두 번: 고른 것이 풀림', (await ev(selId)) === null && (await ev(where)).startsWith('다이어그램 '), await ev(where));
  await keys('KeyJ');
  check('52: 풀린 뒤 j: 마지막에 골랐던 블록을 다시 고름', (await ev(selId)) === f.below, await ev(selId));
  await keys('Escape', 'KeyL', 'Escape');
  check('52: Esc 사이에 다른 키를 누르면 풀지 않음', (await ev(selId)) !== null, await ev(where));

  await ev(`T.click('${f.below}')`);
  await ev(`(() => { const s = document.querySelector('#stage'), r = s.getBoundingClientRect(); s.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: r.left + 3, clientY: r.top + s.clientHeight - 6, bubbles: true, cancelable: true })); })()`);
  check('52: 빈 캔버스를 누르면 고른 것이 풀림', (await ev(selId)) === null, await ev(where));

  const wheel = dy => ev(`(() => { const e = new WheelEvent('wheel', { deltaY: ${dy}, bubbles: true, cancelable: true }); document.querySelector('#paper').dispatchEvent(e); return e.defaultPrevented; })()`);
  check('52: 고르지 않은 상태의 휠: 스크롤에 맡김', (await wheel(100)) === false && (await ev(selId)) === null);
  await ev(`T.click('${f.below}')`); await keys('KeyK'); const up1 = await ev(selId);
  await ev(`T.click('${f.below}')`);
  check('52: 고른 상태의 휠 위로 한 칸: k와 같음', (await wheel(-100)) === true && (await ev(selId)) === up1, await ev(selId));
  await ev(`T.click('${f.below}')`); await keys('KeyJ'); const down1 = await ev(selId);
  await ev(`T.click('${f.below}')`);
  for (let i = 0; i < 4; i++) await wheel(10);
  check('52: 터치패드의 작은 움직임은 쌓일 때까지 움직이지 않음', (await ev(selId)) === f.below, await ev(selId));
  await wheel(10);
  check('52: 쌓이면 한 번 움직임 (j와 같음)', (await ev(selId)) === down1, { got: await ev(selId), down1 });
}

// 53번째 판: 시각 디자인 문서에 맞춘 모습 (docs/02-ux-design/04-visual-design.md)
await ev(`T.cmd('exCode')`);
{
  const b = (await ev(`T.doc()`)).diagrams[0].body;
  await ev(`T.click('${b[1].id}')`);
  const box = await ev(`(e => e && [e.getAttribute('fill'), e.getAttribute('stroke-width'), e.getAttribute('x')])(document.querySelector('#svg rect[data-selbox]'))`);
  check('56: 고른 표시는 바탕 없이 3px 테두리, 선의 가운데가 반 픽셀', !!box && box[0] === 'none' && box[1] === '3' && Number.isInteger(+box[2]), box);
  check('53: 고른 것이 있으면 캔버스 포커스 테두리 없음', (await ev(`document.querySelector('.stage').classList.contains('nosel')`)) === false);
  const file = await ev(saved);
  check('55: 저장되는 그림에는 편집 층의 주황이 없음 (고른 표시와 접기 영역의 색이 다름)', !file.includes('#d0500b') && file.includes('#4f74d6'), file.slice(0, 200));
  check('53: 저장 파일의 이름은 ariadne-nsd (옛 이름 없음)', file.includes('"format": "ariadne-nsd"') && file.includes('id="ariadne-nsd-model"') && !file.includes('nsdrawing'), file.slice(0, 300));
  check('53: 작은 글자는 12px 하나', !/font-size="(11|11\.5|12\.5)"/.test(file));
  check('55: 저장되는 그림에서 2px 이상의 선은 모두 접기 영역의 테두리 색 (두르는 표시는 문서 층에 하나뿐)', [...file.matchAll(/stroke="(#[0-9a-f]{6})" stroke-width="[23]"/g)].every(m => m[1] === '#4f74d6') && file.includes('stroke="#4f74d6" stroke-width="3"'));
  await keys('Escape', 'Escape');
  check('53: 고른 것을 풀면 캔버스에 포커스 테두리용 표시', (await ev(`document.querySelector('.stage').classList.contains('nosel')`)) === true);
}

// 58번째 판: 접기 영역의 옛 키 Shift+F(만들기) · Ctrl+Shift+F(풀기)
await ev(`T.cmd('exCode')`);
{
  const ranges = () => ev(`(() => { let k = 0; const w = l => l.forEach(n => { if (n.type === 'range') k++; ['children', 'yes', 'no', 'body'].forEach(s => n[s] && w(n[s])); }); T.doc().diagrams.forEach(d => w(d.body)); return k; })()`);
  const before = await ranges();
  const b = (await ev(`T.doc()`)).diagrams[0].body;
  await ev(`T.click('${b[1].id}'); T.key('KeyF', { shift: true })`);
  if ((await ev(`T.editing()`)) !== null) await ev(`T.type('옛 키')`);
  check('58: Shift+F로 접기 영역을 만듦', (await ranges()) === before + 1, await ev(`T.msg()`));
  await ev(`T.key('KeyF', { ctrl: true, shift: true })`);
  check('58: Ctrl+Shift+F로 접기 영역을 풂', (await ranges()) === before, await ev(`T.msg()`));
}

// 59번째 판: 겹치지 않는 옛 키 Shift+L(갈래 이름 고치기). w / W는 60번째 판에서 뺌
await ev(`T.cmd('exCode')`);
{
  await ev(`T.cmd('exCase')`);
  const cs = (await ev(`T.doc()`)).diagrams[0].body.find(n => n.type === 'case');
  await ev(`T.click('${cs.c0[0].id}'); T.key('KeyL', { shift: true })`);
  check('59: Shift+L로 갈래 이름을 고치는 칸이 열림', (await ev(`T.editing()`)) !== null, await ev(`T.msg()`));
  await keys('Escape');
}

// 61: 목록이 떠 있는 동안 j · k로 옮긴다 (2026-10-25, 메인테이너: "a, c 하면 호출 메소드 메뉴가 나오는데 j/k 로 선택을 옮기는 것으로 합시다")
{
  await ev(`T.cmd('exQuick')`);
  const qd = await ev(`T.doc()`);
  const first = qd.diagrams[0].body[0].id, part = qd.diagrams[1].id;
  const onIdx = () => ev(`[...document.querySelectorAll('#menu button')].findIndex(b => b.classList.contains('on'))`);
  await ev(`T.click('${first}')`); await keys('KeyA', 'KeyC');
  check('61: a c로 목록이 뜨고 첫 줄에 있음', (await onIdx()) === 0, await onIdx());
  await keys('KeyJ');
  check('61: j로 아래 줄로', (await onIdx()) === 1, await onIdx());
  await keys('KeyK', 'KeyK');
  const n = await ev(`document.querySelectorAll('#menu button').length`);
  check('61: k로 위로, 첫 줄에서는 맨 끝으로 돎', (await onIdx()) === n - 1, { at: await onIdx(), n });
  check('61: j · k를 누르는 동안 고른 블록은 그대로', (await ev(`T.doc()`)).diagrams[0].body[0].id === first);
  await keys('Escape');
  const toPart = cs => cs.filter(c => c.target === part).length;
  const before = await ev(`T.calls(T.doc())`);
  await ev(`T.click('${first}')`); await keys('KeyA', 'KeyC', 'KeyJ');
  await ev(`T.key('Enter', { key: 'Enter' })`);
  const after = await ev(`T.calls(T.doc())`);
  check('61: j 뒤 Enter로 둘째 Method(partition)를 부르는 블록이 들어감', after.length === before.length + 1 && toPart(after) === toPart(before) + 1, { part, before: before.map(c => c.target), after: after.map(c => c.target) });
  if (await ev(`T.editing()`) !== null) await ev(`T.key('Escape', { editor: true, key: 'Escape' })`);
}

// 62번째 판 (2026-10-31): 2026-10-18 · 10-25에 정하고 넣지 못한 것
{
  const sv = () => ev(`T.svg()`);
  const findType = (list, t) => { for (const n of list) { if (n.type === t) return n; for (const k of ['yes', 'no', 'body', 'children', 'c0', 'c1', 'c2', 'c3']) if (Array.isArray(n[k])) { const f = findType(n[k], t); if (f) return f; } } return null; };
  const H = id => ev(`+document.querySelector('#svg rect[data-id="${id}"]').getAttribute('height')`);
  const box = () => ev(`(() => { const b = document.querySelector('#keyhint'); return { hidden: b.hidden, text: b.textContent }; })()`);

  // 빈 갈래의 ∅, 조건 글자 뒤 바탕
  await ev(`T.cmd('exCode')`);
  check('62: 빈 갈래에 ∅ (원 반지름 3.5)', (await sv()).includes('r="3.5"'));
  check('62: 조건 글자 뒤에 머리 바탕색 테두리 (BH1)', (await sv()).includes('stroke-width="6" stroke-linejoin="round" paint-order="stroke"'));

  // For: a f로 넣고 s f로 감싼다
  let cd = await ev(`T.doc()`);
  const firstId = cd.diagrams[0].body[0].id;
  await ev(`T.click('${firstId}')`); await keys('KeyA', 'KeyF');
  await ev(`T.type('for i in range(3)')`);
  cd = await ev(`T.doc()`);
  check('62: a f로 For를 넣음', cd.diagrams[0].body[1].type === 'for' && cd.diagrams[0].body[1].text === 'for i in range(3)', cd.diagrams[0].body[1]);
  await ev(`T.click('${firstId}')`); await keys('KeyS', 'KeyF');
  await ev(`T.type('for k in ks')`);
  cd = await ev(`T.doc()`);
  check('62: s f로 For로 감쌈', cd.diagrams[0].body[0].type === 'for' && cd.diagrams[0].body[0].body[0].id === firstId, cd.diagrams[0].body[0]);

  // MD1: 펴진 접기 영역 안의 마지막 블록 뒤에 넣으면 영역 안에
  const ranges = cd.diagrams[0].body.filter(n => n.type === 'range');
  let rg = null;
  for (const r of ranges) if (await ev(`!!document.querySelector('#svg [data-id="${r.children.at(-1).id}"]')`)) { rg = r; break; }
  const lastIn = rg.children[rg.children.length - 1].id;
  await ev(`T.click('${lastIn}')`); await keys('KeyO');
  await ev(`T.type('로그를 닫는다')`);
  cd = await ev(`T.doc()`);
  const rg2 = cd.diagrams[0].body.find(n => n.id === rg.id);
  check('62: MD1 접기 영역 안의 블록 뒤에 넣으면 영역 안에', rg2.children.length === rg.children.length + 1 && rg2.children.at(-1).text === '로그를 닫는다', rg2.children.map(c => c.text));

  // If 갈래 이름 (Q24)
  const iff = findType(cd.diagrams[0].body, 'if');
  await ev(`T.click('${iff.yes[0].id}')`); await keys('+KeyL');
  check('62: Shift+L로 If 갈래 이름 칸이 "참"으로 열림', (await ev(`T.editing()`)) === '참', await ev(`T.editing()`));
  await ev(`T.type('눌림')`);
  cd = await ev(`T.doc()`);
  check('62: If 갈래 이름을 고침', findType(cd.diagrams[0].body, 'if').labels?.[0] === '눌림' && (await sv()).includes('>눌림</text>'), findType(cd.diagrams[0].body, 'if').labels);
  await ev(`T.click('${iff.yes[0].id}')`); await keys('+KeyL');
  await ev(`T.type('')`);
  cd = await ev(`T.doc()`);
  check('62: 비우면 "참"으로 돌아가고 모델에 남지 않음', !findType(cd.diagrams[0].body, 'if').labels && (await sv()).includes('>참</text>'), findType(cd.diagrams[0].body, 'if'));

  // 키 안내 상자 (K1)
  await ev(`T.click('${firstId}')`); await keys('KeyA');
  check('62: 첫 키 바로 뒤에는 안내가 없음', (await box()).hidden, await box());
  await sleep(550);
  check('62: 0.4초 뒤 안내 상자 (For가 보임)', !(await box()).hidden && (await box()).text.includes('For'), await box());
  await keys('Escape');
  check('62: Esc로 그만두면 안내도 닫힘', (await box()).hidden, await box());
  await ev(`{ const o = document.querySelector('#optKeyHint'); o.checked = false; o.dispatchEvent(new Event('change')); }`);
  await ev(`T.click('${firstId}')`); await keys('KeyZ'); await sleep(550);
  check('62: 키 안내를 끄면 뜨지 않음', (await box()).hidden, await box());
  await keys('Escape');
  await ev(`{ const o = document.querySelector('#optKeyHint'); o.checked = true; o.dispatchEvent(new Event('change')); }`);

  // Case: 갈래 이름 자리 (Q25), 짧은 갈래 (SB1), 갈래를 하나까지 줄이면 If로 바꿀지 (MD3)
  await ev(`T.cmd('exCase')`);
  const svgCase = await sv();
  check('62: default 이름은 오른쪽', /<text[^>]*text-anchor="end"[^>]*>default<\/text>/.test(svgCase));
  check('62: 갈래 이름은 왼쪽', /<text(?![^>]*text-anchor)[^>]*>CMD_START<\/text>/.test(svgCase));
  let kd = await ev(`T.doc()`);
  let cs = findType(kd.diagrams[0].body, 'case');
  const h0 = await H(cs.c0[0].id), h1 = await H(cs.c0[1].id);
  check('62: 짧은 갈래의 블록들이 고르게 늘어남 (SB1)', Math.abs(h0 - h1) <= 1 && h0 > 32, [h0, h1]);
  await ev(`document.querySelector('#svg [data-id="${cs.id}"][data-label="2"]').dispatchEvent(new MouseEvent('mousedown', { button: 0, detail: 1, bubbles: true, cancelable: true }))`); await keys('KeyX');
  kd = await ev(`T.doc()`); cs = findType(kd.diagrams[0].body, 'case');
  check('62: 갈래가 둘 남으면 묻지 않음', cs.labels.length === 3 && (await ev(`document.querySelector('#menu').hidden`)), cs.labels);
  await ev(`document.querySelector('#svg [data-id="${cs.id}"][data-label="1"]').dispatchEvent(new MouseEvent('mousedown', { button: 0, detail: 1, bubbles: true, cancelable: true }))`); await keys('KeyX');
  check('62: 갈래가 하나만 남으면 If로 바꿀지 물음', !(await ev(`document.querySelector('#menu').hidden`)) && (await ev(`document.querySelector('#menu').textContent`)).includes('If로 바꾸기'), await ev(`document.querySelector('#menu').textContent`));
  await ev(`T.key('Enter', { key: 'Enter' })`);
  kd = await ev(`T.doc()`);
  const ifn = findType(kd.diagrams[0].body, 'if');
  check('62: If로 바뀜 (조건은 Case의 글자, 참 갈래 이름은 갈래 이름)', !findType(kd.diagrams[0].body, 'case') && ifn && ifn.text === 'cmd' && ifn.labels?.[0] === 'CMD_START' && ifn.yes[0].text === 'motor_on();', ifn);
  await ev(`document.querySelector('#svg [data-id="${ifn.id}"][data-label="0"]').dispatchEvent(new MouseEvent('mousedown', { button: 0, detail: 1, bubbles: true, cancelable: true }))`); await keys('KeyO');
  check('62: If의 갈래 이름에서 o: Case로 바꿀지 물음 (65번째 판부터 + 대신)', (await ev(`document.querySelector('#menu').textContent`)).includes('Case로 바꾸고'), await ev(`document.querySelector('#menu').textContent`));
  await ev(`T.key('Digit1')`);
  check('62: Case로 바뀌고 새 갈래 이름 칸이 열림', (await ev(`T.editing()`)) === '2', await ev(`T.editing()`));
  await ev(`T.type('CMD_PAUSE')`);
  kd = await ev(`T.doc()`); cs = findType(kd.diagrams[0].body, 'case');
  check('62: Case의 갈래: 참 갈래 · 새 갈래 · default', !!cs && cs.labels.join() === 'CMD_START,CMD_PAUSE,default' && cs.c0[0].text === 'motor_on();', cs && cs.labels);
  await ev(`T.key('KeyZ', { ctrl: true })`); await ev(`T.key('KeyZ', { ctrl: true })`);
  kd = await ev(`T.doc()`);
  check('62: 되돌리기 두 번으로 바꾸기 전 If로', findType(kd.diagrams[0].body, 'if')?.id === ifn.id && !findType(kd.diagrams[0].body, 'case'), kd.diagrams[0].body.map(n => n.type));

  // 머리 모양 제목처럼 (H1), 다이어그램 배치 (1.7)
  await ev(`T.cmd('exQuick')`);
  // 64번째 판부터 예제는 기억한 머리 모양(처음엔 제목처럼)으로 열린다. 모자 · 아치로 바꾼 뒤 제목처럼을 고른다
  await ev(`{ const o = document.querySelector('#optHead'); o.value = 'shape'; o.dispatchEvent(new Event('change')); }`);
  await ev(`{ const o = document.querySelector('#optHead'); o.value = 'title'; o.dispatchEvent(new Event('change')); }`);
  check('62: 제목처럼: 문서 설정에 들어감', (await ev(`T.doc()`)).settings?.headStyle === 'title', (await ev(`T.doc()`)).settings);
  check('62: 제목처럼: Method 딱지와 굵은 이름', (await sv()).includes('>Method</text>') && (await sv()).includes('font-weight="600">quicksort'));
  await ev(`T.key('KeyZ', { ctrl: true })`);
  check('62: 제목처럼은 실행 취소의 대상', !(await ev(`T.doc()`)).settings && (await ev(`document.querySelector('#optHead').value`)) === 'shape');
  await ev(`T.cmd('exRaft')`);
  const xs = await ev(`(() => { const d = JSON.parse(localStorage.getItem('nsd-proto-doc')).doc; return d.diagrams.map(g => { const b = document.querySelector('#svg [data-id="' + g.id + '"]').getBBox(); return { m: g.kind === 'method', x: b.x, r: b.x + b.width }; }); })()`);
  const evR = Math.max(...xs.filter(x => !x.m).map(x => x.r)), mL = Math.min(...xs.filter(x => x.m).map(x => x.x));
  check('62: Event는 왼쪽, Method는 오른쪽, 사이는 88px 넘게', mL - evR >= 87, { evR, mL });
  const vb = (await ev(`document.querySelector('#svg').getAttribute('viewBox')`)).split(' ').map(Number);
  check('62: 그림의 가로 : 세로가 16 : 10 가까이', vb[2] / vb[3] > 1.2 && vb[2] / vb[3] < 2.1, vb);
  check('65: 판 번호', (await ev(`document.querySelector('#edition').textContent`)) === '65번째 판', await ev(`document.querySelector('#edition').textContent`));
}

// 62번째 판: M41의 예제 일곱 ("더 보기…")
{
  const opts = await ev(`[...document.querySelectorAll('#exMore option')].map(o => o.value).filter(Boolean)`);
  check('62: 더 보기에 예제 일곱', opts.join() === '1,2,3,5,6,7,8', opts);
  const want = { 1: 3, 2: 2, 3: 3, 5: 1, 6: 2, 7: 1, 8: 1 };
  for (const no of opts) {
    await ev(`{ const o = document.querySelector('#exMore'); o.value = '${no}'; o.dispatchEvent(new Event('change')); }`);
    const d = await ev(`T.doc()`);
    const linked = T => T;
    const calls = await ev(`T.calls(T.doc()).every(c => !!c.target)`);
    check(`62: 예제 ${no}: 다이어그램 ${want[no]}개, 호출은 모두 이어짐`, d.diagrams.length === want[no] && calls, { n: d.diagrams.length, calls });
  }
}

// 63번째 판: 주소 끝의 이름으로 예제 열기 (#dijkstra, #merge-sort)
{
  const waitMsg = async re => { for (let i = 0; i < 20; i++) { const m = await ev(`T.msg()`); if (re.test(m)) return m; await sleep(100); } return await ev(`T.msg()`); };
  await ev(`location.hash = 'dijkstra'`);
  let m = await waitMsg(/5번/);
  let d = await ev(`T.doc()`);
  check('63: #dijkstra로 5번 예제가 제목처럼으로 열림', /5번 예제/.test(m) && d.diagrams.length === 1 && d.settings?.headStyle === 'title', { m, n: d.diagrams.length, s: d.settings });
  await ev(`location.hash = 'merge-sort'`);
  m = await waitMsg(/7번/);
  d = await ev(`T.doc()`);
  check('63: #merge-sort로 7번 예제가 열림', /7번 예제/.test(m) && d.diagrams.length === 1 && d.settings?.headStyle === 'title', { m, s: d.settings });
  const before = JSON.stringify(await ev(`T.doc()`));
  await ev(`location.hash = 'nothing-here'`);
  await sleep(300);
  check('63: 모르는 이름이면 문서를 그대로 둠', JSON.stringify(await ev(`T.doc()`)) === before);
  // 처음 열 때 주소에 이름이 있으면 지난 상태 대신 그 예제
  await send('Page.navigate', { url: page.split('#')[0] + (page.includes('?') ? '&' : '?') + 'h=1#dijkstra' });
  await sleep(2500);
  await ev(HELPERS);
  m = await ev(`T.msg()`);
  d = await ev(`T.doc()`);
  check('63: 주소에 #dijkstra를 달고 열면 그 예제로 시작', /5번 예제/.test(m) && d.settings?.headStyle === 'title' && (await ev(`document.querySelector('#optHead').value`)) === 'title', { m, s: d.settings });
}

// 64번째 판: 머리 모양의 기억(HS1), 처음 방문은 Raft, 열면 고른 것 없음(OP1), 좁은 화면(MB1)
{
  const fresh = async (q, clear) => {
    if (clear) await ev(`localStorage.clear()`);
    await send('Page.navigate', { url: page.split('#')[0] + (page.includes('?') ? '&' : '?') + q });
    await sleep(2500);
    await ev(HELPERS);
  };
  const noSel = `document.querySelector('#stage').classList.contains('nosel')`;
  await fresh('v=64a', true);
  let d = await ev(`T.doc()`);
  check('64: 처음 방문하면 Raft 예제', /Raft/.test(await ev(`T.msg()`)) && d.diagrams.length === 10, { m: await ev(`T.msg()`), n: d.diagrams.length });
  check('64: 고른 적이 없으면 머리 모양은 제목처럼', d.settings?.headStyle === 'title' && (await ev(`document.querySelector('#optHead').value`)) === 'title', d.settings);
  check('64: 화면이 열리면 고른 블록이 없음', await ev(noSel));
  await ev(`T.cmd('exQuick')`);
  check('64: 예제 단추를 눌러도 고른 블록이 없음', await ev(noSel));
  await ev(`T.key('ArrowDown')`);
  check('64: 이동 키를 누르면 첫 블록을 고름', !(await ev(noSel)));
  // Tab으로 캔버스에 들어오면 첫 블록을 고른다
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });   // 헤드리스는 창에 포커스가 없어 focus 이벤트가 오지 않는다
  await ev(`T.cmd('exCase')`);
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', bubbles: true })); document.querySelector('#optKeyHint').focus(); document.querySelector('#stage').focus();`);
  check('64: Tab으로 들어오면 첫 블록을 고름', !(await ev(noSel)), await ev(`({ active: document.activeElement?.id || document.activeElement?.tagName, hasFocus: document.hasFocus() })`));
  // 모자 · 아치를 고르면 기억해 새 문서 · 예제 · 다시 열기에 씀
  await ev(`{ const o = document.querySelector('#optHead'); o.value = 'shape'; o.dispatchEvent(new Event('change')); }`);
  await ev(`T.cmd('exRaft')`);
  check('64: 모자 · 아치를 고르면 예제도 모자 · 아치', !(await ev(`T.doc()`)).settings?.headStyle);
  await ev(`T.cmd('new')`);
  check('64: 새 문서도 모자 · 아치', !(await ev(`T.doc()`)).settings?.headStyle);
  await fresh('v=64b', false);
  await ev(`T.cmd('exQuick')`);
  check('64: 다시 열어도 기억함', !(await ev(`T.doc()`)).settings?.headStyle && (await ev(`document.querySelector('#optHead').value`)) === 'shape');
  check('64: 되살린 뒤에도 고른 블록이 없음', await ev(noSel));
  // 파일을 열면 파일의 머리 모양, 기억은 그대로
  await ev(`{ const o = document.querySelector('#optHead'); o.value = 'title'; o.dispatchEvent(new Event('change')); }`);
  await ev(`window.__f = document.querySelector('#svgText') && (T.cmd('svg'), document.querySelector('#svgText').value)`);
  await ev(`document.querySelector('#modal').hidden = true`);
  await ev(`{ const o = document.querySelector('#optHead'); o.value = 'shape'; o.dispatchEvent(new Event('change')); }`);
  const fileHead = await ev(`(() => { const f = new File([window.__f], 'a.ns.svg', { type: 'image/svg+xml' }); const dt = new DataTransfer(); dt.items.add(f); const i = document.querySelector('#file'); i.files = dt.files; i.dispatchEvent(new Event('change')); return true; })()`);
  await sleep(400);
  check('64: 파일을 열면 파일의 머리 모양(제목처럼)', fileHead && (await ev(`T.doc()`)).settings?.headStyle === 'title', (await ev(`T.doc()`)).settings);
  check('64: 파일을 열어도 고른 블록이 없음', await ev(noSel));
  await ev(`T.cmd('exRaft')`);
  check('64: 파일을 열어도 기억은 그대로(모자 · 아치)', !(await ev(`T.doc()`)).settings?.headStyle);
  // 좁은 화면
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 800, deviceScaleFactor: 2, mobile: true });
  await sleep(400);
  const vis = sel => `(() => { const e = document.querySelector('${sel}'); return !!e && getComputedStyle(e).display !== 'none'; })()`;
  const stageH = async () => ev(`document.querySelector('#stage').getBoundingClientRect().height`);
  check('64: 좁은 화면: 도구 모음 · 설정 · 안내는 접혀 있음', !(await ev(vis('.bar .grp'))) && !(await ev(vis('.opts'))) && !(await ev(vis('.side'))) && (await ev(vis('button[data-cmd="toggleMenu"]'))), { grp: await ev(vis('.bar .grp')), opts: await ev(vis('.opts')), side: await ev(vis('.side')), btn: await ev(vis('button[data-cmd="toggleMenu"]')), w: await ev('innerWidth') });
  check('64: 좁은 화면: 다이어그램이 화면 대부분', (await stageH()) > 800 * 0.8, await stageH());
  await shot('64-narrow.png');
  await ev(`T.cmd('toggleMenu')`);
  check('64: 메뉴를 누르면 도구 모음과 설정이 보임', (await ev(vis('.bar .grp'))) && (await ev(vis('.opts'))) && (await ev(`document.querySelector('button[data-cmd="toggleMenu"]').getAttribute('aria-expanded')`)) === 'true');
  await shot('64-narrow-menu.png');
  await ev(`T.cmd('toggleMenu')`); await ev(`T.cmd('toggleHelp')`);
  check('64: 안내를 누르면 안내가 아래에 보임', (await ev(vis('.side'))) && (await stageH()) > 250, await stageH());
  await shot('64-narrow-help.png');
  await send('Emulation.clearDeviceMetricsOverride');
  await sleep(300);
  check('64: 넓은 화면에선 펴고 접는 단추가 없음', !(await ev(vis('button[data-cmd="toggleMenu"]'))) && (await ev(vis('.bar .grp'))));
}

// 65번째 판: 2026-11-01에 정한 MVP 조작 (UX 결정 10장, 시안 M43)
{
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  const where = () => ev(`document.querySelector('#where').textContent`);
  const D = () => ev(`T.doc()`);
  const foldList = () => ev(`JSON.parse(localStorage.getItem('nsd-proto-fold') || '[]')`);
  const down = (sel, detail = 1, type = 'mousedown') => ev(`document.querySelector('#svg ${sel}').dispatchEvent(new MouseEvent('${type}', { button: ${type === 'contextmenu' ? 2 : 0}, detail: ${detail}, bubbles: true, cancelable: true, clientX: 300, clientY: 300 }))`);
  const esc = () => ev(`document.querySelector('#editor').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }))`);
  // Q2 더블클릭은 고치기, 세모로 접고 펴기
  await ev(`T.cmd('exCode')`);
  await down('[data-id="n14"]'); await down('[data-id="n14"]', 2);
  check('65: 접힌 칸을 더블클릭하면 이름을 고침 (펴지 않음)', (await ev(`T.editing()`)) === '로그 남기기' && (await foldList()).includes('n14'), await ev(`T.editing()`));
  await esc();
  await down('[data-id="n14"][data-tri]');
  check('65: 접힌 칸의 세모를 누르면 폄', !(await foldList()).includes('n14'));
  await down('[data-id="n14"][data-tri]');
  check('65: 이름 띠의 세모를 누르면 접음', (await foldList()).includes('n14'));
  await down('[data-id="n9"][data-band]'); await down('[data-id="n9"][data-band]', 2);
  check('65: 이름 띠를 더블클릭하면 이름을 고침 (접지 않음)', (await ev(`T.editing()`)) === '센서 읽기' && !(await foldList()).includes('n9'), await ev(`T.editing()`));
  await esc();
  await ev(`T.cmd('svg')`);
  const out = await ev(`document.querySelector('#svgText').value`);
  await ev(`T.cmd('closeModal')`);
  check('65: 저장되는 그림에는 세모가 없음', !out.includes('▾') && !out.includes('data-tri') && !/l 6 4.5 l -6 4.5/.test(out));
  // Q4 머리의 이름을 비우면 고치기 전 이름으로
  await ev(`T.cmd('exQuick')`);
  await ev(`T.click('g18'); T.key('Enter', { key: 'Enter' })`);
  await ev(`T.type('')`);
  let d = await D();
  check('65: 머리의 이름을 비우면 고치기 전 이름으로, 칸은 닫힘', (await ev(`T.editing()`)) === null && d.diagrams[1].event === 'partition(a, lo, hi)' && /비울 수 없어/.test(await ev(`T.msg()`)), { e: await ev(`T.editing()`), n: d.diagrams[1].event });
  // Q6 옮기기
  await ev(`T.click('n7'); T.key('ArrowUp', { alt: true })`);
  d = await D();
  check('65: Alt+↑로 블록을 위로', d.diagrams[1].body[0].id === 'n7' && d.diagrams[1].body[1].id === 'n6', d.diagrams[1].body.map(n => n.id));
  await ev(`T.key('KeyJ', { alt: true, key: 'j' })`);
  d = await D();
  check('65: Alt+j로 블록을 아래로', d.diagrams[1].body[0].id === 'n6' && d.diagrams[1].body[1].id === 'n7', d.diagrams[1].body.map(n => n.id));
  await ev(`T.click('n11'); T.key('ArrowUp', { alt: true })`);
  d = await D();
  const wb = d.diagrams[1].body.find(n => n.id === 'n9').body;
  check('65: 줄의 처음에서 Alt+↑: 제어 블록 밖으로', wb[0].id === 'n11' && wb[1].id === 'n10' && wb[1].yes[0].id === 'n12', wb.map(n => n.id));
  await ev(`T.key('KeyZ', { ctrl: true })`);
  await ev(`T.click('g18'); T.key('ArrowUp', { alt: true })`);
  d = await D();
  check('65: 머리에서 Alt+↑: 다이어그램 순서', d.diagrams[0].id === 'g18', d.diagrams.map(x => x.id));
  await ev(`T.key('KeyZ', { ctrl: true })`);
  await ev(`T.cmd('exCase')`);
  await ev(`T.click('n5'); T.key('ArrowLeft', { alt: true })`);
  let cs = (await D()).diagrams[0].body[1];
  check('65: 갈래 안의 블록에서 Alt+←: 갈래를 맞바꿈 (이름도 따라감)', cs.labels[0] === 'CMD_STOP' && cs.c0[0].text === 'motor_off();' && cs.c1[0].text === 'motor_on();', cs.labels);
  await ev(`T.click('n12'); T.key('ArrowLeft', { alt: true })`);
  check('65: default 갈래는 옮기지 않음', (await D()).diagrams[0].body[1].labels[3] === 'default' && /default/.test(await ev(`T.msg()`)));
  // Q10 갈래 이름 고르기, o O x
  await ev(`T.cmd('exCase')`);
  await ev(`T.click('n3'); T.key('ArrowUp')`);
  check('65: 갈래의 첫 블록에서 ↑: 갈래 이름', (await where()).includes('갈래 이름 "CMD_START"'), await where());
  await ev(`T.key('KeyL', { key: 'l' })`);
  check('65: 갈래 이름에서 l: 옆 갈래 이름', (await where()).includes('갈래 이름 "CMD_STOP"'), await where());
  await ev(`T.key('KeyJ', { key: 'j' })`);
  check('65: 갈래 이름에서 j: 그 갈래의 첫 블록', !(await where()).includes('갈래 이름') && (await D()).diagrams[0].body[1].c1[0].text === 'motor_off();', await where());
  await ev(`T.key('KeyK', { key: 'k' })`); await ev(`T.key('KeyO', { key: 'O', shift: true })`);
  check('65: 갈래 이름에서 O: 앞에 갈래를 넣고 이름 칸이 열림', (await ev(`T.editing()`)) === '4' && (await D()).diagrams[0].body[1].labels.length === 5, await ev(`T.editing()`));
  await ev(`T.type('CMD_NEW')`);
  cs = (await D()).diagrams[0].body[1];
  check('65: 새 갈래는 고른 갈래 앞, 고른 채로 남음', cs.labels.join() === 'CMD_START,CMD_NEW,CMD_STOP,CMD_SPEED,default' && (await where()).includes('"CMD_NEW"'), { l: cs.labels, w: await where() });
  await ev(`T.key('KeyX', { key: 'x' })`);
  cs = (await D()).diagrams[0].body[1];
  check('65: 갈래 이름에서 x: 갈래 지우기, 다음 갈래 이름을 고름', cs.labels.join() === 'CMD_START,CMD_STOP,CMD_SPEED,default' && (await where()).includes('"CMD_STOP"'), { l: cs.labels, w: await where() });
  await ev(`T.key('KeyK', { key: 'k' })`);
  check('65: 갈래 이름에서 k: Case를 고름', !(await where()).includes('갈래 이름'), await where());
  await ev(`T.key('Equal', { key: '+', shift: true })`);
  check('65: +는 갈래를 넣지 않고 안내', (await D()).diagrams[0].body[1].labels.length === 4 && /o · O/.test(await ev(`T.msg()`)));
  await down('[data-id="n2"][data-label="3"]');
  await ev(`T.key('KeyX', { key: 'x' })`);
  check('65: default 갈래는 지우지 않음', (await D()).diagrams[0].body[1].labels.length === 4 && /default/.test(await ev(`T.msg()`)));
  await down('[data-id="n2"][data-label="0"]', 1, 'contextmenu');
  check('65: 갈래 이름의 오른쪽 클릭 메뉴에 "이 갈래 지우기"', (await ev(`document.querySelector('#menu').textContent`)).includes('이 갈래 지우기'), await ev(`document.querySelector('#menu').textContent`));
  await ev(`T.key('Escape', { key: 'Escape' })`);
  await ev(`T.cmd('exQuick')`);
  await ev(`T.click('n2'); T.key('KeyK', { key: 'k' })`);
  check('65: If의 참 갈래 첫 블록에서 k: 갈래 이름 "참"', (await where()).includes('If의 갈래 이름 "참"'), await where());
  await ev(`T.key('KeyI', { key: 'i' })`);
  check('65: If의 갈래 이름에서 i: 이름 고치기', (await ev(`T.editing()`)) === '참', await ev(`T.editing()`));
  await esc();
}

check('스크립트 오류 없음', errors.length === 0, errors);
console.log(results.filter(r => r.ok).length + ' / ' + results.length + ' 통과');
ws.close(); chrome.kill(); process.exit(0);
