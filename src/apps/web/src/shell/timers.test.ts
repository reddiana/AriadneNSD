import { describe, expect, it } from 'vitest';

import type { AutosaveOutcome, Clock } from './timers';
import { autosaveDelay, backupDelay, createAutosave, createDebounce } from './timers';

/** A clock that only moves when the test says so. */
function manualClock(): Clock & { advance: (milliseconds: number) => void } {
  let now = 0;
  let nextId = 0;
  const timers = new Map<number, { at: number; callback: () => void }>();
  return {
    setTimeout(callback, milliseconds) {
      nextId += 1;
      timers.set(nextId, { at: now + milliseconds, callback });
      return nextId;
    },
    clearTimeout(handle) {
      timers.delete(handle as number);
    },
    advance(milliseconds) {
      now += milliseconds;
      const due = [...timers].filter(([, timer]) => timer.at <= now);
      due.sort((a, b) => a[1].at - b[1].at);
      for (const [id, timer] of due) {
        timers.delete(id);
        timer.callback();
      }
    },
  };
}

/** Lets awaited promises settle. */
async function settle(): Promise<void> {
  for (let index = 0; index < 5; index += 1) {
    await Promise.resolve();
  }
}

function countingSave(outcome: () => AutosaveOutcome): {
  save: () => Promise<AutosaveOutcome>;
  count: () => number;
} {
  let count = 0;
  return {
    save: () => {
      count += 1;
      return Promise.resolve(outcome());
    },
    count: () => count,
  };
}

describe('local backup timer', () => {
  it('R-WEB-03: writes once for edits within 0.5 s', () => {
    const clock = manualClock();
    let writes = 0;
    const backup = createDebounce(() => (writes += 1), backupDelay, clock);
    backup.poke();
    clock.advance(300);
    backup.poke();
    clock.advance(300);
    expect(writes).toBe(0);
    clock.advance(200);
    expect(writes).toBe(1);
  });

  it('R-WEB-03: flushes a pending write at once, and does nothing when none is pending', () => {
    const clock = manualClock();
    let writes = 0;
    const backup = createDebounce(() => (writes += 1), backupDelay, clock);
    backup.flush();
    expect(writes).toBe(0);
    backup.poke();
    backup.flush();
    expect(writes).toBe(1);
    clock.advance(1000);
    expect(writes).toBe(1);
  });

  it('cancels a pending write', () => {
    const clock = manualClock();
    let writes = 0;
    const backup = createDebounce(() => (writes += 1), backupDelay, clock);
    backup.poke();
    backup.cancel();
    clock.advance(1000);
    expect(writes).toBe(0);
    expect(backup.isPending()).toBe(false);
  });
});

describe('auto save timer', () => {
  it('R-EXP-04: saves 2 s after the last change', async () => {
    const clock = manualClock();
    const saver = countingSave(() => 'saved');
    const autosave = createAutosave(saver.save, autosaveDelay, clock);
    autosave.changed();
    clock.advance(1500);
    autosave.changed();
    clock.advance(1500);
    expect(saver.count()).toBe(0);
    clock.advance(500);
    await settle();
    expect(saver.count()).toBe(1);
  });

  it('R-EXP-04: a change while saving waits 2 s again after the save ends', async () => {
    const clock = manualClock();
    let saves = 0;
    let finish: (outcome: AutosaveOutcome) => void = () => undefined;
    const autosave = createAutosave(
      () => {
        saves += 1;
        return new Promise<AutosaveOutcome>((resolve) => (finish = resolve));
      },
      autosaveDelay,
      clock,
    );
    autosave.changed();
    clock.advance(2000);
    expect(saves).toBe(1);
    autosave.changed();
    clock.advance(5000);
    expect(saves).toBe(1);
    finish('saved');
    await settle();
    clock.advance(1999);
    expect(saves).toBe(1);
    clock.advance(1);
    expect(saves).toBe(2);
  });

  it('06-web 2: stops when write permission is lost, until resumed', async () => {
    const clock = manualClock();
    let outcome: AutosaveOutcome = 'stop';
    const saver = countingSave(() => outcome);
    const autosave = createAutosave(saver.save, autosaveDelay, clock);
    autosave.changed();
    clock.advance(2000);
    await settle();
    expect(autosave.isStopped()).toBe(true);
    autosave.changed();
    clock.advance(5000);
    expect(saver.count()).toBe(1);
    outcome = 'saved';
    autosave.resume();
    autosave.changed();
    clock.advance(2000);
    await settle();
    expect(saver.count()).toBe(2);
  });

  it('does not save after dispose', () => {
    const clock = manualClock();
    const saver = countingSave(() => 'saved');
    const autosave = createAutosave(saver.save, autosaveDelay, clock);
    autosave.changed();
    autosave.dispose();
    clock.advance(5000);
    expect(saver.count()).toBe(0);
  });
});
