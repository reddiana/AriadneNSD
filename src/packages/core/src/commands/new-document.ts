import type { Content, Doc, Settings } from '../model/types';

/** The settings of a new document. The header shape the user chose last is passed in (UX HS1). */
export const defaultSettings: Settings = {
  textKind: 'plain',
  theme: 'default',
  headStyle: 'title',
};

/**
 * The content of a new document: one diagram without a header holding one empty block
 * (R-ALL-03). The editor selects the empty block so the user can type at once (UX OP1).
 */
export function createContent(settings: Partial<Settings> = {}): Content {
  return {
    settings: { ...defaultSettings, ...settings },
    diagrams: [
      {
        id: 'd1',
        head: null,
        body: { blocks: [{ id: 'b1', kind: 'process', text: '' }], folds: [] },
      },
    ],
  };
}

/** A new document: `createContent` with a fresh view state (bands on, result symbol `←`). */
export function createDoc(settings: Partial<Settings> = {}): Doc {
  return {
    content: createContent(settings),
    view: { folded: [], opened: [], bands: true, resultSymbol: '←' },
  };
}
