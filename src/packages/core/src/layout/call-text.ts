// The text of a call block as it is drawn: `result ← Name(args)` (01-model 1.5, ADR-0022).
// The layout draws it and the clipboard writes it, so both read it from here.
import type { Locale } from '../i18n/messages';
import { drawingMessage } from '../i18n/messages';
import type { Call, Diagram, Id, View } from '../model/types';

/** What the text of a call block depends on besides the block. */
export type CallTextContext = {
  readonly locale: Locale;
  readonly resultSymbol: View['resultSymbol'];
  /** The diagrams of the document, by id, for the name of a local target. */
  readonly diagrams: ReadonlyMap<Id, Diagram>;
};

/** A call block's text in three parts: `result ← `, the name, and `(args)`. */
export type CallParts = { readonly before: string; readonly name: string; readonly after: string };

/**
 * The parts of a call block's text. A local target's name is its Method header's text before the
 * first '('; with parentheses in the header the call always shows `(args)`, otherwise only when
 * there are arguments. A call without a name shows the "no name" word.
 */
export function callParts(context: CallTextContext, block: Call): CallParts {
  const before = block.result === '' ? '' : `${block.result} ${context.resultSymbol} `;
  const target = block.target;
  let name: string;
  let hasParentheses = false;
  switch (target.kind) {
    case 'local': {
      const head = context.diagrams.get(target.diagram)?.head?.text ?? '';
      const open = head.indexOf('(');
      name = (open < 0 ? head : head.slice(0, open)).trim();
      hasParentheses = open >= 0;
      break;
    }
    case 'named':
      name = target.name;
      break;
    case 'external':
    case 'lost':
      name = target.lastName;
      break;
  }
  if (name === '') {
    name = drawingMessage(context.locale, 'call.noName');
  }
  const after = block.args !== '' || hasParentheses ? `(${block.args})` : '';
  return { before, name, after };
}

/** A call block's text on one line, as it is drawn: `ys ← MergeSort(xs)`. */
export function callText(context: CallTextContext, block: Call): string {
  const parts = callParts(context, block);
  return parts.before + parts.name + parts.after;
}
