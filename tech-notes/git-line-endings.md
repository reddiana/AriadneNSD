---
title: git과 줄 끝 문자 (LF / CRLF)
tags:
  - ariadne-nsd
  - tech-notes
updated: 2026-10-10
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

## 더 읽을거리

- [gitattributes 문서](https://git-scm.com/docs/gitattributes)
- [GitHub: Configuring Git to handle line endings](https://docs.github.com/en/get-started/getting-started-with-git/configuring-git-to-handle-line-endings)
