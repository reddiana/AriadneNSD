---
title: 테스트 유형과 테스트 더블
tags:
  - til
updated: 2026-11-01
---

# 테스트 유형과 테스트 더블

메인테이너가 물은 것: "단위 테스트 / 사용자관점의 통합테스트 등 테스트 유형에 대한 설명이 테스트 설계에 있나요? 일하면서 테스트 아키텍쳐라는 문서들을 종종 봤습니다." 그리고 S26에서 MVP가 뜨지 않았을 때, 실제 폰 없이 어떻게 시험했는지.

## 한 줄 요약

테스트는 **얼마나 큰 덩어리를 진짜로 돌리고, 나머지를 무엇으로 바꾸는가**로 나뉩니다. 작은 덩어리는 빠르고 원인이 바로 보이며, 큰 덩어리는 느리지만 사용자가 보는 것을 봅니다.

## 백엔드로 비유하면

| 프론트엔드(AriadneNSD) | 백엔드에서 익숙한 것 |
| --- | --- |
| 단위: `core`의 함수 하나(명령, 레이아웃 규칙) | 서비스 클래스의 메서드 하나를 JUnit으로 |
| 통합: `editor` + `core`를 가짜 셸 · 가짜 DOM(happy-dom) 위에서 | 서비스 + 리포지토리를 인메모리 DB(H2)나 Testcontainers로 |
| E2E: 빌드한 웹 앱을 실제 브라우저(Playwright)로 클릭 · 키 · 탭 | 띄운 서버에 실제 HTTP 요청을 보내는 API 시험, 화면이 있으면 Selenium |
| 테스트 더블: 메모리 안의 `DocumentStore`, OPFS 위의 가짜 파일 창 | Mockito의 mock · stub, WireMock의 가짜 외부 API |

- **테스트 피라미드:** 아래(단위)가 가장 많고 위(E2E)가 가장 적게. 위로 갈수록 느리고 자주 깨지기 때문입니다. 지금 단위 343 · 통합 113 · E2E 46개쯤입니다.
- 다만 **화면을 지나야만 보이는 결함**은 E2E만 잡습니다. 오늘의 결함 넷이 모두 그랬습니다. CSS가 스크롤을 막거나 드롭다운을 가둠(BUG-01 · 02), 시작 순서에서 멈춤(BUG-03), 좁은 화면에서만 숨음(BUG-04). 함수는 다 맞았습니다.

## 실제 기기 없이 휴대폰 흉내 내기

Playwright(Chromium)에서 셋을 바꿉니다.

- **화면과 터치:** `devices['Galaxy S9+']`의 화면 크기 · 픽셀 밀도 · 터치 · user agent. 좁은 화면 CSS가 켜지고 `tap()`이 됩니다.
- **느린 CPU와 망:** Chrome DevTools Protocol의 `Emulation.setCPUThrottlingRate`(CPU 4배 느리게)와 `Network.emulateNetworkConditions`("slow 4G": 왕복 150 ms, 1.6 Mbps). Lighthouse의 모바일 측정과 같은 값입니다.
- **고장 넣기:** `indexedDB.open`을 아무 응답도 하지 않는 가짜로 바꿔, 저장소가 멈춰도 화면이 뜨는지 봅니다(백엔드의 "DB 타임아웃 시험"과 같음).

흉내는 실제 기기를 다 대신하지 못합니다. S26에서 뜨지 않은 원인도 흉내로는 재현되지 않았습니다. 그래서 앱이 시작하지 못하면 **멈춘 단계와 오류를 화면에 적게** 했습니다. 서버의 헬스 체크와 오류 로그를 사용자 화면에 띄운 셈입니다.

## AriadneNSD에서 어디에 쓰나

- 유형 · 진짜와 가짜 · 추적 규칙 → [[07-testing#1. 테스트 아키텍처]]
- 지금 있는 테스트 전부(테스트 이름에서 자동으로 만듦) → [[08-test-list]]
- 결함과 그 회귀 테스트 → [[defects|결함 기록]]
- 휴대폰 테스트 `src/apps/web/e2e/mobile.spec.ts`, 시작 시간 재기 `src/apps/web/scripts/measure-startup.mjs`

## 더 읽을거리

- Martin Fowler, "The Practical Test Pyramid" (martinfowler.com)
- Playwright 문서의 "Emulation"(기기 흉내)
- web.dev의 "Lighthouse performance scoring"(모바일 측정 조건)
