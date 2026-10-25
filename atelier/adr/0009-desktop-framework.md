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

- 같은 모델이면 같은 SVG가 나와야 한다. 텍스트 폭 측정이 환경에 따라 달라지면 안 된다. ([[01-requirements#^r-nfr|R-NFR-02]], [[03-architecture#7. 위험과 검증이 필요한 사항]])
- 파일 대화상자, OS 파일 연결을 지원해야 한다. ([[01-requirements#^r-dsk|R-DSK-01]], [[01-requirements#^r-dsk|R-DSK-03]])
- 설치 파일 크기
- 자동 업데이트 지원 ([[01-requirements#^r-dsk|R-DSK-05]])

## 검토한 대안

### Electron

- 장점: 렌더링 엔진이 Chromium 하나로 고정되어 화면의 글자 렌더링이 웹(Chromium) 버전과 같음. 자료와 사례가 많음. 텍스트 폭은 어느 쪽이든 `core`가 글꼴 메트릭으로 계산하므로([[0026-bundled-font-metrics|ADR-0026]]) 저장되는 파일에는 차이가 없음
- 단점: 설치 파일이 큼 (약 100MB 이상)

### Tauri

- 장점: 설치 파일이 작음 (수 MB), 메모리 사용이 적음
- 단점: OS마다 웹뷰 엔진이 다름 (Windows: WebView2/Chromium, macOS: WebKit, Linux: WebKitGTK). 텍스트 폭은 엔진과 상관없지만([[0026-bundled-font-metrics|ADR-0026]]), 화면에서 글자를 그리는 결과가 계산한 폭과 조금 어긋날 수 있음(WebKit은 확인하지 못함). 셸 일부를 Rust로 작성

## 결정

미정.

코드는 `src/apps/desktop`에 둔다(Tauri면 그 안에 `src-tauri/`가 생긴다) → [[0036-code-layout|ADR-0036]]

> [!question] 결정 전 확인할 것
> - 텍스트 폭 차이는 [[0026-bundled-font-metrics|ADR-0026]]으로 풀렸다: `core`가 번들 글꼴의 메트릭으로 폭을 계산하므로 저장되는 파일은 웹뷰 엔진과 상관없이 같다. 남은 것은 WebKit 웹뷰(macOS, Linux)에서 그린 글자가 계산한 폭과 맞는지(렌더링 오차)뿐이다 → [[03-architecture#7. 위험과 검증이 필요한 사항]]
> - 지원할 OS 범위 (Windows만? macOS·Linux 포함?)

## 결과

(결정 후 작성)
