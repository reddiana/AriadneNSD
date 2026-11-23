---
title: 2026-11-23 앱 · 사이트의 방문 수를 Cloudflare Web Analytics로
tags:
  - session
date: 2026-11-23
---

# 2026-11-23 앱 · 사이트의 방문 수를 Cloudflare Web Analytics로

"앱과 페이지가 얼마나 노출되었는지 알 수 있는 방법을 제안해주세요."로 시작했다. inbox는 비어 있었다.

## 논의 흐름

1. **지금 볼 수 있는 것.** 사이트는 `analytics: null`로 통계를 일부러 꺼 두었고, GitHub Pages는 방문 수가 없고, Cloudflare는 DNS only라 거치는 트래픽이 없다. 코드 없이 볼 수 있는 것: GitHub Traffic(14일. 이날 조회 94 · 방문자 6, 유입 ariadnensd.com · LinkedIn · GeekNews 각 1명), Release 내려받기(v0.4.0 zip 1회), 스타 1, 글이 올라간 서비스의 조회 수, Google Search Console.
2. **방문 수 세기.** 쿠키 없는 스크립트로 Cloudflare Web Analytics(추천) · GoatCounter · 주황 구름(인증서 문제로 비추천)을 견줌. 메인테이너가 Cloudflare Web Analytics를 고름(`c6b015d`).
3. **Cloudflare 화면.** 처음에 "자동 설치 말고 JS 스니펫을 고르라"고 안내했는데 메인테이너: "자동 설치나 JS snippet을 선택하는 부분이 없었던 것 같아요." 공식 문서를 읽고 순서를 고침(`3a3b578`). 메인테이너가 이미 사이트를 등록해 두었고, Edge라서 Chrome 확장이 닿지 않았다가 Chrome으로 연 뒤 함께 봄. 선택지는 등록 뒤 Manage site의 RUM 설정에 있었다(Enable · EU 빼고 · JS Snippet installation · Disable). 메인테이너가 "Enable with JS Snippet installation"으로 바꾸고, Claude가 Chrome으로 저장된 것을 확인.
4. **구현.** 에이전트가 앱 · 사용법 · 갤러리 · Quartz 페이지에 신호기를 넣음. `ariadnensd.com`에서만 불러와 로컬 · E2E는 요청을 보내지 않음. 신호기 코드(`beacon.min.js`)가 보내는 주소의 `hash` · `search`를 비우는 것을 확인 → 공유 링크의 다이어그램은 나가지 않음(`a368ed9`).
5. **매듭.** 메인테이너: "테스트를 돌릴만한 변경이 있었나요?" → 없었다. HTML 끝의 스크립트뿐이고 localhost에서는 아무 일도 하지 않는다. 돌던 `pnpm check` · E2E를 멈추고, 사이트 빌드(소개 · 404 페이지에 신호기 1회)와 포맷 검사만 함.

## 결정

- 방문 수는 Cloudflare Web Analytics로 쿠키 없이 센다 → [[0051-cloudflare-web-analytics|ADR-0051]], [[06-web#5.2 방문 수]], README 두 판에 한 줄

## 발견한 것

- 처음 안내에서 `?ref=fb`를 링크에 달면 유입을 갈라 볼 수 있다고 했으나, 신호기가 `search`를 지워서 대시보드에 남지 않는다. 유입은 리퍼러(어느 사이트에서 왔나)로만 본다.
- Claude in Chrome은 Chrome에서만 닿는다. 메인테이너가 Edge로 연 화면은 볼 수 없었다.
- `doc-check.py`에 파일을 넘기면 멈추는 일이 이번에도 있었다(`--all`로).

## 다음 할 일

- push 뒤 사이트를 열어 Cloudflare 대시보드에 방문이 잡히는지, 실제 요청에 `#` 뒤가 없는지 확인 → [[status]]
