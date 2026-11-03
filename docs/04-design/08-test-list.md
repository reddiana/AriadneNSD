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

영역마다 유형별 테스트 수입니다.

| 영역 | E2E | 통합 | 단위 | 성능 | 합계 |
| --- | :---: | :---: | :---: | :---: | :---: |
| [[#1. 인수 테스트\|인수 테스트]] | 26 | - | - | - | 26 |
| [[#2. 편집 명령과 모델\|편집 명령과 모델]] | - | 27 | 149 | - | 176 |
| [[#3. 키 · 마우스 · 선택\|키 · 마우스 · 선택]] | 4 | 22 | 49 | - | 75 |
| [[#4. 메뉴 · 화면 · 시작\|메뉴 · 화면 · 시작]] | 15 | 25 | 15 | - | 55 |
| [[#5. 파일\|파일]] | 6 | 40 | 60 | - | 106 |
| [[#6. 레이아웃 · 그리기 · 글자\|레이아웃 · 그리기 · 글자]] | - | - | 78 | - | 78 |
| [[#7. 성능\|성능]] | - | - | - | 3 | 3 |
| 합계 | 51 | 114 | 351 | 3 | 519 |

## 읽는 법

- **ID:** 테스트마다 `T-`와 네 자리 번호의 ID가 있습니다(테스트 코드의 이름 맨 앞). 번호는 바뀌지 않고, 지운 테스트의 번호는 다시 쓰지 않습니다.
- **영역:** 테스트를 그것이 확인하는 기능으로 묶었습니다(영역마다 한 절). 영역 안에서는 테스트 파일마다 제목 하나와 표 하나입니다. 제목 앞에는 유형을 말머리로 붙이고(`[E2E]`), 제목 아래 한 줄에 파일이 무엇을 확인하는지, 방법, 파일 전체가 확인하는 것을 적고, 표에는 그 파일의 테스트를 한 줄씩 적습니다. 어느 파일이 어느 영역인지는 스크립트의 표(`areas`)가 정합니다.
- **유형:** **단위**는 모듈 하나(가짜 없이 함수와 그 결과), **통합**은 모듈 여럿을 함께(`editor`와 `core`를 가짜 셸이나 가짜 DOM 위에서, 골든 파일의 열기 → 저장), **E2E**는 사용자 관점(빌드한 웹 앱을 브라우저에서 열고 클릭 · 키 · 탭으로), **성능**은 벤치마크입니다. 사람이 하는 **수동** 점검은 [[07-testing#5. 도구와 CI]]의 출시 전 점검표에 있습니다.
- **방법:** 테스트 도구와 기법(Vitest, 속성 기반, 골든 파일, Playwright)
- **확인하는 것:** 그 테스트가 확인하는 요구사항(`R-`), 품질 속성 시나리오(`QA-`), 인수 테스트(`AT-`), 결함(`BUG-`), UX 결정(`UX`)의 ID입니다. 테스트 여럿이 같은 것을 확인하면 같은 ID가 여러 줄에 나옵니다(예: 결함 하나를 테스트 둘이 확인).
- **이름 규칙:** 테스트 코드의 이름은 `T-0412: …`, 확인하는 것이 있으면 `T-0412 · BUG-03 · QA-19: …`입니다. 이 문서는 확인하는 것의 ID를 "확인하는 것" 칸에 옮기고, 나머지를 "테스트" 칸에 한국어로 적습니다.

## 1. 인수 테스트

MVP를 받아들이는 기준(AT-01 ~ AT-17)을, 빌드한 웹 앱을 브라우저에서 열고 사용자처럼 조작해 확인합니다 → [[01-requirements#5.2 MVP의 인수 기준]]. 파일 1개, 테스트 26개.

### [E2E] `apps/web/e2e/acceptance.spec.ts`

MVP의 인수 테스트 AT-01 ~ AT-17(01-requirements 5.2)을 브라우저에서, 배포용 빌드로. Playwright · 테스트 26개. 파일 전체가 확인하는 것: [[01-requirements#^at|AT-01]], [[01-requirements#^at|AT-17]].

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0001 | 새 다이어그램을 만들고, 블록을 넣고, 저장한다 | [[01-requirements#^at\|AT-01]] |
| T-0002 | 저장한 파일을 다시 열면 같은 그림이고, 다시 저장하면 같은 바이트다 | [[01-requirements#^at\|AT-02]] |
| T-0003 | 블록 종류 여섯, 감싸기와 풀기, 복사와 붙여넣기, 분기 넣기와 지우기, If 라벨 편집 | [[01-requirements#^at\|AT-03]] |
| T-0004 | 키보드만으로 AT-01 | [[01-requirements#^at\|AT-04]], [[01-requirements#^r-nfr\|R-NFR-05]] |
| T-0005 | `a`+`i` 바로 뒤에 친 글자는 쉬지 않고 쳐도 새 블록에 들어간다 | [[01-requirements#^at\|AT-04]] |
| T-0006 | 글자를 치는 중의 `Ctrl`+`S`는 글자를 받아들이고 저장한다 | [[01-requirements#^at\|AT-04]] |
| T-0007 | 블록 500개 문서의 편집이 100ms 안에 그려진다 | [[01-requirements#^at\|AT-05]] |
| T-0008 | 손상된 파일은 열지 않고, 원래 문서는 그대로 남으며 편집기도 계속 동작한다 | [[01-requirements#^at\|AT-06]] |
| T-0009 | 저장에 실패해도 잃는 것이 없고, 다음 저장이 그것을 쓴다 | [[01-requirements#^at\|AT-07]] |
| T-0010 | 저장한 파일은 화면과 같은 그림을 그리고, 그 안에 글꼴이 들어 있다 | [[01-requirements#^at\|AT-08]] |
| T-0011 | 그림의 두 배 크기로 PNG를 내보낸다 | [[01-requirements#^at\|AT-09]] |
| T-0012 | 같은 문서는 다른 탭에서도 같은 바이트로 저장된다(Chromium 쪽) | [[01-requirements#^at\|AT-10]] |
| T-0013 | 블록을 끌어 옮기고, 블록 아이콘을 끌어 넣고 감싼다 | [[01-requirements#^at\|AT-11]] |
| T-0014 | 복사한 블록은 블록으로, 보통 글은 한 줄에 처리 블록 하나로 붙여 넣는다 | [[01-requirements#^at\|AT-12]] |
| T-0015 | 자동 저장은 편집하고 2초 뒤에 원래 파일에 쓴다(Chromium 쪽) | [[01-requirements#^at\|AT-14]] |
| T-0016 | 최근 파일에서 파일을 다시 연다 | [[01-requirements#^at\|AT-15]] |
| T-0017 | 명령 팔레트에서 명령을 찾아 실행한다 | [[01-requirements#^at\|AT-16]] |
| T-0018 | `?`는 단축키 목록을, 도움말은 사용법을 연다 | [[01-requirements#^at\|AT-17]] |
| T-0019 | 키와 툴바로 실행 취소 · 다시 실행 | - |
| T-0020 | 키 · `Ctrl`+휠 · 줌 메뉴로 줌 | - |
| T-0021 | 컨텍스트 메뉴가 선택에 맞는 명령을 보인다 | - |
| T-0022 | 내려받은 파일을 다시 열면 같은 바이트로 내려받는다 | [[01-requirements#^at\|AT-02]] |
| T-0023 | 다른 이름으로 저장은 편집기 안에서 이름을 묻고, 취소하면 편집한 것을 지킨다 | [[01-requirements#^at\|AT-07]] |
| T-0024 | 새로 고친 뒤 브라우저의 임시 보관이 복원된다 | [[01-requirements#^at\|AT-13]] |
| T-0025 | File System Access가 없으면 저장은 내려받기가 되고, 그 사실을 한 번 알린다(Chromium 쪽) | [[01-requirements#^at\|AT-14]] |
| T-0026 | 메뉴, 상태 표시줄, 그림의 고정 문구가 한국어다 | [[01-requirements#^r-nfr\|R-NFR-04]] |

^t-apps-web-e2e-acceptance-spec-ts

## 2. 편집 명령과 모델

블록 넣기 · 지우기 · 옮기기 · 감싸기, 분기, 호출, 다이어그램과 헤더, 복사 · 붙여넣기가 문서를 바르게 바꾸는지, 어떤 명령을 이어도 모델의 불변식이 지켜지는지 → [[01-model]]. 파일 16개, 테스트 176개.

### [통합] `packages/editor/src/session/engine.test.ts`

글자 넣기와 편집 · 명령 뒤의 선택(03-editor 2.3) · 클립보드 · 분기 · 키와 모드(03-keymap) · 보기 전용(03-editor 6.4). Vitest · 테스트 27개. 파일 전체가 확인하는 것: [[01-requirements#^at|AT-03]], [[01-requirements#^at|AT-12]], [[01-requirements#^r-edit|R-EDIT-11]], [[ux-decisions|UX MD3]].

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0027 | `a` + 종류 글자는 선택 뒤에 블록을 넣고 글자 편집을 연다 | [[01-requirements#^r-edit\|R-EDIT-01]] |
| T-0028 | 같은 글자로 입력란을 닫으면 실행 취소 단계가 남지 않는다 | [[ux-decisions\|UX MD2]] |
| T-0029 | 처리 블록(`%j`)은 빈 블록 옆에도 간다 | [[ux-decisions\|UX KP2]] |
| T-0030 | 조작 규칙 2: 빈 블록 위의 제어 블록은 그 자리를 차지한다 | - |
| T-0031 | 조작 규칙 "블록 아이콘": 선택한 것이 없으면 블록이 다이어그램 끝에 간다 | - |
| T-0032 | 지운 뒤에는 다음 블록, 없으면 앞 블록, 없으면 담은 블록이 선택된다 | [[ux-decisions\|UX Q19]] |
| T-0033 | 실행 취소는 선택한 것이 아직 있으면 선택을 지킨다 | [[ux-decisions\|UX Q19]] |
| T-0034 | 감싸면 새 블록이 선택되고 그 조건이 열린다 | [[01-requirements#^r-edit\|R-EDIT-06]] |
| T-0035 | 안에서 풀면 선택을 지키고, 무엇을 없앴는지 알린다 | [[01-requirements#^r-edit\|R-EDIT-07]] |
| T-0036 | 옮긴 블록은 선택된 채로 남는다 | [[01-requirements#^r-edit\|R-EDIT-11]] |
| T-0037 | `dd`는 잘라내고, `p`는 새 id로 선택 뒤에 붙여 넣는다 | [[01-requirements#^r-edit\|R-EDIT-10]] |
| T-0038 | 다른 프로그램의 글은 한 줄에 처리 블록 하나가 된다 | [[01-requirements#^at\|AT-12]] |
| T-0039 | 사용자 정의 형식이 글보다 먼저다 | [[01-requirements#^at\|AT-12]] |
| T-0040 | 조작 규칙 "붙여넣기": 선택한 것이 없으면 아무것도 붙여 넣지 않는다 | - |
| T-0041 | 03-keymap: `v` 다음 `j` `j`와 `y`는 범위를 복사한다 | - |
| T-0042 | 분기 라벨에서 `o`는 분기를 넣고 그 라벨을 연다 | [[01-requirements#^r-edit\|R-EDIT-11]] |
| T-0043 | 분기가 하나 남게 지우면 If로 바꿀지 묻고, `Esc`는 Case를 지킨다 | [[ux-decisions\|UX MD3]] |
| T-0044 | If에 분기를 넣으면 Case로 바꿀지 묻고, `Enter`가 바꾼다 | [[ux-decisions\|UX MD3]] |
| T-0045 | If의 분기 라벨은 그려진 낱말을 담고 열린다 | [[01-requirements#^r-edit\|R-EDIT-12]] |
| T-0046 | 빈 default 칸에 글자를 치면 default 분기가 생기고, 실행 취소 한 단계다 | [[ux-decisions\|UX CD1]] |
| T-0047 | 빈 default 칸에서 넣으면 분기가 생기고, 지우기는 아무것도 하지 않는다 | [[ux-decisions\|UX CD1]] |
| T-0048 | 조작 규칙 2: `Esc`를 두 번 누르면 선택이 지워지고, 이동 키가 그 자리로 돌아온다 | - |
| T-0049 | 키 힌트는 첫 키 뒤 0.4초에 보이고, `Esc`가 취소한다 | [[ux-decisions\|UX K1]] |
| T-0050 | 03-keymap: 표에 없는 Vim 키는 알리고, 다른 키는 브라우저로 간다 | - |
| T-0051 | 03-editor 1.1: 줌은 40%에서 300% 사이를 10%씩 움직인다 | - |
| T-0052 | 03-editor 6.4: 편집 명령은 거절하고, 이동과 복사는 그대로 된다 | - |
| T-0053 | 03-editor 5: 등록부는 명령마다 키와 제목을 준다 | - |

^t-packages-editor-src-session-engine-test-ts

### [단위] `packages/core/src/commands/branch.test.ts`

Case의 분기 · If와 Case의 변환 · 빠진 default 분기. Vitest · 테스트 11개. 파일 전체가 확인하는 것: [[ux-decisions|UX MD3]], [[ux-decisions|UX CD1]].

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0054 | 선택한 분기의 뒤나 앞에 쓰이지 않은 번호 라벨로 분기를 넣는다 | [[01-requirements#^r-edit\|R-EDIT-11]] |
| T-0055 | default 뒤에 넣은 분기는 default 바로 앞에 간다 | [[01-requirements#^r-edit\|R-EDIT-11]] |
| T-0056 | If에 분기를 넣으면 Case로 바꿀지 묻는다(UX MD3) | [[01-requirements#^r-edit\|R-EDIT-11]] |
| T-0057 | 분기를 블록째 지우고, 분기가 하나 남으면 If로 바꾸기를 묻는다(UX MD3) | [[01-requirements#^r-edit\|R-EDIT-11]] |
| T-0058 | default와 마지막 분기, 그리고 If의 분기는 지울 수 없다(UX MD3) | [[01-requirements#^r-edit\|R-EDIT-11]] |
| T-0059 | default가 없는 Case에서 지울 때는 묻지 않는다 | [[01-requirements#^r-edit\|R-EDIT-11]] |
| T-0060 | 분기 하나와 default만 있는 Case는 id를 지킨 채 If가 된다 | [[01-requirements#^r-edit\|R-EDIT-11]] |
| T-0061 | 분기가 꼭 하나이고 default가 있는 Case만 바뀐다 | [[01-requirements#^r-edit\|R-EDIT-11]] |
| T-0062 | If는 참과 default 사이에 새 분기가 든 Case가 된다 | [[01-requirements#^r-edit\|R-EDIT-11]] |
| T-0063 | default가 없는 Case에 빈 default 분기를 준다 | [[ux-decisions\|UX CD1]] |
| T-0064 | default가 있는 Case, 다른 블록, 모르는 id는 거절한다 | [[ux-decisions\|UX CD1]] |

^t-packages-core-src-commands-branch-test-ts

### [단위] `packages/core/src/commands/call.test.ts`

호출 블록의 명령(editCall · setCallTarget · insertCall · newMethodAndCall). Vitest · 테스트 24개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0065 | 인자와 결과를 정하고, 각각 한 줄이다 | [[01-requirements#^r-blk\|R-BLK-07]] |
| T-0066 | 빠진 필드는 그대로 둔다 | [[01-requirements#^r-blk\|R-BLK-07]] |
| T-0067 | 무언가를 받는 Method의 비운 인자는 다시 채워진다 | [[01-requirements#^r-blk\|R-BLK-07]] |
| T-0068 | 아무것도 받지 않는 Method는 빈 인자로 호출할 수 있다 | [[01-requirements#^r-blk\|R-BLK-07]] |
| T-0069 | 이름을 적어 호출한 블록은 적힌 그대로 편집한다 | [[01-requirements#^r-blk\|R-BLK-08]] |
| T-0070 | 01-model 4: 같은 글자면 내용은 그대로다 | - |
| T-0071 | 대상을 잃은 호출 블록은 편집할 수 없다 | [[01-requirements#^r-blk\|R-BLK-07]] |
| T-0072 | 호출 블록이 아닌 블록과 모르는 블록은 거절한다 | - |
| T-0073 | 01-model 1.5: 대상을 잃은 호출 블록이 다시 Method를 호출하며 적은 것을 지킨다 | - |
| T-0074 | 01-model 1.5: Method를 바꾸며 인자와 결과를 지킨다 | - |
| T-0075 | 빈 인자는 새 Method의 매개변수를 받는다 | [[01-requirements#^r-blk\|R-BLK-07]] |
| T-0076 | 01-model 1.6: 옛 호출 자리의 접기 영역은 없어진다 | - |
| T-0077 | 01-model 4: 같은 Method를 다시 호출하면 내용은 그대로다 | - |
| T-0078 | Event와 헤더 없는 다이어그램은 호출할 수 없다 | [[01-requirements#^r-blk\|R-BLK-07]] |
| T-0079 | 매개변수를 인자로 담은 호출 블록을 넣는다 | [[01-requirements#^r-blk\|R-BLK-07]] |
| T-0080 | 아무것도 받지 않는 Method는 빈 인자를 받는다 | [[01-requirements#^r-blk\|R-BLK-07]] |
| T-0081 | 조작 규칙 2: 빈 블록의 자리를 차지한다 | - |
| T-0082 | 접기 영역에는 그 끝에서 이어 붙고, 선택이 없으면 다이어그램의 끝으로 간다 | [[ux-decisions\|UX MD1]] |
| T-0083 | Method는 자기 자신을 호출할 수 있다 | [[01-requirements#^r-blk\|R-BLK-07]] |
| T-0084 | Method만 호출할 수 있다 | [[01-requirements#^r-blk\|R-BLK-07]] |
| T-0085 | 선택한 것에서 새 Method를 만들고 호출하기를 한 번에 | [[01-requirements#^r-blk\|R-BLK-07]] |
| T-0086 | 적은 이름이 헤더가 되고, 그 매개변수가 인자가 된다 | [[01-requirements#^r-blk\|R-BLK-07]] |
| T-0087 | 불변식 7: 새 문서에서 호출은 빈 다이어그램을 채우고, 그 다이어그램은 남는다 | - |
| T-0088 | 비거나 겹치는 이름과 모르는 대상은 거절한다 | [[01-requirements#^r-blk\|R-BLK-11]] |

^t-packages-core-src-commands-call-test-ts

### [단위] `packages/core/src/commands/clipboard.test.ts`

복사, 잘라내기, 붙여넣기. Vitest · 테스트 7개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0089 | 복사는 하위 트리 전체와 범위 안의 접기 영역을 가져간다 | [[01-requirements#^r-edit\|R-EDIT-10]] |
| T-0090 | 붙여넣기는 새 id의 사본을 선택한 블록 뒤에 둔다 | [[01-requirements#^r-edit\|R-EDIT-10]] |
| T-0091 | 01-model 1.7: 붙여 넣은 접기 영역은 새 id로 옮겨진다 | - |
| T-0092 | 빈 블록에 붙여 넣으면 그 자리를 차지한다 | [[01-requirements#^r-edit\|R-EDIT-10]] |
| T-0093 | 01-model 3.6: 이 문서에 없는 Method를 부르는 붙여 넣은 호출은 대상을 잃는다 | - |
| T-0094 | 붙여넣기는 빈 클립과 없는 대상을 거절한다 | [[01-requirements#^r-edit\|R-EDIT-10]] |
| T-0095 | 잘라내기는 클립을 주고 블록을 지운다 | [[01-requirements#^r-edit\|R-EDIT-10]] |

^t-packages-core-src-commands-clipboard-test-ts

### [단위] `packages/core/src/commands/delete.test.ts`

블록 지우기(deleteBlocks). Vitest · 테스트 6개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0096 | 선택한 범위를 그 안의 것과 함께 지운다 | [[01-requirements#^r-edit\|R-EDIT-01]] |
| T-0097 | 01-model 4.1: 블록이 하나도 남지 않은 줄에는 빈 블록 하나가 들어간다 | - |
| T-0098 | 01-model 4.3: 접기 영역은 남은 블록으로 줄고, 남은 것이 없으면 없어진다 | - |
| T-0099 | 접기 영역 전체를 지우면 그 블록들이 지워진다 | [[01-requirements#^r-edit\|R-EDIT-01]] |
| T-0100 | 하나뿐인 빈 블록과 없는 대상은 지우기를 거절한다 | [[01-requirements#^r-edit\|R-EDIT-01]] |
| T-0101 | 다른 블록과 함께 있는 빈 블록은 지울 수 있다 | [[01-requirements#^r-edit\|R-EDIT-01]] |

^t-packages-core-src-commands-delete-test-ts

### [단위] `packages/core/src/commands/diagram.test.ts`

헤더와 다이어그램의 명령(editHead · setHead · newDiagram · deleteDiagram · moveDiagram · setSettings · defaultHeadName). Vitest · 테스트 31개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0102 | Event 헤더의 글자를 정한다 | [[01-requirements#^r-blk\|R-BLK-10]] |
| T-0103 | Method의 이름을 바꿔도 호출 블록은 id로 그것을 가리킨다 | [[01-requirements#^r-blk\|R-BLK-11]] |
| T-0104 | 01-model 4: 같은 글자면 내용은 그대로다 | - |
| T-0105 | 빈 이름은 Event에서도, 이름 없는 Method에서도 거절한다 | [[01-requirements#^r-blk\|R-BLK-11]] |
| T-0106 | 다른 헤더가 가진 이름은 Event와 Method를 가리지 않고 거절한다 | [[01-requirements#^r-blk\|R-BLK-11]] |
| T-0107 | 이름은 대소문자를 가리고, 헤더는 자기 이름을 그대로 둘 수 있다 | [[01-requirements#^r-blk\|R-BLK-11]] |
| T-0108 | 괄호를 지우면 호출 블록의 인자가 비워진다 | [[01-requirements#^r-blk\|R-BLK-07]] |
| T-0109 | 괄호를 더하면 빈 인자가 괄호 안의 글자로 채워진다 | [[01-requirements#^r-blk\|R-BLK-07]] |
| T-0110 | 매개변수가 바뀌어도 적은 인자는 남는다 | [[01-requirements#^r-blk\|R-BLK-07]] |
| T-0111 | 헤더 없는 다이어그램과 모르는 다이어그램은 거절한다 | - |
| T-0112 | 헤더 없는 다이어그램에 기본 이름의 Event 헤더를 단다 | [[01-requirements#^r-blk\|R-BLK-10]] |
| T-0113 | Method 헤더를 달고, 기본 이름은 쓰고 있는 이름을 건너뛴다 | [[01-requirements#^r-blk\|R-BLK-11]] |
| T-0114 | Event를 Method로, 다시 Event로 바꾸며 글자를 지킨다 | [[01-requirements#^r-blk\|R-BLK-11]] |
| T-0115 | 호출 블록이 부르는 Method는 Event가 될 수 없다 | [[01-requirements#^r-blk\|R-BLK-11]] |
| T-0116 | 종류를 바꿀 때 겹치거나 빈 이름으로 읽히는 글자는 거절한다 | [[01-requirements#^r-blk\|R-BLK-11]] |
| T-0117 | Method 헤더를 없애면 그 호출 블록은 대상을 잃는다 | [[01-requirements#^r-blk\|R-BLK-07]] |
| T-0118 | 불변식 7: 헤더도 내용도 없이 남은 다이어그램은 사라진다 | - |
| T-0119 | 불변식 7: 하나뿐인 다이어그램은 헤더도 내용도 없어도 남는다 | - |
| T-0120 | 01-model 4: 같은 종류로 바꾸면 내용은 그대로다 | - |
| T-0121 | 새 Method는 마지막 Method 뒤에 간다 | [[01-requirements#^r-edit\|R-EDIT-18]] |
| T-0122 | 새 Event는 마지막 Event나 헤더 없는 다이어그램 뒤에 간다 | [[01-requirements#^r-edit\|R-EDIT-18]] |
| T-0123 | 그 종류의 첫 것은 맨 앞(Event)이나 맨 뒤(Method)에 간다 | [[01-requirements#^r-edit\|R-EDIT-18]] |
| T-0124 | 불변식 7: 새 문서의 빈 다이어그램은 다른 다이어그램이 오면 없어진다 | - |
| T-0125 | 01-model 1.7: id를 주어진 생성기에서 받는다 | - |
| T-0126 | 다이어그램을 지우면 그것을 부르던 호출 블록은 대상을 잃는다 | [[01-requirements#^r-edit\|R-EDIT-18]] |
| T-0127 | 불변식 1: 하나뿐인 다이어그램은 지울 수 없다 | - |
| T-0128 | 같은 종류의 앞 다이어그램과 자리를 바꾸고, 다른 종류는 건너뛴다 | [[01-requirements#^r-edit\|R-EDIT-18]] |
| T-0129 | 같은 종류의 양 끝에서는 거절한다 | [[01-requirements#^r-edit\|R-EDIT-18]] |
| T-0130 | 헤더의 모양을 바꾼다 | [[01-requirements#^r-lay\|R-LAY-10]] |
| T-0131 | 01-model 4: 같은 설정이면 내용은 그대로다 | - |
| T-0132 | "Event n"이나 "Method n"이고, n은 쓰이지 않은 가장 작은 수다 | [[01-requirements#^r-blk\|R-BLK-10]] |

^t-packages-core-src-commands-diagram-test-ts

### [단위] `packages/core/src/commands/edit-text.test.ts`

글자 편집(editText). Vitest · 테스트 5개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0133 | 블록의 글자를 정하고 나머지는 지킨다 | [[01-requirements#^r-edit\|R-EDIT-01]] |
| T-0134 | 01-model 4.4: 같은 글자면 내용은 그대로다 | - |
| T-0135 | If의 분기 라벨을 정하고 지운다 | [[01-requirements#^r-edit\|R-EDIT-12]] |
| T-0136 | Case의 분기 라벨을 정하되, 빈 라벨과 default 라벨은 정하지 않는다 | [[01-requirements#^r-edit\|R-EDIT-11]] |
| T-0137 | 없는 노드, 다이어그램 헤더, 호출 블록(나중 기능)은 거절한다 | [[01-requirements#^r-edit\|R-EDIT-01]] |

^t-packages-core-src-commands-edit-text-test-ts

### [단위] `packages/core/src/commands/insert.test.ts`

블록 넣기(insertBlock). Vitest · 테스트 13개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0138 | 선택한 블록 뒤에 처리 블록을 넣는다 | [[01-requirements#^r-edit\|R-EDIT-01]] |
| T-0139 | 선택 앞에, 범위면 범위의 끝 뒤에 넣는다 | [[01-requirements#^r-edit\|R-EDIT-01]] |
| T-0140 | R-BLK-01..06: 새 제어 블록은 글자가 비어 있고 안의 블록도 비어 있다 | - |
| T-0141 | 빈 블록 위에 넣은 제어 블록은 그 자리를 차지한다 | [[01-requirements#^r-edit\|R-EDIT-01]] |
| T-0142 | 빈 블록 위의 처리 블록은 아무것도 바꾸지 않는다(편집기가 그 블록을 연다) | [[01-requirements#^r-edit\|R-EDIT-01]] |
| T-0143 | besideEmpty이면 처리 블록이 빈 블록 옆에 간다 | [[ux-decisions\|UX KP2]] |
| T-0144 | 분기의 블록을 선택했으면 그 분기 안에 넣는다 | [[01-requirements#^r-edit\|R-EDIT-01]] |
| T-0145 | 선택한 것이 없으면 다이어그램의 끝에 넣는다 | [[01-requirements#^r-edit\|R-EDIT-01]] |
| T-0146 | 01-model 4.3 (UX MD1): 안의 블록을 선택했을 때 접기의 끝에 넣은 블록은 접기에 든다 | - |
| T-0147 | 01-model 4.3 (UX MD1): 선택한 접기 전체의 옆에 넣은 블록은 밖에 남는다 | - |
| T-0148 | 01-model 4.3: 접기의 양 끝 사이에 넣은 블록은 그 안에 든다 | - |
| T-0149 | 01-model 1.7: 새 id는 주어진 생성기에서 온다 | - |
| T-0150 | 없거나 이어지지 않은 대상은 거절한다 | [[01-requirements#^r-edit\|R-EDIT-01]] |

^t-packages-core-src-commands-insert-test-ts

### [단위] `packages/core/src/commands/move-to.test.ts`

moveTo(끌어 놓기). Vitest · 테스트 5개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0151 | 블록을 옆 반복 안으로 옮기며 id를 지킨다 | [[01-requirements#^r-edit\|R-EDIT-09]] |
| T-0152 | 빈 블록 위에 떨어뜨린 블록은 그 자리를 차지한다 | [[01-requirements#^r-edit\|R-EDIT-09]] |
| T-0153 | 블록이 하나도 남지 않은 줄에는 빈 블록이 들어간다 | [[01-requirements#^r-edit\|R-EDIT-09]] |
| T-0154 | 제자리에 떨어뜨린 블록은 아무것도 바꾸지 않는다 | [[01-requirements#^r-edit\|R-EDIT-09]] |
| T-0155 | 블록을 자기 안에 떨어뜨리기는 거절한다 | [[01-requirements#^r-edit\|R-EDIT-09]] |

^t-packages-core-src-commands-move-to-test-ts

### [단위] `packages/core/src/commands/move.test.ts`

위아래로 옮기기 · 좌우로 옮기기(분기). Vitest · 테스트 12개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0156 | 블록이 아래나 위의 블록과 자리를 바꾼다 | [[01-requirements#^r-edit\|R-EDIT-11]] |
| T-0157 | 블록은 제어 블록을 건너뛰고 그 안으로 들어가지 않는다 | [[01-requirements#^r-edit\|R-EDIT-11]] |
| T-0158 | 줄의 끝에서는 블록이 그것을 담은 제어 블록 밖으로 나간다 | [[01-requirements#^r-edit\|R-EDIT-11]] |
| T-0159 | 다이어그램의 맨 위나 맨 아래에서는 옮기기를 거절한다 | [[01-requirements#^r-edit\|R-EDIT-11]] |
| T-0160 | 01-model 4.3: 접기 영역의 끝에 있는 블록은 먼저 그 밖으로 나간다 | - |
| T-0161 | 01-model 4.3: 블록은 옆의 접기 영역 전체를 건너뛴다 | - |
| T-0162 | 01-model 4.3: 접기 영역 전체는 이름째 옮겨지고, 그것을 둘러싼 영역은 양 끝을 지킨다 | - |
| T-0163 | 01-model 4.3: 제어 블록 밖으로 나가는 블록은 그 제어 블록을 담은 영역에 남는다 | - |
| T-0164 | Case의 분기가 라벨째 옆 분기와 자리를 바꾼다 | [[01-requirements#^r-edit\|R-EDIT-11]] |
| T-0165 | 블록을 옆으로 옮기면 그것을 담은 가장 가까운 분기가 옮겨진다 | [[01-requirements#^r-edit\|R-EDIT-11]] |
| T-0166 | default 분기는 늘 맨 끝이고, 양 끝을 넘는 것은 거절한다 | [[01-requirements#^r-edit\|R-EDIT-11]] |
| T-0167 | If의 분기를 맞바꾸면 블록이 바뀌고, 라벨은 제자리에 있으며, 조건에 그 사실을 적는다 | [[01-requirements#^r-edit\|R-EDIT-11]] |

^t-packages-core-src-commands-move-test-ts

### [단위] `packages/core/src/commands/new-document.test.ts`

새 문서. Vitest · 테스트 3개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0168 | 새 문서에는 빈 블록 하나를 담은 다이어그램 하나가 있다 | [[01-requirements#^r-all\|R-ALL-03]] |
| T-0169 | 헤더 모양의 기본은 "제목처럼"이고, 넘겨줄 수도 있다(UX HS1) | [[01-requirements#^r-lay\|R-LAY-10]] |
| T-0170 | 새 문서는 아무것도 접히지 않은 채, 결과 기호 ←로 시작한다 | [[01-requirements#^r-all\|R-ALL-03]] |

^t-packages-core-src-commands-new-document-test-ts

### [단위] `packages/core/src/commands/properties.test.ts`

속성 기반 테스트(07-testing 2). 속성 기반 (fast-check) · 테스트 2개. 파일 전체가 확인하는 것: [[03-quality-attribute-scenarios#1. 목록|QA-01]].

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0171 | 어떤 명령을 이어도 불변식이 지켜지고, 입력을 바꾸지 않는다 | [[03-quality-attribute-scenarios#1. 목록\|QA-01]] |
| T-0172 | 생성기가 뷰 상태의 id를 피해야 할 때도 id가 겹치지 않는다 | [[03-quality-attribute-scenarios#1. 목록\|QA-01]] |

^t-packages-core-src-commands-properties-test-ts

### [단위] `packages/core/src/commands/wrap.test.ts`

감싸기 · 풀기. Vitest · 테스트 12개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0173 | 이어진 범위를 그 자리에서 새 While로 감싼다 | [[01-requirements#^r-edit\|R-EDIT-06]] |
| T-0174 | If는 블록들을 참 분기에 담고, 거짓 분기는 비어 있다 | [[01-requirements#^r-edit\|R-EDIT-06]] |
| T-0175 | Case는 블록들을 첫 분기에 담고, 둘째 분기와 default를 갖는다 | [[01-requirements#^r-edit\|R-EDIT-06]] |
| T-0176 | 안의 접기 영역은 안으로 들어가고, 범위와 꼭 같은 영역은 감싼 블록을 둘러싼 채 남는다 | [[01-requirements#^r-edit\|R-EDIT-06]] |
| T-0177 | 처리 블록과 없는 대상은 거절한다 | [[01-requirements#^r-edit\|R-EDIT-06]] |
| T-0178 | 선택한 제어 블록을 없애고 그 안의 블록은 제자리에 남긴다 | [[01-requirements#^r-edit\|R-EDIT-07]] |
| T-0179 | If나 Case는 비지 않은 분기들을 차례로 남긴다 | [[01-requirements#^r-edit\|R-EDIT-07]] |
| T-0180 | 안의 블록을 선택했으면 그것을 담은 가장 가까운 제어 블록을 없앤다(UX Q8) | [[01-requirements#^r-edit\|R-EDIT-07]] |
| T-0181 | 감쌌다 풀면 같은 블록으로 돌아온다 | [[01-requirements#^r-edit\|R-EDIT-07]] |
| T-0182 | 안의 접기 영역은 밖으로 나오고, 블록을 둘러싼 영역은 이제 그 블록들에 걸친다 | [[01-requirements#^r-edit\|R-EDIT-07]] |
| T-0183 | 안이 빈 블록뿐인 제어 블록은, 남는 것이 없으면 빈 블록 하나를 남긴다 | [[01-requirements#^r-edit\|R-EDIT-07]] |
| T-0184 | 제어 블록이 없으면, 그리고 호출 블록(나중)은 거절한다 | [[01-requirements#^r-edit\|R-EDIT-07]] |

^t-packages-core-src-commands-wrap-test-ts

### [단위] `packages/core/src/model/id.test.ts`

id. Vitest · 테스트 5개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0185 | 01-model 1.7: 정의된 id를 모두 문서 순서로 보인다 | - |
| T-0186 | 01-model 1.7: 새 id는 그 종류의 가장 큰 번호에 1을 더한 것이다 | - |
| T-0187 | 01-model 1.7: 같은 문서는 같은 id를 준다 | - |
| T-0188 | alsoAvoid로 넘긴 id는 다시 쓰지 않는다 | - |
| T-0189 | id를 읽고 다른 꼴은 거절한다 | - |

^t-packages-core-src-model-id-test-ts

### [단위] `packages/core/src/model/invariants.test.ts`

불변식 검사(checkInvariants). Vitest · 테스트 10개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0190 | 올바른 문서에는 위반이 없다 | [[01-requirements#^r-nfr\|R-NFR-01]] |
| T-0191 | 01-model 3.1: 문서에는 다이어그램이 있어야 한다 | - |
| T-0192 | 01-model 3.2: 빈 줄은 없다 | - |
| T-0193 | 01-model 3.3: id는 노드 종류를 넘어 유일하다 | - |
| T-0194 | 01-model 3.4: Case에는 분기가 있어야 한다. default가 없거나 default만 있는 Case는 괜찮다 | - |
| T-0195 | 01-model 3.4: 분기가 둘이 아닌 If(망가진 파일)를 알린다 | - |
| T-0196 | 01-model 3.5: 접기의 양 끝은 그 줄의 블록이고 순서대로다 | - |
| T-0197 | 01-model 3.5: 접기는 겹쳐 들어가거나 떨어져 있고, 같은 범위의 접기는 둘이 없다 | - |
| T-0198 | 01-model 3.6: 로컬 호출은 있는 Method를 가리킨다 | - |
| T-0199 | 01-model 3.7: 빈 다이어그램은 그것 하나뿐일 때만 있다 | - |

^t-packages-core-src-model-invariants-test-ts

### [단위] `packages/editor/src/clipboard/clip-format.test.ts`

클립보드 형식(03-editor 3.3). Vitest · 테스트 3개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0200 | 복사한 블록은 다른 프로그램에는 들여쓴 줄들이다 | [[01-requirements#^r-edit\|R-EDIT-10]] |
| T-0201 | 모델 JSON을 다시 읽으면 같은 블록이다 | [[01-requirements#^r-edit\|R-EDIT-10]] |
| T-0202 | 바깥에서 온 글은 한 줄에 처리 블록 하나가 된다 | [[01-requirements#^at\|AT-12]] |

^t-packages-editor-src-clipboard-clip-format-test-ts

## 3. 키 · 마우스 · 선택

키가 어느 명령으로 가는지, 이동과 선택, 두 키 조합의 힌트, 클릭 · 끌기가 어느 블록을 가리키는지, 선택 테두리와 캔버스의 포커스 → [[03-keymap]], [[02-interaction-rules]]. 파일 10개, 테스트 75개.

### [E2E] `apps/web/e2e/canvas.spec.ts`

캔버스. Playwright · 테스트 4개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0203 | 빈 캔버스를 클릭하면 `a`를 기다리던 키 힌트가 닫힌다 | [[defects#BUG-08\|BUG-08]] |
| T-0204 | 선택한 것이 없으면 포커스 테두리가 잠깐만 보인다 | [[ux-decisions\|UX CF2]] |
| T-0205 | 블록을 끌어도 그려진 글자가 선택되지 않는다 | [[defects#BUG-09\|BUG-09]] |
| T-0206 | 빈 캔버스를 오른쪽 클릭하면 파일 · 도움말 메뉴가 보인다 | [[ux-decisions\|UX CM1]] |

^t-apps-web-e2e-canvas-spec-ts

### [통합] `packages/editor/src/session/diagrams.test.ts`

헤더 선택(조작 규칙 2 "키보드로 이동하고 삽입하기") · 헤더 이름 편집(조작 규칙 "Event 헤더", "Method 헤더") · 헤더와 다이어그램의 명령(조작 규칙 "새 Method로 빼기와 새 다이어그램") · 호출 블록(조작 규칙 "호출 블록"). Vitest · 테스트 21개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0207 | 첫 블록에서 `↑`는 헤더를 선택하고, `↓`는 돌아온다 | [[01-requirements#^r-blk\|R-BLK-10]] |
| T-0208 | 조작 규칙 2: 헤더에서 `←` · `→`는 그려진 순서로 옆 다이어그램에 간다 | - |
| T-0209 | 조작 규칙 2: 첫 이동 키는 첫 다이어그램의 헤더를 선택한다 | - |
| T-0210 | 조작 규칙 2: 헤더에서 `Esc` `Esc` 뒤에 이동 키를 누르면 다시 선택한다 | - |
| T-0211 | `Enter`는 이름을 편집하고, 받아들이면 실행 취소 한 단계로 바뀐다 | [[01-requirements#^r-blk\|R-BLK-10]] |
| T-0212 | 빈 이름은 옛 이름을 되돌리고, 닫고, 까닭을 알린다 | [[ux-decisions\|UX Q4]] |
| T-0213 | 겹치는 이름이면 입력란이 다시 열리고, 거기서 `Esc`는 옛 이름을 지킨다 | [[01-requirements#^r-blk\|R-BLK-11]] |
| T-0214 | 헤더 없는 다이어그램에서 `e`는 헤더를 달고 이름을 편집한다 | [[01-requirements#^r-blk\|R-BLK-10]] |
| T-0215 | 헤더에서 `m`은 종류를 바꾸고, 호출되는 Method는 Event가 될 수 없다 | [[01-requirements#^r-blk\|R-BLK-11]] |
| T-0216 | 헤더가 있는 다이어그램의 블록에서 `m`은 빼내기가 아직 없다고 알린다 | [[01-requirements#^r-edit\|R-EDIT-19]] |
| T-0217 | `E` · `M`은 그 종류의 새 다이어그램을 만들고 이름을 편집한다 | [[01-requirements#^r-edit\|R-EDIT-18]] |
| T-0218 | Method 헤더를 없애면 그 호출은 대상을 잃고 첫 블록이 선택된다 | [[01-requirements#^r-blk\|R-BLK-07]] |
| T-0219 | 불변식 7: 아무것도 없는 다이어그램에서 헤더를 없애면 다이어그램도 없어진다 | - |
| T-0220 | `Shift`+`Delete`는 다이어그램을 지우고, 하나뿐인 다이어그램은 지울 수 없다 | [[01-requirements#^r-edit\|R-EDIT-18]] |
| T-0221 | 헤더에서 `Alt`+방향키는 같은 종류 안에서 다이어그램을 옮긴다 | [[ux-decisions\|UX Q6]] |
| T-0222 | `a c`는 Method 목록을 보이고, 고른 Method를 호출하며 그 인자를 입력한다 | [[01-requirements#^r-blk\|R-BLK-07]] |
| T-0223 | "새 Method를 만들고 호출"은 Method를 만들고 그 이름을 편집한다 | [[01-requirements#^r-blk\|R-BLK-07]] |
| T-0224 | 03-keymap: 목록을 닫으면 아무것도 넣지 않는다 | - |
| T-0225 | 조작 규칙 "호출 블록": 아무것도 받지 않는 Method는 결과 칸만 있다 | - |
| T-0226 | 대상을 잃은 호출 블록은 편집할 수 없다 | [[01-requirements#^r-blk\|R-BLK-07]] |
| T-0227 | 호출할 Method를 바꿀 때는 지금 Method에서 시작하고 글자를 지킨다 | [[01-requirements#^r-blk\|R-BLK-07]] |

^t-packages-editor-src-session-diagrams-test-ts

### [통합] `packages/editor/src/session/random-keys.test.ts`

무작위 키. Vitest · 테스트 1개. 파일 전체가 확인하는 것: [[03-quality-attribute-scenarios#1. 목록|QA-01]].

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0228 | 무작위 키 400개를 눌러도 불변식이 지켜지고, 실행 취소로 처음까지 되돌아간다(시드 ${String(seed)}) | [[03-quality-attribute-scenarios#1. 목록\|QA-01]] |

^t-packages-editor-src-session-random-keys-test-ts

### [단위] `packages/editor/src/dom/overlay.test.ts`

선택 테두리 그리기(overlayContent). Vitest · 테스트 1개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0229 | 선택 테두리가 블록의 선을 네 변 모두 똑같이 덮는다 | [[defects#BUG-07\|BUG-07]] |

^t-packages-editor-src-dom-overlay-test-ts

### [단위] `packages/editor/src/input/hit-test.test.ts`

클릭이 맞는 자리(03-editor 3.1) · 떨어뜨리는 자리(03-editor 3.2) · 다이어그램 헤더. Vitest · 테스트 14개. 파일 전체가 확인하는 것: [[01-requirements#^r-blk|R-BLK-10]], [[01-requirements#^r-blk|R-BLK-11]].

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0230 | 처리 블록을 클릭하면 그 블록에 맞는다 | [[01-requirements#^r-edit\|R-EDIT-01]] |
| T-0231 | 분기 라벨의 줄이 그것을 둘러싼 헤더보다 먼저 맞는다 | [[01-requirements#^r-edit\|R-EDIT-12]] |
| T-0232 | 03-editor 3.1: 클릭 영역이 없는 반복의 띠는 그 반복에 맞는다 | - |
| T-0233 | Case의 빈 default 칸에 클릭이 맞는다 | [[ux-decisions\|UX CD1]] |
| T-0234 | 03-editor 3.1: 다이어그램 밖에서는 아무것에도 맞지 않는다 | - |
| T-0235 | 블록 사이에 8px 띠가 있고, 나머지는 블록 위다 | [[01-requirements#^r-edit\|R-EDIT-09]] |
| T-0236 | 블록 위에 떨어뜨린 새 제어 블록은 그 블록을 감싸고, 처리 블록은 뒤에 간다 | [[01-requirements#^r-edit\|R-EDIT-09]] |
| T-0237 | 선택한 블록 가운데 하나에서 하면 선택 전체를 감싼다 | [[01-requirements#^r-edit\|R-EDIT-09]] |
| T-0238 | 끄는 블록은 블록 사이로, 제어 블록 안으로도 간다 | [[01-requirements#^r-edit\|R-EDIT-09]] |
| T-0239 | 빈 블록은 떨어뜨린 것을 통째로 받고, 끌고 있는 블록 안에는 아무것도 떨어지지 않는다 | [[01-requirements#^r-edit\|R-EDIT-09]] |
| T-0240 | 빈 default 칸에 떨어뜨리면 default 분기가 생긴다 | [[ux-decisions\|UX CD1]] |
| T-0241 | 헤더를 클릭하면 헤더에 맞고 헤더가 선택된다 | [[01-requirements#^r-blk\|R-BLK-10]] |
| T-0242 | 시각 디자인 7.1: 선택한 헤더는 통째로 테두리를 두르고, 그 위에는 아무것도 떨어지지 않는다 | - |
| T-0243 | 03-editor 3.4: 헤더 이름의 입력란은 헤더 안에 있다 | - |

^t-packages-editor-src-input-hit-test-test-ts

### [단위] `packages/editor/src/input/keys.test.ts`

키 읽기(03-editor 4). Vitest · 테스트 8개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0244 | 03-editor 4: 글자를 자리로 읽어서, 한글 입력 중에도 같은 키가 된다 | - |
| T-0245 | 03-keymap: 기호, 이름 있는 키, 조합 키만 누른 것 | - |
| T-0246 | 조합의 첫 키는 기다리고, 둘째 키가 명령을 실행한다(UX K1) | [[01-requirements#^r-edit\|R-EDIT-04]] |
| T-0247 | 조합을 잇지 않는 키나 `Esc`는 그 조합을 취소한다 | [[ux-decisions\|UX K1]] |
| T-0248 | 03-keymap: 분기 라벨을 선택한 동안 `o` · `O` · `x`는 분기에 듣는다 | - |
| T-0249 | 03-keymap: `a p` · `A p`는 `o` · `O`처럼 처리 블록을 넣는다 | - |
| T-0250 | 03-keymap: 범위(`v`)에서 `d`는 바로 잘라내고, `s`는 종류를 기다린다 | - |
| T-0251 | 03-editor 4: 키 표는 명령마다 보일 키를 준다 | - |

^t-packages-editor-src-input-keys-test-ts

### [단위] `packages/editor/src/navigation/navigate.test.ts`

키보드 이동(03-editor 2.2). Vitest · 테스트 12개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0252 | `↓`는 그려진 순서로 가되 옆 분기로는 들어가지 않는다 | [[01-requirements#^r-edit\|R-EDIT-03]] |
| T-0253 | 아래에 아무것도 없을 때 `↓`는 이 블록을 담은 블록을 선택하고, 맨 위에서는 그대로다 | [[ux-decisions\|UX ND1]] |
| T-0254 | 분기의 첫 블록에서 `↑`는 그 라벨을, 그다음 If를 선택한다(UX Q10) | [[01-requirements#^r-edit\|R-EDIT-03]] |
| T-0255 | If 아래에서 `↑`는 그 If의 가장 왼쪽 분기의 맨 아래로 간다 | [[01-requirements#^r-edit\|R-EDIT-03]] |
| T-0256 | `←` · `→`는 분기를 건너다가 If를 떠난다(UX Q11) | [[01-requirements#^r-edit\|R-EDIT-03]] |
| T-0257 | 분기 라벨에서 `←` · `→`는 다음 라벨로, `↓`는 분기 안으로 간다 | [[01-requirements#^r-edit\|R-EDIT-03]] |
| T-0258 | `Ctrl`+`↑` · `↓`는 제어 블록을 블록 하나로 다룬다 | [[01-requirements#^r-edit\|R-EDIT-03]] |
| T-0259 | `Ctrl`+`←` · `→`는 옆 분기로, 분기 밖에서는 위와 아래로 간다 | [[01-requirements#^r-edit\|R-EDIT-03]] |
| T-0260 | `gg` · `G`는 다이어그램의 첫 블록과 마지막 블록을 선택한다 | [[01-requirements#^r-edit\|R-EDIT-03]] |
| T-0261 | `[[` · `]]`는 옆 다이어그램으로 간다(있으면) | [[01-requirements#^r-edit\|R-EDIT-03]] |
| T-0262 | 조작 규칙 2: 선택한 것이 없으면 이동 키는 마지막에 선택한 블록에서 시작한다 | - |
| T-0263 | Case의 빈 default 칸에는 마지막 분기에서 간다 | [[ux-decisions\|UX CD1]] |

^t-packages-editor-src-navigation-navigate-test-ts

### [단위] `packages/editor/src/state/selection.test.ts`

선택(03-editor 2). Vitest · 테스트 5개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0264 | 더 깊은 곳을 `Shift`+클릭하면 가장 가까운 공통의 줄까지 넓힌다(ADR-0008) | [[01-requirements#^r-edit\|R-EDIT-05]] |
| T-0265 | 다른 다이어그램을 `Shift`+클릭하면 그 블록만 선택한다 | [[01-requirements#^r-edit\|R-EDIT-05]] |
| T-0266 | `Shift`+`↓`는 한 부모 아래에 머문다 | [[01-requirements#^r-edit\|R-EDIT-05]] |
| T-0267 | 03-editor 2: id가 사라진 선택은 버린다 | - |
| T-0268 | 블록 범위를 명령의 대상으로 바꾼다 | - |

^t-packages-editor-src-state-selection-test-ts

### [단위] `packages/editor/src/ui/key-hint.test.ts`

UX K3: 키 힌트는 선택 바로 아래에 간다. Vitest · 테스트 4개. 파일 전체가 확인하는 것: [[ux-decisions|UX K3]].

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0269 | 선택 아래, 그 왼쪽 끝에 놓인다 | - |
| T-0270 | 아래로 삐져나가면 선택 위로 간다 | - |
| T-0271 | 위에도 자리가 없으면 아래에 있되 창 안에 머문다 | - |
| T-0272 | 오른쪽 끝에서는 창 안에 머물도록 왼쪽으로 옮긴다 | - |

^t-packages-editor-src-ui-key-hint-test-ts

### [단위] `packages/editor/src/ui/keys.test.ts`

키. Vitest · 테스트 5개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0273 | 03-keymap: 표준 키와 Vim 키를 가른다 | - |
| T-0274 | 03-editor 5.1: 메뉴는 표준 키를, 없으면 하나뿐인 키를 보인다 | - |
| T-0275 | 글자 조합을 Vim처럼 적고 방향키에 이름을 붙인다 | - |
| T-0276 | 키를 단축키 목록의 두 열로 나눈다 | - |
| T-0277 | 기다리던 첫 키 다음의 둘째 키를 찾는다 | [[ux-decisions\|UX K1]] |

^t-packages-editor-src-ui-keys-test-ts

## 4. 메뉴 · 화면 · 시작

메뉴와 툴바, 화면 언어, 예제, 판 번호, 페이지가 뜨는 과정, 휴대폰 화면 → [[05-screen-layout]], [[06-web]]. 파일 9개, 테스트 55개.

### [E2E] `apps/web/e2e/boot.spec.ts`

페이지의 시작. Playwright · 테스트 2개. 파일 전체가 확인하는 것: [[01-requirements#^r-nfr|R-NFR-10]], [[03-quality-attribute-scenarios#1. 목록|QA-19]].

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0278 | `indexedDB.open`이 끝내 답하지 않아도 편집기가 뜬다 | [[defects#BUG-03\|BUG-03]], [[03-quality-attribute-scenarios#1. 목록\|QA-19]] |
| T-0279 | 시작하다 실패하면 시작 화면에 그 사실을 보인다 | [[defects#BUG-03\|BUG-03]], [[03-quality-attribute-scenarios#1. 목록\|QA-19]] |

^t-apps-web-e2e-boot-spec-ts

### [E2E] `apps/web/e2e/examples.spec.ts`

예제(05-screen-layout "예제"). Playwright · 테스트 7개. 파일 전체가 확인하는 것: [[01-requirements#^r-edit|R-EDIT-25]], [[ux-decisions|UX EX1]].

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0280 | 첫 방문에는 예제 열 개, 빈 문서, 파일 열기로 맞는다 | [[01-requirements#^r-edit\|R-EDIT-25]] |
| T-0281 | 첫 방문 모달을 `Esc`로 닫으면 새 문서를 지키고 다시 묻지 않는다 | [[ux-decisions\|UX EX2]] |
| T-0282 | 도움말 › 예제…는 같은 모달을 그 문구로 연다 | [[ux-decisions\|UX EX3]] |
| T-0283 | 툴바의 "예제"가 예제 모달을 연다 | [[ux-decisions\|UX EX3]] |
| T-0284 | 툴바의 드롭다운은 툴바 안이 아니라 캔버스 위에 열린다 | [[defects#BUG-02\|BUG-02]] |
| T-0285 | 창보다 큰 다이어그램은 캔버스 안에서 스크롤된다 | [[defects#BUG-01\|BUG-01]] |
| T-0286 | 마우스로 연 메뉴를 `Esc`가 닫는다 | [[defects#BUG-05\|BUG-05]] |

^t-apps-web-e2e-examples-spec-ts

### [E2E] `apps/web/e2e/mobile.spec.ts`

휴대폰의 웹 앱(페이지의 시작은 boot.spec.ts에). Playwright · 테스트 5개. 파일 전체가 확인하는 것: [[01-requirements#^r-nfr|R-NFR-08]], [[01-requirements#^r-nfr|R-NFR-09]], [[03-quality-attribute-scenarios#1. 목록|QA-18]], [[03-quality-attribute-scenarios#1. 목록|QA-20]].

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0287 | 느린 휴대폰에서도 편집기가 3초 안에, 블록 글꼴이 5초 안에 보인다 | [[03-quality-attribute-scenarios#1. 목록\|QA-18]] |
| T-0288 | 휴대폰의 첫 방문에서는 탭 한 번으로 예제를 연다 | [[03-quality-attribute-scenarios#1. 목록\|QA-20]] |
| T-0289 | 휴대폰에서는 툴바로 블록을 넣고 탭으로 선택한다 | [[03-quality-attribute-scenarios#1. 목록\|QA-20]] |
| T-0290 | 휴대폰의 툴바에 "예제"가 보이고, 탭하면 모달이 열린다 | [[defects#BUG-04\|BUG-04]], [[03-quality-attribute-scenarios#1. 목록\|QA-20]] |
| T-0291 | 휴대폰에서는 실행 취소 · 다시 실행 · 감싸기 · 도움말이 툴바에 있고, 아래 줄은 없다 | [[03-quality-attribute-scenarios#1. 목록\|QA-20]] |

^t-apps-web-e2e-mobile-spec-ts

### [E2E] `apps/web/e2e/smoke.spec.ts`

. Playwright · 테스트 1개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0292 | 빌드한 웹 앱이 새 문서를 열고 블록 글꼴을 읽어 들인다 | - |

^t-apps-web-e2e-smoke-spec-ts

### [통합] `packages/editor/src/ui/editor-app.test.tsx`

메뉴 바 · 툴바의 블록 아이콘 · 명령 팔레트 · 상태 표시줄 · 키 힌트 · 모달 · 캔버스 자리 · 컨텍스트 메뉴 · 셸의 대화 상자와 알림 · 고르는 창(조작 규칙 "호출 블록"). Vitest + happy-dom · 테스트 25개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0293 | 03-editor 5.1: 메뉴를 그 항목과 표준 키로 열고, 클릭을 실행한다 | - |
| T-0294 | 03-editor 3: 맞지 않는 명령은 흐리게 보이되, 엔진이 까닭을 알리도록 실행은 한다 | - |
| T-0295 | 저장하지 않은 동안 파일 이름에 ●를 보인다 | [[ux-decisions\|UX W3]] |
| T-0296 | 메뉴의 이름을 화면 언어로 보인다 | [[01-requirements#^r-nfr\|R-NFR-04]] |
| T-0297 | 클릭은 뒤에 넣고, `Shift`+클릭은 앞에, `Ctrl`+클릭은 감싼다. 처리 블록은 감쌀 수 없다 | [[01-requirements#^r-edit\|R-EDIT-01]] |
| T-0298 | 4px를 넘게 움직인 누름은 클릭 대신 끌기로 엔진에 넘긴다 | [[01-requirements#^r-edit\|R-EDIT-09]] |
| T-0299 | 02-interaction-rules: 툴팁은 블록의 이름과 같은 일을 하는 키를 보인다 | - |
| T-0300 | 이름의 일부로 명령을 찾고, 최근에 쓴 것을 먼저 보인다 | [[01-requirements#^r-edit\|R-EDIT-24]] |
| T-0301 | 명령으로 열고, Vim 키를 보이며, 고른 줄을 `Enter`로 실행한다 | [[01-requirements#^r-edit\|R-EDIT-24]] |
| T-0302 | `↑` · `↓`로 움직이고, `Esc`로 실행하지 않고 닫는다 | [[01-requirements#^r-edit\|R-EDIT-24]] |
| T-0303 | 06-web 7: 선택한 것과 가장 최근 알림을 보인다 | - |
| T-0304 | 04-visual-design 7.1: 편집 모드와 줌을 보인다 | - |
| T-0305 | If ↔ Case를 버튼으로 묻고, 답을 엔진에 넘긴다 | [[ux-decisions\|UX MD3]] |
| T-0306 | 엔진이 힌트를 보일 때라고 하면 둘째 키를 보이고, 그 뒤에 숨긴다 | [[01-requirements#^r-edit\|R-EDIT-04]] |
| T-0307 | `?`는 Vim 키와 표준 키의 두 열로 된 키 표를 열고, `Esc`가 닫는다 | [[01-requirements#^r-edit\|R-EDIT-21]] |
| T-0308 | 환경 설정은 사용자 설정을 보이고, 바꾼 것을 설정 저장소에 쓴다 | [[ux-decisions\|UX W5]] |
| T-0309 | 문서 설정은 엔진을 거쳐 쓴다 | [[ux-decisions\|UX W5]] |
| T-0310 | ADR-0010: 엔진 요소를 툴바와 상태 표시줄 사이에 둔다 | - |
| T-0311 | 03-editor 5: 선택에 맞는 명령을 메뉴 순서로, 하위 메뉴와 함께 보인다 | - |
| T-0312 | `Esc`로 닫힌다 | - |
| T-0313 | 06-web 2: 대화 상자는 모달로 묻고, 확인 버튼이 답한다 | - |
| T-0314 | 06-web 1: 글 입력 대화 상자는 친 글로 답하고, `Esc`는 취소한다 | - |
| T-0315 | 06-web 7: 경고는 닫을 때까지 상태 표시줄에 남는다 | - |
| T-0316 | Method들과 "새 Method"를 보이고, `j` · `k`는 지금 것에서 움직이며 `Enter`가 고른다 | [[01-requirements#^r-blk\|R-BLK-07]] |
| T-0317 | 03-keymap: 숫자는 바로 고르고, `Esc`는 닫는다 | - |

^t-packages-editor-src-ui-editor-app-test-tsx

### [단위] `apps/web/src/shell/messages.test.ts`

화면 언어. Vitest · 테스트 3개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0318 | 한국어 브라우저는 한국어, 다른 모든 언어는 영어를 받는다 | [[01-requirements#^r-nfr\|R-NFR-04]] |
| T-0319 | 환경 설정이 브라우저 언어보다 먼저다 | [[01-requirements#^r-nfr\|R-NFR-04]] |
| T-0320 | 자리 표시자를 채우고 모르는 것은 그대로 둔다 | - |

^t-apps-web-src-shell-messages-test-ts

### [단위] `packages/editor/src/examples/examples.test.ts`

예제 · $id. Vitest · 테스트 9개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0321 | 예제 열 개를 차례대로, 두 언어의 이름과 함께 보인다 | [[01-requirements#^r-edit\|R-EDIT-25]] |
| T-0322 | 두 헤더 모양 모두에서 모든 불변식을 지킨다 | [[01-requirements#^r-edit\|R-EDIT-25]] |
| T-0323 | 주어진 헤더 모양과 새 문서의 설정 · 보기를 쓴다 | [[01-requirements#^r-edit\|R-EDIT-25]] |
| T-0324 | 언제나 같은 문서를 만든다 | [[01-requirements#^r-edit\|R-EDIT-25]] |
| T-0325 | 프로토타입의 다이어그램 · 헤더 · 블록이 있다 | [[01-requirements#^r-edit\|R-EDIT-25]] |
| T-0326 | 짧은 표기의 글자를 모두 적힌 그대로 지킨다 | [[01-requirements#^r-edit\|R-EDIT-25]] |
| T-0327 | 모든 호출 블록을 문서의 Method에 잇는다 | [[01-requirements#^r-edit\|R-EDIT-25]] |
| T-0328 | 모델 JSON으로 저장하고, 같은 문서로 연다 | [[01-requirements#^r-fmt\|R-FMT-02]] |
| T-0329 | SVG 파일로 저장하고, 같은 문서로 연다 | [[03-quality-attribute-scenarios#1. 목록\|QA-04]] |

^t-packages-editor-src-examples-examples-test-ts

### [단위] `packages/editor/src/ui/menu-model.test.ts`

메뉴 항목(menuEntries). Vitest · 테스트 1개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0330 | 03-editor 5.1: 메뉴를 묶음과 순서로 정렬하고 하위 메뉴를 제자리에 모은다 | - |

^t-packages-editor-src-ui-menu-model-test-ts

### [단위] `packages/editor/src/version.test.ts`

앱의 판 번호. Vitest · 테스트 2개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0331 | 유의적 버전이다 | - |
| T-0332 | 모든 패키지의 판과 같다 | - |

^t-packages-editor-src-version-test-ts

## 5. 파일

파일 형식(모델이 든 SVG)의 쓰기 · 읽기 · 왕복, 손상된 파일, 편집기와 셸의 약속, 웹의 저장 · 열기 · 내려받기, 임시 보관, 탭 잠금, 최근 파일, PNG 내보내기 → [[01-file-format]], [[06-web]]. 파일 15개, 테스트 106개.

### [E2E] `apps/web/e2e/files.spec.ts`

웹 셸의 브라우저 흐름(06-web 1, 2). Playwright · 테스트 6개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0333 | If 블록이 든 새 문서를 내려받고 다시 연다 | [[01-requirements#^r-all\|R-ALL-03]], [[01-requirements#^r-web\|R-WEB-02]] |
| T-0334 | 모델이 없는 SVG는 열지 않고, 까닭을 보인다 | [[01-requirements#^r-web\|R-WEB-02]] |
| T-0335 | 새로 고친 뒤 저장하지 않은 내용을 복원할 수 있다 | [[01-requirements#^r-web\|R-WEB-03]] |
| T-0336 | 파일에 저장하고, 다음 편집 2초 뒤에 자동 저장한다 | [[01-requirements#^r-web\|R-WEB-02]], [[01-requirements#^r-exp\|R-EXP-04]] |
| T-0337 | 그림의 두 배 크기로 PNG를 내보낸다 | [[01-requirements#^r-exp\|R-EXP-01]] |
| T-0338 | 06-web 2: 같은 파일을 연 둘째 탭은 보기만 한다 | - |

^t-apps-web-e2e-files-spec-ts

### [통합] `apps/web/src/files/web-document-store.test.ts`

웹 문서 저장소. Vitest · 테스트 5개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0339 | 원래 파일에 쓰고, 저장할 때 권한을 묻는다 | [[01-requirements#^r-web\|R-WEB-02]] |
| T-0340 | 06-web 2: 자동 저장은 권한을 묻지 않고, 권한이 없으면 쓰기를 거절당한다 | - |
| T-0341 | 06-web 2: 권한을 받으면 자동 저장이 쓸 수 있다 | - |
| T-0342 | 06-web 1: File System Access가 없으면 저장은 같은 이름으로 내려받는다 | - |
| T-0343 | 06-web 1: "다른 이름으로 내려받기"는 이름을 묻고 문서의 확장자를 지킨다 | - |

^t-apps-web-src-files-web-document-store-test-ts

### [통합] `apps/web/src/shell/web-shell.test.ts`

웹 셸. Vitest · 테스트 8개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0344 | 03-editor 6.1: 명령 목록에 새로 만들기 · 열기 · 최근 파일 · 내보내기를 더한다 | - |
| T-0345 | 탭 제목에 이름과 ●를 보인다 | [[ux-decisions\|UX W3]] |
| T-0346 | 모델이 없는 SVG는 문서를 바꾸지 않고, 까닭을 알린다 | [[01-requirements#^r-web\|R-WEB-02]] |
| T-0347 | 저장한 파일을 열고 브라우저 사본으로 목록에 올린다 | [[01-requirements#^r-web\|R-WEB-02]], [[01-requirements#^r-exp\|R-EXP-04]] |
| T-0348 | 편집하고 0.5초 뒤에 임시 보관을 쓰고, 저장하면 지운다 | [[01-requirements#^r-web\|R-WEB-03]] |
| T-0349 | 시작할 때 가장 새 임시 보관의 복원을 묻고, 저장하지 않은 문서로 연다 | [[01-requirements#^r-web\|R-WEB-03]] |
| T-0350 | 복원을 거절하면 그 임시 보관을 지운다 | [[01-requirements#^r-web\|R-WEB-03]] |
| T-0351 | 03-editor 6.1: 저장하지 않은 편집을 두고 다른 문서로 가면 임시 보관에 지키고 그렇다고 알린다 | - |

^t-apps-web-src-shell-web-shell-test-ts

### [통합] `packages/core/node/golden.test.ts`

골든 파일(07-testing 3). 골든 파일 · 테스트 4개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0352 | ${name}을 골든 파일로 저장한다 | [[01-requirements#^r-fmt\|R-FMT-03]] |
| T-0353 | 골든 파일마다 사례가 있다 | - |
| T-0354 | 골든 파일은 모두 열고 저장하면 같은 바이트다 | [[03-quality-attribute-scenarios#1. 목록\|QA-04]] |
| T-0355 | 서로 다른 한글 음절 300자가 든 블록 100개를 저장하면 300 KB 이하다 | [[03-quality-attribute-scenarios#1. 목록\|QA-09]] |

^t-packages-core-node-golden-test-ts

### [통합] `packages/editor/src/create-editor.test.ts`

셸과의 약속(03-editor 6) · 셸이 편집기를 거쳐 묻기(03-editor 6에 더한 것) · 헤더 모양 · 고르는 창(조작 규칙 "호출 블록") · 헤더와 호출 블록의 인라인 편집(03-editor 3.4). Vitest + happy-dom · 테스트 23개. 파일 전체가 확인하는 것: [[03-quality-attribute-scenarios#1. 목록|QA-10]], [[01-requirements#^r-lay|R-LAY-10]], [[ux-decisions|UX HS1]].

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0356 | 새 문서에는 빈 블록 하나가 선택되어 있고, 바뀐 것이 없는 상태다 | [[01-requirements#^r-all\|R-ALL-03]] |
| T-0357 | 03-editor 6.2: 바뀌면 문서가 바뀐 상태가 되고 셸에 알린다 | - |
| T-0358 | 저장하면 모델이 든 파일을 쓰고, 다시 열면 같은 내용이다 | [[01-requirements#^r-fmt\|R-FMT-01]] |
| T-0359 | 03-editor 6: WriteResult 실패는 문서를 바뀐 상태로 두고 까닭을 알린다 | - |
| T-0360 | 06-web 1: 원래 파일에 쓸 수 없는 곳에서는 저장의 이름이 내려받기다 | - |
| T-0361 | 01-file-format 5: 열 수 없는 파일은 거절하고 문서는 그대로 둔다 | - |
| T-0362 | coding guide 5: 망가진 첫 파일은 보기 전용으로 열어 원래 파일을 덮어쓰지 않는다 | - |
| T-0363 | 03-editor 6.3: 스냅숏은 바뀐 상태의 문서로 다시 열린다 | - |
| T-0364 | 03-editor 6.4: 보기 전용은 편집을 거절하고 그렇다고 알린다 | - |
| T-0365 | 03-editor 6: 문서 설정은 내용이라 바꾸면 실행 취소할 수 있다 | - |
| T-0366 | 03-editor 1, 3.4: 다이어그램의 키가 인라인 편집기를 열고 `Enter`가 받아들인다 | - |
| T-0367 | 03-editor 3.4: 새 블록의 글자 편집기는 한 프레임 뒤가 아니라 바로 키를 받는다 | - |
| T-0368 | 03-editor 3.4: 글자를 치는 중의 `Ctrl`+`S`는 글자를 받아들이고 저장한다 | - |
| T-0369 | 03-editor 5: 블록을 오른쪽 클릭하면 그 블록을 선택하고 컨텍스트 메뉴를 청한다 | - |
| T-0370 | 06-web 7: 셸의 알림이 상태 표시줄에 보인다 | - |
| T-0371 | 06-web 2: confirm은 대화 상자를 보이고 답으로 끝난다 | - |
| T-0372 | 06-web 1: prompt는 친 글로, 취소하면 null로 끝난다 | - |
| T-0373 | 둘째 대화 상자가 첫째를 취소한다 | - |
| T-0374 | 마지막에 고른 모양을 기억하고 새 문서가 그 모양으로 시작한다 | [[ux-decisions\|UX HS1]] |
| T-0375 | 파일을 열면 그 파일의 모양을 지키고, 기억해 둔 모양은 바꾸지 않는다 | [[ux-decisions\|UX HS1]] |
| T-0376 | 호출 블록을 넣을 때 화면 상태로 묻고, 답하면 넣는다 | [[01-requirements#^r-blk\|R-BLK-07]] |
| T-0377 | 조작 규칙 "Event 헤더": 겹치는 이름이면 입력란이 다시 열리고, 거기서 `Esc`는 되돌린다 | - |
| T-0378 | 03-keymap: `Tab`은 호출 블록의 인자와 결과 사이를 옮긴다 | - |

^t-packages-editor-src-create-editor-test-ts

### [단위] `apps/web/src/files/export-png.test.ts`

PNG 내보내기의 크기. Vitest · 테스트 4개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0379 | 저장한 SVG의 크기를 읽는다 | [[01-requirements#^r-exp\|R-EXP-01]] |
| T-0380 | 크기가 없는 SVG는 null을 준다 | - |
| T-0381 | 기본으로 두 배 크기, 정수 픽셀로 그린다 | [[01-requirements#^r-exp\|R-EXP-01]] |
| T-0382 | 캔버스가 담을 수 있는 것보다 큰 그림은 배율을 낮춘다 | - |

^t-apps-web-src-files-export-png-test-ts

### [단위] `apps/web/src/files/file-name.test.ts`

파일 이름. Vitest · 테스트 6개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0383 | .ns.svg와 .ns 파일을 대소문자와 상관없이 연다 | [[01-requirements#^r-web\|R-WEB-02]] |
| T-0384 | 문서의 확장자를 떼어 밑 이름을 얻는다 | - |
| T-0385 | .ns.svg와 .ns는 그대로 두고, 다른 이름에는 .ns.svg를 붙인다 | [[01-requirements#^r-web\|R-WEB-02]] |
| T-0386 | 파일 시스템이 거절하는 문자를 바꾸고, 빈 이름이면 기본 이름을 쓴다 | - |
| T-0387 | PNG의 이름을 문서 이름으로 짓는다 | [[01-requirements#^r-exp\|R-EXP-01]] |
| T-0388 | 저장하지 않은 동안 탭 제목의 이름 앞에 ●를 붙인다 | [[ux-decisions\|UX W3]] |

^t-apps-web-src-files-file-name-test-ts

### [단위] `apps/web/src/shell/tab-lock.test.ts`

탭 잠금. Vitest · 테스트 5개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0389 | 06-web 2: 첫 탭이 편집하고, 같은 파일을 연 뒤의 탭은 보기만 한다 | - |
| T-0390 | 06-web 2: 다른 파일끼리는 서로 막지 않는다 | - |
| T-0391 | 03-editor 6.4: 다른 탭이 닫히면 보기만 하던 탭이 다시 편집할 수 있다 | - |
| T-0392 | 다른 이름으로 저장한 뒤 점유를 새 파일로 옮긴다 | - |
| T-0393 | BroadcastChannel이 없으면 모든 점유가 성공한다 | - |

^t-apps-web-src-shell-tab-lock-test-ts

### [단위] `apps/web/src/shell/timers.test.ts`

임시 보관 타이머 · 자동 저장 타이머. Vitest · 테스트 7개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0394 | 0.5초 안의 편집은 한 번에 쓴다 | [[01-requirements#^r-web\|R-WEB-03]] |
| T-0395 | 기다리던 쓰기를 바로 하고, 기다리는 것이 없으면 아무것도 하지 않는다 | [[01-requirements#^r-web\|R-WEB-03]] |
| T-0396 | 기다리던 쓰기를 취소한다 | - |
| T-0397 | 마지막으로 바꾸고 2초 뒤에 저장한다 | [[01-requirements#^r-exp\|R-EXP-04]] |
| T-0398 | 저장하는 동안 바뀐 것은 저장이 끝난 뒤 다시 2초를 기다린다 | [[01-requirements#^r-exp\|R-EXP-04]] |
| T-0399 | 06-web 2: 쓰기 권한을 잃으면 다시 시작할 때까지 멈춘다 | - |
| T-0400 | dispose 뒤에는 저장하지 않는다 | - |

^t-apps-web-src-shell-timers-test-ts

### [단위] `apps/web/src/storage/recent-files.test.ts`

최근 파일. Vitest · 테스트 5개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0401 | 마지막에 연 파일을 맨 앞에 둔다 | [[01-requirements#^r-exp\|R-EXP-04]] |
| T-0402 | 파일마다 한 항목을 두고 그것을 맨 위로 올린다 | [[01-requirements#^r-exp\|R-EXP-04]] |
| T-0403 | 파일 열 개를 기억하고, 밀려난 것을 알린다 | [[01-requirements#^r-exp\|R-EXP-04]] |
| T-0404 | 키로 파일을 잊는다 | - |
| T-0405 | 저장한 항목을 새것부터 늘어놓는다 | - |

^t-apps-web-src-storage-recent-files-test-ts

### [단위] `packages/core/src/format/base64.test.ts`

base64 인코딩. Vitest · 테스트 2개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0406 | RFC 4648의 시험 벡터를 인코딩한다 | - |
| T-0407 | 큰 값에는 +와 /를 쓴다 | - |

^t-packages-core-src-format-base64-test-ts

### [단위] `packages/core/src/format/model-json.test.ts`

모델 JSON 쓰기. Vitest · 테스트 6개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0408 | 01-file-format 3.3: 작은 예를 2칸 들여쓰기와 표 순서의 키로 쓴다 | - |
| T-0409 | 같은 문서는 객체를 만든 순서와 상관없이 같은 글을 준다 | [[01-requirements#^r-fmt\|R-FMT-03]] |
| T-0410 | 01-file-format 3.3: head · folds · labels · otherwise · siteFolds는 있을 때만 쓴다 | - |
| T-0411 | 01-model 2: 있는 접을 수 있는 id만, 문서 순서로, 겹치지 않게 쓴다 | - |
| T-0412 | 01-file-format 3.1: 열린 경로는 문서 순서이고, 있는 것만이다 | - |
| T-0413 | 01-file-format 3.3: 파일에서 지켜 둔 모르는 textKind를 다시 쓴다 | - |

^t-packages-core-src-format-model-json-test-ts

### [단위] `packages/core/src/format/parse-model.test.ts`

모델 JSON 읽기. Vitest · 테스트 8개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0414 | 모든 노드 종류를 다시 읽으면 같은 문서다 | [[01-requirements#^r-fmt\|R-FMT-02]] |
| T-0415 | 01-file-format 3.3: 빈 목록과 접기를 적은 파일도 읽는다 | - |
| T-0416 | 01-file-format 3.3: 모르는 textKind는 보통 글로 보이고, 저장하려고 값을 지킨다 | - |
| T-0417 | 01-file-format 7: 판 0의 파일은 프로토타입 파일이고 편집할 수 없다 | - |
| T-0418 | 01-file-format 5: 더 새 판은 편집할 수 없고 업데이트를 권한다 | - |
| T-0419 | 망가진 입력은 까닭과 함께 거절하고, 예외를 던지지 않는다 | [[03-quality-attribute-scenarios#1. 목록\|QA-02]] |
| T-0420 | 01-model 2: 읽을 때 대상이 없는 뷰의 id도 지킨다(약한 참조) | - |
| T-0421 | 01-model 3: 불변식을 깨는 문서는 고치지 않고 거절한다 | - |

^t-packages-core-src-format-parse-model-test-ts

### [단위] `packages/core/src/format/round-trip.test.ts`

왕복. 속성 기반 (fast-check) · 테스트 3개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0422 | 모델 JSON을 다시 읽으면 같은 내용이고, 다시 쓰면 같은 글이다 | [[01-requirements#^r-fmt\|R-FMT-02]] |
| T-0423 | 저장한 SVG 파일을 열면 같은 문서이고, 다시 저장하면 같은 바이트다 | [[03-quality-attribute-scenarios#1. 목록\|QA-04]] |
| T-0424 | 어떤 글을 열어도 예외를 던지지 않는다 | [[03-quality-attribute-scenarios#1. 목록\|QA-02]] |

^t-packages-core-src-format-round-trip-test-ts

### [단위] `packages/core/src/format/svg-file.test.ts`

SVG 파일. Vitest · 테스트 14개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0425 | 01-file-format 2: 문서에 적힌 구조로 짠다 | - |
| T-0426 | 같은 부분은 같은 바이트를 준다 | [[01-requirements#^r-fmt\|R-FMT-03]] |
| T-0427 | CDATA를 `]]>` 둘레에서 나누고, 다시 읽으면 글자가 온전하다 | [[01-requirements#^r-fmt\|R-FMT-04]] |
| T-0428 | XML이 허용하지 않는 문자는 JSON 이스케이프로 쓴다 | - |
| T-0429 | 열고 다시 저장하면 모델 부분이 같다 | [[03-quality-attribute-scenarios#1. 목록\|QA-04]] |
| T-0430 | 01-file-format 1: .ns 파일도 같은 방법으로 연다(내용이 같다) | - |
| T-0431 | 01-file-format 3.2: 모델 요소 안의 CDATA 구역과 이스케이프한 글을 합친다 | - |
| T-0432 | 모델 요소처럼 보이는 마크업이 든 블록 글자를 모델로 잡지 않는다 | - |
| T-0433 | 다른 접두사를 쓰거나 루트에 선언한 모델 네임스페이스도 받는다 | - |
| T-0434 | 모델 요소가 없는 보통 SVG는 편집할 수 없다 | [[01-requirements#^r-fmt\|R-FMT-06]] |
| T-0435 | ADR-0035: 프로토타입 파일을 가려내고, 편집할 수 없다 | - |
| T-0436 | 망가진 파일은 손상으로 거절하고, 예외를 던지지 않는다 | [[03-quality-attribute-scenarios#1. 목록\|QA-02]] |
| T-0437 | 01-file-format 5: 더 새 판의 파일은 업데이트를 권한다 | - |
| T-0438 | 모델 요소와 그 판을 찾는다 | - |

^t-packages-core-src-format-svg-file-test-ts

## 6. 레이아웃 · 그리기 · 글자

블록의 크기와 자리, SVG로 그리기, 글자 폭 재기, 번들 글꼴과 그 서브셋 → [[02-layout]]. 파일 6개, 테스트 78개.

### [단위] `packages/core/src/layout/layout.test.ts`

레이아웃: 블록 · 짧은 분기 · 클릭 영역 · 헤더(02-layout 1.5) · 여러 다이어그램(02-layout 1.7) · 속성 · 크기. 속성 기반 (fast-check) · 테스트 37개. 파일 전체가 확인하는 것: [[ux-decisions|UX SB1]].

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0439 | 02-layout 1.4: 처리 블록은 글자에 여백을 더한 폭이고, 적어도 52px다 | - |
| T-0440 | 02-layout 1.5: 다이어그램은 적어도 160px 폭이고, 블록은 폭을 다 쓴다 | - |
| T-0441 | 여러 줄 블록은 한 줄에 18px씩 커진다 | [[01-requirements#^r-lay\|R-LAY-01]] |
| T-0442 | 02-layout 1.2: 빈 블록은 한 줄 높이다 | - |
| T-0443 | 02-layout 1.3: 줄의 블록들은 틈 없이 붙는다 | - |
| T-0444 | 02-layout 1.4: While은 머리가 위에, 본문이 22px 오른쪽에 있다 | - |
| T-0445 | 02-layout 1.4: Do-While은 머리가 아래에 있다 | - |
| T-0446 | For는 While처럼 잰다 | [[ux-decisions\|UX FB1]] |
| T-0447 | 02-layout 1.4: 반복의 머리는 조건이 필요한 만큼 넓다 | - |
| T-0448 | 02-layout 1.4: If의 머리 높이는 조건 + 여백 + 라벨 줄 16px다 | - |
| T-0449 | 02-layout 1.4: If의 폭은 적어도 조건 + 2·pad-x + 70px다 | - |
| T-0450 | If의 폭은 두 분기를 나란히 놓은 폭이다 | [[01-requirements#^r-lay\|R-LAY-02]] |
| T-0451 | 02-layout 1.4: 남는 폭은 분기마다 가장 작은 폭에 비례해 나눈다 | - |
| T-0452 | If의 분기 라벨은 사용자가 적지 않았으면 화면 언어를 따른다 | [[ux-decisions\|UX Q24]] |
| T-0453 | 02-layout 1.4: 긴 분기 라벨은 그 분기를 넓힌다 | - |
| T-0454 | 02-layout 1.4: Case의 머리 높이는 조건 + 여백 + 라벨 줄 28px다 | - |
| T-0455 | 02-layout 1.4: Case의 폭은 적어도 조건 + 2·pad-x + 90px다 | - |
| T-0456 | default가 없는 Case는 빈 default 칸을 그린다 | [[ux-decisions\|UX CD1]] |
| T-0457 | default만 있는 Case는 열이 하나다 | [[ux-decisions\|UX CD2]] |
| T-0458 | 분기의 하나뿐인 빈 블록을 표시한다 | [[ux-decisions\|UX E1]] |
| T-0459 | 남는 높이를 고르게 나누고, 마지막 블록이 나머지를 받는다 | [[ux-decisions\|UX SB1]] |
| T-0460 | 02-layout 1.3: 제어 블록은 남는 높이를 머리가 아니라 본문에 준다 | - |
| T-0461 | 02-layout 1.1: 제어 블록은 머리에서, 라벨은 그 라벨 줄에서 클릭된다 | - |
| T-0462 | 02-layout 1.1: Do-While은 아래쪽 머리에서 클릭된다 | - |
| T-0463 | 모양이 있는 헤더는 모자(16px) + 글자 + 2·pad-y 높이이고, 본문 위에 있다 | - |
| T-0464 | 모양이 있는 헤더의 폭은 적어도 글자 + 2·pad-x + 24px다 | - |
| T-0465 | "제목처럼" 헤더는 16 + 18 + 6 = 40px 높이이고 여백이 없다 | - |
| T-0466 | 헤더 없는 다이어그램은 헤더 노드가 없고 블록에서 클릭된다 | - |
| T-0467 | 02-layout 1.1: 헤더는 그 위 어디서나 클릭된다 | - |
| T-0468 | Method를 Event 오른쪽에 88px 떨어뜨려 둔다 | - |
| T-0469 | 헤더 없는 다이어그램은 Event 묶음에 둔다 | - |
| T-0470 | 긴 묶음은 열로 접어 그림이 16 : 10에 가장 가깝게 한다 | - |
| T-0471 | 한 묶음의 다이어그램을 들어가는 동안 위에서 아래로 44px 떨어뜨려 쌓는다 | - |
| T-0472 | 같은 문서는 같은 레이아웃을 준다 | [[01-requirements#^r-fmt\|R-FMT-03]] |
| T-0473 | 02-layout 1.1: 모든 상자는 정수 px이고 그 다이어그램 안에 있다 | - |
| T-0474 | 다이어그램 본문의 블록이 본문을 꼭 채운다(직사각형을 지킨다) | [[01-requirements#^r-lay\|R-LAY-02]] |
| T-0475 | 블록 500개 문서의 레이아웃 | - |

^t-packages-core-src-layout-layout-test-ts

### [단위] `packages/core/src/render/render-doc.test.ts`

렌더링 · 렌더링: 헤더(시각 디자인 원칙 2) · 렌더링: 골든 파일(07-testing 3). Vitest · 테스트 16개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0476 | 같은 모델은 같은 SVG 글을 준다 | [[01-requirements#^r-fmt\|R-FMT-03]] |
| T-0477 | 01-file-format 2: g.ans-render 하나에 번들 글꼴을 앞세워 그린다 | - |
| T-0478 | 시각 디자인 3.3: 기본 테마의 색을 쓴다 | - |
| T-0479 | 조건 뒤에 헤더 색의 테두리 빛을 둔다 | [[ux-decisions\|UX BH1]] |
| T-0480 | 빈 분기의 ∅를 글자가 아니라 도형으로 그린다 | [[01-requirements#^r-lay\|R-LAY-09]] |
| T-0481 | default가 없는 Case의 빈 default 칸을 그린다 | [[ux-decisions\|UX CD1]] |
| T-0482 | 고정 문구를 주어진 언어로 쓴다 | [[01-requirements#^r-nfr\|R-NFR-04]] |
| T-0483 | XML 문자를 이스케이프하고 공백을 지킨다 | - |
| T-0484 | 장면의 모든 요소가 그 블록을 가리킨다(ADR-0030) | - |
| T-0485 | 쓰인 코드 포인트를 고정 문구까지 넣어 보인다 | [[01-requirements#^r-fmt\|R-FMT-07]] |
| T-0486 | 숫자를 소수 둘째 자리까지, -0 없이 쓴다 | - |
| T-0487 | 블록 500개의 레이아웃과 렌더링이 예산 100ms에 넉넉히 든다 | [[03-quality-attribute-scenarios#1. 목록\|QA-07]] |
| T-0488 | Event의 모자를 block.event의 닫힌 곡선으로 그린다 | - |
| T-0489 | Method의 아치를 block.call로 폭 전체에 걸쳐 그린다 | - |
| T-0490 | "제목처럼" 헤더를 그린다: 흐린 라벨, 굵은 이름, 선, 채움 없음 | - |
| T-0491 | ${name}이 골든 SVG와 같다 | [[01-requirements#^r-fmt\|R-FMT-03]] |

^t-packages-core-src-render-render-doc-test-ts

### [단위] `packages/core/src/text/measure-text.test.ts`

글자 폭. Vitest · 테스트 8개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0492 | 02-layout 2.1의 13px 예와 맞는다 | [[01-requirements#^r-lay\|R-LAY-04]] |
| T-0493 | 한글은 전각, 라틴 문자는 반각으로 센다 | [[01-requirements#^r-lay\|R-LAY-04]] |
| T-0494 | 02-layout 2.1: 표에 없는 문자는 전각으로 센다 | - |
| T-0495 | ADR-0026: 줄의 폭을 정수 px로 올림한다 | - |
| T-0496 | 여러 줄을 잰다: 가장 긴 폭, 줄 수 × 18px | [[01-requirements#^r-lay\|R-LAY-01]] |
| T-0497 | 02-layout 1.2: 빈 글자는 한 줄 높이다 | - |
| T-0498 | 긴 줄을 줄바꿈하지 않는다 | [[ux-decisions\|UX LT1]] |
| T-0499 | 공백을 적힌 그대로 지킨다 | [[ux-decisions\|UX LT1]] |

^t-packages-core-src-text-measure-text-test-ts

### [단위] `packages/fonts/node/index.test.ts`

글꼴 파일 읽기(readFontFile). Vitest · 테스트 2개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0500 | ADR-0026: 문서마다의 서브셋이 시작하는 서브셋 TTF를 읽는다 | - |
| T-0501 | 02-layout 2.2: 편집 화면용 woff2를 읽는다 | - |

^t-packages-fonts-node-index-test-ts

### [단위] `packages/fonts/node/subset.test.ts`

글꼴 서브셋(subsetToWoff) · 고정한 출력. Vitest · 테스트 10개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0502 | 같은 코드 포인트는 순서와 중복에 상관없이 같은 바이트를 준다 | [[01-requirements#^r-fmt\|R-FMT-03]] |
| T-0503 | ADR-0039: 메타데이터와 비공개 블록이 없는 WOFF 1.0 머리를 쓴다 | - |
| T-0504 | ADR-0039: 표 목록은 정렬 · 정렬 맞춤되어 있고, 풀면 서브셋 TTF가 된다 | - |
| T-0505 | ADR-0026: 서브셋은 청한 문자 가운데 글꼴에 있는 것을 꼭 그만큼 담는다 | - |
| T-0506 | 02-layout 2.2: 힌팅과 레이아웃 표가 없어 커닝이나 합자가 없다 | - |
| T-0507 | ADR-0034: 글꼴 이름 "AriadneNSD Mono"를 지킨다(D2Coding은 OFL의 예약 글꼴 이름) | - |
| T-0508 | 02-layout 2.2: 한글 300자 + ASCII는 WOFF로 약 29 KB다 | - |
| T-0509 | 02-layout 2.2: ASCII만이면 WOFF로 약 7 KB다 | - |
| T-0510 | ADR-0039: 견본 서브셋의 SHA-256이 기록한 값이다 | - |
| T-0511 | ADR-0039: 서브셋 TTF의 encodeWoff가 subsetToWoff와 같다 | - |

^t-packages-fonts-node-subset-test-ts

### [단위] `packages/fonts/src/advance-table.test.ts`

블록 글꼴의 글자 폭 표. Vitest · 테스트 5개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0512 | ADR-0034: 라틴 · 그리스 · 키릴 문자는 반각이다 | - |
| T-0513 | ADR-0034: 한글과 가나는 전각이다 | - |
| T-0514 | 02-layout 2.1: 글꼴에 없는 문자는 전각으로 센다 | - |
| T-0515 | 02-layout 2.1: 범위는 정렬되어 있고 겹치지 않는다 | - |
| T-0516 | 02-layout 2.1: 13px 글자 폭이 설계의 예와 맞는다 | - |

^t-packages-fonts-src-advance-table-test-ts

## 7. 성능

그리기의 시간 예산(벤치마크) → [[03-quality-attribute-scenarios]]. 파일 1개, 테스트 3개.

### [성능] `packages/core/src/render/render.bench.ts`

02-layout 4의 성능 예산. Vitest bench · 테스트 3개.

| ID | 테스트 | 확인하는 것 |
| --- | --- | :---: |
| T-0517 | 레이아웃과 장면 + SVG 글자가 편집 예산 100ms에 넉넉히 든다 | [[03-quality-attribute-scenarios#1. 목록\|QA-07]] |
| T-0518 | 레이아웃 | - |
| T-0519 | 장면 + SVG 글자 | - |

^t-packages-core-src-render-render-bench-ts

## 8. 테스트가 없는 ID

문서에 정의된 시나리오(`QA-`) · 인수 테스트(`AT-`) · 결함(`BUG-`) 가운데, 이름에 그 ID를 단 테스트가 없는 것입니다. 테스트 파일이 통째로 맡거나(영역 절의 "파일 전체가 확인하는 것"), 인수 테스트가 맡거나([[01-requirements#5.2 MVP의 인수 기준]]의 표), 테스트가 아닌 검사가 맡은 것은 그 길을 적습니다. “없음”은 사람이 점검표로 보거나 아직 테스트가 없는 빈 곳입니다.

| ID | 다른 길로 맡은 것 |
| --- | --- |
| [[03-quality-attribute-scenarios#1. 목록\|QA-03]] | 인수 테스트: [[01-requirements#^at\|AT-10]] |
| [[03-quality-attribute-scenarios#1. 목록\|QA-05]] | 없음 |
| [[03-quality-attribute-scenarios#1. 목록\|QA-06]] | 인수 테스트: [[01-requirements#^at\|AT-08]] |
| [[03-quality-attribute-scenarios#1. 목록\|QA-08]] | 없음 |
| [[03-quality-attribute-scenarios#1. 목록\|QA-10]] | 파일: `packages/editor/src/create-editor.test.ts`<br>검사: 의존 방향 검사 dependency-cruiser (`pnpm deps`) |
| [[03-quality-attribute-scenarios#1. 목록\|QA-11]] | 없음 |
| [[03-quality-attribute-scenarios#1. 목록\|QA-12]] | 검사: TypeScript의 완전성 검사 (`pnpm typecheck`) |
| [[03-quality-attribute-scenarios#1. 목록\|QA-13]] | 없음 |
| [[03-quality-attribute-scenarios#1. 목록\|QA-14]] | 검사: `core` · `fonts`의 `tsconfig`에 `dom`이 없음 (`pnpm typecheck`) |
| [[03-quality-attribute-scenarios#1. 목록\|QA-15]] | 인수 테스트: [[01-requirements#^at\|AT-04]] |
| [[03-quality-attribute-scenarios#1. 목록\|QA-16]] | 없음 |
| [[03-quality-attribute-scenarios#1. 목록\|QA-17]] | 인수 테스트: [[01-requirements#^at\|AT-07]] |
| [[defects#BUG-06\|BUG-06]] | 없음 |
