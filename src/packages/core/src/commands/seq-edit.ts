// Edits of one sequence that keep its fold regions valid (invariant 5, rule F in 01-model 4.3).
// Fold regions are marks on a sequence given by block ids (ADR-0017), so most edits leave them
// alone; these functions handle the cases where a region's ends leave the sequence.
import type { IdGenerator } from '../model/id';
import type { Block, FoldMark, Seq } from '../model/types';

/** An index range `[first, last]` of a fold region in its sequence, or `null` if it is broken. */
export function foldRange(seq: Seq, fold: FoldMark): readonly [number, number] | null {
  const first = seq.blocks.findIndex((block) => block.id === fold.first);
  const last = seq.blocks.findIndex((block) => block.id === fold.last);
  return first < 0 || last < 0 || first > last ? null : [first, last];
}

/**
 * Drops fold regions whose ends are not blocks of the sequence, whose ends are in the wrong
 * order, or whose range equals an earlier region's (invariant 5).
 */
export function cleanFolds(seq: Seq): Seq {
  const seen = new Set<string>();
  const folds = seq.folds.filter((fold) => {
    const range = foldRange(seq, fold);
    if (range === null) {
      return false;
    }
    const key = `${String(range[0])}:${String(range[1])}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
  return folds.length === seq.folds.length ? seq : { ...seq, folds };
}

const idAt = (blocks: ReadonlyArray<Block>, index: number): string => {
  const block = blocks[index];
  if (block === undefined) {
    throw new Error(`No block at index ${String(index)}`);
  }
  return block.id;
};

/**
 * Replaces the blocks `lo..hi` (inclusive) with `insert.blocks` and adds `insert.folds`.
 * Fold regions follow rule F: a region holding the whole range now holds the new blocks in its
 * place (or shrinks if there are none), a region inside the range goes away (callers move it
 * elsewhere first), and a region overlapping one end shrinks to the blocks left.
 * The result may be empty; see `fillEmpty`.
 */
export function replaceRange(seq: Seq, lo: number, hi: number, insert: Seq): Seq {
  const old = seq.blocks;
  const added = insert.blocks;
  const blocks = [...old.slice(0, lo), ...added, ...old.slice(hi + 1)];
  const folds: FoldMark[] = [];
  for (const fold of seq.folds) {
    const range = foldRange(seq, fold);
    if (range === null) {
      continue;
    }
    const [a, b] = range;
    if (b < lo || a > hi) {
      folds.push(fold);
    } else if (a <= lo && hi <= b) {
      const keepsStart = a < lo;
      const keepsEnd = b > hi;
      if (added.length > 0) {
        folds.push({
          ...fold,
          first: keepsStart ? fold.first : idAt(added, 0),
          last: keepsEnd ? fold.last : idAt(added, added.length - 1),
        });
      } else if (keepsStart || keepsEnd) {
        folds.push({
          ...fold,
          first: keepsStart ? fold.first : idAt(old, hi + 1),
          last: keepsEnd ? fold.last : idAt(old, lo - 1),
        });
      }
    } else if (lo <= a && b <= hi) {
      // Inside the range: it leaves with the blocks.
    } else if (a < lo) {
      folds.push({ ...fold, last: idAt(old, lo - 1) });
    } else {
      folds.push({ ...fold, first: idAt(old, hi + 1) });
    }
  }
  return cleanFolds({ blocks, folds: [...folds, ...insert.folds] });
}

/**
 * Inserts `insert` before index `index` (so `index === blocks.length` appends).
 * Blocks inserted between the ends of a region join it on their own, because regions are given
 * by block ids. At a region's end, `join` says whether the new blocks join (UX MD1):
 * `after` extends regions ending at `index - 1`, `before` extends regions starting at `index`.
 */
export function insertAt(
  seq: Seq,
  index: number,
  insert: Seq,
  join: 'after' | 'before' | 'none',
): Seq {
  const added = insert.blocks;
  if (added.length === 0) {
    return seq;
  }
  const blocks = [...seq.blocks.slice(0, index), ...added, ...seq.blocks.slice(index)];
  const joinsAfter = join === 'after' && index > 0 ? idAt(seq.blocks, index - 1) : null;
  const joinsBefore =
    join === 'before' && index < seq.blocks.length ? idAt(seq.blocks, index) : null;
  const folds = seq.folds.map((fold) => {
    if (joinsAfter !== null && fold.last === joinsAfter) {
      return { ...fold, last: idAt(added, added.length - 1) };
    }
    if (joinsBefore !== null && fold.first === joinsBefore) {
      return { ...fold, first: idAt(added, 0) };
    }
    return fold;
  });
  return cleanFolds({ blocks, folds: [...folds, ...insert.folds] });
}

/**
 * The blocks `lo..hi` as their own sequence, with the regions that lie inside the range.
 * A region whose range is exactly `lo..hi` is included only when `withExact` is true.
 */
export function sliceSeq(seq: Seq, lo: number, hi: number, withExact: boolean): Seq {
  const folds = seq.folds.filter((fold) => {
    const range = foldRange(seq, fold);
    if (range === null) {
      return false;
    }
    const [a, b] = range;
    const inside = lo <= a && b <= hi;
    const exact = a === lo && b === hi;
    return inside && (withExact || !exact);
  });
  return { blocks: seq.blocks.slice(lo, hi + 1), folds };
}

/**
 * Reorders the blocks: `order[i]` is the old index of the block that goes to index `i`.
 * Each region keeps the same blocks; their new places must still be contiguous.
 */
export function permute(seq: Seq, order: ReadonlyArray<number>): Seq {
  const blocks = order.map((oldIndex) => {
    const block = seq.blocks[oldIndex];
    if (block === undefined) {
      throw new Error(`No block at index ${String(oldIndex)}`);
    }
    return block;
  });
  const newIndex = new Map<number, number>(order.map((oldIndex, index) => [oldIndex, index]));
  const folds = seq.folds.map((fold) => {
    const range = foldRange(seq, fold);
    if (range === null) {
      return fold;
    }
    const places: number[] = [];
    for (let i = range[0]; i <= range[1]; i += 1) {
      const place = newIndex.get(i);
      if (place === undefined) {
        throw new Error('permute: order is not a permutation');
      }
      places.push(place);
    }
    const min = Math.min(...places);
    const max = Math.max(...places);
    if (max - min + 1 !== places.length) {
      throw new Error(`permute: fold ${fold.id} would not be contiguous`);
    }
    return { ...fold, first: idAt(blocks, min), last: idAt(blocks, max) };
  });
  return cleanFolds({ blocks, folds });
}

/** Puts one empty block into a sequence left with no blocks (invariant 2). */
export function fillEmpty(seq: Seq, ids: IdGenerator): Seq {
  return seq.blocks.length > 0 ? seq : { blocks: [emptyBlock(ids)], folds: [] };
}

/** A new empty block: a process block with no text (01-model 1.4). */
export function emptyBlock(ids: IdGenerator): Block {
  return { id: ids.next('block'), kind: 'process', text: '' };
}

/** A sequence of one new empty block. */
export function emptySeq(ids: IdGenerator): Seq {
  return { blocks: [emptyBlock(ids)], folds: [] };
}

/**
 * Shrinks the fold regions that cross an end of `lo..hi` (hold some of its blocks and some
 * outside) so they no longer hold any of it, as if those blocks had left (rule F). Moving such a
 * range then leaves every region either holding the whole range, inside it, or apart from it.
 */
export function shrinkCrossing(seq: Seq, lo: number, hi: number): Seq {
  const folds = seq.folds.map((fold) => {
    const range = foldRange(seq, fold);
    if (range === null) {
      return fold;
    }
    const [a, b] = range;
    if (a < lo && lo <= b && b < hi) {
      return { ...fold, last: idAt(seq.blocks, lo - 1) };
    }
    if (lo < a && a <= hi && hi < b) {
      return { ...fold, first: idAt(seq.blocks, hi + 1) };
    }
    return fold;
  });
  const changed = folds.some((fold, i) => fold !== seq.folds[i]);
  return changed ? cleanFolds({ ...seq, folds }) : seq;
}
