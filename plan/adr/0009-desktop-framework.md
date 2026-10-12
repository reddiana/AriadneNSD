---
title: "ADR-0009: 데스크톱 프레임워크"
tags:
  - adr
status: 제안됨
date: 2026-10-07
supersedes:
superseded-by:
---

# ADR-0009: 데스크톱 프레임워크

## 배경

[[0003-typescript|ADR-0003]]에 따라 데스크톱 앱도 웹 기술로 만든다. 웹 기술로 데스크톱 앱을 만드는 프레임워크를 골라야 한다.

## 결정 기준

- 같은 모델이면 같은 SVG가 나와야 한다. 텍스트 폭 측정이 환경에 따라 달라지면 안 된다. ([[01-requirements#^nfr-compat]], [[02-architecture#7. 위험과 검증이 필요한 사항]])
- 파일 대화상자, OS 파일 연결을 지원해야 한다. ([[01-requirements#^dsk-file]], [[01-requirements#^dsk-assoc]])
- 설치 파일 크기
- 자동 업데이트 지원 ([[01-requirements#^dsk-update]])

## 검토한 대안

### Electron

- 장점: 렌더링 엔진이 Chromium 하나로 고정되어 텍스트 폭 측정이 웹(Chromium) 버전과 같음. 자료와 사례가 많음
- 단점: 설치 파일이 큼 (약 100MB 이상)

### Tauri

- 장점: 설치 파일이 작음 (수 MB), 메모리 사용이 적음
- 단점: OS마다 웹뷰 엔진이 다름 (Windows: WebView2/Chromium, macOS: WebKit, Linux: WebKitGTK). 글꼴 렌더링과 텍스트 폭 차이를 확인해야 함. 셸 일부를 Rust로 작성

## 결정

미정.

> [!question] 결정 전 확인할 것
> - [[02-layout]]에서 텍스트 폭 차이 대응 방식(글꼴 번들 등)이 정해지면, Tauri의 웹뷰 차이 문제가 해소되는지
> - 지원할 OS 범위 (Windows만? macOS·Linux 포함?)

## 결과

(결정 후 작성)
