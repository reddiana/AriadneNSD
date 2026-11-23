---
title: "ADR-0051: 방문 수는 Cloudflare Web Analytics로 쿠키 없이 센다"
tags:
  - adr
status: 승인
date: 2026-11-23
supersedes:
superseded-by:
---

# ADR-0051: 방문 수는 Cloudflare Web Analytics로 쿠키 없이 센다

## 배경

웹 베타를 내고 GeekNews · LinkedIn · 페이스북에 알리기 시작했지만(→ [[promotion]]), 사이트 `ariadnensd.com`(앱 · 사용법 · 갤러리 · 소개 · 설계 문서)에 몇 명이 어디서 왔는지 알 방법이 없었다. 사이트 설정은 `analytics: null`로 일부러 통계를 꺼 두었고, GitHub Pages는 방문 수를 보여 주지 않으며, Cloudflare DNS는 DNS only(회색 구름)라 Cloudflare를 거치는 트래픽도 없다. 저장소의 GitHub Traffic(14일)과 Release 내려받기 수, 글이 올라간 서비스의 조회 수만 볼 수 있었다.

공유 링크는 다이어그램 전체를 URL fragment(`#ns1.…`)에 담는다([[06-web#3. 공유 URL과 보기 모드]]). 이것이 밖으로 나가면 안 된다.

## 결정 기준

- 다이어그램 내용(fragment)을 보내지 않는다
- 쿠키를 쓰지 않아 동의 배너가 필요 없다
- 무료, 새 계정 · 서버가 없거나 적다
- 회색 구름(GitHub Pages가 인증서를 받는 설정)을 그대로 둔다
- 로컬 개발과 E2E가 외부로 요청을 보내지 않는다

## 검토한 대안

### 대안 A: Cloudflare Web Analytics (JS 스니펫)

- 장점: 도메인을 산 Cloudflare 계정에 이미 있음, 무료, 쿠키 없음. 페이지별 조회 · 유입 경로 · 나라 · 기기 · Core Web Vitals. 신호기(`beacon.min.js`)가 보내는 주소에서 `hash` · `search` · 사용자 정보를 비운다(2026-11-23 코드에서 확인)
- 단점: 이벤트(기능 사용)는 세지 못함

### 대안 B: GoatCounter

- 장점: 오픈 소스, 통계 페이지를 공개할 수 있음, 이벤트도 셈
- 단점: 새 계정, 서비스가 하나 더 늚

### 대안 C: Cloudflare 프록시(주황 구름)의 서버 쪽 집계

- 장점: 스크립트가 없음
- 단점: 2026-11-02에 주황 구름으로 두어 GitHub이 HTTPS 인증서를 받지 못했던 설정(→ [[github-pages-site]])

### 대안 D: 세지 않음(그대로)

- 장점: 아무것도 보내지 않음
- 단점: 알리는 글마다 효과를 알 수 없음

## 결정

대안 A. 사이트에 올라가는 모든 페이지(앱 `src/apps/web/index.html`, 사용법 `src/apps/manual/pages/*.html`, 갤러리 `src/apps/gallery/build.mjs`의 틀, Quartz 페이지는 `site/patch-quartz.mjs`의 패치로 `renderPage.tsx`의 `</body>` 앞)에 신호기를 넣는다. 대시보드의 스니펫을 그대로 붙이지 않고, `location.hostname`이 `ariadnensd.com`(또는 그 하위 도메인)일 때만 같은 `<script type="module" … data-cf-beacon>` 요소를 만들어 `body`에 붙인다. 그래서 localhost의 개발 · E2E는 요청을 보내지 않는다. Cloudflare의 RUM 설정은 "Enable with JS Snippet installation". 즉시 다른 주소로 넘기는 `/app/` 페이지(`site/app-redirect.html`)에는 넣지 않는다. 메인테이너가 대안 A를 골랐다(2026-11-23).

## 결과

- 좋아지는 점: 알리는 글마다 어느 사이트에서 왔는지(리퍼러)를 볼 수 있다. 신호기가 `search`를 지우므로 링크에 `?ref=…`를 달아도 대시보드에는 남지 않는다
- 감수하는 점: 스니펫이 다섯 곳에 복제되어 있다. 토큰을 바꾸면 모두 고친다. 신호기는 Cloudflare가 바꿀 수 있는 외부 스크립트다
- 후속 작업: push 뒤 대시보드에 방문이 잡히는지, 실제 요청에 fragment가 없는지 확인 → [[status]]
