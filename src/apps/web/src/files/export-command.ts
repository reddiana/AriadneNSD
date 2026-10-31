// The "Export ▸ PNG" command (R-EXP-01, 03-editor 5.1): saves the PNG next to the document
// (Chromium: save dialog) or downloads it (Firefox, Safari).

import type { EditorHandle } from '../editor-contract';
import type { ShellMessageKey } from '../shell/messages';
import { defaultPngScale, svgToPng } from './export-png';
import { download } from './file-fallback';
import { pngFileName } from './file-name';
import { pickPngToSave, writeToHandle } from './file-system-access';

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

/** Draws the saved SVG to a PNG and saves it. Reports the result in the status bar. */
export async function exportPng(
  editor: EditorHandle,
  documentName: string,
  args: unknown,
  host: {
    readonly canWriteInPlace: boolean;
    /** Tells the user in the status bar. */
    readonly notify: (text: string, level: 'info' | 'warn') => void;
    readonly text: (key: ShellMessageKey, values?: Readonly<Record<string, string>>) => string;
    readonly log: (detail: string) => void;
  },
): Promise<void> {
  const name = pngFileName(documentName);
  try {
    // Ask for the place first: the save dialog needs the click's user activation.
    const handle = host.canWriteInPlace ? await pickPngToSave(name) : null;
    if (host.canWriteInPlace && handle === null) {
      return;
    }
    const png = await svgToPng(await editor.serialize(), pngScaleOf(args));
    if (handle === null) {
      download(name, png, 'image/png');
    } else {
      await writeToHandle(handle, png);
    }
    host.notify(host.text('notice.exported', { name: handle?.name ?? name }), 'info');
  } catch (error) {
    host.log(`PNG export failed: ${String(error)}`);
    host.notify(host.text('notice.exportFailed'), 'warn');
  }
}
