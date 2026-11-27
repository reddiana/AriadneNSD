import { catalogProblems } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import { shellCatalogEntries, shellMessage } from './messages';

describe('screen language', () => {
  it('T-0320: fills placeholders and leaves unknown ones', () => {
    expect(shellMessage('en', 'notice.exported', { name: 'a.png' })).toBe('Exported “a.png”.');
    expect(shellMessage('en', 'notice.exported')).toBe('Exported “{name}”.');
  });

  it('T-0530 · QA-13 · R-NFR-04: the shell catalog has every key in every language, same placeholders', () => {
    expect(catalogProblems(shellCatalogEntries())).toEqual([]);
  });
});
