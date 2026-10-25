---
title: "2026-10-25 사이트에 name-story · logo-source를 펴냄, 탐색기 휠 스크롤"
tags:
  - plan
  - session
date: 2026-10-25
---

# 2026-10-25 사이트에 name-story · logo-source를 펴냄, 탐색기 휠 스크롤

(← [[2026-10-25-04-outbox-cleanup]]) 같은 날 다섯 번째 세션이다. 메인테이너: "ingox 체크해주세요."

## inbox

inbox의 두 항목을 함께 검토했다. 원문:

> # 5. 질문/요청
> - 다음을 github page publishing에 포함시켜주세요
> 	- [[name-story]]
> 	- [[logo-source]]
> # 6. 기타
> - github page의 좌측 탐색기에서 트리가 펼쳐져서 스크롤바가 생겼을 때 마우스휠로 스크롤을 컨트롤 할 수 없습니다. 좋은 방법이 없을까요?

1. **두 문서만 펴냄.** 고르는 창에서 "두 문서만 펴냄(추천)"을 골랐다. `journal/`의 나머지(타임라인, 배운 것 등)는 여전히 펴내지 않는다.
2. **탐색기 휠 스크롤은 `site/custom.scss`로 고침.** 원인은 Quartz v4.5.2의 버그다. 펼친 폴더의 안쪽 목록마다 `overscroll-behavior: contain`이 붙어 있어서, 그 위에서 굴린 휠이 목록 전체로 넘어가지 못한다. Quartz는 2026-01-20에 이 설정을 바깥 목록(`.explorer-ul`)에만 남기도록 고쳤다(#2283). 메인테이너: "Quartz를 새판으로 하면 둘째 항목이 해결되나요?" Claude가 확인해 보니 이 고침이 든 판은 v5.0.0(2026-03-14)뿐이다. 4.x 판은 v4.5.2 뒤로 나오지 않았다. v5는 설정이 YAML로 바뀌는 등 큰 판 올림이라, 지금은 같은 고침을 CSS로 넣고 v5로 올리는 일은 backlog에 두기로 했다(고르는 창에서 "custom.scss로 고침(추천)").

## 한 일

- `site/prepare-content.mjs`: `PUBLISHED_FILES`(`journal/name-story.md`, `journal/logo-source.md`)를 더했다. 그 문서들이 싣는 그림(`![[…]]`)도 찾아 함께 옮긴다. 폴더째 펴내지 않는 곳의 그림은 경로를 다 적어 넘긴다. 이름만 두면 Quartz가 크기(`|160`)가 붙은 그림의 주소를 틀리게 만들었다(로컬 빌드에서 발견). 다른 문서와 첫 화면(README)에서 두 문서로 가는 링크는 이제 사이트 안의 링크다.
- `site/quartz.layout.ts`: 왼쪽 목록의 맨 위 차례에 `journal`을 넣었다(docs · atelier · til · journal).
- `site/custom.scss`: 탐색기 휠 스크롤 고침.
- 로컬 빌드로 확인함: 두 쪽과 그림 셋이 나오고, 그림 주소가 맞고, CSS가 들어감. 휠 스크롤은 브라우저에서 굴려 보지 못함(Quartz의 고침과 같은 내용).
- 기록: [[dr-0013-publish-docs-github-pages|DR-0013]] "이후 변경", [[github-pages-site]], README의 한 문장, `pages.yml`의 주석, [[backlog#출시 무렵과 그 뒤]]에 "Quartz v5로 올리기".
- 알게 된 것: Git Bash와 PowerShell의 PATH에 `node`가 없다. 이번 빌드는 Playwright가 깔아 둔 `node.exe`(v24)로 했다.
