// 처음 그림을 만든 스크립트. 2026-11-17부터 원본은 `docs/03-architecture/assets/*.drawio.svg`이고 draw.io로 고친다.
// 다시 돌리면 손으로 고친 것이 사라진다.
//
// Builds the C&C view of the AriadneNSD web app as draw.io files (M58).
// Usage: node 2026-11-17-cc-view-build.mjs <outDir>
// Writes cc-view-a.drawio (shell above editor, straight lines) and cc-view-b.drawio
// (shell below editor, routed lines), and prints the number of connector crossings
// and of connectors passing through boxes for each.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outDir = process.argv[2] ?? '.';

const legendHeight = 600;
const W = 140;
const H = 60;

const COLORS = {
  state: 'fillColor=#dae8fc;strokeColor=#3b5b8c;fontColor=#1d2330;',
  pure: 'fillColor=#e3f1e3;strokeColor=#3c7a45;fontColor=#1d2330;',
  ext: 'fillColor=#e1e4e9;strokeColor=#5d6676;fontColor=#1d2330;',
};

const FONT = 'fontFamily=Malgun Gothic;fontSize=12;';

const SHAPES = {
  passive: 'rounded=0;html=0;',
  active: 'shape=process;size=0.07;rounded=0;html=0;',
  store: 'shape=cylinder3;boundedLbl=1;size=8;html=0;',
  actor: 'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=0;outlineConnect=0;fillColor=#ffffff;strokeColor=#1d2330;',
};

const EDGE = {
  call: 'endArrow=block;endFill=1;strokeColor=#1d2330;strokeWidth=1.3;',
  async: 'endArrow=open;endFill=0;strokeColor=#1f5fbf;strokeWidth=2.2;',
  notify: 'endArrow=open;endFill=0;strokeColor=#d9822b;strokeWidth=1.5;dashed=1;dashPattern=6 4;',
  message: 'startArrow=open;startFill=0;endArrow=open;endFill=0;strokeColor=#7b4bb7;strokeWidth=1.5;dashed=1;dashPattern=10 3 2 3;',
};

// Components: id, label, kind (passive | active | store | actor), color, x, y, [w, h]
function components(layout) {
  const p = layout.pos;
  const list = [
    ['user', '사용자', 'actor', null],
    ['input', '입력\n키 · 마우스 · 드래그', 'active', 'state'],
    ['ui', '주변 UI (React)\n메뉴 · 툴바 · 모달', 'passive', 'state'],
    ['reg', '명령 레지스트리', 'passive', 'state'],
    ['sess', '세션\n문서 · undo · 선택', 'passive', 'state'],
    ['view', '캔버스 뷰\n그림 + 오버레이', 'passive', 'state'],
    ['ser', '저장', 'passive', 'state'],
    ['cmd', '편집 명령', 'passive', 'pure'],
    ['lay', '레이아웃', 'passive', 'pure'],
    ['ren', '렌더러', 'passive', 'pure'],
    ['fmt', '파일 형식', 'passive', 'pure'],
    ['adv', 'advance 폭 테이블', 'passive', 'pure'],
    ['sub', '서브세팅 (wasm)', 'passive', 'pure'],
    ['ws', '웹 셸\nWebShell', 'passive', 'state'],
    ['timers', '타이머\n자동 저장 · 로컬 백업', 'active', 'state'],
    ['share', '공유 링크', 'active', 'state'],
    ['lock', '탭 잠금', 'active', 'state'],
    ['store', '파일 어댑터\nDocumentStore 구현', 'passive', 'state'],
    ['sfont', '화면 글꼴 로더', 'passive', 'state'],
    ['xfont', '저장 글꼴 로더', 'passive', 'state'],
    ['dom', 'DOM (화면)', 'passive', 'ext'],
    ['clip', '시스템 클립보드', 'passive', 'ext'],
    ['idb', 'IndexedDB\n백업 · 최근 파일\n브라우저 문서', 'store', 'ext'],
    ['fs', '로컬 파일\nFS Access · 내려받기', 'store', 'ext'],
    ['lst', 'localStorage\n사용자 설정', 'store', 'ext'],
    ['url', '주소창 #fragment', 'passive', 'ext'],
    ['bc', '다른 탭\nBroadcastChannel', 'passive', 'ext'],
    ['host', '정적 호스팅\nariadnensd.com', 'passive', 'ext'],
  ];
  return list.map(([id, label, kind, color]) => {
    const [x, y, w = W, h = H] = p[id];
    return { id, label, kind, color, x, y, w, h };
  });
}

// Connectors: id, type, from, to
const CONNECTORS = [
  ['C-01', 'notify', 'user', 'input'],
  ['C-02', 'call', 'input', 'reg'],
  ['C-03', 'call', 'ui', 'reg'],
  ['C-04', 'call', 'reg', 'sess'],
  ['C-05', 'call', 'sess', 'cmd'],
  ['C-06', 'notify', 'sess', 'view'],
  ['C-07', 'call', 'view', 'lay'],
  ['C-08', 'call', 'lay', 'adv'],
  ['C-09', 'call', 'view', 'ren'],
  ['C-10', 'call', 'view', 'dom'],
  ['C-11', 'notify', 'sess', 'ws'],
  ['C-12', 'call', 'ws', 'ser'],
  ['C-13', 'call', 'ser', 'fmt'],
  ['C-14', 'call', 'fmt', 'sub'],
  ['C-15', 'call', 'sess', 'store'],
  ['C-16', 'async', 'store', 'fs'],
  ['C-17', 'async', 'store', 'idb'],
  ['C-18', 'async', 'timers', 'idb'],
  ['C-19', 'call', 'ws', 'lst'],
  ['C-20', 'message', 'lock', 'bc'],
  ['C-21', 'notify', 'url', 'share'],
  ['C-22', 'call', 'share', 'ws'],
  ['C-23', 'async', 'sfont', 'host'],
  ['C-24', 'async', 'sub', 'host'],
  ['C-25', 'async', 'xfont', 'host'],
  ['C-26', 'async', 'ui', 'clip'],
];

// ---------- Layout B: shell below the editor, routed lines ----------
const B = {
  name: 'b',
  pos: {
    user: [40, 195, 40, 70],
    input: [160, 200], reg: [360, 200], sess: [560, 200], view: [760, 200],
    ui: [160, 340], ser: [760, 390],
    dom: [760, 80, 140, 50],
    ren: [1000, 90], lay: [1000, 200], cmd: [1000, 300], fmt: [1000, 390],
    adv: [1220, 200], sub: [1220, 390],
    timers: [260, 560], store: [440, 560], ws: [620, 560], share: [820, 560],
    lock: [1000, 560], sfont: [1180, 560], xfont: [1360, 560],
    clip: [130, 780], idb: [310, 780, 170, 84], fs: [495, 780, 140, 84], lst: [650, 780, 130, 84],
    url: [820, 780], bc: [1000, 780], host: [1180, 780, 290, 60],
  },
  // Each route: [from point, ...waypoints, to point]. Endpoints sit on box borders.
  routes: {
    'C-01': [[80, 230], [160, 230]],
    'C-02': [[300, 230], [360, 230]],
    'C-03': [[300, 370], [430, 370], [430, 260]],
    'C-04': [[500, 230], [560, 230]],
    'C-05': [[680, 260], [680, 330], [1000, 330]],
    'C-06': [[700, 230], [760, 230]],
    'C-07': [[900, 230], [1000, 230]],
    'C-08': [[1140, 230], [1220, 230]],
    'C-09': [[900, 212], [950, 212], [950, 120], [1000, 120]],
    'C-10': [[830, 200], [830, 130]],
    'C-11': [[650, 260], [650, 560]],
    'C-12': [[740, 560], [740, 505], [830, 505], [830, 450]],
    'C-13': [[900, 420], [1000, 420]],
    'C-14': [[1140, 420], [1220, 420]],
    'C-15': [[590, 260], [590, 500], [510, 500], [510, 560]],
    'C-16': [[555, 620], [555, 780]],
    'C-17': [[460, 620], [460, 780]],
    'C-18': [[370, 620], [370, 780]],
    'C-19': [[700, 620], [700, 780]],
    'C-20': [[1070, 620], [1070, 780]],
    'C-21': [[890, 780], [890, 620]],
    'C-22': [[820, 590], [760, 590]],
    'C-23': [[1250, 620], [1250, 780]],
    'C-24': [[1360, 420], [1560, 420], [1560, 810], [1470, 810]],
    'C-25': [[1430, 620], [1430, 780]],
    'C-26': [[200, 400], [200, 780]],
  },
  boundaries: [
    ['tab', '브라우저 탭 · 프로세스 (메인 스레드 하나)', 120, 20, 1425, 660, 'process'],
    ['m-editor', 'packages/editor', 140, 150, 790, 320, 'module'],
    ['m-core', 'packages/core · 순수 함수', 980, 60, 180, 410, 'module'],
    ['m-fonts', 'packages/fonts', 1200, 150, 180, 320, 'module'],
    ['m-web', 'apps/web · 웹 셸', 240, 530, 1290, 120, 'module'],
  ],
  legend: [1620, 20],
};

// ---------- Layout A: shell above the editor (straight lines, for comparison) ----------
const shiftA = 190;
const A = {
  name: 'a',
  pos: Object.fromEntries(
    Object.entries(B.pos).map(([id, [x, y, w, h]]) => {
      const webRow = ['timers', 'store', 'ws', 'share', 'lock', 'sfont', 'xfont'];
      if (webRow.includes(id)) return [id, [x, 60, w, h]];
      if (['clip', 'idb', 'fs', 'lst', 'url', 'bc', 'host'].includes(id)) return [id, [x, y + shiftA - 160, w, h]];
      return [id, [x, y + shiftA, w, h]];
    }),
  ),
  routes: null,
  boundaries: [
    ['tab', '브라우저 탭 · 프로세스 (메인 스레드 하나)', 120, 10, 1410, 670, 'process'],
    ['m-web', 'apps/web · 웹 셸', 240, 30, 1270, 120, 'module'],
    ['m-editor', 'packages/editor', 140, 150 + shiftA - 20, 790, 320, 'module'],
    ['m-core', 'packages/core · 순수 함수', 980, 60 + shiftA - 20, 180, 410, 'module'],
    ['m-fonts', 'packages/fonts', 1200, 150 + shiftA - 20, 180, 320, 'module'],
  ],
  legend: [1620, 20],
};

// Straight route from box centre to box centre, clipped to the borders.
function clip(box, from, to) {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const tx = dx === 0 ? Infinity : Math.abs(box.w / 2 / dx);
  const ty = dy === 0 ? Infinity : Math.abs(box.h / 2 / dy);
  const t = Math.min(tx, ty);
  return [cx + dx * t, cy + dy * t];
}

function straightRoutes(boxes, conns) {
  const byId = Object.fromEntries(boxes.map((b) => [b.id, b]));
  const routes = {};
  for (const [id, , from, to] of conns) {
    const a = byId[from];
    const b = byId[to];
    const ca = [a.x + a.w / 2, a.y + a.h / 2];
    const cb = [b.x + b.w / 2, b.y + b.h / 2];
    routes[id] = [clip(a, ca, cb), clip(b, cb, ca)];
  }
  return routes;
}

// ---------- geometry checks ----------
function segs(route) {
  const out = [];
  for (let i = 0; i < route.length - 1; i++) out.push([route[i], route[i + 1]]);
  return out;
}
function cross(p, q, r, s) {
  const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const d1 = d(p, q, r);
  const d2 = d(p, q, s);
  const d3 = d(r, s, p);
  const d4 = d(r, s, q);
  return d1 * d2 < 0 && d3 * d4 < 0;
}
function segHitsBox(a, b, box) {
  const inset = 2;
  const x0 = box.x + inset, x1 = box.x + box.w - inset, y0 = box.y + inset, y1 = box.y + box.h - inset;
  // sample along the segment
  for (let i = 1; i < 40; i++) {
    const t = i / 40;
    const x = a[0] + (b[0] - a[0]) * t;
    const y = a[1] + (b[1] - a[1]) * t;
    if (x > x0 && x < x1 && y > y0 && y < y1) return true;
  }
  return false;
}
function check(routes, boxes, conns) {
  const ids = Object.keys(routes);
  const crossings = [];
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++)
      for (const [p, q] of segs(routes[ids[i]]))
        for (const [r, s] of segs(routes[ids[j]])) if (cross(p, q, r, s)) crossings.push(`${ids[i]}×${ids[j]}`);
  const throughBoxes = [];
  for (const [id, , from, to] of conns)
    for (const box of boxes) {
      if (box.id === from || box.id === to) continue;
      if (segs(routes[id]).some(([a, b]) => segHitsBox(a, b, box))) throughBoxes.push(`${id}→${box.id}`);
    }
  return { crossings, throughBoxes };
}

// ---------- draw.io XML ----------
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '&#10;');

function build(layout) {
  const boxes = layout.boxes ?? components(layout);
  const conns = layout.connectors ?? CONNECTORS;
  const routes = layout.routes ?? straightRoutes(boxes, conns);
  const cells = [];
  const vertex = (id, value, style, x, y, w, h) =>
    cells.push(`<mxCell id="${id}" value="${esc(value)}" style="${style}" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`);

  for (const [id, label, x, y, w, h, kind] of layout.boundaries) {
    const style =
      kind === 'process'
        ? 'rounded=0;fillColor=none;dashed=1;dashPattern=12 6;strokeWidth=2.5;strokeColor=#5d6676;verticalAlign=top;align=left;spacingLeft=10;spacingTop=4;fontStyle=1;' + FONT
        : 'rounded=0;fillColor=none;dashed=1;dashPattern=3 3;strokeWidth=1;strokeColor=#5d6676;verticalAlign=top;align=left;spacingLeft=8;spacingTop=2;fontColor=#5d6676;' + FONT + 'fontSize=11;';
    vertex(id, label, style, x, y, w, h);
  }
  for (const b of boxes) {
    const style = SHAPES[b.kind] + (b.color ? COLORS[b.color] : '') + FONT;
    vertex(b.id, b.label, style, b.x, b.y, b.w, b.h);
  }
  const P = 10;
  const ports = [];
  for (const [id, type, from, to] of conns) {
    const route = routes[id];
    const pts = route.slice(1, -1).map(([x, y]) => `<mxPoint x="${x}" y="${y}"/>`).join('');
    const [sx, sy] = route[0];
    const [tx, ty] = route[route.length - 1];
    const style = `${EDGE[type]}rounded=1;arcSize=20;html=0;fontSize=10;fontStyle=1;labelBackgroundColor=#ffffff;fontColor=#1d2330;fontFamily=Malgun Gothic;`;
    cells.push(
      `<mxCell id="e-${id}" value="${id}" style="${style}" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${sx}" y="${sy}" as="sourcePoint"/><mxPoint x="${tx}" y="${ty}" as="targetPoint"/>${pts ? `<Array as="points">${pts}</Array>` : ''}</mxGeometry></mxCell>`,
    );
    const two = type === 'message';
    if (from !== 'user') ports.push([`p-${id}-o`, sx, sy, two ? 'out' : 'out']);
    ports.push([`p-${id}-i`, tx, ty, two ? 'out' : 'in']);
  }
  for (const [pid, x, y, dir] of ports) {
    const style = `rounded=0;strokeColor=#1d2330;fillColor=${dir === 'out' ? '#1d2330' : '#ffffff'};`;
    vertex(pid, '', style, x - P / 2, y - P / 2, P, P);
  }
  legend(layout.legend, vertex, new Set(layout.legendSkip ?? []));
  const xml = `<mxfile><diagram name="C&amp;C view (web)" id="cc-${layout.name}"><mxGraphModel grid="0" page="0" background="#ffffff"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells.join('')}</root></mxGraphModel></diagram></mxfile>`;
  return { xml, ...check(routes, boxes, conns) };
}

function legend([lx, ly], vertex, skip) {
  const txt = 'text;html=0;align=left;verticalAlign=middle;' + FONT + 'fontSize=11;';
  vertex('lg-box', '표기법', 'rounded=0;fillColor=#ffffff;strokeColor=#5d6676;verticalAlign=top;align=left;spacingLeft=10;spacingTop=6;fontStyle=1;' + FONT, lx, ly, 300, legendHeight - 40 * skip.size);
  let y = ly + 40;
  const row = (id, draw, text, h = 30) => {
    if (skip.has(id)) return;
    draw(lx + 14, y, h);
    vertex(`lg-t-${id}`, text, txt, lx + 104, y, 186, h);
    y += h + 10;
  };
  row('pas', (x, yy) => vertex('lg-pas', '', SHAPES.passive + COLORS.state, x, yy, 76, 30), '수동 컴포넌트: 불릴 때만 일함');
  row('act', (x, yy) => vertex('lg-act', '', SHAPES.active + COLORS.state, x, yy, 76, 30), '능동 컴포넌트: 이벤트 ·\n타이머로 스스로 움직임');
  row('pure', (x, yy) => vertex('lg-pure', '', SHAPES.passive + COLORS.pure, x, yy, 76, 30), '순수 함수 (core · fonts)');
  row('ext', (x, yy) => vertex('lg-ext', '', SHAPES.passive + COLORS.ext, x, yy, 76, 30), '브라우저 · 바깥\n(우리 코드가 아님)');
  row('store', (x, yy) => vertex('lg-store', '', SHAPES.store + COLORS.ext, x + 18, yy - 4, 40, 40), '영속 저장소', 34);
  row('port', (x, yy) => {
    vertex('lg-po', '', 'rounded=0;strokeColor=#1d2330;fillColor=#1d2330;', x + 12, yy + 10, 10, 10);
    vertex('lg-pi', '', 'rounded=0;strokeColor=#1d2330;fillColor=#ffffff;', x + 50, yy + 10, 10, 10);
  }, '포트: ■ 보내는 쪽 · □ 받는 쪽');
  const line = (id, style, text) =>
    row(id, (x, yy) => {
      legendEdges.push(`<mxCell id="lg-${id}-e" style="${style}html=0;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${x}" y="${yy + 15}" as="sourcePoint"/><mxPoint x="${x + 76}" y="${yy + 15}" as="targetPoint"/></mxGeometry></mxCell>`);
    }, text);
  line('call', EDGE.call, '함수 호출 (같은 스레드, 동기)');
  line('async', EDGE.async, '비동기 호출\n(브라우저 API · HTTP, Promise)');
  line('notify', EDGE.notify, '알림 (이벤트 · 콜백)');
  line('msg', EDGE.message, '메시지 (BroadcastChannel)');
  row('proc', (x, yy) => vertex('lg-proc', '', 'rounded=0;fillColor=none;dashed=1;dashPattern=12 6;strokeWidth=2.5;strokeColor=#5d6676;', x, yy, 76, 30), '프로세스 경계 (브라우저 탭)');
  row('mod', (x, yy) => vertex('lg-mod', '', 'rounded=0;fillColor=none;dashed=1;dashPattern=3 3;strokeColor=#5d6676;', x, yy, 76, 30), '모듈 경계 (패키지)');
  vertex('lg-note', '선 위의 C-01 … 은 커넥터 ID\n(카탈로그 표)', txt + 'fontColor=#5d6676;', lx + 14, y, 276, 30);
}
const legendEdges = [];

// ---------- Overview: seven boxes, same orientation as layout B ----------
const OW = 180;
const OH = 70;
const ob = (id, label, kind, color, x, y, w = OW, h = OH) => ({ id, label, kind, color, x, y, w, h });
const OVERVIEW = {
  name: 'overview',
  boxes: [
    ob('user', '사용자', 'actor', null, 40, 115, 40, 70),
    ob('editor', 'editor\n화면 · 입력 · undo', 'passive', 'state', 160, 115),
    ob('core', 'core\n모델 · 레이아웃 · 그림', 'passive', 'pure', 520, 115),
    ob('fonts', 'fonts\n글자 폭 · 서브셋', 'passive', 'pure', 860, 115),
    ob('shell', '웹 셸\n파일 · 백업 · 공유 링크', 'passive', 'state', 160, 300),
    ob('stores', '브라우저 저장소\n파일 · IndexedDB · 설정', 'store', 'ext', 150, 490, 200, 80),
    ob('host', '정적 호스팅\n글꼴 · wasm', 'passive', 'ext', 700, 495, 340, OH),
  ],
  connectors: [
    ['C-01', 'notify', 'user', 'editor'],
    ['C-05 · 07 · 09 · 13', 'call', 'editor', 'core'],
    ['C-08 · 14', 'call', 'core', 'fonts'],
    ['C-15', 'call', 'editor', 'shell'],
    ['C-12', 'call', 'shell', 'editor'],
    ['C-11', 'notify', 'editor', 'shell'],
    ['C-16 ~ 18', 'async', 'shell', 'stores'],
    ['C-19', 'call', 'shell', 'stores'],
    ['C-23 · 25', 'async', 'shell', 'host'],
    ['C-24', 'async', 'fonts', 'host'],
  ],
  routes: {
    'C-01': [[80, 150], [160, 150]],
    'C-05 · 07 · 09 · 13': [[340, 150], [520, 150]],
    'C-08 · 14': [[700, 150], [860, 150]],
    'C-15': [[200, 185], [200, 300]],
    'C-12': [[250, 300], [250, 185]],
    'C-11': [[300, 185], [300, 300]],
    'C-16 ~ 18': [[220, 370], [220, 490]],
    'C-19': [[290, 370], [290, 490]],
    'C-23 · 25': [[340, 335], [760, 335], [760, 495]],
    'C-24': [[980, 185], [980, 495]],
  },
  boundaries: [
    ['tab', '브라우저 탭 · 프로세스', 120, 60, 960, 360, 'process'],
  ],
  legend: [1130, 20],
  legendSkip: ['act', 'msg', 'mod'],
};


for (const layout of [A, B, OVERVIEW]) {
  legendEdges.length = 0;
  const { xml, crossings, throughBoxes } = build(layout);
  const full = xml.replace('</root>', `${legendEdges.join('')}</root>`);
  writeFileSync(join(outDir, `cc-view-${layout.name}.drawio`), full);
  console.log(`layout ${layout.name}: crossings ${crossings.length} [${crossings.join(', ')}]; through boxes ${throughBoxes.length} [${throughBoxes.join(', ')}]`);
}
