import type { Block, Box, ColorToken, Content, LayoutResult } from '@ariadne-nsd/core';
import { geometry, themes } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import {
  arm,
  branch,
  caseBlock,
  contentOf,
  ifBlock,
  proc,
  seq,
  testEngine,
} from '../engine-test-support';
import type { DocIndex } from '../model/doc-index';
import { selectBlock, selectRange } from '../state/selection';
import type { OverlayInput } from './overlay';
import {
  editColors,
  editColorsFor,
  editColorsOnDark,
  fieldBox,
  overlayContent,
  selectionBox,
} from './overlay';

describe('overlayContent', () => {
  it('T-0229 · BUG-07: the selection outline covers the block lines equally on all four sides', () => {
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

/** A content whose diagrams are Events with headers drawn as `headStyle`. */
function withHead(headStyle: 'title' | 'shape', blocks: ReadonlyArray<Block>): Content {
  const base = contentOf(blocks);
  return {
    settings: { ...base.settings, headStyle },
    diagrams: base.diagrams.map((d) => ({ ...d, head: { kind: 'event', text: 'click' } })),
  };
}

function overlayOf(
  content: Content,
  input: Partial<Omit<OverlayInput, 'layout' | 'index'>> = {},
): { svg: string; layout: LayoutResult; index: DocIndex } {
  const { session } = testEngine(content);
  const { layout } = session.state;
  const index = session.index();
  const svg = overlayContent({
    layout,
    index,
    selection: null,
    hover: null,
    drop: null,
    dragged: [],
    paper: '#fff',
    ...input,
  });
  return { svg, layout, index };
}

function boxOf(layout: LayoutResult, id: string): Box {
  const box = layout.boxes.get(id);
  if (box === undefined) throw new Error(`no box ${id}`);
  return box;
}

describe('overlayContent: what the edit layer draws', () => {
  it('T-0648: draws nothing when nothing is selected, hovered, dropped or dragged', () => {
    expect(overlayOf(contentOf([proc('b1')])).svg).toBe('');
  });

  it('T-0649: a hovered block gets a 1px outline 1px inside its edge', () => {
    const { svg, layout } = overlayOf(contentOf([proc('b1'), proc('b2')]), { hover: 'b2' });
    const box = boxOf(layout, 'b2');
    expect(svg).toBe(
      `<rect x="${String(box.x + 1.5)}" y="${String(box.y + 1.5)}" width="${String(box.width - 2)}" height="${String(box.height - 2)}" fill="none" stroke="${editColors['edit.hover']}" stroke-width="1"/>`,
    );
  });

  it('T-0650: the hover is not drawn on a selected block, nor while a drop place is shown', () => {
    const content = contentOf([proc('b1'), proc('b2')]);
    const { index, layout } = overlayOf(content);
    const selected = overlayOf(content, { hover: 'b1', selection: selectBlock(index, 'b1') }).svg;
    expect(selected.match(/<rect/g)).toHaveLength(1);
    expect(selected).toContain('stroke-width="3"');
    const dropping = overlayOf(content, {
      hover: 'b2',
      drop: {
        action: { kind: 'insert', to: 'b1', side: 'after', blockKind: 'if' },
        mark: { kind: 'outline', box: boxOf(layout, 'b1') },
        wraps: null,
      },
    }).svg;
    expect(dropping).not.toContain('stroke-width="1"');
  });

  it('T-0651: dragged blocks are faded in place with the paper color', () => {
    const { svg, layout } = overlayOf(contentOf([proc('b1'), proc('b2')]), {
      dragged: ['b1', 'gone'],
      paper: '#123456',
    });
    const box = boxOf(layout, 'b1');
    expect(svg).toBe(
      `<rect x="${String(box.x)}" y="${String(box.y)}" width="${String(box.width)}" height="${String(box.height)}" fill="#123456" fill-opacity="0.6"/>`,
    );
  });

  it('T-0652: a drop between blocks is a 2px line with a tick at each end', () => {
    const { svg } = overlayOf(contentOf([proc('b1')]), {
      drop: {
        action: { kind: 'insert', to: 'b1', side: 'after', blockKind: 'if' },
        mark: { kind: 'line', x: 10, y: 20, width: 100 },
        wraps: null,
      },
    });
    expect(svg).toBe(
      [
        '<line x1="10" y1="20" x2="110" y2="20" stroke="#d0500b" stroke-width="2"/>',
        '<line x1="11" y1="16" x2="11" y2="24" stroke="#d0500b" stroke-width="2"/>',
        '<line x1="109" y1="16" x2="109" y2="24" stroke="#d0500b" stroke-width="2"/>',
      ].join(''),
    );
  });

  it('T-0653: a drop on a block is a 2px outline 1px inside it', () => {
    const { svg } = overlayOf(contentOf([proc('b1')]), {
      drop: {
        action: {
          kind: 'wrap',
          target: { kind: 'blocks', first: 'b1', last: 'b1' },
          blockKind: 'if',
        },
        mark: { kind: 'outline', box: { x: 10, y: 20, width: 100, height: 40 } },
        wraps: 'if',
      },
    });
    expect(svg).toBe(
      '<rect x="12" y="22" width="97" height="37" fill="none" stroke="#d0500b" stroke-width="2"/>',
    );
  });
});

describe('selectionBox', () => {
  it('T-0654: a range of blocks is outlined as one box around all of them', () => {
    const { layout, index } = overlayOf(contentOf([proc('b1'), proc('b2'), proc('b3')]));
    const first = boxOf(layout, 'b1');
    const last = boxOf(layout, 'b2');
    expect(selectionBox(layout, index, selectRange(index, 'b1', 'b2'))).toEqual({
      x: first.x,
      y: first.y,
      width: first.width,
      height: last.y + last.height - first.y,
    });
  });

  it('T-0655: a branch label and the missing default are outlined by their hit regions', () => {
    const content = contentOf([
      ifBlock('i1', branch('y', [proc('p1')]), branch('n', [proc('p2')])),
      caseBlock('c1', [arm('a1', '1', [proc('p3')])], null),
    ]);
    const { layout, index } = overlayOf(content);
    const label = layout.regions.find((r) => r.kind === 'branchLabel' && r.branchId === 'y');
    const missing = layout.regions.find((r) => r.kind === 'missingDefault' && r.blockId === 'c1');
    expect(label).toBeDefined();
    expect(missing).toBeDefined();
    expect(selectionBox(layout, index, { kind: 'branchLabel', branch: 'y' })).toEqual(label?.box);
    expect(selectionBox(layout, index, { kind: 'missingDefault', block: 'c1' })).toEqual(
      missing?.box,
    );
    expect(selectionBox(layout, index, { kind: 'branchLabel', branch: 'nope' })).toBeNull();
    expect(selectionBox(layout, index, { kind: 'missingDefault', block: 'i1' })).toBeNull();
  });

  it('T-0656: a title header is outlined 4px outside it (not below); a shaped header on its box', () => {
    for (const style of ['title', 'shape'] as const) {
      const { layout, index } = overlayOf(withHead(style, [proc('b1')]));
      const node = layout.nodes.find((n) => n.kind === 'diagramHead');
      if (node?.kind !== 'diagramHead') throw new Error('no header');
      const box = selectionBox(layout, index, { kind: 'head', diagram: 'd1' });
      expect(box).toEqual(
        style === 'title'
          ? {
              x: node.box.x - 4,
              y: node.box.y - 4,
              width: node.box.width + 8,
              height: node.box.height + 4,
            }
          : node.box,
      );
    }
  });

  it('T-0657: a diagram without a header, a fold and no selection have no outline', () => {
    const { layout, index } = overlayOf(contentOf([proc('b1')]));
    expect(selectionBox(layout, index, { kind: 'head', diagram: 'd1' })).toBeNull();
    expect(selectionBox(layout, index, { kind: 'fold', fold: 'f1' })).toBeNull();
    expect(selectionBox(layout, index, null)).toBeNull();
  });
});

describe('fieldBox: where the inline editor opens', () => {
  const content = (headStyle: 'title' | 'shape' = 'title'): Content =>
    withHead(headStyle, [
      proc('p0'),
      ifBlock('i1', branch('y', [proc('p1')]), branch('n', [proc('p2')])),
      caseBlock('c1', [arm('a1', '1', [proc('p3')])], null),
    ]);

  it('T-0658: a process block covers its box; a control block covers only its header', () => {
    const { layout } = overlayOf(content());
    expect(fieldBox(layout, { kind: 'block', block: 'p0' })).toEqual(boxOf(layout, 'p0'));
    const node = layout.nodes.find((n) => n.kind === 'if' && n.id === 'i1');
    const head = node !== undefined && 'head' in node ? node.head : null;
    expect(head).not.toBeNull();
    expect(fieldBox(layout, { kind: 'block', block: 'i1' })).toEqual(head);
    expect(fieldBox(layout, { kind: 'block', block: 'nope' })).toBeNull();
  });

  it('T-0659: a branch label and the missing default use their hit regions', () => {
    const { layout } = overlayOf(content());
    const label = layout.regions.find((r) => r.kind === 'branchLabel' && r.branchId === 'n');
    const missing = layout.regions.find((r) => r.kind === 'missingDefault' && r.blockId === 'c1');
    expect(fieldBox(layout, { kind: 'branchLabel', branch: 'n' })).toEqual(label?.box);
    expect(fieldBox(layout, { kind: 'missingDefault', block: 'c1' })).toEqual(missing?.box);
    expect(fieldBox(layout, { kind: 'branchLabel', branch: 'nope' })).toBeNull();
    expect(fieldBox(layout, { kind: 'missingDefault', block: 'nope' })).toBeNull();
  });

  it("T-0660: a title header's name line sits under its label; a shaped header's under the hat", () => {
    const g = geometry;
    for (const style of ['title', 'shape'] as const) {
      const { layout } = overlayOf(content(style));
      const node = layout.nodes.find((n) => n.kind === 'diagramHead');
      if (node?.kind !== 'diagramHead') throw new Error('no header');
      const box = fieldBox(layout, { kind: 'head', diagram: 'd1' });
      expect(box).toEqual(
        style === 'title'
          ? {
              x: node.box.x - g['space.pad-x'],
              y: node.box.y + g['size.title-tag'] - g['space.pad-y'],
              width: node.box.width + g['space.pad-x'],
              height:
                node.box.height - g['size.title-tag'] - g['size.title-gap'] + 2 * g['space.pad-y'],
            }
          : { ...node.box, y: node.box.y + g['size.hat'], height: node.box.height - g['size.hat'] },
      );
    }
    const headless = overlayOf(contentOf([proc('b1')])).layout;
    expect(fieldBox(headless, { kind: 'head', diagram: 'd1' })).toBeNull();
  });

  it("T-0661: a call block's fields cover the inside of its double bars", () => {
    const c: Content = {
      settings: { textKind: 'plain', theme: 'default', headStyle: 'shape', locale: 'en' },
      diagrams: [
        {
          id: 'd1',
          head: { kind: 'event', text: 'a' },
          body: {
            blocks: [
              {
                id: 'k1',
                kind: 'call',
                target: { kind: 'local', diagram: 'd2' },
                args: 'x',
                result: '',
                siteFolds: [],
              },
            ],
            folds: [],
          },
        },
        { id: 'd2', head: { kind: 'method', text: 'm(x)' }, body: seq([proc('b2')]) },
      ],
    };
    const { layout } = overlayOf(c);
    const box = boxOf(layout, 'k1');
    const bar = geometry['size.call-bar'];
    expect(fieldBox(layout, { kind: 'call', block: 'k1', part: 'args' })).toEqual({
      ...box,
      x: box.x + bar,
      width: box.width - 2 * bar,
    });
    expect(fieldBox(layout, { kind: 'call', block: 'b2', part: 'args' })).toBeNull();
  });
});

/** WCAG 2.2 contrast ratio of two `#rrggbb` colors. */
function contrast(a: string, b: string): number {
  const luminance = (hex: string): number => {
    const channel = (offset: number): number => {
      const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  };
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

describe('edit colors on every theme (visual design 3.4, UX TH4)', () => {
  const backgrounds: ReadonlyArray<ColorToken> = [
    'paper',
    'block.process',
    'block.branch',
    'block.loop',
    'block.event',
    'block.call',
    'block.folded',
    'fold.band',
    'peek.band',
  ];

  it('picks the colors by the kind of paper', () => {
    expect(editColorsFor('light')).toBe(editColors);
    expect(editColorsFor('dark')).toBe(editColorsOnDark);
  });

  for (const theme of themes) {
    it(`${theme.id}: the selection, hover, drop and error marks have 3:1 on what they are drawn on`, () => {
      const colors = editColorsFor(theme.kind);
      for (const [token, value] of Object.entries(colors)) {
        for (const back of backgrounds) {
          expect(contrast(value, theme.colors[back]), `${token} on ${back}`).toBeGreaterThanOrEqual(
            3,
          );
        }
      }
    });
  }

  it('draws the selection and the hover in the colors it is given', () => {
    const content = contentOf([proc('b1'), proc('b2')]);
    const { index } = overlayOf(content);
    const { svg } = overlayOf(content, {
      hover: 'b2',
      selection: selectBlock(index, 'b1'),
      edit: editColorsOnDark,
    });
    expect(svg).toContain(`stroke="${editColorsOnDark['edit.select']}" stroke-width="3"`);
    expect(svg).toContain(`stroke="${editColorsOnDark['edit.hover']}" stroke-width="1"`);
    expect(svg).not.toContain(editColors['edit.select']);
  });
});
