---
title: "2026-10-22 사이트의 Mermaid 그림이 깨지던 것, 사이트의 문서 이름"
tags:
  - ariadne-nsd
  - plan
  - session
date: 2026-10-22
---

# 2026-10-22 사이트의 Mermaid 그림이 깨지던 것, 사이트의 문서 이름

2026-10-22의 둘째 세션이다 (← [[2026-10-22-01-engineer-language-use-cases-qas]]). 메인테이너가 자기 전에 잠깐 들어와 "inbox 6번 체크해주세요."라고 했다. 짧은 세션이라 세션 시작 요약은 하지 않고 바로 inbox 6번을 보았다.

앞 세션의 마무리 뒤에 CLAUDE.md에 메인테이너의 호를 적은 커밋(`d0b0185`, "대화에서는 홍월님으로")이 하나 더 있었다. 이미 push되어 있었다.

## inbox 원문

처리 방향을 정한 줄만 옮기고 지웠다. 같은 항목의 "문서명들이 변경되어 있습니다. 어떤 기준인가요?"는 메인테이너가 다음 세션에 정하기로 해서 inbox에 남겼다. "MVP를 하기 전에 뭐가 결정되어야 하나요?"도 남겼다(마무리 때 고르는 창에서 "다음 세션까지 남김").

> [!quote] 6. 기타
> - github page에 publishing
>   - "AriadneNSD 아키텍처 개요"에서 클래스다이어그램 머메이드가 렌더링되지 않았습니다. "Syntax error in text mermaid version 11.4.0"라고 나옵니다.

## 논의 흐름

### 1. 클래스 그림의 "Syntax error"

- 사이트가 쓰는 Mermaid 11.4.0을 받아 `docs/`와 `atelier/`의 그림을 모두 문법 검사했다. 아키텍처 문서의 그림은 모두 통과했다. 그래서 문서가 아니라 사이트로 옮기는 과정이 원인이라고 보았다.
- 펴낸 페이지의 HTML에는 원문이 온전했다. Quartz v4.5.2의 `mermaid.inline.ts`를 읽으니, 그림을 그리기(다시 그리기) 전에 원문을 `node.innerHTML = oldText`로 넣고 있었다. 원문이 HTML로 읽혀 `<<package>>` · `<<interface>>` · `<<abstract>>` 같은 스테레오타입이 태그가 된다.
- 그 과정을 jsdom으로 흉내 내어 재현했다: 아키텍처 문서의 클래스 그림 셋(3.1 패키지, 3.2 인터페이스, 3.4 모델)이 모두 깨졌다.
- 고침: 빌드 전에 그 줄을 `node.textContent = oldText`로 바꾸는 `site/patch-quartz.mjs`를 두고, `pages.yml`과 `site/build.sh`에서 부른다. 고칠 줄이 없으면(Quartz를 올려 소스가 바뀌면) 빌드를 멈춘다. 고친 방식으로 다시 흉내 내어 모든 그림이 통과하는 것을 보았다.
- 함께 찾음: [[01-model]]의 시퀀스 그림(편집 명령의 흐름)에 빈 응답 메시지(`H-->>-E:`)가 있었다. Obsidian은 그리지만 Mermaid 11은 문법 오류로 본다. "넣음"을 적었다.

### 2. 사이트의 문서 이름

- 사이트(Quartz)는 파일 이름 대신 문서 속성의 `title`을 이름으로 쓴다. 예: `03-architecture.md` → "AriadneNSD 아키텍처 개요". Obsidian은 파일 이름을 보여 주어 다르게 보였다.
- 사이트의 목록에서 번호가 빠져 읽는 순서가 덜 보일 수 있고, 설정으로 파일 이름에 맞출 수 있다고 알렸다. 어떻게 할지는 메인테이너가 다음 세션에 정한다(inbox에 남음).

## 결정

- 사이트를 빌드할 때 Quartz의 소스를 고친다(`site/patch-quartz.mjs`) → [[dr-0013-publish-docs-github-pages|DR-0013]]의 이후 변경, [[github-pages-site#Mermaid 그림이 사이트에서만 깨질 때]]

## 발견한 위험

- 실제 사이트에서는 아직 보지 못했다. 흉내(jsdom)로만 확인했고, push한 뒤 사이트에서 세 그림이 그려지는지 보아야 한다.
- Obsidian이 그리는 그림도 사이트(Mermaid 11.4.0)에서는 깨질 수 있다. Obsidian의 Mermaid가 더 옛 판이라 너그럽다.

## 다음 할 일

- push 뒤 사이트에서 아키텍처 개요와 01-model의 그림 확인 → [[status]]
- inbox에 남은 둘: 사이트의 문서 이름, MVP 전에 정할 것
