---
title: 현재 상태
tags:
  - plan
updated: 2026-11-03
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
| M51 | 사용법 전체 초안 (2026-11-02, 답을 기다림) | https://claude.ai/artifact/MG7ez6KtKUaFZYAf275Ehq | `journal/assets/2026-11-02-manual-full-study.html` (원본 `src/apps/manual`) |
claude.ai의 시안 페이지는 "링크가 있는 누구나"로 공개되어 있습니다(2026-10-25에 M17 · M18 · M28 · M29 · M30까지 확인 → [[sketchbook]]).

## 지금 단계

**MVP(웹)를 `ariadnensd.com`에 올렸고(2026-11-02), 웹 베타의 문턱을 넘는 중입니다. 사용법이 생겼고 메인테이너가 검토합니다.**

- MVP: https://ariadnensd.com/ (사이트의 첫 화면이 앱. 사용법은 `/manual/` · `/manual/ko/`, 소개는 `/about` → [[dr-0021-domain-and-front-page|DR-0021]]). 코드는 `src/` → `src/README.md`, 규칙은 [[07-coding-guide]], 기술은 [[03-architecture#8. 기술 스택]]

- 요구사항 · UX 설계 · 아키텍처 · 상세 설계(모델 [[01-model]], 레이아웃 [[02-layout]], 편집기 [[03-editor]], 웹 [[06-web]], 테스트 전략 [[07-testing]], 파일 형식 [[01-file-format]])가 있습니다 → [[docs/README#문서 지도|문서 지도]]
- MVP 다음은 웹 베타 → 웹 1.0입니다. 앱은 `0.1.0`이고(GitHub Releases에 Pre-release로 올림), 웹 1.0 전에는 파일 형식이 바뀔 수 있습니다 → [[01-requirements#5.1 MVP 다음의 단계]], [[dr-0018-release-stages|DR-0018]]
- MVP는 웹의 `P0`입니다 → [[01-requirements#5. MVP 범위]], [[dr-0015-mvp-scope|DR-0015]]. 조작(M43), 웹 화면(M44), 서브셋 글꼴 WOFF(M45 → [[0039-woff-subset-font|ADR-0039]]), 파일에 남는 이름([[01-file-format#3.3 노드별 필드]]), 편집기와 셸의 경계([[03-editor#6. 셸과의 연결]])를 정했습니다
- 테스트: 단위 · 통합 736개(`it.each`를 펴면 1,157번 실행), E2E 55개, 성능 5개, 테스트마다 ID `T-0001` ~ `T-0796`. 합친 줄 커버리지 core 94% · editor 96% · fonts 97% · web 90% → [[07-testing#6. 지금의 커버리지]]. 일하는 방식 전체는 [[how-we-work]]([[dr-0022-test-ids|DR-0022]]). 인수 기준은 [[01-requirements#5.2 MVP의 인수 기준]], 테스트 아키텍처는 [[07-testing#1. 테스트 아키텍처]], 지금의 테스트 전부는 기능 영역마다 [[08-test-list]](자동 생성, 한국어), 결함은 [[defects]]. 남은 구멍은 [[backlog#MVP 개발]]
- 프로토타입은 **66번째 판**입니다(정한 웹 화면까지) → [[prototype]]
- 문서 검사 훅이 Claude가 고친 문서의 표와 링크를 검사합니다(`.claude/hooks/doc-check.py`)
- 요구사항은 모두 `R-` ID([[01-requirements#^r-web|R-WEB-02]])를 받아 표에 있고, ID는 불변, 철회한 것은 [[requirement-changes|요구사항 변경 기록]]으로 → [[dr-0016-requirement-ids|DR-0016]]
- 설계 문서는 https://ariadnensd.com/about 에서 시작하는 사이트에 펴내고 있습니다(`docs/` · `atelier/` · `til/`, `journal/`에서는 이름 이야기와 로고의 출처 두 문서 → [[dr-0013-publish-docs-github-pages|DR-0013]])

큰 순서: 요구사항 → 요구사항 리뷰용 프로토타입 → 아키텍처 → 상세 설계 → **테스트 설계와 테스트 코드** → 개발 → MVP(첫 출시, [[01-requirements#5. MVP 범위]]). 아키텍처와 상세 설계는 프로토타입 리뷰와 나란히 갑니다(2026-10-13, 메인테이너: "병행 진행").

> [!note] 용어
> **프로토타입**은 요구사항이 맞는지 확인하려고 만들고 버리는 것, **MVP**는 개발을 거쳐 처음 내놓는 제품입니다. → [[spike-prototype-mvp]]

## 이번과 다음 세션에 할 것

- [ ] **다음에 바로 할 것:** 버그 후보 1 · 2를 고치기(문구는 [[outbox#정해 주세요]]의 버그 후보 항목). [[defects]]에 BUG-10 · BUG-11을 적고, `editor-commands.test.ts`의 거절 표를 먼저 고친 뒤 `editor-commands.ts`의 `blocksOnly` · 붙여넣기 · 감싸기 · 풀기의 `when`과 메시지 카탈로그를 고침. 그다음 버그 후보 3 · 4 · 6을 하나씩 여쭘
- [ ] **메인테이너가 정해 주기: 테스트를 더하다 찾은 버그 후보 일곱 가운데 고칠 것, 테스트 목록 번역의 용어** → [[outbox#정해 주세요]] (2026-11-03 세션 05가 묻기 전에 끊겨 다음 세션이 적음)
- [ ] 리팩토링 준비의 3단계(커버리지 하한을 CI에), 그다음 ADR-0041 · US1 구현 → [[backlog#MVP 개발]]
- [ ] 메인테이너가 2026-11-03 세션 03에 바뀐 것을 배포한 사이트에서 써 보기: 첫 방문의 빠르기(새 창 · 시크릿 창, 휴대폰), 예제 썸네일, 한글이 잠깐 다른 글꼴로 보였다 바뀌는 것 → [[2026-11-03-03-small-holes-font-slices-thumbnails]]
- [ ] 메인테이너가 2026-11-03 세션 04에 바뀐 것을 써 보기: 예제 썸네일이 WebP 그림이 됨(시크릿 창의 첫 방문 모달에서 그림이 또렷한지, 빨리 채워지는지) → [[2026-11-03-04-startup-cpu-webp-thumbnails]]
- [ ] 메인테이너가 2026-11-03 세션 02에 바뀐 문서를 사이트에서 봄: [[08-test-list]](기능 영역, 테스트 ID, 한국어), [[defects]], [[03-quality-attribute-scenarios]]의 "테스트 ID", [[01-requirements#5.2 MVP의 인수 기준]], [[07-testing#1.2 유형과 구성 요소]]의 그림 → [[2026-11-03-02-inbox-atelier-til-views]]
- [ ] 메인테이너가 2026-11-03에 바뀐 것을 써 보기: 빈 블록에서 `o` · `O`, `a p` · `A p`, 캔버스 포커스 테두리(1초, 환경 설정의 늘 보이기), 클릭으로 키 힌트 닫기, 드래그할 때 글자, 문서 사이트의 왼쪽 위 · "앱 열기" → [[2026-11-03-01-site-home-keys-focus]]
- [ ] 메인테이너: 앱이 "불러오는 중"에서 가끔 멈출 때(안드로이드 자주, Edge 가끔) 주소를 바로 열었는지, 문서 사이트 · README 버튼을 거쳤는지 알려 주기. 문서 사이트를 거친 경우는 BUG-06으로 고침(2026-11-03). 바로 열어도 멈추면 그 화면을 찍어 보내기 → [[defects]]
- [ ] 메인테이너가 사용법 전체 초안 M51을 봄: https://claude.ai/artifact/MG7ez6KtKUaFZYAf275Ehq → [[backlog#웹 베타의 문턱]]
- [ ] 메인테이너가 S26에서 바뀐 툴바(예제 버튼, 아래 줄 없앰 → MB2)와 큰 다이어그램의 스크롤을 써 보기 → [[2026-11-01-04-examples-button-android-load]]
- [ ] **메인테이너가 예제와 헤더를 써 보기**(https://ariadnensd.com/ 을 새 창(시크릿 창)으로 열면 첫 방문 모달) → 만든 것과 정한 것은 [[2026-11-01-02-docs-current-examples]], 확인할 것은 [[outbox#확인해 주세요]]
- [ ] 문서 현행화 점검에서 판단이 필요한 것을 메인테이너와 봄 → [[backlog#MVP 개발]]
- [ ] 웹 베타의 문턱: 남은 것은 상표 검색, 사용법 검토(M51), Firefox · Safari · 휴대폰에서 써 보기 → [[backlog#웹 베타의 문턱]]. 주소(`ariadnensd.com`, 첫 화면은 앱)와 비공개 보고(`report@ariadnensd.com`)는 2026-11-02에 끝남, 후원 버튼은 베타 뒤로 → [[dr-0021-domain-and-front-page|DR-0021]]
- [ ] 메인테이너가 MVP를 써 보기(Chrome · Edge, 그리고 Firefox · Safari · 휴대폰)
- [ ] 메인테이너가 확인할 것: MVP에서 Claude가 정한 것 → [[outbox#확인해 주세요]]
- [ ] 남은 "정해 주세요"(프로토타입 질문 셋, 이름이 겹친 헤더의 표시, Firefox로 글자 폭 스파이크 열기) → [[outbox]]

## 열린 질문이 있는 곳

제품에 대한 열린 질문은 그 문서의 미결정 절이 원본입니다. 여기에 다시 적지 않습니다.

- 요구사항: [[01-requirements#6. 미결정 사항]] (블록 글자의 종류 목록, 블록 글자가 지원하는 문자, Event를 일으키는 블록, IDE 플러그인이 다루는 언어, AI 대화창의 키 보관, 쓰이지 않는 Method, 웹 광고의 자리)
- UX 설계의 물음: [[02-interaction-rules#9. 미결정 사항]] (정한 것은 [[ux-decisions|UX 결정 모음]])
- 요구사항 문서에 대한 물음(Q18, Q22, Q23): [[requirements-rework#답하실 것]]
- 아키텍처: [[03-architecture#7. 위험과 검증이 필요한 사항]] (Obsidian에 wasm 싣기, 펴 보인 호출 블록과 성능), 제안됨 상태의 ADR → [[atelier/adr/README|ADR 목록]]
- Obsidian 플러그인: [[04-obsidian-plugin#미결정 사항]]
