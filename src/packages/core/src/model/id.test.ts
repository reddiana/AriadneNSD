import { describe, expect, it } from 'vitest';

import { contentIds, createIdGenerator, parseId } from './id';
import type { Block, Content, Seq } from './types';

const seq = (...blocks: Block[]): Seq => ({ blocks, folds: [] });
const process = (id: string, text = ''): Block => ({ id, kind: 'process', text });

const sample: Content = {
  settings: { textKind: 'plain', theme: 'default', headStyle: 'shape' },
  diagrams: [
    {
      id: 'd1',
      head: { kind: 'event', text: 'start' },
      body: {
        blocks: [
          process('b1', 'x ← 0'),
          {
            id: 'b7',
            kind: 'if',
            text: 'x > 0',
            yes: { id: 'r2', body: seq(process('b3')) },
            no: { id: 'r4', body: seq(process('b4')) },
          },
        ],
        folds: [{ id: 'f5', first: 'b1', last: 'b7' }],
      },
    },
  ],
};

describe('ids', () => {
  it('T-0185: 01-model 1.7: lists every defined id in document order', () => {
    expect([...contentIds(sample)]).toEqual(['d1', 'b1', 'b7', 'r2', 'b3', 'r4', 'b4', 'f5']);
  });

  it('T-0186: 01-model 1.7: a new id is the largest number of that kind plus one', () => {
    const ids = createIdGenerator(sample);
    expect(ids.next('block')).toBe('b8');
    expect(ids.next('block')).toBe('b9');
    expect(ids.next('branch')).toBe('r5');
    expect(ids.next('fold')).toBe('f6');
    expect(ids.next('diagram')).toBe('d2');
  });

  it('T-0187: 01-model 1.7: the same document gives the same ids', () => {
    const first = createIdGenerator(sample);
    const second = createIdGenerator(sample);
    expect([first.next('block'), first.next('block')]).toEqual([
      second.next('block'),
      second.next('block'),
    ]);
  });

  it('T-0188: does not reuse ids passed in alsoAvoid', () => {
    expect(createIdGenerator(sample, ['b20']).next('block')).toBe('b21');
  });

  it('T-0189: parses ids and rejects other forms', () => {
    expect(parseId('b17')).toEqual({ prefix: 'b', number: 17 });
    expect(parseId('block')).toBeNull();
    expect(parseId('B1')).toBeNull();
  });
});
