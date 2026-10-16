# 시각 디자인 문서의 블록 해부도를 그린다: 블록마다 치수(프로토타입의 K 값)를 단 SVG
# 쓰는 법: py 2026-10-17-visual-anatomy.py <내보낼 svg 경로>
# 치수는 journal/assets/2026-10-10-ns-prototype.html의 K와 COL(53번째 판)과 같아야 한다
import sys

K = dict(padX=10, padY=7, lh=18, strip=22, ifLab=16, hat=16, bar=7, band=18, rb=2, rgap=1)
C = dict(stroke='#5b77ad', process='#edf0f5', branch='#f6ebdc', loop='#dce6f6', event='#e2efdf', call='#ebe7f4',
         ink='#151a22', label='#4b5567', edge='#343b48', foldBand='#eceef2', foldName='#343b48',
         callEdge='#7a5fb8', callBand='#ddd4ef', shown='#555e70')
DIM = '#c2410c'   # 치수선: 다이어그램의 어느 색과도 겹치지 않는 주황
MONO = 'IBM Plex Mono, IBM Plex Sans KR, Consolas, monospace'
SANS = 'IBM Plex Sans KR, Malgun Gothic, sans-serif'
out = []
def a(s): out.append(s)
def rect(x, y, w, h, fill, extra=''): a(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="{C["stroke"]}" stroke-width="1"{extra}/>')
def text(x, y, s, size=13, fill=C['ink'], fam=MONO, extra=''): a(f'<text x="{x}" y="{y}" font-family="{fam}" font-size="{size}" fill="{fill}"{extra}>{s}</text>')
def title(x, y, s): text(x, y, s, 13, '#1c2230', SANS, ' font-weight="600"')
def hdim(x1, x2, y, label, up=True):
    a(f'<path d="M{x1} {y} H{x2} M{x1} {y-3} V{y+3} M{x2} {y-3} V{y+3}" stroke="{DIM}" stroke-width="1" fill="none"/>')
    text((x1 + x2) / 2, y - 4 if up else y + 12, label, 10, DIM, SANS, ' text-anchor="middle"')
def vdim(x, y1, y2, label, right=True):
    a(f'<path d="M{x} {y1} V{y2} M{x-3} {y1} H{x+3} M{x-3} {y2} H{x+3}" stroke="{DIM}" stroke-width="1" fill="none"/>')
    text(x + 5 if right else x - 5, (y1 + y2) / 2 + 3.5, label, 10, DIM, SANS, '' if right else ' text-anchor="end"')

W = 230   # 블록 폭
# 1. 처리
x, y = 70, 60
title(x, y - 24, '처리')
rect(x, y, W, 2 * K['padY'] + K['lh'], C['process'])
text(x + K['padX'], y + K['padY'] + K['lh'] - 5, 'tick++;')
hdim(x, x + K['padX'], y - 6, 'padX 10')
vdim(x + W + 10, y, y + K['padY'], 'padY 7')
vdim(x + W + 60, y + K['padY'], y + K['padY'] + K['lh'], '줄 18')
vdim(x - 10, y, y + 32, '32', right=False)

# 2. If
x, y = 400, 60
title(x, y - 24, 'If')
h = 2 * K['padY'] + K['lh'] + K['ifLab'] - 2; sx = x + 150
rect(x, y, W, h, C['branch'])
a(f'<path d="M{x} {y} L{sx} {y+h} L{x+W} {y}" fill="none" stroke="{C["stroke"]}" stroke-width="1"/>')
text(sx, y + K['padY'] + K['lh'] - 7, 'btn == PRESSED', 13, C['ink'], MONO, ' text-anchor="middle"')
text(x + 6, y + h - 5, '참', 12, C['label'], SANS); text(x + W - 6, y + h - 5, '거짓', 12, C['label'], SANS, ' text-anchor="end"')
rect(x, y + h, sx - x, 32, C['process']); rect(sx, y + h, x + W - sx, 32, C['process'])
vdim(x + W + 10, y + h - K['ifLab'], y + h, '갈래 이름 줄 16')
hdim(x, x + 6, y + h + 44, '6', up=False)
text(x, y + h + 74, '빗금의 꼭짓점 = 두 갈래의 경계', 10, DIM, SANS)
text(x, y + h + 88, '조건은 그 위 가운데, 갈래 이름은 12px', 10, DIM, SANS)

# 3. While
x, y = 70, 250
title(x, y - 24, 'While (Do-While은 머리가 아래)')
rect(x, y, W, 96, C['loop'])
text(x + K['padX'], y + K['padY'] + K['lh'] - 5, 'j &lt; hi')
rect(x + K['strip'], y + 32, W - K['strip'], 32, C['process']); rect(x + K['strip'], y + 64, W - K['strip'], 32, C['process'])
text(x + K['strip'] + K['padX'], y + 32 + K['padY'] + K['lh'] - 5, 'i++;')
hdim(x, x + K['strip'], y + 110, '띠 22', up=False)

# 4. 호출 블록
x, y = 400, 250
title(x, y - 24, '호출 블록')
rect(x, y, W, 32, C['call'])
for bx in (x + K['bar'], x + W - K['bar']): a(f'<line x1="{bx}" y1="{y}" x2="{bx}" y2="{y+32}" stroke="{C["stroke"]}" stroke-width="1"/>')
text(x + K['padX'] + K['bar'], y + K['padY'] + K['lh'] - 5, 'p ← <tspan font-weight="700">partition</tspan>(a, lo)')
hdim(x, x + K['bar'], y - 6, '7')
text(x, y + 50, '이름은 굵게, 인자와 결과는 보통 (ADR-0022)', 10, DIM, SANS)
text(x, y + 64, '부를 Method가 없으면 이중선이 점선', 10, DIM, SANS)

# 5. Event 머리 / Method 머리
x, y = 70, 440
title(x, y - 34, 'Event 머리 · Method 머리')
top = y + K['hat']; bw = min(110, W * 0.45)
a(f'<path d="M{x} {top} C{x+22} {y-2},{x+bw-22} {y-2},{x+bw} {top} L{x+W} {top} L{x+W} {top+32} L{x} {top+32} Z" fill="{C["event"]}" stroke="{C["stroke"]}" stroke-width="1"/>')
text(x + K['padX'], top + K['padY'] + K['lh'] - 5, 'TIM2 인터럽트')
vdim(x - 10, y, top, '모자 16', right=False)
hdim(x, x + bw, y - 8, 'min(110, 폭×0.45)')
y2 = y + 80; top = y2 + K['hat']
a(f'<path d="M{x} {top} C{x+W*0.2} {y2+1},{x+W*0.8} {y2+1},{x+W} {top} L{x+W} {top+32} L{x} {top+32} Z" fill="{C["call"]}" stroke="{C["stroke"]}" stroke-width="1"/>')
text(x + K['padX'], top + K['padY'] + K['lh'] - 5, 'partition(a, lo, hi)')
text(x, top + 50, 'Method는 폭 전체의 낮은 아치, 색은 호출 블록과 같음', 10, DIM, SANS)

# 6. 펴진 접기 영역과 펴 보인 호출 블록
x, y = 400, 420
title(x, y - 24, '펴진 접기 영역 · 펴 보인 호출 블록')
a(f'<rect x="{x}" y="{y}" width="{W}" height="{K["band"]}" fill="{C["foldBand"]}"/>')
a(f'<line x1="{x}" y1="{y+K["band"]}" x2="{x+W}" y2="{y+K["band"]}" stroke="{C["stroke"]}" stroke-width="1"/>')
text(x + 10, y + K['band'] - 5, '▾ 센서 읽기', 12, C['foldName'], SANS, ' font-weight="600"')
rect(x, y + K['band'], W, 32, C['process']); text(x + K['padX'], y + K['band'] + K['padY'] + K['lh'] - 5, 'adc_start(CH0);')
a(f'<rect x="{x+.5}" y="{y+.5}" width="{W-1}" height="{K["band"]+31}" fill="none" stroke="{C["edge"]}" stroke-width="2"/>')
vdim(x + W + 10, y, y + K['band'], '띠 18')
text(x + W + 6, y + 40, '테두리 2px 실선', 10, DIM, SANS)
y3 = y + 90
rect(x, y3, W, K['band'] + 32, '#ffffff')
a(f'<rect x="{x+.5}" y="{y3+.5}" width="{W-1}" height="{K["band"]-.5}" fill="{C["callBand"]}"/>')
a(f'<line x1="{x}" y1="{y3+K["band"]}" x2="{x+W}" y2="{y3+K["band"]}" stroke="{C["stroke"]}" stroke-width="1"/>')
text(x + 10, y3 + K['band'] - 5, '▾ p ← <tspan font-weight="600">partition</tspan>(a, lo)', 12, C['shown'])
text(x + K['padX'] + 4, y3 + K['band'] + K['padY'] + K['lh'] - 5, 'pivot = a[hi];', 13, C['shown'])
a(f'<rect x="{x+2}" y="{y3+2}" width="{W-4}" height="{K["band"]+28}" fill="none" stroke="#ffffff" stroke-width="3"/>')
a(f'<rect x="{x+2}" y="{y3+2}" width="{W-4}" height="{K["band"]+28}" fill="none" stroke="{C["callEdge"]}" stroke-width="1" stroke-dasharray="6 4"/>')
text(x + W + 6, y3 + 22, '점선 1px (6 · 4)', 10, DIM, SANS)
text(x + W + 6, y3 + 36, '바깥 선에서 1px 안', 10, DIM, SANS)
text(x + W + 6, y3 + 50, '글자는 회색, 강조 없음', 10, DIM, SANS)

body = '\n'.join(out)
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="780" height="640" viewBox="0 0 780 640">
<rect width="780" height="640" fill="#ffffff"/>
<g transform="translate(.5 .5)">
{body}
</g>
</svg>
'''
open(sys.argv[1], 'w', encoding='utf-8', newline='\n').write(svg)
print('saved', sys.argv[1])
