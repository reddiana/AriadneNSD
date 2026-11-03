// The status bar: what is selected, the latest notice, and a question with buttons such as
// "Case로 바꿀까요?" (06-web 7: "선택한 것과 알림만", UX MD3).

import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

import { useChrome, useChromeState, useDocStatus } from './use-engine';

/** How long an `info` notice stays before it fades from the status bar. */
const noticeMilliseconds = 6000;

/**
 * Hides an `info` notice some seconds after it appeared; a `warn` notice stays until it is closed
 * or another notice comes (06-web: the shell's warnings are told here too). A new notice (new id)
 * shows again. Returns whether it shows and a function that closes it.
 */
export function useVisibleNotice(
  id: number | null,
  level: 'info' | 'warn' | null,
): readonly [boolean, () => void] {
  const [hiddenId, setHiddenId] = useState<number | null>(null);
  useEffect(() => {
    if (id === null || level !== 'info') return;
    const timer = setTimeout(() => {
      setHiddenId(id);
    }, noticeMilliseconds);
    return () => {
      clearTimeout(timer);
    };
  }, [id, level]);
  const close = (): void => {
    setHiddenId(id);
  };
  return [id !== null && id !== hiddenId, close] as const;
}

/** The status bar at the bottom of the editor. */
export function StatusBar(): ReactElement {
  const { handle, format, text } = useChrome();
  const state = useChromeState(handle);
  const status = useDocStatus(handle);
  const [isNoticeVisible, closeNotice] = useVisibleNotice(
    state.notice?.id ?? null,
    state.notice?.level ?? null,
  );
  const { question, notice } = state;

  return (
    <div className="ans-statusbar" role="status" aria-label={text('status.label')}>
      <span className="ans-selection" data-testid="selection">
        {state.selection === null ? text('status.nothingSelected') : format(state.selection)}
      </span>
      {question ? (
        <span className="ans-question" key={question.id}>
          <span>{format(question.message)}</span>
          {question.choices.map((choice) => (
            <button
              type="button"
              key={format(choice.title)}
              data-default={choice.isDefault === true}
              onClick={() => {
                choice.choose();
              }}
            >
              {format(choice.title)}
            </button>
          ))}
          <button
            type="button"
            aria-label={text('modal.close')}
            onClick={() => {
              question.dismiss();
            }}
          >
            ✕
          </button>
        </span>
      ) : (
        notice &&
        isNoticeVisible && (
          <>
            <span
              className="ans-notice"
              data-level={notice.level}
              key={notice.id}
              title={format(notice.message)}
            >
              {format(notice.message)}
            </span>
            {notice.level === 'warn' && (
              <button
                type="button"
                className="ans-notice-close"
                aria-label={text('notice.close')}
                onClick={closeNotice}
              >
                ✕
              </button>
            )}
          </>
        )
      )}
      {state.mode !== 'normal' && (
        <span className="ans-mode">
          {format(state.mode === 'editing' ? 'mode.editing' : 'mode.visual')}
        </span>
      )}
      {status.readOnly && <span className="ans-mode">{text('status.readOnly')}</span>}
    </div>
  );
}
