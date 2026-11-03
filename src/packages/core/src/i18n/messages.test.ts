// Message catalogs (coding guide 8, QA-13): every key has text in every screen language.
import { describe, expect, it } from 'vitest';

import { catalogProblems, drawingCatalogEntries } from './messages';

describe('message catalogs (coding guide 8)', () => {
  it('T-0531 · QA-13 · R-NFR-04: the drawing catalog has every key in every language', () => {
    expect(catalogProblems(drawingCatalogEntries())).toEqual([]);
  });

  it('T-0532 · QA-13: the check finds a missing text and different placeholders', () => {
    expect(
      catalogProblems([
        { key: 'a', text: { en: 'Open {name}', ko: '{name} 열기' } },
        { key: 'b', text: { en: 'Saved {name}', ko: '저장함' } },
        { key: 'c', text: { en: 'Close', ko: ' ' } },
      ]),
    ).toEqual(['b: ko has placeholders , en name', 'c: no ko text']);
  });
});
