import { describe, expect, it } from 'vitest';

import type { Channel, TabMessage } from './tab-lock';
import { createTabLock } from './tab-lock';

/** Channels that deliver to each other at once, like tabs of one site. */
function hub(): () => Channel {
  const listeners = new Set<(event: { readonly data: unknown }) => void>();
  return () => {
    let own: ((event: { readonly data: unknown }) => void) | null = null;
    return {
      postMessage(message: TabMessage) {
        for (const listener of listeners) {
          if (listener !== own) {
            listener({ data: message });
          }
        }
      },
      addEventListener(_type, listener) {
        own = listener;
        listeners.add(listener);
      },
      close() {
        if (own !== null) {
          listeners.delete(own);
        }
      },
    };
  };
}

const noWait = (): Promise<void> => Promise.resolve();

async function settle(): Promise<void> {
  for (let index = 0; index < 20; index += 1) {
    await Promise.resolve();
  }
}

describe('tab lock', () => {
  it('06-web 2: the first tab edits; a later tab with the same file only views', async () => {
    const channel = hub();
    const first = createTabLock(channel(), 'tab-1', { regained: () => undefined }, noWait);
    const second = createTabLock(channel(), 'tab-2', { regained: () => undefined }, noWait);
    expect(await first.claim('file-a')).toBe(true);
    expect(await second.claim('file-a')).toBe(false);
  });

  it('06-web 2: different files do not block each other', async () => {
    const channel = hub();
    const first = createTabLock(channel(), 'tab-1', { regained: () => undefined }, noWait);
    const second = createTabLock(channel(), 'tab-2', { regained: () => undefined }, noWait);
    expect(await first.claim('file-a')).toBe(true);
    expect(await second.claim('file-b')).toBe(true);
  });

  it('03-editor 6.4: the viewing tab may edit again when the other tab closes', async () => {
    const channel = hub();
    let regained = 0;
    const first = createTabLock(channel(), 'tab-1', { regained: () => undefined }, noWait);
    const second = createTabLock(channel(), 'tab-2', { regained: () => (regained += 1) }, noWait);
    await first.claim('file-a');
    await second.claim('file-a');
    first.dispose();
    await settle();
    expect(regained).toBe(1);
    const third = createTabLock(channel(), 'tab-3', { regained: () => undefined }, noWait);
    expect(await third.claim('file-a')).toBe(false);
  });

  it('moves a claim to the new file after save as', async () => {
    const channel = hub();
    const first = createTabLock(channel(), 'tab-1', { regained: () => undefined }, noWait);
    const second = createTabLock(channel(), 'tab-2', { regained: () => undefined }, noWait);
    await first.claim('file-a');
    first.rename('file-b');
    expect(await second.claim('file-a')).toBe(true);
    const third = createTabLock(channel(), 'tab-3', { regained: () => undefined }, noWait);
    expect(await third.claim('file-b')).toBe(false);
  });

  it('every claim succeeds without BroadcastChannel', async () => {
    const lock = createTabLock(null, 'tab-1', { regained: () => undefined }, noWait);
    expect(await lock.claim('file-a')).toBe(true);
  });
});
