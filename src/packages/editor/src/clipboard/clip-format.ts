// What copied blocks look like on the system clipboard (03-editor 3.3): indented text for other
// programs, and the model JSON for AriadneNSD itself.
import type { Block, CallTextContext, Clip, Diagram, Id, Seq } from '@ariadne-nsd/core';
import {
  callText,
  contentIds,
  createDoc,
  drawingMessage,
  headName,
  parseId,
  parseModelJson,
  serializeModelJson,
} from '@ariadne-nsd/core';

/** The web custom clipboard format of copied blocks (Chromium's web custom formats). */
export const clipMimeType = 'web application/x-ariadne-nsd+json';

/** What is read from or written to a clipboard. */
export type ClipboardData = {
  readonly text: string | null;
  /** The model JSON of the blocks, in the custom format. */
  readonly json: string | null;
};

const indentUnit = '    ';

/** The line before each branch of a parallel block in copied text: the branches have no label. */
const parallelMark = '∥';

/**
 * The blocks as indented lines, so they read like pseudocode elsewhere. Control blocks put their
 * text on one line and their blocks below, one level in; If and Case branches get a label line,
 * a parallel block's branches a line `∥`, an endless loop the line "(endless loop)".
 * A Do-While writes its condition after its blocks, as it is drawn. A call block is its line as
 * drawn, `ys ← MergeSort(xs)`, so it needs the document's diagrams and result symbol (`drawn`).
 * Empty blocks are left out.
 */
export function clipToText(clip: Clip, drawn: CallTextContext): string {
  const locale = drawn.locale;
  const lines: string[] = [];
  const textLines = (text: string, depth: number): void => {
    for (const line of text.split('\n')) {
      lines.push(indentUnit.repeat(depth) + line);
    }
  };
  const visit = (block: Block, depth: number): void => {
    switch (block.kind) {
      case 'process':
        if (block.text !== '') {
          textLines(block.text, depth);
        }
        return;
      case 'exit':
        if (block.text !== '') {
          textLines(block.text, depth);
        }
        return;
      case 'call':
        textLines(callText(drawn, block), depth);
        return;
      case 'endless':
        textLines(drawingMessage(locale, 'endless.name'), depth);
        block.body.blocks.forEach((inner) => {
          visit(inner, depth + 1);
        });
        return;
      case 'parallel':
        if (block.text !== '') {
          textLines(block.text, depth);
        }
        for (const branch of block.branches) {
          textLines(parallelMark, depth + 1);
          branch.body.blocks.forEach((inner) => {
            visit(inner, depth + 2);
          });
        }
        return;
      case 'while':
      case 'for':
        textLines(block.text, depth);
        block.body.blocks.forEach((inner) => {
          visit(inner, depth + 1);
        });
        return;
      case 'doWhile':
        block.body.blocks.forEach((inner) => {
          visit(inner, depth + 1);
        });
        textLines(block.text, depth);
        return;
      case 'if':
        textLines(block.text, depth);
        textLines(`${block.yes.label ?? drawingMessage(locale, 'if.yes')}:`, depth + 1);
        block.yes.body.blocks.forEach((inner) => {
          visit(inner, depth + 2);
        });
        textLines(`${block.no.label ?? drawingMessage(locale, 'if.no')}:`, depth + 1);
        block.no.body.blocks.forEach((inner) => {
          visit(inner, depth + 2);
        });
        return;
      case 'case':
        textLines(block.text, depth);
        for (const arm of block.arms) {
          textLines(`${arm.label}:`, depth + 1);
          arm.body.blocks.forEach((inner) => {
            visit(inner, depth + 2);
          });
        }
        if (block.otherwise !== null) {
          const label = block.otherwise.label ?? drawingMessage(locale, 'case.default');
          textLines(`${label}:`, depth + 1);
          block.otherwise.body.blocks.forEach((inner) => {
            visit(inner, depth + 2);
          });
        }
        return;
    }
  };
  clip.blocks.forEach((block) => {
    visit(block, 0);
  });
  return lines.join('\n');
}

/**
 * The blocks as model JSON: a document whose first diagram, without a header, holds them, in the
 * file format (01-file-format 3), so reading it back goes through the same checks as opening a
 * file. Each Method the copied call blocks call (`diagrams`) comes along as an empty Method with
 * its header, so the clip is a valid document (invariant 6) and remembers the names: pasted into
 * another document, a call finds the Method of that name, or keeps the name (03-editor 3.3).
 */
export function clipToJson(clip: Clip, diagrams: ReadonlyMap<Id, Diagram> = new Map()): string {
  const doc = createDoc();
  const body = { id: 'd0', head: null, body: clip };
  const stubs = methodStubs(clip, diagrams, { settings: doc.content.settings, diagrams: [body] });
  const ownId = `d${String(Math.max(0, ...stubs.map(({ id }) => parseId(id)?.number ?? 0)) + 1)}`;
  return serializeModelJson({
    ...doc,
    content: { ...doc.content, diagrams: [{ ...body, id: ownId }, ...stubs] },
  });
}

/**
 * A copied diagram as indented lines: its header text, then its blocks one level in (UX HC1).
 */
export function diagramToText(diagram: Diagram, drawn: CallTextContext): string {
  const body = clipToText(diagram.body, drawn)
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => indentUnit + line);
  return [diagram.head?.text ?? '', ...body].join('\n');
}

/**
 * A copied diagram as model JSON (UX HC1): the diagram comes first, with its header, which tells
 * it from copied blocks, whose diagram has none. The Methods it calls follow as in `clipToJson`.
 */
export function diagramToJson(diagram: Diagram, diagrams: ReadonlyMap<Id, Diagram>): string {
  const others = new Map(diagrams);
  others.delete(diagram.id);
  const stubs = methodStubs(diagram.body, others, {
    settings: createDoc().content.settings,
    diagrams: [diagram],
  });
  const doc = createDoc();
  return serializeModelJson({
    ...doc,
    content: { ...doc.content, diagrams: [diagram, ...stubs] },
  });
}

/** Reads a copied diagram back from model JSON, or `null` when the JSON holds none. */
export function diagramFromJson(json: string): Diagram | null {
  const opened = parseModelJson(json);
  const first = opened.ok ? opened.value.doc.content.diagrams[0] : undefined;
  return first === undefined || first.head === null ? null : first;
}

/**
 * An empty Method with its header for each Method the call blocks of `seq` call among
 * `diagrams`, with block ids unused in `content`.
 */
function methodStubs(
  seq: Seq,
  diagrams: ReadonlyMap<Id, Diagram>,
  content: Parameters<typeof contentIds>[0],
): Diagram[] {
  const called = [...new Set(calledMethods(seq))].flatMap((id) => {
    const method = diagrams.get(id);
    return method?.head?.kind === 'method' ? [{ id, head: method.head }] : [];
  });
  let block = largest(content, 'b');
  return called.map(({ id, head }) => {
    block += 1;
    return {
      id,
      head,
      body: { blocks: [{ id: `b${String(block)}`, kind: 'process', text: '' }], folds: [] },
    };
  });
}

/** The ids of the Methods the call blocks of a sequence call, inner ones included. */
function calledMethods(seq: Seq): Id[] {
  return seq.blocks.flatMap((block): Id[] => {
    switch (block.kind) {
      case 'process':
      case 'exit':
        return [];
      case 'call':
        return block.target.kind === 'local' ? [block.target.diagram] : [];
      case 'parallel':
        return block.branches.flatMap((branch) => calledMethods(branch.body));
      case 'if':
        return [...calledMethods(block.yes.body), ...calledMethods(block.no.body)];
      case 'case':
        return [
          ...block.arms.flatMap((arm) => calledMethods(arm.body)),
          ...(block.otherwise === null ? [] : calledMethods(block.otherwise.body)),
        ];
      case 'while':
      case 'doWhile':
      case 'for':
      case 'endless':
        return calledMethods(block.body);
    }
  });
}

/** The largest number used with an id prefix in a content (0 when there is none). */
function largest(content: Parameters<typeof contentIds>[0], prefix: string): number {
  let most = 0;
  for (const id of contentIds(content)) {
    const parsed = parseId(id);
    if (parsed?.prefix === prefix) {
      most = Math.max(most, parsed.number);
    }
  }
  return most;
}

/** Reads blocks back from model JSON, or `null` when the JSON is not a valid clip. */
export function clipFromJson(json: string): Clip | null {
  const opened = parseModelJson(json);
  if (!opened.ok) {
    return null;
  }
  return opened.value.doc.content.diagrams[0]?.body ?? null;
}

/**
 * The names of the Methods a clip's call blocks call, by Method id (`clipToJson`,
 * `diagramToJson`).
 */
export function clipNamesFromJson(json: string): ReadonlyMap<Id, string> {
  const opened = parseModelJson(json);
  const names = new Map<Id, string>();
  if (opened.ok) {
    for (const diagram of opened.value.doc.content.diagrams.slice(1)) {
      if (diagram.head?.kind === 'method') {
        names.set(diagram.id, headName(diagram.head));
      }
    }
  }
  return names;
}

/**
 * Text from another program: one process block per non-blank line, without the indent
 * (03-editor 3.3). `null` when there is no line. The ids are placeholders; pasting renews them.
 */
export function clipFromText(text: string): Clip | null {
  const lines = text
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '');
  if (lines.length === 0) {
    return null;
  }
  return {
    blocks: lines.map((line, i) => ({ id: `b${String(i + 1)}`, kind: 'process', text: line })),
    folds: [],
  };
}
