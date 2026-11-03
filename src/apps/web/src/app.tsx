import type { Locale } from '@ariadne-nsd/core';
import type { EditorHandle, ExamplesHost } from '@ariadne-nsd/editor';
import { EditorApp } from '@ariadne-nsd/editor';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

import type { Appearance, SettingsStore } from './editor-contract';
import { shellMessage } from './shell/messages';

/**
 * The user guide on the same site, in the screen language (06-web 5, DR-0020): the app is the
 * site's front page, the guide is `manual/` (English) and `manual/ko/` (Korean).
 */
export function manualUrl(locale: Locale): string {
  return locale === 'ko' ? 'manual/ko/' : 'manual/';
}

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
  readonly onDragState: (
    listener: (isDragging: boolean) => void,
  ) => () => void; /** The examples: opening one, and the first visit's welcome (R-EDIT-25). */
  readonly examples: ExamplesHost;
  /** View mode (R-WEB-06): whether the page starts in it, hearing changes, and "Edit". */
  readonly view: {
    readonly isViewing: boolean;
    readonly onViewMode: (listener: (isViewing: boolean) => void) => () => void;
    readonly onEdit: () => void;
  };
};

/**
 * The web page: the editor's UI (menu bar, toolbar, canvas, status bar). The shell's messages go
 * to the editor's status bar and its questions to the editor's modal (`EditorHandle.notify`,
 * `confirm`, `prompt`), so there is one place for both.
 */
export function App(props: AppProps): ReactElement {
  const { handle, onAppearance, onDragState, view } = props;
  const [appearance, setAppearance] = useState(props.appearance);
  const [isDragging, setDragging] = useState(false);
  const [isViewing, setViewing] = useState(view.isViewing);
  const { onViewMode, onEdit } = view;
  useEffect(
    () =>
      onAppearance((next) => {
        setAppearance(next);
        handle.setAppearance(next);
      }),
    [handle, onAppearance],
  );
  useEffect(() => onDragState(setDragging), [onDragState]);
  useEffect(() => onViewMode(setViewing), [onViewMode]);
  return (
    <>
      <EditorApp
        handle={handle}
        canvas={props.canvas}
        locale={props.locale}
        appearance={appearance}
        settings={props.settings}
        manualUrl={manualUrl(props.locale)}
        examples={props.examples}
        {...(isViewing ? { viewMode: { onEdit } } : {})}
      />
      {isDragging ? <div className="ans-web-drop">{dropHint(props.locale)}</div> : null}
    </>
  );
}

function dropHint(locale: Locale): string {
  return shellMessage(locale, 'drop.hint');
}
