"""Build the bundled block font and its advance-width table from D2Coding.

Outputs (committed to the repository, regenerate only when the source font changes):
  assets/ariadne-nsd-mono-regular.ttf    subset TTF: the source for per-document subsets (ADR-0026)
  assets/ariadne-nsd-mono-regular.woff2  the same glyphs for the editor screen (02-layout 2.2)
  assets/OFL.txt                          the font license
  src/generated/advance-widths.ts         advance-width ranges (02-layout 2.1)

Usage (from src/packages/fonts):
  py -3.14 -I scripts/build-fonts.py              download the pinned release and build
  py -3.14 -I scripts/build-fonts.py --zip X.zip  build from an already downloaded release zip

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
GENERATED_FILE = PACKAGE_DIR / 'src' / 'generated' / 'advance-widths.ts'


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


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument('--zip', type=Path, help='an already downloaded release zip')
    args = parser.parse_args()

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

    print(stats)
    print(f'{len(ranges)} non-default ranges, default advance {default}, unitsPerEm {units_per_em}')
    print(f'TTF {len(ttf) / 1024:.0f} KB, woff2 {len(woff2) / 1024:.0f} KB')


if __name__ == '__main__':
    main()
