// 1번: 프레임워크 없음 (TypeScript + DOM). 바뀔 때마다 무엇을 고칠지 손으로 적는다.
import { T, KINDS, createEditor } from './editor-stub.js';
export function mountToolbar(root, ed) {
  root.innerHTML = `
    <button data-a="undo"></button><button data-a="redo"></button>
    <label><span data-t="kind"></span> <select>${KINDS.map((k) => `<option>${k}</option>`).join('')}</select></label>
    <button data-a="settings"></button>
    <div class="panel" hidden><span data-t="lang"></span>
      <label><input type="radio" name="lang" value="en">English</label>
      <label><input type="radio" name="lang" value="ko">한국어</label></div>`;
  const $ = (s) => root.querySelector(s);
  const undo = $('[data-a=undo]'), redo = $('[data-a=redo]'), settings = $('[data-a=settings]');
  const select = $('select'), panel = $('.panel');
  undo.onclick = () => ed.undo();
  redo.onclick = () => ed.redo();
  select.onchange = () => ed.setKind(select.value);
  settings.onclick = () => { panel.hidden = !panel.hidden; };
  root.querySelectorAll('input[name=lang]').forEach((r) => (r.onchange = () => ed.setLang(r.value)));
  return ed.subscribe((s) => {
    const t = T[s.lang];
    undo.textContent = t.undo; undo.disabled = !s.past.length;
    redo.textContent = t.redo; redo.disabled = !s.future.length;
    settings.textContent = t.settings;
    $('[data-t=kind]').textContent = t.kind; $('[data-t=lang]').textContent = t.lang;
    select.value = s.kind;
    root.querySelector(`input[value=${s.lang}]`).checked = true;
  });
}
mountToolbar(document.getElementById('app'), createEditor());
