// 편집기 본체의 흉내. 네 가지 도구 모음이 모두 이것 하나를 쓴다.
export const T = {
  en: { undo: 'Undo', redo: 'Redo', kind: 'Text kind', settings: 'Settings', lang: 'Language' },
  ko: { undo: '실행 취소', redo: '다시 실행', kind: '글자 종류', settings: '설정', lang: '언어' },
};
export const KINDS = ['Plain', 'C', 'Java', 'Python', 'Bash'];
export function createEditor() {
  let state = { lang: 'en', kind: 'Plain', past: [], future: [] };
  const subs = new Set();
  const set = (s) => { state = s; subs.forEach((f) => f(state)); };
  return {
    get: () => state,
    subscribe(f) { subs.add(f); f(state); return () => subs.delete(f); },
    setKind(kind) { set({ ...state, kind, past: [...state.past, state.kind], future: [] }); },
    undo() { const p = state.past; if (!p.length) return; set({ ...state, kind: p.at(-1), past: p.slice(0, -1), future: [state.kind, ...state.future] }); },
    redo() { const f = state.future; if (!f.length) return; set({ ...state, kind: f[0], past: [...state.past, state.kind], future: f.slice(1) }); },
    setLang(lang) { set({ ...state, lang }); },
  };
}
