// Message catalogs (coding guide 8, QA-13): every key has text in every screen language.
import { describe, expect, it } from 'vitest';

import {
  catalogProblems,
  drawingCatalogEntries,
  isLocale,
  isLocaleLoaded,
  lazyCatalog,
  loadAllLocales,
  loadLocale,
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

describe('lazy catalogs: only the languages the screen shows are fetched', () => {
  const english = { hello: 'Hello {name}' } as const;
  type Key = keyof typeof english;

  it('T-1613 · R-NFR-04: English is there at once; another language shows English until fetched', async () => {
    let fetches = 0;
    const catalog = lazyCatalog<Key>(english, {
      ko: () => {
        fetches += 1;
        return Promise.resolve({ hello: '안녕 {name}' });
      },
      de: () => Promise.resolve({ hello: 'Hallo {name}' }),
    });
    expect(catalog.table('en').hello).toBe('Hello {name}');
    expect(catalog.table('ko').hello).toBe('Hello {name}');
    expect(isLocaleLoaded('en')).toBe(true);
    expect(isLocaleLoaded('ko')).toBe(false);
    await Promise.all([loadLocale('ko'), loadLocale('ko')]);
    expect(catalog.table('ko').hello).toBe('안녕 {name}');
    expect(isLocaleLoaded('ko')).toBe(true);
    await loadLocale('ko');
    expect(fetches).toBe(1);
    expect(catalog.table('de').hello).toBe('Hello {name}');
  });

  it('T-1614 · QA-13: the entries for checks need every language fetched', async () => {
    const catalog = lazyCatalog<Key>(english, {
      ko: () => Promise.resolve({ hello: '안녕 {name}' }),
      de: () => Promise.resolve({ hello: 'Hallo {name}' }),
    });
    expect(() => catalog.entries()).toThrow(/not loaded/);
    await loadAllLocales();
    expect(catalog.entries()).toEqual([
      { key: 'hello', text: { en: 'Hello {name}', ko: '안녕 {name}', de: 'Hallo {name}' } },
    ]);
  });

  it('T-1615 · R-NFR-04: a failed fetch leaves English and is tried again on the next load', async () => {
    let fails = true;
    const catalog = lazyCatalog<Key>(english, {
      ko: () => Promise.resolve({ hello: '안녕 {name}' }),
      de: () =>
        fails ? Promise.reject(new Error('offline')) : Promise.resolve({ hello: 'Hallo' }),
    });
    await expect(loadLocale('de')).rejects.toThrow('offline');
    expect(catalog.table('de').hello).toBe('Hello {name}');
    fails = false;
    await loadLocale('de');
    expect(catalog.table('de').hello).toBe('Hallo');
  });
});
