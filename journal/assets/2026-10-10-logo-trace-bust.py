"""흉상 사진을 몇 단계 명암의 벡터 면으로 옮긴다.
usage: trace.py <image> <out-prefix> <ycut> <t_sil> <t_mid> <t_deep> [blur] [eps]
"""
import sys
import cv2
import numpy as np

src, out = sys.argv[1], sys.argv[2]
ycut, t_sil, t_mid, t_deep = (int(v) for v in sys.argv[3:7])
blur = int(sys.argv[7]) if len(sys.argv) > 7 else 9
eps = float(sys.argv[8]) if len(sys.argv) > 8 else 1.6
S = 3

img = cv2.imdecode(np.fromfile(src, dtype=np.uint8), cv2.IMREAD_COLOR)
img = img[:ycut]
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
gray = cv2.resize(gray, None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC)
k = blur | 1
g = cv2.GaussianBlur(gray, (k, k), 0)
g = cv2.bilateralFilter(g, 9, 40, 9)

# 실루엣: 가장 큰 덩어리만 남기고 구멍을 메운다
sil = (g > t_sil).astype(np.uint8)
n, lab, stats, _ = cv2.connectedComponentsWithStats(sil)
big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
sil = (lab == big).astype(np.uint8)
cs, _ = cv2.findContours(sil, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
sil = np.zeros_like(sil)
cv2.drawContours(sil, cs, -1, 1, -1)
sil = cv2.morphologyEx(sil, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))

def layer(mask, min_area):
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    cs, _ = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    return [cv2.approxPolyDP(c, eps, True)[:, 0, :] for c in cs if cv2.contourArea(c) >= min_area]

inner = cv2.erode(sil, np.ones((5, 5), np.uint8))
# 밝은 면 안의 머릿결·띠: 주변보다 어두운 골만 골라 중간 명암에 더한다
dog = float(sys.argv[9]) if len(sys.argv) > 9 else 0
fine = cv2.GaussianBlur(gray, (7, 7), 0).astype(np.float32) - cv2.GaussianBlur(gray, (61, 61), 0).astype(np.float32)
groove = (fine < -dog) if dog else np.zeros_like(sil, bool)
layers = [
    layer(sil, 2000),
    layer((((g < t_mid) | groove) & (inner > 0)).astype(np.uint8), 260),
    layer(((g < t_deep) & (inner > 0)).astype(np.uint8), 200),
]

ys, xs = np.nonzero(sil)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()

def path(polys):
    d = []
    for p in polys:
        p = (p - [x0, y0]) / S
        if len(p) < 4:
            continue
        m = (p + np.roll(p, -1, axis=0)) / 2
        s = f"M{m[-1][0]:.1f} {m[-1][1]:.1f}"
        for q, e in zip(p, m):
            s += f"Q{q[0]:.1f} {q[1]:.1f} {e[0]:.1f} {e[1]:.1f}"
        d.append(s + "Z")
    return "".join(d)

w, h = (x1 - x0) / S, (y1 - y0) / S
names = ["sil", "mid", "deep"]
with open(out + ".svg", "w", encoding="utf-8") as f:
    f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.1f} {h:.1f}">\n')
    for name, polys, fill in zip(names, layers, ["#F4EEE0", "#9DB4CF", "#1B3F78"]):
        f.write(f'<path id="{name}" fill="{fill}" fill-rule="evenodd" d="{path(polys)}"/>\n')
    f.write("</svg>\n")

# 눈으로 볼 미리보기
prev = np.full((y1 - y0 + 60, x1 - x0 + 60, 3), (120, 63, 27), np.uint8)
for polys, col in zip(layers, [(224, 238, 244), (207, 180, 157), (120, 63, 27)]):
    m = np.zeros(prev.shape[:2], np.uint8)
    for p in polys:
        cv2.fillPoly(m, [(p - [x0 - 30, y0 - 30]).astype(np.int32)], 255)
    # evenodd 흉내: 구멍은 CCOMP 안쪽 윤곽이라 XOR로 그린다
    m2 = np.zeros_like(m)
    for p in polys:
        t = np.zeros_like(m)
        cv2.fillPoly(t, [(p - [x0 - 30, y0 - 30]).astype(np.int32)], 255)
        m2 ^= t
    prev[m2 > 0] = col
cv2.imencode(".png", cv2.resize(prev, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA))[1].tofile(out + ".png")
print(f"viewBox {w:.1f} x {h:.1f}; points:", [sum(len(p) for p in l) for l in layers])
print("gray percentiles in sil:", np.percentile(g[sil > 0], [10, 25, 50, 75, 90]).round())
