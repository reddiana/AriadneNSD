---
title: 현재 상태
tags:
  - plan
updated: 2026-11-27
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
| M77 | 리팩토링 범위 (정함: Q1 ②, Q2 ~ Q4 ①) | https://claude.ai/artifact/SzSbNuXyzC1xd9zib347Xf | `journal/assets/2026-11-27-refactoring-scope-study.html` |
| M79 | 무한 반복 블록의 모양 (정함: E1 1번) | https://claude.ai/artifact/G3TYprDPbqavA6oEHERrK8 | `journal/assets/2026-11-28-endless-loop-study.html` |
| M80 | 탈출 블록 (정함: X1 ~ X3 모두 1번) | https://claude.ai/artifact/JEnc5ppTHaJhjz9iPNUVDB | `journal/assets/2026-11-28-exit-block-study.html` |
| M81 | 병렬 처리 블록 (정함: P1 1번, P2 2번, P3 1번) | https://claude.ai/artifact/2WLTn2zLbwddkqphpK1dZU | `journal/assets/2026-11-28-parallel-block-study.html` |
| M83 | 삽입 · 붙여넣기의 앞 · 뒤 (정함: W1 1번) | https://claude.ai/artifact/A4crRvr8crouTNLy84rMfU | `journal/assets/2026-11-28-before-after-naming-study.html` |

## 지금 단계

**웹 베타 0.3.0을 냈습니다(2026-11-21).** 베타 동안 웹의 `P1`을 다듬고 Obsidian 베타(BRAT)를 시작합니다. 그다음 웹 1.0 → [[backlog#웹 1.0의 문턱]], [[dr-0018-release-stages|DR-0018]]

- 앱 https://ariadnensd.com/ (사용법 `/manual/`, 소개 `/about`), 판 [v0.5.0](https://github.com/reddiana/AriadneNSD/releases/tag/v0.5.0)(Pre-release, 웹 베타, Claude skill의 zip 포함). 1.0 전에는 파일 형식이 바뀔 수 있음
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
| 알고리즘 갤러리 `/gallery/`: G3 목록 + 큰 그림, 22개(앱 예제 6 + 고전 · 어려운 · 재미 16) | 메인테이너 (2026-11-22), M70 | 사이트에 있음(https://ariadnensd.com/gallery/ko/, 정확성 검사 통과 `17fc681`) | `56c1529` `0756e96` |
| README: 영어가 대문(`README.md`), 한국어는 `README.ko.md`(사이트 `/about`), `.ns.svg` 설명 문구, 영어 그림 | 메인테이너 (2026-11-22) | 사이트에 있음 | `b0c5b0f` `29ef4e9` |
| 사이트 왼쪽 메뉴의 "사용자 도움말" 바로 아래에 "알고리즘 갤러리"(`/gallery/ko/`) | 메인테이너 (2026-11-22) | 사이트에 있음(SPA가 갤러리 링크를 가로채지 않게 고침) | `e75e0f3` `c4cb34f` |
| 앱 도움말 메뉴의 "사용자 도움말" 바로 아래에 "알고리즘 갤러리"(한국어 `gallery/ko/`, 영어 `gallery/`), T-1491 | 메인테이너 (2026-11-22), [[ux-decisions\|GL2]] | 사이트에 있음 | `82fa479` |
| 사용법 둘러보기 맨 위에 힙 정렬 동영상 둘(키보드만 · 마우스만) 탭으로, 누르면 재생, 언어마다 따로, 마우스판은 우클릭 먼저 | 메인테이너 (2026-11-22), M73, [[ux-decisions\|MV1]] | 사이트에 있음(https://ariadnensd.com/manual/ko/#tour) | `cff38e2` `814ddd8` `e5c4beb` `2e6f26a` `50da46f` `f628728` |
| 노출 세기: 앱 · 사이트 · 갤러리에 Cloudflare Web Analytics(쿠키 없음, 공유 링크의 `#` 뒤는 보내지 않음), README · 소개에 한 줄 | 메인테이너 (2026-11-23), [[0051-cloudflare-web-analytics\|ADR-0051]] | 사이트에 있음(push 뒤 Cloudflare 대시보드에 방문이 잡히는지, 요청에 `#` 뒤가 없는지 확인) | `a368ed9` |
| 메인테이너의 방문은 빼기: `?nocount`를 한 번 열면 그 브라우저는 세지 않음(`?count`로 되돌림) | 메인테이너 (2026-11-24) | 사이트에 있음(메인테이너가 쓰는 브라우저 · 기기마다 `https://ariadnensd.com/?nocount`를 한 번 열기) | `9b2c94b` |
| 블록 셋(탈출 · 병렬 · 무한 반복)을 `P1`로(1.0 전), 주석 블록 R-BLK-14는 철회(블록마다의 주석은 backlog), 무한 반복 R-BLK-15의 모양은 DIN 그대로(위 · 왼쪽 · 아래 빈 띠) | 메인테이너 (2026-11-28), M79 E1 1번, [[01-requirements#^r-blk\|R-BLK-15]] | 결정 | |
| 탈출 R-BLK-12: DIN 왼쪽 쐐기, 자유 글자 하나(위치 검사 없음, `continue`도), 넣는 키 `a` + `x`(무한 반복은 `e`, `s` + `e`로 감싸기) | 메인테이너 (2026-11-28), M80 X1 ~ X3 1번 | 결정(정리 남음) | |
| 병렬 처리 R-BLK-13: 위 · 아래 띠의 양 끝 빗금, 위 띠에 글자를 적을 수 있음(비우면 띠가 얇음), 갈래 조작은 Case를 따름(최소 둘), 넣는 키 `a` + `t` · 감싸기 `s` + `t` | 메인테이너 (2026-11-28), M81 P1 1번 · P2 2번 · P3 1번 | 결정(정리 남음) | |
| 삽입 · 붙여넣기의 앞 · 뒤를 그림의 방향으로: 블록은 위에 · 아래에, 분기는 왼쪽에 · 오른쪽에, 양쪽에 늘 표시, "이전 · 다음 다이어그램" | 메인테이너 (2026-11-28 inbox), M83 W1 1번 | 로컬 앱에 있음(정리 남음: UX 설계에 "들어가는 자리" 그림, 사용법 본문과 키 표 다시 생성(`manual-shots`), `reason.defaultBranchFixed`도 "맨 오른쪽"으로) | `d3cfe48` |
| 흐린 메뉴 항목: 더 옅게, hover 없음, 까닭 툴팁(D3) · 정보 창 맨 위에 로고(A1) | 메인테이너 (2026-11-26, inbox), M74 | 사이트에 있음 (정보 창은 128px 로고 + 문자 로고, 폭 440px, [[ux-decisions\|DD1 · AL1]]) | `65e415f` `28e6c3e` `c30fc83` |
| 맨 처음 · 맨 끝에 놓기: 헤더 아래 띠 · 다이어그램 아래 띠(P2), 마지막 블록이 무엇이든 | 메인테이너 (2026-11-26, inbox), M75 | 사이트에 있음 ([[ux-decisions\|DE1]]) | `a1141c1` |
| 툴바의 확대 · 축소: 드롭다운 대신 [돋보기−] 100% [돋보기+], 숫자를 누르면 100% | 메인테이너 (2026-11-27), M76 Z1 | 사이트에 있음 | `a46a00d` `6909621` |
| 리팩토링: R1 ~ R5 모두(웹 셸 · 편집 명령 · 세션 · 캔버스 · create-editor), 공통 후보는 웹 안에, R4 뒤 바뀐 블록만 DOM 반영. Obsidian 베타 전을 앞당겨 바로 | 메인테이너 (2026-11-27), M77 | 사이트에 있음 (R1 ~ R5, 바뀐 블록만 DOM 반영 `ac93179`, AT-05는 2/8 합격) | `376c964` `85b7380` `bddaca6` `0191859` `000d015` |
| 사이트 소개를 영어 기본으로: `/about`은 `README.md`(영어), 한국어는 `/about/ko`, 맨 위에 언어 바꾸기 줄. 파일 형식 명세의 영어판은 웹 1.0 때, 나머지 문서는 한국어 + 안내 띠 | 메인테이너 (2026-11-27) | 사이트에 있음 (https://ariadnensd.com/about) | `04f7d8b` `fe8a45a` `b7ac6ec` |
| Directory 제출 준비: 플러그인 아이콘은 로고 큰 판(M78 I1), 표시 이름 `AriadneNSD`, 영어 README, claude.ai도 마켓플레이스로 설치(메인테이너가 설치해 써 봄) | 메인테이너 (2026-11-27), M78, [[0050-claude-skill-bundle-and-distribution\|ADR-0050]] | 사이트에 있음 ([v0.5.0](https://github.com/reddiana/AriadneNSD/releases/tag/v0.5.0). claude.ai는 push 직후 아직 "Ariadne nsd", 마켓플레이스를 다시 읽은 뒤 확인) | `cc7f442` `48e799a` `3089339` `3b9aa95` |
| 스킬: 공유 링크는 마크다운 링크 한 번만(코드 블록으로 되풀이하지 않음) | 메인테이너 (2026-11-27), [[ux-decisions\|SK2]] | 사이트에 있음 (v0.5.0, 메인테이너가 CLI에서 확인) | `f0d85e6` |

## 이번과 다음 세션에 할 것

- [ ] 메인테이너: Edge(와 쓰는 다른 브라우저 · 폰)에서 `https://ariadnensd.com/?nocount`를 한 번 열기 → [[06-web#5.2 방문 수]]
- [ ] 메인테이너: report@를 받는 Gmail에서 개인 Gmail로 자동 전달을 켜고 시험 메일 → Claude가 예약 작업(https://claude.ai/code/routines/trig_01J1zeLEEXPSFnWbga9aaxei)의 실행 기록 확인 → [[2026-11-22-04-gallery-spa-geeknews-mail]]
- [ ] GeekNews 글(https://news.hada.io/topic?id=37589)의 댓글을 보고 고칠 것 → 그다음 Show HN · Reddit(계정은 미리) → [[promotion]]
- [ ] 메인테이너: 페이스북 그룹에 올림(초안 5, 후보는 [[promotion#페이스북 그룹 후보]])
- [ ] LinkedIn 글(https://www.linkedin.com/feed/update/urn:li:activity:7530170940547289088/, 2026-11-22 다시 올림)의 댓글: 지금은 메인테이너가 앱 알림으로 보고, 부탁하면 Claude가 Chrome으로 한 번 읽고 답글 초안. Gmail 알림 메일로 정기 확인할지는 미룸(어느 Gmail 계정을 연결할지 — ariadnensd · reddiana, 2026-11-22 메인테이너)
- [ ] Anthropic Directory: 검증에서 "스크립트(`nsd.mjs`)는 Verified 조직만"으로 막힘 → 도메인 `ariadnensd.com` 증명(Cloudflare TXT, 지우지 않음), Verified 요청 CASE-44465F27(2026-11-27, Anthropic 사람이 검토). 답은 claude.ai/directory/manage/help의 Your cases에서(예약 작업 "Verified 답 확인"이 매일 09:00에 봄, 답이 오면 끔). 승인되면 제출 양식(저장소 폴더 `src/skills/ariadne-nsd/plugin`)을 다시 검증, 거절되면 스크립트 없는 판 · 우리 마켓플레이스만 가운데 고름 → [[2026-11-27-04-skill-directory]]
- [ ] 시간 테스트 T-0171 · T-1126: 2026-11-27 조용한 PC에서 `pnpm check` 통과. 다시 실패하면 그때 PC 부하부터 본다 → [[backlog#MVP 개발]]
- [ ] 메인테이너: 써 보며 [[outbox#확인해 주세요]]를 확인(바꿀 것만)
- [ ] 설계 대조의 중 206건 · 하 71건 → [[backlog#설계]]
- [ ] 메인테이너: C&C 그림(`docs/03-architecture/assets/*.drawio.svg`)을 draw.io로 고침 → 그 뒤 Claude가 [[01-architecture#3. 실행 중의 모습]]의 카탈로그 표와 맞춤
- [ ] AT-05: 기준 기기를 정해 다시 재고, 남은 여섯 명령(브라우저의 글자 재배치)을 어떻게 할지 → [[backlog#리팩토링]]
- [ ] 메인테이너: AT-05를 `https://ariadnensd.com/?perf`로 가진 기기에서 재고 기준 기기 정하기 → [[01-requirements#5.2 MVP의 인수 기준]]
- [ ] 메인테이너: Windows 알림을 다시 켤지(`.claude/settings.local.json`의 `hooks`를 비워 둠)
- [ ] 메인테이너: 앱이 "불러오는 중"에서 멈출 때 주소를 바로 열었는지, 사이트 · README 버튼을 거쳤는지 알려 주기 → [[defects]]
- [ ] 11-03 밤의 worktree 정리 → [[backlog#저장소 손질]]
- [ ] Firefox로 M12 열기 → [[outbox#정해 주세요]]

## 열린 질문이 있는 곳

원본은 각 문서의 미결정 절입니다: [[01-requirements#6. 미결정 사항]], [[02-interaction-rules#9. 미결정 사항]](정한 것은 [[ux-decisions]]), [[01-architecture#8. 위험과 검증이 필요한 사항]], [[04-obsidian-plugin#미결정 사항]], 제안됨 ADR → [[atelier/adr/README|ADR 목록]]
