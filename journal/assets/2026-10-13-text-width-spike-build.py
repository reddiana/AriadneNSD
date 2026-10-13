# 글자 폭 스파이크 페이지(2026-10-13-text-width-spike.html)를 만든다.
#
#   py -X utf8 journal/assets/2026-10-13-text-width-spike-build.py [--ref 기준값.json]
#
# 하는 일
#   1. Pretendard-Regular(OFL 1.1)에서 견본 글자만 추려 woff2로 만들고 페이지에 넣는다.
#   2. 같은 글꼴 파일에서 글자마다의 폭(advance width)을 뽑아 표로 넣는다. 브라우저 없이 폭을 셈하는 데 쓴다.
#   3. 글꼴을 통째로 실을 때와 추려 실을 때의 크기를 재어 표로 넣는다.
#   4. --ref를 주면 그 브라우저에서 잰 값을 "기준값"으로 페이지에 넣는다.
#      기준값은 페이지 맨 아래 "값 그대로"의 JSON이다(헤드리스 Chrome으로 뽑았다).
#
# 필요한 것: py -m pip install fonttools brotli
import argparse, base64, io, json, os, sys
from fontTools.ttLib import TTFont
from fontTools import subset

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = r'C:\Windows\Fonts\Pretendard-Regular.ttf'
OUT = os.path.join(HERE, '2026-10-13-text-width-spike.html')
SIZE = 13  # 프로토타입의 블록 글자 크기

# NS 차트에 실제로 적히는 글자들. 끝의 둘은 일부러 넣은 것: 커닝이 큰 낱말, 글꼴에 없는 글자(▾)
SAMPLES = [
    'i ← lo',
    'p ← partition(a, lo, hi)',
    'while (a[j] < pivot)',
    'quicksort(a, lo, p - 1)',
    'if (term > currentTerm)',
    '합계 = 합계 + 값[i] * 0.1',
    '피벗보다 작은 값을 왼쪽으로 옮긴다',
    '리더에게 AppendEntries 응답을 보낸다',
    '⋯ 블록 12개',
    '참',
    '거짓',
    'return i',
    'AVATAR To WAVE, Type "Yes"',
    '▾ 나누기',
]


def make_subset(text=None, unicodes=None):
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['*']
    opts.notdef_outline = True
    font = subset.load_font(FONT, opts)
    s = subset.Subsetter(opts)
    if unicodes is not None:
        s.populate(unicodes=unicodes)
    else:
        s.populate(text=text)
    s.subset(font)
    buf = io.BytesIO()
    subset.save_font(font, buf, opts)
    return buf.getvalue()


def ksx1001_hangul():
    out = []
    for hi in range(0xB0, 0xC9):
        for lo in range(0xA1, 0xFF):
            try:
                out.append(ord(bytes([hi, lo]).decode('euc_kr')))
            except UnicodeDecodeError:
                pass
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ref')
    args = ap.parse_args()

    font = TTFont(FONT)
    cmap = font.getBestCmap()
    upm = font['head'].unitsPerEm
    chars = sorted(set(''.join(SAMPLES)))
    adv = {ch: font['hmtx'][cmap[ord(ch)]][0] for ch in chars if ord(ch) in cmap}
    missing = [ch for ch in chars if ord(ch) not in cmap]

    sub = make_subset(text=''.join(ch for ch in chars if ord(ch) in cmap))

    # 번들 크기: 통째, 자주 쓰는 한글 2,350자 + 라틴, 한글 11,172자 모두(woff2)
    latin = list(range(0x20, 0x7F)) + list(range(0xA0, 0x180)) + list(range(0x2000, 0x2070)) + list(range(0x2190, 0x2200)) + list(range(0x2200, 0x2300))
    sizes = {
        'ttf': os.path.getsize(FONT),
        'woff2_all': len(make_subset(unicodes=list(cmap.keys()))),
        'woff2_2350': len(make_subset(unicodes=latin + ksx1001_hangul())),
        'woff2_latin': len(make_subset(unicodes=latin)),
        'spike': len(sub),
    }

    ref = None
    if args.ref:
        with open(args.ref, encoding='utf-8') as f:
            ref = json.load(f)

    html = TEMPLATE
    for key, val in {
        '__FONT_B64__': base64.b64encode(sub).decode('ascii'),
        '__UPM__': str(upm),
        '__SIZE__': str(SIZE),
        '__ADV__': json.dumps(adv, ensure_ascii=False),
        '__SAMPLES__': json.dumps(SAMPLES, ensure_ascii=False),
        '__SIZES__': json.dumps(sizes),
        '__REF__': json.dumps(ref, ensure_ascii=False),
    }.items():
        html = html.replace(key, val)
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write(html)
    print('글꼴에 없는 글자:', missing)
    print('크기:', sizes)
    print('쓴 파일:', OUT, os.path.getsize(OUT), 'bytes')


TEMPLATE = r'''<title>글자 폭 스파이크</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+KR:wght@400;500;600&display=swap">
<style>
/* 시안 페이지들과 같은 틀: 위에 판정, 아래에 잰 값의 표. 표와 그림은 제 칸 안에서만 옆으로 넘긴다 */
:root {
  --bg: #eef1f6; --panel: #ffffff; --fg: #1c2230; --muted: #5a6476; --line: #d4dbe6;
  --accent: #2c55c9; --accent-soft: #e4eafb; --pick: #1d7a46; --pick-soft: #e3f3e8; --warn: #a8501a; --warn-soft: #f8eadc; --paper: #ffffff; --paper-ink: #3d4658;
  --font: 'IBM Plex Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
  --mono: 'IBM Plex Mono', 'IBM Plex Sans KR', Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { --bg: #12151b; --panel: #1a1e26; --fg: #e5e8ee; --muted: #9aa3b3; --line: #2b313c; --accent: #8ba7ff; --accent-soft: #232c45; --pick: #6fd197; --pick-soft: #1b3326; --warn: #f0a868; --warn-soft: #3a2a1b; --paper: #ffffff; --paper-ink: #3d4658; color-scheme: dark; }
}
:root[data-theme="dark"] { --bg: #12151b; --panel: #1a1e26; --fg: #e5e8ee; --muted: #9aa3b3; --line: #2b313c; --accent: #8ba7ff; --accent-soft: #232c45; --pick: #6fd197; --pick-soft: #1b3326; --warn: #f0a868; --warn-soft: #3a2a1b; --paper: #ffffff; --paper-ink: #3d4658; color-scheme: dark; }
@font-face { font-family: 'NSDSpike'; src: url(data:font/woff2;base64,__FONT_B64__) format('woff2'); }
* { box-sizing: border-box; }
body { background: var(--bg); color: var(--fg); font-family: var(--font); font-size: 15px; line-height: 1.65; padding-block: 28px 56px; padding-inline: 20px; }
main { max-width: 1240px; margin-inline: auto; display: grid; gap: 40px; }
h1 { font-size: 26px; font-weight: 600; margin: 0 0 8px; letter-spacing: -.01em; text-wrap: balance; }
h2 { font-size: 19px; font-weight: 600; margin: 0 0 4px; text-wrap: balance; }
h3 { font-size: 15px; font-weight: 600; margin: 0; }
p { margin: 0; }
.lede, .q { color: var(--muted); max-width: 72ch; }
.lede b, .q b { color: var(--fg); font-weight: 600; }
section { display: grid; gap: 16px; min-width: 0; }
.sum { background: var(--panel); border: 1px solid var(--line); border-left: 4px solid var(--accent); border-radius: 0 8px 8px 0; padding: 14px 18px; display: grid; gap: 10px; max-width: 96ch; min-width: 0; }
.sum ol, .sum ul { margin: 0; padding-left: 1.3em; display: grid; gap: 5px; font-size: 14px; }
.verdict { display: grid; gap: 8px; }
.verdict > div { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; align-items: baseline; font-size: 14px; }
.chip { font-size: 11.5px; font-weight: 600; border-radius: 999px; padding: 1px 10px; white-space: nowrap; justify-self: start; }
.chip.ok { color: var(--pick); background: var(--pick-soft); }
.chip.no { color: var(--warn); background: var(--warn-soft); }
.chip.na { color: var(--muted); background: var(--bg); }
.env { font-family: var(--mono); font-size: 12.5px; color: var(--muted); overflow-wrap: anywhere; }
.code { font-family: var(--mono); font-size: 20px; font-weight: 600; letter-spacing: .06em; color: var(--accent); }
.scroll { overflow-x: auto; background: var(--panel); border: 1px solid var(--line); border-radius: 8px; }
table { border-collapse: collapse; width: 100%; font-size: 13px; font-variant-numeric: tabular-nums; }
th, td { padding: 6px 12px; text-align: right; border-bottom: 1px solid var(--line); white-space: nowrap; }
th { font-weight: 600; font-size: 12px; color: var(--muted); vertical-align: bottom; }
th small { display: block; font-weight: 400; }
th:first-child, td:first-child { text-align: left; }
td:first-child { font-family: var(--mono); font-size: 12.5px; white-space: pre; }
tr:last-child td { border-bottom: 0; }
td.d0 { color: var(--muted); }
td.d1 { color: var(--warn); font-weight: 600; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: 14px; }
.card { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 16px; display: grid; gap: 12px; align-content: start; min-width: 0; }
.card header { display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: baseline; }
.tag { font-family: var(--mono); font-size: 12px; font-weight: 600; color: var(--accent); }
.card p, .card li { font-size: 13.5px; color: var(--muted); }
.card ul { margin: 0; padding-left: 1.2em; display: grid; gap: 3px; }
.card b { color: var(--fg); font-weight: 600; }
.bad { color: var(--warn); font-weight: 600; }
.paper { background: var(--paper); border-radius: 6px; padding: 14px; overflow-x: auto; border: 1px solid var(--line); }
.paper img { display: block; max-width: none; }
code, kbd { font-family: var(--mono); font-size: 12.5px; }
textarea { width: 100%; min-height: 96px; font-family: var(--mono); font-size: 12px; background: var(--panel); color: var(--fg); border: 1px solid var(--line); border-radius: 6px; padding: 10px; resize: vertical; }
button { font: inherit; font-size: 13px; color: var(--fg); background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 5px 12px; cursor: pointer; justify-self: start; }
button:focus-visible, textarea:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
#probe { position: absolute; left: -9999px; top: 0; }
</style>

<main>
  <div>
    <h1>같은 글자는 어디서나 같은 폭으로 재어지는가</h1>
    <p class="lede">블록의 폭은 글자의 폭으로 정해집니다. 글자의 폭이 환경마다 다르면 같은 문서가 환경마다 다른 그림으로 저장됩니다. 메인테이너가 고른 길은 <b>글꼴 번들</b>입니다(2026-10-13). 이 페이지는 그 길로 가면 폭이 정말 같아지는지를 잽니다. <b>이 페이지를 다른 브라우저와 휴대폰에서도 열어, 바로 아래 "판정"의 세 줄과 지문 두 개를 견주어 주세요.</b> 번들 글꼴은 Pretendard Regular(OFL 1.1)를 임시로 썼습니다. 어느 글꼴을 실을지는 정하지 않았습니다.</p>
  </div>

  <section>
    <h2>판정: 이 브라우저에서</h2>
    <div class="sum">
      <p class="env" id="env"></p>
      <div class="verdict" id="verdict"></div>
      <p class="q" id="fp"></p>
    </div>
    <p class="q">재는 법은 넷입니다. <b>가</b> 기기에 깔린 글꼴로 브라우저가 잰다(지금 프로토타입). <b>나</b> 번들 글꼴로 브라우저가 잰다. <b>다</b> 번들 글꼴로, 커닝(글자 짝마다 사이를 좁히는 것)을 끄고 브라우저가 잰다. <b>라</b> 브라우저에 묻지 않고, 글꼴 파일에 적힌 글자마다의 폭을 더한다. 라는 셈이라서 어디서나 같습니다.</p>
  </section>

  <section>
    <h2>잰 값 (글자 크기 __SIZE__px, 단위 px)</h2>
    <div class="scroll"><table id="tbl"></table></div>
    <p class="q">"기준"은 Claude가 이 컴퓨터(Windows)의 Chrome으로 잰 값입니다. Chrome은 폭을 1/64px(0.016px) 단위로 맞춰 돌려주므로, 셈한 값과 그만큼은 어긋납니다. 차이가 0.02px을 넘는 칸만 주황으로 보입니다.</p>
  </section>

  <section>
    <h2>저장된 그림을 글꼴이 없는 곳에서 열면</h2>
    <p class="q">글꼴을 번들하면 편집기 안에서는 폭이 맞습니다. 그런데 저장된 <code>.ns.svg</code>는 Obsidian의 노트, GitHub, 문서 도구에서 그림으로 열리고, 거기에는 우리 글꼴이 없습니다. 아래 그림 셋은 실제 SVG 파일을 그림으로 넣은 것입니다. 상자의 폭은 모두 번들 글꼴로 셈했습니다.</p>
    <div class="cards" id="f1"></div>
  </section>

  <section>
    <h2>번들하면 늘어나는 크기</h2>
    <div class="scroll"><table id="sizes"></table></div>
    <p class="q">웹은 처음 열 때 이만큼을 더 내려받고, Obsidian 플러그인과 데스크톱은 설치 파일이 이만큼 커집니다. 굵은 글자(Bold)나 고정폭 글꼴을 더 실으면 그만큼 더해집니다.</p>
  </section>

  <section>
    <h2>값 그대로</h2>
    <p class="q">다른 브라우저에서 잰 값을 Claude에게 알려 주실 때 이 칸의 글자를 복사해 붙여 주세요.</p>
    <textarea id="rawbox" readonly aria-label="잰 값"></textarea>
    <button id="copy" type="button">복사</button>
    <pre id="raw" hidden></pre>
  </section>
</main>

<svg id="probe" width="10" height="10" aria-hidden="true"><text id="pt" x="0" y="0" xml:space="preserve" style="white-space:pre"></text></svg>

<script>
const UPM = __UPM__, SIZE = __SIZE__, ADV = __ADV__, SAMPLES = __SAMPLES__, SIZES = __SIZES__, REF = __REF__;
const SYS = "'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif";
const TOL = 0.02;   // Chrome은 폭을 1/64px(0.0156px) 단위로 맞춰 돌려준다. 그보다 작은 차이는 같은 것으로 본다
const $ = id => document.getElementById(id);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function probe(text, family, kern) {
  const t = $('pt');
  t.setAttribute('font-family', family);
  t.setAttribute('font-size', SIZE);
  t.style.fontKerning = kern ? 'normal' : 'none';
  t.style.fontVariantLigatures = kern ? 'normal' : 'none';
  t.textContent = text;
  return t.getComputedTextLength();
}
function table(text) {           // 라: 글꼴 파일의 글자 폭을 더한다
  let sum = 0;
  for (const ch of text) { if (!(ch in ADV)) return null; sum += ADV[ch]; }
  return sum * SIZE / UPM;
}
function hash(nums) {            // 견주기 쉬운 네 글자 지문 (소수 둘째 자리까지)
  let h = 2166136261;
  for (const ch of nums.map(n => n == null ? 'x' : n.toFixed(2)).join('|')) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 4).toUpperCase();
}
function envName() {
  const u = navigator.userAgent;
  const os = /Windows/.test(u) ? 'Windows' : /Android/.test(u) ? 'Android' : /iPhone|iPad/.test(u) ? 'iOS' : /Mac OS X/.test(u) ? 'macOS' : /Linux/.test(u) ? 'Linux' : '?';
  const m = u.match(/(Edg|Firefox|OPR|SamsungBrowser)\/([\d.]+)/) || u.match(/(Chrome|CriOS|FxiOS)\/([\d.]+)/) || u.match(/Version\/([\d.]+).*(Safari)/);
  let br = '?';
  if (m) br = m[2] === 'Safari' ? 'Safari ' + m[1] : ({ Edg: 'Edge', OPR: 'Opera', CriOS: 'Chrome(iOS)', FxiOS: 'Firefox(iOS)', SamsungBrowser: 'Samsung Internet' }[m[1]] || m[1]) + ' ' + m[2].split('.')[0];
  return br + ' / ' + os;
}
const maxDiff = (a, b) => Math.max(...a.map((v, i) => (v == null || b[i] == null) ? 0 : Math.abs(v - b[i])));
const f3 = v => v == null ? '없음' : v.toFixed(3);

function run(fontOk) {
  const a = SAMPLES.map(s => probe(s, SYS, true));
  const b = SAMPLES.map(s => probe(s, "'NSDSpike', " + SYS, true));
  const c = SAMPLES.map(s => probe(s, "'NSDSpike', " + SYS, false));
  const d = SAMPLES.map(table);
  const env = envName();
  const raw = { env, ua: navigator.userAgent, dpr: window.devicePixelRatio, fontOk, a: a.map(v => +v.toFixed(4)), b: b.map(v => +v.toFixed(4)), c: c.map(v => +v.toFixed(4)) };
  $('raw').textContent = JSON.stringify(raw);
  $('rawbox').value = JSON.stringify(raw);
  $('env').textContent = env + ' · 화면 배율 ' + window.devicePixelRatio + (fontOk ? '' : ' · 번들 글꼴을 읽지 못했습니다');

  // 판정
  const has = SAMPLES.map((s, i) => d[i] != null);
  const cIn = c.filter((v, i) => has[i]), dIn = d.filter((v, i) => has[i]);
  const cd = maxDiff(cIn, dIn);
  const ceilBad = cIn.filter((v, i) => Math.ceil(v - TOL) !== Math.ceil(dIn[i] - TOL)).length;
  const lines = [];
  const chip = (ok, t) => `<span class="chip ${ok == null ? 'na' : ok ? 'ok' : 'no'}">${t}</span>`;
  lines.push([chip(cd <= TOL, cd <= TOL ? '같음' : '다름'), `<b>브라우저가 잰 값(다)과 글꼴 파일로 셈한 값(라).</b> 가장 큰 차이 ${cd.toFixed(3)}px. 위로 올림한 값이 다른 줄은 ${ceilBad}개. 같으면 브라우저에 묻지 않고 셈만으로 폭을 정할 수 있습니다.`]);
  if (REF) {
    const da = maxDiff(a, REF.a), dc = maxDiff(c, REF.c);
    lines.push([chip(da <= TOL, da <= TOL ? '같음' : '다름'), `<b>기기의 글꼴로 잰 값(가)을 기준(${esc(REF.env)})과 견줌.</b> 가장 큰 차이 ${da.toFixed(3)}px. 지금 프로토타입이 재는 방법입니다.`]);
    lines.push([chip(dc <= TOL, dc <= TOL ? '같음' : '다름'), `<b>번들 글꼴로 잰 값(다)을 기준과 견줌.</b> 가장 큰 차이 ${dc.toFixed(3)}px.`]);
  } else {
    lines.push([chip(null, '기준 없음'), '기준값을 아직 넣지 않았습니다.']);
  }
  const miss = SAMPLES.filter((s, i) => !has[i]);
  if (miss.length) lines.push([chip(false, '빠진 글자'), `<b>번들 글꼴에 없는 글자가 든 줄 ${miss.length}개</b> (${miss.map(s => '<code>' + esc(s) + '</code>').join(', ')}). 없는 글자는 기기의 다른 글꼴로 그려지므로 번들해도 폭이 환경을 따릅니다.`]);
  $('verdict').innerHTML = lines.map(l => `<div>${l[0]}<span>${l[1]}</span></div>`).join('');
  $('fp').innerHTML = `지문 <b>가</b> <span class="code">${hash(a)}</span> &nbsp; <b>다</b> <span class="code">${hash(c)}</span><br>브라우저마다 <b>가</b>의 지문은 달라도 되고, <b>다</b>의 지문이 같으면 번들이 듣는 것입니다.`;

  // 표
  const cell = (v, base) => { const df = (v == null || base == null) ? null : v - base; return `<td>${f3(v)}</td>` + `<td class="${df != null && Math.abs(df) > TOL ? 'd1' : 'd0'}">${df == null ? '' : (df >= 0 ? '+' : '') + df.toFixed(3)}</td>`; };
  let h = `<tr><th>글자</th><th colspan="2">가 기기의 글꼴<small>잰 값 · 기준과의 차</small></th><th colspan="2">나 번들<small>잰 값 · 기준과의 차</small></th><th colspan="2">다 번들, 커닝 끔<small>잰 값 · 기준과의 차</small></th><th colspan="2">라 글꼴 파일로 셈<small>값 · 다와의 차</small></th></tr>`;
  SAMPLES.forEach((s, i) => {
    const df = d[i] == null ? null : c[i] - d[i];
    h += `<tr><td>${esc(s)}</td>${cell(a[i], REF && REF.a[i])}${cell(b[i], REF && REF.b[i])}${cell(c[i], REF && REF.c[i])}<td>${f3(d[i])}</td><td class="${df != null && Math.abs(df) > TOL ? 'd1' : 'd0'}">${df == null ? '' : (df >= 0 ? '+' : '') + df.toFixed(3)}</td></tr>`;
  });
  $('tbl').innerHTML = h;

  // 저장된 그림 셋
  const texts = ['p ← partition(a, lo, hi)', '피벗보다 작은 값을 왼쪽으로 옮긴다', 'AVATAR To WAVE, Type "Yes"'];
  const w = Math.ceil(Math.max(...texts.map(table))) + 20, lh = 30, hh = lh * texts.length;
  // 게시된 페이지에는 앞에 다른 <style>이 하나 더 있으므로 모든 <style>에서 찾는다
  const face = ([...document.querySelectorAll('style')].map(e => e.textContent).join(' ').match(/@font-face[^}]+}/) || [''])[0];
  const svg = mode => {
    const fam = mode === 'none' ? "NSDSpike, 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif" : 'NSDSpike';
    let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${w + 2}" height="${hh + 2}" viewBox="-1 -1 ${w + 2} ${hh + 2}">`;
    if (mode === 'embed') s += `<style>${face}</style>`;
    texts.forEach((t, i) => {
      s += `<rect x="0" y="${i * lh}" width="${w}" height="${lh}" fill="#edf0f5" stroke="#7e9ccf"/>`;
      s += `<text x="10" y="${i * lh + 20}" font-family="${fam}" font-size="${SIZE}" fill="#151a22" style="font-kerning:none;font-variant-ligatures:none">${esc(t)}</text>`;
      s += `<line x1="${w - 10}" y1="${i * lh + 6}" x2="${w - 10}" y2="${i * lh + lh - 6}" stroke="#d9534f" stroke-width="1" stroke-dasharray="2 2"/>`;
    });
    return s + '</svg>';
  };
  const kb = n => n < 1024 ? n + ' B' : (n / 1024).toFixed(1) + ' KB';
  const cards = [
    ['F1 · 1번', '글꼴을 넣지 않는다', 'none', ['보는 곳에 깔린 글꼴로 그려집니다. 글자가 빨간 점선(셈한 끝)을 넘거나 못 미칩니다.', '파일이 작고, git에서 바뀐 곳이 읽힙니다.', '요구사항 <code>^fmt-text</code>가 지금 적어 둔 길입니다.']],
    ['F1 · 2번', '쓰인 글자만 추려 SVG에 넣는다', 'embed', ['어디서 열어도 글자가 빨간 점선에서 끝납니다.', '<span class="bad">파일마다 글꼴 조각이 들어갑니다.</span> 글자를 하나 더 쓰면 그 덩어리가 통째로 바뀌어 git에서 읽을 수 없습니다.', '일부 문서 도구는 SVG 안의 글꼴을 읽지 않습니다.']],
  ];
  $('f1').innerHTML = cards.map(([tag, title, mode, lis]) => {
    const s = svg(mode);
    return `<article class="card"><header><span class="tag">${tag}</span><h3>${title}</h3></header><div class="paper"><img alt="${title}" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}" width="${w + 2}" height="${hh + 2}"></div><p>이 그림의 크기: <b>${kb(new Blob([s]).size)}</b></p><ul>${lis.map(l => '<li>' + l + '</li>').join('')}</ul></article>`;
  }).join('') + `<article class="card"><header><span class="tag">F1 · 3번</span><h3>글자를 외곽선으로 바꿔 넣는다</h3></header><p>그리지 않았습니다. 글자가 도형이 되므로 어디서나 똑같이 보이지만, 그림에서 글자를 고르거나 찾을 수 없고 파일이 가장 큽니다. 요구사항 <code>^fmt-outline</code>(#P1)이 "옵션"으로 적어 둔 길입니다.</p></article>`;

  // 크기
  const mb = n => n > 1048576 ? (n / 1048576).toFixed(2) + ' MB' : (n / 1024).toFixed(0) + ' KB';
  $('sizes').innerHTML = `<tr><th>무엇을 싣는가</th><th>크기 (woff2)</th></tr>` +
    [['Pretendard Regular 통째 (한글 11,172자, 원본 ttf는 ' + mb(SIZES.ttf) + ')', SIZES.woff2_all], ['자주 쓰는 한글 2,350자와 라틴 · 기호', SIZES.woff2_2350], ['라틴 · 기호만 (한글은 기기의 글꼴)', SIZES.woff2_latin], ['이 페이지에 넣은 조각 (견본 글자만)', SIZES.spike]]
      .map(r => `<tr><td style="font-family:inherit;white-space:normal">${r[0]}</td><td>${mb(r[1])}</td></tr>`).join('');
}

$('copy').addEventListener('click', () => {
  const box = $('rawbox');
  navigator.clipboard.writeText(box.value).then(() => { $('copy').textContent = '복사했습니다'; }).catch(() => { box.focus(); box.select(); $('copy').textContent = '골라 두었습니다. Ctrl+C를 누르세요'; });
});
(document.fonts && document.fonts.load ? document.fonts.load(SIZE + "px 'NSDSpike'", '가A').then(f => f.length > 0, () => false) : Promise.resolve(false)).then(run);
</script>
'''

if __name__ == '__main__':
    main()
