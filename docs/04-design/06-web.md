---
title: "설계: 웹"
tags:
  - ariadne-nsd
  - design
status: 작성 전
updated: 2026-10-07
---

# 설계: 웹 (`apps/web`)

## 관련 요구사항

- [[01-requirements#2.3 웹 (정적 페이지)]]
- [[01-requirements#^exp-autosave]]

## 1. 파일 열기·저장

> [!todo] 브라우저별 흐름
> - Chromium 계열: File System Access API로 원래 파일에 덮어쓰기
> - 그 밖의 브라우저: 파일 선택 → 편집 → 다운로드로 저장
> - 두 흐름의 화면 차이를 사용자에게 어떻게 보여 줄지

## 2. 임시 보관

> [!todo] 브라우저 저장소에 작성 중인 내용 보관, 복구 안내 ([[01-requirements#^web-draft]])

## 3. 배포

> [!todo] 정적 호스팅 (GitHub Pages 등), 빌드 결과물 구성

## 4. PWA

> [!todo] 오프라인 사용, 설치 ([[01-requirements#^web-pwa]])

## 미결정 사항

- [ ] 
