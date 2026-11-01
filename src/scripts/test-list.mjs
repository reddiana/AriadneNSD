// Writes the test list, docs/04-design/08-test-list.md, from the tests themselves: the names of the
// tests, the first comment of each test file and its describe titles. `--check` fails when the
// file is out of date, so `pnpm check` keeps it current (maintainer, 2026-11-01: "테스트들을
// 정리하고 항상 현행화해주세요").
//
// A test whose name starts with ids (`AT-04: …`, `BUG-03 · QA-19: …`, `R-NFR-04: …`, `UX EX3: …`)
// is listed on its own; every test file is listed once with its count. The ids defined in the
// documents (QA in the scenarios, AT in 07-testing, BUG in the defect log) that no test names are
// listed at the end.
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
const idPattern = String.raw`(?:AT|QA|BUG)-\d+|R-[A-Z]+-\d+|UX [A-Z]+\d+`;
const leadingIds = new RegExp(
  String.raw`^((?:${idPattern})(?:\s*·\s*(?:${idPattern}))*)(\s*\([^)]*\))?:\s*(.*)$`,
);
const anyId = new RegExp(idPattern, 'g');

function testFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'test-results', 'playwright-report'].includes(entry.name))
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

/** A wiki link for an id, with `\|` because it goes in a table. */
function link(id) {
  if (id.startsWith('AT-')) return `[[07-testing#4. MVP의 인수 테스트\\|${id}]]`;
  if (id.startsWith('QA-')) return `[[03-quality-attribute-scenarios#1. 목록\\|${id}]]`;
  if (id.startsWith('BUG-')) return `[[defects\\|${id}]]`;
  if (id.startsWith('UX ')) return `[[ux-decisions\\|${id}]]`;
  const area = id.split('-')[1].toLowerCase();
  return `[[01-requirements#^r-${area}\\|${id}]]`;
}

const cell = (text) => text.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
const unique = (items) => [...new Set(items)];

const files = testFiles(join(src, 'apps'))
  .concat(testFiles(join(src, 'packages')))
  .map((path) => {
    const rel = relative(src, path).replaceAll('\\', '/');
    const text = readFileSync(path, 'utf8').replaceAll('\r\n', '\n');
    const tests = titles(text, 'test|it|bench');
    const describes = titles(text, 'describe|test\\.describe');
    const purpose = header(text) || describes.join(' · ');
    const refs = unique(
      [...`${header(text)} ${describes.join(' ')}`.matchAll(anyId)].map((m) => m[0]),
    );
    return { rel, text, tests, purpose, refs, type: type(rel), method: method(rel, text) };
  })
  .sort(
    (a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type) || a.rel.localeCompare(b.rel),
  );

const idTests = files.flatMap((file) =>
  file.tests.flatMap((name) => {
    const match = leadingIds.exec(name);
    if (match === null) return [];
    const ids = match[1].split(/\s*·\s*/);
    const note = match[2] === undefined ? '' : ` ${match[2].trim()}`;
    return [{ ids, what: `${match[3]}${note}`, file }];
  }),
);
idTests.sort((a, b) => a.ids[0].localeCompare(b.ids[0], 'en', { numeric: true }));

function definedIds(docPath, prefix) {
  const text = readFileSync(join(repo, docPath), 'utf8');
  return unique(
    [...text.matchAll(new RegExp(String.raw`^\| (${prefix}-\d+) \|`, 'gm'))].map((m) => m[1]),
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
  if (atOfQa.has(id)) ways.push(`인수 테스트: ${atOfQa.get(id).map(link).join(', ')}`);
  if (checks.has(id)) ways.push(`검사: ${checks.get(id)}`);
  return ways.length > 0 ? ways.join('<br>') : '없음';
}

const counts = typeOrder.map((kind) => {
  const of = files.filter((file) => file.type === kind);
  return `| ${kind} | ${String(of.length)} | ${String(of.reduce((sum, file) => sum + file.tests.length, 0))} |`;
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
  '> `src/scripts/test-list.mjs`가 테스트의 이름과 테스트 파일의 첫 주석에서 만듭니다(`src/`에서 `pnpm test-list`). `pnpm check`가 이 문서가 코드와 다르면 실패하므로, 테스트를 더하거나 바꾸면 이 문서도 같은 커밋에서 바뀝니다. 목적/내용은 테스트 코드의 영어 그대로입니다.',
  '',
  '## 읽는 법',
  '',
  '- **유형:** **단위**는 모듈 하나(가짜 없이 함수와 그 결과), **통합**은 모듈 여럿을 함께(`editor`와 `core`를 가짜 셸이나 가짜 DOM 위에서, 골든 파일의 열기 → 저장), **E2E**는 사용자 관점(빌드한 웹 앱을 브라우저에서 열고 클릭 · 키 · 탭으로), **성능**은 벤치마크입니다. 사람이 하는 **수동** 점검은 [[07-testing#5. 도구와 CI]]의 출시 전 점검표에 있습니다.',
  '- **방법:** 테스트 도구와 기법(Vitest, 속성 기반, 골든 파일, Playwright)',
  '- **근거:** 그 테스트가 확인하는 요구사항(`R-`), 품질 속성 시나리오(`QA-`), 인수 테스트(`AT-`), 결함(`BUG-`), UX 결정(`UX`)',
  '- **이름 규칙:** 근거가 하나인 테스트는 이름 앞에 ID를 적습니다(`AT-04: …`, 여럿이면 `BUG-03 · QA-19: …`). 그런 테스트는 2장에 한 줄씩 나옵니다. 모든 테스트 파일은 3장에 한 줄씩 나오고, 파일의 첫 주석이 목적/내용이 됩니다(주석이 없으면 `describe`의 이름).',
  '',
  '## 1. 요약',
  '',
  '| 유형 | 파일 | 테스트 |',
  '| --- | --- | --- |',
  ...counts,
  '',
  '## 2. ID가 있는 테스트',
  '',
  '| ID | 목적/내용 | 근거 | 방법 | 유형 | 자리 |',
  '| --- | --- | --- | --- | --- | --- |',
  ...idTests.map(
    ({ ids, what, file }) =>
      `| ${link(ids[0])} | ${cell(what)} | ${ids.slice(1).map(link).join(', ') || '—'} | ${file.method} | ${file.type} | \`${file.rel}\` |`,
  ),
  '',
  '## 3. 파일마다',
  '',
  '| 자리 | 목적/내용 | 근거 | 방법 | 유형 | 테스트 수 |',
  '| --- | --- | --- | --- | --- | --- |',
  ...files.map(
    (file) =>
      `| \`${file.rel}\` | ${cell(file.purpose)} | ${file.refs.map(link).join(', ') || '—'} | ${file.method} | ${file.type} | ${String(file.tests.length)} |`,
  ),
  '',
  '## 4. 테스트가 없는 ID',
  '',
  '문서에 정의된 시나리오(`QA-`) · 인수 테스트(`AT-`) · 결함(`BUG-`) 가운데, 이름에 그 ID를 단 테스트가 없는 것입니다. 테스트 파일이 통째로 맡거나(3장의 근거 칸), 인수 테스트가 맡거나([[07-testing#4. MVP의 인수 테스트]]의 표), 테스트가 아닌 검사가 맡은 것은 그 길을 적습니다. “없음”은 사람이 점검표로 보거나 아직 테스트가 없는 빈 곳입니다.',
  '',
  '| ID | 다른 길로 맡은 것 |',
  '| --- | --- |',
  ...untested.map((id) => `| ${link(id)} | ${coveredBy(id)} |`),
  '',
];

const output = lines.join('\n');
if (process.argv.includes('--check')) {
  let current = '';
  try {
    current = readFileSync(outFile, 'utf8').replaceAll('\r\n', '\n');
  } catch {
    // Missing: out of date.
  }
  if (current !== output) {
    console.error('docs/04-design/08-test-list.md is out of date. Run `pnpm test-list` in src/.');
    process.exit(1);
  }
  console.log('The test list is up to date.');
} else {
  writeFileSync(outFile, output);
  console.log(
    `Wrote ${relative(repo, outFile)}: ${String(files.length)} files, ${String(idTests.length)} tests with ids.`,
  );
}
