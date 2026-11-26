// @vitest-environment happy-dom
// The document layer (03-editor 1.2, QA-07): a new rendering changes only the elements that differ.
import type { Block, Content, RenderedSvg } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import { branch, contentOf, ifBlock, proc, testEngine, whileBlock } from '../engine-test-support';
import { snapCrispElements, snapCrispStrokes } from './crisp-lines';
import { DocumentLayer, drawingMarkup, elementKey, pairLines } from './document-layer';

function svgOf(content: Content): RenderedSvg {
  return testEngine(content).session.rendering.svg;
}

/** A layer as it is when the whole markup of `svg` is parsed. */
function wholeMarkup(svg: RenderedSvg, scale = 1): string {
  const container = document.createElement('div');
  container.innerHTML = drawingMarkup(svg);
  snapCrispStrokes(container, scale);
  return container.innerHTML;
}

function layer(): { readonly container: HTMLDivElement; readonly layer: DocumentLayer } {
  const container = document.createElement('div');
  return { container, layer: new DocumentLayer(container) };
}

/** A rendering from element lines, as `toSvg` writes them. */
function svgOfLines(lines: ReadonlyArray<string>, height = 100): RenderedSvg {
  return {
    width: 200,
    height,
    viewBox: `0 0 200 ${String(height)}`,
    paper: '#ffffff',
    content: ['<g class="ans-render" transform="translate(.5 .5)">', ...lines, '</g>'].join('\n'),
  };
}

const steps = (count: number, from = 0): Block[] =>
  Array.from({ length: count }, (_, index) => proc(`s${String(from + index)}`));

describe('elementKey', () => {
  it('T-1516: takes the numbers out of the start tag only, so a moved element keeps its key', () => {
    const at = (y: number, text: string) =>
      `<text x="10" y="${String(y)}" font-size="13" fill="#1f2937" xml:space="preserve">${text}</text>`;
    expect(elementKey(at(20, 'step 1'))).toBe(elementKey(at(48, 'step 1')));
    expect(elementKey(at(20, 'step 1'))).not.toBe(elementKey(at(20, 'step 2')));
    expect(elementKey('<rect x="0" y="4" width="10" height="2"/>')).toBe(
      elementKey('<rect x="0" y="40" width="10" height="20"/>'),
    );
    expect(elementKey('<rect x="0"/>')).not.toBe(elementKey('<path d="M0 0"/>'));
  });
});

describe('pairLines', () => {
  it('T-1517: pairs the lines before and after an inserted one, and a moved tail by its keys', () => {
    const before = ['<a y="1">a</a>', '<a y="2">b</a>', '<a y="3">c</a>'];
    const after = ['<a y="1">a</a>', '<a y="2">new</a>', '<a y="3">b</a>', '<a y="4">c</a>'];
    const keys = before.map(elementKey);
    expect(pairLines(before, keys, after, (index) => elementKey(after[index] ?? ''))).toEqual({
      prefix: 1,
      suffix: 2,
    });
    // Nothing is paired twice when every key is the same.
    const same = ['<r y="1"/>', '<r y="2"/>'];
    const more = ['<r y="1"/>', '<r y="2"/>', '<r y="3"/>'];
    expect(
      pairLines(same, same.map(elementKey), more, (index) => elementKey(more[index] ?? '')),
    ).toEqual({
      prefix: 2,
      suffix: 0,
    });
  });
});

describe('DocumentLayer', () => {
  it('T-1518: draws the whole layer first, and again for content it cannot pair', () => {
    const { container, layer: drawn } = layer();
    const first = svgOf(contentOf(steps(3)));
    expect(drawn.draw(first)).toBeNull();
    expect(container.innerHTML).toBe(wholeMarkup(first, Number.NaN));
    const odd: RenderedSvg = { ...first, content: '<g class="ans-render">two\nlines</g>' };
    expect(drawn.draw(odd)).toBeNull();
    expect(container.innerHTML).toBe(wholeMarkup(odd, Number.NaN));
    expect(drawn.draw(first)).toBeNull();
    expect(container.innerHTML).toBe(wholeMarkup(first, Number.NaN));
  });

  it('T-1519: ends each edit with the DOM that parsing the whole markup gives', () => {
    const empty = contentOf([]);
    const contents: Content[] = [
      contentOf(steps(6)),
      // Insert, at the start, in the middle and at the end.
      contentOf([proc('n0'), ...steps(6)]),
      contentOf([proc('n0'), ...steps(3), proc('n1'), ...steps(3, 3)]),
      contentOf([proc('n0'), ...steps(3), proc('n1'), ...steps(3, 3), proc('n2')]),
      // Wrap in If and in a loop, then a longer text that takes two lines.
      contentOf([
        proc('n0'),
        ifBlock('if', branch('yes', steps(3)), branch('no', [proc('n1')])),
        ...steps(3, 3),
      ]),
      contentOf([
        whileBlock('loop', [proc('n0')]),
        ifBlock('if', branch('yes', steps(3)), branch('no', [proc('n1')])),
        ...steps(3, 3),
      ]),
      contentOf([proc('n0', 'a longer text\nthat takes two lines'), ...steps(6)]),
      // Move and delete.
      contentOf([...steps(2), proc('n0'), ...steps(4, 2)]),
      contentOf(steps(1)),
      empty,
      contentOf(steps(6)),
    ];
    const { container, layer: drawn } = layer();
    const nodes = (): Element[] => [...container.querySelectorAll('g.ans-render > *')];
    for (const [at, content] of contents.entries()) {
      const svg = svgOf(content);
      const before = nodes();
      const changed = drawn.draw(svg);
      // Only the first drawing is whole; after it most elements stay the same nodes.
      expect(changed === null).toBe(at === 0);
      // An empty diagram (and the one after it) shares no element with the one before.
      if (at > 0 && contents[at] !== empty && contents[at - 1] !== empty) {
        expect(nodes().filter((node) => before.includes(node)).length).toBeGreaterThan(0);
      }
      if (changed === null) {
        snapCrispStrokes(container, 1.25);
      } else {
        snapCrispElements(changed, 1.25);
      }
      expect(container.innerHTML).toBe(wholeMarkup(svg, 1.25));
    }
  });

  it('T-1520: keeps the elements that stay or only move, and returns the ones it added or changed', () => {
    const { container, layer: drawn } = layer();
    const lines = ['<rect y="0" fill="#fff"/>', '<text y="10">a</text>', '<text y="20">b</text>'];
    drawn.draw(svgOfLines(lines));
    const before = [...container.querySelectorAll('g rect, g text')];
    const after = [
      '<rect y="0" fill="#fff"/>',
      '<text y="10">a</text>',
      '<text y="20">new</text>',
      '<text y="30">b</text>',
    ];
    const changed = drawn.draw(svgOfLines(after, 120));
    const now = [...container.querySelectorAll('g rect, g text')];
    expect(now[0]).toBe(before[0]);
    expect(now[1]).toBe(before[1]);
    // "b" moved down: the same element with its new place.
    expect(now[3]).toBe(before[2]);
    expect(now[3]?.getAttribute('y')).toBe('30');
    expect(new Set(changed)).toEqual(new Set([now[2], now[3]]));
    expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 200 120');
    // The same content again changes nothing.
    expect(drawn.draw(svgOfLines(after, 120))).toEqual([]);
  });

  it('T-1521: gives a moved line a fresh snapped width, and replaces an element whose attributes differ', () => {
    const { container, layer: drawn } = layer();
    drawn.draw(
      svgOfLines([
        '<rect y="0" stroke-width="1" shape-rendering="crispEdges"/>',
        '<text y="10">a</text>',
      ]),
    );
    snapCrispStrokes(container, 1.5);
    const rect = container.querySelector('g rect');
    expect(rect?.getAttribute('style')).toContain('stroke-width');
    const text = container.querySelector('text');
    const next = svgOfLines([
      '<rect y="5" stroke-width="2" shape-rendering="crispEdges"/>',
      '<text y="10" text-anchor="middle">a</text>',
      '<path d="M0 0 L5 5" fill="none" stroke-width="1"/>',
    ]);
    const changed = drawn.draw(next) ?? [];
    expect(changed[0]).toBe(rect);
    snapCrispElements(changed, 1.5);
    // 2 units are 3 whole pixels at 1.5: the old snapped width is gone.
    expect(rect?.hasAttribute('style')).toBe(false);
    expect(container.innerHTML).toBe(wholeMarkup(next, 1.5));
    expect(changed[1]).not.toBe(text);
    expect(container.querySelector('text')?.getAttribute('text-anchor')).toBe('middle');
  });
});
