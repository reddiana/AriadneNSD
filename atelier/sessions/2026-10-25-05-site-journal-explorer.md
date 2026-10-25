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

## inbox: 세션 목록의 링크 두 줄

메인테이너가 세션 중에 inbox에 하나 더 올렸다("inbox 하나 더 올렸습니다."). 원문:

> # 6. 기타
> - [[atelier/sessions/README#세션 기록]]이 github page publishing되면 아래 부분이 link가 안 생깁니다.
> ```
>     - [[2026-10-10-03-inbox-review|2026-10-10 inbox 검토: [P3](https://reddiana.github.io/AriadneNSD/tags/P3), 문제 알리기, 용어 “선택 영역”]]
>     - [[2026-10-10-06-logo|2026-10-10 ~ 11 로고: 크노소스 벽화의 여인, 문자 로고 `Ariadne’s NSD`, 이름 이야기]]
>   ```

원인은 둘이다. Quartz v4.5.2는 위키링크의 별칭에 `#`가 있으면 위키링크로 읽지 않는다(19행의 `#P3`). 별칭에 인라인 코드가 있으면 글이 코드 앞뒤로 쪼개져 위키링크를 찾지 못한다(22행의 `` `Ariadne’s NSD` ``). 사이트 전체에서 이런 링크는 이 두 줄뿐이었다. 고르는 창에서 "원문도 빌드도 고침(추천)"을 골랐다.

- 원문: 19행의 `#P3`를 규칙대로 `` `P3` ``로.
- 빌드: `site/prepare-content.mjs`가 별칭에 인라인 코드나 `#`가 든 위키링크를 마크다운 링크(`[별칭](문서)`)로 바꿔 넘긴다. 로컬 빌드에서 두 줄이 링크가 되고 코드 표기가 그대로 보이는 것을 확인함.
