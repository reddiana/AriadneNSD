---
title: "설계: 레이아웃 · 렌더링"
tags:
  - ariadne-nsd
  - design
status: 작성 전
updated: 2026-10-07
---

# 설계: 레이아웃 · 렌더링 (`packages/core`)

문서 모델에서 각 블록의 위치와 크기를 계산하고, 그 결과를 SVG로 그리는 방법을 정의합니다. 모습의 값(색, 선 굵기, 글자 크기, 여백과 치수)은 [[04-visual-design]]에만 있고, 이 문서는 그 값을 쓰는 방법을 정합니다.

## 관련 요구사항

- [[01-requirements#3.3 레이아웃 · 렌더링]] ([[01-requirements#^lay-autosize]] 여러 줄 글자, [[01-requirements#^lay-default-style]] → [[04-visual-design]])
- 내보내기: [[01-requirements#^exp-png]] (#P0), [[01-requirements#^exp-pdf]], [[01-requirements#^exp-plain-svg]]
- [[01-requirements#^fmt-text]], [[01-requirements#^fmt-outline]], [[01-requirements#^fmt-deterministic]]
- [[01-requirements#^nfr-perf]], [[01-requirements#^nfr-compat]]

## 1. 레이아웃 알고리즘

> [!info] 미완성: 크기 계산과 배치
> - 2단계 방식(아래에서 위로 최소 크기 계산 → 위에서 아래로 너비 분배) 검토
> - 갈래 너비 분배 규칙
> - 블록별 도형 규격과 여백 · 최소 크기 상수 → [[04-visual-design#5. 기하와 해부도]]의 `size.*` · `space.*` 토큰을 쓴다
> - 여러 줄 글자의 줄 나눔과 높이 ([[01-requirements#^lay-autosize]])
> - 여러 다이어그램의 배치 → [[02-interaction-rules#5. 여러 다이어그램의 배치]]
> - 펴 보인 호출 블록을 그 자리에 다시 배치하는 비용 → [[03-architecture#7. 위험과 검증이 필요한 사항]]

## 2. 텍스트 폭 측정

정한 것: 글꼴을 번들하고, 그 글꼴 파일의 글자 폭 표로 `core`가 셈한다. 셸이 넣지 않는다. 커닝을 끄고 정수 px로 올린다 → [[0026-bundled-font-metrics|ADR-0026]]

> [!info] 미완성: 글자 폭 표와 글꼴 조각
> - 글자 폭 표의 형식과 크기, 번들 글꼴에 없는 글자의 폭
> - 저장 파일에 넣을 글꼴 조각을 추리는 방법과 크기 → [[03-architecture#7. 위험과 검증이 필요한 사항]], [[01-file-format#2. 문서 구조]]

## 3. SVG 렌더링

> [!info] 미완성: 그림 부분의 형식
> - 요소 구성과 클래스 이름 → [[01-file-format#4. 그림 부분]]에 반영
> - 색 토큰을 렌더러에 넘기는 방식. 문서 층은 문서 팔레트, 편집 층은 `editor`가 UI 테마로 덧그림 → [[04-visual-design#2. 층과 출력]], [[04-visual-design#9. 렌더링 규칙|9. 렌더링 규칙]](픽셀 맞추기)
> - 구문 강조: 블록 글자의 종류마다 낱말 가르기 → [[03-architecture#5. 공통 관심사]]
> - 그림에 적는 글자("참" · "거짓" 등)의 언어 → [[01-requirements#^nfr-i18n]]
> - 텍스트 외곽선 변환 옵션 ([[01-requirements#^fmt-outline]])
> - PNG · PDF 내보내기: 같은 SVG를 래스터 · 인쇄로 바꾸는 길과 배율 ([[01-requirements#^exp-png]]는 #P0)

## 4. 성능

> [!info] 미완성: 블록 500개에서 100ms 이내
> - 변경된 부분만 다시 계산할지, 전체 재계산으로 충분한지 측정

## 미결정 사항

- [ ] 
