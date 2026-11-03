// The message catalog of core: fixed words the drawing writes itself (coding guide 8, R-NFR-04).
// UI strings live in the editor's catalog, not here.

/**
 * The screen languages, English first (the default, R-NFR-04). Adding a language is this line and
 * one catalog entry per catalog (QA-13); the type checker then points at every catalog to fill.
 */
export const locales = ['en', 'ko'] as const;

/** A screen language, also the language of the drawing's fixed words. */
export type Locale = (typeof locales)[number];

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

/** One key of a message catalog with its text in every screen language. */
export type CatalogEntry = {
  readonly key: string;
  readonly text: Readonly<Record<Locale, string>>;
};

/** Every key of this catalog with its text in every language, for checks. */
export function drawingCatalogEntries(): ReadonlyArray<CatalogEntry> {
  return catalogEntriesOf(catalog);
}

/** Turns a catalog (a table per language) into one entry per key, keyed by the first language. */
export function catalogEntriesOf<Key extends string>(
  tables: Readonly<Record<Locale, Readonly<Record<Key, string>>>>,
): ReadonlyArray<CatalogEntry> {
  return (Object.keys(tables.en) as Key[]).map((key) => {
    const text = {} as Record<Locale, string>;
    for (const locale of locales) {
      text[locale] = tables[locale][key];
    }
    return { key, text };
  });
}

const placeholderPattern = /\{(\w+)\}/g;

/**
 * What is wrong with a catalog (QA-13): a key missing or empty in a language, or a language whose
 * text has other `{name}` placeholders than English's. An empty list means none.
 */
export function catalogProblems(entries: ReadonlyArray<CatalogEntry>): ReadonlyArray<string> {
  const problems: string[] = [];
  for (const { key, text } of entries) {
    const english = placeholders(text.en);
    for (const locale of locales) {
      const value = text[locale] as string | undefined;
      if (value === undefined || value.trim() === '') {
        problems.push(`${key}: no ${locale} text`);
      } else if (placeholders(value) !== english) {
        problems.push(`${key}: ${locale} has placeholders ${placeholders(value)}, en ${english}`);
      }
    }
  }
  return problems;
}

function placeholders(text: string): string {
  return [...text.matchAll(placeholderPattern)]
    .map((match) => match[1] ?? '')
    .sort()
    .join(',');
}
