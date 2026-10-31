// What the web shell takes from the browser as the "host" (03-editor 6): the screen brightness
// from `prefers-color-scheme`, the system UI font, and the screen language.

import type { Appearance } from '../editor-contract';
import type { ShellLocale } from './messages';
import { localeFromLanguageTag } from './messages';

/** The operating system's UI font, with Korean fallbacks (04-visual-design). */
export const systemUiFont =
  'system-ui, -apple-system, "Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

/** The appearance for a brightness. */
export function appearanceFor(isDark: boolean): Appearance {
  return { scheme: isDark ? 'dark' : 'light', uiFont: systemUiFont };
}

/**
 * Reads the browser's brightness now and calls `listener` when it changes.
 * Returns the current appearance and a function that stops watching.
 */
export function watchAppearance(listener: (appearance: Appearance) => void): {
  readonly current: Appearance;
  readonly dispose: () => void;
} {
  const query = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = (event: MediaQueryListEvent): void => {
    listener(appearanceFor(event.matches));
  };
  query.addEventListener('change', onChange);
  return {
    current: appearanceFor(query.matches),
    dispose: () => {
      query.removeEventListener('change', onChange);
    },
  };
}

/** The user setting of the screen language (preferences, R-NFR-04). Missing: follow the browser. */
export const localeSettingKey = 'ui.locale';

/**
 * The screen language: the preference if the user chose one, otherwise Korean when the browser
 * prefers it and English for everything else.
 */
export function screenLocale(chosen: unknown, languageTag: string | undefined): ShellLocale {
  return chosen === 'en' || chosen === 'ko' ? chosen : localeFromLanguageTag(languageTag);
}
