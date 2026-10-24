---
title: git과 줄 끝 문자 (LF / CRLF)
tags:
  - tech-notes
updated: 2026-10-22
---

# git과 줄 끝 문자 (LF / CRLF)

## 한 줄 요약

내용은 같은데 `git status`에 modified로 나온 것은 **줄 끝 문자**가 다르게 다뤄졌기 때문이다. 저장소에 `.gitattributes`를 두어 LF로 고정했다.

## 무슨 일이 있었나

- 줄 끝 문자는 운영체제마다 다릅니다. Windows는 `CRLF`(`\r\n`), Linux와 macOS는 `LF`(`\n`).
- 이 PC는 git 설정 `core.autocrlf=true`입니다. "저장소에는 LF로 넣고, 꺼낼 때는 CRLF로 바꿔라"는 뜻입니다.
- 그런데 Claude Code와 Obsidian은 파일을 **LF로** 씁니다. git은 "꺼낼 때 CRLF로 바꿔 두었을 파일이 LF로 되어 있다"고 보고 경고(`LF will be replaced by CRLF`)를 내며, 파일을 modified로 표시했습니다. `git diff`로 보면 내용 차이는 없습니다.

## 고친 방법

저장소 맨 위에 `.gitattributes`를 두었습니다.

```gitattributes
* text=auto eol=lf
```

- 텍스트 파일은 저장소에도, 작업 폴더에도 **LF로** 둡니다. 개인 PC의 `core.autocrlf` 설정보다 이 파일이 우선합니다.
- 그래서 다른 사람이 clone해도 같은 규칙이 적용됩니다.

## 백엔드로 비유하면

- DB의 문자 집합(charset)을 서버 설정에 맡기지 않고 테이블 정의에 박아 두는 것과 같습니다. 접속하는 클라이언트 설정이 달라도 저장되는 값은 같습니다.

## AriadneNSD에서 어디에 쓰나

- 문서뿐 아니라 나중의 코드와 `.ns.svg` 파일도 LF로 저장됩니다. 요구사항 [[01-requirements#^fmt-deterministic]](같은 모델이면 같은 파일)과도 맞습니다. 줄 끝이 바뀌면 같은 그림이어도 git diff가 생깁니다.

## 내용은 같은데 modified로 나올 때 (2026-10-22)

메인테이너의 질문: "변경된 내용이 없는 문서가 git status에 modified라고 나옵니다. 왜죠?" `git status`에는 `docs/04-design/02-layout.md`가 modified인데, `git diff`에는 아무것도 나오지 않았다.

**원인.** git은 빠르게 보려고 파일마다 **마지막으로 본 크기와 수정 시각**을 색인(`.git/index`)에 적어 둔다. `git status`는 먼저 이것만 견주고, 크기가 다르면 내용을 보지 않고 "바뀌었다"고 한다. `git diff`는 내용을 줄 끝 문자를 맞춘 뒤 견준다.

- 이 파일은 예전에 Windows식(CRLF)으로 꺼내졌고, 색인에 그때의 크기(3,224바이트)가 적혀 있었다.
- 그 뒤 Obsidian이 같은 내용을 LF로 다시 저장했다(3,168바이트). 줄이 56개라 CR 56개만큼 작아졌다.
- 그래서 `status`는 크기가 다르다며 modified, `diff`는 줄 끝을 맞추면 같으니 아무것도 없음.

**확인한 법.** `git ls-files --debug 파일`(색인에 적힌 크기)과 실제 파일 크기를 견주고, `git hash-object 파일`이 `git rev-parse HEAD:파일`과 같은지 본다. 같으면 내용은 같다.

**고친 법.** `git add 파일`. 내용이 같으므로 커밋할 것은 생기지 않고, 색인의 크기와 시각만 새로 적힌다. 여러 파일이면 `git add --renormalize .`

**백엔드로 비유하면** 캐시의 ETag 대신 크기로만 바뀜을 판정하는 것과 같다. 빠르지만, 크기만 바뀐 같은 내용(줄 끝)을 "바뀜"으로 잘못 본다.

## 더 읽을거리

- [gitattributes 문서](https://git-scm.com/docs/gitattributes)
- [GitHub: Configuring Git to handle line endings](https://docs.github.com/en/get-started/getting-started-with-git/configuring-git-to-handle-line-endings)
