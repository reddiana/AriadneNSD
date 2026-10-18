---
title: "설계: 모델"
tags:
  - ariadne-nsd
  - design
status: 작성 중
updated: 2026-10-18
---

# 설계: 모델 (`packages/core`)

문서 모델의 데이터 구조, 불변 조건, 편집 명령을 정의합니다. → [[0004-structure-editor|ADR-0004]]

모델의 짜임(문서 → 다이어그램 여럿 → 머리 · 본문, 호출 블록은 Method를 id로 가리킴, 접기 영역은 줄에 붙은 표시, 내용과 보기 상태)은 [[03-architecture#3.1 문서 모델]]과 [[03-architecture#3.2 내용과 보기 상태]]에서 정했습니다. 이 문서는 그 짜임을 타입과 규칙과 명령으로 굳힙니다. 파일에 쓰는 모양은 [[01-file-format#3. 모델 JSON]]에 있습니다.

## 관련 요구사항

- 블록 종류: [[01-requirements#3.1 블록 종류]]
- 정합성: [[01-requirements#^nfr-integrity]]
- 실행 취소: [[01-requirements#^edit-undo]], [[02-interaction-rules#6. 실행 취소]]
- 감싸기 · 풀기: [[01-requirements#^edit-wrap]], [[01-requirements#^edit-unwrap]], [[01-requirements#^edit-call-inline]]
- 여러 다이어그램, Event · Method, 호출 블록: [[01-requirements#^edit-multi-diagram]], [[01-requirements#^blk-event]], [[01-requirements#^blk-method]], [[01-requirements#^blk-call]], [[01-requirements#^blk-call-named]], [[01-requirements#^blk-call-external]]
- 접기 영역과 보기 상태: [[01-requirements#^edit-fold]], [[01-requirements#^edit-fold-range]], [[01-requirements#^edit-fold-site]], [[0018-save-as-shown|ADR-0018]]

## 1. 타입

TypeScript로 적습니다. 모든 값은 바뀌지 않는 값(불변)으로 다룹니다. 명령은 고친 새 값을 만듭니다. → [[0029-immutable-document-undo|ADR-0029]]

### 1.1 문서

```ts
type Doc = {
  content: Content;   // 내용: 실행 취소의 대상
  view: View;         // 보기 상태: 실행 취소의 대상이 아님 (2장)
};

type Content = {
  settings: Settings;
  diagrams: Diagram[];   // 순서가 있다. 적어도 하나
};

type Settings = {
  textKind: TextKind;    // 블록 글자의 종류 → [[0032-token-highlighting|ADR-0032]]
  theme: ThemeId;        // 그림의 색 묶음 → [[04-visual-design#8. 테마]]
  headStyle: 'shape' | 'title';  // 머리 모양: 모자 · 아치 그대로, 또는 제목처럼 → [[01-requirements#^lay-head-style]]
};
type TextKind = 'plain' | 'c' | 'java' | 'python' | 'bash';  // 처음에 지원할 목록은 미결정
```

- 내용과 보기 상태를 처음부터 나눠 둡니다. 실행 취소 기록에는 `content`만 쌓입니다.
- 화면의 확대 · 위치, 고른 것, 화면의 언어는 모델에 없습니다. `editor`가 갖습니다.

### 1.2 다이어그램과 머리

```ts
type Diagram = {
  id: Id;
  head: Head | null;   // null이면 머리 없음: 종류가 없고 부를 수 없다
  body: Seq;
};

type Head = {
  kind: 'event' | 'method';
  text: string;        // Event는 글자 전체가 이름. Method는 첫 '(' 앞이 이름, 괄호 안이 받는 것
};
```

- Method 머리의 이름과 받는 것은 `text`에서 그때그때 가려냅니다(따로 저장하지 않음). 규칙은 [[02-interaction-rules#Method 머리]]에 있습니다. → [[0022-call-name-follows-head|ADR-0022]]

### 1.3 줄

블록이 놓이는 줄입니다. 다이어그램의 본문, 갈래의 본문, 반복의 본문이 모두 줄입니다.

```ts
type Seq = {
  blocks: Block[];       // 비지 않는다
  folds: FoldMark[];     // 이 줄에 붙은 접기 영역
};

type FoldMark = {
  id: Id;
  first: Id;             // 묶은 범위의 처음 블록
  last: Id;              // 끝 블록 (처음과 같을 수 있음)
  name?: string;         // 없으면 기본 이름("첫 블록의 글자 외 n개")을 보인다
};
```

- 접기 영역은 블록을 품는 블록이 아니라 **줄에 붙은 표시**입니다. 블록의 트리는 접기 영역이 있든 없든 같습니다. → [[0017-fold-name-in-model|ADR-0017]]
- 범위를 블록의 자리(몇 번째)가 아니라 **블록의 id**로 적습니다. 블록을 넣고 지워도 표시를 고쳐 적을 일이 적습니다. 범위 안의 블록이 줄 밖으로 나가면 범위가 줄어듭니다 → 3장의 규칙 F

### 1.4 블록

```ts
type Block = Process | If | Case | While | DoWhile | For | Call;

type Process = { id: Id; kind: 'process'; text: string };

type If = {
  id: Id; kind: 'if'; text: string;   // 조건
  yes: Branch; no: Branch;            // 참 갈래, 거짓 갈래
};

type Case = {
  id: Id; kind: 'case'; text: string; // 견줄 값
  arms: Arm[];                        // default가 아닌 갈래들. 순서가 있다
  otherwise: Branch | null;           // default 갈래. 있으면 늘 맨 끝
};

type Branch = { id: Id; label?: string; body: Seq };  // If의 갈래와 default 갈래. 이름이 없으면 편집기가 정한 글자를 보인다
type Arm = { id: Id; label: string; body: Seq };      // Case의 갈래. 이름 (예: 1, 'a'..'z')

type While   = { id: Id; kind: 'while';   text: string; body: Seq };
type DoWhile = { id: Id; kind: 'doWhile'; text: string; body: Seq };  // Do-While과 Repeat-Until은 모양이 같고 글자만 다르다
type For     = { id: Id; kind: 'for';     text: string; body: Seq };
```

- 조건이나 반복의 글자는 모두 `text` 하나에 둡니다. 글자 고치기 명령이 블록 종류마다 다른 필드를 찾지 않아도 됩니다.
- **빈 블록**은 글자가 없는 처리 블록입니다(`{ kind: 'process', text: '' }`). 빈 갈래, 새 반복의 본문은 빈 블록 하나로 채웁니다.
- If의 갈래 이름은 고칠 수 있습니다(`label`). 고치지 않았으면 비어 있고, 편집기가 저장할 때의 화면 언어로 "참" · "거짓"을 적습니다 → [[01-requirements#^edit-if-label]], [[01-requirements#^nfr-i18n]]. default 갈래의 이름은 고치지 않으며 늘 "default"입니다.
- 갈래(`Branch`)에도 id가 있습니다. If와 Case는 갈래별로 접히므로, 보기 상태가 갈래를 id로 가리킵니다.
- **Case는 모델이 편집 명령보다 넓습니다.** 모델은 default가 없는 Case와 default만 있는 Case도 담습니다. 코드에서 가져온 `switch`(리버스 엔지니어링 → [[01-requirements#^ide-reverse]])가 그런 모양일 수 있기 때문입니다. 사용자가 고칠 때는 편집 명령이 더 좁은 규칙을 지킵니다: 새 Case에는 늘 default가 있고, default는 뺄 수 없고, default가 아닌 갈래는 하나까지 줄일 수 있습니다 → [[02-interaction-rules#Case 블록]] (2026-10-18, 메인테이너: "모델은 넓게, 명령은 좁게")

> [!info] 미완성: 탈출(Exit / Break / Return), 병렬 처리, 주석 블록
> 모두 #P2입니다. 넣을 때 이 유니온에 더합니다. 병렬 처리는 Case처럼 갈래 여럿을 품고, 탈출과 주석은 처리 블록처럼 글자 하나를 갖는 꼴이 될 것입니다.

### 1.5 호출 블록

```ts
type Call = {
  id: Id; kind: 'call';
  target: CallTarget;
  args: string;          // 넘겨주는 것. 한 줄
  result: string;        // 결과를 받는 것. 한 줄. 비어 있으면 결과 기호도 보이지 않는다
  siteFolds: SiteFold[]; // 펴 보인 이 자리에만 있는 접기 영역 (1.6)
};

type CallTarget =
  | { kind: 'local'; diagram: Id }                                   // 같은 문서의 Method
  | { kind: 'named'; name: string }                                  // 이름을 적어 부름
  | { kind: 'external'; file: string; diagram: Id; lastName: string } // 다른 문서의 Method
  | { kind: 'lost'; lastName: string; file?: string };               // 이어진 곳을 잃음
```

- 같은 문서의 Method는 **id로만** 가리킵니다. 이름은 그 Method의 머리에서 가져옵니다. → [[0022-call-name-follows-head|ADR-0022]]
- 가리키던 Method가 없어지면(다이어그램을 지움, 머리를 뗌) 그 명령이 호출 블록을 `lost`로 바꾸고 보이던 이름을 `lastName`에 남깁니다. 그래서 `local`은 언제나 있는 Method를 가리킵니다(불변 조건 6).
- `named`는 처음부터 이름만 적은 것입니다. 잃은 것(`lost`, 점선과 `?`)과 모양이 다르므로 종류를 나눕니다.
- 다른 문서의 Method(`external`)는 그 파일을 읽을 수 없을 수 있으므로 마지막에 본 이름(`lastName`)을 함께 둡니다. `file`에 무엇을 적는지(상대 경로 등)는 정하지 않았습니다 → 미결정 사항
- 결과 기호(`←` / `=`)는 호출 블록마다가 아니라 문서마다 하나이고, 보기 상태에 있습니다(2장).

### 1.6 펴 보인 곳의 접기 영역

```ts
type SiteFold = {
  id: Id;
  via: Id[];       // 이 호출 블록에서 펴 보인 안쪽으로 들어간 호출 블록들의 id. 바로 안이면 []
  first: Id;       // 부르는 Method의 블록 id
  last: Id;
  name?: string;
};
```

- 펴 보인 블록은 문서에 사본으로 있지 않습니다. 레이아웃이 Method의 블록을 그 자리에 다시 배치해 그릴 뿐입니다 → [[03-architecture#4.1 편집]]
- 그래서 이 자리의 접기 영역은 **가장 바깥 호출 블록**에 딸리고, 겹쳐 편 안쪽이면 `via`로 들어간 길을 적습니다. 호출 블록을 지우면 함께 사라집니다.
- Method가 바뀌어 `first`나 `last`가 없어져도 고쳐 적지 않습니다. 그릴 때 남은 블록으로 줄여 묶고, 하나도 남지 않으면 그리지 않습니다 → [[02-interaction-rules#펴 보인 곳의 접기 영역]]

### 1.7 id

```ts
type Id = string;  // 예: "d1"(다이어그램), "b17"(블록), "r3"(갈래), "f2"(접기 영역)
```

- 문서 안에서 모두 다릅니다. 종류마다 앞 글자를 붙이고 뒤는 수입니다.
- 새 id는 **문서에서 가장 큰 수 + 1**로 만듭니다. 시각이나 난수를 쓰지 않으므로, 같은 문서에 같은 명령을 하면 같은 id가 나옵니다(시험하기 쉽고 파일이 늘 같음).
- 붙여넣기, 호출 블록 풀기, 다른 문서에서 가져오기처럼 블록이 복사되어 들어오면 새 id를 받습니다. 복사본 안의 접기 영역의 `first` · `last`도 새 id로 고쳐 적습니다.

## 2. 보기 상태

```ts
type View = {
  folded: Id[];        // 접힌 것: 접기 영역(FoldMark · SiteFold), 갈래(If · Case), 반복 블록(본문)
  opened: Path[];      // 펴 보인 호출 블록. 겹쳐 편 것은 길로 적는다
  bands: boolean;      // 이름 띠를 보이는가
  resultSymbol: '←' | '=';
};
type Path = Id[];      // [바깥 호출 블록 id, 그 안에서 편 호출 블록 id, …]
```

- 보기 상태는 내용의 id를 가리키는 따로 된 묶음입니다. 떼어 내면 "모두 펼친 그림"이 됩니다.
- **없는 id를 가리켜도 잘못이 아닙니다.** 실행 취소로 내용이 앞으로 돌아가면, 보기 상태에 지금 없는 id가 남을 수 있습니다. 레이아웃은 없는 id를 건너뛰고, 저장할 때는 있는 id만 적습니다. 그래서 보기 상태는 실행 취소와 따로 놀아도 깨지지 않습니다.
- 펴 보인 블록 안의 접힘은 Method에 저장된 접힘을 따릅니다(사본마다 따로 기억하지 않음). 이 자리의 접기 영역(`SiteFold`)의 접힘만 그 자리의 것입니다.
- 결과 기호를 보기 상태에 두는 까닭은 [[05-ux-decisions#Q9. 실행 취소의 대상 (R7)|Q9]]에 있습니다.

## 3. 불변 조건

명령이 새 문서를 만들 때마다, 그리고 파일을 열 때마다 검사합니다. 어긴 문서는 만들어지지 않습니다 → [[03-architecture#5. 공통 관심사]]

| # | 조건 |
| --- | --- |
| 1 | 다이어그램이 적어도 하나 있다 |
| 2 | 모든 줄은 비지 않는다 |
| 3 | 문서 안의 id(다이어그램, 블록, 갈래, 접기 영역)는 모두 다르다 |
| 4 | If는 갈래가 둘이다. Case는 갈래(default를 포함해)가 적어도 하나 있다 |
| 5 | 접기 영역의 `first`와 `last`는 그 줄의 블록이고, `first`가 `last`보다 앞이거나 같다. 한 줄의 접기 영역들은 서로 떨어져 있거나 하나가 다른 하나를 온전히 품는다(걸쳐 겹치지 않음). 범위가 똑같은 접기 영역은 둘이 없다 |
| 6 | `local` 호출 블록이 가리키는 다이어그램은 있고, 그 머리는 Method다 |
| 7 | 머리도 내용도 없는 다이어그램(머리가 없고 본문이 빈 블록 하나)은 문서에 다이어그램이 그것 하나일 때만 있다 |

- 7은 "머리도 내용도 없는 다이어그램은 저절로 사라진다"([[02-interaction-rules#5. 여러 다이어그램의 배치]])를 조건으로 적은 것입니다. 명령이 끝날 때 그런 다이어그램을 지웁니다.
- **머리 이름의 규칙**(겹치지 않음, 비지 않음)은 불변 조건이 아닙니다. 다른 도구나 손으로 고친 파일에는 이름이 겹친 머리가 있을 수 있고, 그런 파일도 열어야 하기 때문입니다([[02-interaction-rules#Event 머리]]). 이름을 바꾸는 명령이 겹치는 이름을 받지 않을 뿐이고, 겹친 머리는 화면에 표시해 알립니다.
- 파일을 열 때 1~7을 어기면 "편집할 수 없다"고 알리고 원본은 건드리지 않습니다. 고쳐서 열지 않습니다.

## 4. 편집 명령

명령은 모두 **문서의 내용을 받아 새 내용을 돌려주는 함수**입니다.

```ts
type Command<A> = (content: Content, args: A) => Result;
type Result =
  | { ok: true; content: Content; touched: Id[] }   // touched: 새로 생기거나 바뀐 것. 명령 뒤에 무엇을 고를지 편집기가 정하는 데 쓴다
  | { ok: false; reason: Reason };                   // 아무것도 바꾸지 않음. 까닭을 알린다 ("막지 않고 알린다")
```

- 명령 하나가 실행 취소 하나입니다. 감싸기, 풀기, 새 Method로 빼기처럼 여러 곳을 바꾸는 명령도 하나입니다.
- 명령이 끝나면 불변 조건을 검사합니다. 어기면 그것은 명령의 버그이므로, 새 내용을 버리고 문제 알리기 보고서의 로그에 남깁니다.
- 명령이 끝난 뒤 무엇이 골라지는지는 편집기가 정합니다(`touched`를 보고) → [[05-ux-decisions#1. 결정 모음|Q19]]
- 명령의 이름과 키, 메뉴는 명령의 목록 하나에서 나옵니다 → [[0033-command-list-for-shells|ADR-0033]]

### 4.1 내용을 바꾸는 명령

| 묶음 | 명령 | 규칙 |
| --- | --- | --- |
| 블록 | 넣기 (앞 · 뒤 · 빈 블록 자리) | [[02-interaction-rules#키보드로 이동하고 넣기]] |
| | 지우기 | 줄이 비게 되면 빈 블록 하나를 남긴다 |
| | 글자 고치기 | 블록의 `text`, 호출 블록의 `args` · `result`, 머리, 갈래 이름, 접기 영역 이름 |
| | 옮기기 · 끌어 놓기 | [[05-ux-decisions#Q6. 순서 바꾸기를 명령 하나로 (R4)\|Q6]]에서 정함 |
| | 붙여넣기 | [[02-interaction-rules#붙여넣기]]. 새 id를 받는다 |
| | 감싸기 | [[02-interaction-rules#감싸기 · 풀기]] |
| | 풀기 (제어 블록) | 내용이 있는 갈래를 순서대로 이어 붙인다 |
| | 풀기 (호출 블록) | Method의 블록을 새 id로 복사해 넣는다. 이 자리의 접기 영역은 보통 접기 영역이 된다. `lost`이면 풀 수 없다 |
| | 새 Method로 빼기 | 고른 블록이 새 Method의 본문이 되고, 그 자리에 `local` 호출 블록이 남는다 |
| 갈래 | 갈래 넣기 · 지우기 · 맞바꾸기 | [[02-interaction-rules#Case 블록]], [[02-interaction-rules#갈래 순서 바꾸기]]. default가 아닌 갈래는 하나까지 줄인다. default는 넣지도 지우지도 않는다 |
| | If를 Case로 · Case를 If로 바꾸기 | 갈래가 하나만 남은 Case, `+`를 누른 If에서 바꿀지 묻는다. 글자를 옮기는 법은 미결정 |
| 호출 | 부를 것 바꾸기 | `target`만 바꾸고 `args` · `result`는 남긴다 |
| 다이어그램 | 새 다이어그램 (Event · Method) | 그 종류의 맨 뒤에 놓는다 |
| | 지우기 | 이 Method를 부르던 호출 블록을 `lost`로 바꾼다 |
| | 머리 달기 · 떼기 · 종류 바꾸기 | 떼면 부르던 호출 블록이 `lost`가 된다. 부르는 호출 블록이 있는 Method는 Event로 바꿀 수 없다 |
| | 머리 이름 고치기 | 겹치거나 빈 이름은 받지 않는다. 호출 블록은 id로 가리키므로 따로 고칠 것이 없다. 괄호를 지우면 부르는 호출 블록의 `args`를 비운다 |
| | 순서 바꾸기 | Event는 Event끼리, Method는 Method끼리 |
| 접기 영역 | 만들기 · 풀기 · 이름 고치기 | [[02-interaction-rules#접기 · 펼치기]]. 펴 보인 곳이면 `SiteFold`로 |
| 문서 설정 | 블록 글자의 종류, 테마 | |

### 4.2 보기 명령

보기 상태(`View`)만 바꿉니다. 실행 취소 기록에 남지 않지만 "저장 안 됨"은 뜹니다.

| 명령 | 규칙 |
| --- | --- |
| 접기 · 펴기 | 듣는 곳은 [[02-interaction-rules#접기 · 펼치기]] |
| 모두 접기 · 모두 펴기 | 같은 곳 |
| 호출 블록 펴 보기 · 접기 | [[02-interaction-rules#호출 블록 펴 보기]] |
| 이름 띠 켜고 끄기 | |
| 결과 기호 바꾸기 | |

### 4.3 규칙 F: 접기 영역의 범위가 줄 밖으로 나갈 때

블록을 지우거나 줄 밖으로 옮기면, 그 블록을 `first`나 `last`로 가리키던 접기 영역은 **남은 블록으로 줄어듭니다**. 범위 안의 블록이 모두 나가면 접기 영역은 사라집니다. 범위의 처음과 끝 **사이**에 넣은 블록은 함께 묶입니다. 펴 보인 곳의 접기 영역과 같은 규칙입니다([[02-interaction-rules#펴 보인 곳의 접기 영역]]).

범위의 **바로 앞이나 바로 뒤**에 넣은 블록은 **고른 것을 따릅니다**. 영역 안의 블록을 골라 넣었으면 영역에 묶고(겹친 영역이면 그 블록을 담은 영역 모두), 영역 전체(이름 띠, 접힌 칸)를 골라 넣었으면 묶지 않습니다. 넣기 명령은 고른 것을 받아 `first` · `last`를 고칩니다. (2026-10-18, 메인테이너: 시안 M23의 MD1 1번)

### 4.4 글자 고치기와 실행 취소

글자 칸을 열고 닫을 때까지가 **명령 하나, 실행 취소 하나**입니다. 칸을 닫을 때 편집기가 글자 고치기 명령을 한 번 부릅니다. 글자가 처음과 같으면 부르지 않습니다. 칸이 열려 있는 동안의 되돌리기는 그 칸이 맡고 모델은 모릅니다 → [[02-interaction-rules#6. 실행 취소]] (2026-10-18, 메인테이너: 시안 M23의 MD2 1번)

## 5. 직렬화

모델과 JSON 사이의 변환입니다. 모양은 [[01-file-format#3. 모델 JSON]]에 있습니다.

- 1장의 타입을 그대로 JSON으로 적습니다. `Doc.content`의 `settings` · `diagrams`가 맨 위에, `view`가 그 옆에 놓입니다.
- 객체 키의 순서는 이 문서의 타입에 적은 순서로 고정합니다.
- 기본값과 같아 생략하는 속성: `FoldMark.name`(없음), `Branch.label`(없음), `Call.siteFolds`(빈 목록), `Seq.folds`(빈 목록). 그 밖에는 늘 적습니다.
- 타입별 필드를 굳히면 JSON Schema로 [[01-file-format#3. 모델 JSON]]에 옮깁니다.

## 미결정 사항

- [ ] If를 Case로, Case를 If로 바꿀 때 글자를 옮기는 법(예: Case `key`의 갈래 `1` → If의 조건 `key == 1`인가) → 4.1
- [ ] 코드의 fall-through(`break` 없이 다음 갈래로 이어지는 `case`)를 모델에 어떻게 담을지 → [[01-requirements#3.6 코드 연동]]
- [ ] 다른 문서를 가리키는 값(`external.file`): 상대 경로인지, 무엇에 대한 상대인지 → [[02-interaction-rules#호출 블록]]
- [ ] 처음에 지원할 블록 글자의 종류 목록 → [[01-requirements#6. 미결정 사항]]
- [ ] 프로토타입이 저장한 파일(`version: 0`, 접기 영역이 블록을 품는 꼴)을 열지
