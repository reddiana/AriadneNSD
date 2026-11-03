// A short notation for the examples (R-EDIT-25) and the builder that turns it into a document.
// The notation follows the prototype's `build()` (journal/assets/2026-10-10-ns-prototype.html),
// so the example data could be moved over without changing a character of block text.

import { createDoc, createIdGenerator } from '@ariadne-nsd/core';
import type {
  Block,
  Branch,
  Diagram,
  Doc,
  FoldMark,
  Head,
  Id,
  IdGenerator,
  Locale,
  Seq,
  Settings,
} from '@ariadne-nsd/core';

/**
 * One block in short notation. A string is a process block (`''` is an empty one).
 * `['case', …]` arms labelled `default` become the default branch. `['call', head, args, result]`
 * calls the Method whose header text is `head`. `['range', name, blocks]` puts the blocks in
 * place and marks them as a named fold region (ADR-0017).
 */
export type BlockSpec =
  | string
  | readonly ['if', string, ReadonlyArray<BlockSpec>, ReadonlyArray<BlockSpec>]
  | readonly ['case', string, ReadonlyArray<readonly [string, ReadonlyArray<BlockSpec>]>]
  | readonly ['while' | 'doWhile' | 'for', string, ReadonlyArray<BlockSpec>]
  | readonly ['call', string, string?, string?]
  | readonly ['range', string, ReadonlyArray<BlockSpec>];

/** One diagram in short notation: its header and its body. */
export type DiagramSpec = {
  readonly head: Head;
  readonly body: ReadonlyArray<BlockSpec>;
};

/**
 * An example written once per screen language: an English screen opens the English one, a Korean
 * screen the Korean one. Both have the same blocks in the same places; only the text differs.
 */
export type LocalizedSpec = Readonly<Record<Locale, ReadonlyArray<DiagramSpec>>>;

/** An Event diagram: started from outside, cannot be called. */
export function event(text: string, body: ReadonlyArray<BlockSpec>): DiagramSpec {
  return { head: { kind: 'event', text }, body };
}

/** A Method diagram: called by call blocks. */
export function method(text: string, body: ReadonlyArray<BlockSpec>): DiagramSpec {
  return { head: { kind: 'method', text }, body };
}

// The label of a Case arm that the prototype used for the default branch.
const defaultLabel = 'default';

/**
 * Builds a new document from diagrams in short notation. Ids come from the core id generator in
 * document order, so the same example always gives the same document. Settings and view state
 * are those of a new document, with the header shape the user chose last (UX HS1) and the
 * drawing language (ADR-0041).
 */
export function buildExample(
  diagrams: ReadonlyArray<DiagramSpec>,
  settings: Pick<Settings, 'headStyle' | 'locale'>,
): Doc {
  const base = createDoc(settings);
  const ids = createIdGenerator({ ...base.content, diagrams: [] });
  // Diagram ids first, so a call can refer to a Method that comes later in the document.
  const numbered = diagrams.map((spec) => ({ spec, id: ids.next('diagram') }));
  const methodByHead = new Map<string, Id>();
  for (const { spec, id } of numbered) {
    if (spec.head.kind === 'method') {
      methodByHead.set(spec.head.text, id);
    }
  }
  const built: Diagram[] = numbered.map(({ spec, id }) => ({
    id,
    head: spec.head,
    body: buildSeq(spec.body, ids, methodByHead),
  }));
  return { ...base, content: { ...base.content, diagrams: built } };
}

function buildSeq(
  specs: ReadonlyArray<BlockSpec>,
  ids: IdGenerator,
  methodByHead: ReadonlyMap<string, Id>,
): Seq {
  const blocks: Block[] = [];
  const folds: FoldMark[] = [];
  const add = (list: ReadonlyArray<BlockSpec>): void => {
    for (const spec of list) {
      if (typeof spec !== 'string' && spec[0] === 'range') {
        const start = blocks.length;
        add(spec[2]);
        const first = blocks[start];
        const last = blocks[blocks.length - 1];
        if (first === undefined || last === undefined || blocks.length === start) {
          throw new Error(`example fold region "${spec[1]}" has no blocks`);
        }
        folds.push({ id: ids.next('fold'), first: first.id, last: last.id, name: spec[1] });
      } else {
        blocks.push(buildBlock(spec, ids, methodByHead));
      }
    }
  };
  add(specs);
  return { blocks, folds };
}

function buildBlock(
  spec: Exclude<BlockSpec, readonly ['range', ...unknown[]]>,
  ids: IdGenerator,
  methodByHead: ReadonlyMap<string, Id>,
): Block {
  const id = ids.next('block');
  if (typeof spec === 'string') {
    return { id, kind: 'process', text: spec };
  }
  const branch = (body: ReadonlyArray<BlockSpec>): Branch => ({
    id: ids.next('branch'),
    body: buildSeq(body, ids, methodByHead),
  });
  switch (spec[0]) {
    case 'if': {
      const yes = branch(spec[2]);
      const no = branch(spec[3]);
      return { id, kind: 'if', text: spec[1], yes, no };
    }
    case 'case': {
      const arms = spec[2]
        .filter(([label]) => label !== defaultLabel)
        .map(([label, body]) => ({ ...branch(body), label }));
      const otherwise = spec[2].find(([label]) => label === defaultLabel);
      return {
        id,
        kind: 'case',
        text: spec[1],
        arms,
        otherwise: otherwise === undefined ? null : branch(otherwise[1]),
      };
    }
    case 'while':
    case 'doWhile':
    case 'for':
      return { id, kind: spec[0], text: spec[1], body: buildSeq(spec[2], ids, methodByHead) };
    case 'call': {
      const target = methodByHead.get(spec[1]);
      if (target === undefined) {
        throw new Error(`example calls "${spec[1]}", which is not a Method header`);
      }
      return {
        id,
        kind: 'call',
        target: { kind: 'local', diagram: target },
        args: spec[2] ?? '',
        result: spec[3] ?? '',
        siteFolds: [],
      };
    }
  }
}
