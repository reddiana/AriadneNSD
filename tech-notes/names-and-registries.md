---
title: 이름을 잡아 두는 곳들
tags:
  - ariadne-nsd
  - tech-notes
updated: 2026-10-10
---

# 이름을 잡아 두는 곳들

## 한 줄 요약

제품 이름은 여러 **등록소**에 따로따로 등록됩니다. 등록소마다 먼저 잡는 사람이 가져가고, 도메인만 해마다 돈이 듭니다.

## 백엔드로 비유하면

- **등록소** = 유일 키(unique key)가 걸린 테이블. 같은 이름을 두 번 넣을 수 없고, 먼저 넣은 사람이 주인입니다. 테이블이 여러 개라서 한 곳에서 비어 있어도 다른 곳에서는 차 있을 수 있습니다.
- **npm** = Maven Central. JS 패키지를 올리는 곳이고 이름 등록은 무료입니다. 코드 없이 이름만 잡으려고 빈 패키지를 올리는 것은 권장되지 않습니다.
- **npm scope** (`@ariadne-nsd/core`) = Maven의 groupId. 조직 이름 아래에 패키지를 여러 개 둘 수 있고, 공개 패키지는 무료입니다.
- **도메인** = 임대 계약. 사는 것이 아니라 1년 단위로 빌리고, 갱신하지 않으면 남이 가져갑니다. 첫해 할인 가격보다 갱신 가격을 봐야 합니다.
- **RDAP** = 도메인 등록 정보를 묻는 조회 API(예전 WHOIS의 후속). "등록 기록 없음"은 비어 있을 가능성이 높다는 뜻이지, 살 수 있다는 보장은 아닙니다.
- **GitHub Pages** = 저장소에 붙어 오는 무료 정적 호스팅. 주소는 `사용자이름.github.io/저장소이름`이라서 도메인이 없어도 웹 버전을 내놓을 수 있습니다.

## AriadneNSD에서 어디에 쓰나

| 등록소 | 쓸 이름 | 비용 | 언제 필요한가 |
| --- | --- | --- | --- |
| GitHub 저장소 | `ariadne-nsd` | 무료 | 지금 (이름 바꾸기) |
| Obsidian 플러그인 id | `ariadne-nsd` | 무료 (등록 심사) | Obsidian 플러그인을 낼 때 |
| npm 패키지 | `ariadne-nsd` 또는 `@ariadne-nsd/…` | 무료 | 공유 코어를 패키지로 낼 때 |
| 도메인 | `ariadnensd.com` 등 (붙임표 없이도 가능) | `.com`은 1년에 10~11달러쯤 | 자체 주소가 필요할 때 |

- 2026-10-10에 조회했을 때 위 이름은 모두 비어 있었습니다. 조회한 범위와 확인하지 않은 것(상표)은 [[0019-product-name|ADR-0019]]에 있습니다.
- 웹 버전은 GitHub Pages에 올리면 도메인 없이 출시할 수 있습니다.
- 모델 네임스페이스 URI([[01-file-format#6. 미결정 사항]])는 실제로 열리는 주소일 필요가 없고 겹치지 않는 이름이면 됩니다. 그래도 보통 자기가 가진 주소(저장소나 도메인)를 바탕으로 짓기 때문에, 주소가 정해져야 정할 수 있습니다.

## 더 읽을거리

- [npm Docs: About scopes](https://docs.npmjs.com/about-scopes)
- [GitHub Docs: About GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages)
- [GitHub Docs: Renaming a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository)
- [Obsidian: Submit your plugin](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin)
