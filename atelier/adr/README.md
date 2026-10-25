---
title: 아키텍처 결정 기록
tags:
  - plan
updated: 2026-10-25
---

# 아키텍처 결정 기록

(← [[atelier/README|작업 공간]])

코드의 구조, 모델, 파일 형식, 기술 선택에 관한 결정입니다. 아키텍처가 아닌 결정은 [[atelier/decisions/README|결정 기록(DR)]]에 같은 형식으로 둡니다(2026-10-17 → [[dr-0001-split-decision-records|DR-0001]]). 그때 옮긴 열 개의 번호(0011, 0013, 0015, 0019, 0020, 0023, 0024, 0025, 0027, 0028)는 비워 두고 다시 쓰지 않습니다. 다루는 것에 따라 묶었고, 묶음 안에서는 번호 순서입니다.

### 기록하는 법

| 번호 | 제목 | 상태 |
| --- | --- | --- |
| [[0001-record-architecture-decisions\|0001]] | ADR로 아키텍처 결정을 기록한다 | 승인 |

### 배포 대상과 기술

| 번호 | 제목 | 상태 |
| --- | --- | --- |
| [[0002-three-targets-shared-core\|0002]] | 세 대상 배포 + 공유 코어 모노레포 | 승인 |
| [[0003-typescript\|0003]] | 구현 언어 TypeScript | 승인 |
| [[0009-desktop-framework\|0009]] | 데스크톱 프레임워크 (Electron / Tauri) | 제안됨 |
| [[0010-ui-framework\|0010]] | UI 프레임워크: 둘레의 화면 부품은 React로 | 승인 |
| [[0012-google-drive-integration\|0012]] | Google Drive 연동은 웹 버전 위에 얹는다 | 승인 |

### 편집 모델

| 번호 | 제목 | 상태 |
| --- | --- | --- |
| [[0004-structure-editor\|0004]] | 구조 편집기: 트리 모델 + 자동 레이아웃 | 승인 |
| [[0008-contiguous-selection\|0008]] | 선택은 같은 부모 아래 연속 범위 | 승인 |
| [[0021-event-and-method\|0021]] | Event와 Method를 구분한다 (낮은 아치 머리, 호출 블록은 Method만) | 승인 |
| [[0022-call-name-follows-head\|0022]] | 호출 블록의 이름은 Method의 머리를 따른다 (인자와 결과만 적음) | 승인 |

### 파일 형식과 저장

| 번호 | 제목 | 상태 |
| --- | --- | --- |
| [[0005-model-embedded-svg\|0005]] | 모델 내장 SVG를 저장 형식으로 사용 | 승인 |
| [[0006-file-extensions\|0006]] | 확장자 `.ns` / `.ns.svg` | 승인 |
| [[0007-json-serialization\|0007]] | 모델 직렬화 형식 JSON | 승인 |
| [[0014-drive-file-extension\|0014]] | Google Drive에서 만드는 파일은 `.ns.svg`로 저장한다 | 승인 |
| [[0016-fold-state-outside-file\|0016]] | 접힘 상태는 파일에 저장하지 않는다 | 대체됨 (→ 0018) |
| [[0017-fold-name-in-model\|0017]] | 접는 범위의 이름은 모델에 저장한다 | 승인 |
| [[0018-save-as-shown\|0018]] | 저장되는 그림은 지금 화면 그대로이고, 접힘 상태도 파일에 저장한다 (0016을 대체) | 승인 |
| [[0026-bundled-font-metrics\|0026]] | 글꼴을 번들해 텍스트 폭을 글꼴 메트릭으로 계산하고, 저장되는 SVG에는 서브셋 글꼴을 임베드한다 | 승인 |

### 편집 엔진과 화면

| 번호 | 제목 | 상태 |
| --- | --- | --- |
| [[0029-immutable-document-undo\|0029]] | 문서는 불변 객체로 다루고, undo는 이전 스냅숏으로 돌아가는 것으로 한다 | 승인 |
| [[0030-swappable-drawing\|0030]] | 화면도 저장되는 SVG와 같은 렌더러로 그리고, 렌더링 백엔드는 교체할 수 있게 둔다 | 승인 |
| [[0031-shell-interfaces\|0031]] | editor의 필요 인터페이스 DocumentStore · SettingsStore를 셸이 구현한다 | 승인 |
| [[0032-token-highlighting\|0032]] | 구문 강조는 블록 글자의 종류마다 토크나이저 하나로 한다 | 승인 |
| [[0033-command-list-for-shells\|0033]] | editor가 제공 인터페이스 CommandRegistry · SettingsSchema를 노출하고, 셸은 그것을 호스트의 확장 지점에 등록한다 | 승인 |
| [[0034-default-block-font\|0034]] | 기본 블록 글꼴은 D2Coding 보통 굵기 하나, 한자를 뺀 나머지 문자를 싣는다 | 승인 |
| [[0035-model-namespace-and-v0\|0035]] | 모델 네임스페이스 URI는 저장소 주소, 프로토타입의 v0 파일은 열지 않는다 | 승인 |

새 결정은 [[0000-template|ADR 템플릿]]을 복사해서 다음 번호(0036부터)로 만들고, 위 목록의 맞는 묶음에 한 줄을 더합니다.

상태(ADR · DR 같음): **제안됨**(검토 중) → **승인** → (필요하면) **대체됨** / **폐기**

2026-10-12까지 ADR은 `docs/03-adr/`에 있었습니다. `docs/`에는 최종 모습만 두기로 하면서 이곳으로 옮겼습니다.
