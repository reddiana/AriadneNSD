---
title: Outbox
tags:
  - plan
updated: 2026-11-22
---

# Outbox

> [!abstract] 이 문서는
> **메인테이너의 답을 기다리는 것**만 모읍니다([[inbox]]와 짝). 항목은 답할 만큼만 적고 자세한 것은 링크에 있습니다.
> - **정해 주세요:** 메인테이너가 정해야 다음으로 갈 수 있는 것
> - **확인해 주세요:** Claude가 정해 놓고 확인받지 못한 것. "그대로"라고만 하셔도 됩니다
> - **알아만 두세요:** 답이 필요 없는 보고 가운데 둘 자리가 없는 것
> - 주제별로 묶습니다(요구사항 · 범위, 모델 · 파일 형식, 조작 · 키, 시각 디자인, 아키텍처 · 기술, 문서 · 저장소 · 일하는 방식, 이름 · 로고 · 라이선스).
> - 미룬 일은 [[backlog]], 프로토타입의 구멍은 [[prototype]], 로고 · 이름의 보고는 [[logo-source#남은 확인]] · [[names-and-registries]]에. 답을 받은 항목은 반영한 곳을 링크하고, 마무리 때 세션 기록으로 옮겨 지웁니다.

## 정해 주세요

### 아키텍처 · 기술

- [ ] 글자 폭 스파이크 M12를 Firefox(기기가 있으면 Safari)에서 열어 보기. 저장 파일에는 영향 없고, 그 브라우저의 글자 폭이 셈한 폭에서 얼마나 벗어나는지만 봄 → [[sketchbook]] M12 · M13

### 문서 · 저장소 · 일하는 방식

- [ ] 깨진 모델 JSON을 붙였을 때의 오류 글(`AriadneNSD could not open the pasted text (…)`)도 안내서 `llms.txt`에 한 줄 더할까? 지금은 공유 링크의 오류 글만 말함 → [[ux-decisions]] JP2

## 확인해 주세요

### 2026-11-03 세션 06에 Claude(에이전트)가 정한 것

- [ ] ADR-0041(그림 문구의 언어)의 세부: 모르는 언어 값, 선택지 차례, 영어 문구, 설정 창의 자리 → [[0041-drawing-locale-in-document|ADR-0041]]
- [ ] US1(저장하지 않은 새 문서)의 질문 문구 · 버튼 · 묻는 때 · 예제 모달 문구 → [[ux-decisions#US1. 저장하지 않은 새 문서를 두고 다른 문서를 열 때|US1]]
- [ ] 커버리지를 세는 방식(여러 줄 문장 안의 줄은 가장 안쪽 문장으로) → [[coverage]]
- [ ] 시간을 재는 T-0007(AT-05)은 커버리지를 기록할 때만 건너뜀 → [[02-test-architecture#5. 도구와 CI]]
- [ ] 새 Method로 빼기에서 Claude가 정해 둔 것 → M54의 표(https://claude.ai/artifact/J11wWw9DVKUZkUP2ubT94n, `journal/assets/2026-11-03-extract-method-study.html`)
- [ ] 브라우저 안의 문서에서 Claude가 정해 둔 것 → M55의 표(https://claude.ai/artifact/CLz2Y1yXLYJfdn6q27Y1PV, `journal/assets/2026-11-03-browser-storage-study.html`). BS1이 2번이 되어 메뉴 이름과 US1 버튼은 구현 때 맞춤
- [ ] 새 Method로 빼기를 구현하며 에이전트가 정한 것(`5f543b4`) → [[ux-decisions#XM3. 헤더 없는 다이어그램에서 블록에 m은 고르는 목록|XM3]]의 덧붙임

### 2026-11-04 11-03 밤에 에이전트들이 만든 기능의 추천안 (써 보고 정해 주세요)

메인테이너가 추천안을 받아들여 0.2.0에 넣은 것. 바꾸고 싶은 것만 알려 주세요 → [[2026-11-03-06-agents-bugs-locale-extract#매듭 뒤 (2026-11-03 밤 ~ 11-04)]]

- [ ] 접기 · 호출 블록: FD1 ~ FD10, CB3 ~ CB11 → [[ux-decisions#2026-11-03 접기 · 호출 블록 (밤사이 에이전트가 만듦, 메인테이너가 추천안을 받아들임)|접기 · 호출 블록의 절]]
- [ ] 블록 텍스트의 언어 · 구문 강조: TK1 ~ TK3, SY1 · SY2 → [[ux-decisions#2026-11-03 블록 텍스트의 언어 · 구문 강조 (밤사이 에이전트가 만듦, 메인테이너가 추천안을 받아들임)|언어 · 구문 강조의 절]]
- [ ] 테마 · 고대비: TM1 ~ TM5 → [[ux-decisions#2026-11-03 테마 · 고대비 (밤사이 에이전트가 만듦, 메인테이너가 추천안을 받아들임)|테마 · 고대비의 절]]
- [ ] 공유 링크 · 보기 모드: SH1 ~ SH6 → [[ux-decisions#2026-11-03 공유 URL · 보기 모드 (밤사이 에이전트가 만듦, 메인테이너가 추천안을 받아들임)|공유 URL · 보기 모드의 절]]
- [ ] 내보내기 · 파일 검사: XS1, PD1 ~ PD3, PT1, DC1, OL1 → [[ux-decisions#2026-11-03 내보내기 · 파일 검사 (밤사이 에이전트가 만듦, 메인테이너가 추천안을 받아들임)|내보내기 · 파일 검사의 절]]
- [ ] 브라우저 안의 문서를 구현하며 에이전트가 정한 것(`8f6dbca`): 편집기 안의 열기 · 저장 모달, 겹치는 이름은 "이름 (2)", 최근 파일의 "(브라우저)" 등 → [[06-web#1.3 브라우저 문서]]

### 2026-11-10 세션에 Claude(에이전트)가 정한 것

- [ ] 열지 못한 링크 · JSON의 모달과 "오류 내용 복사", 사용법 `#ai` 꼭지 → [[ux-decisions#LG6. 열지 못한 링크의 까닭|LG6]], [[06-web#3.1 LLM · 에이전트를 위한 안내서]]
- [ ] 화면을 조작하는 AI에게 보이는 숨은 안내문과 도움말 메뉴 "AI에게 그려 달라고 하기" → [[ux-decisions#LG7. 화면을 조작하는 AI에게도 안내가 보이게|LG7]]
- [ ] AT-05 점검 모드 `?perf`의 명령 · 자리 · 횟수 · 합격 기준 → [[06-web#9. 점검 모드]]
- [ ] 정합성 장치: 규칙 C1 ~ C10, CI는 커밋 범위 전체 · 훅은 커밋마다, 값을 비교할 수 있는 것은 테스트로 → [[07-coding-guide#13. 문서와 코드의 정합성]]

### 2026-11-17 세션에 Claude(에이전트)가 정한 것

- [ ] C&C 뷰의 내용(컴포넌트 16개, 커넥터 C-01 ~ C-26, 한눈에 그림, 선 색, 시스템 컨텍스트의 문단) → [[01-architecture#3. 실행 중의 모습]]
- [ ] BUG-16: 펼친 접기 영역의 이름 띠 테두리를 구조선 색(`line.structure`)으로 → [[defects#BUG-16]]

### 2026-11-17 마무리 뒤 미룬 결정 (Claude가 최선으로 적용함)

→ [[2026-11-17-01-cc-view#마무리 뒤]]

- [ ] 측정 구간 여덟과 예산, 합격은 전체 p95로만, "개발 기계 + CPU 4배 감속" → [[03-quality-attribute-scenarios#QA-07 편집 반응 시간]]
- [ ] AT-05를 고칠 길: "바뀐 블록만 DOM에 반영"을 할지(구조를 바꾸는 일) → [[backlog#MVP 개발]]
- [ ] 목표의 근거와 21쌍의 중요도 × 난이도 → [[03-quality-attribute-scenarios#1. 목록]]
- [ ] 민감점 S-01 ~ 05 · 상충점 T-01 ~ 05의 목록과 ID 방식 → [[01-architecture#8.1 민감점]]
- [ ] 결정 지도와 추적의 배정 → [[01-architecture#10.1 품질 목표별 결정 지도]]
- [ ] C-07 · C-09의 출발을 세션으로(ID는 그대로), 실패 흐름의 `EditorHandle.open`은 커넥터 ID 없이 → [[01-architecture#3.4 커넥터]]

### 2026-11-18 세션에 Claude(에이전트)가 정한 것

- [ ] IE1: `Shift`+`L`로 라벨을 편집할 때는 블록 하이라이트를 유지 → [[ux-decisions#IE1. 인라인 에디터가 열린 동안의 선택 하이라이트|IE1]]
- [ ] SL1: 기울기 0.25, 빈 상자도 기울임 → [[ux-decisions#SL1. 외곽선과 PDF도 기울여 그린다|SL1]]
- [ ] ADR-0046: 풀기는 접힘을 이어받고, 호출 대상을 바꾸면 버리고, 복사는 이어받지 않음 → [[0046-site-folding-in-view|ADR-0046]]
- [ ] CB13: 분기 전체가 Method의 접기 영역 하나이면 그 접기 영역을 접음 → [[ux-decisions#CB13. 펴 보인 곳의 접힘은 그 자리의 것|CB13]]
- [ ] 호출 블록 `lost`의 `file?` 필드가 필요한지 → [[01-model]]
- [ ] 풀기 뒤의 선택(분기 라벨 · 빈 default 칸이면 나온 블록들, 접기 영역이면 그 영역) → [[ux-decisions]]
- [ ] 풀기를 분기 라벨 · 접기 영역 · 빈 default 칸의 컨텍스트 메뉴에도 보임 → [[ux-decisions]]
- [ ] 결과 기호는 문서 설정에서 테마 바로 앞, 보기 전용 문서에서는 거절 → [[ux-decisions]]
- [ ] `pnpm check`가 실패하는 채로 push함(T-0171 · T-1126은 나란히 돌 때만 실패, CI · Pages는 성공) → [[2026-11-18-01-docs-language-audit#마지막 검사 (2026-11-19 새벽, 커밋 aa2c710)]]

### 2026-11-21 세션에 Claude(에이전트)가 정한 것

- [ ] TB3: 이유는 첫 감싸기 명령의 것, 흐린 동안에도 접근성 이름은 "감싸기", 메뉴가 열린 채 흐려지면 닫음 → [[ux-decisions#TB3. 감쌀 것이 없을 때의 감싸기 ▾|TB3]]
- [ ] M57: 화면 문구를 용어 규칙에 맞춤, `#ns1.` 링크도 알아봄, 선택 없이도 붙여넣기가 흐리지 않음, `Ctrl`+`Enter` 열기, 사용법에서 뺀 항목 → [[ux-decisions]] JP1 ~ RQ2
- [ ] CB14 · ADR-0047: "이미 복사함" 표시 `b4/`, 복사의 실행 취소, 예전 파일은 열 때 복사 → [[0047-copy-method-folds-at-first-open|ADR-0047]]
- [ ] UN1 · ADR-0048: 접고 펴기의 실행 취소 단계, 저장 안 됨(●) 표시, 대상이 아닌 것 → [[0048-folding-is-undoable|ADR-0048]]
- [ ] 펴 보인 곳에서 다른 자리를 `Shift`+클릭하면 그 블록만 선택, 펴 보인 블록은 끌어 옮기지 않음 → [[02-interaction-rules]]
- [ ] 토큰 절약으로 CLAUDE.md · outbox · status를 줄임(`5bd7010` `2eabe73` `c7bfcd6`): 빠진 것이 없는지 한 번 훑어보기. CLAUDE.md는 18KB에서 멈춤(긴 절차를 how-we-work로 옮기면 2 ~ 3KB 더 줄지만 그때마다 따로 읽어야 함) → [[2026-11-21-02-clear-and-tokens]]
- [ ] 호출 블록 변경에서 에이전트가 정한 것: 새 Method는 마지막 Method 뒤, 만든 뒤 헤더를 선택, 같은 이름의 Method가 있으면 잇기, `readOther`를 모든 셸에서 뺌, 예전 파일의 `lost` · `external`은 저장하면 바이트가 바뀜 → [[ux-decisions#CB15. Method 만들기|CB15]], [[0049-call-without-method-is-named|ADR-0049]]
- [ ] Method 풀어 넣고 지우기에서 에이전트가 정한 것: 직접 재귀만 거절(서로 호출은 허용), 뒤의 선택, 호출 없으면 흐리게, 영어 알림 문구 → [[ux-decisions#CB16. Method 풀어 넣고 지우기|CB16]]
- [ ] 다른 탭이 편집 중일 때의 라벨 · 툴팁 문구(하단 상태 줄의 라벨은 그대로) → [[ux-decisions#RO1. 다른 탭이 편집 중일 때의 보기만 하는 중|RO1]]
- [ ] 정보 창: 이름표 아래에 전체 주소 → [[ux-decisions]] W4
- [ ] Claude skill에서 에이전트가 정한 것: 번들 방식(파일 하나를 커밋, 실행 중 스키마 검사 없음), 이름 없을 때 첫 Method 이름, 마켓플레이스 이름 `ariadne-nsd`(설치 `ariadne-nsd@ariadne-nsd`), manifest의 author `reddiana` · `Apache-2.0` · `development`, 버전은 plugin.json에만 → [[0050-claude-skill-bundle-and-distribution|ADR-0050]], [[07-claude-skill]]

### 2026-11-22 세션에 Claude(에이전트)가 정한 것

- [ ] README의 "Claude 스킬" 절의 문구와 자리(웹 베타 상자 아래) → [README](https://github.com/reddiana/AriadneNSD#claude-스킬)
- [ ] BUG-19의 고침: 화면의 선 굵기를 화면 픽셀의 정수배로 올림(150%에서 1px 선이 2px), 좌표는 맞추지 않음, 대각선은 그대로 → [[defects#BUG-19]], [[04-visual-design]]
- [ ] 알고리즘 갤러리에서 에이전트가 정한 것: 묶음(앱 예제 이진 탐색 · 퀵정렬 · 병합 정렬 · 다익스트라는 고전, Raft는 어려운 것, 미로는 재미), `#` 없으면 다익스트라, 화살표 키는 기록을 덮어씀, 어두운 테마에서도 흰 바탕, 새 OG 그림, 사용법 "예제" 꼭지에 링크(앱 도움말 메뉴에는 없음) → [[2026-11-22-02-promotion-gallery]], http://localhost:8093/gallery/ko/ (push 뒤 https://ariadnensd.com/gallery/ko/)
- [ ] 사용법 동영상에서 정한 것: 동영상 아래 짧은 설명 둘과 안내 한 줄의 문구, 탭 폭 680px, 마우스판의 딱지 자리(상태 표시줄 위 오른쪽) → [[ux-decisions#MV1. 사용법의 힙 정렬 동영상|MV1]], https://ariadnensd.com/manual/ko/#tour
- [ ] 갤러리로 가는 링크에서 에이전트가 정한 것: 앱 도움말 메뉴에 구분선 · 단축키 없음, 아래 항목은 한 칸씩 내려감, 영어 이름 "Algorithm gallery" → [[ux-decisions#GL2. 갤러리로 가는 링크|GL2]]

## 알아만 두세요

지금은 없습니다.
