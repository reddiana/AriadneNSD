// Builders of small documents for the layout and rendering tests. Not exported from the package.
import type { Locale } from '../i18n/messages';
import type {
  Arm,
  Block,
  Branch,
  Case,
  Doc,
  DoWhile,
  For,
  If,
  Process,
  Seq,
  While,
} from '../model/types';

export const seq = (...blocks: Block[]): Seq => ({ blocks, folds: [] });

export const process = (id: string, text = ''): Process => ({ id, kind: 'process', text });

export const branch = (id: string, blocks: Block[], label?: string): Branch =>
  label === undefined ? { id, body: seq(...blocks) } : { id, label, body: seq(...blocks) };

export const ifBlock = (id: string, text: string, yes: Branch, no: Branch): If => ({
  id,
  kind: 'if',
  text,
  yes,
  no,
});

export const arm = (id: string, label: string, blocks: Block[]): Arm => ({
  id,
  label,
  body: seq(...blocks),
});

export const caseBlock = (
  id: string,
  text: string,
  arms: Arm[],
  otherwise: Branch | null,
): Case => ({ id, kind: 'case', text, arms, otherwise });

export const whileBlock = (id: string, text: string, blocks: Block[]): While => ({
  id,
  kind: 'while',
  text,
  body: seq(...blocks),
});

export const doWhileBlock = (id: string, text: string, blocks: Block[]): DoWhile => ({
  id,
  kind: 'doWhile',
  text,
  body: seq(...blocks),
});

export const forBlock = (id: string, text: string, blocks: Block[]): For => ({
  id,
  kind: 'for',
  text,
  body: seq(...blocks),
});

/** A document with one diagram without a header. */
export const docOf = (...blocks: Block[]): Doc => ({
  content: {
    settings: { textKind: 'plain', theme: 'default', headStyle: 'shape', locale: 'en' },
    diagrams: [{ id: 'd1', head: null, body: seq(...blocks) }],
  },
  view: { folded: [], opened: [], bands: true, resultSymbol: '←' },
});

/** The document with its drawing language `settings.locale` set to `locale` (ADR-0041). */
export const inLocale = (doc: Doc, locale: Locale): Doc => ({
  ...doc,
  content: { ...doc.content, settings: { ...doc.content.settings, locale } },
});

/**
 * A document of about `count` blocks, mixing every MVP block kind and nesting a few levels deep.
 * Deterministic, for benchmarks and the performance budget (02-layout 4).
 */
export function largeDoc(count: number): Doc {
  let next = 0;
  const id = (): string => `b${String((next += 1))}`;
  const branchId = (): string => `r${String((next += 1))}`;
  const blocks: Block[] = [];
  const pattern = (depth: number): Block => {
    const kind = next % 5;
    if (depth > 2 || kind === 0) {
      return process(id(), `value[${String(next)}] ← 합계 + ${String(next)}`);
    }
    if (kind === 1) {
      return ifBlock(
        id(),
        `x > ${String(next)} && 조건`,
        branch(branchId(), [pattern(depth + 1), pattern(depth + 1)]),
        branch(branchId(), [pattern(depth + 1)]),
      );
    }
    if (kind === 2) {
      return whileBlock(id(), `i < ${String(next)}`, [pattern(depth + 1), pattern(depth + 1)]);
    }
    if (kind === 3) {
      return caseBlock(
        id(),
        'key',
        [arm(branchId(), '1', [pattern(depth + 1)]), arm(branchId(), '2', [pattern(depth + 1)])],
        branch(branchId(), [process(id())]),
      );
    }
    return forBlock(id(), `k ← 0 .. ${String(next)}`, [pattern(depth + 1)]);
  };
  while (countBlocks(blocks) < count) {
    blocks.push(pattern(0));
  }
  return docOf(...blocks);
}

/** Counts the blocks of a list, nested ones included. */
export function countBlocks(blocks: ReadonlyArray<Block>): number {
  let total = 0;
  for (const block of blocks) {
    total += 1;
    switch (block.kind) {
      case 'process':
      case 'call':
        break;
      case 'if':
        total += countBlocks(block.yes.body.blocks) + countBlocks(block.no.body.blocks);
        break;
      case 'case':
        for (const item of block.arms) {
          total += countBlocks(item.body.blocks);
        }
        total += block.otherwise === null ? 0 : countBlocks(block.otherwise.body.blocks);
        break;
      case 'while':
      case 'doWhile':
      case 'for':
        total += countBlocks(block.body.blocks);
        break;
    }
  }
  return total;
}
