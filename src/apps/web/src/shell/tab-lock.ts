// "Another tab is editing this file" (06-web 2, 03-editor 6.4): tabs of this site tell each other
// which document they edit over a BroadcastChannel. The tab that opened the file later only views.

/** The messages between tabs. */
export type TabMessage =
  | { readonly type: 'who'; readonly key: string; readonly from: string }
  | { readonly type: 'mine'; readonly key: string; readonly from: string }
  | { readonly type: 'released'; readonly key: string; readonly from: string };

/** The part of `BroadcastChannel` the lock uses, so tests can pass a fake. */
export type Channel = {
  postMessage(message: TabMessage): void;
  addEventListener(type: 'message', listener: (event: { readonly data: unknown }) => void): void;
  close(): void;
};

/** How long to wait for another tab to answer "who edits this?". Tabs answer in a few ms. */
export const answerWait = 150;

/** What the lock tells the shell. */
export type TabLockEvents = {
  /** The other tab let go: this tab may edit again. */
  readonly regained: () => void;
};

/** The lock of one tab. See `createTabLock`. */
export type TabLock = {
  /**
   * Claims `key` for this tab. Resolves `true` when no other tab edits it, `false` when one does
   * (then the tab waits and calls `regained` when that tab lets go).
   */
  readonly claim: (key: string) => Promise<boolean>;
  /** Lets go of the current key (the document closes or the tab hides). */
  readonly release: () => void;
  /** Moves an owned claim to a new key without asking (after "save as" to a new file). */
  readonly rename: (key: string) => void;
  readonly dispose: () => void;
};

/**
 * Creates the lock. `channel` is `null` where BroadcastChannel is missing: every claim succeeds.
 */
export function createTabLock(
  channel: Channel | null,
  tabId: string,
  events: TabLockEvents,
  wait: (milliseconds: number) => Promise<void>,
): TabLock {
  let key: string | null = null;
  let isOwner = false;
  let isWaiting = false;
  let isAnswered = false;

  const post = (type: TabMessage['type'], forKey: string): void => {
    channel?.postMessage({ type, key: forKey, from: tabId });
  };

  // Read after an `await`: another message may have changed the state meanwhile.
  const isStillWaitingFor = (forKey: string): boolean => key === forKey && isWaiting;

  const ask = async (forKey: string): Promise<boolean> => {
    isAnswered = false;
    post('who', forKey);
    await wait(answerWait);
    return !isAnswered;
  };

  channel?.addEventListener('message', (event) => {
    const message = event.data as TabMessage;
    if (message.from === tabId || message.key !== key) {
      return;
    }
    switch (message.type) {
      case 'who':
        if (isOwner) {
          post('mine', message.key);
        }
        break;
      case 'mine':
        isAnswered = true;
        break;
      case 'released':
        if (isWaiting) {
          const forKey = message.key;
          void (async () => {
            if ((await ask(forKey)) && isStillWaitingFor(forKey)) {
              isWaiting = false;
              isOwner = true;
              events.regained();
            }
          })();
        }
        break;
    }
  });

  const release = (): void => {
    const owned = isOwner ? key : null;
    key = null;
    isOwner = false;
    isWaiting = false;
    if (owned !== null) {
      post('released', owned);
    }
  };

  return {
    async claim(newKey) {
      const owned = isOwner && key !== newKey ? key : null;
      key = newKey;
      isOwner = false;
      isWaiting = false;
      if (owned !== null) {
        post('released', owned);
      }
      if (channel === null || (await ask(newKey))) {
        if (key === newKey) {
          isOwner = true;
        }
        return true;
      }
      if (key === newKey) {
        isWaiting = true;
      }
      return false;
    },
    release,
    rename(newKey) {
      const owned = isOwner && key !== newKey ? key : null;
      key = newKey;
      isOwner = true;
      isWaiting = false;
      if (owned !== null) {
        post('released', owned);
      }
    },
    dispose() {
      release();
      channel?.close();
    },
  };
}
