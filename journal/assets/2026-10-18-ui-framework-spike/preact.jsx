// 4번: Preact. React와 같은 쓰는 법, 작은 몸집.
import { useState, useEffect } from 'preact/hooks';
import { render } from 'preact';
import { T, KINDS, createEditor } from './editor-stub.js';
function Toolbar({ ed }) {
  const [s, setS] = useState(ed.get()); useEffect(() => ed.subscribe(setS), []);
  const [open, setOpen] = useState(false);
  const t = T[s.lang];
  return (
    <>
      <button onClick={() => ed.undo()} disabled={!s.past.length}>{t.undo}</button>
      <button onClick={() => ed.redo()} disabled={!s.future.length}>{t.redo}</button>
      <label>{t.kind}{' '}
        <select value={s.kind} onChange={(e) => ed.setKind(e.target.value)}>
          {KINDS.map((k) => <option key={k}>{k}</option>)}
        </select>
      </label>
      <button onClick={() => setOpen(!open)}>{t.settings}</button>
      {open && (
        <div className="panel">{t.lang}
          <label><input type="radio" checked={s.lang === 'en'} onChange={() => ed.setLang('en')} />English</label>
          <label><input type="radio" checked={s.lang === 'ko'} onChange={() => ed.setLang('ko')} />한국어</label>
        </div>
      )}
    </>
  );
}
render(<Toolbar ed={createEditor()} />, document.getElementById('app'));
