// The large document of AT-05 (QA-07): `count` process blocks in one diagram. The check mode
// (`?perf`) opens it, and so does the browser test T-0007, so both measure the same document.
// No imports: the browser tests (tsconfig.node.json) read this file too.

/** The id of the `index`-th block (from 1) of the large document. */
export function largeDocumentBlockId(index: number): string {
  return `b${String(index)}`;
}

/** The text of the `index`-th block (from 1) of the large document. */
export function largeDocumentBlockText(index: number): string {
  return `step ${String(index)}`;
}

/** A saved file with `count` process blocks, written like the app writes the model. */
export function largeDocumentFile(count: number): string {
  const body = Array.from({ length: count }, (_, index) => ({
    id: largeDocumentBlockId(index + 1),
    kind: 'process',
    text: largeDocumentBlockText(index + 1),
  }));
  const model = {
    format: 'ariadne-nsd',
    version: 1,
    settings: { textKind: 'plain', theme: 'default', headStyle: 'shape' },
    diagrams: [{ id: 'd1', body }],
    view: { folded: [], opened: [], bands: true, resultSymbol: '←' },
  };
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">',
    '  <metadata>',
    `    <ans:document xmlns:ans="https://github.com/reddiana/AriadneNSD" version="1"><![CDATA[${JSON.stringify(model)}]]></ans:document>`,
    '  </metadata>',
    '</svg>',
  ].join('\n');
}
