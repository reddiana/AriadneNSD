// The editor's message catalogs (coding guide 8, QA-13): complete in every language, no key in both.
import { catalogProblems } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import { uiCatalogEntries } from '../ui/messages';
import { catalogEntries } from './messages';

describe('the editor catalogs (coding guide 8)', () => {
  it('T-0533 · QA-13 · R-NFR-04: the engine catalog has every key in every language, same placeholders', () => {
    expect(catalogProblems(catalogEntries())).toEqual([]);
  });

  it('T-0534 · QA-13 · R-NFR-04: the UI catalog has every key in every language, same placeholders', () => {
    expect(catalogProblems(uiCatalogEntries())).toEqual([]);
  });

  it('T-0535 · QA-13: a key lives in one catalog only (the UI formats with its own catalog first)', () => {
    const engine = new Set(catalogEntries().map((entry) => entry.key));
    expect(uiCatalogEntries().filter((entry) => engine.has(entry.key))).toEqual([]);
  });
});
