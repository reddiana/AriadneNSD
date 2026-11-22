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
| 따로 | LinkedIn | 한국어 + 영어 | 순서와 상관없이. 보는 사람이 1촌(동료 · 지인)이라 다른 곳과 겹치지 않음. 제품이 아니라 "백엔드 개발자가 Claude Code와 처음 만든 프론트엔드 앱"을 앞세움(2026-11-22 메인테이너) → [[#초안 4: LinkedIn]] |
| 따로 | 페이스북 그룹 | 한국어 | 순서와 상관없이. 그룹의 성격(개발자 일반 · AI 활용 · 알고리즘)에 맞춰 앞세울 것을 고름. 그룹 규칙을 먼저 읽고, 한 곳씩 며칠 띄워 올림(2026-11-22 메인테이너) → [[#초안 5: 페이스북 그룹]] |
| 그 뒤 | velog · 블로그, OKKY, X | 한국어 · 영어 | 반응이 좋았던 그림과 이야기로 |

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

**링크:** https://ariadnensd.com/about

**본문:**

(GeekNews 글의 형식을 따름: 글머리표만, 명사형 끝맺음, 핵심 말만 굵게, 들여쓰기 한 단계. 본 글 https://news.hada.io/topic?id=33664)

- 알고리즘을 **NS 차트**(Nassi–Shneiderman Diagram)로 그리는 웹 편집기, 베타로 공개
- 다른 NS 차트 도구와 다른 점: **저장한 파일이 곧 그림**이고, **설치 없이 브라우저**에서 그림
	- Structorizer는 Java 데스크톱 앱이고, 저장 파일(.nsd)은 XML이라 그림은 따로 내보내야 함
	- PPT · draw.io는 상자를 손으로 그려서 블록 하나 넣으면 아래를 다시 맞춰야 함. 여기서는 블록을 골라 for · if로 감싸면 레이아웃이 자동
- NS 차트는 플로우차트와 동일하게 로직을 표현하면서 **지면은 훨씬 적게** 차지하지만, 손으로는 줄 맞추고 지우기를 반복해야 해서 복잡한 로직은 그리기 어려웠음
- 저장 형식 `.ns.svg`는 NS 차트의 **다이어그램 구조를 메타에 포함**하고있는 **.svg** 파일
	- README 등 Markdown 문서에 삽입하면 그림으로 보임
	- AriadneNSD 편집기에서 열면 다이어그램 편집 가능
- **Claude 스킬** 제공: "이 함수 NS 차트로 그려 줘"라고 하면 .svg 파일과 AriadneNSD에서 바로 편집 가능한 공유 링크를 만듦
- 아키텍처 문서와 세션 기록 등 개발 여정까지 모두 공개
- 앱: https://ariadnensd.com/ 
- 소개: https://ariadnensd.com/about
- 알고리즘 갤러리: https://ariadnensd.com/gallery/
- GitHub: https://github.com/reddiana/AriadneNSD 
- 아직 베타입니다. 버그레포팅 · 의견 환영합니다.

**실제로 올린 본문**: (달님이 다른 도구들과의 비교를 보완해준 부분을 못 보고 올렸음)
- 알고리즘을 **NS 차트**(Nassi–Shneiderman Diagram)로 그리는 웹 편집기, 베타로 공개
- NS 차트는 플로우차트와 동일하게 로직을 표현하면서 **지면은 훨씬 적게** 차지하지만, 손으로는 줄 맞추고 지우기를 반복해야 해서 복잡한 로직은 그리기 어려웠음
- 저장 형식 `.ns.svg`는 NS 차트의 **다이어그램 구조를 메타에 포함**하고있는 **.svg** 파일
    - README 등 Markdown 문서에 삽입하면 그림으로 보임
    - AriadenNSD 편집기에서 열면 다이어그램 편집 가능
- **Claude 스킬** 제공: "이 함수 NS 차트로 그려 줘"라고 하면 .svg 파일과 AriadenNSD에서 바로 편집 가능한 공유 링크를 만듦
- 아키텍처 문서와 세션 기록 등 개발 여정까지 모두 공개
- 앱: [https://ariadnensd.com/](https://ariadnensd.com/)
- 소개: [https://ariadnensd.com/about](https://ariadnensd.com/about)
- 알고리즘 갤러리: [https://ariadnensd.com/gallery/](https://ariadnensd.com/gallery/)
- GitHub: [https://github.com/reddiana/AriadneNSD](https://github.com/reddiana/AriadneNSD)
- 아직 베타입니다. 버그레포팅 · 의견 환영합니다.

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

## 초안 4: LinkedIn

(만든 과정을 앞세움, 한국어 위 · 영어 아래. 3,000자 안. 숫자는 2026-11-22 기준. "해 보며 배운 것"은 Claude가 기록에서 고른 것이라 메인테이너의 말로 고쳐 쓰기)

**붙일 동영상:** 빈 문서에서 힙 정렬을 키보드로 만드는 49초짜리 동영상(반복문을 먼저 만들고, 같은 로직을 새 Method로 뺌. 복사 · 붙여넣기 · 감싸기 없음) `journal/assets/2026-11-22-linkedin-heap-sort.mp4`(1080×1080, MP4, 누른 키를 오른쪽 아래에 보임, 접기 영역 없음). 미리보기 그림이 필요하면 완성 화면 `journal/assets/2026-11-22-linkedin-heap-sort-final.png`. 다시 뽑기: `src/apps/web/promo/record.mjs`

**붙여넣을 때:** LinkedIn은 붙여넣은 글의 빈 줄을 지운다. 빈 줄마다 보이지 않는 글자 `U+2800`(⠀)을 하나 넣은 본문을 붙인다(2026-11-22에 이렇게 고침). 그래도 사라지면 `Ctrl`+`Shift`+`V`나 수정 창에서 `Enter`를 직접

**본문:**

AriadneNSD: 알고리즘을 NS 차트(Nassi–Shneiderman Diagram)로 그리는 웹 편집기입니다. NS 차트는 플로우차트와 같은 로직을 훨씬 적은 지면에 담지만, 손으로 그리려면 줄을 맞추고 지우기를 되풀이해야 해서 복잡한 로직은 그리기 어려웠습니다. AriadneNSD에서는 복잡한 알고리즘도 화면에 보이는 그대로(WYSIWYG) NS 차트로 쉽게 그릴 수 있습니다.  
⠀  
저장 형식인 .ns.svg는 다이어그램 구조를 메타데이터로 담은 SVG 파일입니다. README 같은 Markdown 문서에 넣으면 그림으로 보이고, AriadneNSD 편집기로 열면 다시 편집할 수 있습니다.  
⠀  
빈 저장소에서 시작해 6주 반 동안 58번의 세션을 거쳤습니다.  
• 코드보다 먼저 요구사항과 아키텍처를 정의했습니다  
• 결정은 ADR(아키텍처) 40건 · DR(그 밖) 22건으로 기록했습니다  
• Claude의 말로만 판단하기 어려운 것은 시안을 그리도록 하였습니다(70여 개)  
• 테스트는 단위 · 통합 1,685개, E2E 83개입니다  
⠀  
해 보며 배운 것  
• Claude에게 많이 맡길수록 문서가 더 중요해졌습니다. 세션 사이에 기억이 없는 Claude가 어제 하던 일을 이어 갈 수 있었던 것은 문서 덕분이었습니다.  
• 저는 무엇을 왜 만들지를 정하고, 구현과 검사는 Claude 에이전트들이 병렬로 맡았습니다.  
• Claude와의 협업은 예전에 인도 GDC(Global Delivery Center)와 함께 프로젝트를 성공적으로 이끌었던 경험과 닮았습니다. 지금까지 저의 결론은, GDC와 협업하는 것과 AI를 활용하는 것은 근본적으로 같은 원리라는 것입니다.  
⠀  
요구사항, 설계 문서, 결정 기록, 세션 기록까지 모두 공개되어 있습니다. AI와 함께 제품을 만드는 과정이 궁금한 분께 참고가 되면 좋겠습니다. 링크는 첫 댓글에 있습니다.  
⠀  
―  
⠀  
AriadneNSD is a web editor for Nassi–Shneiderman diagrams (structograms). An NS chart shows the same logic as a flowchart in far less space, but drawing one by hand meant lining things up and erasing again and again, so complex logic was hard to draw. With AriadneNSD you can easily draw NS charts of even complex algorithms, WYSIWYG.  
⠀  
The saved .ns.svg file is an SVG that carries the diagram structure as metadata. It shows up as a picture in any Markdown document such as a README, and the editor can open it again for editing.  
⠀  
It took six and a half weeks and 58 sessions, starting from an empty repository.  
• I defined the requirements and architecture before writing code  
• Decisions are recorded as 40 ADRs (architecture) and 22 DRs (everything else)  
• When Claude's words alone weren't enough to judge, I had it draw a mockup (about 70 of them)  
• 1,685 unit and integration tests, 83 end-to-end tests  
⠀  
What I learned  
• The more I handed to Claude, the more the documents mattered. Claude has no memory between sessions; the docs are what let it pick up yesterday's work.  
• I decided what to build and why; Claude agents did the implementation and checks in parallel.  
• Working with Claude felt much like a project I once led successfully with a Global Delivery Center (GDC) in India. My conclusion so far: working with a GDC and working with AI rest on the same principles.  
⠀  
The requirements, design docs, decision records and session logs are all public (in Korean). I hope it helps anyone curious about building a product together with AI. Links in the first comment.  
⠀  
#NassiShneiderman #NSDiagram #Structogram #NS차트 #Algorithms #ClaudeCode #SoftwareArchitecture #SideProject

**첫 댓글:**

- GitHub: https://github.com/reddiana/AriadneNSD
- 앱 · App: https://ariadnensd.com/
- 알고리즘 갤러리 · Algorithm gallery: https://ariadnensd.com/gallery/
- 소개와 만든 과정 · About (Korean): https://ariadnensd.com/about

## 페이스북 그룹 후보

대상은 알고리즘에 관심 많은 사람이고, AI · Claude 스킬 쪽 그룹은 뺍니다(2026-11-22 메인테이너). 2026-11-22에 메인테이너의 Chrome으로 페이스북 그룹 검색과 각 그룹의 "정보" 탭을 읽어 적었습니다(가입 · 게시는 하지 않음).

- 한국어: "알고리즘", "백준", "코딩테스트", "자료구조", "프로그래밍 대회"로 찾아도 알고리즘 · PS 그룹은 나오지 않았습니다. 한국의 PS 사람들은 페이스북 밖에 있습니다(아래 표). 페이스북에서는 코딩을 배우는 사람이 많은 큰 그룹을 고릅니다.
- 영어: 알고리즘 · 경쟁 프로그래밍 그룹이 많지만 회원 수에 비해 조용한 곳이 많습니다. 지난달 글 수로 살아 있는지를 봅니다. 회원은 남아시아(방글라데시 · 인도) 학생이 많아 보입니다.

| 추천 | 그룹 | 말 | 회원 | 지난달 글 | 홍보 규칙 |
| --- | --- | --- | --- | --- | --- |
| ★ | [생활코딩](https://www.facebook.com/groups/codingeverybody/) | 한국어 | 11.7만 | 32 | 상업 홍보만 막음(유료 강의 · 도서 · 상업 앱). 무료 오픈소스 소개는 됨. 메인테이너는 이미 가입함 |
|  | [[스터디 그룹] 혼자 공부하는 프로그래밍](https://www.facebook.com/groups/hongong/) | 한국어 | 6.1천 | 확인 못 함 | 확인 못 함 |
| ★ | [Data Structures and Algorithms](https://www.facebook.com/groups/190802016227153/) | 영어 | 1.4만 | 519 | 규칙 칸 없음. "개발자와 자료구조 · 알고리즘을 나누고 설명하는 곳". 가장 활발함 |
| ★ | [Competitive Programming-Problem Solving and Contest](https://www.facebook.com/groups/192542874718174/) | 영어 | 1.8만 | 332 | 친절 · 사생활 · 혐오 금지 등 일반 규칙(끝까지는 못 읽음) |
|  | [Competitive Programming Problems & Solutions](https://www.facebook.com/groups/985986314866721/) | 영어 | 6.3만 | 10 | 상업 광고 · 자기 홍보 금지. 올리려면 갤러리의 알고리즘 하나를 문제 풀이처럼 보여 주는 글로, 링크는 덧붙이는 정도 |
|  | [Leetcode Problem Solving Group](https://www.facebook.com/groups/913783172475942/) | 영어 | 1.3만 | 8 | 규칙 칸 없음 |
|  | [Algorithms & Data Structures](https://www.facebook.com/groups/algoandds/) | 영어 | 2.2천 | 0 | 메인테이너가 가입해 있고, 관리자 승인을 기다리는 글이 1개 있음. 활동이 없어 추천하지 않음 |

뺀 곳: [Data Structures and Algorithms Discussion](https://www.facebook.com/groups/datastructuresdiscussion/)(5.5만, 비공개, 지난달 글 0), 같은 이름의 작은 그룹들(글 0).

### 페이스북 밖의 PS · 알고리즘 독자

| 곳 | 말 | 메모 |
| --- | --- | --- |
| [Codeforces 블로그](https://codeforces.com/blog) | 영어 | 누구나 블로그 글을 씀. 한국 PS 고수도 많음. 광고로 보이면 비추천(downvote)이 쌓이므로 "22개 알고리즘을 NS 차트로 그려 봄"처럼 그림을 앞세움 |
| [PS 마이너 갤러리](https://gall.dcinside.com/mgallery/board/lists/?id=ps) | 한국어 | 익명이라 반응이 거침. 그림 몇 장을 보여 주고 의견을 묻는 글로 |
| Reddit r/algorithms · r/compsci · r/leetcode · r/competitiveprogramming | 영어 | → [[#3. Reddit (r/algorithms · r/compsci)]] |
| velog · 블로그 "NS 차트로 보는 KMP" 같은 글 | 한국어 | 검색으로 찾아오게 → [[#방향]] |

출처: [JihunDev/awesome-developer-community-in-korea](https://github.com/JihunDev/awesome-developer-community-in-korea), [bartkim0426/korea-dev-community](https://github.com/bartkim0426/korea-dev-community)(2018), [Codeforces: Facebook Group](https://codeforces.com/blog/entry/12999), [Codeforces: Competitive programming (mini)group](https://codeforces.com/blog/entry/11369), [daily.dev: Best Competitive Programming Communities](https://daily.dev/blog/best-competitive-programming-communities/)

## 초안 5: 페이스북 그룹

(메인테이너가 [[#초안 4: LinkedIn]]의 한국어 본문에서 발췌해 씀)

**올릴 그룹:**

**붙일 것:**

**본문:**
  - 영문:
AriadneNSD is a web editor for Nassi–Shneiderman diagrams (structograms). An NS diagram shows the same logic as a flowchart in far less space, but drawing one by hand meant lining things up and erasing again and again, so complex logic was hard to draw. With AriadneNSD you can easily draw NS charts of even complex algorithms, WYSIWYG.
⠀
The saved .ns.svg file is an SVG that carries the diagram structure as metadata. It shows up as a picture in any Markdown document such as a README, and the editor can open it again for editing.

App: https://ariadnensd.com/
Algorithm gallery: https://ariadnensd.com/gallery/

#NassiShneiderman #NSDiagram #Structogram 

- 국문:
AriadneNSD: 알고리즘을 NS 차트(Nassi–Shneiderman Diagram)로 그리는 웹 편집기입니다. NS 차트는 플로우차트와 같은 로직을 훨씬 적은 지면에 담지만, 손으로 그리려면 줄을 맞추고 지우기를 되풀이해야 해서 복잡한 로직은 그리기 어려웠습니다. AriadneNSD에서는 복잡한 알고리즘도 화면에 보이는 그대로(WYSIWYG) NS 차트로 쉽게 그릴 수 있습니다.  
⠀  
저장 형식인 .ns.svg는 다이어그램 구조를 메타데이터로 담은 SVG 파일입니다. README 같은 Markdown 문서에 넣으면 그림으로 보이고, AriadneNSD 편집기로 열면 다시 편집할 수 있습니다.  

App: https://ariadnensd.com/
Algorithm gallery: https://ariadnensd.com/gallery/

#NassiShneiderman #NSDiagram #Structogram
## 올리기 전에 확인할 것

- [ ] 갤러리가 사이트에 있고, 22개 모두 "편집기에서 열기"가 열림
- [ ] 글의 숫자(22개)와 이름이 갤러리와 같음
- [ ] 갤러리 주소로 공유했을 때의 미리보기 그림(OG 이미지)
- [ ] 휴대폰에서 갤러리와 앱이 열림

## 올린 기록

- 2026-11-22 02:56 [AriadneNSD - 알고리즘을 NS 차트로 그리는 구조 편집기 | GeekNews](https://news.hada.io/topic?id=37589)
- 2026-11-22 13시 무렵 LinkedIn: 백엔드 개발자가 Claude Code와 처음 만든 프론트엔드 앱 (힙 정렬 동영상, `https://lnkd.in/p/gb2ezD8B`). 같은 날 지움: 동영상이 반복문을 모두 감싸기로 만들어 어색했음
- 2026-11-22 [LinkedIn: 다시 올림, 첫 줄을 숫자로 · 동영상은 반복문을 먼저, 같은 로직을 새 Method로 뺌](https://www.linkedin.com/feed/update/urn:li:activity:7530170940547289088/)
