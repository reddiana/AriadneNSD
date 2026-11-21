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
- 첫 수: 알고리즘 갤러리 `https://ariadnensd.com/gallery/`(M70 G3, 22개)를 만들고 그 페이지를 앞세운 글 한 편. → [[status#정한 것이 어디까지 갔나]]
- 갈고리 둘: ① 알고리즘을 구조로 읽기, ② 코드를 주면 그려 주는 Claude 스킬.
- 정보처리기사 이야기는 쓰지 않는다. 알고리즘에 관심 많은 한국 개발자는 오히려 정보처리기사를 얕보는 경향이 있다(2026-11-22 메인테이너).
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

**제목:** Show GN: AriadneNSD – 블록을 감싸서 그리는 NS 차트 편집기

**링크:** https://ariadnensd.com/gallery/

**본문:**

NS 차트(Nassi–Shneiderman Diagram) 편집기를 웹 베타로 공개합니다.

〔왜 만들었는지 한두 문장: 메인테이너의 말로〕

상자를 직접 그리지 않습니다. 블록을 고르고 for나 if로 감싸면 레이아웃은 알아서 맞춰집니다. 키보드만으로도 됩니다.

저장하면 `.ns.svg` 파일이 나옵니다. 그냥 SVG라서 README나 블로그에 넣으면 그림으로 보이고, 같은 파일을 편집기에서 다시 열면 고칠 수 있습니다. 그림 따로, 편집용 파일 따로 챙기지 않아도 됩니다.

링크로 들어가면 알고리즘 22개를 그려 둔 갤러리가 나옵니다. KMP, 유니온 파인드, 레드블랙 트리 삽입, 에드먼즈-카프, N-Queen 같은 것들이고, 그림마다 편집기로 바로 열립니다. 〔그려 보고 재미있던 것 한 줄: 메인테이너가 직접 본 것으로. 예: 레드블랙 트리 fix-up의 좌우 대칭〕

Claude를 쓰신다면 스킬을 설치해 두고 "이 함수 NS 차트로 그려 줘"라고 하면 됩니다.

백엔드만 하던 사람이 Claude Code로 처음 만든 프론트엔드라, 설계 문서와 작업 기록도 같이 공개해 뒀습니다: https://ariadnensd.com/about

- 앱: https://ariadnensd.com/
- GitHub: https://github.com/reddiana/AriadneNSD

베타라 버그가 꽤 있을 겁니다. 댓글이나 이슈로 알려 주시면 고치겠습니다.

## 초안 2: Hacker News (Show HN)

**Title:** Show HN: AriadneNSD – A structure editor for Nassi–Shneiderman diagrams

**URL:** https://ariadnensd.com/gallery/

**Text (첫 댓글로 올림):**

Hi HN, I built a web editor for Nassi–Shneiderman diagrams (structograms), the box-in-box flowcharts from the 70s that many of us met in school.

You don't draw boxes. You select blocks and wrap them in loops or branches, and the layout follows. It works from the keyboard. The saved file is an `.ns.svg`: a plain SVG that renders anywhere (GitHub READMEs included) and also carries the diagram, so the editor can open it again. It runs in the browser with no install and no server; files stay on your disk, and a share link carries the whole diagram in the URL.

The gallery has 22 algorithms drawn with it, from KMP and union-find to red-black tree insertion, A*, Edmonds–Karp and N-Queens. Each one opens in the editor. I'm curious whether reading an algorithm as nested structure helps you the way it helps me.

There is also a Claude skill: ask "draw this function as an NS chart" and you get the file and a link.

Some background: I'm a backend developer and this is my first frontend app, built with Claude Code. The requirements, design docs, decision records and session logs are public (in Korean): https://ariadnensd.com/about

It's a beta, so the file format may still change before 1.0. Code: https://github.com/reddiana/AriadneNSD (Apache-2.0). Feedback and bug reports are very welcome.

## 초안 3: Reddit (r/algorithms · r/compsci)

**Title:** I drew 22 classic algorithms as Nassi–Shneiderman diagrams (KMP, red-black insert, A*, max flow…)

**Body:**

Nassi–Shneiderman diagrams show control flow as nested boxes, so loops and branches read as shapes instead of indentation. I made a small editor for them and used it to draw a gallery of algorithms: https://ariadnensd.com/gallery/

Every diagram opens in the editor if you want to change it or trace it step by step. Which algorithm would you like to see drawn next, and is there one you think this notation makes clearer, or worse?

(Editor: https://ariadnensd.com/, open source under Apache-2.0: https://github.com/reddiana/AriadneNSD)

## 올리기 전에 확인할 것

- [ ] 갤러리가 사이트에 있고, 22개 모두 "편집기에서 열기"가 열림
- [ ] 글의 숫자(22개)와 이름이 갤러리와 같음
- [ ] 갤러리 주소로 공유했을 때의 미리보기 그림(OG 이미지)
- [ ] 휴대폰에서 갤러리와 앱이 열림

## 올린 기록

아직 없습니다.
