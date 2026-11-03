// What the diagram shows, as a tree the selection and navigation rules can walk (03-editor 2.2):
// folded things count as one, opened call blocks show their Method's blocks in place. It is
// built from the same shown structure the layout draws (core `shownItems`), as a content of its
// own whose ids are the screen ids, and every made-up node says what it stands for.
import type {
  Block,
  Branch,
  Call,
  Content,
  Doc,
  Id,
  Path,
  Seq,
  ShownAt,
  ShownItem,
} from '@ariadne-nsd/core';
import {
  insideCall,
  pathSeparator,
  screenId,
  shownItems,
  shownView,
  topLevel,
} from '@ariadne-nsd/core';

import type { DocIndex } from './doc-index';
import { indexDoc } from './doc-index';

/** What a shown id that is not a model id of this place stands for. */
export type ShownMeaning =
  /** The row of a folded branch or loop body. `owner` is the model id of the sequence's owner. */
  | { readonly kind: 'row'; readonly owner: Id; readonly path: Path }
  /** A fold region: its folded cell or its frame with the name band. */
  | {
      readonly kind: 'fold';
      readonly fold: Id;
      readonly path: Path;
      /** It belongs to the opened call site, not to the Method (R-EDIT-16). */
      readonly isSite: boolean;
    }
  /** A block or branch of a called Method shown inside an opened call block (R-EDIT-15). */
  | { readonly kind: 'peek'; readonly id: Id; readonly path: Path };

/** The shown tree of a document. */
export type ShownIndex = {
  readonly doc: Doc;
  /** The shown tree as a content. Its ids are screen ids. */
  readonly index: DocIndex;
  readonly meanings: ReadonlyMap<Id, ShownMeaning>;
  /** A model or screen id hidden in something folded → the shown id drawn in its place. */
  readonly hiddenBy: ReadonlyMap<Id, Id>;
  /** Every opened call block that is shown, by screen id. */
  readonly opened: ReadonlySet<Id>;
};

/** The shown id of a folded row: the owner's screen id behind `~`. */
export function rowId(ownerScreenId: Id): Id {
  return `~${ownerScreenId}`;
}

/** The screen id of something inside the opened call path `path` (`[]` outside). */
export function screenIdIn(path: Path, id: Id): Id {
  return path.length === 0 ? id : [...path, id].join(pathSeparator);
}

/** Builds the shown tree of a document. */
export function shownIndexOf(doc: Doc): ShownIndex {
  const view = shownView(doc.view);
  const meanings = new Map<Id, ShownMeaning>();
  const hiddenBy = new Map<Id, Id>();
  const opened = new Set<Id>();
  const diagrams = new Map(doc.content.diagrams.map((diagram) => [diagram.id, diagram]));
  const calls = new Map<Id, Call>();
  const collect = (seq: Seq): void => {
    for (const block of seq.blocks) {
      if (block.kind === 'call') {
        calls.set(block.id, block);
      }
      for (const inner of innerOf(block)) {
        collect(inner.seq);
      }
    }
  };
  for (const diagram of doc.content.diagrams) {
    collect(diagram.body);
  }

  const pathOf = (at: ShownAt): Path =>
    at.prefix === '' ? [] : at.prefix.slice(0, -pathSeparator.length).split(pathSeparator);

  const hide = (block: Block, at: ShownAt, by: Id): void => {
    hiddenBy.set(screenId(at.prefix, block.id), by);
    for (const inner of innerOf(block)) {
      for (const child of inner.seq.blocks) {
        hide(child, at, by);
      }
    }
  };

  const body = (owner: Id, seq: Seq, at: ShownAt): Seq => {
    if (view.folded.has(owner)) {
      const id = rowId(screenId(at.prefix, owner));
      meanings.set(id, { kind: 'row', owner, path: pathOf(at) });
      for (const block of seq.blocks) {
        hide(block, at, id);
      }
      return { blocks: [{ id, kind: 'process', text: '' }], folds: [] };
    }
    return convertSeq(seq, at);
  };

  const convertSeq = (seq: Seq, at: ShownAt): Seq => ({
    blocks: convertItems(shownItems(seq, at, view), at),
    folds: [],
  });

  const convertItems = (items: ReadonlyArray<ShownItem>, at: ShownAt): Block[] =>
    items.map((item) => {
      if (item.kind === 'block') {
        return convertBlock(item.block, at);
      }
      const fold = item.fold;
      meanings.set(fold.screenId, {
        kind: 'fold',
        fold: fold.id,
        path: pathOf(at),
        isSite: fold.site !== null,
      });
      if (fold.isFolded) {
        for (const block of fold.blocks) {
          hide(block, at, fold.screenId);
        }
        return { id: fold.screenId, kind: 'process', text: '' };
      }
      // A frame: its band is selectable like a header above the blocks it holds.
      return {
        id: fold.screenId,
        kind: 'while',
        text: '',
        body: { blocks: convertItems(item.items, at), folds: [] },
      };
    });

  const convertBlock = (block: Block, at: ShownAt): Block => {
    const id = screenId(at.prefix, block.id);
    if (at.prefix !== '') {
      meanings.set(id, { kind: 'peek', id: block.id, path: pathOf(at) });
    }
    const branch = <B extends Branch>(old: B): B => {
      const branchId = screenId(at.prefix, old.id);
      if (at.prefix !== '') {
        meanings.set(branchId, { kind: 'peek', id: old.id, path: pathOf(at) });
      }
      return { ...old, id: branchId, body: body(old.id, old.body, at) };
    };
    switch (block.kind) {
      case 'process':
        return { ...block, id };
      case 'call': {
        const inside = openedAt(block, id, at);
        if (inside === null) {
          return { ...block, id };
        }
        opened.add(id);
        // An opened call block holds the Method's blocks, like a loop its body.
        return { id, kind: 'while', text: '', body: convertSeq(inside.body, inside.at) };
      }
      case 'if':
        return { ...block, id, yes: branch(block.yes), no: branch(block.no) };
      case 'case':
        return {
          ...block,
          id,
          arms: block.arms.map(branch),
          otherwise: block.otherwise === null ? null : branch(block.otherwise),
        };
      case 'while':
      case 'doWhile':
      case 'for':
        return { ...block, id, body: body(block.id, block.body, at) };
    }
  };

  const openedAt = (
    block: Call,
    id: Id,
    at: ShownAt,
  ): { readonly at: ShownAt; readonly body: Seq } | null => {
    if (!view.opened.has(id) || block.target.kind !== 'local') {
      return null;
    }
    const method = diagrams.get(block.target.diagram);
    const outermost = at.site === null ? block : calls.get(at.site.call);
    if (method?.head?.kind !== 'method' || outermost === undefined) {
      return null;
    }
    return { at: insideCall(at, block, id, method, outermost), body: method.body };
  };

  const content: Content = {
    settings: doc.content.settings,
    diagrams: doc.content.diagrams.map((diagram) => ({
      ...diagram,
      body: convertSeq(diagram.body, topLevel),
    })),
  };
  return { doc, index: indexDoc(content), meanings, hiddenBy, opened };
}

/** The sequences inside a block with their owners. */
function innerOf(block: Block): ReadonlyArray<{ readonly owner: Id; readonly seq: Seq }> {
  switch (block.kind) {
    case 'process':
    case 'call':
      return [];
    case 'if':
      return [
        { owner: block.yes.id, seq: block.yes.body },
        { owner: block.no.id, seq: block.no.body },
      ];
    case 'case':
      return [...block.arms, ...(block.otherwise === null ? [] : [block.otherwise])].map(
        (branch) => ({ owner: branch.id, seq: branch.body }),
      );
    case 'while':
    case 'doWhile':
    case 'for':
      return [{ owner: block.id, seq: block.body }];
  }
}
