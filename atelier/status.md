---
title: 현재 상태
tags:
  - plan
updated: 2026-11-01
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
| M09 | UX 규칙 시안 (2026-10-11, 답을 기다림: [[02-interaction-rules#9. 미결정 사항\|조작의 미결정]] Q20(MVP 뒤) · [[requirements-rework]] Q18, Q23. MVP에 드는 물음은 M43에서 정함) | https://claude.ai/artifact/A7sWbwCA4NFC8qSZg58d3y | `journal/assets/2026-10-11-ux-rules-study.html` |
| M12 | 글자 폭 스파이크 (2026-10-13, 결정함: 글꼴 번들 · F1 2번 → [[0026-bundled-font-metrics\|ADR-0026]]. 답을 기다림: Firefox에서 열어 보기) | https://claude.ai/artifact/FNoS6pjV1zjieBgMwN8HxT | `journal/assets/2026-10-13-text-width-spike.html` (만드는 스크립트 `…-spike-build.py`, 재는 스크립트 `…-spike-measure.mjs`) |
claude.ai의 시안 페이지는 "링크가 있는 누구나"로 공개되어 있습니다(2026-10-25에 M17 · M18 · M28 · M29 · M30까지 확인 → [[sketchbook]]).

## 지금 단계

**MVP(웹)의 코드를 만들었습니다(2026-11-01). 다음은 배포를 확인하고 메인테이너가 써 보는 것입니다.**

- MVP: https://reddiana.github.io/AriadneNSD/app/ (push 뒤 GitHub Pages가 빌드). 코드는 `src/` → `src/README.md`, 규칙은 [[07-coding-guide]], 기술은 [[03-architecture#8. 기술 스택]]

- 요구사항 · UX 설계 · 아키텍처 · 상세 설계(모델 [[01-model]], 레이아웃 [[02-layout]], 편집기 [[03-editor]], 웹 [[06-web]], 테스트 전략 [[07-testing]], 파일 형식 [[01-file-format]])가 있습니다 → [[docs/README#문서 지도|문서 지도]]
- MVP는 웹의 `P0`입니다 → [[01-requirements#5. MVP 범위]], [[dr-0015-mvp-scope|DR-0015]]. 조작(M43), 웹 화면(M44), 서브셋 글꼴 WOFF(M45 → [[0039-woff-subset-font|ADR-0039]]), 파일에 남는 이름([[01-file-format#3.3 노드별 필드]]), 편집기와 셸의 경계([[03-editor#6. 셸과의 연결]])를 정했습니다
- 테스트: 단위 369개, E2E 33개(인수 테스트 AT-01 ~ AT-17), `pnpm check` · CI. 남은 구멍은 [[backlog#MVP 개발]]
- 프로토타입은 **66번째 판**입니다(정한 웹 화면까지) → [[prototype]]
- 문서 검사 훅이 Claude가 고친 문서의 표와 링크를 검사합니다(`.claude/hooks/doc-check.py`)
- 요구사항은 모두 `R-` ID([[01-requirements#^r-web|R-WEB-02]])를 받아 표에 있고, ID는 불변, 철회한 것은 [[requirement-changes|요구사항 변경 기록]]으로 → [[dr-0016-requirement-ids|DR-0016]]
- 설계 문서는 https://reddiana.github.io/AriadneNSD/ 에 펴내고 있습니다(`docs/` · `atelier/` · `til/`, `journal/`에서는 이름 이야기와 로고의 출처 두 문서 → [[dr-0013-publish-docs-github-pages|DR-0013]])

큰 순서: 요구사항 → 요구사항 리뷰용 프로토타입 → 아키텍처 → 상세 설계 → **테스트 설계와 테스트 코드** → 개발 → MVP(첫 출시, [[01-requirements#5. MVP 범위]]). 아키텍처와 상세 설계는 프로토타입 리뷰와 나란히 갑니다(2026-10-13, 메인테이너: "병행 진행").

> [!note] 용어
> **프로토타입**은 요구사항이 맞는지 확인하려고 만들고 버리는 것, **MVP**는 개발을 거쳐 처음 내놓는 제품입니다. → [[spike-prototype-mvp]]

## 이번과 다음 세션에 할 것

- [ ] **다음의 첫 일: push한 CI · Pages가 통과했는지 보고, MVP를 열어 보기** → [[backlog#MVP 개발]]
- [ ] 메인테이너가 MVP를 써 보기(Chrome · Edge, 그리고 Firefox · Safari · 휴대폰)
- [ ] 메인테이너가 확인할 것: 저장 파일의 글꼴 이름 "AriadneNSD Block", MVP에서 Claude가 정한 것 → [[outbox#확인해 주세요]]
- [ ] 남은 "정해 주세요"(프로토타입 질문 셋, 이름이 겹친 헤더의 표시, Firefox로 글자 폭 스파이크 열기) → [[outbox]]

## 열린 질문이 있는 곳

제품에 대한 열린 질문은 그 문서의 미결정 절이 원본입니다. 여기에 다시 적지 않습니다.

- 요구사항: [[01-requirements#6. 미결정 사항]] (블록 글자의 종류 목록, 블록 글자가 지원하는 문자, Event를 일으키는 블록, IDE 플러그인이 다루는 언어, AI 대화창의 키 보관, 쓰이지 않는 Method, 웹 광고의 자리)
- UX 설계의 물음: [[02-interaction-rules#9. 미결정 사항]] (정한 것은 [[ux-decisions|UX 결정 모음]])
- 요구사항 문서에 대한 물음(Q18, Q22, Q23): [[requirements-rework#답하실 것]]
- 아키텍처: [[03-architecture#7. 위험과 검증이 필요한 사항]] (Obsidian에 wasm 싣기, 펴 보인 호출 블록과 성능), 제안됨 상태의 ADR → [[atelier/adr/README|ADR 목록]]
- Obsidian 플러그인: [[04-obsidian-plugin#미결정 사항]]
