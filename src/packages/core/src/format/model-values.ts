// The values a model JSON may hold where the type is a fixed set (01-file-format 3.3), as lists:
// the one source for what is written out for people and other programs, such as the guide for AI
// assistants (/llms.txt, R-WEB-10) and the JSON Schema's test. Each list is checked against the
// model's types by `satisfies`: a kind added to the types and not here, or the other way round,
// does not compile. Text kinds, themes and locales have their lists where they are defined
// (`textKinds`, `themeIds`, `locales`).
import type { Block, CallTarget, Head, Settings, View } from '../model/types';

const blockKindSet = {
  process: true,
  if: true,
  case: true,
  while: true,
  doWhile: true,
  for: true,
  call: true,
} as const satisfies Record<Block['kind'], true>;

const headKindSet = { method: true, event: true } as const satisfies Record<Head['kind'], true>;

const headStyleSet = { title: true, shape: true } as const satisfies Record<
  Settings['headStyle'],
  true
>;

const resultSymbolSet = { '←': true, '=': true } as const satisfies Record<
  View['resultSymbol'],
  true
>;

const callTargetKindSet = {
  local: true,
  named: true,
  external: true,
  lost: true,
} as const satisfies Record<CallTarget['kind'], true>;

/** Every block kind (`kind` of a block), in the order the guide and the toolbar list them. */
export const blockKinds = Object.keys(blockKindSet) as ReadonlyArray<Block['kind']>;

/** The kinds of a diagram header (`head.kind`). */
export const headKinds = Object.keys(headKindSet) as ReadonlyArray<Head['kind']>;

/** How headers are drawn (`settings.headStyle`). */
export const headStyles = Object.keys(headStyleSet) as ReadonlyArray<Settings['headStyle']>;

/** The symbol between a call's result and the call (`view.resultSymbol`). */
export const resultSymbols = Object.keys(resultSymbolSet) as ReadonlyArray<View['resultSymbol']>;

/** The kinds of a call block's target (`target.kind`). */
export const callTargetKinds = Object.keys(callTargetKindSet) as ReadonlyArray<CallTarget['kind']>;
