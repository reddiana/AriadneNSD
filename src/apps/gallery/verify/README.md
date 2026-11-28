# Gallery verification (dev tool, not shipped)

Runs the code text of the 17 algorithm diagrams in `packages/editor/src/gallery/` as real Python and
checks it against references (brute force, stdlib, independent implementations).

How it works:

1. `dump-specs.script.ts` (run through vitest) writes both locales' block specs to `specs.json`.
2. `transpile.py` turns the blocks into Python one-to-one: conditions, loop bounds, index
   arithmetic and calls are copied verbatim, nothing is re-interpreted.
3. `verify.py` runs them on fixed and random inputs, including edge cases, plus the expected
   values in the diagrams' comments (`# 18`, `# 25`, `# -9 47`, `# 92`), the red-black invariants
   after every insert, and that the Korean code equals the English code once comments are removed.

Run (needs Node with the repo's dependencies installed, and Python 3):

```sh
sh src/apps/gallery/verify/run.sh        # dump specs, then run everything
python src/apps/gallery/verify/verify.py -v   # only the checks, if specs.json is fresh
python src/apps/gallery/verify/verify.py MaxFlow   # one class
```

Assumptions the diagrams leave implicit (the harness supplies them): module-level shared state
(`visited`/`order`, `parent`/`rank`, the N-Queens sets, the segment tree's `a`/`tree`), a
`defaultdict`-of-`defaultdict(int)` capacity map for max flow with `s != t`, a non-empty
pattern for KMP, and for producer–consumer the buffer size `N`, `Semaphore`, `Lock`, `produce()`
and `consume()`. A parallel block's branches run as threads that are joined before the next block.
