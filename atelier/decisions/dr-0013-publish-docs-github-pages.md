---
title: "DR-0013: 설계 문서는 GitHub Pages 한 사이트에 Quartz로 펴낸다 (docs/ + atelier/)"
tags:
  - dr
status: 승인
date: 2026-10-18
supersedes:
superseded-by:
---

# DR-0013: 설계 문서는 GitHub Pages 한 사이트에 Quartz로 펴낸다 (docs/ + atelier/)

> [!NOTE] 이후 변경
> - 2026-10-25: 링크를 공유할 때 보이는 대표 그림(`og:image`)을 Quartz의 기본 그림에서 로고와 문자 로고로 바꿨다(메인테이너: "대표이미지가 Quartz로 나옵니다. 우리는 로고도 있는데!!"). `site/make-og-image.mjs`로 만든 `site/og-image.png`를 빌드가 복사한다
> - 2026-10-25: `tech-notes/`의 이름이 `til/`(Today I Learned)이 되었다. 제품 고유의 기술로 읽혀서다(메인테이너). 사이트 주소도 `/til/…`이다. 아래 글의 `tech-notes/`는 지금의 `til/`이고, "펴내지 않는 곳"에서는 빠진다(바로 아래 줄) → [[til/README|Today I Learned]]
> - 2026-10-25: 본문의 `#P0` 같은 태그도 사이트에서 태그 페이지로 가는 링크가 된다(메인테이너: "Quartz 퍼블리싱 페이지는 #P0 같은 태그는 링크를 안 만드나요?"). 두 겹 아래 폴더에서 링크가 사이트 밖으로 나가던 Quartz의 버그는 `site/patch-quartz.mjs`가 고치고, 조사가 붙는 문제는 글 속의 우선순위를 코드 표기(`` `P2` ``)로 쓰는 규칙(CLAUDE.md)으로 피한다. 아래 결정의 "글자로 둔다"는 이제 맞지 않는다 → [[github-pages-site]]
> - 2026-10-25: `tech-notes/`도 펴낸다(메인테이너: "tech-notes도 github page에 publish해주세요"). 사이트 주소는 `/tech-notes/…`이고, 왼쪽 목록에서 `docs/` · `atelier/` 다음에 둔다. `journal/`은 여전히 펴내지 않는다 → [[github-pages-site]]
> - 2026-10-25: 사이트를 다듬었다(메인테이너가 inbox와 세션에서 요청). 문서 이름의 말머리를 빼고 본문 제목만 보이게 함, 왼쪽 목록과 폴더 페이지를 파일 이름(번호)순으로, 폴더의 README를 폴더 첫 페이지로, 그래프에서 태그를 뺌, 탭 아이콘을 로고의 작은 판으로(`site/icon.png`) → [[github-pages-site]], [[2026-10-25-01-site-titles-mvp]]
> - 2026-10-18: 사이트 첫 화면을 따로 쓴 `site/index.md` 대신 저장소의 `README.md`로 빌드한다. 소개 글을 한 곳에만 두려고(메인테이너: "첫 화면을 최상단 README를 기반으로 만들지 않은 이유가 있을 것 같네요." → 고르는 창에서 "README를 원본으로(추천)"). GitHub에서만 맞는 안내는 `<!-- site:skip -->`로 감싸 사이트에서 뺀다. 첫 화면에는 README와 같은 로고가 들어간다 → [[2026-10-18-02-pages-visual-design]]
> - 2026-10-22: 빌드 전에 받은 Quartz의 소스를 고치는 단계(`site/patch-quartz.mjs`)를 더했다. Quartz v4.5.2가 Mermaid 원문을 HTML로 다시 넣어 `<<interface>>` 같은 스테레오타입이 든 클래스 그림이 사이트에서만 깨졌기 때문(메인테이너: "클래스다이어그램 머메이드가 렌더링되지 않았습니다.") → [[2026-10-22-02-site-mermaid]]

## 배경

저장소의 문서는 Obsidian으로 쓰고 읽도록 만들었다. `[[위키링크]]`, 블록 ID, 콜아웃, Mermaid를 쓰기 때문에 GitHub에서 열면 문서 사이의 링크가 동작하지 않는다. 그래서 README는 "받아서 Obsidian으로 열어 보라"고 안내해 왔다.

메인테이너가 inbox에 적었다(2026-10-18):

> - 마무리할 때 `docs/`를 publishing해주세요. github page가 적절할까요?
> 	- github page를 이용해서 웹버전 어플리케이션과 사용자 매뉴얼도 배포하려고 했어요. 참고해주세요.

웹 버전은 서버 없이 정적 호스팅만으로 동작하는 것이 요구사항이다([[01-requirements#^web-static]]). GitHub Pages는 **저장소 하나에 사이트 하나**만 준다. 그래서 설계 문서, 웹 앱, 매뉴얼이 한 사이트를 나눠 써야 한다.

## 결정 기준

- 방문자가 내려받지 않고 브라우저에서 문서를 읽고 링크를 따라갈 수 있다
- Obsidian 문법(파일 이름만으로 거는 위키링크, 블록 ID, 콜아웃, Mermaid, 속성)이 그대로 그려진다. 펴내려고 원본 문서를 고치지 않는다
- 나중에 웹 앱과 매뉴얼을 같은 사이트에 함께 올릴 수 있다
- 메인테이너가 따로 손대지 않아도 커밋하면 사이트가 따라온다
- 돈이 들지 않는다

## 검토한 대안

### 펴낼 범위

- **`docs/`만:** 제품 문서만 보인다. 그러나 `docs/`의 규칙은 근거로 `atelier/`의 ADR · DR과 UX 결정 모음을 가리키는 링크가 많아, 그 링크가 모두 끊긴다.
- **`docs/` + `atelier/`:** 설계 문서와 그 근거가 함께 보인다. 링크가 끊기지 않는다. 작업 기록(상태, 할 일, 세션 기록, inbox)도 보이지만 저장소가 이미 공개라 새로 드러나는 것은 없다.
- **저장소 전체:** `journal/`과 `tech-notes/`까지. 이야기와 배움의 기록도 웹으로 읽힌다. 다만 설계 문서 사이트의 목차와 검색에 여정 기록이 섞인다.

### 도구

- **Quartz v4:** Obsidian 노트를 웹으로 펴내려고 만든 정적 사이트 생성기. 위키링크 · 블록 ID · 콜아웃 · Mermaid · 속성 · 그래프 · 검색을 기본으로 그린다. 공개 소스(MIT)이고 GitHub Actions로 빌드한다. 한국어 화면 글자가 있다.
- **MkDocs (Material):** 문서 사이트로 널리 쓰이지만 위키링크와 Obsidian 콜아웃은 플러그인을 여럿 붙여야 하고, 파일 이름만으로 거는 링크를 다 풀지 못한다.
- **Obsidian Publish:** Obsidian이 그대로 그려 주지만 유료(월 구독)이고 Obsidian의 서버에 올라가서, 웹 앱과 매뉴얼을 같은 사이트에 둘 수 없다.

## 결정

**`docs/` + `atelier/`를 Quartz로 빌드해 GitHub Pages에 펴낸다.** 펴낼 범위는 메인테이너가 고르는 창에서 "docs/ + atelier/ (추천)"을 골랐다 (2026-10-18). 도구와 사이트의 짜임은 Claude가 정했다.

사이트는 `https://reddiana.github.io/AriadneNSD/` 하나이고 주소로 나눈다.

| 주소 | 내용 |
| --- | --- |
| `/` | 첫 화면. 짧은 소개와 설계 문서 · 작업 공간으로 가는 링크 (`site/index.md`) |
| `/docs/…` | 설계 문서 (`docs/`) |
| `/atelier/…` | 작업 공간 (`atelier/`) |
| `/app/` | 웹 버전 앱 (나중에) |
| `/manual/` | 사용자 매뉴얼 (나중에) |

- `main`에 push할 때마다 GitHub Actions(`.github/workflows/pages.yml`)가 빌드해 올린다. 앱과 매뉴얼이 생기면 같은 워크플로에서 빌드해 `app/` · `manual/`에 함께 모은다. 따로 올리면 서로 덮어쓰기 때문이다.
- Quartz는 저장소에 넣지 않고 빌드할 때 정해 둔 판(`v4.5.2`)을 받아 온다. 우리 설정만 `site/`에 둔다: `quartz.config.ts`, `quartz.layout.ts`, 첫 화면 `index.md`, 문서를 옮기는 `prepare-content.mjs`, 로컬 빌드 `build.sh`.
- 원본 문서는 고치지 않는다. 빌드 직전에 `prepare-content.mjs`가 복사본에서만 두 가지를 고친다.
	- 펴내지 않는 곳(`journal/`, `tech-notes/`, 저장소 맨 위의 파일)으로 가는 위키링크는 GitHub의 파일 주소로 바꾼다.
	- `[[이름]](설명)`처럼 위키링크 바로 뒤의 괄호가 마크다운 링크 주소로 읽히지 않게 막는다.
- 본문의 `#P0` 같은 태그는 태그로 읽지 않고 글자로 둔다. Quartz v4.5.2는 두 겹 아래 폴더의 문서에서 본문 태그의 링크를 잘못 만들고, `#P0은`처럼 조사가 붙은 것도 따로 태그가 되기 때문이다. 속성의 `tags`는 태그 페이지가 된다.

## 결과

- 좋아지는 점: 방문자가 내려받지 않고 링크를 따라 읽는다. 검색과 문서 사이의 그래프도 있다. 웹 앱과 매뉴얼이 들어갈 자리가 정해졌다.
- 감수하는 점:
	- 웹 앱은 사이트의 맨 위가 아니라 `/AriadneNSD/app/`에 놓인다. 앱을 빌드할 때 이 주소를 기준 경로로 둔다 → [[06-web#5. 배포]]
	- Quartz의 판을 올릴 때는 `pages.yml`과 `build.sh`의 판을 함께 바꾸고, 로컬에서 빌드해 끊긴 링크가 없는지 본다.
	- 본문 태그(`#P0` 등)는 사이트에서 링크가 아니다.
	- 링크가 GitHub으로 나가는 `journal/` · `tech-notes/`는 GitHub에서 열려 위키링크가 동작하지 않는다.
- 후속 작업:
	- 메인테이너: GitHub 저장소의 Settings → Pages → Build and deployment의 Source를 **GitHub Actions**로 둔다 (한 번만)
	- 웹 앱 코드가 생기면 `pages.yml`의 "웹 버전 앱 (나중에)" 자리에 빌드를 넣는다
