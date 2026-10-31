import { describe, expect, it } from 'vitest';

import { checkInvariants } from '../model/invariants';
import { createContent, createDoc } from './new-document';

describe('new document', () => {
  it('R-ALL-03: a new document has one diagram holding one empty block', () => {
    const content = createContent();
    expect(content.diagrams).toEqual([
      {
        id: 'd1',
        head: null,
        body: { blocks: [{ id: 'b1', kind: 'process', text: '' }], folds: [] },
      },
    ]);
    expect(checkInvariants(content)).toEqual([]);
  });

  it('R-LAY-10 (UX HS1): the header shape defaults to title and can be passed in', () => {
    expect(createContent().settings.headStyle).toBe('title');
    expect(createContent({ headStyle: 'shape' }).settings).toEqual({
      textKind: 'plain',
      theme: 'default',
      headStyle: 'shape',
    });
  });

  it('R-ALL-03: a new doc starts with nothing folded and the result symbol ←', () => {
    expect(createDoc().view).toEqual({ folded: [], opened: [], bands: true, resultSymbol: '←' });
  });
});
