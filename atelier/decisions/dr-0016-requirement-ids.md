---
title: "DR-0016: 요구사항은 영역과 번호로 된 ID를 표의 첫 칸에 두고, 링크의 앵커와 글자도 그 ID로 한다"
tags:
  - dr
status: 승인
date: 2026-10-25
supersedes:
superseded-by:
---

# DR-0016: 요구사항은 영역과 번호로 된 ID를 표의 첫 칸에 두고, 링크의 앵커와 글자도 그 ID로 한다

## 배경

메인테이너가 inbox에 적었다(2026-10-25):

> 요구사항에 대한 링크를 `^web-file` 처럼 만드니, 정작 [[01-requirements]]에서 찾아보기 힘듭니다. 특히 publish 됐을 때 그렇습니다. ID로 관리하는 것은 어떨까요?

그때까지 요구사항은 체크박스 목록이었고, 항목마다 끝에 블록 ID(`^web-file`)를 달았다. 블록 ID는 Obsidian의 읽기 화면에서도, 펴낸 사이트에서도 **보이지 않는다**. 그래서 링크를 거는 문서에서 본 글자(`^web-file`)를 요구사항 문서에서 찾으면 나오지 않았다. 메인테이너: "독자는 링크를 거는 문서에서 링크의 문자열을 요구사항 문서에서 찾을 것입니다. 요구사항에서 못 찾으니 당혹스러웠어요."

## 결정 기준

- 링크에 보이는 글자가 요구사항 문서에 그대로 보여, 찾으면 찾아진다.
- 링크를 누르면 되도록 그 요구사항으로 간다.
- 우선순위가 한눈에 보인다.

## 검토한 대안

### 지금 ID를 줄 앞에 글자로도 적기

- 장점: 링크를 바꾸지 않는다.
- 단점: 같은 ID를 두 번 적는다. 목록이라 우선순위를 오른쪽에 따로 둘 수 없다.

### 번호 ID와 표 (고름)

- 장점: ID가 짧고 표의 첫 칸에 늘 보인다. 우선순위를 오른쪽 칸으로 뺄 수 있다(메인테이너의 요청).
- 단점: ID만 보고 뜻을 알 수 없다. Obsidian은 표의 한 줄을 가리키지 못한다. 링크 약 480곳을 바꿔야 한다.

## 결정

메인테이너: "번호ID로 만들고 표로 만들어주세요. 우선순위는 오른쪽 컬럼으로 빼구요." "앵커도 id로 해주세요."

- 요구사항은 절마다 `| ID | 요구사항 | 우선순위 |` 표로 둔다. 비기능 요구사항은 `| ID | 품질 | 요구사항 |`.
- ID는 영역과 두 자리 번호다(`WEB-02`). 영역은 [[01-requirements]]의 "읽는 법"에 있다. 번호는 2026-10-25의 문서 순서대로 매겼다.
- 새 요구사항은 그 영역의 다음 번호를 받는다. 번호는 바꾸거나 다시 쓰지 않는다. 요구사항을 없애도 그 번호는 비워 둔다.
- 우선순위 태그(`#P0` …)는 "우선순위" 칸에 단다. 태그를 눌러 모아 보는 것은 그대로 된다.
- 다른 문서는 `[[01-requirements#WEB-02]]`로 가리킨다. 앵커와 링크에 보이는 글자가 모두 ID다.
	- 펴낸 사이트: 빌드할 때 첫 칸이 ID인 표의 줄마다 그 ID의 앵커를 단다(`site/prepare-content.mjs`). 링크를 누르면 그 줄로 간다. 링크의 글자는 `WEB-02`로 보인다.
	- Obsidian: 표의 한 줄을 가리킬 수 없어, 링크를 누르면 요구사항 문서의 첫머리가 열린다. 링크의 글자(`01-requirements > WEB-02`)의 ID로 찾는다.
- 체크박스는 없앴다. 구현의 진행은 개발을 시작할 때 따로 정한다.
- 옛 ID로 건 링크는 모두 새 ID로 바꿨다. 승인된 ADR · DR과 세션 기록도 바꿨다. 링크의 주소만 바뀌는 고침이라 결정의 본문을 고치는 것이 아니다(CLAUDE.md에 이 예외를 적음). 바꾼 스크립트는 `site/tools/req-ids-to-table.py`. 이미 없어진 요구사항(`^exp-png-folded`, `^edit-region`)으로 가는 옛 링크는 그대로 두었다.

## 결과

- 좋아지는 점: 링크에서 본 ID를 요구사항 문서에서 찾을 수 있다. 사이트에서는 링크가 그 줄로 바로 간다. 우선순위가 한 줄로 늘어선다.
- 감수하는 점: ID만으로는 뜻을 모른다(사이트에서는 링크를 누르고, Obsidian에서는 링크에 마우스를 올려 미리 본다). Obsidian에서는 링크가 문서의 첫머리로만 간다. 요구사항 아래의 세부 항목은 칸 안에 `<br>`로 이어 적어 원본이 조금 길다.
- 후속 작업: 없음.

## 옛 ID → 새 ID

옛 기록(세션 기록의 글, 시안 페이지)에 남은 옛 ID를 읽을 때 쓴다.

| 옛 ID | 새 ID |
| --- | --- |
| `all-donate` | ALL-01 |
| `obs-insert` | OBS-01 |
| `obs-edit-embed` | OBS-02 |
| `obs-insert-command` | OBS-03 |
| `obs-refresh` | OBS-04 |
| `obs-open` | OBS-05 |
| `obs-plain-svg` | OBS-06 |
| `obs-embed` | OBS-07 |
| `obs-new` | OBS-08 |
| `obs-detect` | OBS-09 |
| `obs-theme` | OBS-10 |
| `dsk-file` | DSK-01 |
| `dsk-open-nssvg` | DSK-02 |
| `dsk-assoc` | DSK-03 |
| `dsk-multi` | DSK-04 |
| `dsk-update` | DSK-05 |
| `web-static` | WEB-01 |
| `web-file` | WEB-02 |
| `web-draft` | WEB-03 |
| `web-pwa` | WEB-04 |
| `web-share-url` | WEB-05 |
| `web-view-mode` | WEB-06 |
| `web-ai-chat` | WEB-07 |
| `web-ads` | WEB-08 |
| `gd-open-with` | GD-01 |
| `gd-new` | GD-02 |
| `gd-save` | GD-03 |
| `gd-preview` | GD-04 |
| `cf-app` | CF-01 |
| `skill-claude` | SKILL-01 |
| `ide-vscode` | IDE-01 |
| `ide-intellij` | IDE-02 |
| `ide-reverse` | IDE-03 |
| `ide-codegen` | IDE-04 |
| `ide-fold-region` | IDE-05 |
| `ide-live-sync` | IDE-06 |
| `blk-event` | BLK-01 |
| `blk-case` | BLK-02 |
| `blk-method` | BLK-03 |
| `blk-call` | BLK-04 |
| `blk-call-named` | BLK-05 |
| `blk-call-external` | BLK-06 |
| `edit-basic` | EDIT-01 |
| `edit-undo` | EDIT-02 |
| `edit-keyboard` | EDIT-03 |
| `edit-key-hint` | EDIT-04 |
| `edit-multiselect` | EDIT-05 |
| `edit-wrap` | EDIT-06 |
| `edit-unwrap` | EDIT-07 |
| `edit-call-inline` | EDIT-08 |
| `edit-dnd` | EDIT-09 |
| `edit-clipboard` | EDIT-10 |
| `edit-branch` | EDIT-11 |
| `edit-if-label` | EDIT-12 |
| `edit-fold` | EDIT-13 |
| `edit-fold-range` | EDIT-14 |
| `edit-call-open` | EDIT-15 |
| `edit-fold-site` | EDIT-16 |
| `edit-fold-all` | EDIT-17 |
| `edit-multi-diagram` | EDIT-18 |
| `edit-extract` | EDIT-19 |
| `edit-snippets` | EDIT-20 |
| `help` | EDIT-21 |
| `lay-autosize` | LAY-01 |
| `lay-branch-width` | LAY-02 |
| `lay-zoom` | LAY-03 |
| `lay-text-measure` | LAY-04 |
| `lay-default-style` | LAY-05 |
| `lay-text-kind` | LAY-06 |
| `lay-syntax` | LAY-07 |
| `lay-theme` | LAY-08 |
| `lay-empty-branch` | LAY-09 |
| `lay-head-style` | LAY-10 |
| `lay-bgcolor` | LAY-11 |
| `fmt-svg` | FMT-01 |
| `fmt-model` | FMT-02 |
| `fmt-deterministic` | FMT-03 |
| `fmt-escape` | FMT-04 |
| `fmt-model-source` | FMT-05 |
| `fmt-invalid` | FMT-06 |
| `fmt-text` | FMT-07 |
| `fmt-color` | FMT-08 |
| `fmt-external-edit` | FMT-09 |
| `fmt-outline` | FMT-10 |
| `exp-png` | EXP-01 |
| `exp-plain-svg` | EXP-02 |
| `exp-pdf` | EXP-03 |
| `exp-autosave` | EXP-04 |
| `imp-structorizer` | EXP-05 |
| `code-dsl` | CODE-01 |
| `code-gen` | CODE-02 |
| `code-parse` | CODE-03 |
| `code-anim` | CODE-04 |
| `rep-issue` | REP-01 |
| `rep-prompt` | REP-02 |
| `nfr-integrity` | NFR-01 |
| `nfr-compat` | NFR-02 |
| `nfr-perf` | NFR-03 |
| `nfr-i18n` | NFR-04 |
| `nfr-a11y` | NFR-05 |
| `nfr-test` | NFR-06 |
