<p align="center">
  <img src="journal/assets/2026-10-10-logo-aegean-lady-rounded.svg" width="160" alt="AriadneNSD 로고: 크노소스 벽화의 여인">
</p>

<h1 align="center">
  <img src="journal/assets/2026-10-11-wordmark-n1-warm-grey.svg" width="340" alt="AriadneNSD">
</h1>

NS 차트([Nassi-Shneiderman Diagram](https://en.wikipedia.org/wiki/Nassi%E2%80%93Shneiderman_diagram)) 편집기입니다. 블록을 고르고 감싸는 **구조 편집**으로 차트를 그리면, 레이아웃은 자동으로 맞춰집니다. 저장 파일은 어디서나 열리는 SVG 그림이면서, 다시 열어 편집할 수 있는 원본입니다.

Obsidian 플러그인, 데스크톱 앱, 웹(정적 페이지)으로 배포할 예정입니다.

> [!NOTE]
> **지금은 설계 단계입니다.** 요구사항과 아키텍처 결정을 정리하고 있으며, 코드는 아직 없습니다.

## 이 저장소를 읽는 법

> [!TIP]
> 이 저장소의 문서는 [Obsidian](https://obsidian.md/)으로 쓰고 읽도록 만들었습니다. `[[위키링크]]`, 블록 ID, 태그, 콜아웃을 쓰기 때문에 GitHub에서는 문서 사이의 링크가 동작하지 않고 일부가 글자 그대로 보입니다.
>
> **Obsidian으로 보는 법:** 저장소를 내려받은 뒤(`git clone` 또는 Code → Download ZIP), Obsidian에서 **Open folder as vault**로 저장소 폴더를 엽니다. [`docs/README.md`](docs/README.md)에서 시작하세요.

| 폴더                                    | 내용                                                     |
| ------------------------------------- | ------------------------------------------------------ |
| [`docs/`](docs/README.md)             | 애플리케이션 문서: 요구사항, 아키텍처, UX 설계, 상세 설계, 파일 형식 명세          |
| [`atelier/`](atelier/README.md)       | 일하기 위한 기록: 현재 상태, 부채 목록, 세션 기록, 아키텍처 결정 기록(ADR), inbox |
| [`journal/`](journal/README.md)       | 여정 기록: 타임라인, Claude Code 초보자의 배움 기록                    |
| [`tech-notes/`](tech-notes/README.md) | 백엔드 개발자가 프론트엔드를 배우며 정리한 기술 노트                          |

## 어떻게 만들고 있나

이 프로젝트는 **Claude Code를 처음 쓰는 백엔드 개발자**가 AI와 함께 프론트엔드 앱을 만들어 가는 과정이기도 합니다.

요구사항을 정하고, 결정의 근거를 ADR로 남기고, 세션마다 무엇을 의논했는지 기록합니다. 그 과정에서 겪은 실수와 배움도 그대로 남깁니다. 누구라도 이 기록을 따라가 보며 "나도 해 볼 수 있겠다"는 용기를 얻기를 바랍니다.

- 처음부터 지금까지의 흐름: [`journal/timeline.md`](journal/timeline.md)
- AI와 일하는 법을 배워 간 기록: [`journal/learning-claude-code.md`](journal/learning-claude-code.md)

## 시안과 프로토타입

말로 견주기 어려운 것은 그림으로 그려 놓고 골랐습니다. 무엇과 무엇을 견주었고 왜 그것을 골랐는지가 페이지마다 적혀 있습니다. 누구나 열어 볼 수 있습니다.

| 페이지 | 무엇을 다루나 |
| --- | --- |
| [프로토타입](https://claude.ai/artifact/RuUjpc7YmCcbJXAdCeQiRG) | 요구사항이 맞는지 써 보려고 만든 것입니다. 블록을 넣고, 감싸고, 접어 볼 수 있습니다. 제품이 아니고 버릴 코드입니다 |
| [색상 시안](https://claude.ai/artifact/XVzT38DvGVir97z9j47Aaj) | 기본 스타일의 바탕과 색조 |
| [영역 강조 시안](https://claude.ai/artifact/MGnGUbUZ2gRbfGLmfqvTy7) | 블록 묶음을 눈에 띄게 하는 법. 나중에 없앤 기능입니다 |
| [로고 시안](https://claude.ai/artifact/JZBq5xrGFdfhQzcRNgmiyD) | 그림 로고의 안들, 미소의 선, 문자 로고의 글자 모양 |
| [문자 로고 바탕 시안](https://claude.ai/artifact/VmPiuJk7cLMYDMA2ePKKs7) | 밝은 화면과 어두운 화면 모두에서 읽히는 문자 로고 |
| [Event와 Method 시안](https://claude.ai/artifact/AAXhC9eSan97yNw6S2HXB8) | 이벤트 처리기와 부를 수 있는 다이어그램을 가르는 머리의 모양 |
| [다이어그램 배치 시안](https://claude.ai/artifact/NMZH1BMT42KMJAd5HcaQkW) | 한 문서에 다이어그램 여러 개를 놓는 법 |
| [호출 블록 글자 시안](https://claude.ai/artifact/TACyh94j23GHzKZMYq4252) | 호출 블록에 이름, 인자, 결과를 적는 법 |
| [호출 블록 펴 보기 시안](https://claude.ai/artifact/SRXMaLyK5KFCbFiRw7iwwL) | 부르는 다이어그램을 그 자리에 펴서 보여 주는 법 |
| [UX 규칙 시안](https://claude.ai/artifact/A7sWbwCA4NFC8qSZg58d3y) | 고치기, 넣기, 옮기기, 고르기의 규칙을 하나로 맞추는 물음들 |
| [접기 영역 테두리 시안](https://claude.ai/artifact/PW426nxL2ScUNG5aPzxbW2) | 접기 영역의 테두리와, 펴 보인 곳에만 두는 접기 영역 |
| [글자 폭 스파이크](https://claude.ai/artifact/FNoS6pjV1zjieBgMwN8HxT) | 같은 글자가 브라우저마다 같은 폭으로 재어지는지 재어 본 페이지 |
| [아키텍처 전 물음 시안](https://claude.ai/artifact/Jez6xT5qB9HbdoN1aRSKSn) | 저장된 그림의 색, 실행 취소의 대상 같은 물음 |

시안과 스파이크 페이지의 글과 그림은 CC BY 4.0, 프로토타입은 Apache-2.0입니다(아래 [라이선스](#라이선스)). 같은 파일이 [`journal/assets/`](journal/assets/)에 있습니다.

## 이름

`AriadneNSD`는 "아리아드네의 NS 차트"입니다. 그리스 신화에서 [아리아드네](https://ko.wikipedia.org/wiki/%EC%95%84%EB%A6%AC%EC%95%84%EB%93%9C%EB%84%A4)는 미궁에 들어가는 테세우스에게 실타래를 건네, 그 실을 따라 되돌아 나올 수 있게 했습니다. 그래서 "아리아드네의 실(Ariadne's Thread)"은 복잡한 곳에서 길을 잃지 않게 해 주는 것을 뜻합니다. 코드라는 미궁을 지나는 실이 NS 차트(NSD)라는 생각으로, 문자 로고에서는 `Ariadne’s NSD`라고 적습니다. 글로 적을 때의 이름은 언제나 `AriadneNSD`입니다.

더 긴 이야기는 [`journal/name-story.md`](journal/name-story.md)에 있습니다.

## 로고

크노소스 궁전의 벽화 "푸른 옷의 여인들"에서 가운데 여인을 옮겨 그렸습니다. 아리아드네는 크노소스의 공주이고, 미궁에서 길을 잃지 않게 실타래를 건넨 사람입니다.
바탕 그림은 메트로폴리탄 미술관이 CC0로 공개한 Emile Gilliéron의 모사화 사진입니다. 자세한 것은 [`journal/logo-source.md`](journal/logo-source.md)에 있습니다.

## 라이선스

누구나 가져다 사용하고, 고치고, 팔 수 있습니다. 가져다 사용했다고 알려 주세요.

| 대상 | 라이선스 |
| --- | --- |
| 코드 (소스 코드, 프로토타입, 스크립트) | [Apache License 2.0](LICENSE). 가져다 사용한 배포물에 [`NOTICE`](NOTICE) 파일의 글을 함께 실어 주세요 |
| 글 (`docs/` · `atelier/` · `journal/` · `tech-notes/`의 문서, 이 README, 시안과 스파이크 페이지) | [CC BY 4.0](LICENSE-docs). 출처를 "AriadneNSD (https://github.com/reddiana/ariadne-nsd)"로 밝혀 주세요 |
| 로고 (그림 로고와 문자 로고의 그림 파일) | 허락하지 않습니다. 이 프로젝트를 가리키는 데에만 사용할 수 있습니다 |
| 이름 (`AriadneNSD`) | 허락하지 않습니다. 가져다 만든 제품에 이 이름을 붙일 수 없습니다. "AriadneNSD를 가져다 사용했다"고 알리는 데에는 사용할 수 있습니다 |

위의 두 라이선스는 코드와 글을 사용할 권리만 줍니다. 이름과 로고를 사용할 권리는 주지 않습니다. 로고의 바탕이 된 메트로폴리탄 미술관의 사진은 CC0로 공개된 것입니다.
