// The segments of an edit's time (QA-07's measuring segments, 06-web 9): the check mode splits
// each timed run along the path of the C&C view (01-architecture 3), from the key to the frame
// after the drawing changed. The editor and `core` time their parts with a `PhaseTimer`; the
// recorder here adds the times up, each part without the parts inside it. Pure but for the clock.

import type { PhaseTimer } from '@ariadne-nsd/core';

/**
 * The segments, in the order of the path. `input` and `paint` are what is left: the key's own
 * handling before the parts, and the browser's work after the editor's (style, layout, paint).
 */
export const perfSegmentIds = [
  'input',
  'command',
  'check',
  'layout',
  'draw',
  'notify',
  'dom',
  'paint',
] as const;

/** One of the segments. */
export type PerfSegmentId = (typeof perfSegmentIds)[number];

/** The connectors of the C&C view each segment covers (01-architecture 3.4). */
export const perfSegmentConnectors: Readonly<Record<PerfSegmentId, string>> = {
  input: 'C-01 ~ C-04',
  command: 'C-04 · C-05',
  check: 'C-05',
  layout: 'C-07 · C-08',
  draw: 'C-09',
  notify: 'C-06 · C-11',
  dom: 'C-10',
  paint: '',
};

/** The segment each timed part belongs to. Parts the list does not know are left out. */
const segmentOfPhase: Readonly<Record<string, PerfSegmentId>> = {
  command: 'command',
  check: 'check',
  layout: 'layout',
  scene: 'draw',
  svg: 'draw',
  notify: 'notify',
  dom: 'dom',
};

/** Adds up the timed parts of one run; a part's time leaves out the parts inside it. */
export type PhaseRecorder = {
  /** Give this to the editor (`createEditor({ time })`). */
  readonly time: PhaseTimer;
  /** Starts a new run: forgets the times so far. */
  readonly reset: () => void;
  /** The time of each part so far (ms), each without the parts inside it. */
  readonly totals: () => Readonly<Record<string, number>>;
};

/** Makes a recorder that reads `now` (`performance.now`). */
export function createPhaseRecorder(now: () => number): PhaseRecorder {
  let totals: Record<string, number> = {};
  /** The parts running now, the innermost last, each with the time of its inner parts. */
  const running: { inner: number }[] = [];
  const time: PhaseTimer = (phase, run) => {
    const frame = { inner: 0 };
    running.push(frame);
    const start = now();
    try {
      return run();
    } finally {
      const elapsed = now() - start;
      running.pop();
      totals[phase] = (totals[phase] ?? 0) + elapsed - frame.inner;
      const outer = running.at(-1);
      if (outer !== undefined) {
        outer.inner += elapsed;
      }
    }
  };
  return {
    time,
    reset: () => {
      totals = {};
    },
    totals: () => ({ ...totals }),
  };
}

/** The times of one run, from the key event. */
export type RunTimes = {
  /** The key event to the end of its handler (the synchronous part). */
  readonly sync: number;
  /** The key event to the frame after the drawing changed: the time QA-07 sets the limit for. */
  readonly total: number;
  /** The parts timed during the handler. */
  readonly syncParts: Readonly<Record<string, number>>;
  /** The parts timed by the end (the handler's and those after it). */
  readonly allParts: Readonly<Record<string, number>>;
};

/** Splits one run into the segments (ms). The segments add up to the total. */
export function splitRun(times: RunTimes): Readonly<Record<PerfSegmentId, number>> {
  const segments: Record<PerfSegmentId, number> = {
    input: 0,
    command: 0,
    check: 0,
    layout: 0,
    draw: 0,
    notify: 0,
    dom: 0,
    paint: 0,
  };
  let syncTimed = 0;
  for (const [phase, value] of Object.entries(times.syncParts)) {
    if (segmentOfPhase[phase] !== undefined) {
      syncTimed += value;
    }
  }
  let laterTimed = 0;
  for (const [phase, value] of Object.entries(times.allParts)) {
    const segment = segmentOfPhase[phase];
    if (segment === undefined) {
      continue;
    }
    segments[segment] += value;
    laterTimed += value - (times.syncParts[phase] ?? 0);
  }
  segments.input = Math.max(0, times.sync - syncTimed);
  segments.paint = Math.max(0, times.total - times.sync - laterTimed);
  return segments;
}
