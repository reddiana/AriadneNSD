// The font parts saving needs (R-FMT-07, ADR-0039): loaded once on demand, tried again after a
// failure.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createBrowserSubsetter } from '@ariadne-nsd/fonts/browser';

import { createSaveFonts } from './save-font';

vi.mock('@ariadne-nsd/fonts/browser', () => ({
  createBrowserSubsetter: vi.fn(),
}));

const subsetter = { subset: vi.fn() };
const fetchMock = vi.fn<typeof fetch>();

function answer(status: number, bytes: number[] = []): Response {
  return new Response(status === 200 ? new Uint8Array(bytes) : null, { status });
}

beforeEach(() => {
  vi.mocked(createBrowserSubsetter)
    .mockReset()
    .mockResolvedValue(subsetter as never);
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('save fonts', () => {
  it('T-0802: loads nothing until asked, then loads the subsetter and the TTF once', async () => {
    fetchMock.mockResolvedValue(answer(200, [0, 1, 0, 0]));
    const saveFonts = createSaveFonts();
    expect(fetchMock).not.toHaveBeenCalled();

    const [first, second] = await Promise.all([saveFonts(), saveFonts()]);
    const third = await saveFonts();

    expect(first.subsetter).toBe(subsetter);
    expect([...first.ttf]).toEqual([0, 1, 0, 0]);
    expect(second).toBe(first);
    expect(third).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(createBrowserSubsetter).toHaveBeenCalledTimes(1);
  });

  it('T-0803: fails when the TTF cannot be fetched, and tries again on the next call', async () => {
    fetchMock.mockResolvedValueOnce(answer(404)).mockResolvedValueOnce(answer(200, [7]));
    const saveFonts = createSaveFonts();

    await expect(saveFonts()).rejects.toThrow('HTTP 404');
    const parts = await saveFonts();

    expect([...parts.ttf]).toEqual([7]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
