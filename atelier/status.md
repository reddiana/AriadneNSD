---
title: 현재 상태
tags:
  - plan
updated: 2026-11-04
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
| M12 | 글자 폭 스파이크 (2026-10-13, 결정함: 글꼴 번들 · F1 2번 → [[0026-bundled-font-metrics\|ADR-0026]]. 답을 기다림: Firefox에서 열어 보기) | https://claude.ai/artifact/FNoS6pjV1zjieBgMwN8HxT | `journal/assets/2026-10-13-text-width-spike.html` (만드는 스크립트 `…-spike-build.py`, 재는 스크립트 `…-spike-measure.mjs`) |
| M51 | 사용법 전체 초안 (2026-11-02, 답을 기다림) | https://claude.ai/artifact/MG7ez6KtKUaFZYAf275Ehq | `journal/assets/2026-11-02-manual-full-study.html` (원본 `src/apps/manual`) |
| M54 | 새 Method로 빼기 시안 (2026-11-03, 결정함: XM1 · XM2 · XM3 3번. 답을 기다림: Claude가 정해 둔 것의 표 → [[outbox#확인해 주세요]]) | https://claude.ai/artifact/J11wWw9DVKUZkUP2ubT94n | `journal/assets/2026-11-03-extract-method-study.html` |
| M55 | 브라우저 안의 문서 시안 (2026-11-03, 결정함: BS1 2번 · BS2 ~ BS4. 답을 기다림: Claude가 정해 둔 것의 표 → [[outbox#확인해 주세요]]) | https://claude.ai/artifact/CLz2Y1yXLYJfdn6q27Y1PV | `journal/assets/2026-11-03-browser-storage-study.html` |
claude.ai의 시안 페이지는 "링크가 있는 누구나"로 공개되어 있습니다(2026-10-25에 M17 · M18 · M28 · M29 · M30까지 확인 → [[sketchbook]]).

## 지금 단계

**0.2.0을 냈습니다(2026-11-04). MVP에 웹의 `P1` 기능을 모두 더한 판입니다. 웹 베타의 문턱은 메인테이너가 Firefox · Safari · 휴대폰에서 써 보고, 밤사이 Claude가 추천안으로 정한 것을 확인하는 일이 남았습니다.**

- 앱: https://ariadnensd.com/ (사이트의 첫 화면이 앱. 사용법은 `/manual/` · `/manual/ko/`, 소개는 `/about` → [[dr-0021-domain-and-front-page|DR-0021]]). 판은 [v0.2.0](https://github.com/reddiana/AriadneNSD/releases/tag/v0.2.0)(Pre-release). 코드는 `src/` → `src/README.md`, 규칙은 [[07-coding-guide]], 기술은 [[03-architecture#8. 기술 스택]]
- 0.2.0에 더한 것: 접기 · 접기 영역, 새 Method로 빼기, 호출 블록 펴 보기 · 풀기 · 이름을 적는 호출 블록, 블록 텍스트의 언어 · 구문 강조, 테마 · 고대비 화면, 공유 링크 · 보기 모드, 브라우저 안의 문서, 그림만 담은 SVG · PDF · 인쇄 · 그림 지문 · 텍스트 외곽선 → [[2026-11-03-06-agents-bugs-locale-extract#매듭 뒤 (2026-11-03 밤 ~ 11-04)]]

- 요구사항 · UX 설계 · 아키텍처 · 상세 설계(모델 [[01-model]], 레이아웃 [[02-layout]], 편집기 [[03-editor]], 웹 [[06-web]], 테스트 전략 [[07-testing]], 파일 형식 [[01-file-format]])가 있습니다 → [[docs/README#문서 지도|문서 지도]]
- MVP 다음은 웹 베타 → 웹 1.0입니다. 앱은 `0.2.0`이고(GitHub Releases에 Pre-release로 올림), 웹 1.0 전에는 파일 형식이 바뀔 수 있습니다. 1.0 전에 남은 것 → [[backlog#웹 1.0의 문턱]] → [[01-requirements#5.1 MVP 다음의 단계]], [[dr-0018-release-stages|DR-0018]]
- MVP는 웹의 `P0`입니다 → [[01-requirements#5. MVP 범위]], [[dr-0015-mvp-scope|DR-0015]]. 조작(M43), 웹 화면(M44), 서브셋 글꼴 WOFF(M45 → [[0039-woff-subset-font|ADR-0039]]), 파일에 남는 이름([[01-file-format#3.3 노드별 필드]]), 편집기와 셸의 경계([[03-editor#6. 셸과의 연결]])를 정했습니다
- 테스트: 단위 · 통합 1,520개, E2E 76개(2026-11-04). 합친 줄 커버리지는 2026-11-03에 core 95% · editor 97% · fonts 97% · web 98%, CI의 `coverage` job이 패키지마다 하한 90%를 검사 → [[07-testing#6. 지금의 커버리지]]. 일하는 방식 전체는 [[how-we-work]]([[dr-0022-test-ids|DR-0022]]). 인수 기준은 [[01-requirements#5.2 MVP의 인수 기준]], 테스트 아키텍처는 [[07-testing#1. 테스트 아키텍처]], 지금의 테스트 전부는 기능 영역마다 [[08-test-list]](자동 생성, 한국어), 결함은 [[defects]]. 남은 구멍은 [[backlog#MVP 개발]]
- 프로토타입은 **66번째 판**입니다(정한 웹 화면까지) → [[prototype]]
- 문서 검사 훅이 Claude가 고친 문서의 표와 링크를 검사합니다(`.claude/hooks/doc-check.py`)
- 요구사항은 모두 `R-` ID([[01-requirements#^r-web|R-WEB-02]])를 받아 표에 있고, ID는 불변, 철회한 것은 [[requirement-changes|요구사항 변경 기록]]으로 → [[dr-0016-requirement-ids|DR-0016]]
- 설계 문서는 https://ariadnensd.com/about 에서 시작하는 사이트에 펴내고 있습니다(`docs/` · `atelier/` · `til/`, `journal/`에서는 이름 이야기와 로고의 출처 두 문서 → [[dr-0013-publish-docs-github-pages|DR-0013]])

큰 순서: 요구사항 → 요구사항 리뷰용 프로토타입 → 아키텍처 → 상세 설계 → **테스트 설계와 테스트 코드** → 개발 → MVP(첫 출시, [[01-requirements#5. MVP 범위]]). 아키텍처와 상세 설계는 프로토타입 리뷰와 나란히 갑니다(2026-10-13, 메인테이너: "병행 진행").

> [!note] 용어
> **프로토타입**은 요구사항이 맞는지 확인하려고 만들고 버리는 것, **MVP**는 개발을 거쳐 처음 내놓는 제품입니다. → [[spike-prototype-mvp]]

## 이번과 다음 세션에 할 것

- [ ] **메인테이너: 0.2.0을 써 보기** https://ariadnensd.com/ (Chrome · Edge, 그리고 Firefox · Safari · 휴대폰). 도움말 › 이 버전에서 바뀐 것에 목록이 있습니다. 써 보며 밤사이 레인이 추천안으로 정한 것을 확인하기 → [[outbox#확인해 주세요]]
- [ ] 메인테이너: 새 ADR 넷(0042 ~ 0045, 제안됨)을 승인할지 → [[outbox#확인해 주세요]]
- [ ] 메인테이너: Windows 알림을 다시 켤지(밤에 `.claude/settings.local.json`의 `hooks`를 비워 둠)
- [ ] 메인테이너가 사용법 전체 초안 M51을 봄 → [[backlog#웹 베타의 문턱]]
- [ ] 메인테이너: 앱이 "불러오는 중"에서 가끔 멈출 때(안드로이드 자주, Edge 가끔) 주소를 바로 열었는지, 문서 사이트 · README 버튼을 거쳤는지 알려 주기 → [[defects]]
- [ ] 웹 1.0 전에 남은 것: 파일 형식의 이름 · 문자열을 굳히기, 키 표를 굳히기, 사용법을 0.2.0의 기능까지 채우기, BUG-15 → [[backlog#웹 1.0의 문턱]]. `P2`(예: [[01-requirements#^r-edit|R-EDIT-17]])는 1.0 뒤
- [ ] 레인 worktree 정리 → [[backlog#저장소 손질]]
- [ ] 남은 "정해 주세요": Firefox로 글자 폭 스파이크(M12) 열기 → [[outbox#정해 주세요]]

## 열린 질문이 있는 곳

제품에 대한 열린 질문은 그 문서의 미결정 절이 원본입니다. 여기에 다시 적지 않습니다.

- 요구사항: [[01-requirements#6. 미결정 사항]] (블록 글자의 종류 목록, 블록 글자가 지원하는 문자, Event를 일으키는 블록, IDE 플러그인이 다루는 언어, AI 대화창의 키 보관, 쓰이지 않는 Method, 웹 광고의 자리)
- UX 설계의 물음: [[02-interaction-rules#9. 미결정 사항]] (정한 것은 [[ux-decisions|UX 결정 모음]])
- 아키텍처: [[03-architecture#7. 위험과 검증이 필요한 사항]] (Obsidian에 wasm 싣기, 펴 보인 호출 블록과 성능), 제안됨 상태의 ADR → [[atelier/adr/README|ADR 목록]]
- Obsidian 플러그인: [[04-obsidian-plugin#미결정 사항]]
