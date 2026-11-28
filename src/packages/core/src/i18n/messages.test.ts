// Message catalogs (coding guide 8, QA-13): every key has text in every screen language.
import { describe, expect, it } from 'vitest';

import {
  catalogProblems,
  drawingCatalogEntries,
  isLocale,
  localeFromLanguageTag,
  screenLocale,
} from './messages';

describe('message catalogs (coding guide 8)', () => {
  it('T-0531 · QA-13 · R-NFR-04: the drawing catalog has every key in every language', () => {
    expect(catalogProblems(drawingCatalogEntries())).toEqual([]);
  });

  it('T-0532 · QA-13: the check finds a missing text and different placeholders', () => {
    expect(
      catalogProblems([
        { key: 'a', text: { en: 'Open {name}', ko: '{name} 열기', de: '{name} öffnen' } },
        { key: 'b', text: { en: 'Saved {name}', ko: '저장함', de: '{name} gespeichert' } },
        { key: 'c', text: { en: 'Close', ko: ' ', de: 'Schließen' } },
      ]),
    ).toEqual(['b: ko has placeholders , en name', 'c: no ko text']);
  });
});

describe('screen language (R-NFR-04)', () => {
  it('T-0318 · R-NFR-04: a browser language in the list gets that language, every other English', () => {
    expect(localeFromLanguageTag('ko-KR')).toBe('ko');
    expect(localeFromLanguageTag('ko')).toBe('ko');
    expect(localeFromLanguageTag('KO_kr')).toBe('ko');
    expect(localeFromLanguageTag('en-US')).toBe('en');
    expect(localeFromLanguageTag('kok-IN')).toBe('en');
    expect(localeFromLanguageTag('fr')).toBe('en');
    expect(localeFromLanguageTag('')).toBe('en');
    expect(localeFromLanguageTag(undefined)).toBe('en');
  });

  it('T-0319 · R-NFR-04: the preference wins over the browser language', () => {
    expect(screenLocale('en', 'ko-KR')).toBe('en');
    expect(screenLocale('ko', 'en-US')).toBe('ko');
    expect(screenLocale(undefined, 'ko-KR')).toBe('ko');
    expect(screenLocale('fr', 'en-US')).toBe('en');
  });

  it('T-0806 · R-NFR-04: the chosen language wins; otherwise the browser language, otherwise English', () => {
    expect(screenLocale('en', 'ko-KR')).toBe('en');
    expect(screenLocale('ko', 'en-US')).toBe('ko');
    expect(screenLocale(undefined, 'ko-KR')).toBe('ko');
    expect(screenLocale('fr', 'fr-FR')).toBe('en');
    expect(screenLocale(undefined, undefined)).toBe('en');
    expect(isLocale('ko')).toBe(true);
    expect(isLocale('ko-KR')).toBe(false);
    expect(isLocale(1)).toBe(false);
  });

  it('T-1561 · R-NFR-04: a German browser language gets German, in any region', () => {
    expect(localeFromLanguageTag('de')).toBe('de');
    expect(localeFromLanguageTag('de-DE')).toBe('de');
    expect(localeFromLanguageTag('de-AT')).toBe('de');
    expect(localeFromLanguageTag('de-CH')).toBe('de');
    expect(localeFromLanguageTag('dsb-DE')).toBe('en');
    expect(screenLocale(undefined, 'de-DE')).toBe('de');
    expect(screenLocale('en', 'de-DE')).toBe('en');
    expect(screenLocale('de', 'ko-KR')).toBe('de');
  });
});
