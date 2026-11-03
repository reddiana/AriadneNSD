// The types of the screen font slices (ADR-0040), apart so the generated list can import them.

/** One slice as the build writes it. `count` is how many characters it holds. */
export type ScreenSliceData = { readonly file: string; readonly count: number } & (
  | { readonly unicodeRange: string }
  /** Common Hangul syllables: the characters themselves. */
  | { readonly chars: string }
  /** Rare Hangul syllables: every syllable from `from` to `to` that no `chars` slice holds. */
  | { readonly from: number; readonly to: number }
);

/** One slice of the screen font: a file in `assets/screen/` and the characters it holds. */
export type ScreenSlice = {
  readonly file: string;
  readonly unicodeRange: string;
  readonly count: number;
};
