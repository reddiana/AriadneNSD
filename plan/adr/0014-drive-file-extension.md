---
title: "ADR-0014: Google Drive에서 만드는 파일은 `.ns.svg`로 저장한다"
tags:
  - adr
status: 승인
date: 2026-10-10
supersedes:
superseded-by:
---

# ADR-0014: Google Drive에서 만드는 파일은 `.ns.svg`로 저장한다

> [!NOTE] 이후 변경
> - 2026-10-10: 제품 이름이 `NSDrawing`에서 `AriadneNSD`로 바뀌었다. 본문의 "NSDrawing으로 열기"는 지금의 "AriadneNSD로 열기"다. 확장자는 그대로다 → [[0019-product-name|ADR-0019]]

## 배경

[[0012-google-drive-integration|ADR-0012]]는 Drive 연동을 웹 버전 위에 얹기로 하고, Drive에 저장할 확장자를 후속 결정으로 남겼다.
[[0006-file-extensions|ADR-0006]]에 따르면 웹 버전은 `.ns`로 저장한다. 그런데 Drive에서는 미리보기와 썸네일([[01-requirements#^gd-preview]])이 확장자에 따라 달라진다.

## 결정 기준

- Drive 미리보기와 썸네일이 별도 작업 없이 나와야 한다. ([[01-requirements#^gd-preview]])
- 저장할 때마다 할 일이 늘지 않아야 한다.
- 다른 대상(Obsidian, 데스크톱)과 파일을 쉽게 주고받을 수 있어야 한다.

## 검토한 대안

### `.ns` (웹 버전과 같게)

- 장점: 웹·데스크톱과 확장자가 같음
- 단점: Drive가 SVG로 인식하지 않아 미리보기가 나오지 않음. 썸네일은 저장할 때마다 앱이 PNG를 만들어 함께 올려야 함(`contentHints.thumbnail`). 다른 도구로 고친 파일은 썸네일이 맞지 않게 됨

### `.ns.svg` (Obsidian과 같게)

- 장점: Drive가 SVG로 인식해 미리보기와 썸네일을 알아서 보여 줌. Obsidian 볼트를 Drive로 동기화하는 경우에도 이름이 그대로 맞음
- 단점: 웹·데스크톱 기본 확장자(`.ns`)와 다름

## 결정

Drive의 "새로 만들기"로 만드는 파일은 `이름.ns.svg`로 저장한다.

- "NSDrawing으로 열기"는 `.ns`와 `.ns.svg`를 모두 연다. ([[0006-file-extensions|ADR-0006]]과 같이 실제 판별은 모델 유무로 한다)
- 이미 있는 파일을 열어 저장할 때는 파일 이름을 바꾸지 않는다.

## 결과

- 좋아지는 점: Drive 미리보기와 썸네일이 추가 작업 없이 나온다.
- 감수하는 점: 같은 웹 앱이 로컬에서는 `.ns`, Drive에서는 `.ns.svg`로 저장한다. 사용자가 Drive에 직접 올린 `.ns` 파일은 미리보기가 나오지 않는다.
- 후속 작업: 설계 문서 [[06-web]]의 Drive 모드에 반영
