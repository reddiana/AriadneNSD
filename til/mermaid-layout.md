---
title: Mermaid 그림의 배치 다루기
tags:
  - til
date: 2026-11-03
---

# Mermaid 그림의 배치 다루기

메인테이너가 테스트 전략의 그림을 보고: "폭은 좁고 위아래로 깁니다. 전체적으로 직사각형이나 좌우가 더 길게 배치해주세요." 이어서 "단위 박스가 왼쪽, editor, 웹셀이 그 오른쪽에 위아래로"(2026-11-03). 그때 알게 된 것을 적는다.

## 한 줄 요약

Mermaid는 상자의 자리를 스스로 정한다(dagre 레이아웃). 사람이 쓸 수 있는 손잡이는 방향(`direction`), 묶음(`subgraph`), 보이지 않는 연결(`~~~`), 설정(`%%{init: …}%%`) 정도다.

## 백엔드로 비유하면

SQL을 쓰면 실행 계획은 옵티마이저가 정하는 것과 같다. 원하는 계획이 나오게 하려면 힌트를 주거나 쿼리 모양을 바꾼다. Mermaid의 손잡이가 그 힌트다. 그리고 옵티마이저의 판(버전)이 바뀌면 같은 쿼리의 계획이 달라질 수 있듯, Mermaid 판이 다르면 같은 그림의 배치가 달라질 수 있다.

## 알게 된 것

- **연결이 없는 상자에서는 방향이 거꾸로 듣는다.** `direction LR`(왼쪽 → 오른쪽)은 연결을 따라 오른쪽으로 놓는 규칙이다. 연결이 없는 상자들은 모두 같은 단(rank)에 놓이고, 그 단은 LR에서 세로줄이 된다. 그래서 LR이면 세로로 쌓이고, TB면 가로로 늘어선다.
- **연결이 없으면 좌우 순서는 판마다 다르다.** 같은 그림이 사이트(Mermaid 11.4)에서는 단위가 왼쪽, Obsidian과 비슷한 10.9에서는 오른쪽이었다. `UNIT ~~~ APP`처럼 보이지 않는 연결을 넣으면 순서가 고정된다.
- **묶음 제목은 폭이 정해져 있어 길면 줄이 바뀌고, 안쪽 상자에 가릴 수 있다.** 제목을 `<br/>`로 미리 나누고, `subGraphTitleMargin`으로 제목 아래 여백을 준다.
- **테두리 없는 묶음으로 상자를 모을 수 있다.** `subgraph APP[" "]` 뒤에 `style APP fill:none,stroke:none`.
- **그림 안에 `%%`를 쓰지 않는다.** Obsidian에서 `%% … %%`는 주석이다. 사이트(Quartz)는 이 주석을 지우는데, 코드 블록 안의 `%%`도 지워서 Mermaid의 설정(`%%{init: …}%%`)과 주석 줄(`%% …`)이 잘리고 "Syntax error in text"가 난다. 설정은 Mermaid의 머리말(`---` · `config:` · `---`)로, 설명은 코드 블록 밖의 Obsidian 주석으로 둔다.
- **사이트의 글꼴은 고정폭이라 글자가 넓다.** 묶음 제목은 짧은 줄로 나눠 둔다. Mermaid만 따로 그려 본 것과 사이트에서 그려진 것이 다를 수 있으니, 사이트를 빌드해 그 페이지에서 본다(`site/tools/check-page-mermaid.cjs`).
- **Obsidian의 Mermaid는 사이트보다 오래되었다.** 제목이 가운데로 오지 않는 것처럼, 판 차이로만 생기는 모습은 그냥 둔다.

## AriadneNSD에서 어디에 쓰나

- [[07-testing#1.2 유형과 구성 요소]]의 그림. 그림 바로 위의 Obsidian 주석에 위의 까닭을 적었다(그림 안에는 `%%`를 쓰지 않는다).
- 그림을 판마다 찍어 보는 도구: `node site/tools/render-mermaid.cjs <그림.mmd> <결과.png>`. `MERMAID_VERSION=10.9.1`을 붙이면 옛 판으로 그린다. 문법만 검사하는 것은 `site/check-mermaid.mjs`, 빌드한 사이트의 페이지에서 오류 없이 그려졌는지 보는 것은 `node site/tools/check-page-mermaid.cjs <페이지 주소>`다.

## 더 읽을거리

- Mermaid flowchart 문서의 "Direction in subgraphs", "Invisible links": https://mermaid.js.org/syntax/flowchart.html
