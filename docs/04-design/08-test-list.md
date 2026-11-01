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

- **유형:** **단위**는 모듈 하나(가짜 없이 함수와 그 결과), **통합**은 모듈 여럿을 함께(`editor`와 `core`를 가짜 셸이나 가짜 DOM 위에서, 골든 파일의 열기 → 저장), **E2E**는 사용자 관점(빌드한 웹 앱을 브라우저에서 열고 클릭 · 키 · 탭으로), **성능**은 벤치마크입니다. 사람이 하는 **수동** 점검은 [[07-testing#5. 도구와 CI]]의 출시 전 점검표에 있습니다.
- **방법:** 테스트 도구와 기법(Vitest, 속성 기반, 골든 파일, Playwright)
- **근거:** 그 테스트가 확인하는 요구사항(`R-`), 품질 속성 시나리오(`QA-`), 인수 테스트(`AT-`), 결함(`BUG-`), UX 결정(`UX`)
- **이름 규칙:** 근거가 하나인 테스트는 이름 앞에 ID를 적습니다(`AT-04: …`, 여럿이면 `BUG-03 · QA-19: …`). 그런 테스트는 2장에 한 줄씩 나옵니다. 모든 테스트 파일은 3장에 한 줄씩 나오고, 파일의 첫 주석이 목적/내용이 됩니다(주석이 없으면 `describe`의 이름).

## 1. 요약

| 유형  | 파일  | 테스트 |
| --- | --- | --- |
| E2E | 6   | 46  |
| 통합  | 8   | 113 |
| 단위  | 40  | 343 |
| 성능  | 1   | 3   |

## 2. ID가 있는 테스트

| ID | 목적/내용 | 근거 | 방법 | 유형 | 자리 |
| --- | --- | --- | --- | --- | --- |
| [[07-testing#4. MVP의 인수 테스트\|AT-01]] | makes a new diagram, inserts blocks and saves | — | Playwright | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-02]] | a saved file opened again is the same drawing and saves the same bytes | — | Playwright | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-02]] | a downloaded file opened again downloads the same bytes | — | Playwright | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-03]] | six block kinds, wrap and unwrap, copy and paste, add and delete branches, edit an If label | — | Playwright | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-04]] | text typed right after a+i goes into the new block, even without a pause | — | Playwright | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-04]] | Ctrl+S while typing accepts the text and saves | — | Playwright | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-05]] | an edit in a document of 500 blocks is drawn within 100 ms | — | Playwright | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-06]] | a damaged file is not opened, the original stays and the editor keeps working | — | Playwright | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-07]] | a failed save loses nothing; the next save writes it | — | Playwright | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-07]] | Save As asks for the name in the editor, and cancelling keeps the edits | — | Playwright | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-08]] | the saved file draws what the screen draws, with its font inside | — | Playwright | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-09]] | exports a PNG at twice the drawing size | — | Playwright | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-10]] | the same document saves to the same bytes in another tab (Chromium part) | — | Playwright | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-11]] | moves a block by dragging, and inserts and wraps by dragging block icons | — | Playwright | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-12]] | pastes copied blocks as blocks, and plain text as one process block per line | — | Playwright | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-12]] | text from another program becomes one process block per line | — | Vitest | 통합 | `packages/editor/src/session/engine.test.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-12]] | the custom format wins over the text | — | Vitest | 통합 | `packages/editor/src/session/engine.test.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-12]] | text from elsewhere becomes one process block per line | — | Vitest | 단위 | `packages/editor/src/clipboard/clip-format.test.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-13]] | after a reload the local backup is restored | — | Playwright | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-14]] | auto save writes the original file 2 s after an edit (Chromium part) | — | Playwright | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-14]] | without File System Access, saving downloads and says so once (Chromium part) | — | Playwright | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-15]] | opens a file again from Recent Files | — | Playwright | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-16]] | finds a command in the command palette and runs it | — | Playwright | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[07-testing#4. MVP의 인수 테스트\|AT-17]] | ? opens the shortcut list, and Help opens the user guide | — | Playwright | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[defects\|BUG-01]] | a diagram larger than the window scrolls in the canvas | — | Playwright | E2E | `apps/web/e2e/examples.spec.ts` |
| [[defects\|BUG-02]] | the toolbar's dropdown opens over the canvas, not inside the toolbar | — | Playwright | E2E | `apps/web/e2e/examples.spec.ts` |
| [[defects\|BUG-03]] | the editor appears when indexedDB.open never answers | [[03-quality-attribute-scenarios#1. 목록\|QA-19]] | Playwright | E2E | `apps/web/e2e/boot.spec.ts` |
| [[defects\|BUG-03]] | a failure at start is shown on the boot screen | [[03-quality-attribute-scenarios#1. 목록\|QA-19]] | Playwright | E2E | `apps/web/e2e/boot.spec.ts` |
| [[defects\|BUG-04]] | on a phone the toolbar shows "Examples", and a tap opens the modal | [[03-quality-attribute-scenarios#1. 목록\|QA-20]] | Playwright | E2E | `apps/web/e2e/mobile.spec.ts` |
| [[03-quality-attribute-scenarios#1. 목록\|QA-01]] | 400 random keys keep the invariants and undo all the way back (seed ${String(seed)}) | — | Vitest | 통합 | `packages/editor/src/session/random-keys.test.ts` |
| [[03-quality-attribute-scenarios#1. 목록\|QA-01]] | any sequence of commands keeps the invariants and never changes its input | — | 속성 기반 (fast-check) | 단위 | `packages/core/src/commands/properties.test.ts` |
| [[03-quality-attribute-scenarios#1. 목록\|QA-01]] | ids stay unique even when the generator must avoid ids of the view state | — | 속성 기반 (fast-check) | 단위 | `packages/core/src/commands/properties.test.ts` |
| [[03-quality-attribute-scenarios#1. 목록\|QA-02]] | broken input is refused with a reason, never thrown | — | Vitest | 단위 | `packages/core/src/format/parse-model.test.ts` |
| [[03-quality-attribute-scenarios#1. 목록\|QA-02]] | opening any text never throws | — | 속성 기반 (fast-check) | 단위 | `packages/core/src/format/round-trip.test.ts` |
| [[03-quality-attribute-scenarios#1. 목록\|QA-02]] | broken files are refused as damaged, never thrown | — | Vitest | 단위 | `packages/core/src/format/svg-file.test.ts` |
| [[03-quality-attribute-scenarios#1. 목록\|QA-04]] | every golden file opens and saves to the same bytes | — | 골든 파일 | 통합 | `packages/core/node/golden.test.ts` |
| [[03-quality-attribute-scenarios#1. 목록\|QA-04]] | a saved SVG file opens as the same document and saves to the same bytes | — | 속성 기반 (fast-check) | 단위 | `packages/core/src/format/round-trip.test.ts` |
| [[03-quality-attribute-scenarios#1. 목록\|QA-04]] | opening and saving again gives the same model part | — | Vitest | 단위 | `packages/core/src/format/svg-file.test.ts` |
| [[03-quality-attribute-scenarios#1. 목록\|QA-04]] | saves to an SVG file and opens as the same document | — | Vitest | 단위 | `packages/editor/src/examples/examples.test.ts` |
| [[03-quality-attribute-scenarios#1. 목록\|QA-07]] | lays out and renders 500 blocks well inside the 100ms budget | — | Vitest | 단위 | `packages/core/src/render/render-doc.test.ts` |
| [[03-quality-attribute-scenarios#1. 목록\|QA-07]] | layout and scene + SVG text stay far inside the 100ms edit budget | — | Vitest bench | 성능 | `packages/core/src/render/render.bench.ts` |
| [[03-quality-attribute-scenarios#1. 목록\|QA-09]] | 100 blocks with 300 different Hangul syllables save to 300 KB or less | — | 골든 파일 | 통합 | `packages/core/node/golden.test.ts` |
| [[03-quality-attribute-scenarios#1. 목록\|QA-18]] | on a slow phone the editor shows within 3 s and the block font within 5 s | — | Playwright | E2E | `apps/web/e2e/mobile.spec.ts` |
| [[03-quality-attribute-scenarios#1. 목록\|QA-20]] | a first visit on a phone opens an example with a tap | — | Playwright | E2E | `apps/web/e2e/mobile.spec.ts` |
| [[03-quality-attribute-scenarios#1. 목록\|QA-20]] | on a phone a block is inserted from the toolbar and selected with a tap | — | Playwright | E2E | `apps/web/e2e/mobile.spec.ts` |
| [[03-quality-attribute-scenarios#1. 목록\|QA-20]] | on a phone undo, redo, wrap and help are in the toolbar, with no bar at the bottom | — | Playwright | E2E | `apps/web/e2e/mobile.spec.ts` |
| [[01-requirements#^r-all\|R-ALL-03]] | a new document has one empty block, selected, and is not dirty | — | Vitest + happy-dom | 통합 | `packages/editor/src/create-editor.test.ts` |
| [[01-requirements#^r-all\|R-ALL-03]] | a new document has one diagram holding one empty block | — | Vitest | 단위 | `packages/core/src/commands/new-document.test.ts` |
| [[01-requirements#^r-all\|R-ALL-03]] | a new doc starts with nothing folded and the result symbol ← | — | Vitest | 단위 | `packages/core/src/commands/new-document.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | inserting a call block asks in the chrome state; the answer inserts | — | Vitest + happy-dom | 통합 | `packages/editor/src/create-editor.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | removing a Method header makes its calls lost and selects the first block | — | Vitest | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | a c lists the Methods; the chosen one is called and its arguments typed | — | Vitest | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | "New Method, and call it" makes the Method and edits its name | — | Vitest | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | a call block that lost its target cannot be edited | — | Vitest | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | changing the called Method starts at the current one and keeps the texts | — | Vitest | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | lists the Methods and "new Method"; j k move from the active one, Enter chooses | — | Vitest + happy-dom | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| [[01-requirements#^r-blk\|R-BLK-07]] | sets the arguments and the result, each on one line | — | Vitest | 단위 | `packages/core/src/commands/call.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | a field left out stays | — | Vitest | 단위 | `packages/core/src/commands/call.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | emptied arguments of a Method that receives something are refilled | — | Vitest | 단위 | `packages/core/src/commands/call.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | a Method that receives nothing may be called with empty arguments | — | Vitest | 단위 | `packages/core/src/commands/call.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | a call block that lost its target cannot be edited | — | Vitest | 단위 | `packages/core/src/commands/call.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | empty arguments take the parameters of the new Method | — | Vitest | 단위 | `packages/core/src/commands/call.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | an Event or a diagram without a header cannot be called | — | Vitest | 단위 | `packages/core/src/commands/call.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | inserts a call block with the parameters as its arguments | — | Vitest | 단위 | `packages/core/src/commands/call.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | a Method that receives nothing gets empty arguments | — | Vitest | 단위 | `packages/core/src/commands/call.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | a Method may call itself | — | Vitest | 단위 | `packages/core/src/commands/call.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | only a Method can be called | — | Vitest | 단위 | `packages/core/src/commands/call.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | makes a new Method and calls it from the selection, in one step | — | Vitest | 단위 | `packages/core/src/commands/call.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | the written name becomes the header, its parameters the arguments | — | Vitest | 단위 | `packages/core/src/commands/call.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | removing the parentheses clears the arguments of the call blocks | — | Vitest | 단위 | `packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | adding parentheses fills empty arguments with the text inside them | — | Vitest | 단위 | `packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | written arguments stay when the parameters change | — | Vitest | 단위 | `packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-07]] | removing a Method header turns its call blocks into lost ones | — | Vitest | 단위 | `packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-08]] | a call by a written name is edited as it is | — | Vitest | 단위 | `packages/core/src/commands/call.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-10]] | Up from the first block selects the header; Down goes back | — | Vitest | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-10]] | Enter edits the name; accepting changes it in one undo step | — | Vitest | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-10]] | e in a diagram without a header gives it one and edits its name | — | Vitest | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-10]] | sets the text of an Event header | — | Vitest | 단위 | `packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-10]] | gives a diagram without a header an Event header with the default name | — | Vitest | 단위 | `packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-10]] | is "Event n" or "Method n" with the smallest unused n | — | Vitest | 단위 | `packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-10]] | a click on the header hits the header and selects it | — | Vitest | 단위 | `packages/editor/src/input/hit-test.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-11]] | a clashing name opens the field again; Esc there keeps the old name | — | Vitest | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-11]] | m on a header changes the kind; a called Method cannot become an Event | — | Vitest | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-11]] | refuses an empty or clashing name, and an unknown target | — | Vitest | 단위 | `packages/core/src/commands/call.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-11]] | renaming a Method leaves its call blocks pointing at it by id | — | Vitest | 단위 | `packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-11]] | refuses an empty name, for an Event and for a Method without a name | — | Vitest | 단위 | `packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-11]] | refuses a name another header has, Events and Methods together | — | Vitest | 단위 | `packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-11]] | names are case sensitive, and a header may keep its own name | — | Vitest | 단위 | `packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-11]] | gives a Method header; the default name skips names in use | — | Vitest | 단위 | `packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-11]] | changes an Event to a Method and back, keeping the text | — | Vitest | 단위 | `packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-11]] | a Method that call blocks call cannot become an Event | — | Vitest | 단위 | `packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-blk\|R-BLK-11]] | changing the kind refuses a text that reads as a clashing or empty name | — | Vitest | 단위 | `packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-01]] | a + kind inserts after the selection and opens its text field | — | Vitest | 통합 | `packages/editor/src/session/engine.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-01]] | click inserts after, Shift+click before, Ctrl+click wraps; process cannot wrap | — | Vitest + happy-dom | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| [[01-requirements#^r-edit\|R-EDIT-01]] | deletes the selected range with what is inside | — | Vitest | 단위 | `packages/core/src/commands/delete.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-01]] | deleting a whole fold region deletes its blocks | — | Vitest | 단위 | `packages/core/src/commands/delete.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-01]] | refuses to delete the only, empty block, and a missing target | — | Vitest | 단위 | `packages/core/src/commands/delete.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-01]] | an empty block among others can be deleted | — | Vitest | 단위 | `packages/core/src/commands/delete.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-01]] | sets the text of a block, keeping the rest | — | Vitest | 단위 | `packages/core/src/commands/edit-text.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-01]] | refuses a missing node, a diagram header and call blocks (later features) | — | Vitest | 단위 | `packages/core/src/commands/edit-text.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-01]] | inserts a process block after the selected block | — | Vitest | 단위 | `packages/core/src/commands/insert.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-01]] | inserts before the selection, and after the end of a range | — | Vitest | 단위 | `packages/core/src/commands/insert.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-01]] | a control block inserted on an empty block takes its place | — | Vitest | 단위 | `packages/core/src/commands/insert.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-01]] | a process block on an empty block changes nothing (the editor opens it) | — | Vitest | 단위 | `packages/core/src/commands/insert.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-01]] | inserts inside a branch when a block of the branch is selected | — | Vitest | 단위 | `packages/core/src/commands/insert.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-01]] | with nothing selected, inserts at the end of the diagram | — | Vitest | 단위 | `packages/core/src/commands/insert.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-01]] | refuses a target that is not there or not contiguous | — | Vitest | 단위 | `packages/core/src/commands/insert.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-01]] | a click in a process block hits that block | — | Vitest | 단위 | `packages/editor/src/input/hit-test.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-03]] | Down goes in drawn order but never into a side branch | — | Vitest | 단위 | `packages/editor/src/navigation/navigate.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-03]] | Up from the first block of a branch selects its label, then the If (UX Q10) | — | Vitest | 단위 | `packages/editor/src/navigation/navigate.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-03]] | Up from below an If lands at the bottom of its leftmost branch | — | Vitest | 단위 | `packages/editor/src/navigation/navigate.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-03]] | Left and Right cross branches, then leave the If (UX Q11) | — | Vitest | 단위 | `packages/editor/src/navigation/navigate.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-03]] | on a branch label, Left and Right go to the next label, Down into the branch | — | Vitest | 단위 | `packages/editor/src/navigation/navigate.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-03]] | Ctrl+Up / Down treat a control block as one block | — | Vitest | 단위 | `packages/editor/src/navigation/navigate.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-03]] | Ctrl+Left / Right go to the side branch, or up and down outside one | — | Vitest | 단위 | `packages/editor/src/navigation/navigate.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-03]] | gg and G select the first and last block of the diagram | — | Vitest | 단위 | `packages/editor/src/navigation/navigate.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-03]] | [[ and ]] go to the neighbouring diagram, if there is one | — | Vitest | 단위 | `packages/editor/src/navigation/navigate.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-04]] | lists the second keys when the engine says the hint is due, and hides after | — | Vitest + happy-dom | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| [[01-requirements#^r-edit\|R-EDIT-04]] | the first key of a sequence waits; the second runs the command (UX K1) | — | Vitest | 단위 | `packages/editor/src/input/keys.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-05]] | Shift+click deeper widens to the nearest common sequence (ADR-0008) | — | Vitest | 단위 | `packages/editor/src/state/selection.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-05]] | Shift+click in another diagram selects only that block | — | Vitest | 단위 | `packages/editor/src/state/selection.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-05]] | Shift+Down stays under one parent | — | Vitest | 단위 | `packages/editor/src/state/selection.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-06]] | wrapping selects the new block and opens its condition | — | Vitest | 통합 | `packages/editor/src/session/engine.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-06]] | wraps a contiguous range in a new While, in its place | — | Vitest | 단위 | `packages/core/src/commands/wrap.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-06]] | an If takes the blocks in its true branch; the false branch is empty | — | Vitest | 단위 | `packages/core/src/commands/wrap.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-06]] | a Case takes the blocks in its first branch, with a second branch and a default | — | Vitest | 단위 | `packages/core/src/commands/wrap.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-06]] | fold regions inside go in; a region of exactly the range stays around the wrapper | — | Vitest | 단위 | `packages/core/src/commands/wrap.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-06]] | refuses a process block and a missing target | — | Vitest | 단위 | `packages/core/src/commands/wrap.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-07]] | unwrapping from inside keeps the selection and says what was removed | — | Vitest | 통합 | `packages/editor/src/session/engine.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-07]] | removes the selected control block and leaves its blocks in place | — | Vitest | 단위 | `packages/core/src/commands/wrap.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-07]] | an If or Case leaves its non-empty branches one after another | — | Vitest | 단위 | `packages/core/src/commands/wrap.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-07]] | with a block inside selected, the nearest control block holding it is removed (UX Q8) | — | Vitest | 단위 | `packages/core/src/commands/wrap.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-07]] | wrap then unwrap gives back the same blocks | — | Vitest | 단위 | `packages/core/src/commands/wrap.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-07]] | fold regions inside come out; a region around the block now spans its blocks | — | Vitest | 단위 | `packages/core/src/commands/wrap.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-07]] | a control block with only empty inside leaves an empty block if nothing else is left | — | Vitest | 단위 | `packages/core/src/commands/wrap.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-07]] | refuses when there is no control block, and for call blocks (later) | — | Vitest | 단위 | `packages/core/src/commands/wrap.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-09]] | a press that moves past 4 px hands a drag to the engine instead of clicking | — | Vitest + happy-dom | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| [[01-requirements#^r-edit\|R-EDIT-09]] | moves blocks into a neighbouring loop, keeping their ids | — | Vitest | 단위 | `packages/core/src/commands/move-to.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-09]] | a block dropped on an empty block takes its place | — | Vitest | 단위 | `packages/core/src/commands/move-to.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-09]] | a sequence left with no blocks gets an empty block | — | Vitest | 단위 | `packages/core/src/commands/move-to.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-09]] | dropping blocks where they are changes nothing | — | Vitest | 단위 | `packages/core/src/commands/move-to.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-09]] | refuses to drop blocks inside themselves | — | Vitest | 단위 | `packages/core/src/commands/move-to.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-09]] | the 8 px bands are between blocks, the rest is on the block | — | Vitest | 단위 | `packages/editor/src/input/hit-test.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-09]] | a new control block dropped on a block wraps it; a process goes after | — | Vitest | 단위 | `packages/editor/src/input/hit-test.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-09]] | on one of the selected blocks the whole selection is wrapped | — | Vitest | 단위 | `packages/editor/src/input/hit-test.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-09]] | dragged blocks go between blocks, even into a control block | — | Vitest | 단위 | `packages/editor/src/input/hit-test.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-09]] | an empty block takes a drop whole; nothing drops into the dragged blocks | — | Vitest | 단위 | `packages/editor/src/input/hit-test.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-10]] | dd cuts, p pastes after the selection with new ids | — | Vitest | 통합 | `packages/editor/src/session/engine.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-10]] | copy takes whole subtrees and the fold regions inside the range | — | Vitest | 단위 | `packages/core/src/commands/clipboard.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-10]] | paste puts copies with new ids after the selected block | — | Vitest | 단위 | `packages/core/src/commands/clipboard.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-10]] | paste on an empty block takes its place | — | Vitest | 단위 | `packages/core/src/commands/clipboard.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-10]] | paste refuses an empty clip and a missing target | — | Vitest | 단위 | `packages/core/src/commands/clipboard.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-10]] | cut gives the clip and deletes the blocks | — | Vitest | 단위 | `packages/core/src/commands/clipboard.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-10]] | copied blocks are indented lines for other programs | — | Vitest | 단위 | `packages/editor/src/clipboard/clip-format.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-10]] | the model JSON reads back as the same blocks | — | Vitest | 단위 | `packages/editor/src/clipboard/clip-format.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-11]] | moving keeps the moved blocks selected | — | Vitest | 통합 | `packages/editor/src/session/engine.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-11]] | o on a branch label inserts a branch and opens its label | — | Vitest | 통합 | `packages/editor/src/session/engine.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-11]] | inserts a branch after or before the selected one, with an unused number label | — | Vitest | 단위 | `packages/core/src/commands/branch.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-11]] | a branch inserted after the default goes right before it | — | Vitest | 단위 | `packages/core/src/commands/branch.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-11]] | inserting a branch on an If asks to convert it to a Case (UX MD3) | — | Vitest | 단위 | `packages/core/src/commands/branch.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-11]] | deletes a branch with its blocks; offers If when one branch is left (UX MD3) | — | Vitest | 단위 | `packages/core/src/commands/branch.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-11]] | the default and the last branch cannot be deleted, nor If branches (UX MD3) | — | Vitest | 단위 | `packages/core/src/commands/branch.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-11]] | deleting from a Case without default gives no offer | — | Vitest | 단위 | `packages/core/src/commands/branch.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-11]] | a Case with one branch and a default becomes an If, ids kept | — | Vitest | 단위 | `packages/core/src/commands/branch.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-11]] | only a Case with exactly one branch and a default converts | — | Vitest | 단위 | `packages/core/src/commands/branch.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-11]] | an If becomes a Case with a new branch between true and default | — | Vitest | 단위 | `packages/core/src/commands/branch.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-11]] | sets a Case branch label but not an empty one, nor the default label | — | Vitest | 단위 | `packages/core/src/commands/edit-text.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-11]] | a block trades places with the block below or above | — | Vitest | 단위 | `packages/core/src/commands/move.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-11]] | a block jumps over a control block and does not enter it | — | Vitest | 단위 | `packages/core/src/commands/move.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-11]] | at the end of a sequence, blocks leave the control block holding them | — | Vitest | 단위 | `packages/core/src/commands/move.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-11]] | at the top or bottom of a diagram the move is refused | — | Vitest | 단위 | `packages/core/src/commands/move.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-11]] | a Case branch trades places with its neighbour, label and all | — | Vitest | 단위 | `packages/core/src/commands/move.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-11]] | moving a block sideways moves the nearest branch holding it | — | Vitest | 단위 | `packages/core/src/commands/move.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-11]] | the default branch stays last; edges are refused | — | Vitest | 단위 | `packages/core/src/commands/move.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-11]] | swapping If branches swaps the blocks, keeps labels in place, and notes the condition | — | Vitest | 단위 | `packages/core/src/commands/move.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-12]] | an If branch label opens with its drawn word | — | Vitest | 통합 | `packages/editor/src/session/engine.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-12]] | sets and clears an If branch label | — | Vitest | 단위 | `packages/core/src/commands/edit-text.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-12]] | a branch label row beats the header around it | — | Vitest | 단위 | `packages/editor/src/input/hit-test.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-18]] | E and M make a new diagram of that kind and edit its name | — | Vitest | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-18]] | Shift+Delete deletes the diagram; the only one cannot be deleted | — | Vitest | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-18]] | a new Method goes after the last Method | — | Vitest | 단위 | `packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-18]] | a new Event goes after the last Event or diagram without a header | — | Vitest | 단위 | `packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-18]] | the first of its kind goes first (Event) or last (Method) | — | Vitest | 단위 | `packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-18]] | deletes a diagram; the call blocks calling it become lost | — | Vitest | 단위 | `packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-18]] | swaps with the previous diagram of its kind, skipping the others | — | Vitest | 단위 | `packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-18]] | refuses at either end of its kind | — | Vitest | 단위 | `packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-19]] | on blocks of a diagram with a header, m tells that extracting is not there yet | — | Vitest | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-21]] | `?` opens the key table with Vim and standard columns, Esc closes it | — | Vitest + happy-dom | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| [[01-requirements#^r-edit\|R-EDIT-24]] | finds commands by part of the name, recent ones first | — | Vitest + happy-dom | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| [[01-requirements#^r-edit\|R-EDIT-24]] | opens from its command, shows Vim keys, runs the picked row with Enter | — | Vitest + happy-dom | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| [[01-requirements#^r-edit\|R-EDIT-24]] | moves with ↑ ↓ and closes with Esc without running | — | Vitest + happy-dom | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| [[01-requirements#^r-edit\|R-EDIT-25]] | a first visit is welcomed with ten examples, a blank document and open file | — | Playwright | E2E | `apps/web/e2e/examples.spec.ts` |
| [[01-requirements#^r-edit\|R-EDIT-25]] | lists the ten examples in order, each named in both languages | — | Vitest | 단위 | `packages/editor/src/examples/examples.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-25]] | keeps every invariant, with either header shape | — | Vitest | 단위 | `packages/editor/src/examples/examples.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-25]] | uses the given header shape and the settings and view of a new document | — | Vitest | 단위 | `packages/editor/src/examples/examples.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-25]] | builds the same document every time | — | Vitest | 단위 | `packages/editor/src/examples/examples.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-25]] | has the diagrams, headers and blocks of the prototype | — | Vitest | 단위 | `packages/editor/src/examples/examples.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-25]] | keeps every text of the short notation as written | — | Vitest | 단위 | `packages/editor/src/examples/examples.test.ts` |
| [[01-requirements#^r-edit\|R-EDIT-25]] | links every call block to a Method in the document | — | Vitest | 단위 | `packages/editor/src/examples/examples.test.ts` |
| [[01-requirements#^r-exp\|R-EXP-01]] | exports a PNG at twice the drawing size | — | Playwright | E2E | `apps/web/e2e/files.spec.ts` |
| [[01-requirements#^r-exp\|R-EXP-01]] | reads the size of the saved SVG | — | Vitest | 단위 | `apps/web/src/files/export-png.test.ts` |
| [[01-requirements#^r-exp\|R-EXP-01]] | draws at twice the size by default, in whole pixels | — | Vitest | 단위 | `apps/web/src/files/export-png.test.ts` |
| [[01-requirements#^r-exp\|R-EXP-01]] | names the PNG after the document | — | Vitest | 단위 | `apps/web/src/files/file-name.test.ts` |
| [[01-requirements#^r-exp\|R-EXP-04]] | saves 2 s after the last change | — | Vitest | 단위 | `apps/web/src/shell/timers.test.ts` |
| [[01-requirements#^r-exp\|R-EXP-04]] | a change while saving waits 2 s again after the save ends | — | Vitest | 단위 | `apps/web/src/shell/timers.test.ts` |
| [[01-requirements#^r-exp\|R-EXP-04]] | puts the last opened file first | — | Vitest | 단위 | `apps/web/src/storage/recent-files.test.ts` |
| [[01-requirements#^r-exp\|R-EXP-04]] | keeps one entry per file and moves it to the top | — | Vitest | 단위 | `apps/web/src/storage/recent-files.test.ts` |
| [[01-requirements#^r-exp\|R-EXP-04]] | remembers ten files and reports the ones that fell off | — | Vitest | 단위 | `apps/web/src/storage/recent-files.test.ts` |
| [[01-requirements#^r-fmt\|R-FMT-01]] | save writes the file with the model inside; reopening gives the same content | — | Vitest + happy-dom | 통합 | `packages/editor/src/create-editor.test.ts` |
| [[01-requirements#^r-fmt\|R-FMT-02]] | reads back every node kind as the same document | — | Vitest | 단위 | `packages/core/src/format/parse-model.test.ts` |
| [[01-requirements#^r-fmt\|R-FMT-02]] | model JSON reads back as the same content, and writes the same text again | — | 속성 기반 (fast-check) | 단위 | `packages/core/src/format/round-trip.test.ts` |
| [[01-requirements#^r-fmt\|R-FMT-02]] | saves to model JSON and opens as the same document | — | Vitest | 단위 | `packages/editor/src/examples/examples.test.ts` |
| [[01-requirements#^r-fmt\|R-FMT-03]] | ${name} is saved as the golden file | — | 골든 파일 | 통합 | `packages/core/node/golden.test.ts` |
| [[01-requirements#^r-fmt\|R-FMT-03]] | the same document gives the same text, whatever order the objects were built in | — | Vitest | 단위 | `packages/core/src/format/model-json.test.ts` |
| [[01-requirements#^r-fmt\|R-FMT-03]] | the same parts give the same bytes | — | Vitest | 단위 | `packages/core/src/format/svg-file.test.ts` |
| [[01-requirements#^r-fmt\|R-FMT-03]] | the same document gives the same layout | — | 속성 기반 (fast-check) | 단위 | `packages/core/src/layout/layout.test.ts` |
| [[01-requirements#^r-fmt\|R-FMT-03]] | the same model gives the same SVG text | — | Vitest | 단위 | `packages/core/src/render/render-doc.test.ts` |
| [[01-requirements#^r-fmt\|R-FMT-03]] | ${name} matches its golden SVG | — | Vitest | 단위 | `packages/core/src/render/render-doc.test.ts` |
| [[01-requirements#^r-fmt\|R-FMT-03]] | the same code points give the same bytes, in any order and with duplicates | — | Vitest | 단위 | `packages/fonts/node/subset.test.ts` |
| [[01-requirements#^r-fmt\|R-FMT-04]] | splits CDATA around ]]> and reads the text back whole | — | Vitest | 단위 | `packages/core/src/format/svg-file.test.ts` |
| [[01-requirements#^r-fmt\|R-FMT-06]] | a plain SVG without a model element cannot be edited | — | Vitest | 단위 | `packages/core/src/format/svg-file.test.ts` |
| [[01-requirements#^r-fmt\|R-FMT-07]] | lists the used code points, fixed words included | — | Vitest | 단위 | `packages/core/src/render/render-doc.test.ts` |
| [[01-requirements#^r-lay\|R-LAY-01]] | a multi-line block grows by 18px a line | — | 속성 기반 (fast-check) | 단위 | `packages/core/src/layout/layout.test.ts` |
| [[01-requirements#^r-lay\|R-LAY-01]] | measures several lines: the longest width, lines × 18px | — | Vitest | 단위 | `packages/core/src/text/measure-text.test.ts` |
| [[01-requirements#^r-lay\|R-LAY-02]] | an If is as wide as both branches side by side | — | 속성 기반 (fast-check) | 단위 | `packages/core/src/layout/layout.test.ts` |
| [[01-requirements#^r-lay\|R-LAY-02]] | the blocks of a diagram body fill it exactly (it stays a rectangle) | — | 속성 기반 (fast-check) | 단위 | `packages/core/src/layout/layout.test.ts` |
| [[01-requirements#^r-lay\|R-LAY-04]] | matches the 13px examples of 02-layout 2.1 | — | Vitest | 단위 | `packages/core/src/text/measure-text.test.ts` |
| [[01-requirements#^r-lay\|R-LAY-04]] | counts Hangul as full width and Latin as half width | — | Vitest | 단위 | `packages/core/src/text/measure-text.test.ts` |
| [[01-requirements#^r-lay\|R-LAY-09]] | draws the ∅ of an empty branch as a shape, not a character | — | Vitest | 단위 | `packages/core/src/render/render-doc.test.ts` |
| [[01-requirements#^r-lay\|R-LAY-10]] | changes the header shape | — | Vitest | 단위 | `packages/core/src/commands/diagram.test.ts` |
| [[01-requirements#^r-lay\|R-LAY-10]] | the header shape defaults to title and can be passed in (UX HS1) | — | Vitest | 단위 | `packages/core/src/commands/new-document.test.ts` |
| [[01-requirements#^r-nfr\|R-NFR-01]] | a valid document has no violations | — | Vitest | 단위 | `packages/core/src/model/invariants.test.ts` |
| [[01-requirements#^r-nfr\|R-NFR-04]] | menus, status bar and the drawing words are Korean | — | Playwright | E2E | `apps/web/e2e/acceptance.spec.ts` |
| [[01-requirements#^r-nfr\|R-NFR-04]] | names the menus in the screen language | — | Vitest + happy-dom | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| [[01-requirements#^r-nfr\|R-NFR-04]] | Korean browsers get Korean, every other language English | — | Vitest | 단위 | `apps/web/src/shell/messages.test.ts` |
| [[01-requirements#^r-nfr\|R-NFR-04]] | the preference wins over the browser language | — | Vitest | 단위 | `apps/web/src/shell/messages.test.ts` |
| [[01-requirements#^r-nfr\|R-NFR-04]] | writes the fixed words in the given locale | — | Vitest | 단위 | `packages/core/src/render/render-doc.test.ts` |
| [[01-requirements#^r-web\|R-WEB-02]] | an SVG without a model is not opened, and the reason is shown | — | Playwright | E2E | `apps/web/e2e/files.spec.ts` |
| [[01-requirements#^r-web\|R-WEB-02]] | writes to the original file, asking for permission on a save | — | Vitest | 통합 | `apps/web/src/files/web-document-store.test.ts` |
| [[01-requirements#^r-web\|R-WEB-02]] | an SVG without a model does not replace the document, and says why | — | Vitest | 통합 | `apps/web/src/shell/web-shell.test.ts` |
| [[01-requirements#^r-web\|R-WEB-02]] | opens .ns.svg and .ns files, whatever the case | — | Vitest | 단위 | `apps/web/src/files/file-name.test.ts` |
| [[01-requirements#^r-web\|R-WEB-02]] | keeps .ns.svg and .ns, and adds .ns.svg to other names | — | Vitest | 단위 | `apps/web/src/files/file-name.test.ts` |
| [[01-requirements#^r-web\|R-WEB-03]] | after a reload the unsaved changes can be restored | — | Playwright | E2E | `apps/web/e2e/files.spec.ts` |
| [[01-requirements#^r-web\|R-WEB-03]] | writes a backup 0.5 s after an edit and removes it after saving | — | Vitest | 통합 | `apps/web/src/shell/web-shell.test.ts` |
| [[01-requirements#^r-web\|R-WEB-03]] | at start, offers to restore the newest backup and opens it as unsaved | — | Vitest | 통합 | `apps/web/src/shell/web-shell.test.ts` |
| [[01-requirements#^r-web\|R-WEB-03]] | a declined restore removes that backup | — | Vitest | 통합 | `apps/web/src/shell/web-shell.test.ts` |
| [[01-requirements#^r-web\|R-WEB-03]] | writes once for edits within 0.5 s | — | Vitest | 단위 | `apps/web/src/shell/timers.test.ts` |
| [[01-requirements#^r-web\|R-WEB-03]] | flushes a pending write at once, and does nothing when none is pending | — | Vitest | 단위 | `apps/web/src/shell/timers.test.ts` |
| [[ux-decisions\|UX BH1]] | puts a header-colored halo behind the condition | — | Vitest | 단위 | `packages/core/src/render/render-doc.test.ts` |
| [[ux-decisions\|UX CD1]] | typing into the empty default cell makes the default branch, one undo step | — | Vitest | 통합 | `packages/editor/src/session/engine.test.ts` |
| [[ux-decisions\|UX CD1]] | inserting on the empty default cell makes the branch; deleting there does nothing | — | Vitest | 통합 | `packages/editor/src/session/engine.test.ts` |
| [[ux-decisions\|UX CD1]] | gives a Case without a default an empty default branch | — | Vitest | 단위 | `packages/core/src/commands/branch.test.ts` |
| [[ux-decisions\|UX CD1]] | refuses a Case that has a default, other blocks and unknown ids | — | Vitest | 단위 | `packages/core/src/commands/branch.test.ts` |
| [[ux-decisions\|UX CD1]] | a Case without a default draws an empty default cell | — | 속성 기반 (fast-check) | 단위 | `packages/core/src/layout/layout.test.ts` |
| [[ux-decisions\|UX CD1]] | draws the empty default cell of a Case without a default | — | Vitest | 단위 | `packages/core/src/render/render-doc.test.ts` |
| [[ux-decisions\|UX CD1]] | the empty default cell of a Case is hit | — | Vitest | 단위 | `packages/editor/src/input/hit-test.test.ts` |
| [[ux-decisions\|UX CD1]] | a drop on the empty default cell makes the default branch | — | Vitest | 단위 | `packages/editor/src/input/hit-test.test.ts` |
| [[ux-decisions\|UX CD1]] | the empty default cell of a Case is reached from the last branch | — | Vitest | 단위 | `packages/editor/src/navigation/navigate.test.ts` |
| [[ux-decisions\|UX CD2]] | a Case with only a default has one column | — | 속성 기반 (fast-check) | 단위 | `packages/core/src/layout/layout.test.ts` |
| [[ux-decisions\|UX E1]] | marks the only, empty block of a branch | — | 속성 기반 (fast-check) | 단위 | `packages/core/src/layout/layout.test.ts` |
| [[ux-decisions\|UX EX2]] | closing the welcome with Esc keeps the new document and does not ask again | — | Playwright | E2E | `apps/web/e2e/examples.spec.ts` |
| [[ux-decisions\|UX EX3]] | Help › Examples… opens the same modal with its own words | — | Playwright | E2E | `apps/web/e2e/examples.spec.ts` |
| [[ux-decisions\|UX EX3]] | the toolbar's "Examples" opens the examples modal | — | Playwright | E2E | `apps/web/e2e/examples.spec.ts` |
| [[ux-decisions\|UX FB1]] | a For is measured like a While | — | 속성 기반 (fast-check) | 단위 | `packages/core/src/layout/layout.test.ts` |
| [[ux-decisions\|UX HS1]] | the shape chosen last is remembered and new documents start with it | — | Vitest + happy-dom | 통합 | `packages/editor/src/create-editor.test.ts` |
| [[ux-decisions\|UX HS1]] | opening a file keeps its own shape and does not change the remembered one | — | Vitest + happy-dom | 통합 | `packages/editor/src/create-editor.test.ts` |
| [[ux-decisions\|UX K1]] | the key hint shows 0.4 s after the first key; Esc cancels | — | Vitest | 통합 | `packages/editor/src/session/engine.test.ts` |
| [[ux-decisions\|UX K1]] | a key that does not continue the sequence, or Esc, cancels it | — | Vitest | 단위 | `packages/editor/src/input/keys.test.ts` |
| [[ux-decisions\|UX K1]] | finds the second key after a pending first key | — | Vitest | 단위 | `packages/editor/src/ui/keys.test.ts` |
| [[ux-decisions\|UX LT1]] | never wraps a long line | — | Vitest | 단위 | `packages/core/src/text/measure-text.test.ts` |
| [[ux-decisions\|UX LT1]] | keeps spaces as written | — | Vitest | 단위 | `packages/core/src/text/measure-text.test.ts` |
| [[ux-decisions\|UX MD1]] | joins a fold region at its end, and goes to the diagram end with no selection | — | Vitest | 단위 | `packages/core/src/commands/call.test.ts` |
| [[ux-decisions\|UX MD2]] | closing the text field with the same text leaves no undo step | — | Vitest | 통합 | `packages/editor/src/session/engine.test.ts` |
| [[ux-decisions\|UX MD3]] | deleting down to one branch asks to make an If; Esc keeps the Case | — | Vitest | 통합 | `packages/editor/src/session/engine.test.ts` |
| [[ux-decisions\|UX MD3]] | inserting a branch on an If asks to make it a Case; Enter converts | — | Vitest | 통합 | `packages/editor/src/session/engine.test.ts` |
| [[ux-decisions\|UX MD3]] | asks If ↔ Case with buttons and passes the answer to the engine | — | Vitest + happy-dom | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| [[ux-decisions\|UX ND1]] | Down with nothing below selects the block holding this one; at the top, it stays | — | Vitest | 단위 | `packages/editor/src/navigation/navigate.test.ts` |
| [[ux-decisions\|UX Q4]] | an empty name puts the old name back, closes and tells why | — | Vitest | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| [[ux-decisions\|UX Q6]] | Alt+arrows on a header move the diagram among its kind | — | Vitest | 통합 | `packages/editor/src/session/diagrams.test.ts` |
| [[ux-decisions\|UX Q19]] | after deleting, the next block, else the previous, else the holder | — | Vitest | 통합 | `packages/editor/src/session/engine.test.ts` |
| [[ux-decisions\|UX Q19]] | undo keeps the selection while what it names is still there | — | Vitest | 통합 | `packages/editor/src/session/engine.test.ts` |
| [[ux-decisions\|UX Q24]] | If branch labels follow the locale unless the user wrote one | — | 속성 기반 (fast-check) | 단위 | `packages/core/src/layout/layout.test.ts` |
| [[ux-decisions\|UX SB1]] | shares the extra height equally; the last block takes the remainder | — | 속성 기반 (fast-check) | 단위 | `packages/core/src/layout/layout.test.ts` |
| [[ux-decisions\|UX W3]] | shows the name and ● in the tab title | — | Vitest | 통합 | `apps/web/src/shell/web-shell.test.ts` |
| [[ux-decisions\|UX W3]] | shows the file name with ● while unsaved | — | Vitest + happy-dom | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| [[ux-decisions\|UX W3]] | puts ● before the name in the tab title while unsaved | — | Vitest | 단위 | `apps/web/src/files/file-name.test.ts` |
| [[ux-decisions\|UX W5]] | preferences show the user settings and write a change to the settings store | — | Vitest + happy-dom | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |
| [[ux-decisions\|UX W5]] | document settings write through the engine | — | Vitest + happy-dom | 통합 | `packages/editor/src/ui/editor-app.test.tsx` |

## 3. 파일마다

| 자리 | 목적/내용 | 근거 | 방법 | 유형 | 테스트 수 |
| --- | --- | --- | --- | --- | --- |
| `apps/web/e2e/acceptance.spec.ts` | The MVP acceptance tests AT-01 ~ AT-17 (07-testing 4) in the browser, against the production build | [[07-testing#4. MVP의 인수 테스트\|AT-01]], [[07-testing#4. MVP의 인수 테스트\|AT-17]] | Playwright | E2E | 26 |
| `apps/web/e2e/boot.spec.ts` | The start of the page (R-NFR-10, QA-19; inbox 2026-11-01 | [[01-requirements#^r-nfr\|R-NFR-10]], [[03-quality-attribute-scenarios#1. 목록\|QA-19]] | Playwright | E2E | 2 |
| `apps/web/e2e/examples.spec.ts` | The examples (R-EDIT-25, 05-screen-layout "예제", UX EX1 ~ EX3) | [[01-requirements#^r-edit\|R-EDIT-25]], [[ux-decisions\|UX EX1]] | Playwright | E2E | 6 |
| `apps/web/e2e/files.spec.ts` | Browser flows of the web shell (06-web 1, 2) | — | Playwright | E2E | 6 |
| `apps/web/e2e/mobile.spec.ts` | The web app on a phone (R-NFR-08 · R-NFR-09, QA-18 · QA-20; QA-19 is in boot.spec.ts) | [[01-requirements#^r-nfr\|R-NFR-08]], [[01-requirements#^r-nfr\|R-NFR-09]], [[03-quality-attribute-scenarios#1. 목록\|QA-18]], [[03-quality-attribute-scenarios#1. 목록\|QA-20]], [[03-quality-attribute-scenarios#1. 목록\|QA-19]] | Playwright | E2E | 5 |
| `apps/web/e2e/smoke.spec.ts` |  | — | Playwright | E2E | 1 |
| `apps/web/src/files/web-document-store.test.ts` | web document store | — | Vitest | 통합 | 5 |
| `apps/web/src/shell/web-shell.test.ts` | web shell | — | Vitest | 통합 | 8 |
| `packages/core/node/golden.test.ts` | Golden files (07-testing 3) | — | 골든 파일 | 통합 | 4 |
| `packages/editor/src/create-editor.test.ts` | the shell contract (03-editor 6, QA-10) · the shell asks through the editor (03-editor 6 additions) · the header shape (R-LAY-10, UX HS1) · the picker (interaction rules "호출 블록") · the inline editor on headers and call blocks (03-editor 3.4) | [[03-quality-attribute-scenarios#1. 목록\|QA-10]], [[01-requirements#^r-lay\|R-LAY-10]], [[ux-decisions\|UX HS1]] | Vitest + happy-dom | 통합 | 23 |
| `packages/editor/src/session/diagrams.test.ts` | selecting a header (interaction rules 2 "키보드로 이동하고 삽입하기") · editing a header name (interaction rules "Event 헤더", "Method 헤더") · header and diagram commands (interaction rules "새 Method로 빼기와 새 다이어그램") · call blocks (interaction rules "호출 블록") | — | Vitest | 통합 | 21 |
| `packages/editor/src/session/engine.test.ts` | inserting and editing text (AT-03) · the selection after a command (03-editor 2.3) · the clipboard (AT-12) · branches (R-EDIT-11, UX MD3) · keys and modes (03-keymap) · view only (03-editor 6.4) | [[07-testing#4. MVP의 인수 테스트\|AT-03]], [[07-testing#4. MVP의 인수 테스트\|AT-12]], [[01-requirements#^r-edit\|R-EDIT-11]], [[ux-decisions\|UX MD3]] | Vitest | 통합 | 26 |
| `packages/editor/src/session/random-keys.test.ts` | random keys (QA-01) | [[03-quality-attribute-scenarios#1. 목록\|QA-01]] | Vitest | 통합 | 1 |
| `packages/editor/src/ui/editor-app.test.tsx` | menu bar · toolbar block icons · command palette · status bar · key hint · modals · canvas slot · context menu · dialogs and notices from the shell · picker (interaction rules "호출 블록") | — | Vitest + happy-dom | 통합 | 25 |
| `apps/web/src/files/export-png.test.ts` | PNG export size | — | Vitest | 단위 | 4 |
| `apps/web/src/files/file-name.test.ts` | file names | — | Vitest | 단위 | 6 |
| `apps/web/src/shell/messages.test.ts` | screen language | — | Vitest | 단위 | 3 |
| `apps/web/src/shell/tab-lock.test.ts` | tab lock | — | Vitest | 단위 | 5 |
| `apps/web/src/shell/timers.test.ts` | local backup timer · auto save timer | — | Vitest | 단위 | 7 |
| `apps/web/src/storage/recent-files.test.ts` | recent files | — | Vitest | 단위 | 5 |
| `packages/core/src/commands/branch.test.ts` | Case branches · If and Case conversion (UX MD3) · the missing default branch (UX CD1) | [[ux-decisions\|UX MD3]], [[ux-decisions\|UX CD1]] | Vitest | 단위 | 11 |
| `packages/core/src/commands/call.test.ts` | editCall · setCallTarget · insertCall · newMethodAndCall | — | Vitest | 단위 | 24 |
| `packages/core/src/commands/clipboard.test.ts` | copy, cut and paste | — | Vitest | 단위 | 7 |
| `packages/core/src/commands/delete.test.ts` | deleteBlocks | — | Vitest | 단위 | 6 |
| `packages/core/src/commands/diagram.test.ts` | editHead · setHead · newDiagram · deleteDiagram · moveDiagram · setSettings · defaultHeadName | — | Vitest | 단위 | 31 |
| `packages/core/src/commands/edit-text.test.ts` | editText | — | Vitest | 단위 | 5 |
| `packages/core/src/commands/insert.test.ts` | insertBlock | — | Vitest | 단위 | 12 |
| `packages/core/src/commands/move-to.test.ts` | moveTo (drag and drop) | — | Vitest | 단위 | 5 |
| `packages/core/src/commands/move.test.ts` | move up and down · move left and right (branches) | — | Vitest | 단위 | 12 |
| `packages/core/src/commands/new-document.test.ts` | new document | — | Vitest | 단위 | 3 |
| `packages/core/src/commands/properties.test.ts` | Property-based tests (07-testing 2, QA-01) | [[03-quality-attribute-scenarios#1. 목록\|QA-01]] | 속성 기반 (fast-check) | 단위 | 2 |
| `packages/core/src/commands/wrap.test.ts` | wrap · unwrap | — | Vitest | 단위 | 12 |
| `packages/core/src/format/base64.test.ts` | base64 | — | Vitest | 단위 | 2 |
| `packages/core/src/format/model-json.test.ts` | model JSON serialization | — | Vitest | 단위 | 6 |
| `packages/core/src/format/parse-model.test.ts` | model JSON parsing | — | Vitest | 단위 | 8 |
| `packages/core/src/format/round-trip.test.ts` | round trip | — | 속성 기반 (fast-check) | 단위 | 3 |
| `packages/core/src/format/svg-file.test.ts` | SVG file | — | Vitest | 단위 | 14 |
| `packages/core/src/layout/layout.test.ts` | layout: blocks · layout: short branches (UX SB1) · layout: click regions · layout: headers (02-layout 1.5) · layout: several diagrams (02-layout 1.7) · layout: properties · layout: size | [[ux-decisions\|UX SB1]] | 속성 기반 (fast-check) | 단위 | 37 |
| `packages/core/src/model/id.test.ts` | ids | — | Vitest | 단위 | 5 |
| `packages/core/src/model/invariants.test.ts` | checkInvariants | — | Vitest | 단위 | 10 |
| `packages/core/src/render/render-doc.test.ts` | render · render: headers (visual design principle 2) · render: golden files (07-testing 3) | — | Vitest | 단위 | 16 |
| `packages/core/src/text/measure-text.test.ts` | text width | — | Vitest | 단위 | 8 |
| `packages/editor/src/clipboard/clip-format.test.ts` | clipboard formats (03-editor 3.3) | — | Vitest | 단위 | 3 |
| `packages/editor/src/examples/examples.test.ts` | examples · $id | — | Vitest | 단위 | 9 |
| `packages/editor/src/input/hit-test.test.ts` | hit testing (03-editor 3.1) · drop place (03-editor 3.2) · diagram headers (R-BLK-10, R-BLK-11) | [[01-requirements#^r-blk\|R-BLK-10]], [[01-requirements#^r-blk\|R-BLK-11]] | Vitest | 단위 | 14 |
| `packages/editor/src/input/keys.test.ts` | reading keys (03-editor 4) | — | Vitest | 단위 | 7 |
| `packages/editor/src/navigation/navigate.test.ts` | keyboard navigation (03-editor 2.2) | — | Vitest | 단위 | 12 |
| `packages/editor/src/state/selection.test.ts` | selection (03-editor 2) | — | Vitest | 단위 | 5 |
| `packages/editor/src/ui/keys.test.ts` | keys | — | Vitest | 단위 | 5 |
| `packages/editor/src/ui/menu-model.test.ts` | menuEntries | — | Vitest | 단위 | 1 |
| `packages/editor/src/version.test.ts` | editor package | — | Vitest | 단위 | 1 |
| `packages/fonts/node/index.test.ts` | readFontFile | — | Vitest | 단위 | 2 |
| `packages/fonts/node/subset.test.ts` | subsetToWoff · pinned output | — | Vitest | 단위 | 10 |
| `packages/fonts/src/advance-table.test.ts` | block font advance table | — | Vitest | 단위 | 5 |
| `packages/core/src/render/render.bench.ts` | The performance budget of 02-layout 4 | — | Vitest bench | 성능 | 3 |

## 4. 테스트가 없는 ID

문서에 정의된 시나리오(`QA-`) · 인수 테스트(`AT-`) · 결함(`BUG-`) 가운데, 이름에 그 ID를 단 테스트가 없는 것입니다. 테스트 파일이 통째로 맡거나(3장의 근거 칸), 인수 테스트가 맡거나([[07-testing#4. MVP의 인수 테스트]]의 표), 테스트가 아닌 검사가 맡은 것은 그 길을 적습니다. “없음”은 사람이 점검표로 보거나 아직 테스트가 없는 빈 곳입니다.

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
