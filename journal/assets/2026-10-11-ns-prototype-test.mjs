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
  key(code, o = {}) { (o.editor ? document.querySelector('#editor') : document).dispatchEvent(new KeyboardEvent('keydown', { code, key: o.key || code, shiftKey: !!o.shift, ctrlKey: !!o.ctrl, bubbles: true, cancelable: true })); },
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

// f. 받는 것이 없는 Method를 부르는 호출 블록: 결과만 적는다. 이름과 인자는 못 고친다
await ev(`T.click('${callId}'); T.key('Enter', { key: 'Enter' })`);
check('호출 블록에서 Enter: 한 줄이 열리고 맨 앞(결과 자리)에 커서', (await ev(`T.editing()`)) === 'Method 1' && (await ev(`T.picked()`)) === '', await ev(`T.editing()`));
await ev(`T.type('n = Other')`);
check('이름을 바꿔 적으면 받아들이지 않음', (await ev(`T.editing()`)) === 'n = Other' && (await ev(`T.msg()`)).includes('고칠 수 없습니다'), await ev(`T.msg()`));
await ev(`T.type('Method 1(3)')`);
check('받는 것이 없는 Method에 인자를 적으면 받아들이지 않음', (await ev(`T.editing()`)) === 'Method 1(3)' && (await ev(`T.msg()`)).includes('받는 것이 없는'), await ev(`T.msg()`));
await ev(`T.type('n = Method 1')`);
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
check('C로 넣은 호출: 받는 것이 있으면 인자를 고른 채로 열림', (await ev(`T.editing()`)) === 'count_up(n)' && (await ev(`T.picked()`)) === 'n', [await ev(`T.editing()`), await ev(`T.picked()`)]);
await ev(`T.type('count_up(5)')`);
s = await ev(`T.sum()`);
check('인자를 적음', s.calls.join('|') === 'n ← count_up(n) -> count_up(n)|count_up(5) -> count_up(n)|count_up(n) -> count_up(n)', s);
await ev(`T.click('${callId}'); T.key('Enter', { key: 'Enter' })`);
check('호출 블록에서 Enter: 인자를 고른 채로 열림', (await ev(`T.editing()`)) === 'n ← count_up(n)' && (await ev(`T.picked()`)) === 'n', [await ev(`T.editing()`), await ev(`T.picked()`)]);
await ev(`T.type('total = count_up(n + 1);')`);
s = await ev(`T.sum()`);
check('인자와 결과를 고침 (= 와 ; 로 적어도 됨)', s.calls[0] === 'total ← count_up(n + 1) -> count_up(n)', s);
await ev(`T.key('KeyZ', { ctrl: true })`);
s = await ev(`T.sum()`);
check('되돌리면 고치기 전으로', s.calls[0] === 'n ← count_up(n) -> count_up(n)', s);

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

// k. 펴진 접기 영역: 왼쪽 막대와 이름 띠. 안의 블록은 막대만큼 들어가고, 둘레의 가는 선은 없다
await ev(`T.cmd('exCode')`);
d = await ev(`T.doc()`);
const reg = d.diagrams[0].body[2];
const geo = `(() => {
  const at = el => el && ['x', 'y', 'width', 'height'].map(a => +el.getAttribute(a));
  const q = s => document.querySelector('#svg ' + s);
  return { band: at(q('rect[data-band][data-id="${reg.id}"]')), bar: at(q('rect[fill="#93aee8"]')), kid: at(q('rect[data-id="${reg.children[0].id}"]')),
    last: at(q('rect[data-id="${reg.children[reg.children.length - 1].id}"]')), thin: T.svg().includes('stroke-width="1.5"') };
})()`;
const saved = `(() => { T.cmd('svg'); const v = document.querySelector('#svgText').value; T.cmd('closeModal'); return v; })()`;
let g = await ev(geo);
check('접기 영역: 폭 8의 막대가 영역의 맨 위부터 끝까지', !!g.bar && g.bar[0] === g.band[0] && g.bar[1] === g.band[1] && g.bar[2] === 8 && g.bar[1] + g.bar[3] === g.last[1] + g.last[3], g);
check('접기 영역: 안의 블록이 막대만큼 들어가고 띠는 폭 전체', g.kid[0] === g.band[0] + 8 && g.kid[1] === g.band[1] + 18 && g.band[3] === 18 && g.band[2] === g.kid[2] + 8, g);
check('접기 영역: 둘레의 가는 선이 없음', g.thin === false, g);
check('저장되는 그림에 막대와 띠가 들어감', (await ev(`(v => v.includes('#93aee8') && v.includes('#e6ecfb'))(${saved})`)) === true);
const bandX = g.band[0];
await ev(`document.querySelector('#optRanges').click()`);
g = await ev(geo);
check('이름 띠를 끄면 막대도 들임도 사라짐', g.band === null && g.bar === null && g.kid[0] === bandX, g);
check('이름 띠를 끄면 저장되는 그림에도 없음', (await ev(`(v => !v.includes('#93aee8') && !v.includes('#e6ecfb'))(${saved})`)) === true);
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
check('호출 블록에서 F: Method의 블록이 그 자리에 보임', (await has(`${pc}>${pb[0]}`)) && (await ev(`T.svg().includes('#b9a9dc') && T.svg().includes('fill="#6b7386"')`)) === true, await ev(`T.msg()`));
check('펴 보인 호출 블록: 띠에 호출 블록의 글자 (이름은 굵게)', (await ev(`T.svg().includes('▾ p ← <tspan font-weight="600">partition</tspan>(a, lo, hi)')`)) === true);
check('펴 보기는 모델을 바꾸지 않음', (await model()) === m0);
await press(pc, 'KeyF');
check('다시 F: 접힘', !(await has(`${pc}>${pb[0]}`)) && (await ev(`!T.svg().includes('#b9a9dc')`)) === true);
await press(pc, 'KeyF');

// m. 펴 보인 블록은 고를 수 있지만 고칠 수 없다
const ghost = `${pc}>${pb[0]}`;
await press(pc, 'ArrowDown');
check('방향키로 펴 보인 블록에 들어감', (await ev(`document.querySelector('#where').textContent`)).includes('펴 보인'), await ev(`document.querySelector('#where').textContent`));
await press(ghost, 'Enter', `{ key: 'Enter' }`);
check('펴 보인 블록에서 Enter: 고치지 않고 알려 줌', (await ev(`T.editing()`)) === null && (await ev(`T.msg()`)).includes('펴 보인 블록은 고칠 수 없습니다'), await ev(`T.msg()`));
await ev(`T.click('${pb[1]}'); T.key('KeyC', { ctrl: true })`);
for (const [code, o] of [['Delete', '{}'], ['KeyO', '{}'], ['KeyO', '{ shift: true }'], ['KeyP', '{}'], ['KeyM', '{}'], ['KeyX', '{ ctrl: true }'], ['KeyV', '{ ctrl: true }']]) await press(ghost, code, o);
for (const [k1, k2] of [['KeyA', 'KeyI'], ['KeyA', 'KeyC'], ['KeyD', 'KeyD'], ['KeyD', 'KeyS'], ['KeyZ', 'KeyF'], ['KeyS', 'KeyW']]) await ev(`T.click('${ghost}'); T.key('${k1}'); T.key('${k2}')`);
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
check('Method를 고치면 펴 보인 곳도 따라 바뀜', (await ev(`T.svg().includes('fill="#6b7386" xml:space="preserve" style="white-space:pre" pointer-events="none">pivot = a[lo];</text>')`)) === true);
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
check('펴 보인 쪽의 접기 영역은 Method의 접힘대로 (펴짐)', (await ev(`document.querySelectorAll('#svg rect[fill="#93aee8"]').length`)) === 3, await ev(`document.querySelectorAll('#svg rect[fill="#93aee8"]').length`));
await shot('p37-quick-open.png');
await ev(`T.key('KeyF')`);
check('펴 보인 쪽의 접기 영역은 Method의 접힘대로 (접힘)', (await ev(`document.querySelectorAll('#svg rect[fill="#93aee8"]').length`)) === 0 && !(await has(`${pc}>${pb[0]}`)) && (await has(`${pc}>${pb[3]}`)));
await ev(`T.key('KeyF')`);

// q. 저장했다 다시 열면 펴짐이 남는다. 저장되는 그림에도 펴진 모습 그대로
const shownIds = `[...document.querySelectorAll('#svg [data-id*=">"]')].map(e => e.dataset.id).sort().join()`;
const before = await ev(shownIds);
const file = await ev(saved);
check('저장되는 그림과 보기 상태에 펴짐이 들어감', file.includes('#b9a9dc') && file.includes('fill="#6b7386"') && /"opened": \[\s*"/.test(file), file.slice(0, 400));
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
check('머리 이름을 비움: 칸이 다시 열림', (await ev(`T.editing()`)) === '', await ev(`T.msg()`));
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
check('옛 한 글자 키(W, K, C, D)는 아무것도 넣지 않음', (await ev(texts)) === t0 && (await ev(`T.editing()`)) === null, [await ev(texts), await ev(`T.editing()`)]);

// w. inbox(2026-10-13): 위·아래로는 옆 갈래로 넘어가지 않음, 머리에서 dd, 접기 영역 보기가 꺼졌을 때의 안내
await ev(`T.cmd('exCode')`);
d = await ev(`T.doc()`);
const if1 = d.diagrams[0].body[1], if2 = d.diagrams[0].body[1].yes[1];
await ev(`T.click('${if2.yes[1].id}')`); await keys('KeyJ');
check('안쪽 If의 참 갈래 끝에서 j: 거짓 갈래가 아니라 바깥 If의 다음 블록으로', (await ev(where)) === '처리  ·  접기 영역: 센서 읽기', await ev(where));
await ev(`T.click('${if1.no[0].id}')`); await keys('KeyK');
check('거짓 갈래의 처음에서 k: 참 갈래가 아니라 그 If로', (await ev(where)) === 'If', await ev(where));
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

check('스크립트 오류 없음', errors.length === 0, errors);
console.log(results.filter(r => r.ok).length + ' / ' + results.length + ' 통과');
ws.close(); chrome.kill(); process.exit(0);
