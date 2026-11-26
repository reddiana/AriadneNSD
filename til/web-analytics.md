---
title: 정적 사이트의 방문 수 세기
tags:
  - til
updated: 2026-11-27
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

## 여러 번 들어오면, 내 방문은

- 쿠키가 없어 같은 사람을 알아보지 못하므로 들어올 때마다 따로 센다. Visits는 다른 사이트 · 주소창에서 들어와 연 횟수, Page views는 연 페이지 수(사이트 안의 이동 · 새로 고침 포함). 순 방문자 수는 없다.
- Cloudflare 대시보드에는 IP나 방문자를 빼는 설정이 없고, 이미 잡힌 방문은 지울 수 없다. 그래서 신호를 처음부터 보내지 않게 해야 한다: 광고 차단기로 `static.cloudflareinsights.com`을 막거나, 페이지 코드에 "세지 않기" 표시를 둔다.
- AriadneNSD는 뒤의 길: `https://ariadnensd.com/?nocount`를 한 번 열면 그 브라우저(프로필마다, 기기마다)의 `localStorage`에 표시가 남아 사이트 전체에서 빠진다. `?count`로 되돌린다. InPrivate 창과 사이트 데이터를 지운 뒤에는 다시 센다 → [[06-web#5.2 방문 수]]

## 대시보드에서 어디를 보나 (2026-11-27)

Cloudflare 대시보드에는 Analytics가 두 곳 있습니다.

| 자리 | 무엇 | 우리 사이트에서 |
| --- | --- | --- |
| 도메인(`ariadnensd.com`) 안의 Analytics | Cloudflare 프록시를 거친 요청 수 | 0. 사이트를 GitHub Pages가 내보내서 프록시를 거치지 않음 |
| 계정 메뉴의 관찰 가능성 › Analytics › Web Analytics | 페이지에 넣은 스크립트가 센 방문 · 페이지 보기 · 유입 경로 · 나라 · 기기, 그리고 Core Web Vitals | 여기를 본다 |

백엔드에 빗대면, 앞의 것은 로드 밸런서의 액세스 로그이고 뒤의 것은 클라이언트가 보내는 RUM(Real User Monitoring)입니다.

## Core Web Vitals

실제 방문자의 브라우저가 잰 품질 지표 셋입니다. 각각 좋음 · 개선 필요 · 나쁨의 비율로 나오고, URL · 요소 탭과 "디버그 보기"로 원인이 된 요소를 CSS 선택자로 볼 수 있습니다.

- LCP(Largest Contentful Paint): 화면에서 가장 큰 그림이나 글 덩어리가 그려지기까지. 응답 시간의 p95 같은 것
- INP(Interaction to Next Paint): 클릭 · 키에 다음 화면이 그려지기까지. 우리 AT-05(편집 반응)와 같은 종류
- CLS(Cumulative Layout Shift): 늦게 커진 요소가 아래를 밀어낸 정도. 2026-11-27에 문서 사이트의 `> [!tip]` 콜아웃과 사용법의 `#ai` 꼭지가 원인으로 나옴

표본이 작을 때(하루 방문 수십)는 비율이 한두 방문에 크게 흔들립니다. 기간을 7일로 넓혀 봅니다.
