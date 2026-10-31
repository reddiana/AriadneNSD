import type { Block, Content, Id, Seq } from './types';

/** What an id names. Each kind has its own prefix (01-model 1.7, 01-file-format 3.3). */
export type IdKind = 'diagram' | 'block' | 'branch' | 'fold';

const prefixes: Readonly<Record<IdKind, string>> = {
  diagram: 'd',
  block: 'b',
  branch: 'r',
  fold: 'f',
};

/** Issues new ids. Created from a document, so the same document always gives the same ids. */
export type IdGenerator = {
  /** Returns a new id of the given kind and remembers it, so the next call gives another. */
  readonly next: (kind: IdKind) => Id;
};

/**
 * Creates an id generator for a document. A new id is the largest number already used with that
 * prefix, plus one (01-model 1.7). No UUIDs, clocks, or random numbers, so commands stay
 * deterministic. `alsoAvoid` adds ids that must not be reused even though the content no longer
 * has them, for example ids still referred to by the view state.
 */
export function createIdGenerator(content: Content, alsoAvoid: Iterable<Id> = []): IdGenerator {
  const largest = new Map<string, number>();
  const note = (id: Id): void => {
    const parsed = parseId(id);
    if (parsed !== null && parsed.number > (largest.get(parsed.prefix) ?? 0)) {
      largest.set(parsed.prefix, parsed.number);
    }
  };
  for (const id of contentIds(content)) {
    note(id);
  }
  for (const id of alsoAvoid) {
    note(id);
  }
  return {
    next: (kind) => {
      const prefix = prefixes[kind];
      const number = (largest.get(prefix) ?? 0) + 1;
      largest.set(prefix, number);
      return `${prefix}${String(number)}`;
    },
  };
}

/** Splits an id into its prefix and number, or returns `null` if it is not in that form. */
export function parseId(id: Id): { readonly prefix: string; readonly number: number } | null {
  const match = /^([a-z]+)(\d+)$/.exec(id);
  if (match === null) {
    return null;
  }
  const [, prefix = '', digits = ''] = match;
  return { prefix, number: Number(digits) };
}

/**
 * Lists every id defined in the content, in document order: diagrams, blocks, branches,
 * fold regions and site fold regions. References (fold ranges, call targets) are not included.
 */
export function* contentIds(content: Content): Generator<Id> {
  for (const diagram of content.diagrams) {
    yield diagram.id;
    yield* seqIds(diagram.body);
  }
}

function* seqIds(seq: Seq): Generator<Id> {
  for (const block of seq.blocks) {
    yield* blockIds(block);
  }
  for (const fold of seq.folds) {
    yield fold.id;
  }
}

function* blockIds(block: Block): Generator<Id> {
  yield block.id;
  switch (block.kind) {
    case 'process':
      return;
    case 'if':
      yield block.yes.id;
      yield* seqIds(block.yes.body);
      yield block.no.id;
      yield* seqIds(block.no.body);
      return;
    case 'case':
      for (const arm of block.arms) {
        yield arm.id;
        yield* seqIds(arm.body);
      }
      if (block.otherwise !== null) {
        yield block.otherwise.id;
        yield* seqIds(block.otherwise.body);
      }
      return;
    case 'while':
    case 'doWhile':
    case 'for':
      yield* seqIds(block.body);
      return;
    case 'call':
      for (const fold of block.siteFolds) {
        yield fold.id;
      }
      return;
  }
}
