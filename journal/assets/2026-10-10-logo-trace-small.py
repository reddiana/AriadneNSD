"""작은 크기용: 같은 벽화 조각에서 머리와 얼굴의 큰 덩어리만 남긴다.
usage: small.py <image> <out-prefix> <open_k> <pearls 0|1>
"""
import sys
import cv2
import numpy as np

src, out, open_k, pearls = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
x0, y0, size, k, S = 358, 12, 382, 7, 3
BG, INK, SKIN = "#C9401F", "#14101A", "#F7F1EA"

img = cv2.imdecode(np.fromfile(src, dtype=np.uint8), cv2.IMREAD_COLOR)[y0:y0 + size, x0:x0 + size]
big = cv2.resize(img, None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC)
for _ in range(3):
    big = cv2.bilateralFilter(big, 9, 45, 9)
big = cv2.medianBlur(big, 7)
lab = cv2.cvtColor(big, cv2.COLOR_BGR2LAB).astype(np.float32)
L, A, B = lab[..., 0], lab[..., 1], lab[..., 2]
# 군집 대신 뚜렷한 기준으로 나눈다: 어두우면 머리, 밝고 파랗지 않으면 살
ink = (L < 60).astype(np.uint8)
skin = ((L > 150) & (B > 118)).astype(np.uint8)

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
ink = cv2.morphologyEx(ink, cv2.MORPH_CLOSE, el(27))
ink = fill_holes(ink, total * 0.004)
ink = cv2.morphologyEx(ink, cv2.MORPH_OPEN, el(open_k))
ink = keep_big(ink, total * 0.004)
ink[:, : 9 * S] = 0  # 왼쪽 가장자리에 걸친 옆 사람 머리
# 살: 머리 속의 진주와 잔 조각을 버리고 얼굴·귀·목만 남긴다
skin[255 * S:, : 160 * S] = 0  # 왼쪽 아래의 흰 리본은 작은 크기에서 얼룩으로만 보인다
skin = cv2.morphologyEx(skin, cv2.MORPH_OPEN, el(15))
skin = keep_big(skin, total * 0.02)
skin = cv2.morphologyEx(skin, cv2.MORPH_CLOSE, el(31))
skin = fill_holes(skin, total * 0.02)
skin[ink > 0] = 0

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

eye = (f'<g fill="none" stroke="{INK}" stroke-linecap="round" stroke-linejoin="round">'
       f'<path stroke-width="7" d="M238 180Q262 160 286 153Q296 150.500 304 152"/>'
       f'<path stroke-width="5" d="M252 188Q269 172 285 169Q298 170 311 181Q297 194 280 195Q265 195 252 188Z"/></g>'
       f'<circle fill="{INK}" cx="284.500" cy="182" r="8"/>')
dots = ""
if pearls:
    # 굵은 진주 한 줄: 틀어 올린 머리 위를 따라
    for cx, cy in [(62, 150), (60, 122), (70, 96), (89, 76), (113, 64), (139, 60), (165, 62), (190, 70)]:
        dots += f'<circle cx="{cx}" cy="{cy}" r="8.500" fill="{SKIN}"/>'
body = (f'<rect width="{size}" height="{size}" fill="{BG}"/>'
        f'<path fill="{SKIN}" fill-rule="evenodd" d="{path(skin)}"/>'
        f'<path fill="{INK}" fill-rule="evenodd" d="{path(ink)}"/>{eye}{dots}')
open(out + ".svg", "w", encoding="utf-8").write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}">{body}</svg>\n')
print(len(body))
