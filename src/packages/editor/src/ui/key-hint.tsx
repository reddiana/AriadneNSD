// The key hint: after the first key of a two-key sequence, list the keys that can follow and
// their commands just under the selection, where the eyes already are (03-keymap, UX K3; until
// 2026-11-02 at the bottom of the screen, K1). The engine decides when it is due (0.4 s, and the
// user setting, R-EDIT-04); the UI draws it.

import type { ReactElement } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';

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

/**
 * Where the hint goes: under the anchor, or above it (`anchorTop` is the selection's top) when it
 * would stick out at the bottom; always inside the window.
 */
export function keyHintPlace(
  anchor: { readonly x: number; readonly y: number },
  anchorTop: number,
  size: { readonly width: number; readonly height: number },
  view: { readonly width: number; readonly height: number },
): { readonly left: number; readonly top: number } {
  const margin = 4;
  const gap = 4;
  const below = anchor.y + gap;
  const above = anchorTop - gap - size.height;
  const top = below + size.height <= view.height - margin || above < margin ? below : above;
  return {
    left: Math.max(margin, Math.min(anchor.x, view.width - size.width - margin)),
    top: Math.max(margin, Math.min(top, view.height - size.height - margin)),
  };
}

/** The hint box under the selection. */
export function KeyHint(): ReactElement | null {
  const { handle, format, text } = useChrome();
  const { pendingKeys, isKeyHintShown, keyHintTitle } = useChromeState(handle);
  const commands = useCommands();
  const boxRef = useRef<HTMLDivElement>(null);
  const isShown = isKeyHintShown && pendingKeys !== null;
  const [place, setPlace] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const view = box?.ownerDocument.defaultView;
    if (!isShown || !box || !view) {
      setPlace(null);
      return;
    }
    const anchor = handle.popupAnchor();
    const { width, height } = box.getBoundingClientRect();
    setPlace(
      keyHintPlace(
        anchor,
        anchor.top,
        { width, height },
        {
          width: view.innerWidth,
          height: view.innerHeight,
        },
      ),
    );
  }, [handle, isShown, pendingKeys]);

  if (!isShown) return null;
  const rows = keyHintRows(commands, pendingKeys);
  if (rows.length === 0) return null;
  return (
    <div
      className="ans-keyhint"
      role="note"
      aria-label={text('hint.label')}
      ref={boxRef}
      // Measured first, then placed: hidden for that one layout pass.
      style={place ?? { left: 0, top: 0, visibility: 'hidden' }}
    >
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
