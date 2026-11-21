---
title: 2026-11-22 v0.4.0과 스킬을 처음 써 보기, 정수가 아닌 배율의 선 굵기
tags:
  - session
date: 2026-11-22
---

# 2026-11-22 v0.4.0과 스킬을 처음 써 보기, 정수가 아닌 배율의 선 굵기

"스킬이 배포되었나요?"로 시작했다. 마켓플레이스는 main에 있었지만 Release의 zip은 없어서 v0.4.0을 냈다. 메인테이너가 스킬을 처음 설치해 써 보며 문장 묶기 규칙을 바로잡았고, inbox의 두꺼운 외곽선 결함을 110%에서 재현해 고쳤다.

## 논의 흐름

1. **배포 상태.** 마켓플레이스(`.claude-plugin/marketplace.json`)는 main에 있었고, v0.3.0의 Release에는 첨부가 없었다(`release.yml`이 그 뒤에 생김).
2. **v0.4.0.** 메인테이너: "판을 올리죠". [[dr-0018-release-stages|DR-0018]]대로 `0.y`를 올림. 패키지 여섯 · `version.ts` · `plugin.json`을 0.4.0으로, "이 버전에서 바뀐 것"을 스킬 안내로(`dc6d15a`). 전체 검사 통과(T-0007만 나란히 돌 때 101.4 ms, 홀로 통과). Pre-release를 펴내자 `release.yml`이 `ariadne-nsd.zip`(648 KiB)을 붙였다 → [v0.4.0](https://github.com/reddiana/AriadneNSD/releases/tag/v0.4.0)
3. **claude.ai 플러그인 검색.** 카탈로그에서 찾아보니 없음. 검색되는 것은 심사를 거친 "Anthropic Directory"뿐이라, 실리려면 제출 · 심사가 필요하다고 답했다.
4. **설치 방법.** claude.ai(zip 업로드), Claude Code(마켓플레이스 또는 `~/.claude/skills/`), API를 설명. 데스크톱 앱에서는 `/plugin …`이 플러그인 창을 열어, 창에서 추가하거나 터미널에서 `claude plugin …`으로 한다는 것을 알게 됐다. 메인테이너가 설치해 처음으로 스킬로 피보나치를 그렸다.
5. **문장마다 블록.** 메인테이너: "여러 명령이 블록 하나에 줄바꿈으로 들어가 있어요. 이것이 우리가 의도한 것인가요?" 에이전트가 정한 규칙(함께 한 가지 일을 하는 짧은 문장은 묶음)이었다. 선택 창에서 "문장마다 블록"을 골라 `code-to-blocks.md` · `SKILL.md`를 고침(`3d59f98`). 설치된 0.4.0에는 다음 판부터.
6. **README.** 메인테이너의 요청으로 "Claude 스킬" 절(Claude Code · claude.ai 설치)을 더함(`fcf3ca7`). 스킬로 다익스트라 · 벨만-포드도 그림(`journal/assets/2026-11-22-*.ns.svg`).
7. **두꺼운 외곽선.** 로컬에서 재현되지 않다가, 사이트 · Chrome에서 피보나치를 열고 앱을 110%로 키우니 "확대를 하니 더 많이 생기네요". 원인은 겹친 선이 아니라 1.1 화면 픽셀짜리 선을 `crispEdges`가 1칸 또는 2칸으로 반올림하는 것(에이전트가 재어 확인: 자판기 110%의 가로선 1,085곳 가운데 384곳이 2px → 고친 뒤 4곳). 화면에서만 굵기를 화면 픽셀의 정수배로(`70deffa`, T-1480 ~ T-1483), 저장 파일은 그대로. 메인테이너가 로컬에서 확인: "고쳐졌네요" → BUG-19, [[pixel-aligned-lines]]

## inbox에서 옮긴 원문

6\. 결함

## 웹 베타
- 외곽선이 두껍게 나오는 경우가 있음
	- 예제의 UART 수신 인터럽트
	  ![[2026-11-21-thick-outline-uart-isr.png]]
	- 예제의 이진탐색
	  ![[2026-11-21-thick-outline-binary-search.png]]
	- 예제의 퀵소트
	  ![[2026-11-21-thick-outline-quicksort.png]]
	- 예제 자판기
	  ![[2026-11-21-thick-outline-vending-machine.png]]
	- 예제 엘리베이터
	  ![[2026-11-21-thick-outline-elevator.png]]

## 결정

- v0.4.0 (웹 베타 둘째 판, 스킬의 zip 포함)
- 스킬: 처리 블록 하나에 문장 하나, `
`은 긴 문장 · 조건을 나눌 때만 → [[ux-decisions]]
- 화면의 구조선 굵기는 화면 픽셀의 정수배로 → [[04-visual-design]], [[defects#BUG-19]]

## 발견한 위험

- 스킬 규칙의 변경은 새 판을 내야 설치한 사람에게 간다(마켓플레이스 · zip 모두 판 번호로 업데이트).
- BUG-19의 고침은 headless Chrome으로만 쟀다. Windows 디스플레이 배율, 모니터를 옮길 때, Firefox · Safari, 어두운 · 고대비 테마는 보지 못했다. 선이 반 픽셀까지 굵어질 수 있다(150%에서 2px).
- co-change 훅은 `Co-change-skip`의 규칙 ID가 틀리면 amend 때 옛 메시지까지 읽어 막는다. soft reset 뒤 다시 커밋함.

## 다음 할 일

- 스킬 규칙 변경을 담은 다음 판(0.5.0)을 언제 낼지
- claude.ai에 zip 올려 써 보기, Anthropic Directory에 제출할지
- 시간 테스트 T-0171 · T-1126 안정시키기(그대로)
