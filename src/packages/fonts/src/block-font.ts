import type { AdvanceTable } from './advance-table';
import { blockFontAdvances } from './generated/advance-widths';

/** Describes one bundled font: its CSS family name, files, and advance widths. */
export type BundledFont = {
  /** The family name inside the font files. Not "D2Coding": that is an OFL Reserved Font Name. */
  readonly familyName: string;
  readonly weight: number;
  /**
   * Paths of the font files, relative to the package root and importable as
   * `@ariadne-nsd/fonts/<path>` (package exports).
   */
  readonly files: {
    /** Subset TTF: the source for the per-document subset in saved files (ADR-0026, ADR-0039). */
    readonly ttf: string;
    /** The editor screen font (02-layout 2.2). */
    readonly woff2: string;
  };
  readonly advances: AdvanceTable;
};

/**
 * The default block font: D2Coding Regular without Han ideographs (ADR-0034).
 * Bold has the same advances, so this table also measures bold text (02-layout 2.1).
 */
export const blockFont: BundledFont = {
  familyName: 'AriadneNSD Mono',
  weight: 400,
  files: {
    ttf: 'assets/ariadne-nsd-mono-regular.ttf',
    woff2: 'assets/ariadne-nsd-mono-regular.woff2',
  },
  advances: blockFontAdvances,
};
