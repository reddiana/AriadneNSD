import { catalogProblems } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import { screenLocale } from './appearance';
import { localeFromLanguageTag, shellCatalogEntries, shellMessage } from './messages';

describe('screen language', () => {
  it('T-0318 · R-NFR-04: Korean browsers get Korean, every other language English', () => {
    expect(localeFromLanguageTag('ko-KR')).toBe('ko');
    expect(localeFromLanguageTag('ko')).toBe('ko');
    expect(localeFromLanguageTag('en-US')).toBe('en');
    expect(localeFromLanguageTag('de')).toBe('en');
    expect(localeFromLanguageTag(undefined)).toBe('en');
  });

  it('T-0319 · R-NFR-04: the preference wins over the browser language', () => {
    expect(screenLocale('en', 'ko-KR')).toBe('en');
    expect(screenLocale('ko', 'en-US')).toBe('ko');
    expect(screenLocale(undefined, 'ko-KR')).toBe('ko');
    expect(screenLocale('fr', 'en-US')).toBe('en');
  });

  it('T-0320: fills placeholders and leaves unknown ones', () => {
    expect(shellMessage('en', 'notice.exported', { name: 'a.png' })).toBe('Exported “a.png”.');
    expect(shellMessage('en', 'notice.exported')).toBe('Exported “{name}”.');
  });

  it('T-0530 · QA-13 · R-NFR-04: the shell catalog has every key in every language, same placeholders', () => {
    expect(catalogProblems(shellCatalogEntries())).toEqual([]);
  });
});
