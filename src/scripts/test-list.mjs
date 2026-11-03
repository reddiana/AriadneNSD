// Writes the test list, docs/04-design/08-test-list.md, from the tests themselves: the names of the
// tests, the first comment of each test file and its describe titles. `--check` fails when the
// file is out of date, so `pnpm check` keeps it current (maintainer, 2026-11-01: "테스트들을
// 정리하고 항상 현행화해주세요").
//
// The list is grouped by feature area (maintainer, 2026-11-03: "분류를 해야 독자에게 유용한 정보가
// 될 수 있습니다"). Every test file belongs to one area by its path (`areas` below); a new file
// that matches none fails the script. In each area, every file is listed once with its count, and
// a test whose name starts with ids (`AT-04: …`, `BUG-03 · QA-19: …`, `R-NFR-04: …`, `UX EX3: …`)
// is listed on its own. The ids defined in the documents (QA in the scenarios, AT in 07-testing,
// BUG in the defect log) that no test names are listed at the end.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const src = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = join(src, '..');
const outFile = join(repo, 'docs/04-design/08-test-list.md');

/** Files that test several modules together (with a fake shell or a fake DOM): "통합". */
const integrationFiles = new Set([
  'packages/core/node/golden.test.ts',
  'packages/editor/src/create-editor.test.ts',
  'packages/editor/src/ui/editor-app.test.tsx',
  'packages/editor/src/session/engine.test.ts',
  'packages/editor/src/session/diagrams.test.ts',
  'packages/editor/src/session/random-keys.test.ts',
  'apps/web/src/shell/web-shell.test.ts',
  'apps/web/src/files/web-document-store.test.ts',
]);

const typeOrder = ['E2E', '통합', '단위', '성능'];

/**
 * The feature areas, in reading order. A file belongs to the first area with a path that its path
 * starts with (or ends with, for a path that starts with a dot).
 */
const areas = [
  {
    name: '인수 테스트',
    about:
      'MVP를 받아들이는 기준(AT-01 ~ AT-17)을, 빌드한 웹 앱을 브라우저에서 열고 사용자처럼 조작해 확인합니다 → [[07-testing#4. MVP의 인수 테스트]]',
    paths: ['apps/web/e2e/acceptance.spec.ts'],
  },
  {
    name: '편집 명령과 모델',
    about:
      '블록 넣기 · 지우기 · 옮기기 · 감싸기, 분기, 호출, 다이어그램과 헤더, 복사 · 붙여넣기가 문서를 바르게 바꾸는지, 어떤 명령을 이어도 모델의 불변식이 지켜지는지 → [[01-model]]',
    paths: [
      'packages/core/src/commands/',
      'packages/core/src/model/',
      'packages/editor/src/session/engine.test.ts',
      'packages/editor/src/clipboard/',
    ],
  },
  {
    name: '키 · 마우스 · 선택',
    about:
      '키가 어느 명령으로 가는지, 이동과 선택, 두 키 조합의 힌트, 클릭 · 끌기가 어느 블록을 가리키는지, 선택 테두리와 캔버스의 포커스 → [[03-keymap]], [[02-interaction-rules]]',
    paths: [
      'packages/editor/src/input/',
      'packages/editor/src/navigation/',
      'packages/editor/src/state/',
      'packages/editor/src/session/',
      'packages/editor/src/ui/key-hint.test.ts',
      'packages/editor/src/ui/keys.test.ts',
      'packages/editor/src/dom/',
      'apps/web/e2e/canvas.spec.ts',
    ],
  },
  {
    name: '메뉴 · 화면 · 시작',
    about:
      '메뉴와 툴바, 화면 언어, 예제, 판 번호, 페이지가 뜨는 과정, 휴대폰 화면 → [[05-screen-layout]], [[06-web]]',
    paths: [
      'packages/editor/src/ui/',
      'packages/editor/src/examples/',
      'packages/editor/src/version.test.ts',
      'apps/web/src/shell/messages.test.ts',
      'apps/web/e2e/examples.spec.ts',
      'apps/web/e2e/boot.spec.ts',
      'apps/web/e2e/mobile.spec.ts',
      'apps/web/e2e/smoke.spec.ts',
    ],
  },
  {
    name: '파일',
    about:
      '파일 형식(모델이 든 SVG)의 쓰기 · 읽기 · 왕복, 손상된 파일, 편집기와 셸의 약속, 웹의 저장 · 열기 · 내려받기, 임시 보관, 탭 잠금, 최근 파일, PNG 내보내기 → [[01-file-format]], [[06-web]]',
    paths: [
      'packages/core/src/format/',
      'packages/core/node/golden.test.ts',
      'packages/editor/src/create-editor.test.ts',
      'apps/web/src/',
      'apps/web/e2e/files.spec.ts',
    ],
  },
  {
    name: '레이아웃 · 그리기 · 글자',
    about: '블록의 크기와 자리, SVG로 그리기, 글자 폭 재기, 번들 글꼴과 그 서브셋 → [[02-layout]]',
    paths: [
      'packages/core/src/layout/',
      'packages/core/src/render/render-doc',
      'packages/core/src/text/',
      'packages/fonts/',
    ],
  },
  {
    name: '성능',
    about: '그리기의 시간 예산(벤치마크) → [[03-quality-attribute-scenarios]]',
    paths: ['.bench.ts'],
  },
];

function areaOf(path) {
  const area = areas.find((a) =>
    a.paths.some((p) => (p.startsWith('.') ? path.endsWith(p) : path.startsWith(p))),
  );
  if (area === undefined) {
    console.error(`${path} is in no area. Add it to \`areas\` in src/scripts/test-list.mjs.`);
    process.exit(1);
  }
  return area.name;
}
const areaIndex = (name) => areas.findIndex((area) => area.name === name);
const idPattern = String.raw`(?:AT|QA|BUG)-\d+|R-[A-Z]+-\d+|UX [A-Z]+\d+`;
const leadingIds = new RegExp(
  String.raw`^((?:${idPattern})(?:\s*[·,]\s*(?:${idPattern}))*)(\s*\([^)]*\))?:\s*(.*)$`,
);
const anyId = new RegExp(idPattern, 'g');

function testFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    // manual-shots/ takes the user guide's pictures with Playwright; it is not a test (DR-0020).
    if (
      ['node_modules', 'dist', 'test-results', 'playwright-report', 'manual-shots'].includes(
        entry.name,
      )
    )
      continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...testFiles(path));
    else if (/\.(test\.tsx?|spec\.ts|bench\.ts)$/.test(entry.name)) found.push(path);
  }
  return found;
}

/** The first string argument of each call to one of `names` (multi-line calls included). */
function titles(text, names) {
  const pattern = new RegExp(
    String.raw`\b(?:${names})(?:\.each\([\s\S]*?\))?\(\s*(['"\`])((?:\\.|(?!\1)[^\\])*)\1`,
    'g',
  );
  return [...text.matchAll(pattern)].map((match) => match[2].replace(/\\(['"`])/g, '$1'));
}

/**
 * Every test has its own id, `T-` and four digits, at the start of its name (`T-0412: …`, or
 * `T-0412 · BUG-03: …` before the ids of what it checks), so that a test can be named in talk
 * (maintainer, 2026-11-03: "ID가 있으면 어떤 테스트에 대해 정확하게 지목하고 논의를 할 수
 * 있습니다"). An id never changes and is never used again; `scripts/test-ids.json` keeps the next
 * number. `--assign-ids` gives the tests without one the next numbers, in the order of the list.
 */
const testIdFile = join(src, 'scripts/test-ids.json');
const ownId = /^(T-\d{4})(?: · |: )/;
const testCall = String.raw`(\b(?:test|it|bench)(?:\.each\([\s\S]*?\))?\(\s*)(['"\`])((?:\\.|(?!\2)[^\\])*)\2`;

/** A test name split into its own id, the ids of what it checks and the rest. */
function parseTest(name) {
  const own = ownId.exec(name);
  const rest = own === null ? name : name.slice(own[0].length);
  const match = leadingIds.exec(rest);
  if (match === null) return { id: own?.[1] ?? null, ids: [], what: rest };
  const note = match[2] === undefined ? '' : ` ${match[2].trim()}`;
  return { id: own?.[1] ?? null, ids: match[1].split(/\s*[·,]\s*/), what: `${match[3]}${note}` };
}

/** The file's opening comment, up to its first sentence or blank comment line. */
function header(text) {
  const lines = [];
  for (const line of text.split('\n')) {
    if (!line.startsWith('//')) break;
    const body = line.replace(/^\/\/\s?/, '');
    if (body.startsWith('@vitest-environment')) continue;
    if (body.trim() === '') break;
    lines.push(body.trim());
  }
  const joined = lines.join(' ');
  const end = joined.search(/[.:](\s|$)/);
  return end === -1 ? joined : joined.slice(0, end);
}

function method(path, text) {
  if (path.includes('/e2e/')) return 'Playwright';
  if (path.endsWith('.bench.ts')) return 'Vitest bench';
  if (path.includes('golden')) return '골든 파일';
  if (text.includes("from 'fast-check'")) return '속성 기반 (fast-check)';
  if (text.includes('happy-dom')) return 'Vitest + happy-dom';
  return 'Vitest';
}

function type(path) {
  if (path.includes('/e2e/')) return 'E2E';
  if (path.endsWith('.bench.ts')) return '성능';
  return integrationFiles.has(path) ? '통합' : '단위';
}

/** A wiki link for an id, with `\|` when it goes in a table. */
function link(id, inTable = true) {
  const bar = inTable ? '\\|' : '|';
  if (id.startsWith('AT-')) return `[[07-testing#4. MVP의 인수 테스트${bar}${id}]]`;
  if (id.startsWith('QA-')) return `[[03-quality-attribute-scenarios#1. 목록${bar}${id}]]`;
  if (id.startsWith('BUG-')) return `[[defects#${id}${bar}${id}]]`;
  if (id.startsWith('UX ')) return `[[ux-decisions${bar}${id}]]`;
  const area = id.split('-')[1].toLowerCase();
  return `[[01-requirements#^r-${area}${bar}${id}]]`;
}

const cell = (text) => text.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
const unique = (items) => [...new Set(items)];

const files = testFiles(join(src, 'apps'))
  .concat(testFiles(join(src, 'packages')))
  .map((path) => {
    const rel = relative(src, path).replaceAll('\\', '/');
    const text = readFileSync(path, 'utf8').replaceAll('\r\n', '\n');
    const tests = titles(text, 'test|it|bench').map(parseTest);
    const describes = titles(text, 'describe|test\\.describe');
    const purpose = header(text) || describes.join(' · ');
    const refs = unique(
      [...`${header(text)} ${describes.join(' ')}`.matchAll(anyId)].map((m) => m[0]),
    );
    return {
      rel,
      text,
      tests,
      purpose,
      refs,
      type: type(rel),
      method: method(rel, text),
      area: areaOf(rel),
    };
  })
  .sort(
    (a, b) =>
      areaIndex(a.area) - areaIndex(b.area) ||
      typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type) ||
      a.rel.localeCompare(b.rel),
  );

const allTests = files.flatMap((file) => file.tests.map((test) => ({ ...test, file })));
const idTests = allTests.filter((test) => test.ids.length > 0);

let nextId = 1;
try {
  nextId = JSON.parse(readFileSync(testIdFile, 'utf8')).next;
} catch {
  // No file yet: the first id is T-0001.
}
const format = (n) => `T-${String(n).padStart(4, '0')}`;

if (process.argv.includes('--assign-ids')) {
  let given = 0;
  for (const file of files) {
    const path = join(src, file.rel);
    const before = readFileSync(path, 'utf8');
    const after = before.replace(new RegExp(testCall, 'g'), (whole, call, quote, name) => {
      if (ownId.test(name)) return whole;
      const id = format(nextId);
      nextId += 1;
      given += 1;
      const joint = leadingIds.test(name) ? ' · ' : ': ';
      return `${call}${quote}${id}${joint}${name}${quote}`;
    });
    if (after !== before) writeFileSync(path, after);
  }
  writeFileSync(testIdFile, `${JSON.stringify({ next: nextId }, null, 2)}\n`);
  console.log(`Gave ${String(given)} tests an id; the next is ${format(nextId)}.`);
  process.exit(0);
}

const problems = [];
const seen = new Map();
for (const test of allTests) {
  if (test.id === null) {
    problems.push(`${test.file.rel}: "${test.what}" has no id`);
    continue;
  }
  if (seen.has(test.id))
    problems.push(`${test.id} is in ${seen.get(test.id)} and ${test.file.rel}`);
  seen.set(test.id, test.file.rel);
  if (Number(test.id.slice(2)) >= nextId)
    problems.push(`${test.id} is not below the next id in scripts/test-ids.json`);
}
if (problems.length > 0) {
  console.error(
    [
      ...problems,
      'Run `node scripts/test-list.mjs --assign-ids` in src/ to give new tests ids.',
    ].join('\n'),
  );
  process.exit(1);
}

function definedIds(docPath, prefix) {
  const text = readFileSync(join(repo, docPath), 'utf8');
  return unique(
    // The first cell is the id, or a link to its section (`[[#BUG-01\|BUG-01]]`).
    [
      ...text.matchAll(
        new RegExp(String.raw`^\| (?:\[\[#[^\]|\\]*\\\|)?(${prefix}-\d+)(?:\]\])? \|`, 'gm'),
      ),
    ].map((m) => m[1]),
  );
}
const defined = [
  ...definedIds('docs/01-requirements/03-quality-attribute-scenarios.md', 'QA'),
  ...definedIds('docs/04-design/07-testing.md', 'AT'),
  ...definedIds('atelier/defects.md', 'BUG'),
];
const named = new Set(idTests.flatMap((test) => test.ids));
const untested = defined.filter((id) => !named.has(id));

/** The QA ids an acceptance test covers, from the AT table of 07-testing ("… (UC-02, QA-04)"). */
const testingDoc = readFileSync(join(repo, 'docs/04-design/07-testing.md'), 'utf8');
const atOfQa = new Map();
for (const match of testingDoc.matchAll(/^\| (AT-\d+) \| ([^|]*)\|/gm)) {
  for (const qa of match[2].match(/QA-\d+/g) ?? []) {
    if (named.has(match[1])) atOfQa.set(qa, [...(atOfQa.get(qa) ?? []), match[1]]);
  }
}

/** Checks that are not tests but run in `pnpm check` or CI (03-quality-attribute-scenarios 3). */
const checks = new Map([
  ['QA-09', '번들 사이즈 체크 `apps/web/scripts/check-size.mjs` (CI의 웹 빌드 뒤)'],
  ['QA-10', '의존 방향 검사 dependency-cruiser (`pnpm deps`)'],
  ['QA-12', 'TypeScript의 완전성 검사 (`pnpm typecheck`)'],
  ['QA-14', '`core` · `fonts`의 `tsconfig`에 `dom`이 없음 (`pnpm typecheck`)'],
]);

/** Where an id without a test of its own is covered, or "없음". */
function coveredBy(id) {
  const ways = [];
  const owners = files.filter((file) => file.refs.includes(id)).map((file) => `\`${file.rel}\``);
  if (owners.length > 0) ways.push(`파일: ${owners.join(', ')}`);
  if (atOfQa.has(id))
    ways.push(
      `인수 테스트: ${atOfQa
        .get(id)
        .map((id) => link(id))
        .join(', ')}`,
    );
  if (checks.has(id)) ways.push(`검사: ${checks.get(id)}`);
  return ways.length > 0 ? ways.join('<br>') : '없음';
}

const testCount = (of) => of.reduce((sum, file) => sum + file.tests.length, 0);
const countRow = (name, of) =>
  `| ${name} | ${typeOrder
    .map((kind) => {
      const n = testCount(of.filter((file) => file.type === kind));
      return n === 0 ? '' : String(n);
    })
    .join(' | ')} | ${String(testCount(of))} |`;
const counts = [
  ...areas.map((area, i) =>
    countRow(
      `[[#2.${String(i + 1)} ${area.name}\\|${area.name}]]`,
      files.filter((file) => file.area === area.name),
    ),
  ),
  countRow('모두', files),
];

/**
 * The Korean of the English texts that come from the code (maintainer, 2026-11-03: "코드는 그대로
 * 두세요. 문서에만 한국어로 번역해달라는 말입니다"). The code stays English (DR-0017); the
 * document is Korean. An English text without Korean fails the script; `--add-missing` adds the
 * missing ones with an empty value and drops the unused ones, and Claude fills them in.
 */
const koFile = join(src, 'scripts/test-list-ko.json');
let koTable = {};
try {
  koTable = JSON.parse(readFileSync(koFile, 'utf8'));
} catch {
  // No file yet: every text is missing.
}
const wanted = new Set();
function ko(english) {
  const key = english.replace(/\s+/g, ' ').trim();
  if (key === '') return '';
  wanted.add(key);
  return koTable[key] || '';
}

const testRow = (test) =>
  `| ${test.id} | ${cell(ko(test.what))} | ${test.ids.map((id) => link(id)).join(', ')} |`;

/**
 * The block id of a file's table (`^t-apps-web-e2e-boot-spec-ts`). Other documents link a test as
 * `[[08-test-list#^t-…|T-0278]]`: Obsidian goes to the table (it cannot point at a row), and the
 * site build goes to the row (site/prepare-content.mjs), as for requirement ids (DR-0016).
 */
const blockOf = (rel) => `t-${rel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

/** One file: a line about the whole file, then one row per test. */
const fileBlock = (file) => [
  `#### \`${file.rel}\``,
  '',
  [
    ko(file.purpose),
    `${file.type} · ${file.method} · 테스트 ${String(file.tests.length)}개`,
    ...(file.refs.length === 0
      ? []
      : [`파일 전체가 확인하는 것: ${file.refs.map((id) => link(id, false)).join(', ')}`]),
  ].join('. ') + '.',
  '',
  '| ID | 테스트 | 확인하는 것 |',
  '| --- | --- | --- |',
  ...file.tests.map((test) => testRow({ ...test, file })),
  '',
  `^${blockOf(file.rel)}`,
  '',
];

/** Links to tests in these documents must point at the table of the test's file. */
const linkingDocs = ['atelier/defects.md'];
for (const doc of linkingDocs) {
  const text = readFileSync(join(repo, doc), 'utf8');
  for (const m of text.matchAll(/\[\[08-test-list#\^([a-z0-9-]+)\\?\|(T-\d{4})\]\]/g)) {
    const file = seen.get(m[2]);
    if (file === undefined) problems.push(`${doc}: ${m[2]} is not a test`);
    else if (blockOf(file) !== m[1])
      problems.push(`${doc}: ${m[2]} should link to #^${blockOf(file)}`);
  }
}
if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}

const areaSections = areas.flatMap((area, i) => {
  const of = files.filter((file) => file.area === area.name);
  return [
    `### 2.${String(i + 1)} ${area.name}`,
    '',
    `${area.about}. 파일 ${String(of.length)}개, 테스트 ${String(testCount(of))}개.`,
    '',
    ...of.flatMap(fileBlock),
  ];
});

const lines = [
  '---',
  'title: 테스트 목록',
  'tags:',
  '  - design',
  'status: 생성됨',
  '---',
  '',
  '# 테스트 목록',
  '',
  '지금 코드에 있는 테스트의 목록입니다. 무엇을 왜 어떻게 테스트하는지의 원칙은 [[07-testing]], 품질 속성 시나리오는 [[03-quality-attribute-scenarios]], 결함은 [[defects|결함 기록]]에 있습니다.',
  '',
  '> [!info] 이 문서는 손으로 고치지 않습니다',
  '> `src/scripts/test-list.mjs`가 테스트의 이름과 테스트 파일의 첫 주석에서 만듭니다(`src/`에서 `pnpm test-list`). `pnpm check`가 이 문서가 코드와 다르면 실패하므로, 테스트를 더하거나 바꾸면 이 문서도 같은 커밋에서 바뀝니다. 테스트 코드의 이름과 주석은 영어이고(→ [[dr-0017-code-language-and-commits|DR-0017]]), 이 문서에는 한국어로 옮겨 적습니다. 번역은 `src/scripts/test-list-ko.json`에 있고, 번역이 빠진 테스트가 있으면 `pnpm check`가 실패합니다.',
  '',
  '## 읽는 법',
  '',
  '- **ID:** 테스트마다 `T-`와 네 자리 번호의 ID가 있습니다(테스트 코드의 이름 맨 앞). 번호는 바뀌지 않고, 지운 테스트의 번호는 다시 쓰지 않습니다.',
  '- **영역:** 테스트를 그것이 확인하는 기능으로 묶었습니다(2장). 영역 안에서는 테스트 파일마다 제목 하나와 표 하나입니다. 제목 아래 한 줄에 파일이 무엇을 확인하는지, 유형 · 방법, 파일 전체가 확인하는 것을 적고, 표에는 그 파일의 테스트를 한 줄씩 적습니다. 어느 파일이 어느 영역인지는 스크립트의 표(`areas`)가 정합니다.',
  '- **유형:** **단위**는 모듈 하나(가짜 없이 함수와 그 결과), **통합**은 모듈 여럿을 함께(`editor`와 `core`를 가짜 셸이나 가짜 DOM 위에서, 골든 파일의 열기 → 저장), **E2E**는 사용자 관점(빌드한 웹 앱을 브라우저에서 열고 클릭 · 키 · 탭으로), **성능**은 벤치마크입니다. 사람이 하는 **수동** 점검은 [[07-testing#5. 도구와 CI]]의 출시 전 점검표에 있습니다.',
  '- **방법:** 테스트 도구와 기법(Vitest, 속성 기반, 골든 파일, Playwright)',
  '- **확인하는 것:** 그 테스트가 확인하는 요구사항(`R-`), 품질 속성 시나리오(`QA-`), 인수 테스트(`AT-`), 결함(`BUG-`), UX 결정(`UX`)의 ID입니다. 테스트 여럿이 같은 것을 확인하면 같은 ID가 여러 줄에 나옵니다(예: 결함 하나를 테스트 둘이 확인).',
  '- **이름 규칙:** 테스트 코드의 이름은 `T-0412: …`, 확인하는 것이 있으면 `T-0412 · BUG-03 · QA-19: …`입니다. 이 문서는 확인하는 것의 ID를 "확인하는 것" 칸에 옮기고, 나머지를 "테스트" 칸에 한국어로 적습니다.',
  '',
  '## 1. 요약',
  '',
  '영역마다 유형별 테스트 수입니다.',
  '',
  `| 영역 | ${typeOrder.join(' | ')} | 모두 |`,
  `| --- | ${typeOrder.map(() => '---').join(' | ')} | --- |`,
  ...counts,
  '',
  '## 2. 영역마다',
  '',
  ...areaSections,
  '## 3. 테스트가 없는 ID',
  '',
  '문서에 정의된 시나리오(`QA-`) · 인수 테스트(`AT-`) · 결함(`BUG-`) 가운데, 이름에 그 ID를 단 테스트가 없는 것입니다. 테스트 파일이 통째로 맡거나(2장의 "파일 전체가 확인하는 것"), 인수 테스트가 맡거나([[07-testing#4. MVP의 인수 테스트]]의 표), 테스트가 아닌 검사가 맡은 것은 그 길을 적습니다. “없음”은 사람이 점검표로 보거나 아직 테스트가 없는 빈 곳입니다.',
  '',
  '| ID | 다른 길로 맡은 것 |',
  '| --- | --- |',
  ...untested.map((id) => `| ${link(id)} | ${coveredBy(id)} |`),
  '',
];

const output = lines.join('\n');

/**
 * The "테스트 ID" line under the "테스트" line of each scenario in 03-quality-attribute-scenarios
 * (maintainer, 2026-11-03: "QAS의 테스트 부분에 있다면 테스트ID를 넣어주세요"). It is written
 * here so that it never falls behind the tests.
 */
const qasFile = join(repo, 'docs/01-requirements/03-quality-attribute-scenarios.md');
const testLink = (test) => `[[08-test-list#^${blockOf(test.file.rel)}|${test.id}]]`;
function testIdsOf(qa) {
  const parts = [];
  const whole = files.filter((f) => f.refs.includes(qa));
  // A test of a file that checks the scenario as a whole is listed with that file only.
  const own = allTests.filter((test) => test.ids.includes(qa) && !whole.includes(test.file));
  if (own.length > 0) parts.push(own.map(testLink).join(', '));
  for (const file of whole) {
    const of = file.tests.map((test) => ({ ...test, file }));
    const range =
      of.length === 1 ? testLink(of[0]) : `${testLink(of[0])} ~ ${of[of.length - 1].id}`;
    parts.push(`\`${file.rel}\`의 테스트 ${String(of.length)}개(${range})`);
  }
  for (const at of atOfQa.get(qa) ?? []) {
    const ofAt = allTests.filter((test) => test.ids.includes(at));
    parts.push(`인수 테스트 ${link(at, false)}(${ofAt.map(testLink).join(', ')})`);
  }
  if (checks.has(qa)) parts.push(`테스트가 아닌 검사: ${checks.get(qa)}`);
  return parts.length > 0 ? parts.join('. ') : '없음';
}
const qasBefore = readFileSync(qasFile, 'utf8').replaceAll('\r\n', '\n');
let qa = null;
const qasOutput = qasBefore
  .split('\n')
  .filter((line) => !line.startsWith('- **테스트 ID:**'))
  .flatMap((line) => {
    const heading = /^### (QA-\d+) /.exec(line);
    if (heading !== null) qa = heading[1];
    else if (line.startsWith('## ')) qa = null;
    if (qa !== null && line.startsWith('- **테스트:**'))
      return [line, `- **테스트 ID:** ${testIdsOf(qa)}`];
    return [line];
  })
  .join('\n');

const missing = [...wanted].filter((key) => !koTable[key]);
const unused = Object.keys(koTable).filter((key) => !wanted.has(key));
if (process.argv.includes('--add-missing')) {
  const next = Object.fromEntries(
    [...wanted].sort((x, y) => x.localeCompare(y)).map((key) => [key, koTable[key] ?? '']),
  );
  writeFileSync(koFile, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`${String(missing.length)} texts need Korean in ${relative(src, koFile)}.`);
  process.exit(0);
}
if (missing.length > 0 || unused.length > 0) {
  console.error(
    `${relative(src, koFile)}: ${String(missing.length)} texts have no Korean, ${String(unused.length)} are unused. Run \`node scripts/test-list.mjs --add-missing\` and fill in the Korean.`,
  );
  process.exit(1);
}
if (process.argv.includes('--check')) {
  let current = '';
  try {
    current = readFileSync(outFile, 'utf8').replaceAll('\r\n', '\n');
  } catch {
    // Missing: out of date.
  }
  if (current !== output || qasBefore !== qasOutput) {
    console.error(
      'docs/04-design/08-test-list.md or the test ids in 03-quality-attribute-scenarios.md are out of date. Run `pnpm test-list` in src/.',
    );
    process.exit(1);
  }
  console.log('The test list is up to date.');
} else {
  writeFileSync(outFile, output);
  if (qasBefore !== qasOutput) writeFileSync(qasFile, qasOutput);
  console.log(
    `Wrote ${relative(repo, outFile)}: ${String(files.length)} files, ${String(allTests.length)} tests.`,
  );
}
