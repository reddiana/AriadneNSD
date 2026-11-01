---
title: 테스트 전략
tags:
  - design
status: 초안
updated: 2026-11-01
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

- 위로 갈수록 느리고 깨지기 쉬우며, 아래로 갈수록 많습니다(테스트 피라미드). 유형마다 몇 개인지는 [[08-test-list#1. 요약|테스트 목록의 요약]]에 있습니다.
- "통합"은 브라우저를 띄우지 않습니다. 화면을 지나야만 보이는 것(CSS로 가려짐, 실제 포커스, 파일 선택 창, 시작 순서)은 E2E만 잡습니다.

### 1.2 유형과 구성 요소

어느 유형이 어느 구성 요소([[03-architecture#3. 구성 요소]])를 덮는지입니다.

```mermaid
flowchart LR
    subgraph E2E["E2E: 빌드한 웹 앱 + Chromium"]
        subgraph INT["통합: Node + 가짜 셸 · happy-dom"]
            subgraph UNIT["단위: Node"]
                core["core<br/>모델 · 명령 · 레이아웃 · 파일 형식"]
                fonts["fonts<br/>advance 폭 · 서브셋"]
                pure["editor의 순수 함수<br/>이동 · 히트 테스트 · 키 읽기"]
            end
            engine["editor<br/>엔진 · 화면(React)"]
            shell["웹 셸<br/>저장 · 로컬 백업 · 최근 파일"]
        end
        browser["브라우저<br/>CSS · 포커스 · 파일 · IndexedDB · 시작"]
    end
```

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

- 테스트는 이름 앞에 그 근거의 ID를 적습니다: 요구사항 `R-`, 품질 속성 시나리오 `QA-`, 인수 테스트 `AT-`, 결함 `BUG-`, UX 결정 `UX`(`AT-04: …`, 여럿이면 `BUG-03 · QA-19: …`). 파일 전체가 한 근거를 맡으면 파일의 첫 주석에 적습니다.
- [[08-test-list|테스트 목록]]은 스크립트(`src/scripts/test-list.mjs`)가 이 이름과 주석에서 만듭니다. `pnpm check`가 목록이 코드와 다르면 실패하므로 목록은 언제나 지금의 코드와 같습니다.
- 목록의 끝에는 문서에 정의되었으나 이름에 그 ID를 단 테스트가 없는 것이 나옵니다. 사람이 보는 것이거나 아직 빈 곳입니다.

### 1.5 결함과 회귀 테스트

- 써 보다 찾은 결함은 [[defects|결함 기록]]에 `BUG-` 번호를 받습니다.
- 고칠 때는 그 결함을 다시 만드는 테스트를 먼저 쓰고, 고치기 전 코드에서 실패하는 것을 본 뒤 고칩니다. 테스트 이름은 `BUG-01: …`이고, 고친 코드와 같은 커밋에 넣습니다.
- 사용자에게 보인 결함의 회귀 테스트는 E2E로 하나는 둡니다. 단위 · 통합이 통과해도 화면에서 깨질 수 있습니다(BUG-01 · 02는 CSS가, BUG-03은 시작 순서가 원인이었다). 기존 테스트가 왜 못 잡았는지도 결함 기록에 적습니다.

### 1.6 어느 유형으로 쓸지

1. 확인할 것을 가장 아래 유형에서 확인할 수 있으면 거기서 씁니다(빠르고 원인이 바로 보임).
2. 모듈 사이의 약속(셸 인터페이스, 저장 → 열기)은 통합으로 씁니다.
3. 화면 · 브라우저를 지나야만 보이는 것과 인수 테스트(4장)는 E2E로 씁니다.
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
- **바꿀 때:** 그림이 바뀌는 것이 의도한 변경이면 갱신 명령으로 기대 파일을 다시 쓰고, 같은 커밋에 넣습니다. GitHub의 Pull Request는 SVG를 그림으로 보여 주므로, 리뷰어는 바뀌기 전과 뒤의 그림을 보고 판단합니다. 의도하지 않은 변경이면 테스트가 실패한 것이 맞습니다.
- 갱신 명령: `.ns.svg` 골든은 `pnpm --filter @ariadne-nsd/core golden:update`(다시 쓴 뒤 같은 테스트를 한 번 더 돌림), 그림만의 골든은 Vitest의 스냅숏 갱신(`pnpm --filter @ariadne-nsd/core exec vitest run -u`)입니다. 둘 다 `src/`에서 실행합니다.
- `.ns.svg` 골든의 테스트는 Node의 서브세팅(`node:fs`)을 쓰므로 `core`의 `src/` 밖(`packages/core/node/golden.test.ts`)에 둡니다. `core`의 코드는 Node 내장 모듈을 쓰지 않습니다([[07-coding-guide#1.5 dependency-cruiser]]).

## 4. MVP의 인수 테스트

MVP(웹, [[dr-0015-mvp-scope|DR-0015]])를 내놓기 전에 모두 지나야 하는 테스트입니다. 유즈케이스의 기본 흐름과 우선순위가 높은 품질 속성 시나리오에서 선택했습니다.

| ID | 무엇 | 어디서 | 테스트 |
| --- | --- | --- | --- |
| AT-01 | 새 다이어그램을 만들고 블록을 삽입하고 저장한다 (UC-01 · 03 · 06) | 웹 | E2E |
| AT-02 | 저장한 파일을 다시 열면 같은 그림이다 (UC-02, QA-04) | 웹 | E2E + 골든 |
| AT-03 | 블록 6종을 삽입하고, 감싸고, 풀고, 복사하고, 분기를 삽입하고 삭제한다 (UC-03) | `editor` | 명령 테스트 |
| AT-04 | 키보드만으로 AT-01을 끝낸다 (QA-15) | 웹 | E2E (키 입력만) |
| AT-05 | 블록 500개 문서에서 편집 응답이 100ms 안이다 (QA-07) | 웹 | 성능 (기준 기기) |
| AT-06 | 깨진 파일을 열어도 원본은 그대로이고 편집기는 죽지 않는다 (QA-02) | `core` · 웹 | 퍼징 + E2E |
| AT-07 | 저장에 실패해도 편집한 내용을 잃지 않는다 (UC-06 최소 보장, QA-17) | 웹 | E2E (저장 실패를 흉내) |
| AT-08 | 저장된 그림이 플러그인 없는 뷰어(브라우저, GitHub)에서 같게 보인다 (QA-06) | 웹 · 사람 | 시각 회귀 + 점검표 |
| AT-09 | PNG로 내보낸다 (UC-08) | 웹 | E2E |
| AT-10 | 같은 문서를 Chrome · Firefox · Safari에서 저장하면 같은 바이트다 (QA-03) | 사람 | 점검표 |
| AT-11 | 드래그 앤 드롭으로 블록을 이동하고, 블록 아이콘을 끌어 놓아 삽입하고 감싼다 (UC-03) | 웹 | E2E (포인터) |
| AT-12 | 복사한 블록을 붙여넣는다: 사용자 정의 형식이면 블록 그대로, `text/plain`만 있으면 줄마다 처리 블록 (UC-03) | `editor` · 웹 | 명령 테스트 + E2E |
| AT-13 | 편집한 뒤 새로 고쳐도 로컬 백업에서 복원한다 (UC-06) | 웹 | E2E |
| AT-14 | 자동 저장(Chromium)은 원래 파일에 쓰고, Firefox에서는 저장이 내려받기다 (UC-06) | 웹 · 사람 | E2E (Chromium) + 점검표 |
| AT-15 | 최근 파일에서 다시 연다 (UC-02) | 웹 | E2E |
| AT-16 | 커맨드 팔레트에서 명령을 찾아 실행한다 | 웹 | E2E |
| AT-17 | `?`로 단축키 목록을 열고, 도움말 메뉴에서 사용법을 연다 | 웹 | E2E |

- 웹에서 하는 인수 테스트(E2E)는 `src/apps/web/e2e/acceptance.spec.ts`에 있습니다. 테스트 이름이 AT ID로 시작하고(`AT-04: …`), 한 ID에 테스트가 여럿인 것도 있습니다(AT-02 · AT-04 · AT-07 · AT-14). 빌드한 앱을 Chromium으로 엽니다(`pnpm e2e`).
- AT-05 · AT-08 · AT-10 · AT-14는 Chromium에서 확인되는 부분만 E2E입니다(AT-10 · AT-14는 테스트 이름에 `(Chromium part)`). 기준 기기의 성능, 다른 뷰어, Firefox · Safari는 사람이 점검표로 봅니다(5장의 출시 전).

## 5. 도구와 CI

도구는 [[0038-build-and-test-tools|ADR-0038]]에 있습니다. CI(GitHub Actions)는 이렇게 실행됩니다.

| 언제 | 무엇을 | 걸리는 시간(목표) |
| --- | --- | --- |
| Pull Request와 `main`에 push할 때마다 | `pnpm check`(타입 검사 → ESLint → Prettier → 의존 방향 → 단위 · 속성 · 골든 · 계약 테스트) → 웹 빌드와 번들 사이즈 체크(bundle size budget, 첫 내려받기 540 KB, [[06-web#5. 배포]]) → 웹 E2E(Chromium) | 10분 안 |
| 매일 밤 | 긴 퍼징, 벤치마크 기록(느려지면 알림). 아직 만들지 않음 | — |
| 출시 전 | 기준 기기에서 성능, 수동 점검표(AT-08 · AT-10) | — |

- 테스트가 하나라도 실패하면 `main`에 합치지 않습니다.
- CI는 `.github/workflows/ci.yml`이고 Node 24, `pnpm install --frozen-lockfile`로 돕니다. E2E가 실패하면 Playwright 보고서를 7일 남깁니다.
- 벤치마크는 `pnpm test`에 들지 않습니다. `pnpm --filter @ariadne-nsd/core exec vitest bench --run`으로 따로 돌립니다(`*.bench.ts`).
- 지금 있는 문서 사이트의 빌드(`.github/workflows/pages.yml`)와는 따로 둡니다.

## 미결정 사항

- [ ] 테스트가 코드의 얼마를 지나야 하는지(커버리지)의 목표를 둘지
- [ ] Obsidian 플러그인을 자동으로 테스트할 길이 있는지(Obsidian 셸을 설계할 때) → [[04-obsidian-plugin]]
