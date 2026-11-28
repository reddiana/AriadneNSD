// The web shell's screen strings (R-NFR-04). English is the default; Korean and German are supported.
// Only what the shell alone shows lives here (coding guide 8): file messages, local backup,
// tabs. The keys follow the editor catalog's rules (`area.name`, `{name}` placeholders). Command
// titles are the editor catalog's (`command.file.new` …): the shell passes those keys as they are.

import type { CatalogEntry, Locale } from '@ariadne-nsd/core';
import { lazyCatalog } from '@ariadne-nsd/core';

import type { ShellMessageKey } from './messages.en';
import { english } from './messages.en';

export type { ShellMessageKey } from './messages.en';

/** A screen language: the same set as the editor's and the drawing's (core `Locale`). */
export type ShellLocale = Locale;

const catalogs = lazyCatalog<ShellMessageKey>(english, {
  ko: () => import('./messages.ko').then((module) => module.korean),
  de: () => import('./messages.de').then((module) => module.german),
});

/** Returns a shell string in `locale`, with `{name}`-style placeholders filled from `values`. */
export function shellMessage(
  locale: ShellLocale,
  key: ShellMessageKey,
  values: Readonly<Record<string, string>> = {},
): string {
  const text = catalogs.table(locale)[key];
  return text.replaceAll(/\{(\w+)\}/g, (match, name: string) => values[name] ?? match);
}

/** Every key of the shell catalog with its text in every screen language, for checks (QA-13). */
export function shellCatalogEntries(): ReadonlyArray<CatalogEntry> {
  return catalogs.entries();
}
