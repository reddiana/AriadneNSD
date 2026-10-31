// The characters a drawing uses: what the per-document subset font must contain (R-FMT-07, ADR-0026).
import type { Scene } from './scene';

/**
 * Returns the code points of all text in a scene, sorted ascending and without repeats.
 * Fixed words such as branch labels are included, in the locale they were drawn in.
 */
export function usedCodePoints(scene: Scene): ReadonlyArray<number> {
  const codePoints = new Set<number>();
  for (const element of scene.elements) {
    if (element.kind !== 'text') {
      continue;
    }
    for (const run of element.runs) {
      for (const character of run.text) {
        const codePoint = character.codePointAt(0);
        if (codePoint !== undefined) {
          codePoints.add(codePoint);
        }
      }
    }
  }
  return [...codePoints].sort((a, b) => a - b);
}
