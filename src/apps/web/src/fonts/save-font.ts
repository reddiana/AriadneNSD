// What saving needs to make the subset font of saved files (R-FMT-07, ADR-0026, ADR-0039):
// the hb-subset wasm and the bundled TTF. The editor asks once, on the first save, and cuts the
// font down to the characters of the document itself.

import type { Subsetter } from '@ariadne-nsd/fonts';
import ttfUrl from '@ariadne-nsd/fonts/assets/ariadne-nsd-block-regular.ttf?url';
import { createBrowserSubsetter } from '@ariadne-nsd/fonts/browser';

/** The subsetter and the TTF it cuts (the editor's `SaveFonts` answer). */
export type SaveFontParts = { readonly subsetter: Subsetter; readonly ttf: Uint8Array };

/**
 * Loads the wasm and the TTF (about 1 MB together) the first time it is called, and gives the
 * same parts afterwards. A failed load is tried again on the next call.
 */
export function createSaveFonts(): () => Promise<SaveFontParts> {
  let loading: Promise<SaveFontParts> | null = null;
  return () => {
    loading ??= load().catch((error: unknown) => {
      loading = null;
      throw error;
    });
    return loading;
  };
}

async function load(): Promise<SaveFontParts> {
  const [subsetter, ttf] = await Promise.all([createBrowserSubsetter(), fetchBytes(ttfUrl)]);
  return { subsetter, ttf };
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load ${url}: HTTP ${String(response.status)}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}
