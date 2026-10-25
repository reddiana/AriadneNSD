<p align="center">
  <img src="journal/assets/2026-10-10-logo-aegean-lady-rounded.svg" width="160" alt="AriadneNSD 로고: 크노소스 벽화의 여인">
</p>

<h1 align="center">
  <img src="journal/assets/2026-10-11-wordmark-n1-warm-grey.svg" width="340" alt="AriadneNSD">
</h1>

NS 차트([Nassi-Shneiderman Diagram](https://en.wikipedia.org/wiki/Nassi%E2%80%93Shneiderman_diagram)) 편집기입니다. 블록을 고르고 감싸는 **구조 편집**으로 차트를 그리면, 레이아웃은 자동으로 맞춰집니다. 저장 파일은 어디서나 열리는 SVG 그림이면서, 다시 열어 편집할 수 있는 원본입니다.

먼저 웹(정적 페이지), Obsidian 플러그인, 데스크톱 앱을 이 순서로 만듭니다. 그 위에 Google Drive 연동을 얹고, 나중에 Confluence 앱, IDE 플러그인(VSCode · IntelliJ), Claude skill로 넓힐 예정입니다. 첫 출시(MVP)는 웹입니다.

> [!NOTE]
> **지금은 설계 단계입니다.** 요구사항과 아키텍처를 정했고 상세 설계를 하고 있습니다. 코드는 아직 없습니다.

## 이 저장소를 읽는 법

<!-- site:skip -->
이 저장소의 문서는 [Obsidian](https://obsidian.md/)으로 쓰고 읽도록 만들었습니다. `[[위키링크]]`, 블록 ID, 태그, 콜아웃을 쓰기 때문에 GitHub에서는 문서 사이의 링크가 동작하지 않고 일부가 글자 그대로 보입니다. 아래 두 가지 방법 가운데 하나로 읽어 주세요.

> [!TIP]
> **1. 웹 사이트에서 읽기 (설치 없이):** **https://reddiana.github.io/AriadneNSD/**
> 설계 문서(`docs/`), 작업 공간(`atelier/`), 배운 것(`til/`, Today I Learned)을 펴낸 사이트입니다. 링크와 그림이 Obsidian처럼 동작합니다. `main`에 올릴 때마다 새로 펴냅니다.
>
> **2. Obsidian으로 읽기:** 저장소를 내려받은 뒤(`git clone` 또는 Code → Download ZIP), Obsidian에서 **Open folder as vault**로 저장소 폴더를 엽니다. [`docs/README.md`](docs/README.md)에서 시작하세요. 사이트에 없는 여정 기록(`journal/`)도 함께 읽을 수 있습니다.
<!-- /site:skip -->

| 폴더                                    | 내용                                                     |
| ------------------------------------- | ------------------------------------------------------ |
| [`docs/`](docs/README.md)             | 애플리케이션 문서: 요구사항, 아키텍처, UX 설계, 상세 설계, 파일 형식 명세          |
| [`atelier/`](atelier/README.md)       | 작업 공간: 현재 상태, 할 일, 답을 기다리는 것, 프로토타입, 결정 기록(아키텍처는 ADR, 그 밖은 DR), 세션 기록, inbox |
| [`journal/`](journal/README.md)       | 여정 기록: 타임라인, Claude Code 초보자의 배움 기록                    |
| [`til/`](til/README.md)               | Today I Learned: 백엔드 개발자가 프론트엔드를 배우며 정리한 것                  |
| [`site/`](site/)                      | 펴낸 사이트(GitHub Pages, Quartz)의 설정과 빌드 스크립트                  |

## 어떻게 만들고 있나

이 프로젝트는 **Claude Code를 처음 쓰는 백엔드 개발자**가 AI와 함께 프론트엔드 앱을 만들어 가는 과정이기도 합니다.

요구사항을 정하고, 결정의 근거를 결정 기록(ADR · DR)으로 남기고, 세션마다 무엇을 의논했는지 기록합니다. 그 과정에서 겪은 실수와 배움도 그대로 남깁니다. 누구라도 이 기록을 따라가 보며 "나도 해 볼 수 있겠다"는 용기를 얻기를 바랍니다.

- 처음부터 지금까지의 흐름: [`journal/timeline.md`](journal/timeline.md)
- AI와 일하는 법을 배워 간 기록: [`journal/learning-claude-code.md`](journal/learning-claude-code.md)

## 시안과 프로토타입

말로 견주기 어려운 것은 그림으로 그려 놓고 골랐습니다. 무엇과 무엇을 견주었고 왜 그것을 골랐는지가 페이지마다 적혀 있습니다. 누구나 열어 볼 수 있습니다.

- [프로토타입](https://claude.ai/artifact/RuUjpc7YmCcbJXAdCeQiRG): 요구사항이 맞는지 써 보려고 만든 것입니다. 블록을 넣고, 감싸고, 접어 볼 수 있습니다. 제품이 아니고 버릴 코드입니다
- 시안과 스파이크 전체의 목록: [`atelier/sketchbook.md`](atelier/sketchbook.md)

시안과 스파이크 페이지의 글과 그림은 CC BY 4.0, 프로토타입은 Apache-2.0입니다(아래 [라이선스](#라이선스)). 같은 파일이 [`journal/assets/`](journal/assets/)에 있습니다.

## 이름

`AriadneNSD`는 "아리아드네의 NS 차트"입니다. 그리스 신화에서 [아리아드네](https://ko.wikipedia.org/wiki/%EC%95%84%EB%A6%AC%EC%95%84%EB%93%9C%EB%84%A4)는 미궁에 들어가는 테세우스에게 실타래를 건네, 그 실을 따라 되돌아 나올 수 있게 했습니다. 그래서 "아리아드네의 실(Ariadne's Thread)"은 복잡한 곳에서 길을 잃지 않게 해 주는 것을 뜻합니다. 코드라는 미궁을 지나는 실이 NS 차트(NSD)라는 생각으로, 문자 로고에서는 `Ariadne’s NSD`라고 적습니다. 글로 적을 때의 이름은 언제나 `AriadneNSD`입니다.

더 긴 이야기는 [`journal/name-story.md`](journal/name-story.md)에 있습니다.

## 로고

크노소스 궁전의 벽화 "푸른 옷의 여인들"에서 가운데 여인을 옮겨 그렸습니다. 아리아드네는 크노소스의 공주이고, 미궁에서 길을 잃지 않게 실타래를 건넨 사람입니다.
바탕 그림은 메트로폴리탄 미술관이 CC0로 공개한 Emile Gilliéron의 모사화 사진입니다. 자세한 것은 [`journal/logo-source.md`](journal/logo-source.md)에 있습니다.

## 라이선스

누구나 가져다 사용하고, 고치고, 팔 수 있습니다. 가져다 사용했다고 알려 주세요.

| 대상                                                                                | 라이선스                                                                                         |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 코드 (소스 코드, 프로토타입, 스크립트)                                                           | [Apache License 2.0](LICENSE). 가져다 사용한 배포물에 [`NOTICE`](NOTICE) 파일의 글을 함께 실어 주세요              |
| 글 (`docs/` · `atelier/` · `journal/` · `til/`의 문서, 이 README와 저장소 맨 위의 문서, 시안과 스파이크 페이지) | [CC BY 4.0](LICENSE-docs). 출처를 `AriadneNSD (https://github.com/reddiana/AriadneNSD)`로 밝혀 주세요 |
| 로고 (그림 로고와 문자 로고의 그림 파일)                                                          | 허락하지 않습니다. 이 프로젝트를 가리키는 데에만 사용할 수 있습니다                                                       |
| 이름 (`AriadneNSD`)                                                                 | 허락하지 않습니다. 가져다 만든 제품에 이 이름을 붙일 수 없습니다. "AriadneNSD를 가져다 사용했다"고 알리는 데에는 사용할 수 있습니다            |

위의 두 라이선스는 코드와 글을 사용할 권리만 줍니다. 이름과 로고를 사용할 권리는 주지 않습니다. 로고의 바탕이 된 메트로폴리탄 미술관의 사진은 CC0로 공개된 것입니다.
