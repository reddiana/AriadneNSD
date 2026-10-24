---
title: 웹
tags:
  - ariadne-nsd
  - design
status: 작성 전
updated: 2026-10-22
---

# 웹 (`apps/web`)

웹 셸입니다. 셸은 `editor`를 감싸는 어댑터로, [[03-architecture#3.2 editor와 셸의 인터페이스|아키텍처 3.2]]의 필요 인터페이스를 구현하고 제공 인터페이스를 사용합니다. 웹에서의 구현은 [[0031-shell-interfaces|ADR-0031]] · [[0033-command-list-for-shells|ADR-0033]]에서 정했습니다. 백엔드 서버가 없는 정적 사이트입니다([[01-requirements#^web-static]]).

| 인터페이스 | 방향 | 웹에서 |
| --- | --- | --- |
| `DocumentStore` | 필요 (셸이 구현) | 브라우저 파일 I/O (1장). 다른 문서는 사용자가 권한을 준 파일이나 폴더 안에서만 읽고, 그 밖이면 `null` |
| `SettingsStore` | 필요 (셸이 구현) | 그 브라우저의 저장소 |
| `CommandRegistry` | 제공 (셸이 사용) | 우리 도구 모음과 컨텍스트 메뉴 |
| `SettingsSchema` | 제공 (셸이 사용) | 우리 설정 창 |

## 관련 요구사항

- [[01-requirements#2.3 웹 (정적 페이지)]]
- [[01-requirements#^exp-autosave]]
- 공유 URL, 보기 전용, Google Drive, AI 대화창: [[01-requirements#^web-share-url]], [[01-requirements#^web-view-mode]], [[01-requirements#2.4 Google Drive]], [[01-requirements#^web-ai-chat]]

## 1. 파일 열기·저장

> [!info] 미완성: 브라우저별 흐름 (`DocumentStore`의 구현체가 둘이 됨)
> - Chromium 계열: File System Access API(`FileSystemFileHandle`)로 원래 파일에 덮어쓰기
> - 그 밖의 브라우저: `<input type="file">`로 열기 → 편집 → 다운로드로 저장
> - 두 흐름의 화면 차이를 사용자에게 어떻게 보여 줄지

## 2. 임시 보관

> [!info] 미완성: 작성 중인 내용을 브라우저 저장소에 자동 임시 저장, 복구 안내 ([[01-requirements#^web-draft]])

## 3. 공유 URL과 보기 전용

> [!info] 미완성: 문서를 압축 · 인코딩해 URL에 담아 공유하기 ([[01-requirements#^web-share-url]]), 읽기 전용 모드 ([[01-requirements#^web-view-mode]])

## 4. Google Drive

> [!info] 미완성: 웹 셸 위에 얹는 Drive 연동 ([[0012-google-drive-integration|ADR-0012]]): 새로 만들기 · 연결 앱으로 열기 · 저장 · 미리보기 ([[01-requirements#^gd-new]], [[01-requirements#^gd-open-with]], [[01-requirements#^gd-save]], [[01-requirements#^gd-preview]]). 확장자는 `.ns.svg` ([[0014-drive-file-extension|ADR-0014]])

## 5. 배포

웹 버전은 GitHub Pages의 `https://reddiana.github.io/AriadneNSD/app/`에 놓인다. 같은 사이트에 설계 문서(`/docs/`, `/atelier/`)와 사용자 매뉴얼(`/manual/`)이 함께 있고, 한 GitHub Actions 워크플로(`.github/workflows/pages.yml`)가 모두 빌드해 한 번에 배포한다. 그래서 앱 빌드의 base path를 `/AriadneNSD/app/`으로 두고, 빌드 산출물을 그 워크플로의 `_site/app/`에 넣는다. → [[dr-0013-publish-docs-github-pages|DR-0013]]

> [!info] 미완성: 빌드 산출물 구성(코드 스플리팅, 번들 글꼴과 서브세팅 wasm을 어디에 두는지, 캐시 전략)

## 6. PWA

> [!info] 미완성: 오프라인 사용(서비스 워커), 설치 ([[01-requirements#^web-pwa]])

## 미결정 사항

- [ ] 
