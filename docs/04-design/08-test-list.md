---
title: 테스트 목록
tags:
  - design
status: 생성됨
---

# 테스트 목록

지금 코드에 있는 테스트의 목록입니다. 무엇을 왜 어떻게 테스트하는지의 원칙은 [[07-testing]], 품질 속성 시나리오는 [[03-quality-attribute-scenarios]], 결함은 [[defects|결함 기록]]에 있습니다.

> [!info] 이 문서는 손으로 고치지 않습니다
> `src/scripts/test-list.mjs`가 테스트의 이름과 테스트 파일의 첫 주석에서 만듭니다(`src/`에서 `pnpm test-list`). `pnpm check`가 이 문서가 코드와 다르면 실패하므로, 테스트를 더하거나 바꾸면 이 문서도 같은 커밋에서 바뀝니다. 테스트 코드의 이름과 주석은 영어이고(→ [[dr-0017-code-language-and-commits|DR-0017]]), 이 문서에는 한국어로 옮겨 적습니다. 번역은 `src/scripts/test-list-ko.json`에 있고, 번역이 빠진 테스트가 있으면 `pnpm check`가 실패합니다.

## 읽는 법

- **영역:** 테스트를 그것이 확인하는 기능으로 묶었습니다(2장). 영역마다 먼저 테스트 파일을 한 줄씩, 그다음 확인하는 것의 ID를 이름에 적은 테스트를 한 줄씩 보입니다. 어느 파일이 어느 영역인지는 스크립트의 표(`areas`)가 정합니다.
- **유형:** **단위**는 모듈 하나(가짜 없이 함수와 그 결과), **통합**은 모듈 여럿을 함께(`editor`와 `core`를 가짜 셸이나 가짜 DOM 위에서, 골든 파일의 열기 → 저장), **E2E**는 사용자 관점(빌드한 웹 앱을 브라우저에서 열고 클릭 · 키 · 탭으로), **성능**은 벤치마크입니다. 사람이 하는 **수동** 점검은 [[07-testing#5. 도구와 CI]]의 출시 전 점검표에 있습니다.
- **방법:** 테스트 도구와 기법(Vitest, 속성 기반, 골든 파일, Playwright)
- **확인하는 것:** 그 테스트가 확인하는 요구사항(`R-`), 품질 속성 시나리오(`QA-`), 인수 테스트(`AT-`), 결함(`BUG-`), UX 결정(`UX`)의 ID입니다. 테스트에는 ID가 없습니다. 테스트 여럿이 같은 것을 확인하면 같은 ID가 여러 줄에 나옵니다(예: 결함 하나를 테스트 둘이 확인).
- **이름 규칙:** 테스트 코드에서는 테스트의 이름 앞에 그 테스트가 확인하는 것의 ID를 적습니다(`AT-04: …`, 여럿이면 `BUG-03 · QA-19: …`). 이 문서는 그 ID를 "확인하는 것" 칸에 옮기고, 이름의 나머지를 "테스트" 칸에 한국어로 적습니다. 파일의 "무엇을 확인하나"는 파일의 첫 주석(없으면 `describe`의 이름)을 옮긴 것입니다.

## 1. 요약

영역마다 유형별 테스트 수입니다.

| 영역 | E2E | 통합 | 단위 | 성능 | 모두 |
| --- | --- | --- | --- | --- | --- |
| [[#2.1 인수 테스트\|인수 테스트]] | 26 |  |  |  | 26 |
| [[#2.2 편집 명령과 모델\|편집 명령과 모델]] |  | 27 | 149 |  | 176 |
| [[#2.3 키 · 마우스 · 선택\|키 · 마우스 · 선택]] | 4 | 22 | 49 |  | 75 |
| [[#2.4 메뉴 · 화면 · 시작\|메뉴 · 화면 · 시작]] | 15 | 25 | 15 |  | 55 |
| [[#2.5 파일\|파일]] | 6 | 40 | 60 |  | 106 |
| [[#2.6 레이아웃 · 그리기 · 글자\|레이아웃 · 그리기 · 글자]] |  |  | 78 |  | 78 |
| [[#2.7 성능\|성능]] |  |  |  | 3 | 3 |
| 모두 | 51 | 114 | 351 | 3 | 519 |

## 2. 영역마다

### 2.1 인수 테스트

MVP를 받아들이는 기준(AT-01 ~ AT-17)을, 빌드한 웹 앱을 브라우저에서 열고 사용자처럼 조작해 확인합니다 → [[07-testing#4. MVP의 인수 테스트]]

파일 1개, 테스트 26개:

| 자리 | 무엇을 확인하나 | 확인하는 것 | 방법 | 유형 | 테스트 수 |
| --- | --- | --- | --- | --- | --- |
| `apps/web/e2e/acceptance.spec.ts` | MVP의 인수 테스트 AT-01 ~ AT-17(07-testing 4)을 브라우저에서, 배포용 빌드로 | [[07-testing#4. MVP의 인수 테스트\|AT-01]], [[07-testing#4. MVP의 인수 테스트\|AT-17]] | Playwright | E2E | 26 |

확인하는 것(ID)을 이름에 적은 테스트 22개:

| 테스트 | 확인하는 것 | 유형 | 자리 |
| --- | --- | --- | --- |
| 새 다이어그램을 만들고, 블록을 넣고, 저장한다 | [[07-testing#4. MVP의 인수 테스트\|AT-01]] | E2E | `apps/web/e2e/acceptance.spec.ts` |
| 저장한 파일을 다시 열면 같은 그림이고, 다시 저장하면 같은 바이트다 | [[07-testing#4. MVP의 인수 테스트\|AT-02]] | E2E | `apps/web/e2e/acceptance.spec.ts` |
| 내려받은 파일을 다시 열면 같은 바이트로 내려받는다 | [[07-testing#4. MVP의 인수 테스트\|AT-02]] | E2E | `apps/web/e2e/acceptance.spec.ts` |
| 블록 종류 여섯, 감싸기와 풀기, 복사와 붙여넣기, 분기 넣기와 지우기, If 라벨 편집 | [[07-testing#4. MVP의 인수 테스트\|AT-03]] | E2E | `apps/web/e2e/acceptance.spec.ts` |
| `a`+`i` 바로 뒤에 친 글자는 쉬지 않고 쳐도 새 블록에 들어간다 | [[07-testing#4. MVP의 인수 테스트\|AT-04]] | E2E | `apps/web/e2e/acceptance.spec.ts` |
| 글자를 치는 중의 `Ctrl`+`S`는 글자를 받아들이고 저장한다 | [[07-testing#4. MVP의 인수 테스트\|AT-04]] | E2E | `apps/web/e2e/acceptance.spec.ts` |
| 블록 500개 문서의 편집이 100ms 안에 그려진다 | [[07-testing#4. MVP의 인수 테스트\|AT-05]] | E2E | `apps/web/e2e/acceptance.spec.ts` |
| 손상된 파일은 열지 않고, 원래 문서는 그대로 남으며 편집기도 계속 동작한다 | [[07-testing#4. MVP의 인수 테스트\|AT-06]] | E2E | `apps/web/e2e/acceptance.spec.ts` |
| 저장에 실패해도 잃는 것이 없고, 다음 저장이 그것을 쓴다 | [[07-testing#4. MVP의 인수 테스트\|AT-07]] | E2E | `apps/web/e2e/acceptance.spec.ts` |
| 다른 이름으로 저장은 편집기 안에서 이름을 묻고, 취소하면 편집한 것을 지킨다 | [[07-testing#4. MVP의 인수 테스트\|AT-07]] | E2E | `apps/web/e2e/acceptance.spec.ts` |
| 저장한 파일은 화면과 같은 그림을 그리고, 그 안에 글꼴이 들어 있다 | [[07-testing#4. MVP의 인수 테스트\|AT-08]] | E2E | `apps/web/e2e/acceptance.spec.ts` |
| 그림의 두 배 크기로 PNG를 내보낸다 | [[07-testing#4. MVP의 인수 테스트\|AT-09]] | E2E | `apps/web/e2e/acceptance.spec.ts` |
| 같은 문서는 다른 탭에서도 같은 바이트로 저장된다(Chromium 쪽) | [[07-testing#4. MVP의 인수 테스트\|AT-10]] | E2E | `apps/web/e2e/acceptance.spec.ts` |
| 블록을 끌어 옮기고, 블록 아이콘을 끌어 넣고 감싼다 | [[07-testing#4. MVP의 인수 테스트\|AT-11]] | E2E | `apps/web/e2e/acceptance.spec.ts` |
| 복사한 블록은 블록으로, 보통 글은 한 줄에 처리 블록 하나로 붙여 넣는다 | [[07-testing#4. MVP의 인수 테스트\|AT-12]] | E2E | `apps/web/e2e/acceptance.spec.ts` |
| 새로 고친 뒤 브라우저의 임시 보관이 복원된다 | [[07-testing#4. MVP의 인수 테스트\|AT-13]] | E2E | `apps/web/e2e/acceptance.spec.ts` |
| 자동 저장은 편집하고 2초 뒤에 원래 파일에 쓴다(Chromium 쪽) | [[07-testing#4. MVP의 인수 테스트\|AT-14]] | E2E | `apps/web/e2e/acceptance.spec.ts` |
| File System Access가 없으면 저장은 내려받기가 되고, 그 사실을 한 번 알린다(Chromium 쪽) | [[07-testing#4. MVP의 인수 테스트\|AT-14]] | E2E | `apps/web/e2e/acceptance.spec.ts` |
| 최근 파일에서 파일을 다시 연다 | [[07-testing#4. MVP의 인수 테스트\|AT-15]] | E2E | `apps/web/e2e/acceptance.spec.ts` |
| 명령 팔레트에서 명령을 찾아 실행한다 | [[07-testing#4. MVP의 인수 테스트\|AT-16]] | E2E | `apps/web/e2e/acceptance.spec.ts` |
| `?`는 단축키 목록을, 도움말은 사용법을 연다 | [[07-testing#4. MVP의 인수 테스트\|AT-17]] | E2E | `apps/web/e2e/acceptance.spec.ts` |
| 메뉴, 상태 표시줄, 그림의 고정 문구가 한국어다 | [[01-requirements#^r-nfr\|R-NFR-04]] | E2E | `apps/web/e2e/acceptance.spec.ts` |

### 2.2 편집 명령과 모델

블록 넣기 · 지우기 · 옮기기 · 감싸기, 분기, 호출, 다이어그램과 헤더, 복사 · 붙여넣기가 문서를 바르게 바꾸는지, 어떤 명령을 이어도 모델의 불변식이 지켜지는지 → [[01-model]]

파일 16개, 테스트 176개:

| 자리 | 무엇을 확인하나 | 확인하는 것 | 방법 | 유형 | 테스트 수 |
| --- | --- | --- | --- | --- | --- |
| `packages/editor/src/session/engine.test.ts` | 글자 넣기와 편집(AT-03) · 명령 뒤의 선택(03-editor 2.3) · 클립보드(AT-12) · 분기(R-EDIT-11, UX MD3) · 키와 모드(03-keymap) · 보기 전용(03-editor 6.4) | [[07-testing#4. MVP의 인수 테스트\|AT-03]], [[07-testing#4. MVP의 인수 테스트\|AT-12]], [[01-requirements#^r-edit\|R-EDIT-11]], [[ux-decisions\|UX MD3]] | Vitest | 통합 | 27 |
| `packages/core/src/commands/branch.test.ts` | Case의 분기 · If와 Case의 변환(UX MD3) · 빠진 default 분기(UX CD1) | [[ux-decisions\|UX MD3]], [[ux-decisions\|UX CD1]] | Vitest | 단위 | 11 |
| `packages/core/src/commands/call.test.ts` | 호출 블록의 명령(editCall · setCallTarget · insertCall · newMethodAndCall) | — | Vitest | 단위 | 24 |
| `packages/core/src/commands/clipboard.test.ts` | 복사, 잘라내기, 붙여넣기 | — | Vitest | 단위 | 7 |
| `packages/core/src/commands/delete.test.ts` | 블록 지우기(deleteBlocks) | — | Vitest | 단위 | 6 |
| `packages/core/src/commands/diagram.test.ts` | 헤더와 다이어그램의 명령(editHead · setHead · newDiagram · deleteDiagram · moveDiagram · setSettings · defaultHeadName) | — | Vitest | 단위 | 31 |
| `packages/core/src/commands/edit-text.test.ts` | 글자 편집(editText) | — | Vitest | 단위 | 5 |
| `packages/core/src/commands/insert.test.ts` | 블록 넣기(insertBlock) | — | Vitest | 단위 | 13 |
| `packages/core/src/commands/move-to.test.ts` | moveTo(끌어 놓기) | — | Vitest | 단위 | 5 |
| `packages/core/src/commands/move.test.ts` | 위아래로 옮기기 · 좌우로 옮기기(분기) | — | Vitest | 단위 | 12 |
| `packages/core/src/commands/new-document.test.ts` | 새 문서 | — | Vitest | 단위 | 3 |
| `packages/core/src/commands/properties.test.ts` | 속성 기반 테스트(07-testing 2, QA-01) | [[03-quality-attribute-scenarios#1. 목록\|QA-01]] | 속성 기반 (fast-check) | 단위 | 2 |
| `packages/core/src/commands/wrap.test.ts` | 감싸기 · 풀기 | — | Vitest | 단위 | 12 |
| `packages/core/src/model/id.test.ts` | id | — | Vitest | 단위 | 5 |
| `packages/core/src/model/invariants.test.ts` | 불변식 검사(checkInvariants) | — | Vitest | 단위 | 10 |
| `packages/editor/src/clipboard/clip-format.test.ts` | 클립보드 형식(03-editor 3.3) | — | Vitest | 단위 | 3 |

확인하는 것(ID)을 이름에 적은 테스트 122개:

| 테스트 | 확인하는 것 | 유형 | 자리 |
| --- | --- | --- | --- |
| 다른 프로그램의 글은 한 줄에 처리 블록 하나가 된다 | [[07-testing#4. MVP의 인수 테스트\|AT-12]] | 통합 | `packages/editor/src/session/engine.test.ts` |
| 사용자 정의 형식이 글보다 먼저다 | [[07-testing#4. MVP의 인수 테스트\|AT-12]] | 통합 | `packages/editor/src/session/engine.test.ts` |
| 바깥에서 온 글은 한 줄에 처리 블록 하나가 된다 | [[07-testing#4. MVP의 인수 테스트\|AT-12]] | 단위 | `packages/editor/src/clipboard/clip-format.test.ts` |
| 어떤 명령을 이어도 불변식이 지켜지고, 입력을 바꾸지 않는다 | [[03-quality-attribute-scenarios#1. 목록\|QA-01]] | 단위 | `packages/core/src/commands/properties.test.ts` |
| 생성기가 뷰 상태의 id를 피해야 할 때도 id가 겹치지 않는다 | [[03-quality-attribute-scenarios#1. 목록\|QA-01]] | 단위 | `packages/core/src/commands/properties.test.ts` |
| 새 문서에는 빈 블록 하나를 담은 다이어그램 하나가 있다 | [[01-requirements#^r-all\|R-ALL-03]] | 단위 | `packages/core/src/commands/new-document.test.ts` |
| 새 문서는 아무것도 접히지 않은 채, 결과 기호 ←로 시작한다 | [[01-requirements#^r-all\|R-ALL-03]] | 단위 | `packages/core/src/commands/new-document.test.ts` |
| 인자와 결과를 정하고, 각각 한 줄이다 | [[01-requirements#^r-blk\|R-BLK-07]] | 단위 | `packages/core/src/commands/call.test.ts` |
| 빠진 필드는 그대로 둔다 | [[01-requirements#^r-blk\|R-BLK-07]] | 단위 | `packages/core/src/commands/call.test.ts` |
| 무언가를 받는 Method의 비운 인자는 다시 채워진다 | [[01-requirements#^r-blk\|R-BLK-07]] | 단위 | `packages/core/src/commands/call.test.ts` |
| 아무것도 받지 않는 Method는 빈 인자로 호출할 수 있다 | [[01-requirements#^r-blk\|R-BLK-07]] | 단위 | `packages/core/src/commands/call.test.ts` |
| 대상을 잃은 호출 블록은 편집할 수 없다 | [[01-requirements#^r-blk\|R-BLK-07]] | 단위 | `packages/core/src/commands/call.test.ts` |
| 빈 인자는 새 Method의 매개변수를 받는다 | [[01-requirements#^r-blk\|R-BLK-07]] | 단위 | `packages/core/src/commands/call.test.ts` |
| Event와 헤더 없는 다이어그램은 호출할 수 없다 | [[01-requirements#^r-blk\|R-BLK-07]] | 단위 | `packages/core/src/commands/call.test.ts` |
| 매개변수를 인자로 담은 호출 블록을 넣는다 | [[01-requirements#^r-blk\|R-BLK-07]] | 단위 | `packages/core/src/commands/call.test.ts` |
| 아무것도 받지 않는 Method는 빈 인자를 받는다 | [[01-requirements#^r-blk\|R-BLK-07]] | 단위 | `packages/core/src/commands/call.test.ts` |
| Method는 자기 자신을 호출할 수 있다 | [[01-requirements#^r-blk\|R-BLK-07]] | 단위 | `packages/core/src/commands/call.test.ts` |
| Method만 호출할 수 있다 | [[01-requirements#^r-blk\|R-BLK-07]] | 단위 | `packages/core/src/commands/call.test.ts` |
| 선택한 것에서 새 Method를 만들고 호출하기를 한 번에 | [[01-requirements#^r-blk\|R-BLK-07]] | 단위 | `packages/core/src/commands/call.test.ts` |
| 적은 이름이 헤더가 되고, 그 매개변수가 인자가 된다 | [[01-requirements#^r-blk\|R-BLK-07]] | 단위 | `packages/core/src/commands/call.test.ts` |
| 괄호를 지우면 호출 블록의 인자가 비워진다 | [[01-requirements#^r-blk\|R-BLK-07]] | 단위 | `packages/core/src/commands/diagram.test.ts` |
| 괄호를 더하면 빈 인자가 괄호 안의 글자로 채워진다 | [[01-requirements#^r-blk\|R-BLK-07]] | 단위 | `packages/core/src/commands/diagram.test.ts` |
| 매개변수가 바뀌어도 적은 인자는 남는다 | [[01-requirements#^r-blk\|R-BLK-07]] | 단위 | `packages/core/src/commands/diagram.test.ts` |
| Method 헤더를 없애면 그 호출 블록은 대상을 잃는다 | [[01-requirements#^r-blk\|R-BLK-07]] | 단위 | `packages/core/src/commands/diagram.test.ts` |
| 이름을 적어 호출한 블록은 적힌 그대로 편집한다 | [[01-requirements#^r-blk\|R-BLK-08]] | 단위 | `packages/core/src/commands/call.test.ts` |
| Event 헤더의 글자를 정한다 | [[01-requirements#^r-blk\|R-BLK-10]] | 단위 | `packages/core/src/commands/diagram.test.ts` |
| 헤더 없는 다이어그램에 기본 이름의 Event 헤더를 단다 | [[01-requirements#^r-blk\|R-BLK-10]] | 단위 | `packages/core/src/commands/diagram.test.ts` |
| "Event n"이나 "Method n"이고, n은 쓰이지 않은 가장 작은 수다 | [[01-requirements#^r-blk\|R-BLK-10]] | 단위 | `packages/core/src/commands/diagram.test.ts` |
| 비거나 겹치는 이름과 모르는 대상은 거절한다 | [[01-requirements#^r-blk\|R-BLK-11]] | 단위 | `packages/core/src/commands/call.test.ts` |
| Method의 이름을 바꿔도 호출 블록은 id로 그것을 가리킨다 | [[01-requirements#^r-blk\|R-BLK-11]] | 단위 | `packages/core/src/commands/diagram.test.ts` |
| 빈 이름은 Event에서도, 이름 없는 Method에서도 거절한다 | [[01-requirements#^r-blk\|R-BLK-11]] | 단위 | `packages/core/src/commands/diagram.test.ts` |
| 다른 헤더가 가진 이름은 Event와 Method를 가리지 않고 거절한다 | [[01-requirements#^r-blk\|R-BLK-11]] | 단위 | `packages/core/src/commands/diagram.test.ts` |
| 이름은 대소문자를 가리고, 헤더는 자기 이름을 그대로 둘 수 있다 | [[01-requirements#^r-blk\|R-BLK-11]] | 단위 | `packages/core/src/commands/diagram.test.ts` |
| Method 헤더를 달고, 기본 이름은 쓰고 있는 이름을 건너뛴다 | [[01-requirements#^r-blk\|R-BLK-11]] | 단위 | `packages/core/src/commands/diagram.test.ts` |
| Event를 Method로, 다시 Event로 바꾸며 글자를 지킨다 | [[01-requirements#^r-blk\|R-BLK-11]] | 단위 | `packages/core/src/commands/diagram.test.ts` |
| 호출 블록이 부르는 Method는 Event가 될 수 없다 | [[01-requirements#^r-blk\|R-BLK-11]] | 단위 | `packages/core/src/commands/diagram.test.ts` |
| 종류를 바꿀 때 겹치거나 빈 이름으로 읽히는 글자는 거절한다 | [[01-requirements#^r-blk\|R-BLK-11]] | 단위 | `packages/core/src/commands/diagram.test.ts` |
| `a` + 종류 글자는 선택 뒤에 블록을 넣고 글자 편집을 연다 | [[01-requirements#^r-edit\|R-EDIT-01]] | 통합 | `packages/editor/src/session/engine.test.ts` |
| 선택한 범위를 그 안의 것과 함께 지운다 | [[01-requirements#^r-edit\|R-EDIT-01]] | 단위 | `packages/core/src/commands/delete.test.ts` |
| 접기 영역 전체를 지우면 그 블록들이 지워진다 | [[01-requirements#^r-edit\|R-EDIT-01]] | 단위 | `packages/core/src/commands/delete.test.ts` |
| 하나뿐인 빈 블록과 없는 대상은 지우기를 거절한다 | [[01-requirements#^r-edit\|R-EDIT-01]] | 단위 | `packages/core/src/commands/delete.test.ts` |
| 다른 블록과 함께 있는 빈 블록은 지울 수 있다 | [[01-requirements#^r-edit\|R-EDIT-01]] | 단위 | `packages/core/src/commands/delete.test.ts` |
| 블록의 글자를 정하고 나머지는 지킨다 | [[01-requirements#^r-edit\|R-EDIT-01]] | 단위 | `packages/core/src/commands/edit-text.test.ts` |
| 없는 노드, 다이어그램 헤더, 호출 블록(나중 기능)은 거절한다 | [[01-requirements#^r-edit\|R-EDIT-01]] | 단위 | `packages/core/src/commands/edit-text.test.ts` |
| 선택한 블록 뒤에 처리 블록을 넣는다 | [[01-requirements#^r-edit\|R-EDIT-01]] | 단위 | `packages/core/src/commands/insert.test.ts` |
| 선택 앞에, 범위면 범위의 끝 뒤에 넣는다 | [[01-requirements#^r-edit\|R-EDIT-01]] | 단위 | `packages/core/src/commands/insert.test.ts` |
| 빈 블록 위에 넣은 제어 블록은 그 자리를 차지한다 | [[01-requirements#^r-edit\|R-EDIT-01]] | 단위 | `packages/core/src/commands/insert.test.ts` |
| 빈 블록 위의 처리 블록은 아무것도 바꾸지 않는다(편집기가 그 블록을 연다) | [[01-requirements#^r-edit\|R-EDIT-01]] | 단위 | `packages/core/src/commands/insert.test.ts` |
| 분기의 블록을 선택했으면 그 분기 안에 넣는다 | [[01-requirements#^r-edit\|R-EDIT-01]] | 단위 | `packages/core/src/commands/insert.test.ts` |
| 선택한 것이 없으면 다이어그램의 끝에 넣는다 | [[01-requirements#^r-edit\|R-EDIT-01]] | 단위 | `packages/core/src/commands/insert.test.ts` |
| 없거나 이어지지 않은 대상은 거절한다 | [[01-requirements#^r-edit\|R-EDIT-01]] | 단위 | `packages/core/src/commands/insert.test.ts` |
| 감싸면 새 블록이 선택되고 그 조건이 열린다 | [[01-requirements#^r-edit\|R-EDIT-06]] | 통합 | `packages/editor/src/session/engine.test.ts` |
| 이어진 범위를 그 자리에서 새 While로 감싼다 | [[01-requirements#^r-edit\|R-EDIT-06]] | 단위 | `packages/core/src/commands/wrap.test.ts` |
| If는 블록들을 참 분기에 담고, 거짓 분기는 비어 있다 | [[01-requirements#^r-edit\|R-EDIT-06]] | 단위 | `packages/core/src/commands/wrap.test.ts` |
| Case는 블록들을 첫 분기에 담고, 둘째 분기와 default를 갖는다 | [[01-requirements#^r-edit\|R-EDIT-06]] | 단위 | `packages/core/src/commands/wrap.test.ts` |
| 안의 접기 영역은 안으로 들어가고, 범위와 꼭 같은 영역은 감싼 블록을 둘러싼 채 남는다 | [[01-requirements#^r-edit\|R-EDIT-06]] | 단위 | `packages/core/src/commands/wrap.test.ts` |
| 처리 블록과 없는 대상은 거절한다 | [[01-requirements#^r-edit\|R-EDIT-06]] | 단위 | `packages/core/src/commands/wrap.test.ts` |
| 안에서 풀면 선택을 지키고, 무엇을 없앴는지 알린다 | [[01-requirements#^r-edit\|R-EDIT-07]] | 통합 | `packages/editor/src/session/engine.test.ts` |
| 선택한 제어 블록을 없애고 그 안의 블록은 제자리에 남긴다 | [[01-requirements#^r-edit\|R-EDIT-07]] | 단위 | `packages/core/src/commands/wrap.test.ts` |
| If나 Case는 비지 않은 분기들을 차례로 남긴다 | [[01-requirements#^r-edit\|R-EDIT-07]] | 단위 | `packages/core/src/commands/wrap.test.ts` |
| 안의 블록을 선택했으면 그것을 담은 가장 가까운 제어 블록을 없앤다(UX Q8) | [[01-requirements#^r-edit\|R-EDIT-07]] | 단위 | `packages/core/src/commands/wrap.test.ts` |
| 감쌌다 풀면 같은 블록으로 돌아온다 | [[01-requirements#^r-edit\|R-EDIT-07]] | 단위 | `packages/core/src/commands/wrap.test.ts` |
| 안의 접기 영역은 밖으로 나오고, 블록을 둘러싼 영역은 이제 그 블록들에 걸친다 | [[01-requirements#^r-edit\|R-EDIT-07]] | 단위 | `packages/core/src/commands/wrap.test.ts` |
| 안이 빈 블록뿐인 제어 블록은, 남는 것이 없으면 빈 블록 하나를 남긴다 | [[01-requirements#^r-edit\|R-EDIT-07]] | 단위 | `packages/core/src/commands/wrap.test.ts` |
| 제어 블록이 없으면, 그리고 호출 블록(나중)은 거절한다 | [[01-requirements#^r-edit\|R-EDIT-07]] | 단위 | `packages/core/src/commands/wrap.test.ts` |
| 블록을 옆 반복 안으로 옮기며 id를 지킨다 | [[01-requirements#^r-edit\|R-EDIT-09]] | 단위 | `packages/core/src/commands/move-to.test.ts` |
| 빈 블록 위에 떨어뜨린 블록은 그 자리를 차지한다 | [[01-requirements#^r-edit\|R-EDIT-09]] | 단위 | `packages/core/src/commands/move-to.test.ts` |
| 블록이 하나도 남지 않은 줄에는 빈 블록이 들어간다 | [[01-requirements#^r-edit\|R-EDIT-09]] | 단위 | `packages/core/src/commands/move-to.test.ts` |
| 제자리에 떨어뜨린 블록은 아무것도 바꾸지 않는다 | [[01-requirements#^r-edit\|R-EDIT-09]] | 단위 | `packages/core/src/commands/move-to.test.ts` |
| 블록을 자기 안에 떨어뜨리기는 거절한다 | [[01-requirements#^r-edit\|R-EDIT-09]] | 단위 | `packages/core/src/commands/move-to.test.ts` |
| `dd`는 잘라내고, `p`는 새 id로 선택 뒤에 붙여 넣는다 | [[01-requirements#^r-edit\|R-EDIT-10]] | 통합 | `packages/editor/src/session/engine.test.ts` |
| 복사는 하위 트리 전체와 범위 안의 접기 영역을 가져간다 | [[01-requirements#^r-edit\|R-EDIT-10]] | 단위 | `packages/core/src/commands/clipboard.test.ts` |
| 붙여넣기는 새 id의 사본을 선택한 블록 뒤에 둔다 | [[01-requirements#^r-edit\|R-EDIT-10]] | 단위 | `packages/core/src/commands/clipboard.test.ts` |
| 빈 블록에 붙여 넣으면 그 자리를 차지한다 | [[01-requirements#^r-edit\|R-EDIT-10]] | 단위 | `packages/core/src/commands/clipboard.test.ts` |
| 붙여넣기는 빈 클립과 없는 대상을 거절한다 | [[01-requirements#^r-edit\|R-EDIT-10]] | 단위 | `packages/core/src/commands/clipboard.test.ts` |
| 잘라내기는 클립을 주고 블록을 지운다 | [[01-requirements#^r-edit\|R-EDIT-10]] | 단위 | `packages/core/src/commands/clipboard.test.ts` |
| 복사한 블록은 다른 프로그램에는 들여쓴 줄들이다 | [[01-requirements#^r-edit\|R-EDIT-10]] | 단위 | `packages/editor/src/clipboard/clip-format.test.ts` |
| 모델 JSON을 다시 읽으면 같은 블록이다 | [[01-requirements#^r-edit\|R-EDIT-10]] | 단위 | `packages/editor/src/clipboard/clip-format.test.ts` |
| 옮긴 블록은 선택된 채로 남는다 | [[01-requirements#^r-edit\|R-EDIT-11]] | 통합 | `packages/editor/src/session/engine.test.ts` |
| 분기 라벨에서 `o`는 분기를 넣고 그 라벨을 연다 | [[01-requirements#^r-edit\|R-EDIT-11]] | 통합 | `packages/editor/src/session/engine.test.ts` |
| 선택한 분기의 뒤나 앞에 쓰이지 않은 번호 라벨로 분기를 넣는다 | [[01-requirements#^r-edit\|R-EDIT-11]] | 단위 | `packages/core/src/commands/branch.test.ts` |
| default 뒤에 넣은 분기는 default 바로 앞에 간다 | [[01-requirements#^r-edit\|R-EDIT-11]] | 단위 | `packages/core/src/commands/branch.test.ts` |
| If에 분기를 넣으면 Case로 바꿀지 묻는다(UX MD3) | [[01-requirements#^r-edit\|R-EDIT-11]] | 단위 | `packages/core/src/commands/branch.test.ts` |
| 분기를 블록째 지우고, 분기가 하나 남으면 If로 바꾸기를 묻는다(UX MD3) | [[01-requirements#^r-edit\|R-EDIT-11]] | 단위 | `packages/core/src/commands/branch.test.ts` |
| default와 마지막 분기, 그리고 If의 분기는 지울 수 없다(UX MD3) | [[01-requirements#^r-edit\|R-EDIT-11]] | 단위 | `packages/core/src/commands/branch.test.ts` |
| default가 없는 Case에서 지울 때는 묻지 않는다 | [[01-requirements#^r-edit\|R-EDIT-11]] | 단위 | `packages/core/src/commands/branch.test.ts` |
| 분기 하나와 default만 있는 Case는 id를 지킨 채 If가 된다 | [[01-requirements#^r-edit\|R-EDIT-11]] | 단위 | `packages/core/src/commands/branch.test.ts` |
| 분기가 꼭 하나이고 default가 있는 Case만 바뀐다 | [[01-requirements#^r-edit\|R-EDIT-11]] | 단위 | `packages/core/src/commands/branch.test.ts` |
| If는 참과 default 사이에 새 분기가 든 Case가 된다 | [[01-requirements#^r-edit\|R-EDIT-11]] | 단위 | `packages/core/src/commands/branch.test.ts` |
| Case의 분기 라벨을 정하되, 빈 라벨과 default 라벨은 정하지 않는다 | [[01-requirements#^r-edit\|R-EDIT-11]] | 단위 | `packages/core/src/commands/edit-text.test.ts` |
| 블록이 아래나 위의 블록과 자리를 바꾼다 | [[01-requirements#^r-edit\|R-EDIT-11]] | 단위 | `packages/core/src/commands/move.test.ts` |
| 블록은 제어 블록을 건너뛰고 그 안으로 들어가지 않는다 | [[01-requirements#^r-edit\|R-EDIT-11]] | 단위 | `packages/core/src/commands/move.test.ts` |
| 줄의 끝에서는 블록이 그것을 담은 제어 블록 밖으로 나간다 | [[01-requirements#^r-edit\|R-EDIT-11]] | 단위 | `packages/core/src/commands/move.test.ts` |
| 다이어그램의 맨 위나 맨 아래에서는 옮기기를 거절한다 | [[01-requirements#^r-edit\|R-EDIT-11]] | 단위 | `packages/core/src/commands/move.test.ts` |
| Case의 분기가 라벨째 옆 분기와 자리를 바꾼다 | [[01-requirements#^r-edit\|R-EDIT-11]] | 단위 | `packages/core/src/commands/move.test.ts` |
| 블록을 옆으로 옮기면 그것을 담은 가장 가까운 분기가 옮겨진다 | [[01-requirements#^r-edit\|R-EDIT-11]] | 단위 | `packages/core/src/commands/move.test.ts` |
| default 분기는 늘 맨 끝이고, 양 끝을 넘는 것은 거절한다 | [[01-requirements#^r-edit\|R-EDIT-11]] | 단위 | `packages/core/src/commands/move.test.ts` |
| If의 분기를 맞바꾸면 블록이 바뀌고, 라벨은 제자리에 있으며, 조건에 그 사실을 적는다 | [[01-requirements#^r-edit\|R-EDIT-11]] | 단위 | `packages/core/src/commands/move.test.ts` |
| If의 분기 라벨은 그려진 낱말을 담고 열린다 | [[01-requirements#^r-edit\|R-EDIT-12]] | 통합 | `packages/editor/src/session/engine.test.ts` |
| If의 분기 라벨을 정하고 지운다 | [[01-requirements#^r-edit\|R-EDIT-12]] | 단위 | `packages/core/src/commands/edit-text.test.ts` |
| 새 Method는 마지막 Method 뒤에 간다 | [[01-requirements#^r-edit\|R-EDIT-18]] | 단위 | `packages/core/src/commands/diagram.test.ts` |
| 새 Event는 마지막 Event나 헤더 없는 다이어그램 뒤에 간다 | [[01-requirements#^r-edit\|R-EDIT-18]] | 단위 | `packages/core/src/commands/diagram.test.ts` |
| 그 종류의 첫 것은 맨 앞(Event)이나 맨 뒤(Method)에 간다 | [[01-requirements#^r-edit\|R-EDIT-18]] | 단위 | `packages/core/src/commands/diagram.test.ts` |
| 다이어그램을 지우면 그것을 부르던 호출 블록은 대상을 잃는다 | [[01-requirements#^r-edit\|R-EDIT-18]] | 단위 | `packages/core/src/commands/diagram.test.ts` |
| 같은 종류의 앞 다이어그램과 자리를 바꾸고, 다른 종류는 건너뛴다 | [[01-requirements#^r-edit\|R-EDIT-18]] | 단위 | `packages/core/src/commands/diagram.test.ts` |
| 같은 종류의 양 끝에서는 거절한다 | [[01-requirements#^r-edit\|R-EDIT-18]] | 단위 | `packages/core/src/commands/diagram.test.ts` |
| 헤더의 모양을 바꾼다 | [[01-requirements#^r-lay\|R-LAY-10]] | 단위 | `packages/core/src/commands/diagram.test.ts` |
| 헤더 모양의 기본은 "제목처럼"이고, 넘겨줄 수도 있다(UX HS1) | [[01-requirements#^r-lay\|R-LAY-10]] | 단위 | `packages/core/src/commands/new-document.test.ts` |
| 올바른 문서에는 위반이 없다 | [[01-requirements#^r-nfr\|R-NFR-01]] | 단위 | `packages/core/src/model/invariants.test.ts` |
| 빈 default 칸에 글자를 치면 default 분기가 생기고, 실행 취소 한 단계다 | [[ux-decisions\|UX CD1]] | 통합 | `packages/editor/src/session/engine.test.ts` |
| 빈 default 칸에서 넣으면 분기가 생기고, 지우기는 아무것도 하지 않는다 | [[ux-decisions\|UX CD1]] | 통합 | `packages/editor/src/session/engine.test.ts` |
| default가 없는 Case에 빈 default 분기를 준다 | [[ux-decisions\|UX CD1]] | 단위 | `packages/core/src/commands/branch.test.ts` |
| default가 있는 Case, 다른 블록, 모르는 id는 거절한다 | [[ux-decisions\|UX CD1]] | 단위 | `packages/core/src/commands/branch.test.ts` |
| 키 힌트는 첫 키 뒤 0.4초에 보이고, `Esc`가 취소한다 | [[ux-decisions\|UX K1]] | 통합 | `packages/editor/src/session/engine.test.ts` |
| 처리 블록(`%j`)은 빈 블록 옆에도 간다 | [[ux-decisions\|UX KP2]] | 통합 | `packages/editor/src/session/engine.test.ts` |
| besideEmpty이면 처리 블록이 빈 블록 옆에 간다 | [[ux-decisions\|UX KP2]] | 단위 | `packages/core/src/commands/insert.test.ts` |
| 접기 영역에는 그 끝에서 이어 붙고, 선택이 없으면 다이어그램의 끝으로 간다 | [[ux-decisions\|UX MD1]] | 단위 | `packages/core/src/commands/call.test.ts` |
| 같은 글자로 입력란을 닫으면 실행 취소 단계가 남지 않는다 | [[ux-decisions\|UX MD2]] | 통합 | `packages/editor/src/session/engine.test.ts` |
| 분기가 하나 남게 지우면 If로 바꿀지 묻고, `Esc`는 Case를 지킨다 | [[ux-decisions\|UX MD3]] | 통합 | `packages/editor/src/session/engine.test.ts` |
| If에 분기를 넣으면 Case로 바꿀지 묻고, `Enter`가 바꾼다 | [[ux-decisions\|UX MD3]] | 통합 | `packages/editor/src/session/engine.test.ts` |
| 지운 뒤에는 다음 블록, 없으면 앞 블록, 없으면 담은 블록이 선택된다 | [[ux-decisions\|UX Q19]] | 통합 | `packages/editor/src/session/engine.test.ts` |
| 실행 취소는 선택한 것이 아직 있으면 선택을 지킨다 | [[ux-decisions\|UX Q19]] | 통합 | `packages/editor/src/session/engine.test.ts` |

### 2.3 키 · 마우스 · 선택

키가 어느 명령으로 가는지, 이동과 선택, 두 키 조합의 힌트, 클릭 · 끌기가 어느 블록을 가리키는지, 선택 테두리와 캔버스의 포커스 → [[03-keymap]], [[02-interaction-rules]]

파일 10개, 테스트 75개:

| 자리 | 무엇을 확인하나 | 확인하는 것 | 방법 | 유형 | 테스트 수 |
| --- | --- | --- | --- | --- | --- |
| `apps/web/e2e/canvas.spec.ts` | 캔버스 | — | Playwright | E2E | 4 |
| `packages/editor/src/session/diagrams.test.ts` | 헤더 선택(조작 규칙 2 "키보드로 이동하고 삽입하기") · 헤더 이름 편집(조작 규칙 "Event 헤더", "Method 헤더") · 헤더와 다이어그램의 명령(조작 규칙 "새 Method로 빼기와 새 다이어그램") · 호출 블록(조작 규칙 "호출 블록") | — | Vitest | 통합 | 21 |
| `packages/editor/src/session/random-keys.test.ts` | 무작위 키(QA-01) | [[03-quality-attribute-scenarios#1. 목록\|QA-01]] | Vitest | 통합 | 1 |
| `packages/editor/src/dom/overlay.test.ts` | 선택 테두리 그리기(overlayContent) | — | Vitest | 단위 | 1 |
| `packages/editor/src/input/hit-test.test.ts` | 클릭이 맞는 자리(03-editor 3.1) · 떨어뜨리는 자리(03-editor 3.2) · 다이어그램 헤더(R-BLK-10, R-BLK-11) | [[01-requirements#^r-blk\|R-BLK-10]], [[01-requirements#^r-blk\|R-BLK-11]] | Vitest | 단위 | 14 |
| `packages/editor/src/input/keys.test.ts` | 키 읽기(03-editor 4) | — | Vitest | 단위 | 8 |
| `packages/editor/src/navigation/navigate.test.ts` | 키보드 이동(03-editor 2.2) | — | Vitest | 단위 | 12 |
| `packages/editor/src/state/selection.test.ts` | 선택(03-editor 2) | — | Vitest | 단위 | 5 |
| `packages/editor/src/ui/key-hint.test.ts` | UX K3: 키 힌트는 선택 바로 아래에 간다 | [[ux-decisions\|UX K3]] | Vitest | 단위 | 4 |
| `packages/editor/src/ui/keys.test.ts` | 키 | — | Vitest | 단위 | 5 |

확인하는 것(ID)을 이름에 적은 테스트 48개:

| 테스트 | 확인하는 것 | 유형 | 자리 |
| --- | --- | --- | --- |
| 선택 테두리가 블록의 선을 네 변 모두 똑같이 덮는다 | [[defects\|BUG-07]] | 단위 | `packages/editor/src/dom/overlay.test.ts` |
| 빈 캔버스를 클릭하면 `a`를 기다리던 키 힌트가 닫힌다 | [[defects\|BUG-08]] | E2E | `apps/web/e2e/canvas.spec.ts` |
| 블록을 끌어도 그려진 글자가 선택되지 않는다 | [[defects\|BUG-09]] | E2E | `apps/web/e2e/canvas.spec.ts` |
| 무작위 키 400개를 눌러도 불변식이 지켜지고, 실행 취소로 처음까지 되돌아간다(시드 ${String(seed)}) | [[03-quality-attribute-scenarios#1. 목록\|QA-01]] | 통합 | `packages/editor/src/session/random-keys.test.ts` |
| Method 헤더를 없애면 그 호출은 대상을 잃고 첫 블록이 선택된다 | [[01-requirements#^r-blk\|R-BLK-07]] | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| `a c`는 Method 목록을 보이고, 고른 Method를 호출하며 그 인자를 입력한다 | [[01-requirements#^r-blk\|R-BLK-07]] | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| "새 Method를 만들고 호출"은 Method를 만들고 그 이름을 편집한다 | [[01-requirements#^r-blk\|R-BLK-07]] | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| 대상을 잃은 호출 블록은 편집할 수 없다 | [[01-requirements#^r-blk\|R-BLK-07]] | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| 호출할 Method를 바꿀 때는 지금 Method에서 시작하고 글자를 지킨다 | [[01-requirements#^r-blk\|R-BLK-07]] | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| 첫 블록에서 `↑`는 헤더를 선택하고, `↓`는 돌아온다 | [[01-requirements#^r-blk\|R-BLK-10]] | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| `Enter`는 이름을 편집하고, 받아들이면 실행 취소 한 단계로 바뀐다 | [[01-requirements#^r-blk\|R-BLK-10]] | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| 헤더 없는 다이어그램에서 `e`는 헤더를 달고 이름을 편집한다 | [[01-requirements#^r-blk\|R-BLK-10]] | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| 헤더를 클릭하면 헤더에 맞고 헤더가 선택된다 | [[01-requirements#^r-blk\|R-BLK-10]] | 단위 | `packages/editor/src/input/hit-test.test.ts` |
| 겹치는 이름이면 입력란이 다시 열리고, 거기서 `Esc`는 옛 이름을 지킨다 | [[01-requirements#^r-blk\|R-BLK-11]] | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| 헤더에서 `m`은 종류를 바꾸고, 호출되는 Method는 Event가 될 수 없다 | [[01-requirements#^r-blk\|R-BLK-11]] | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| 처리 블록을 클릭하면 그 블록에 맞는다 | [[01-requirements#^r-edit\|R-EDIT-01]] | 단위 | `packages/editor/src/input/hit-test.test.ts` |
| `↓`는 그려진 순서로 가되 옆 분기로는 들어가지 않는다 | [[01-requirements#^r-edit\|R-EDIT-03]] | 단위 | `packages/editor/src/navigation/navigate.test.ts` |
| 분기의 첫 블록에서 `↑`는 그 라벨을, 그다음 If를 선택한다(UX Q10) | [[01-requirements#^r-edit\|R-EDIT-03]] | 단위 | `packages/editor/src/navigation/navigate.test.ts` |
| If 아래에서 `↑`는 그 If의 가장 왼쪽 분기의 맨 아래로 간다 | [[01-requirements#^r-edit\|R-EDIT-03]] | 단위 | `packages/editor/src/navigation/navigate.test.ts` |
| `←` · `→`는 분기를 건너다가 If를 떠난다(UX Q11) | [[01-requirements#^r-edit\|R-EDIT-03]] | 단위 | `packages/editor/src/navigation/navigate.test.ts` |
| 분기 라벨에서 `←` · `→`는 다음 라벨로, `↓`는 분기 안으로 간다 | [[01-requirements#^r-edit\|R-EDIT-03]] | 단위 | `packages/editor/src/navigation/navigate.test.ts` |
| `Ctrl`+`↑` · `↓`는 제어 블록을 블록 하나로 다룬다 | [[01-requirements#^r-edit\|R-EDIT-03]] | 단위 | `packages/editor/src/navigation/navigate.test.ts` |
| `Ctrl`+`←` · `→`는 옆 분기로, 분기 밖에서는 위와 아래로 간다 | [[01-requirements#^r-edit\|R-EDIT-03]] | 단위 | `packages/editor/src/navigation/navigate.test.ts` |
| `gg` · `G`는 다이어그램의 첫 블록과 마지막 블록을 선택한다 | [[01-requirements#^r-edit\|R-EDIT-03]] | 단위 | `packages/editor/src/navigation/navigate.test.ts` |
| `[[` · `]]`는 옆 다이어그램으로 간다(있으면) | [[01-requirements#^r-edit\|R-EDIT-03]] | 단위 | `packages/editor/src/navigation/navigate.test.ts` |
| 조합의 첫 키는 기다리고, 둘째 키가 명령을 실행한다(UX K1) | [[01-requirements#^r-edit\|R-EDIT-04]] | 단위 | `packages/editor/src/input/keys.test.ts` |
| 더 깊은 곳을 `Shift`+클릭하면 가장 가까운 공통의 줄까지 넓힌다(ADR-0008) | [[01-requirements#^r-edit\|R-EDIT-05]] | 단위 | `packages/editor/src/state/selection.test.ts` |
| 다른 다이어그램을 `Shift`+클릭하면 그 블록만 선택한다 | [[01-requirements#^r-edit\|R-EDIT-05]] | 단위 | `packages/editor/src/state/selection.test.ts` |
| `Shift`+`↓`는 한 부모 아래에 머문다 | [[01-requirements#^r-edit\|R-EDIT-05]] | 단위 | `packages/editor/src/state/selection.test.ts` |
| 블록 사이에 8px 띠가 있고, 나머지는 블록 위다 | [[01-requirements#^r-edit\|R-EDIT-09]] | 단위 | `packages/editor/src/input/hit-test.test.ts` |
| 블록 위에 떨어뜨린 새 제어 블록은 그 블록을 감싸고, 처리 블록은 뒤에 간다 | [[01-requirements#^r-edit\|R-EDIT-09]] | 단위 | `packages/editor/src/input/hit-test.test.ts` |
| 선택한 블록 가운데 하나에서 하면 선택 전체를 감싼다 | [[01-requirements#^r-edit\|R-EDIT-09]] | 단위 | `packages/editor/src/input/hit-test.test.ts` |
| 끄는 블록은 블록 사이로, 제어 블록 안으로도 간다 | [[01-requirements#^r-edit\|R-EDIT-09]] | 단위 | `packages/editor/src/input/hit-test.test.ts` |
| 빈 블록은 떨어뜨린 것을 통째로 받고, 끌고 있는 블록 안에는 아무것도 떨어지지 않는다 | [[01-requirements#^r-edit\|R-EDIT-09]] | 단위 | `packages/editor/src/input/hit-test.test.ts` |
| 분기 라벨의 줄이 그것을 둘러싼 헤더보다 먼저 맞는다 | [[01-requirements#^r-edit\|R-EDIT-12]] | 단위 | `packages/editor/src/input/hit-test.test.ts` |
| `E` · `M`은 그 종류의 새 다이어그램을 만들고 이름을 편집한다 | [[01-requirements#^r-edit\|R-EDIT-18]] | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| `Shift`+`Delete`는 다이어그램을 지우고, 하나뿐인 다이어그램은 지울 수 없다 | [[01-requirements#^r-edit\|R-EDIT-18]] | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| 헤더가 있는 다이어그램의 블록에서 `m`은 빼내기가 아직 없다고 알린다 | [[01-requirements#^r-edit\|R-EDIT-19]] | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| Case의 빈 default 칸에 클릭이 맞는다 | [[ux-decisions\|UX CD1]] | 단위 | `packages/editor/src/input/hit-test.test.ts` |
| 빈 default 칸에 떨어뜨리면 default 분기가 생긴다 | [[ux-decisions\|UX CD1]] | 단위 | `packages/editor/src/input/hit-test.test.ts` |
| Case의 빈 default 칸에는 마지막 분기에서 간다 | [[ux-decisions\|UX CD1]] | 단위 | `packages/editor/src/navigation/navigate.test.ts` |
| 선택한 것이 없으면 포커스 테두리가 잠깐만 보인다 | [[ux-decisions\|UX CF2]] | E2E | `apps/web/e2e/canvas.spec.ts` |
| 빈 캔버스를 오른쪽 클릭하면 파일 · 도움말 메뉴가 보인다 | [[ux-decisions\|UX CM1]] | E2E | `apps/web/e2e/canvas.spec.ts` |
| 조합을 잇지 않는 키나 `Esc`는 그 조합을 취소한다 | [[ux-decisions\|UX K1]] | 단위 | `packages/editor/src/input/keys.test.ts` |
| 기다리던 첫 키 다음의 둘째 키를 찾는다 | [[ux-decisions\|UX K1]] | 단위 | `packages/editor/src/ui/keys.test.ts` |
| 아래에 아무것도 없을 때 `↓`는 이 블록을 담은 블록을 선택하고, 맨 위에서는 그대로다 | [[ux-decisions\|UX ND1]] | 단위 | `packages/editor/src/navigation/navigate.test.ts` |
| 빈 이름은 옛 이름을 되돌리고, 닫고, 까닭을 알린다 | [[ux-decisions\|UX Q4]] | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| 헤더에서 `Alt`+방향키는 같은 종류 안에서 다이어그램을 옮긴다 | [[ux-decisions\|UX Q6]] | 통합 | `packages/editor/src/session/diagrams.test.ts` |

### 2.4 메뉴 · 화면 · 시작

메뉴와 툴바, 화면 언어, 예제, 판 번호, 페이지가 뜨는 과정, 휴대폰 화면 → [[05-screen-layout]], [[06-web]]

파일 9개, 테스트 55개:

| 자리 | 무엇을 확인하나 | 확인하는 것 | 방법 | 유형 | 테스트 수 |
| --- | --- | --- | --- | --- | --- |
| `apps/web/e2e/boot.spec.ts` | 페이지의 시작(R-NFR-10, QA-19, inbox 2026-11-01) | [[01-requirements#^r-nfr\|R-NFR-10]], [[03-quality-attribute-scenarios#1. 목록\|QA-19]] | Playwright | E2E | 2 |
| `apps/web/e2e/examples.spec.ts` | 예제(R-EDIT-25, 05-screen-layout "예제", UX EX1 ~ EX3) | [[01-requirements#^r-edit\|R-EDIT-25]], [[ux-decisions\|UX EX1]] | Playwright | E2E | 7 |
| `apps/web/e2e/mobile.spec.ts` | 휴대폰의 웹 앱(R-NFR-08 · R-NFR-09, QA-18 · QA-20. QA-19는 boot.spec.ts에) | [[01-requirements#^r-nfr\|R-NFR-08]], [[01-requirements#^r-nfr\|R-NFR-09]], [[03-quality-attribute-scenarios#1. 목록\|QA-18]], [[03-quality-attribute-scenarios#1. 목록\|QA-20]], [[03-quality-attribute-scenarios#1. 목록\|QA-19]] | Playwright | E2E | 5 |
| `apps/web/e2e/smoke.spec.ts` |  | — | Playwright | E2E | 1 |
| `packages/editor/src/ui/editor-app.test.tsx` | 메뉴 바 · 툴바의 블록 아이콘 · 명령 팔레트 · 상태 표시줄 · 키 힌트 · 모달 · 캔버스 자리 · 컨텍스트 메뉴 · 셸의 대화 상자와 알림 · 고르는 창(조작 규칙 "호출 블록") | — | Vitest + happy-dom | 통합 | 25 |
| `apps/web/src/shell/messages.test.ts` | 화면 언어 | — | Vitest | 단위 | 3 |
| `packages/editor/src/examples/examples.test.ts` | 예제 · $id | — | Vitest | 단위 | 9 |
| `packages/editor/src/ui/menu-model.test.ts` | 메뉴 항목(menuEntries) | — | Vitest | 단위 | 1 |
| `packages/editor/src/version.test.ts` | 앱의 판 번호 | — | Vitest | 단위 | 2 |

확인하는 것(ID)을 이름에 적은 테스트 38개:

| 테스트 | 확인하는 것 | 유형 | 자리 |
| --- | --- | --- | --- |
| 창보다 큰 다이어그램은 캔버스 안에서 스크롤된다 | [[defects\|BUG-01]] | E2E | `apps/web/e2e/examples.spec.ts` |
| 툴바의 드롭다운은 툴바 안이 아니라 캔버스 위에 열린다 | [[defects\|BUG-02]] | E2E | `apps/web/e2e/examples.spec.ts` |
| `indexedDB.open`이 끝내 답하지 않아도 편집기가 뜬다 | [[defects\|BUG-03]], [[03-quality-attribute-scenarios#1. 목록\|QA-19]] | E2E | `apps/web/e2e/boot.spec.ts` |
| 시작하다 실패하면 시작 화면에 그 사실을 보인다 | [[defects\|BUG-03]], [[03-quality-attribute-scenarios#1. 목록\|QA-19]] | E2E | `apps/web/e2e/boot.spec.ts` |
| 휴대폰의 툴바에 "예제"가 보이고, 탭하면 모달이 열린다 | [[defects\|BUG-04]], [[03-quality-attribute-scenarios#1. 목록\|QA-20]] | E2E | `apps/web/e2e/mobile.spec.ts` |
| 마우스로 연 메뉴를 `Esc`가 닫는다 | [[defects\|BUG-05]] | E2E | `apps/web/e2e/examples.spec.ts` |
| SVG 파일로 저장하고, 같은 문서로 연다 | [[03-quality-attribute-scenarios#1. 목록\|QA-04]] | 단위 | `packages/editor/src/examples/examples.test.ts` |
| 느린 휴대폰에서도 편집기가 3초 안에, 블록 글꼴이 5초 안에 보인다 | [[03-quality-attribute-scenarios#1. 목록\|QA-18]] | E2E | `apps/web/e2e/mobile.spec.ts` |
| 휴대폰의 첫 방문에서는 탭 한 번으로 예제를 연다 | [[03-quality-attribute-scenarios#1. 목록\|QA-20]] | E2E | `apps/web/e2e/mobile.spec.ts` |
| 휴대폰에서는 툴바로 블록을 넣고 탭으로 선택한다 | [[03-quality-attribute-scenarios#1. 목록\|QA-20]] | E2E | `apps/web/e2e/mobile.spec.ts` |
| 휴대폰에서는 실행 취소 · 다시 실행 · 감싸기 · 도움말이 툴바에 있고, 아래 줄은 없다 | [[03-quality-attribute-scenarios#1. 목록\|QA-20]] | E2E | `apps/web/e2e/mobile.spec.ts` |
| Method들과 "새 Method"를 보이고, `j` · `k`는 지금 것에서 움직이며 `Enter`가 고른다 | [[01-requirements#^r-blk\|R-BLK-07]] | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| 클릭은 뒤에 넣고, `Shift`+클릭은 앞에, `Ctrl`+클릭은 감싼다. 처리 블록은 감쌀 수 없다 | [[01-requirements#^r-edit\|R-EDIT-01]] | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| 엔진이 힌트를 보일 때라고 하면 둘째 키를 보이고, 그 뒤에 숨긴다 | [[01-requirements#^r-edit\|R-EDIT-04]] | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| 4px를 넘게 움직인 누름은 클릭 대신 끌기로 엔진에 넘긴다 | [[01-requirements#^r-edit\|R-EDIT-09]] | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| `?`는 Vim 키와 표준 키의 두 열로 된 키 표를 열고, `Esc`가 닫는다 | [[01-requirements#^r-edit\|R-EDIT-21]] | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| 이름의 일부로 명령을 찾고, 최근에 쓴 것을 먼저 보인다 | [[01-requirements#^r-edit\|R-EDIT-24]] | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| 명령으로 열고, Vim 키를 보이며, 고른 줄을 `Enter`로 실행한다 | [[01-requirements#^r-edit\|R-EDIT-24]] | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| `↑` · `↓`로 움직이고, `Esc`로 실행하지 않고 닫는다 | [[01-requirements#^r-edit\|R-EDIT-24]] | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| 첫 방문에는 예제 열 개, 빈 문서, 파일 열기로 맞는다 | [[01-requirements#^r-edit\|R-EDIT-25]] | E2E | `apps/web/e2e/examples.spec.ts` |
| 예제 열 개를 차례대로, 두 언어의 이름과 함께 보인다 | [[01-requirements#^r-edit\|R-EDIT-25]] | 단위 | `packages/editor/src/examples/examples.test.ts` |
| 두 헤더 모양 모두에서 모든 불변식을 지킨다 | [[01-requirements#^r-edit\|R-EDIT-25]] | 단위 | `packages/editor/src/examples/examples.test.ts` |
| 주어진 헤더 모양과 새 문서의 설정 · 보기를 쓴다 | [[01-requirements#^r-edit\|R-EDIT-25]] | 단위 | `packages/editor/src/examples/examples.test.ts` |
| 언제나 같은 문서를 만든다 | [[01-requirements#^r-edit\|R-EDIT-25]] | 단위 | `packages/editor/src/examples/examples.test.ts` |
| 프로토타입의 다이어그램 · 헤더 · 블록이 있다 | [[01-requirements#^r-edit\|R-EDIT-25]] | 단위 | `packages/editor/src/examples/examples.test.ts` |
| 짧은 표기의 글자를 모두 적힌 그대로 지킨다 | [[01-requirements#^r-edit\|R-EDIT-25]] | 단위 | `packages/editor/src/examples/examples.test.ts` |
| 모든 호출 블록을 문서의 Method에 잇는다 | [[01-requirements#^r-edit\|R-EDIT-25]] | 단위 | `packages/editor/src/examples/examples.test.ts` |
| 모델 JSON으로 저장하고, 같은 문서로 연다 | [[01-requirements#^r-fmt\|R-FMT-02]] | 단위 | `packages/editor/src/examples/examples.test.ts` |
| 메뉴의 이름을 화면 언어로 보인다 | [[01-requirements#^r-nfr\|R-NFR-04]] | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| 한국어 브라우저는 한국어, 다른 모든 언어는 영어를 받는다 | [[01-requirements#^r-nfr\|R-NFR-04]] | 단위 | `apps/web/src/shell/messages.test.ts` |
| 환경 설정이 브라우저 언어보다 먼저다 | [[01-requirements#^r-nfr\|R-NFR-04]] | 단위 | `apps/web/src/shell/messages.test.ts` |
| 첫 방문 모달을 `Esc`로 닫으면 새 문서를 지키고 다시 묻지 않는다 | [[ux-decisions\|UX EX2]] | E2E | `apps/web/e2e/examples.spec.ts` |
| 도움말 › 예제…는 같은 모달을 그 문구로 연다 | [[ux-decisions\|UX EX3]] | E2E | `apps/web/e2e/examples.spec.ts` |
| 툴바의 "예제"가 예제 모달을 연다 | [[ux-decisions\|UX EX3]] | E2E | `apps/web/e2e/examples.spec.ts` |
| If ↔ Case를 버튼으로 묻고, 답을 엔진에 넘긴다 | [[ux-decisions\|UX MD3]] | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| 저장하지 않은 동안 파일 이름에 ●를 보인다 | [[ux-decisions\|UX W3]] | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| 환경 설정은 사용자 설정을 보이고, 바꾼 것을 설정 저장소에 쓴다 | [[ux-decisions\|UX W5]] | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| 문서 설정은 엔진을 거쳐 쓴다 | [[ux-decisions\|UX W5]] | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |

### 2.5 파일

파일 형식(모델이 든 SVG)의 쓰기 · 읽기 · 왕복, 손상된 파일, 편집기와 셸의 약속, 웹의 저장 · 열기 · 내려받기, 임시 보관, 탭 잠금, 최근 파일, PNG 내보내기 → [[01-file-format]], [[06-web]]

파일 15개, 테스트 106개:

| 자리 | 무엇을 확인하나 | 확인하는 것 | 방법 | 유형 | 테스트 수 |
| --- | --- | --- | --- | --- | --- |
| `apps/web/e2e/files.spec.ts` | 웹 셸의 브라우저 흐름(06-web 1, 2) | — | Playwright | E2E | 6 |
| `apps/web/src/files/web-document-store.test.ts` | 웹 문서 저장소 | — | Vitest | 통합 | 5 |
| `apps/web/src/shell/web-shell.test.ts` | 웹 셸 | — | Vitest | 통합 | 8 |
| `packages/core/node/golden.test.ts` | 골든 파일(07-testing 3) | — | 골든 파일 | 통합 | 4 |
| `packages/editor/src/create-editor.test.ts` | 셸과의 약속(03-editor 6, QA-10) · 셸이 편집기를 거쳐 묻기(03-editor 6에 더한 것) · 헤더 모양(R-LAY-10, UX HS1) · 고르는 창(조작 규칙 "호출 블록") · 헤더와 호출 블록의 인라인 편집(03-editor 3.4) | [[03-quality-attribute-scenarios#1. 목록\|QA-10]], [[01-requirements#^r-lay\|R-LAY-10]], [[ux-decisions\|UX HS1]] | Vitest + happy-dom | 통합 | 23 |
| `apps/web/src/files/export-png.test.ts` | PNG 내보내기의 크기 | — | Vitest | 단위 | 4 |
| `apps/web/src/files/file-name.test.ts` | 파일 이름 | — | Vitest | 단위 | 6 |
| `apps/web/src/shell/tab-lock.test.ts` | 탭 잠금 | — | Vitest | 단위 | 5 |
| `apps/web/src/shell/timers.test.ts` | 임시 보관 타이머 · 자동 저장 타이머 | — | Vitest | 단위 | 7 |
| `apps/web/src/storage/recent-files.test.ts` | 최근 파일 | — | Vitest | 단위 | 5 |
| `packages/core/src/format/base64.test.ts` | base64 인코딩 | — | Vitest | 단위 | 2 |
| `packages/core/src/format/model-json.test.ts` | 모델 JSON 쓰기 | — | Vitest | 단위 | 6 |
| `packages/core/src/format/parse-model.test.ts` | 모델 JSON 읽기 | — | Vitest | 단위 | 8 |
| `packages/core/src/format/round-trip.test.ts` | 왕복 | — | 속성 기반 (fast-check) | 단위 | 3 |
| `packages/core/src/format/svg-file.test.ts` | SVG 파일 | — | Vitest | 단위 | 14 |

확인하는 것(ID)을 이름에 적은 테스트 41개:

| 테스트 | 확인하는 것 | 유형 | 자리 |
| --- | --- | --- | --- |
| 망가진 입력은 까닭과 함께 거절하고, 예외를 던지지 않는다 | [[03-quality-attribute-scenarios#1. 목록\|QA-02]] | 단위 | `packages/core/src/format/parse-model.test.ts` |
| 어떤 글을 열어도 예외를 던지지 않는다 | [[03-quality-attribute-scenarios#1. 목록\|QA-02]] | 단위 | `packages/core/src/format/round-trip.test.ts` |
| 망가진 파일은 손상으로 거절하고, 예외를 던지지 않는다 | [[03-quality-attribute-scenarios#1. 목록\|QA-02]] | 단위 | `packages/core/src/format/svg-file.test.ts` |
| 골든 파일은 모두 열고 저장하면 같은 바이트다 | [[03-quality-attribute-scenarios#1. 목록\|QA-04]] | 통합 | `packages/core/node/golden.test.ts` |
| 저장한 SVG 파일을 열면 같은 문서이고, 다시 저장하면 같은 바이트다 | [[03-quality-attribute-scenarios#1. 목록\|QA-04]] | 단위 | `packages/core/src/format/round-trip.test.ts` |
| 열고 다시 저장하면 모델 부분이 같다 | [[03-quality-attribute-scenarios#1. 목록\|QA-04]] | 단위 | `packages/core/src/format/svg-file.test.ts` |
| 서로 다른 한글 음절 300자가 든 블록 100개를 저장하면 300 KB 이하다 | [[03-quality-attribute-scenarios#1. 목록\|QA-09]] | 통합 | `packages/core/node/golden.test.ts` |
| 새 문서에는 빈 블록 하나가 선택되어 있고, 바뀐 것이 없는 상태다 | [[01-requirements#^r-all\|R-ALL-03]] | 통합 | `packages/editor/src/create-editor.test.ts` |
| 호출 블록을 넣을 때 화면 상태로 묻고, 답하면 넣는다 | [[01-requirements#^r-blk\|R-BLK-07]] | 통합 | `packages/editor/src/create-editor.test.ts` |
| 그림의 두 배 크기로 PNG를 내보낸다 | [[01-requirements#^r-exp\|R-EXP-01]] | E2E | `apps/web/e2e/files.spec.ts` |
| 저장한 SVG의 크기를 읽는다 | [[01-requirements#^r-exp\|R-EXP-01]] | 단위 | `apps/web/src/files/export-png.test.ts` |
| 기본으로 두 배 크기, 정수 픽셀로 그린다 | [[01-requirements#^r-exp\|R-EXP-01]] | 단위 | `apps/web/src/files/export-png.test.ts` |
| PNG의 이름을 문서 이름으로 짓는다 | [[01-requirements#^r-exp\|R-EXP-01]] | 단위 | `apps/web/src/files/file-name.test.ts` |
| 마지막으로 바꾸고 2초 뒤에 저장한다 | [[01-requirements#^r-exp\|R-EXP-04]] | 단위 | `apps/web/src/shell/timers.test.ts` |
| 저장하는 동안 바뀐 것은 저장이 끝난 뒤 다시 2초를 기다린다 | [[01-requirements#^r-exp\|R-EXP-04]] | 단위 | `apps/web/src/shell/timers.test.ts` |
| 마지막에 연 파일을 맨 앞에 둔다 | [[01-requirements#^r-exp\|R-EXP-04]] | 단위 | `apps/web/src/storage/recent-files.test.ts` |
| 파일마다 한 항목을 두고 그것을 맨 위로 올린다 | [[01-requirements#^r-exp\|R-EXP-04]] | 단위 | `apps/web/src/storage/recent-files.test.ts` |
| 파일 열 개를 기억하고, 밀려난 것을 알린다 | [[01-requirements#^r-exp\|R-EXP-04]] | 단위 | `apps/web/src/storage/recent-files.test.ts` |
| 저장하면 모델이 든 파일을 쓰고, 다시 열면 같은 내용이다 | [[01-requirements#^r-fmt\|R-FMT-01]] | 통합 | `packages/editor/src/create-editor.test.ts` |
| 모든 노드 종류를 다시 읽으면 같은 문서다 | [[01-requirements#^r-fmt\|R-FMT-02]] | 단위 | `packages/core/src/format/parse-model.test.ts` |
| 모델 JSON을 다시 읽으면 같은 내용이고, 다시 쓰면 같은 글이다 | [[01-requirements#^r-fmt\|R-FMT-02]] | 단위 | `packages/core/src/format/round-trip.test.ts` |
| ${name}을 골든 파일로 저장한다 | [[01-requirements#^r-fmt\|R-FMT-03]] | 통합 | `packages/core/node/golden.test.ts` |
| 같은 문서는 객체를 만든 순서와 상관없이 같은 글을 준다 | [[01-requirements#^r-fmt\|R-FMT-03]] | 단위 | `packages/core/src/format/model-json.test.ts` |
| 같은 부분은 같은 바이트를 준다 | [[01-requirements#^r-fmt\|R-FMT-03]] | 단위 | `packages/core/src/format/svg-file.test.ts` |
| CDATA를 `]]>` 둘레에서 나누고, 다시 읽으면 글자가 온전하다 | [[01-requirements#^r-fmt\|R-FMT-04]] | 단위 | `packages/core/src/format/svg-file.test.ts` |
| 모델 요소가 없는 보통 SVG는 편집할 수 없다 | [[01-requirements#^r-fmt\|R-FMT-06]] | 단위 | `packages/core/src/format/svg-file.test.ts` |
| 모델이 없는 SVG는 열지 않고, 까닭을 보인다 | [[01-requirements#^r-web\|R-WEB-02]] | E2E | `apps/web/e2e/files.spec.ts` |
| 원래 파일에 쓰고, 저장할 때 권한을 묻는다 | [[01-requirements#^r-web\|R-WEB-02]] | 통합 | `apps/web/src/files/web-document-store.test.ts` |
| 모델이 없는 SVG는 문서를 바꾸지 않고, 까닭을 알린다 | [[01-requirements#^r-web\|R-WEB-02]] | 통합 | `apps/web/src/shell/web-shell.test.ts` |
| .ns.svg와 .ns 파일을 대소문자와 상관없이 연다 | [[01-requirements#^r-web\|R-WEB-02]] | 단위 | `apps/web/src/files/file-name.test.ts` |
| .ns.svg와 .ns는 그대로 두고, 다른 이름에는 .ns.svg를 붙인다 | [[01-requirements#^r-web\|R-WEB-02]] | 단위 | `apps/web/src/files/file-name.test.ts` |
| 새로 고친 뒤 저장하지 않은 내용을 복원할 수 있다 | [[01-requirements#^r-web\|R-WEB-03]] | E2E | `apps/web/e2e/files.spec.ts` |
| 편집하고 0.5초 뒤에 임시 보관을 쓰고, 저장하면 지운다 | [[01-requirements#^r-web\|R-WEB-03]] | 통합 | `apps/web/src/shell/web-shell.test.ts` |
| 시작할 때 가장 새 임시 보관의 복원을 묻고, 저장하지 않은 문서로 연다 | [[01-requirements#^r-web\|R-WEB-03]] | 통합 | `apps/web/src/shell/web-shell.test.ts` |
| 복원을 거절하면 그 임시 보관을 지운다 | [[01-requirements#^r-web\|R-WEB-03]] | 통합 | `apps/web/src/shell/web-shell.test.ts` |
| 0.5초 안의 편집은 한 번에 쓴다 | [[01-requirements#^r-web\|R-WEB-03]] | 단위 | `apps/web/src/shell/timers.test.ts` |
| 기다리던 쓰기를 바로 하고, 기다리는 것이 없으면 아무것도 하지 않는다 | [[01-requirements#^r-web\|R-WEB-03]] | 단위 | `apps/web/src/shell/timers.test.ts` |
| 마지막에 고른 모양을 기억하고 새 문서가 그 모양으로 시작한다 | [[ux-decisions\|UX HS1]] | 통합 | `packages/editor/src/create-editor.test.ts` |
| 파일을 열면 그 파일의 모양을 지키고, 기억해 둔 모양은 바꾸지 않는다 | [[ux-decisions\|UX HS1]] | 통합 | `packages/editor/src/create-editor.test.ts` |
| 탭 제목에 이름과 ●를 보인다 | [[ux-decisions\|UX W3]] | 통합 | `apps/web/src/shell/web-shell.test.ts` |
| 저장하지 않은 동안 탭 제목의 이름 앞에 ●를 붙인다 | [[ux-decisions\|UX W3]] | 단위 | `apps/web/src/files/file-name.test.ts` |

### 2.6 레이아웃 · 그리기 · 글자

블록의 크기와 자리, SVG로 그리기, 글자 폭 재기, 번들 글꼴과 그 서브셋 → [[02-layout]]

파일 6개, 테스트 78개:

| 자리 | 무엇을 확인하나 | 확인하는 것 | 방법 | 유형 | 테스트 수 |
| --- | --- | --- | --- | --- | --- |
| `packages/core/src/layout/layout.test.ts` | 레이아웃: 블록 · 짧은 분기(UX SB1) · 클릭 영역 · 헤더(02-layout 1.5) · 여러 다이어그램(02-layout 1.7) · 속성 · 크기 | [[ux-decisions\|UX SB1]] | 속성 기반 (fast-check) | 단위 | 37 |
| `packages/core/src/render/render-doc.test.ts` | 렌더링 · 렌더링: 헤더(시각 디자인 원칙 2) · 렌더링: 골든 파일(07-testing 3) | — | Vitest | 단위 | 16 |
| `packages/core/src/text/measure-text.test.ts` | 글자 폭 | — | Vitest | 단위 | 8 |
| `packages/fonts/node/index.test.ts` | 글꼴 파일 읽기(readFontFile) | — | Vitest | 단위 | 2 |
| `packages/fonts/node/subset.test.ts` | 글꼴 서브셋(subsetToWoff) · 고정한 출력 | — | Vitest | 단위 | 10 |
| `packages/fonts/src/advance-table.test.ts` | 블록 글꼴의 글자 폭 표 | — | Vitest | 단위 | 5 |

확인하는 것(ID)을 이름에 적은 테스트 24개:

| 테스트 | 확인하는 것 | 유형 | 자리 |
| --- | --- | --- | --- |
| 블록 500개의 레이아웃과 렌더링이 예산 100ms에 넉넉히 든다 | [[03-quality-attribute-scenarios#1. 목록\|QA-07]] | 단위 | `packages/core/src/render/render-doc.test.ts` |
| 같은 문서는 같은 레이아웃을 준다 | [[01-requirements#^r-fmt\|R-FMT-03]] | 단위 | `packages/core/src/layout/layout.test.ts` |
| 같은 모델은 같은 SVG 글을 준다 | [[01-requirements#^r-fmt\|R-FMT-03]] | 단위 | `packages/core/src/render/render-doc.test.ts` |
| ${name}이 골든 SVG와 같다 | [[01-requirements#^r-fmt\|R-FMT-03]] | 단위 | `packages/core/src/render/render-doc.test.ts` |
| 같은 코드 포인트는 순서와 중복에 상관없이 같은 바이트를 준다 | [[01-requirements#^r-fmt\|R-FMT-03]] | 단위 | `packages/fonts/node/subset.test.ts` |
| 쓰인 코드 포인트를 고정 문구까지 넣어 보인다 | [[01-requirements#^r-fmt\|R-FMT-07]] | 단위 | `packages/core/src/render/render-doc.test.ts` |
| 여러 줄 블록은 한 줄에 18px씩 커진다 | [[01-requirements#^r-lay\|R-LAY-01]] | 단위 | `packages/core/src/layout/layout.test.ts` |
| 여러 줄을 잰다: 가장 긴 폭, 줄 수 × 18px | [[01-requirements#^r-lay\|R-LAY-01]] | 단위 | `packages/core/src/text/measure-text.test.ts` |
| If의 폭은 두 분기를 나란히 놓은 폭이다 | [[01-requirements#^r-lay\|R-LAY-02]] | 단위 | `packages/core/src/layout/layout.test.ts` |
| 다이어그램 본문의 블록이 본문을 꼭 채운다(직사각형을 지킨다) | [[01-requirements#^r-lay\|R-LAY-02]] | 단위 | `packages/core/src/layout/layout.test.ts` |
| 02-layout 2.1의 13px 예와 맞는다 | [[01-requirements#^r-lay\|R-LAY-04]] | 단위 | `packages/core/src/text/measure-text.test.ts` |
| 한글은 전각, 라틴 문자는 반각으로 센다 | [[01-requirements#^r-lay\|R-LAY-04]] | 단위 | `packages/core/src/text/measure-text.test.ts` |
| 빈 분기의 ∅를 글자가 아니라 도형으로 그린다 | [[01-requirements#^r-lay\|R-LAY-09]] | 단위 | `packages/core/src/render/render-doc.test.ts` |
| 고정 문구를 주어진 언어로 쓴다 | [[01-requirements#^r-nfr\|R-NFR-04]] | 단위 | `packages/core/src/render/render-doc.test.ts` |
| 조건 뒤에 헤더 색의 테두리 빛을 둔다 | [[ux-decisions\|UX BH1]] | 단위 | `packages/core/src/render/render-doc.test.ts` |
| default가 없는 Case는 빈 default 칸을 그린다 | [[ux-decisions\|UX CD1]] | 단위 | `packages/core/src/layout/layout.test.ts` |
| default가 없는 Case의 빈 default 칸을 그린다 | [[ux-decisions\|UX CD1]] | 단위 | `packages/core/src/render/render-doc.test.ts` |
| default만 있는 Case는 열이 하나다 | [[ux-decisions\|UX CD2]] | 단위 | `packages/core/src/layout/layout.test.ts` |
| 분기의 하나뿐인 빈 블록을 표시한다 | [[ux-decisions\|UX E1]] | 단위 | `packages/core/src/layout/layout.test.ts` |
| For는 While처럼 잰다 | [[ux-decisions\|UX FB1]] | 단위 | `packages/core/src/layout/layout.test.ts` |
| 긴 줄을 줄바꿈하지 않는다 | [[ux-decisions\|UX LT1]] | 단위 | `packages/core/src/text/measure-text.test.ts` |
| 공백을 적힌 그대로 지킨다 | [[ux-decisions\|UX LT1]] | 단위 | `packages/core/src/text/measure-text.test.ts` |
| If의 분기 라벨은 사용자가 적지 않았으면 화면 언어를 따른다 | [[ux-decisions\|UX Q24]] | 단위 | `packages/core/src/layout/layout.test.ts` |
| 남는 높이를 고르게 나누고, 마지막 블록이 나머지를 받는다 | [[ux-decisions\|UX SB1]] | 단위 | `packages/core/src/layout/layout.test.ts` |

### 2.7 성능

그리기의 시간 예산(벤치마크) → [[03-quality-attribute-scenarios]]

파일 1개, 테스트 3개:

| 자리 | 무엇을 확인하나 | 확인하는 것 | 방법 | 유형 | 테스트 수 |
| --- | --- | --- | --- | --- | --- |
| `packages/core/src/render/render.bench.ts` | 02-layout 4의 성능 예산 | — | Vitest bench | 성능 | 3 |

확인하는 것(ID)을 이름에 적은 테스트 1개:

| 테스트 | 확인하는 것 | 유형 | 자리 |
| --- | --- | --- | --- |
| 레이아웃과 장면 + SVG 글자가 편집 예산 100ms에 넉넉히 든다 | [[03-quality-attribute-scenarios#1. 목록\|QA-07]] | 성능 | `packages/core/src/render/render.bench.ts` |

## 3. 테스트가 없는 ID

문서에 정의된 시나리오(`QA-`) · 인수 테스트(`AT-`) · 결함(`BUG-`) 가운데, 이름에 그 ID를 단 테스트가 없는 것입니다. 테스트 파일이 통째로 맡거나(2장 파일 표의 "확인하는 것" 칸), 인수 테스트가 맡거나([[07-testing#4. MVP의 인수 테스트]]의 표), 테스트가 아닌 검사가 맡은 것은 그 길을 적습니다. “없음”은 사람이 점검표로 보거나 아직 테스트가 없는 빈 곳입니다.

| ID | 다른 길로 맡은 것 |
| --- | --- |
| [[03-quality-attribute-scenarios#1. 목록\|QA-03]] | 인수 테스트: [[07-testing#4. MVP의 인수 테스트\|AT-10]] |
| [[03-quality-attribute-scenarios#1. 목록\|QA-05]] | 없음 |
| [[03-quality-attribute-scenarios#1. 목록\|QA-06]] | 인수 테스트: [[07-testing#4. MVP의 인수 테스트\|AT-08]] |
| [[03-quality-attribute-scenarios#1. 목록\|QA-08]] | 없음 |
| [[03-quality-attribute-scenarios#1. 목록\|QA-10]] | 파일: `packages/editor/src/create-editor.test.ts`<br>검사: 의존 방향 검사 dependency-cruiser (`pnpm deps`) |
| [[03-quality-attribute-scenarios#1. 목록\|QA-11]] | 없음 |
| [[03-quality-attribute-scenarios#1. 목록\|QA-12]] | 검사: TypeScript의 완전성 검사 (`pnpm typecheck`) |
| [[03-quality-attribute-scenarios#1. 목록\|QA-13]] | 없음 |
| [[03-quality-attribute-scenarios#1. 목록\|QA-14]] | 검사: `core` · `fonts`의 `tsconfig`에 `dom`이 없음 (`pnpm typecheck`) |
| [[03-quality-attribute-scenarios#1. 목록\|QA-15]] | 인수 테스트: [[07-testing#4. MVP의 인수 테스트\|AT-04]] |
| [[03-quality-attribute-scenarios#1. 목록\|QA-16]] | 없음 |
| [[03-quality-attribute-scenarios#1. 목록\|QA-17]] | 인수 테스트: [[07-testing#4. MVP의 인수 테스트\|AT-07]] |
| [[defects\|BUG-06]] | 없음 |
