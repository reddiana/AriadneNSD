---
title: 2026-11-22 갤러리 링크의 SPA, GeekNews 다시 올리기, report 메일 예약 작업
tags:
  - session
date: 2026-11-22
---

# 2026-11-22 갤러리 링크의 SPA, GeekNews 다시 올리기, report 메일 예약 작업

"publishing한 page에서 링크를 따라 갤러리에 들어가면 알고리즘들이 안 나옵니다."로 시작했다.

## 논의 흐름

1. **갤러리가 비어 보임.** 주소를 바로 열면 정상이고, 사이트(Quartz) 페이지의 링크를 누르면 SPA가 `/gallery/ko/`를 받아 본문만 갈아 끼워 갤러리 스크립트가 돌지 않았다. 앱 · 사용법처럼 SPA가 가로채지 않는 주소에 `gallery/`를 더함(`site/patch-quartz.mjs`, `c4cb34f`) → [[dr-0021-domain-and-front-page|DR-0021]]
	- 로컬에서 빌드해 소개 페이지 → 갤러리로 넘어가 새로 불러오고 목록 22개가 도는 것을 확인.
	- 확인하다 만난 것: 8080에 남아 있던 `quartz build --serve`(감시 모드)가 빌드 뒤에 `public`을 다시 써 앱 · 갤러리를 지웠다. 끄는 것은 권한에 막혀 그대로 두고, 로컬 사이트 미리보기를 `.claude/launch.json`의 `site`(8090)로 더함.
2. **HN · Reddit에 몇 주 댓글을 다는 것.** 메인테이너: "Hacker News나 Reddit에 몇 주 동안 댓글 참여하는게 중요한가요?" → Reddit은 자동 필터(계정 나이 · karma) 때문에 중요하고, HN은 올린 뒤 댓글에 답하는 것이 더 중요. [[promotion]]의 순서 그대로.
3. **메일 · 댓글 지켜보기.** 메인테이너: "report@ariadnensd.com으로 들어오는 메일이나 HN 댓글을 모니터링해서 알려줄 수 있나요?", "Show GN은 어떤가요?" → GeekNews는 API · 댓글 피드가 없지만 글 페이지에 댓글이 로그인 없이 보임.
4. **GeekNews 글을 지우고 다시 올림.** 메인테이너: "GN에 올린 글이 마음에 안 드네요. 삭제하고 다시 올리고 싶어요" → 수정 링크가 없고, [FAQ](https://news.hada.io/faq)상 올린 지 2시간 안에만 지울 수 있음. 메인테이너가 지움. "https://news.hada.io/topic?id=33664 을 참고해서 다시 작성하고 싶어요" → 초안 1을 GN 글의 형식(글머리표, 명사형 끝맺음, 굵게는 핵심 말만)으로. 메인테이너가 본문을 직접 다듬고 링크를 `/about`으로.
	- 메인테이너: "다른 NSD편집기 대비 AriadneNSD의 장점이 안 보여요." → "다른 NS 차트 도구와 다른 점"(저장한 파일이 곧 그림, 설치 없이 브라우저; Structorizer · PPT · draw.io와 비교) 줄을 더하고 제목도 바꿨으나, 메인테이너: "GN 제목 원복해주세요. 이전 제목으로 올렸어요." → 제목은 앞 제목.
	- 새 글: https://news.hada.io/topic?id=37589 (메인테이너가 [[promotion#올린 기록]]에 적음)
5. **report 메일을 클라우드 예약 작업으로.** 메인테이너: "클라우드 예약으로 report@ariadnensd.com 체크하면 좋겠는데 말이죠.", "2번으로 해 주세요." → 클라우드 routine "AriadneNSD report 메일 정리"(https://claude.ai/code/routines/trig_01J1zeLEEXPSFnWbga9aaxei): 매일 9시 · 21시(KST), Sonnet, Gmail 커넥터만. 새 메일에 `AriadneNSD/report` 라벨과 답장 초안, 실행 기록에 한국어 요약. 보내기 · 지우기 없음, 메일 내용은 저장소에 쓰지 않음.
	- 메인테이너가 naver에서 시험 메일을 보냈으나 연결된 Gmail(메인테이너의 개인 Gmail)에 오지 않음. report@는 Cloudflare Email Routing으로 **따로 만든 Gmail**로 전달되기 때문(DR-0021). 그 Gmail에서 개인 Gmail로 자동 전달을 켜는 방법을 추천(메인테이너가 할 일).

## 결정

- 사이트의 SPA는 `/gallery/`도 가로채지 않음 → [[dr-0021-domain-and-front-page|DR-0021]]
- GeekNews 초안 1은 GN 글의 형식으로, 제목은 "AriadneNSD - 알고리즘을 NS 차트로 그리는 구조 편집기" → [[promotion#초안 1: GeekNews (Show GN)]]
- report 메일은 클라우드 예약 작업이 라벨 · 답장 초안 · 요약을 만든다(알림은 Gmail 앱)

## 위험

- 초안 1의 Structorizer 설명(".nsd는 XML이라 그림은 따로 내보내야 함")은 Structorizer 사이트에서 다시 확인하지 않았다. GeekNews 댓글에서 물으면 확인할 것.
- 예약 작업이 클라우드에서 Gmail 커넥터를 실제로 쓰는지는 첫 실행 기록을 봐야 안다.
- 8080의 `quartz build --serve`가 남아 있으면 로컬 빌드의 `public`을 다시 쓴다.

## 다음 할 일

- 메인테이너: 따로 만든 Gmail → 개인 Gmail 자동 전달, 시험 메일 다시 → Claude가 예약 작업의 실행 기록 확인 → [[status#이번과 다음 세션에 할 것]]
- GeekNews 글(37589)의 댓글 지켜보기, 그다음 Show HN · Reddit → [[promotion]]
