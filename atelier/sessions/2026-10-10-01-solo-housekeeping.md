---
title: "2026-10-10 inbox 정리, 접기와 강조 영역, Obsidian 스파이크"
tags:
  - ariadne-nsd
  - plan
  - session
date: 2026-10-10
---

# 2026-10-10 inbox 정리, 접기와 강조 영역, Obsidian 스파이크

메인테이너가 잠깐 들러 "내 결정 없이 진행할 수 있는 것들을 진행해주세요"라고 맡기며 시작한 세션입니다. 앞부분은 Claude가 혼자 일하며 결정할 것을 **제안**으로만 남겼습니다. 메인테이너가 돌아온 뒤로는 제안을 하나씩 결정하고, inbox를 모두 비우고, 접기·강조 영역을 다듬고, Obsidian 스파이크를 했습니다.

## 흐름 한눈에

1. **혼자 일한 부분:** 요청과 질문 처리, 결정할 것은 제안 5개로 정리 → [[#한 일]], [[#제안 (결정을 기다림)]]
2. **결정:** 제안 1~5, Drive 확장자, `.obsidian/`, README, 남은 inbox 항목 → [[#결정한 것 (세션 후반, 메인테이너가 돌아와서)]]
3. **접기와 강조 영역:** Claude가 둘을 "영역" 하나로 합쳤다가, 메인테이너의 지적으로 별도 요구사항으로 나눔. 이름은 접기의 일로 정리. 강조 모양은 시안을 그려 비교한 뒤 C(굵은 테두리). 접힘 상태는 파일 밖, 이름은 모델에
4. **스파이크:** Obsidian에서 `.ns.svg`만 편집기로 열기 → 됨 → [[#스파이크: Obsidian에서 `.ns.svg`만 편집기로 열기]]
5. **일하는 방식:** 호칭 "메인테이너", 마무리는 "마무리"나 작별 인사 때, 커밋은 수시로·push는 마무리 때, 시안·스파이크는 Claude가 먼저 제안

## 한 일

| inbox 항목 | 한 일 |
| --- | --- |
| 1-1 색인을 `docs/README.md`로 | `docs/00-index/00-index.md` → `docs/README.md`. 위키링크는 `[[docs/README\|문서 색인]]`처럼 경로로 바꿈 (README가 여러 개라서). CLAUDE.md 규칙 갱신 |
| 1-2 1레벨 제목은 남기기 | CLAUDE.md "세션 시작 시 할 일" 3번에 규칙 추가. 구조 추천은 [[#제안 1. inbox 구조 (1-2)]] |
| 1-3 inbox를 `plan/`으로 | `inbox.md` → `plan/inbox.md`. CLAUDE.md, [[status]], [[debt]], `plan/README.md` 갱신 |
| 1-6 테스트를 먼저 설계 | [[status]]의 단계 계획에 반영 |
| 4-1 편집 후 노트 갱신 | 요구사항 [[01-requirements#^obs-refresh]] (#P0) 추가 |
| 4-2 drawio-obsidian 참고 보충 | [[01-requirements#참고 자료]] 설명 보충 |
| 3-4 다른 도구로 고친 그림 알림 | 요구사항 [[01-requirements#^fmt-external-edit]] 추가. 우선순위 #P1은 Claude가 임시로 정함 |
| 질문: Drive 확장자 | [[drive-app-basics#확장자와 미리보기 (`.ns` vs `.ns.svg`)]]. 답: 대체로 사라짐 → `.ns.svg` 권장 |
| 질문: 요구사항 커밋 누락 | 아래 [[#발견한 위험]] 참고. 커밋은 됐었고, 작업 사본에서 줄이 사라져 있었음. 되살림 |
| 질문: 내용 변경 없는 modified | `.gitattributes`로 줄 끝을 LF로 고정. [[git-line-endings]] |
| 질문: 시퀀스 다이어그램, client secret | [[drive-app-basics#흐름: Drive에서 열고 저장하기]], [[drive-app-basics#client secret이란]] |
| 질문: 스파이크란 | [[spike-prototype-mvp]] |
| 요청: 마무리 때 commit/push | CLAUDE.md "세션 끝날 때 할 일" 8번에 추가 |

## 제안 (결정을 기다림)

### 제안 1. inbox 구조 (1-2)

1레벨 제목을 **"이 글이 결국 어디로 가는가"** 기준으로 고정하면, 적을 때 고민이 적고 Claude도 옮길 곳을 바로 압니다.

```markdown
# 일하는 방식        ← CLAUDE.md, plan/ 로 감 (폴더, 규칙, 세션 운영)
# 배포 대상          ← 요구사항 2장
# 기능              ← 요구사항 3장
# 나의 결정          ← ADR, 요구사항에 반영. Claude가 물은 것에 대한 답도 여기
# 질문              ← tech-notes/ 로 감
```

- 지금의 "질문 및 요청"에서 **요청은 "일하는 방식"으로**, 질문만 남깁니다.
- 항목을 `1.` `2.` 번호 목록 대신 **`## 짧은 제목`** 으로 적기를 권합니다. 지금은 항목을 지우면 번호가 바뀌어서, 지난 세션에 "3-1 Scratch"라고 부른 것이 다음에는 다른 번호가 될 수 있습니다. 제목이면 `[[inbox#Scratch 이벤트]]`처럼 링크도 걸 수 있습니다.

### 제안 2. 요구사항 리뷰용 MVP의 시점과 범위 (1-4)

목적이 "요구사항 리뷰"라면, 이건 [[spike-prototype-mvp|프로토타입]]에 가깝습니다. 그래서 **버릴 코드**로 만들기를 제안합니다. 그래야 "테스트를 먼저 설계한다"(1-6)는 본 개발 원칙과 부딪히지 않습니다.

- **시점:** inbox에 남은 기능 후보(Scratch 이벤트, 강조, 접기)가 요구사항에 들어간 **직후, 아키텍처 설계 전.** 만져 보고 나온 요구사항을 아키텍처에 반영할 수 있습니다.
- **범위 (넣음):** 웹 페이지 하나. 블록 4종(처리, If, While, Do-While), 선택·감싸기·풀기·Undo, 자동 레이아웃, 기본 스타일(시안 C). 저장은 `.ns.svg` 다운로드만.
- **범위 (뺌):** Obsidian, 데스크톱, Drive, 테마, 내보내기, 정확한 텍스트 폭.
- **방법:** Claude가 Artifact(웹 페이지 하나)로 만들면 며칠 걸리지 않습니다. 메인테이너는 링크로 열어 써 보고, 느낀 점을 inbox에 적습니다.
- **기한을 정해 둡니다:** 예: 만들기 1세션 + 써 보기 1주.

### 제안 3. 아키텍처 설계를 시작할 시점 (1-5)

다음 세 가지가 모두 맞으면 시작하기를 제안합니다.

1. inbox의 기능 후보가 모두 요구사항에 들어가고 우선순위가 붙었다.
2. 아키텍처를 가르는 열린 질문에 답이 났다: 블록 글자는 코드인가 문장인가, 저장 SVG의 색, 주 사용자, 확장자(스파이크 결과 포함).
3. 프로토타입을 써 본 뒤 나온 새 요구사항이 **모델(블록 종류, 트리 구조)과 파일 형식을 바꾸지 않는다.** 새 요구사항이 "블록을 하나 더", "메뉴를 하나 더" 수준이면 아키텍처는 흔들리지 않습니다.

3번이 핵심입니다. 요구사항을 끝까지 다 모으는 것은 불가능하니, "새 요구사항이 와도 뼈대가 안 바뀐다"는 신호가 보일 때를 기준으로 삼습니다.

### 제안 4. 접기/펼치기 (3-5)

| 대상 | 접은 모양 | 우선순위(안) |
| --- | --- | --- |
| 제어 블록 하나 | 머리(조건)만 남기고, 본문 자리에 "⋯ 블록 n개" 한 줄 | #P1 |
| 선택 범위 (연속 블록) | 한 칸으로 줄이고 요약 글을 표시. 요약 글은 사용자가 적고, 없으면 "첫 블록 글자 외 n개" | #P1 |
| 모두 접기 / 모두 펼치기 / 깊이 n까지 펼치기 | — | #P2 |

- 접힌 블록은 통째로 옮기기·지우기·복사할 수 있습니다. 안쪽을 고치려면 펼칩니다.
- **선택 범위 접기는 강조(3-3)와 묶을 수 있습니다.** EasyCODE의 `#ifdef` 영역처럼, 선택 범위에 "영역"을 만들고 그 영역에 이름·강조 색·접힘 상태를 두는 방식입니다. 그러면 기능 셋(이름 붙이기, 강조, 접기)이 개념 하나로 정리됩니다.
- **정할 것:** 접힘 상태를 파일에 저장할지, 저장한다면 SVG 그림도 접힌 모양으로 그릴지. (문서에 넣을 그림을 일부러 접어서 보여 주고 싶을 수도 있고, 늘 다 보이길 바랄 수도 있습니다.)

### 제안 5. "사용자"라는 호칭

맞습니다. 헷갈립니다. 게다가 요구사항 문서에서 "사용자"는 **NSDrawing을 쓰는 사람**을 뜻합니다. 같은 낱말이 두 사람을 가리키고 있습니다.

| 안 | 예 | 장점 | 단점 |
| --- | --- | --- | --- |
| **A. 이름 (Dionysus)** | "Dionysus가 시안 C를 골랐다" | 이야기(journal)에 가장 자연스러움. git 커밋에 이미 공개된 이름 | 이름을 문서에 남기는 것이 괜찮은지 |
| B. 역할 (오너) | "오너가 시안 C를 골랐다" | 누가 봐도 프로젝트 주인 | 딱딱함 |
| C. 1인칭 (나) | "내가 시안 C를 골랐다" | 사용자 시점의 이야기 | Claude가 쓴 글인데 "나"가 사용자라 어색함 |

추천은 **A**. `docs/`의 "사용자"(NSDrawing 사용자)는 그대로 두고, `plan/` · `journal/` · `tech-notes/` · CLAUDE.md의 "사용자"만 바꿉니다.

## 결정한 것 (세션 후반, 메인테이너가 돌아와서)

메인테이너 답: "1: 제안 수용 / 2: 제안 수용 / 3: 제안 수용 / 4: 제안 수용 / 5: 내 이름이나 별명말고 무언가 공식적인 용어를 쓰고 싶어요"

| 결정 | 기록 |
| --- | --- |
| 제안 1 inbox 구조 수용. inbox를 새 구조로 옮김(항목 글은 그대로) | CLAUDE.md "세션 시작 시 할 일" 3번, [[inbox]] |
| 제안 2 요구사항 리뷰용 MVP는 버릴 프로토타입 | [[status]] |
| 제안 3 아키텍처 설계 시작 조건 세 가지 | [[status]] |
| 제안 4 접기/펼치기, 선택 범위는 "영역"으로 묶음 | [[01-requirements#^edit-fold]], [[01-requirements#영역]], 용어집 |
| Drive에서 만드는 파일은 `.ns.svg` | [[0014-drive-file-extension\|ADR-0014]] |
| `.obsidian/`은 git에서 제외 | `.gitignore` |
| 문서 링크는 위키링크 그대로 둠. 대신 `docs/README.md` 맨 위에 "Obsidian으로 보라"는 안내를 넣음 (GitHub에서도 보이는 `> [!NOTE]` 형식) | [[docs/README\|문서 색인]] |
| 저장소 맨 위 `README.md`를 만듦: 소개, 설계 단계 안내, Obsidian으로 보는 법, 폴더 안내. 중복이라 `docs/README.md`의 안내는 뺌 | `README.md`, CLAUDE.md "저장소 구성" |
| 처리를 마친 inbox 항목 삭제. 남은 항목: 수익 창출 버전, 웹 버전 참고 모델, Scratch의 장점 도입, 강조하기 | [[#inbox 원문 (지운 항목)]] |
| 유료 버전: Confluence(Forge)를 요구사항 #P2로. 다른 후보는 나중에 검토 | [[01-requirements#2.5 Confluence (유료, 나중에)]], [[status]] |
| 웹 참고 모델: 공유 URL, 보기 모드, 도움말 #P1 | [[01-requirements#^web-share-url]], [[01-requirements#^web-view-mode]], [[01-requirements#^help]] |
| Scratch: 이벤트 머리 #P1, 여러 처리기·블록 묶음 #P2. 지난 세션 제안의 세부가 기록되지 않아 새로 제안함 | [[01-requirements#^blk-event]], [[01-requirements#^edit-snippets]] |
| 강조하기: 영역 강조 모양 A(EasyCODE식)/B(배경)/C(테두리)를 그려 비교하기로 함 | [[inbox]], [비교 시안](https://claude.ai/artifact/MGnGUbUZ2gRbfGLmfqvTy7) |
| **바로잡음:** 강조 영역과 접기/펼치기는 별도 요구사항이다. 제안 4에서 Claude가 둘을 "영역" 하나로 합쳤던 것을 나눔. "강조 영역은 접고 펼 수 있다"는 강조 영역 요구사항에 넣음 | [[01-requirements#접기 · 펼치기]], [[01-requirements#강조 영역]] |
| **바로잡음:** 이름은 접기 쪽 요구사항이다(접었을 때 무엇이 접혔는지 알리려고 필요). 강조 영역에서 뺌. 그 결과 시안 A의 장점(펼쳐도 이름이 보임)은 근거를 잃음. Claude가 A를 추천하며 든 "접기 전후 일관성"과 "EasyCODE의 방식"도 근거가 아니었음 | [[01-requirements#접기 · 펼치기]] |
| 접는 범위의 이름은 처음 접을 때 묻는다(메인테이너 제안). 접힌 칸 안에서 기본값이 선택된 채로 묻고, 두 번째부터는 묻지 않음. 모두 접기 때는 묻지 않음. 선택 범위 접기 전체에 적용 | [[01-requirements#접기 · 펼치기]] |
| 강조 영역은 굵은 테두리(시안 C). Claude는 처음에 A를 추천했으나, 이름이 접기의 일로 정리되면서 C로 추천을 바꿈 | [[0015-highlight-region-border\|ADR-0015]] |
| 강조 영역은 중첩하지 않음 ("강조 영역을 중첩할 계획은 없습니다.") | [[01-requirements#강조 영역]] |
| 강조 영역은 일부만 겹칠 수 없고, 맞붙는 것은 허용(구분되어 보여야 함). 겹치는 범위를 강조하면 기존 영역을 넓힘(Claude 추천 수용). 여러 영역에 걸치면 합치고 맨 앞 영역의 이름을 씀(Claude가 정한 세부). 맞닿기만 하면 합치지 않고 각각 유지(메인테이너 제안) | [[01-requirements#강조 영역]] |
| 접힘 상태는 파일 밖(편집기)에 기억, 저장 그림은 펼친 모양(D). Claude가 함께 제안한 "그림에도 접어 두기"는 채택하지 않고, 대신 메인테이너가 "지금 화면의 접힘 그대로 PNG 내보내기"를 제안: "프리젠테이션 용도나 문서 삽입 용도로 사용할 때 요긴할 것 같습니다. 설명하는 부분을 집중할 수 있을테니까요." | [[0016-fold-state-outside-file\|ADR-0016]], [[01-requirements#^exp-png-folded]] |
| 접는 범위의 이름은 모델에 저장 ("모델에 저장합시다"). 강조하지 않은 범위에는 "이름 붙은 범위"가 모델에 생김 | [[0017-fold-name-in-model\|ADR-0017]] |
| 용어 정리: 요구사항 리뷰용은 "프로토타입", MVP는 개발을 거친 첫 출시만 뜻함. MVP를 낼 배포 대상은 ADR-0011에 달림 | [[status]] |
| 제안 5 호칭은 공식 용어 **메인테이너**. 후보(메인테이너, 프로덕트 오너, 프로젝트 오너) 중 선택. `plan/` · `journal/` · `tech-notes/` · CLAUDE.md의 "사용자"를 바꿈. 일반 사용자를 뜻하는 곳과 이 논의 본문은 그대로 둠 | CLAUDE.md "문서 작성 규칙" |

## 스파이크: Obsidian에서 `.ns.svg`만 편집기로 열기

메인테이너가 "스파이크부터 이번 세션에 합시다"라고 해서 진행했습니다. 실험 플러그인 `ns-spike`를 vault의 `.obsidian/plugins/`에 만들고, 메인테이너가 Obsidian에서 다섯 가지를 확인했습니다.

- **헷갈림:** Claude가 "파일 탐색기"라고만 써서, 메인테이너가 Windows 탐색기에서 파일을 열었습니다. Windows가 프로그램을 물었고, Claude는 처음에 이를 실패로 잘못 해석했습니다. Obsidian 왼쪽의 파일 목록이라고 다시 설명했습니다.
- **결과:** 다섯 가지 모두 됨. 노트 그림 갱신(4번)은 처음엔 drawio-obsidian처럼 안 됐고, 파일 변경 이벤트에서 `<img>` 주소를 바꾸도록 고쳐 읽기·편집 모드 모두 됐습니다.
- **알게 된 것:** 확장자 `ns.svg` 등록만으로는 효과가 없고, 파일을 여는 순간 이미지 보기를 가로채야 합니다. 모두 Obsidian 내부 동작에 기대므로 업데이트 때 깨질 위험이 있습니다.
- **우클릭 메뉴 다듬기:** 처음엔 기존 메뉴가 사라지고 우리 항목만 나왔습니다. 메인테이너: "기존 메뉴를 남기는 것은 어떨까요? drawio-obsidian도 그렇게 합니다." 공개 API(`file-menu`)로 바꾸니 두 메뉴 모두 동작했고, 내부 동작에 기대는 부분이 하나 줄었습니다. 자리는 메인테이너가 정했습니다: "이미지 삭제"·"삭제" 바로 위 구역의 맨 아래.
- **기록하는 법:** 알림 글자를 메인테이너가 옮겨 적는 대신, 플러그인이 `ns-spike/spike-log.txt`에 기록을 남기게 해서 Claude가 직접 읽었습니다.

→ [[04-obsidian-plugin#1. `.ns.svg` 파일 열기]], [[02-architecture#7. 위험과 검증이 필요한 사항]]

## inbox 원문 (지운 항목)

메인테이너가 "처리를 마친 inbox 항목을 지우세요"라고 해서 지운 항목입니다. 글은 inbox에 적힌 그대로입니다.

## 일하는 방식

### 색인을 docs/README.md로
`docs/00-index/00-index.md`를 `docs/README.md`로 mv해주세요. github 방문자에게 이게 더 편할 것 같아요.

### inbox 1레벨 제목 유지와 구조
`inbox`의 처리된 항목을 지우더라도 1레벨 제목은 남겨두세요. 다음 번 무언가 추가할 때 편할 것 같아요. 참, 1레벨 제목들과 inbox 페이지 구조를 추천해주세요.

### inbox를 plan/으로
이 파일을 `plan/` 하위로 옮겨주세요.

### 요구사항 리뷰용 MVP
내 요구사항이 점점 더 늘어나고 있지요. MVP(Minimum Viable Product)를 만들어서 요구사항을 리뷰하는게 좋을 것 같은데 시점과 범위를 어떻게 정해야할지 모르겠어요. 일단 이번 MVP에서는 요구사항 리뷰까지로 합니다. 

### 아키텍처 설계 시작 시점
요구사항을 아키텍처 디자인 이전에 최대한 더 도출하려는 이유는 나중에 구현할지라도 아키텍처가 크게 변경될 것을 미연해 방지하기 위함입니다. 확장을 고려한 아키텍처를 구현하더라도 예상되는 요구사항들이 있으면 아키텍처를 디자인하는데 도움이 많이 되겠지요. 아키텍처 디자인을 시작할 시점도 제언해주세요.

### 테스트를 먼저 설계
아키텍처 디자인이 완성되어 가면, 실제 개발을 하기 전에 테스트를 설계하고 테스크코드를 작성할 것입니다. 참고하세요.

### 마무리 때 commit/push
`docs/01-requirements/01-requirements`에 변경하신 내용이 commit 되어있지 않았습니다. 다음에는 마무리 정리할 때 commit/push를 부탁드립니다.

### 호칭
나를 `사용자`라고 부르시던데 이 github repo는 public이어서 다른 사람도 봅니다. 그들이 혼란스러워하지 않을까요? 다른 호칭을 제안해주세요.

## 배포 대상

### Obsidian: 편집 후 노트 갱신
drawio-obsidian을 기존 diagram을 편집완료 해도 삽입되었던 페이지를 다시 열지 않으면 변경된 것이 보이지 않았습니다. 내 경우 [mnaoumov/obsidian-refresh-any-view: Obsidian Plugin that allows to refresh any view without reopening it.](https://github.com/mnaoumov/obsidian-refresh-any-view) 을 설치해서 사용하고 있습니다. NSDrawing plugin에 수정 편집을 완료하면 페이지를 갱신하는 기능을 추가해주세요.

### Obsidian: drawio-obsidian 참고 보충
[[01-requirements]]에 내용 보충
- [drawio-obsidian](https://github.com/zapthedingbat/drawio-obsidian) — 모델 내장 SVG 저장 방식 참고. Obsidian 페이지에 삽입하고 편집하는 방식 참고.

## 기능

### 다른 도구로 고친 그림 알림
.ns.svg를 다른 도구로 그림만 고치면 다음 번 열었을 때 변경이 발생했음을 알려줌.

### 접기/펼치기
접기/펼치기 기능: 요구사항 구체화해서 제안해주세요.
1. control block
2. selection range

## 질문

### Drive 확장자와 미리보기
구글 Drive에 저장할 확장자를 `.ns` 로 하면 Drive가 썸네일과 미리보기를 별도 작업 없이 보여준다는 장점이 사라지나요? 그렇다면 `.ns.svg`로 해야겠네요.

### 변경 없는 파일이 modified로 보임
내용 변경이 없는 파일들이 git status 에는 modified로 나옵니다. 왜죠? 안 그러면 좋겠는데...
```
PS C:\myProject\NSDrawing> git status
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   CLAUDE.md
        modified:   docs/00-index/00-index.md
        modified:   docs/01-requirements/01-requirements.md
        modified:   inbox.md
        modified:   journal/README.md
        modified:   journal/learning-claude-code.md
        modified:   journal/timeline.md
        modified:   plan/debt.md
        modified:   plan/sessions/2026-10-09-inbox-and-folders.md
        modified:   plan/status.md
        modified:   tech-notes/README.md

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        .obsidian/

no changes added to commit (use "git add" and/or "git commit -a")
PS C:\myProject\NSDrawing> git diff .\CLAUDE.md
warning: in the working copy of 'CLAUDE.md', LF will be replaced by CRLF the next time Git touches it  
```

### drive-app-basics 보충
[[drive-app-basics]] 
- 시퀀스다이어그램을 그려주면 이해하기 좋겠어요. participant에 웹브라우저를 포함해주세요.
- `client secret`이 뭐지요?

### 스파이크란
`스파이크`란 무엇? 시제품이나 MVP(Minimum Viable Product)를 말하나요?

### 두 번째로 지운 항목

메인테이너가 제안을 수용해서 지운 항목입니다. 글은 inbox에 적힌 그대로입니다.

### 배포 대상

#### 수익 창출 버전
수익 창출 버전: 다른 배포 버전들은 모두 무료로 배포하고, 이 버전들은 유상으로 수익을 창출하고 싶습니다.
1. Confluence 플러그인 버전도 만들고 싶습니다. [Explore apps for Confluence | Atlassian Marketplace](https://marketplace.atlassian.com/product/confluence) 
2. 수익을 창출할 다른 버전을 제안해주세요.

#### 웹 버전 참고 모델
웹버전:
1. [SequenceDiagram.org - UML Sequence Diagram Online Tool](https://sequencediagram.org/) — 참고 모델
	1. URL to Share / 저장 장소 / View 모드 / Help - Instructions 등

### 기능

#### Scratch의 장점 도입
[Scratch - Imagine, Program, Share](https://scratch.mit.edu/)의 장점 도입
1. Scratch가 NS Diagram과 유사해보이는데, Event를 표현할 수 있다는 점이 마음에 듭니다. NS Diagram에는 없는 표기법이지만 Scratch 처럼 이벤트를 표현할 수 있으면 좋겠어요.
2. Embeded 시스템 개발자들이 Scratch를 많이 쓴다고 들었어요. Scratch의 어떤 장점 때문인지 분석해주세요. NSDrawing도 그러면 좋겠어요. 

### 세 번째로 지운 항목

강조 모양을 C(굵은 테두리)로 정해서 지운 항목입니다. 글은 inbox에 적힌 그대로입니다.

#### 기능

##### 강조하기
강조하기
1. 특정 Block 또는 연속된 여러 Block을 선택해서 강조하는 방식을 제안해주세요. 테두리 선을 굻게 한다든지 또는 색상을 변경한다든지 다양한 방법이 있겠네요.

## 발견한 위험

- **Obsidian 내부 동작에 기댐:** 파일 열기 가로채기와 노트 그림 갱신은 공개되지 않은 동작입니다. Obsidian 업데이트 때 깨질 수 있습니다. → [[04-obsidian-plugin#1. `.ns.svg` 파일 열기]]
- **Claude의 추천 근거 부풀림:** 시안 A를 추천하며 "접기 전후 일관성"(사실이 아님)과 "EasyCODE의 방식"(근거가 아님)을 이유로 들었습니다. 메인테이너가 따져 물어 바로잡았습니다.
- **제안의 세부를 기록하지 않으면 잃는다:** 2026-10-09에 드린 Scratch 제안(A·B·C)의 세부가 세션 기록에 없어서, 이번에 새로 제안했습니다. 제안은 결정을 기다리는 동안에도 세션 기록에 적어 둡니다.
- **이름 붙은 범위:** 접기 이름을 모델에 두기로 하면서 모델이 블록 트리 외에 "범위"를 다루게 됐습니다. 블록을 지우거나 옮길 때의 규칙을 모델 설계에서 정해야 합니다. → [[0017-fold-name-in-model|ADR-0017]]
- **커밋된 요구사항이 작업 사본에서 사라져 있었습니다.** 지난 세션 커밋(`0a8d9d1`)에는 `^lay-default-style`, `^lay-syntax`, 미결정 사항 두 줄이 들어 있었는데, 작업 사본에는 그 이전 내용이 있었습니다. 원인은 확실하지 않습니다. Obsidian이 파일을 열어 둔 채 예전 내용을 다시 저장했을 가능성이 있습니다. 그래서 "커밋이 안 됐다"고 보였던 것입니다. 이번에 되살렸습니다.
- **`README.md` 위키링크는 GitHub에서 링크로 보이지 않습니다.** → 해결: 링크는 그대로 두고, 저장소 맨 위 `README.md`에 "Obsidian으로 보라"는 안내를 둠
- `.obsidian/` 폴더가 git에 올라가지 않은 채 남아 있었습니다. → 해결: `.gitignore`로 제외
- 승인된 [[0001-record-architecture-decisions|ADR-0001]]의 색인 링크 한 곳을 고쳤습니다. 결정 내용이 아니라 파일 이동에 따른 링크 수정이라 고쳤습니다 (Obsidian에서 이름을 바꿨어도 자동으로 고쳐졌을 부분).

## 다음 할 일

- **다음 세션:** 요구사항 리뷰용 프로토타입 만들기. 범위는 [[status]]의 "넣음"·"더 넣음"
- 그 밖의 할 일과 열린 질문 → [[status]], [[debt]]
