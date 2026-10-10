"""벽화 사진의 한 부분을 몇 가지 평평한 색 면의 벡터로 옮긴다.

usage: fresco2.py <image> <out-prefix> x0 y0 size k [palette bg skin]
  x0 y0 size : 사진에서 자를 정사각형 (사진의 픽셀)
  k          : 색 군집 수
  palette    : 군집 번호별로 쓸 색을 쉼표로. 없으면 군집 중심색 그대로 (번호를 보려고 먼저 한 번 돌린다)
  bg skin    : 바탕색과 살색. 머리 속에 갇힌 작은 바탕색 구멍(파란 구슬)은 살색으로 바꾼다

자른 조각은 한 변 382 단위의 좌표로 옮긴다. 눈을 다시 그리는 좌표도 이 단위다.
"""
import sys
import cv2
import numpy as np

src, out = sys.argv[1], sys.argv[2]
x0, y0, src_size, k = (int(v) for v in sys.argv[3:7])
pal = sys.argv[7].split(",") if len(sys.argv) > 7 else None
bg, skin = (sys.argv[8], sys.argv[9]) if len(sys.argv) > 9 else (None, None)
U, S = 382, 3

img = cv2.imdecode(np.fromfile(src, dtype=np.uint8), cv2.IMREAD_COLOR)[y0:y0 + src_size, x0:x0 + src_size]
big = cv2.resize(img, (U * S, U * S), interpolation=cv2.INTER_AREA if src_size > U * S else cv2.INTER_CUBIC)
cv2.imencode(".png", cv2.resize(big, (U, U), interpolation=cv2.INTER_AREA))[1].tofile(out + "-crop.png")
for _ in range(3):
    big = cv2.bilateralFilter(big, 9, 45, 9)
big = cv2.medianBlur(big, 7)

lab = cv2.cvtColor(big, cv2.COLOR_BGR2LAB).reshape(-1, 3).astype(np.float32)
cv2.setRNGSeed(7)
crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, 0.5)
_, _, centers = cv2.kmeans(lab[::7], k, None, crit, 4, cv2.KMEANS_PP_CENTERS)
idx = np.empty(len(lab), np.uint8)
for a in range(0, len(lab), 200000):  # 메모리를 아끼려고 나눠서 배정
    d = ((lab[a:a + 200000, None, :] - centers[None, :, :]) ** 2).sum(axis=2)
    idx[a:a + 200000] = d.argmin(axis=1)
idx = cv2.medianBlur(idx.reshape(big.shape[:2]), 9)

bgr = cv2.cvtColor(centers.reshape(1, -1, 3).astype(np.uint8), cv2.COLOR_LAB2BGR)[0]
hexes = ["#%02X%02X%02X" % (c[2], c[1], c[0]) for c in bgr]
areas = [(idx == i).sum() for i in range(k)]
order = np.argsort(areas)[::-1]
for i in order:
    print(i, hexes[i], f"{areas[i] / idx.size:.1%}", "->", pal[i] if pal else "")

colors = pal if pal else hexes
groups = {}
for i in order:
    groups.setdefault(colors[i], np.zeros(idx.shape, np.uint8))
    groups[colors[i]] |= (idx == i).astype(np.uint8)

if bg and skin:
    n, lab_, st, _ = cv2.connectedComponentsWithStats(groups[bg])
    h, w = idx.shape
    for i in range(1, n):
        x, y, cw, ch, area = st[i]
        inside = x > 0 and y > 0 and x + cw < w and y + ch < h
        if inside and area < idx.size * 0.0015:
            groups[bg][lab_ == i] = 0
            groups[skin][lab_ == i] = 1

def path(mask):
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    mask = cv2.dilate(mask, np.ones((3, 3), np.uint8))
    cs, _ = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    d = []
    for c in cs:
        if cv2.contourArea(c) < 90:
            continue
        p = cv2.approxPolyDP(c, 1.3, True)[:, 0, :] / S
        if len(p) < 4:
            continue
        m = (p + np.roll(p, -1, axis=0)) / 2
        s = f"M{m[-1][0]:.1f} {m[-1][1]:.1f}"
        for q, e in zip(p, m):
            s += f"Q{q[0]:.1f} {q[1]:.1f} {e[0]:.1f} {e[1]:.1f}"
        d.append(s + "Z")
    return "".join(d)

base = bg if bg else max(groups, key=lambda c: int(groups[c].sum()))
items = sorted(((c, m) for c, m in groups.items() if c != base), key=lambda kv: -int(kv[1].sum()))
with open(out + ".svg", "w", encoding="utf-8") as f:
    f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {U} {U}">\n')
    f.write(f'<rect width="{U}" height="{U}" fill="{base}"/>\n')
    for col, mask in items:
        f.write(f'<path fill="{col}" fill-rule="evenodd" d="{path(mask)}"/>\n')
    f.write("</svg>\n")

prev = np.zeros(big.shape, np.uint8)
prev[:] = (int(base[5:7], 16), int(base[3:5], 16), int(base[1:3], 16))
for col, mask in items:
    prev[mask > 0] = (int(col[5:7], 16), int(col[3:5], 16), int(col[1:3], 16))
cv2.imencode(".png", cv2.resize(prev, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA))[1].tofile(out + ".png")
