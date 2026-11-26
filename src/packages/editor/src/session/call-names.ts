// What a call block's fields and name are, read from the lookup tables of the content.
import type { Block } from '@ariadne-nsd/core';
import { headName, headParams } from '@ariadne-nsd/core';

import type { DocIndex } from '../model/doc-index';
import type { CallPart } from '../state/editor-state';

/**
 * The fields of a call block, in `Tab` order (interaction rules "호출 블록"): the arguments,
 * then the result. A call to a Method that receives nothing has the result only; a call by a
 * written name has its name last (R-BLK-08, UX CB6).
 */
export function callParts(index: DocIndex, block: Block): ReadonlyArray<CallPart> {
  if (block.kind === 'call' && block.target.kind === 'named') {
    return ['args', 'result', 'name'];
  }
  if (block.kind !== 'call' || block.target.kind !== 'local') {
    return ['args', 'result'];
  }
  const head = index.diagrams.get(block.target.diagram)?.head ?? null;
  return head !== null && headParams(head) !== null ? ['args', 'result'] : ['result'];
}

/** The name a call block shows now, without the "no name" word (empty then). */
export function callName(index: DocIndex, block: Block): string {
  if (block.kind !== 'call') {
    return '';
  }
  const target = block.target;
  switch (target.kind) {
    case 'local': {
      const head = index.diagrams.get(target.diagram)?.head ?? null;
      return head === null ? '' : headName(head);
    }
    case 'named':
      return target.name;
  }
}
