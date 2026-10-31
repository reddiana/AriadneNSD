// Turns the registry's command specs into what the menus, toolbar and palette draw:
// a screen title, whether it applies now, and why not (03-editor 3, ADR-0033).

import type { Locale } from '@ariadne-nsd/core';

import { formatMessage, isMessageKey } from '../i18n/messages';

import type {
  CommandRegistry,
  CommandSpec,
  MenuPlace,
  Message,
  SelectionKind,
  ToolbarPlace,
} from './engine-api';
import { isUiMessageKey, uiMessage } from './messages';

/** Turns an engine message (or a key of the UI's catalog, or finished text) into screen text. */
export type MessageFormatter = (message: Message | string) => string;

/**
 * The formatter used when the shell passes none: keys of the engine's catalog and of the UI's
 * catalog are translated, any other string is shown as it is (a shell's own finished text).
 */
export function defaultFormatter(locale: Locale): MessageFormatter {
  return (message) => {
    const key = typeof message === 'string' ? message : message.key;
    if (isMessageKey(key)) return formatMessage(locale, message);
    const params = typeof message === 'string' ? {} : (message.params ?? {});
    return isUiMessageKey(key) ? uiMessage(locale, key, params) : key;
  };
}

/** A command as the UI draws it. */
export type CommandView = {
  readonly id: string;
  readonly title: string;
  readonly keys: ReadonlyArray<string>;
  readonly menu: MenuPlace | null;
  readonly toolbar: ToolbarPlace | null;
  /** The kinds of selection the context menu shows it for; empty when it is not there. */
  readonly context: ReadonlyArray<SelectionKind>;
  readonly isEnabled: boolean;
  /** Why it does not apply now, or `null` when it does. */
  readonly reason: string | null;
  /** `true` / `false` for a check-mark item, `null` for a plain one. */
  readonly checked: boolean | null;
};

/** Evaluates one spec against the registry's current context. */
export function viewCommand(
  spec: CommandSpec,
  registry: CommandRegistry,
  format: MessageFormatter,
): CommandView {
  const ctx = registry.context();
  const title = typeof spec.title === 'function' ? spec.title(ctx) : spec.title;
  const applies = spec.when(ctx);
  return {
    id: spec.id,
    title: format(title),
    keys: spec.keys,
    menu: spec.menu ?? null,
    toolbar: spec.toolbar ?? null,
    context: spec.context ?? [],
    isEnabled: applies === true,
    reason: applies === true ? null : format(applies),
    checked: spec.checked ? spec.checked(ctx) : null,
  };
}

/** Evaluates every command of the registry. */
export function viewCommands(
  registry: CommandRegistry,
  format: MessageFormatter,
): ReadonlyArray<CommandView> {
  return registry.list().map((spec) => viewCommand(spec, registry, format));
}

/** Orders by group, then order, then id, so equal places still have a stable order. */
export function byPlace(
  a: { readonly group: number; readonly order: number; readonly id: string },
  b: { readonly group: number; readonly order: number; readonly id: string },
): number {
  return a.group - b.group || a.order - b.order || a.id.localeCompare(b.id);
}

/** Splits items sorted by `byPlace` into runs of the same group (a separator goes between). */
export function groupRuns<T extends { readonly group: number }>(
  items: ReadonlyArray<T>,
): ReadonlyArray<ReadonlyArray<T>> {
  const runs: T[][] = [];
  let last: number | null = null;
  for (const item of items) {
    const current = runs.at(-1);
    if (current && item.group === last) current.push(item);
    else runs.push([item]);
    last = item.group;
  }
  return runs;
}
