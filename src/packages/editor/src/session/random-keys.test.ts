import { checkInvariants } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import { branch, contentOf, ifBlock, proc, testEngine, whileBlock } from '../engine-test-support';

/** A small seeded random number generator, so a failure always replays the same way. */
function random(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

// The keys to press; `Shift+Arrow…` and `Alt+…` as in the key table.
const strokes = (
  'h j k l j k Shift+ArrowDown Shift+ArrowUp { } o O a A i k w f d s x y p P u U ' +
  'Alt+h Alt+j Alt+k Alt+l v Escape g G Enter L c'
).split(' ');

describe('random keys (QA-01)', () => {
  for (const seed of [1, 2, 3]) {
    it(`QA-01: 400 random keys keep the invariants and undo all the way back (seed ${String(seed)})`, async () => {
      const start = contentOf([
        proc('b1'),
        ifBlock('b2', branch('r1', [proc('b3')]), branch('r2', [whileBlock('b4', [proc('b5')])])),
      ]);
      const engine = testEngine(start);
      const next = random(seed);
      for (let i = 0; i < 400; i += 1) {
        if (engine.session.state.editing !== null) {
          engine.session.commitEditing(next() < 0.5 ? '' : `t${String(i)}`);
        }
        const stroke = strokes[Math.floor(next() * strokes.length)] ?? 'j';
        engine.keys(stroke);
        engine.session.chrome().question?.choices[next() < 0.5 ? 0 : 1]?.choose();
        if (i % 25 === 0) {
          await engine.settle();
        }
        expect(checkInvariants(engine.content())).toEqual([]);
      }
      await engine.settle();
      engine.session.commitEditing('');
      while (engine.session.state.undo.length > 0) {
        engine.session.history('undo');
      }
      expect(engine.content()).toEqual(start);
      expect(engine.logs).toEqual([]);
    });
  }
});
