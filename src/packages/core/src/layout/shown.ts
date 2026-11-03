// What a sequence shows (02-layout 1.6): its blocks grouped by the fold regions marked on it, the
// regions of an opened call site included (01-model 1.6). The layout draws this structure and the
// editor walks it, so both see the same regions with the same ids.
import type { Block, Call, Diagram, Id, Seq, SiteFold, View } from '../model/types';

/**
 * Inside an opened call block every drawn id is written behind the path of the call blocks it
 * was opened through: `b4/b17` is block `b17` of the Method that call block `b4` calls, and
 * `b4/b9/b17` the same block seen through `b9`, a call opened inside `b4` (03-editor 2).
 */
export const pathSeparator = '/';

/** The screen id of `id` drawn behind `prefix` (`''` outside opened calls, else `b4/`). */
export function screenId(prefix: string, id: Id): Id {
  return prefix + id;
}

/** The prefix of the blocks shown inside the opened call block with screen id `call`. */
export function prefixInside(call: Id): string {
  return call + pathSeparator;
}

/** Splits a screen id into the call path in front and the model id at the end. */
export function splitScreenId(id: Id): { readonly path: ReadonlyArray<Id>; readonly id: Id } {
  const parts = id.split(pathSeparator);
  const last = parts.pop() ?? id;
  return { path: parts, id: last };
}

/** A fold region as shown. */
export type ShownFold = {
  /** The id drawn and selected: the region's id, behind the call path inside an opened call. */
  readonly screenId: Id;
  /** The model id: a FoldMark's, or a SiteFold's. */
  readonly id: Id;
  /** The name the user gave; without one the default name is shown. */
  readonly name?: string;
  /** Set for a region of an opened call site: the outermost call block and the path inside it. */
  readonly site: { readonly call: Id; readonly via: ReadonlyArray<Id> } | null;
  readonly isFolded: boolean;
  /** The blocks of the region, in order. */
  readonly blocks: ReadonlyArray<Block>;
};

/**
 * One shown thing of a sequence: a block, or a fold region with what it shows inside. A region
 * whose name band is off and that is not folded is not an item: its items stand in its place, so
 * it looks as if there were no region (interaction rules "접기 · 펼치기").
 */
export type ShownItem =
  | { readonly kind: 'block'; readonly block: Block }
  | { readonly kind: 'fold'; readonly fold: ShownFold; readonly items: ReadonlyArray<ShownItem> };

/** The view state the shown structure depends on. */
export type ShownView = {
  readonly folded: ReadonlySet<Id>;
  /** Opened call blocks by screen id (the path joined with `/`). */
  readonly opened: ReadonlySet<Id>;
  readonly bands: boolean;
};

/** Reads the view state into sets. */
export function shownView(view: View): ShownView {
  return {
    folded: new Set(view.folded),
    opened: new Set(view.opened.map((path) => path.join(pathSeparator))),
    bands: view.bands,
  };
}

/** A site fold region placed on one sequence of the called Method: its index range there. */
export type SiteRange = { readonly fold: SiteFold; readonly lo: number; readonly hi: number };

/** Where a sequence is shown: outside opened calls, or inside one with its site fold regions. */
export type ShownAt = {
  /** `''` outside opened calls, `b4/` inside call block `b4`. */
  readonly prefix: string;
  /** The site regions of this call site by the sequence of the Method they are on. */
  readonly siteRanges: ReadonlyMap<Seq, ReadonlyArray<SiteRange>>;
  /** The outermost opened call block and the call blocks opened inside it, or `null`. */
  readonly site: { readonly call: Id; readonly via: ReadonlyArray<Id> } | null;
};

/** The place outside every opened call. */
export const topLevel: ShownAt = { prefix: '', siteRanges: new Map(), site: null };

/**
 * Where the blocks of the Method a call block calls are shown when it is opened: behind the
 * call's screen id, with the site regions that belong here (01-model 1.6). `outer` is where the
 * call block itself is shown, `outermost` the outermost call block of the path.
 */
export function insideCall(
  outer: ShownAt,
  call: Call,
  callScreenId: Id,
  method: Diagram,
  outermost: Call,
): ShownAt {
  const via = outer.site === null ? [] : [...outer.site.via, call.id];
  const site = { call: outermost.id, via };
  const folds = outermost.siteFolds.filter((fold) => sameIds(fold.via, via));
  return {
    prefix: prefixInside(callScreenId),
    siteRanges: placeSiteFolds(method.body, folds),
    site,
  };
}

function sameIds(a: ReadonlyArray<Id>, b: ReadonlyArray<Id>): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

/**
 * Puts each site region on the sequence of the Method holding its first block, or its last when
 * the first is gone. Only blocks that are still there count: a region whose ends are both in the
 * sequence holds the blocks between them, one with a single end left holds that block, and one
 * with no end left is not shown (UX P2, 01-model 1.6).
 */
export function placeSiteFolds(
  body: Seq,
  folds: ReadonlyArray<SiteFold>,
): ReadonlyMap<Seq, ReadonlyArray<SiteRange>> {
  const places = new Map<Seq, SiteRange[]>();
  if (folds.length === 0) {
    return places;
  }
  const where = new Map<Id, { readonly seq: Seq; readonly index: number }>();
  const visit = (seq: Seq): void => {
    seq.blocks.forEach((block, index) => {
      where.set(block.id, { seq, index });
      for (const inner of innerSeqs(block)) {
        visit(inner);
      }
    });
  };
  visit(body);
  for (const fold of folds) {
    const first = where.get(fold.first);
    const last = where.get(fold.last);
    const end = first ?? last;
    if (end === undefined) {
      continue;
    }
    const range: SiteRange =
      last !== undefined && first?.seq === last.seq
        ? { fold, lo: Math.min(first.index, last.index), hi: Math.max(first.index, last.index) }
        : { fold, lo: end.index, hi: end.index };
    places.set(end.seq, [...(places.get(end.seq) ?? []), range]);
  }
  return places;
}

/** The sequences directly inside a block, left to right. */
export function innerSeqs(block: Block): ReadonlyArray<Seq> {
  switch (block.kind) {
    case 'process':
    case 'call':
      return [];
    case 'if':
      return [block.yes.body, block.no.body];
    case 'case':
      return [
        ...block.arms.map((arm) => arm.body),
        ...(block.otherwise === null ? [] : [block.otherwise.body]),
      ];
    case 'while':
    case 'doWhile':
    case 'for':
      return [block.body];
  }
}

type Candidate = {
  readonly lo: number;
  readonly hi: number;
  readonly fold: Omit<ShownFold, 'blocks' | 'isFolded'>;
};

/**
 * The shown items of a sequence. Regions marked on it come first; regions of the call site join
 * where they nest with those and are left out where they would cross one or repeat its range
 * (invariant 5 holds for the Method, not for what the site adds).
 */
export function shownItems(seq: Seq, at: ShownAt, view: ShownView): ReadonlyArray<ShownItem> {
  const accepted: Candidate[] = [];
  const isClash = (lo: number, hi: number): boolean =>
    accepted.some(
      (other) =>
        (other.lo === lo && other.hi === hi) ||
        (other.lo < lo && lo <= other.hi && other.hi < hi) ||
        (lo < other.lo && other.lo <= hi && hi < other.hi),
    );
  const position = new Map<Id, number>(seq.blocks.map((block, index) => [block.id, index]));
  for (const fold of seq.folds) {
    const a = position.get(fold.first);
    const b = position.get(fold.last);
    if (a === undefined || b === undefined || a > b || isClash(a, b)) {
      continue;
    }
    accepted.push({
      lo: a,
      hi: b,
      fold: {
        screenId: screenId(at.prefix, fold.id),
        id: fold.id,
        ...(fold.name === undefined ? {} : { name: fold.name }),
        site: null,
      },
    });
  }
  for (const range of at.siteRanges.get(seq) ?? []) {
    if (isClash(range.lo, range.hi) || at.site === null) {
      continue;
    }
    accepted.push({
      lo: range.lo,
      hi: range.hi,
      fold: {
        screenId: screenId(at.prefix, range.fold.id),
        id: range.fold.id,
        ...(range.fold.name === undefined ? {} : { name: range.fold.name }),
        site: at.site,
      },
    });
  }
  if (accepted.length === 0) {
    return seq.blocks.map((block) => ({ kind: 'block', block }));
  }
  // Outer regions first: by start, then the longer one.
  accepted.sort((left, right) => left.lo - right.lo || right.hi - left.hi);
  return nest(seq, accepted, 0, seq.blocks.length - 1, null, view);
}

function nest(
  seq: Seq,
  ranges: ReadonlyArray<Candidate>,
  from: number,
  to: number,
  around: Candidate | null,
  view: ShownView,
): ShownItem[] {
  const items: ShownItem[] = [];
  let index = from;
  while (index <= to) {
    const region = ranges.find((range) => range !== around && range.lo === index && range.hi <= to);
    if (region === undefined) {
      const block = seq.blocks[index];
      if (block !== undefined) {
        items.push({ kind: 'block', block });
      }
      index += 1;
      continue;
    }
    const inner = nest(seq, ranges, region.lo, region.hi, region, view);
    const isFolded = view.folded.has(region.fold.id);
    if (!isFolded && !view.bands) {
      items.push(...inner);
    } else {
      items.push({
        kind: 'fold',
        fold: { ...region.fold, isFolded, blocks: seq.blocks.slice(region.lo, region.hi + 1) },
        items: inner,
      });
    }
    index = region.hi + 1;
  }
  return items;
}

/** How many blocks a sequence holds, the blocks inside control blocks included. */
export function countBlocks(seq: Seq): number {
  let count = 0;
  for (const block of seq.blocks) {
    count += 1;
    for (const inner of innerSeqs(block)) {
      count += countBlocks(inner);
    }
  }
  return count;
}
