// The UI's own screen strings: menu names, dialog titles, the palette's placeholder
// (coding guide 8, R-NFR-04). Command names come from the registry, not from here.
// The areas here (`menu.*`, `palette.*`, `hint.*` …) are the UI's only; the engine's catalog
// (../i18n/messages.ts) has the others, so the keys of the two never clash.

import type { CatalogEntry, Locale } from '@ariadne-nsd/core';
import { lazyCatalog } from '@ariadne-nsd/core';

import type { UiMessageKey } from './messages.en';
import { en } from './messages.en';

export type { UiMessageKey } from './messages.en';

const catalog = lazyCatalog<UiMessageKey>(en, {
  ko: () => import('./messages.ko').then((module) => module.ko),
  de: () => import('./messages.de').then((module) => module.de),
});

/** Returns a UI string, with `{name}` placeholders filled from `params`. */
export function uiMessage(
  locale: Locale,
  key: UiMessageKey,
  params: Readonly<Record<string, string | number>> = {},
): string {
  const text = catalog.table(locale)[key];
  return text.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  );
}

/** Whether a string is a key of the UI catalog (used for the UI's own command titles). */
export function isUiMessageKey(text: string): text is UiMessageKey {
  return Object.hasOwn(en, text);
}

/** Every key of the UI catalog with its text in every screen language, for checks (QA-13). */
export function uiCatalogEntries(): ReadonlyArray<CatalogEntry> {
  return catalog.entries();
}
