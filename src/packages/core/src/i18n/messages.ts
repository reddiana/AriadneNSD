// The message catalog of core: fixed words the drawing writes itself (coding guide 8, R-NFR-04).
// UI strings live in the editor's catalog, not here.

/** A language of the drawing's fixed words. English is the default (R-NFR-04). */
export type Locale = 'en' | 'ko';

/** The keys of the fixed words in the drawing. */
export type DrawingMessageKey =
  /** The label of an If's true branch when the user has not written one (UX Q24). */
  | 'if.yes'
  /** The label of an If's false branch when the user has not written one (UX Q24). */
  | 'if.no'
  /** The label of a Case's default branch when the user has not written one. */
  | 'case.default'
  /** A call block whose target has no name. */
  | 'call.noName';

const catalog: Readonly<Record<Locale, Readonly<Record<DrawingMessageKey, string>>>> = {
  en: {
    'if.yes': 'true',
    'if.no': 'false',
    'case.default': 'default',
    'call.noName': '(no name)',
  },
  ko: {
    'if.yes': '참',
    'if.no': '거짓',
    'case.default': 'default',
    'call.noName': '(이름 없음)',
  },
};

/** Returns the fixed word for a key in a locale. */
export function drawingMessage(locale: Locale, key: DrawingMessageKey): string {
  return catalog[locale][key];
}
