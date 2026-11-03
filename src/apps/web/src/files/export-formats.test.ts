// Export as SVG without the model (R-EXP-02) and as PDF (R-EXP-03): names, types, where they go.

import { createDoc, renderDoc } from '@ariadne-nsd/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EditorHandle } from '../editor-contract';
import type { ShellMessageKey } from '../shell/messages';
import { shellMessage } from '../shell/messages';
import { exportPdf, exportSvg } from './export-command';
import { makePdf } from './export-pdf';
import { download } from './file-fallback';
import { exportFileName } from './file-name';

vi.mock('./file-fallback', () => ({ download: vi.fn() }));
// The glyph outlines of the bundled font: a square for every character (the font is not read).
vi.mock('@ariadne-nsd/fonts', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  readGlyphOutlines: () => ({
    unitsPerEm: 1000,
    glyphOf: () => ({
      advance: 500,
      commands: [
        { kind: 'move', x: 0, y: 0 },
        { kind: 'line', x: 400, y: 0 },
        { kind: 'line', x: 400, y: 700 },
        { kind: 'close' },
      ],
    }),
    notdef: { advance: 500, commands: [] },
  }),
}));

const latin1 = (bytes: Uint8Array): string => new TextDecoder('latin1').decode(bytes);

function host(options: { canWriteInPlace: boolean; fontFile?: () => Promise<Uint8Array> }) {
  const notices: string[] = [];
  const logs: string[] = [];
  return {
    notices,
    logs,
    host: {
      canWriteInPlace: options.canWriteInPlace,
      notify: (text: string, level: 'info' | 'warn') => notices.push(`${level}: ${text}`),
      text: (key: ShellMessageKey, values?: Readonly<Record<string, string>>) =>
        shellMessage('en', key, values),
      log: (detail: string) => logs.push(detail),
      fontFile: options.fontFile ?? (() => Promise.resolve(new Uint8Array())),
      languageTag: 'en-US',
    },
  };
}

const editor = {
  serializeImage: () => Promise.resolve('<svg xmlns="http://www.w3.org/2000/svg"/>'),
  rendering: () => renderDoc(createDoc()),
} as unknown as EditorHandle;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.mocked(download).mockReset();
});

describe('export file names', () => {
  it('name the export after the document with its own extension', () => {
    expect(exportFileName('예제.ns.svg', 'svg')).toBe('예제.svg');
    expect(exportFileName('old.ns', 'pdf')).toBe('old.pdf');
    expect(exportFileName('Sort.ns.svg', 'png')).toBe('Sort.png');
  });
});

describe('SVG export', () => {
  it('downloads the pure SVG named after the document', async () => {
    const { host: exportHost, notices } = host({ canWriteInPlace: false });
    await exportSvg(editor, 'Sort.ns.svg', exportHost);
    const [name, blob, type] = vi.mocked(download).mock.calls[0] ?? [];
    expect(name).toBe('Sort.svg');
    expect(type).toBe('image/svg+xml');
    expect(await (blob as Blob).text()).toBe('<svg xmlns="http://www.w3.org/2000/svg"/>');
    expect(notices).toEqual(['info: Exported “Sort.svg”.']);
  });

  it('in Chromium, asks where with a dialog filtered to SVG', async () => {
    const asked: unknown[] = [];
    vi.stubGlobal('window', {
      showSaveFilePicker: (options: unknown) => {
        asked.push(options);
        return Promise.reject(new DOMException('closed', 'AbortError'));
      },
    });
    const { host: exportHost, notices } = host({ canWriteInPlace: true });
    await exportSvg(editor, 'Sort.ns.svg', exportHost);
    expect(asked).toEqual([
      {
        types: [{ description: 'SVG', accept: { 'image/svg+xml': ['.svg'] } }],
        suggestedName: 'Sort.svg',
        id: 'ariadne-nsd',
      },
    ]);
    expect(notices).toEqual([]);
  });

  it('a failed SVG export is logged and the user is told', async () => {
    const failing = {
      serializeImage: () => Promise.reject(new Error('no font')),
    } as unknown as EditorHandle;
    const { host: exportHost, notices, logs } = host({ canWriteInPlace: false });
    await exportSvg(failing, 'Sort.ns.svg', exportHost);
    expect(notices).toEqual(['warn: Could not export the SVG.']);
    expect(logs).toEqual(['SVG export failed: Error: no font']);
  });
});

describe('PDF export', () => {
  it('downloads a PDF of the drawing named after the document', async () => {
    const { host: exportHost, notices } = host({ canWriteInPlace: false });
    await exportPdf(editor, 'Sort.ns.svg', exportHost);
    const [name, blob, type] = vi.mocked(download).mock.calls[0] ?? [];
    expect(name).toBe('Sort.pdf');
    expect(type).toBe('application/pdf');
    const text = await (blob as Blob).text();
    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(notices).toEqual(['info: Exported “Sort.pdf”.']);
  });

  it('uses Letter for a language of a Letter region and A4 otherwise', () => {
    const ttf = new Uint8Array();
    const rendering = renderDoc(createDoc());
    const pdf = (languageTag: string): string =>
      latin1(makePdf(rendering, ttf, { title: 'a', languageTag }));
    expect(pdf('en-US')).toContain('/MediaBox [0 0 612 792]');
    expect(pdf('ko-KR')).toContain('/MediaBox [0 0 595.28 841.89]');
  });

  it('a PDF export whose font cannot load says it failed', async () => {
    const {
      host: exportHost,
      notices,
      logs,
    } = host({
      canWriteInPlace: false,
      fontFile: () => Promise.reject(new Error('offline')),
    });
    await exportPdf(editor, 'Sort.ns.svg', exportHost);
    expect(download).not.toHaveBeenCalled();
    expect(notices).toEqual(['warn: Could not export the PDF.']);
    expect(logs).toEqual(['PDF export failed: Error: offline']);
  });
});
