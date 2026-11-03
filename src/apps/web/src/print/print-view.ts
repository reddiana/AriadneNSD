// Printing (R-EXP-03, 06-web 1.5): a print-only view of the drawing cut into pages, shown only by
// `@media print`, then the browser's print dialog. The same pages as the PDF (core `paginate`).
// The drawing is the saved one inline; its font is the screen font the page already has.

import type { Pagination, Rendering } from '@ariadne-nsd/core';
import { paginate, paperForLanguage } from '@ariadne-nsd/core';

/** The class of the print view's root element (its own styles hide it on screen). */
export const printViewClass = 'ans-print';

/** The page number's color: `text.muted` of the default theme, like the PDF's. */
const pageNumberColor = '#5a6476';

/**
 * The print view's markup: a `<style>` for the paper and one section per page. Each page shows
 * its part of the drawing at print size (1px = 0.75pt) in the margins, numbered "n / N" when
 * there are several (the PDF's rules, 02-layout 5).
 */
export function printViewMarkup(rendering: Rendering, pagination: Pagination): string {
  const { pageWidth, pageHeight, margin, pointsPerPixel: scale, pages } = pagination;
  const { svg } = rendering;
  const style = [
    `@media screen { .${printViewClass} { display: none; } }`,
    '@media print {',
    `  @page { size: ${pt(pageWidth)} ${pt(pageHeight)}; margin: 0; }`,
    `  html, body { height: auto !important; overflow: visible !important; background: #ffffff !important; }`,
    `  body > :not(.${printViewClass}) { display: none !important; }`,
    `  .${printViewClass} { print-color-adjust: exact; -webkit-print-color-adjust: exact; }`,
    `  .ans-print-page { position: relative; width: ${pt(pageWidth)}; height: ${pt(pageHeight)}; overflow: hidden; break-after: page; }`,
    '  .ans-print-page:last-child { break-after: auto; }',
    `  .ans-print-page > svg { position: absolute; left: ${pt(margin)}; top: ${pt(margin)}; }`,
    `  .ans-print-number { position: absolute; left: 0; right: 0; bottom: ${pt(margin / 2 - 6)}; text-align: center; font: 9pt sans-serif; color: ${pageNumberColor}; }`,
    '}',
  ].join('\n');
  const sections = pages.map((page) => {
    // One px more on the right and bottom: the line on a cut shows on both pages (as the PDF).
    const width = page.width + 1;
    const height = page.height + 1;
    const number =
      pages.length > 1
        ? `<div class="ans-print-number">${String(page.number)} / ${String(pages.length)}</div>`
        : '';
    return (
      `<section class="ans-print-page">` +
      `<svg xmlns="http://www.w3.org/2000/svg" width="${pt(width * scale)}" height="${pt(height * scale)}" viewBox="${String(page.x)} ${String(page.y)} ${String(width)} ${String(height)}">` +
      `<rect x="${String(page.x)}" y="${String(page.y)}" width="${String(width)}" height="${String(height)}" fill="${svg.paper}"/>` +
      `${svg.content}</svg>${number}</section>`
    );
  });
  return `<style>\n${style}\n</style>${sections.join('')}`;
}

function pt(value: number): string {
  return `${String(Math.round(value * 100) / 100)}pt`;
}

/** The parts of the page the printer uses (a test passes its own). */
export type PrintTarget = {
  readonly document: Pick<Document, 'createElement' | 'body'>;
  readonly print: () => void;
  readonly addEventListener: (type: 'beforeprint' | 'afterprint', listener: () => void) => void;
  readonly removeEventListener: (type: 'beforeprint' | 'afterprint', listener: () => void) => void;
};

/** Prints the current drawing; also prepares the pages when the browser's own Print is used. */
export type Printer = {
  /**
   * File › Print…: puts the pages in place and opens the print dialog. `false` if the pages
   * could not be made (nothing is printed; the reason is logged).
   */
  readonly print: () => boolean;
  readonly dispose: () => void;
};

/**
 * Makes the printer. `rendering` gives the document's drawing at the moment of printing;
 * `languageTag` picks the paper (A4, or Letter where that is the usual paper).
 */
export function createPrinter(
  target: PrintTarget,
  rendering: () => Rendering | null,
  languageTag: string,
  log: (detail: string) => void,
): Printer {
  let view: HTMLElement | null = null;
  const remove = (): void => {
    view?.remove();
    view = null;
  };
  const prepare = (): boolean => {
    remove();
    try {
      const current = rendering();
      if (current === null) {
        return false;
      }
      const element = target.document.createElement('div');
      element.className = printViewClass;
      element.setAttribute('aria-hidden', 'true');
      element.innerHTML = printViewMarkup(
        current,
        paginate(current.layout, paperForLanguage(languageTag)),
      );
      target.document.body.append(element);
      view = element;
      return true;
    } catch (error) {
      log(`Preparing the print view failed: ${String(error)}`);
      return false;
    }
  };
  // The browser's own Print (its menu, or Ctrl+P outside the canvas) prints the same pages.
  const beforePrint = (): void => {
    if (view === null) {
      prepare();
    }
  };
  target.addEventListener('beforeprint', beforePrint);
  target.addEventListener('afterprint', remove);
  return {
    print: () => {
      if (!prepare()) {
        return false;
      }
      target.print();
      return true;
    },
    dispose: () => {
      target.removeEventListener('beforeprint', beforePrint);
      target.removeEventListener('afterprint', remove);
      remove();
    },
  };
}
