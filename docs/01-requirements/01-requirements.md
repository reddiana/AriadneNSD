---
title: AriadneNSD 요구사항 명세
aliases:
  - AriadneNSD 요구사항
  - 요구사항
tags:
  - ariadne-nsd
  - requirements
status: 초안
updated: 2026-10-14
---

# AriadneNSD 요구사항 명세

NS 차트(Nassi-Shneiderman Diagram)를 그리는 프로그램의 요구사항입니다. 이 문서는 **무엇을** 만드는지만 다룹니다. 요구사항 하나는 한두 줄입니다.
그 기능이 **사용자에게 어떻게 보이고 어떤 규칙으로 움직이는지**는 UX 설계([[02-ux-design]], [[01-interaction-rules]])에, **왜** 그렇게 정했는지는 [[atelier/README#아키텍처 결정 기록 (ADR)|ADR]]에, **어떻게** 만드는지는 [[03-architecture]]와 상세 설계 문서에 있습니다.

> [!info] 읽는 법
> - 우선순위 태그: #P0 = MVP 필수 · #P1 = 1차 확장 · #P2 = 나중에 · #P3 = 출시 뒤
> - 태그를 클릭하면 해당 우선순위 항목만 모아 볼 수 있습니다.
> - 각 요구사항은 체크박스입니다. 구현이 끝나면 체크해서 진행 상황을 관리하세요.
> - 요구사항 끝의 "→ 상세"는 그 기능의 세부 규칙이 적힌 설계 문서로 갑니다. 2026-10-12까지는 세부 규칙도 이 문서에 있었습니다.
> - 각 요구사항 끝의 `^id`는 블록 ID입니다. 다른 문서에서 `[[01-requirements#^edit-wrap]]`처럼 해당 항목을 직접 가리킬 수 있습니다.

## 1. 핵심 원칙

- NS 차트는 **트리 구조**다. 이 프로그램은 도형을 자유롭게 배치하는 그림판이 아니라, **구조를 편집하면 그림이 자동으로 그려지는 편집기**다. 사용자는 좌표를 직접 다루지 않는다. → [[0004-structure-editor|ADR-0004]]
- 구조적으로 잘못된 차트(예: 반복문 밖으로 튀어나온 블록)는 만들 수 없어야 한다.
- **주 사용자는 실무에서 설계 문서를 쓰는 사람이다.** 코드와 함께 두는 문서, PDF와 인쇄의 품질을 앞에 둔다. 교육용 기능(실행 애니메이션 등)은 그 뒤다.
- **저장 파일 하나가 그림이자 원본이다.** 파일은 어디서나 열리는 SVG 이미지이고, 그 안에 다이어그램 모델이 함께 들어 있어 다시 열어 편집할 수 있다. → [[0005-model-embedded-svg|ADR-0005]]

## 2. 배포 대상

먼저 만드는 것은 웹 · Obsidian 플러그인 · 데스크톱 셋이다. 그 위에 얹거나 뒤에 붙는 대상이 넷 더 있다. → [[0002-three-targets-shared-core|ADR-0002]], [[0006-file-extensions|ADR-0006]], 만드는 순서는 [[0011-development-order|ADR-0011]]

| 배포 대상 | 언제 | 값 | 저장하는 것 | 절 |
| --- | --- | --- | --- | --- |
| 웹 (정적 페이지) | 처음 (MVP) | 무료 | `.ns` | [[#2.3 웹 (정적 페이지)\|2.3]] |
| Obsidian 플러그인 | 처음 | 무료 | `.ns.svg` | [[#2.1 Obsidian 플러그인\|2.1]] |
| 데스크톱 애플리케이션 | 처음 | 무료 | `.ns` | [[#2.2 데스크톱 애플리케이션\|2.2]] |
| Google Drive | 웹 위에 얹음 (#P1) | 무료 | `.ns.svg` | [[#2.4 Google Drive\|2.4]] |
| Confluence | 나중에 (#P2) | 유료 | 페이지 안의 다이어그램 | [[#2.5 Confluence (유료, 나중에)\|2.5]] |
| IDE 플러그인 (VSCode, IntelliJ) | 나중에 (#P2) | 무료 | 소스 코드 (코드가 원본) | [[#2.7 IDE 플러그인 (나중에)\|2.7]] |
| Claude skill | 나중에 (#P3) | 무료 | `.ns.svg`와 공유 URL | [[#2.6 Claude skill (나중에)\|2.6]] |

`.ns`와 `.ns.svg`의 파일 내용은 **동일한 형식**(다이어그램 모델이 포함된 SVG)이다. 뒤에 `.svg`를 붙이거나 떼는 것만으로 서로 열 수 있다.

모든 무료 배포 대상에 공통:

- [ ] #P3 후원 링크(Buy Me a Coffee): 편집을 방해하지 않는 자리에 둔다 ^all-donate
	- 웹: 광고([[#^web-ads]])와 같은 때(저장·내보내기·공유) 함께 보인다
	- Obsidian: 플러그인 manifest의 `fundingUrl`에 적는다 (커뮤니티 플러그인 화면에 후원 버튼이 보인다)
	- 데스크톱: 도움말·정보 창에 둔다

### 2.1 Obsidian 플러그인

사용 흐름은 drawio-obsidian 플러그인과 같다. 노트에서 바로 다이어그램을 넣고, 넣은 그림에서 바로 편집한다.

```mermaid
flowchart LR
    A["노트 편집 중<br/>우클릭"] -->|Insert new NS diagram| B["NS 편집 탭 열림<br/>(새 .ns.svg 파일)"]
    B -->|편집 후 탭 닫기| C["노트의 커서 위치에<br/>![[이름.ns.svg]] 삽입"]
    C -->|삽입된 그림 우클릭<br/>Edit NS diagram| D["NS 편집 탭 열림"]
    D -->|편집 후 탭 닫기| E["노트의 그림이<br/>새 내용으로 갱신"]
```

**노트에서 넣기 · 편집하기**

- [ ] #P0 노트 편집 화면의 우클릭 메뉴에 **"Insert new NS diagram"** 항목 ^obs-insert
	- 누르면 새 `.ns.svg` 파일을 만들고 NS 편집 탭을 연다.
	- 편집을 마치고 탭을 닫으면, 우클릭했던 노트의 커서 위치에 `![[이름.ns.svg]]`를 삽입한다.
- [ ] #P0 노트에 삽입된 NS 다이어그램 그림의 우클릭 메뉴에 **"Edit NS diagram"** 항목 ^obs-edit-embed
	- 누르면 해당 파일을 NS 편집 탭으로 연다.
	- 저장하면 노트에 보이는 그림도 새 내용으로 갱신된다.
- [ ] #P0 같은 기능을 명령 팔레트에서도 실행 ("Insert new NS diagram") ^obs-insert-command
- [ ] #P0 편집을 마치면, 그 그림을 넣은 노트가 이미 열려 있어도 다시 열지 않고 새 그림으로 보인다. 같은 그림을 넣은 다른 열린 노트도 마찬가지다. ^obs-refresh

**파일 다루기**

- [ ] #P0 파일 이름이 `.ns.svg`로 끝나는 파일을 파일 탐색기에서 열면 NS 편집 탭으로 열기 ^obs-open
- [ ] #P0 그 밖의 일반 `.svg` 파일은 건드리지 않고 Obsidian 기본 동작으로 열기 ^obs-plain-svg
- [ ] #P0 노트에 삽입된 `![[이름.ns.svg]]`는 플러그인이 없어도 그림으로 보임 ^obs-embed
- [ ] #P1 파일 탐색기 우클릭 메뉴에서 새 NS 다이어그램 만들기 (노트에 삽입하지 않음) ^obs-new
- [ ] #P1 이름 변경으로 `.ns`가 빠졌지만 모델이 들어 있는 `.svg` 파일은 내용으로 감지해서 "Edit NS diagram" 메뉴 제공 ^obs-detect

**화면**

- [ ] #P1 Obsidian 라이트/다크 테마에 맞춰 편집 화면 표시 (저장되는 그림의 색은 편집 화면의 밝기를 따르지 않는다 → [[#^fmt-color]]) ^obs-theme

> [!question] 정해야 할 세부 사항
> 새 파일의 이름과 저장 위치, 아무것도 그리지 않고 탭을 닫았을 때, 편집 중 저장 시점은 설계에서 정한다 → [[04-obsidian-plugin#미결정 사항]]

### 2.2 데스크톱 애플리케이션

- [ ] #P0 `.ns` 파일 열기/저장/다른 이름으로 저장 ^dsk-file
- [ ] #P1 `.ns.svg` 파일도 열기 (Obsidian 볼트의 파일을 직접 편집) ^dsk-open-nssvg
- [ ] #P1 OS 파일 연결: `.ns` 더블클릭 시 앱으로 열기 ^dsk-assoc
- [ ] #P1 여러 창 또는 탭으로 동시에 여러 파일 편집 ^dsk-multi
- [ ] #P2 자동 업데이트 ^dsk-update

### 2.3 웹 (정적 페이지)

- [ ] #P0 서버 없이 정적 호스팅만으로 동작 (GitHub Pages 등) ^web-static
- [ ] #P0 로컬 `.ns` 파일 열기/저장 (`.ns.svg`도 열기 가능) ^web-file
	- 지원 브라우저(Chromium 계열)에서는 원래 파일에 덮어쓰기
	- 미지원 브라우저에서는 파일 업로드와 다운로드로 대체
- [ ] #P1 작성 중인 내용 브라우저 저장소에 임시 보관 (새로고침해도 복구) ^web-draft
- [ ] #P2 PWA (오프라인 사용, 설치) ^web-pwa
- [ ] #P1 공유 URL: 다이어그램 전체를 압축해 URL에 담고, 링크만으로 연다. 서버가 필요 없다 ^web-share-url
	- 아주 큰 다이어그램은 URL 길이 한계에 걸린다. 그때는 파일로 공유하라고 안내한다.
- [ ] #P1 보기 모드: 편집 화면 없이 그림만 보여 준다. 공유 URL을 열면 이 모드로 시작하고, 버튼 하나로 편집 모드로 바꾼다 ^web-view-mode
- [ ] #P3 AI 대화창: 말로 다이어그램을 만들거나 고친다. 예: "퀵소트를 그려 주세요", "반복되는 부분을 Method로 빼 주세요". 서버가 없으므로 사용자가 자기 API 키(Claude, ChatGPT, Grok)를 넣고, 키는 그 브라우저에만 보관한다 ^web-ai-chat
- [ ] #P3 광고: 편집 화면을 가리거나 좁히지 않는다. 저장·내보내기·공유 URL을 만들 때만 보인다 ^web-ads
	- 정확한 자리는 광고 네트워크 정책을 확인해 정한다 → [[#6. 미결정 사항]]
- 참고 모델: [SequenceDiagram.org](https://sequencediagram.org/) (공유 URL, 저장 장소 선택, 보기 모드, 도움말)

### 2.4 Google Drive

웹 버전에 Drive 연동을 더한 형태다. Drive에서 만드는 파일은 `.ns.svg`로 저장한다. → [[0012-google-drive-integration|ADR-0012]], [[0014-drive-file-extension|ADR-0014]]

- [ ] #P1 Drive에서 NS 파일을 우클릭해 "AriadneNSD로 열기"로 편집 ^gd-open-with
- [ ] #P1 Drive의 "새로 만들기" 메뉴에서 새 NS 다이어그램 만들기 ^gd-new
- [ ] #P1 편집한 내용을 Drive의 원래 파일에 저장 ^gd-save
- [ ] #P1 Drive 미리보기와 썸네일에서 다이어그램 그림이 보임 ^gd-preview

### 2.5 Confluence (유료, 나중에)

다른 배포 대상은 모두 무료이고, 이 대상은 유료로 판다. 기능은 무료 버전과 같고, Confluence 안에서 바로 쓸 수 있다는 편의로 가치를 낸다.

- [ ] #P2 Confluence 페이지에 NS 다이어그램을 넣고, 페이지 안에서 편집 ^cf-app
	- Atlassian Marketplace에는 새 앱을 Forge로만 올릴 수 있다. Forge 앱은 Confluence 안의 iframe에 웹 화면을 띄우므로 웹 버전과 구조가 거의 같다.
	- 아키텍처는 네 번째 배포 대상이 붙을 자리를 남겨 둔다.

### 2.6 Claude skill (나중에)

Claude에게 알고리즘을 물으면 Claude가 NS 다이어그램으로 그려 준다. 예: "퀵소트를 설명해 줘".

- [ ] #P3 Claude skill: 설명할 알고리즘을 NS 모델로 만들어 `.ns.svg` 파일과 공유 URL([[#^web-share-url]])을 함께 내놓는다. 파일은 AriadneNSD에서 그대로 열어 고칠 수 있다 ^skill-claude

### 2.7 IDE 플러그인 (나중에)

코드를 짜는 자리에서 그 코드를 NS 다이어그램으로 보고 고친다. **코드가 원본이다.** 다이어그램은 코드에서 만들어 보여 주는 것이고, 다이어그램을 고치면 코드가 바뀐다. `.ns` 파일은 만들지 않는다. 그림이 필요하면 내보내기로 뽑는다.

- [ ] #P2 VSCode 플러그인 ^ide-vscode
- [ ] #P2 IntelliJ 플러그인 (VSCode 다음) ^ide-intellij
- [ ] #P2 리버스 엔지니어링: 열어 둔 소스 코드를 다이어그램으로 보여 준다 → [[#^code-parse]] ^ide-reverse
- [ ] #P2 코드 생성: 다이어그램을 코드로 만든다 → [[#^code-gen]] ^ide-codegen
- [ ] #P2 접기 영역은 코드의 영역 주석(`region` … `endregion`)으로 남긴다. 접힘 상태는 코드에 적지 않고 IDE가 그 컴퓨터에 기억한다 ^ide-fold-region
- [ ] #P3 양방향 실시간 반영: 코드를 고치면 다이어그램이, 다이어그램을 고치면 코드가 바로 따라 바뀐다 ^ide-live-sync

## 3. 기능 요구사항

### 3.1 블록 종류

DIN 66261 / 원 논문 기준입니다.

| 블록 | 설명 | 우선순위 |
| --- | --- | --- |
| 처리 (Process) | 한 단계의 명령 | #P0 |
| 선택 (If-Then-Else) | 조건에 따라 참 갈래나 거짓 갈래를 실행 | #P0 |
| 전위 판정 반복 (While) | 조건을 먼저 검사하고 본문을 반복 | #P0 |
| 후위 판정 반복 (Do-While / Repeat-Until) | 본문을 먼저 실행하고 조건을 검사 | #P0 |
| 다중 선택 (Switch/Case) | 여러 갈래 + default (아래 [[#^blk-case]]) | #P1 |
| 횟수 반복 (For) | While의 변형 | #P1 |
| 호출 (Call) | 같은 문서의 Method를 부른다 (아래 [[#^blk-call]]) | #P1 |
| 탈출 (Exit / Break / Return) | 반복·함수 탈출 | #P2 |
| 병렬 처리 (Parallel) | 동시 실행 갈래 | #P2 |
| 주석 블록 |  | #P2 |

블록과 머리를 어떤 모양으로 그리는지는 설계에 있다 → [[01-interaction-rules#블록의 모양]]

- [ ] #P1 Event 머리(이벤트 머리): 다이어그램 맨 위에 "버튼을 누르면", "타이머가 끝나면" 같은 이벤트를 다는 머리. NS 차트 표준에는 없고 [Scratch](https://scratch.mit.edu/)에서 가져온 표기다 → [[01-interaction-rules#Event 머리|상세]] ^blk-event
- [ ] #P1 다중 선택(Case) 블록: 조건 하나에 갈래 여러 개와 default 갈래 → [[01-interaction-rules#Case 블록|상세]] ^blk-case
- [ ] #P1 Method 머리: 호출 블록이 부르는 다이어그램(Method, Sub process)의 머리. Event 머리와 다른 모양으로 그려 가른다 (→ [[0021-event-and-method|ADR-0021]]) → [[01-interaction-rules#Method 머리|상세]] ^blk-method
- [ ] #P1 호출 블록: 같은 문서의 Method를 부른다. NS 차트 표준의 서브루틴 호출 표기로 그린다 → [[01-interaction-rules#호출 블록|상세]] ^blk-call

### 3.2 편집

- [ ] #P0 블록 선택, 추가(선택 블록의 앞/뒤/안쪽), 삭제, 텍스트 수정(더블클릭 또는 F2) ^edit-basic
- [ ] #P0 실행 취소 / 다시 실행 (Undo/Redo) ^edit-undo
- [ ] #P0 키보드만으로 편집 가능: 방향키로 이동, 단축키로 블록 삽입 → [[01-interaction-rules#키보드로 이동하고 넣기|상세]] ^edit-keyboard
- [ ] #P0 여러 블록 선택 (아래 [[#여러 블록 선택 규칙]]) ^edit-multiselect
- [ ] #P1 선택한 블록들을 제어 블록으로 감싸기 (아래 [[#감싸기 · 풀기]]) ^edit-wrap
- [ ] #P1 제어 블록 풀기: 제어 블록만 지우고 안의 블록은 그 자리에 남기기 ^edit-unwrap
- [ ] #P1 호출 블록 풀기: 호출 블록을 부르는 Method의 블록들로 바꾼다 (Method로 빼기의 반대) → [[01-interaction-rules#감싸기 · 풀기|상세]] ^edit-call-inline
- [ ] #P1 드래그 앤 드롭으로 블록 하나 또는 선택한 블록들을 통째로 이동 (놓을 수 있는 자리 미리 강조) ^edit-dnd
- [ ] #P1 복사 / 잘라내기 / 붙여넣기 (하위 트리 통째로) → [[01-interaction-rules#붙여넣기|상세]] ^edit-clipboard
- [ ] #P1 If 블록의 참/거짓 갈래 바꾸기, Case 갈래 추가·삭제·순서 바꾸기 → [[01-interaction-rules#갈래 순서 바꾸기|상세]] ^edit-branch
- [ ] #P1 제어 블록 접기/펼치기: 제어 블록의 안쪽을 접는다. If·Case는 갈래별로 (아래 [[#접기 · 펼치기]]) ^edit-fold
- [ ] #P1 접기 영역: 선택 영역을 접기 영역으로 만들어 접고 펼친다 (아래 [[#접기 · 펼치기]]) ^edit-fold-range
- [ ] #P1 호출 블록 펴 보기: 호출 블록을 펴면 부르는 Method의 블록들이 그 자리에 보인다. 보기만 바뀌고 다이어그램의 내용은 바뀌지 않는다 → [[01-interaction-rules#호출 블록 펴 보기|상세]] ^edit-call-open
- [ ] #P1 펴 보인 곳의 접기 영역: 펴 보인 호출 블록 안에서 접기 영역을 만든다. 그 호출 블록 자리에만 있고 Method의 원본은 바뀌지 않는다 → [[01-interaction-rules#펴 보인 곳의 접기 영역|상세]] ^edit-fold-site
- [ ] #P2 모두 접기 / 모두 펼치기 / 깊이 n까지 펼치기 ^edit-fold-all
- [ ] #P1 한 문서에 여러 다이어그램: Event(이벤트 처리기)와 Method 여러 개를 한 화면에 나란히 둔다 → [[01-interaction-rules#5. 여러 다이어그램의 배치|상세]] ^edit-multi-diagram
- [ ] #P1 고른 블록들을 새 Method로 빼기: 고른 블록들이 새 Method 다이어그램이 되고, 그 자리에는 그 Method를 부르는 호출 블록([[#^blk-call]])이 남는다 → [[01-interaction-rules#새 Method로 빼기와 새 다이어그램|상세]] ^edit-extract
- [ ] #P2 자주 쓰는 블록 묶음: 자주 쓰는 블록을 저장해 두고 끌어다 쓴다 (Scratch의 하드웨어 전용 블록 묶음처럼) ^edit-snippets
- [ ] #P1 도움말: 사용법과 단축키 안내 (모든 배포 대상) ^help

#### 여러 블록 선택 규칙

→ [[0008-contiguous-selection|ADR-0008]]

선택은 항상 **같은 부모 아래에서 연속으로 붙어 있는 블록 범위**다.

세부 규칙(마우스와 키보드로 고르는 법, 자동 확장의 예): [[01-interaction-rules#여러 블록 선택]]

#### 감싸기 · 풀기

선택한 블록들을 새 제어 블록 안에 넣는다 (IDE의 "Surround With"와 같은 기능).

세부 규칙(감싸는 블록마다 들어가는 곳, 풀기, 실행 취소): [[01-interaction-rules#감싸기 · 풀기]]

#### 접기 · 펼치기

접히는 것은 두 가지다: **제어 블록의 안쪽**([[#^edit-fold]])과 **접기 영역**([[#^edit-fold-range]]). 접기 영역에는 이름을 붙일 수 있고, 접힘 상태와 이름은 파일에 함께 저장한다. 저장되는 그림은 지금 화면 그대로다. → [[0017-fold-name-in-model|ADR-0017]], [[0018-save-as-shown|ADR-0018]]

세부 규칙(명령 셋, 접기 · 펴기가 듣는 곳, 이름, 펴진 모습, 실행 취소): [[01-interaction-rules#접기 · 펼치기]]

### 3.3 레이아웃 · 렌더링

- [ ] #P0 텍스트 길이에 따라 블록 너비·높이 자동 조정, 여러 줄 텍스트 지원 ^lay-autosize
- [ ] #P0 갈래 너비 자동 분배 (어느 갈래가 깊어져도 전체 직사각형 유지) ^lay-branch-width
- [ ] #P0 확대/축소, 화면 이동 ^lay-zoom
- [ ] #P1 한글/영문 혼용 텍스트의 정확한 폭 측정 ^lay-text-measure
- [ ] #P0 기본 스타일: 옅은 단색 바탕, 가는 선, 반복·분기·호출의 머리에 옅은 색조 → [[0013-default-visual-style|ADR-0013]] ^lay-default-style
- [ ] #P1 블록 글자의 종류를 문서마다 하나 고른다: 문장 / C / Java / Python / Bash 등 ^lay-text-kind
- [ ] #P1 블록 글자의 구문 강조 (키워드, 주석을 다른 색으로). 고른 종류([[#^lay-text-kind]])의 문법을 따르고, 문장이면 강조하지 않는다 ^lay-syntax
- [ ] #P1 테마: 글꼴, 선 굵기, 블록 종류별 색, 접기 영역의 테두리와 이름 띠의 색, 펴 보인 호출 블록의 점선과 띠의 색, 글자 색, 흑백 인쇄 모드. 테마를 바꿔도 레이아웃은 그대로 ^lay-theme
- [ ] #P2 블록별 배경색 지정 ^lay-bgcolor

### 3.4 파일 형식

세부 명세는 [[01-file-format]]에 있다. → [[0005-model-embedded-svg|ADR-0005]], [[0007-json-serialization|ADR-0007]]

- [ ] #P0 저장 파일은 **유효한 SVG 1.1 문서**이며, 브라우저·이미지 뷰어·Obsidian·문서 도구에서 그대로 그림으로 보인다. ^fmt-svg
- [ ] #P0 다이어그램 모델은 SVG 안에 **JSON**으로 들어 있고, 형식 버전을 포함한다. 이전 버전 파일은 불러올 때 자동 변환한다. ^fmt-model
- [ ] #P0 같은 모델이면 항상 같은 파일 내용이 나온다. ^fmt-deterministic
- [ ] #P0 블록 텍스트에 어떤 문자가 들어가도(`]]>` 포함) 파일이 깨지지 않는다. ^fmt-escape
- [ ] #P0 열 때는 모델만 읽고, 저장할 때마다 그림 부분을 모델에서 새로 생성한다. ^fmt-model-source
- [ ] #P0 모델이 없거나 손상된 SVG를 열면 편집 불가 안내를 표시한다 (그림을 역해석하지 않음). ^fmt-invalid
- [ ] #P0 그림 속 텍스트는 텍스트로 남긴다. 편집기에 번들한 글꼴에서 쓰인 글자만 추려 파일에 함께 넣어, 그 글꼴이 없는 곳에서도 글자가 칸에 맞게 한다. 대체 글꼴 목록도 지정한다. → [[0026-bundled-font-metrics|ADR-0026]] ^fmt-text
- [ ] #P0 저장되는 그림의 색은 문서의 색이다. 편집 화면이 어두워도, 보는 곳이 어두워도 같은 색으로 저장되고 보인다. ^fmt-color
- [ ] #P1 다른 도구로 그림 부분만 고친 파일을 열면, 그림이 모델과 달라졌음을 알린다. 저장하면 그 변경이 사라진다는 것도 함께 알린다. ^fmt-external-edit
- [ ] #P1 다른 뷰어에서도 글꼴이 똑같이 보이도록 텍스트를 외곽선(path)으로 바꿔 저장하는 옵션 (모델에는 텍스트가 그대로 남음) ^fmt-outline

> [!warning] 모델이 원본
> 다른 도구(Inkscape 등)로 그림 부분만 고친 내용은 다시 열면 사라집니다. 대신 편집기가 이를 알려 줍니다([[#^fmt-external-edit]]).

### 3.5 내보내기 · 가져오기

- [ ] #P0 PNG 내보내기 (배율 선택) ^exp-png
- [ ] #P1 모델을 제거한 순수 SVG 내보내기 (외부 공유용) ^exp-plain-svg
- [ ] #P1 PDF 내보내기, 인쇄 (큰 다이어그램은 여러 페이지로 분할) ^exp-pdf
- [ ] #P1 자동 저장, 최근 파일 목록 (데스크톱·웹) ^exp-autosave
- [ ] #P2 Structorizer `.nsd` 파일 가져오기 ^imp-structorizer

### 3.6 코드 연동

> [!note] 후순위
> 코드 연동은 편집기 기본 기능이 안정된 뒤에 진행합니다. 모든 항목이 #P2 입니다.

- [ ] #P2 의사코드 텍스트 → 차트 변환 (들여쓰기 기반의 간단한 DSL, 텍스트와 차트 양방향 동기화) ^code-dsl
- [ ] #P2 차트 → 코드 생성 (C, Python, Java 등) ^code-gen
- [ ] #P2 소스 코드 → 차트 (파서 필요) ^code-parse
- [ ] #P2 단계별 실행 애니메이션 (교육용) ^code-anim

### 3.7 문제 알리기

사용자가 문제를 쉽게, 그리고 메인테이너가 다시 일으켜 볼 수 있을 만큼 정확하게 알린다. 서버가 없으므로 자동으로 보내지 않는다. 사용자가 보낼 내용을 보고 직접 보낸다.

- [ ] #P3 문제 알리기: 보고서를 만들어 보낸다. 착각이나 어설픈 보고가 이슈 목록에 쌓이지 않게 한다 → [[01-interaction-rules#6. 문제 알리기 보고서|상세]] ^rep-issue
- [ ] #P3 예상 못 한 오류가 나면 "이 문제를 알리시겠어요?"를 묻는다 ^rep-prompt

## 4. 비기능 요구사항

- **정합성:** 어떤 편집 연산을 거쳐도 트리는 항상 유효해야 한다 (빈 갈래는 빈 처리 블록으로 자동 채움). ^nfr-integrity
- **호환성:** 세 배포 대상이 만든 파일은 서로 열 수 있어야 한다. 같은 모델이면 같은 SVG를 생성해야 한다 (불필요한 git diff 방지). ^nfr-compat
- **성능:** 블록 500개 규모에서 편집 반응 100ms 이내. ^nfr-perf
- **다국어:** 화면의 글자(UI)는 여러 언어를 지원한다. 기본은 영어이고 한국어를 지원한다. 언어는 설정에서 고른다. 편집기가 그림에 적는 글자(If의 "참" · "거짓", 접힌 줄의 "블록 n개", 새 머리의 기본 이름)는 저장할 때의 언어를 따른다. 텍스트는 UTF-8. ^nfr-i18n
- **접근성:** 키보드 전용 조작, 고대비 테마. ^nfr-a11y
- **테스트 가능성:** 모델·레이아웃·렌더러를 분리해서 레이아웃 계산을 단위 테스트할 수 있어야 한다. ^nfr-test

## 5. MVP 범위

#P0 항목만 모은 범위입니다.

- 블록 4종: 처리, If, While, Do-While
- 키보드/마우스 편집 + Undo/Redo
- 여러 블록 선택 (연속 범위, 자동 확장)
- 자동 레이아웃
- 모델 내장 SVG 저장/불러오기
- PNG 내보내기
- 배포 대상: 웹 ([[0011-development-order|ADR-0011]]에서 정한 첫 번째 대상)

## 6. 미결정 사항

요구사항 관련 미결정 사항입니다. 아키텍처 관련 미결정 사항은 "제안됨" 상태의 ADR로 관리합니다. → [[atelier/README#아키텍처 결정 기록 (ADR)|ADR 목록]]

- [ ] **블록 글자의 종류:** 처음에 지원할 종류의 목록 → [[#^lay-text-kind]]
- [ ] **번들하는 글꼴:** 어느 글꼴을 싣는지, 코드에 고정폭 글꼴을 쓰는지, 한글을 모두 싣는지 → [[0026-bundled-font-metrics|ADR-0026]]
- [ ] **Event를 일으키는 블록:** 호출 블록은 Method만 부른다([[0021-event-and-method|ADR-0021]]). 다이어그램 안에서 다른 Event를 일으키는 일(신호 보내기)을 그릴 블록이 따로 필요한지 → [[#^blk-call]]
- [ ] **IDE 플러그인이 다루는 언어와 왕복:** 처음에 지원할 언어의 목록. 코드에는 있고 NS 다이어그램에는 없는 것(주석, 선언, 예외 처리, `break` · `continue`)을 다이어그램에 어떻게 보이고, 다이어그램을 고친 뒤에도 코드에 어떻게 남기는지 → [[#2.7 IDE 플러그인 (나중에)]]
- [ ] **AI 대화창의 키 보관:** 브라우저 저장소에 둔 API 키는 같은 페이지에서 도는 다른 스크립트(광고 [[#^web-ads]])가 읽을 수 있다. 광고와 한 페이지에 두어도 되는지, 탭을 닫으면 잊는 보관을 고를 수 있게 할지 → [[#^web-ai-chat]]
- [ ] **쓰이지 않는 Method:** 아무도 부르지 않는 Method를 화면에서 알려 줄지 → [[#^blk-method]]


- [ ] **웹 광고의 자리:** 광고 네트워크(예: Google AdSense)는 팝업·대화 상자 안의 광고를 정책으로 막는 경우가 많다. 저장·내보내기·공유 때만 보이게 하는 방식([[#^web-ads]])이 허용되는지 네트워크를 고를 때 확인한다.

## 참고 자료

- [Wikipedia: Nassi–Shneiderman diagram](https://en.wikipedia.org/wiki/Nassi%E2%80%93Shneiderman_diagram)
- [Wikipedia (독일어): Nassi-Shneiderman-Diagramm](https://de.wikipedia.org/wiki/Nassi-Shneiderman-Diagramm) — DIN 66261 기호 규칙
- [Ben Shneiderman의 NSD 페이지](https://www.cs.umd.edu/hcil/members/bshneiderman/nsd/)
- [Structorizer](https://structorizer.fisch.lu) — 오픈소스 NS 차트 편집기, `.nsd` 확장자 사용
- [drawio-obsidian](https://github.com/zapthedingbat/drawio-obsidian) — 모델 내장 SVG 저장 방식, Obsidian 노트에 그림을 넣고 편집하는 방식([[#2.1 Obsidian 플러그인]]) 참고. 편집 후 노트가 갱신되지 않는 점은 따르지 않는다([[#^obs-refresh]]).
- [Scratch](https://scratch.mit.edu/) — 이벤트 머리 블록, 블록 묶음 참고. 하드웨어 교육에서는 Scratch 계열인 mBlock(Arduino), MakeCode(micro:bit)가 쓰인다.
- [EasyCODE](https://www.easycode.de/) — 메인테이너가 꼽은 이상향. 요구사항의 상당 부분이 이 프로그램을 본떴다. ([스크린샷](https://www.easycode.de/fileadmin/_processed_/a/c/csm_easycode_struktogramm_04_6c9c584c4f.png))
