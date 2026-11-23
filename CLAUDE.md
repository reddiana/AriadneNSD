# AriadneNSD

NS 차트(Nassi-Shneiderman Diagram) 편집기. 옛 이름은 `NSDrawing`(세션 기록 · 타임라인의 `NSDrawing`은 그때의 기록이라 고치지 않음). 제품 이름 `AriadneNSD`, 패키지 · 플러그인 id `ariadne-nsd`(→ [[dr-0005-product-name|DR-0005]]). 글로 적을 때는 언제나 `AriadneNSD`, `Ariadne’s NSD`는 문자 로고 그림에서만 쓰고 그 대체 글자도 `AriadneNSD`(→ [[dr-0006-logo|DR-0006]], 이름의 뜻은 [[name-story]]). 문서에 프로젝트 이름의 태그는 붙이지 않는다. 저장소 `https://github.com/reddiana/AriadneNSD`(→ [[dr-0011-repo-name|DR-0011]]), 로컬 폴더 `C:\myProject\AriadneNSD`. 배포 대상은 웹(정적 페이지) · Obsidian 플러그인 · 데스크톱 순서(→ [[dr-0002-development-order|DR-0002]]), Google Drive · Confluence · IDE 플러그인 · Claude skill이 그 위에 얹히거나 뒤에 붙는다(→ [[01-requirements#2. 배포 대상]]). 첫 출시(MVP)는 웹이고(→ [[dr-0015-mvp-scope|DR-0015]]) 지금 개발 중이다. 코드는 `src/` 아래의 pnpm 모노레포(→ [[0036-code-layout|ADR-0036]], 시작하는 법 `src/README.md`, 규칙 [[07-coding-guide]]).

## 저장소 구성

| 폴더 | 용도 |
| --- | --- |
| `README.md` · `README.ko.md` | `README.md`는 영어로 쓴 GitHub 첫 화면, `README.ko.md`는 그 한국어판이자 사이트 소개 페이지(`/about`)의 원본. 둘 다 맨 위에 언어 바꾸기 줄. 위키링크 대신 일반 마크다운 링크. GitHub에서만 맞는 곳은 `<!-- site:skip -->` … `<!-- /site:skip -->`로 감싸 사이트에서 뺀다(→ [[dr-0013-publish-docs-github-pages\|DR-0013]]) |
| `CONTRIBUTING.md` | 기여 안내: MVP 써 보기와 버그 알리기, 설계 읽기, 이슈, 문서 고침. 코드 PR은 아직 받지 않음. 개발 환경은 `src/README.md`, 코드 규칙은 [[07-coding-guide]] |
| `docs/` | 애플리케이션 문서. **지금의 모습만**: 요구사항, 아키텍처, UX 설계, 상세 설계, 파일 형식 명세, 용어집, 코딩 가이드(코드를 쓰기 전에 읽음). 시작점 `docs/README.md` |
| `src/` | 코드. `packages/core` · `packages/fonts` · `packages/editor`, `apps/web`. 설계(`docs/`)와 코드가 다르면 둘 중 하나가 틀린 것 |
| `atelier/` | 지금 하는 일과 그 기록: `how-we-work.md`(방문자용 일하는 방식의 원본. 이 파일의 규칙을 바꾸면 거기도 맞춤), `status.md`, `backlog.md`, `outbox.md`, `prototype.md`, `sketchbook.md`, `coverage.md`, `sessions/`, `requirement-changes.md`(철회한 요구사항), `adr/`, `decisions/`(DR), `inbox.md` |
| `journal/` | 이야기하기 위한 여정 기록: 타임라인, 이야기 구성 아이디어, 스크린샷. 누구나 따라 해 볼 용기를 얻도록 쓴다 |
| `site/` | 사이트(GitHub Pages, Quartz)의 설정과 빌드 스크립트. 빌드는 `.github/workflows/pages.yml` |
| `til/` | 메인테이너가 Claude에게 묻고 배운 기술의 정리(메인테이너는 백엔드 개발자, 프론트엔드는 처음) |

## 문서 작성 규칙

- 저장소의 주인은 **메인테이너**(`atelier/` · `journal/` · `til/` · CLAUDE.md). `docs/`의 "사용자"는 AriadneNSD를 쓰는 사람.
- 메인테이너는 **Obsidian**으로 읽고 편집한다: 속성, `[[위키링크]]`, 태그, 체크박스, 콜아웃, Mermaid.
- 그림은 Mermaid나 이미지(스크린숏 · SVG). 상자 그리기 문자(`┌ ─ │`)의 텍스트 그림은 쓰지 않는다(영문만 든 폴더 트리 같은 코드 블록은 괜찮음).
- Mermaid Sequence Diagram에는 activation bar(`->>+` · `-->>-`, `activate`/`deactivate`)를 넣는다.
- 그림의 기호와 색의 뜻은 "표기법"이 아니라 "범례"라고 쓴다(세션 기록 · 지난 시안의 말은 고치지 않음).
- 문서는 아키텍트와 프로그래머의 언어로 쓴다. 대응표 [[how-we-work#문서에서 쓰는 말]]을 쓰거나 고치기 전에 읽는다. 제품 고유의 말(블록, 갈래, 접기 영역 등)과 사용자에게 보이는 문구는 그대로.
- 표 앞에는 빈 줄(Obsidian은 앞줄이 글이면 표를 그리지 않음). 콜아웃 안의 표는 `>`만 있는 줄을 앞에.
- 문서는 한국어, 파일 이름은 영어 kebab-case.
- 문서의 이름(속성 `title`과 본문 `# 제목`, 둘을 같게)에 제품 이름이나 상위 폴더 이름의 말머리를 붙이지 않는다("UX 설계: 단축키" → "단축키"). 영어 이름이 더 익숙하면 영어("Outbox"). ADR · DR의 "ADR-0001: …"은 그대로.
- `docs/` 아래는 색인 `docs/README.md`를 빼고 모두 폴더이며, 읽는 순서대로 두 자리 번호. 문서 하나짜리도 같은 이름의 폴더로 감싼다(`06-glossary/06-glossary.md`). 문서가 여럿인 폴더는 안에서 다시 번호(`01-requirements/02-use-cases.md`). ADR은 `0001-…`, DR은 `dr-0001-…`. 새 문서는 다음 번호. 상세 설계의 테스트 목록은 늘 맨 끝이라 `99-test-list.md`(다음 번호에서 뺀다).
- 위키링크는 파일 이름만으로 건다. 그래서 `docs/` · `atelier/` · `journal/` · `til/` 전체에서 파일 이름이 겹치지 않게 한다(`README.md` 제외, 이것은 경로로: `[[docs/README|문서 색인]]`).
- `docs/`와 `atelier/`의 경계:
	- `docs/`에는 애플리케이션에 대응하는 것만 둔다. 일하는 방식 · 작업 기준은 `atelier/`. 디자인과 설계 문서는 애플리케이션을 빠짐없이 표현해야 한다.
	- `docs/`는 요구사항과 설계의 최종 결과이며 이력이 아니다. 개발된 애플리케이션과 동치이고 다른 문서 없이 읽혀야 한다. `atelier/`로 가는 링크는 부연일 뿐.
	- 미완성은 `> [!info] 미완성: …`, 정하지 않은 물음은 `> [!question] 미결정` 콜아웃이나 문서 끝의 "미결정 사항" 절. `[!todo]`는 쓰지 않는다.
	- "남은 일"(확인 · 써 보기 · 고칠 것)은 `docs/`에 두지 않고 `atelier/`(대개 `backlog.md`)로.
	- `atelier/`는 결정 기록, 현재 상태, 남은 일, 협업(inbox: 메인테이너 → Claude, outbox: Claude → 메인테이너). 다음 세션의 Claude가 이어 갈 수 있게 적는다.
- 공학의 순서: 요구사항(`01-requirements`) → UX 설계(`02-ux-design`)와 아키텍처(`03-architecture`) → 상세 설계(`04-design`). 검토하다 나온 "앞 문서를 고칠 것"은 `atelier/`의 작업 목록에.
- 요구사항에는 "무엇을"만, 하나에 한두 줄. 세부 규칙은 UX 설계(`docs/02-ux-design/`: 원칙 · 공통 규칙 `01-ux-overview`, 조작 규칙 `02-interaction-rules`, 키 표 `03-keymap`, 색 · 선 · 글자 · 치수 `04-visual-design`, 화면 배치 `05-screen-layout`, 물음은 각 문서의 미결정 절)에 쓰고 요구사항에서 "→ 상세"로 링크. 근거는 ADR(`atelier/adr/`, 템플릿 `0000-template.md`) · DR로 링크.
- 요구사항 ID(`R-WEB-02`: `R-`, 영역, 두 자리 번호)는 절마다의 표(`| ID | 요구사항 | 우선순위 |`) 첫 칸. 표마다 뒤에 블록 ID(`^r-web`). 다른 문서에서는 `[[01-requirements#^r-web|R-WEB-02]]`(표 안에서는 `\|`)로, 보이는 글자는 언제나 ID. 글 속의 요구사항 ID는 언제나 이 링크로(형식 설명의 예시만 코드 표기) → [[dr-0016-requirement-ids|DR-0016]].
- 요구사항 ID는 불변. 새 것은 그 영역의 다음 번호. 철회하면 `01-requirements`에서 지우고 `atelier/requirement-changes.md`에 원문 · 날짜 · 까닭과 함께 옮긴다. 번호는 다시 쓰지 않고, 철회한 ID로 가는 링크는 변경 기록으로 돌린다.
- 우선순위 `P0`~`P3`은 표의 "우선순위" 칸에 그냥 글자로. Obsidian 태그(`#P0`)로 달지 않는다. 글 속에서는 코드 표기(`` `P2`로 올림 ``).
- 결정 기록(→ [[dr-0001-split-decision-records|DR-0001]]): 코드 구조 · 모델 · 파일 형식 · 기술 선택은 **ADR**(`atelier/adr/`), 그 밖(일하는 순서, 조작과 모습, 이름 · 로고 · 라이선스)은 **DR**(`atelier/decisions/`, 템플릿 `dr-0000-template.md`). 둘에 걸치면 구조를 정한 쪽이 중심이면 ADR. 아래 "ADR" 규칙은 DR에도 듣는다. 작은 조작 · 화면 결정은 파일을 따로 만들지 않고 `atelier/decisions/ux-decisions.md`에 한 항목. `docs/`의 규칙에는 날짜 대신 결정으로 가는 링크(→ [[dr-0012-decisions-in-atelier|DR-0012]]).
- 제안됨 ADR은 자유롭게 고친다. 승인된 ADR은 본문을 고치지 않는다(가리키는 이름이 바뀌어 링크 주소만 고치는 것은 예외). 결정이 바뀌면 새 ADR을 쓰고 `supersedes`/`superseded-by`로 잇는다. ADR · DR을 더하면 목록(`atelier/adr/README.md`, `atelier/decisions/README.md`)도 갱신.
- 승인된 ADR과 관련된 것이 뒤에 바뀌면 그 ADR 제목 바로 아래의 `> [!NOTE] 이후 변경` 콜아웃에 날짜 · 한 줄 설명 · 링크를 더한다(본문은 그대로). 그 ADR만 읽고 "쓸 때는 이랬고 지금은 이래서 다르다"를 알 수 있게. 요구사항이나 다른 ADR을 바꿀 때마다 영향받는 승인 ADR을 찾아 단다.

## 함께 일하는 방식

- 메인테이너는 Claude를 **달**("달님", "달씨")이라 부른다(Daedalus의 가운데 음절). 대화에서는 메인테이너를 **紅月**(홍월), "홍월님"으로 부른다. 문서에는 "메인테이너".
- `atelier/` 문서는 질문 하나에 문서 하나. **한 항목은 한 곳에만** 적고 다른 곳은 링크.
	- `status.md`: 바로 가기, 지금 단계, **정한 것이 어디까지 갔나**(결정마다 결정 · 구현 중 · 로컬 앱에 있음 · 사이트에 있음. 결정하거나 에이전트가 커밋할 때마다 바로 고침. 사이트에 올라가 메인테이너가 확인한 줄은 마무리 때 지움), 이번과 다음 세션에 할 것. 한 화면을 넘기지 않고, 지나온 일은 적지 않는다.
	- `backlog.md`: 아직 하지 않은 일 전체(미룬 일 포함).
	- `outbox.md`: 메인테이너의 답을 기다리는 것만. "정해 주세요"(결정 요청), "확인해 주세요"(Claude가 정해 놓고 확인받지 못한 것), "알아만 두세요"(답이 필요 없는 보고 가운데 둘 자리가 없는 것).
	- `prototype.md`: 프로토타입의 판, 리뷰 순서, 넣지 못한 것, 알려진 구멍, 시험한 곳과 못 한 곳, 시안 페이지의 확인 정도.
	- `sketchbook.md`: 시안 · 스파이크 · 프로토타입 페이지 목록(ID, 주소, 저장소의 사본, 정한 것). ID `M01`, `M02` …(한 번호 줄, 새 페이지는 다음 번호)를 페이지의 `<title>`과 첫 제목에도 적고, 문서에서도 ID로 가리킨다("M11의 T1"). `status.md`의 바로 가기에는 프로토타입과 답을 기다리는 페이지만.
	- 고른 과정은 시안 페이지(HTML)에만 두고, md에는 결과와 그 페이지의 링크(claude.ai 주소와 저장소의 사본).
	- 답이 필요 없는 보고는 그 대상의 문서에(예: 로고는 `logo-source`의 "남은 확인").
	- 제품에 대한 열린 질문은 `docs/`의 미결정 절이 원본. `atelier/`에 다시 풀어 적지 않는다.
- 정한 일(코드 수정, 테스트, ID · 번역, 문서 정리)은 백그라운드 에이전트에게 맡기고 Claude는 메인테이너와 대화를 이어 간다. 같은 파일을 쓰는 일은 한 에이전트에 묶거나 앞 커밋을 기다리게 한다. 에이전트는 커밋만, push · `status` · `outbox` · 세션 기록은 Claude → [[how-we-work#2. 세션의 리듬]]
	- 정한 일은 보이는 변경(코드 · 테스트)만 먼저 한다. **정리**(`docs/` · ADR · DR · UX 결정 · 테스트 목록에 반영, 쓰지 않게 된 코드와 형식 걷어 내기)는 메인테이너가 하자고 할 때나 매듭 · 마무리 때(아래 7번) 한다. 그 전의 커밋은 `Co-change-skip: … — 정리 때 맞춤`, 미룬 정리는 `status.md`의 그 결정 줄에 "정리 남음"으로.
	- 에이전트는 바뀐 패키지의 테스트 · 타입 검사 · lint만. 전체 검사(`pnpm check` 전체, `pnpm e2e`, 커버리지)는 매듭 · 마무리 때 push 전에 Claude가 한 번.
	- 테스트 목록의 한국어 번역(`src/scripts/test-list-ko.json`)은 에이전트가 채우지 않는다. 매듭 · 마무리 때 Claude가 `pnpm test-list:strict`로 남은 것을 한 번에 채운다.
	- 작은 조작 · 화면 결정은 UX 결정 한 항목과 설계 문서 한 줄로 끝낸다. ADR과 "이후 변경" 콜아웃은 코드 구조 · 모델 · 파일 형식 · 기술 선택이 바뀔 때만.
	- 나란히 돌 에이전트에게는 처음 지시에 테스트 ID · ADR 번호 · 포트의 범위를 나눠 적는다.
	- 시간을 재는 테스트(성능 · 시작 시간)는 다른 에이전트가 돌지 않을 때만 믿는다. 나란히 도는 동안의 실패로 원인을 찾거나 한도를 바꾸지 않는다.
- 문서 검사 훅(`.claude/hooks/doc-check.py`, 설정 `.claude/settings.json`)이 고친 문서의 표 칸 수와 `[[문서#제목]]` 링크를 검사한다. 알리면 그 자리에서 고친다. 전체 검사 `python .claude/hooks/doc-check.py --all`.
- 함께 바뀌는 곳의 훅(`.claude/hooks/co-change-commit.mjs`, 규칙 `src/scripts/co-change.json`)이 `git commit` 때 함께 고칠 문서가 그대로면 막는다. 문서를 고치거나, 필요 없으면 커밋 메시지에 `Co-change-skip: C3 — 까닭` → [[07-coding-guide#13. 문서와 코드의 정합성]]
- 말로 비교하기 어려운 결정이나 될지 모르는 일이 나오면 시안 · 스파이크 · 프로토타입을 요청을 기다리지 않고 **바로 제안한다** → [[spike-prototype-mvp]]
- 토큰은 맥락 길이 × 턴 수로 늘어난다. 맥락을 짧게: 주제가 바뀌면 `/clear` 추천, 기계적인 일은 Sonnet 에이전트, 검사 출력은 실패만 걸러서, 화면은 스크린숏 대신 글로 읽기, 시안 HTML은 고칠 곳만 Edit, CLAUDE.md · `status.md` · `outbox.md`는 짧게 유지.

## 세션 시작 시 할 일

첫 메시지가 인사뿐이더라도 먼저:

1. `atelier/status.md`, `atelier/outbox.md`, `atelier/sessions/`의 가장 최근 기록, `atelier/inbox.md`를 읽는다. `backlog.md`와 `prototype.md`는 그 일을 할 때 읽는다.
2. 지난 세션의 일, 지금 단계, 다음 할 일, outbox에 남은 것("정해 주세요" · "확인해 주세요")을 짧게 요약한다.
3. inbox에 새 내용이 있으면 항목마다 함께 검토해 이번 세션의 일을 계획한다. 처리 방향에 메인테이너가 동의한 항목만 지운다. 이번 세션에 처리를 마친 항목은 묻지 않고 옮겨 지운다. 지우기 전에 원문을 세션 기록에 그대로 옮기고, 합의한 할 일은 `backlog.md`로(이번 세션에 할 것은 `status.md`로). 검토 · 결정하지 못한 항목은 inbox에 남긴다.
	- 1레벨 제목은 지우지 않으며 `1. 일하는 방식` · `2. 배포 대상` · `3. 기능` · `4. 나의 결정` · `5. 질문/요청` · `6. 결함` · `7. 기타`로 고정(번호 포함). 2 · 3레벨 제목은 메인테이너가 계속 쓸 것 같으면 남기고 아니면 지운다.
	- 항목은 번호 없이 글머리표(`- …`)나 `## 짧은 제목`. `5. 질문/요청`은 Claude에게 하는 모든 질문과 요청.
4. 그다음 요청을 처리한다. 첫 메시지가 구체적인 요청이면 요약은 몇 줄로.

## 세션 끝날 때 할 일

메인테이너가 **"마무리"** 라고 하거나 작별 인사를 하면 한다(Claude가 혼자 판단해 중간에 하지 않음). 세션을 이어 가며 하는 같은 정리는 **매듭**("매듭" = "중간매듭"): 아래 0~10과 같고(push 포함) 정리한 뒤 이어 간다. 한 세션에 여러 번 하면 앞 정리 뒤에 생긴 일을 빠짐없이 더한다. 매듭 · 마무리는 돌고 있는 백그라운드 에이전트가 모두 끝난 뒤에 시작한다(그 커밋이 검사와 push에 들어가야 하고, 시간 테스트는 홀로 돌 때만 믿으며, 비운 뒤의 보고는 받을 곳이 없다).

0. `atelier/inbox.md`를 본다. 처리를 마친 항목은 묻지 않고 원문을 세션 기록으로 옮기고 지운다. 검토 · 결정하지 못한 항목, "다음에"라고 한 항목은 남긴다. 경계가 애매한 것만 묻는다.
1. `atelier/sessions/YYYY-MM-DD-NN-주제.md`(NN은 그날의 순번 `01`, `02` …)에 논의 흐름, 결정, 발견한 위험, 다음 할 일을 적고 `atelier/sessions/README.md` 목록에 더한다. `node .claude/scripts/session-usage.mjs`로 누적 토큰과 세션 시간(`atelier/sessions/usage.md`)을 갱신한다(비용은 넣지 않음).
2. `status.md`의 지금 단계와 "이번과 다음 세션에 할 것", `backlog.md`, `prototype.md`를 갱신한다. 끝난 항목은 세션 기록에 옮긴 뒤 지운다.
3. `outbox.md`를 갱신한다. 답을 못 받은 결정 요청, 확인받지 못한 것을 빠짐없이 넣는다. 미룬 일은 `backlog.md`, 프로토타입의 구멍 · 시험하지 못한 곳은 `prototype.md`, 그 밖의 보고는 그 대상의 문서로. 답을 받은 항목은 세션 기록에 옮긴 뒤 지운다.
4. `journal/timeline.md`에 전환점을 더한다. 메인테이너의 요청 원문을 짧게 인용한다.
5. 메인테이너(Claude Code 초보자)가 Claude Code나 AI와 일하는 법을 새로 배웠으면 `journal/learning-claude-code.md`에 더한다.
6. 기술을 설명했으면 `til/`에 정리한다.
7. 정리: 결정은 `docs/`와 ADR · DR에 반영하고(미뤄 둔 정리를 모두 여기서), 세션 기록과 상태 문서에는 링크만.
8. push 전 전체 검사: `pnpm test-list:strict`로 번역을 채우고, `pnpm check` 전체와 `pnpm e2e`. 실패하면 고치거나 알린다. 지난 push 뒤로 코드가 바뀌지 않았으면(`git diff --stat origin/main -- src`) 테스트 · E2E는 하지 않고, 바뀐 설정의 검사(lint · 포맷 등)만. E2E는 편집기의 동작이 바뀐 때만(localhost에서 돌지 않는 코드 · 문구 · 정적 HTML은 아님), 사이트 쪽은 `SKIP_APP=1 bash site/build.sh`. 시간 테스트(T-0171 · T-1126)는 다른 일이 돌지 않을 때만 믿는다.
9. 바뀐 파일을 모두 커밋하고 push한다. push한 뒤 `status.md`의 "정한 것이 어디까지 갔나"의 그 줄들을 "사이트에 있음"으로.
10. 정리를 다 마치면(push까지) 보고한 뒤 대화를 비운다(`/clear`: `mcp__ccd_session_mgmt__clear_session`에 `session_id: "self"`). 매듭이든 마무리든 같다. 비운 뒤는 새 세션이고 세션 기록도 그날의 다음 번호로 새로 쓴다(앞 기록에 덧붙이지 않음). 정리가 끝나지 않았으면(검사 실패, 답을 기다림) 비우지 않는다.

**git:** 커밋은 세션 중에도 필요하면 묻지 않고 한다(inbox 원문을 지키려고, 결정 하나를 반영한 뒤 등). 커밋하지 않은 것은 git으로 되살릴 수 없다. **push는 매듭 · 마무리 때만.**
