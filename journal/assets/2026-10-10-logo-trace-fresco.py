"""벽화의 한 부분을 몇 가지 평평한 색 면의 벡터로 옮긴다.
usage: fresco.py <image> <out-prefix> x0 y0 size k [palette-map]
palette-map: 군집 번호별로 쓸 색을 쉼표로 (예: "#1F5FAE,#F4EEE0,..."), 없으면 군집 중심색 그대로
"""
import sys
import cv2
import numpy as np

src, out = sys.argv[1], sys.argv[2]
x0, y0, size, k = (int(v) for v in sys.argv[3:7])
pal = sys.argv[7].split(",") if len(sys.argv) > 7 else None
S = 3

img = cv2.imdecode(np.fromfile(src, dtype=np.uint8), cv2.IMREAD_COLOR)[y0:y0 + size, x0:x0 + size]
cv2.imencode(".png", img)[1].tofile(out + "-crop.png")
big = cv2.resize(img, None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC)
for _ in range(3):
    big = cv2.bilateralFilter(big, 9, 45, 9)
big = cv2.medianBlur(big, 7)

lab = cv2.cvtColor(big, cv2.COLOR_BGR2LAB).reshape(-1, 3).astype(np.float32)
cv2.setRNGSeed(7)
crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, 0.5)
_, labels, centers = cv2.kmeans(lab[::7], k, None, crit, 4, cv2.KMEANS_PP_CENTERS)
# 전체 픽셀을 가장 가까운 중심에 배정
d = ((lab[:, None, :] - centers[None, :, :]) ** 2).sum(axis=2)
lab_idx = d.argmin(axis=1).reshape(big.shape[:2])
lab_idx = cv2.medianBlur(lab_idx.astype(np.uint8), 9)

bgr = cv2.cvtColor(centers.reshape(1, -1, 3).astype(np.uint8), cv2.COLOR_LAB2BGR)[0]
hexes = ["#%02X%02X%02X" % (c[2], c[1], c[0]) for c in bgr]
areas = [(lab_idx == i).sum() for i in range(k)]
order = np.argsort(areas)[::-1]
for i in order:
    print(i, hexes[i], f"{areas[i] / lab_idx.size:.1%}", "->", pal[i] if pal else "")

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

# 같은 색으로 가는 군집은 한 면으로 합친다
colors = pal if pal else hexes
groups = {}
for i in order:
    groups.setdefault(colors[i], np.zeros(lab_idx.shape, np.uint8))
    groups[colors[i]] |= (lab_idx == i).astype(np.uint8)
items = sorted(groups.items(), key=lambda kv: -int(kv[1].sum()))
with open(out + ".svg", "w", encoding="utf-8") as f:
    f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}">\n')
    f.write(f'<rect width="{size}" height="{size}" fill="{items[0][0]}"/>\n')
    for col, mask in items[1:]:
        f.write(f'<path fill="{col}" fill-rule="evenodd" d="{path(mask)}"/>\n')
    f.write("</svg>\n")

prev = np.zeros(big.shape, np.uint8)
for col, mask in items:
    prev[mask > 0] = (int(col[5:7], 16), int(col[3:5], 16), int(col[1:3], 16))
cv2.imencode(".png", cv2.resize(prev, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA))[1].tofile(out + ".png")
