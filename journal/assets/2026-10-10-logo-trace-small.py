"""작은 크기(16~24px)용: 같은 벽화 조각에서 머리와 얼굴의 큰 덩어리와 눈만 남긴다.

usage: small2.py <image> <out.svg>
자르는 자리와 좌표 단위는 fresco2.py와 같다 (한 변 382 단위).
"""
import sys
import cv2
import numpy as np

src, out = sys.argv[1], sys.argv[2]
X0, Y0, SRC, U, S = 1215, 48, 830, 382, 3
OPEN_K = 37
BG, INK, SKIN = "#C9401F", "#14101A", "#F7F1EA"

img = cv2.imdecode(np.fromfile(src, dtype=np.uint8), cv2.IMREAD_COLOR)[Y0:Y0 + SRC, X0:X0 + SRC]
big = cv2.resize(img, (U * S, U * S), interpolation=cv2.INTER_AREA)
for _ in range(3):
    big = cv2.bilateralFilter(big, 9, 45, 9)
big = cv2.medianBlur(big, 7)
lab = cv2.cvtColor(big, cv2.COLOR_BGR2LAB).astype(np.float32)
L, B = lab[..., 0], lab[..., 2]
# 어두우면 머리, 밝고 누런 쪽이면 살 (바탕은 파랗다)
ink = (L < 90).astype(np.uint8)
skin = ((L > 120) & (B > 128)).astype(np.uint8)

def el(n):
    return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (n, n))

def fill_holes(m, max_area):
    cs, hier = cv2.findContours(m, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    for c, h in zip(cs, hier[0]):
        if h[3] >= 0 and cv2.contourArea(c) < max_area:
            cv2.drawContours(m, [c], -1, 1, -1)
    return m

def keep_big(m, min_area):
    n, lab_, st, _ = cv2.connectedComponentsWithStats(m)
    o = np.zeros_like(m)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] >= min_area:
            o[lab_ == i] = 1
    return o

total = ink.size
# 머리: 진주 구멍을 메우고, 가는 가닥(이마의 고수머리)을 덜어 낸다
curls = np.array([(218, 170), (245, 152), (272, 138), (296, 133), (297, 163), (265, 172), (240, 188), (222, 186)]) * S
cv2.fillPoly(ink, [curls.astype(np.int32)], 0)  # 이마의 고수머리 줄
ink = cv2.morphologyEx(ink, cv2.MORPH_CLOSE, el(41))
ink = fill_holes(ink, total * 0.004)
ink = cv2.morphologyEx(ink, cv2.MORPH_OPEN, el(OPEN_K))
ink = keep_big(ink, total * 0.004)
ink[:, : 9 * S] = 0  # 왼쪽 가장자리에 걸친 옆 사람 머리
# 살: 머리 속의 진주와 잔 조각을 버리고 얼굴·귀·목만 남긴다
skin[250 * S:, : 138 * S] = 0  # 왼쪽 아래의 흰 리본은 작은 크기에서 얼룩으로만 보인다
skin = cv2.morphologyEx(skin, cv2.MORPH_OPEN, el(15))
skin = keep_big(skin, total * 0.02)
skin = cv2.morphologyEx(skin, cv2.MORPH_CLOSE, el(31))
skin = fill_holes(skin, total * 0.02)
skin[ink > 0] = 0
# 머리와 얼굴 사이에 갇힌 작은 바탕 조각은 살로 메운다
gap = ((ink | skin) == 0).astype(np.uint8)
n, lab_, st, _ = cv2.connectedComponentsWithStats(gap)
for i in range(1, n):
    x, y, w, h, area = st[i]
    if x > 0 and y > 0 and x + w < U * S and y + h < U * S and area < total * 0.006:
        skin[lab_ == i] = 1

def path(mask, eps=2.4):
    cs, _ = cv2.findContours(cv2.dilate(mask, el(3)), cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    d = []
    for c in cs:
        if cv2.contourArea(c) < 400:
            continue
        p = cv2.approxPolyDP(c, eps, True)[:, 0, :] / S
        if len(p) < 4:
            continue
        m = (p + np.roll(p, -1, axis=0)) / 2
        s = f"M{m[-1][0]:.1f} {m[-1][1]:.1f}"
        for q, e in zip(p, m):
            s += f"Q{q[0]:.1f} {q[1]:.1f} {e[0]:.1f} {e[1]:.1f}"
        d.append(s + "Z")
    return "".join(d)

# 눈과 눈썹: 벽화의 자리에 굵은 선으로 (큰 판보다 훨씬 굵다)
eye = (f'<g fill="none" stroke="{INK}" stroke-linecap="round" stroke-linejoin="round">'
       f'<path stroke-width="7" d="M236 207Q246 192 266 182Q284 174.500 304 173"/>'
       f'<path stroke-width="5" d="M253 207Q267 195 285 189Q299 190 312 201Q298 213 281 214.500Q266 214 253 207Z"/></g>'
       f'<circle fill="{INK}" cx="285.500" cy="201" r="8"/>')
body = (f'<rect width="{U}" height="{U}" fill="{BG}"/>'
        f'<path fill="{SKIN}" fill-rule="evenodd" d="{path(skin)}"/>'
        f'<path fill="{INK}" fill-rule="evenodd" d="{path(ink)}"/>{eye}')
open(out, "w", encoding="utf-8").write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="80 35 290 290">{body}</svg>\n')
print(len(body))
