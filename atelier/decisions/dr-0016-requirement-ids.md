---
title: "DR-0016: 요구사항은 모두 R- ID를 받아 표에 두고, ID는 불변이며, 철회한 것은 변경 기록으로 옮긴다"
tags:
  - dr
status: 승인
date: 2026-10-25
supersedes:
superseded-by:
---

# DR-0016: 요구사항은 모두 R- ID를 받아 표에 두고, ID는 불변이며, 철회한 것은 변경 기록으로 옮긴다

## 배경

메인테이너가 inbox에 적었다(2026-10-25):

> 요구사항에 대한 링크를 `^web-file` 처럼 만드니, 정작 [[01-requirements]]에서 찾아보기 힘듭니다. 특히 publish 됐을 때 그렇습니다. ID로 관리하는 것은 어떨까요?

그때까지 요구사항은 체크박스 목록이었고, 항목마다 끝에 블록 ID(`^web-file`)를 달았다. 블록 ID는 Obsidian의 읽기 화면에서도, 펴낸 사이트에서도 **보이지 않는다**. 그래서 링크를 거는 문서에서 본 글자(`^web-file`)를 요구사항 문서에서 찾으면 나오지 않았다. 메인테이너: "독자는 링크를 거는 문서에서 링크의 문자열을 요구사항 문서에서 찾을 것입니다. 요구사항에서 못 찾으니 당혹스러웠어요."

## 결정 기준

- 링크에 보이는 글자가 요구사항 문서에 그대로 보여, 찾으면 찾아진다.
- 링크가 Obsidian과 펴낸 사이트 모두에서 듣는다.
- 우선순위가 한눈에 보인다.
- ID가 바뀌지 않아, 옛 기록의 링크가 끊기지 않는다.

## 검토한 대안

### ID를 줄 앞에 글자로도 적기 (목록 그대로)

- 장점: 링크를 바꾸지 않는다. Obsidian에서도 링크가 그 줄로 간다.
- 단점: 같은 ID를 두 번 적는다. 우선순위를 오른쪽 칸으로 뺄 수 없다.

### 번호 ID의 표, 앵커도 ID (`[[01-requirements#WEB-02]]`)

- 장점: 원본의 링크가 가장 단순하다. 사이트에서는 그 줄로 간다.
- 단점: Obsidian은 표의 한 줄을 가리키지 못한다. 가리킬 곳이 없어 링크가 듣지 않았다(메인테이너가 Obsidian에서 확인). 같은 날 처음에 이렇게 했다가 바꿨다.

### 번호 ID의 표, 링크는 그 표로 가고 글자는 ID (고름)

- 장점: Obsidian에서 링크가 그 표로 가고, 마우스를 올리면 표가 미리 보인다. 사이트에서는 빌드가 그 줄로 돌린다. 링크의 글자가 ID라 찾아진다.
- 단점: 원본의 앵커(`^r-web`)는 ID가 아니다. Obsidian에서는 표 안에서 그 ID를 눈으로 찾는다.

## 결정

메인테이너: "번호ID로 만들고 표로 만들어주세요. 우선순위는 오른쪽 컬럼으로 빼구요." 이어서: "요구사항 ID는 `R-`로 시작해주세요." "요구사항은 모두 ID 채번해주세요." "채번된 요구사항ID는 불변이고 철회된 것은 요구사항 변경 기록으로 별도 문서로 남기고 01-requirements에서는 삭제해주세요." Obsidian에서 링크가 듣게 하는 법과 변경 기록의 자리는 고르는 창에서 골랐다("표를 가리키고 글자는 ID", "atelier/").

- **ID:** `R-`, 영역, 두 자리 번호(`R-WEB-02`). 영역은 [[01-requirements]]의 "읽는 법"에 있다. 번호는 2026-10-25의 문서 순서대로 매겼다(블록은 블록 종류 표와 합치면서 처리 · If · While · Do-While · Case · For · 호출 … 순서로).
- **모두 매긴다:** 그때까지 ID가 없던 요구사항에도 매겼다. 핵심 원칙(`R-CORE`), 배포 대상 표의 줄(`R-TGT`), 블록 종류 표의 줄(블록 요구사항 표와 합쳐 `R-BLK-01~14`), 절 머리글 속의 요구사항 문장(`R-ALL-02` 같은 형식, `R-GD-05`, `R-CF-02`, `R-IDE-07`, `R-EDIT-22` 선택 범위, `R-EDIT-23` 접기 영역의 이름, `R-FMT-11` 접힘을 파일에 저장, `R-REP-03` 자동으로 보내지 않음). 절의 소개, 참고 모델, MVP 범위, 미결정 사항은 요구사항이 아니라 매기지 않았다.
- **표:** 절마다 `| ID | 요구사항 | 우선순위 |`. 핵심 원칙은 `| ID | 원칙 |`, 비기능은 `| ID | 품질 | 요구사항 |`, 배포 대상은 원래 표에 ID 칸을 더했다. 요구사항 아래의 세부 항목은 칸 안에 `<br>`로 이어 적는다. 우선순위 태그(`#P0` …)는 "우선순위" 칸에 단다. 체크박스는 없앴다. 구현의 진행은 개발을 시작할 때 따로 정한다.
- **링크:** 표마다 그 뒤에 블록 ID(`^r-web`, 한 영역에 표가 여럿이면 `^r-obs-2`)를 단다. 다른 문서는 `[[01-requirements#^r-web|R-WEB-02]]`로 가리킨다. 링크에 보이는 글자는 언제나 ID다.
	- Obsidian: 그 표로 간다.
	- 펴낸 사이트: 빌드(`site/prepare-content.mjs`)가 표의 줄마다 ID의 앵커(`#r-web-02`)를 달고, 위 링크를 그 앵커로 돌린다. 그 줄로 간다.
- **불변:** ID는 바꾸지 않는다. 새 요구사항은 그 영역의 다음 번호를 받는다. 번호는 다시 쓰지 않는다.
- **철회:** 철회한 요구사항은 요구사항 문서에서 지우고 [[requirement-changes|요구사항 변경 기록]]에 원문 · 날짜 · 까닭과 함께 옮긴다. 그 ID로 가는 링크는 변경 기록으로 돌린다. ID를 매기기 전에 없앤 두 요구사항(`edit-region`, `exp-png-folded`)도 그 문서에 옮기고, 승인 ADR · DR의 옛 링크를 그리로 돌렸다.
- **옛 링크:** 옛 블록 ID로 건 링크 약 480곳을 모두 바꿨다. 승인된 ADR · DR과 세션 기록도 바꿨다. 링크의 주소만 바뀌는 고침이라 결정의 본문을 고치는 것이 아니다(CLAUDE.md에 이 예외를 적음). 바꾼 스크립트는 `site/tools/req-ids-to-table.py`(표로)와 `site/tools/req-ids-to-r.py`(R- ID와 표 앵커로).

## 결과

- 좋아지는 점: 링크에서 본 ID를 요구사항 문서에서 찾을 수 있다. Obsidian과 사이트 모두에서 링크가 듣는다. 우선순위가 한 줄로 늘어선다. 철회한 요구사항도 그 ID로 찾아진다.
- 감수하는 점: ID만으로는 뜻을 모른다. Obsidian에서는 링크가 그 줄이 아니라 표로 간다. 원본의 링크가 `[[01-requirements#^r-web|R-WEB-02]]`로 길다.
- 후속 작업: 없음.

## 옛 ID → 새 ID

옛 기록(세션 기록의 글, 시안 페이지)에 남은 옛 블록 ID를 읽을 때 쓴다. 같은 날 잠깐 쓴 `R-` 없는 ID(`WEB-02`)는 블록(`BLK`)을 빼고 `R-`만 붙인 것과 같다.

| 옛 블록 ID | 새 ID |
| --- | --- |
| `all-donate` | R-ALL-01 |
| `obs-insert` | R-OBS-01 |
| `obs-edit-embed` | R-OBS-02 |
| `obs-insert-command` | R-OBS-03 |
| `obs-refresh` | R-OBS-04 |
| `obs-open` | R-OBS-05 |
| `obs-plain-svg` | R-OBS-06 |
| `obs-embed` | R-OBS-07 |
| `obs-new` | R-OBS-08 |
| `obs-detect` | R-OBS-09 |
| `obs-theme` | R-OBS-10 |
| `dsk-file` | R-DSK-01 |
| `dsk-open-nssvg` | R-DSK-02 |
| `dsk-assoc` | R-DSK-03 |
| `dsk-multi` | R-DSK-04 |
| `dsk-update` | R-DSK-05 |
| `web-static` | R-WEB-01 |
| `web-file` | R-WEB-02 |
| `web-draft` | R-WEB-03 |
| `web-pwa` | R-WEB-04 |
| `web-share-url` | R-WEB-05 |
| `web-view-mode` | R-WEB-06 |
| `web-ai-chat` | R-WEB-07 |
| `web-ads` | R-WEB-08 |
| `gd-open-with` | R-GD-01 |
| `gd-new` | R-GD-02 |
| `gd-save` | R-GD-03 |
| `gd-preview` | R-GD-04 |
| `cf-app` | R-CF-01 |
| `skill-claude` | R-SKILL-01 |
| `ide-vscode` | R-IDE-01 |
| `ide-intellij` | R-IDE-02 |
| `ide-reverse` | R-IDE-03 |
| `ide-codegen` | R-IDE-04 |
| `ide-fold-region` | R-IDE-05 |
| `ide-live-sync` | R-IDE-06 |
| `blk-event` | R-BLK-10 |
| `blk-case` | R-BLK-05 |
| `blk-method` | R-BLK-11 |
| `blk-call` | R-BLK-07 |
| `blk-call-named` | R-BLK-08 |
| `blk-call-external` | R-BLK-09 |
| `edit-basic` | R-EDIT-01 |
| `edit-undo` | R-EDIT-02 |
| `edit-keyboard` | R-EDIT-03 |
| `edit-key-hint` | R-EDIT-04 |
| `edit-multiselect` | R-EDIT-05 |
| `edit-wrap` | R-EDIT-06 |
| `edit-unwrap` | R-EDIT-07 |
| `edit-call-inline` | R-EDIT-08 |
| `edit-dnd` | R-EDIT-09 |
| `edit-clipboard` | R-EDIT-10 |
| `edit-branch` | R-EDIT-11 |
| `edit-if-label` | R-EDIT-12 |
| `edit-fold` | R-EDIT-13 |
| `edit-fold-range` | R-EDIT-14 |
| `edit-call-open` | R-EDIT-15 |
| `edit-fold-site` | R-EDIT-16 |
| `edit-fold-all` | R-EDIT-17 |
| `edit-multi-diagram` | R-EDIT-18 |
| `edit-extract` | R-EDIT-19 |
| `edit-snippets` | R-EDIT-20 |
| `help` | R-EDIT-21 |
| `lay-autosize` | R-LAY-01 |
| `lay-branch-width` | R-LAY-02 |
| `lay-zoom` | R-LAY-03 |
| `lay-text-measure` | R-LAY-04 |
| `lay-default-style` | R-LAY-05 |
| `lay-text-kind` | R-LAY-06 |
| `lay-syntax` | R-LAY-07 |
| `lay-theme` | R-LAY-08 |
| `lay-empty-branch` | R-LAY-09 |
| `lay-head-style` | R-LAY-10 |
| `lay-bgcolor` | R-LAY-11 |
| `fmt-svg` | R-FMT-01 |
| `fmt-model` | R-FMT-02 |
| `fmt-deterministic` | R-FMT-03 |
| `fmt-escape` | R-FMT-04 |
| `fmt-model-source` | R-FMT-05 |
| `fmt-invalid` | R-FMT-06 |
| `fmt-text` | R-FMT-07 |
| `fmt-color` | R-FMT-08 |
| `fmt-external-edit` | R-FMT-09 |
| `fmt-outline` | R-FMT-10 |
| `exp-png` | R-EXP-01 |
| `exp-plain-svg` | R-EXP-02 |
| `exp-pdf` | R-EXP-03 |
| `exp-autosave` | R-EXP-04 |
| `imp-structorizer` | R-EXP-05 |
| `code-dsl` | R-CODE-01 |
| `code-gen` | R-CODE-02 |
| `code-parse` | R-CODE-03 |
| `code-anim` | R-CODE-04 |
| `rep-issue` | R-REP-01 |
| `rep-prompt` | R-REP-02 |
| `nfr-integrity` | R-NFR-01 |
| `nfr-compat` | R-NFR-02 |
| `nfr-perf` | R-NFR-03 |
| `nfr-i18n` | R-NFR-04 |
| `nfr-a11y` | R-NFR-05 |
| `nfr-test` | R-NFR-06 |
