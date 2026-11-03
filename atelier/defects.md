---
title: 결함 기록
tags:
  - plan
updated: 2026-11-03
---

# 결함 기록

> [!abstract] 이 문서는
> MVP를 써 보다 찾은 **결함**(버그와 품질 문제)의 기록입니다. 결함마다 `BUG-` 번호를 붙이고, 그 결함이 다시 생기지 않는지 보는 **회귀 테스트**의 이름에 같은 번호를 적습니다(`T-0285 · BUG-01: …`, 앞의 `T-`는 테스트의 ID → [[dr-0022-test-ids|DR-0022]]). 테스트 목록([[08-test-list]])이 그 번호로 이 문서와 테스트를 잇습니다. 이 문서의 테스트 ID는 테스트 목록의 그 파일 표로 가는 링크입니다(사이트에서는 그 줄로 갑니다). 링크가 다른 표를 가리키면 테스트 목록 검사가 실패합니다.
> - 번호는 불변이고 다시 쓰지 않습니다. 새 결함은 다음 번호를 받습니다.
> - 고친 결함도 지우지 않습니다. 언제 무엇이 깨졌고 무엇이 막고 있는지의 기록입니다.
> - 표에는 ID · 찾은 날 · 증상 · 상태만 두고, 찾은 사람 · 원인 · 고친 곳 · 회귀 테스트는 표 아래 결함마다의 절에 적습니다.
> - 회귀 테스트가 없는 결함은 그 절에 까닭을 적습니다. 테스트 목록의 "테스트가 없는 ID"에도 나옵니다.
> - 개발하다 테스트가 먼저 잡은 것(예: 인수 테스트를 만들며 고친 여섯, [[2026-11-01-01-confirmations-terms-mvp]])은 그 테스트가 이미 지키므로 여기에 적지 않습니다.

| ID | 찾은 날 | 증상 | 상태 |
| --- | --- | --- | --- |
| [[#BUG-01\|BUG-01]] | 2026-11-01 | 브라우저 화면보다 큰 다이어그램에 스크롤바가 나오지 않음 | 고침 |
| [[#BUG-02\|BUG-02]] | 2026-11-01 | 툴바의 "예제 ▾" 등 드롭다운을 눌러도 아무것도 보이지 않음 | 고침 |
| [[#BUG-03\|BUG-03]] | 2026-11-01 | Galaxy S26의 Chrome에서 한참을 기다려도 MVP 화면이 뜨지 않음 | 고침(S26에서 확인함) |
| [[#BUG-04\|BUG-04]] | 2026-11-01 | S26의 툴바에 "예제" 버튼이 보이지 않음 | 고침 |
| [[#BUG-05\|BUG-05]] | 2026-11-02 | 메뉴 바의 메뉴를 마우스로 연 뒤 `Esc`를 눌러도 닫히지 않음 | 고침 |
| [[#BUG-06\|BUG-06]] | 2026-11-03 | 설계 문서 사이트에서 왼쪽 위 AriadneNSD를 누르면 앱이 "불러오는 중…"에서 멈춤 | 고침 |
| [[#BUG-07\|BUG-07]] | 2026-11-03 | 선택한 블록의 주황 테두리가 오른쪽 · 아래에서 안쪽으로 더 들어가 보임 | 고침 |
| [[#BUG-08\|BUG-08]] | 2026-11-03 | `a`를 눌러 키 힌트가 뜬 뒤 빈 곳을 클릭해도 힌트가 남음 | 고침 |
| [[#BUG-09\|BUG-09]] | 2026-11-03 | 블록이나 선택 영역을 드래그하면 지나간 블록들의 글자가 하이라이트됨 | 고침 |
| [[#BUG-10\|BUG-10]] | 2026-11-03 | 빈 default 칸에서 복사 · 잘라내기를 하면 "삭제할 default 분기가 없습니다"라고 알림 | 고침 |
| [[#BUG-11\|BUG-11]] | 2026-11-03 | 헤더에서 붙여넣기 · 감싸기 · 풀기를 하면 "먼저 블록을 선택하세요"라고 알림 | 고침 |
| [[#BUG-12\|BUG-12]] | 2026-11-03 | 분기 라벨 · 빈 default 칸에서 `Ctrl`+`←` `→`가 If · Case 블록에서 출발함(If의 오른쪽 라벨에서 `Ctrl`+`→`를 누르면 왼쪽 분기의 첫 블록으로 감) | 고침 |

## BUG-01

- **찾은 사람:** 메인테이너
- **원인:** 화면 틀의 자리와 캔버스가 같은 클래스 `ans-canvas`를 써서 틀의 `overflow: hidden`이 캔버스에도 먹음
- **고친 곳:** [[2026-11-01-03-mvp-scroll-dropdown]]
- **회귀 테스트:** [[08-test-list#^t-apps-web-e2e-examples-spec-ts|T-0285]] 창보다 큰 다이어그램은 캔버스 안에서 스크롤된다 (E2E, `apps/web/e2e/examples.spec.ts`)

## BUG-02

- **찾은 사람:** 메인테이너
- **원인:** 툴바의 `overflow-x: auto`가 세로도 `auto`로 만들어 드롭다운이 툴바 안에 갇힘
- **고친 곳:** [[2026-11-01-03-mvp-scroll-dropdown]]
- **회귀 테스트:** [[08-test-list#^t-apps-web-e2e-examples-spec-ts|T-0284]] 툴바의 드롭다운은 툴바 안이 아니라 캔버스 위에 열린다 (E2E, `apps/web/e2e/examples.spec.ts`)

## BUG-03

- **찾은 사람:** 메인테이너
- **원인:** 화면을 그리기 전에 IndexedDB를 여는데 시간 제한이 없음(원인 후보였고, 3초 제한을 넣은 뒤 S26에서 뜸)
- **고친 곳:** [[2026-11-01-04-examples-button-android-load]]
- **회귀 테스트:** (E2E, `apps/web/e2e/boot.spec.ts`)
	- [[08-test-list#^t-apps-web-e2e-boot-spec-ts|T-0278]] `indexedDB.open`이 끝내 답하지 않아도 편집기가 뜬다
	- [[08-test-list#^t-apps-web-e2e-boot-spec-ts|T-0279]] 시작하다 실패하면 시작 화면에 그 사실을 보인다

## BUG-04

- **찾은 사람:** 메인테이너
- **원인:** 툴바의 예제를 드롭다운에서 버튼으로 바꿀 때(EX4) "넓은 화면에서만" 클래스를 그대로 둠. E2E가 노트북 크기로만 봐서 못 잡음
- **고친 곳:** [[2026-11-01-04-examples-button-android-load]]
- **회귀 테스트:** [[08-test-list#^t-apps-web-e2e-mobile-spec-ts|T-0290]] 휴대폰의 툴바에 "예제"가 보이고, 탭하면 모달이 열린다 (E2E, `apps/web/e2e/mobile.spec.ts`)

## BUG-05

- **찾은 사람:** Claude(사용법 그림을 찍다 발견)
- **원인:** 마우스로 열면 포커스가 메뉴 제목 버튼에 남는데, 그 버튼은 `↓`만 받고 `Esc`는 메뉴 안(드롭다운)에서만 받았음
- **고친 곳:** 메뉴가 열려 있는 동안 문서 어디서든 `Esc`로 닫음(`packages/editor/src/ui/menu-bar.tsx`의 `useCloseMenu`)
- **회귀 테스트:** [[08-test-list#^t-apps-web-e2e-examples-spec-ts|T-0286]] 마우스로 연 메뉴를 `Esc`가 닫는다 (E2E, `apps/web/e2e/examples.spec.ts`)

## BUG-06

- **찾은 사람:** 메인테이너
- **증상의 자세한 모습:** 설계 문서 사이트(`/about` 등)에서 왼쪽 위 AriadneNSD를 누르면 앱이 "불러오는 중…"에서 멈추고 왼쪽 목록이 되풀이됨
- **원인:** Quartz의 SPA가 같은 사이트의 링크를 모두 가로채 받은 HTML의 본문만 갈아 끼움. 첫 화면이 앱이 된 뒤([[dr-0021-domain-and-front-page|DR-0021]]) 앱의 HTML이 문서 사이트 안에 끼워지고 앱의 스크립트는 돌지 않음
- **고친 곳:** `site/patch-quartz.mjs`: `/`, `/app/`, `/manual/`로 가는 링크는 SPA가 가로채지 않고 브라우저가 새로 불러옴
- **회귀 테스트:** 없음. 사이트 빌드(Quartz)에 붙은 것이라 앱의 E2E 밖. 로컬 사이트 빌드에서 제목을 눌러 앱이 뜨는 것을 확인함

## BUG-07

- **찾은 사람:** 메인테이너
- **증상의 자세한 모습:** 주황 테두리가 왼쪽 · 위보다 오른쪽 · 아래에서 안쪽으로 더 들어가 보이고, 오른쪽 · 아래에는 블록의 파란 선이 바깥에 드러남
- **원인:** 문서 그림은 1px 선을 또렷하게 하려고 반 픽셀 밀어 그려서([[04-visual-design]] 9.1) 상자의 오른쪽 · 아래 선이 상자 바깥 1px에 놓임. 오버레이의 테두리는 상자 안에만 그림
- **고친 곳:** `packages/editor/src/dom/overlay.ts`: 선택 · 호버 테두리가 그 1px까지 덮음
- **회귀 테스트:** [[08-test-list#^t-packages-editor-src-dom-overlay-test-ts|T-0229]] 선택 테두리가 블록의 선을 네 변 모두 똑같이 덮는다 (단위, `packages/editor/src/dom/overlay.test.ts`)

## BUG-08

- **찾은 사람:** 메인테이너
- **원인:** 기다리던 첫 키를 버리는 곳이 다른 키와 `Esc`뿐이었음
- **고친 곳:** `packages/editor/src/dom/canvas-view.ts`: 캔버스를 누르거나 포커스가 캔버스를 떠나면 버림 → [[ux-decisions#K4. 클릭하면 기다리던 키를 버린다|K4]]
- **회귀 테스트:** [[08-test-list#^t-apps-web-e2e-canvas-spec-ts|T-0203]] 빈 캔버스를 클릭하면 `a`를 기다리던 키 힌트가 닫힌다 (E2E, `apps/web/e2e/canvas.spec.ts`)

## BUG-09

- **찾은 사람:** 메인테이너
- **원인:** 그림의 글자(SVG `text`)가 브라우저의 글자 선택 대상이었음
- **고친 곳:** `packages/editor/src/dom/styles.ts`: 캔버스는 `user-select: none`, 인라인 에디터만 글자 선택
- **회귀 테스트:** [[08-test-list#^t-apps-web-e2e-canvas-spec-ts|T-0205]] 블록을 끌어도 그려진 글자가 선택되지 않는다 (E2E, `apps/web/e2e/canvas.spec.ts`)

## BUG-10

- **찾은 사람:** Claude(리팩토링 전의 테스트를 더하다 발견, [[2026-11-03-05-tests-before-refactoring]])
- **원인:** 복사 · 잘라내기 · 삭제가 공통 검사 `blocksOnly` 하나를 써서 빈 default 칸에서는 셋 모두 삭제의 문구가 나옴
- **고친 곳:** `packages/editor/src/commands/editor-commands.ts`: `blocksOnly`가 빈 default 칸의 문구를 명령마다 받음(복사 "빈 칸에는 복사할 블록이 없습니다.", 잘라내기 "빈 칸에는 잘라낼 블록이 없습니다."), 메시지 카탈로그(`packages/editor/src/i18n/messages.ts`)
- **회귀 테스트:** [[08-test-list#^t-packages-editor-src-commands-editor-commands-test-ts|T-0797]] 빈 default 칸에서 복사 · 잘라내기를 하면 삭제할 default가 없다가 아니라 거기에 블록이 없다고 알린다 (단위, `packages/editor/src/commands/editor-commands.test.ts`)

## BUG-11

- **찾은 사람:** Claude(리팩토링 전의 테스트를 더하다 발견, [[2026-11-03-05-tests-before-refactoring]])
- **증상의 자세한 모습:** 같은 헤더에서 복사 · 잘라내기는 "헤더에서는 되지 않습니다"라고 알리는데, 붙여넣기 · 감싸기 · 풀기는 선택한 것이 없다고 알림
- **원인:** 붙여넣기 · 감싸기 · 풀기의 `when`이 헤더를 따로 보지 않아 "선택 없음"의 문구로 떨어짐
- **고친 곳:** `packages/editor/src/commands/editor-commands.ts`: 헤더에서 붙여넣기는 "헤더에는 붙여넣을 수 없습니다.", 감싸기는 "헤더는 감쌀 수 없습니다.", 풀기는 "헤더에서는 되지 않습니다. 블록을 선택하세요."라고 알림, 메시지 카탈로그(`packages/editor/src/i18n/messages.ts`)
- **회귀 테스트:** [[08-test-list#^t-packages-editor-src-commands-editor-commands-test-ts|T-0798]] 헤더에서 붙여넣기 · 감싸기 · 풀기를 하면 선택한 것이 없다가 아니라 헤더라서 안 된다고 알린다 (단위, `packages/editor/src/commands/editor-commands.test.ts`)

## BUG-12

- **찾은 사람:** Claude(리팩토링 전의 테스트를 더하다 발견, [[2026-11-03-05-tests-before-refactoring]])
- **원인:** `Ctrl`+`←` `→`가 선택의 초점 블록(`focusBlock`)에서 출발해, 분기 라벨과 빈 default 칸에서는 그 If · Case 블록에서 출발함. If · Case 블록은 분기 밖이라 `Ctrl`+`→`가 `↓`처럼 움직여 첫 분기로 들어감
- **고친 곳:** `packages/editor/src/navigation/navigate.ts`: 분기 라벨은 그 분기 안, 빈 default 칸은 그 Case의 가장 오른쪽 칸으로 보고 옆 분기를 찾음. 그쪽에 없으면 한 겹 바깥 If · Case로 가고, 바깥에도 없으면 움직이지 않음
- **회귀 테스트:** [[08-test-list#^t-packages-editor-src-navigation-navigate-test-ts|T-0799]] 분기 라벨에서 `Ctrl`+`→`는 If · Case 블록에서 출발하지 않고 그 If · Case의 다음 분기로 간다 (단위, `packages/editor/src/navigation/navigate.test.ts`)
