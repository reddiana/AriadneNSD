// Export PNG command (R-EXP-01): where the PNG goes, at what scale, and what the user is told.

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EditorHandle } from '../editor-contract';
import type { ShellMessageKey } from '../shell/messages';
import { shellMessage } from '../shell/messages';
import { exportPng, pngScaleOf } from './export-command';
import { svgToPng } from './export-png';
import { download } from './file-fallback';

vi.mock('./export-png', () => ({ defaultPngScale: 2, svgToPng: vi.fn() }));
vi.mock('./file-fallback', () => ({ download: vi.fn() }));

const png = new Blob(['png'], { type: 'image/png' });

function run(options: { canWriteInPlace: boolean; args?: unknown }) {
  const notices: string[] = [];
  const logs: string[] = [];
  const editor = { serialize: () => Promise.resolve('<svg/>') } as unknown as EditorHandle;
  const done = exportPng(editor, 'Sort.ns.svg', options.args, {
    canWriteInPlace: options.canWriteInPlace,
    notify: (text, level) => notices.push(`${level}: ${text}`),
    text: (key: ShellMessageKey, values?: Readonly<Record<string, string>>) =>
      shellMessage('en', key, values),
    log: (detail) => logs.push(detail),
  });
  return { done, notices, logs };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.mocked(svgToPng).mockReset();
  vi.mocked(download).mockReset();
});

describe('PNG export scale', () => {
  it('T-0741 · R-EXP-01: is 2 unless the command gives a scale from above 0 to 8', () => {
    expect(pngScaleOf(undefined)).toBe(2);
    expect(pngScaleOf({ scale: 3 })).toBe(3);
    expect(pngScaleOf({ scale: 8 })).toBe(8);
    for (const scale of [0, -1, 9, Number.NaN, Number.POSITIVE_INFINITY, '3']) {
      expect(pngScaleOf({ scale })).toBe(2);
    }
    expect(pngScaleOf(null)).toBe(2);
    expect(pngScaleOf({})).toBe(2);
  });
});

describe('PNG export command', () => {
  it('T-0742 · R-EXP-01: without File System Access, downloads the PNG named after the document', async () => {
    vi.mocked(svgToPng).mockResolvedValue(png);
    const { done, notices } = run({ canWriteInPlace: false, args: { scale: 4 } });
    await done;
    expect(svgToPng).toHaveBeenCalledWith('<svg/>', 4);
    expect(download).toHaveBeenCalledWith('Sort.png', png, 'image/png');
    expect(notices).toEqual(['info: Exported “Sort.png”.']);
  });

  it('T-0743 · R-EXP-01: in Chromium, writes the PNG where the user chose', async () => {
    vi.mocked(svgToPng).mockResolvedValue(png);
    const written: unknown[] = [];
    const suggested: unknown[] = [];
    const handle = {
      name: 'chosen.png',
      createWritable: () =>
        Promise.resolve({
          write: (data: unknown) => {
            written.push(data);
            return Promise.resolve();
          },
          close: () => Promise.resolve(),
        }),
    };
    vi.stubGlobal('window', {
      showSaveFilePicker: (options: { suggestedName: string }) => {
        suggested.push(options.suggestedName);
        return Promise.resolve(handle);
      },
    });
    const { done, notices } = run({ canWriteInPlace: true });
    await done;
    expect(suggested).toEqual(['Sort.png']);
    expect(written).toEqual([png]);
    expect(download).not.toHaveBeenCalled();
    expect(notices).toEqual(['info: Exported “chosen.png”.']);
  });

  it('T-0744: closing the save dialog exports nothing and says nothing', async () => {
    vi.stubGlobal('window', {
      showSaveFilePicker: () => Promise.reject(new DOMException('closed', 'AbortError')),
    });
    const { done, notices } = run({ canWriteInPlace: true });
    await done;
    expect(svgToPng).not.toHaveBeenCalled();
    expect(notices).toEqual([]);
  });

  it('T-0745 · R-EXP-01: a failed export is logged and the user is told', async () => {
    vi.mocked(svgToPng).mockRejectedValue(new Error('no canvas'));
    const { done, notices, logs } = run({ canWriteInPlace: false });
    await done;
    expect(download).not.toHaveBeenCalled();
    expect(notices).toEqual(['warn: Could not export the PNG.']);
    expect(logs).toEqual(['PNG export failed: Error: no canvas']);
  });
});
