// The performance budget of 02-layout 4: layout + scene + SVG text for 500 blocks.
// Not part of `pnpm test` (benchmarks run in their own Vitest project). Run with:
//   pnpm --filter @ariadne-nsd/core exec vitest bench --run
import { describe, expect, it } from 'vitest';

import { layout } from '../layout/layout';
import { buildScene } from './build-scene';
import { largeDoc } from './testing';
import { defaultTheme } from './theme';
import { toSvg } from './to-svg';

const options = { locale: 'en' } as const;

describe('02-layout 4: 500 blocks', () => {
  const doc = largeDoc(500);
  const result = layout(doc, options);

  it('T-0517 · QA-07: layout and scene + SVG text stay far inside the 100ms edit budget', async ({
    bench,
  }) => {
    const layoutResult = await bench('T-0518: layout', () => {
      layout(doc, options);
    }).run();
    const renderResult = await bench('T-0519: scene + SVG text', () => {
      toSvg(buildScene(result, defaultTheme));
    }).run();
    console.log(
      `layout p50 ${layoutResult.latency.p50.toFixed(3)}ms, scene + SVG p50 ${renderResult.latency.p50.toFixed(3)}ms`,
    );
    // The browser spike measured 0.2–0.4ms each (02-layout 4). Under Vitest's module runner it is
    // about 0.5ms and 1.2ms; 20ms leaves room for slow machines and is a fifth of the budget.
    expect(layoutResult.latency.p99).toBeLessThan(20);
    expect(renderResult.latency.p99).toBeLessThan(20);
  });
});
