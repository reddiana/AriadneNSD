// The performance budget of 02-layout 4: layout + scene + SVG text for 500 blocks, and opening a
// saved file of 500 blocks up to its drawing.
// Not part of `pnpm test` (benchmarks run in their own Vitest project). Run with:
//   pnpm --filter @ariadne-nsd/core exec vitest bench --run
import { describe, expect, it } from 'vitest';

import { assembleSvgFile, openSvgFile } from '../format/svg-file';
import { layout } from '../layout/layout';
import { buildScene } from './build-scene';
import { renderDoc } from './render-doc';
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

describe('opening a file of 500 blocks', () => {
  const doc = largeDoc(500);
  // A saved file as the editor writes it. The opener skips the drawing and the font (R-FMT-05)
  // but still reads past them, so the font is a block of about the size of a real subset WOFF.
  const saved = assembleSvgFile({
    doc,
    drawing: toSvg(buildScene(layout(doc, options), defaultTheme)),
    fonts: [{ family: 'AriadneNSD Mono', woff: new Uint8Array(100_000).fill(0x41) }],
  });

  it('T-0540 · QA-08 · R-NFR-03: open, check, layout and draw stay far inside the 1s budget', async ({
    bench,
  }) => {
    const result = await bench('T-0541: open + layout + scene + SVG text', () => {
      const opened = openSvgFile(saved);
      if (!opened.ok) {
        throw new Error(opened.detail);
      }
      renderDoc(opened.value.doc, options);
    }).run();
    console.log(
      `file ${String(Math.round(saved.length / 1024))} KB, open to drawing p50 ${result.latency.p50.toFixed(3)}ms`,
    );
    // The budget is 1s on the reference device (QA-07), and the browser still draws after this.
    // 100ms here leaves room for slow machines and for the DOM work this does not count.
    expect(result.latency.p99).toBeLessThan(100);
  });
});
