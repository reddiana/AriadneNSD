// Writes the model JSON Schema document, docs/05-spec/02-model-schema.md, from the schema itself
// (packages/core/schema/model.schema.json): a table for each object, a class diagram of how the
// objects hold one another, the rules the schema cannot see, and the schema as it is (maintainer,
// 2026-11-10: "모델 JSON의 JSON Schema도 설계의 중요한 부분입니다. 문서에 포함시켜 다른
// 사람들이 볼 수 있게"). `--check` fails when the document is out of date, so `pnpm check`
// keeps it current, as for the test list.
//
// The schema's own descriptions are English, for other programs; the document is Korean. The
// Korean of every object and field is in packages/core/schema/model.schema.ko.json, and an object
// or a field without Korean, or Korean for one the schema no longer has, fails the script.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const src = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = join(src, '..');
const schemaFile = join(src, 'packages/core/schema/model.schema.json');
const koFile = join(src, 'packages/core/schema/model.schema.ko.json');
const outFile = join(repo, 'docs/05-spec/02-model-schema.md');

const schemaText = readFileSync(schemaFile, 'utf8').replaceAll('\r\n', '\n');
const schema = JSON.parse(schemaText);
const ko = JSON.parse(readFileSync(koFile, 'utf8'));

/**
 * The objects of the schema, in reading order: where each is (a JSON pointer), its key in the
 * Korean file and its class in the diagram. A union (`oneOf`) lists its variants. An object of the
 * schema that is not here fails the script, so a new one gets a table.
 */
const objects = [
  { pointer: '', key: 'document', name: 'Document' },
  { pointer: '/properties/settings', key: 'settings', name: 'Settings' },
  { pointer: '/properties/diagrams/items', key: 'diagram', name: 'Diagram' },
  { pointer: '/properties/diagrams/items/properties/head', key: 'head', name: 'Head' },
  { pointer: '/properties/view', key: 'view', name: 'View' },
  { pointer: '/$defs/block', key: 'block', name: 'Block', union: true },
  { pointer: '/$defs/block/oneOf/0', key: 'block.process', name: 'ProcessBlock' },
  { pointer: '/$defs/block/oneOf/1', key: 'block.if', name: 'IfBlock' },
  { pointer: '/$defs/block/oneOf/2', key: 'block.case', name: 'CaseBlock' },
  { pointer: '/$defs/block/oneOf/3', key: 'block.loop', name: 'LoopBlock' },
  { pointer: '/$defs/block/oneOf/4', key: 'block.call', name: 'CallBlock' },
  { pointer: '/$defs/branch', key: 'branch', name: 'Branch' },
  { pointer: '/$defs/arm', key: 'arm', name: 'Arm' },
  { pointer: '/$defs/folds/items', key: 'fold', name: 'Fold' },
  { pointer: '/$defs/siteFold', key: 'siteFold', name: 'SiteFold' },
  { pointer: '/$defs/callTarget', key: 'target', name: 'CallTarget', union: true },
  { pointer: '/$defs/callTarget/oneOf/0', key: 'target.local', name: 'LocalTarget' },
  { pointer: '/$defs/callTarget/oneOf/1', key: 'target.named', name: 'NamedTarget' },
  { pointer: '/$defs/callTarget/oneOf/2', key: 'target.external', name: 'ExternalTarget' },
  { pointer: '/$defs/callTarget/oneOf/3', key: 'target.lost', name: 'LostTarget' },
];

const problems = [];

function at(pointer) {
  let node = schema;
  for (const part of pointer.split('/').slice(1)) {
    node = node?.[part.replaceAll('~1', '/').replaceAll('~0', '~')];
  }
  if (node === undefined) problems.push(`no ${pointer} in the schema`);
  return node ?? {};
}

const byPointer = new Map(objects.map((object) => [object.pointer, object]));
objects.forEach((object, index) => {
  object.node = at(object.pointer);
  object.heading = `2.${String(index + 1)} ${ko[object.key]?.title ?? object.key}`;
});

/** Every object or `oneOf` of the schema must be one of `objects`. */
function walk(node, pointer) {
  if (node === null || typeof node !== 'object') return;
  const isObject = node.type === 'object' || node.oneOf !== undefined;
  if (isObject && !byPointer.has(pointer)) problems.push(`${pointer}: not in \`objects\``);
  for (const [key, child] of Object.entries(node)) {
    walk(child, `${pointer}/${key.replaceAll('~', '~0').replaceAll('/', '~1')}`);
  }
}
walk(schema, '');

/** A node and where it is: the node a `$ref` points to, or the node itself at `pointer`. */
const resolve = (node, pointer) =>
  node.$ref === undefined
    ? { node, pointer }
    : { node: at(node.$ref.slice(1)), pointer: node.$ref.slice(1) };

/** A wiki link to the section of an object (`cell` escapes its bar in a table). */
const linkTo = (object) =>
  `[[#${object.heading}|${ko[object.key]?.title.replace(/ \(.*\)$/, '') ?? object.key}]]`;

const code = (value) => `\`${typeof value === 'string' ? JSON.stringify(value) : String(value)}\``;
const cell = (text) => text.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();

/** The type and the allowed values of a field, for the table. */
function describeType(field, fieldPointer) {
  const { node, pointer } = resolve(field, fieldPointer);
  const target = byPointer.get(pointer);
  if (target !== undefined) return { type: linkTo(target), allowed: '' };
  if (node.const !== undefined)
    return {
      type: typeof node.const === 'number' ? 'integer' : typeof node.const,
      allowed: `${code(node.const)}만`,
    };
  if (node.enum !== undefined) return { type: 'string', allowed: node.enum.map(code).join(' · ') };
  if (node.type === 'array') {
    const item = describeType(node.items, `${pointer}/items`);
    const count = node.minItems === undefined ? '' : `, ${String(node.minItems)}개 이상`;
    return { type: `${item.type}의 배열${count}`, allowed: item.allowed };
  }
  if (node.pattern !== undefined) {
    const example = /^\^([a-z])\[1-9\]\[0-9\]\*\$$/.exec(node.pattern);
    const allowed =
      example === null
        ? `\`${node.pattern}\``
        : `\`${example[1]}1\`, \`${example[1]}2\` … (\`${node.pattern}\`)`;
    return { type: node.type, allowed };
  }
  return { type: node.type ?? '', allowed: '' };
}

/** The Korean of a key, or a problem. */
function korean(key, field) {
  const entry = ko[key];
  const text = field === undefined ? entry?.about : entry?.fields?.[field];
  if (typeof text !== 'string' || text === '') {
    problems.push(
      `${relative(src, koFile)}: no Korean for ${key}${field === undefined ? '' : `.${field}`}`,
    );
    return '';
  }
  return text;
}

function objectSection(object) {
  const lines = [`### ${object.heading}`, '', korean(object.key)];
  if (object.union) {
    const variants = objects.filter((each) => each.pointer.startsWith(`${object.pointer}/oneOf/`));
    lines.push('', `꼴: ${variants.map(linkTo).join(' · ')}`, '');
    return lines;
  }
  const required = new Set(object.node.required ?? []);
  const rows = Object.entries(object.node.properties ?? {}).map(([name, field]) => {
    const { type, allowed } = describeType(field, `${object.pointer}/properties/${name}`);
    return `| \`${name}\` | ${cell(type)} | ${required.has(name) ? '필수' : '생략 가능'} | ${cell(allowed) || '-'} | ${cell(korean(object.key, name))} |`;
  });
  lines.push(
    '',
    '| 필드 | 타입 | 필수 | 허용 값 | 설명 |',
    '| --- | --- | :---: | --- | --- |',
    ...rows,
    '',
  );
  return lines;
}

// Korean for keys the schema does not have.
for (const [key, entry] of Object.entries(ko)) {
  const object = objects.find((each) => each.key === key);
  if (object === undefined) {
    problems.push(`${relative(src, koFile)}: ${key} is not an object of the schema`);
    continue;
  }
  for (const field of Object.keys(entry.fields ?? {})) {
    if (object.node.properties?.[field] === undefined)
      problems.push(`${relative(src, koFile)}: ${key}.${field} is not a field of the schema`);
  }
  if (typeof entry.title !== 'string' || entry.title === '')
    problems.push(`${relative(src, koFile)}: ${key} has no title`);
}

/** The object a field holds, itself or as the items of an array, with how many. */
function held(field, fieldPointer, isRequired) {
  const direct = resolve(field, fieldPointer);
  const isArray = direct.node.type === 'array';
  const { pointer } = isArray ? resolve(direct.node.items, `${direct.pointer}/items`) : direct;
  const object = byPointer.get(pointer);
  if (object === undefined) return undefined;
  const count = isArray
    ? (direct.node.minItems ?? 0) > 0
      ? '1..*'
      : '*'
    : isRequired
      ? '1'
      : '0..1';
  return { object, count };
}

const variantsOf = (union) =>
  objects.filter((each) => each.pointer.startsWith(`${union.pointer}/oneOf/`));

/** The fields every form of a union has; drawn on the union, not on each form. */
const commonFields = (union) =>
  variantsOf(union)
    .map((each) => Object.keys(each.node.properties ?? {}))
    .reduce((all, keys) => all.filter((key) => keys.includes(key)));

/** The class diagram: what holds what (composition) and which object is a form of a union. */
function classDiagram() {
  const lines = ['```mermaid', 'classDiagram'];
  const unionOf = (object) =>
    objects.find((each) => each.union && object.pointer.startsWith(`${each.pointer}/oneOf/`));
  for (const object of objects) {
    const shared = object.union
      ? []
      : unionOf(object) === undefined
        ? []
        : commonFields(unionOf(object));
    const members = object.union ? ['<<oneOf>>', ...commonFields(object)] : [];
    const required = new Set(object.node.required ?? []);
    for (const [name, field] of Object.entries(object.node.properties ?? {})) {
      if (
        !shared.includes(name) &&
        held(field, `${object.pointer}/properties/${name}`, required.has(name)) === undefined
      )
        members.push(name);
    }
    lines.push(`  class ${object.name} {`, ...members.map((member) => `    ${member}`), '  }');
  }
  for (const object of objects) {
    if (object.union) {
      for (const variant of variantsOf(object)) lines.push(`  ${object.name} <|-- ${variant.name}`);
      continue;
    }
    const required = new Set(object.node.required ?? []);
    for (const [name, field] of Object.entries(object.node.properties ?? {})) {
      const holds = held(field, `${object.pointer}/properties/${name}`, required.has(name));
      if (holds !== undefined)
        lines.push(`  ${object.name} *-- "${holds.count}" ${holds.object.name} : ${name}`);
    }
  }
  lines.push('```');
  return lines;
}

const sections = objects.flatMap(objectSection);
const diagram = classDiagram();

const lines = [
  '---',
  'title: 모델 JSON 스키마',
  'aliases:',
  '  - model-schema',
  'tags:',
  '  - spec',
  'status: 생성됨',
  `format-version: ${String(schema.properties.version.const)}`,
  '---',
  '',
  '# 모델 JSON 스키마',
  '',
  '모델 JSON(저장 파일의 `<ans:document>` 안과 공유 링크에 담기는 JSON)의 JSON Schema(draft 2020-12)를 사람이 읽도록 풀어 쓴 것입니다. 원본은 `src/packages/core/schema/model.schema.json`이고, 사이트에는 다른 AI와 프로그램을 위해 `/model.schema.json`으로 놓입니다 → [[06-web#3.1 LLM · 에이전트를 위한 안내서]]',
  '',
  '- 필드의 뜻, 적는 순서, 생략 규칙, 모르는 값을 만났을 때는 [[01-file-format#3. 모델 JSON]]이 원본입니다. 이 문서는 그 모양을 스키마의 눈으로 다시 보입니다.',
  '- 모델의 TypeScript 타입과 불변식은 [[01-model#1. 타입]]과 [[01-model#3. 불변식]]에 있습니다.',
  '- 스키마는 모양만 봅니다. 이 판이 아는 값(텍스트의 언어, 테마, 그림 문구의 언어)만 나열하고, 파일이 지켜야 하지만 모양으로는 적을 수 없는 규칙은 앱의 파서가 봅니다(3장).',
  '',
  '> [!info] 이 문서는 손으로 고치지 않습니다',
  '> `src/scripts/model-schema-doc.mjs`가 스키마에서 만듭니다(`src/`에서 `pnpm schema-doc`). 스키마의 설명은 다른 프로그램을 위한 영어이고, 이 문서의 한국어 설명은 `src/packages/core/schema/model.schema.ko.json`에 있습니다. 설명이 빠진 객체나 필드가 있거나 이 문서가 스키마와 다르면 `pnpm check`가 실패합니다.',
  '',
  '## 1. 객체의 관계',
  '',
  '채운 마름모(◆)는 담는 것과 그 수, 빈 삼각형(△)은 `oneOf`의 꼴입니다(`kind`로 가름). 상자 안은 다른 객체를 담지 않는 필드입니다.',
  '',
  ...diagram,
  '',
  '## 2. 객체마다의 필드',
  '',
  '"필수"는 반드시 적는 키, "생략 가능"은 정해진 경우에 적지 않는 키입니다(언제 생략하는지는 설명 칸과 [[01-file-format#3.3 노드별 필드]]). 어느 객체든 표에 없는 키가 있으면 스키마도 파서도 거절합니다(`additionalProperties: false`).',
  '',
  ...sections,
  '## 3. 스키마가 보지 못하는 규칙',
  '',
  '아래는 스키마를 통과해도 앱이 깨진 파일(`damaged`)로 거절하는 것입니다. 파서(`src/packages/core/src/format/parse-model.ts`)가 모양을 읽은 뒤 모델의 불변식(`src/packages/core/src/model/invariants.ts`)을 검사합니다. 번호는 [[01-model#3. 불변식]]의 번호입니다. 테스트가 이 규칙마다 스키마는 통과하고 파서는 거절하는 모델을 만들어 봅니다(`src/packages/core/node/model-schema.test.ts`).',
  '',
  '| 규칙 | 불변식 |',
  '| --- | :---: |',
  '| 문서 안의 id(다이어그램, 블록, 분기, 접기 영역, 펴 보인 곳의 접기 영역)는 모두 다르다 | 3 |',
  '| Case는 분기가 적어도 하나 있다: `arms`가 비었으면 `otherwise`가 있어야 한다 | 4 |',
  '| 접기 영역의 `first`와 `last`는 그 접기 영역이 붙은 줄(같은 `body`)의 블록이고, `first`가 `last`보다 앞이거나 같다 | 5 |',
  '| 한 줄의 접기 영역들은 서로 떨어져 있거나 하나가 다른 하나를 온전히 품는다(걸쳐 겹치지 않음). 범위가 똑같은 접기 영역은 둘이 없다 | 5 |',
  '| `local` 호출 대상의 `diagram`은 이 문서의 다이어그램이고, 그 헤더는 Method다 | 6 |',
  '| 헤더도 내용도 없는 다이어그램(`head`가 없고 본문이 빈 처리 블록 하나)은 다이어그램이 그것 하나일 때만 있다 | 7 |',
  '',
  '스키마가 이미 보는 불변식도 있습니다: 다이어그램이 적어도 하나(1, `diagrams`의 `minItems`), 비지 않는 줄(2, `body`의 `minItems`), If의 두 분기(4, `yes` · `no`가 필수).',
  '',
  '거꾸로 파서가 스키마보다 너그러운 곳도 있습니다. 뒤의 판이 쓴 파일을 이 판이 열 수 있게 하려는 것입니다 → [[01-file-format#3.3 노드별 필드]]',
  '',
  '- `textKind` · `locale`이 이 판이 모르는 문자열이면 파서는 일반 텍스트 · 연 사람의 화면 언어로 그리고, 받은 값은 저장할 때 그대로 적는다. `theme`이 모르는 이름이면 기본 테마로 그리고 값은 그대로 둔다. 스키마는 이 판이 아는 값만 받는다.',
  '- `version`이 1보다 낮으면 파서는 마이그레이션해 읽는다(0은 프로토타입이라 열지 않음). 스키마는 지금 판(1)만 받는다.',
  '- 블록을 가리키는 id(접기 영역의 `first` · `last`, `via`, `view`의 목록)는 꼴만 본다. `view`와 펴 보인 곳의 접기 영역은 없는 id를 가리켜도 된다(약한 참조).',
  '',
  '## 4. 스키마 원문',
  '',
  '> [!example]- `model.schema.json` (펼쳐 보기)',
  '> ```json',
  ...schemaText
    .trimEnd()
    .split('\n')
    .map((line) => `> ${line}`.trimEnd()),
  '> ```',
  '',
];

const output = lines.join('\n');
if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
if (process.argv.includes('--check')) {
  let current = '';
  try {
    current = readFileSync(outFile, 'utf8').replaceAll('\r\n', '\n');
  } catch {
    // Missing: out of date.
  }
  if (current !== output) {
    console.error('docs/05-spec/02-model-schema.md is out of date. Run `pnpm schema-doc` in src/.');
    process.exit(1);
  }
  console.log('The model schema document is up to date.');
} else {
  writeFileSync(outFile, output);
  console.log(`Wrote ${relative(repo, outFile)}: ${String(objects.length)} objects.`);
}
