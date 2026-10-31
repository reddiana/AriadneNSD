// Short messages from the shell (open failures, "downloaded", "another tab edits this file").
// Shown by `ShellNotices` above the editor's status bar.

/** One message. `warn` stays until closed; `info` goes away after a few seconds. */
export type ShellNotice = {
  readonly id: number;
  readonly text: string;
  readonly level: 'info' | 'warn';
};

/** The list of messages on screen, with a listener for React. */
export type NoticeBoard = {
  readonly show: (text: string, level: ShellNotice['level']) => void;
  readonly dismiss: (id: number) => void;
  readonly list: () => ReadonlyArray<ShellNotice>;
  readonly subscribe: (listener: () => void) => () => void;
};

/** How long an `info` message stays. */
export const infoNoticeTime = 5000;

/** Creates an empty board. At most three messages show; the oldest goes first. */
export function createNoticeBoard(
  setTimer: (callback: () => void, milliseconds: number) => void,
): NoticeBoard {
  let notices: ReadonlyArray<ShellNotice> = [];
  let nextId = 1;
  const listeners = new Set<() => void>();
  const changed = (): void => {
    for (const listener of listeners) {
      listener();
    }
  };
  const dismiss = (id: number): void => {
    notices = notices.filter((notice) => notice.id !== id);
    changed();
  };
  return {
    show(text, level) {
      const notice = { id: nextId, text, level };
      nextId += 1;
      notices = [...notices.filter((old) => old.text !== text), notice].slice(-3);
      changed();
      if (level === 'info') {
        setTimer(() => {
          dismiss(notice.id);
        }, infoNoticeTime);
      }
    },
    dismiss,
    list: () => notices,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
