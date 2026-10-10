---
title: "설계: Obsidian 플러그인"
tags:
  - ariadne-nsd
  - design
status: 작성 전
updated: 2026-10-10
---

# 설계: Obsidian 플러그인 (`apps/obsidian`)

## 관련 요구사항

- [[01-requirements#2.1 Obsidian 플러그인]]
- [[0006-file-extensions|ADR-0006]]

## 1. `.ns.svg` 파일 열기

> [!success] 스파이크로 확인함 (2026-10-10)
> 실험 플러그인으로 메인테이너의 Obsidian에서 확인했습니다. 코드: `journal/assets/2026-10-10-obsidian-spike-main.js`

| 확인한 것 | 결과 | 방법 |
| --- | --- | --- |
| 파일 목록에서 `.ns.svg`를 열면 편집기로 열림 | 됨 | 아래 "가로채기" |
| 일반 `.svg`는 기본 이미지 보기로 열림 | 됨 | 가로채기 조건을 `.ns.svg`로 한정 |
| 노트의 `![[이름.ns.svg]]`가 그림으로 보임 (읽기·편집 모드) | 됨 | Obsidian 기본 동작. 플러그인이 할 일 없음 |
| 편집기에서 저장하면 노트를 다시 열지 않아도 그림이 바뀜 | 처음엔 안 됨 → 고쳐서 됨 | 아래 "노트 그림 갱신" |
| 노트의 `.ns.svg` 그림 우클릭에 "Edit NS diagram" | 됨 | 아래 "그림 우클릭 메뉴" |

**확장자 등록만으로는 안 된다.** `registerExtensions(["ns.svg"])`는 오류 없이 등록되지만 효과가 없습니다. Obsidian은 `a.ns.svg`의 확장자를 마지막 점 뒤의 `svg`로 보고, `svg`에 등록된 이미지 보기(`image`)로 엽니다.

**가로채기:** `WorkspaceLeaf.prototype.setViewState`를 감싸서, 열려는 보기가 `image`이고 파일 이름이 `.ns.svg`로 끝나면 보기 종류를 NS 편집기로 바꿉니다. Excalidraw 플러그인이 `.excalidraw.md`를 여는 방식과 같습니다.

**노트 그림 갱신 ([[01-requirements#^obs-refresh]]):** Obsidian은 노트의 그림을 `<img>`로 한 번 그린 뒤, 파일이 바뀌어도 다시 불러오지 않습니다. 그래서 볼트의 `modify` 이벤트에서 `.ns.svg`가 바뀌면, 열린 모든 탭에서 그 파일을 가리키는 `.internal-embed` 안의 `<img>` 주소를 `vault.getResourcePath(file)`(수정 시각이 붙어 주소가 바뀜)로 바꿉니다. 이벤트에 걸었으므로 git pull이나 다른 도구로 바뀌어도 갱신됩니다.

**그림 우클릭 메뉴 ([[01-requirements#^obs-edit-embed]]):** Obsidian의 공개 API인 `file-menu` 이벤트로 기존 메뉴에 항목을 더합니다. 노트의 그림 우클릭은 `source`가 `link-context-menu`, 파일 목록 우클릭은 `file-explorer-context-menu`로 옵니다. 항목은 `setSection('system')`으로 system 구역(기본 앱에서 열기, 폴더에서 보기 …)의 맨 아래에 둡니다. 그 바로 아래가 삭제 항목이 있는 danger 구역입니다.
- 처음에는 `contextmenu`를 가로채 우리 메뉴만 띄웠는데, Obsidian의 기존 메뉴가 모두 사라졌습니다. 메인테이너의 지적으로 `file-menu` 방식으로 바꿨습니다. 이 부분은 내부 동작에 기대지 않습니다.
- 같은 구역에 항목을 넣는 다른 플러그인이 있으면 우리 항목이 그 뒤로 밀릴 수 있습니다.

> [!warning] 남은 위험
> 가로채기(`setViewState`), 노트 그림 갱신에 쓰는 `.internal-embed`의 `src` 속성과 `<img>` 구조는 Obsidian이 공개하지 않은 내부 동작입니다. Obsidian이 업데이트되면 깨질 수 있습니다. 본 구현에서는 이 부분을 한곳에 모으고, Obsidian 새 버전마다 확인할 테스트 목록을 둡니다.

## 2. 노트에 새 다이어그램 넣기 ("Insert new NS diagram")

요구사항: [[01-requirements#^obs-insert]], [[01-requirements#^obs-insert-command]]. drawio-obsidian의 흐름을 따른다.

> [!todo] 설계할 것
> - 노트 편집 화면 우클릭 메뉴에 항목 추가하는 방법
> - 탭을 닫을 때까지 "어느 노트의 어느 커서 위치에 넣을지"를 기억하는 방법 (그사이 노트가 수정되거나 닫힌 경우 포함)
> - 새 파일의 이름 규칙과 저장 위치 (제안: 첨부 파일 폴더 설정 따름)
> - 빈 채로 닫았을 때 처리 (제안: 파일 삭제, 삽입 안 함)

## 3. 삽입된 다이어그램 편집 ("Edit NS diagram")

요구사항: [[01-requirements#^obs-edit-embed]], [[01-requirements#^obs-detect]]

우클릭 메뉴와 그림 갱신은 스파이크로 방법을 확인했다. → [[#1. `.ns.svg` 파일 열기]]

> [!todo] 설계할 것
> - `.ns`가 빠진 `.svg`를 내용으로 감지해 메뉴를 띄우는 방법 ([[01-requirements#^obs-detect]])

## 4. 볼트 입출력

> [!todo] 읽기/쓰기, 저장 시점(탭 닫을 때 / 자동 저장), 다른 곳에서 파일이 바뀌었을 때 처리

## 5. 테마 연동

> [!todo] Obsidian 라이트/다크 테마 ↔ 편집 화면 ([[01-requirements#^obs-theme]])

## 미결정 사항

- [ ] 
