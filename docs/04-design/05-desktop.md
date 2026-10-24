---
title: 데스크톱 앱
tags:
  - ariadne-nsd
  - design
status: 작성 전
updated: 2026-10-22
---

# 데스크톱 앱 (`apps/desktop`)

데스크톱 셸입니다. 셸은 `editor`를 감싸는 어댑터로, [[03-architecture#3.2 editor와 셸의 인터페이스|아키텍처 3.2]]의 필요 인터페이스를 구현하고 제공 인터페이스를 사용합니다. 데스크톱에서의 구현은 [[0031-shell-interfaces|ADR-0031]] · [[0033-command-list-for-shells|ADR-0033]]에서 정했습니다.

| 인터페이스 | 방향 | 데스크톱에서 |
| --- | --- | --- |
| `DocumentStore` | 필요 (셸이 구현) | 로컬 파일 시스템 I/O. 다른 문서도 디스크에서 경로로 읽는다 |
| `SettingsStore` | 필요 (셸이 구현) | 설정 파일 |
| `CommandRegistry` | 제공 (셸이 사용) | 우리 도구 모음과 컨텍스트 메뉴 |
| `SettingsSchema` | 제공 (셸이 사용) | 우리 설정 창 |

프레임워크(Electron 또는 Tauri)는 [[0009-desktop-framework|ADR-0009]]에서 정합니다. 그 전까지 이 문서의 나머지는 작성하지 않습니다.

## 관련 요구사항

- [[01-requirements#2.2 데스크톱 애플리케이션]]
- [[01-requirements#^exp-autosave]]

## 1. 창과 파일 관리

> [!info] 미완성: 열기/저장/다른 이름으로 저장(`DocumentStore` 구현), 다중 창 또는 탭

## 2. OS 파일 연결

> [!info] 미완성: `.ns` 확장자의 OS 파일 연결, 명령줄 인자로 파일 열기

## 3. 배포와 업데이트

> [!info] 미완성: 설치 패키지, 자동 업데이트

## 미결정 사항

- [ ] 
