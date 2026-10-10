---
title: Obsidian 플러그인이 파일 열기와 메뉴에 끼어드는 법
tags:
  - ariadne-nsd
  - tech-notes
updated: 2026-10-10
---

# Obsidian 플러그인이 파일 열기와 메뉴에 끼어드는 법

## 한 줄 요약

Obsidian 플러그인은 공개 API(이벤트, 등록 함수)로 대부분의 일을 하고, API가 없는 곳은 Obsidian 내부 함수를 감싸서(가로채서) 끼어든다. 공개 API는 안전하고, 가로채기는 업데이트 때 깨질 수 있다.

## 백엔드로 비유하면

- **공개 API = 프레임워크가 열어 둔 확장 지점.** Spring의 이벤트 리스너나 인터셉터 등록처럼, Obsidian이 "여기 끼어들어도 된다"고 정해 둔 곳입니다. 예: `file-menu` 이벤트(파일 메뉴가 열릴 때 항목 더하기), `vault.on('modify')`(파일이 바뀔 때).
- **가로채기(monkey patching) = 라이브러리 메서드를 프록시로 감싸기.** AOP로 남의 클래스 메서드 앞뒤에 코드를 끼우는 것과 같습니다. 원래 함수를 저장해 두고, 우리 함수로 바꿔 끼운 뒤, 일을 마치면 원래 함수를 부릅니다. 플러그인을 끌 때 원래대로 돌려놓아야 합니다. 라이브러리 내부가 바뀌면 조용히 깨집니다.
- **그림이 안 바뀌던 문제 = 캐시 무효화.** 브라우저는 같은 주소의 그림을 다시 받지 않습니다. 정적 파일 주소 뒤에 `?v=버전`을 붙여 캐시를 깨듯, 그림 주소 끝의 수정 시각을 새 값으로 바꿔 다시 불러오게 했습니다.

## AriadneNSD에서 어디에 쓰나

2026-10-10 스파이크에서 확인했습니다. → [[04-obsidian-plugin#1. `.ns.svg` 파일 열기]]

| 하고 싶은 일 | 방법 | 종류 |
| --- | --- | --- |
| `.ns.svg`만 우리 편집기로 열기 | `WorkspaceLeaf.prototype.setViewState`를 감싸서 보기 종류를 바꿈 | 가로채기 |
| 편집 후 노트의 그림 바로 바꾸기 | `vault.on('modify')`에서 노트 안 `<img>` 주소를 새 주소로 바꿈 | 공개 이벤트 + 내부 화면 구조 |
| 우클릭 메뉴에 "Edit NS diagram" 더하기 | `file-menu` 이벤트, `setSection('system')` | 공개 API |

- 확장자 등록(`registerExtensions`)은 공개 API지만, `a.ns.svg`의 확장자를 `svg`로 보기 때문에 `ns.svg` 등록은 효과가 없었습니다.
- 메뉴 항목의 자리는 구역(section)으로 정합니다. 같은 구역 안에서는 더한 순서대로 놓입니다.

## 더 읽을거리

- [Obsidian Developer Docs](https://docs.obsidian.md/Home)
- [Obsidian API 타입 정의 (obsidian.d.ts)](https://github.com/obsidianmd/obsidian-api)
- [Excalidraw 플러그인](https://github.com/zsviczian/obsidian-excalidraw-plugin) — `.excalidraw.md`를 같은 가로채기 방식으로 엽니다
