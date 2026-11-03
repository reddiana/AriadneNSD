// The bar of view mode (R-WEB-06, 05-screen-layout "보기 모드"): in place of the menu bar, the
// toolbar and the status bar, one slim bar with the product name, the document's name, the latest
// notice and the one button "Edit" (UX SH3, SH4).

import type { ReactElement } from 'react';

import { useVisibleNotice } from './status-bar';
import { useChrome, useChromeState, useDocStatus } from './use-engine';

/** Not translated: the product name. */
const productName = 'AriadneNSD';

export type ViewBarProps = {
  /** "Edit": the shell makes the document editable and the editing UI comes back. */
  readonly onEdit: () => void;
};

/** The one bar of view mode. */
export function ViewBar({ onEdit }: ViewBarProps): ReactElement {
  const { handle, format, text } = useChrome();
  const status = useDocStatus(handle);
  const { notice } = useChromeState(handle);
  const [isNoticeVisible] = useVisibleNotice(notice?.id ?? null, notice?.level ?? null);
  return (
    <div className="ans-viewbar" role="toolbar" aria-label={text('view.label')}>
      <span className="ans-brand">{productName}</span>
      <span className="ans-view-name" data-testid="file-name">
        {status.name}
      </span>
      <span className="ans-view-notice" role="status">
        {notice && isNoticeVisible && (
          <span className="ans-notice" data-level={notice.level} key={notice.id}>
            {format(notice.message)}
          </span>
        )}
      </span>
      <span className="ans-view-mode">{text('view.label')}</span>
      <button
        type="button"
        className="ans-view-edit"
        data-testid="view-edit"
        title={text('view.editTip')}
        onClick={() => {
          onEdit();
          handle.focus();
        }}
      >
        {text('view.edit')}
      </button>
    </div>
  );
}
