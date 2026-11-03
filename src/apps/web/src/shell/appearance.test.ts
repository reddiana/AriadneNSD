// What the page takes from the browser as the host: the screen brightness, the UI font and the
// screen language (03-editor 6).
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Appearance } from '../editor-contract';
import { appearanceFor, screenLocale, systemUiFont, watchAppearance } from './appearance';

/** A `prefers-color-scheme: dark` query whose answer the test changes. */
function fakeDarkQuery(isDark: boolean): {
  change: (isDark: boolean) => void;
  listenerCount: () => number;
} {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const query = {
    matches: isDark,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
  };
  vi.stubGlobal('window', {
    matchMedia: (media: string) => {
      expect(media).toBe('(prefers-color-scheme: dark)');
      return query;
    },
  });
  return {
    change: (next) => {
      query.matches = next;
      for (const listener of listeners) {
        listener({ matches: next } as MediaQueryListEvent);
      }
    },
    listenerCount: () => listeners.size,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('screen brightness', () => {
  it('T-0804: starts with the brightness the browser prefers now, in the system UI font', () => {
    fakeDarkQuery(true);
    const watching = watchAppearance(() => undefined);
    expect(watching.current).toEqual({ scheme: 'dark', uiFont: systemUiFont });
  });

  it('T-0805: tells when the browser brightness changes, until told to stop', () => {
    const query = fakeDarkQuery(false);
    const heard: Appearance[] = [];
    const watching = watchAppearance((appearance) => heard.push(appearance));
    expect(watching.current).toEqual(appearanceFor(false));

    query.change(true);
    query.change(false);
    watching.dispose();
    query.change(true);

    expect(heard.map((appearance) => appearance.scheme)).toEqual(['dark', 'light']);
    expect(query.listenerCount()).toBe(0);
  });
});

describe('screen language', () => {
  it('T-0806 · R-NFR-04: the chosen language wins; otherwise Korean only for a Korean browser', () => {
    expect(screenLocale('en', 'ko-KR')).toBe('en');
    expect(screenLocale('ko', 'en-US')).toBe('ko');
    expect(screenLocale(undefined, 'ko-KR')).toBe('ko');
    expect(screenLocale('fr', 'de-DE')).toBe('en');
    expect(screenLocale(undefined, undefined)).toBe('en');
  });
});
