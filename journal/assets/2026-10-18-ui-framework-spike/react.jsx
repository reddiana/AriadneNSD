// 3번: React. 값이 바뀌면 함수 전체를 다시 부르고, 앞의 결과와 견주어 다른 곳만 고친다.
import { useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { T, KINDS, createEditor } from './editor-stub.js';
function Toolbar({ ed }) {
  const s = useSyncExternalStore(ed.subscribe, ed.get);
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
createRoot(document.getElementById('app')).render(<Toolbar ed={createEditor()} />);
