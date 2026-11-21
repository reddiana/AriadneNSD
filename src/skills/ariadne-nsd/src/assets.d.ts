// The module the bundle's build makes (vite.config.ts): the fonts' files as base64 of brotli.
declare module 'virtual:nsd-assets' {
  /** The block font's TTF, the source of the saved file's subset (ADR-0026, ADR-0039). */
  export const ttf: string;
  /** `harfbuzzjs/dist/harfbuzz-subset.wasm`, which the subsetter instantiates. */
  export const subsetWasm: string;
}
