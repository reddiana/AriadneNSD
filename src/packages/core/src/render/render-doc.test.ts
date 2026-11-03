import { describe, expect, it } from 'vitest';

import type { Doc, TextKind } from '../model/types';
import { textKinds } from '../text/syntax';
import { renderDoc } from './render-doc';
import type { RenderedSvg } from './to-svg';
import { formatNumber } from './to-svg';
import {
  arm,
  branch,
  caseBlock,
  docOf,
  doWhileBlock,
  forBlock,
  ifBlock,
  largeDoc,
  process,
  whileBlock,
  inLocale,
} from './testing';

/** A standalone SVG for the golden files, so GitHub shows them as pictures (07-testing 3). */
function standalone(svg: RenderedSvg): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${String(svg.width)}" height="${String(svg.height)}" viewBox="${svg.viewBox}">`,
    `<rect width="100%" height="100%" fill="${svg.paper}"/>`,
    svg.content,
    '</svg>',
    '',
  ].join('\n');
}

/** The sorting example of the prototype: every MVP block kind with Hangul and Latin text. */
const sample: Doc = docOf(
  process('b1', 'i ← 0\n합계 ← 0'),
  whileBlock('b2', 'i < n', [
    ifBlock(
      'b3',
      'a[i] > 0',
      branch('r4', [process('b5', '합계 ← 합계 + a[i]')]),
      branch('r6', [process('b7')]),
    ),
    process('b8', 'i ← i + 1'),
  ]),
  caseBlock(
    'b9',
    'mode',
    [arm('r10', '1', [process('b11', '출력(합계)')]), arm('r12', "'a'..'z'", [process('b13')])],
    branch('r14', [process('b15', 'error')]),
  ),
  doWhileBlock('b16', 'retry > 0', [process('b17', 'retry ← retry - 1')]),
  forBlock('b18', 'k ← 1 .. 10', [process('b19', 'print(k)')]),
);

describe('render', () => {
  it('T-0476 · R-FMT-03: the same model gives the same SVG text', () => {
    const first = renderDoc(inLocale(sample, 'ko')).svg.content;
    const second = renderDoc(inLocale(structuredClone(sample), 'ko')).svg.content;
    expect(second).toBe(first);
  });

  it('T-0477: 01-file-format 2: draws into one g.ans-render with the bundled font first', () => {
    const { svg } = renderDoc(sample);
    expect(svg.content.startsWith('<g class="ans-render" transform="translate(.5 .5)"')).toBe(true);
    expect(svg.content).toContain(`font-family="'AriadneNSD Mono', D2Coding,`);
    expect(svg.content).toContain('style="font-kerning:none"');
    expect(svg.content.endsWith('</g>')).toBe(true);
    expect(svg.viewBox).toBe(`0 0 ${String(svg.width)} ${String(svg.height)}`);
    expect(svg.paper).toBe('#ffffff');
  });

  it('T-0478: visual design 3.3: uses the default theme colors', () => {
    const { svg } = renderDoc(sample);
    expect(svg.content).toContain('fill="#edf0f5" stroke="#5b77ad"'); // block.process, line.structure
    expect(svg.content).toContain('fill="#f6ebdc"'); // block.branch
    expect(svg.content).toContain('fill="#dce6f6"'); // block.loop
    expect(svg.content).toContain('fill="#4b5567"'); // text.secondary (branch labels)
  });

  it('T-0479 · UX BH1: puts a header-colored halo behind the condition', () => {
    const { svg } = renderDoc(sample);
    expect(svg.content).toContain(
      'text-anchor="middle" font-size="13" fill="#151a22" stroke="#f6ebdc" stroke-width="6" stroke-linejoin="round" paint-order="stroke"',
    );
  });

  it('T-0480 · R-LAY-09: draws the ∅ of an empty branch as a shape, not a character', () => {
    const { svg, scene } = renderDoc(sample);
    expect(svg.content).not.toContain('∅');
    const marks = scene.elements.filter((element) => element.kind === 'circle');
    // The empty false branch of b3 and the empty arm of b9.
    expect(marks.map((mark) => mark.blockId)).toEqual(['b7', 'b13']);
  });

  it('T-0481 · UX CD1: draws the empty default cell of a Case without a default', () => {
    const { scene } = renderDoc(
      docOf(caseBlock('b1', 'k', [arm('r2', '1', [process('b3')])], null)),
    );
    const circles = scene.elements.filter((element) => element.kind === 'circle');
    expect(circles.map((circle) => circle.blockId)).toEqual(['b3', 'b1']);
  });

  it('T-0482 · R-NFR-04: writes the fixed words in the given locale', () => {
    const doc = docOf(
      ifBlock('b1', 'c', branch('r2', [process('b3')]), branch('r4', [process('b5')])),
    );
    expect(renderDoc(inLocale(doc, 'ko')).svg.content).toContain('>참</text>');
    expect(renderDoc(inLocale(doc, 'ko')).svg.content).toContain('>거짓</text>');
    expect(renderDoc(doc).svg.content).toContain('>true</text>');
  });

  it('T-0483: escapes XML characters and keeps spaces', () => {
    const { svg } = renderDoc(docOf(process('b1', '  a < b && c > "d"')));
    expect(svg.content).toContain('xml:space="preserve">  a &lt; b &amp;&amp; c &gt; "d"</text>');
  });

  it('T-0484: every element of the scene names its block (ADR-0030)', () => {
    const { scene } = renderDoc(sample);
    const ids = new Set(scene.elements.map((element) => element.blockId));
    expect([...ids].every((id) => id.startsWith('b'))).toBe(true);
  });

  it('T-0485 · R-FMT-07: lists the used code points, fixed words included', () => {
    const doc = docOf(
      ifBlock('b1', 'a<b', branch('r2', [process('b3', '값')]), branch('r4', [process('b5')])),
    );
    const codePoints = renderDoc(inLocale(doc, 'ko')).codePoints;
    // '<' 'a' 'b', then 값 거 참 짓 in code point order.
    expect(codePoints).toEqual(
      [0x3c, 0x61, 0x62, 0xac12, 0xac70, 0xcc38, 0xc9d3].sort((a, b) => a - b),
    );
  });

  it('T-0486: formats numbers with at most two decimals and no -0', () => {
    expect(formatNumber(104)).toBe('104');
    expect(formatNumber(80.5)).toBe('80.5');
    expect(formatNumber(1 / 3)).toBe('0.33');
    expect(formatNumber(-0.001)).toBe('0');
  });

  it('T-0487 · QA-07: lays out and renders 500 blocks well inside the 100ms budget', () => {
    const doc = largeDoc(500);
    let best = Number.POSITIVE_INFINITY;
    for (let run = 0; run < 5; run += 1) {
      const start = performance.now();
      renderDoc(doc);
      best = Math.min(best, performance.now() - start);
    }
    // 02-layout 4 measured about 1ms in a browser; this leaves room for slow CI machines.
    expect(best).toBeLessThan(50);
  });
});

describe('render: headers (visual design principle 2)', () => {
  const withHead = (headStyle: 'shape' | 'title', kind: 'event' | 'method'): Doc => ({
    ...docOf(process('b1', 'x')),
    content: {
      settings: { textKind: 'plain', theme: 'default', headStyle, locale: 'en' },
      diagrams: [
        {
          id: 'd1',
          head: { kind, text: 'tick' },
          body: { blocks: [process('b1', 'x')], folds: [] },
        },
      ],
    },
  });

  it('T-0488: draws the Event hat as a closed curve in block.event', () => {
    const { scene, svg } = renderDoc(withHead('shape', 'event'));
    const path = scene.elements.find((element) => element.kind === 'path');
    expect(path).toMatchObject({ blockId: 'd1', fill: '#e2efdf' });
    expect(svg.content).toMatch(/<path d="M24 40 C46 22 /);
    expect(svg.content).toContain('>tick</text>');
  });

  it('T-0489: draws the Method arch across the width in block.call', () => {
    const { scene } = renderDoc(withHead('shape', 'method'));
    const path = scene.elements.find((element) => element.kind === 'path');
    expect(path).toMatchObject({ blockId: 'd1', fill: '#ebe7f4' });
  });

  it('T-0490: draws a header like a title: a muted label, a bold name and a rule, no fill', () => {
    const { scene, svg } = renderDoc(withHead('title', 'method'));
    expect(scene.elements.some((element) => element.kind === 'path')).toBe(false);
    expect(svg.content).toContain('fill="#5a6476" xml:space="preserve">Method</text>');
    expect(svg.content).toContain('<tspan font-weight="600">tick</tspan>');
  });
});

/** A document with its block text in a language (R-LAY-06). */
const inTextKind = (doc: Doc, textKind: TextKind): Doc => ({
  ...doc,
  content: { ...doc.content, settings: { ...doc.content.settings, textKind } },
});

/** A C fragment with every token kind, a comment over two lines and a C keyword in a condition. */
const cCode: Doc = docOf(
  process('b1', 'int n = 0; // count\nchar *s = "hi";'),
  whileBlock('b2', 'n < 10 && s != NULL', [process('b3', '/* step\n   on */ n++;')]),
  ifBlock(
    'b4',
    "c == 'x'",
    branch('r5', [process('b6', 'return 1;')]),
    branch('r7', [process('b8')]),
  ),
);

describe('render: syntax highlighting (R-LAY-07)', () => {
  it('T-0867: colors keywords, comments, strings and numbers with the syntax tokens', () => {
    const { svg } = renderDoc(inTextKind(cCode, 'c'));
    expect(svg.content).toContain(
      'xml:space="preserve"><tspan fill="#1f45d6">int</tspan> n = <tspan fill="#8a5a00">0</tspan>; <tspan fill="#22702a">// count</tspan></text>',
    );
    expect(svg.content).toContain('<tspan fill="#8a5a00">"hi"</tspan>');
    expect(svg.content).toContain('<tspan fill="#1f45d6">return</tspan>');
    // The condition keeps its halo; the character literal is colored.
    expect(svg.content).toContain(`<tspan fill="#8a5a00">'x'</tspan>`);
  });

  it('T-0868: colors a block comment on every line it spans', () => {
    const { svg } = renderDoc(inTextKind(cCode, 'c'));
    expect(svg.content).toContain('><tspan fill="#22702a">/* step</tspan></text>');
    expect(svg.content).toContain('><tspan fill="#22702a">   on */</tspan> n++;</text>');
  });

  it('T-0869: plain text is drawn in one color, as before', () => {
    const { svg } = renderDoc(cCode);
    expect(svg.content).not.toContain('<tspan');
  });

  it('T-0870: changing the language changes colors only, never the layout (ADR-0042)', () => {
    const plain = renderDoc(cCode);
    for (const kind of textKinds) {
      const other = renderDoc(inTextKind(cCode, kind));
      expect(other.layout).toEqual(plain.layout);
      expect(other.codePoints).toEqual(plain.codePoints);
    }
  });

  it('T-0871: does not highlight the header, branch labels or calls', () => {
    const doc: Doc = {
      ...docOf(process('b1', 'x')),
      content: {
        settings: { textKind: 'c', theme: 'default', headStyle: 'shape', locale: 'en' },
        diagrams: [
          {
            id: 'd1',
            head: { kind: 'method', text: 'int max(int a)' },
            body: {
              blocks: [
                caseBlock('b2', 'k', [arm('r3', '1', [process('b4', 'x')])], null),
                {
                  id: 'b5',
                  kind: 'call',
                  target: { kind: 'local', diagram: 'd1' },
                  args: '0',
                  result: '',
                  siteFolds: [],
                },
              ],
              folds: [],
            },
          },
        ],
      },
    };
    expect(renderDoc(doc).svg.content).not.toContain('<tspan fill');
  });
});

describe('render: golden files (07-testing 3)', () => {
  const cases: ReadonlyArray<readonly [string, Doc]> = [
    [
      'process',
      docOf(process('b1', 'n ← 0'), process('b2', '여러 줄의\n처리 블록'), process('b3')),
    ],
    [
      'if',
      docOf(
        ifBlock(
          'b1',
          'n > 0',
          branch('r2', [process('b3', 'sign ← 1'), process('b4', 'count ← count + 1')]),
          branch('r5', [process('b6')]),
        ),
      ),
    ],
    [
      'if-long-condition',
      docOf(
        ifBlock(
          'b1',
          'a[j] <= pivot && j < hi',
          branch('r2', [process('b3', 'swap(a, i, j)')]),
          branch('r4', [process('b5')]),
        ),
      ),
    ],
    [
      'case',
      docOf(
        caseBlock(
          'b1',
          'key',
          [
            arm('r2', '1', [process('b3', 'start()')]),
            arm('r4', '2', [process('b5', 'stop()')]),
            arm('r6', '3', [process('b7')]),
          ],
          branch('r8', [process('b9', 'error ← 1')]),
        ),
      ),
    ],
    [
      'case-without-default',
      docOf(
        caseBlock(
          'b1',
          'key',
          [arm('r2', '1', [process('b3', 'run()')]), arm('r4', '2', [process('b5')])],
          null,
        ),
      ),
    ],
    [
      'case-only-default',
      docOf(caseBlock('b1', 'key', [], branch('r2', [process('b3', 'run()')]))),
    ],
    [
      'loops',
      docOf(
        whileBlock('b1', 'i < n', [process('b2', 'i ← i + 1')]),
        doWhileBlock('b3', 'retry > 0', [process('b4', 'retry ← retry - 1')]),
        forBlock('b5', 'k ← 1 .. 10', [process('b6', 'print(k)')]),
      ),
    ],
    ['sample', sample],
    ['syntax-c', inTextKind(cCode, 'c')],
  ];

  for (const [name, doc] of cases) {
    it(`T-0491 · R-FMT-03: ${name} matches its golden SVG`, async () => {
      const svg = standalone(renderDoc(inLocale(doc, 'ko')).svg);
      await expect(svg).toMatchFileSnapshot(`../../golden/render/${name}.svg`);
    });
  }
});
