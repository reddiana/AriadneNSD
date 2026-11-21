---
title: 홍보
tags:
  - plan
updated: 2026-11-22
draft: true
---

# 홍보

> [!abstract] 이 문서는
> 웹 베타를 알리는 글의 초안과 올릴 곳의 순서입니다. 글은 Claude가 쓰고, 올리는 것은 메인테이너가 자기 계정으로 직접 합니다. 올린 뒤에는 날짜와 주소를 "올린 기록"에 적습니다.
> 이 문서는 사이트에 싣지 않습니다(속성 `draft: true`, 2026-11-22 메인테이너).

## 방향

- 대상: 알고리즘에 관심이 많은 프로그래머(2026-11-22 메인테이너).
- 첫 수: 알고리즘 갤러리 `https://ariadnensd.com/gallery/`(M70 G3, 22개)를 만들고 그 페이지를 앞세운 글 한 편. → [[status#정한 것이 어디까지 갔나]]
- 갈고리 둘: ① 알고리즘을 구조로 읽기, ② 코드를 주면 그려 주는 Claude 스킬.
- 정보처리기사 이야기는 쓰지 않는다. 알고리즘에 관심 많은 한국 개발자는 오히려 정보처리기사를 얕보는 경향이 있다(2026-11-22 메인테이너).
- 덧붙일 이야기: 백엔드 개발자가 Claude Code와 처음 만든 프론트엔드 앱이고, 설계 문서 · 결정 기록 · 세션 기록이 모두 공개되어 있음. Show HN에서는 이쪽이 더 끌릴 수도 있음.
- GeeksforGeeks는 올릴 곳에서 뺀다. 이야기를 나누는 곳이 아니라 검색해 들어와 튜토리얼을 읽는 곳이고, 기고는 편집부가 검토해 홍보 글을 받지 않는다. 그 독자층(알고리즘을 처음 배우는 사람)에게는 나중에 "NS 차트로 보는 KMP" 같은 글을 velog · dev.to에 써서 검색으로 찾아오게 한다(2026-11-22).

## 올릴 곳과 순서

갤러리가 사이트에 올라간 뒤에 올립니다. 한 번에 한 곳씩, 반응(댓글의 물음 · 버그)을 받아 고친 다음 곳으로 갑니다.

| 순서 | 곳 | 말 | 메모 |
| --- | --- | --- | --- |
| 1 | GeekNews (news.hada.io) "Show GN" | 한국어 | 한국 개발자의 첫 반응. 만든 사람이 직접 소개하는 글은 Show GN으로 |
| 2 | Hacker News "Show HN" | 영어 | 평일 미국 오전(한국 밤 10시 ~ 자정)에. 올린 뒤 몇 시간은 댓글에 답할 수 있을 때 |
| 3 | Reddit r/algorithms, r/compsci | 영어 | 자기 홍보 규칙을 먼저 읽기. 갤러리 그림 한 장을 앞세움 |
| 4 | Reddit r/programming, Lobsters | 영어 | Lobsters는 초대가 있어야 글을 씀 |
| 그 뒤 | velog · 블로그, OKKY, X · LinkedIn | 한국어 · 영어 | 반응이 좋았던 그림과 이야기로 |

## 처음 올리는 사람을 위한 단계별 안내

메인테이너는 세 곳 모두 처음 올립니다(2026-11-22). 규칙은 2026-11-22에 각 곳의 안내 페이지를 읽고 적은 것이라, 올리기 직전에 링크를 한 번 더 봅니다.

### 지금 바로: 계정을 미리 만들기

세 곳 모두 새 계정에는 제한이 있습니다. 글을 올릴 날보다 먼저 가입해 둡니다.

| 곳 | 새 계정의 제한 | 지금 할 것 |
| --- | --- | --- |
| GeekNews | 가입한 뒤 얼마 동안 글 등록이 막힘. 기간은 로그인 뒤 글등록 페이지(`/write`)에 나옴 | 가입하고 `/write`에서 기간을 확인 |
| Hacker News | 2주가 안 된 계정은 이름이 초록색으로 보임. 2026년 봄에 새 계정의 Show HN을 잠시 막은 일이 있음(공식 규칙 페이지에는 없음) | 가입하고 2주 동안 흥미로운 글에 댓글을 몇 개 닮 |
| Reddit | 서브레딧마다 계정 나이 · karma의 하한이 있을 수 있고 대개 숫자를 밝히지 않음. 자기 홍보는 활동의 10% 안팎으로 보는 곳이 많음 | 가입하고 r/algorithms · r/compsci에서 몇 주 동안 댓글로 참여. 각 서브레딧의 Rules(오른쪽 사이드바 · 고정 글)를 읽음 |

### 어디서나 지킬 것

- 아는 사람에게 추천(upvote)이나 댓글을 부탁하지 않는다. 세 곳 모두 금지이고, 걸리면 글이 묻히거나 계정이 막힌다. 링크를 퍼뜨리며 "추천 눌러 주세요"도 안 됨.
- 계정은 하나만. 같은 프로젝트를 짧은 사이에 다시 올리지 않는다(GeekNews는 큰 판을 내도 정해진 기간 안에는 다시 못 올림).
- 올린 뒤 2 ~ 3시간은 자리를 지키고 댓글에 답한다. 비판에는 고맙다고 하고 사실만 답한다. 버그 신고는 [[defects]]에 적고, 고치면 그 댓글에 알린다.
- 갤러리와 앱이 가입 없이 바로 열리는지 마지막으로 확인한다(두 곳 모두 "가입 · 이메일 없이 써 볼 수 있게"를 요구).

### 1. GeekNews (Show GN)

1. https://news.hada.io/signup 에서 가입한다. 새 계정 제한이 끝날 때까지 기다린다.
2. 상단의 "글등록"을 누른다.
3. 타입을 **Show**로 고른다(뉴스로 올리면 지워질 수 있음).
4. 제목: `AriadneNSD - 알고리즘을 NS 차트로 그리는 구조 편집기`. 형식은 "프로젝트 이름 - 핵심 기능"이고, 동기 · 이야기 · 홍보 문구는 제목에 넣지 않는다. `Show GN:`은 저절로 붙는다.
5. URL: `https://ariadnensd.com/gallery/` (단축 URL은 지워짐).
6. 본문: 아래 [[#초안 1: GeekNews (Show GN)]]의 본문을 붙인다. 무엇인지, 누가 어떻게 쓰는지, 기존 방식과 무엇이 다른지, 어떤 의견을 바라는지가 들어 있으면 된다.
7. 올린 뒤 같은 설명을 댓글로 다시 쓰지 않는다(본문에 이미 있음).

→ 규칙: [GeekNews 이용법](https://news.hada.io/guidelines), [Show GN 안내](https://news.hada.io/blog/show), [시작하기](https://news.hada.io/start)

### 2. Hacker News (Show HN)

1. https://news.ycombinator.com/login 에서 "Create Account"로 가입한다(아이디 · 비밀번호만). 2주쯤 댓글로 참여한다.
2. 올리는 때: 평일 미국 오전(한국 밤 10시 ~ 자정). 그 뒤 몇 시간 답할 수 있는 날로.
3. 상단의 "submit"을 누른다.
4. title: `Show HN: AriadneNSD – A structure editor for Nassi–Shneiderman diagrams`. 반드시 `Show HN:`으로 시작한다.
5. url: `https://ariadnensd.com/gallery/`. text 칸은 비워 둔다.
6. 올린 직후 자기 글에 [[#초안 2: Hacker News (Show HN)]]의 Text를 첫 댓글로 단다(Show HN에서 흔히 하는 방식).
7. 글이 안 보이면(새 계정 필터 등) 다시 올리지 말고 맨 아래 "Contact"의 메일(hn@ycombinator.com)로 사정을 묻는다.

→ 규칙: [Show HN 규칙](https://news.ycombinator.com/showhn.html), [HN 가이드라인](https://news.ycombinator.com/newsguidelines.html), [FAQ](https://news.ycombinator.com/newsfaq.html)

### 3. Reddit (r/algorithms · r/compsci)

1. https://www.reddit.com 에서 가입한다. 두 서브레딧에 가입(Join)하고 몇 주 동안 댓글로 참여한다.
2. 올리기 전에 서브레딧의 Rules를 읽는다. 자기 프로젝트 글을 막거나 요일 · 말머리(flair)를 정해 두는 곳이 있다. 애매하면 모더레이터에게 "Message the mods"로 미리 묻는다.
3. "Create Post"에서 글 종류를 고른다. 그림 한 장을 앞세우려면 Images로 갤러리의 그림(예: 레드블랙 트리 삽입)을 올리고 본문에 링크를 넣는다. 서브레딧이 그림 글을 막으면 Text로.
4. 제목 · 본문: [[#초안 3: Reddit (r/algorithms · r/compsci)]]. 만든 사람이 자기라는 것을 본문에 밝힌다.
5. 같은 글을 여러 서브레딧에 한꺼번에 올리지 않는다. 하나에 올리고 반응을 본 뒤 며칠 띄운다.

→ 규칙: 각 서브레딧의 Rules 탭, [Reddit 자기 홍보의 일반 관례](https://vadimkravcenko.com/qa/self-promotion-on-reddit-the-right-way/)

## 초안 1: GeekNews (Show GN)

**제목:** AriadneNSD - 알고리즘을 NS 차트로 그리는 구조 편집기 (타입을 Show로 고르면 앞에 `Show GN:`이 저절로 붙으므로 적지 않음)

**링크:** https://ariadnensd.com/gallery/

**본문:**

NS 차트(Nassi–Shneiderman Diagram) 편집기를 만들어서 웹 베타로 공개합니다.

NS 차트로 표현할 수 있는 것은 플로우차트로도 모두 표현할 수 있습니다. 다만 플로우차트는 지면을 많이 차지한다는 단점이 있습니다. 한편 NS 차트는 그리려면 연필과 지우개가 필요하지요. 한번에 그리기 힘들어 지우고 줄맞춰서 다시 그리기를 반복해야합니다. NS 차트 툴이 없으면 복잡한 로직은 그리기 힘들었습니다. 

AriadneNSD는 상자를 직접 그리는 게 아니라 블록을 골라서 for · if로 감싸는 식이라, 줄 맞추고 상자 크기 맞추는 일은 없습니다. 저장하면 `.ns.svg`가 나오는데, 보통 SVG라 README에 그냥 넣으면 그림으로 보이고 편집기에서 다시 열면 고칠 수 있습니다(drawio-obsidian 방식을 따라 했습니다).

써 보시라고 알고리즘 22개를 그려 놨습니다. KMP, 유니온 파인드, 레드블랙 트리 삽입, 에드먼즈-카프, N-Queen 같은 것들이고, 그림마다 편집기로 바로 열립니다.

Claude 쓰시는 분은 스킬을 깔면 "이 함수 NS 차트로 그려 줘" 하면 그려 줍니다.

백엔드만 하던 사람이 Claude Code로 처음 만들어 본 프론트엔드입니다. 설계 문서랑 세션 기록도 다 공개해 뒀습니다: https://ariadnensd.com/about

- 앱: https://ariadnensd.com/
- GitHub: https://github.com/reddiana/AriadneNSD

아직 베타입니다. 버그와 의견을 알려 주시면 감사하겠습니다.

## 초안 2: Hacker News (Show HN)

**Title:** Show HN: AriadneNSD – A structure editor for Nassi–Shneiderman diagrams

**URL:** https://ariadnensd.com/gallery/

**Text (첫 댓글로 올림):**

Hi HN, I built a web editor for Nassi–Shneiderman diagrams (structograms), the box-in-box flowcharts from the 70s that many of us met in school.

Anything an NS chart shows, a flowchart can show too, but a flowchart takes up a lot of space. NS charts are compact, but drawing one by hand meant a pencil and an eraser: you rarely get it right the first time, so you keep erasing and redrawing to line things up. Without a tool, complex logic was hard to draw at all.

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

- 2026-11-22 02:15 [AriadneNSD - NS 차트 편집기 | GeekNews](https://news.hada.io/topic?id=37587)
