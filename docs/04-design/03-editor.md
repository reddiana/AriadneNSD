---
title: 편집기
tags:
  - design
status: 초안
updated: 2026-11-01
---

# 편집기

편집 화면과 사용자 입력 처리를 정의합니다. 주변 UI 컴포넌트(툴바, 메뉴, 설정 창, 대화창)는 React로 구현합니다. 다이어그램 영역, 선택 오버레이, 키 입력 처리, 텍스트 입력 요소는 React 밖의 TypeScript입니다 → [[0010-ui-framework|ADR-0010]]

코드: `src/packages/editor` (→ [[0036-code-layout|ADR-0036]])

이 문서는 **어떻게 만드는가**를 적습니다. 무엇이 어떻게 움직여야 하는지(조작 규칙)는 [[02-interaction-rules]], 키는 [[03-keymap]], 모습은 [[04-visual-design]], 웹의 화면 배치는 [[06-web#7. 화면 배치]]에 있습니다.

## 관련 요구사항

- [[01-requirements#3.2 편집]], 그 가운데 드래그 앤 드롭 [[01-requirements#^r-edit|R-EDIT-09]], 커맨드 팔레트 [[01-requirements#^r-edit|R-EDIT-24]]
- 다른 문서 읽기(`readOther`): [[01-requirements#^r-blk|R-BLK-09]]
- 줌 · 팬: [[01-requirements#^r-lay|R-LAY-03]]
- [[01-requirements#^r-nfr|R-NFR-03]], [[01-requirements#^r-nfr|R-NFR-04]], [[01-requirements#^r-nfr|R-NFR-05]]

## 1. 화면 구성

편집 화면은 **레이어 넷**을 겹쳐 그립니다. 아래 레이어일수록 자주 바뀌지 않습니다.

| 레이어 | 무엇 | 누가 그리나 | 언제 다시 그리나 |
| --- | --- | --- | --- |
| 문서 레이어 | 저장되는 그림과 같은 SVG(블록, 텍스트, 접기 영역의 테두리와 이름 띠) | `core`의 렌더러(`layout` → `buildScene` → `toSvg`) → 렌더링 백엔드 → [[0030-swappable-drawing\|ADR-0030]] | 내용이나 뷰 상태가 바뀔 때 |
| 오버레이 레이어 | 선택 하이라이트, 키보드 포커스, 드롭 위치, 펼침 삼각형(`▸` `▾`), 이름이 겹친 헤더의 표시 | `editor`가 `LayoutResult`의 상자로 그리는 SVG 하나 | 선택 · 드래그 · 포커스가 바뀔 때 |
| 인라인 에디터 | 텍스트를 편집하는 동안의 `<textarea>` 하나 | `editor` | 편집을 시작 · 끝낼 때 |
| 팝업 레이어 | 컨텍스트 메뉴, 키 힌트, 커맨드 팔레트, 모달 | React | 열고 닫을 때 |

- 문서 레이어와 오버레이 레이어는 같은 좌표계(문서 좌표, px)를 씁니다. 오버레이 레이어는 문서 레이어 위에 같은 크기로 겹친 SVG이고, 저장할 때는 문서 레이어만 씁니다. 그래서 "편집 중에만 뜨는 표시는 저장되는 그림에 넣지 않는다"([[0018-save-as-shown|ADR-0018]])가 구조로 지켜집니다.
- 화면 색(라이트 · 다크)은 오버레이 · 인라인 에디터 · 팝업 레이어에만 적용됩니다. 문서 레이어는 문서의 테마로 그립니다 → [[04-visual-design#2. 레이어와 출력]]
- 오버레이 레이어의 색과 굵기는 시각 디자인의 편집 레이어 토큰(`edit.*`)을 씁니다 → [[04-visual-design#7.1 상태 표]]

### 1.1 줌과 팬

- 캔버스는 브라우저의 스크롤 영역(`overflow: auto`)이고, 팬은 그 스크롤입니다(휠, 터치패드, 스크롤바). 따로 손(팬) 도구를 두지 않습니다.
- 줌은 40% ~ 300%, 10% 단위입니다. 문서 · 오버레이 레이어와 인라인 에디터를 감싼 요소에 배율을 곱하고, 줌한 뒤 마우스 아래(키로 했으면 선택한 것)가 제자리에 남도록 스크롤을 맞춥니다. 줌은 뷰 상태라 파일에도 실행 취소에도 들어가지 않습니다(그 브라우저의 환경 설정에도 남기지 않음).
- 선택한 것이 화면 밖으로 나가면 가장 가까운 쪽으로만 스크롤합니다(`scrollIntoView({ block: 'nearest' })`와 같음). 줌 중에는 배율을 곱한 상자로 계산합니다.

### 1.2 다시 그리기

- 편집할 때마다 문서 전체를 처음부터 다시 계산합니다(→ [[0037-two-pass-full-layout|ADR-0037]]). 문서 레이어는 SVG 문자열을 통째로 바꿔 넣습니다. 블록 500개에서 10ms 안팎이라 나누어 고치지 않습니다 → [[02-layout#4. 성능]]
- 한 프레임에 한 번만 그립니다. 명령이 여럿 이어져도(예: 붙여넣은 뒤 선택) `requestAnimationFrame` 하나로 모읍니다.
- 오버레이 레이어는 선택만 바뀌면 문서 레이어를 건드리지 않고 다시 그립니다. 키로 블록 사이를 오갈 때 문서 레이어를 다시 그리지 않으려는 것입니다.

## 2. 상태와 선택

`editor`가 기억하는 것은 아래 하나입니다. 파일에 들어가는 것은 `doc`뿐이고, 나머지는 메모리에만 있습니다(→ [[03-architecture#3.3 의존 규칙]]).

```ts
type EditorState = {
  doc: Doc;                       // 내용 + 뷰 상태 → [[01-model]]
  undo: Content[]; redo: Content[]; // 내용의 스냅숏만. 뷰 상태는 넣지 않는다 → [[01-model#4.4 텍스트 편집과 undo]]
  selection: Selection | null;
  lastSelected: Id | null;        // 선택한 것을 푼 뒤 이동 키를 누르면 여기서 시작
  editing: Editing | null;        // 인라인 에디터가 열려 있으면
  dirty: boolean;                 // 마지막 저장 뒤 내용이나 뷰 상태가 바뀌었는가 (저장 안 됨 표시 ●)
  readOnly: boolean;              // 보기만 함 (웹: 같은 파일을 다른 탭이 편집하고 있을 때) → 6.4
  zoom: number;                   // 줌 배율 0.4 ~ 3
  layout: LayoutResult;           // 마지막으로 센 결과. 히트 테스트와 오버레이 레이어가 쓴다
};

type Selection =
  | { kind: 'blocks'; seq: SeqRef; anchor: Id; focus: Id }   // 같은 줄 안의 연속 범위 → ADR-0008
  | { kind: 'head'; diagram: Id }
  | { kind: 'branchLabel'; branch: Id }                      // 분기 라벨 (If · Case) → 조작 규칙 "분기 라벨 선택"
  | { kind: 'fold'; fold: Id };                              // 접기 영역 전체 (이름 띠나 접힌 칸)
type SeqRef = { owner: Id; slot: string };                   // 그 줄을 가진 노드(다이어그램 · 블록 · 분기)와 자리
```

- 선택은 언제나 **id**로 적습니다. 내용이 바뀌어 id가 사라지면 그 선택은 풀립니다(`null`). 위치(몇 번째)로 적지 않는 이유는 undo · 이동 뒤에도 같은 것을 가리키게 하려는 것입니다.
- 펴 보인 블록(호출 블록 안에 보이는 Method의 블록)은 `경로/id`로 적습니다(예: `b4/b17`). 모델의 id가 아니라 화면에만 있는 id입니다 → [[01-model#2. 뷰 상태]]

### 2.1 범위를 넓히기 (자동 확장)

`Shift`+클릭과 `Shift`+`↑` `↓`는 같은 함수를 씁니다 → [[0008-contiguous-selection|ADR-0008]], [[02-interaction-rules#여러 블록 선택]]

1. 처음 선택한 블록 `a`와 새로 가리킨 블록 `b`의 조상 목록(자기부터 다이어그램까지, 블록과 줄이 번갈아)을 구합니다.
2. 두 목록이 처음 엇갈리는 곳 바로 위의 **같은 줄**을 찾습니다.
3. 그 줄 안에서 `a` 쪽 조상과 `b` 쪽 조상이 범위의 두 끝입니다(`anchor`, `focus`).
4. 둘이 다른 다이어그램이면 넓히지 않고 `b`만 선택합니다.

접기 영역은 줄에 붙은 표시라(→ [[0017-fold-name-in-model|ADR-0017]]) 조상 목록에 들어가지 않습니다. 접힌 접기 영역 안을 가리키면 그 접힌 칸 전체가 끝이 됩니다.

### 2.2 이동

- 키보드 이동(`h` `j` `k` `l`, 방향키, `Ctrl`+방향키, `gg` `G`, `[[` `]]`)은 **화면에 보이는 순서**로 계산합니다. `LayoutResult`에서 다이어그램마다 "보이는 순서"(접힌 것은 하나로, 펴 보인 것은 그 자리에) 목록을 만들고, 규칙([[02-interaction-rules#키보드로 이동하고 삽입하기]])은 그 목록 위의 함수로 짭니다.
- 이 함수들은 DOM을 쓰지 않고 `Doc`과 `LayoutResult`만 받습니다. 그래서 Node에서 단위 테스트를 합니다 → [[07-testing]]

### 2.3 명령 뒤의 선택

편집 명령은 `touched`(새로 생기거나 바뀐 노드의 id)를 반환합니다 → [[01-model#4. 편집 명령]]. `editor`는 명령의 종류와 `touched`로 다음 선택을 정합니다. 규칙은 [[02-interaction-rules#키보드로 이동하고 삽입하기]]에 있습니다.

| 명령 | 다음 선택 |
| --- | --- |
| 삽입 · 붙여넣기 · 감싸기 · 이동 | `touched`(삽입한 것, 감싼 새 블록, 이동한 것) |
| 삭제 · 잘라내기 | 삭제한 범위의 다음 블록 → 앞 블록 → 담고 있던 블록 (삭제 **전**에 계산해 둔다) |
| 풀기 | 남은 안의 블록들. 안쪽에서 풀었으면 선택한 것 그대로 |
| 실행 취소 · 다시 하기 | 선택한 것이 남아 있으면 그대로, 없으면 `null` |

## 3. 입력에서 명령까지

키 · 마우스 · 메뉴 · 툴바 · 커맨드 팔레트는 모두 **명령 id 하나**로 모입니다. 실행은 한 곳(`run(id, args)`)에서 합니다 → [[0033-command-list-for-shells|ADR-0033]]

```mermaid
sequenceDiagram
    actor U as 사용자
    participant I as 입력 처리<br/>(키 · 마우스)
    participant R as 명령 목록<br/>(CommandRegistry)
    participant C as 편집 명령<br/>(core, 순수 함수)
    participant S as EditorState
    participant D as 화면<br/>(문서 · 오버레이 레이어)
    U->>+I: 키 / 클릭 / 메뉴
    I->>I: 키 → 명령 id (키 표, 두 키 대기)
    I->>+R: run(id, args)
    R->>R: 적용되는가? (when)
    alt 적용되지 않음
        R-->>I: 이유
        I-->>U: 상태 표시줄에 알림
    else 적용된다
        R->>+C: command(content, args + 선택)
        C-->>-R: 결과
        alt ok: false (reason)
            R-->>I: 이유
            I-->>U: 상태 표시줄에 알림
        else ok: true (content, touched)
            R->>+S: undo에 앞 내용 · 새 내용 · 다음 선택 · dirty
            S-->>-R: 바뀜
            R-->>I: 끝
            S->>+D: 다음 프레임에 다시 그리기
            D-->>-U: 새 그림
        end
    end
    deactivate R
    deactivate I
```

UML 시퀀스 다이어그램입니다. 실선 화살표는 호출, 점선 화살표는 반환, `alt`는 조건 분기, 세로 막대는 그 참여자가 일하는 동안(activation)입니다.

- 편집 명령은 `core`의 순수 함수입니다. `when`을 지나도 명령이 사전 조건으로 거절할 수 있습니다(`{ ok: false, reason }`). 결과의 꼴은 [[01-model#4. 편집 명령]]에 있습니다. 선택은 명령의 인자로 넘기고, 명령은 선택을 바꾸지 않습니다. 선택은 2.3의 규칙으로 `editor`가 정합니다.
- "적용되는가"(`when`)는 지금의 `EditorState`를 받는 함수입니다. 메뉴의 흐린 항목, 커맨드 팔레트의 흐린 줄, 툴바의 꺼진 버튼이 모두 이것을 씁니다.
- 실행하면 안 되는 상태(펴 보인 블록에 내용 명령)는 명령이 아니라 `when`이 막고, 이유를 알립니다("막지 않고 알린다" → [[01-ux-overview#2. UX 원칙]]).

### 3.1 히트 테스트

마우스가 무엇을 가리키는지는 DOM이 아니라 `LayoutResult`로 계산합니다(→ [[03-architecture#3.3 의존 규칙]]).

- 마우스 좌표를 문서 좌표로 바꿉니다(스크롤, 확대 배율, 캔버스의 여백을 뺌).
- 상자는 [[02-layout]]이 `LayoutResult`에 담는 **클릭 영역**입니다. 제어 블록은 헤더만, 펴진 접기 영역과 펴 보인 호출 블록은 띠만, 분기 라벨은 그 칸의 라벨 줄입니다 → [[02-layout#1.1 두 단계]]
- 그 점을 담는 **가장 안쪽** 상자를 찾습니다. 상자의 종류: 블록, 헤더, 분기 라벨 칸, 접힌 칸, 이름 띠, 펼침 삼각형, 펴 보인 블록. 펼침 삼각형과 분기 라벨 칸처럼 작은 상자가 그 아래 블록보다 먼저입니다.
- 블록 500개까지는 모든 상자를 차례로 보아도 1ms 안쪽이라, 공간 색인(R-tree 등)은 두지 않습니다.

### 3.2 드래그 앤 드롭

규칙은 [[02-interaction-rules#7. 드래그 앤 드롭]], 모습은 [[04-visual-design#7.1 상태 표]]에 있습니다.

- 드래그는 HTML5 드래그 앤 드롭(`dragstart`)이 아니라 포인터 이벤트(`pointerdown` → `pointermove` → `pointerup`)로 직접 만듭니다. 드롭 위치를 블록 사이 · 블록 위로 나눠 보이고, 드래그하는 동안 오버레이 레이어를 그려야 하기 때문입니다. 터치에서도 같은 코드가 동작합니다.
- 4px 넘게 움직여야 드래그로 봅니다. 그 전에 떼면 클릭입니다.
- **드롭 위치 계산:** 가리킨 블록 상자의 위쪽 8px과 아래쪽 8px 띠는 "그 블록의 앞 · 뒤 사이", 나머지는 "블록 위"입니다. 블록의 높이가 24px보다 작으면 위아래를 반씩 나눠 "사이"만 둡니다. 분기의 빈 블록(`∅`)은 전체가 "빈 블록 위"입니다.
- 드래그하는 동안 오버레이 레이어에 놓을 결과를 그립니다: 사이면 가로줄 + 양 끝 눈금, 블록 위면 그 블록의 테두리 + 커서 곁의 텍스트("If로 감싸기"). 드롭할 수 없으면 아무것도 그리지 않고 커서를 금지 모양으로 바꿉니다.
- 놓으면 이동 · 삽입 · 감싸기 명령 가운데 하나를 `run`합니다. 드래그 자체는 명령이 아니라서, 놓기 전에 `Esc`를 누르면 아무 일도 없습니다.
- 캔버스 가장자리 32px 안으로 드래그하면 그쪽으로 자동 스크롤합니다.

### 3.3 클립보드

- 복사 · 잘라내기는 시스템 클립보드에 둘을 함께 씁니다:
	- `text/plain`: 블록의 텍스트를 들여쓰기한 줄로(다른 프로그램에 붙여넣으면 의사코드처럼 보이게)
	- `web application/x-ariadne-nsd+json`: 블록 목록의 모델 JSON(Chromium의 웹 사용자 정의 형식)
- 붙여넣기는 사용자 정의 형식이 있으면 그것을 씁니다. 없으면(다른 브라우저, 다른 프로그램에서 복사) `text/plain`의 줄마다 처리 블록 하나를 만듭니다.
- 브라우저가 시스템 클립보드를 막으면(권한 거절, 지원하지 않음) 편집기 안의 클립보드(메모리)를 씁니다. 그때 다른 탭과는 나누지 못합니다.
- 붙여넣은 블록은 모두 새 id를 받습니다 → [[01-model#4.1 내용을 바꾸는 명령]]

### 3.4 텍스트 편집

- 인라인 에디터는 `<textarea>` 하나를 다시 씁니다. 편집할 상자의 자리(`LayoutResult`)에 배율을 곱해 놓고, 블록 글꼴과 같은 글꼴 · 크기로 둡니다.
- 칸을 열고 닫을 때까지가 명령 하나입니다. 닫을 때 텍스트 편집 명령을 한 번 `run`합니다. 처음과 같으면 실행하지 않습니다 → [[01-model#4.4 텍스트 편집과 undo]]
- 비울 수 없는 칸을 비우면 기본 텍스트로 되돌리고 닫습니다. 헤더의 이름이 겹칠 때만 칸을 다시 엽니다 → [[02-interaction-rules#텍스트 편집]]
- 한글 입력(IME) 조합 중의 `Enter`(`isComposing`)는 받아들이기로 보지 않습니다.

## 4. 단축키

키 표는 [[03-keymap]]에 있습니다. 이 절은 키 이벤트를 명령 id로 바꾸는 구현입니다.

- 문자 키는 **자판의 자리**(`KeyboardEvent.code`, 예: `KeyJ`)로 읽습니다. 그래서 한글 입력 상태에서도 `j`가 동작합니다. 대문자는 `Shift`를 함께 본 것입니다 → [[keyboard-keys-and-ime]]
- 인라인 에디터 · 입력 상자 · 메뉴에 포커스가 있으면 편집 키를 처리하지 않습니다(그 요소가 키를 받음).
- **키 시퀀스**(두 키 조합: `dd` `za` `a` + 종류 …): 첫 키를 받으면 "대기 중"이 되고, 둘째 키를 기다리는 시간에 끝은 없습니다. 0.4초가 지나면 키 힌트(이어 누를 키의 목록)를 띄웁니다. 맞지 않는 키나 `Esc`는 대기를 끝냅니다 → [[ux-decisions#K1. 두 키 조합의 안내|K1]]
- 키 표는 데이터(`{ keys: 'd d', command: 'cut' }` 목록) 하나이고, 컨텍스트 메뉴 · 커맨드 팔레트 · 도움말의 키 표가 같은 데이터를 보입니다.
- `Alt`+방향키(이동), `Ctrl`+`Shift`+`P`(커맨드 팔레트)처럼 브라우저 · 운영체제가 먼저 가져가는 키는 셸마다 확인해 두고, 가져가면 다른 키를 함께 둡니다(예: 맥의 `Option`).

## 5. 명령 목록과 메뉴

명령 목록(`CommandRegistry`)은 명령 하나에 항목 하나입니다. 메뉴 · 툴바 · 컨텍스트 메뉴 · 커맨드 팔레트 · 키 표는 모두 이 목록에서 만듭니다 → [[0033-command-list-for-shells|ADR-0033]]

```ts
type CommandSpec = {
  id: string;                         // 'block.insert.if', 'edit.cut', 'view.fold.toggle' …
  title: Message | ((ctx: CommandContext) => Message);  // 화면 언어마다의 이름 (R-NFR-04). 상황에 따라 바뀌면 함수
  keys: string[];                     // 키 표의 키 ('a i', 'Ctrl+X') — 표시용. 디스패치는 4장의 키 표
  menu?: { menu: MenuId; group: number; order: number };  // 메뉴 바의 자리
  toolbar?: { group: number; order: number; icon: IconId };
  context?: SelectionKind[];          // 컨텍스트 메뉴에 보일 선택의 종류
  edits: boolean;                     // 문서를 바꾸는가. 읽기 전용이면 적용되지 않는다 → 6.4
  when(ctx: CommandContext): true | Reason;   // 적용되는가, 아니면 이유
  run(ctx: CommandContext, args?: unknown): void | Promise<void>;
};
type CommandContext = { state: EditorState; store: DocumentStore; settings: SettingsStore };
type MenuId = 'file' | 'edit' | 'diagram' | 'view' | 'help';
```

- 이름이 상황에 따라 바뀌는 예: 원래 파일에 쓸 수 없는 브라우저(`store.canWriteInPlace`가 false)에서는 "저장"을 "내려받기"로 부릅니다 → [[06-web#1. 파일 열기·저장]]
- 명령의 대부분은 `editor`가 만듭니다. 문서를 바꾸는 명령(새로 · 열기 · 최근 파일)은 셸이 만들어 같은 목록에 더합니다 → 6.1

### 5.1 메뉴 구성

웹과 데스크톱이 같은 메뉴를 씁니다(웹은 페이지 안의 메뉴 바, 데스크톱은 운영체제의 메뉴 바 → [[06-web#7. 화면 배치]]). Obsidian은 메뉴 바 대신 명령 팔레트와 컨텍스트 메뉴에 올립니다.

| 메뉴 | 묶음 (가로줄로 나눔) |
| --- | --- |
| 파일 | 새로 · 열기… · 최근 파일 ▸ ／ 저장 · 다른 이름으로 저장… ／ 내보내기 ▸ (PNG) ／ 환경 설정… |
| 편집 | 실행 취소 · 다시 하기 ／ 잘라내기 · 복사 · 붙여넣기 · 앞에 붙여넣기 · 삭제 ／ 텍스트 편집 ／ 위로 · 아래로 · 왼쪽으로 · 오른쪽으로 이동 ／ 커맨드 팔레트… |
| 다이어그램 | 삽입 ▸ (처리 · If · Case · While · For · Do-While) · 앞에 삽입 ▸ ／ 감싸기 ▸ · 풀기 ／ 분기 삽입 · 앞에 분기 삽입 · 분기 삭제 ／ 문서 설정… |
| 보기 | 접기 · 펴기 · 모두 접기 · 모두 펴기 ／ 접기 영역 만들기 · 접기 영역 풀기 ／ 접기 영역 보기 ✓ ／ 확대 · 축소 · 100% |
| 도움말 | 사용법 · 단축키 목록 ／ 이 버전에서 바뀐 것 · AriadneNSD에 대하여 |

- MVP 밖의 명령(Event · Method · 호출 블록 · Method로 빼기)은 그 기능이 들어올 때 다이어그램 메뉴에 더합니다. 접기는 MVP 밖이지만 보기 메뉴의 자리를 먼저 정해 둡니다.
- 메뉴 항목 옆에는 키를 적습니다. 키가 둘이면(`dd`와 `Ctrl`+`X`) 표준 키를 적고, Vim 키는 커맨드 팔레트와 단축키 목록에서 보입니다.

### 5.2 툴바

[[06-web#7. 화면 배치]]의 순서대로: 새로 · 열기 · 저장 · 내보내기 ／ 실행 취소 · 다시 하기 ／ 잘라내기 · 복사 · 붙여넣기 ／ 블록 아이콘 여섯 ／ 감싸기 ▾ · 확대 ▾. 블록 아이콘의 누르기 · `Shift`+클릭 · `Ctrl`+클릭 · 드래그는 [[02-interaction-rules#블록 아이콘으로 삽입 · 감싸기]]에 있습니다.

## 6. 셸과의 연결

`editor`와 셸 사이의 인터페이스는 방향이 다른 두 쌍입니다 → [[03-architecture#3.2 editor와 셸의 인터페이스]]

| 방향 | 인터페이스 | 정의 | 구현 | 사용 | 결정 |
| --- | --- | --- | --- | --- | --- |
| 필요 인터페이스 (required, 포트) | `DocumentStore`, `SettingsStore` | `editor` | 셸 (어댑터) | `editor` | [[0031-shell-interfaces\|ADR-0031]] |
| 제공 인터페이스 (provided) | `CommandRegistry`, `SettingsSchema`, `EditorHandle` | `editor` | `editor` | 셸 | [[0033-command-list-for-shells\|ADR-0033]] |

```ts
// 시작: 셸이 editor를 만든다
function createEditor(options: {
  host: HTMLElement;                             // editor가 그릴 자리
  settings: SettingsStore;
  appearance: Appearance;                        // 화면 밝기와 UI 글꼴 (호스트에서 받음)
  doc: OpenedDocument;                           // 처음 보일 문서
}): EditorHandle;

type OpenedDocument = {
  store: DocumentStore;                          // 이 문서의 읽기 · 쓰기
  text: string | null;                           // .ns.svg · .ns 문자열. null이면 새 문서 (R-ALL-03)
  readOnly?: boolean;                            // 보기만 함 → 6.4
  restored?: string;                             // 로컬 백업에서 복원한 내용(스냅숏). 있으면 text 대신 열고 dirty로 둔다 → 6.3
};
type Appearance = { scheme: 'light' | 'dark'; uiFont: string };

// 필요 인터페이스: 셸이 구현해 넘긴다
interface DocumentStore {
  readonly name: string;                         // 파일 이름 (화면의 "예제.ns.svg"). 다른 이름으로 저장하면 바뀐다
  readonly canWriteInPlace: boolean;             // 원래 파일에 쓸 수 있는가 (웹의 Firefox · Safari는 false)
  read(): Promise<string>;                       // .ns.svg 문자열
  write(svg: string): Promise<WriteResult>;      // 원래 자리에. 못 쓰면 셸이 내려받기 등으로 대신한다
  writeAs(svg: string, suggestedName: string): Promise<WriteResult>;
  readOther(path: string): Promise<string | null>; // 다른 문서 (R-BLK-09). 읽지 못하면 null
}
type WriteResult = { ok: true; name: string } | { ok: false; reason: 'cancelled' | 'denied' | 'failed'; detail?: string };

interface SettingsStore {
  get<T>(key: string): T | undefined;            // 동기: 시작할 때 셸이 모두 읽어 둔다
  set<T>(key: string, value: T): void;           // 저장은 셸이 알아서 (늦게 써도 됨)
  onChange(listener: (key: string) => void): () => void;  // 다른 창에서 바뀐 것 (Obsidian 설정 화면 등)
}

// 제공 인터페이스: editor가 만들어 셸에 건넨다
interface CommandRegistry {
  list(): CommandSpec[];
  run(id: string, args?: unknown): void;
  register(spec: CommandSpec): () => void;       // 셸의 명령을 추가한다 (새로 · 열기 · 최근 파일). 반환된 함수로 뺀다
  onChange(listener: () => void): () => void;    // "적용되는가"가 바뀌었을 때 (셸이 메뉴를 다시 그림)
}
interface SettingsSchema {
  list(): SettingSpec[];                         // id · 표시 이름 · 허용 값 · 기본값 · 범위('user' | 'document')
}
interface EditorHandle {
  readonly commands: CommandRegistry;
  readonly settingsSchema: SettingsSchema;
  open(doc: OpenedDocument): void;               // 문서를 바꾼다. undo · 선택은 비운다
  status(): DocStatus;
  onStatus(listener: (s: DocStatus) => void): () => void;  // 상태가 바뀔 때마다 (셸이 이름 · ● · 로컬 백업을 다룸)
  serialize(): string;                           // 지금 문서의 .ns.svg 문자열 (저장 · 자동 저장에 씀)
  snapshot(): string;                            // 지금 문서의 모델 JSON (로컬 백업에 씀. 서브셋 글꼴을 만들지 않아 가볍다)
  save(): Promise<WriteResult>;                  // "저장" 명령과 같음: serialize → store.write → 성공하면 dirty를 끈다
  setReadOnly(readOnly: boolean): void;
  setAppearance(a: Appearance): void;            // 호스트의 밝기가 바뀌었을 때
  dispose(): void;
}
type DocStatus = { name: string; dirty: boolean; readOnly: boolean; revision: number };  // revision: 내용 · 뷰 상태가 바뀔 때마다 1씩 오름
```

- 읽기 · 쓰기는 비동기(`Promise`)입니다. 파일 · 네트워크 · 권한 묻기가 끼기 때문입니다. 설정 읽기는 시작할 때 다 읽어 두어 동기입니다(그려야 할 때 기다리지 않게).
- 오류는 던지지 않고 값(`WriteResult`, `null`)으로 반환합니다. 사용자가 저장 창을 닫은 것(`cancelled`)은 오류가 아닙니다.
- 설정의 범위가 둘입니다: `user`(환경 설정, `SettingsStore`)와 `document`(문서 설정, 모델의 `settings`) → [[ux-decisions#W5. 설정|W5]]
- 텍스트 폭은 셸이 주입하지 않습니다. `core`가 번들 글꼴의 advance 폭 테이블로 계산합니다 → [[0026-bundled-font-metrics|ADR-0026]]
- 화면 색의 밝기(라이트/다크)와 UI 글꼴은 호스트 플랫폼에서 받습니다(Obsidian이면 Obsidian의 테마 밝기) → [[04-visual-design#8. 테마]]. 설정이 아니라 호스트의 상황이라 `SettingsStore`에 넣지 않고, 시작할 때 `appearance`로 넘기고 바뀌면 `setAppearance`로 알립니다.

### 6.1 새로 · 열기 · 최근 파일

`editor`는 문서 하나만 압니다. 어떤 파일을 열지, 최근 파일을 어디에 기억할지, 창이나 탭을 몇 개 둘지는 셸이 정합니다(웹은 늘 하나 → [[06-web#7. 화면 배치]], 데스크톱은 탭마다 `editor` 하나).

- 새로 · 열기 · 최근 파일 명령은 셸이 `commands.register`로 더합니다. 그래서 메뉴 · 커맨드 팔레트 · 키 표에는 `editor`의 명령과 같이 보입니다.
- 셸은 파일을 고르고 읽은 뒤 그 파일의 `DocumentStore`를 만들어 `open({ store, text })`을 호출합니다. 새 문서는 `text: null`이고, `editor`가 다이어그램 하나와 빈 블록 하나를 만듭니다([[01-requirements#^r-all|R-ALL-03]]).
- 지금 문서가 저장 안 됨이면, 문서를 바꾸기 전에 셸이 묻습니다("저장할까요?"). 웹은 로컬 백업이 있어 묻지 않고 바꿔도 내용을 잃지 않지만, 원래 파일에는 들어가지 않았음을 알립니다.
- 열 수 없는 텍스트(모델이 없는 SVG, 더 새 버전의 형식)를 받으면 `open`은 문서를 바꾸지 않고 이유를 상태 표시줄에 보입니다 → [[01-file-format]]

```mermaid
sequenceDiagram
    actor U as 사용자
    participant S as 셸 (웹)
    participant E as editor
    participant F as 브라우저 파일 · IndexedDB
    U->>+S: 파일 ▸ 열기
    S->>+F: 파일 선택 창
    F-->>-S: 파일 핸들 · 텍스트
    S->>S: DocumentStore를 만든다
    S->>+E: open({ store, text })
    E-->>-S: onStatus(name, dirty: false)
    S->>F: 최근 파일에 더함
    S-->>-U: 메뉴 바에 파일 이름
```

### 6.2 editor가 셸에 알리는 것

셸은 `onStatus`로 문서의 상태를 받습니다. 내용이나 뷰 상태가 바뀔 때마다, 저장한 뒤, 읽기 전용이 바뀔 때 옵니다.

| 셸이 하는 일 | 쓰는 것 |
| --- | --- |
| 파일 이름과 저장 안 됨 표시(`●`), 창 제목 | `name`, `dirty` |
| 브라우저 탭이나 창을 닫을 때 묻기 | `status().dirty` |
| 로컬 백업 (웹) | `revision`이 바뀌면 `snapshot()` |
| 자동 저장 | `dirty`가 켜지면 `save()` |

### 6.3 자동 저장과 로컬 백업은 셸이 맡는다

타이머는 셸에 둡니다. 언제 어디에 쓸지가 대상마다 다르기 때문입니다(웹은 원래 파일에 쓸 수 있는 브라우저에서만, Obsidian은 Obsidian의 저장 규칙). `editor`는 "바뀌었다"를 알리고 `save()` · `snapshot()`을 내줄 뿐입니다.

- 웹의 자동 저장: `dirty`가 켜진 뒤 2초 동안 더 바뀌지 않으면 `save()`. 저장하는 사이에 또 바뀌면 끝난 뒤 다시 2초를 기다립니다 → [[06-web#2. 로컬 백업과 자동 저장]]
- 웹의 로컬 백업: `revision`이 바뀌면 0.5초 안의 것을 모아 `snapshot()`을 IndexedDB에 씁니다. `save()`가 성공하면 그 칸을 삭제합니다.
- 복원: 셸이 시작할 때 로컬 백업 칸을 찾으면 묻고, 복원하기로 하면 `open({ store, text, restored })`로 엽니다. 그 문서는 `dirty`로 열립니다.
- 로컬 백업이 `serialize()`가 아니라 `snapshot()`을 쓰는 이유: 저장 텍스트는 서브셋 글꼴을 만들어 넣어 무겁고([[02-layout#2.2 서브셋 글꼴의 크기]]), 로컬 백업은 편집할 때마다 씁니다.

### 6.4 읽기 전용

`readOnly`이면 `edits: true`인 명령이 모두 "보기만 하는 중"이라는 이유로 적용되지 않습니다. 선택 · 이동 · 복사 · 줌 · 접기와 펴기(뷰 상태)는 됩니다. 뷰 상태는 바뀌어도 `dirty`를 켜지 않습니다(저장할 수 없으므로).

- 웹: 같은 파일을 다른 탭이 편집하고 있으면 셸이 `setReadOnly(true)`를 호출합니다. 그 탭이 닫히면 `false`로 돌리고 알립니다 → [[06-web#2. 로컬 백업과 자동 저장]]
- 상태 표시줄에 "보기만 하는 중"과 그 이유를 둡니다.

## 미결정 사항

- [ ] 펴 보인 블록의 화면 id(`경로/id`)를 모델의 `Path`와 어떻게 맞출지(문자열로 이을지, 배열로 둘지) → 2장
- [ ] 맥에서 `Alt`(`Option`)+방향키, `Ctrl`+`Shift`+`P`가 운영체제 · 브라우저와 겹치는지 → 4장
