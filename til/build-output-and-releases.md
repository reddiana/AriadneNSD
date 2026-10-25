---
title: 앱은 어디로 내보내나
tags:
  - til
updated: 2026-10-25
---

# 앱은 어디로 내보내나

> "site/는 문서를 배포하기 위함이지요? 앱을 배포하기 위해서는 어떤 디렉토리가 필요한가요?" (메인테이너, 2026-10-25)

## 한 줄 요약

앱을 내보내려고 **따로 만드는 폴더는 없습니다.** 코드는 `src/`에 두고, 빌드 결과(`dist/`)는 저장소에 넣지 않습니다. GitHub Actions가 빌드해서 배포 대상마다 정해진 곳으로 보냅니다.

## `site/`는 무엇인가

`site/`는 문서 사이트(Quartz)의 **설정**입니다. 사이트 그 자체가 아닙니다. 빌드한 HTML은 저장소에 없고, Actions가 빌드할 때마다 만들어 GitHub Pages에 올립니다(→ [[github-pages-site]]). 앱도 같은 방식입니다.

## 빌드 결과는 커밋하지 않는다

백엔드로 치면 Maven의 `target/`나 Gradle의 `build/`를 커밋하지 않는 것과 같습니다.

- 빌드 결과는 소스에서 언제든 다시 만들 수 있습니다. 커밋하면 소스와 어긋나기 쉽고, 저장소가 커집니다.
- 그래서 `dist/`는 `.gitignore`에 넣고, CI가 깨끗한 환경에서 빌드한 것만 내보냅니다.

## 배포 대상마다 내보내는 곳

| 배포 대상 | 코드 | 내보내는 곳 |
| --- | --- | --- |
| 웹 | `src/apps/web` | 문서 사이트와 같은 GitHub Pages의 `/app/` 주소. 문서 사이트를 빌드하는 워크플로가 앱도 빌드해 그 자리에 넣는다 |
| 데스크톱 | `src/apps/desktop` | GitHub Releases. 판 하나에 설치 파일(Windows · macOS · Linux)을 첨부한다 |
| Obsidian 플러그인 | `src/apps/obsidian` | GitHub Releases. 판 하나에 `main.js` · `manifest.json` · `styles.css` 세 파일을 첨부한다 |

**GitHub Releases**는 저장소에 붙은 "판 목록"입니다. 태그(`1.0.0` 같은)마다 설명과 파일을 붙여 둘 수 있고, 사용자는 거기서 내려받습니다. 백엔드로 치면 Maven 저장소에 올린 jar와 비슷하지만, 저장소 페이지 안에 있습니다.

## Obsidian이 저장소 맨 위의 `manifest.json`을 읽는 까닭

Obsidian의 커뮤니티 플러그인 목록은 등록된 저장소의 **맨 위에 있는 `manifest.json`**을 읽어 플러그인의 이름, 지금 판, 최소 Obsidian 판을 압니다. 그 판의 파일은 같은 이름의 Release에서 받아 갑니다.

우리 코드는 `src/apps/obsidian/` 아래에 있어서, 원본은 거기 두고 **사본을 맨 위에** 둡니다(`versions.json`도 함께: 플러그인 판마다 필요한 최소 Obsidian 판). 판을 올리는 스크립트가 복사하고, 둘이 다르면 CI가 실패합니다 → [[0036-code-layout|ADR-0036]]

## 더 읽을거리

- [[obsidian-plugin-internals]]: 플러그인이 파일 열기와 메뉴에 끼어드는 법
- [[03-architecture#6. 배포 구성]]: 배포 대상 일곱의 셸과 코드의 자리
