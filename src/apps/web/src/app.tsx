import type { Locale } from '@ariadne-nsd/core';
import type { EditorHandle } from '@ariadne-nsd/editor';
import { EditorApp } from '@ariadne-nsd/editor';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

import type { Appearance, SettingsStore } from './editor-contract';
import { shellMessage } from './shell/messages';

/** The user guide on the same site (06-web 5, 7): `/AriadneNSD/manual/` next to `/AriadneNSD/app/`. */
const manualUrl = '../manual/';

export type AppProps = {
  /** The editor, with the members its UI needs (more than the shell's contract). */
  readonly handle: EditorHandle;
  readonly canvas: HTMLElement;
  readonly locale: Locale;
  readonly settings: SettingsStore;
  /** The current appearance and a way to hear about changes (prefers-color-scheme). */
  readonly appearance: Appearance;
  readonly onAppearance: (listener: (appearance: Appearance) => void) => () => void;
  /** Whether a file is being dragged over the page (to show the drop hint). */
  readonly onDragState: (listener: (isDragging: boolean) => void) => () => void;
};

/**
 * The web page: the editor's UI (menu bar, toolbar, canvas, status bar). The shell's messages go
 * to the editor's status bar and its questions to the editor's modal (`EditorHandle.notify`,
 * `confirm`, `prompt`), so there is one place for both.
 */
export function App(props: AppProps): ReactElement {
  const { handle, onAppearance, onDragState } = props;
  const [appearance, setAppearance] = useState(props.appearance);
  const [isDragging, setDragging] = useState(false);
  useEffect(
    () =>
      onAppearance((next) => {
        setAppearance(next);
        handle.setAppearance(next);
      }),
    [handle, onAppearance],
  );
  useEffect(() => onDragState(setDragging), [onDragState]);
  return (
    <>
      <EditorApp
        handle={handle}
        canvas={props.canvas}
        locale={props.locale}
        appearance={appearance}
        settings={props.settings}
        manualUrl={manualUrl}
      />
      {isDragging ? <div className="ans-web-drop">{dropHint(props.locale)}</div> : null}
    </>
  );
}

function dropHint(locale: Locale): string {
  return shellMessage(locale, 'drop.hint');
}
