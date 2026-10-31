// The key hint: after the first key of a two-key sequence, list the keys that can follow and
// their commands at the bottom of the screen (03-keymap, UX K1, like which-key). The engine
// decides when it is due (0.4 s, and the user setting, R-EDIT-04); the UI draws it.

import type { ReactElement } from 'react';

import type { CommandView } from './command-view';
import { displayKey, nextStep } from './keys';
import { useChrome, useChromeState, useCommands } from './use-engine';

/** The keys that may follow `pending`, each with the command it runs, in key order. */
export function keyHintRows(
  commands: ReadonlyArray<CommandView>,
  pending: string,
): ReadonlyArray<{ readonly step: string; readonly title: string; readonly id: string }> {
  const rows = new Map<string, { step: string; title: string; id: string }>();
  for (const command of commands) {
    for (const key of command.keys) {
      const step = nextStep(key, pending);
      if (step !== null && !rows.has(step)) {
        rows.set(step, { step, title: command.title, id: command.id });
      }
    }
  }
  return [...rows.values()].sort((a, b) => a.step.localeCompare(b.step));
}

/** The hint box above the status bar. */
export function KeyHint(): ReactElement | null {
  const { handle, format, text } = useChrome();
  const { pendingKeys, isKeyHintShown, keyHintTitle } = useChromeState(handle);
  const commands = useCommands();
  if (!isKeyHintShown || pendingKeys === null) return null;
  const rows = keyHintRows(commands, pendingKeys);
  if (rows.length === 0) return null;
  return (
    <div className="ans-keyhint" role="note" aria-label={text('hint.label')}>
      <span className="ans-keyhint-title">
        <kbd>{displayKey(pendingKeys)}</kbd>{' '}
        {keyHintTitle === null ? text('hint.label') : format(keyHintTitle)}
      </span>
      {rows.map((row) => (
        <span className="ans-keyhint-row" key={row.step}>
          <kbd>{displayKey(row.step)}</kbd>
          <span>{row.title}</span>
        </span>
      ))}
    </div>
  );
}
