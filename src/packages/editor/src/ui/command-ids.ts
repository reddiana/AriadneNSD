// The command ids the UI knows by name. Everything else comes from the registry as data
// (ADR-0033); these are the few places where the UI attaches its own behaviour to an id.

import type { ToolbarBlockKind } from './engine-api';

/** The six block icons of the toolbar, in toolbar order (06-web 7). */
export const toolbarBlockKinds: ReadonlyArray<ToolbarBlockKind> = [
  'process',
  'if',
  'case',
  'while',
  'for',
  'doWhile',
];

/** The toolbar icon id of a block kind (`ToolbarPlace.icon`). */
export function blockIconId(kind: ToolbarBlockKind): string {
  return `block.${kind}`;
}

/** Returns the block kind whose toolbar icon this is, or `null` for other icons. */
export function blockKindOfIcon(icon: string): ToolbarBlockKind | null {
  return toolbarBlockKinds.find((kind) => blockIconId(kind) === icon) ?? null;
}

/**
 * The commands a block icon runs: click inserts after, Shift+click before, Ctrl+click wraps
 * (02-interaction-rules "블록 아이콘으로 삽입 · 감싸기", UX W2). A process block cannot wrap,
 * so its Ctrl+click inserts.
 */
export function blockIconCommand(
  kind: ToolbarBlockKind,
  modifiers: { readonly shiftKey: boolean; readonly ctrlKey: boolean; readonly metaKey: boolean },
): string {
  if ((modifiers.ctrlKey || modifiers.metaKey) && kind !== 'process') return `block.wrap.${kind}`;
  if (modifiers.shiftKey) return `block.insertBefore.${kind}`;
  return `block.insert.${kind}`;
}

/** The toolbar's zoom buttons, as [zoom out] [NN%] [zoom in] (06-web 7, M76 Z1). */
export const zoomCommandIds = {
  in: 'view.zoom.in',
  out: 'view.zoom.out',
  reset: 'view.zoom.reset',
} as const;

/**
 * The commands the UI itself registers, because what they do is open a part of the UI.
 * The engine's key table maps their keys (`?`, `Ctrl+Shift+P`, `F1`, `Ctrl+,`) to these ids.
 */
export const uiCommandIds = {
  commandPalette: 'edit.commandPalette',
  preferences: 'file.preferences',
  documentSettings: 'diagram.documentSettings',
  shortcuts: 'help.shortcuts',
  manual: 'help.manual',
  gallery: 'help.gallery',
  askAi: 'help.askAi',
  whatsNew: 'help.whatsNew',
  about: 'help.about',
  examples: 'help.examples',
} as const;

/** The prefix of the commands that open one example (the command palette): `example.<id>`. */
export const exampleCommandPrefix = 'example.';
