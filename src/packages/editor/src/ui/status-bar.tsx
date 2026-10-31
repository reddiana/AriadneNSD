// The status bar: what is selected, the latest notice, and a question with buttons such as
// "Case로 바꿀까요?" (06-web 7: "선택한 것과 알림만", UX MD3).

import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

import { useChrome, useChromeState, useDocStatus } from './use-engine';

/** How long a notice stays before it fades from the status bar. */
const noticeMilliseconds = 6000;

/** Hides a notice some seconds after it appeared. A new notice (new id) shows again. */
function useVisibleNotice(id: number | null): boolean {
  const [hiddenId, setHiddenId] = useState<number | null>(null);
  useEffect(() => {
    if (id === null) return;
    const timer = setTimeout(() => {
      setHiddenId(id);
    }, noticeMilliseconds);
    return () => {
      clearTimeout(timer);
    };
  }, [id]);
  return id !== null && id !== hiddenId;
}

/** The status bar at the bottom of the editor. */
export function StatusBar(): ReactElement {
  const { handle, format, text } = useChrome();
  const state = useChromeState(handle);
  const status = useDocStatus(handle);
  const isNoticeVisible = useVisibleNotice(state.notice?.id ?? null);
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
          <span className="ans-notice" data-level={notice.level} key={notice.id}>
            {format(notice.message)}
          </span>
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
