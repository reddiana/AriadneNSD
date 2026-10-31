---
title: 현재 상태
tags:
  - plan
updated: 2026-10-31
---

# 현재 상태

> [!abstract] 이 문서는
> **지금 어디에 있는지**를 한 화면으로 보여 줍니다. 세션을 시작할 때 Claude가 이 문서와 [[outbox]]를 읽고 요약합니다.
> - 남은 할 일 전체는 [[backlog]], 메인테이너의 답을 기다리는 것은 [[outbox]], 프로토타입의 상태와 리뷰 순서는 [[prototype]]에 있습니다.
> - 지나온 일은 세션 기록에 있습니다 → [[atelier/sessions/README|세션 기록 목록]]. 끝난 항목은 마무리 때 세션 기록으로 옮기고 여기서 지웁니다.

## 바로 가기
프로토타입과, 메인테이너의 답을 기다리는 페이지만 여기에 둡니다. 시안과 스파이크 전체의 목록은 [[sketchbook]]에 있습니다.

| ID | 무엇 | 주소 | 저장소의 사본 |
| --- | --- | --- | --- |
| M01 | **프로토타입** (요구사항 점검용) | https://claude.ai/artifact/RuUjpc7YmCcbJXAdCeQiRG | `journal/assets/2026-10-10-ns-prototype.html` (브라우저로 직접 열어도 됨) |
| M09 | UX 규칙 시안 (2026-10-11, 답을 기다림: [[02-interaction-rules#9. 미결정 사항|조작의 미결정]] Q1 · Q2 · Q4~Q6 · Q8 · Q11 · Q12 · Q19 · Q20 · [[requirements-rework]] Q18, Q23) | https://claude.ai/artifact/A7sWbwCA4NFC8qSZg58d3y | `journal/assets/2026-10-11-ux-rules-study.html` |
| M12 | 글자 폭 스파이크 (2026-10-13, 결정함: 글꼴 번들 · F1 2번 → [[0026-bundled-font-metrics\|ADR-0026]]. 답을 기다림: Firefox에서 열어 보기) | https://claude.ai/artifact/FNoS6pjV1zjieBgMwN8HxT | `journal/assets/2026-10-13-text-width-spike.html` (만드는 스크립트 `…-spike-build.py`, 재는 스크립트 `…-spike-measure.mjs`) |
claude.ai의 시안 페이지는 "링크가 있는 누구나"로 공개되어 있습니다(2026-10-25에 M17 · M18 · M28 · M29 · M30까지 확인 → [[sketchbook]]).

## 지금 단계

**상세 설계 중입니다(프로토타입 리뷰와 나란히). 레이아웃 설계 [[02-layout]]와 테스트 전략 [[07-testing]] 초안을 마쳤고, 다음 일은 편집기 · 웹 설계입니다.**

- 요구사항 · UX 설계 · 아키텍처는 초안이 있고, 상세 설계는 문서 모델 [[01-model]], 레이아웃 [[02-layout]](규칙 · 스파이크 · [[0037-two-pass-full-layout|ADR-0037]]까지), 테스트 전략 [[07-testing]](초안, 도구 [[0038-build-and-test-tools|ADR-0038]])이 있고, 편집기 [[03-editor]]는 뼈대입니다 → [[docs/README#문서 지도|문서 지도]]
- MVP는 웹의 `P0`에 매일 쓰는 편집(Case · For · 감싸기 · 복사 · 갈래)을 더한 범위입니다 → [[dr-0015-mvp-scope|DR-0015]]. MVP 전에 정할 것은 [[backlog#MVP 전에 정할 것]]
- 코드의 자리는 정했고(`src/` 아래의 pnpm 워크스페이스 → [[0036-code-layout|ADR-0036]]) 코드는 아직 없습니다
- 프로토타입은 **64번째 판**입니다(2026-10-31: 62번째 판에서 그때까지 정한 것을 모두 넣고, 63번째 판에서 주소로 예제 열기, 64번째 판에서 inbox 다섯: 머리 모양 기억 · 처음엔 Raft · 열면 고른 것 없음 · 좁은 화면) → [[prototype]]
- 요구사항은 모두 `R-` ID([[01-requirements#^r-web|R-WEB-02]])를 받아 표에 있고, ID는 불변, 철회한 것은 [[requirement-changes|요구사항 변경 기록]]으로 → [[dr-0016-requirement-ids|DR-0016]]
- 설계 문서는 https://reddiana.github.io/AriadneNSD/ 에 펴내고 있습니다(`docs/` · `atelier/` · `til/`, `journal/`에서는 이름 이야기와 로고의 출처 두 문서 → [[dr-0013-publish-docs-github-pages|DR-0013]])

큰 순서: 요구사항 → 요구사항 리뷰용 프로토타입 → 아키텍처 → 상세 설계 → **테스트 설계와 테스트 코드** → 개발 → MVP(첫 출시, [[01-requirements#5. MVP 범위]]). 아키텍처와 상세 설계는 프로토타입 리뷰와 나란히 갑니다(2026-10-13, 메인테이너: "병행 진행").

> [!note] 용어
> **프로토타입**은 요구사항이 맞는지 확인하려고 만들고 버리는 것, **MVP**는 개발을 거쳐 처음 내놓는 제품입니다. → [[spike-prototype-mvp]]

## 이번과 다음 세션에 할 것

- [ ] **다음의 첫 일: 편집기 · 웹 설계** → [[03-editor]], [[06-web]]. 웹의 화면(도구 막대 · 메뉴 · 파일 열기와 저장 · 도움말의 자리)은 시안부터, 본보기는 SequenceDiagram.org → [[backlog#MVP 전에 정할 것]]
- [ ] 레이아웃 · 테스트 전략에 남은 것: 서브셋 글꼴의 형식(TTF · woff2), 가짜 DOM(happy-dom · jsdom), 커버리지 목표 → 각 문서의 미결정. 레이아웃 1 ~ 4단계와 테스트 전략은 2026-10-25 세션 04에서 → [[2026-10-25-04-outbox-cleanup]]
- [ ] MVP에 드는 조작의 미결정을 프로토타입 리뷰로 → [[prototype#리뷰 순서]]
- [ ] 남은 "정해 주세요"(조작의 미결정 Q들, Q10의 세부, 프로토타입 질문 넷, 이름이 겹친 머리의 표시, Firefox로 글자 폭 스파이크 열기)와 세션 04의 "확인해 주세요" → [[outbox]]. 물음은 그림으로 묻는다
- [ ] 그 밖에 메인테이너가 고를 것 (2026-10-18 끝에 물음)
	- If ↔ Case로 바꿀지 묻는 모양과 글자를 옮기는 법(시안) → [[backlog]]
	- [[01-model]]의 남은 미결정(다른 문서를 가리키는 값, fall-through)
- [ ] 메인테이너가 프로토타입 62번째 판을 써 보기(새로 들어간 것은 도움말의 "이번에 바뀐 것"). 61번째 판까지의 것: 시각 디자인의 느낌(파랑 3px 접기 영역과 주황 3px 고른 표시는 "마음에 듭니다"를 받음, 갈래 이름의 회색과 점선 1px, 테두리만 있는 고른 표시. 결정은 2026-10-25에 "그대로"를 받았고, 써 보고 어색하면 알려 주시기만 하면 됨). 그 밖에 실제 마우스 휠과 터치패드로 블록을 옮겨 다니는 느낌, `Esc` 두 번, 리뷰 1판 · 2판의 느낌, 블록 하나짜리 접기 영역이 강조 대용으로 쓸 만한지(지금은 만들면 바로 접힘), 한글을 적다가 `Esc`를 누르면 한 번에 받아들이는지
- [ ] 새 문서 [[02-use-cases]] · [[03-quality-attribute-scenarios]]를 Obsidian에서 읽고, 미결정(유즈케이스의 빈 곳 아홉, QAS의 제안값)을 하나씩 정하기 → [[backlog]]
- [ ] 새 UX 문서 넷을 Obsidian에서 열어 보고 어색한 곳을 알려 주기 (메인테이너). 시각 디자인 명세의 색 칩이 Obsidian에서 보이는지도

## 열린 질문이 있는 곳

제품에 대한 열린 질문은 그 문서의 미결정 절이 원본입니다. 여기에 다시 적지 않습니다.

- 요구사항: [[01-requirements#6. 미결정 사항]] (블록 글자의 종류 목록, 블록 글자가 지원하는 문자, Event를 일으키는 블록, IDE 플러그인이 다루는 언어, AI 대화창의 키 보관, 쓰이지 않는 Method, 웹 광고의 자리)
- UX 설계의 물음: [[02-interaction-rules#9. 미결정 사항]] (정한 것은 [[ux-decisions|UX 결정 모음]])
- 요구사항 문서에 대한 물음(Q18, Q22, Q23): [[requirements-rework#답하실 것]]
- 아키텍처: [[03-architecture#7. 위험과 검증이 필요한 사항]] (글꼴 조각의 크기, Obsidian에 wasm 싣기, 펴 보인 호출 블록과 성능), 제안됨 상태의 ADR → [[atelier/adr/README|ADR 목록]]
- 파일 형식: [[01-file-format#6. 미결정 사항]] (모델 요소 이름과 필드 이름, 글꼴 조각의 형식)
- Obsidian 플러그인: [[04-obsidian-plugin#미결정 사항]]
