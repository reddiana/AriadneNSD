---
title: "DR-0021: 사이트는 ariadnensd.com으로 옮기고, 첫 화면은 앱이다"
tags:
  - dr
status: 승인
date: 2026-11-02
supersedes:
superseded-by:
---

# DR-0021: 사이트는 ariadnensd.com으로 옮기고, 첫 화면은 앱이다

## 배경

웹 베타의 문턱에 "주소"가 있다([[dr-0018-release-stages|DR-0018]]). 널리 알린 뒤에 주소를 바꾸면 링크가 깨지기 때문이다. 도메인 `ariadnensd.com`은 2026-10-25에 Cloudflare에서 샀다([[names-and-registries]]). 사이트(`reddiana.github.io/AriadneNSD/`)의 첫 화면은 README로 만든 소개였고, 앱은 `/app/`에 있었다([[dr-0013-publish-docs-github-pages|DR-0013]]).

같은 날 비공개 문제 알리기 채널을 전용 이메일로 정했다(시안 M50: https://claude.ai/artifact/KLE5ECAE8ZT37PkasQwcLa, 저장소의 사본 `journal/assets/2026-11-02-private-report-study.html`).

## 결정 기준

- 주소는 알리기 전에 굳힌다.
- 그리기 도구를 찾아온 사람은 바로 그리고 싶다(본보기 SequenceDiagram.org, excalidraw.com은 주소를 열면 앱이다).
- 메인테이너의 개인 메일 주소는 드러내지 않는다.

## 검토한 대안

- 주소: 옮김 · 지금 주소 그대로 · 다음에 정함
- 첫 화면: 앱 · 소개 페이지(지금처럼)
- 보고 주소: `report@ariadnensd.com`(도메인 메일 전달) · 새 Gmail · 지금 쓰는 메일

## 결정

메인테이너가 2026-11-02에 골랐다.

- 사이트 전체를 `https://ariadnensd.com/`으로 옮긴다. GitHub Pages의 사용자 도메인이고, 옛 주소는 GitHub이 새 주소로 넘겨 준다.
- **첫 화면(`/`)은 앱이다.** README로 만든 소개는 `/about`, 사용법은 `/manual/`(영어) · `/manual/ko/`(한국어 → [[dr-0020-user-guide|DR-0020]]), 설계 문서는 그대로 `/docs/` · `/atelier/` · `/til/`. 옛 앱 주소 `/app/`은 첫 화면으로 넘겨 준다.
- 비공개 문제 알리기: 보이는 주소는 `report@ariadnensd.com`, 받는 곳은 새 Gmail(Cloudflare Email Routing으로 전달). 메인테이너: "노출은 1번 + 실제 받은 주소는 2번".
- README의 후원 버튼([[01-requirements#^r-all|R-ALL-01]])은 웹 베타의 문턱에서 빼고 베타 뒤로 미룬다.

## 결과

- 좋아지는 점: 주소가 짧고 제품 이름 그대로다. 찾아온 사람이 바로 그린다. 메일 주소가 도메인에 묶여, 받는 곳을 바꿔도 보이는 주소는 그대로다.
- 감수하는 점: 설계 문서 사이트의 제목(AriadneNSD)을 누르면 앱으로 간다. 소개를 보려면 `/about`으로 가야 한다. 브라우저에 남은 것(임시 보관, 환경 설정, 최근 파일)은 주소(origin)마다 따로라서 옛 주소의 것이 새 주소로 따라오지 않는다. MVP라 쓰는 사람이 적은 지금 옮긴다.
- 후속 작업: 메인테이너가 Cloudflare의 DNS · 메일 전달과 GitHub의 도메인 확인 · 사용자 도메인을 설정한다 → [[status#이번과 다음 세션에 할 것]]
