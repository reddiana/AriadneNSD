// How the UI shows keys. The registry gives keys in the key table's form: a two-key sequence is
// two keys with a space ('d d', 'a i'), a chord joins with '+' ('Ctrl+X', 'Ctrl+Shift+P').

const modifierPrefixes = ['Ctrl+', 'Alt+', 'Meta+', 'Cmd+', 'Option+'];

/**
 * Whether a key is a standard key rather than a Vim key (03-keymap: the two columns).
 * Standard keys are chords with Ctrl · Alt · Meta and named keys (`Delete`, `F2`, `Enter`).
 * Letters, symbols and two-key sequences are Vim keys; Shift+letter is the capital letter.
 */
export function isStandardKey(key: string): boolean {
  if (modifierPrefixes.some((prefix) => key.startsWith(prefix))) return true;
  if (key.includes(' ')) return false;
  const base = key.startsWith('Shift+') ? key.slice('Shift+'.length) : key;
  return base.length > 1;
}

/**
 * The key a menu item shows: the standard key if there is one, otherwise the only key
 * (03-editor 5.1: "키가 둘이면 표준 키를 적고, Vim 키는 커맨드 팔레트와 단축키 목록에서").
 */
export function menuKey(keys: ReadonlyArray<string>): string | null {
  return keys.find(isStandardKey) ?? keys[0] ?? null;
}

const keyNames: Readonly<Record<string, string>> = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Escape: 'Esc',
  Delete: 'Del',
};

/** Turns a key of the key table into the text on the screen ('d d' → 'dd', 'ArrowUp' → '↑'). */
export function displayKey(key: string): string {
  const steps = key.split(' ').map((step) =>
    step
      .split('+')
      .map((part) => keyNames[part] ?? part)
      .join('+'),
  );
  // A sequence of single characters reads as Vim writes it ('dd', 'za'); others keep a space.
  return steps.every((step) => step.length === 1) ? steps.join('') : steps.join(' ');
}

/** Splits a command's keys into the two columns of the shortcut list. */
export function splitKeys(keys: ReadonlyArray<string>): {
  readonly vim: ReadonlyArray<string>;
  readonly standard: ReadonlyArray<string>;
} {
  return { vim: keys.filter((key) => !isStandardKey(key)), standard: keys.filter(isStandardKey) };
}

/**
 * The second keys that follow a pending first key, for the key hint (03-keymap, UX K1).
 * `'a'` and `'a i'` give `'i'`. A key with only one step or another first key gives `null`.
 */
export function nextStep(key: string, pending: string): string | null {
  const prefix = `${pending} `;
  return key.startsWith(prefix) ? key.slice(prefix.length) : null;
}
