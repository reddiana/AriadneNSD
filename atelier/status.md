---
title: 현재 상태
tags:
  - plan
updated: 2026-11-22
---

# 현재 상태

> [!abstract] 이 문서는
> **지금 어디에 있는지**를 한 화면으로 보여 줍니다. 남은 일 전체는 [[backlog]], 답을 기다리는 것은 [[outbox]], 프로토타입은 [[prototype]], 지나온 일은 [[atelier/sessions/README|세션 기록]]에 있습니다.

## 바로 가기

프로토타입과 답을 기다리는 페이지만 둡니다(전체는 [[sketchbook]]). claude.ai의 시안 페이지는 "링크가 있는 누구나"로 공개되어 있습니다.

| ID | 무엇 | 주소 | 저장소의 사본 |
| --- | --- | --- | --- |
| M01 | **프로토타입** | https://claude.ai/artifact/RuUjpc7YmCcbJXAdCeQiRG | `journal/assets/2026-10-10-ns-prototype.html` |
| M12 | 글자 폭 스파이크 (답을 기다림: Firefox에서 열기) | https://claude.ai/artifact/FNoS6pjV1zjieBgMwN8HxT | `journal/assets/2026-10-13-text-width-spike.html` |
| M54 | 새 Method로 빼기 (답을 기다림: Claude가 정해 둔 것의 표) | https://claude.ai/artifact/J11wWw9DVKUZkUP2ubT94n | `journal/assets/2026-11-03-extract-method-study.html` |
| M55 | 브라우저 안의 문서 (답을 기다림: Claude가 정해 둔 것의 표) | https://claude.ai/artifact/CLz2Y1yXLYJfdn6q27Y1PV | `journal/assets/2026-11-03-browser-storage-study.html` |

## 지금 단계

**웹 베타 0.3.0을 냈습니다(2026-11-21).** 베타 동안 웹의 `P1`을 다듬고 Obsidian 베타(BRAT)를 시작합니다. 그다음 웹 1.0 → [[backlog#웹 1.0의 문턱]], [[dr-0018-release-stages|DR-0018]]

- 앱 https://ariadnensd.com/ (사용법 `/manual/`, 소개 `/about`), 판 [v0.4.0](https://github.com/reddiana/AriadneNSD/releases/tag/v0.4.0)(Pre-release, 웹 베타, Claude skill의 zip 포함). 1.0 전에는 파일 형식이 바뀔 수 있음
- 코드 `src/` → `src/README.md`, 규칙 [[07-coding-guide]], 문서 지도 [[docs/README#문서 지도|문서 색인]]
- 테스트: 단위 · 통합 1,685개, E2E 83개(2026-11-19), 커버리지 → [[coverage]], 결함 → [[defects]]

## 정한 것이 어디까지 갔나

결정하거나 에이전트가 커밋할 때마다 고치고, 사이트에서 메인테이너가 확인한 줄은 마무리 때 지웁니다. 로컬 앱 http://localhost:5173 (`pnpm dev`), 사이트 https://ariadnensd.com/

| 결정 | 정한 곳 | 지금 | 커밋 |
| --- | --- | --- | --- |
| 감싸기 버튼: 블록 아이콘 크기 · 없으면 흐리게 | M68, [[ux-decisions\|TB2 · TB3]] | 사이트에 있음 | `ece7e51` |
| AI가 준 JSON · 링크 붙여넣어 열기, 요청문 복사 | M57, [[01-requirements#^r-web\|R-WEB-11]] | 사이트에 있음 | `ebb0186` `edd5241` |
| 펴 보인 곳의 접기 영역은 처음 펼 때 복사 | M69, [[0047-copy-method-folds-at-first-open\|ADR-0047]] · CB14 | 사이트에 있음 | `4a6fb9a` |
| 펴 보인 곳 안의 여러 블록 선택 (결함) | 메인테이너 신고 | 사이트에 있음 | `26e1fe3` |
| 접고 펴기를 실행 취소 대상으로 | [[0048-folding-is-undoable\|ADR-0048]] · UN1 | 사이트에 있음 | `62a94a2` |
| 호출 블록: 다른 문서 호출 철회, 잃은 호출은 이름 호출로, `gd`로 Method 만들기 | 메인테이너 (2026-11-21, inbox), [[0049-call-without-method-is-named\|ADR-0049]] · CB15 | 사이트에 있음 | `d7ef1cc` |
| BUG-18 다른 탭 잠금의 까닭을 우상단에 | 메인테이너 신고, RO1 | 사이트에 있음 | `ee01499` |
| 도움말 › 정보 창의 링크를 전체 주소로 | 메인테이너 (2026-11-21, inbox), W4 | 사이트에 있음 | `fff8c5b` |
| Method 풀어 넣고 지우기(모든 호출 자리, 키 없음) | 메인테이너 (2026-11-21), [[01-requirements#^r-edit\|R-EDIT-27]] · CB16 | 사이트에 있음 | `75479bd` |
| 웹 베타 v0.3.0: README 문구, 판 번호, 바뀐 것 | 메인테이너 (2026-11-21), [[dr-0018-release-stages\|DR-0018]] | 사이트에 있음 ([v0.3.0](https://github.com/reddiana/AriadneNSD/releases/tag/v0.3.0) Pre-release) | `c28b3f8` |
| 일하는 방식: 작은 결정은 한 줄, 검사 · 번역은 push 전에, 이 표 | 메인테이너 (2026-11-21) | 사이트에 있음 ([[how-we-work]]) | |
| 일하는 방식: 매듭 뒤 /clear, 늘 실리는 문서 줄이기 | 메인테이너 (2026-11-21) | 사이트에 있음 | `5bd7010` |
| Claude skill 첫 범위 A · B · C, 배포는 Release zip + Claude Code 플러그인 마켓플레이스 | 메인테이너 (2026-11-21), [[01-requirements#^r-skill\|R-SKILL-01 ~ 03]], [[0050-claude-skill-bundle-and-distribution\|ADR-0050]] | 사이트에 있음(마켓플레이스 · [v0.4.0](https://github.com/reddiana/AriadneNSD/releases/tag/v0.4.0)의 zip. Claude Code에서 설치해 써 봄, claude.ai는 아직) | `091fe6b` `b6adcf6` `7992933` `dc6d15a` |
| BUG-19 두꺼운 외곽선: 배율이 정수가 아닐 때(110% 등) 1px 선이 2px로 (결함) | 메인테이너 신고 (2026-11-21 inbox, 2026-11-22 재현 `atelier/sessions/assets/2026-11-22-thick-outline-zoom-110.png`) | 사이트에 있음(메인테이너가 로컬에서 확인) | `70deffa` |
| 스킬: 처리 블록 하나에 문장 하나(줄바꿈으로 묶지 않음) | 메인테이너 (2026-11-22), [[ux-decisions\|SK1]] | 사이트에 있음(설치한 사람에게는 다음 판부터) | `3d59f98` |
| 알고리즘 갤러리 `/gallery/`: G3 목록 + 큰 그림, 22개(앱 예제 6 + 고전 · 어려운 · 재미 16) | 메인테이너 (2026-11-22), M70 | 로컬 앱에 있음(정확성 검사 통과 `17fc681`) | `56c1529` `0756e96` |

## 이번과 다음 세션에 할 것

- [ ] 홍보: 알고리즘 갤러리(사이트 페이지, 그림마다 편집기 링크) → 글 초안(한국어 · 영어) → 메인테이너가 GeekNews Show GN · Show HN · Reddit에 올림 (2026-11-22 메인테이너가 고름)
- [ ] 메인테이너: claude.ai에 v0.4.0의 `ariadne-nsd.zip`을 올려 써 보기, "문장마다 블록"을 담은 다음 판(0.5.0)을 언제 낼지 → [[backlog#Claude skill]]
- [ ] **다음 세션 처음: 시간 테스트 T-0171 · T-1126을 안정시킴**(파일을 나란히 돌릴 때 실패, CI는 통과) → [[backlog#MVP 개발]]
- [ ] 메인테이너: 써 보며 [[outbox#확인해 주세요]]를 확인(바꿀 것만)
- [ ] 설계 대조의 중 206건 · 하 71건 → [[backlog#설계]]
- [ ] 메인테이너: C&C 그림(`docs/03-architecture/assets/*.drawio.svg`)을 draw.io로 고침 → 그 뒤 Claude가 [[01-architecture#3. 실행 중의 모습]]의 카탈로그 표와 맞춤
- [ ] AT-05: 병목은 화면 쪽(DOM 반영 · 브라우저 그리기). "바뀐 블록만 DOM에 반영"을 할지 여쭙기 → [[backlog#MVP 개발]]
- [ ] 메인테이너: AT-05를 `https://ariadnensd.com/?perf`로 가진 기기에서 재고 기준 기기 정하기 → [[01-requirements#5.2 MVP의 인수 기준]]
- [ ] 메인테이너: Windows 알림을 다시 켤지(`.claude/settings.local.json`의 `hooks`를 비워 둠)
- [ ] 메인테이너: 앱이 "불러오는 중"에서 멈출 때 주소를 바로 열었는지, 사이트 · README 버튼을 거쳤는지 알려 주기 → [[defects]]
- [ ] 11-03 밤의 worktree 정리 → [[backlog#저장소 손질]]
- [ ] Firefox로 M12 열기 → [[outbox#정해 주세요]]

## 열린 질문이 있는 곳

원본은 각 문서의 미결정 절입니다: [[01-requirements#6. 미결정 사항]], [[02-interaction-rules#9. 미결정 사항]](정한 것은 [[ux-decisions]]), [[01-architecture#8. 위험과 검증이 필요한 사항]], [[04-obsidian-plugin#미결정 사항]], 제안됨 ADR → [[atelier/adr/README|ADR 목록]]
