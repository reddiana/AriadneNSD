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
- 공유 URL, 보기 전용, Google Drive, AI 대화창: [[01-requirements#^web-share-url]], [[01-requirements#^web-view-mode]], [[01-requirements#2.4 Google Drive]], [[01-requirements#^web-ai-chat]]

## 1. 파일 열기·저장

> [!info] 미완성: 브라우저별 흐름
> - Chromium 계열: File System Access API로 원래 파일에 덮어쓰기
> - 그 밖의 브라우저: 파일 선택 → 편집 → 다운로드로 저장
> - 두 흐름의 화면 차이를 사용자에게 어떻게 보여 줄지

## 2. 임시 보관

> [!info] 미완성: 브라우저 저장소에 작성 중인 내용 보관, 복구 안내 ([[01-requirements#^web-draft]])

## 3. 공유 URL과 보기 전용

> [!info] 미완성: 다이어그램을 URL에 담아 나누기 ([[01-requirements#^web-share-url]]), 고칠 수 없게 여는 모드 ([[01-requirements#^web-view-mode]])

## 4. Google Drive

> [!info] 미완성: 웹 위에 얹는 Drive 연동 ([[0012-google-drive-integration|ADR-0012]]): 새로 만들기 · 연결 앱으로 열기 · 저장 · 미리보기 ([[01-requirements#^gd-new]], [[01-requirements#^gd-open-with]], [[01-requirements#^gd-save]], [[01-requirements#^gd-preview]]). 확장자는 `.ns.svg` ([[0014-drive-file-extension|ADR-0014]])

## 5. 배포

> [!info] 미완성: 정적 호스팅 (GitHub Pages 등), 빌드 결과물 구성

## 6. PWA

> [!info] 미완성: 오프라인 사용, 설치 ([[01-requirements#^web-pwa]])

## 미결정 사항

- [ ] 
