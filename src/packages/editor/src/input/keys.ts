// The key table and the key reader (03-editor 4, 03-keymap). The table is data: the shortcut
// list, the command palette and the menus show the same entries as the dispatcher uses.
import type { SelectionKind } from '../state/selection';

/**
 * One key binding. `keys` is written as in the key table: a two-key sequence is two keys with a
 * space (`'d d'`, `'a i'`), a chord joins with `+` (`'Ctrl+X'`, `'Ctrl+Shift+P'`, `'Alt+h'`),
 * a capital letter means the letter with Shift (`'O'`), and named keys use `KeyboardEvent.key`
 * names (`'ArrowUp'`, `'Enter'`, `'Delete'`, `'Escape'`).
 */
export type KeyBinding = {
  readonly keys: string;
  readonly command: string;
  readonly args?: unknown;
  /** Only while this kind of thing is selected. Listed before the general binding of the key. */
  readonly selection?: SelectionKind;
  /** `visual`: only while selecting a range with `v` (03-keymap). Default `normal`. */
  readonly mode?: 'normal' | 'visual';
  /** Shown in the shortcut list but read by the key reader itself (`Esc Esc`). */
  readonly isDisplayOnly?: boolean;
};

/** The block kind letters after `a`, `A` and `s` (03-keymap). `c` (call) only inserts, `p` (process) only after `a`. */
export const kindLetters = [
  ['i', 'if'],
  ['k', 'case'],
  ['w', 'while'],
  ['f', 'for'],
  ['d', 'doWhile'],
] as const;

const insertBindings: ReadonlyArray<KeyBinding> = [
  // `a p` is `o` written like the other kinds (2026-11-03, maintainer).
  { keys: 'a p', command: 'block.insert.process' },
  ...kindLetters.flatMap(([letter, kind]) => [
    { keys: `a ${letter}`, command: `block.insert.${kind}` },
    { keys: `A ${letter}`, command: `block.insertBefore.${kind}` },
    { keys: `s ${letter}`, command: `block.wrap.${kind}` },
  ]),
  { keys: 'a c', command: 'block.insert.call' },
  { keys: 'A c', command: 'block.insertBefore.call' },
];

const visualWrapBindings: ReadonlyArray<KeyBinding> = kindLetters.map(([letter, kind]) => ({
  keys: `s ${letter}`,
  command: `block.wrap.${kind}`,
  mode: 'visual' as const,
}));

/** The key table of the MVP (03-keymap). Earlier entries win when keys and context match. */
export const keyBindings: ReadonlyArray<KeyBinding> = [
  // Move the selection.
  { keys: 'h', command: 'select.left' },
  { keys: 'ArrowLeft', command: 'select.left' },
  { keys: 'j', command: 'select.down' },
  { keys: 'ArrowDown', command: 'select.down' },
  { keys: 'k', command: 'select.up' },
  { keys: 'ArrowUp', command: 'select.up' },
  { keys: 'l', command: 'select.right' },
  { keys: 'ArrowRight', command: 'select.right' },
  { keys: 'Shift+ArrowUp', command: 'select.extendUp' },
  { keys: 'Shift+ArrowDown', command: 'select.extendDown' },
  { keys: '{', command: 'select.unitUp' },
  { keys: 'Ctrl+ArrowUp', command: 'select.unitUp' },
  { keys: '}', command: 'select.unitDown' },
  { keys: 'Ctrl+ArrowDown', command: 'select.unitDown' },
  { keys: 'Ctrl+ArrowLeft', command: 'select.branchLeft' },
  { keys: 'Ctrl+ArrowRight', command: 'select.branchRight' },
  { keys: 'g g', command: 'select.first' },
  { keys: 'G', command: 'select.last' },
  { keys: '[ [', command: 'select.previousDiagram' },
  { keys: 'Ctrl+Shift+ArrowLeft', command: 'select.previousDiagram' },
  { keys: '] ]', command: 'select.nextDiagram' },
  { keys: 'Ctrl+Shift+ArrowRight', command: 'select.nextDiagram' },
  { keys: 'v', command: 'select.visual' },
  { keys: 'V', command: 'select.visual' },
  { keys: 'Escape Escape', command: 'select.clear', isDisplayOnly: true },
  // Edit text.
  { keys: 'i', command: 'edit.textStart' },
  { keys: 'c c', command: 'edit.textClear' },
  { keys: 'Enter', command: 'edit.text' },
  { keys: 'F2', command: 'edit.text' },
  { keys: 'L', command: 'edit.branchLabel' },
  // Insert. On a branch label, o / O / x act on branches (interaction rules "분기 라벨 선택").
  { keys: 'o', command: 'branch.insert', selection: 'branchLabel' },
  { keys: 'O', command: 'branch.insertBefore', selection: 'branchLabel' },
  { keys: 'o', command: 'block.insert.process' },
  { keys: 'O', command: 'block.insertBefore.process' },
  ...insertBindings,
  // Headers and diagrams (interaction rules "새 Method로 빼기와 새 다이어그램").
  { keys: 'e', command: 'diagram.event' },
  { keys: 'm', command: 'diagram.method' },
  { keys: 'E', command: 'diagram.newEvent' },
  { keys: 'M', command: 'diagram.newMethod' },
  { keys: 'Shift+Delete', command: 'diagram.delete' },
  { keys: 'Shift+Backspace', command: 'diagram.delete' },
  // Move blocks, branches and (on a header) diagrams.
  { keys: 'Alt+h', command: 'edit.move.left' },
  { keys: 'Alt+ArrowLeft', command: 'edit.move.left' },
  { keys: 'Alt+j', command: 'edit.move.down' },
  { keys: 'Alt+ArrowDown', command: 'edit.move.down' },
  { keys: 'Alt+k', command: 'edit.move.up' },
  { keys: 'Alt+ArrowUp', command: 'edit.move.up' },
  { keys: 'Alt+l', command: 'edit.move.right' },
  { keys: 'Alt+ArrowRight', command: 'edit.move.right' },
  // Clipboard and delete. On a header, dd removes the header (03-keymap).
  { keys: 'd d', command: 'diagram.removeHead', selection: 'head' },
  { keys: 'y y', command: 'edit.copy' },
  { keys: 'Ctrl+C', command: 'edit.copy' },
  { keys: 'd d', command: 'edit.cut' },
  { keys: 'Ctrl+X', command: 'edit.cut' },
  { keys: 'p', command: 'edit.paste' },
  { keys: 'Ctrl+V', command: 'edit.paste' },
  { keys: 'P', command: 'edit.pasteBefore' },
  { keys: 'x', command: 'diagram.removeHead', selection: 'head' },
  { keys: 'Delete', command: 'diagram.removeHead', selection: 'head' },
  { keys: 'Backspace', command: 'diagram.removeHead', selection: 'head' },
  { keys: 'x', command: 'branch.delete', selection: 'branchLabel' },
  { keys: 'Delete', command: 'branch.delete', selection: 'branchLabel' },
  { keys: 'Backspace', command: 'branch.delete', selection: 'branchLabel' },
  { keys: 'x', command: 'edit.delete' },
  { keys: 'Delete', command: 'edit.delete' },
  { keys: 'Backspace', command: 'edit.delete' },
  // Undo.
  { keys: 'u', command: 'edit.undo' },
  { keys: 'Ctrl+Z', command: 'edit.undo' },
  { keys: 'U', command: 'edit.redo' },
  { keys: 'Ctrl+R', command: 'edit.redo' },
  { keys: 'Ctrl+Y', command: 'edit.redo' },
  { keys: 'Ctrl+Shift+Z', command: 'edit.redo' },
  // Wrap and unwrap.
  { keys: 'd s', command: 'block.unwrap' },
  // File, view, help. The UI registers the palette, preferences and shortcut list commands.
  { keys: 'Ctrl+S', command: 'file.save' },
  { keys: 'Ctrl+Shift+S', command: 'file.saveAs' },
  { keys: '+', command: 'view.zoom.in' },
  { keys: '-', command: 'view.zoom.out' },
  { keys: '?', command: 'help.shortcuts' },
  { keys: 'Ctrl+Shift+P', command: 'edit.commandPalette' },
  { keys: 'F1', command: 'edit.commandPalette' },
  { keys: 'Ctrl+,', command: 'file.preferences' },
  // Selecting a range with v (03-keymap: Visual).
  { keys: 'j', command: 'select.extendDown', mode: 'visual' },
  { keys: 'ArrowDown', command: 'select.extendDown', mode: 'visual' },
  { keys: 'Shift+ArrowDown', command: 'select.extendDown', mode: 'visual' },
  { keys: 'k', command: 'select.extendUp', mode: 'visual' },
  { keys: 'ArrowUp', command: 'select.extendUp', mode: 'visual' },
  { keys: 'Shift+ArrowUp', command: 'select.extendUp', mode: 'visual' },
  { keys: 'y', command: 'edit.copy', mode: 'visual' },
  { keys: 'd', command: 'edit.cut', mode: 'visual' },
  { keys: 'x', command: 'edit.delete', mode: 'visual' },
  { keys: 'Delete', command: 'edit.delete', mode: 'visual' },
  ...visualWrapBindings,
];

/** The keys of a command as the shortcut list and menus show them, in table order. */
export function keysOf(
  bindings: ReadonlyArray<KeyBinding>,
  command: string,
): ReadonlyArray<string> {
  const keys: string[] = [];
  for (const binding of bindings) {
    if (binding.command === command && (binding.mode ?? 'normal') === 'normal') {
      if (!keys.includes(binding.keys)) {
        keys.push(binding.keys);
      }
    }
  }
  return keys;
}

/** The parts of a keyboard event the key reader needs. */
export type KeyInput = {
  readonly code: string;
  readonly shiftKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
};

const ignoredCodes = /^(Shift|Control|Alt|Meta|OS)(Left|Right)$|^CapsLock$|^NumLock$|^Lang\d$/;

const symbolKeys: Readonly<Record<string, readonly [string, string]>> = {
  BracketLeft: ['[', '{'],
  BracketRight: [']', '}'],
  Slash: ['/', '?'],
  Equal: ['=', '+'],
  Minus: ['-', '_'],
  Comma: [',', '<'],
  Period: ['.', '>'],
  Semicolon: [';', ':'],
  NumpadAdd: ['+', '+'],
  NumpadSubtract: ['-', '-'],
};

const namedKeys: Readonly<Record<string, string>> = {
  Enter: 'Enter',
  NumpadEnter: 'Enter',
  Escape: 'Escape',
  Delete: 'Delete',
  Backspace: 'Backspace',
  Tab: 'Tab',
  Space: 'Space',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
};

/**
 * Turns a key event into a key of the table, or `null` for a modifier key alone.
 * Letters are read by their place on the keyboard (`KeyboardEvent.code`), so they work while a
 * Korean input method is on (03-editor 4). Cmd on a Mac counts as Ctrl.
 */
export function strokeOf(input: KeyInput): string | null {
  const { code, shiftKey } = input;
  if (ignoredCodes.test(code)) {
    return null;
  }
  const ctrl = input.ctrlKey || input.metaKey;
  const alt = input.altKey;
  const letter = /^Key([A-Z])$/.exec(code)?.[1];
  if (letter !== undefined) {
    if (ctrl) {
      return `Ctrl+${alt ? 'Alt+' : ''}${shiftKey ? 'Shift+' : ''}${letter}`;
    }
    const typed = shiftKey ? letter : letter.toLowerCase();
    return alt ? `Alt+${typed}` : typed;
  }
  const digit = /^(?:Digit|Numpad)(\d)$/.exec(code)?.[1];
  const symbol = symbolKeys[code];
  if (digit !== undefined || symbol !== undefined) {
    const typed = digit ?? (shiftKey ? symbol?.[1] : symbol?.[0]) ?? '';
    return `${ctrl ? 'Ctrl+' : ''}${alt ? 'Alt+' : ''}${typed}`;
  }
  const named = namedKeys[code] ?? (/^F\d{1,2}$/.test(code) ? code : null);
  if (named === null) {
    return null;
  }
  return `${ctrl ? 'Ctrl+' : ''}${alt ? 'Alt+' : ''}${shiftKey ? 'Shift+' : ''}${named}`;
}

/** What the key reader is in when a key comes. */
export type KeyContext = {
  readonly mode: 'normal' | 'visual';
  readonly selection: SelectionKind | null;
};

/** What a key does. */
export type KeyOutcome =
  /** Run this binding's command. */
  | { readonly kind: 'command'; readonly binding: KeyBinding }
  /** The first key of a two-key sequence: wait for the second (no time limit, UX K1). */
  | { readonly kind: 'pending'; readonly first: string }
  /** A waiting sequence ended by a key that does not continue it, or by Esc. Both are dropped. */
  | { readonly kind: 'cancelled'; readonly keys: string; readonly isEscape: boolean }
  /** No binding. */
  | { readonly kind: 'unbound'; readonly keys: string };

/**
 * Reads one key. `pending` is the first key of a sequence when one is waiting. Pure: the caller
 * keeps `pending` and the 0.4 s key hint timer.
 */
export function readKey(
  bindings: ReadonlyArray<KeyBinding>,
  pending: string | null,
  stroke: string,
  context: KeyContext,
): KeyOutcome {
  const usable = bindings.filter(
    (binding) =>
      binding.isDisplayOnly !== true &&
      (binding.mode ?? 'normal') === context.mode &&
      (binding.selection === undefined || binding.selection === context.selection),
  );
  if (pending !== null) {
    const keys = `${pending} ${stroke}`;
    const binding = usable.find((b) => b.keys === keys);
    return binding === undefined
      ? { kind: 'cancelled', keys, isEscape: stroke === 'Escape' }
      : { kind: 'command', binding };
  }
  if (usable.some((b) => b.keys.startsWith(`${stroke} `))) {
    return { kind: 'pending', first: stroke };
  }
  const binding = usable.find((b) => b.keys === stroke);
  return binding === undefined ? { kind: 'unbound', keys: stroke } : { kind: 'command', binding };
}
