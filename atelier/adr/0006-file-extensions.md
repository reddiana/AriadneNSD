---
title: "ADR-0006: 확장자 .ns / .ns.svg"
tags:
  - adr
status: 승인
date: 2026-10-07
supersedes:
superseded-by:
---

# ADR-0006: 확장자 `.ns` / `.ns.svg`

> [!NOTE] 이후 변경
> - 2026-10-10: Google Drive에서 만드는 파일의 확장자를 `.ns.svg`로 정했다 → [[0014-drive-file-extension|ADR-0014]]

## 배경

[[0005-model-embedded-svg|ADR-0005]]에 따라 저장 파일은 모델 내장 SVG다. Obsidian에서는 노트에 그림으로 넣어야 하므로 `.svg`로 끝나야 하고, 데스크톱·웹에서는 일반 SVG와 구분되는 고유 확장자가 있으면 좋다.

## 결정 기준

- Obsidian에서 노트에 넣으면 그림으로 보여야 한다. ([[01-requirements#^obs-embed]])
- Obsidian에서 일반 `.svg`와 NS 다이어그램을 구분할 수 있어야 한다. ([[01-requirements#^obs-plain-svg]])
- 데스크톱에서 파일 연결이 다른 프로그램과 겹치지 않아야 한다. ([[01-requirements#^dsk-assoc]])
- 세 대상 사이에서 파일을 쉽게 옮길 수 있어야 한다.

## 검토한 대안

### Obsidian `.svg`, 데스크톱·웹 `.nsd`

- 장점: 단순
- 단점: `.nsd`는 Structorizer가 이미 쓰는 확장자(내용은 SVG가 아닌 자체 XML)라 파일 연결이 겹침. Obsidian에서 일반 SVG와 이름으로 구분할 수 없어 매번 내용을 읽어야 함

### Obsidian `.ns.svg`, 데스크톱·웹 `.ns`

- 장점: Structorizer와 충돌 없음. 이름만으로 구분 가능. `.svg`를 붙이거나 떼기만 하면 대상 간 이동 가능. Excalidraw 플러그인의 `.excalidraw.md`와 같은 검증된 방식
- 단점: Obsidian은 마지막 점 뒤(`svg`)만 확장자로 보므로 확장자 등록이 아닌 이름 접미사로 판별해야 함. 사용자가 이름을 바꾸다 `.ns`를 지울 수 있음

## 결정

- Obsidian 플러그인: `이름.ns.svg`
- 데스크톱 · 웹: `이름.ns` (`.ns.svg`도 열 수 있음)
- 확장자는 1차 판별에만 쓰고, 실제로 열 때는 모델 유무로 확인한다.
- `.ns`가 빠진 `.svg`라도 모델이 있으면 "NS 편집기로 열기" 메뉴를 제공한다. ([[01-requirements#^obs-detect]])

## 결과

- 좋아지는 점: 확장자 충돌 없음, 대상 간 이동이 쉬움
- 감수하는 점: Obsidian에서 `.svg` 파일 열기 동작을 가로채는 방법을 검증해야 함 → [[02-architecture#7. 위험과 검증이 필요한 사항]]
