// React hooks that subscribe to the engine. Components read state only through these
// (coding guide 9: subscribe to the editor's state, run commands through the registry).

import type { Locale } from '@ariadne-nsd/core';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import type { CommandView, MessageFormatter } from './command-view';
import { viewCommands } from './command-view';
import type { ChromeState, DocStatus, EditorHandle } from './engine-api';
import type { UiMessageKey } from './messages';
import { uiMessage } from './messages';

/** What every UI component needs: the engine, the screen language and the formatter. */
export type Chrome = {
  readonly handle: EditorHandle;
  readonly locale: Locale;
  readonly format: MessageFormatter;
  /** A UI string in the screen language. */
  readonly text: (key: UiMessageKey, params?: Readonly<Record<string, string | number>>) => string;
  /** Runs a command and remembers it for the palette's "recent" order. */
  readonly run: (id: string) => void;
};

export const ChromeContext = createContext<Chrome | null>(null);

/** The chrome of the nearest `EditorApp`. */
export function useChrome(): Chrome {
  const chrome = useContext(ChromeContext);
  if (chrome === null) throw new Error('useChrome() needs an EditorApp (ChromeContext) above it');
  return chrome;
}

/** Builds the `text` function of a locale. */
export function textOf(locale: Locale): Chrome['text'] {
  return (key, params) => uiMessage(locale, key, params);
}

/**
 * Subscribes to a source with a "read now" function and a "tell me when it changes" function.
 * Uses state rather than `useSyncExternalStore` so that a source that returns a fresh object
 * on every read does not loop.
 */
function useSubscription<T>(read: () => T, subscribe: (listener: () => void) => () => void): T {
  const [value, setValue] = useState(read);
  useEffect(() => {
    setValue(read());
    return subscribe(() => {
      setValue(read());
    });
  }, [read, subscribe]);
  return value;
}

/** The document's name, unsaved mark and read-only state (03-editor 6.2). */
export function useDocStatus(handle: EditorHandle): DocStatus {
  const read = useMemo(() => () => handle.status(), [handle]);
  const subscribe = useMemo(() => (listener: () => void) => handle.onStatus(listener), [handle]);
  return useSubscription(read, subscribe);
}

/** The status bar's content and the pending key (see `ChromeState`). */
export function useChromeState(handle: EditorHandle): ChromeState {
  const read = useMemo(() => () => handle.chromeState(), [handle]);
  const subscribe = useMemo(
    () => (listener: () => void) => handle.onChromeState(listener),
    [handle],
  );
  return useSubscription(read, subscribe);
}

/** All commands with their titles and "applies now", re-evaluated when the registry says so. */
export function useCommands(): ReadonlyArray<CommandView> {
  const { handle, format } = useChrome();
  const registry = handle.commands;
  const read = useMemo(() => () => viewCommands(registry, format), [registry, format]);
  const subscribe = useMemo(
    () => (listener: () => void) => registry.onChange(listener),
    [registry],
  );
  return useSubscription(read, subscribe);
}
