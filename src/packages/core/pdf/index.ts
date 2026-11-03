// @ariadne-nsd/core/pdf: the PDF writer (R-EXP-03), its own entry so a shell can load it only
// when the user exports a PDF. Through the main index a bundler would put it in the first
// download, since the main index is shared with the lazy chunk (06-web 5).
export type { PdfInfo } from '../src/export/pdf';
export { writePdf } from '../src/export/pdf';
