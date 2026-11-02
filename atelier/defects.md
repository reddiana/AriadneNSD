---
title: 결함 기록
tags:
  - plan
updated: 2026-11-03
---

# 결함 기록

> [!abstract] 이 문서는
> MVP를 써 보다 찾은 **결함**(버그와 품질 문제)의 기록입니다. 결함마다 `BUG-` 번호를 붙이고, 그 결함이 다시 생기지 않는지 보는 **회귀 테스트**의 이름 앞에 같은 번호를 적습니다(`BUG-01: …`). 테스트 목록([[08-test-list]])이 그 번호로 이 문서와 테스트를 잇습니다.
> - 번호는 불변이고 다시 쓰지 않습니다. 새 결함은 다음 번호를 받습니다.
> - 고친 결함도 지우지 않습니다. 언제 무엇이 깨졌고 무엇이 막고 있는지의 기록입니다.
> - 회귀 테스트가 없는 결함은 "회귀 테스트" 칸에 그 까닭을 적습니다. 테스트 목록의 "테스트가 없는 ID"에도 나옵니다.
> - 개발하다 테스트가 먼저 잡은 것(예: 인수 테스트를 만들며 고친 여섯, [[2026-11-01-01-confirmations-terms-mvp]])은 그 테스트가 이미 지키므로 여기에 적지 않습니다.

| ID | 찾은 날 | 증상 | 원인 | 고친 곳 | 회귀 테스트 | 상태 |
| --- | --- | --- | --- | --- | --- | --- |
| BUG-01 | 2026-11-01 | 브라우저 화면보다 큰 다이어그램에 스크롤바가 나오지 않음(메인테이너) | 화면 틀의 자리와 캔버스가 같은 클래스 `ans-canvas`를 써서 틀의 `overflow: hidden`이 캔버스에도 먹음 | [[2026-11-01-03-mvp-scroll-dropdown]] | E2E `examples.spec.ts` | 고침 |
| BUG-02 | 2026-11-01 | 툴바의 "예제 ▾" 등 드롭다운을 눌러도 아무것도 보이지 않음(메인테이너) | 툴바의 `overflow-x: auto`가 세로도 `auto`로 만들어 드롭다운이 툴바 안에 갇힘 | [[2026-11-01-03-mvp-scroll-dropdown]] | E2E `examples.spec.ts` | 고침 |
| BUG-03 | 2026-11-01 | Galaxy S26의 Chrome에서 한참을 기다려도 MVP 화면이 뜨지 않음(메인테이너) | 화면을 그리기 전에 IndexedDB를 여는데 시간 제한이 없음(원인 후보였고, 3초 제한을 넣은 뒤 S26에서 뜸) | [[2026-11-01-04-examples-button-android-load]] | E2E `boot.spec.ts` | 고침(S26에서 확인함) |
| BUG-04 | 2026-11-01 | S26의 툴바에 "예제" 버튼이 보이지 않음(메인테이너) | 툴바의 예제를 드롭다운에서 버튼으로 바꿀 때(EX4) "넓은 화면에서만" 클래스를 그대로 둠. E2E가 노트북 크기로만 봐서 못 잡음 | [[2026-11-01-04-examples-button-android-load]] | E2E `mobile.spec.ts` | 고침 |
| BUG-05 | 2026-11-02 | 메뉴 바의 메뉴를 마우스로 연 뒤 `Esc`를 눌러도 닫히지 않음(Claude, 사용법 그림을 찍다 발견) | 마우스로 열면 포커스가 메뉴 제목 버튼에 남는데, 그 버튼은 `↓`만 받고 `Esc`는 메뉴 안(드롭다운)에서만 받았음 | 메뉴가 열려 있는 동안 문서 어디서든 `Esc`로 닫음(`packages/editor/src/ui/menu-bar.tsx`의 `useCloseMenu`) | `BUG-05: Escape closes a menu opened with the mouse` (`apps/web/e2e/examples.spec.ts`) | 고침 |
| BUG-06 | 2026-11-03 | 설계 문서 사이트(`/about` 등)에서 왼쪽 위 AriadneNSD를 누르면 앱이 "불러오는 중…"에서 멈추고 왼쪽 목록이 되풀이됨(메인테이너) | Quartz의 SPA가 같은 사이트의 링크를 모두 가로채 받은 HTML의 본문만 갈아 끼움. 첫 화면이 앱이 된 뒤(DR-0021) 앱의 HTML이 문서 사이트 안에 끼워지고 앱의 스크립트는 돌지 않음 | `site/patch-quartz.mjs`: `/`, `/app/`, `/manual/`로 가는 링크는 SPA가 가로채지 않고 브라우저가 새로 불러옴 | 없음: 사이트 빌드(Quartz)에 붙은 것이라 앱의 E2E 밖. 로컬 사이트 빌드에서 제목을 눌러 앱이 뜨는 것을 확인함 | 고침 |
| BUG-07 | 2026-11-03 | 선택한 블록의 주황 테두리가 왼쪽 · 위보다 오른쪽 · 아래에서 안쪽으로 더 들어가 보임. 오른쪽 · 아래에는 블록의 파란 선이 바깥에 드러남(메인테이너) | 문서 그림은 1px 선을 또렷하게 하려고 반 픽셀 밀어 그려서([[04-visual-design]] 9.1) 상자의 오른쪽 · 아래 선이 상자 바깥 1px에 놓임. 오버레이의 테두리는 상자 안에만 그림 | `packages/editor/src/dom/overlay.ts`: 선택 · 호버 테두리가 그 1px까지 덮음 | `BUG-07: the selection outline covers the block lines equally on all four sides` (`dom/overlay.test.ts`) | 고침 |
| BUG-08 | 2026-11-03 | `a`를 눌러 키 힌트가 뜬 뒤 빈 곳을 클릭해도 힌트가 남음(메인테이너) | 기다리던 첫 키를 버리는 곳이 다른 키와 `Esc`뿐이었음 | `packages/editor/src/dom/canvas-view.ts`: 캔버스를 누르거나 포커스가 캔버스를 떠나면 버림 → [[ux-decisions#K4. 클릭하면 기다리던 키를 버린다\|K4]] | `BUG-08: a click on the empty canvas closes the key hint of a waiting a` (`e2e/canvas.spec.ts`) | 고침 |
