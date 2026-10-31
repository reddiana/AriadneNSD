// What copied blocks look like on the system clipboard (03-editor 3.3): indented text for other
// programs, and the model JSON for AriadneNSD itself.
import type { Block, Clip, Locale } from '@ariadne-nsd/core';
import { createDoc, drawingMessage, parseModelJson, serializeModelJson } from '@ariadne-nsd/core';

/** The web custom clipboard format of copied blocks (Chromium's web custom formats). */
export const clipMimeType = 'web application/x-ariadne-nsd+json';

/** What is read from or written to a clipboard. */
export type ClipboardData = {
  readonly text: string | null;
  /** The model JSON of the blocks, in the custom format. */
  readonly json: string | null;
};

const indentUnit = '    ';

/**
 * The blocks as indented lines, so they read like pseudocode elsewhere. Control blocks put their
 * text on one line and their blocks below, one level in; If and Case branches get a label line.
 * A Do-While writes its condition after its blocks, as it is drawn. Empty blocks are left out.
 */
export function clipToText(clip: Clip, locale: Locale): string {
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
      case 'call':
        textLines(`${block.result} ${block.args}`.trim(), depth);
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
 * The blocks as model JSON: a document of one diagram holding them, in the file format
 * (01-file-format 3), so reading it back goes through the same checks as opening a file.
 */
export function clipToJson(clip: Clip): string {
  const doc = createDoc();
  return serializeModelJson({
    ...doc,
    content: { ...doc.content, diagrams: [{ id: 'd1', head: null, body: clip }] },
  });
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
