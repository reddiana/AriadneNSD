import type { Locale } from '@ariadne-nsd/core';
import type { EditorHandle } from '@ariadne-nsd/editor';
import { EditorApp } from '@ariadne-nsd/editor';
import type { ReactElement } from 'react';
import { useEffect, useState, useSyncExternalStore } from 'react';

import type { Appearance, SettingsStore } from './editor-contract';
import { shellMessage } from './shell/messages';
import type { NoticeBoard } from './shell/notices';

/** The user guide on the same site (06-web 5, 7): `/AriadneNSD/manual/` next to `/AriadneNSD/app/`. */
const manualUrl = '../manual/';

export type AppProps = {
  /** The editor, with the members its UI needs (more than the shell's contract). */
  readonly handle: EditorHandle;
  readonly canvas: HTMLElement;
  readonly locale: Locale;
  readonly settings: SettingsStore;
  readonly notices: NoticeBoard;
  /** The current appearance and a way to hear about changes (prefers-color-scheme). */
  readonly appearance: Appearance;
  readonly onAppearance: (listener: (appearance: Appearance) => void) => () => void;
  /** Whether a file is being dragged over the page (to show the drop hint). */
  readonly onDragState: (listener: (isDragging: boolean) => void) => () => void;
};

/** The web page: the editor's UI (menu bar, toolbar, canvas, status bar) and the shell's notices. */
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
      <ShellNotices notices={props.notices} locale={props.locale} />
      {isDragging ? <div className="ans-web-drop">{dropHint(props.locale)}</div> : null}
    </>
  );
}

function dropHint(locale: Locale): string {
  return shellMessage(locale, 'drop.hint');
}

/** The shell's messages, above the status bar. `warn` messages stay until closed. */
function ShellNotices(props: {
  readonly notices: NoticeBoard;
  readonly locale: Locale;
}): ReactElement {
  const { notices } = props;
  const list = useSyncExternalStore(notices.subscribe, notices.list);
  return (
    <div className="ans-web-notices" role="status" aria-live="polite">
      {list.map((notice) => (
        <div key={notice.id} className={`ans-web-notice ans-web-notice-${notice.level}`}>
          <span>{notice.text}</span>
          <button
            type="button"
            aria-label={shellMessage(props.locale, 'notice.close')}
            onClick={() => {
              notices.dismiss(notice.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
