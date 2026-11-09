---
title: 테스트 전략
tags:
  - design
status: 초안
updated: 2026-11-10
---

# 테스트 전략

AriadneNSD를 어떻게 테스트하는지 정합니다: 테스트 아키텍처(유형 · 테스트 더블 · 추적), 계층마다 무엇을 테스트하나, 저장되는 SVG의 골든 파일, MVP의 인수 테스트, 도구와 CI. 테스트의 종류는 [[03-quality-attribute-scenarios#3. 테스트 전략|품질 속성 시나리오 3장]]에서 시나리오마다 정했고, 도구는 [[0038-build-and-test-tools|ADR-0038]]에서 정했습니다. 기능마다의 세부 테스트는 그 기능을 개발하기 직전에 씁니다.

코드: 테스트 파일은 소스 바로 옆(`*.test.ts`), 골든 파일은 패키지마다 `golden/`, 브라우저 테스트는 `src/apps/web/e2e/` (→ [[0036-code-layout|ADR-0036]], [[0038-build-and-test-tools|ADR-0038]])

## 관련 요구사항

- [[01-requirements#^r-nfr|R-NFR-06]] (`core`는 DOM 없이 테스트), [[01-requirements#^r-fmt|R-FMT-03]] (같은 모델이면 같은 파일), [[01-requirements#^r-nfr|R-NFR-01]], [[01-requirements#^r-nfr|R-NFR-03]]
- 인수 테스트 AT-11 ~ AT-17: [[01-requirements#^r-edit|R-EDIT-09]], [[01-requirements#^r-edit|R-EDIT-06]], [[01-requirements#^r-edit|R-EDIT-10]], [[01-requirements#^r-web|R-WEB-03]], [[01-requirements#^r-web|R-WEB-02]], [[01-requirements#^r-exp|R-EXP-04]], [[01-requirements#^r-edit|R-EDIT-24]], [[01-requirements#^r-edit|R-EDIT-21]]
- 품질 속성 시나리오 QA-01 ~ QA-20 → [[03-quality-attribute-scenarios]]
- 유즈케이스 → [[02-use-cases]]

## 1. 테스트 아키텍처

테스트를 어떤 유형으로 나누고, 유형마다 무엇을 진짜로 두고 무엇을 가짜로 바꾸는지, 테스트와 요구사항 · 결함을 어떻게 잇는지 정합니다. 지금 있는 테스트 하나하나는 [[08-test-list|테스트 목록]]에 있습니다.

### 1.1 테스트 유형

| 유형 | 무엇을 확인하나 | 진짜로 두는 것 | 가짜로 바꾸는 것 | 실행 환경 |
| --- | --- | --- | --- | --- |
| 단위 | 모듈 하나의 함수와 규칙(명령 하나, 레이아웃 규칙 하나, 파일 이름 짓기) | 그 모듈 | 없음. `core`는 순수 함수라 가짜가 필요 없다 | Node (Vitest) |
| 통합 | 모듈 여럿이 맞물리는지(`editor`의 키 → 명령 → `core`의 문서, 골든 파일의 열기 → 저장, 웹 셸과 편집기) | 이어지는 모듈 모두 | 셸(메모리 안의 `DocumentStore` · `SettingsStore`), 브라우저 DOM(happy-dom) | Node (Vitest) |
| E2E (사용자 관점) | 사용자가 하듯 했을 때 되는지(클릭 · 키 · 탭 · 드래그로 만들고 저장하고 다시 열기) | 빌드한 웹 앱 전체, 실제 브라우저 | 사용자의 디스크와 파일 선택 창, 휴대폰, 느린 망과 CPU, 브라우저의 고장(1.3) | Chromium (Playwright) |
| 성능 · 크기 | 재어서 합격 기준과 견줌(편집 반응, 시작 시간, 번들과 저장 파일의 크기) | 측정 대상 | 기준 기기 대신 감속한 CPU와 망 | Node, Chromium |
| 정적 분석 | 실행하지 않고 코드의 구조를 봄(의존 방향, 타입, 금지한 쓰임) | 소스 코드 | — | Node |
| 수동 | 자동으로 못 보는 것(실제 휴대폰, Firefox · Safari, GitHub · Drive의 미리보기, Obsidian) | 실제 기기와 프로그램 | — | 사람, 출시 전 점검표(5장) |

- 위로 갈수록 느리고 깨지기 쉬우며, 아래로 갈수록 많습니다(테스트 피라미드). 유형마다 몇 개인지는 [[08-test-list|테스트 목록]]의 머리에 있습니다.
- "통합"은 브라우저를 띄우지 않습니다. 화면을 지나야만 보이는 것(CSS로 가려짐, 실제 포커스, 파일 선택 창, 시작 순서)은 E2E만 잡습니다.

### 1.2 유형과 구성 요소

어느 유형이 어느 구성 요소([[03-architecture#3. 구성 요소]])를 덮는지입니다.

![[testing-types-components.svg|720]]

### 1.3 테스트 더블

가짜로 바꾸는 것은 아래뿐입니다. 이 밖의 것은 진짜로 돌립니다.

| 가짜 | 대신하는 것 | 쓰는 유형 | 자리 |
| --- | --- | --- | --- |
| 메모리 안의 `DocumentStore` · `SettingsStore` | 셸(파일과 설정의 저장) | 통합 | `editor`의 테스트 |
| happy-dom | 브라우저 DOM | 통합 | `@vitest-environment happy-dom`인 테스트 |
| OPFS 위의 파일 선택 창(`useFakeFiles`), 쓰기 실패 흉내 | 사용자의 디스크와 파일 선택 창 | E2E | `src/apps/web/e2e/support.ts` |
| 파일 선택 창 없애기(`useDownloads`) | File System Access가 없는 Firefox · Safari | E2E | `src/apps/web/e2e/support.ts` |
| 휴대폰 흉내(화면 · 터치 · user agent) | Android의 Chrome | E2E | `src/apps/web/e2e/mobile.spec.ts` |
| CPU · 망 감속(Chrome DevTools Protocol) | 느린 휴대폰과 모바일 망 | E2E, 성능 | `mobile.spec.ts`, `src/apps/web/scripts/measure-startup.mjs` |
| 고장 넣기(응답 없는 `indexedDB.open`, 시작 중 오류) | 브라우저의 고장 | E2E | `src/apps/web/e2e/boot.spec.ts` |

### 1.4 추적: 테스트 이름의 ID

- 테스트마다 ID(`T-0123`)가 이름 맨 앞에 있고, 바뀌지 않습니다 → [[dr-0022-test-ids|DR-0022]]. 그 뒤에 테스트가 확인하는 것의 ID를 적습니다: 요구사항 `R-`, 품질 속성 시나리오 `QA-`, 인수 테스트 `AT-`, 결함 `BUG-`, UX 결정 `UX`(`T-0123 · AT-04: …`, 여럿이면 `T-0124 · BUG-03 · QA-19: …`). 파일 전체가 한 근거를 맡으면 파일의 첫 주석에 적습니다.
- [[08-test-list|테스트 목록]]은 스크립트(`src/scripts/test-list.mjs`)가 이 이름과 주석에서 만듭니다. `pnpm check`가 목록이 코드와 다르면 실패하므로 목록은 언제나 지금의 코드와 같습니다. 테스트 코드의 이름은 영어이고, 목록에는 한국어 번역(`src/scripts/test-list-ko.json`)으로 적습니다.
- 목록의 끝에는 문서에 정의되었으나 이름에 그 ID를 단 테스트가 없는 것이 나옵니다. 사람이 보는 것이거나 아직 빈 곳입니다.

### 1.5 결함과 회귀 테스트

- 써 보다 찾은 결함은 [[defects|결함 기록]]에 `BUG-` 번호를 받습니다.
- 고칠 때는 그 결함을 다시 만드는 테스트를 먼저 쓰고, 고치기 전 코드에서 실패하는 것을 본 뒤 고칩니다. 테스트 이름은 `BUG-01: …`이고, 고친 코드와 같은 커밋에 넣습니다.
- 사용자에게 보인 결함의 회귀 테스트는 E2E로 하나는 둡니다. 단위 · 통합이 통과해도 화면에서 깨질 수 있습니다(BUG-01 · 02는 CSS가, BUG-03은 시작 순서가 원인이었다). 기존 테스트가 왜 못 잡았는지도 결함 기록에 적습니다.

### 1.6 어느 유형으로 쓸지

1. 확인할 것을 가장 아래 유형에서 확인할 수 있으면 거기서 씁니다(빠르고 원인이 바로 보임).
2. 모듈 사이의 약속(셸 인터페이스, 저장 → 열기)은 통합으로 씁니다.
3. 화면 · 브라우저를 지나야만 보이는 것과 인수 테스트([[01-requirements#5.2 MVP의 인수 기준]])는 E2E로 씁니다.
4. 합격 기준이 수치인 것(QA-07 · 09 · 18)은 성능 · 크기로, 실제 기기가 필요한 것은 수동 점검표에 둡니다.

## 2. 계층마다 무엇을 테스트하나

아키텍처의 계층([[03-architecture#3. 구성 요소]])을 따라, 아래 계층일수록 많이, 빠르게 테스트합니다.

| 계층 | 테스트 | 실행 환경 | 무엇을 |
| --- | --- | --- | --- |
| `core` · 모델과 명령 | 단위, 속성 기반 | Node (Vitest + fast-check) | 명령마다 사전 조건 · 결과. 아무 명령열을 해도 불변식을 지킨다(QA-01). 실행 취소로 돌아가면 같은 문서 |
| `core` · 레이아웃 | 단위, 속성 기반 | Node | [[02-layout]]의 규칙: 블록은 맞붙고 겹치지 않는다, 부모가 자식을 담는다, 같은 입력이면 같은 좌표, 분기 폭과 짧은 분기의 분배 |
| `core` · 그림과 파일 | 골든 파일, 퍼징 | Node | 저장되는 SVG를 바이트로 비교(QA-03 · 04 · 05, 3장). 깨진 파일을 열어도 죽지 않는다(QA-02) |
| `core` · 속도 | 벤치마크 | Node (Vitest bench) | 블록 500개 문서에서 명령 → 레이아웃 → SVG 문자열(QA-07의 `core` 몫, 목표의 절반 50ms) |
| `editor` | 명령 테스트, 화면 테스트 | Node + 가짜 DOM(happy-dom), React 컴포넌트는 `@testing-library/react` | 키 입력 → 명령 → 문서. 키 표([[03-keymap]])의 두 키 조합, 선택과 이동, 텍스트 편집의 실행 취소 단위 |
| `editor` · 순수 함수 | 단위, 속성 기반 | Node | 이동 · 자동 확장 · 히트 테스트 · 드롭 위치 계산. DOM 없이 `Doc`과 `LayoutResult`만 받는다([[03-editor#2.2 이동]]) |
| 셸 사이의 약속 | 계약 테스트 | Node | 가짜 `DocumentStore` · `SettingsStore`로 `editor`가 셸 없이 실행된다(QA-10, QA-17). `WriteResult`의 `cancelled` · `denied` · `failed`, `canWriteInPlace = false`인 셸([[03-editor#6. 셸과의 연결]]) |
| 웹 셸 | E2E, 시각 회귀 | 브라우저 (Playwright, Chromium) | 인수 테스트의 몇 흐름(4장). 키보드만으로(QA-15). 화면과 저장된 그림이 같다(QA-06) |
| 구조 | 정적 분석 | Node | 의존 방향(dependency-cruiser), `core`에 DOM이 없음(`tsconfig`의 `lib`), 화면 텍스트를 코드에 박지 않음(ESLint 규칙, QA-13), 번들 크기(QA-09) |
| Obsidian · 데스크톱 · 다른 브라우저 | 수동 점검표 | 사람 | 출시 전. MVP(웹)에는 Firefox · Safari에서 열고 저장하기 |

- `core`의 테스트가 가장 많고, 모두 Node에서 실행됩니다. 브라우저 테스트는 화면을 지나야만 확인되는 것만 둡니다.
- 프로토타입의 테스트(`journal/assets/2026-10-11-ns-prototype-test.mjs`)의 시나리오는 `editor`의 명령 테스트로 옮깁니다. 프로토타입 코드는 옮기지 않습니다.

## 3. 골든 파일

저장되는 그림이 바뀌지 않았는지를 바이트로 확인합니다. "같은 모델이면 같은 파일"([[01-requirements#^r-fmt|R-FMT-03]])의 직접 증거입니다.

- **자리:** `src/packages/core/golden/`. 한 사례가 파일 하나(`이름.ns.svg`)입니다. 모델이 그림 안에 들어 있으므로([[0005-model-embedded-svg|ADR-0005]]) 입력과 기대 출력이 한 파일입니다.
- **테스트:** 파일을 열어 모델을 읽고 → 레이아웃 → 저장한 바이트가 원래 파일과 같은가(QA-04: 열고 바로 저장하면 그대로). 같은 테스트를 모든 커밋에서 돌립니다.
- **사례:** 블록 종류마다 하나, 오늘 정한 레이아웃 규칙마다 하나(긴 조건과 빗금, 짧은 분기, default 없는 Case, 여러 다이어그램의 배치, 접기 영역, 펴 보기), 한글 · 영어 섞인 텍스트, 옛 형식 버전의 파일(QA-05)
- **바이트 그대로:** 골든 파일은 git이 줄 끝을 바꾸지 않도록 텍스트로 다루지 않습니다(`.gitattributes`의 `src/packages/core/golden/** -text`).
- **그림만의 골든:** 레이아웃 · 렌더러의 그림은 `golden/render/*.svg`에 따로 둡니다(모델과 글꼴 없이 그림만이라, GitHub에서 그림으로 보임).
- **내보내기의 골든:** 순수 SVG와 PDF는 `golden/export/`에 둡니다(`sum.svg`, `sum.pdf`). PDF는 스트림을 압축하지 않고 써서(`isCompressed: false`) 텍스트로 읽힙니다. 텍스트 외곽선은 `.ns.svg` 골든의 `text-outlines*` 두 사례입니다. 갱신은 `.ns.svg` 골든과 같은 명령입니다(`node/export-golden.test.ts`).
- **바꿀 때:** 그림이 바뀌는 것이 의도한 변경이면 갱신 명령으로 기대 파일을 다시 쓰고, 같은 커밋에 넣습니다. GitHub의 Pull Request는 SVG를 그림으로 보여 주므로, 리뷰어는 바뀌기 전과 뒤의 그림을 보고 판단합니다. 의도하지 않은 변경이면 테스트가 실패한 것이 맞습니다.
- 갱신 명령: `.ns.svg` 골든은 `pnpm --filter @ariadne-nsd/core golden:update`(다시 쓴 뒤 같은 테스트를 한 번 더 돌림), 그림만의 골든은 Vitest의 스냅숏 갱신(`pnpm --filter @ariadne-nsd/core exec vitest run -u`)입니다. 둘 다 `src/`에서 실행합니다.
- `.ns.svg` 골든의 테스트는 Node의 서브세팅(`node:fs`)을 쓰므로 `core`의 `src/` 밖(`packages/core/node/golden.test.ts`)에 둡니다. `core`의 코드는 Node 내장 모듈을 쓰지 않습니다([[07-coding-guide#1.5 dependency-cruiser]]).

### 3.1 문서 속 예제(doctest)와 값 목록

문서와 다른 AI를 위한 안내서가 형식과 어긋나지 않게, 그 안의 예제를 테스트로 돌립니다([[01-requirements#^r-web|R-WEB-10]]).

- **예제:** `apps/web/src/files/doc-examples.test.ts`가 `/llms.txt`, 첫 화면 `index.html`의 AI용 안내, 파일 형식 명세(`docs/05-spec/`의 모든 문서)에서 ```` ```json ```` 블록과 공유 링크(`ns1.u.` · `j` · `d`)를 꺼내 앱의 `parseModel`(링크는 `readShareLink`)로 열고 JSON Schema로도 검사합니다. 블록 하나만 든 조각은 모델로 감싸 엽니다. 검사하지 않을 블록(`…`가 든 개요)은 바로 앞 줄에 `<!-- doctest: skip: 까닭 -->`을 달고, 달지 않은 블록이 열리지 않으면 실패합니다 → [[06-web#3.1 LLM · 에이전트를 위한 안내서]]
- **값 목록:** 안내서의 값 목록(블록 종류, `textKind` · `theme` · `headStyle` · `locale` 등의 값)은 빌드가 core의 목록으로 채우고, 테스트도 채운 결과를 봅니다. JSON Schema의 `enum`은 `core/node/model-schema.test.ts`가 core의 목록과 같은지 확인하고, 골든 파일의 모델이 모두 스키마를 통과하는지도 봅니다.

## 4. MVP의 인수 테스트

MVP를 내놓기 전에 모두 지나야 하는 인수 테스트(AT-01 ~ AT-17)는 [[01-requirements#5.2 MVP의 인수 기준|요구사항 5.2]]에 있습니다. 그것을 확인하는 테스트는 [[08-test-list#1. 인수 테스트|테스트 목록 1장]]에 있습니다.

## 5. 도구와 CI

도구는 [[0038-build-and-test-tools|ADR-0038]]에 있습니다. CI(GitHub Actions)는 이렇게 실행됩니다.

| 언제 | 무엇을 | 걸리는 시간(목표) |
| --- | --- | --- |
| Pull Request와 `main`에 push할 때마다 | `pnpm check`(타입 검사 → ESLint → Prettier → 의존 방향 → 단위 · 속성 · 골든 · 계약 테스트) → 웹 빌드와 번들 사이즈 체크(bundle size budget, 첫 내려받기 230 KB, [[06-web#5. 배포]]) → 웹 E2E(Chromium) | 10분 안 |
| 같은 때, 위와 나란히 | 커버리지 하한: `pnpm coverage:check`(단위 테스트와 웹 E2E를 커버리지와 함께 돌려, 패키지마다 합친 줄 커버리지가 90% 이상인지) | 10분 안 |
| 매일 밤 | 긴 퍼징, 벤치마크 기록(느려지면 알림). 아직 만들지 않음 | — |
| 출시 전 | 기준 기기에서 성능(AT-05, 점검 모드 `?perf` → 5.1), 수동 점검표(AT-08 · AT-10) | — |

- 테스트가 하나라도 실패하면 `main`에 합치지 않습니다.
- CI는 `.github/workflows/ci.yml`이고 Node 24, `pnpm install --frozen-lockfile`로 돕니다. E2E가 실패하면 Playwright 보고서를 7일 남깁니다.
- 벤치마크는 `pnpm test`에 들지 않습니다. `pnpm --filter @ariadne-nsd/core exec vitest bench --run`으로 따로 돌립니다(`*.bench.ts`).
- 지금 있는 문서 사이트의 빌드(`.github/workflows/pages.yml`)와는 따로 둡니다.
- 커버리지(테스트가 실행한 코드 줄의 비율)는 `src/`에서 `pnpm coverage`로 잽니다. 패키지마다 단위 테스트(Vitest, V8)를 돌리고, 웹 E2E를 소스맵을 넣은 빌드로 돌려 Chromium의 JS 커버리지를 원래 소스 파일에 대어 본 뒤(`apps/web`의 `e2e:coverage`, `monocart-coverage-reports`), 둘을 줄마다 합칩니다. 어느 쪽이든 실행한 줄은 덮인 것으로 셉니다. 패키지마다의 표와, 테스트가 닿지 않은 줄이 많은 파일을 보여 줍니다.
- 커버리지 하한: CI는 `coverage` job(`check`와 나란히)에서 `pnpm coverage:check`를 돌립니다. 패키지마다(`core` · `editor` · `fonts` · `apps/web`) 합친 줄 커버리지가 하한 90%보다 낮거나 테스트가 하나라도 실패하면 실패합니다. 리팩토링이 커버리지를 낮추지 않게 하려는 것입니다. 하한은 저절로 오르지 않으며, 커버리지가 올라 굳으면 `scripts/coverage.mjs`의 `floors`에서 손으로 올릴 수 있습니다. 커버리지를 재는 동안에는 페이지가 느려지므로, 시간을 재는 E2E(AT-05)는 `pnpm e2e`에서만 돕니다.

### 5.1 기준 기기에서 AT-05 재기

[[01-requirements#^at|AT-05]](블록 500개 문서에서 편집 응답이 100ms 안)는 E2E(T-0007)가 개발 기계의 Chromium에서 보고, 출시 전에 사람이 기준 기기([[03-quality-attribute-scenarios#QA-07 편집 반응 시간|QA-07]]: 4년 된 보급형 노트북, 예: 4코어 CPU · 8 GB, Chrome)에서 한 번 더 잽니다. 블록을 손으로 만들거나 시계로 재지 않습니다. 앱이 스스로 문서를 만들고 재는 점검 모드가 있습니다 → [[06-web#9. 점검 모드]]

1. 기준 기기에서 다른 탭과 앱을 닫고, 노트북이면 충전기를 꽂습니다.
2. Chrome으로 `https://ariadnensd.com/?perf`를 엽니다(개발 중이면 `http://localhost:5173/?perf`). 개발 환경은 필요 없습니다.
3. "측정 시작"을 누르고 끝날 때까지 손대지 않습니다. 1분쯤 걸립니다.
4. 맨 위의 판정이 합격(모든 명령의 p95가 100ms 이하)이면 AT-05를 지난 것입니다.
5. "결과 복사"로 마크다운 표를 복사해 출시 기록(세션 기록)에 붙입니다. 기기 정보(브라우저, CPU 코어, 메모리, 화면)와 앱 판, 날짜가 함께 들어 있습니다.

- 시간의 정의는 T-0007과 같습니다(키부터 문서 레이어가 바뀐 뒤의 프레임까지). 그래서 화면 주사율에 묶여, 60Hz 화면이면 가장 빨라도 17 ~ 33ms입니다.
- 휴대폰에서도 같은 주소로 잴 수 있습니다. 기준은 같지만, 합격 여부를 가르는 것은 기준 기기의 결과입니다.
- 점검 모드는 아무것도 저장하지 않습니다. 그 브라우저의 로컬 백업 · 최근 파일 · 브라우저 문서 · 설정은 그대로입니다.
- 브라우저 테스트도 점검 모드를 돌려 봅니다: 측정이 끝나 표가 나오는지와 저장소를 건드리지 않는지(T-1127, 커버리지 기록 중에도), 개발 기계에서 명령마다 중앙값이 100ms 안인지(T-1128, `pnpm e2e`에서만).

## 6. 지금의 커버리지

2026-11-03에 `pnpm coverage`로 잰 값입니다. 줄 기준이고, 단위 테스트와 E2E 가운데 어느 쪽이든 실행한 줄을 덮인 것으로 셉니다. 테스트를 도와주는 파일(`test-support` 등)은 빼고 셉니다. 여러 줄에 걸친 문장(JSX 식, 인자를 여러 줄에 쓴 호출) 안의 줄은 그 줄을 감싼 가장 안쪽 문장이 실행됐는지로 셉니다(같은 날 고침: 그 전에는 문장의 첫 줄만 세어, 문장이 대개 여러 줄인 E2E 쪽이 낮게 나왔습니다). 숫자는 손으로 옮긴 것이라, 다시 재면 이 절을 고칩니다.

| 패키지 | 줄 | 단위 | E2E | 합침 |
| --- | --- | --- | --- | --- |
| `core` | 1,921 | 94.3% | 58.8% | 95.0% |
| `editor` | 2,982 | 94.2% | 70.7% | 97.3% |
| `fonts` | 216 | 96.8% | 95.8% | 96.8% |
| `apps/web` | 842 | 86.6% | 79.9% | 97.9% |

- 리팩토링을 앞두고 지금 동작을 그대로 적는 테스트를 더했습니다(같은 날, 테스트 255개). 합친 값이 `editor`는 84.3%에서, `apps/web`은 65.0%에서 올랐습니다. 하한을 둘 때 `apps/web`에 리스너 · 화면 밝기 · 저장용 글꼴을 읽는 단위 테스트를 더해 89.8%에서 91.3%로 올렸습니다(첫 줄만 세던 때의 값).
- `core`는 줄 비율 말고도 속성 기반 테스트(명령을 무작위로 이어도 불변식이 지켜짐)와 골든 파일(바이트 비교)이 있어, 구조를 바꿔도 동작이 달라지면 잡힐 가능성이 높습니다.
- `editor`의 캔버스 테스트는 가짜 DOM(happy-dom)에서 돌아 레이아웃이 없습니다. 캔버스를 1000 × 600 상자로 두고 재므로, 실제 스크롤의 한계 · 포인터 캡처 · 인라인 편집의 실제 높이는 E2E만 봅니다.

테스트가 닿지 않은 줄이 아직 많은 파일입니다.

| 파일 | 빠진 줄 / 줄 | 합침 | 남은 것 |
| --- | --- | --- | --- |
| `core/src/format/model-element.ts` | 23 / 161 | 85.7% | 망가진 파일의 드문 꼴 |
| `editor/src/commands/editor-commands.ts` | 22 / 507 | 95.7% | 공개 API로는 닿지 않는 방어 코드 |
| `core/src/format/parse-model.ts` | 16 / 231 | 93.1% | 망가진 모델의 드문 꼴 |
| `core/src/commands/seq-edit.ts` | 10 / 101 | 90.1% | 순차 편집의 드문 갈래 |
| `core/src/commands/tree.ts` | 9 / 83 | 89.2% | 모델 트리의 드문 갈래 |
| `editor/src/ui/editor-app.tsx` | 8 / 80 | 90.0% | 화면 틀의 드문 갈래 |
| `apps/web/src/main.tsx` | 4 / 68 | 94.1% | 시작이 실패할 때(브라우저에서만). 첫 줄만 세던 때는 39 / 68(42.6%)로 나왔음 |

## 미결정 사항

- [ ] Obsidian 플러그인을 자동으로 테스트할 길이 있는지(Obsidian 셸을 설계할 때) → [[04-obsidian-plugin]]
