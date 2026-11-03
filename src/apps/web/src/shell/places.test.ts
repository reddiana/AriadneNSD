// The shell's side of the open · save modal (R-WEB-09, UX BS1).

import { describe, expect, it } from 'vitest';

import { createPlaces } from './places';

const actions = {
  documents: () => Promise.resolve([]),
  rename: () => Promise.resolve(),
  exportDocument: () => Promise.resolve(),
  remove: () => Promise.resolve(),
  exportAll: () => Promise.resolve(),
  importFiles: () => Promise.resolve(),
};

const request = {
  mode: 'open',
  side: 'computer',
  name: '',
  currentKey: null,
  isDownload: false,
} as const;

describe('open · save requests', () => {
  it('T-0961 · UX BS1: a request waits for the answer of the modal and tells the modal', async () => {
    const places = createPlaces(actions);
    let told = 0;
    const stop = places.onRequest(() => {
      told += 1;
    });
    expect(places.request()).toBeNull();
    const asked = places.ask(request);
    expect(places.request()).toMatchObject({ ...request, id: 1 });
    places.answer({ kind: 'computer' });
    expect(await asked).toEqual({ kind: 'computer' });
    expect(places.request()).toBeNull();
    expect(told).toBe(2);
    stop();
    places.answer(null);
    expect(told).toBe(2);
  });

  it('T-0962: a new request closes the one before it', async () => {
    const places = createPlaces(actions);
    const first = places.ask(request);
    const second = places.ask({ ...request, mode: 'save' });
    expect(await first).toBeNull();
    expect(places.request()).toMatchObject({ mode: 'save', id: 2 });
    places.answer({ kind: 'save', name: 'A' });
    expect(await second).toEqual({ kind: 'save', name: 'A' });
  });
});
