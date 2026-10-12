---
title: "ADR-0012: Google Drive 연동은 웹 버전 위에 얹는다"
tags:
  - adr
status: 승인
date: 2026-10-09
supersedes:
superseded-by:
---

# ADR-0012: Google Drive 연동은 웹 버전 위에 얹는다

## 배경

사용자가 Google Drive에서도 NS 차트를 만들고 편집하기를 원한다. ([[01-requirements#2.4 Google Drive]])
[[0002-three-targets-shared-core|ADR-0002]]는 세 대상(Obsidian · 데스크톱 · 웹)을 정했다. 이 ADR은 그 결정을 바꾸지 않고, 웹 대상에 연동 하나를 더한다.

Drive는 외부 앱이 Drive 화면에 붙는 두 지점을 제공한다.
- **연결 앱(Open with):** 파일을 우클릭하면 앱으로 열기. Drive가 앱의 URL로 파일 ID를 넘긴다.
- **새로 만들기(New):** Drive의 "새로 만들기" 메뉴에서 앱을 호출해 새 파일을 만든다.

## 결정 기준

- 편집 기능을 다시 만들지 않아야 한다. ([[0002-three-targets-shared-core|ADR-0002]]의 공유 코어)
- 서버를 운영하지 않아야 한다. ([[01-requirements#^web-static]])
- 사용자 Drive 전체가 아니라 필요한 파일에만 접근해야 한다.

## 검토한 대안

### 별도 대상(`apps/gdrive`)으로 만들기

- 장점: Drive 전용 화면과 동작을 자유롭게 설계할 수 있음
- 단점: 웹 셸과 대부분 겹침, 대상이 하나 더 늘어 유지 비용 증가

### 웹 셸에 Drive 연동 모듈을 더하기

- 장점: 웹 버전을 그대로 재사용, OAuth와 Drive API를 브라우저에서 호출하므로 서버 불필요
- 단점: 웹 셸에 Drive 전용 코드(로그인, 파일 ID로 열기·저장)가 섞임

## 결정

웹 셸에 Drive 연동 모듈을 더한다. 같은 정적 페이지가 Drive에서 파일 ID를 받아 열면 Drive 모드로 동작한다.
- 권한은 앱이 만들었거나 사용자가 연 파일에만 접근하는 `drive.file` 범위만 요청한다.
- 웹 버전이 나온 다음에 만든다.

## 결과

- 좋아지는 점: 파일이 SVG라서 Drive가 썸네일과 미리보기를 별도 작업 없이 보여 준다. ([[0005-model-embedded-svg|ADR-0005]]의 이득)
- 감수하는 점: Google Cloud 프로젝트 설정, OAuth 동의 화면, Google Workspace Marketplace 등록 절차가 필요하다.
- 후속 작업: Drive에 저장할 확장자 결정([[01-requirements#6. 미결정 사항]]), 개발 순서에 반영([[0011-development-order|ADR-0011]]), 설계 문서 [[06-web]]에 Drive 모드 추가
