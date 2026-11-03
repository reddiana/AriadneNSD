// Extracting blocks into a new Method (R-EDIT-19, 01-model 4.1 "호출", interaction rules "새
// Method로 빼기와 새 다이어그램").
import { headParams } from '../model/head';
import type { Call, Content, Diagram, FoldMark, Head, Seq } from '../model/types';
import { done, fail, failWith, idsFor, isReason, resolveTarget } from './common';
import { checkHeadName, defaultHeadName, insertDiagramAt } from './diagram';
import { foldRange, replaceRange, sliceSeq } from './seq-edit';
import { indexContent, updateSeq } from './tree';
import type { FailResult, OkResult, Target, WithIds } from './types';

/** Arguments of `extractMethod`. */
export type ExtractMethodArgs = WithIds & {
  /** Blocks of one sequence, or a whole fold region. */
  readonly target: Target;
};

/**
 * The result of `extractMethod`: the result of the command, with the number of fold regions that
 * crossed an end of the range and were removed (the editor tells the user).
 */
export type ExtractResult = (OkResult & { readonly removedFolds: number }) | FailResult;

/**
 * Moves the target blocks into a new Method and leaves a call block calling it in their place,
 * in one undo step (R-EDIT-19, interaction rules "새 Method로 빼기와 새 다이어그램").
 * - The range is blocks of one sequence (ADR-0008), with everything inside them. Taking the whole
 *   sequence leaves the call block alone in it.
 * - The new Method goes right after the Method the blocks came from; from an Event or a diagram
 *   without a header, after the last Method (UX XM1).
 * - Its name is the default name ("Method n"). Extracting one fold region (`fold` target) takes
 *   the region's name instead, when it is a valid new name, and the region goes away.
 * - The call block's arguments and result start empty; a name with parentheses fills the
 *   arguments as `insertCall` does.
 * - Fold regions inside the range go with the blocks. A region holding the whole range then
 *   holds the call block (rule F). A region crossing an end of the range is removed.
 * - Call blocks inside keep calling what they called, the source Method included (recursion).
 * - `diagramEnd` is refused (`wrongKind`): there is nothing selected to extract.
 * Touched: the new diagram, then the call block.
 */
export function extractMethod(content: Content, args: ExtractMethodArgs): ExtractResult {
  if (args.target.kind === 'diagramEnd') {
    return fail('wrongKind');
  }
  const index = indexContent(content);
  const range = resolveTarget(index, args.target);
  if (isReason(range)) {
    return failWith(range);
  }
  const source = index.seqs.get(range.owner)?.diagram;
  const sourceDiagram = source === undefined ? undefined : index.diagrams.get(source);
  if (sourceDiagram === undefined) {
    return fail('notFound');
  }
  const { lo, hi } = range;
  const extracted = args.target.kind === 'fold' ? args.target.fold : null;
  const extractedFold = range.seq.folds.find((fold) => fold.id === extracted);

  // Regions crossing an end of the range, and the extracted region itself, are removed first.
  let removedFolds = 0;
  const kept: FoldMark[] = range.seq.folds.filter((fold) => {
    if (fold.id === extracted) {
      return false;
    }
    const at = foldRange(range.seq, fold);
    if (at === null) {
      return true;
    }
    const [a, b] = at;
    const isCrossing = (a < lo && lo <= b && b < hi) || (lo < a && a <= hi && hi < b);
    if (isCrossing) {
      removedFolds += 1;
    }
    return !isCrossing;
  });
  const seq: Seq =
    kept.length === range.seq.folds.length ? range.seq : { ...range.seq, folds: kept };

  const ids = idsFor(content, args);
  const head: Head = { kind: 'method', text: methodName(content, extractedFold?.name) };
  const diagram: Diagram = {
    id: ids.next('diagram'),
    head,
    // Regions exactly on the range stay in the source around the call block (rule F).
    body: sliceSeq(seq, lo, hi, false),
  };
  const call: Call = {
    id: ids.next('block'),
    kind: 'call',
    target: { kind: 'local', diagram: diagram.id },
    args: headParams(head) ?? '',
    result: '',
    siteFolds: [],
  };
  const left = updateSeq(content, range.owner, () =>
    replaceRange(seq, lo, hi, { blocks: [call], folds: [] }),
  );
  const after = sourceDiagram.head?.kind === 'method' ? sourceDiagram.id : null;
  const next = insertDiagramAt(left, diagram, after);
  return { ...done(next, [diagram.id, call.id]), removedFolds };
}

/** The name of the new Method: the extracted region's name when it can be one, or the default. */
function methodName(content: Content, foldName: string | undefined): string {
  if (foldName !== undefined) {
    const text = foldName.replace(/\r\n|\r|\n/g, ' ').trim();
    // An empty name or one another header has falls back to the default name.
    if (checkHeadName(content, { kind: 'method', text }, null) === null) {
      return text;
    }
  }
  return defaultHeadName(content, 'method');
}
