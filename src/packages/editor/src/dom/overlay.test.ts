import { describe, expect, it } from 'vitest';

import { contentOf, proc, testEngine } from '../engine-test-support';
import { selectBlock } from '../state/selection';
import { overlayContent } from './overlay';

describe('overlayContent', () => {
  it('BUG-07: the selection outline covers the block lines equally on all four sides', () => {
    const engine = testEngine(contentOf([proc('b1')]));
    const { session } = engine;
    session.select(selectBlock(session.index(), 'b1'));
    const { layout } = session.state;
    const box = layout.boxes.get('b1');
    if (box === undefined) {
      throw new Error('no box');
    }
    const svg = overlayContent({
      layout,
      index: session.index(),
      selection: session.state.selection,
      hover: null,
      drop: null,
      dragged: [],
      paper: '#fff',
    });
    const rect = /<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/.exec(svg);
    expect(rect).not.toBeNull();
    const [x, y, width, height] = (rect ?? []).slice(1).map(Number) as [
      number,
      number,
      number,
      number,
    ];
    // The document is drawn half a pixel shifted: its lines fill box.x .. box.x + width + 1.
    const left = x - box.x;
    const right = box.x + box.width + 1 - (x + width);
    const top = y - box.y;
    const bottom = box.y + box.height + 1 - (y + height);
    expect(right).toBe(left);
    expect(bottom).toBe(top);
  });
});
