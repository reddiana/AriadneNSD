/** A set of listeners: `add` returns a function that removes the listener, `emit` calls them all. */
export function createListeners<L extends (...args: never[]) => void>(): {
  readonly add: (listener: L) => () => void;
  readonly emit: (...args: Parameters<L>) => void;
} {
  const listeners = new Set<L>();
  return {
    add(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    emit(...args) {
      for (const listener of listeners) {
        listener(...args);
      }
    },
  };
}
