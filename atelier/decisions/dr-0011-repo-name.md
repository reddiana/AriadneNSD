---
title: "DR-0011: GitHub 저장소 이름은 `AriadneNSD`로 한다"
tags:
  - dr
status: 승인
date: 2026-10-15
supersedes:
superseded-by:
---

# DR-0011: GitHub 저장소 이름은 `AriadneNSD`로 한다

> [!NOTE] 이후 변경
> - 2026-10-25: 문서 태그 `ariadne-nsd`를 모든 문서에서 지웠다. Obsidian 볼트가 이 저장소 하나라 모든 문서가 이미 이 프로젝트의 것이고, 문서의 절반 남짓에만 붙어 있어 쓰이지 않았으며, 사이트에서는 거의 모든 페이지에 군더더기 딱지가 붙었다(메인테이너: "#ariadne-nsd 태그는 왜 필요한가요? 모든 문서에 다 붙어있는 것 같은데요?" → 고르는 창에서 "모든 문서에서 지움"). 아래 표의 "문서 태그"는 이제 맞지 않는다. 패키지 · 플러그인 id는 그대로 `ariadne-nsd`다 → [[2026-10-25-02-site-tags-figures]]
> - 2026-10-17: 아키텍처 결정 기록 ADR-0028에서 결정 기록 DR-0011로 옮겨 왔다. ADR은 아키텍처 결정만 두기로 했기 때문이다 → [[dr-0001-split-decision-records|DR-0001]]. 본문은 그대로이고, 번호와 링크만 새 것으로 고쳤다. 본문의 "이 ADR"은 이 기록을 말한다.
> - 2026-10-15: 로컬 폴더도 `C:\myProject\AriadneNSD`로 바꾸기로 했다(메인테이너: "로컬 repo 디렉토리명도 바꾸려고 합니다"). 이 세션이 끝난 뒤 메인테이너가 바꾸고, Claude Code의 메모리 폴더는 Claude가 새 이름으로 복사해 두었다. 아래 표의 "로컬 폴더 · 그대로 둔다"와 후속 작업의 마지막 줄은 이것으로 바뀌었다 → [[2026-10-15-01-inbox-repo-name]]
> - 2026-10-18: GitHub Pages 사이트 `reddiana.github.io/AriadneNSD`는 설계 문서 · 웹 앱 · 매뉴얼이 함께 쓰기로 했다. 아래 "결과"의 웹 버전 주소는 `reddiana.github.io/AriadneNSD/app/`이 된다 → [[dr-0013-publish-docs-github-pages|DR-0013]]
> - 2026-10-16: 메인테이너가 로컬 폴더를 `C:\myProject\AriadneNSD`로 바꿨다. 아래 "결정" 표의 "로컬 폴더 `ariadne-nsd` 그대로 둔다"는 이렇게 바뀌었다. 같은 날 `NOTICE`와 [[name-story]], [[names-and-registries]]에 남아 있던 옛 저장소 주소와 표기도 고쳤다 → [[2026-10-16-01-visual-design]]

## 배경

[[dr-0005-product-name|DR-0005]]는 제품 이름을 `AriadneNSD`로, 저장소 · 패키지 · Obsidian 플러그인 id · 문서 태그를 `ariadne-nsd`로 정했다. 그래서 GitHub 저장소는 `https://github.com/reddiana/ariadne-nsd`였다.

2026-10-14와 15일 사이에 메인테이너가 GitHub 저장소 이름을 `AriadneNSD`로 바꾸고 inbox에 적었다.

> - 저장소 이름을 변경했습니다.
> 	- before: https://github.com/reddiana/ariadne-nsd.git
> 	- after: https://github.com/reddiana/AriadneNSD.git

바꾼 까닭은 적혀 있지 않다. GitHub에서 저장소 이름은 방문자가 처음 보는 제목이라, 글로 적는 제품 이름과 같게 보이게 한 것으로 읽었다.

## 결정 기준

- 방문자가 GitHub에서 보는 이름이 제품 이름과 같아야 한다.
- 대소문자를 가리는 곳(npm 패키지, Obsidian 플러그인 id)의 식별자는 그 규칙을 따라야 한다.

## 검토한 대안

### 대안 A: 저장소만 `AriadneNSD`, 나머지 식별자는 `ariadne-nsd` 그대로

- 장점: GitHub에서 제품 이름 그대로 보인다. npm과 Obsidian은 소문자 이름을 요구하므로 그쪽은 손댈 것이 없다.
- 단점: 저장소 이름과 패키지 이름의 표기가 갈린다.

### 대안 B: 모든 식별자를 `AriadneNSD`로

- 단점: npm 패키지 이름은 대문자를 쓸 수 없다. Obsidian 플러그인 id도 소문자와 붙임표로 쓰는 것이 관례다.

## 결정

대안 A. **GitHub 저장소 이름만 `AriadneNSD`로 한다.** 주소는 `https://github.com/reddiana/AriadneNSD`다.

| 쓰이는 곳 | 이름 |
| --- | --- |
| GitHub 저장소 | `AriadneNSD` |
| 패키지, Obsidian 플러그인 id, 문서 태그 | `ariadne-nsd` (DR-0005 그대로) |
| 로컬 폴더 | `ariadne-nsd` 그대로 둔다 |

## 결과

- 좋아지는 점: GitHub의 제목과 주소가 제품 이름과 같다.
- 감수하는 점: 저장소 이름과 패키지 이름이 대소문자와 붙임표에서 다르다. 옛 주소는 GitHub이 새 주소로 넘겨 주지만, 누군가 `reddiana/ariadne-nsd`라는 이름으로 새 저장소를 만들면 그 넘김이 끊긴다. 그래서 글에 적힌 주소는 새 주소로 고친다.
- GitHub Pages로 웹 버전을 내놓으면 주소의 뒷부분도 저장소 이름을 따라 `reddiana.github.io/AriadneNSD`가 된다.
- 후속 작업:
	- 출처 표기 문구를 `AriadneNSD (https://github.com/reddiana/AriadneNSD)`로 바꾼다: README, 시안과 스파이크 페이지의 안내, 안내를 넣는 스크립트 ([[dr-0010-study-pages-cc-by|DR-0010]]의 이후 변경)
	- claude.ai의 시안 페이지를 새 안내로 다시 올린다
	- git 원격 주소를 새 주소로 바꾼다
	- 로컬 폴더 이름은 바꾸지 않는다. 바꾸면 Claude Code의 메모리 폴더도 옮겨야 한다
