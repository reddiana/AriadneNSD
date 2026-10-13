---
title: 시안과 스파이크
tags:
  - ariadne-nsd
  - plan
updated: 2026-10-14
---

# 시안과 스파이크

> [!abstract] 이 문서는
> 지금까지 만든 **시안 페이지, 스파이크, 프로토타입의 목록**입니다. 주소와 저장소의 사본, 거기서 무엇을 정했는지를 한 줄씩 적습니다.
> - 새 페이지를 만들거나 주소가 바뀌면 Claude가 이 표를 고칩니다. 답을 기다리는 페이지는 [[status#바로 가기]]에도 올립니다.
> - **견준 안과 그림, 고른 과정은 시안 페이지에 둡니다.** md 문서에는 정한 것과 까닭만 몇 줄 적고 이 표의 페이지를 가리킵니다(2026-10-14, 메인테이너: "이게 md에 들어간다면 시안의 다른 내용도 md에 들어갈게 많잖아요").
> - 2026-10-14에 [[status]]의 "바로 가기"에서 옮겨 왔습니다.

| 무엇 | 주소 | 저장소의 사본 |
| --- | --- | --- |
| **프로토타입** (요구사항 점검용) | https://claude.ai/artifact/RuUjpc7YmCcbJXAdCeQiRG | `journal/assets/2026-10-10-ns-prototype.html` (브라우저로 직접 열어도 됨) |
| 색상 시안 (기본 스타일) | https://claude.ai/artifact/XVzT38DvGVir97z9j47Aaj | `journal/assets/2026-10-09-ns-color-study.html` |
| 영역 강조 시안 (없앤 기능) | https://claude.ai/artifact/MGnGUbUZ2gRbfGLmfqvTy7 | `journal/assets/2026-10-10-ns-region-highlight.html` |
| 로고 시안 (2026-10-10. 2026-10-14에 "미소" 단락을 더함) | https://claude.ai/artifact/JZBq5xrGFdfhQzcRNgmiyD | `journal/assets/2026-10-10-logo-concepts.html` |
| Event와 Method 시안 (2026-10-11, 결정함: H3 · A1 · C1 · S2) | https://claude.ai/artifact/AAXhC9eSan97yNw6S2HXB8 | `journal/assets/2026-10-11-event-method-study.html` |
| 다이어그램 배치 시안 (2026-10-11, 결정함: L4 + 순서 바꾸기) | https://claude.ai/artifact/NMZH1BMT42KMJAd5HcaQkW | `journal/assets/2026-10-11-diagram-layout-study.html` |
| 호출 블록 글자 시안 (2026-10-11, 결정함: A2) | https://claude.ai/artifact/TACyh94j23GHzKZMYq4252 | `journal/assets/2026-10-11-call-block-text-study.html` |
| 호출 블록 펴 보기 시안 (2026-10-11, 결정함: Q13~Q16 → [[02-ux-design]]) | https://claude.ai/artifact/SRXMaLyK5KFCbFiRw7iwwL | `journal/assets/2026-10-11-call-expand-study.html` |
| UX 규칙 시안 (2026-10-11, 답을 기다림: [[02-ux-design]] Q1 · Q2 · Q4~Q6 · Q8 · Q11 · Q12 · Q19 · Q20 · [[requirements-review]] Q18, Q22, Q23) | https://claude.ai/artifact/A7sWbwCA4NFC8qSZg58d3y | `journal/assets/2026-10-11-ux-rules-study.html` |
| 문자 로고 바탕 시안 (2026-10-11) | https://claude.ai/artifact/VmPiuJk7cLMYDMA2ePKKs7 | `journal/assets/2026-10-11-wordmark-any-background.html` |
| 접기 영역 테두리 시안 (2026-10-13, 결정함: T1 틈 1px · T2 가는 점선 · P1 똑같이 · P2 줄어듦. 답을 기다림: 확인 1~4 → [[debt#확인해 주세요]]) | https://claude.ai/artifact/PW426nxL2ScUNG5aPzxbW2 | `journal/assets/2026-10-13-fold-border-study.html` |
| 글자 폭 스파이크 (2026-10-13, 결정함: 글꼴 번들 · F1 2번 → [[0026-bundled-font-metrics\|ADR-0026]]. 답을 기다림: Firefox에서 열어 보기) | https://claude.ai/artifact/FNoS6pjV1zjieBgMwN8HxT | `journal/assets/2026-10-13-text-width-spike.html` (만드는 스크립트 `…-spike-build.py`, 재는 스크립트 `…-spike-measure.mjs`) |
| 아키텍처 전 물음 시안 (2026-10-13, 결정함: A4 1 · A6 3 · A8 1 · A8-가 1) | https://claude.ai/artifact/Jez6xT5qB9HbdoN1aRSKSn | `journal/assets/2026-10-13-before-architecture-study.html` |

- claude.ai의 페이지는 메인테이너만 열 수 있습니다(비공개). 방문자에게 공개하는 방법은 정하지 않았습니다 → [[debt#정해 주세요]]
- 저장소의 사본은 브라우저로 직접 열어도 됩니다. 스파이크 페이지를 만들고 재는 스크립트도 같은 폴더(`journal/assets/`)에 있습니다.
- Obsidian에서 `.ns.svg`만 가로채는 스파이크(2026-10-10)는 페이지가 아니라 플러그인 코드입니다: `journal/assets/2026-10-10-obsidian-spike-main.js`
- 글꼴 추리기 스파이크(2026-10-13)는 Node 스크립트입니다: `journal/assets/2026-10-13-font-subset-spike.mjs`
