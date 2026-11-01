---
title: 코딩 가이드
tags:
  - coding-guide
status: 초안
updated: 2026-11-01
---

# 코딩 가이드

`src/` 아래 코드를 쓸 때의 규칙입니다. 사람이든 Claude든 이 문서를 따릅니다. 코드를 쓰기 전에 이 문서와 [[06-glossary|용어집]]을 읽습니다.

> [!info] 읽는 법
> - 규칙은 둘로 나뉩니다. 도구가 강제하는 것(1장)은 도구의 설정까지 여기에 정의하고, 설정 파일은 이 정의대로 만듭니다. 도구가 잡지 못하는 것(2장부터)만 글로 적습니다.
> - 설정 파일과 이 문서가 다르면 둘 중 하나가 틀린 것입니다. 바꿀 때는 둘을 한 커밋으로 함께 바꿉니다.
> - 어떤 도구를 쓰는지는 [[0038-build-and-test-tools|ADR-0038]]과 [[03-architecture#8. 기술 스택]], 테스트를 어떻게 짜는지는 [[07-testing]]에 있습니다.
> - 주석은 영어, 커밋 메시지는 Conventional Commits에 한국어 본문입니다 → [[dr-0017-code-language-and-commits|DR-0017]]

## 1. 도구가 강제하는 것

모든 검사는 `src/`에서 `pnpm check` 하나로 돌고(타입 검사 → 린트 → 포맷 확인 → 의존 방향 → 테스트), CI가 같은 명령을 실행합니다. 하나라도 실패하면 병합하지 않습니다.

| 도구 | 무엇을 강제하나 | 설정 파일 (`src/` 기준) | 언제 |
| --- | --- | --- | --- |
| EditorConfig | 문자 인코딩, 줄 끝, 들여쓰기 | `../.editorconfig` (저장소 맨 위) | 편집기가 저장할 때 |
| Prettier | 코드의 모양(줄 바꿈, 따옴표, 쉼표) | `prettier.config.js` | 저장할 때, `pnpm check` |
| TypeScript | 타입, 엄격 모드 | `tsconfig.base.json`, 패키지마다 `tsconfig.json` | 편집기, `pnpm check` |
| ESLint (typescript-eslint) | 금지할 문법과 위험한 패턴 | `eslint.config.js` | 편집기, `pnpm check` |
| dependency-cruiser | 패키지 사이의 의존 방향 | `.dependency-cruiser.cjs` | `pnpm check` |
| Vitest · Playwright | 테스트 | 패키지마다 `vitest.config.ts`, `apps/web/playwright.config.ts` | `pnpm check`, CI |

### 1.1 EditorConfig

모든 텍스트 파일: UTF-8, 줄 끝 LF, 파일 끝에 줄 바꿈 하나, 줄 끝 공백 없음. 들여쓰기는 공백 2칸(Markdown은 지금 문서들처럼 탭을 그대로 둠).

### 1.2 Prettier

| 설정 | 값 | 이유 |
| --- | --- | --- |
| `printWidth` | 100 | 타입 정의와 요구사항 ID가 든 주석이 한 줄에 들어가게 |
| `tabWidth` · `useTabs` | 2 · false | TypeScript 생태계의 관례 |
| `semi` | true | |
| `singleQuote` | true | 문서의 코드 예와 같게 |
| `trailingComma` | `"all"` | 줄을 더할 때 diff가 한 줄 |
| `endOfLine` | `"lf"` | Windows에서도 같은 바이트(골든 파일) |

Prettier가 정하는 모양은 사람이 따로 맞추지 않습니다. 리뷰에서도 모양은 말하지 않습니다.

Prettier가 손대지 않는 것(`.prettierignore`): Markdown(`*.md`, 저장소의 문서 규칙을 따름), 골든 파일(`**/golden/`, 바이트가 곧 기대값), 스크립트가 만든 글꼴(`packages/fonts/assets/`), `pnpm-lock.yaml`, 빌드 · 테스트의 산출물(`dist/` · `coverage/` · `test-results/` · `playwright-report/`).

### 1.3 TypeScript

`tsconfig.base.json`의 컴파일러 옵션입니다. 모든 패키지가 이것을 이어받습니다. TypeScript는 6.0.3으로 고정합니다(7은 typescript-eslint가 아직 받지 않음).

| 옵션 | 값 | 이유 |
| --- | --- | --- |
| `strict` | true | `null` 검사, 암묵적 `any` 금지 등 엄격 모드 전부 |
| `noUncheckedIndexedAccess` | true | 배열 · 맵을 인덱스로 읽으면 `undefined`일 수 있음을 타입에 드러냄 |
| `exactOptionalPropertyTypes` | true | "키가 없음"과 "`undefined`가 들어 있음"을 구분. 파일 형식의 생략 규칙([[01-file-format#3.3 노드별 필드]])과 맞음 |
| `noImplicitOverride` · `noFallthroughCasesInSwitch` | true | |
| `verbatimModuleSyntax` | true | 타입만 가져올 때 `import type`을 강제 |
| `target` · `module` · `moduleResolution` | `ES2022` · `ESNext` · `Bundler` | Vite · esbuild로 묶음 |
| `lib` | `core` · `fonts`: `["ES2022"]`(DOM 없음), `editor` · 앱: `["ES2022", "DOM", "DOM.Iterable"]` | `core`가 DOM에 기대지 못하게(QA-14 → [[03-architecture#3.3 의존 규칙]]) |
| `types` | `[]` (패키지가 필요한 것만 더함. 예: Node 쪽 코드의 `@types/node`) | 쓰지 않는 전역 타입이 새어 들지 않게 |
| `isolatedModules` · `esModuleInterop` · `skipLibCheck` · `forceConsistentCasingInFileNames` · `resolveJsonModule` · `noEmit` | true | 묶는 것은 Vite · esbuild가 하고 `tsc`는 검사만 |

### 1.4 ESLint

`eslint.config.js`(flat config)에서 typescript-eslint의 `strictTypeChecked`와 `stylisticTypeChecked`를 켜고, 아래를 더하거나 바꿉니다.

| 규칙 | 설정 | 이유 |
| --- | --- | --- |
| `@typescript-eslint/consistent-type-definitions` | error, `type` | 4장: `type`이 기본. 셸이 구현하는 계약만 `interface`로 쓰고, 그 줄에 이유를 단 끄는 주석을 둔다 |
| `@typescript-eslint/array-type` | error, 보통은 `T[]`, 읽기 전용은 `ReadonlyArray<T>` | 모델의 필드가 한눈에 읽기 전용으로 보이게(4장) |
| `@typescript-eslint/no-explicit-any` | error | 모르는 값은 `unknown`으로 받고 좁힌다 |
| `@typescript-eslint/switch-exhaustiveness-check` | error | 블록 종류(`kind`) 유니온을 빠짐없이 다룸. 새 종류를 추가하면 다룰 곳을 컴파일러가 알려 줌(QA-12) |
| `@typescript-eslint/no-floating-promises` | error | 기다리지 않은 Promise가 오류를 삼키지 않게 |
| `@typescript-eslint/consistent-type-imports` | error | `verbatimModuleSyntax`와 짝 |
| `@typescript-eslint/no-non-null-assertion` | error | `x!` 대신 검사하고 좁힌다 |
| `eqeqeq` | error | |
| `no-console` | error (테스트 · 벤치마크 · E2E · `scripts/`는 끔) | 로그는 문제 알리기 보고서의 로그로 → [[02-interaction-rules#8. 문제 알리기 보고서]] |
| `no-restricted-syntax` | `export default` 금지. 도구의 설정 파일(`*.config.*`, `.dependency-cruiser.cjs`)만 허용 | 이름 있는 내보내기만(3.2). 설정 파일은 도구가 기본 내보내기를 요구한다 |
| `react-hooks/rules-of-hooks` · `exhaustive-deps` | error · warn | `editor`와 앱의 React 코드만 |

규칙을 끄는 주석(`// eslint-disable-next-line …`)은 그 줄에만, 이유를 함께 적습니다: `// eslint-disable-next-line no-console -- dev-only timing log`.

검사하지 않는 곳: `node_modules/`, 빌드 · 테스트의 산출물, `packages/fonts/assets/`. JavaScript 파일(`*.js` · `*.cjs` · `*.mjs`, 설정과 스크립트)은 타입 정보를 쓰는 규칙을 끄고 Node의 전역으로 검사합니다.

### 1.5 dependency-cruiser

[[03-architecture#3.3 의존 규칙]]을 기계가 지키게 합니다.

| 규칙 | 금지하는 것 |
| --- | --- |
| `core-is-pure` | `packages/core`가 `editor` · `apps/*` · `react` · 브라우저 전용 모듈을 가져오는 것 |
| `core-no-node-builtins` | `packages/core/src`의 코드(테스트 · 벤치마크 말고)가 Node 내장 모듈(`node:fs` 등)을 가져오는 것. `core`는 브라우저에서도 돈다 |
| `fonts-is-data` | `packages/fonts`가 다른 우리 패키지를 가져오는 것 |
| `editor-no-shell` | `packages/editor`가 `apps/*`를 가져오는 것 |
| `apps-independent` | 앱이 다른 앱을 가져오는 것 |
| `no-circular` | 모든 순환 의존 |
| `no-deep-import` | 다른 패키지의 `src/` 안쪽을 직접 가져오는 것(그 패키지의 `index.ts`로만) |
| `no-unresolvable` | 찾을 수 없는 모듈을 가져오는 것. 모든 가져오기가 실제 경로로 풀려야 위 규칙들이 그 경로를 본다 |

### 1.6 테스트 도구

파일의 자리와 이름은 [[07-testing]]대로입니다: 단위 테스트는 소스 옆 `*.test.ts`, 벤치마크는 `*.bench.ts`, 골든 파일은 패키지의 `golden/`, E2E는 `apps/web/e2e/`. Vitest의 `globals`는 끄고 `describe` · `it` · `expect`를 가져와 씁니다. 테스트는 Node 환경에서 돌고, DOM이 필요한 `editor`의 테스트만 파일 맨 위에 `// @vitest-environment happy-dom`을 적습니다.

## 2. 이름 짓기

- 개념의 이름은 [[06-glossary|용어집]]의 "영어"와 "코드 이름" 칸을 따릅니다(`Doc`, `Diagram`, `Block`, `Branch`, `Arm`, `Seq`, `FoldMark` …). 용어집에 없는 개념에 이름을 붙이면 용어집에도 더합니다.
- 파일과 폴더: kebab-case(`wrap-block.ts`, `command-palette.tsx`). React 컴포넌트 파일도 같습니다.
- 타입 · React 컴포넌트: PascalCase. 함수 · 변수 · 상수: camelCase. `UPPER_SNAKE`는 쓰지 않습니다.
- 불리언은 `is` · `has` · `can`으로 시작합니다(`isFolded`, `canUndo`).
- 줄임말은 쓰지 않습니다. 예외: `id`, `svg`, `json`, `ui`, `url`과 업계에서 굳은 것(`ctx`).
- 디자인 토큰의 이름은 [[04-visual-design#3. 디자인 토큰]]의 이름 그대로(`line.structure`) 문자열로 씁니다.

## 3. 모듈과 구조

### 3.1 패키지

패키지의 자리와 이름은 [[0036-code-layout|ADR-0036]]대로입니다(`@ariadne-nsd/core` …). 패키지 안은 기능별 폴더입니다(`core/src/model/`, `commands/`, `text/`, `layout/`, `render/`, `format/` → [[03-architecture#3. 구성 요소]]).

### 3.2 내보내기와 가져오기

- 패키지마다 `src/index.ts` 하나가 공개 API입니다. 거기서 내보내지 않은 것은 패키지 밖에서 쓰지 않습니다.
- 이름 있는 내보내기(`export function …`)만 씁니다. `export default`는 쓰지 않습니다.
- 패키지 안에서는 상대 경로, 패키지 밖은 패키지 이름으로 가져옵니다(`import { wrap } from '@ariadne-nsd/core'`).

## 4. 데이터와 상태

- **문서는 불변입니다.** 모델의 타입은 `readonly` 필드와 `ReadonlyArray`로 적고, 명령은 새 객체를 만들어 반환합니다. 바뀌지 않은 하위 트리는 그대로 공유합니다 → [[0029-immutable-document-undo|ADR-0029]]
- **편집 명령은 순수 함수입니다**: `(content, args) => Result`. 시간, 난수, I/O를 쓰지 않습니다. 새 id도 인자로 받은 id 생성기로 만듭니다(같은 입력이면 같은 출력 → 골든 파일) → [[01-model#4. 편집 명령]]
- `core`에는 클래스를 두지 않고 타입과 함수로 씁니다. 상태를 가진 것(`editor`의 세션, 셸의 저장소)은 클래스나 클로저로 둡니다.
- `type`을 기본으로 씁니다. 셸이 구현하는 계약(`DocumentStore` 등 → [[03-editor#6. 셸과의 연결]])은 `interface`로 씁니다.
- 유니온은 `kind` 필드로 구분합니다(`kind: 'if'`). `switch`로 다루고 `default`를 두지 않아 완전성 검사가 동작하게 합니다.

## 5. 오류 처리

- **예상한 실패는 값으로 반환합니다.** 명령의 사전 조건 불만족은 `{ ok: false, reason }`, 저장 실패는 `WriteResult`처럼 이유를 유니온으로 둡니다 → [[01-model#4. 편집 명령]], [[03-editor#6. 셸과의 연결]]. 사용자가 취소한 것(`cancelled`)은 실패가 아닙니다.
- **예외는 버그에만 던집니다.** 불변식 위반처럼 "일어나면 안 되는 것"입니다. 명령의 경계(`editor`의 명령 실행)에서 잡아 문서를 되돌리고 문제 알리기 보고서의 로그에 남깁니다.
- 예외를 잡아서 아무것도 하지 않는(`catch {}`) 코드는 쓰지 않습니다.
- 파일 · 클립보드 같은 바깥 입력은 `unknown`으로 받아 검증한 뒤에 모델로 씁니다. 깨진 파일은 "편집 불가"로 끝내고 원본을 덮어쓰지 않습니다 → [[03-architecture#5. 공통 관심사]]

## 6. 비동기

- `async` / `await`를 씁니다. `.then()` 사슬은 쓰지 않습니다.
- I/O(파일, IndexedDB, 클립보드)는 셸과 `editor`의 가장자리에만 있습니다. `core`는 동기 함수만 둡니다.

## 7. 주석

- **영어로 씁니다** → [[dr-0017-code-language-and-commits|DR-0017]]
- 공개 API(패키지의 `index.ts`에서 내보내는 것)에는 JSDoc을 답니다. 첫 줄은 무엇을 하는지 한 문장입니다.
- 코드가 "무엇을" 하는지는 코드로 보이게 하고, 주석에는 "왜"를 씁니다.
- 설계에서 온 규칙은 그 근거를 ID로 가리킵니다: 요구사항 ID, ADR · DR 번호, UX 결정 ID.

```ts
/**
 * Wraps the selected range in a new control block.
 * The range must be contiguous under one parent (ADR-0008). See R-EDIT-06.
 */
export function wrap(content: Content, args: WrapArgs): Result {
  // Leftover px goes to the last block so the total stays exact (UX SB1).
```

- 남은 일은 `TODO`에 이슈나 백로그 링크를 붙입니다(`// TODO(#42): …`). 링크 없는 `TODO`는 남기지 않습니다.
- 주석으로 막아 둔 코드는 남기지 않습니다. 이력은 git에 있습니다.

## 8. 화면의 문자열

- 사용자에게 보이는 문자열은 코드에 직접 쓰지 않고 메시지 카탈로그의 키로 씁니다. UI 문자열은 `editor`의 카탈로그, 그림에 적는 고정 문구("참" · "거짓" 등)는 `core`의 카탈로그, 셸만 쓰는 문자열(파일 열기 · 저장 · 로컬 백업의 알림 등)은 그 셸의 카탈로그(웹은 `apps/web/src/shell/messages.ts`)입니다. 셸은 자기 카탈로그로 만든 문자열을 `editor`에 그대로 넘깁니다. 영어와 한국어를 함께 둡니다 → [[03-architecture#5. 공통 관심사]], [[01-requirements#^r-nfr|R-NFR-04]]
- 개발자에게만 보이는 문자열(예외 메시지, 로그)은 영어로 직접 씁니다.

## 9. React

- React는 `editor`의 주변 UI(메뉴 바, 툴바, 모달, 커맨드 팔레트)에만 씁니다. 다이어그램 영역 · 오버레이 · 키 입력 · 인라인 에디터는 React 밖의 TypeScript입니다 → [[0010-ui-framework|ADR-0010]]
- 함수 컴포넌트와 훅만 씁니다. 컴포넌트는 편집기 상태를 구독하고, 명령은 `CommandRegistry`로 실행합니다. 상태 관리 라이브러리는 쓰지 않습니다.
- CSS는 `editor` 안의 TypeScript 문자열(`styles.ts`)로 두고 `<style>` 요소로 넣습니다. CSS 파일이나 CSS-in-JS 라이브러리를 쓰지 않아, 어느 셸(Vite, Obsidian 플러그인, 테스트)에서도 CSS 로더 없이 같게 동작합니다. 색은 화면 색 토큰([[04-visual-design#3.4 화면 색]])을 CSS 변수로 둡니다.

## 10. 테스트

- 테스트 이름은 영어 문장으로, 확인하는 요구사항 · 시나리오 ID를 앞에 붙입니다: `it('R-EDIT-06: wraps a contiguous range in a new If block', …)`. ID로 찾을 수 있게 하려는 것입니다 → [[03-quality-attribute-scenarios]]
- 버그를 고치면 그 버그를 다시 일으키는 테스트를 먼저 더합니다.
- 층마다 무엇을 테스트하는지, 골든 파일의 규칙, 인수 테스트는 [[07-testing]]에 있습니다.

## 11. 커밋

[Conventional Commits](https://www.conventionalcommits.org/) 꼴의 머리에 한국어 본문을 씁니다 → [[dr-0017-code-language-and-commits|DR-0017]]

```text
feat(core): 감싸기 명령(R-EDIT-06)

선택 영역을 새 If · While · For로 감싼다. 범위는 같은 부모 아래 연속(ADR-0008).
```

| 종류 | 쓰는 때 |
| --- | --- |
| `feat` | 기능을 추가하거나 바꿈 |
| `fix` | 버그를 고침 |
| `refactor` | 동작은 그대로 두고 구조를 바꿈 |
| `perf` | 성능 |
| `test` | 테스트만 |
| `docs` | 문서만(`docs/` · `atelier/` · `til/` · `journal/`) |
| `build` · `ci` · `chore` | 빌드 설정 · CI · 그 밖의 잡일 |

- 범위(괄호 안)는 패키지나 앱 이름입니다: `core`, `fonts`, `editor`, `web`, `obsidian`, `desktop`. 여럿에 걸치면 생략합니다.
- 설계(`docs/`)와 코드를 함께 바꾸면 한 커밋으로 합니다(설계와 코드가 같은 것을 말하게).
- Claude가 만든 커밋은 끝에 `Co-Authored-By` 줄을 답니다.
- 동작을 바꾸는 커밋은 테스트를 함께 넣습니다.

## 12. 의존성 추가

- 제품에 들어가는 라이브러리(`dependencies`)를 더하려면 먼저 [[03-architecture#8.1 제품에 들어가는 것]]에 라이선스와 함께 올리고, 기술 선택이면 ADR을 씁니다. 라이선스는 Apache-2.0과 함께 배포할 수 있어야 합니다(MIT, BSD, Apache-2.0, OFL 등).
- 개발 도구(`devDependencies`)는 [[03-architecture#8.2 개발 도구]]에 올립니다.
- 버전은 `pnpm-lock.yaml`로 고정합니다. 저장 파일의 바이트에 영향을 주는 라이브러리(서브세팅, 압축)는 범위 없이 정확한 버전으로 적습니다(`"fflate": "0.8.3"`) → [[0039-woff-subset-font|ADR-0039]]

## 미결정 사항

> [!question] 미결정
> - 커밋 전에 검사를 돌리는 Git 훅(lint-staged 등)을 둘지. 지금은 CI와 `pnpm check`로만 막습니다.
> - 커밋 메시지를 도구(commitlint)로 검사할지. 지금은 리뷰에서 봅니다.
