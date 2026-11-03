// The "Export ▸" commands (03-editor 5.1): PNG (R-EXP-01), SVG without the model (R-EXP-02) and
// PDF (R-EXP-03). Each saves next to the document (Chromium: save dialog) or downloads
// (Firefox, Safari).

import type { EditorHandle } from '../editor-contract';
import type { ShellMessageKey } from '../shell/messages';
import { defaultPngScale, svgToPng } from './export-png';
import { download } from './file-fallback';
import { exportFileName } from './file-name';
import type { ExportKind } from './file-system-access';
import { pickExportToSave, writeToHandle } from './file-system-access';

/** The command's arguments: `{ scale }` (R-EXP-01 "배율 선택"). Default 2. */
export function pngScaleOf(args: unknown): number {
  if (typeof args === 'object' && args !== null && 'scale' in args) {
    const { scale } = args;
    if (typeof scale === 'number' && Number.isFinite(scale) && scale > 0 && scale <= 8) {
      return scale;
    }
  }
  return defaultPngScale;
}

/** What an export needs from the shell. */
export type ExportHost = {
  readonly canWriteInPlace: boolean;
  /** Tells the user in the status bar. */
  readonly notify: (text: string, level: 'info' | 'warn') => void;
  readonly text: (key: ShellMessageKey, values?: Readonly<Record<string, string>>) => string;
  readonly log: (detail: string) => void;
};

/** What a PDF export needs on top: the bundled TTF (its outlines draw the text) and the paper. */
export type PdfHost = ExportHost & {
  readonly fontFile: () => Promise<Uint8Array>;
  /** The browser's language (`navigator.language`): A4, or Letter where that is the usual paper. */
  readonly languageTag: string;
};

const mediaTypes: Readonly<Record<ExportKind, string>> = {
  png: 'image/png',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
};

const failures: Readonly<Record<ExportKind, ShellMessageKey>> = {
  png: 'notice.exportFailed',
  svg: 'notice.exportSvgFailed',
  pdf: 'notice.exportPdfFailed',
};

/**
 * Asks where to save (the save dialog needs the click's user activation, so before the work),
 * makes the file and saves or downloads it. Reports the result in the status bar.
 */
async function exportAs(
  kind: ExportKind,
  documentName: string,
  make: () => Promise<Blob>,
  host: ExportHost,
): Promise<void> {
  const name = exportFileName(documentName, kind);
  try {
    const handle = host.canWriteInPlace ? await pickExportToSave(name, kind) : null;
    if (host.canWriteInPlace && handle === null) {
      return;
    }
    const blob = await make();
    if (handle === null) {
      download(name, blob, mediaTypes[kind]);
    } else {
      await writeToHandle(handle, blob);
    }
    host.notify(host.text('notice.exported', { name: handle?.name ?? name }), 'info');
  } catch (error) {
    host.log(`${kind.toUpperCase()} export failed: ${String(error)}`);
    host.notify(host.text(failures[kind]), 'warn');
  }
}

/** Draws the saved SVG to a PNG and saves it (R-EXP-01). */
export async function exportPng(
  editor: EditorHandle,
  documentName: string,
  args: unknown,
  host: ExportHost,
): Promise<void> {
  await exportAs(
    'png',
    documentName,
    async () => svgToPng(await editor.serialize(), pngScaleOf(args)),
    host,
  );
}

/** Saves the drawing as a pure SVG, without the model (R-EXP-02). */
export async function exportSvg(
  editor: EditorHandle,
  documentName: string,
  host: ExportHost,
): Promise<void> {
  await exportAs(
    'svg',
    documentName,
    async () => new Blob([await editor.serializeImage()], { type: mediaTypes.svg }),
    host,
  );
}

/**
 * Saves the drawing as a vector PDF cut into pages (R-EXP-03). The PDF writer and the glyph
 * reader are loaded only now, so they are not part of the first download (06-web 5).
 */
export async function exportPdf(
  editor: EditorHandle,
  documentName: string,
  host: PdfHost,
): Promise<void> {
  await exportAs(
    'pdf',
    documentName,
    async () => {
      const [{ makePdf }, ttf] = await Promise.all([import('./export-pdf'), host.fontFile()]);
      const bytes = makePdf(editor.rendering(), ttf, {
        title: exportFileName(documentName, 'pdf').replace(/\.pdf$/, ''),
        languageTag: host.languageTag,
      });
      return new Blob([bytes], { type: mediaTypes.pdf });
    },
    host,
  );
}
