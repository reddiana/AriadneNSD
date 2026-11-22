---
title: 2026-11-22 앱 예제를 플로차트로 그려 NS 차트와 비교
tags:
  - session
date: 2026-11-22
---

# 2026-11-22 앱 예제를 플로차트로 그려 NS 차트와 비교

"예제의 머지소트를 플로우차트로 그려주세요. 비교해서 보고 싶네요."로 시작했다. inbox는 비어 있었다.

## 논의 흐름

1. **머지 소트 하나.** 갤러리 그림(`merge-sort.ko.ns.svg`)과 손으로 그린 플로차트(ISO 5807 기호)를 나란히 둔 M71(https://claude.ai/artifact/GnWTuY9YT64qGgr3UsJbjp, `journal/assets/2026-11-22-merge-sort-flowchart.html`). 반복의 되돌아가는 선은 주황. NS 318 × 504, 플로차트 470 × 900. 가장 큰 차이는 while: NS는 몸통을 감싸 범위가 모양으로 보이고, 플로차트는 바깥으로 도는 선을 따라가야 함.
2. **"다른 예제도 플로차트로 그려 주세요."** 손으로 그리지 않고 블록 트리에서 플로차트를 자동 배치하는 스크립트를 에이전트에게 맡김 → M72(https://claude.ai/artifact/5nPfDniQytbeZvtJMdLwEo, `journal/assets/2026-11-22-example-flowcharts.html`), 예제 열 개, 버튼으로 하나씩. 스크립트 `src/packages/editor/scripts/example-flowcharts.script.ts`(`pnpm --filter @ariadne-nsd/editor example-flowcharts`, `2ea524b`).
	- return은 끝 단말, continue는 글자 단 연결자 원, Case는 판단 하나에서 가로 버스로 갈래. break는 예제에 없어 그려 보지 못함.
	- Playwright로 선 · 글자 · 도형의 겹침을 자동 검사해 없음. 엘리베이터 · Raft는 칸 안에서 가로로 스크롤.
	- `readme-images`가 scripts 폴더의 스크립트를 모두 돌리던 것을 자기 것만 돌게 이름을 붙임.
3. **"완료되면 마무리하고 pc 재부팅해주세요."** 마무리 뒤 1분 뒤 재부팅(`shutdown /r /t 60`, 취소 `shutdown /a`).

## 결정

- 없음(비교용 시안).

## 다음 할 일

- 메인테이너: M72를 보고 비교에서 느낀 것이 있으면 inbox에. 홍보(README · 소개 페이지의 "왜 NS 차트인가")에 쓸지는 그때 정함.
