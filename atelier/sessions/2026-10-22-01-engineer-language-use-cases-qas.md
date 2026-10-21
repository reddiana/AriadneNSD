---
title: "2026-10-22 이름 바꾸기 · SW 엔지니어의 말과 UML · 유즈케이스 · QAS"
tags:
  - ariadne-nsd
  - plan
  - session
date: 2026-10-22
---

# 2026-10-22 이름 바꾸기 · SW 엔지니어의 말과 UML · 유즈케이스 · QAS

2026-10-22의 첫 세션이다 (← [[2026-10-18-02-pages-visual-design]]). 메인테이너의 첫 말은 "안녕하세요"였고, inbox에 열한 항목이 있었다.

## inbox 원문

메인테이너가 2026-10-19~21에 inbox에 적은 항목 가운데 처리한 열 항목이다. 마무리 때 "처리한 것만 옮기고 지움"을 받아 지웠다. "MVP를 하기 전에 뭐가 결정되어야 하나요?"는 inbox에 남겼다.

> [!quote] 1. 일하는 방식
> - `backlog` / `debt` 구분 기준은 무엇인가? 둘 다 필요할까요?
> - `study-pages` 페이지 명을 바꾸고 싶어요. 내용에 어울리지 않습니다. 재검토해주세요.
> - 대화나 이 문서에서 편하게 부를 당신의 이름을 지어주세요.
> - `requirements-review` 어느샌가 생겼는데, 이 문서(`inbox`)가 내가 당신에게 보내는 메시지라면 `requirements-review`는 당신이 내게 보내는 메세지인가요? 역시 문서 제목을 재검토해야겠습니다.
> - 유즈케이스나 사용자스토리를 도입하는 것을 검토하고 의견 주세요.
> - 비기능요건에 대한 품질속성시나리오(QAS)들을 도출해주세요. 아키텍처는 QAS를 만족하도록 구성되어야하고, QAS를 확인할 테스트도 작성해야합니다.

> [!quote] 5. 질문/요청
> - [[0031-shell-interfaces]]과 [[0033-command-list-for-shells]]은 같은 내용 아닌가요?

> [!quote] 6. 기타
> - [[0033-command-list-for-shells]] "명령의 목록을 내놓는다"는 표현은 `interface`를 말하는 것 같습니다. ADR은 아키텍처 문서이니만큼 독자인 SW엔지니어의 언어를 쓰면 좋겠습니다. 이처럼 SW엔지니어의 용어와 표현을 쓰는 것이 좋을 부분을 찾아서 고쳐주세요. 이미 승인된 결정이라도 의미가 바뀌지 않는 범위 내에서 SW엔지니어의 언어로 고쳐주세요.
> - 03-architecture와  04-design, 05-spec 문서의 독자는 SW엔지니어입니다. UML을 적극 활용해주세요. UML이 아닌 다이어그램에서 화살표의 의미, 실선/점선의 의미가 애매합니다. UML처럼 알려진 노테이션이 아니라면 의미를 분명하게 설명해야합니다.
> - 변경된 내용이 없는 문서가 git status에 modified라고 나옵니다. 왜죠?
> ```
> C:\myProject\AriadneNSD>git status
> On branch main
> Your branch is up to date with 'origin/main'.
>
> Changes not staged for commit:
>   (use "git add <file>..." to update what will be committed)
>   (use "git restore <file>..." to discard changes in working directory)
>         modified:   atelier/inbox.md
>         modified:   docs/03-architecture/03-architecture.md
>         modified:   docs/04-design/02-layout.md
>
> no changes added to commit (use "git add" and/or "git commit -a")
>
> C:\myProject\AriadneNSD>git diff docs/04-design/02-layout.md
>
> C:\myProject\AriadneNSD>
> ```

처리 방향: Claude가 항목마다 제안과 추천 순서(이름 셋 → ADR 질문과 SW 엔지니어의 말 · UML → QAS · 유즈케이스 · MVP 전)를 냈고, 메인테이너가 "그대로 진행해주세요."

## 논의 흐름

### 1. git의 "modified" (세션을 열며)

`02-layout.md`는 내용(해시)이 HEAD와 같았다. 색인에 적힌 크기가 예전에 CRLF로 꺼냈을 때의 크기(3,224)였고, Obsidian이 LF로 다시 저장해 3,168이 되어(줄 56개) `status`만 바뀜으로 보았다. `git add`로 색인을 새로 적어 풀었다. `03-architecture.md`는 진짜 변경(Obsidian의 표 칸 맞춤)이라 다음 커밋에 넣었다 → [[git-line-endings#내용은 같은데 modified로 나올 때 (2026-10-22)]]

### 2. 이름 셋

고르는 창으로 물음.

- `debt` → **`outbox`**(추천). inbox(메인테이너 → Claude)의 짝(Claude → 메인테이너). backlog는 우리가 할 일, outbox는 메인테이너의 답을 기다리는 것이라 둘 다 둔다
- `study-pages` → **`sketchbook`**(추천). 화실(atelier)의 스케치북
- Claude의 이름: 다이달로스(Daedalus)를 냈으나 메인테이너가 "빠르게 부를 수 있는 짧은 이름", "영어 이름에는 애칭이 있던데"를 물었다. 신화 속 인물이라 굳어진 애칭은 없어 Dal · Dedy · Dae를 냈고, 메인테이너: "달님 또는 달씨라고 부르겠습니다 달님". → CLAUDE.md "함께 일하는 방식"
- `requirements-review`는 Claude가 묻는 것(Q18 · Q22 · Q23)도 있지만 대부분 요구사항을 다시 짤 때의 작업 목록이라 **`requirements-rework`**로(Claude가 정함). 물음은 outbox가 가리킨다

세 파일을 `git mv`하고 위키링크를 모두 고쳤다(세션 기록의 링크 포함, 글자로 적힌 옛 이름은 그때의 기록이라 둠).

### 3. ADR-0031과 0033

같은 경계의 반대 방향이다. 0031은 `editor`가 요구하고 셸이 구현하는 **필요 인터페이스**, 0033은 `editor`가 구현하고 셸이 쓰는 **제공 인터페이스**. 글이 "구현한다"와 "내놓는다"로 달라 같은 것처럼 읽혔다. 따로 두고, 말을 고쳐 차이가 제목에서 보이게 했다.

### 4. SW 엔지니어의 말과 UML

- Claude가 [[03-architecture]]를 견본으로 고쳤다: 용어(명령 레지스트리, 필요 · 제공 인터페이스, 씬 빌드, 서브셋 글꼴, 토크나이저, 뷰 상태, 불변식, 구조적 공유, 히트 테스트 …), UML 패키지 · 컴포넌트(인터페이스 넷) · 클래스 다이어그램, 컨텍스트 그림의 범례. 절 번호가 바뀌어(3.1 → 3.4, 3.2 → 3.5) 링크를 고쳤다
- 메인테이너가 Obsidian에서 보고 "봤어요. 이대로 전체에 적용해 주세요."
- 나눠 맡긴 에이전트 넷이 ADR 0001~0010 · 0012~0033, 04-design 셋 · 셋 + 05-spec을 동시에 고쳤다. Claude가 모아 링크(새로 깨진 것 0), 그림 14개(모두 그려짐), 옛 용어가 남은 제목 셋([[01-model]])을 확인하고, 0031 · 0033의 "방향" 문장을 다시 썼다
- 확인을 하나씩 받음(메인테이너: "선택하는 인터페이스로 하나씩 물어봐주세요."):
	- 인터페이스 이름 넷(`DocumentStore`, `SettingsStore`, `CommandRegistry`, `SettingsSchema`): 이대로
	- ADR-0031의 결정문에 넣은 "포트와 어댑터(헥사고날) 패턴": **결정문에서 빼기**. 제목의 "(포트)", "어댑터로"도 뺌. 패턴 이름은 아키텍처 3.2에만
	- ADR-0008의 풀이(같은 줄에 있는 가장 가까운 조상끼리, LCA): 맞다, 둔다
	- 가칭 함수 이름(`layout()` · `buildScene()` · `toSvg()` 등): 처음 물음이 어려워 "무슨 말인지 잘 모르겠어요". 쉽게 다시 물어 **가칭으로 둔다**(코드를 짤 때 정함)

### 5. 유즈케이스 → [[dr-0014-light-use-cases|DR-0014]]

- Claude의 의견: 유즈케이스 추천, 사용자 스토리는 혼자 하는 지금 얻을 것이 적다. 초안 목록 열 개
- 메인테이너: "자세한 유스케이스는 어떤 모습인가요? 비교해주세요." → 시안 M26(같은 UC-07을 가벼운 · 자세한(Cockburn) · 사용자 스토리로). 자세한 형식에서 요구사항의 빈 곳 넷이 드러남
- 메인테이너가 1번(가벼운)을 골라 [[02-use-cases]]를 썼는데, 곧 "선택에 "1과 2를 섞기…"가 있었네요? 이걸 선택할걸!!!" → 4번으로 바꿈. UC-02 열기 · UC-06 저장 · UC-07 노트에 넣기를 자세한 형식으로 다시 쓰고, 미결정이 아홉이 됨. DR-0014는 같은 세션에 쓰고 push 전이라 그 자리에서 고쳤다

### 6. 품질 속성 시나리오 → [[03-quality-attribute-scenarios]]

- QA-01~17. SEI의 여섯 부분 + 그것을 만족시키는 아키텍처(구조와 ADR) + 시험 명세. 시험 전략 표(속성 기반, 퍼징, 골든 파일, 시각 회귀, 벤치마크, 크기 예산, 정적 분석, 계약, E2E)
- 아키텍처의 품질 목표에 QA ID를 달고, "변경 용이성"을 6으로 더함
- 메인테이너: "03-quality-scenarios 을 03-quality-attribute-scenarios 로" → 이름을 바꿈

## 결정

- 문서 이름: `outbox`, `sketchbook`, `requirements-rework` (메인테이너가 고름, 셋째는 Claude)
- Claude를 "달"로 부른다 → CLAUDE.md
- 아키텍처 · ADR · 상세 설계 · 파일 형식은 SW 엔지니어의 용어와 UML로. ADR-0000 템플릿의 사용법에도 적음
- 인터페이스 이름 넷, ADR-0031에서 패턴 이름을 뺌, 가칭 이름은 가칭으로
- 유즈케이스를 두고 실패가 비싼 흐름만 자세히 → [[dr-0014-light-use-cases|DR-0014]], [[02-use-cases]]
- 품질 속성 시나리오 → [[03-quality-attribute-scenarios]]

### 확인받은 outbox 항목 (지움)

> - [x] 아키텍처 문서 · ADR · 상세 설계를 SW 엔지니어의 용어와 UML로 고치며 Claude가 정한 것 (2026-10-22, 메인테이너: "이대로 전체에 적용해 주세요"). **2026-10-22에 답을 받음:** 인터페이스 이름 넷은 그대로, ADR-0031의 결정문과 제목에서 패턴 이름(포트 · 어댑터 · 헥사고날)은 뺌(아키텍처 3.2에만), ADR-0008 풀이는 그대로, 가칭 이름은 가칭으로 둠(코드를 짤 때 정함). 제목 셋은 묻지 않음

## 발견한 위험

- **QA-04 왕복은 화면 언어가 같을 때만 성립한다.** 그림에 적는 "참" · "거짓"이 저장할 때의 화면 언어를 따르기 때문. 한국어로 저장한 파일을 영어 화면에서 열고 바로 저장하면 바이트가 달라져 git diff가 생긴다. 시나리오의 환경에 조건으로 두었지만, 팀에서 언어가 섞이면 쓸데없는 diff가 날 수 있다
- 자세한 유즈케이스가 드러낸 빈 곳 가운데 **저장 실패 때 원본이 온전한가**(UC-06 최소 보장, QA-17)는 호스트마다 할 수 있는 것이 달라 아키텍처(`DocumentStore`의 쓰기 계약)에 닿는다
- 에이전트 넷에 나눠 맡긴 고쳐 쓰기는 Claude가 링크 · 그림 · 제목을 기계로 확인했지만, 문장마다 뜻이 그대로인지는 표본으로만 보았다(0008 · 0010 · 0031)

## 다음 할 일

- inbox에 남은 "MVP를 하기 전에 뭐가 결정되어야 하나요?"에 답한다
- 유즈케이스와 QAS의 미결정을 하나씩 정한다 → [[backlog]]
- 2026-10-18 끝에 물은 다음 일(If ↔ Case 시안, 01-model의 미결정, 프로토타입에 2026-10-18 결정 넣기) → [[status]]
