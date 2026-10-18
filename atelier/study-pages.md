---
title: 시안과 스파이크
tags:
  - ariadne-nsd
  - plan
updated: 2026-10-17
---

# 시안과 스파이크

> [!abstract] 이 문서는
> 지금까지 만든 **시안 페이지, 스파이크, 프로토타입의 목록**입니다. 주소와 저장소의 사본, 거기서 무엇을 정했는지를 한 줄씩 적습니다.
> - GitHub 방문자도 이 문서로 옵니다. "무엇을 다루나" 칸은 방문자를 위한 설명입니다.
> - 새 페이지를 만들거나 주소가 바뀌면 Claude가 이 표를 고칩니다. 답을 기다리는 페이지는 [[status#바로 가기]]에도 올립니다.
> - **견준 안과 그림, 고른 과정은 시안 페이지에 둡니다.** md 문서에는 정한 것과 까닭만 몇 줄 적고 이 표의 페이지를 가리킵니다(2026-10-14, 메인테이너: "이게 md에 들어간다면 시안의 다른 내용도 md에 들어갈게 많잖아요").
> - 2026-10-14에 [[status]]의 "바로 가기"에서 옮겨 왔습니다.
> - **페이지마다 ID(`M01` …)가 있습니다**(2026-10-17, 메인테이너: "시안에도 ID를 부여해주세요"). 시안 · 스파이크 · 프로토타입이 한 번호 줄을 쓰고, 새 페이지는 다음 번호를 받습니다. 페이지의 제목에도 붙어 있습니다. 시안 안의 선택지는 "M11의 T1"처럼 부릅니다.

| ID | 무엇 | 무엇을 다루나 | 주소 | 저장소의 사본 |
| --- | --- | --- | --- | --- |
| M01 | **프로토타입** (요구사항 점검용) | 요구사항이 맞는지 써 보려고 만든 것입니다. 블록을 넣고, 감싸고, 접어 볼 수 있습니다. 제품이 아니고 버릴 코드입니다 | https://claude.ai/artifact/RuUjpc7YmCcbJXAdCeQiRG | `journal/assets/2026-10-10-ns-prototype.html` (브라우저로 직접 열어도 됨) |
| M02 | 색상 시안 (기본 스타일) | 기본 스타일의 바탕과 색조 | https://claude.ai/artifact/XVzT38DvGVir97z9j47Aaj | `journal/assets/2026-10-09-ns-color-study.html` |
| M03 | 영역 강조 시안 (없앤 기능) | 블록 묶음을 눈에 띄게 하는 법. 나중에 없앤 기능입니다 | https://claude.ai/artifact/MGnGUbUZ2gRbfGLmfqvTy7 | `journal/assets/2026-10-10-ns-region-highlight.html` |
| M04 | 로고 시안 (2026-10-10. 2026-10-14에 "미소" 단락을 더함) | 그림 로고의 안들, 미소의 선, 문자 로고의 글자 모양 | https://claude.ai/artifact/JZBq5xrGFdfhQzcRNgmiyD | `journal/assets/2026-10-10-logo-concepts.html` |
| M05 | Event와 Method 시안 (2026-10-11, 결정함: H3 · A1 · C1 · S2) | 이벤트 처리기와 부를 수 있는 다이어그램을 가르는 머리의 모양 | https://claude.ai/artifact/AAXhC9eSan97yNw6S2HXB8 | `journal/assets/2026-10-11-event-method-study.html` |
| M06 | 다이어그램 배치 시안 (2026-10-11, 결정함: L4 + 순서 바꾸기) | 한 문서에 다이어그램 여러 개를 놓는 법 | https://claude.ai/artifact/NMZH1BMT42KMJAd5HcaQkW | `journal/assets/2026-10-11-diagram-layout-study.html` |
| M07 | 호출 블록 글자 시안 (2026-10-11, 결정함: A2) | 호출 블록에 이름, 인자, 결과를 적는 법 | https://claude.ai/artifact/TACyh94j23GHzKZMYq4252 | `journal/assets/2026-10-11-call-block-text-study.html` |
| M08 | 호출 블록 펴 보기 시안 (2026-10-11, 결정함: Q13~Q16 → [[05-ux-decisions]]) | 부르는 다이어그램을 그 자리에 펴서 보여 주는 법 | https://claude.ai/artifact/SRXMaLyK5KFCbFiRw7iwwL | `journal/assets/2026-10-11-call-expand-study.html` |
| M09 | UX 규칙 시안 (2026-10-11, 답을 기다림: [[05-ux-decisions]] Q1 · Q2 · Q4~Q6 · Q8 · Q11 · Q12 · Q19 · Q20 · [[requirements-review]] Q18, Q22, Q23) | 고치기, 넣기, 옮기기, 고르기의 규칙을 하나로 맞추는 물음들 | https://claude.ai/artifact/A7sWbwCA4NFC8qSZg58d3y | `journal/assets/2026-10-11-ux-rules-study.html` |
| M10 | 문자 로고 바탕 시안 (2026-10-11) | 밝은 화면과 어두운 화면 모두에서 읽히는 문자 로고 | https://claude.ai/artifact/VmPiuJk7cLMYDMA2ePKKs7 | `journal/assets/2026-10-11-wordmark-any-background.html` |
| M11 | 접기 영역 테두리 시안 (2026-10-13, 결정함: T1 틈 1px · T2 가는 점선 · P1 똑같이 · P2 줄어듦. 답을 기다림: 확인 1~4 → [[debt#확인해 주세요]]) | 접기 영역의 테두리와, 펴 보인 곳에만 두는 접기 영역 | https://claude.ai/artifact/PW426nxL2ScUNG5aPzxbW2 | `journal/assets/2026-10-13-fold-border-study.html` |
| M12 | 글자 폭 스파이크 (2026-10-13, 결정함: 글꼴 번들 · F1 2번 → [[0026-bundled-font-metrics\|ADR-0026]]. 답을 기다림: Firefox에서 열어 보기) | 같은 글자가 브라우저마다 같은 폭으로 재어지는지 재어 본 페이지 | https://claude.ai/artifact/FNoS6pjV1zjieBgMwN8HxT | `journal/assets/2026-10-13-text-width-spike.html` (만드는 스크립트 `…-spike-build.py`, 재는 스크립트 `…-spike-measure.mjs`) |
| M13 | 아키텍처 전 물음 시안 (2026-10-13, 결정함: A4 1 · A6 3 · A8 1 · A8-가 1) | 저장된 그림의 색, 실행 취소의 대상 같은 물음 | https://claude.ai/artifact/Jez6xT5qB9HbdoN1aRSKSn | `journal/assets/2026-10-13-before-architecture-study.html` |
| M14 | UX 문서 구조 시안 (2026-10-17, 결정함: S 1번 목적별 다섯) | `docs/02-ux-design`의 세 문서가 생긴 내력과 문제, 나누는 안 셋 | https://claude.ai/artifact/KWD4NzTgixXj7bdkhFiU3D | `journal/assets/2026-10-17-ux-docs-structure-study.html` |
| M17 | 테마 시안 (2026-10-17, 결정함: TH1 1번 문서마다 · TH2 1번 화면 색은 따로) | 테마를 그림의 색 묶음으로 보고, 누가 고르는지와 편집 화면의 색도 바꾸는지 | https://claude.ai/artifact/CABapWNP4NnQupcmTpwyZf | `journal/assets/2026-10-17-theme-study.html` |
| M18 | 호출 대상 시안 (2026-10-17, 결정함: CB1 1번 이름을 적는 호출 블록 · CB2 1번 파일과 Method를 가리킴) | 부를 Method가 같은 문서에 없을 때(라이브러리 함수, 다른 파일의 Method) 호출 블록을 어떻게 하는지 | https://claude.ai/artifact/RXopHw9gKu4hmz5GvFo6Vx | `journal/assets/2026-10-17-call-target-study.html` |
| M19 | 접기 영역 색 시안 (2026-10-17, 결정함: B · S1 접기 영역은 파랑, 고른 표시는 주황. 처음엔 S3 녹색을 골랐다가 바꿈) | 펴진 접기 영역의 테두리 색 후보를 고른 표시의 파랑과 함께 견줌 | https://claude.ai/artifact/R6G68CKoUa8aKsj8rhsRW9 | `journal/assets/2026-10-17-fold-color-study.html` |
| M20 | 아키텍처 제안 확인 (2026-10-17, 결정함: A1 · A2 · A3 · A4 1번, A5 1번이되 2번으로 바꾸기 쉽게 → ADR-0029 · 0030, A6 1번 → ADR-0031. 답을 기다림: A7) | [[03-architecture#8. 확인받지 못한 제안]]의 일곱 가지를 대안과 나란히 그림으로. A6은 다른 문서 읽기와 설정 보관을 더한 고친 제안 | https://claude.ai/artifact/R8RJxg8V1qweiMfusMKk87 | `journal/assets/2026-10-17-architecture-proposals-study.html` |
| M21 | 결정 기록 나누기 시안 (2026-10-17, 결정함: DR1 · DR2 · DR3 모두 1번 → [[dr-0001-split-decision-records|DR-0001]]) | ADR은 아키텍처만 남기고 다른 결정을 같은 구조의 기록으로 나누는 법: 이름과 자리, 옮기는 ADR의 번호, 애매한 넷 | https://claude.ai/artifact/6rrnQ2NBf5kWYXkJkrC6kM | `journal/assets/2026-10-17-decision-records-study.html` |

- **시안과 스파이크 페이지는 CC BY 4.0입니다**(프로토타입은 Apache-2.0). 페이지마다 맨 아래에 안내가 있습니다 → [[dr-0010-study-pages-cc-by|DR-0010]]. 안내는 `journal/assets/2026-10-14-add-license-note.py`로 넣습니다. 새 시안을 만들면 이 스크립트를 한 번 돌립니다. claude.ai의 열두 페이지도 2026-10-14에 안내가 든 판으로 다시 올렸습니다.
- **방문자에게는 claude.ai의 공개 링크로 보여 줍니다**(2026-10-14, 메인테이너: ""나"로 합시다"). 페이지마다 메인테이너가 Share 메뉴에서 "링크를 가진 누구나"로 바꿉니다. Claude는 공유 설정을 바꿀 수 없습니다. 견준 다른 길은 GitHub Pages였습니다.
- 공개한 페이지는 Claude가 새 판을 올리는 순간 방문자에게도 보입니다. 고치는 도중의 판도 보입니다. 새 판을 올려도 공개는 유지됩니다(2026-10-14에 게시 결과로 확인).
- 2026-10-14에 메인테이너가 그때까지의 시안을 공개로 바꿨습니다("시안들은 이미 공개로 바꿨습니다"). 저장소 맨 위 `README.md`에는 프로토타입의 주소와 이 문서의 링크만 둡니다(2026-10-14, 대문이 길어져서 목록을 이리로 모음). 새 페이지를 만들면 Claude가 "공개로 바꿔 주세요"라고 알리고 이 표에 줄을 더합니다.
- 저장소의 사본은 브라우저로 직접 열어도 됩니다. 스파이크 페이지를 만들고 재는 스크립트도 같은 폴더(`journal/assets/`)에 있습니다.
- **M15** Obsidian에서 `.ns.svg`만 가로채는 스파이크(2026-10-10)는 페이지가 아니라 플러그인 코드입니다: `journal/assets/2026-10-10-obsidian-spike-main.js`
- **M16** 글꼴 추리기 스파이크(2026-10-13)는 Node 스크립트입니다: `journal/assets/2026-10-13-font-subset-spike.mjs`
