// The print view (R-EXP-03): the pages of the drawing, shown only when printing.

import type { Block } from '@ariadne-nsd/core';
import { createDoc, paginate, papers, renderDoc } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import type { PrintTarget } from './print-view';
import { createPrinter, printViewMarkup } from './print-view';

function longDoc(count: number) {
  const doc = createDoc();
  const blocks: Block[] = Array.from({ length: count }, (_, index) => ({
    id: `b${String(index + 1)}`,
    kind: 'process',
    text: `step ${String(index + 1)}`,
  }));
  const [diagram] = doc.content.diagrams;
  if (diagram === undefined) {
    throw new Error('a new document has a diagram');
  }
  return {
    ...doc,
    content: { ...doc.content, diagrams: [{ ...diagram, body: { blocks, folds: [] } }] },
  };
}

describe('printViewMarkup', () => {
  it('T-1002: has one section per page with that part of the drawing at print size', () => {
    const rendering = renderDoc(longDoc(120));
    const pagination = paginate(rendering.layout, papers.a4);
    const markup = printViewMarkup(rendering, pagination);
    expect(markup.match(/<section class="ans-print-page">/g)).toHaveLength(pagination.pages.length);
    const [first] = pagination.pages;
    expect(markup).toContain(
      `viewBox="0 0 ${String((first?.width ?? 0) + 1)} ${String((first?.height ?? 0) + 1)}"`,
    );
    expect(markup).toContain(`width="${String(((first?.width ?? 0) + 1) * 0.75)}pt"`);
    expect(markup.split(rendering.svg.content)).toHaveLength(pagination.pages.length + 1);
  });

  it('T-1003: sets the paper and hides the page around it only when printing', () => {
    const rendering = renderDoc(createDoc());
    const markup = printViewMarkup(rendering, paginate(rendering.layout, papers.letter));
    expect(markup).toContain('@page { size: 612pt 792pt; margin: 0; }');
    expect(markup).toContain('@media screen { .ans-print { display: none; } }');
    expect(markup).toContain('body > :not(.ans-print) { display: none !important; }');
  });

  it('T-1004: numbers the pages only when there are several', () => {
    const one = renderDoc(createDoc());
    expect(printViewMarkup(one, paginate(one.layout, papers.a4))).not.toContain(
      'ans-print-number"',
    );
    const many = renderDoc(longDoc(120));
    const pagination = paginate(many.layout, papers.a4);
    const total = String(pagination.pages.length);
    expect(printViewMarkup(many, pagination)).toContain(
      `<div class="ans-print-number">1 / ${total}</div>`,
    );
  });
});

/** A page that records what the printer does. */
function fakeTarget() {
  const listeners = new Map<string, () => void>();
  const children: { className: string; innerHTML: string; removed: boolean }[] = [];
  let prints = 0;
  const fakeDocument = {
    createElement: () => {
      const element = {
        className: '',
        innerHTML: '',
        removed: false,
        setAttribute: () => undefined,
        remove: () => {
          element.removed = true;
        },
      };
      children.push(element);
      return element;
    },
    body: { append: () => undefined },
  };
  const target: PrintTarget = {
    document: fakeDocument as unknown as PrintTarget['document'],
    print: () => {
      prints += 1;
    },
    addEventListener: (type, listener) => listeners.set(type, listener),
    removeEventListener: (type) => listeners.delete(type),
  };
  return { target, listeners, children, prints: () => prints };
}

describe('createPrinter', () => {
  it('T-1005: puts the pages in place, opens the print dialog and takes them away after', () => {
    const page = fakeTarget();
    const printer = createPrinter(
      page.target,
      () => renderDoc(createDoc()),
      'ko-KR',
      () => undefined,
    );
    expect(printer.print()).toBe(true);
    expect(page.prints()).toBe(1);
    expect(page.children[0]?.className).toBe('ans-print');
    expect(page.children[0]?.innerHTML).toContain('595.28pt 841.89pt');
    page.listeners.get('afterprint')?.();
    expect(page.children[0]?.removed).toBe(true);
  });

  it("T-1006: prepares the same pages when the browser's own Print is used", () => {
    const page = fakeTarget();
    createPrinter(
      page.target,
      () => renderDoc(createDoc()),
      'en-US',
      () => undefined,
    );
    page.listeners.get('beforeprint')?.();
    expect(page.children).toHaveLength(1);
    expect(page.children[0]?.innerHTML).toContain('612pt 792pt');
    expect(page.prints()).toBe(0);
  });

  it('T-1007: prints nothing without a drawing and reports a failure', () => {
    const page = fakeTarget();
    const logs: string[] = [];
    expect(
      createPrinter(
        page.target,
        () => null,
        'en',
        (line) => logs.push(line),
      ).print(),
    ).toBe(false);
    const broken = createPrinter(
      page.target,
      () => {
        throw new Error('no layout');
      },
      'en',
      (line) => logs.push(line),
    );
    expect(broken.print()).toBe(false);
    expect(page.prints()).toBe(0);
    expect(logs).toEqual(['Preparing the print view failed: Error: no layout']);
  });

  it('T-1008: stops listening when disposed', () => {
    const page = fakeTarget();
    createPrinter(
      page.target,
      () => renderDoc(createDoc()),
      'en',
      () => undefined,
    ).dispose();
    expect(page.listeners.size).toBe(0);
  });
});
