---
title: 홍보
tags:
  - plan
updated: 2026-11-22
---

# 홍보

> [!abstract] 이 문서는
> 웹 베타를 알리는 글의 초안과 올릴 곳의 순서입니다. 글은 Claude가 쓰고, 올리는 것은 메인테이너가 자기 계정으로 직접 합니다. 올린 뒤에는 날짜와 주소를 "올린 기록"에 적습니다.

## 방향

- 대상: 알고리즘에 관심이 많은 프로그래머(2026-11-22 메인테이너).
- 첫 수: 알고리즘 갤러리 `https://ariadnensd.com/gallery/`(M70 G3, 21개)를 만들고 그 페이지를 앞세운 글 한 편. → [[status#정한 것이 어디까지 갔나]]
- 갈고리 둘: ① 알고리즘을 구조로 읽기(한국 개발자에게는 "정보처리기사에서 보던 NS 차트"), ② 코드를 주면 그려 주는 Claude 스킬.
- 덧붙일 이야기: 백엔드 개발자가 Claude Code와 처음 만든 프론트엔드 앱이고, 설계 문서 · 결정 기록 · 세션 기록이 모두 공개되어 있음. Show HN에서는 이쪽이 더 끌릴 수도 있음.

## 올릴 곳과 순서

갤러리가 사이트에 올라간 뒤에 올립니다. 한 번에 한 곳씩, 반응(댓글의 물음 · 버그)을 받아 고친 다음 곳으로 갑니다.

| 순서 | 곳 | 말 | 메모 |
| --- | --- | --- | --- |
| 1 | GeekNews (news.hada.io) "Show GN" | 한국어 | 한국 개발자의 첫 반응. 만든 사람이 직접 소개하는 글은 Show GN으로 |
| 2 | Hacker News "Show HN" | 영어 | 평일 미국 오전(한국 밤 10시 ~ 자정)에. 올린 뒤 몇 시간은 댓글에 답할 수 있을 때 |
| 3 | Reddit r/algorithms, r/compsci | 영어 | 자기 홍보 규칙을 먼저 읽기. 갤러리 그림 한 장을 앞세움 |
| 4 | Reddit r/programming, Lobsters | 영어 | Lobsters는 초대가 있어야 글을 씀 |
| 그 뒤 | velog · 블로그, OKKY, X · LinkedIn | 한국어 · 영어 | 반응이 좋았던 그림과 이야기로 |

## 초안 1: GeekNews (Show GN)

**제목:** Show GN: AriadneNSD – 알고리즘을 NS 차트로 그리는 구조 편집기

**링크:** https://ariadnensd.com/gallery/

**본문:**

정보처리기사 공부할 때 보던 NS 차트(Nassi–Shneiderman Diagram)를 그리는 웹 편집기를 만들었습니다. 지금 웹 베타입니다.

- 블록을 고르고 반복 · 분기로 감싸는 **구조 편집**이라, 상자를 끌어 맞출 필요 없이 레이아웃이 저절로 맞춰집니다. 키보드만으로도 그립니다.
- 저장 파일(`.ns.svg`)은 어디서나 보이는 SVG 그림이면서, 다시 열어 편집할 수 있는 원본입니다. GitHub README에 그대로 넣을 수 있습니다.
- 설치도 서버도 없이 브라우저에서 열리고, 내 컴퓨터의 파일에 저장합니다. 공유 링크로 다이어그램을 통째로 주고받을 수 있습니다.
- Claude 스킬을 설치하면 "이 함수를 NS 차트로 그려 줘"로 코드에서 다이어그램을 만들 수 있습니다.

알고리즘 갤러리에 고전(힙 정렬, KMP, 유니온 파인드, 위상 정렬, 배낭 DP …)부터 레드블랙 트리 삽입, A*, 최대 유량, 하노이 탑, N-Queen까지 21개를 그려 두었습니다. 그림마다 편집기에서 바로 열립니다. 코드로 읽을 때와 구조로 읽을 때 어떻게 다른지 봐 주시면 좋겠습니다.

백엔드 개발자가 Claude Code와 함께 처음 만든 프론트엔드 앱이고, 요구사항 · 설계 문서와 결정 기록, 세션 기록까지 모두 공개되어 있습니다: https://ariadnensd.com/about

- 앱: https://ariadnensd.com/
- 저장소: https://github.com/reddiana/AriadneNSD (Apache-2.0)

버그나 불편한 곳은 댓글이나 이슈로 알려 주세요.

## 초안 2: Hacker News (Show HN)

**Title:** Show HN: AriadneNSD – A structure editor for Nassi–Shneiderman diagrams

**URL:** https://ariadnensd.com/gallery/

**Text (첫 댓글로 올림):**

Hi HN, I built a web editor for Nassi–Shneiderman diagrams (structograms), the box-in-box flowcharts from the 70s that many of us met in school.

You don't draw boxes. You select blocks and wrap them in loops or branches, and the layout follows. It works from the keyboard. The saved file is an `.ns.svg`: a plain SVG that renders anywhere (GitHub READMEs included) and also carries the diagram, so the editor can open it again. It runs in the browser with no install and no server; files stay on your disk, and a share link carries the whole diagram in the URL.

The gallery has 21 algorithms drawn with it, from KMP and union-find to red-black tree insertion, A*, Edmonds–Karp and N-Queens. Each one opens in the editor. I'm curious whether reading an algorithm as nested structure helps you the way it helps me.

There is also a Claude skill: ask "draw this function as an NS chart" and you get the file and a link.

Some background: I'm a backend developer and this is my first frontend app, built with Claude Code. The requirements, design docs, decision records and session logs are public (in Korean): https://ariadnensd.com/about

It's a beta, so the file format may still change before 1.0. Code: https://github.com/reddiana/AriadneNSD (Apache-2.0). Feedback and bug reports are very welcome.

## 초안 3: Reddit (r/algorithms · r/compsci)

**Title:** I drew 21 classic algorithms as Nassi–Shneiderman diagrams (KMP, red-black insert, A*, max flow…)

**Body:**

Nassi–Shneiderman diagrams show control flow as nested boxes, so loops and branches read as shapes instead of indentation. I made a small editor for them and used it to draw a gallery of algorithms: https://ariadnensd.com/gallery/

Every diagram opens in the editor if you want to change it or trace it step by step. Which algorithm would you like to see drawn next, and is there one you think this notation makes clearer, or worse?

(Editor: https://ariadnensd.com/, open source under Apache-2.0: https://github.com/reddiana/AriadneNSD)

## 올리기 전에 확인할 것

- [ ] 갤러리가 사이트에 있고, 21개 모두 "편집기에서 열기"가 열림
- [ ] 글의 숫자(21개)와 이름이 갤러리와 같음
- [ ] 갤러리 주소로 공유했을 때의 미리보기 그림(OG 이미지)
- [ ] 휴대폰에서 갤러리와 앱이 열림

## 올린 기록

아직 없습니다.
