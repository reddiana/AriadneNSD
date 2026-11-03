---
title: 테스트 목록
tags:
  - design
status: 생성됨
---

# 테스트 목록

지금 코드에 있는 테스트의 목록입니다. 무엇을 왜 어떻게 테스트하는지의 원칙은 [[07-testing]], 품질 속성 시나리오는 [[03-quality-attribute-scenarios]], 결함은 [[defects|결함 기록]]에 있습니다.

> [!info] 이 문서는 손으로 고치지 않습니다
> `src/scripts/test-list.mjs`가 테스트의 이름과 테스트 파일의 첫 주석에서 만듭니다(`src/`에서 `pnpm test-list`). `pnpm check`가 이 문서가 코드와 다르면 실패하므로, 테스트를 더하거나 바꾸면 이 문서도 같은 커밋에서 바뀝니다. 목적/내용은 테스트 코드의 영어 그대로입니다.

## 읽는 법

- **영역:** 테스트를 그것이 지키는 기능으로 묶었습니다(2장). 영역마다 먼저 테스트 파일을 한 줄씩, 그다음 ID(인수 테스트 · 결함 · 요구사항 등)를 한 줄씩, 그 ID를 이름에 단 테스트와 함께 보입니다. 한 ID를 테스트 여럿이 지키면 한 줄에 모두 적습니다. 같은 ID가 다른 영역에도 나올 수 있습니다(예: 인수 테스트가 E2E와 통합 테스트 양쪽에 있을 때). 어느 파일이 어느 영역인지는 스크립트의 표(`areas`)가 정합니다.
- **유형:** **단위**는 모듈 하나(가짜 없이 함수와 그 결과), **통합**은 모듈 여럿을 함께(`editor`와 `core`를 가짜 셸이나 가짜 DOM 위에서, 골든 파일의 열기 → 저장), **E2E**는 사용자 관점(빌드한 웹 앱을 브라우저에서 열고 클릭 · 키 · 탭으로), **성능**은 벤치마크입니다. 사람이 하는 **수동** 점검은 [[07-testing#5. 도구와 CI]]의 출시 전 점검표에 있습니다.
- **방법:** 테스트 도구와 기법(Vitest, 속성 기반, 골든 파일, Playwright)
- **근거:** 그 테스트가 확인하는 요구사항(`R-`), 품질 속성 시나리오(`QA-`), 인수 테스트(`AT-`), 결함(`BUG-`), UX 결정(`UX`)
- **이름 규칙:** 테스트의 이름 앞에 근거의 ID를 적습니다(`AT-04: …`, 여럿이면 `BUG-03 · QA-19: …`). 파일의 첫 주석이 그 파일의 목적/내용이 됩니다(주석이 없으면 `describe`의 이름).

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

| 자리 | 목적/내용 | 근거 | 방법 | 유형 | 테스트 수 |
| --- | --- | --- | --- | --- | --- |
| `apps/web/e2e/acceptance.spec.ts` | The MVP acceptance tests AT-01 ~ AT-17 (07-testing 4) in the browser, against the production build | [[07-testing#4. MVP의 인수 테스트\|AT-01]], [[07-testing#4. MVP의 인수 테스트\|AT-17]] | Playwright | E2E | 26 |

ID 18개를 테스트 22개가 지킵니다:

| ID | 지키는 테스트 | 다른 근거 | 유형 | 자리 |
| --- | --- | --- | --- | --- |
| [[07-testing#4. MVP의 인수 테스트\|AT-01]] | makes a new diagram, inserts blocks and saves | — | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-02]] | a saved file opened again is the same drawing and saves the same bytes<br>a downloaded file opened again downloads the same bytes | — | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-03]] | six block kinds, wrap and unwrap, copy and paste, add and delete branches, edit an If label | — | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-04]] | text typed right after a+i goes into the new block, even without a pause<br>Ctrl+S while typing accepts the text and saves | — | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-05]] | an edit in a document of 500 blocks is drawn within 100 ms | — | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-06]] | a damaged file is not opened, the original stays and the editor keeps working | — | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-07]] | a failed save loses nothing; the next save writes it<br>Save As asks for the name in the editor, and cancelling keeps the edits | — | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-08]] | the saved file draws what the screen draws, with its font inside | — | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-09]] | exports a PNG at twice the drawing size | — | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-10]] | the same document saves to the same bytes in another tab (Chromium part) | — | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-11]] | moves a block by dragging, and inserts and wraps by dragging block icons | — | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-12]] | pastes copied blocks as blocks, and plain text as one process block per line | — | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-13]] | after a reload the local backup is restored | — | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-14]] | auto save writes the original file 2 s after an edit (Chromium part)<br>without File System Access, saving downloads and says so once (Chromium part) | — | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-15]] | opens a file again from Recent Files | — | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-16]] | finds a command in the command palette and runs it | — | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-17]] | ? opens the shortcut list, and Help opens the user guide | — | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[01-requirements#^r-nfr\|R-NFR-04]] | menus, status bar and the drawing words are Korean | — | E2E | `apps/web/e2e/acceptance.spec.ts` |

### 2.2 편집 명령과 모델

블록 넣기 · 지우기 · 옮기기 · 감싸기, 분기, 호출, 다이어그램과 헤더, 복사 · 붙여넣기가 문서를 바르게 바꾸는지, 어떤 명령을 이어도 모델의 불변식이 지켜지는지 → [[01-model]]

파일 16개, 테스트 176개:

| 자리 | 목적/내용 | 근거 | 방법 | 유형 | 테스트 수 |
| --- | --- | --- | --- | --- | --- |
| `packages/editor/src/session/engine.test.ts` | inserting and editing text (AT-03) · the selection after a command (03-editor 2.3) · the clipboard (AT-12) · branches (R-EDIT-11, UX MD3) · keys and modes (03-keymap) · view only (03-editor 6.4) | [[07-testing#4. MVP의 인수 테스트\|AT-03]], [[07-testing#4. MVP의 인수 테스트\|AT-12]], [[01-requirements#^r-edit\|R-EDIT-11]], [[ux-decisions\|UX MD3]] | Vitest | 통합 | 27 |
| `packages/core/src/commands/branch.test.ts` | Case branches · If and Case conversion (UX MD3) · the missing default branch (UX CD1) | [[ux-decisions\|UX MD3]], [[ux-decisions\|UX CD1]] | Vitest | 단위 | 11 |
| `packages/core/src/commands/call.test.ts` | editCall · setCallTarget · insertCall · newMethodAndCall | — | Vitest | 단위 | 24 |
| `packages/core/src/commands/clipboard.test.ts` | copy, cut and paste | — | Vitest | 단위 | 7 |
| `packages/core/src/commands/delete.test.ts` | deleteBlocks | — | Vitest | 단위 | 6 |
| `packages/core/src/commands/diagram.test.ts` | editHead · setHead · newDiagram · deleteDiagram · moveDiagram · setSettings · defaultHeadName | — | Vitest | 단위 | 31 |
| `packages/core/src/commands/edit-text.test.ts` | editText | — | Vitest | 단위 | 5 |
| `packages/core/src/commands/insert.test.ts` | insertBlock | — | Vitest | 단위 | 13 |
| `packages/core/src/commands/move-to.test.ts` | moveTo (drag and drop) | — | Vitest | 단위 | 5 |
| `packages/core/src/commands/move.test.ts` | move up and down · move left and right (branches) | — | Vitest | 단위 | 12 |
| `packages/core/src/commands/new-document.test.ts` | new document | — | Vitest | 단위 | 3 |
| `packages/core/src/commands/properties.test.ts` | Property-based tests (07-testing 2, QA-01) | [[03-quality-attribute-scenarios#1. 목록\|QA-01]] | 속성 기반 (fast-check) | 단위 | 2 |
| `packages/core/src/commands/wrap.test.ts` | wrap · unwrap | — | Vitest | 단위 | 12 |
| `packages/core/src/model/id.test.ts` | ids | — | Vitest | 단위 | 5 |
| `packages/core/src/model/invariants.test.ts` | checkInvariants | — | Vitest | 단위 | 10 |
| `packages/editor/src/clipboard/clip-format.test.ts` | clipboard formats (03-editor 3.3) | — | Vitest | 단위 | 3 |

ID 24개를 테스트 122개가 지킵니다:

| ID | 지키는 테스트 | 다른 근거 | 유형 | 자리 |
| --- | --- | --- | --- | --- |
| [[07-testing#4. MVP의 인수 테스트\|AT-12]] | text from another program becomes one process block per line<br>the custom format wins over the text<br>text from elsewhere becomes one process block per line | — | 통합, 단위 | `packages/editor/src/session/engine.test.ts`<br>`packages/editor/src/clipboard/clip-format.test.ts` |
| [[03-quality-attribute-scenarios#1. 목록\|QA-01]] | any sequence of commands keeps the invariants and never changes its input<br>ids stay unique even when the generator must avoid ids of the view state | — | 단위 | `packages/core/src/commands/properties.test.ts` |
| [[01-requirements#^r-all\|R-ALL-03]] | a new document has one diagram holding one empty block<br>a new doc starts with nothing folded and the result symbol ← | — | 단위 | `packages/core/src/commands/new-document.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | sets the arguments and the result, each on one line<br>a field left out stays<br>emptied arguments of a Method that receives something are refilled<br>a Method that receives nothing may be called with empty arguments<br>a call block that lost its target cannot be edited<br>empty arguments take the parameters of the new Method<br>an Event or a diagram without a header cannot be called<br>inserts a call block with the parameters as its arguments<br>a Method that receives nothing gets empty arguments<br>a Method may call itself<br>only a Method can be called<br>makes a new Method and calls it from the selection, in one step<br>the written name becomes the header, its parameters the arguments<br>removing the parentheses clears the arguments of the call blocks<br>adding parentheses fills empty arguments with the text inside them<br>written arguments stay when the parameters change<br>removing a Method header turns its call blocks into lost ones | — | 단위 | `packages/core/src/commands/call.test.ts`<br>`packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-08]] | a call by a written name is edited as it is | — | 단위 | `packages/core/src/commands/call.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-10]] | sets the text of an Event header<br>gives a diagram without a header an Event header with the default name<br>is "Event n" or "Method n" with the smallest unused n | — | 단위 | `packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-11]] | refuses an empty or clashing name, and an unknown target<br>renaming a Method leaves its call blocks pointing at it by id<br>refuses an empty name, for an Event and for a Method without a name<br>refuses a name another header has, Events and Methods together<br>names are case sensitive, and a header may keep its own name<br>gives a Method header; the default name skips names in use<br>changes an Event to a Method and back, keeping the text<br>a Method that call blocks call cannot become an Event<br>changing the kind refuses a text that reads as a clashing or empty name | — | 단위 | `packages/core/src/commands/call.test.ts`<br>`packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-01]] | a + kind inserts after the selection and opens its text field<br>deletes the selected range with what is inside<br>deleting a whole fold region deletes its blocks<br>refuses to delete the only, empty block, and a missing target<br>an empty block among others can be deleted<br>sets the text of a block, keeping the rest<br>refuses a missing node, a diagram header and call blocks (later features)<br>inserts a process block after the selected block<br>inserts before the selection, and after the end of a range<br>a control block inserted on an empty block takes its place<br>a process block on an empty block changes nothing (the editor opens it)<br>inserts inside a branch when a block of the branch is selected<br>with nothing selected, inserts at the end of the diagram<br>refuses a target that is not there or not contiguous | — | 통합, 단위 | `packages/editor/src/session/engine.test.ts`<br>`packages/core/src/commands/delete.test.ts`<br>`packages/core/src/commands/edit-text.test.ts`<br>`packages/core/src/commands/insert.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-06]] | wrapping selects the new block and opens its condition<br>wraps a contiguous range in a new While, in its place<br>an If takes the blocks in its true branch; the false branch is empty<br>a Case takes the blocks in its first branch, with a second branch and a default<br>fold regions inside go in; a region of exactly the range stays around the wrapper<br>refuses a process block and a missing target | — | 통합, 단위 | `packages/editor/src/session/engine.test.ts`<br>`packages/core/src/commands/wrap.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-07]] | unwrapping from inside keeps the selection and says what was removed<br>removes the selected control block and leaves its blocks in place<br>an If or Case leaves its non-empty branches one after another<br>with a block inside selected, the nearest control block holding it is removed (UX Q8)<br>wrap then unwrap gives back the same blocks<br>fold regions inside come out; a region around the block now spans its blocks<br>a control block with only empty inside leaves an empty block if nothing else is left<br>refuses when there is no control block, and for call blocks (later) | — | 통합, 단위 | `packages/editor/src/session/engine.test.ts`<br>`packages/core/src/commands/wrap.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-09]] | moves blocks into a neighbouring loop, keeping their ids<br>a block dropped on an empty block takes its place<br>a sequence left with no blocks gets an empty block<br>dropping blocks where they are changes nothing<br>refuses to drop blocks inside themselves | — | 단위 | `packages/core/src/commands/move-to.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-10]] | dd cuts, p pastes after the selection with new ids<br>copy takes whole subtrees and the fold regions inside the range<br>paste puts copies with new ids after the selected block<br>paste on an empty block takes its place<br>paste refuses an empty clip and a missing target<br>cut gives the clip and deletes the blocks<br>copied blocks are indented lines for other programs<br>the model JSON reads back as the same blocks | — | 통합, 단위 | `packages/editor/src/session/engine.test.ts`<br>`packages/core/src/commands/clipboard.test.ts`<br>`packages/editor/src/clipboard/clip-format.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-11]] | moving keeps the moved blocks selected<br>o on a branch label inserts a branch and opens its label<br>inserts a branch after or before the selected one, with an unused number label<br>a branch inserted after the default goes right before it<br>inserting a branch on an If asks to convert it to a Case (UX MD3)<br>deletes a branch with its blocks; offers If when one branch is left (UX MD3)<br>the default and the last branch cannot be deleted, nor If branches (UX MD3)<br>deleting from a Case without default gives no offer<br>a Case with one branch and a default becomes an If, ids kept<br>only a Case with exactly one branch and a default converts<br>an If becomes a Case with a new branch between true and default<br>sets a Case branch label but not an empty one, nor the default label<br>a block trades places with the block below or above<br>a block jumps over a control block and does not enter it<br>at the end of a sequence, blocks leave the control block holding them<br>at the top or bottom of a diagram the move is refused<br>a Case branch trades places with its neighbour, label and all<br>moving a block sideways moves the nearest branch holding it<br>the default branch stays last; edges are refused<br>swapping If branches swaps the blocks, keeps labels in place, and notes the condition | — | 통합, 단위 | `packages/editor/src/session/engine.test.ts`<br>`packages/core/src/commands/branch.test.ts`<br>`packages/core/src/commands/edit-text.test.ts`<br>`packages/core/src/commands/move.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-12]] | an If branch label opens with its drawn word<br>sets and clears an If branch label | — | 통합, 단위 | `packages/editor/src/session/engine.test.ts`<br>`packages/core/src/commands/edit-text.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-18]] | a new Method goes after the last Method<br>a new Event goes after the last Event or diagram without a header<br>the first of its kind goes first (Event) or last (Method)<br>deletes a diagram; the call blocks calling it become lost<br>swaps with the previous diagram of its kind, skipping the others<br>refuses at either end of its kind | — | 단위 | `packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-lay\|R-LAY-10]] | changes the header shape<br>the header shape defaults to title and can be passed in (UX HS1) | — | 단위 | `packages/core/src/commands/diagram.test.ts`<br>`packages/core/src/commands/new-document.test.ts` |
| [[01-requirements#^r-nfr\|R-NFR-01]] | a valid document has no violations | — | 단위 | `packages/core/src/model/invariants.test.ts` |
| [[ux-decisions\|UX CD1]] | typing into the empty default cell makes the default branch, one undo step<br>inserting on the empty default cell makes the branch; deleting there does nothing<br>gives a Case without a default an empty default branch<br>refuses a Case that has a default, other blocks and unknown ids | — | 통합, 단위 | `packages/editor/src/session/engine.test.ts`<br>`packages/core/src/commands/branch.test.ts` |
| [[ux-decisions\|UX K1]] | the key hint shows 0.4 s after the first key; Esc cancels | — | 통합 | `packages/editor/src/session/engine.test.ts` |
| [[ux-decisions\|UX KP2]] | a process block (%j) goes next to an empty block too<br>with besideEmpty a process block goes next to the empty block | — | 통합, 단위 | `packages/editor/src/session/engine.test.ts`<br>`packages/core/src/commands/insert.test.ts` |
| [[ux-decisions\|UX MD1]] | joins a fold region at its end, and goes to the diagram end with no selection | — | 단위 | `packages/core/src/commands/call.test.ts` |
| [[ux-decisions\|UX MD2]] | closing the text field with the same text leaves no undo step | — | 통합 | `packages/editor/src/session/engine.test.ts` |
| [[ux-decisions\|UX MD3]] | deleting down to one branch asks to make an If; Esc keeps the Case<br>inserting a branch on an If asks to make it a Case; Enter converts | — | 통합 | `packages/editor/src/session/engine.test.ts` |
| [[ux-decisions\|UX Q19]] | after deleting, the next block, else the previous, else the holder<br>undo keeps the selection while what it names is still there | — | 통합 | `packages/editor/src/session/engine.test.ts` |

### 2.3 키 · 마우스 · 선택

키가 어느 명령으로 가는지, 이동과 선택, 두 키 조합의 힌트, 클릭 · 끌기가 어느 블록을 가리키는지, 선택 테두리와 캔버스의 포커스 → [[03-keymap]], [[02-interaction-rules]]

파일 10개, 테스트 75개:

| 자리 | 목적/내용 | 근거 | 방법 | 유형 | 테스트 수 |
| --- | --- | --- | --- | --- | --- |
| `apps/web/e2e/canvas.spec.ts` | The canvas | — | Playwright | E2E | 4 |
| `packages/editor/src/session/diagrams.test.ts` | selecting a header (interaction rules 2 "키보드로 이동하고 삽입하기") · editing a header name (interaction rules "Event 헤더", "Method 헤더") · header and diagram commands (interaction rules "새 Method로 빼기와 새 다이어그램") · call blocks (interaction rules "호출 블록") | — | Vitest | 통합 | 21 |
| `packages/editor/src/session/random-keys.test.ts` | random keys (QA-01) | [[03-quality-attribute-scenarios#1. 목록\|QA-01]] | Vitest | 통합 | 1 |
| `packages/editor/src/dom/overlay.test.ts` | overlayContent | — | Vitest | 단위 | 1 |
| `packages/editor/src/input/hit-test.test.ts` | hit testing (03-editor 3.1) · drop place (03-editor 3.2) · diagram headers (R-BLK-10, R-BLK-11) | [[01-requirements#^r-blk\|R-BLK-10]], [[01-requirements#^r-blk\|R-BLK-11]] | Vitest | 단위 | 14 |
| `packages/editor/src/input/keys.test.ts` | reading keys (03-editor 4) | — | Vitest | 단위 | 8 |
| `packages/editor/src/navigation/navigate.test.ts` | keyboard navigation (03-editor 2.2) | — | Vitest | 단위 | 12 |
| `packages/editor/src/state/selection.test.ts` | selection (03-editor 2) | — | Vitest | 단위 | 5 |
| `packages/editor/src/ui/key-hint.test.ts` | UX K3: the key hint goes just under the selection | [[ux-decisions\|UX K3]] | Vitest | 단위 | 4 |
| `packages/editor/src/ui/keys.test.ts` | keys | — | Vitest | 단위 | 5 |

ID 22개를 테스트 48개가 지킵니다:

| ID | 지키는 테스트 | 다른 근거 | 유형 | 자리 |
| --- | --- | --- | --- | --- |
| [[defects\|BUG-07]] | the selection outline covers the block lines equally on all four sides | — | 단위 | `packages/editor/src/dom/overlay.test.ts` |
| [[defects\|BUG-08]] | a click on the empty canvas closes the key hint of a waiting a | — | E2E | `apps/web/e2e/canvas.spec.ts` |
| [[defects\|BUG-09]] | dragging a block does not select the drawn text | — | E2E | `apps/web/e2e/canvas.spec.ts` |
| [[03-quality-attribute-scenarios#1. 목록\|QA-01]] | 400 random keys keep the invariants and undo all the way back (seed ${String(seed)}) | — | 통합 | `packages/editor/src/session/random-keys.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | removing a Method header makes its calls lost and selects the first block<br>a c lists the Methods; the chosen one is called and its arguments typed<br>"New Method, and call it" makes the Method and edits its name<br>a call block that lost its target cannot be edited<br>changing the called Method starts at the current one and keeps the texts | — | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-10]] | Up from the first block selects the header; Down goes back<br>Enter edits the name; accepting changes it in one undo step<br>e in a diagram without a header gives it one and edits its name<br>a click on the header hits the header and selects it | — | 통합, 단위 | `packages/editor/src/session/diagrams.test.ts`<br>`packages/editor/src/input/hit-test.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-11]] | a clashing name opens the field again; Esc there keeps the old name<br>m on a header changes the kind; a called Method cannot become an Event | — | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-01]] | a click in a process block hits that block | — | 단위 | `packages/editor/src/input/hit-test.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-03]] | Down goes in drawn order but never into a side branch<br>Up from the first block of a branch selects its label, then the If (UX Q10)<br>Up from below an If lands at the bottom of its leftmost branch<br>Left and Right cross branches, then leave the If (UX Q11)<br>on a branch label, Left and Right go to the next label, Down into the branch<br>Ctrl+Up / Down treat a control block as one block<br>Ctrl+Left / Right go to the side branch, or up and down outside one<br>gg and G select the first and last block of the diagram<br>[[ and ]] go to the neighbouring diagram, if there is one | — | 단위 | `packages/editor/src/navigation/navigate.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-04]] | the first key of a sequence waits; the second runs the command (UX K1) | — | 단위 | `packages/editor/src/input/keys.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-05]] | Shift+click deeper widens to the nearest common sequence (ADR-0008)<br>Shift+click in another diagram selects only that block<br>Shift+Down stays under one parent | — | 단위 | `packages/editor/src/state/selection.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-09]] | the 8 px bands are between blocks, the rest is on the block<br>a new control block dropped on a block wraps it; a process goes after<br>on one of the selected blocks the whole selection is wrapped<br>dragged blocks go between blocks, even into a control block<br>an empty block takes a drop whole; nothing drops into the dragged blocks | — | 단위 | `packages/editor/src/input/hit-test.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-12]] | a branch label row beats the header around it | — | 단위 | `packages/editor/src/input/hit-test.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-18]] | E and M make a new diagram of that kind and edit its name<br>Shift+Delete deletes the diagram; the only one cannot be deleted | — | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-19]] | on blocks of a diagram with a header, m tells that extracting is not there yet | — | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| [[ux-decisions\|UX CD1]] | the empty default cell of a Case is hit<br>a drop on the empty default cell makes the default branch<br>the empty default cell of a Case is reached from the last branch | — | 단위 | `packages/editor/src/input/hit-test.test.ts`<br>`packages/editor/src/navigation/navigate.test.ts` |
| [[ux-decisions\|UX CF2]] | with nothing selected the focus outline shows for a moment only | — | E2E | `apps/web/e2e/canvas.spec.ts` |
| [[ux-decisions\|UX CM1]] | a right click on the empty canvas shows the File and Help menus | — | E2E | `apps/web/e2e/canvas.spec.ts` |
| [[ux-decisions\|UX K1]] | a key that does not continue the sequence, or Esc, cancels it<br>finds the second key after a pending first key | — | 단위 | `packages/editor/src/input/keys.test.ts`<br>`packages/editor/src/ui/keys.test.ts` |
| [[ux-decisions\|UX ND1]] | Down with nothing below selects the block holding this one; at the top, it stays | — | 단위 | `packages/editor/src/navigation/navigate.test.ts` |
| [[ux-decisions\|UX Q4]] | an empty name puts the old name back, closes and tells why | — | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| [[ux-decisions\|UX Q6]] | Alt+arrows on a header move the diagram among its kind | — | 통합 | `packages/editor/src/session/diagrams.test.ts` |

### 2.4 메뉴 · 화면 · 시작

메뉴와 툴바, 화면 언어, 예제, 판 번호, 페이지가 뜨는 과정, 휴대폰 화면 → [[05-screen-layout]], [[06-web]]

파일 9개, 테스트 55개:

| 자리 | 목적/내용 | 근거 | 방법 | 유형 | 테스트 수 |
| --- | --- | --- | --- | --- | --- |
| `apps/web/e2e/boot.spec.ts` | The start of the page (R-NFR-10, QA-19; inbox 2026-11-01 | [[01-requirements#^r-nfr\|R-NFR-10]], [[03-quality-attribute-scenarios#1. 목록\|QA-19]] | Playwright | E2E | 2 |
| `apps/web/e2e/examples.spec.ts` | The examples (R-EDIT-25, 05-screen-layout "예제", UX EX1 ~ EX3) | [[01-requirements#^r-edit\|R-EDIT-25]], [[ux-decisions\|UX EX1]] | Playwright | E2E | 7 |
| `apps/web/e2e/mobile.spec.ts` | The web app on a phone (R-NFR-08 · R-NFR-09, QA-18 · QA-20; QA-19 is in boot.spec.ts) | [[01-requirements#^r-nfr\|R-NFR-08]], [[01-requirements#^r-nfr\|R-NFR-09]], [[03-quality-attribute-scenarios#1. 목록\|QA-18]], [[03-quality-attribute-scenarios#1. 목록\|QA-20]], [[03-quality-attribute-scenarios#1. 목록\|QA-19]] | Playwright | E2E | 5 |
| `apps/web/e2e/smoke.spec.ts` |  | — | Playwright | E2E | 1 |
| `packages/editor/src/ui/editor-app.test.tsx` | menu bar · toolbar block icons · command palette · status bar · key hint · modals · canvas slot · context menu · dialogs and notices from the shell · picker (interaction rules "호출 블록") | — | Vitest + happy-dom | 통합 | 25 |
| `apps/web/src/shell/messages.test.ts` | screen language | — | Vitest | 단위 | 3 |
| `packages/editor/src/examples/examples.test.ts` | examples · $id | — | Vitest | 단위 | 9 |
| `packages/editor/src/ui/menu-model.test.ts` | menuEntries | — | Vitest | 단위 | 1 |
| `packages/editor/src/version.test.ts` | app version | — | Vitest | 단위 | 2 |

ID 22개를 테스트 38개가 지킵니다:

| ID | 지키는 테스트 | 다른 근거 | 유형 | 자리 |
| --- | --- | --- | --- | --- |
| [[defects\|BUG-01]] | a diagram larger than the window scrolls in the canvas | — | E2E | `apps/web/e2e/examples.spec.ts` |
| [[defects\|BUG-02]] | the toolbar's dropdown opens over the canvas, not inside the toolbar | — | E2E | `apps/web/e2e/examples.spec.ts` |
| [[defects\|BUG-03]] | the editor appears when indexedDB.open never answers<br>a failure at start is shown on the boot screen | [[03-quality-attribute-scenarios#1. 목록\|QA-19]] | E2E | `apps/web/e2e/boot.spec.ts` |
| [[defects\|BUG-04]] | on a phone the toolbar shows "Examples", and a tap opens the modal | [[03-quality-attribute-scenarios#1. 목록\|QA-20]] | E2E | `apps/web/e2e/mobile.spec.ts` |
| [[defects\|BUG-05]] | Escape closes a menu opened with the mouse | — | E2E | `apps/web/e2e/examples.spec.ts` |
| [[03-quality-attribute-scenarios#1. 목록\|QA-04]] | saves to an SVG file and opens as the same document | — | 단위 | `packages/editor/src/examples/examples.test.ts` |
| [[03-quality-attribute-scenarios#1. 목록\|QA-18]] | on a slow phone the editor shows within 3 s and the block font within 5 s | — | E2E | `apps/web/e2e/mobile.spec.ts` |
| [[03-quality-attribute-scenarios#1. 목록\|QA-20]] | a first visit on a phone opens an example with a tap<br>on a phone a block is inserted from the toolbar and selected with a tap<br>on a phone undo, redo, wrap and help are in the toolbar, with no bar at the bottom | — | E2E | `apps/web/e2e/mobile.spec.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | lists the Methods and "new Method"; j k move from the active one, Enter chooses | — | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| [[01-requirements#^r-edit\|R-EDIT-01]] | click inserts after, Shift+click before, Ctrl+click wraps; process cannot wrap | — | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| [[01-requirements#^r-edit\|R-EDIT-04]] | lists the second keys when the engine says the hint is due, and hides after | — | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| [[01-requirements#^r-edit\|R-EDIT-09]] | a press that moves past 4 px hands a drag to the engine instead of clicking | — | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| [[01-requirements#^r-edit\|R-EDIT-21]] | `?` opens the key table with Vim and standard columns, Esc closes it | — | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| [[01-requirements#^r-edit\|R-EDIT-24]] | finds commands by part of the name, recent ones first<br>opens from its command, shows Vim keys, runs the picked row with Enter<br>moves with ↑ ↓ and closes with Esc without running | — | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| [[01-requirements#^r-edit\|R-EDIT-25]] | a first visit is welcomed with ten examples, a blank document and open file<br>lists the ten examples in order, each named in both languages<br>keeps every invariant, with either header shape<br>uses the given header shape and the settings and view of a new document<br>builds the same document every time<br>has the diagrams, headers and blocks of the prototype<br>keeps every text of the short notation as written<br>links every call block to a Method in the document | — | E2E, 단위 | `apps/web/e2e/examples.spec.ts`<br>`packages/editor/src/examples/examples.test.ts` |
| [[01-requirements#^r-fmt\|R-FMT-02]] | saves to model JSON and opens as the same document | — | 단위 | `packages/editor/src/examples/examples.test.ts` |
| [[01-requirements#^r-nfr\|R-NFR-04]] | names the menus in the screen language<br>Korean browsers get Korean, every other language English<br>the preference wins over the browser language | — | 통합, 단위 | `packages/editor/src/ui/editor-app.test.tsx`<br>`apps/web/src/shell/messages.test.ts` |
| [[ux-decisions\|UX EX2]] | closing the welcome with Esc keeps the new document and does not ask again | — | E2E | `apps/web/e2e/examples.spec.ts` |
| [[ux-decisions\|UX EX3]] | Help › Examples… opens the same modal with its own words<br>the toolbar's "Examples" opens the examples modal | — | E2E | `apps/web/e2e/examples.spec.ts` |
| [[ux-decisions\|UX MD3]] | asks If ↔ Case with buttons and passes the answer to the engine | — | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| [[ux-decisions\|UX W3]] | shows the file name with ● while unsaved | — | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| [[ux-decisions\|UX W5]] | preferences show the user settings and write a change to the settings store<br>document settings write through the engine | — | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |

### 2.5 파일

파일 형식(모델이 든 SVG)의 쓰기 · 읽기 · 왕복, 손상된 파일, 편집기와 셸의 약속, 웹의 저장 · 열기 · 내려받기, 임시 보관, 탭 잠금, 최근 파일, PNG 내보내기 → [[01-file-format]], [[06-web]]

파일 15개, 테스트 106개:

| 자리 | 목적/내용 | 근거 | 방법 | 유형 | 테스트 수 |
| --- | --- | --- | --- | --- | --- |
| `apps/web/e2e/files.spec.ts` | Browser flows of the web shell (06-web 1, 2) | — | Playwright | E2E | 6 |
| `apps/web/src/files/web-document-store.test.ts` | web document store | — | Vitest | 통합 | 5 |
| `apps/web/src/shell/web-shell.test.ts` | web shell | — | Vitest | 통합 | 8 |
| `packages/core/node/golden.test.ts` | Golden files (07-testing 3) | — | 골든 파일 | 통합 | 4 |
| `packages/editor/src/create-editor.test.ts` | the shell contract (03-editor 6, QA-10) · the shell asks through the editor (03-editor 6 additions) · the header shape (R-LAY-10, UX HS1) · the picker (interaction rules "호출 블록") · the inline editor on headers and call blocks (03-editor 3.4) | [[03-quality-attribute-scenarios#1. 목록\|QA-10]], [[01-requirements#^r-lay\|R-LAY-10]], [[ux-decisions\|UX HS1]] | Vitest + happy-dom | 통합 | 23 |
| `apps/web/src/files/export-png.test.ts` | PNG export size | — | Vitest | 단위 | 4 |
| `apps/web/src/files/file-name.test.ts` | file names | — | Vitest | 단위 | 6 |
| `apps/web/src/shell/tab-lock.test.ts` | tab lock | — | Vitest | 단위 | 5 |
| `apps/web/src/shell/timers.test.ts` | local backup timer · auto save timer | — | Vitest | 단위 | 7 |
| `apps/web/src/storage/recent-files.test.ts` | recent files | — | Vitest | 단위 | 5 |
| `packages/core/src/format/base64.test.ts` | base64 | — | Vitest | 단위 | 2 |
| `packages/core/src/format/model-json.test.ts` | model JSON serialization | — | Vitest | 단위 | 6 |
| `packages/core/src/format/parse-model.test.ts` | model JSON parsing | — | Vitest | 단위 | 8 |
| `packages/core/src/format/round-trip.test.ts` | round trip | — | 속성 기반 (fast-check) | 단위 | 3 |
| `packages/core/src/format/svg-file.test.ts` | SVG file | — | Vitest | 단위 | 14 |

ID 16개를 테스트 41개가 지킵니다:

| ID | 지키는 테스트 | 다른 근거 | 유형 | 자리 |
| --- | --- | --- | --- | --- |
| [[03-quality-attribute-scenarios#1. 목록\|QA-02]] | broken input is refused with a reason, never thrown<br>opening any text never throws<br>broken files are refused as damaged, never thrown | — | 단위 | `packages/core/src/format/parse-model.test.ts`<br>`packages/core/src/format/round-trip.test.ts`<br>`packages/core/src/format/svg-file.test.ts` |
| [[03-quality-attribute-scenarios#1. 목록\|QA-04]] | every golden file opens and saves to the same bytes<br>a saved SVG file opens as the same document and saves to the same bytes<br>opening and saving again gives the same model part | — | 통합, 단위 | `packages/core/node/golden.test.ts`<br>`packages/core/src/format/round-trip.test.ts`<br>`packages/core/src/format/svg-file.test.ts` |
| [[03-quality-attribute-scenarios#1. 목록\|QA-09]] | 100 blocks with 300 different Hangul syllables save to 300 KB or less | — | 통합 | `packages/core/node/golden.test.ts` |
| [[01-requirements#^r-all\|R-ALL-03]] | a new document has one empty block, selected, and is not dirty | — | 통합 | `packages/editor/src/create-editor.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | inserting a call block asks in the chrome state; the answer inserts | — | 통합 | `packages/editor/src/create-editor.test.ts` |
| [[01-requirements#^r-exp\|R-EXP-01]] | exports a PNG at twice the drawing size<br>reads the size of the saved SVG<br>draws at twice the size by default, in whole pixels<br>names the PNG after the document | — | E2E, 단위 | `apps/web/e2e/files.spec.ts`<br>`apps/web/src/files/export-png.test.ts`<br>`apps/web/src/files/file-name.test.ts` |
| [[01-requirements#^r-exp\|R-EXP-04]] | saves 2 s after the last change<br>a change while saving waits 2 s again after the save ends<br>puts the last opened file first<br>keeps one entry per file and moves it to the top<br>remembers ten files and reports the ones that fell off | — | 단위 | `apps/web/src/shell/timers.test.ts`<br>`apps/web/src/storage/recent-files.test.ts` |
| [[01-requirements#^r-fmt\|R-FMT-01]] | save writes the file with the model inside; reopening gives the same content | — | 통합 | `packages/editor/src/create-editor.test.ts` |
| [[01-requirements#^r-fmt\|R-FMT-02]] | reads back every node kind as the same document<br>model JSON reads back as the same content, and writes the same text again | — | 단위 | `packages/core/src/format/parse-model.test.ts`<br>`packages/core/src/format/round-trip.test.ts` |
| [[01-requirements#^r-fmt\|R-FMT-03]] | ${name} is saved as the golden file<br>the same document gives the same text, whatever order the objects were built in<br>the same parts give the same bytes | — | 통합, 단위 | `packages/core/node/golden.test.ts`<br>`packages/core/src/format/model-json.test.ts`<br>`packages/core/src/format/svg-file.test.ts` |
| [[01-requirements#^r-fmt\|R-FMT-04]] | splits CDATA around ]]> and reads the text back whole | — | 단위 | `packages/core/src/format/svg-file.test.ts` |
| [[01-requirements#^r-fmt\|R-FMT-06]] | a plain SVG without a model element cannot be edited | — | 단위 | `packages/core/src/format/svg-file.test.ts` |
| [[01-requirements#^r-web\|R-WEB-02]] | an SVG without a model is not opened, and the reason is shown<br>writes to the original file, asking for permission on a save<br>an SVG without a model does not replace the document, and says why<br>opens .ns.svg and .ns files, whatever the case<br>keeps .ns.svg and .ns, and adds .ns.svg to other names | — | E2E, 통합, 단위 | `apps/web/e2e/files.spec.ts`<br>`apps/web/src/files/web-document-store.test.ts`<br>`apps/web/src/shell/web-shell.test.ts`<br>`apps/web/src/files/file-name.test.ts` |
| [[01-requirements#^r-web\|R-WEB-03]] | after a reload the unsaved changes can be restored<br>writes a backup 0.5 s after an edit and removes it after saving<br>at start, offers to restore the newest backup and opens it as unsaved<br>a declined restore removes that backup<br>writes once for edits within 0.5 s<br>flushes a pending write at once, and does nothing when none is pending | — | E2E, 통합, 단위 | `apps/web/e2e/files.spec.ts`<br>`apps/web/src/shell/web-shell.test.ts`<br>`apps/web/src/shell/timers.test.ts` |
| [[ux-decisions\|UX HS1]] | the shape chosen last is remembered and new documents start with it<br>opening a file keeps its own shape and does not change the remembered one | — | 통합 | `packages/editor/src/create-editor.test.ts` |
| [[ux-decisions\|UX W3]] | shows the name and ● in the tab title<br>puts ● before the name in the tab title while unsaved | — | 통합, 단위 | `apps/web/src/shell/web-shell.test.ts`<br>`apps/web/src/files/file-name.test.ts` |

### 2.6 레이아웃 · 그리기 · 글자

블록의 크기와 자리, SVG로 그리기, 글자 폭 재기, 번들 글꼴과 그 서브셋 → [[02-layout]]

파일 6개, 테스트 78개:

| 자리 | 목적/내용 | 근거 | 방법 | 유형 | 테스트 수 |
| --- | --- | --- | --- | --- | --- |
| `packages/core/src/layout/layout.test.ts` | layout: blocks · layout: short branches (UX SB1) · layout: click regions · layout: headers (02-layout 1.5) · layout: several diagrams (02-layout 1.7) · layout: properties · layout: size | [[ux-decisions\|UX SB1]] | 속성 기반 (fast-check) | 단위 | 37 |
| `packages/core/src/render/render-doc.test.ts` | render · render: headers (visual design principle 2) · render: golden files (07-testing 3) | — | Vitest | 단위 | 16 |
| `packages/core/src/text/measure-text.test.ts` | text width | — | Vitest | 단위 | 8 |
| `packages/fonts/node/index.test.ts` | readFontFile | — | Vitest | 단위 | 2 |
| `packages/fonts/node/subset.test.ts` | subsetToWoff · pinned output | — | Vitest | 단위 | 10 |
| `packages/fonts/src/advance-table.test.ts` | block font advance table | — | Vitest | 단위 | 5 |

ID 16개를 테스트 24개가 지킵니다:

| ID | 지키는 테스트 | 다른 근거 | 유형 | 자리 |
| --- | --- | --- | --- | --- |
| [[03-quality-attribute-scenarios#1. 목록\|QA-07]] | lays out and renders 500 blocks well inside the 100ms budget | — | 단위 | `packages/core/src/render/render-doc.test.ts` |
| [[01-requirements#^r-fmt\|R-FMT-03]] | the same document gives the same layout<br>the same model gives the same SVG text<br>${name} matches its golden SVG<br>the same code points give the same bytes, in any order and with duplicates | — | 단위 | `packages/core/src/layout/layout.test.ts`<br>`packages/core/src/render/render-doc.test.ts`<br>`packages/fonts/node/subset.test.ts` |
| [[01-requirements#^r-fmt\|R-FMT-07]] | lists the used code points, fixed words included | — | 단위 | `packages/core/src/render/render-doc.test.ts` |
| [[01-requirements#^r-lay\|R-LAY-01]] | a multi-line block grows by 18px a line<br>measures several lines: the longest width, lines × 18px | — | 단위 | `packages/core/src/layout/layout.test.ts`<br>`packages/core/src/text/measure-text.test.ts` |
| [[01-requirements#^r-lay\|R-LAY-02]] | an If is as wide as both branches side by side<br>the blocks of a diagram body fill it exactly (it stays a rectangle) | — | 단위 | `packages/core/src/layout/layout.test.ts` |
| [[01-requirements#^r-lay\|R-LAY-04]] | matches the 13px examples of 02-layout 2.1<br>counts Hangul as full width and Latin as half width | — | 단위 | `packages/core/src/text/measure-text.test.ts` |
| [[01-requirements#^r-lay\|R-LAY-09]] | draws the ∅ of an empty branch as a shape, not a character | — | 단위 | `packages/core/src/render/render-doc.test.ts` |
| [[01-requirements#^r-nfr\|R-NFR-04]] | writes the fixed words in the given locale | — | 단위 | `packages/core/src/render/render-doc.test.ts` |
| [[ux-decisions\|UX BH1]] | puts a header-colored halo behind the condition | — | 단위 | `packages/core/src/render/render-doc.test.ts` |
| [[ux-decisions\|UX CD1]] | a Case without a default draws an empty default cell<br>draws the empty default cell of a Case without a default | — | 단위 | `packages/core/src/layout/layout.test.ts`<br>`packages/core/src/render/render-doc.test.ts` |
| [[ux-decisions\|UX CD2]] | a Case with only a default has one column | — | 단위 | `packages/core/src/layout/layout.test.ts` |
| [[ux-decisions\|UX E1]] | marks the only, empty block of a branch | — | 단위 | `packages/core/src/layout/layout.test.ts` |
| [[ux-decisions\|UX FB1]] | a For is measured like a While | — | 단위 | `packages/core/src/layout/layout.test.ts` |
| [[ux-decisions\|UX LT1]] | never wraps a long line<br>keeps spaces as written | — | 단위 | `packages/core/src/text/measure-text.test.ts` |
| [[ux-decisions\|UX Q24]] | If branch labels follow the locale unless the user wrote one | — | 단위 | `packages/core/src/layout/layout.test.ts` |
| [[ux-decisions\|UX SB1]] | shares the extra height equally; the last block takes the remainder | — | 단위 | `packages/core/src/layout/layout.test.ts` |

### 2.7 성능

그리기의 시간 예산(벤치마크) → [[03-quality-attribute-scenarios]]

파일 1개, 테스트 3개:

| 자리 | 목적/내용 | 근거 | 방법 | 유형 | 테스트 수 |
| --- | --- | --- | --- | --- | --- |
| `packages/core/src/render/render.bench.ts` | The performance budget of 02-layout 4 | — | Vitest bench | 성능 | 3 |

ID 1개를 테스트 1개가 지킵니다:

| ID | 지키는 테스트 | 다른 근거 | 유형 | 자리 |
| --- | --- | --- | --- | --- |
| [[03-quality-attribute-scenarios#1. 목록\|QA-07]] | layout and scene + SVG text stay far inside the 100ms edit budget | — | 성능 | `packages/core/src/render/render.bench.ts` |

## 3. 테스트가 없는 ID

문서에 정의된 시나리오(`QA-`) · 인수 테스트(`AT-`) · 결함(`BUG-`) 가운데, 이름에 그 ID를 단 테스트가 없는 것입니다. 테스트 파일이 통째로 맡거나(2장 파일 표의 근거 칸), 인수 테스트가 맡거나([[07-testing#4. MVP의 인수 테스트]]의 표), 테스트가 아닌 검사가 맡은 것은 그 길을 적습니다. “없음”은 사람이 점검표로 보거나 아직 테스트가 없는 빈 곳입니다.

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
