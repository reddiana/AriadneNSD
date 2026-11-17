// The segments of QA-07 the check mode splits an edit into (06-web 9).
import { describe, expect, it } from 'vitest';

import { segmentP95s } from './perf-report';
import { createPhaseRecorder, perfSegmentIds, splitRun } from './perf-segments';

/** A clock the test moves by hand. */
function fakeClock() {
  let time = 0;
  return {
    now: () => time,
    advance: (ms: number) => {
      time += ms;
    },
  };
}

describe('the segments of an edit (QA-07)', () => {
  it('T-1177 · QA-07: a timed part leaves out the parts inside it', () => {
    const clock = fakeClock();
    const recorder = createPhaseRecorder(clock.now);
    recorder.time('command', () => {
      clock.advance(2);
      recorder.time('layout', () => {
        clock.advance(5);
      });
      recorder.time('notify', () => {
        clock.advance(1);
        recorder.time('dom', () => {
          clock.advance(3);
        });
      });
      clock.advance(1);
    });
    expect(recorder.totals()).toEqual({ command: 3, layout: 5, notify: 1, dom: 3 });
    // A part that throws is still timed, and the error goes on.
    expect(() =>
      recorder.time('check', () => {
        clock.advance(4);
        throw new Error('broken');
      }),
    ).toThrow('broken');
    expect(recorder.totals().check).toBe(4);
    recorder.reset();
    expect(recorder.totals()).toEqual({});
  });

  it('T-1178 · QA-07: the segments add up to the whole time; the key and the browser get what is left', () => {
    const segments = splitRun({
      sync: 20,
      total: 50,
      syncParts: { command: 3, check: 2, layout: 6, scene: 2, svg: 3, notify: 1 },
      allParts: { command: 3, check: 2, layout: 6, scene: 2, svg: 3, notify: 1, dom: 8 },
    });
    expect(segments).toEqual({
      input: 3,
      command: 3,
      check: 2,
      layout: 6,
      draw: 5,
      notify: 1,
      dom: 8,
      paint: 22,
    });
    const sum = perfSegmentIds.reduce((total, id) => total + segments[id], 0);
    expect(sum).toBe(50);
    // A part the list does not know is left in what is left; nothing goes below zero.
    expect(
      splitRun({
        sync: 1,
        total: 2,
        syncParts: { other: 5, command: 3 },
        allParts: { command: 3 },
      }),
    ).toMatchObject({ input: 0, command: 3, paint: 1 });
  });

  it('T-1179 · QA-07: each segment has its own p95 over the runs', () => {
    const run = (layout: number) => ({
      input: 1,
      command: 1,
      check: 1,
      layout,
      draw: 1,
      notify: 1,
      dom: 1,
      paint: 1,
    });
    const runs = Array.from({ length: 20 }, (_, index) => run(index + 1));
    expect(segmentP95s(runs)).toMatchObject({ layout: 19, input: 1 });
    expect(segmentP95s([]).layout).toBe(0);
  });
});
