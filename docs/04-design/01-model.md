---
title: "설계: 모델"
tags:
  - ariadne-nsd
  - design
status: 작성 전
updated: 2026-10-07
---

# 설계: 모델 (`packages/core`)

문서 모델의 데이터 구조, 불변 조건, 편집 명령을 정의합니다. → [[0004-structure-editor|ADR-0004]]

> [!note] 먼저 읽을 것
> 모델의 짜임(문서 → 다이어그램 여럿 → 머리 · 본문, 호출 블록은 Method를 id로 가리킴, 접기 영역, 내용과 보기 상태)은 [[03-architecture#3.1 문서 모델]]과 [[03-architecture#3.2 내용과 보기 상태]]에 먼저 정해져 있습니다(아키텍처 초안, 확인받지 못한 제안은 [[03-architecture#8. 확인받지 못한 제안]]). 이 문서는 그 짜임을 타입과 명령으로 굳힙니다. 파일에 쓰는 모양은 [[01-file-format#3. 모델 JSON]]에 안이 있습니다.

## 관련 요구사항

- 블록 종류: [[01-requirements#3.1 블록 종류]]
- 정합성: [[01-requirements#^nfr-integrity]]
- Undo/Redo: [[01-requirements#^edit-undo]]
- 감싸기·풀기: [[01-requirements#^edit-wrap]], [[01-requirements#^edit-unwrap]]
- 여러 다이어그램, Event · Method, 호출 블록: [[01-requirements#^edit-multi-diagram]], [[01-requirements#^blk-event]], [[01-requirements#^blk-method]], [[01-requirements#^blk-call]]
- 접기 영역과 보기 상태: [[01-requirements#^edit-fold-range]], [[01-requirements#^edit-fold-site]], [[0018-save-as-shown|ADR-0018]]

## 1. 노드 타입

> [!todo] 블록 종류별 TypeScript 타입 정의
> - 구별 가능한 유니온 타입(`type` 필드)으로 정의
> - 각 블록의 필드: 텍스트, 조건, 갈래, 본문 등
> - 블록 ID 부여 방식 (선택·Undo에서 블록을 가리키는 데 필요)

## 2. 불변 조건

> [!todo] 트리가 항상 지켜야 할 조건 목록
> - 예: 시퀀스는 비어 있지 않다 (빈 갈래는 빈 처리 블록으로 채움)
> - 예: If 블록은 갈래가 정확히 두 개다
> - 검사 함수와 테스트 방법

## 3. 편집 명령

> [!todo] 명령 목록과 Undo 방식
> - 명령 목록: 넣기, 지우기, 글자 고치기, 옮기기, 감싸기, 풀기(제어 블록 · 호출 블록), 갈래 넣기 · 빼기 · 맞바꾸기, 새 Method로 빼기, 머리 달기 · 떼기 · 종류 바꾸기, 다이어그램 넣기 · 지우기, 접기 영역 만들기 · 풀기 · 이름 고치기. 보기 명령(접기 · 펴기, 펴 보기)은 실행 취소 기록에 남지 않는다 → [[01-interaction-rules#6. 실행 취소]]
> - Undo 방식: 아키텍처 초안은 불변 문서(명령은 문서를 받아 새 문서를 돌려줌)다 → [[03-architecture#4.1 편집]], [[03-architecture#8. 확인받지 못한 제안]]
> - 연속 텍스트 입력을 하나의 Undo로 묶는 규칙

## 4. 직렬화

> [!todo] 모델 ↔ JSON 변환
> - [[01-file-format#3. 모델 JSON]]의 스키마와 연결
> - 키 순서 고정, 기본값 생략 규칙

## 미결정 사항

- [ ] 
