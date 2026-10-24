---
title: 편집기
tags:
  - design
status: 작성 중
updated: 2026-10-22
---

# 편집기 (`packages/editor`)

편집 화면과 사용자 입력 처리를 정의합니다. 주변 UI 컴포넌트(도구 모음, 메뉴, 설정 창, 대화창)는 React로 구현합니다. 다이어그램 영역, 선택 오버레이, 키 입력 처리, 텍스트 입력 요소는 React 밖의 TypeScript입니다 → [[0010-ui-framework|ADR-0010]]

## 관련 요구사항

- [[01-requirements#3.2 편집]]
- [[01-requirements#^lay-zoom]]
- [[01-requirements#^nfr-a11y]], [[01-requirements#^nfr-i18n]]

## 1. 화면 구성

> [!info] 미완성: 다이어그램 영역과 주변 UI
> - 다이어그램 영역: 렌더러가 만든 SVG를 렌더링 백엔드로 표시 → [[0030-swappable-drawing|ADR-0030]]
> - 도구 모음, 컨텍스트 메뉴, 텍스트 입력 요소
> - 줌, 팬(화면 이동)

## 2. 선택

> [!info] 미완성: 선택 상태와 자동 확장 → [[0008-contiguous-selection|ADR-0008]]
> - 선택의 표현: 블록 id로 적는다(아키텍처 → [[03-architecture#3.4 문서 모델]]). 같은 부모 아래 연속 범위 → [[0008-contiguous-selection|ADR-0008]]
> - 공통 조상까지 범위를 넓히는 자동 확장 알고리즘
> - 키보드 이동 규칙은 정함 → [[02-interaction-rules#키보드로 이동하고 넣기]]. 여기서는 그 구현

## 3. 편집 동작

> [!info] 미완성: 입력 이벤트 → 편집 명령 디스패치 → [[01-model#4. 편집 명령]]
> - 블록 삽입 위치 (앞/뒤/안쪽)
> - 감싸기 · 풀기 실행 흐름 (감싼 직후 조건 글자를 편집 상태로 둔다 → [[02-interaction-rules#감싸기 · 풀기]])
> - 드래그 앤 드롭: 드롭 가능한 위치(drop target) 계산. 규칙은 정하지 않음 → [[02-interaction-rules#7. 끌어 놓기]], 모습은 [[04-visual-design#7.1 상태 표]]
> - 클립보드 데이터 형식(MIME 타입과 직렬화)

## 4. 단축키

키 표는 [[03-keymap]]에 있습니다(2026-10-17에 UX 설계로 옮김). 이 문서는 키 이벤트를 명령으로 디스패치하는 구현을 맡습니다: 두 번 누르기(키 시퀀스)의 타임아웃, 한글 IME 상태에서 물리 키 위치(`KeyboardEvent.code`)로 읽기, 텍스트 입력 요소에 포커스가 있을 때는 Vim 키를 처리하지 않기.

## 5. 셸과의 연결

`editor`와 셸 사이의 인터페이스는 방향이 다른 두 쌍입니다 → [[03-architecture#3.2 editor와 셸의 인터페이스]]

| 방향 | 인터페이스 | 정의 | 구현 | 사용 | 결정 |
| --- | --- | --- | --- | --- | --- |
| 필요 인터페이스 (required, 포트) | `DocumentStore`, `SettingsStore` | `editor` | 셸 (어댑터) | `editor` | [[0031-shell-interfaces\|ADR-0031]] |
| 제공 인터페이스 (provided) | `CommandRegistry`, `SettingsSchema` | `editor` | `editor` | 셸 | [[0033-command-list-for-shells\|ADR-0033]] |

- **`DocumentStore`**: 이 문서 읽기 · 쓰기 · 다른 이름으로 쓰기, 다른 문서를 경로로 읽기(읽지 못하면 `null`). 셸이 구현해 시작할 때 주입한다.
- **`SettingsStore`**: 사용자 설정(UI 언어, 화면 색)의 읽기 · 쓰기. 셸이 구현해 주입한다.
- **`CommandRegistry`**: 명령마다 id, 표시 이름, 키 바인딩, 활성 여부와 실행 진입점. 셸이 자기 메뉴로 렌더링하거나 호스트 프로그램(Obsidian, VSCode, IntelliJ)의 확장 지점에 등록한다.
- **`SettingsSchema`**: 설정마다 id, 표시 이름, 허용 값. 셸이 설정 창으로 렌더링하거나 호스트의 설정 화면에 등록한다.
- 텍스트 폭은 셸이 주입하지 않는다. `core`가 번들 글꼴의 advance 폭 테이블로 계산한다 → [[0026-bundled-font-metrics|ADR-0026]]
- 화면 색의 밝기(라이트/다크)와 UI 글꼴은 호스트 플랫폼에서 받는다(Obsidian이면 Obsidian의 테마 밝기) → [[04-visual-design#8. 테마]]

> [!info] 미완성: 인터페이스의 메서드 시그니처
> 네 인터페이스의 메서드 시그니처(동기/비동기, 오류 표현, 변경 알림의 방식)와 레지스트리 항목의 타입은 정하지 않았습니다.

## 미결정 사항

- [ ]
