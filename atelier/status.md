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
| 접기 영역 테두리 시안 (2026-10-13, 결정함: T1 틈 1px · T2 가는 점선 · P1 똑같이 · P2 줄어듦. 답을 기다림: 확인 1~4 → [[debt#확인해 주세요]]) | https://claude.ai/artifact/PW426nxL2ScUNG5aPzxbW2 | `journal/assets/2026-10-13-fold-border-study.html` |
| 글자 폭 스파이크 (2026-10-13, 답을 기다림: 다른 브라우저에서 지문 견주기, F1 → [[debt#정해 주세요]]) | https://claude.ai/artifact/FNoS6pjV1zjieBgMwN8HxT | `journal/assets/2026-10-13-text-width-spike.html` (만드는 스크립트 `…-spike-build.py`, 재는 스크립트 `…-spike-measure.mjs`) |
| 아키텍처 전 물음 시안 (2026-10-13, 답을 기다림: A4 · A6 · A8 · A8-가 → [[debt#정해 주세요]]) | https://claude.ai/artifact/Jez6xT5qB9HbdoN1aRSKSn | `journal/assets/2026-10-13-before-architecture-study.html` |
claude.ai의 페이지는 메인테이너만 열 수 있습니다(비공개).

## 지금 단계

**프로토타입으로 UX 규칙을 한 묶음씩 리뷰하는 중.** 프로토타입 51번째 판이 게시되어 있고(화면 왼쪽 위에 판 번호가 보입니다), 메인테이너가 써 볼 차례입니다. 45번째 판(단축키를 Vim 키로)에 2026-10-13 둘째 세션의 것을 넣은 판입니다: 펴진 접기 영역은 굵은 테두리, 펴 보인 호출 블록은 가는 점선, 펴 보인 곳에만 있는 접기 영역, 블록 하나짜리 접기 영역. 리뷰 순서는 [[prototype#리뷰 순서]]에 있습니다. 요구사항과 조작 규칙을 다시 짜는 일은 리뷰가 끝난 뒤에 합니다.

2026-10-13에 다국어의 방향을 정했습니다. 화면의 글자는 영어가 기본이고 한국어를 지원하며, 언어는 설정에서 고릅니다([[01-requirements#^nfr-i18n]]). 프로토타입은 한국어로 둡니다.

2026-10-13에 단축키 설계를 앞당겼습니다. Vim 키를 들이고 키 배열은 하나로 둡니다([[0025-vim-keys|ADR-0025]]). 키 표의 초안은 [[03-editor#4. 단축키]]에 있습니다.

2026-10-12에 문서의 자리를 정리했습니다. `docs/`에는 지금의 모습만 두고(요구사항 → UX 설계 → 아키텍처 → 상세 설계), 요구사항의 세부 규칙은 UX 설계([[01-interaction-rules]])로 옮겼으며, ADR과 일하는 기록은 `atelier/`(옛 `plan/`)에 모았습니다.

2026-10-13에 아키텍처를 가르는 물음에 답이 났고(주 사용자는 실무용, 블록 글자의 종류는 문서마다 고름, 글꼴 번들과 그림에 넣기, 저장된 그림의 색, 실행 취소의 대상), **아키텍처 설계를 프로토타입 리뷰와 나란히 진행하기로 했습니다.**

## 큰 순서

앞으로의 큰 순서(메인테이너가 inbox 1-4~1-6에서 밝힌 방향): 요구사항을 최대한 더 모음 → 요구사항 리뷰용 프로토타입 → 아키텍처 설계 → **테스트 설계와 테스트 코드 작성** → 개발 → MVP(첫 출시, [[01-requirements#5. MVP 범위]]). 프로토타입과 아키텍처 시작 시점은 아래와 같이 정했습니다 (2026-10-10).

> [!note] 용어
> **프로토타입**은 요구사항이 맞는지 확인하려고 만들고 버리는 것, **MVP**는 개발을 거쳐 처음 내놓는 제품입니다. → [[spike-prototype-mvp]]

- **아키텍처 설계는 세 조건이 모두 맞으면 시작한다.**
	1. inbox의 기능 후보가 모두 요구사항에 들어가고 우선순위가 붙었다.
	2. 아키텍처를 가르는 열린 질문에 답이 났다: 블록 글자는 코드인가 문장인가(2026-10-13: 종류를 고름), 저장 SVG의 색(시안 A4로 물음), 주 사용자(2026-10-13: 실무용), 확장자(스파이크로 `.ns.svg` 확인함).
	3. ~~프로토타입을 써 본 뒤 나온 새 요구사항이 모델(블록 종류, 트리 구조)과 파일 형식을 바꾸지 않는다.~~ → 2026-10-13에 바꿈(메인테이너: "병행 진행"). 남은 리뷰 판은 거의 조작 규칙이라 모델에 닿을 만한 Q21과 Q10만 앞당겨 답하고, 아키텍처는 리뷰와 나란히 간다.

근거: [[2026-10-10-01-solo-housekeeping#제안 3. 아키텍처 설계를 시작할 시점 (1-5)|제안 3]]

## 이번과 다음 세션에 할 것

- [ ] **아키텍처 설계 시작.** 먼저 [[02-ux-design]]의 Q21과 Q10에 답을 받는다. 그다음 [[03-architecture]]를 2026-10-10 뒤에 바뀐 모델(여러 다이어그램, 호출 블록, Case, 접기 영역, 보기 상태)과 2026-10-13의 결정으로 다시 쓴다. 글꼴을 추려 그림에 넣는 일은 Node에서 되는 것을 확인했고(2026-10-13), 브라우저와 Obsidian 안에서는 그 셸을 만들 때 확인한다 → [[0026-bundled-font-metrics|ADR-0026]]
- [ ] 메인테이너가 글자 폭 스파이크를 Firefox와 휴대폰에서 열어 "다"의 지문을 알려 주기 → [[debt#정해 주세요]]
- [ ] **그 밖의 결정:** 메인테이너가 정할 것을 하나씩 처리한다(메인테이너, 2026-10-13: "마무리 후 /clear 하고 결정 필요 사항을 처리합시다"). [[debt#정해 주세요]]부터 한 번에 하나씩 묻고, 이어서 [[debt#확인해 주세요]]를 위에서부터 본다. 말로 견주기 어려운 것은 그림으로 묻는다
- [ ] 메인테이너가 프로토타입 51번째 판을 써 보기. 리뷰 1판 · 2판의 느낌, 블록 하나짜리 접기 영역이 강조 대용으로 쓸 만한지(지금은 만들면 바로 접힘), 한글을 적다가 `Esc`를 누르면 한 번에 받아들이는지
- [ ] 프로토타입의 알려진 구멍을 하나씩 보기(메인테이너: "알려진 구멍은 나중에 하나씩 보겠습니다") → [[prototype#알려진 구멍]]
- [ ] 그 뒤 리뷰 3판(고치기 규칙, Q1 · Q2 · Q4)으로 간다 → [[prototype#리뷰 순서]]
- [ ] 새 문서 구조를 Obsidian에서 열어 보고 어색한 곳을 알려 주기 (메인테이너)

## 열린 질문이 있는 곳

제품에 대한 열린 질문은 그 문서의 미결정 절이 원본입니다. 여기에 다시 적지 않습니다.

- 요구사항: [[01-requirements#6. 미결정 사항]] (블록 글자의 종류 목록, 번들하는 글꼴, Event를 일으키는 블록, 쓰이지 않는 Method, 웹 광고의 자리)
- UX 설계의 물음: [[02-ux-design#7. 결정 모음]]
- 요구사항 문서에 대한 물음(Q18, Q22, Q23): [[requirements-review#답하실 것]]
- 아키텍처: [[03-architecture#7. 위험과 검증이 필요한 사항]] (텍스트 폭 측정), 제안됨 상태의 ADR → [[atelier/README#아키텍처 결정 기록 (ADR)]]
- 파일 형식: [[01-file-format#6. 미결정 사항]] (모델 네임스페이스 URI)
- Obsidian 플러그인: [[04-obsidian-plugin#미결정 사항]]
