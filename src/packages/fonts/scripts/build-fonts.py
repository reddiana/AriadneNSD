"""Build the bundled block font and its advance-width table from D2Coding.

Outputs (committed to the repository, regenerate only when the source font changes):
  assets/ariadne-nsd-mono-regular.ttf    subset TTF: the source for per-document subsets (ADR-0026)
  assets/ariadne-nsd-mono-regular.woff2  the same glyphs in one file, for other hosts (02-layout 2.2)
  assets/screen/…NN.woff2                the same glyphs in slices, for the web screen (ADR-0040)
  assets/OFL.txt                          the font license
  src/generated/advance-widths.ts         advance-width ranges (02-layout 2.1)
  src/generated/screen-slices.ts          the characters of each slice (CSS unicode-range)

Usage (from src/packages/fonts):
  py -3.14 -I scripts/build-fonts.py              download the pinned release and build
  py -3.14 -I scripts/build-fonts.py --zip X.zip  build from an already downloaded release zip
  py -3.14 -I scripts/build-fonts.py --slices-only     only cut the slices from the committed TTF
  py -3.14 -I scripts/build-fonts.py --recount-hangul  count the Hangul order again (see below)

Needs fontTools and brotli (pip install fonttools brotli).

The character set follows ADR-0034: D2Coding Regular without Han ideographs, limited to the
Unicode blocks below (the same blocks measured in journal/assets/2026-10-25-d2coding-metrics-spike.py).

D2Coding is licensed under OFL 1.1 with the Reserved Font Name "D2Coding". A subset is a
Modified Version under the OFL, so the output font is renamed (FAMILY_NAME below).
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import sys
import urllib.request
import zipfile
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTCollection, TTFont

RELEASE_URL = (
    'https://github.com/naver/d2-coding-font/releases/download/'
    'VER1.4.0/D2Coding-Ver1.4.0-20261003.zip'
)
RELEASE_SHA256 = '17e2da5e2879006eb725b87943f7988736ef8b6c9f8b84bc8e3bdbcb8dd46744'
TTC_MEMBER = 'D2Coding/D2Coding-Ver1.4.0-20261003.ttc'
LICENSE_MEMBER = 'OFL.txt'

FAMILY_NAME = 'AriadneNSD Mono'
POSTSCRIPT_NAME = 'AriadneNSDMono-Regular'
FILE_STEM = 'ariadne-nsd-mono-regular'

# ADR-0034: Latin and European extensions, Greek, Cyrillic, symbols, kana, Hangul. No Han.
UNICODE_BLOCKS = {
    'ASCII': (0x20, 0x7E),
    'Latin-1': (0xA0, 0xFF),
    'Latin Extended-A': (0x100, 0x17F),
    'Latin Extended-B': (0x180, 0x24F),
    'Greek': (0x370, 0x3FF),
    'Cyrillic': (0x400, 0x4FF),
    'General Punctuation': (0x2000, 0x206F),
    'Arrows': (0x2190, 0x21FF),
    'Mathematical Operators': (0x2200, 0x22FF),
    'Box Drawing': (0x2500, 0x257F),
    'Geometric Shapes': (0x25A0, 0x25FF),
    'CJK Symbols and Punctuation': (0x3000, 0x303F),
    'Hiragana': (0x3040, 0x309F),
    'Katakana': (0x30A0, 0x30FF),
    'Hangul Compatibility Jamo': (0x3130, 0x318F),
    'Hangul Syllables': (0xAC00, 0xD7A3),
    'Halfwidth and Fullwidth Forms': (0xFF00, 0xFFEF),
}

PACKAGE_DIR = Path(__file__).resolve().parent.parent
ASSETS_DIR = PACKAGE_DIR / 'assets'
SLICES_DIR = ASSETS_DIR / 'screen'
GENERATED_FILE = PACKAGE_DIR / 'src' / 'generated' / 'advance-widths.ts'
SLICES_FILE = PACKAGE_DIR / 'src' / 'generated' / 'screen-slices.ts'
REPO_DIR = PACKAGE_DIR.parent.parent.parent

# The screen slices (ADR-0040). The browser downloads only the slices whose characters are on
# screen. Slice 0 (Latin, punctuation, symbols) is loaded at start, the others when a character
# of theirs shows. Hangul syllables: the ones in HANGUL_ORDER_FILE by how often they are used, in
# small slices; all others in code point order, in larger slices.
SLICE_GROUPS: list[tuple[str, list[tuple[int, int]]]] = [
    ('Latin, punctuation, symbols', [
        (0x20, 0xFF), (0x2000, 0x206F), (0x2190, 0x22FF), (0x2500, 0x25FF), (0x27C0, 0x29FF),
    ]),
    ('Latin Extended, Greek, Cyrillic', [(0x100, 0x24F), (0x370, 0x4FF)]),
    ('CJK punctuation, kana, Hangul jamo, full width', [
        (0x3000, 0x30FF), (0x3130, 0x318F), (0xFF00, 0xFFEF),
    ]),
]
COMMON_HANGUL_PER_SLICE = 100
RARE_HANGUL_PER_SLICE = 400
# The Hangul syllables of the repository's Korean documents, most used first. Counted once
# (2026-11-03) and committed, so that a rebuild gives the same slices.
HANGUL_ORDER_FILE = PACKAGE_DIR / 'scripts' / 'hangul-order.txt'
HANGUL_SOURCES = ['docs', 'atelier', 'til', 'journal']


def read_release(zip_path: Path | None) -> tuple[bytes, bytes]:
    """Returns (ttc bytes, license bytes) from the pinned release zip."""
    if zip_path is None:
        print(f'Downloading {RELEASE_URL}')
        with urllib.request.urlopen(RELEASE_URL) as response:
            data = response.read()
    else:
        data = zip_path.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    if digest != RELEASE_SHA256:
        sys.exit(f'Release zip sha256 mismatch: {digest} (expected {RELEASE_SHA256})')
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        return archive.read(TTC_MEMBER), archive.read(LICENSE_MEMBER)


def pick_regular(collection: TTCollection) -> int:
    for index, font in enumerate(collection.fonts):
        name = font['name']
        if name.getDebugName(1) == 'D2Coding' and name.getDebugName(2) == 'Regular':
            return index
    sys.exit('D2Coding Regular not found in the collection')


def covered_code_points(font: TTFont) -> dict[int, int]:
    """Code point -> advance width (font units) for the characters we bundle."""
    cmap = font.getBestCmap()
    metrics = font['hmtx'].metrics
    covered: dict[int, int] = {}
    for first, last in UNICODE_BLOCKS.values():
        for code_point in range(first, last + 1):
            glyph = cmap.get(code_point)
            if glyph is not None:
                covered[code_point] = metrics[glyph][0]
    return covered


def advance_ranges(covered: dict[int, int]) -> tuple[int, list[list[int]]]:
    """Returns (default advance, ranges [first, last, advance] that differ from the default)."""
    counts: dict[int, int] = {}
    for advance in covered.values():
        counts[advance] = counts.get(advance, 0) + 1
    default = max(counts, key=lambda advance: counts[advance])
    runs: list[list[int]] = []
    for code_point in sorted(covered):
        advance = covered[code_point]
        if runs and runs[-1][1] == code_point - 1 and runs[-1][2] == advance:
            runs[-1][1] = code_point
        else:
            runs.append([code_point, code_point, advance])
    return default, [run for run in runs if run[2] != default]


def rename(font: TTFont, source_version: str) -> None:
    """Applies the new family name (OFL Reserved Font Name) on every platform."""
    names = font['name']
    for name_id in (1, 2, 3, 4, 6, 16, 17):
        names.removeNames(nameID=name_id)
    names.setName(FAMILY_NAME, 1, 3, 1, 0x409)
    names.setName('Regular', 2, 3, 1, 0x409)
    names.setName(f'{FAMILY_NAME} Regular; {source_version}', 3, 3, 1, 0x409)
    names.setName(f'{FAMILY_NAME} Regular', 4, 3, 1, 0x409)
    names.setName(POSTSCRIPT_NAME, 6, 3, 1, 0x409)
    names.setName(
        'Subset of D2Coding Regular (Han ideographs removed, no hinting, no layout features) '
        'for AriadneNSD.',
        10,
        3,
        1,
        0x409,
    )


def build_subset(ttc_bytes: bytes, font_index: int, code_points: list[int]) -> TTFont:
    font = TTCollection(io.BytesIO(ttc_bytes)).fonts[font_index]
    source_version = font['name'].getDebugName(5) or ''
    options = subset.Options()
    options.layout_features = []  # No kerning or ligatures (ADR-0026).
    options.hinting = False
    options.notdef_outline = True
    options.name_IDs = ['*']
    options.name_languages = ['*']
    options.drop_tables += ['FFTM']
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=code_points)
    subsetter.subset(font)
    rename(font, source_version)
    # Keep the source timestamps so that rebuilding gives the same bytes.
    font.recalcTimestamp = False
    return font


def save(font: TTFont, flavor: str | None) -> bytes:
    font.flavor = flavor
    buffer = io.BytesIO()
    font.save(buffer)
    return buffer.getvalue()


def write_table(default: int, units_per_em: int, ranges: list[list[int]], stats: str) -> None:
    rows = '\n'.join(f'    [0x{first:04x}, 0x{last:04x}, {advance}],' for first, last, advance in ranges)
    GENERATED_FILE.write_text(
        '// Generated by scripts/build-fonts.py. Do not edit.\n'
        f'// {stats}\n'
        "import type { AdvanceTable } from '../advance-table';\n"
        '\n'
        '/** Advance widths of the bundled block font (02-layout 2.1). */\n'
        'export const blockFontAdvances: AdvanceTable = {\n'
        f'  unitsPerEm: {units_per_em},\n'
        f'  defaultAdvance: {default},\n'
        '  ranges: [\n'
        f'{rows}\n'
        '  ],\n'
        '};\n',
        encoding='utf-8',
        newline='\n',
    )


def is_hangul(code_point: int) -> bool:
    return 0xAC00 <= code_point <= 0xD7A3


def recount_hangul() -> None:
    counts: dict[int, int] = {}
    for folder in HANGUL_SOURCES:
        for path in sorted((REPO_DIR / folder).rglob('*.md')):
            for char in path.read_text(encoding='utf-8'):
                if is_hangul(ord(char)):
                    counts[ord(char)] = counts.get(ord(char), 0) + 1
    ranked = sorted(counts, key=lambda c: (-counts[c], c))
    HANGUL_ORDER_FILE.write_text(
        ''.join(chr(c) for c in ranked) + '\n', encoding='utf-8', newline='\n'
    )
    print(f'{len(ranked)} syllables, {sum(counts.values())} in all -> {HANGUL_ORDER_FILE.name}')


def slice_code_points(covered: list[int]) -> list[tuple[str, list[int]]]:
    """The slices: a name and the code points of each. Every covered code point is in one."""
    rest = set(covered)
    slices: list[tuple[str, list[int]]] = []
    for name, ranges in SLICE_GROUPS:
        points = [c for c in covered if any(lo <= c <= hi for lo, hi in ranges)]
        rest -= set(points)
        slices.append((name, points))
    hangul = sorted(c for c in rest if is_hangul(c))
    rest -= set(hangul)
    if rest:
        raise SystemExit(f'Code points in no slice: {[hex(c) for c in sorted(rest)][:20]}')
    in_font = set(hangul)
    order = [ord(c) for c in HANGUL_ORDER_FILE.read_text(encoding='utf-8').strip()]
    common = [c for c in order if c in in_font]
    placed = set(common)
    # The rest in code point order, so each slice is a few long runs (a short unicode-range).
    rare = [c for c in hangul if c not in placed]
    for kind, codes, size in (
        ('common', common, COMMON_HANGUL_PER_SLICE),
        ('rare', rare, RARE_HANGUL_PER_SLICE),
    ):
        starts = list(range(0, len(codes), size))
        # A short last slice joins the one before: Vite would inline a tiny file into the script.
        if len(starts) > 1 and len(codes) - starts[-1] < size // 2:
            starts.pop()
        for at, start in enumerate(starts):
            end = starts[at + 1] if at + 1 < len(starts) else len(codes)
            slices.append((f'Hangul, {kind} {start + 1}-{end}', codes[start:end]))
    return slices


def unicode_range(points: list[int]) -> str:
    """The CSS unicode-range of sorted code points, runs joined: `U+20-7E, U+AC00`."""
    runs: list[list[int]] = []
    for c in points:
        if runs and runs[-1][1] == c - 1:
            runs[-1][1] = c
        else:
            runs.append([c, c])
    return ', '.join(f'U+{lo:X}' if lo == hi else f'U+{lo:X}-{hi:X}' for lo, hi in runs)


def cut_slice(ttf: bytes, points: list[int]) -> bytes:
    options = subset.Options()
    options.flavor = 'woff2'
    options.name_IDs = ['*']
    options.name_languages = ['*']
    options.notdef_outline = True
    options.layout_features = ['*']
    font = TTFont(io.BytesIO(ttf), recalcTimestamp=False)
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=points)
    subsetter.subset(font)
    return save(font, 'woff2')


def write_slices(ttf: bytes) -> None:
    covered = sorted(TTFont(io.BytesIO(ttf)).getBestCmap())
    slices = slice_code_points(covered)
    SLICES_DIR.mkdir(exist_ok=True)
    for old in SLICES_DIR.glob('*.woff2'):
        old.unlink()
    rows = []
    total = 0
    for index, (name, points) in enumerate(slices):
        file = f'{FILE_STEM}.{index:02d}.woff2'
        data = cut_slice(ttf, sorted(points))
        (SLICES_DIR / file).write_bytes(data)
        total += len(data)
        # Written short, so the list adds little to the first download: the characters of a
        # common Hangul slice, the first and last code point of a rare one (all syllables
        # between them that no common slice holds), the unicode-range of the others.
        if name.startswith('Hangul, common'):
            where = f"chars: '{''.join(chr(c) for c in points)}'"
        elif name.startswith('Hangul, rare'):
            where = f'from: 0x{min(points):X}, to: 0x{max(points):X}'
        else:
            where = f"unicodeRange: '{unicode_range(sorted(points))}'"
        rows.append(
            f'  // {index:02d}: {name}, {len(data) / 1024:.1f} KB\n'
            f"  {{ file: '{file}', count: {len(points)}, {where} }},"
        )
    SLICES_FILE.write_text(
        '// Generated by scripts/build-fonts.py. Do not edit.\n'
        "import type { ScreenSliceData } from '../screen-slice-types';\n"
        '\n'
        '/** The screen font in slices (ADR-0040), as written by the build. */\n'
        'export const screenSliceData: ReadonlyArray<ScreenSliceData> = [\n'
        + '\n'.join(rows)
        + '\n];\n',
        encoding='utf-8',
        newline='\n',
    )
    print(f'{len(slices)} screen slices, {total / 1024:.0f} KB in all')


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument('--zip', type=Path, help='an already downloaded release zip')
    parser.add_argument('--slices-only', action='store_true', help='only cut the screen slices')
    parser.add_argument('--recount-hangul', action='store_true', help='count the Hangul order')
    args = parser.parse_args()
    if args.recount_hangul:
        recount_hangul()
        return
    if args.slices_only:
        write_slices((ASSETS_DIR / f'{FILE_STEM}.ttf').read_bytes())
        return

    ttc_bytes, license_bytes = read_release(args.zip)
    collection = TTCollection(io.BytesIO(ttc_bytes))
    font_index = pick_regular(collection)
    source = collection.fonts[font_index]
    units_per_em = source['head'].unitsPerEm
    covered = covered_code_points(source)
    default, ranges = advance_ranges(covered)

    subset_font = build_subset(ttc_bytes, font_index, sorted(covered))
    ttf = save(subset_font, None)
    woff2 = save(subset_font, 'woff2')

    ASSETS_DIR.mkdir(exist_ok=True)
    (ASSETS_DIR / f'{FILE_STEM}.ttf').write_bytes(ttf)
    (ASSETS_DIR / f'{FILE_STEM}.woff2').write_bytes(woff2)
    (ASSETS_DIR / 'OFL.txt').write_bytes(license_bytes.replace(b'\r\n', b'\n'))

    widths: dict[int, int] = {}
    for advance in covered.values():
        widths[advance] = widths.get(advance, 0) + 1
    version = source['name'].getDebugName(5)
    stats = (
        f'Source: D2Coding Regular, {version}. '
        f'{len(covered)} code points, advances {json.dumps(widths)}.'
    )
    write_table(default, units_per_em, ranges, stats)
    write_slices(ttf)

    print(stats)
    print(f'{len(ranges)} non-default ranges, default advance {default}, unitsPerEm {units_per_em}')
    print(f'TTF {len(ttf) / 1024:.0f} KB, woff2 {len(woff2) / 1024:.0f} KB')


if __name__ == '__main__':
    main()
