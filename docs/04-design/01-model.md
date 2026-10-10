---
title: "설계: 모델"
tags:
  - ariadne-nsd
  - design
status: 작성 전
updated: 2026-10-07
---

# 설계: 모델 (`packages/core`)

트리 데이터 구조, 불변 조건, 편집 명령을 정의합니다. → [[0004-structure-editor|ADR-0004]]

## 관련 요구사항

- 블록 종류: [[01-requirements#3.1 블록 종류]]
- 정합성: [[01-requirements#^nfr-integrity]]
- Undo/Redo: [[01-requirements#^edit-undo]]
- 감싸기·풀기: [[01-requirements#^edit-wrap]], [[01-requirements#^edit-unwrap]]

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
> - 명령 목록: 삽입, 삭제, 텍스트 수정, 이동, 감싸기, 풀기, 갈래 추가·삭제·교환
> - Undo 방식: 역명령 / 불변(immutable) 트리 스냅샷 중 선택
> - 연속 텍스트 입력을 하나의 Undo로 묶는 규칙

## 4. 직렬화

> [!todo] 모델 ↔ JSON 변환
> - [[01-file-format#3. 모델 JSON]]의 스키마와 연결
> - 키 순서 고정, 기본값 생략 규칙

## 미결정 사항

- [ ] 
