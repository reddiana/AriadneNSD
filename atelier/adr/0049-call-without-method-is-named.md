---
title: "ADR-0049: Method가 없는 호출 블록은 이름 호출 하나로"
tags:
  - adr
status: 승인
date: 2026-11-21
supersedes:
superseded-by:
---

# ADR-0049: Method가 없는 호출 블록은 이름 호출 하나로

## 배경

호출 블록이 호출하는 것(`CallTarget`)은 넷이었다([[01-model#1.5 호출 블록]]의 그때 모습).

| `kind` | 뜻 | 모습 · 편집 |
| --- | --- | --- |
| `local` | 같은 문서의 Method, id로 | 실선, 이름은 Method 헤더를 따름 |
| `named` | 적은 이름(라이브러리 함수, 아직 그리지 않은 서브루틴) | 실선, 이름 · 인자 · 결과를 편집 |
| `external` | 다른 `.ns.svg` 파일의 Method, 파일과 id로(`lastName` 캐시) | 실선. 앱에는 만드는 기능이 없고 읽어서 보존만 했다 |
| `lost` | Method를 삭제하거나 헤더를 제거해 잃음(`lastName`) | 이중선이 점선, 편집할 수 없음(`lostTarget`) |

메인테이너가 inbox에 호출 블록 요건 넷을 적었다(원문은 [[2026-11-21-03-call-without-method]]).

- 다른 문서의 Method를 호출하는 기능을 요건에서 제외한다.
- 호출하는 Method가 없더라도 호출 블록의 UI가 달라질 필요가 없다.
- 호출 블록을 만들면서 문서에 없는 Method로 정할 수 있다.
- 호출 블록이 바라보는 Method가 없을 때 그 Method 다이어그램을 새로 만드는 방법을 제공한다(단축키, 우클릭 메뉴).

그래서 다른 문서의 Method 호출(그때의 R-BLK-09)을 철회했고([[requirement-changes#^r-withdrawn|R-BLK-09]]), 호출 블록에서 Method를 만드는 명령([[01-requirements#^r-edit|R-EDIT-26]])을 더했다. 모델에서 `external`과 `lost`를 어떻게 할지가 남는다.

## 결정 기준

- Method가 없는 호출 블록은 처음부터 이름만 적은 것이든 Method를 잃은 것이든 같은 모습, 같은 편집이다(메인테이너의 둘째 요건).
- 예전 파일이 열린다. 열고 저장한 결과는 결정적이다(같은 입력이면 같은 바이트).
- 쓰지 않는 variant와 그것을 다루는 분기를 남기지 않는다.

## 검토한 대안

### 대안 A: `external` · `lost`를 두고 모습만 바꾼다

- 장점: 파일 형식이 그대로다.
- 단점: 모습과 편집이 같아지면 `lost`를 `named`와 나눌 까닭이 없다. 철회한 기능의 `external`이 모델 · 파서 · 스키마에 계속 남는다.

### 대안 B: 둘을 빼고 `named`로 합친다 (선택)

- 장점: 호출 대상이 둘(`local` · `named`)이 된다. Method가 없어지면 그 이름의 `named`가 되어 그대로 편집할 수 있고, Method 만들기로 다시 이을 수 있다.
- 단점: 예전 파일의 `external.file`과 Method id는 열 때 버린다.

## 결정

대안 B. `CallTarget`은 `local`과 `named` 둘이다.

- Method를 삭제하거나 헤더를 제거하면 그 Method를 호출하던 호출 블록은 보이던 이름의 `named`가 된다. 실선이고 이름 · 인자 · 결과를 편집할 수 있다. 펴 보인 곳의 접기 영역(`siteFolds`)은 지금처럼 그대로 둔다(실행 취소로 Method가 돌아오면 다시 쓴다).
- 붙여넣은 호출 블록이 부르던 Method가 이 문서에 없으면 그 이름의 `named`가 된다(이름을 모르면 빈 이름).
- 파일을 읽을 때 `{ "kind": "lost", "lastName": … }`과 `{ "kind": "external", …, "lastName": … }`은 `{ "kind": "named", "name": lastName }`으로 읽는다. 필드의 검사는 예전과 같다(모자라거나 남는 필드가 있으면 읽지 못함). 저장은 언제나 `named`로 쓴다. 그래서 그런 파일은 열고 바로 저장하면 바이트가 바뀐다.
- 파일 형식의 버전은 올리지 않는다. 예전 앱도 `named`를 읽으므로 새 앱이 쓴 파일을 예전 앱이 연다. JSON Schema(`model.schema.json`)는 쓰는 것만 적으므로 `external` · `lost`를 뺐다.
- 편집 명령의 거절 이유 `lostTarget`을 뺐다. `notCallable`(같은 문서의 Method를 호출하지 않아 펴 보거나 풀 수 없음)은 `named`에 그대로 남는다.
- 다른 문서를 읽는 필요 인터페이스 `DocumentStore.readOther`([[0031-shell-interfaces|ADR-0031]])도 뺐다. 그것을 쓸 기능이 없어졌다.
- 레이아웃의 `isLost`와 점선(3 · 3) 이중선을 뺐다. 호출 블록의 이중선은 언제나 실선이다.

## 결과

- 좋아지는 점: 호출 블록의 상태가 둘이라, Method가 없는 호출 블록은 어디서 왔든 같은 규칙을 따른다. Method 만들기([[01-requirements#^r-edit|R-EDIT-26]])는 `named`에만 듣는다.
- 감수하는 점: 예전 파일의 다른 문서 참조(파일 이름, Method id)는 열면 사라진다. 그 기능은 앱에 없었고, 파일은 사용자가 손으로 쓰거나 다른 도구가 만든 것뿐이다.
- 후속 작업: 없음. 반영한 곳은 [[01-model#1.5 호출 블록]], [[01-file-format]], [[02-model-schema]], [[02-interaction-rules#호출 블록]], [[04-visual-design]].
