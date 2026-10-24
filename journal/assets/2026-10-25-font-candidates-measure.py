# 번들할 글꼴 후보를 잰다 (시안 M29): 한글 범위, 라틴 · 기호 범위, 고정폭인지, woff2로 실을 때의 크기.
# 시안 페이지에 넣을 견본 글자만 추린 woff2(base64)도 만든다.
#
# 쓰는 법: python 2026-10-25-font-candidates-measure.py <IBMPlexSansKR-Regular.ttf 경로> <결과 JSON 경로>
#   IBM Plex Sans KR은 https://github.com/google/fonts/raw/main/ofl/ibmplexsanskr/IBMPlexSansKR-Regular.ttf
#   fonttools와 brotli가 필요하다 (pip install fonttools brotli)
#   나머지 후보는 이 컴퓨터에 깔린 파일을 쓴다(C:/Windows/Fonts, 사용자 글꼴 폴더)
import base64, io, json, os, sys
from fontTools.ttLib import TTFont, TTCollection
from fontTools.varLib import instancer
from fontTools import subset

plex_path, out_path = sys.argv[1], sys.argv[2]
WIN = 'C:/Windows/Fonts/'
USER = os.path.expanduser('~/AppData/Local/Microsoft/Windows/Fonts/')   # 사용자가 깐 글꼴(D2Coding)

def load(c):
    if c.get('ttc'):
        coll = TTCollection(c['path'])
        f = next(x for x in coll.fonts if x['name'].getDebugName(2) == 'Regular')
    else:
        f = TTFont(c['path'])
    if 'fvar' in f:
        f = instancer.instantiateVariableFont(f, {'wght': 400})
    return f

CANDIDATES = [
    {'id': 'pretendard', 'name': 'Pretendard', 'path': WIN + 'Pretendard-Regular.ttf'},
    {'id': 'noto', 'name': 'Noto Sans KR', 'path': WIN + 'NotoSansKR-VF.ttf'},
    {'id': 'plex', 'name': 'IBM Plex Sans KR', 'path': plex_path},
    {'id': 'nanum', 'name': '나눔고딕', 'path': WIN + 'NanumGothic.ttf'},
    {'id': 'd2', 'name': 'D2Coding', 'path': USER + 'D2Coding-Ver1.3.2-20180524-all.ttc', 'ttc': True},
]

KSX = ''.join(bytes([a, b]).decode('euc-kr') for a in range(0xB0, 0xC9) for b in range(0xA1, 0xFF))
ALL_HANGUL = ''.join(chr(c) for c in range(0xAC00, 0xD7A4))
JAMO = ''.join(chr(c) for c in range(0x3131, 0x3164))           # ㄱ ~ ㅣ
ASCII = ''.join(chr(c) for c in range(0x20, 0x7F))
SYMBOLS = '←→↑↓≤≥≠×÷·…“”‘’–—°±√∞'                                 # 의사 코드에 자주 쓰는 기호
# 시안 M29의 그림에 쓰는 글자 (블록 글자, 헷갈리기 쉬운 글자, 2,350자에 없는 낱말)
SAMPLE = ('p ← partition(a, lo, hi) 피벗보다 작은 값을 왼쪽으로 옮긴다 while lo < hi if a[i] ≤ pivot 참 거짓 '
          'swap(a[i], a[j]) i ← i + 1 j ← j − 1 return p 0O 1lI| {}[]() ≠ ‘’ “” 똠얌꿍 주문 받기 쌰 햏 뷁 '
          '블록 글꼴 이 줄의 폭 한글 영문 섞인 글자 Pretendard Noto Sans KR IBM Plex 나눔고딕 D2Coding')

def woff2(font, text=None):
    f = TTFont(io.BytesIO(save(font)))
    if text is not None:
        opt = subset.Options(); opt.layout_features = []; opt.name_IDs = ['*']; opt.notdef_outline = True
        s = subset.Subsetter(opt); s.populate(text=text); s.subset(f)
    f.flavor = 'woff2'
    return save(f)

def save(f):
    b = io.BytesIO(); f.save(b); return b.getvalue()

result = []
for c in CANDIDATES:
    f = load(c)
    cmap = f.getBestCmap()
    has = lambda s: sum(1 for ch in s if ord(ch) in cmap)
    hmtx = f['hmtx'].metrics
    adv = lambda ch: hmtx[cmap[ord(ch)]][0] if ord(ch) in cmap else None
    upm = f['head'].unitsPerEm
    latin_w = {adv(ch) for ch in 'il0MW'}
    r = {
        'id': c['id'], 'name': c['name'],
        'hangul': has(ALL_HANGUL), 'ksx': has(KSX), 'jamo': has(JAMO), 'ascii': has(ASCII),
        'symbols_missing': ''.join(ch for ch in SYMBOLS if ord(ch) not in cmap),
        'mono_latin': len(latin_w) == 1,
        'hangul_per_latin': round(adv('가') / adv('a'), 2) if adv('a') else None,
        'upm': upm,
        'kb_full': round(len(woff2(f)) / 1024),
        'kb_ksx': round(len(woff2(f, ASCII + SYMBOLS + JAMO + KSX)) / 1024),
        'kb_all_hangul': round(len(woff2(f, ASCII + SYMBOLS + JAMO + ALL_HANGUL)) / 1024),
        'sample_b64': base64.b64encode(woff2(f, SAMPLE + ASCII)).decode(),
        # 2,350자로 추렸을 때 견본에서 남는 글자만 (빠진 글자는 기기의 글꼴로 그려지는 모습을 보이려고)
        'sample_ksx_b64': base64.b64encode(woff2(f, ''.join(ch for ch in SAMPLE + ASCII if ch in ASCII + SYMBOLS + KSX or not '가' <= ch <= '힣'))).decode(),
        'missing_in_ksx': ''.join(sorted({ch for ch in SAMPLE if '가' <= ch <= '힣' and ch not in KSX})),
    }
    result.append(r)
    print({k: (len(v) if k.endswith('b64') else v) for k, v in r.items()})

json.dump(result, open(out_path, 'w', encoding='utf8'), ensure_ascii=False)
