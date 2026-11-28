// The editor's message catalog: every screen string of the editor engine, in English, Korean and German
// (coding guide 8, R-NFR-04). The drawing's fixed words ("true", "false") are in core's catalog.
//
// Key rules (the UI and the shells use the same rules for their keys):
// - `area.name`, lower camelCase segments joined by dots: `notice.escAgain`.
// - A command's title is `command.<command id>`: `command.edit.cut`, `command.block.insert.if`.
// - A refusal is `reason.<code>`: core's `ReasonCode`s and the editor's own (`reason.readOnly`).
// - Status bar messages are `notice.*`, questions `question.*` with buttons `choice.*`, what is
//   selected `selection.*`, the mode `mode.*`, settings `setting.<id>`, the key hint groups
//   `keyHint.<first key>`, the drag label `drag.*`, the list of Methods to call `picker.*`, the
//   names of the call block's fields `field.*`.
// - Placeholders are `{name}`; the values come in `params`.
// - The UI keeps its own strings (menus, dialogs) in `ui/messages.ts`. A key lives in one
//   catalog only; the UI formats a key with its catalog first, then with `formatMessage`.
import type { CatalogEntry, Locale } from '@ariadne-nsd/core';
import { lazyCatalog } from '@ariadne-nsd/core';

import type { MessageKey } from './messages.en';
import { english } from './messages.en';

export type { MessageKey } from './messages.en';

const catalogs = lazyCatalog<MessageKey>(english, {
  ko: () => import('./messages.ko').then((module) => module.korean),
  de: () => import('./messages.de').then((module) => module.german),
});

/** Placeholder values of a message. */
export type MessageParams = Readonly<Record<string, string | number>>;

/**
 * A screen string as the editor's interfaces pass it: a catalog key, or a key with placeholder
 * values. Shells and the UI may pass keys of their own catalogs; `formatMessage` leaves a key it
 * does not know as it is, so the caller can look it up in its own catalog.
 */
export type Message = string | { readonly key: string; readonly params?: MessageParams };

/** A message of this catalog. The editor's own code uses this, so its keys are checked. */
export type EditorMessage =
  MessageKey | { readonly key: MessageKey; readonly params?: MessageParams };

/** Makes a message with placeholder values. */
export function message(key: MessageKey, params?: MessageParams): EditorMessage {
  return params === undefined ? key : { key, params };
}

/** Whether a string is a key of the editor's catalog. */
export function isMessageKey(text: string): text is MessageKey {
  return Object.hasOwn(english, text);
}

/**
 * Turns a message into text in the screen language, filling `{name}` placeholders. A string that
 * is not a key of this catalog is returned as it is, so callers can chain their own catalog.
 */
export function formatMessage(locale: Locale, value: Message): string {
  const key = typeof value === 'string' ? value : value.key;
  const params = typeof value === 'string' ? {} : (value.params ?? {});
  if (!isMessageKey(key)) {
    return key;
  }
  const text = catalogs.table(locale)[key];
  return text.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  );
}

/** Every key with its text in every screen language, for checks (QA-13). */
export function catalogEntries(): ReadonlyArray<CatalogEntry> {
  return catalogs.entries();
}
