---
title: 정적 사이트의 방문 수 세기
tags:
  - til
updated: 2026-11-23
---

# 정적 사이트의 방문 수 세기

> "앱과 페이지가 얼마나 노출되었는지 알 수 있는 방법을 제안해주세요." (메인테이너, 2026-11-23)

## 한 줄 요약

GitHub Pages는 방문 수를 알려 주지 않는다. 페이지에 작은 스크립트(신호기, beacon)를 넣어 방문할 때마다 집계 서비스로 한 번 알리게 하거나, 앞단의 프록시(CDN)가 요청을 세게 한다.

## 볼 수 있는 숫자들

| 어디 | 무엇 | 한계 |
| --- | --- | --- |
| GitHub › Insights › Traffic | 저장소 페이지의 조회 · 방문자 · 유입 사이트, clone 수 | 14일만 남음. 사이트(`ariadnensd.com`)가 아니라 저장소 |
| GitHub Releases | 첨부 파일의 내려받기 수(`gh api repos/<계정>/<저장소>/releases`) | 파일만 |
| 글을 올린 서비스 | LinkedIn의 노출 · GeekNews의 조회 · 페이스북의 도달 | 그 글만 |
| Google Search Console | 검색 결과에 나온 횟수 · 클릭 · 검색어 | DNS에 TXT 한 줄로 인증 |
| 신호기 스크립트(Cloudflare Web Analytics, GoatCounter, Plausible 등) | 페이지별 조회, 유입 사이트(리퍼러), 나라, 기기 | 광고 차단기가 막으면 세지 못함 |
| 프록시 서버 쪽 집계(Cloudflare 주황 구름) | 모든 요청 | 봇도 섞임. GitHub Pages의 인증서 발급과 부딪힐 수 있음 |

## 쿠키 없는 집계

쿠키를 쓰지 않는 서비스는 "같은 사람"을 며칠씩 추적하지 않고 그날의 방문만 센다. 그래서 동의 배너가 필요 없다. 대신 재방문은 정확히 가르지 못한다.

## URL에서 무엇이 나가나

주소 `https://ariadnensd.com/manual/?ref=fb#tour`는 `origin`(`https://ariadnensd.com`) · `pathname`(`/manual/`) · `search`(`?ref=fb`) · `hash`(`#tour`)로 나뉜다. `hash`는 브라우저가 서버로 보내지 않지만, 페이지의 스크립트는 `location.href`로 읽을 수 있다. 그래서 신호기가 무엇을 보내는지 코드에서 확인했다. Cloudflare의 신호기는 보내기 전에 `hash`와 `search`를 비운다. AriadneNSD의 공유 링크는 다이어그램을 `hash`에 담으므로 이것이 중요했다 → [[0051-cloudflare-web-analytics|ADR-0051]]

## Cloudflare Web Analytics의 두 길

- 프록시(주황 구름)를 쓰는 사이트: Cloudflare가 페이지에 스크립트를 자동으로 넣는다.
- DNS only(회색 구름, AriadneNSD): 자동으로 넣을 수 없다. Web Analytics › Add a site로 호스트 이름을 등록하고, Manage site의 RUM 설정을 "Enable with JS Snippet installation"으로 두고, 나온 스니펫을 페이지의 `</body>` 앞에 직접 붙인다.
