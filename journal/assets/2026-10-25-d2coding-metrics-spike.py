# D2Coding 폭 표 스파이크 (레이아웃 설계 3단계, 2026-10-25)
# 재는 것:
#   1. 실을 문자 범위(한자 뺌, ADR-0034)에서 글자 폭(advance)이 몇 가지인지, 폭 표를 얼마나 작게 적을 수 있는지
#   2. 굵게(Bold)의 폭이 보통(Regular)과 같은지
#   3. 편집기에 실을 글꼴(범위 전체)과, 저장 파일에 넣을 글꼴 조각(문서에 쓰인 글자만)의 크기: TTF와 woff2
#   4. 글꼴에 없는 글자(한자, 이모지)를 어떻게 셀지 정하는 데 필요한 사실
#
# 쓰는 법: py -3.14 2026-10-25-d2coding-metrics-spike.py <D2Coding .ttc 경로> <결과 JSON 경로>
#   fonttools와 brotli가 필요하다 (pip install fonttools brotli)
#   D2Coding(OFL 1.1): https://github.com/naver/d2codingfont
import io, json, sys, glob, os
from fontTools.ttLib import TTCollection
from fontTools import subset

ttc_path, out_path = sys.argv[1], sys.argv[2]
coll = TTCollection(ttc_path)
def pick(style):
    for f in coll.fonts:
        name = f['name']
        if name.getDebugName(1) == 'D2Coding' and name.getDebugName(2) == style:
            return f
    raise SystemExit(f'{style} 없음: ' + ', '.join(f"{x['name'].getDebugName(1)}/{x['name'].getDebugName(2)}" for x in coll.fonts))
reg, bold = pick('Regular'), pick('Bold')
upm = reg['head'].unitsPerEm

# ADR-0034의 범위: 라틴 · 유럽 확장, 한글, 그리스, 키릴, 가나, 기호. 한자는 뺀다
RANGES = {
    'ASCII': (0x20, 0x7E), 'Latin-1': (0xA0, 0xFF), 'Latin Ext-A': (0x100, 0x17F), 'Latin Ext-B': (0x180, 0x24F),
    'Greek': (0x370, 0x3FF), 'Cyrillic': (0x400, 0x4FF), 'General Punct': (0x2000, 0x206F),
    'Arrows': (0x2190, 0x21FF), 'Math Ops': (0x2200, 0x22FF), 'Box Drawing': (0x2500, 0x257F),
    'Geometric': (0x25A0, 0x25FF), 'CJK Symbols': (0x3000, 0x303F), 'Hiragana': (0x3040, 0x309F),
    'Katakana': (0x30A0, 0x30FF), 'Hangul Jamo Compat': (0x3130, 0x318F), 'Hangul Syllables': (0xAC00, 0xD7A3),
    'Fullwidth': (0xFF00, 0xFFEF),
}
cmap_r, cmap_b = reg.getBestCmap(), bold.getBestCmap()
hmtx_r, hmtx_b = reg['hmtx'].metrics, bold['hmtx'].metrics

covered = {}          # 코드 포인트 → 폭(글꼴 단위)
per_range = {}
for name, (a, b) in RANGES.items():
    n = 0
    for cp in range(a, b + 1):
        g = cmap_r.get(cp)
        if g is None:
            continue
        covered[cp] = hmtx_r[g][0]; n += 1
    per_range[name] = {'covered': n, 'size': b - a + 1}

widths = {}
for w in covered.values():
    widths[w] = widths.get(w, 0) + 1

# 폭 표를 "같은 폭이 이어지는 구간"으로 적으면 몇 구간인가
runs = []
for cp in sorted(covered):
    w = covered[cp]
    if runs and runs[-1][1] == cp - 1 and runs[-1][2] == w:
        runs[-1][1] = cp
    else:
        runs.append([cp, cp, w])
# 기본 폭(가장 흔한 폭)을 빼고 적으면
default_w = max(widths, key=widths.get)
runs_non_default = [r for r in runs if r[2] != default_w]
table_json = json.dumps({'upm': upm, 'default': default_w, 'runs': runs_non_default}, separators=(',', ':'))

# 굵게의 폭이 보통과 같은가
diff_bold = [cp for cp in covered if cp in cmap_b and hmtx_b[cmap_b[cp]][0] != covered[cp]]
missing_bold = [cp for cp in covered if cp not in cmap_b]

# 글꼴에 없는 글자: 한자와 이모지
def has(cp): return cp in cmap_r
hanja = [0x4E00, 0x5927, 0x6F22, 0x5B57]      # 一 大 漢 字
emoji = [0x1F600, 0x2705, 0x1F680]             # 😀 ✅ 🚀
missing = {hex(cp): has(cp) for cp in hanja + emoji}

# 크기: 서브셋 TTF와 woff2
def subset_size(font_path_index, chars, flavor):
    opts = subset.Options()
    opts.flavor = flavor
    opts.layout_features = []          # 커닝 · 합자 끔 (ADR-0026)
    opts.hinting = False
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    f = TTCollection(ttc_path).fonts[font_path_index]
    s = subset.Subsetter(opts)
    s.populate(unicodes=chars)
    s.subset(f)
    buf = io.BytesIO()
    f.flavor = flavor
    f.save(buf)
    return len(buf.getvalue())

reg_index = coll.fonts.index(reg)
all_chars = sorted(covered)

# 문서 견본: 이 저장소의 docs/ 글에서 한글을 많이 쓰는 순서로 고른다
docs_text = ''
for p in glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'docs', '**', '*.md'), recursive=True):
    docs_text += open(p, encoding='utf-8').read()
freq = {}
for ch in docs_text:
    if 0xAC00 <= ord(ch) <= 0xD7A3:
        freq[ch] = freq.get(ch, 0) + 1
hangul_by_freq = [c for c, _ in sorted(freq.items(), key=lambda x: (-x[1], x[0]))]
ascii_chars = list(range(0x20, 0x7F))
samples = {
    '영어만 (ASCII)': ascii_chars,
    '한글 100자 + ASCII (작은 다이어그램)': ascii_chars + [ord(c) for c in hangul_by_freq[:100]],
    '한글 300자 + ASCII (보통)': ascii_chars + [ord(c) for c in hangul_by_freq[:300]],
    '한글 800자 + ASCII (아주 많음)': ascii_chars + [ord(c) for c in hangul_by_freq[:800]],
}
sizes = {}
for name, chars in samples.items():
    sizes[name] = {'ttf': subset_size(reg_index, chars, None), 'woff2': subset_size(reg_index, chars, 'woff2')}
bundle = {'ttf': subset_size(reg_index, all_chars, None), 'woff2': subset_size(reg_index, all_chars, 'woff2')}

# 13px에서의 폭 보기 (ADR-0026: 줄마다 폭을 더한 뒤 정수 px로 올림)
def px(text, size=13):
    units = sum(covered.get(ord(c), default_w) for c in text)
    from math import ceil
    return ceil(units * size / upm)
examples = {t: px(t) for t in ['n > 0', 'a[j] <= pivot && j < hi', '합계 ← 합계 + 값', 'i ← i + 1']}

result = {
    'font': f"{reg['name'].getDebugName(4)} / {reg['name'].getDebugName(5)}",
    'unitsPerEm': upm,
    'coveredCodepoints': len(covered),
    'perRange': per_range,
    'advanceWidths': {str(k): v for k, v in sorted(widths.items())},
    'runsAll': len(runs),
    'runsNonDefault': len(runs_non_default),
    'widthTableJsonBytes': len(table_json.encode()),
    'boldDifferentAdvance': len(diff_bold),
    'boldMissing': len(missing_bold),
    'hasGlyph': missing,
    'subsetSizes': sizes,
    'bundleAllCovered': bundle,
    'px13': examples,
}
json.dump(result, open(out_path, 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=2)
sys.stdout.reconfigure(encoding="utf-8"); print(json.dumps(result, ensure_ascii=False, indent=2))
