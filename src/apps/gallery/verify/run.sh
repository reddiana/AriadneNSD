#!/bin/sh
# Dumps the gallery specs with vitest, then runs the Python checks. Run from src/ (or anywhere).
set -e
here="$(cd "$(dirname "$0")" && pwd)"
(cd "$here/../../../packages/editor" && npx vitest run --config ../../apps/gallery/verify/vitest.config.ts >/dev/null)
python "$here/verify.py" "$@"
