// The shell's side of the open · save modal (R-WEB-09, UX BS1): one request at a time, answered
// by the editor's modal. The list actions are the shell's (`web-shell.ts`).

import type { PlacesAnswer, PlacesHost, PlacesRequest } from '../editor-contract';

/** The host the editor's modal talks to, plus `ask` for the shell. */
export type Places = PlacesHost & {
  /** Shows the modal and resolves with the answer. A new request closes the old one (`null`). */
  readonly ask: (request: Omit<PlacesRequest, 'id'>) => Promise<PlacesAnswer>;
};

/** The list actions of the modal (UX BS3, BS4). */
export type PlacesActions = Omit<PlacesHost, 'request' | 'onRequest' | 'answer'>;

/** Creates the request holder. */
export function createPlaces(actions: PlacesActions): Places {
  let current: {
    readonly request: PlacesRequest;
    readonly resolve: (answer: PlacesAnswer) => void;
  } | null = null;
  let nextId = 1;
  const listeners = new Set<() => void>();
  const tell = (): void => {
    for (const listener of [...listeners]) {
      listener();
    }
  };
  const answer = (value: PlacesAnswer): void => {
    if (current === null) {
      return;
    }
    const { resolve } = current;
    current = null;
    tell();
    resolve(value);
  };
  return {
    ...actions,
    request: () => current?.request ?? null,
    onRequest: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    answer,
    ask: (request) => {
      answer(null);
      return new Promise((resolve) => {
        current = { request: { ...request, id: nextId++ }, resolve };
        tell();
      });
    },
  };
}
