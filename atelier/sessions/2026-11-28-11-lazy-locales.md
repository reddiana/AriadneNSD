---
title: "2026-11-28 번들 크기: 화면 언어의 문구를 쓸 때 받기"
tags:
  - session
---

# 2026-11-28 번들 크기: 화면 언어의 문구를 쓸 때 받기

허브(세션 [[2026-11-28-10-wording-principles|10]] 뒤의 허브)가 연 서브 세션입니다. worktree 브랜치 `claude/lazy-locales-45736f`.

## 흐름

1. **원인.** CI의 번들 사이즈 체크가 첫 다운로드(gzip) 252.5 KB로 한도 250 KB를 넘음(커밋 `96fbbb8`). 빌드해 보니 `settings-store` 청크에 화면 문자열의 카탈로그 셋(엔진 · UI · 웹 셸)이 세 언어 모두 들어 있었음(소스 gzip 약 27 KB). 메인테이너가 고른 방향대로 한도를 올리지 않고 쓰는 언어의 것만 받기로.
2. **구현(`08afa89`).** `core`의 `lazyCatalog`: 영어 표는 번들에, 한국어 · 독일어 표는 동적 import. 받기 전에는 영어, 실패하면 다음에 다시. `loadLocale` · `loadAllLocales` · `isLocaleLoaded`. 웹 앱은 첫 화면 전에 받고(DB 열기와 함께), 언어를 바꾸면 받은 뒤 바꿈(그동안 앞 언어). 편집기도 같은 순서. 그림 글자의 카탈로그(`core`, 2 KB)는 동기 그대로라 스킬 · 내보내기 · 공유 링크는 그대로. 첫 다운로드 237.7 KB. 빌드한 앱에서 한국어 첫 화면 → 독일어로 바꾸기 → 새로고침을 확인.
3. **merge와 ADR.** 고르는 창으로 물음 → "merge하고 검사 · push", "ADR을 씀". 허브가 merge(`6b10a0a`).
4. **정리(`a69a993`).** [[0053-lazy-screen-language-catalogs|ADR-0053]](승인)과 목록, `01-architecture` 6장, `03-editor`, `06-web`(내려받는 때 · 시작 순서), `07-coding-guide` 8장.
5. **lint(`964b9d2`).** 전체 check의 루트 lint에서 prettier가 나눈 줄이 `no-unexpected-multiline`에 걸림. 패키지별 lint만 돌리고 prettier 뒤 다시 검사하지 않아 놓침.
6. **순환(`7dadd0d`).** depcruise `no-circular` 6건: ko · de 표가 `messages.ts`의 키 타입을 가져옴. 영어 표와 키 타입을 `messages.en.ts`로. 테스트 ID를 손으로 T-1620~1622로 매겼던 것을 `test-list --assign-ids`로 T-1613~1615로, co-change C10을 `messages*.ts`로. worktree에서 전체 `pnpm check` 통과.

## 결정

- 화면 언어의 문구는 영어만 첫 다운로드에, 다른 언어는 쓸 때 받는다 → [[0053-lazy-screen-language-catalogs|ADR-0053]]

## 배운 것 · 위험

- 테스트 ID는 손으로 매기지 않는다: 테스트 이름에 ID 없이 쓰고 `node scripts/test-list.mjs --assign-ids`.
- 서브 세션의 "바뀐 패키지 검사"는 루트 `pnpm lint`(eslint .)와 `pnpm deps`(depcruise)를 잡지 못한다. 모듈을 나누거나 import를 바꾸면 이 둘도 돌린다.
- worktree에는 gallery · skills의 node_modules가 없을 수 있다: 루트 lint 전에 `pnpm install --frozen-lockfile`.
- 영어가 아닌 사용자는 첫 화면 전에 요청 셋(약 9.6 KB)을 더 받는다. 받지 못하면 영어로 시작.

## 다음 할 일

- 테스트 목록 번역 3개(T-1613~1615): 마무리 때 `pnpm test-list:strict`.
