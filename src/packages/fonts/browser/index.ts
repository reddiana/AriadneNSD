// Vite resolves this import from this package, where `harfbuzzjs` is a dependency,
// and serves the wasm as a separate file (`?url`).
import subsetWasmUrl from 'harfbuzzjs/dist/harfbuzz-subset.wasm?url';

import { createSubsetter } from '../src/subset';
import type { Subsetter } from '../src/subset';

/**
 * Creates a subsetter in a browser built with Vite: fetches the hb-subset wasm and instantiates it.
 * Call it once (for example on the first save) and reuse the result.
 */
export async function createBrowserSubsetter(): Promise<Subsetter> {
  const response = await fetch(subsetWasmUrl);
  if (!response.ok) {
    throw new Error(`Could not load hb-subset wasm: HTTP ${String(response.status)}`);
  }
  return createSubsetter(new Uint8Array(await response.arrayBuffer()));
}
