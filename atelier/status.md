---
title: 현재 상태
tags:
  - ariadne-nsd
  - plan
updated: 2026-10-13
---

# 현재 상태

> [!abstract] 이 문서는
> **지금 어디에 있는지**를 한 화면으로 보여 줍니다. 세션을 시작할 때 Claude가 이 문서와 [[debt]]를 읽고 요약합니다.
> - 남은 할 일 전체는 [[backlog]], 메인테이너의 답을 기다리는 것은 [[debt]], 프로토타입의 상태와 리뷰 순서는 [[prototype]]에 있습니다.
> - 지나온 일은 세션 기록에 있습니다 → [[atelier/README#세션 기록 목록]]. 끝난 항목은 마무리 때 세션 기록으로 옮기고 여기서 지웁니다.

## 바로 가기
자주 여는 주소를 여기에 모읍니다. 주소가 바뀌거나 새 페이지가 생기면 Claude가 이 칸을 고칩니다.
| 무엇                                                    | 주소                                                | 저장소의 사본                                                        |
| ----------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| **프로토타입** (요구사항 점검용)                                  | https://claude.ai/artifact/RuUjpc7YmCcbJXAdCeQiRG | `journal/assets/2026-10-10-ns-prototype.html` (브라우저로 직접 열어도 됨) |
| 색상 시안 (기본 스타일)                                        | https://claude.ai/artifact/XVzT38DvGVir97z9j47Aaj | `journal/assets/2026-10-09-ns-color-study.html`                |
| 영역 강조 시안 (없앤 기능)                                      | https://claude.ai/artifact/MGnGUbUZ2gRbfGLmfqvTy7 | `journal/assets/2026-10-10-ns-region-highlight.html`           |
| 로고 시안                                                 | https://claude.ai/artifact/JZBq5xrGFdfhQzcRNgmiyD | `journal/assets/2026-10-10-logo-concepts.html`                 |
| Event와 Method 시안 (2026-10-11, 결정함: H3 · A1 · C1 · S2) | https://claude.ai/artifact/AAXhC9eSan97yNw6S2HXB8 | `journal/assets/2026-10-11-event-method-study.html`            |
| 다이어그램 배치 시안 (2026-10-11, 결정함: L4 + 순서 바꾸기) | https://claude.ai/artifact/NMZH1BMT42KMJAd5HcaQkW | `journal/assets/2026-10-11-diagram-layout-study.html` |
| 호출 블록 글자 시안 (2026-10-11, 결정함: A2) | https://claude.ai/artifact/TACyh94j23GHzKZMYq4252 | `journal/assets/2026-10-11-call-block-text-study.html` |
| 호출 블록 펴 보기 시안 (2026-10-11, 답을 기다림: [[02-ux-design]] Q13~Q16) | https://claude.ai/artifact/SRXMaLyK5KFCbFiRw7iwwL | `journal/assets/2026-10-11-call-expand-study.html` |
| UX 규칙 시안 (2026-10-11, 답을 기다림: [[02-ux-design]] Q1~Q12, Q17, Q19~Q21 · [[requirements-review]] Q18, Q22, Q23) | https://claude.ai/artifact/A7sWbwCA4NFC8qSZg58d3y | `journal/assets/2026-10-11-ux-rules-study.html` |
| 문자 로고 바탕 시안 (2026-10-11)                              | https://claude.ai/artifact/VmPiuJk7cLMYDMA2ePKKs7 | `journal/assets/2026-10-11-wordmark-any-background.html`       |
| 접기 영역 테두리 시안 (2026-10-13, 답을 기다림: T1 · T2 · P1 · P2, 확인 1~4) | https://claude.ai/artifact/PW426nxL2ScUNG5aPzxbW2 | `journal/assets/2026-10-13-fold-border-study.html` |
claude.ai의 페이지는 메인테이너만 열 수 있습니다(비공개).

## 지금 단계

**프로토타입으로 UX 규칙을 한 묶음씩 리뷰하는 중.** 프로토타입 45번째 판이 게시되어 있고, 메인테이너가 써 볼 차례입니다. 리뷰 1판(펴진 접기 영역의 왼쪽 막대, 호출 블록 펴 보기)의 단축키를 Vim 키로 바꾼 판입니다. 리뷰 순서는 [[prototype#리뷰 순서]]에 있습니다. 요구사항과 조작 규칙을 다시 짜는 일은 리뷰가 끝난 뒤에 합니다.

2026-10-13에 단축키 설계를 앞당겼습니다. Vim 키를 들이고 키 배열은 하나로 둡니다([[0025-vim-keys|ADR-0025]]). 키 표의 초안은 [[03-editor#4. 단축키]]에 있습니다.

2026-10-12에 문서의 자리를 정리했습니다. `docs/`에는 지금의 모습만 두고(요구사항 → UX 설계 → 아키텍처 → 상세 설계), 요구사항의 세부 규칙은 UX 설계([[01-interaction-rules]])로 옮겼으며, ADR과 일하는 기록은 `atelier/`(옛 `plan/`)에 모았습니다.

모델이 2026-10-10과 11에 많이 달라져서, 아래 "아키텍처 설계를 시작할 조건" 3번은 아직 맞지 않습니다.

## 큰 순서

앞으로의 큰 순서(메인테이너가 inbox 1-4~1-6에서 밝힌 방향): 요구사항을 최대한 더 모음 → 요구사항 리뷰용 프로토타입 → 아키텍처 설계 → **테스트 설계와 테스트 코드 작성** → 개발 → MVP(첫 출시, [[01-requirements#5. MVP 범위]]). 프로토타입과 아키텍처 시작 시점은 아래와 같이 정했습니다 (2026-10-10).

> [!note] 용어
> **프로토타입**은 요구사항이 맞는지 확인하려고 만들고 버리는 것, **MVP**는 개발을 거쳐 처음 내놓는 제품입니다. → [[spike-prototype-mvp]]

- **아키텍처 설계는 세 조건이 모두 맞으면 시작한다.**
	1. inbox의 기능 후보가 모두 요구사항에 들어가고 우선순위가 붙었다.
	2. 아키텍처를 가르는 열린 질문에 답이 났다: 블록 글자는 코드인가 문장인가, 저장 SVG의 색, 주 사용자, 확장자(스파이크로 `.ns.svg` 확인함).
	3. 프로토타입을 써 본 뒤 나온 새 요구사항이 모델(블록 종류, 트리 구조)과 파일 형식을 바꾸지 않는다.

근거: [[2026-10-10-01-solo-housekeeping#제안 3. 아키텍처 설계를 시작할 시점 (1-5)|제안 3]]

## 이번과 다음 세션에 할 것

- [ ] 메인테이너가 Vim 키로 써 보기. 한글 입력 상태에서 `j`, `dd`, `zf`가 듣는 것은 확인함(2026-10-13). 남은 것: 한글을 적다가 `Esc`를 누르면 한 번에 받아들이는지, 키 표가 손에 맞는지. Claude가 정해 놓은 키는 [[debt#확인해 주세요]]의 맨 위
- [ ] **다음 세션:** 메인테이너가 프로토타입 1판과 2판(45번째 판. 단축키는 Vim 키, 풀기는 `ds`)을 써 본 느낌을 듣고, 3판(고치기 규칙, Q1 · Q2 · Q4)으로 간다 → [[prototype#리뷰 순서]]
- [ ] 새 문서 구조를 Obsidian에서 열어 보고 어색한 곳을 알려 주기 (메인테이너). 2026-10-12에 Claude가 정해 놓고 확인받지 못한 것은 [[debt#확인해 주세요]]의 맨 위 세 묶음

## 열린 질문이 있는 곳

제품에 대한 열린 질문은 그 문서의 미결정 절이 원본입니다. 여기에 다시 적지 않습니다.

- 요구사항: [[01-requirements#6. 미결정 사항]] (주 사용자, 블록 글자, 저장된 SVG의 색, Event를 일으키는 블록, 웹 광고의 자리)
- UX 설계의 물음: [[02-ux-design#7. 결정 모음]]
- 요구사항 문서에 대한 물음(Q18, Q22, Q23): [[requirements-review#답하실 것]]
- 아키텍처: [[03-architecture#7. 위험과 검증이 필요한 사항]] (텍스트 폭 측정), 제안됨 상태의 ADR → [[atelier/README#아키텍처 결정 기록 (ADR)]]
- 파일 형식: [[01-file-format#6. 미결정 사항]] (모델 네임스페이스 URI)
- Obsidian 플러그인: [[04-obsidian-plugin#미결정 사항]]
