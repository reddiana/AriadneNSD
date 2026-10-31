// The two timers of the web shell (03-editor 6.3, 06-web 2). Pure: the clock is passed in.

/** The part of `setTimeout` the timers use, so tests can run them without waiting. */
export type Clock = {
  readonly setTimeout: (callback: () => void, milliseconds: number) => unknown;
  readonly clearTimeout: (handle: unknown) => void;
};

/** The browser's clock. */
export const browserClock: Clock = {
  setTimeout: (callback, milliseconds) => globalThis.setTimeout(callback, milliseconds),
  clearTimeout: (handle) => {
    globalThis.clearTimeout(handle as ReturnType<typeof globalThis.setTimeout>);
  },
};

/** Local backup: edits within 0.5 s are written once (06-web 2). */
export const backupDelay = 500;
/** Auto save: 2 s after the last edit (06-web 2, UX W3-b). */
export const autosaveDelay = 2000;

/** A trailing debounce. See `createDebounce`. */
export type Debounce = {
  /** Restarts the wait. */
  readonly poke: () => void;
  readonly cancel: () => void;
  /** Runs a pending call now (before the page hides). */
  readonly flush: () => void;
  readonly isPending: () => boolean;
};

/**
 * Runs `write` once after calls to `poke` stop for `delay` ms. Used for the local backup.
 */
export function createDebounce(write: () => void, delay: number, clock: Clock): Debounce {
  let handle: unknown = undefined;
  let isPending = false;
  const fire = (): void => {
    isPending = false;
    write();
  };
  return {
    poke() {
      if (isPending) {
        clock.clearTimeout(handle);
      }
      isPending = true;
      handle = clock.setTimeout(fire, delay);
    },
    cancel() {
      if (isPending) {
        clock.clearTimeout(handle);
        isPending = false;
      }
    },
    flush() {
      if (isPending) {
        clock.clearTimeout(handle);
        fire();
      }
    },
    isPending: () => isPending,
  };
}

/** What one auto save attempt ended in. `stop` turns auto save off until `resume`. */
export type AutosaveOutcome = 'saved' | 'skipped' | 'stop';

/** The auto save scheduler. See `createAutosave`. */
export type Autosave = {
  /** The document changed (it is dirty). */
  readonly changed: () => void;
  readonly stop: () => void;
  readonly resume: () => void;
  readonly isStopped: () => boolean;
  readonly dispose: () => void;
};

/**
 * Auto save (03-editor 6.3): after a change, waits `delay` ms without further changes, then
 * saves. A change while saving waits again after the save ends. When a save cannot get write
 * permission the scheduler stops and the document stays unsaved (06-web 2) until `resume`.
 */
export function createAutosave(
  save: () => Promise<AutosaveOutcome>,
  delay: number,
  clock: Clock,
): Autosave {
  let isStopped = false;
  let isSaving = false;
  let isChangedWhileSaving = false;
  let isDisposed = false;
  // Read after an `await`: `changed` or `stop` may have been called while saving.
  const shouldSaveAgain = (): boolean => isChangedWhileSaving && !isDisposed && !isStopped;
  const run = async (): Promise<void> => {
    isSaving = true;
    isChangedWhileSaving = false;
    let outcome: AutosaveOutcome;
    try {
      outcome = await save();
    } finally {
      isSaving = false;
    }
    if (outcome === 'stop') {
      isStopped = true;
      timer.cancel();
      return;
    }
    if (shouldSaveAgain()) {
      timer.poke();
    }
  };
  const timer = createDebounce(
    () => {
      void run();
    },
    delay,
    clock,
  );
  return {
    changed() {
      if (isStopped || isDisposed) {
        return;
      }
      if (isSaving) {
        isChangedWhileSaving = true;
        return;
      }
      timer.poke();
    },
    stop() {
      isStopped = true;
      timer.cancel();
    },
    resume() {
      isStopped = false;
    },
    isStopped: () => isStopped,
    dispose() {
      isDisposed = true;
      timer.cancel();
    },
  };
}
