---
title: 현재 상태
tags:
  - ariadne-nsd
  - plan
updated: 2026-10-12
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
claude.ai의 페이지는 메인테이너만 열 수 있습니다(비공개).

## 지금 단계

**프로토타입으로 UX 규칙을 한 묶음씩 리뷰하는 중.** 프로토타입 37번째 판(리뷰 1판: 펴진 접기 영역의 왼쪽 막대, 호출 블록 펴 보기)이 게시되어 있고, 메인테이너가 써 볼 차례입니다. 리뷰 순서는 [[prototype#리뷰 순서]]에 있습니다. 요구사항과 조작 규칙을 다시 짜는 일과 단축키 설계는 리뷰가 끝난 뒤에 합니다.

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

- [ ] **다음 세션:** 메인테이너가 프로토타입 1판(37번째 판)을 써 본 느낌을 듣고, 2판(풀기를 하나로)으로 간다. inbox에 남은 "단축키를 통일할 수 있나요?"를 2판에서 닫는다

## 이번 세션에 한 일 (2026-10-12)

마무리 때 세션 기록으로 옮기고 지웁니다. inbox에서 지운 항목의 원문이 여기 있습니다.

- [ ] inbox "1. 일하는 방식"에서 넘어온 일 (2026-10-12. 메인테이너: "inbox의 일하는 방식만 적용해주세요. 금방 다시 나갈거에요." 세션 기록은 마무리 때 쓴다. 지운 항목의 원문을 여기 적어 둔다)
	- [x] "adr/은 plan/ 밑으로 옮깁시다. docs/는 최종 결과/모습만 있게 합시다." → `docs/03-adr/`를 `plan/adr/`로 옮김. ADR 목록은 [[atelier/README#아키텍처 결정 기록 (ADR)]]으로. [[0001-record-architecture-decisions|ADR-0001]]에 "이후 변경", CLAUDE.md와 README들 고침
	- [x] "plan/ 이름을 재검토해주세요." → Claude가 `process/`를 추천했고, 메인테이너가 "process/도 좋은데 work라는 의미로 몇가지 더 추천해주세요", "몇가지 더 추천해주세요"라고 해 후보를 두 번 더 냄(`workshop/` · `workbench/` · `work/` · `workspace/` · `backstage/`, `studio/` · `atelier/` · `desk/` · `lab/` · `making/` · `working/` · `ops/` · `pm/` · `thread/` · `loom/`). 메인테이너: "atelier/로 해주세요" → `plan/`을 `atelier/`로 바꿈. 아래 두 줄에 적힌 `plan/…`은 지금의 `atelier/…`
	- [x] "[[02-ux-design|ux-review]]는 내용을 보니 ux 설계입니다. ux 설계를 위한 입력은 [[01-requirements]]에 있습니다. 이 공학적인 방법을 고려해서 문서의 위치와 문서명, 내용을 조정해주세요." → `plan/ux-review.md`를 둘로 나눔: UX 설계 [[02-ux-design]](지금은 `docs/02-ux-design/`, 공통 규칙과 Q1~Q17 · Q19~Q21)과 요구사항 문서 검토 [[requirements-review]](`plan/`, Q18 · Q22 · Q23과 고칠 곳 목록). 물음의 번호는 그대로
	- [x] "이 문서를 보는 사람이 어떤 목적의 문서인지 궁금해하겠네요. 이 문서 머리에 설명해주세요." → "이 문서"가 inbox인지 ux-review인지 몰라 둘 다 함: [[inbox]], [[02-ux-design]], [[requirements-review]]의 머리에 "이 문서는" 콜아웃
- [x] 요구사항과 설계를 나눔 (2026-10-12. 메인테이너: "01-requirements가 너무 상세합니다. 사실 상세한 내용들은 당신과 내가 협업하면서 구체화한 것인데, 이것은 설계나 분석에 해당합니다. 요구사항과 분석 또는 설계를 분리합시다.") → 세부 규칙을 [[01-interaction-rules]]로 문장 그대로 옮김. 요구사항은 429줄에서 296줄로. 블록 ID와 제목은 그대로여서 링크는 끊기지 않음. Obsidian 메뉴의 자리와 미결정 셋은 [[04-obsidian-plugin]]으로
	- [ ] 메인테이너가 나뉜 모습을 보고 확인: 요구사항에 남긴 문장의 수준이 맞는지, 더 옮길 것(2장 배포 대상의 세부, 3.7 문제 알리기)이 있는지 → [[debt]]
- [x] `status` · `debt`에 겹쳐 있던 내용을 정리하고 문서를 나눔 (2026-10-12. 메인테이너: "debt와 requirements-review와 status에 중복된 내용들이 있습니다. 어떻게 정리하면 좋을지 의견주세요", "문서들 구조를 변경하는 것 까지 검토해주세요", "B로 해주세요. 끝난 항목은 지워도 됩니다.") → 할 일은 [[backlog]], 프로토타입의 상태는 [[prototype]], 메인테이너의 답이 필요한 것만 [[debt]]. 끝난 항목과 "처리함"은 지움(세션 기록과 git에 있음)

## 열린 질문이 있는 곳

제품에 대한 열린 질문은 그 문서의 미결정 절이 원본입니다. 여기에 다시 적지 않습니다.

- 요구사항: [[01-requirements#6. 미결정 사항]] (주 사용자, 블록 글자, 저장된 SVG의 색, Event를 일으키는 블록, 웹 광고의 자리)
- UX 설계의 물음: [[02-ux-design#7. 결정 모음]]
- 요구사항 문서에 대한 물음(Q18, Q22, Q23): [[requirements-review#답하실 것]]
- 아키텍처: [[03-architecture#7. 위험과 검증이 필요한 사항]] (텍스트 폭 측정), 제안됨 상태의 ADR → [[atelier/README#아키텍처 결정 기록 (ADR)]]
- 파일 형식: [[01-file-format#6. 미결정 사항]] (모델 네임스페이스 URI)
- Obsidian 플러그인: [[04-obsidian-plugin#미결정 사항]]
