# 시각 디자인 문서의 색 점검: WCAG 명도 대비와 색각 이상 시뮬레이션(Machado 2009, 심한 정도 1.0) 뒤의 색 차이(CIEDE2000이 아닌 CIE76 ΔE)
# 쓰는 법: py 2026-10-17-color-check.py
import itertools, math
M = {
 'protan': [[0.152286,1.052583,-0.204868],[0.114503,0.786281,0.099216],[-0.003882,-0.048116,1.051998]],
 'deutan': [[0.367322,0.860646,-0.227968],[0.280085,0.672501,0.047413],[-0.011820,0.042940,0.968881]],
 'tritan': [[1.255528,-0.076749,-0.178779],[-0.078411,0.930809,0.147602],[0.004733,0.691367,0.303900]],
}
def lin(h): return [ (x/12.92 if x<=0.04045 else ((x+0.055)/1.055)**2.4) for x in (int(h[i:i+2],16)/255 for i in (1,3,5))]
def lum(c): return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]
def cr(a,b):
    x,y=sorted([lum(lin(a)),lum(lin(b))],reverse=True); return (x+.05)/(y+.05)
def lab(c):
    X=0.4124*c[0]+0.3576*c[1]+0.1805*c[2]; Y=0.2126*c[0]+0.7152*c[1]+0.0722*c[2]; Z=0.0193*c[0]+0.1192*c[1]+0.9505*c[2]
    f=lambda t: t**(1/3) if t>0.008856 else 7.787*t+16/116
    fx,fy,fz=f(X/0.95047),f(Y),f(Z/1.08883); return (116*fy-16,500*(fx-fy),200*(fy-fz))
def sim(c,k): m=M[k]; return [max(0,min(1,sum(m[i][j]*c[j] for j in range(3)))) for i in range(3)]
def dE(a,b): return math.dist(lab(a),lab(b))
def report(name, cols):
    print('==', name)
    for (n1,h1),(n2,h2) in itertools.combinations(cols.items(),2):
        a,b=lin(h1),lin(h2)
        row=[f'{dE(a,b):5.1f}']+[f'{dE(sim(a,k),sim(b,k)):5.1f}' for k in M]
        print(f'{n1:>10} / {n2:<10} ΔE normal {row[0]}  protan {row[1]} deutan {row[2]} tritan {row[3]}')
if __name__=='__main__':
    import sys
    fills={'process':'#edf0f5','branch':'#f6ebdc','loop':'#dce6f6','event':'#e2efdf','call':'#ebe7f4'}
    report('블록 바탕', fills)
    report('구문 강조 (바탕 #edf0f5)', {'text':'#151a22','keyword':'#1f45d6','comment':'#2e8b2e','literal':'#a1531b'})

# 53번째 판의 문서 색: 글자와 선을 모든 바탕에 대어 본 대비 (가장 낮은 값이 기준을 넘는지)
FILLS = {'paper':'#ffffff','process':'#edf0f5','branch':'#f6ebdc','loop':'#dce6f6','event':'#e2efdf','call':'#ebe7f4','folded':'#fbfcfe','fold.band':'#eceef2','peek.band':'#ddd4ef'}
FG = {'text':'#151a22','text.label':'#4b5567','text.muted':'#5a6476','syntax.keyword':'#1f45d6','syntax.comment':'#22702a','syntax.literal':'#8a5a00',
      'fold.name':'#343b48','peek.text':'#555e70','line (3:1)':'#5b77ad','fold.edge (3:1)':'#343b48','peek.edge (3:1)':'#7a5fb8','edit.select (3:1)':'#2c55c9'}
def L_star(h):
    y=lum(lin(h)); return 116*(y**(1/3) if y>0.008856 else 7.787*y+16/116)-16
if __name__=='__main__':
    print('== 53번째 판 대비 (최저 / 최고, 바탕 블록 다섯과 종이)')
    base=['paper','process','branch','loop','event','call']
    for n,c in FG.items():
        v=[cr(c,FILLS[b]) for b in base]
        print(f'{n:>18} {c}  {min(v):.2f} ~ {max(v):.2f}   fold.band {cr(c,FILLS["fold.band"]):.2f}  peek.band {cr(c,FILLS["peek.band"]):.2f}')
    print('== 흑백 명도 L* (0 검정 ~ 100 흰색)')
    for n,c in FILLS.items(): print(f'{n:>10} {c} L*={L_star(c):.0f}')
    print('selection vs fold.edge', round(cr('#2c55c9','#4b5567'),2))
