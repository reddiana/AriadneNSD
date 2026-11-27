import { describe, expect, it } from 'vitest';

import type { Block, Doc, Seq } from '@ariadne-nsd/core';
import { checkInvariants, locales, renderDoc } from '@ariadne-nsd/core';

import { examples } from '../examples/examples';
import { gallery } from './gallery';

// Hangul syllables and jamo: an English diagram has none, as in the examples.
const hangul = /[ᄀ-ᇿ㄰-㆏가-힯]/u;

/** Every text of a document, headers and fold region names included, in document order. */
function texts(doc: Doc): string[] {
  const out: string[] = [];
  const seq = (s: Seq): void => {
    for (const block of s.blocks) {
      out.push(...blockTexts(block));
    }
    out.push(...s.folds.map((fold) => fold.name ?? ''));
  };
  const blockTexts = (block: Block): string[] => {
    switch (block.kind) {
      case 'call':
        return [block.args, block.result];
      case 'if':
        seq(block.yes.body);
        seq(block.no.body);
        return [block.text];
      case 'case':
        for (const arm of block.arms) {
          out.push(arm.label);
          seq(arm.body);
        }
        if (block.otherwise !== null) {
          seq(block.otherwise.body);
        }
        return [block.text];
      case 'while':
      case 'doWhile':
      case 'for':
        seq(block.body);
        return [block.text];
      case 'endless':
        seq(block.body);
        return [];
      case 'parallel':
        for (const branch of block.branches) {
          seq(branch.body);
        }
        return [block.text];
      case 'process':
      case 'exit':
        return [block.text];
    }
  };
  for (const diagram of doc.content.diagrams) {
    out.push(diagram.head?.text ?? '');
    seq(diagram.body);
  }
  return out;
}

/** The kinds of the blocks and how they nest, without any text. */
function shape(doc: Doc): unknown {
  const seq = (s: Seq): unknown => ({ blocks: s.blocks.map(block), folds: s.folds.length });
  const block = (b: Block): unknown => {
    switch (b.kind) {
      case 'if':
        return ['if', seq(b.yes.body), seq(b.no.body)];
      case 'case':
        return ['case', b.arms.map((arm) => seq(arm.body)), b.otherwise && seq(b.otherwise.body)];
      case 'while':
      case 'doWhile':
      case 'for':
      case 'endless':
        return [b.kind, seq(b.body)];
      case 'parallel':
        return ['parallel', b.branches.map((branch) => seq(branch.body))];
      case 'process':
      case 'exit':
      case 'call':
        return b.kind;
    }
  };
  return doc.content.diagrams.map((diagram) => [diagram.head?.kind, seq(diagram.body)]);
}

describe('gallery', () => {
  it('T-1484: lists each algorithm once, on a shelf, named in both languages, with the algorithmic examples', () => {
    const ids = gallery.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(22);
    for (const id of ['binary-search', 'quicksort', 'merge-sort', 'dijkstra', 'maze', 'raft']) {
      expect(gallery.find((entry) => entry.id === id)?.build).toBe(
        examples.find((example) => example.id === id)?.build,
      );
    }
    for (const entry of gallery) {
      expect(['classic', 'hard', 'fun']).toContain(entry.category);
      expect(entry.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      for (const locale of locales) {
        expect(entry.name[locale]).not.toBe('');
        expect(entry.what[locale]).not.toBe('');
      }
    }
  });

  describe.each(gallery)('$id', (entry) => {
    it('T-1485: builds in every language with either header shape and keeps every invariant', () => {
      for (const locale of locales) {
        for (const headStyle of ['title', 'shape'] as const) {
          expect(checkInvariants(entry.build({ headStyle, locale }).content)).toEqual([]);
        }
      }
    });

    it('T-1486: renders in every language', () => {
      for (const locale of locales) {
        const rendering = renderDoc(entry.build({ headStyle: 'title', locale }));
        expect(rendering.svg.width).toBeGreaterThan(0);
        expect(rendering.svg.height).toBeGreaterThan(0);
      }
    });

    it('T-1487: the English one has no Hangul, and the Korean one has the same blocks in the same places', () => {
      const english = entry.build({ headStyle: 'title', locale: 'en' });
      const korean = entry.build({ headStyle: 'title', locale: 'ko' });
      expect(texts(english).filter((text) => hangul.test(text))).toEqual([]);
      expect(shape(korean)).toEqual(shape(english));
    });
  });
});
