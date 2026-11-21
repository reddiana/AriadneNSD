---
title: 설계 문서 전수 대조
tags:
  - journal
updated: 2026-11-19
---

# 설계 문서 전수 대조

> [!abstract] 이 문서는
> 디자인 · 설계 문서가 애플리케이션을 빠짐없이 표현하는지 코드와 대조한 결과입니다(2026-11-19). 빠진 것과 어긋난 것의 목록이며, **어느 쪽이 맞는지는 정하지 않았습니다.** 문서도 코드도 이 대조로 고치지 않았습니다.
> - **기준:** 코드는 커밋 `c431830`(BUG-17 수정 포함), 문서는 커밋 `9cb5f56`입니다. 행 번호는 이 시점의 것입니다.
> - **심각도:** 상은 문서만 읽고는 앱을 재현할 수 없는 것, 중은 세부 값의 누락, 하는 표현 차이입니다.
> - **확인 방법:** 영역마다 문서와 코드를 양쪽 다 읽어 대조했습니다. 시각 디자인 5장의 치수는 렌더러와 편집 레이어의 출력으로 측정했고, 나머지는 코드를 읽어 확인한 결과입니다. 앱을 실행해 조작해 보지는 않았습니다.
> - **표본 재확인:** 상 항목 가운데 7건(문서 설정의 결과 기호, 환경 설정의 고정폭 글꼴, 헤더에 붙여넣기, `Settings.textOutlines`, `readOther`, 캔버스 밖의 키, JavaScript · TypeScript 항목)을 따로 양쪽을 열어 다시 확인했고 모두 목록과 같았습니다. 나머지 항목은 영역별 대조의 결과 그대로입니다.

## 상 항목의 처리 결과

심각도 "상" 65건을 문서와 코드에서 다시 확인해 처리했습니다(2026-11-19). 심각도 칸의 괄호가 항목마다의 결과입니다.

| 결과 | 건수 | 뜻 |
| --- | --- | --- |
| 채움 | 46 | 앱의 지금 동작을 문서에 채웠습니다 |
| 일 1로 해결 | 1 | I11. 펴 보인 곳의 분기 · 반복 본문을 접고 펼 수 있게 구현했습니다 |
| 해당 없음 | 0 | 다시 확인해 틀린 항목은 없었습니다. K05와 E10은 대조의 설명 일부가 달라(보기 모드의 알림은 위쪽 막대에 보이고, 열기의 순서는 다르지 않고 단계가 빠진 것) 확인한 동작대로 채웠습니다 |
| 앱을 문서에 맞춤 | 7 | K08 · I07 · I06 · I23 · I24 · V05 · E12. 메인테이너가 추천안을 받아들여 앱을 고쳤습니다 → [[ux-decisions#CV1. 설계 문서 대조에서 정한 14가지\|CV1]] |
| 문서를 앱에 맞춤 | 8 | I01 · I08 · I09 · I13 · V06 · M06 · E03 · E04. 문서를 지금 앱의 동작으로 고쳤습니다 → [[ux-decisions#CV1. 설계 문서 대조에서 정한 14가지\|CV1]] |
| 미완성으로 밝힘 | 3 | I02 · I03 · E11. 문서에 아직 앱에 없다고 밝혔습니다 → [[ux-decisions#CV1. 설계 문서 대조에서 정한 14가지\|CV1]]. 처음에 물어본 내용 → [[2026-11-19-design-coverage-conflicts\|설계 문서 대조에서 물어볼 것]] |

## 요약

모두 **342건**입니다(상 65 · 중 206 · 하 71). 같은 문서의 같은 자리를 두 영역에서 찾은 2건은 하나로 합쳤습니다. 다시 확인해 차이가 아닌 것으로 밝혀진 1건(이름 띠의 여러 줄 이름)과 해부도 작업에서 5장에 채운 1건(펼침 삼각형과 세 점의 치수)은 뺐습니다.

| 영역 | 대상 문서 | 상 | 중 | 하 | 합계 |
| --- | --- | --- | --- | --- | --- |
| 키 표 | `docs/02-ux-design/03-keymap.md` | 8 | 22 | 6 | 36 |
| 조작 규칙 · UX 개요 | `docs/02-ux-design/02-interaction-rules.md`, `01-ux-overview.md` | 24 | 34 | 6 | 64 |
| 시각 디자인 · 화면 배치 | `docs/02-ux-design/04-visual-design.md`(5장 밖), `05-screen-layout.md` | 9 | 36 | 17 | 62 |
| 모델 · 레이아웃 · 파일 형식 | `docs/04-design/01-model.md`, `02-layout.md`, `docs/05-spec/01-file-format.md`, `02-model-schema.md` | 7 | 67 | 21 | 95 |
| 편집기 · 웹 | `docs/04-design/03-editor.md`, `06-web.md` | 17 | 46 | 21 | 84 |
| 해부도 작업에서 찾은 것 | `docs/02-ux-design/04-visual-design.md` 5장 | 0 | 1 | 0 | 1 |
| 합계 | | 65 | 206 | 71 | 342 |

항목의 ID는 영역의 머리글자와 번호입니다(`K01`은 키 표의 첫 항목). 영역 안에서는 심각도 순으로 놓았습니다.

## 키 표

대상: `docs/02-ux-design/03-keymap.md`

| ID | 문서 위치 | 코드 위치 | 빠지거나 다른 것 | 심각도 |
| --- | --- | --- | --- | --- |
| K01 | `docs/02-ux-design/03-keymap.md` 전체 (Mac 언급 없음. `docs/` 전체에서 `Cmd` · `⌘` 검색 0건) | `src/packages/editor/src/input/keys.ts:234,241`, `src/packages/editor/src/dom/canvas-view.ts:810`, `src/packages/editor/src/ui/command-ids.ts:35`, `src/packages/editor/src/ui/keys.ts:26-33` | 코드는 "Cmd on a Mac counts as Ctrl"로 `metaKey`를 Ctrl과 똑같이 읽는다(키 · 휠 확대 · 블록 아이콘 클릭). 화면의 키 이름은 Mac에서도 `Ctrl`로 나온다. 문서에는 Mac 변형이 없다 | 상 (채움) |
| K02 | `03-keymap.md:104` "한 글자 키는 캔버스에 포커스가 있을 때만" | `src/packages/editor/src/dom/canvas-view.ts:550-553`, `:73-78` | 코드는 한 글자 키만이 아니라 **모든 키**(`Ctrl`+`S` · `Ctrl`+`Z` · `F1` 포함)를 `event.target === canvas`일 때만 읽는다. 예외는 인라인 에디터의 네 키뿐이다. 전역 keydown 처리는 없다 | 상 (채움) |
| K03 | `03-keymap.md:62` "Case로 바꿀지 묻는다" (답하는 키 없음) | `src/packages/editor/src/session/session.ts:946-948`, `:1052-1073` | 상태 표시줄 질문의 키가 문서에 없다: `Enter` = 기본 선택, `Esc` = 닫기, `1`~`9` = 그 번호의 선택, 그 밖의 키 = 질문을 닫고 그 키를 평소대로 처리 | 상 (채움) |
| K04 | `03-keymap.md` 표 · 본문 (드래그 중의 키 없음. `04-design/03-editor.md:189`에만 `Esc` 언급) | `src/packages/editor/src/dom/canvas-view.ts:554-559`, `:895-905` | 드래그 중 `Esc`는 드래그 취소이고, 캔버스 드래그 중 다른 키는 모두 무시한다 | 상 (채움) |
| K05 | `03-keymap.md:35-41` 상태 표 (상태는 셋) | `src/packages/editor/src/commands/registry.ts:46`, `src/packages/editor/src/ui/editor-app.tsx:409-410` | 읽기 전용에서 키가 어떻게 되는지 없다. `edits: true` 명령은 `reason.readOnly`로 거절된다(`file.save`도 `edits: true`, `editor-commands.ts:1496`). 보기 모드에서는 컨텍스트 메뉴와 상태 표시줄을 그리지 않아 `Shift`+`F10` · 메뉴 키가 아무것도 띄우지 않고 `Esc` 한 번의 알림도 보이지 않는다 | 상 (채움) |
| K06 | `03-keymap.md:94` (목록은 호출 Method 목록 · 컨텍스트 메뉴 · 팔레트만) | `src/packages/editor/src/ui/menu-bar.tsx:92-104,114-120`, `src/packages/editor/src/ui/dropdown.tsx:94-113,193-199` | 메뉴 바의 키가 없다: 제목에서 `↓`로 열기, `↑` `↓` 순환, `←` · `Esc`로 닫기, `→` · `Enter` · `Space`로 하위 메뉴 열기. 메뉴 바에는 `j` `k` `h` `l`이 듣지 않는다(`hasVimKeys` 없음) | 상 (채움) |
| K07 | `03-keymap.md:40` "`Enter` `Esc` (둘 다 적은 대로 편집 완료)" | `src/packages/editor/src/dom/canvas-view.ts:498-507` | 이름 중복으로 다시 열린 칸(`isRejected`)의 `Esc`는 완료가 아니라 편집 전으로 되돌린다. `02-interaction-rules.md:35`에는 있고 이 표와는 어긋난다 | 상 (채움) |
| K08 | `03-keymap.md:72` "그 밖의 것을 선택했으면 그것을 담은 가장 가까운 제어 블록 벗기기" | `src/packages/editor/src/commands/editor-commands.ts:520-525` | `ds`는 `blocks` 선택에서만 된다. 분기 라벨 · 접기 영역 · 펴 보인 블록 · 빈 기본 칸은 `reason.nothingSelected`, 헤더는 `reason.notOnHead`로 거절한다 | 상 (앱을 문서에 맞춤) |
| K09 | `03-keymap.md:59` "호출 블록의 결과 칸과 인자 칸을 오감" | `src/packages/editor/src/session/session.ts:635-644,775-794`, `src/packages/editor/src/dom/canvas-view.ts:508-513` | 이름을 적어 호출하는 블록은 `args` → `result` → `name` 세 칸을 돈다. 받는 것이 없는 Method는 `result` 한 칸뿐이라 `Tab`이 아무 일도 하지 않는다. `Shift`+`Tab`도 같은 방향이다 | 중 |
| K10 | `03-keymap.md:92` "블록을 선택한 상태의 휠은 `j` `k`와 같습니다" | `src/packages/editor/src/dom/canvas-view.ts:833`, `src/packages/editor/src/input/keys.ts:160,163` | 영역 선택 중 `j` `k`는 `select.extendDown/Up`인데 휠은 언제나 `select.down/up`을 실행해 넓히지 않는다 | 중 |
| K11 | `03-keymap.md:47,92` 휠 | `src/packages/editor/src/dom/canvas-view.ts:819,824-835` | 세부 값이 없다: 누적 50px마다 한 칸, 줄 단위는 ×40, 쪽 단위는 ×400. 조건은 블록만이 아니라 선택이 있으면 모두(헤더 · 분기 라벨 등). `Shift`+휠 · 가로 휠 · 편집 중은 제외(제외 조건은 `02-interaction-rules.md:131`에 있음) | 중 |
| K12 | `03-keymap.md:89` 컨텍스트 메뉴: 오른쪽 클릭, `Shift`+`F10`, 메뉴 키 | `src/packages/editor/src/dom/canvas-view.ts:615-619,632-637,643-648` | 선택이 없으면 `Shift`+`F10` · 메뉴 키는 아무것도 열지 않는다. 오른쪽 클릭은 빈 캔버스에서 파일 · 도움말 메뉴를 연다. 세 입력이 같지 않다 | 중 |
| K13 | `03-keymap.md:40` 편집에 들어가는 법 "`i` `cc` `Enter` `F2` 더블클릭, 블록을 삽입한 직후" | `src/packages/editor/src/input/keys.ts:84`, `src/packages/editor/src/commands/editor-commands.ts:404,489,684,1330,1357,1438`, `src/packages/editor/src/commands/fold-commands.ts:600-604` | 목록에 없는 진입: `L`, 감싸기 직후, 분기 삽입 직후, If→Case 변환 직후, 새 헤더 달기 직후, 새 Method로 빼기 직후, `E` · `M` 직후, 접기 영역 만들기 직후 | 중 |
| K14 | `03-keymap.md:40,102` | `src/packages/editor/src/dom/canvas-view.ts:493-498,511,517` | IME 조합 중에는 `Enter` · `Esc` · `Tab`의 칸 이동 · 네 키가 모두 동작하지 않는다. `04-design/03-editor.md:209-210`에는 `Enter`와 네 키만 있다 | 중 |
| K15 | `03-keymap.md:41` 나오는 법 "`v` `Esc`" | `src/packages/editor/src/session/session.ts:999-1001` | 영역 선택 중 `V`로도 나온다 | 중 |
| K16 | `03-keymap.md:41` "또는 명령을 실행하면" | `src/packages/editor/src/session/session.ts:1008-1014` | 영역 키 표에 없는 키는 명령이 없는 키여도 영역 선택을 끝내고 일반 키로 다시 읽는다. `select.extend*`는 끝내지 않는다 | 중 |
| K17 | `03-keymap.md:41` | `src/packages/editor/src/session/session.ts:1018-1025` | `v` · `V` · `Esc`로 나오면 선택이 넓힌 범위에서 포커스 블록 하나로 줄어든다. 문서에 없다 | 중 |
| K18 | `03-keymap.md:41,54` `v` `V` | `src/packages/editor/src/commands/editor-commands.ts:1055-1057` | `blocks` 선택에서만 시작되고 그 밖에서는 `reason.nothingSelected`로 거절한다 | 중 |
| K19 | `03-keymap.md:54` "시작한 뒤 `j` `k`로 넓힘" | `src/packages/editor/src/input/keys.ts:160-165` | 영역 선택 중 `↑` `↓`, `Shift`+`↑` `↓`도 넓힌다 | 중 |
| K20 | `03-keymap.md:54,65,66` `Shift`+`↑` `↓` · `Shift`+클릭과 "영역에서 `y`/`d`" | `src/packages/editor/src/input/keys.ts:62-63,166-170`, `src/packages/editor/src/session/session.ts:954,1004` | `y` · `d` 한 번으로 실행되는 것은 `v` 모드뿐이다. `Shift`로 넓힌 범위는 일반 상태라 `y` · `d`가 둘째 키를 기다린다 | 중 |
| K21 | `03-keymap.md:39` "블록을 선택한 상태 / 처음부터" | `src/packages/editor/src/session/session.ts:151`, `src/packages/editor/src/navigation/navigate.ts:55-63`, `src/packages/editor/src/commands/editor-commands.ts:433-435` | 선택이 없는 상태가 상태 표에 없다. 이때 이동 키는 마지막 선택(없으면 첫 다이어그램의 맨 위)을 고르고, `o` 등 삽입은 현재 다이어그램의 끝에 넣는다 | 중 |
| K22 | `03-keymap.md:53,57` "더블클릭은 어디서나 편집" | `src/packages/editor/src/dom/canvas-view.ts:779-782`, `src/packages/editor/src/commands/spec.ts:51-52`, `src/packages/editor/src/commands/fold-commands.ts:611,663`, `src/packages/editor/src/commands/editor-commands.ts:958` | 펴 보인 호출 블록 안에서는 더블클릭이 `reason.peekReadOnly`로 거절되고, 문서를 바꾸는 명령도 `onPeek` 명령(텍스트 편집 계열 · `fold.make` · `fold.remove`) 말고는 거절된다 | 중 |
| K23 | `03-keymap.md:94` "`h`(`←`)로 닫습니다" (하위 메뉴) | `src/packages/editor/src/ui/dropdown.tsx:107-110` | 최상위 컨텍스트 메뉴에서 `h` · `←`를 누르면 컨텍스트 메뉴 자체가 닫힌다 | 중 |
| K24 | `03-keymap.md:94` "`l`(`→`)로 열고" | `src/packages/editor/src/ui/dropdown.tsx:194-198` | 하위 메뉴는 `Enter` · `Space`로도 열린다 | 중 |
| K25 | `03-keymap.md:94` "숫자 키로 바로 선택" | `src/packages/editor/src/ui/picker-menu.tsx:61-62,105` | 숫자는 `1`~`9`뿐이고 10번째 항목부터는 숫자 딱지도 없다 | 중 |
| K26 | `03-keymap.md:86,100` (`Esc`는 단축키 목록과 열기 · 저장 창만) | `src/packages/editor/src/ui/modals.tsx:31-36,320-325,363`, `src/packages/editor/src/ui/examples-modal.tsx:76` | 환경 설정 · 문서 설정 · 정보 · 새 소식 · 예제 창의 `Esc` 닫기와, 확인 창의 `Enter`(기본 버튼) · `Esc`(취소)가 없다 | 중 |
| K27 | `03-keymap.md:92` "이어 누를 키와 그 명령을 모두 보입니다" | `src/packages/editor/src/ui/key-hint.tsx:19-25`, `src/packages/editor/src/input/keys.ts:111,114,174-187` | 키 힌트는 선택 종류를 보지 않는다. 헤더를 선택하고 `d`를 누르면 `dd`의 실제 동작은 헤더 제거인데 힌트는 먼저 등록된 "잘라내기"를 보인다 | 중 |
| K28 | `03-keymap.md:92` 키 힌트 | `src/packages/editor/src/ui/key-hint.tsx:43-44`, `src/packages/editor/src/i18n/messages.ts:556-565` | 아래에 자리가 없으면 선택 **위**로 뒤집힌다. 힌트 제목(`뒤에 삽입` · `앞에 삽입` · `감싸기` · `편집` · `잘라내기 · 풀기` · `복사` · `가기` · `앞으로` · `뒤로` · `접기`)도 문서에 없다 | 중 |
| K29 | `03-keymap.md:92` "맞지 않는 키나 `Esc`를 누르면 그만두고, 누른 키는 버립니다" | `src/packages/editor/src/session/session.ts:978-992`, `src/packages/editor/src/i18n/messages.ts:482-483` | 알림 `그만뒀습니다.` · `{keys}: 없는 키입니다.`가 없다. 표에 없는 한 글자 키도 같은 알림을 띄우고, 글자가 아닌 키는 브라우저로 넘긴다 | 중 |
| K30 | `03-keymap.md:45-90` 표 (키 없는 명령으로 적힌 것은 열기 · 호출할 Method 바꾸기 · 100%뿐) | `src/apps/web/src/shell/web-shell.ts:1102-1187,664-691`, `src/packages/editor/src/ui/editor-app.tsx:128-170,274-296`, `src/packages/editor/src/commands/editor-commands.ts:667,690`, `src/packages/editor/src/commands/fold-commands.ts:698` | 키가 없는 명령이 문서에 없다: `file.new`, `file.recent.*`, `file.export.png/svg/pdf`, `file.share`, `view.bands`, `branch.convertIfToCase`, `branch.convertCaseToIf`, `diagram.documentSettings`, `help.manual`, `help.askAi`, `help.whatsNew`, `help.about`, `help.examples`, `example.*` | 중 |
| K31 | `03-keymap.md:76` 모두 펴기 / 모두 접기 `zR` / `zM` (`:33`은 "없는 키"로 설명) | `src/packages/editor/src/commands/fold-commands.ts:709`, `src/packages/editor/src/input/keys.ts:138-145` | 키만 없는 것이 아니라 **명령 자체**가 코드에 없다. 메뉴 · 팔레트로도 실행할 수 없다 | 하 |
| K32 | `03-keymap.md:64,70,78` 표의 Vim 키 / 표준 키 열 | `src/packages/editor/src/ui/keys.ts:11-16`, `src/packages/editor/src/ui/modals.tsx:108-113` | 단축키 목록 모달의 열이 문서와 다르다: `Alt`+`h` `j` `k` `l` · `Ctrl`+`R`은 문서에서 Vim 키, 모달에서 표준 키. `Shift`+`F`는 문서에서 표준 키, 모달에서 Vim 키(`F`) | 하 |
| K33 | `03-keymap.md:68,69,77,78` 키 이름 | `src/packages/editor/src/ui/keys.ts:26-33`, `src/packages/editor/src/input/keys.ts:84,143` | 화면에는 `Delete`가 `Del`, `Shift`+`L`이 `L`, `Shift`+`F`가 `F`로 나온다 | 하 |
| K34 | `03-keymap.md:84,51` 명령 이름 | `src/packages/editor/src/commands/editor-commands.ts:1498`, `src/packages/editor/src/i18n/messages.ts:332,400` | `Ctrl`+`S`는 원본에 쓸 수 없는 브라우저에서 이름이 `내려받기`다. `gg`의 이름은 `첫 블록 선택`인데 동작은 문서대로 헤더 우선이다 | 하 |
| K35 | `03-keymap.md:43,83` | `src/packages/editor/src/input/keys.ts:209-210,215,251` | 숫자 패드의 `Enter` · `+` · `-` · 숫자도 같은 키로 읽는다. 문서에 없다 | 하 |
| K36 | `03-keymap.md:96` 지원하지 않는 것 "`Ctrl`+글자 조합" | `src/packages/editor/src/input/keys.ts:113,115,117,130,132,133,149` | 표현이 넓다: `Ctrl`+`C` `X` `V` `Z` `R` `Y` `S` `P` 등 `Ctrl`+글자 키가 있다 | 하 |

## 조작 규칙 · UX 개요

대상: `docs/02-ux-design/02-interaction-rules.md`, `01-ux-overview.md`

| ID | 문서 위치 | 코드 위치 | 빠지거나 다른 것 | 심각도 |
| --- | --- | --- | --- | --- |
| I01 | docs/02-ux-design/02-interaction-rules.md:225 | src/packages/editor/src/commands/editor-commands.ts:846-847 | 문서: "헤더를 선택했으면 본문 맨 앞에 붙는다". 코드: 헤더에서 붙여넣기를 거절하고 `reason.cannotPasteOnHead`("헤더에는 붙여넣을 수 없습니다.")를 알림 | 상 (문서를 앱에 맞춤) |
| I02 | docs/02-ux-design/02-interaction-rules.md:365 | src/packages/editor/src/commands/fold-commands.ts:709, src/packages/editor/src/input/keys.ts:138-145 | 문서는 모두 접기 · 모두 펴기를 있는 기능으로 적음(미완성 표시 없음). 코드의 접기 명령은 toggle · open · close · make · remove · bands 여섯뿐이고 모두 접기 · 펴기 명령이 없음 | 상 (미완성으로 밝힘) |
| I03 | docs/02-ux-design/02-interaction-rules.md:92, :100 | src/packages/editor/src/commands/editor-commands.ts:1092-1115, :1285-1287, src/packages/editor/src/commands/fold-commands.ts:67-73 | 문서: 다른 문서의 Method 호출, 따라가기는 그 파일을 엶, 조건부 펴 보기, `↗ sort.ns.svg` 라벨. 코드: 목록에 고를 항목이 없고(Method · 새 Method · 이름 적기뿐), 따라가기는 `reason.notCallable`, 펴 보기는 `local`만 가능. `layout` · `dom` · `session`에서 `↗`(U+2197)와 `target.file` 사용을 찾지 못함 | 상 (미완성으로 밝힘) |
| I04 | docs/02-ux-design/02-interaction-rules.md:72, :476 | src/packages/editor/src/session/session.ts:299-325, :566-579, :1052-1073, src/packages/core/src/commands/branch.ts:95-149 | 문서: 묻는 모양과 텍스트 옮기는 법을 "정하지 않았다". 코드는 이미 구현: 상태 표시줄 질문과 버튼, 첫 버튼이 기본(`Enter`), `1`~`9`로 선택, `Esc`로 닫기, 다른 키는 질문을 닫고 그 키로 처리. If→Case: 참 분기가 첫 분기(라벨 없으면 `1`), 새 빈 분기가 둘째, 거짓 분기가 default(라벨 버림). Case→If: 분기가 참(라벨 유지), default가 거짓. 조건 텍스트는 그대로 | 상 (채움) |
| I05 | docs/02-ux-design/02-interaction-rules.md:154, :70 | src/packages/editor/src/commands/editor-commands.ts:170-183, :616-651, :1539-1541 | 문서: "분기 전용 명령 … 따로 두지 않는다", 분기 안의 블록을 선택하면 같은 명령이 블록에 적용. 코드: `branch.insert` · `branch.insertBefore` · `branch.delete`가 메뉴 · 컨텍스트 메뉴 · 팔레트에 따로 있고, 블록을 선택해도 그 블록을 담은 분기에 적용됨 | 상 (채움) |
| I06 | docs/02-ux-design/02-interaction-rules.md:154 | src/packages/editor/src/commands/editor-commands.ts:497-503, :863-867, src/packages/editor/src/input/keys.ts:122-124 | 문서: 분기 라벨에서 삭제는 분기에 적용. 코드: `x` · `Delete` · `Backspace` 키만 분기 삭제이고, 메뉴 · 팔레트의 삭제(`edit.delete`)는 `reason.undecidedOnBranchLabel`로 거절 | 상 (앱을 문서에 맞춤) |
| I07 | docs/02-ux-design/02-interaction-rules.md:259, :264 | src/packages/editor/src/commands/editor-commands.ts:519-525 | 문서: 제어 블록도 호출 블록도 아닌 것을 선택하면 담은 가장 가까운 제어 블록을 벗김. 코드: 분기 라벨 · 접기 영역(이름 띠, 접힌 칸) · 빈 default 칸에서 풀기는 `reason.nothingSelected`("먼저 블록을 선택하세요.")로 거절 | 상 (앱을 문서에 맞춤) |
| I08 | docs/02-ux-design/02-interaction-rules.md:263 | src/packages/editor/src/commands/editor-commands.ts:571-572 | 문서: 감싸기 · 풀기는 "단축키, 컨텍스트 메뉴, 툴바 모두 지원". 코드: 풀기(`block.unwrap`)에는 `toolbar` 자리가 없음(메뉴 · 컨텍스트 메뉴 · 키 `d s`) | 상 (문서를 앱에 맞춤) |
| I09 | docs/02-ux-design/02-interaction-rules.md:139-140 | src/packages/editor/src/navigation/navigate.ts:253-290, src/packages/editor/src/model/shown-index.ts:135-141, :165-166 | 문서: `←` `→`는 "분기의 어느 블록에서든 같다". 코드: 바로 담은 것만 봄. 반복문 본문, 이름 띠가 켜진 펴진 접기 영역, 펴 보인 호출 블록 안에서는 `←`가 그 담은 것을 선택하고, `→`는 옆 분기로 가지 않고 자기 안으로 들어가거나 멈춤 | 상 (문서를 앱에 맞춤) |
| I10 | docs/02-ux-design/02-interaction-rules.md:140 | src/packages/editor/src/navigation/navigate.ts:286-289 | 문서: "제어 블록 안으로는 `↓`로 들어간다". 코드: 분기 바로 아래가 아닌 제어 블록(맨 바깥 줄, 반복문 본문)에서는 `→`도 첫 안쪽 블록으로 들어감. 문서에 없음 | 상 (채움) |
| I11 | docs/02-ux-design/02-interaction-rules.md:396 | src/packages/editor/src/commands/fold-commands.ts:337-357, src/packages/editor/src/navigation/shown-selection.ts:99-106, :132-141 | 문서: 펴 보인 곳의 Method 분기도 접고 펼 수 있음. 코드: 펴 보인 곳의 분기 라벨 · 접힌 줄은 `peek` 선택이 되고 대상에 분기가 없음. 접기 · 펴기를 쓰면 이 자리의 접기 영역이나 담은 호출 블록이 접힘(접힌 줄의 더블클릭도 같음) | 상 (일 1로 해결) |
| I12 | docs/02-ux-design/02-interaction-rules.md:234 | src/packages/core/src/commands/move.ts:24-29, :54-60, :92-158 | 위 · 아래 이동의 접기 영역 규칙이 없음: 영역 끝의 블록은 먼저 영역 밖으로 한 걸음 나오고, 옆의 접기 영역은 통째로 건너뜀 | 상 (채움) |
| I13 | docs/02-ux-design/02-interaction-rules.md:149, :185 | src/packages/core/src/commands/edit-text.ts:51-53, src/packages/editor/src/session/session.ts:834-835 | 문서: Case 분기 라벨을 비우면 "처음 이름"으로 돌아감. 코드: 거절(`emptyLabel`)이라 편집 전의 라벨이 남음. 라벨을 고친 뒤 비우면 최초 이름이 아니라 고친 라벨 | 상 (문서를 앱에 맞춤) |
| I14 | docs/02-ux-design/02-interaction-rules.md:61, :183 | src/packages/editor/src/session/session.ts:693-695, src/packages/core/src/commands/edit-text.ts:48-50 | 문서: 분기 라벨은 모두 같은 명령으로 편집. 코드: default 분기의 라벨은 편집 불가, `reason.defaultLabelFixed`("default 분기의 라벨은 바꿀 수 없습니다.") | 상 (채움) |
| I15 | docs/02-ux-design/02-interaction-rules.md:442-449 | src/packages/editor/src/input/drop.ts:80-87 | 드롭 표에 빈 default 칸(`∅`)이 없음. 코드: 드롭할 수 있고, default 분기를 만들어 새 블록 · 이동한 블록을 넣음 | 상 (채움) |
| I16 | docs/02-ux-design/02-interaction-rules.md:442-449 | src/packages/editor/src/input/drop.ts:80-81, :88-113 | 드롭 표에 분기 라벨이 없음. 코드: 라벨 위는 그 If · Case 블록 위로 처리됨(가운데면 새 제어 블록은 그 If · Case를 감쌈, 이동은 그 앞 · 뒤) | 상 (채움) |
| I17 | docs/02-ux-design/02-interaction-rules.md:449 | src/packages/editor/src/input/drop.ts:88-96 | 드롭할 수 없는 곳의 목록에 접힌 줄 · 접힌 칸 · 이름 띠, 드래그하는 블록 자신과 그 안쪽, 펼침 삼각형이 없음. 코드: 모두 `null`(드롭 불가) | 상 (채움) |
| I18 | docs/02-ux-design/02-interaction-rules.md:383, :239 | src/packages/editor/src/dom/canvas-view.ts:700-702, :717, :731 | 문서: 접힌 것은 통째로 이동, 드래그는 이동을 마우스로 하는 방법. 코드: 접힌 줄 · 접힌 칸 · 이름 띠는 모델 블록이 아니라 드래그가 시작되지 않음 | 상 (채움) |
| I19 | docs/02-ux-design/02-interaction-rules.md:220-226 | src/packages/editor/src/commands/editor-commands.ts:710-777, :787-795, src/packages/editor/src/clipboard/clip-format.ts:34-98, :192-204, src/packages/core/src/commands/clipboard.ts:86-111 | 복사 · 잘라내기 절이 없고 붙여넣기 입력 규칙도 없음: 들여쓴 텍스트와 모델 JSON을 함께 씀(빈 블록은 텍스트에서 빠짐), 다른 프로그램의 텍스트는 비지 않은 줄마다 처리 블록, 호출 블록은 같은 이름의 Method에 이어지거나 참조 대상 없음이 됨, 알림 "블록 n개를 복사했습니다." · "블록 n개를 잘라냈습니다." · "붙여넣을 것이 없습니다." · "시스템 클립보드를 쓸 수 없어 이 탭 안에만 복사했습니다." (일부는 docs/04-design/03-editor.md 3.3에 있음) | 상 (채움) |
| I20 | docs/02-ux-design/02-interaction-rules.md:414-424 | src/packages/editor/src/commands/editor-commands.ts:1444-1481, src/packages/core/src/commands/diagram.ts:137-154 | 다이어그램 삭제 명령의 규칙이 없음: 묻지 않고 삭제, 하나뿐이면 `reason.lastDiagram`, 뒤에 그려진 순서의 다음(없으면 앞) 다이어그램의 헤더나 첫 블록을 선택, "다이어그램을 삭제했습니다. 실행 취소로 되돌릴 수 있습니다." | 상 (채움) |
| I21 | docs/02-ux-design/02-interaction-rules.md:123, :193 | src/packages/editor/src/commands/editor-commands.ts:389-391 | 문서: 선택한 것 뒤에 삽입. 코드: 헤더를 선택하면 모든 블록 삽입을 `reason.notOnHead`로 거절. 헤더에서의 삽입 규칙이 문서에 없음 | 상 (채움) |
| I22 | docs/02-ux-design/02-interaction-rules.md:234 | src/packages/core/src/commands/delete.ts:27-34, src/packages/core/src/commands/move.ts:77, src/packages/core/src/commands/move-to.ts:54-56 | 줄의 블록이 모두 없어지면(삭제 · 이동 · 드롭) 빈 블록 하나가 남는다는 규칙이 없음. 줄의 하나뿐인 빈 블록 삭제는 `alreadyEmpty`("이미 빈 블록입니다.")로 거절 (빈 블록이 남는 규칙은 docs/04-design/01-model.md:296에 있음) | 상 (채움) |
| I23 | docs/02-ux-design/02-interaction-rules.md:395 | src/packages/editor/src/commands/editor-commands.ts:729-741, src/packages/editor/src/state/selection.ts:210-213 | 문서: 펴 보인 곳에서 "복사는 된다". 코드: 펴 보인 곳의 접기 영역(이름 띠, 접힌 칸)을 선택하면 복사가 알림 없이 아무 일도 하지 않음 | 상 (앱을 문서에 맞춤) |
| I24 | docs/02-ux-design/01-ux-overview.md:38 | src/packages/editor/src/commands/editor-commands.ts:739-741 | 원칙 "할 수 없는 일은 아무 일도 하지 않고 이유를 알린다"의 예외: 위 복사는 이유를 알리지 않음 | 상 (앱을 문서에 맞춤) |
| I25 | docs/02-ux-design/02-interaction-rules.md:69, :70 | src/packages/core/src/commands/common.ts:159-163, :172-180 | 새 Case의 분기 라벨 `1` · `2`, 새 분기의 라벨(쓰지 않은 가장 작은 양의 정수)이 없음 | 중 |
| I26 | docs/02-ux-design/02-interaction-rules.md:70 | src/packages/core/src/commands/branch.ts:37-42, src/packages/editor/src/commands/editor-commands.ts:407-409 | default의 앞 · 뒤 어느 쪽에 분기를 삽입해도 default 바로 앞에 들어감. 뒤에 삽입하면 "default 분기는 늘 맨 끝이라 그 앞에 삽입했습니다." 알림. 문서에 없음 | 중 |
| I27 | docs/02-ux-design/02-interaction-rules.md:71 | src/packages/core/src/commands/branch.ts:68-70, :79-81 | If로 바꿀지 묻는 것은 default가 있을 때만. If의 분기 삭제는 `ifBranchesFixed`("If의 분기는 둘입니다. If를 없애려면 삭제하거나 푸세요.")로 거절. 둘 다 문서에 없음 | 중 |
| I28 | docs/02-ux-design/02-interaction-rules.md:70 | src/packages/editor/src/commands/editor-commands.ts:639-647 | 분기 삭제 뒤의 선택이 없음: 같은 자리의 분기 라벨, 없으면 왼쪽 분기 라벨 | 중 |
| I29 | docs/02-ux-design/02-interaction-rules.md:74-75 | src/packages/editor/src/commands/editor-commands.ts:480-482, :811-825, :523-525, src/packages/editor/src/commands/fold-commands.ts:301-302, :625-626 | 빈 default 칸의 나머지 동작이 없음: 붙여넣기도 default를 만듦, 감싸기 · 풀기는 `nothingSelected`, 접기 영역 만들기는 `selectBlocksToFold`, 접기 · 펴기는 그 Case 블록을 선택한 것처럼 동작 | 중 |
| I30 | docs/02-ux-design/02-interaction-rules.md:46 | src/packages/core/src/commands/diagram.ts:103-107, src/packages/core/src/model/head.ts:10-16 | 헤더 종류를 바꿀 때 이름이 비거나 중복되면 거절됨(`emptyHeadName` · `duplicateHeadName`). Event는 전체 텍스트, Method는 괄호 앞이 이름이라 종류를 바꾸면 이름이 달라짐 | 중 |
| I31 | docs/02-ux-design/02-interaction-rules.md:47 | src/packages/editor/src/commands/editor-commands.ts:863-871, :1419-1425 | 헤더에서 삭제 명령은 헤더 제거. 제거 뒤에는 첫 블록을 선택하고, 다이어그램이 함께 사라지면 선택 없음. 문서에 없음 | 중 |
| I32 | docs/02-ux-design/02-interaction-rules.md:95 | src/packages/editor/src/commands/editor-commands.ts:1158-1161, :333-338 | "새 Method를 만들고 호출" 뒤에는 새 Method의 헤더가 선택된 채 남고 호출 블록으로 돌아오지 않음(새 Method로 빼기와 다름). 문서에 없음 | 중 |
| I33 | docs/02-ux-design/02-interaction-rules.md:99 | src/packages/editor/src/session/session.ts:821-825, src/packages/core/src/commands/call.ts:53-56 | 이름 칸을 비우고 닫으면 세 칸이 한 명령이라 함께 고친 인자 · 결과도 버려짐. 문서는 이름이 돌아온다고만 적음 | 중 |
| I34 | docs/02-ux-design/02-interaction-rules.md:104, :411 | src/packages/core/src/commands/call.ts:128-132, :168-173 | 호출할 Method를 바꾸면 이 자리의 접기 영역(`siteFolds`)이 사라지고, 빈 인자는 새 Method의 괄호 안 텍스트로 채워짐. 문서에 없음 | 중 |
| I35 | docs/02-ux-design/02-interaction-rules.md:106-107 | src/packages/editor/src/session/session.ts:642-643 | 헤더가 빈 괄호(`reset()`)인 Method의 호출 블록은 인자 칸과 결과 칸이 모두 열림. 문서는 빈 괄호의 표시만 적음 | 중 |
| I36 | docs/02-ux-design/02-interaction-rules.md:106, :98 | src/packages/core/src/commands/call.ts:53, :272-274 | 인자 · 결과 · 이름의 줄 바꿈은 빈칸으로 바뀌고 이름은 앞뒤 빈칸을 지움. 문서는 "한 줄"이라고만 적음 | 중 |
| I37 | docs/02-ux-design/02-interaction-rules.md:125-127 | src/packages/editor/src/navigation/navigate.ts:221-224, :94-106 | 첫 블록에서 `↑`는 헤더로, 헤더에서 `↓`는 첫 블록으로, 헤더에서 `↑`는 멈춤. 문서에 없음 | 중 |
| I38 | docs/02-ux-design/02-interaction-rules.md:127 | src/packages/editor/src/navigation/navigate.ts:523-528 | 문서: 맨 아래 블록이 If · Case이면 더 들어감. 코드: 반복문이어도 그 본문의 마지막 블록까지 들어감 | 중 |
| I39 | docs/02-ux-design/02-interaction-rules.md:139 | src/packages/editor/src/navigation/navigate.ts:280-284, :486-490 | 맨 오른쪽 분기에서 `→`: default 없는 Case는 빈 default 칸으로 감. 다음 블록을 분기 경계 검사 없이 찾아, 바깥 If의 왼쪽 분기 끝에 있으면 바깥의 옆 분기로 넘어감 | 중 |
| I40 | docs/02-ux-design/02-interaction-rules.md:74, :148 | src/packages/editor/src/navigation/navigate.ts:316-318, :323-346 | 빈 default 칸의 방향키가 없음: 마지막 분기 라벨에서 `→`로 들어옴, `↑`는 Case, `←`는 마지막 분기의 첫 블록, `↓` `→`는 Case 다음 블록 | 중 |
| I41 | docs/02-ux-design/02-interaction-rules.md:138, :148 | src/packages/editor/src/navigation/navigate.ts:309, :318, :477, src/packages/editor/src/i18n/messages.ts:484-486 | 이동 키의 알림이 없음: "그쪽에는 다이어그램이 없습니다." · "맨 왼쪽 분기입니다." · "맨 오른쪽 분기입니다." | 중 |
| I42 | docs/02-ux-design/02-interaction-rules.md:130 | src/packages/editor/src/session/session.ts:1041-1049, src/packages/editor/src/state/editor-state.ts:107-124 | `Esc` 알림 "한 번 더 Esc를 누르면 선택한 것을 풉니다." · "선택한 것을 풀었습니다. …"가 없음. 분기 라벨 · 접기 영역 · 펴 보인 블록은 기억되지 않아 그 앞에 기억한 곳부터 다시 선택함 | 중 |
| I43 | docs/02-ux-design/02-interaction-rules.md:131 | src/packages/editor/src/dom/canvas-view.ts:819-835 | 휠 한 칸의 기준이 없음: 누적 50px(줄 단위 ×40, 쪽 단위 ×400). 블록뿐 아니라 무엇을 선택했든 이동하고, 텍스트 편집 중에는 스크롤 | 중 |
| I44 | docs/02-ux-design/02-interaction-rules.md:135 | src/packages/editor/src/state/selection.ts:76-84 | 실행 취소 뒤 범위의 끝이 사라지면 선택이 없어지지 않고 시작 블록으로 줄어듦. 문서: "사라졌으면 선택한 것이 없다" | 중 |
| I45 | docs/02-ux-design/02-interaction-rules.md:165, :128 | src/packages/editor/src/state/selection.ts:301-313, src/packages/editor/src/commands/editor-commands.ts:1026-1036 | `Shift`+`↑` `↓`는 접힌 것을 하나로 치지 않고 모델의 다음 블록으로 넓힘. 줄 끝이나 블록이 아닌 선택에서는 "같은 부모 안에서만 영역을 넓힐 수 있습니다.", 선택이 없으면 보통 이동. 문서에 없음 | 중 |
| I46 | docs/02-ux-design/02-interaction-rules.md:164, :168 | src/packages/editor/src/state/selection.ts:278-285, src/packages/editor/src/dom/canvas-view.ts:702-712, :718 | `Shift`+클릭의 예외가 없음: 다른 다이어그램이나 블록이 아닌 선택에서는 클릭한 블록만 선택, 접힌 것을 누르면 범위를 넓히지 않음. 여러 블록을 선택한 안을 클릭하면 뗄 때 선택이 바뀜 | 중 |
| I47 | docs/02-ux-design/02-interaction-rules.md:237 | src/packages/core/src/commands/diagram.ts:162-186, src/packages/editor/src/commands/editor-commands.ts:911-912 | 헤더 없는 다이어그램은 Event와 함께 순서를 바꿈. 왼쪽 · 위는 앞으로, 오른쪽 · 아래는 뒤로. 끝에서는 `atTop` · `atBottom`. 문서에 없음 | 중 |
| I48 | docs/02-ux-design/02-interaction-rules.md:235 | src/packages/editor/src/commands/editor-commands.ts:896-900, src/packages/core/src/commands/move.ts:43-46 | 분기 라벨의 위 · 아래 이동은 "분기는 왼쪽 · 오른쪽으로만 이동합니다.", 분기 밖 블록의 좌우 이동은 `notInBranch`로 거절. 문서에 없음 | 중 |
| I49 | docs/02-ux-design/02-interaction-rules.md:258, :135 | src/packages/core/src/commands/wrap.ts:113-130, src/packages/editor/src/commands/editor-commands.ts:562-564 | 모든 분기가 빈 If · Case를 풀면 블록이 사라지고(줄이 비면 빈 블록), 옆 블록이 있으면 선택이 없어짐. 문서: 남은 안의 블록들을 선택 | 중 |
| I50 | docs/02-ux-design/02-interaction-rules.md:253 | src/packages/core/src/commands/wrap.ts:54-64 | Case로 감싸면 둘째 분기(라벨 `2`, 빈 블록)도 생김. 표에는 첫 분기와 default만 있음 | 중 |
| I51 | docs/02-ux-design/02-interaction-rules.md:383 | src/packages/core/src/commands/wrap.ts:35-39, src/packages/core/src/commands/seq-edit.ts:63-71 | 접기 영역과 범위가 같은 블록을 감싸면 그 영역은 바깥에 남아 새 제어 블록을 담음. 문서에 없음 | 중 |
| I52 | docs/02-ux-design/02-interaction-rules.md:279 | src/packages/core/src/commands/extract.ts:83-84 | 문서: 선택 안에 다 든 접기 영역은 새 Method로 감. 코드: 범위가 선택과 똑같은 영역은 원래 자리에 남아 호출 블록을 담음 | 중 |
| I53 | docs/02-ux-design/02-interaction-rules.md:346, :360 | src/packages/editor/src/commands/fold-commands.ts:534-539 | 일부 분기만 접힌 제어 블록에 접기 · 펴기를 쓰면 먼저 모두 폄. 문서에 없음 | 중 |
| I54 | docs/02-ux-design/02-interaction-rules.md:362 | src/packages/editor/src/commands/fold-commands.ts:289-299 | 분기 라벨의 분기가 접을 수 없으면(블록 하나뿐) 그 If · Case 바깥의 접을 수 있는 것에 적용됨. 문서: 그 분기를 접고 편다 | 중 |
| I55 | docs/02-ux-design/02-interaction-rules.md:364 | src/packages/editor/src/commands/fold-commands.ts:126-135, :494-495 | 펴 보인 호출 블록을 접은 뒤의 선택이 없음: 그 호출 블록, 안쪽이면 바깥 호출 안의 `peek` 선택 | 중 |
| I56 | docs/02-ux-design/02-interaction-rules.md:366 | src/packages/editor/src/commands/fold-commands.ts:96-104, :457-466 | 문서: 선택을 온전히 담는 영역을 없앰. 코드: 본문 전체가 접기 영역인 제어 블록이나 분기 라벨을 선택하면 그 안쪽 영역을 없앰 | 중 |
| I57 | docs/02-ux-design/02-interaction-rules.md:434 | src/packages/editor/src/commands/editor-commands.ts:375-378, :1158-1160, :1329-1330 | 삽입 · 새 헤더 · 새 다이어그램 · "새 Method를 만들고 호출"은 이어 적은 텍스트와 실행 취소 단계가 따로임(빼기 · 접기 영역 만들기 · 빈 default 칸만 한 단계). 문서에 없음 | 중 |
| I58 | docs/02-ux-design/02-interaction-rules.md:452 | src/packages/editor/src/commands/drop-command.ts:25-27, :63, :68, src/packages/core/src/commands/move-to.ts:40-47 | 새 블록을 놓거나 감싸면 바로 텍스트 칸이 열림. 제자리에 놓으면 실행 취소 단계가 생기지 않음. 문서에 없음 | 중 |
| I59 | docs/02-ux-design/02-interaction-rules.md:436-454 | src/packages/editor/src/dom/canvas-view.ts:554-560, :895-905 | 드래그 중 `Esc`는 취소이고 다른 키는 무시됨. 이 문서에 없음(취소는 docs/04-design/03-editor.md 3.2에 있음) | 하 |
| I60 | docs/02-ux-design/02-interaction-rules.md:205 | src/packages/editor/src/ui/editor-app.tsx:48, :335-338 | 최근 명령은 8개까지이고 메모리에만 있음. 문서에 없음 | 하 |
| I61 | docs/02-ux-design/02-interaction-rules.md:250 | src/packages/editor/src/commands/editor-commands.ts:117 | 표의 "Do-While / Repeat-Until"에서 Repeat-Until은 코드에 없는 종류 | 하 |
| I62 | docs/02-ux-design/02-interaction-rules.md:430 | src/packages/editor/src/create-editor.ts:657-660, src/packages/core/src/commands/diagram.ts:196-207 | 문서 설정 변경도 실행 취소 대상. 내용의 목록에 없음(헤더 모양만 :53에 있음) | 하 |
| I63 | docs/02-ux-design/02-interaction-rules.md:6 절 전체 | src/packages/editor/src/state/editor-state.ts:95 | 실행 취소 500단계 한도가 이 문서에 없음(docs/04-design/03-editor.md:66에 있음) | 하 |
| I64 | docs/02-ux-design/01-ux-overview.md:51 | src/packages/editor/src/commands/fold-commands.ts:709 | "뷰 상태만 바꾸는 명령은 하나". 코드에는 접기 · 펴기, 펴기, 접기, 접기 영역 보기가 따로 있음 | 하 |

## 시각 디자인 · 화면 배치

대상: `docs/02-ux-design/04-visual-design.md`(5장 밖), `05-screen-layout.md`

| ID | 문서 위치 | 코드 위치 | 빠지거나 다른 것 | 심각도 |
| --- | --- | --- | --- | --- |
| V01 | docs/02-ux-design/04-visual-design.md:135-142 | src/packages/core/src/format/svg-file.ts:49-58, 65-67 | "저장되는 SVG에 들어가는 것"에 모델이 없음. 코드는 `<metadata>` 안에 `<ans:document version drawing-sha256>`과 CDATA 모델 JSON을 넣음. `<metadata>`가 없는 순수 SVG(내보내기)와의 구분도 없음 | 상 (채움) |
| V02 | docs/02-ux-design/04-visual-design.md:434 (7.1 상태 표) | src/packages/editor/src/ui/status-bar.tsx:103-107, src/packages/editor/src/i18n/messages.ts:555, src/packages/editor/src/commands/editor-commands.ts:1055-1061 | 영역 선택 모드 상태가 표에 없음. 코드는 상태 표시줄에 `-- 영역 --`을 보임. 문서에는 `-- 편집 --`만 있음 | 상 (채움) |
| V03 | docs/02-ux-design/05-screen-layout.md:20 | src/packages/editor/src/ui/menu-bar.tsx:133, src/packages/editor/src/ui/styles.ts:47, 303 | 메뉴 바 맨 왼쪽의 제품 이름 "AriadneNSD"(굵게 600, 860px 이하에서 숨김)가 없음 | 상 (채움) |
| V04 | docs/02-ux-design/05-screen-layout.md:21, 24 | src/packages/editor/src/ui/menu-bar.tsx:162, src/packages/editor/src/ui/status-bar.tsx:103-108 | 문서는 상태 표시줄에 "선택한 것과 알림만" 둔다고 함. 코드는 모드 표시와 "보기만 하는 중"도 오른쪽에 두고, 파일 이름 옆에도 "보기만 하는 중"을 둠 | 상 (채움) |
| V05 | docs/02-ux-design/05-screen-layout.md:34 | src/packages/editor/src/create-editor.ts:128-174 | 문서 설정에 "결과 기호"가 있다고 함. 코드의 문서 설정은 언어 · 그림 문구 · 헤더 모양 · 외곽선 · 테마의 다섯뿐이고 결과 기호 칸이 없음 | 상 (앱을 문서에 맞춤) |
| V06 | docs/02-ux-design/05-screen-layout.md:38 | src/packages/editor/src/create-editor.ts:99-127, src/packages/editor/src/i18n/messages.ts:575 | 환경 설정에 "고정폭 글꼴"이 있다고 함. 코드에는 없음. 순서도 다름(코드: 화면 언어 · 키 힌트 · 포커스 테두리 · 자동 저장). 이름은 코드에서 "늘 보이기"임 | 상 (문서를 앱에 맞춤) |
| V07 | docs/02-ux-design/05-screen-layout.md:35 | src/packages/editor/src/i18n/messages.ts:583, src/packages/core/src/text/syntax.ts:68-70 | 문서는 JavaScript와 TypeScript를 따로 나열해 8개로 읽힘. 코드는 "JavaScript · TypeScript" 한 항목으로 모두 7개임 | 상 (채움) |
| V08 | docs/02-ux-design/05-screen-layout.md (없음) | src/packages/editor/src/ui/modals.tsx:296-370, src/packages/editor/src/ui/editor-app.tsx:425-429, src/packages/editor/src/ui/styles.ts:213 | 확인 · 입력 모달이 없음: 제목(기본 "질문"), 메시지, 입력 칸, 버튼 순서(다른 선택 · 취소 · 둘째 선택 · 확인), 폭 460px. `03-editor.md:379`에는 인터페이스만 있음 | 상 (채움) |
| V09 | docs/02-ux-design/05-screen-layout.md (없음) | src/apps/web/src/app.tsx:75, 80-82, src/apps/web/src/web.css:59-71, src/apps/web/src/shell/messages.ts:125 | 파일을 끌어 올 때의 전체 화면 안내가 없음: ".ns.svg · .ns 파일을 놓으면 엽니다", 사방 8px 안쪽, 2px 점선, 반지름 10px, 16px 글자 | 상 (채움) |
| V10 | docs/02-ux-design/04-visual-design.md:420-443 | src/packages/editor/src/ui/status-bar.tsx:108, src/packages/editor/src/ui/menu-bar.tsx:162, src/packages/editor/src/ui/styles.ts:62, 127 | 읽기 전용 상태의 행이 없음. 코드는 "보기만 하는 중"을 파일 이름 옆(12px)과 상태 표시줄(`ui.accent`) 두 곳에 보임 | 중 |
| V11 | docs/02-ux-design/04-visual-design.md:431-433 | src/packages/editor/src/dom/overlay.ts:82-84, 98-103 | 빈 default 칸을 선택한 모습, 접기 영역을 선택한 모습의 행이 없음 | 중 |
| V12 | docs/02-ux-design/04-visual-design.md:430 | src/packages/editor/src/dom/overlay.ts:271, src/packages/editor/src/dom/canvas-view.ts:742 | 호버 조건 누락. 드롭 표시가 있는 동안에는 그리지 않고, 블록에만 그림(헤더 · 분기 라벨 · 펼침 삼각형에는 없음) | 중 |
| V13 | docs/02-ux-design/04-visual-design.md:436 | src/packages/editor/src/dom/canvas-view.ts:571-577 | 문서는 "아무 일도 하지 않은 키"일 때 포커스 테두리가 보인다고 함. 코드는 키 뒤에 선택 · 편집 · 대기 키가 없으면 그 키가 일을 했어도 보임 | 중 |
| V14 | docs/02-ux-design/04-visual-design.md:434 | src/packages/editor/src/dom/canvas-view.ts:273, 275, 321-325 | 인라인 에디터의 최소 폭 60px, 내용에 따라 높이가 늘어남, If · Case 조건은 가운데 정렬이 없음 | 중 |
| V15 | docs/02-ux-design/04-visual-design.md:339-342 (4.3) | src/packages/editor/src/dom/styles.ts:65, src/packages/core/src/render/build-scene.ts:19-26 | 인라인 에디터의 글꼴 목록 `"AriadneNSD Mono", D2Coding, Consolas, "Malgun Gothic", monospace`가 없음. 그림의 목록에 있는 `'Apple SD Gothic Neo'`가 여기에는 빠져 있음 | 중 |
| V16 | docs/02-ux-design/04-visual-design.md:437 | src/packages/editor/src/dom/canvas-view.ts:957-958, src/packages/editor/src/dom/styles.ts:47, 71-72 | 드래그 라벨의 자리(커서에서 +14px, +14px), 안쪽 여백 `2px 6px`, 글자색 `ui.text`, 드래그 중 커서 `grabbing`이 없음 | 중 |
| V17 | docs/02-ux-design/04-visual-design.md:443 | src/packages/editor/src/ui/styles.ts:148-154, src/packages/editor/src/ui/key-hint.tsx:40-44, 96, src/packages/editor/src/create-editor.ts:692, src/packages/editor/src/dom/canvas-view.ts:668-671 | 키 힌트의 세부 값 누락: 여백 `5px 12px 6px 9px`, 반지름 4px, 그림자 `0 4px 14px`, 제목 12px, 키 칸 최소 18px, 창 여백 4px. 선택이 없을 때 캔버스 모서리(+24px)에 뜨는 것과 묶음 이름이 없을 때의 "이어 누를 키"도 없음 | 중 |
| V18 | docs/02-ux-design/04-visual-design.md:423, 424, 426 | src/packages/editor/src/dom/overlay.ts:278-282, src/packages/editor/src/dom/canvas-view.ts:230-240 | 문서는 펼침 삼각형을 "편집할 때는" 그린다고 함. 코드에는 모드 조건이 없어 보기 모드에서도 그림 | 중 |
| V19 | docs/02-ux-design/04-visual-design.md:142 | src/packages/core/src/render/to-svg.ts:40-48, src/packages/core/src/render/outline-text.ts:48-51 | 문서는 "글꼴에 있는 글자를" 도형으로 저장한다고 함. 코드는 텍스트 요소 단위로 판단해, 없는 글자가 하나라도 있으면 그 요소 전체를 텍스트로 둠 | 중 |
| V20 | docs/02-ux-design/04-visual-design.md:139, 142 | src/packages/editor/src/save/serialize.ts:65-68 | 모든 글자가 외곽선이면 글꼴을 넣지 않는다는 것이 없음. 문서는 서브셋 글꼴이 늘 들어가는 것처럼 읽힘 | 중 |
| V21 | docs/02-ux-design/04-visual-design.md:334-335 | src/packages/core/src/render/outline-text.ts:104-107, src/packages/core/src/render/to-svg.ts:146-148 | 합성 굵게의 규칙이 없음. 기울임만 적혀 있음. 코드는 외곽선 저장 때 글자 크기의 1/24~1/32 굵기로 획을 더함 | 중 |
| V22 | docs/02-ux-design/04-visual-design.md:308-313 (4.1) | src/packages/editor/src/ui/styles.ts:229, 251, src/apps/web/src/web.css:69, src/apps/web/index.html:15, 24 | "글자 크기는 두 단계뿐"이라 했으나 화면에는 11px(딱지), 30px(예제 카드 기호), 16px(드롭 안내), 15px · 13px(시작 화면)이 더 있음. 13 · 12px 밖의 화면 크기는 문서에 없음 | 중 |
| V23 | docs/02-ux-design/04-visual-design.md:342 | src/apps/web/src/shell/appearance.ts:9-10, src/apps/web/src/web.css:43-49, src/packages/editor/src/ui/styles.ts:15 | 화면 글꼴의 실제 목록이 없음. 목록도 둘이 다름(`appearance.ts`에만 `"Noto Sans KR"`이 있음) | 중 |
| V24 | docs/02-ux-design/04-visual-design.md:133, 490 | src/apps/web/src/shell/appearance.ts:25-31 | 문서는 화면 색을 "사용자 설정"이라 함. 코드에는 그 설정이 없고 `prefers-color-scheme`만 따름 | 중 |
| V25 | docs/02-ux-design/04-visual-design.md:582 (미결정) | src/packages/editor/src/ui/styles.ts:44, 86, 90, 96, 111, 158, 160, 162, 192, 198, 213, 214 | 화면의 치수가 문서에 없음: 메뉴 바 30px, 툴바 최소 36px, 도구 28px, 구분선 1×20px, 상태 표시줄 26px, 모달 폭 640 · 460 · 1000px, 팔레트 560px, 목록 최대 360px, 막의 위 여백 64 · 72px | 중 |
| V26 | docs/02-ux-design/04-visual-design.md:582 (미결정) | src/packages/editor/src/ui/styles.ts:40, 66-67, 101, 145, 164, 222, 291 | 화면의 모양 값이 문서에 없음: 포커스 윤곽 2px(offset -2), 반지름 6 · 8px, 그림자 `0 6px 18px` · `0 12px 32px` · `0 0 0 2px`, 흐림 0.45 · 0.5, 호버 `brightness(1.1)` | 중 |
| V27 | docs/04-design/03-editor.md:262 (05-screen-layout.md:20이 가리킴) | src/packages/editor/src/commands/fold-commands.ts:709 | 보기 메뉴 표에 "모두 접기 · 모두 펴기"가 있으나 코드에 그 명령이 없음. 같은 문서 270행은 "아직 없습니다"라 하고, `02-interaction-rules.md:365`는 규칙으로 적고 있음 | 중 |
| V28 | docs/02-ux-design/05-screen-layout.md:22 | src/apps/web/src/shell/web-shell.ts:1122-1127, src/packages/editor/src/i18n/messages.ts:334 | 툴바의 "내보내기"는 드롭다운이 아니라 "PNG로 내보내기…"를 바로 실행한다는 것이 없음 | 중 |
| V29 | docs/02-ux-design/05-screen-layout.md:22 | src/packages/editor/src/ui/toolbar.tsx:317-328, src/packages/editor/src/commands/editor-commands.ts:491, 1548-1550 | 감싸기 ▾(If · Case · While · For · Do-While)와 확대 ▾(확대 · 축소 · 100%)의 항목이 없음 | 중 |
| V30 | docs/02-ux-design/05-screen-layout.md:28 | src/apps/web/src/shell/web-shell.ts:666-682, src/apps/web/src/shell/messages.ts:91-92 | 최근 파일의 "최근 파일 없음"(흐린 항목)과 "(브라우저 사본)" 표기가 없음 | 중 |
| V31 | docs/02-ux-design/05-screen-layout.md:31 | src/packages/editor/src/ui/places-modal.tsx:288-293, src/packages/editor/src/ui/messages.ts:253 | 목록이 비었을 때의 문구 "이 브라우저에 저장한 문서가 아직 없습니다."가 없음(`06-web.md:77-100`에도 없음) | 중 |
| V32 | docs/02-ux-design/05-screen-layout.md:34 | src/packages/editor/src/ui/modals.tsx:240, src/packages/editor/src/ui/messages.ts:181, src/packages/editor/src/i18n/messages.ts:589-592 | 문서 설정의 안내 문구, 헤더 모양의 선택지(제목처럼 · 모자 · 아치), 외곽선의 힌트 "어느 뷰어에서나 같은 글자 모양으로 보입니다. 파일이 커집니다."가 없음 | 중 |
| V33 | docs/02-ux-design/05-screen-layout.md:38 | src/packages/editor/src/ui/modals.tsx:164-178, 222, src/packages/editor/src/ui/messages.ts:182 | 환경 설정의 안내 "나에게만, 이 브라우저에 남습니다."와, 켬 · 끔까지 모든 설정이 드롭다운(select)이라는 것이 없음 | 중 |
| V34 | docs/02-ux-design/05-screen-layout.md:40 | src/packages/editor/src/ui/command-palette.tsx:28, 89, 98, 117, src/packages/editor/src/ui/editor-app.tsx:287-296, src/packages/editor/src/ui/styles.ts:160, 192, 198 | 팔레트의 모습이 없음: 입력 안내 "명령 이름을 입력하세요", 결과 없음 문구, 줄마다의 적용 불가 이유, 자기 자신 제외, 예제마다의 명령, 투명한 막, 폭 560px | 중 |
| V35 | docs/02-ux-design/05-screen-layout.md:41 | src/packages/editor/src/ui/modals.tsx:92-119 | 단축키 목록의 구성(열: 명령 · Vim 키 · 표준 키, 메뉴별 묶음)이 없음 | 중 |
| V36 | docs/02-ux-design/05-screen-layout.md:41 | src/packages/editor/src/ui/modals.tsx:273-290, src/packages/editor/src/ui/messages.ts:189-201 | "이 버전에서 바뀐 것" 모달의 구성(제목, 첫 문장, 목록)이 없음 | 중 |
| V37 | docs/02-ux-design/05-screen-layout.md:29-44 | src/packages/editor/src/ui/modals.tsx:48-59, src/packages/editor/src/ui/editor-app.tsx:418-420, 426, 434-436 | 모달의 공통 틀이 없음: 제목 줄과 `✕`, 막을 누르면 닫힘. 확인 · 입력 모달만 막을 눌러도 닫히지 않음 | 중 |
| V38 | docs/02-ux-design/05-screen-layout.md (없음) | src/packages/editor/src/ui/picker-menu.tsx:72-111 | 고르는 목록의 모습이 없음: 맨 위 제목 줄, 항목 1~9의 숫자 키 표시, Method와 다른 항목 사이의 구분선. `03-editor.md:267-268, 380`에는 항목만 있음 | 중 |
| V39 | docs/02-ux-design/05-screen-layout.md:27, 53 | src/packages/editor/src/commands/editor-commands.ts:457, 492, 572, 627, 931, src/packages/editor/src/ui/context-menu.tsx:26-28 | 컨텍스트 메뉴의 자리와, 선택의 종류마다 어떤 항목이 나오는지가 없음 | 중 |
| V40 | docs/02-ux-design/05-screen-layout.md:43 | src/packages/editor/src/ui/examples-modal.tsx:80, src/packages/editor/src/ui/messages.ts:219-220 | 환영 모달 맨 위의 안내 "예제를 하나 열어 보세요. …"가 없음 | 중 |
| V41 | docs/02-ux-design/05-screen-layout.md:43 | src/packages/editor/src/ui/examples-modal.tsx:100, 107-124, src/packages/editor/src/ui/messages.ts:227-231 | 카드의 세부가 없음: 이름 앞 번호, 기호 `+` · `↥`, 설명 "다시 묻지 않습니다" · "새 문서" · ".ns.svg · .ns" | 중 |
| V42 | docs/02-ux-design/05-screen-layout.md:43 | src/packages/editor/src/ui/editor-app.tsx:263-269, 371-383 | 문서는 닫거나 빈 문서를 고를 때만 다시 묻지 않는다고 함. 코드는 예제를 열거나 파일 열기를 골라도 다시 묻지 않음 | 중 |
| V43 | docs/02-ux-design/05-screen-layout.md:43 | src/packages/editor/src/ui/styles.ts:233-235 | 문서는 "좁은 화면은 두 줄 격자"라 함. 코드는 폭 760px 이하에서 2열이고, 이 문서의 좁은 화면 기준 860px과 다름 | 중 |
| V44 | docs/02-ux-design/05-screen-layout.md:50 | src/packages/editor/src/ui/styles.ts:143, 19 | 문서는 편집하기 버튼이 "파란 바탕의 흰 글자"라 함. 코드의 글자색은 `ui.panel`이라 어두운 화면에서는 `#8ba7ff` 위에 `#1a1e26`임 | 중 |
| V45 | docs/02-ux-design/05-screen-layout.md:24, 52 | src/packages/editor/src/ui/view-bar.tsx:31-35, src/packages/editor/src/ui/status-bar.tsx:90-99 | 보기 모드의 막대에는 `✕`가 없어 `warn` 알림을 닫을 수 없음. 문서는 `✕`로 닫는다고만 적음 | 중 |
| V46 | docs/02-ux-design/04-visual-design.md:140 | src/packages/core/src/render/build-scene.ts:180-188, 586-600 | 문서는 `⋯` · `∅`를 "도형(path)"이라 함. 코드는 `<circle>`을 쓰고 `∅`의 빗금만 path임 | 하 |
| V47 | docs/02-ux-design/04-visual-design.md:183 | src/packages/core/src/render/build-scene.ts:126-129 | `block.process`의 역할에 빈 default 칸의 배경이 없음 | 하 |
| V48 | docs/02-ux-design/04-visual-design.md:211, 213, 217, 218 | src/packages/editor/src/ui/styles.ts:54, 124, 126, 181, 229, 252, 262, 279 | 토큰의 역할 누락. `ui.bg`는 입력 칸 · 버튼 바탕, `ui.panel`은 표 머리줄, `ui.accent` · `ui.accent-soft`는 메뉴 호버 글자 · 딱지 · 세그먼트 · 예제 카드에도 쓰임 | 하 |
| V49 | docs/02-ux-design/04-visual-design.md:223 | src/packages/editor/src/ui/styles.ts:10-11, 18-19 | `ui.accent` 5.71 / 7.89의 바탕이 적혀 있지 않음. 계산하면 `ui.bg` 위의 값이고, 패널 위는 6.46 / 7.21임 | 하 |
| V50 | docs/02-ux-design/04-visual-design.md:212 | src/packages/editor/src/dom/styles.ts:30 | 배경 점의 반지름 1px이 없음 | 하 |
| V51 | docs/02-ux-design/04-visual-design.md:507 | src/packages/editor/src/dom/overlay.ts:217 | 문서는 가로세로 사각형에 `crispEdges`를 쓴다고 함. 편집 레이어의 사각형에는 없음 | 하 |
| V52 | docs/02-ux-design/04-visual-design.md:532-537 (9.4) | src/packages/editor/src/dom/styles.ts:32, src/packages/editor/src/dom/canvas-view.ts:350, 965-989 | "움직임은 두지 않습니다"에 예외가 빠짐: 포커스 테두리는 나타날 때도 0.3초 전환, 드래그 자동 스크롤(가장자리 32px, 프레임당 최대 16px). 선택을 따라갈 때의 여유 8px도 없음 | 하 |
| V53 | docs/02-ux-design/04-visual-design.md:571 | src/packages/editor/src/dom/styles.ts:35-36 | 문서는 설정을 켜면 "항상 보입니다"라 함. 코드는 캔버스에 포커스가 있고 선택이 없을 때만 보임 | 하 |
| V54 | docs/02-ux-design/04-visual-design.md:207-221 (3.4) | src/apps/web/index.html:17, 25 | 시작 화면의 하드코딩 색 `#444` · `#a40000`이 없음 | 하 |
| V55 | docs/02-ux-design/05-screen-layout.md:24 | src/packages/editor/src/ui/status-bar.tsx:68-76 | 상태 표시줄의 물음에 있는 닫기 `✕`가 없음 | 하 |
| V56 | docs/02-ux-design/05-screen-layout.md:21 | src/packages/editor/src/ui/menu-bar.tsx:149, 156 | 딱지의 툴팁 "파일이 아니라 이 브라우저에 저장된 문서"와 `●`의 툴팁 "저장 안 됨"이 없음 | 하 |
| V57 | docs/02-ux-design/05-screen-layout.md:41 | src/packages/editor/src/ui/modals.tsx:257, src/packages/editor/src/ui/messages.ts:184 | 정보 모달의 첫 문장 "NS 차트(Nassi-Shneiderman Diagram) 편집기."가 없음 | 하 |
| V58 | docs/02-ux-design/05-screen-layout.md:42 | src/packages/editor/src/examples/examples.ts:81, 105 | 예제 이름이 다름. 문서 "UART 명령(Case)" · "미로 찾기", 코드 "UART 명령" · "미로 찾기 (아리아드네의 실)" | 하 |
| V59 | docs/02-ux-design/05-screen-layout.md:44 | src/packages/editor/src/ui/toolbar.tsx:329-335, src/packages/editor/src/ui/styles.ts:85-89 | 문서는 예제 버튼이 "툴바 오른쪽 끝"이라 함. 코드는 확대 바로 뒤에 왼쪽부터 놓이고, 좁은 화면에서는 뒤에 도움말 버튼이 옴 | 하 |
| V60 | docs/02-ux-design/05-screen-layout.md:21, 31 | src/packages/editor/src/ui/styles.ts:11 | 토큰 이름이 다름. 이 문서는 `ui.accentSoft`, `04-visual-design.md:218`과 코드는 `ui.accent-soft`(`--ui-accent-soft`) | 하 |
| V61 | docs/02-ux-design/05-screen-layout.md:21 | src/packages/editor/src/ui/editor-app.tsx:399-409 | 파일이 둘 이상일 때의 편집기 탭 줄이 코드에 없음(문서는 데스크톱의 모습으로 적음) | 하 |
| V62 | docs/04-design/06-web.md:258 | src/packages/editor/src/commands/editor-commands.ts:456, src/packages/editor/src/ui/icons.tsx:56-63, src/packages/editor/src/ui/toolbar.tsx:2 | 아이콘 id에 `block.for`가 있으나 툴바에는 For가 없음. 그림만 코드에 남아 있고, 코드 주석도 "six block icons"임 | 하 |

## 모델 · 레이아웃 · 파일 형식

대상: `docs/04-design/01-model.md`, `02-layout.md`, `docs/05-spec/01-file-format.md`, `02-model-schema.md`

| ID | 문서 위치 | 코드 위치 | 빠지거나 다른 것 | 심각도 |
| --- | --- | --- | --- | --- |
| M01 | docs/04-design/01-model.md:46-51 | src/packages/core/src/model/types.ts:39-44 | `Settings` 타입에 `textOutlines?: boolean`이 없음. 코드에는 있고, 없으면 꺼짐 | 상 (채움) |
| M02 | docs/04-design/01-model.md:310 | src/packages/core/src/commands/call.ts:168-173 | 문서는 "`target`만 바꾸고 `args` · `result`는 남긴다". 코드의 `setCallTarget`은 `siteFolds: []`로 비우고, 빈 `args`를 Method의 괄호 안 글자로 채움. Method가 아니면 `wrongKind`, 같은 Method면 그대로 | 상 (채움) |
| M03 | docs/04-design/01-model.md:310-312 (4.1 "호출" 묶음) | src/packages/core/src/commands/call.ts:191-206, 223-243 | 명령 `insertCall`과 `newMethodAndCall`의 행이 없음(첫 `args`는 괄호 안 글자, 새 Method와 호출 블록을 undo 한 단계로 만듦, `touched`는 다이어그램 · 호출 블록). 조작 설명만 docs/02-ux-design/02-interaction-rules.md:95, 105에 있음 | 상 (채움) |
| M04 | docs/04-design/02-layout.md:88-93 | src/packages/core/src/layout/types.ts:46-150, 157-195, 221 | `LayoutResult.nodes`(11종 `LayoutNode`, 그리는 순서)와 `HitRegion` 8종의 구조가 없음. `buildScene`의 입력인데 정의되지 않음 | 상 (채움) |
| M05 | docs/04-design/02-layout.md:229 | src/packages/core/src/render/to-svg.ts:37, 62-105, 153-161 | 요소별 SVG 출력 형식이 없음: `shape-rendering="crispEdges"`, `stroke-dasharray`, `stroke-linecap="round"`, 닫는 `Z`, `text-anchor`(start면 생략), `xml:space="preserve"`, 테두리의 `stroke-width`(2배) · `stroke-linejoin="round"` · `paint-order="stroke"`, `tspan`의 `font-weight` · `font-style="italic"` | 상 (채움) |
| M06 | docs/04-design/02-layout.md:233; docs/05-spec/01-file-format.md:242 | src/packages/core/src/render/to-svg.ts:129-149 | 문서는 텍스트 요소 하나가 `<path>` 하나(굵으면 둘, 테두리 하나 더). 코드는 색마다 보통 · 굵게 경로를 따로 내고, 테두리도 보통 · 굵게로 나뉨. 구문 강조가 있으면 경로가 더 많음 | 상 (문서를 앱에 맞춤) |
| M07 | docs/04-design/02-layout.md:250-255 | src/packages/core/src/text/syntax.ts:44-85 | 언어마다의 키워드 목록이 없음(예시 몇 개뿐) | 상 (채움) |
| M08 | docs/04-design/01-model.md:361 | src/packages/core/src/format/model-json.ts:74, 114, 187 | 생략 필드 목록에 `settings.textOutlines`(끔), `SiteFold.name`(없음), `lost.file`(없음)이 빠졌는데 "그 밖에는 항상 기록합니다"라고 적음 | 중 |
| M09 | docs/04-design/01-model.md:280 | src/packages/core/src/commands/types.ts:65, 70; delete.ts:27-29; move.ts:43-46 | `ReasonCode`의 `alreadyEmpty`(하나뿐인 빈 블록 삭제), `notInBranch`(분기 밖에서 좌우 이동)가 없음 | 중 |
| M10 | docs/04-design/01-model.md:312 | src/packages/core/src/commands/call.ts:43-47, 53, 124, 272-274 | `editCall` · `nameCallTarget`의 규칙이 없음: 줄 바꿈은 공백으로, 이름은 trim, `local` 호출의 빈 `args`는 괄호 안 글자로 다시 채움 | 중 |
| M11 | docs/04-design/01-model.md:316 | src/packages/core/src/commands/diagram.ts:51-53, 334, 348-350 | 괄호 삭제 시 `args`를 비우는 것만 적음. 괄호가 있으면 호출 블록의 빈 `args`를 괄호 안 글자로 채우는 규칙이 없음(`args.trim() === ''` 기준) | 중 |
| M12 | docs/04-design/01-model.md:315 | src/packages/core/src/commands/diagram.ts:96-98, 103-107, 275-285 | 새 헤더의 기본 이름(`Event n` · `Method n`, 쓰지 않은 가장 작은 n, 언어 무관)과, 종류를 바꿀 때 글자를 유지하고 이름을 다시 검증(`emptyHeadName` · `duplicateHeadName`)하는 규칙이 없음 | 중 |
| M13 | docs/04-design/01-model.md:313 | src/packages/core/src/commands/diagram.ts:234-247 | "그 종류의 맨 뒤"만 적음. 헤더 없는 다이어그램은 Event 쪽이고, 같은 종류가 없으면 Method는 문서 맨 뒤, Event는 문서 맨 앞 | 중 |
| M14 | docs/04-design/01-model.md:317 | src/packages/core/src/commands/diagram.ts:173-182, 357-359 | 문서는 "Event는 Event끼리". 코드는 Event와 헤더 없는 다이어그램이 한 무리. 끝에서는 `atTop` · `atBottom` | 중 |
| M15 | docs/04-design/01-model.md:309 | src/packages/core/src/commands/branch.ts:105-111, 137 | If → Case의 새 둘째 분기 라벨(`freshArmLabel([first])`), Case → If의 조건(분기 하나 + default가 아니면 `notConvertible`), 빈 라벨은 `label`을 두지 않음이 없음 | 중 |
| M16 | docs/04-design/01-model.md:281 | src/packages/core/src/commands/branch.ts:79-81 | `offerConvertCaseToIf`는 default가 있을 때만 나옴(`arms.length === 1 && otherwise !== null`). 문서에는 이 조건이 없음 | 중 |
| M17 | docs/04-design/01-model.md:128 | src/packages/core/src/commands/../layout/layout.ts:573; format/parse-model.ts:386; format/model-json.ts:121 | 문서는 default 라벨이 "항상 default". 코드는 파일의 `otherwise.label`을 읽고 그리고 다시 기록함 | 중 |
| M18 | docs/04-design/01-model.md:295 | src/packages/core/src/commands/insert.ts:26, 41-42, 50 | `insertBlock`의 `besideEmpty` 인자(빈 블록 곁에 처리 블록 삽입, UX KP2)가 없음 | 중 |
| M19 | docs/04-design/01-model.md:301, 198 | src/packages/core/src/commands/clipboard.ts:104, 114-131, 134-153, 188 | 붙여넣기: `names`가 없고 Method도 없으면 `lastName: ''`, 클립의 깨지거나 걸치는 접기 영역은 버림, `siteFolds`는 id만 새로 받고 `first` · `last` · `via`는 유지(1.7의 "새 id로 매핑"과 다름) | 중 |
| M20 | docs/04-design/01-model.md:303 | src/packages/core/src/commands/wrap.ts:95-115 | 풀기의 대상 규칙이 없음: 호출 블록 하나면 `inlineCall`, 제어 블록 하나면 그것, 아니면 가장 가까운 바깥 제어 블록, 없으면 `noControlBlock`. "내용이 있는"의 기준은 모든 블록이 빈 블록이 아닌 줄(`isEmptySeq`) | 중 |
| M21 | docs/04-design/01-model.md:319 | src/packages/core/src/commands/fold.ts:120 | `makeSiteFold`는 Method의 접기 영역과 같은 범위여도 `foldExists`, 걸치면 `foldsCross`로 거절. 문서는 "같은 위치에 같은 범위"와 `notContiguous`만 적음 | 중 |
| M22 | docs/04-design/01-model.md:299, 343 | src/packages/core/src/commands/move.ts:51, 79-84; seq-edit.ts:196-213 | 이동 전에 범위에 걸친 접기 영역을 줄이는 단계(`shrinkCrossing`)와, 제어 블록 밖으로 나온 블록이 그 제어 블록에서 끝나는 접기 영역에 합류하는 규칙(`insertAt`의 `after` · `before`)이 없음 | 중 |
| M23 | docs/04-design/01-model.md:348 | src/packages/core/src/commands/common.ts:40; insert.ts:70; move-to.ts:57-65; clipboard.ts:79 | 끝에 합류하는 규칙을 "삽입"으로만 적음. `moveTo`와 `paste`도 대상 블록 곁이면 접기 영역에 합류함 | 중 |
| M24 | docs/04-design/01-model.md:339 | src/packages/core/src/commands/seq-edit.ts:18-33 | 규칙 F에 정리 단계가 없음: 편집 뒤 범위가 같아진 접기 영역은 앞의 것만 남기고, 깨진 것은 버림(`cleanFolds`) | 중 |
| M25 | docs/04-design/01-model.md:245-256, 287 | src/packages/editor/src/session/session.ts:527-532; src/packages/core/src/commands/common.ts:106-111 | 시퀀스 그림은 명령이 불변식을 검사함. 코드는 명령이 검사하지 않고 `editor`의 `apply`가 검사함 | 중 |
| M26 | docs/04-design/01-model.md:322 | src/packages/core/src/commands/diagram.ts:194, 201-207 | 문서 설정 행의 규칙 칸이 비어 있음: 명령 `setSettings`, 바꿀 것만 받음, 같은 값이면 그대로, `touched`는 빈 목록, undo 대상 | 중 |
| M27 | docs/04-design/01-model.md:73, 77 | src/packages/core/src/model/head.ts:10-16, 23-33 | 이름은 trim, 받는 것은 첫 `(`부터 마지막 `)`까지(없으면 끝까지) trim. 01-model과 docs/02-ux-design/02-interaction-rules.md:44에 마지막 `)` 규칙이 없음 | 중 |
| M28 | docs/04-design/02-layout.md:145 | src/packages/core/src/layout/layout.ts:233 | 문서는 "제목처럼" 헤더 높이가 `space.line`을 쓴 40px 고정. 코드는 `text.height`라 여러 줄이면 높아짐 | 중 |
| M29 | docs/04-design/02-layout.md:145 | src/packages/core/src/layout/layout.ts:242-244 | 라벨의 글자(`Event` · `Method`, 모든 언어에서 같음)가 없음 | 중 |
| M30 | docs/04-design/02-layout.md:91 | src/packages/core/src/layout/types.ts:213-218; layout.ts:174, 717, 1051 | `boxes`는 블록만이 아니라 다이어그램 · 분기 · 접기 영역의 상자도 담음 | 중 |
| M31 | docs/04-design/02-layout.md:92 | src/packages/core/src/layout/layout.ts:767-773, 728 | 펼침 삼각형의 영역은 `x + 1`부터 폭 18, 접힌 칸에서는 높이가 이름 + 2·`space.pad-y`까지. 문서는 "왼쪽 끝 18px"만 적음 | 중 |
| M32 | docs/04-design/02-layout.md:92 | src/packages/core/src/layout/types.ts:152-156 | 클릭 영역의 순서 규칙(바깥 먼저, 뒤의 것이 위)이 없음 | 중 |
| M33 | docs/04-design/02-layout.md:108 | src/packages/core/src/layout/layout.ts:648, 660 | 남는 높이는 "블록 수"가 아니라 보이는 항목 수로 나눔(접기 영역 하나가 한 항목) | 중 |
| M34 | docs/04-design/02-layout.md:161 | src/packages/core/src/layout/layout.ts:412-414, 657-659, 669 | 아래쪽 들여쓰기는 줄의 마지막 항목이 테두리가 있을 때만 적용됨 | 중 |
| M35 | docs/04-design/02-layout.md:121 | src/packages/core/src/layout/layout.ts:609-614; call-text.ts:24, 47 | 호출 블록 폭은 세 부분을 따로 올림해 더함. 글자 조립 규칙(`result 기호 `, 헤더에 괄호가 있거나 인자가 있으면 `(args)`)이 없음 | 중 |
| M36 | docs/04-design/02-layout.md:164 | src/packages/core/src/layout/layout.ts:372-380; src/packages/core/src/i18n/messages.ts:37-38, 46-47 | 기본 이름의 규칙이 없음: 첫 줄만, 호출 블록은 호출문, 비면 `(빈 블록)`, 블록 하나면 "외 n개"를 붙이지 않음, n은 줄의 직접 블록 수 - 1 | 중 |
| M37 | docs/04-design/02-layout.md:164 | src/packages/core/src/layout/layout.ts:439, 449; render/build-scene.ts:208 | 문서는 "한 줄에 표시". 접힌 칸의 이름은 줄 바꿈대로 여러 줄이고, 띠의 이름만 한 줄로 합침 | 중 |
| M38 | docs/04-design/02-layout.md:131 | src/packages/core/src/layout/layout.ts:540-541; render/build-scene.ts:537-539 | 파일의 `label: ""`은 기본 라벨로 돌아가지 않고 아무것도 그리지 않음(`??` 사용) | 중 |
| M39 | docs/04-design/02-layout.md:179 | src/packages/core/src/layout/layout.ts:262-263, 275 | 후보의 끝은 두 그룹 중 더 높은 쪽의 한 줄 높이이고, 그 높이 이상인 첫 4px 단계까지 시도함(`limit <= highest + 3`) | 중 |
| M40 | docs/04-design/02-layout.md:179-180 | src/packages/core/src/layout/layout.ts:269-271, 277 | 비율은 `space.paper`를 뺀 크기로 `\|폭/높이 - 1.6\|`을 계산함(허용 오차 `1e-9`). 문서는 "문서 전체의 폭 · 높이" | 중 |
| M41 | docs/04-design/02-layout.md:98, 294 (2.1의 205행과도 다름) | src/packages/core/src/render/build-scene.ts:257, 298, 359, 431; render/outline-text.ts:100-107 | 문서는 굵은 텍스트를 미결정 · MVP 뒤로 적음. 코드는 호출 이름 · 띠 이름 · 제목 헤더를 `weight: 600`으로 그리고 번들 글꼴의 폭 표로 잼 | 중 |
| M42 | docs/04-design/02-layout.md:62 | src/packages/core/src/render/render-doc.ts:39, 64; build-scene.ts:51-55; to-svg.ts:35; src/packages/core/src/export/paginate.ts:84; export/pdf.ts:31-36 | 문서는 "시그니처는 정하지 않았습니다". 코드에는 시그니처가 있고 `renderDoc` · `savedDrawing`이 문서에 없음 | 중 |
| M43 | docs/04-design/02-layout.md:229 | src/packages/core/src/render/to-svg.ts:188-191 | 숫자 형식(소수 둘째 자리까지, 끝의 0 없음, `-0`은 `0`)이 외곽선 말고는 없음 | 중 |
| M44 | docs/04-design/02-layout.md:229 | src/packages/core/src/render/to-svg.ts:195-203 | 그림의 글자에서 XML에 쓸 수 없는 문자를 지우고 `&` `<` `>`를 이스케이프하는 규칙이 없음 | 중 |
| M45 | docs/04-design/02-layout.md:229 | src/packages/core/src/render/build-scene.ts:19-26 | 폴백 글꼴 목록의 값(`D2Coding`, `Consolas`, `'Malgun Gothic'`, `'Apple SD Gothic Neo'`, `monospace`)이 없음. `docs/` 어디에도 없음 | 중 |
| M46 | docs/04-design/02-layout.md:243 | src/packages/core/src/render/to-svg.ts:156-160 | 토큰 색이 글자색과 같으면 `tspan`을 쓰지 않음(흑백 인쇄 테마는 `tspan`이 없음) | 중 |
| M47 | docs/04-design/02-layout.md:252 | src/packages/core/src/text/syntax.ts:122, 257-258 | Java도 `'''…'''`를 여러 줄 문자열로 읽음. 문서는 `"""…"""`만 | 중 |
| M48 | docs/04-design/02-layout.md:253 | src/packages/core/src/text/syntax.ts:131 | JavaScript에서도 `$`가 이름의 일부인데 표에 없음 | 중 |
| M49 | docs/04-design/02-layout.md:254 | src/packages/core/src/text/syntax.ts:144 | Python 문자열 접두사 24개의 목록이 없음(예 둘뿐) | 중 |
| M50 | docs/04-design/02-layout.md:255 | src/packages/core/src/text/syntax.ts:245-249 | Bash의 "토큰 처음"은 텍스트 맨 앞이거나 앞 글자가 `[\s;\|&()]`일 때임 | 중 |
| M51 | docs/04-design/02-layout.md:250-251 | src/packages/core/src/text/syntax.ts:321-326, 352-356 | 지시문은 앞에 공백이 있어도 되고, `#` 뒤 `[A-Za-z_]+`까지이며, 글자가 없으면 키워드가 아님 | 중 |
| M52 | docs/04-design/02-layout.md:257 | src/packages/core/src/text/syntax.ts:262, 273 | 문자열 안 백슬래시 규칙이 없음: 다음 글자를 건너뛰되 줄 바꿈은 건너뛰지 않음 | 중 |
| M53 | docs/04-design/02-layout.md:258 | src/packages/core/src/text/syntax.ts:281-306 | 숫자의 정확한 문법이 없음: `[0-9A-Za-z_.]`를 이어 먹고(`123abc`도 한 숫자), `+` · `-`는 `e` · `E` · `p` · `P` 뒤에서만 | 중 |
| M54 | docs/04-design/02-layout.md:242 | src/packages/core/src/text/syntax.ts:200-203 | 판별 순서(주석 → 문자열 → 숫자 → 이름 → 그 밖)가 없음 | 중 |
| M55 | docs/04-design/02-layout.md:284 | src/packages/core/src/export/paginate.ts:22-45 | 종이를 고르는 규칙과 Letter 지역 14곳(`BZ CA CL CO CR GT MX NI PA PH PR SV US VE`)이 없음. docs/04-design/06-web.md:115에도 목록은 없음 | 중 |
| M56 | docs/04-design/02-layout.md:286 | src/packages/core/src/export/paginate.ts:156-174 | 자르면 안 되는 상자에 접힌 줄, 접힌 칸, 접기 영역 띠, 펴 보기 띠가 빠짐 | 중 |
| M57 | docs/04-design/02-layout.md:287 | src/packages/core/src/export/paginate.ts:100-104 | 문서는 "다이어그램의 폭"이 페이지를 넘을 때. 코드는 그림 전체의 폭(`layout.width`, 종이 여백 포함)으로 판단함 | 중 |
| M58 | docs/04-design/02-layout.md:289 | src/packages/core/src/export/pdf.ts:25, 271 | 문서는 `text.muted` 색. 코드는 테마와 상관없이 `#5a6476` 고정 | 중 |
| M59 | docs/04-design/02-layout.md:290 | src/packages/core/src/export/pdf.ts:49, 51 | 페이지마다 종이 색으로 채우고 반 픽셀 옮기는 것이 없음 | 중 |
| M60 | docs/04-design/02-layout.md:290 | src/packages/core/src/export/pdf.ts:323-359, 417, 420, 503-506 | 빈 상자 글리프의 치수(바깥 100-900 × -100-800, 안 160-840 × -40-740, 1000 단위 기준), `/Producer`, 폼의 `/BBox [-2000 -2000 4000 4000]`, 숫자 소수 셋째 자리가 없음 | 중 |
| M61 | docs/05-spec/01-file-format.md:159 | src/packages/core/src/format/svg-file.ts:148-149 | 문서의 코드 표기 안에 U+FFFE · U+FFFF 문자 자체가 들어 있음(바이트 `EF BF BE`, `EF BF BF`). 코드가 쓰는 글자는 `￾` · `￿` | 중 |
| M62 | docs/05-spec/01-file-format.md:42 | src/packages/core/src/format/model-element.ts:61-64, 170-172 | 문서는 XML이 깨지면 `damaged`. 루트 요소를 보기 전에 깨졌거나 루트가 SVG가 아니면 `noModel` | 중 |
| M63 | docs/05-spec/01-file-format.md:41 | src/packages/core/src/format/model-element.ts:174-176, 203-204; parse-model.ts:101-103 | `prototype`의 경로가 둘임: 모델 요소 없이 `metadata id`가 있을 때, 또는 모델 요소의 JSON이 `version: 0`일 때. 문서는 한 조건처럼 적음 | 중 |
| M64 | docs/05-spec/01-file-format.md:90-91 | src/packages/core/src/format/model-element.ts:177-178 | 읽을 때는 접두어를 보지 않고 네임스페이스와 이름만 봄(`ans`가 아니어도 받음) | 중 |
| M65 | docs/05-spec/01-file-format.md:157, 264 | src/packages/core/src/format/model-element.ts:1-3, 40-43, 273-312 | 문서는 "XML 파서". 코드는 자체 스캐너이고 그 규칙이 없음: BOM 허용, DTD 엔터티 미해석, 미리 정의된 5개와 문자 참조만, 속성 중복 · 모델 요소의 자식 · 루트 둘은 `damaged` | 중 |
| M66 | docs/05-spec/01-file-format.md:249-252 | src/packages/core/src/format/parse-model.ts:98-100, 111-115 | 정수가 아니거나 음수인 `version`, 마이그레이션이 없는 버전은 `damaged`. 문서에 없음 | 중 |
| M67 | docs/05-spec/01-file-format.md:169, 173 | src/packages/core/src/format/parse-model.ts:311-312, 441-444 | `"head": null`, `"otherwise": null`은 깨진 파일임. 문서는 생략만 적음(모델 타입은 `null`) | 중 |
| M68 | docs/05-spec/01-file-format.md:184 | src/packages/core/src/format/parse-model.ts:547-549 | `view.folded`의 값은 문자열이면 받고 id 형식을 검사하지 않음 | 중 |
| M69 | docs/05-spec/01-file-format.md:143, 145 | src/packages/core/src/format/model-json.ts:298-307 | `opened`의 정렬 규칙(앞에서부터 원소별 문서 순서, 같으면 짧은 경로 먼저)이 없음 | 중 |
| M70 | docs/05-spec/01-file-format.md:190 | src/packages/core/src/format/model-json.ts:64 | 문서는 "바꾸지 않았으면". 코드는 값만 비교하므로, 바꿨다가 원래 언어로 돌아와도 보존한 값을 기록함 | 중 |
| M71 | docs/05-spec/01-file-format.md:93, 244 | src/packages/editor/src/save/serialize.ts:65-68 | 외곽선이 꺼진 문서는 글자가 하나도 없어도 빈 서브셋의 `@font-face`를 넣음. 문서는 외곽선의 경우만 적음 | 중 |
| M72 | docs/05-spec/01-file-format.md:186-187 | src/packages/core/src/format/parse-model.ts:268-274 | 문자열이 아닌 `textKind` · `theme`과, 모르는 `headStyle`은 `damaged`(앞으로의 값을 보존하지 않음). `locale`만 명시됨 | 중 |
| M73 | docs/05-spec/02-model-schema.md:374 | src/packages/core/src/format/parse-model.ts:98-103 | 문서는 `version`이 1보다 낮으면 마이그레이션해 읽음. 코드에서 0은 `prototype`, 음수는 `damaged`라 그런 경로가 없음 | 중 |
| M74 | docs/05-spec/02-model-schema.md:375 | src/packages/core/src/format/parse-model.ts:547-549 | "`view`의 목록은 꼴만 본다"는 `opened`에만 맞음. `folded`는 꼴도 보지 않음 | 중 |
| M75 | docs/04-design/01-model.md:298 | src/packages/core/src/commands/edit-text.ts:29-31, 44-46 | `editText`는 호출 블록과 다이어그램을 `unsupported`로 거절함. 문서는 한 명령처럼 묶어 적음 | 하 |
| M76 | docs/04-design/01-model.md:231 | src/packages/core/src/commands/common.ts:114-116 | 정규화는 `done`에서만 함. 바뀐 것이 없는 `unchanged`는 하지 않음 | 하 |
| M77 | docs/04-design/01-model.md:305 | src/packages/core/src/commands/extract.ts:105 | 접기 영역 이름을 Method 이름으로 쓸 때 줄 바꿈을 공백으로 바꾸고 trim함 | 하 |
| M78 | docs/04-design/01-model.md:318 | src/packages/core/src/commands/fold.ts:14, 24-26, 44 | `makeFold`는 `name` 인자를 받고, `blocks`가 아닌 대상은 `wrongKind` | 하 |
| M79 | docs/04-design/01-model.md:304 | src/packages/core/src/commands/inline.ts:36-38 | `inlineCall`이 호출의 `args` · `result`를 버리는 것이 없음 | 하 |
| M80 | docs/04-design/01-model.md:266-277 | src/packages/core/src/commands/types.ts:120-126 | `Side`, `NewBlockKind`, `WrapKind` 타입이 없음 | 하 |
| M81 | docs/04-design/01-model.md:358 | src/packages/core/src/format/model-json.ts:66-67 | 맨 위 키에 `format` · `version`이 없음 | 하 |
| M82 | docs/04-design/02-layout.md:132 | src/packages/core/src/layout/call-text.ts:44-46 | "(이름 없음)"은 Method뿐 아니라 이름이 빈 모든 대상 종류에 적용됨 | 하 |
| M83 | docs/04-design/02-layout.md:229 | src/packages/core/src/render/scene.ts:33; render/to-svg.ts:60-93 | 장면의 `blockId`는 SVG에 나가지 않음(`data-*` 속성 없음). 문서에 명시가 없음 | 하 |
| M84 | docs/04-design/02-layout.md:259 | src/packages/core/src/text/syntax.ts:172-173 | 이름의 문자 범위(`\p{L}\p{Nl}_`로 시작, `\p{L}\p{M}\p{N}_`로 이어짐)가 없음 | 하 |
| M85 | docs/04-design/02-layout.md:287 | src/packages/core/src/export/paginate.ts:128-139 | 모든 페이지가 빠지면 한 페이지를 내는 규칙이 없음 | 하 |
| M86 | docs/05-spec/02-model-schema.md:375 (364행과 비교) | src/packages/core/src/model/invariants.ts:149-158 | `first` · `last`를 "꼴만 본다"고 적었으나 접기 영역은 불변식 5가 소속까지 검사함 | 하 |
| M87 | docs/05-spec/02-model-schema.md:155 | src/packages/core/src/layout/layout.ts:256-257, 286 | `diagrams`는 "렌더링하는 순서"라고 적었으나 왼쪽 그룹 다음 오른쪽 그룹 순으로 그림 | 하 |
| M88 | docs/05-spec/02-model-schema.md:385; src/packages/core/schema/model.schema.json:5 | src/packages/core/src/model/invariants.ts:130-138 | 스키마 설명은 "neither a header nor blocks". 코드는 헤더가 없고 빈 처리 블록 하나인 다이어그램 | 하 |
| M89 | docs/05-spec/01-file-format.md:73 | src/packages/core/src/format/svg-file.ts:159-164 | 크기는 유한한 0 이상의 수만 받고 그렇지 않으면 예외. 문서에 없음 | 하 |
| M90 | docs/05-spec/01-file-format.md:80 | src/packages/core/src/format/base64.ts:5; svg-file.ts:153-155 | base64는 패딩 있고 줄 바꿈 없음, 글꼴 이름에 `"` `\` `<` `>` `&`가 있으면 예외. 문서에 없음 | 하 |
| M91 | docs/05-spec/01-file-format.md:231 | src/packages/core/src/format/svg-file.ts:127-130 | "알 수 없음"은 지문이 없는 파일뿐 아니라 모델 요소를 찾지 못한 파일도 해당됨 | 하 |
| M92 | docs/05-spec/01-file-format.md:147 | src/packages/core/src/i18n/messages.ts:32-38, 41-47 | 고정 문구 목록에 `default`, `(빈 블록)`, "외 n개"가 빠짐 | 하 |
| M93 | docs/05-spec/01-file-format.md:140 | src/packages/core/src/format/model-json.ts:53 | `JSON.stringify` 그대로라 비 ASCII를 이스케이프하지 않음. 바이트 재현에 필요하나 문서에 없음 | 하 |
| M94 | docs/05-spec/01-file-format.md:263 | src/packages/core/src/format/svg-file.ts:97 | 그림의 `deserialize`는 코드에서 `openSvgFile` | 하 |
| M95 | docs/05-spec/01-file-format.md:92 | src/packages/core/src/format/sha256.ts:15-21 | 짝 없는 서로게이트는 U+FFFD로 해시함. 문서에 없음 | 하 |

## 편집기 · 웹

대상: `docs/04-design/03-editor.md`, `06-web.md`

| ID | 문서 위치 | 코드 위치 | 빠지거나 다른 것 | 심각도 |
| --- | --- | --- | --- | --- |
| E01 | `docs/04-design/03-editor.md:24-61` (1 · 2장, 모듈 지도 없음) | `src/packages/editor/src/session/session.ts:76-112`, `:118-1112` | 편집의 중심 클래스 `EditorSession`이 없다. 상태 · undo · 알림 · 물음 · 인라인 에디터 · 키 읽기를 맡는 클래스다. 공개 메서드(`commit`, `apply`, `setView`, `handleKey`, `startEditing`, `commitEditing` 등)와 `SessionOptions` · `LoadOptions` · `After`도 없다. 문서가 경로로 적은 모듈은 `model/shown-index.ts`, `navigation/shown-selection.ts` 둘뿐이다 | 상 (채움) |
| E02 | `docs/04-design/03-editor.md:69`, `:207`, `:271` | `src/packages/editor/src/state/editor-state.ts:7-63` | `Editing`을 쓰면서 정의하지 않는다. `EditField`(6종), `CallPart`(`args` · `result` · `name`), `Caret`(`selectAll` · `start` · `end`), `Extracted`, 필드 `initial` · `text` · `caret` · `call` · `isRejected` · `extracted` · `joinsLast`가 없다 | 상 (채움) |
| E03 | `docs/04-design/03-editor.md:98` ("같은 함수를 씁니다") | `src/packages/editor/src/state/selection.ts:278-295`, `:301-313`; `src/packages/editor/src/commands/editor-commands.ts:1022-1038`; `src/packages/editor/src/dom/canvas-view.ts:708-709` | 다르다. `Shift`+클릭은 `extendTo`, `Shift`+`↑` `↓`는 `extendBy`를 쓴다. `extendBy`는 같은 줄 안에서만 focus를 옮기고, 줄 끝이면 `notice.sameParentOnly`를 알린다 | 상 (문서를 앱에 맞춤) |
| E04 | `docs/04-design/03-editor.md:129`, `:189` ("놓으면 … `run`합니다") | `src/packages/editor/src/dom/canvas-view.ts:1004-1005`, `:803`; `src/packages/editor/src/commands/drop-command.ts:43-50`; `src/packages/editor/src/create-editor.ts:658` | 다르다. 드롭은 `registry.run`이 아니라 `runDrop` → `session.commit`으로 실행해 `when`을 거치지 않는다. 더블클릭 편집(`session.startEditing`)과 `setDocumentSetting`(`session.commit`)도 명령 목록을 거치지 않는다 | 상 (문서를 앱에 맞춤) |
| E05 | `docs/04-design/03-editor.md:131-162` (시퀀스 다이어그램) | `src/packages/editor/src/session/session.ts:524-533`; `src/packages/editor/src/commands/registry.ts:95`, `:102-115`; `src/packages/editor/src/create-editor.ts:332-340` | 실행 흐름의 세 단계가 없다. (1) 명령 전에 열린 인라인 에디터를 확정하는 `beforeRun`. (2) 내용을 바꾸기 전 `checkInvariants`, 위반이면 문서를 그대로 두고 로그와 `notice.internalError`. (3) 명령의 예외를 받는 `onError` | 상 (채움) |
| E06 | `docs/04-design/03-editor.md:226-245` (5장) | `src/packages/editor/src/commands/editor-commands.ts:1518-1552`; `src/packages/editor/src/commands/fold-commands.ts:709`; `src/packages/editor/src/ui/command-ids.ts:51-64`; `src/apps/web/src/shell/web-shell.ts:82-91` | 명령 id 전체 목록이 없다. 문서에 없는 예: `edit.textStart`, `edit.textClear`, `edit.branchLabel`, `branch.convertIfToCase`, `branch.convertCaseToIf`, `select.*` 16종, `help.examples`, `example.<id>`, `file.recent.<n>` | 상 (채움) |
| E07 | `docs/04-design/03-editor.md:282-285`, `:429` | `src/packages/editor/src/ui/editor-app.tsx:50-98`; `src/packages/editor/src/ui/places-modal.tsx:14-60` | 셸이 쓰는 UI 계약이 6장 인터페이스에 없다: `EditorApp`의 `EditorAppProps`, `ExamplesHost`, `PlacesHost`, `PlacesRequest`, `PlacesAnswer`, `BrowserDocumentInfo`, `PlaceSide`. `:429`는 산문 설명뿐이다 | 상 (채움) |
| E08 | `docs/04-design/03-editor.md:339-340`, `:409-414` | `src/packages/editor/src/create-editor.ts:80-95`, `:98-175` | 설정 목록과 `SettingSpec` 타입이 없다. 사용자 설정 `ui.locale`(기본 `en`), `editor.keyHint`(`true`), `editor.focusOutline`(`false`), `file.autoSave`(`true`)가 없다. 문서 설정 `document.theme`(기본 `default`)과 목록 순서(textKind → locale → headStyle → textOutlines → theme)도 없다 | 상 (채움) |
| E09 | `docs/04-design/03-editor.md:341-368` (`EditorHandle`) | `src/packages/editor/src/contracts.ts:358-363`; `src/packages/editor/src/create-editor.ts:691-694` | 인터페이스에 `popupAnchor(): { x, y, top }`이 없다. `:218`이 이름만 언급한다. `top`의 뜻(아래에 자리가 없으면 위로 뒤집는 기준)도 없다 | 상 (채움) |
| E10 | `docs/04-design/03-editor.md:433-451` (열기 시퀀스) | `src/apps/web/src/shell/web-shell.ts:744-778`, `:780-816`, `:900-920` | 실제 순서와 다르다. 코드는 열기 · 저장 창 → 파일 선택 → 읽기 → `openSvgFile` 검사 → US1 물음 → 키 결정 → 백업 복원 물음 → 탭 잠금 → `open` → 최근 파일 순이다. 다이어그램에는 창 · 검사 · 복원 · 잠금이 없다 | 상 (채움) |
| E11 | `docs/04-design/06-web.md:17` | `src/apps/web/src/files/web-document-store.ts:240-243` | 다르다. 문서는 "권한을 준 파일이나 폴더 안에서 읽는다"고 하나 `readOther()`는 언제나 `null`을 반환한다 | 상 (미완성으로 밝힘) |
| E12 | `docs/04-design/06-web.md:42` ("이름을 묻고 내려받기") | `src/apps/web/src/files/web-document-store.ts:207-209` | 다르다. Firefox · Safari에서 새 문서의 첫 저장을 이 컴퓨터 쪽으로 하면 이름을 묻지 않고 지금 이름으로 바로 내려받는다 | 상 (앱을 문서에 맞춤) |
| E13 | `docs/04-design/06-web.md:53-56`, `:75`, `:143` | `src/apps/web/src/storage/browser-db.ts:12-14`, `:23-31`, `:197-200`; `src/apps/web/src/storage/recent-files.ts:11-23`; `src/apps/web/src/storage/browser-documents.ts:7-16` | IndexedDB 스키마가 없다. 저장소 `recent` · `backups`의 이름, `keyPath: 'key'`, 레코드 필드가 없다. 백업은 `key, name, snapshot, savedAt, handle?`, 최근 파일은 `key, name, usedAt, source`(`handle` · `copy` · `browser`)다 | 상 (채움) |
| E14 | `docs/04-design/06-web.md:93`, `:147` | `src/apps/web/src/shell/tab-lock.ts:5-8`, `:18`, `:68-95`, `:108-126`; `src/apps/web/src/main.tsx:87`; `src/apps/web/src/shell/page-events.ts:72-77` | 탭 잠금 프로토콜이 없다. 채널 `ariadne-nsd-documents`, 메시지 `who` · `mine` · `released`, 응답 대기 150ms, 대기 탭의 재확인, `rename`, BroadcastChannel이 없으면 언제나 소유, 페이지가 bfcache로 들어가면 놓지 않음 | 상 (채움) |
| E15 | `docs/04-design/06-web.md:77`, `:255`, `:257` | `src/apps/web/src/storage/settings-store.ts:6`, `:33-46`, `:59`, `:98-105`; `src/apps/web/src/shell/web-shell.ts:70-76`; `src/apps/web/src/main.tsx:138` | localStorage 스키마가 없다. 접두사 `ariadne-nsd.setting.`, 값은 JSON, 키 `web.downloadNoticeShown` · `web.persistAsked`, `storage` 이벤트로 탭 간 동기화, 저장소가 막히면 메모리로 동작 | 상 (채움) |
| E16 | `docs/04-design/06-web.md` 전체 (시작 순서와 모듈 지도 없음) | `src/apps/web/src/main.tsx:52-73`, `:159`, `:211-232`; `src/apps/web/src/shell/web-shell.ts:1215-1235`; `src/apps/web/src/editor-contract.ts:1-175` | 시작 순서가 없다: 설정 → DB → 셸 · 편집기 생성 → 렌더링 → `shell.start` → 글꼴 → 준비 완료. `src/apps/web/src/editor-contract.ts`(셸이 보는 좁은 계약)와 `shell/*` · `storage/*` · `files/*`의 역할 구분도 없다 | 상 (채움) |
| E17 | `docs/04-design/06-web.md:139`, `:146` | `src/apps/web/src/shell/web-shell.ts:1249-1270` | 시작 시 복원 흐름이 없다. 가장 최근 백업의 `savedAt`으로 고르고, 원래 자리를 핸들 → 브라우저 문서 → 사본 → 없음의 순서로 되살린다 | 상 (채움) |
| E18 | `docs/04-design/03-editor.md:31` (오버레이 레이어) | `src/packages/editor/src/dom/overlay.ts:257-310`; `src/packages/editor/src/dom/styles.ts:35-36` | 문서의 "키보드 포커스"와 "이름이 중복된 헤더의 표시"가 `overlayContent`에 없다. 캔버스 포커스는 CSS `box-shadow`다. 반대로 코드의 호버 테두리와 드래그 중 블록의 흐림(종이색 60%)은 문서 목록에 없다 | 중 |
| E19 | `docs/04-design/03-editor.md:40-43` (컨텍스트 메뉴) | `src/packages/editor/src/dom/canvas-view.ts:615-619`, `:632-637`; `src/packages/editor/src/ui/context-menu.tsx:25-28`, `:45`; `src/packages/editor/src/ui/editor-app.tsx:410` | 빈 캔버스 오른쪽 클릭은 파일 · 도움말 메뉴를 연다(조작 규칙에는 있음). 선택이 없을 때 키보드로는 열리지 않는다. 보기 모드에서는 메뉴를 그리지 않는다 | 중 |
| E20 | `docs/04-design/03-editor.md:50-51` | `src/packages/editor/src/dom/canvas-view.ts:350`, `:819`, `:824-829` | 값이 없다: 줄 단위 휠 1칸 = 40px, 페이지 단위 = 400px, 스크롤 여백 8px. `Shift`+휠 · 가로 휠 · 편집 중에는 선택을 옮기지 않는다는 조건도 없다 | 중 |
| E21 | `docs/04-design/03-editor.md:56` ("한 프레임에 한 번만") | `src/packages/editor/src/dom/canvas-view.ts:142-146`, `:394-395` | 예외가 없다. 인라인 에디터는 프레임을 기다리지 않고 바로 열리고(`a i` 직후의 입력을 받으려고), `zoomTo`는 즉시 `draw()`한다 | 중 |
| E22 | `docs/04-design/03-editor.md:70` (`dirty`) | `src/packages/editor/src/session/session.ts:260-266`, `:145` | 판정 방법이 없다. 저장 시점의 `content` · `view` 객체와 동일성으로 비교하므로 undo로 저장 시점에 돌아오면 꺼진다. 백업에서 복원한 문서는 `saved = null`이라 저장 전까지 켜져 있다 | 중 |
| E23 | `docs/04-design/03-editor.md:92` ("id가 사라지면 … `null`") | `src/packages/editor/src/state/selection.ts:79-84`, `:98-101`, `:122-131` | 다르다. 범위의 focus만 사라지면 anchor 하나로 줄어든다. 접기 영역과 펴 보인 블록은 화면에 보이지 않아도 풀리거나 줄어든다 | 중 |
| E24 | `docs/04-design/03-editor.md:105` ("접힌 칸 전체가 끝이 됩니다") | `src/packages/editor/src/dom/canvas-view.ts:702`, `:708-711` | 다르다. `Shift`+클릭은 모델 블록에서만 범위를 넓힌다. 접힌 칸을 누르면 넓히지 않고 그 접기 영역을 선택한다 | 중 |
| E25 | `docs/04-design/03-editor.md:119-125` (2.3 표) | `src/packages/editor/src/commands/editor-commands.ts:375-378`, `:403-404`, `:550-552`, `:580-613`, `:639-647`, `:1419-1424`, `:1462-1474` | 빠진 경우: 삽입 · 감싸기 뒤 인라인 에디터 열기, 분기 삽입 · 삭제, 호출 블록 풀기(`inlineCall`과 뷰 상태 이전), 헤더 제거, 다이어그램 삭제 뒤의 선택 | 중 |
| E26 | `docs/04-design/03-editor.md:121` | `src/packages/editor/src/commands/editor-commands.ts:218-232`, `:433-435` | 선택이 없을 때의 삽입 규칙이 없다. 마지막에 선택한 곳의 다이어그램(없으면 첫 다이어그램) 끝(`diagramEnd`)에 넣는다 | 중 |
| E27 | `docs/04-design/03-editor.md:149-152`, `:373` | `src/packages/editor/src/session/session.ts:513-516`, `:566-603`, `:1052-1073`; `src/packages/editor/src/contracts.ts:195-205` | `Question` 타입(`choices`, `isDefault`, `dismiss`)이 없다. 결과의 `note` 처리(`offerConvertCaseToIf`, `checkCondition`), 물음의 키(`Enter` · 숫자 · `Esc`, 다른 키는 닫음)도 없다 | 중 |
| E28 | `docs/04-design/03-editor.md:176` (상자의 종류) | `src/packages/editor/src/input/hit-test.ts:29-30`, `:64-68`, `:113-123` | 종류에 `missingDefault`가 없다. "가장 안쪽"의 실제 기준은 넓이가 가장 작은 영역이다. 클릭 영역이 없으면 `layout.boxes`에서 찾는 대체 경로(반복 블록의 띠)도 없다 | 중 |
| E29 | `docs/04-design/03-editor.md:178` | `src/packages/editor/src/dom/canvas-view.ts:704-719`, `:731`, `:752-758` | 선택 범위 안을 누르면 놓을 때 선택을 바꾼다(범위를 드래그하려고). 읽기 전용에서는 드래그가 시작되지 않는다. 둘 다 없다 | 중 |
| E30 | `docs/04-design/03-editor.md:187-189` | `src/packages/editor/src/input/drop.ts:31-48`, `:76-96`; `src/packages/editor/src/commands/drop-command.ts:11-29`, `:80-95` | `DropAction` 4종이 없고, 특히 `intoMissingDefault`(빈 default 칸에 놓기)가 없다. 헤더 · 펼침 삼각형 · 끌던 블록 안은 드롭 불가라는 조건, 새 블록을 놓으면 텍스트 칸이 열린다는 것도 없다 | 중 |
| E31 | `docs/04-design/03-editor.md:190` | `src/packages/editor/src/dom/canvas-view.ts:971-974` | 자동 스크롤 속도가 없다: 프레임마다 `ceil((32 - 거리) / 32 × 16)`px, 최대 16px | 중 |
| E32 | `docs/04-design/03-editor.md:194-198` | `src/packages/editor/src/dom/system-clipboard.ts:19-22`, `:30-40`, `:50-56`, `:77-80` | "둘을 함께 씁니다"는 조건부다. `ClipboardItem.supports`일 때만 사용자 정의 형식을 쓰고, `ClipboardItem`이 없으면 `writeText`다. 읽기는 쓰기 완료를 기다린다. 사용자 정의 형식이 없어도 글자가 같으면 메모리의 JSON을 쓴다 | 중 |
| E33 | `docs/04-design/03-editor.md:195`, `:197` | `src/packages/editor/src/clipboard/clip-format.ts:25`, `:34-98`, `:192-204` | 형식이 없다: 들여쓰기 공백 4칸, 분기 라벨 줄(`라벨:`), Do-While은 조건을 뒤에, 빈 처리 블록은 생략. 붙여넣기는 앞뒤 공백을 지우고 빈 줄을 건너뛴다("줄마다"와 다름) | 중 |
| E34 | `docs/04-design/03-editor.md:204` | `src/packages/editor/src/dom/canvas-view.ts:269-275`, `:321-325`; `src/packages/editor/src/dom/styles.ts:64-66` | 값이 없다: 최소 폭 60px, 상자가 없을 때 120 × 32px, 내용에 맞춰 높이가 늘어남, If · Case 조건은 가운데 정렬, `white-space: pre`, 글꼴 13px/18px | 중 |
| E35 | `docs/04-design/03-editor.md:208` ("칸(인자 · 결과)", "두 칸") | `src/packages/editor/src/session/session.ts:635-644`; `src/packages/editor/src/state/editor-state.ts:26` | 다르다. 이름을 적는 호출 블록은 `args` · `result` · `name` 세 칸이고, 인자를 받지 않는 Method는 `result` 한 칸이다 | 중 |
| E36 | `docs/04-design/03-editor.md:216-219` | `src/packages/editor/src/input/keys.ts:11-21`, `:114`, `:241` | `KeyBinding`의 `args` · `selection` · `mode` · `isDisplayOnly`가 없다. 문서 예시의 `command: 'cut'`은 실제로 `edit.cut`이다. `Cmd`를 `Ctrl`로 읽는다는 것도 없다 | 중 |
| E37 | `docs/04-design/03-editor.md:218` | `src/packages/editor/src/input/keys.ts:271-279`; `src/packages/editor/src/session/session.ts:978-993` | 키 읽기의 결과 4종(`command` · `pending` · `cancelled` · `unbound`)이 없다. 표에 없는 한 글자는 `notice.unknownKey`로 알리고, 그 밖의 키는 브라우저로 넘긴다 | 중 |
| E38 | `docs/04-design/03-editor.md:248` ("`group`을 90으로") | `src/packages/editor/src/ui/editor-app.tsx:118-168`, `:275-296` | 다르다. 90은 파일 · 편집 · 다이어그램의 셋뿐이고 도움말은 `group` 0 · 1이다. UI가 등록하는 `help.examples`와 `example.<id>`가 문서의 목록에 없다 | 중 |
| E39 | `docs/04-design/03-editor.md:259` (파일 메뉴 순서) | `src/apps/web/src/shell/web-shell.ts:1126`, `:1173`, `:1192`; `src/packages/editor/src/ui/menu-model.ts:28-48` | 순서가 다르다. 문서는 내보내기 ▸ · 인쇄… · 공유 링크 복사, 코드는 내보내기 ▸ · 공유 링크 복사(`order` 2) · 인쇄…(`order` 10)다 | 중 |
| E40 | `docs/04-design/03-editor.md:276` (툴바) | `src/apps/web/src/shell/web-shell.ts:1123-1127`; `src/packages/editor/src/ui/toolbar.tsx:296`, `:330-335` | 툴바의 "내보내기"는 메뉴가 아니라 PNG 내보내기(`file.export.png`)를 바로 실행한다. 좁은 화면의 도움말 버튼도 없다 | 중 |
| E41 | `docs/04-design/03-editor.md:278-297` (공개 API) | `src/packages/editor/src/index.ts:3-62`; `src/packages/editor/src/session/session.ts:63-67` | 패키지가 내보내는 것의 목록이 없다: `readDocument`, `rememberedHeadStyle`, `settingIds`, `documentSettingIds`, `settingSpecs`, `examples`, `exampleThumbnailSvg`, `keyBindings`, `keysOf`, `strokeOf`, `clipMimeType`, `formatMessage`, `clampZoom`, `zoomRange` 등. `:297`이 쓰는 `ClipboardPort`도 정의가 없다 | 중 |
| E42 | `docs/04-design/03-editor.md:344` (`open`) | `src/packages/editor/src/session/session.ts:230-252`; `src/packages/editor/src/create-editor.ts:233-243`, `:576` | 빠진 동작: 줌은 유지, 상태 표시줄의 알림 · 물음은 비움, 열린 고르는 목록은 닫음, 새 문서는 첫 빈 블록을 선택(파일 · 예제는 선택 없음) | 중 |
| E43 | `docs/04-design/03-editor.md:355` (`save`) | `src/packages/editor/src/create-editor.ts:510-532`; `src/packages/editor/src/commands/editor-commands.ts:1507-1509` | 읽기 전용이면 쓰지 않고 `denied`(`view only`)를 반환한다. 저장 중 바뀌면 `dirty`가 켜진 채 남는다. `file.saveAs`는 `edits: false`라 읽기 전용에서도 되며 저장됨으로 표시하지 않는다 | 중 |
| E44 | `docs/04-design/03-editor.md:363-365`, `:380` | `src/packages/editor/src/create-editor.ts:404`, `:452` | 모달과 고르는 목록은 한 번에 하나이고, 새로 열면 앞의 것을 취소(`null`)한다는 규칙이 없다 | 중 |
| E45 | `docs/04-design/03-editor.md:461`, `:469` | `src/apps/web/src/shell/web-shell.ts:250-257`, `:267-274` | 백업 조건이 빠졌다. `revision`이 바뀌어도 `dirty`이고 읽기 전용이 아닐 때만 쓴다 | 중 |
| E46 | `docs/04-design/03-editor.md:475-478` | `src/packages/editor/src/session/session.ts:486-489`; `src/packages/editor/src/ui/status-bar.tsx:108` | 읽기 전용으로 바뀌면 열린 인라인 에디터의 글자를 확정 없이 버린다(문서에 없음). 상태 표시줄의 고정 표시는 "보기만 하는 중"뿐이고 이유는 없다(이유는 셸의 알림으로만 나온다) | 중 |
| E47 | `docs/04-design/06-web.md:34` | `src/apps/web/src/files/file-system-access.ts:36-38` | 다르다. `showOpenFilePicker`와 `showSaveFilePicker`가 둘 다 있어야 원래 파일 쓰기 흐름이다 | 중 |
| E48 | `docs/04-design/06-web.md:39` | `src/apps/web/src/files/web-document-store.ts:176-179` | Chromium에서 핸들 없이 연 파일(핸들을 못 받은 드롭)의 저장이 없다. 이 경우 `Ctrl`+`S`는 다른 이름으로 저장 흐름이 된다 | 중 |
| E49 | `docs/04-design/06-web.md:40`, `:49` | `src/apps/web/src/files/web-document-store.ts:234-237`; `src/apps/web/src/shell/web-shell.ts:306-313` | 다른 파일로 저장하면 문서 키가 새로 생기고, 앞 키의 백업을 지우고, 탭 잠금을 새 키로 옮긴다는 것이 없다 | 중 |
| E50 | `docs/04-design/06-web.md:46` | `src/apps/web/src/shell/web-shell.ts:961-968`; `src/apps/web/src/shell/page-events.ts:15-59`; `src/apps/web/src/app.tsx:75` | 파일 여럿을 놓으면 열지 않고 "파일은 하나씩 놓아 주세요."를 알린다. 끄는 동안의 안내 문구(`drop.hint`)도 없다 | 중 |
| E51 | `docs/04-design/06-web.md:53`, `:150` | `src/apps/web/src/storage/browser-db.ts:85-90` | 최근 파일 열 개에서 밀려난 문서는 로컬 백업도 함께 지워진다. `:150`은 보관 한도를 미완성이라고 적는다 | 중 |
| E52 | `docs/04-design/06-web.md:81` | `src/packages/editor/src/ui/places-modal.tsx:324-326` | 저장 창에서 줄을 더블클릭하면 그 이름으로 바로 저장한다 | 중 |
| E53 | `docs/04-design/06-web.md:100` ("로컬 백업도 지웁니다") | `src/apps/web/src/shell/web-shell.ts:542-551` | 다르다. 지금 연 문서를 삭제하면 백업을 지우지 않고, 같은 키로 새 문서가 된다 | 중 |
| E54 | `docs/04-design/06-web.md:148` | `src/apps/web/src/shell/web-shell.ts:289-303`; `src/apps/web/src/shell/timers.ts:104-108` | 자동 저장의 결과 구분이 없다. 권한 미확보는 조용히 건너뛰고, `denied`는 멈추고 알리며, 그 밖의 실패도 멈춘다. 다음 저장이 성공해야 재개한다 | 중 |
| E55 | `docs/04-design/06-web.md:175-180` | `src/apps/web/src/files/share-command.ts:64-66`, `:96-99`; `src/apps/web/src/shell/messages.ts:133` | 표에 링크 생성 실패 줄이 없다: "공유 링크를 만들지 못했습니다."(`warn`) | 중 |
| E56 | `docs/04-design/06-web.md:179`, `:187` | `src/apps/web/src/files/share-command.ts:93`; `src/apps/web/src/files/share-link.ts:148` | 1 MB 기준이 두 가지다. 만들 때는 주소 전체, 열 때는 fragment의 길이를 잰다 | 중 |
| E57 | `docs/04-design/06-web.md:196` | `src/packages/editor/src/ui/editor-app.tsx:410`; `src/packages/editor/src/commands/editor-commands.ts:1507-1509`; `src/packages/editor/src/input/keys.ts:150` | 보기 모드에서 컨텍스트 메뉴가 뜨지 않는다는 것과, `Ctrl`+`Shift`+`S`(다른 이름으로 저장)가 그대로 된다는 것이 없다 | 중 |
| E58 | `docs/04-design/06-web.md:230` ("JS 넷") | `src/apps/web/dist/index.html`(빌드 산출물의 script · modulepreload 6개); `src/apps/web/vite.config.ts:61-70` | 로컬 빌드는 첫 화면에 JS 6개를 싣는다. 청크를 나누는 설정(`manualChunks`)은 없다. 이 빌드가 HEAD와 같은지는 확인하지 못했다 | 중 |
| E59 | `docs/04-design/06-web.md:234` | `src/apps/web/src/main.tsx:224-232` | 다르다. 저장용 wasm · TTF는 자동 저장 여부와 관계없이 문서가 처음 `dirty`가 될 때 미리 받는다 | 중 |
| E60 | `docs/04-design/06-web.md:231-233` | `src/apps/web/src/fonts/screen-font.ts:10-26`; `src/apps/web/src/main.tsx:121`, `:124-134`, `:220-221` | 글꼴 로딩 흐름이 없다. 웹은 `screenFontUrl`을 넘기지 않고 `FontFace`로 등록한다. 슬라이스 0을 먼저 받은 뒤 전부 등록하고, `display: swap`을 쓴다 | 중 |
| E61 | `docs/04-design/06-web.md:253` | `src/apps/web/src/main.tsx:52`, `:62`, `:71`, `:73`, `:159`, `:211`, `:220`, `:222-223`; `src/apps/web/index.html:103-118` | 단계 값이 없다: `settings` · `perf` · `database` · `editor` · `render` · `start` · `font` · `ready`, `data-ready`. 화면을 바꾸는 계기인 `error`(캡처) · `unhandledrejection`도 없다 | 중 |
| E62 | `docs/04-design/06-web.md:256` | `src/apps/web/src/shell/page-events.ts:65-78` | 떠날 때의 처리가 없다: `beforeunload` · `pagehide`에서 백업을 즉시 쓰고, bfcache가 아니면 셸을 정리한다 | 중 |
| E63 | `docs/04-design/06-web.md:251` (7장) | `src/apps/web/src/shell/appearance.ts:9-10`, `:25`, `:45-47`; `src/apps/web/src/shell/messages.ts:168-170`; `src/apps/web/src/main.tsx:69`, `:186-194` | 화면 언어와 밝기를 정하는 규칙이 없다. `ui.locale` → 브라우저 언어가 `ko`로 시작하면 한국어, 그 밖은 영어. 밝기는 `prefers-color-scheme`, UI 글꼴은 `systemUiFont` | 중 |
| E64 | `docs/04-design/03-editor.md:33` | `src/packages/editor/src/ui/editor-app.tsx:413-424` | 팝업 레이어 목록에 고르는 목록(`PickerMenu`)과 열기 · 저장 창(`PlacesModal`)이 없다 | 하 |
| E65 | `docs/04-design/03-editor.md:74` | `src/packages/editor/src/session/session.ts:249` | `revision`은 다른 문서를 열 때도 오르며 0으로 돌아가지 않는다 | 하 |
| E66 | `docs/04-design/03-editor.md:86` | `src/packages/editor/src/state/selection.ts:46` | `SeqRef.slot`은 언제나 `'body'`다 | 하 |
| E67 | `docs/04-design/03-editor.md:110` | `src/packages/editor/src/model/shown-index.ts:57-59`, `:100-103`, `:180` | 접힌 줄의 id는 `~` + 분기 id만이 아니다. 반복 블록의 본문은 `~` + 블록의 화면 id다 | 하 |
| E68 | `docs/04-design/03-editor.md:205` ("처음과 같으면 실행하지 않습니다") | `src/packages/editor/src/session/session.ts:821-825` | 호출 블록은 글자가 같아도 `editCall`을 호출한다 | 하 |
| E69 | `docs/04-design/03-editor.md:337` | `src/packages/editor/src/commands/registry.ts:56-66` | 명령 등록 · 해제의 변경 알림을 마이크로태스크 하나로 모은다는 것이 없다 | 하 |
| E70 | `docs/04-design/03-editor.md:455` | `src/packages/editor/src/create-editor.ts:359-365` | `onStatus`는 이름과 `place`가 바뀔 때도 온다 | 하 |
| E71 | `docs/04-design/03-editor.md:470` | `src/apps/web/src/shell/web-shell.ts:1269` | 시작할 때의 복원은 `text`가 아니라 `text: null`로 연다 | 하 |
| E72 | `docs/04-design/06-web.md:45` | `src/apps/web/src/shell/web-shell.ts:1169-1200` | 셸이 더하는 명령에 공유 링크 복사와 인쇄가 빠졌다 | 하 |
| E73 | `docs/04-design/06-web.md:38`, `:44` | `src/apps/web/src/files/file-system-access.ts:40-44`, `:58`; `src/apps/web/src/files/file-fallback.ts:14` | 선택 창의 세부가 없다: 필터의 MIME `image/svg+xml`, 폴더를 기억하는 id `ariadne-nsd` | 하 |
| E74 | `docs/04-design/06-web.md:47` | `src/apps/web/src/shell/messages.ts:96-97`; `src/apps/web/src/shell/web-shell.ts:238-243` | 실제 문구 끝에 "(브라우저의 내려받기 폴더)"가 더 있고 `warn`이다. "한 번"은 세션이 아니라 그 브라우저에서 영구히 한 번이다 | 하 |
| E75 | `docs/04-design/06-web.md:56` | `src/apps/web/src/storage/recent-files.ts:13`; `src/apps/web/src/shell/web-shell.ts:322`, `:776` | 사본은 로컬 백업 저장소가 아니라 `recent` 레코드 안에 있고, 내용은 마지막으로 열거나 저장한 텍스트다 | 하 |
| E76 | `docs/04-design/06-web.md:79-80` | `src/packages/editor/src/ui/places-modal.tsx:268-270`, `:288-292` | 이 컴퓨터 쪽의 취소 버튼과 빈 목록의 안내가 없다 | 하 |
| E77 | `docs/04-design/06-web.md:82` | `src/packages/editor/src/ui/places-modal.tsx:91-92` | MB는 소수 한 자리다 | 하 |
| E78 | `docs/04-design/06-web.md:102-103` | `src/apps/web/src/files/zip.ts:16`, `:25-27` | 압축 수준 6이 없고, zip 해제에 크기 한도가 없다는 점이 드러나 있지 않다 | 하 |
| E79 | `docs/04-design/06-web.md:139`, `docs/04-design/03-editor.md:419` | `src/apps/web/src/shell/messages.ts:99` | 문구가 다르다. 실제는 "“{name}”에 저장하지 않은 지난번 내용이 있습니다. 복원할까요?"다 | 하 |
| E80 | `docs/04-design/06-web.md:178-179` | `src/apps/web/src/files/share-command.ts:122-124` | `{크기}`의 형식(소수 한 자리)이 없다 | 하 |
| E81 | `docs/04-design/06-web.md:253` | `src/apps/web/index.html:44`, `:91-92` | 문구가 다르다. 실제는 "AriadneNSD 불러오는 중… · Loading…"과 "AriadneNSD를 시작하지 못했습니다. 이 화면을 찍어 알려 주세요."(영어 병기)다 | 하 |
| E82 | `docs/04-design/06-web.md:258` | `src/packages/editor/src/ui/icons.tsx:102-105` | 아이콘 id 목록에 `menu` · `help` · `chevron`이 없다 | 하 |
| E83 | `docs/04-design/06-web.md:271` | `src/apps/web/src/perf/perf-page.tsx:112`, `:132`, `:346-352` | 점검 패널의 돌아가기 링크와 "다시 측정" 버튼이 없다. 점검 모드의 `EditorApp`에는 예제와 열기 · 저장 창이 없다는 것도 없다 | 하 |
| E84 | `docs/04-design/06-web.md:273` | `src/apps/web/src/perf/perf-run.ts:177-182` | 되돌리기를 최대 3번 시도한 뒤 문서를 다시 연다는 횟수가 없다 | 하 |

## 해부도 작업에서 찾은 것

대상: `docs/02-ux-design/04-visual-design.md` 5장

| ID | 문서 위치 | 코드 위치 | 빠지거나 다른 것 | 심각도 |
| --- | --- | --- | --- | --- |
| A01 | `docs/02-ux-design/04-visual-design.md` 5장 표의 `size.column-min` | `src/packages/core/src/layout/layout.ts:262`, `src/packages/core/src/layout/geometry.ts:24` | 문서는 "여러 다이어그램을 줄로 놓을 때 한 줄의 가장 좁은 폭"이라고 적는다. 코드는 이 값을 다이어그램을 세로로 쌓는 열의 **높이** 한도의 최솟값으로 쓴다(`lowest = max(size.column-min, 가장 높은 다이어그램)`). `docs/04-design/02-layout.md:179`는 코드와 같게 "줄 높이의 후보"로 적는다 | 중 |

## 자동으로 검출되는 범위

- `src/packages/editor/src/docs-agree.test.ts:105-121`(T-1167)은 코드의 키 문자열이 키 표에 있는지만 검증합니다. 키와 명령의 대응, 동작 상태, 문서에서 코드로 가는 방향, 표 밖의 본문은 검증하지 않습니다.
- `docs/05-spec/02-model-schema.md`는 `src/scripts/model-schema-doc.mjs`가 스키마에서 생성하고 `pnpm check`가 비교합니다. 스키마는 손으로 쓰며, 문서 3장의 고정 문장은 코드와 비교되지 않습니다.
- 커밋 때의 함께 바뀌는 곳 규칙(`src/scripts/co-change.json`)은 함께 고쳤는지만 검사하고, 내용이 맞는지는 검사하지 않습니다.

## 확인하지 못한 영역

- **실행 확인:** 앱을 실행해 조작하지 않았습니다. 포인터 · 드래그 · IME, 브라우저 기본 동작, 실제 Mac의 동작, 고대비 화면, 인쇄 결과는 보지 않았습니다.
- **키 표:** 툴바 드롭다운의 키 동작, `core` 명령 안의 조건(`askConvertIfToCase`가 나오는 조건 등), 드롭 위치 판정, `ux-decisions`와의 대조.
- **조작 규칙:** "열기 · 저장 창과 브라우저 문서", "다른 문서를 열 때", "내보내기와 인쇄", "공유 링크", "문제 알리기 보고서"의 절(`02-interaction-rules.md:290-334`, `:456-468`). 커맨드 팔레트 · 툴팁의 세부, 중복 헤더의 표시, `01-ux-overview.md`의 "키보드만으로 모두"와 좁은 화면 규칙.
- **시각 디자인 · 화면 배치:** 문서의 스크린숏이 지금 앱과 같은지, PDF 관련 서술, 10.2의 색 차이 수치, `05-screen-layout.md:36`의 새 문서 언어, `:53`의 보기 모드 키 동작, 점검 모드(`?perf`) 화면.
- **모델 · 레이아웃 · 파일 형식:** `src/packages/fonts`(글자 수, 슬라이스, 서브셋 크기, WOFF 설정), `02-layout.md` 4장의 성능 수치, 인쇄 경로와 PNG 내보내기, `model.schema.ko.json`의 원문.
- **편집기 · 웹:** `src/apps/web/dist`가 지금 코드의 빌드인지(`06-web.md:230` "JS 넷" 항목의 한계), 예제 데이터의 내용, `perf-messages.ts`, `version.ts`, `.github/workflows/pages.yml`과 옛 주소 리다이렉트.
- **범위 밖:** `docs/04-design/04-obsidian-plugin.md`, `05-desktop.md`(코드가 없음), `99-test-list.md`(생성 문서), `docs/01-requirements`, `docs/03-architecture`.
