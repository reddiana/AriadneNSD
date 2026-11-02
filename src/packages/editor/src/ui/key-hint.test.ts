import { describe, expect, it } from 'vitest';

import { keyHintPlace } from './key-hint';

const view = { width: 1000, height: 700 };
const size = { width: 160, height: 150 };

describe('UX K3: the key hint goes just under the selection', () => {
  it('sits under the selection, at its left end', () => {
    expect(keyHintPlace({ x: 60, y: 240 }, 210, size, view)).toEqual({ left: 60, top: 244 });
  });

  it('goes above the selection when it would stick out at the bottom', () => {
    expect(keyHintPlace({ x: 60, y: 640 }, 610, size, view)).toEqual({ left: 60, top: 456 });
  });

  it('stays under when there is no room above either, kept inside the window', () => {
    const small = { width: 1000, height: 200 };
    expect(keyHintPlace({ x: 60, y: 120 }, 90, size, small)).toEqual({ left: 60, top: 46 });
  });

  it('moves left to stay inside the window at the right edge', () => {
    expect(keyHintPlace({ x: 950, y: 240 }, 210, size, view)).toEqual({ left: 836, top: 244 });
  });
});
