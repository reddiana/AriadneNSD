import { tagToNumber } from './sfnt';
import { encodeWoff } from './woff';

/**
 * The exports of `harfbuzzjs/dist/harfbuzz-subset.wasm` that the subsetter calls.
 * Pointers and handles are numbers (wasm32).
 */
type HbSubsetExports = {
  readonly memory: { readonly buffer: ArrayBuffer };
  readonly malloc: (size: number) => number;
  readonly free: (pointer: number) => void;
  readonly hb_blob_create: (
    data: number,
    length: number,
    mode: number,
    userData: number,
    destroy: number,
  ) => number;
  readonly hb_blob_destroy: (blob: number) => void;
  readonly hb_blob_get_data: (blob: number, length: number) => number;
  readonly hb_blob_get_length: (blob: number) => number;
  readonly hb_face_create: (blob: number, index: number) => number;
  readonly hb_face_destroy: (face: number) => void;
  readonly hb_face_reference_blob: (face: number) => number;
  readonly hb_set_add: (set: number, value: number) => void;
  readonly hb_set_clear: (set: number) => void;
  readonly hb_set_invert: (set: number) => void;
  readonly hb_subset_input_create_or_fail: () => number;
  readonly hb_subset_input_destroy: (input: number) => void;
  readonly hb_subset_input_unicode_set: (input: number) => number;
  readonly hb_subset_input_set: (input: number, setType: number) => number;
  readonly hb_subset_input_set_flags: (input: number, flags: number) => void;
  readonly hb_subset_or_fail: (face: number, input: number) => number;
};

const REQUIRED_FUNCTIONS = [
  'malloc',
  'free',
  'hb_blob_create',
  'hb_blob_destroy',
  'hb_blob_get_data',
  'hb_blob_get_length',
  'hb_face_create',
  'hb_face_destroy',
  'hb_face_reference_blob',
  'hb_set_add',
  'hb_set_clear',
  'hb_set_invert',
  'hb_subset_input_create_or_fail',
  'hb_subset_input_destroy',
  'hb_subset_input_unicode_set',
  'hb_subset_input_set',
  'hb_subset_input_set_flags',
  'hb_subset_or_fail',
] as const;

// HarfBuzz constants (hb-blob.h, hb-subset.h).
const HB_MEMORY_MODE_WRITABLE = 2;
const HB_SUBSET_FLAGS_NO_HINTING = 0x1;
const HB_SUBSET_SETS_DROP_TABLE_TAG = 3;
const HB_SUBSET_SETS_NAME_ID = 4;
const HB_SUBSET_SETS_NAME_LANG_ID = 5;
const HB_SUBSET_SETS_LAYOUT_FEATURE_TAG = 6;

/**
 * Layout tables to drop on top of HarfBuzz's defaults: no kerning, no ligatures (02-layout 2.2).
 * Widths are summed advances, so the font must not shape text (ADR-0026).
 */
const DROPPED_LAYOUT_TABLES = ['GSUB', 'GPOS', 'GDEF', 'kern', 'morx', 'mort', 'kerx'] as const;

/** Makes subset fonts from a bundled TTF. Create one with `createSubsetter` and reuse it. */
export type Subsetter = {
  /**
   * Returns a TTF with only the glyphs for `codePoints` (plus .notdef): no hinting, no layout tables.
   * Code points the font lacks are skipped. Order and duplicates do not matter.
   * All name records are kept, so the family stays "AriadneNSD Mono" and the OFL notice stays in.
   */
  readonly subsetTtf: (ttf: Uint8Array, codePoints: Iterable<number>) => Uint8Array;
  /** `subsetTtf` wrapped in WOFF 1.0: the font a saved file embeds (ADR-0026, ADR-0039). */
  readonly subsetToWoff: (ttf: Uint8Array, codePoints: Iterable<number>) => Uint8Array;
};

/** The parts of the `WebAssembly` global used here. The packages' lib has no DOM types. */
type WebAssemblyApi = {
  readonly instantiate: (
    bytes: Uint8Array,
    imports: Record<string, never>,
  ) => Promise<{ readonly instance: { readonly exports: Record<string, unknown> } }>;
};

/**
 * Instantiates the hb-subset wasm (`harfbuzzjs/dist/harfbuzz-subset.wasm`) and returns a subsetter.
 * The caller loads the bytes: `@ariadne-nsd/fonts/node` in Node, `@ariadne-nsd/fonts/browser` in a browser.
 */
export async function createSubsetter(wasm: Uint8Array): Promise<Subsetter> {
  const { WebAssembly } = globalThis as unknown as { WebAssembly: WebAssemblyApi };
  const { instance } = await WebAssembly.instantiate(wasm, {});
  return subsetterFromExports(instance.exports);
}

/** Builds a subsetter from an already instantiated hb-subset wasm module's exports. */
export function subsetterFromExports(exports: Record<string, unknown>): Subsetter {
  const hb = checkExports(exports);
  // A WASI reactor module must run its initializer once before other calls.
  if (typeof exports._initialize === 'function') {
    (exports._initialize as () => void)();
  }
  const subsetTtf = (ttf: Uint8Array, codePoints: Iterable<number>): Uint8Array =>
    runSubset(hb, ttf, codePoints);
  return {
    subsetTtf,
    subsetToWoff: (ttf, codePoints) => encodeWoff(subsetTtf(ttf, codePoints)),
  };
}

function checkExports(exports: Record<string, unknown>): HbSubsetExports {
  const memory = exports.memory;
  if (typeof memory !== 'object' || memory === null || !('buffer' in memory)) {
    throw new Error('hb-subset wasm does not export its memory');
  }
  const missing = REQUIRED_FUNCTIONS.filter((name) => typeof exports[name] !== 'function');
  if (missing.length > 0) {
    throw new Error(`hb-subset wasm lacks exports: ${missing.join(', ')}`);
  }
  return exports as unknown as HbSubsetExports;
}

function runSubset(hb: HbSubsetExports, ttf: Uint8Array, codePoints: Iterable<number>): Uint8Array {
  const fontPointer = hb.malloc(ttf.byteLength);
  if (fontPointer === 0) {
    throw new Error('hb-subset wasm is out of memory');
  }
  // Read `memory.buffer` after every allocation: growing the memory replaces the buffer.
  new Uint8Array(hb.memory.buffer).set(ttf, fontPointer);
  const blob = hb.hb_blob_create(fontPointer, ttf.byteLength, HB_MEMORY_MODE_WRITABLE, 0, 0);
  const face = hb.hb_face_create(blob, 0);
  hb.hb_blob_destroy(blob);
  const input = hb.hb_subset_input_create_or_fail();
  try {
    if (input === 0) {
      throw new Error('hb_subset_input_create_or_fail failed');
    }
    configureInput(hb, input, codePoints);
    const subsetFace = hb.hb_subset_or_fail(face, input);
    if (subsetFace === 0) {
      throw new Error('hb_subset_or_fail failed: the font is not a valid TTF');
    }
    const result = hb.hb_face_reference_blob(subsetFace);
    const offset = hb.hb_blob_get_data(result, 0);
    const length = hb.hb_blob_get_length(result);
    const bytes = new Uint8Array(hb.memory.buffer).slice(offset, offset + length);
    hb.hb_blob_destroy(result);
    hb.hb_face_destroy(subsetFace);
    return bytes;
  } finally {
    if (input !== 0) {
      hb.hb_subset_input_destroy(input);
    }
    hb.hb_face_destroy(face);
    hb.free(fontPointer);
  }
}

function configureInput(hb: HbSubsetExports, input: number, codePoints: Iterable<number>): void {
  const unicodes = hb.hb_subset_input_unicode_set(input);
  for (const codePoint of codePoints) {
    hb.hb_set_add(unicodes, codePoint);
  }
  hb.hb_subset_input_set_flags(input, HB_SUBSET_FLAGS_NO_HINTING);

  const dropTables = hb.hb_subset_input_set(input, HB_SUBSET_SETS_DROP_TABLE_TAG);
  for (const tag of DROPPED_LAYOUT_TABLES) {
    hb.hb_set_add(dropTables, tagToNumber(tag));
  }
  hb.hb_set_clear(hb.hb_subset_input_set(input, HB_SUBSET_SETS_LAYOUT_FEATURE_TAG));

  // Keep every name record and language: the bundled font's names are already
  // "AriadneNSD Mono" (OFL Reserved Font Name) and carry the copyright and license.
  const nameIds = hb.hb_subset_input_set(input, HB_SUBSET_SETS_NAME_ID);
  hb.hb_set_clear(nameIds);
  hb.hb_set_invert(nameIds);
  const nameLanguages = hb.hb_subset_input_set(input, HB_SUBSET_SETS_NAME_LANG_ID);
  hb.hb_set_clear(nameLanguages);
  hb.hb_set_invert(nameLanguages);
}
