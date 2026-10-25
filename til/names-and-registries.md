---
title: 이름을 잡아 두는 곳들
tags:
  - til
updated: 2026-10-25
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
| GitHub 저장소 | `AriadneNSD` (2026-10-15에 `ariadne-nsd`에서 바꿈 → [[dr-0011-repo-name\|DR-0011]]) | 무료 | 지금 |
| Obsidian 플러그인 id | `ariadne-nsd` | 무료 (등록 심사) | Obsidian 플러그인을 낼 때 |
| npm 패키지 | `ariadne-nsd` 또는 `@ariadne-nsd/…` | 무료 | 공유 코어를 패키지로 낼 때 |
| npm 조직(scope) | **`ariadne-nsd` (2026-10-25에 만듦)**. 이제 `@ariadne-nsd/…`는 우리만 쓴다 | 무료(공개 패키지) | 패키지 없이 이름만 잡아 둠 |
| GitHub 조직 | **`AriadneNSD` (2026-10-25에 만듦)**. 대소문자만 다른 `ariadnensd`는 함께 잡히지만, 붙임표가 든 `ariadne-nsd`는 다른 이름이라 비어 있음 | 무료 | 저장소를 옮길지는 컨트리뷰터가 생길 때 정함 |
| VS Code 게시자 · Open VSX | `ariadne-nsd` (2026-10-25 조회: 비어 있음) | 무료 | IDE 플러그인을 낼 때 |
| 그 밖에 낼 때 잡는 것 | Obsidian 플러그인 id(제출 때 심사, 비슷한 것은 `ariadne-autocomplete`뿐), JetBrains · Atlassian 판매자, Google Cloud 프로젝트 · OAuth 앱 이름, 데스크톱 앱 id(winget · Store, macOS 번들 id), 후원 페이지 | 대개 무료 | 그 배포 대상을 낼 때 |
| 도메인 | **`ariadnensd.com` (2026-10-25에 삼, Cloudflare Registrar, 만료 2027-10-24, 자동 갱신)** | `.com`은 1년에 10~11달러쯤 | 웹 버전의 제품 주소. 사이트를 옮길지는 따로 정함 |

- 2026-10-10에 조회했을 때 위 이름은 모두 비어 있었습니다. 조회한 범위와 확인하지 않은 것(상표)은 [[dr-0005-product-name|DR-0005]]에 있습니다.
- 웹 버전은 GitHub Pages에 올리면 도메인 없이 출시할 수 있습니다.
- 모델 네임스페이스 URI는 실제로 열리는 주소일 필요가 없고 겹치지 않는 이름이면 됩니다. 그래도 보통 자기가 가진 주소(저장소나 도메인)를 바탕으로 짓습니다. 2026-10-25에 저장소 주소 `https://github.com/reddiana/AriadneNSD`로 정했습니다 → [[0035-model-namespace-and-v0|ADR-0035]]

## 도메인을 사는 법 (2026-10-25)

1. **등록 업체(레지스트라)를 고른다.** 첫해 가격이 아니라 **갱신 가격**을 본다. Cloudflare Registrar는 원가로 팔아 첫해와 갱신이 같고, 등록자 정보 가리기(WHOIS privacy)가 무료다. 국내 업체(가비아 등)는 한국어 화면이 편하지만 `.com`이 비싼 편이다.
2. **계정에 2단계 인증을 켠다.** 도메인을 가진 계정을 잃으면 주소를 통째로 잃는다.
3. 이름을 찾아 결제한다. 등록자 정보는 사실대로 적는다(공개되지 않게 가려진다).
4. 며칠 안에 오는 **확인 메일**을 누른다. 국제 규칙(ICANN)상 15일 안에 확인하지 않으면 도메인이 정지된다.
5. **자동 갱신**을 켜고, 카드를 바꾸면 거기도 바꾼다.

npm 조직과 GitHub 조직은 무료이고, 패키지나 저장소 없이 이름만 만들어 둘 수 있다. GitHub의 이름은 대소문자를 가리지 않아 `AriadneNSD`를 만들면 `ariadnensd`도 함께 잡힌다. 그러나 붙임표가 든 `ariadne-nsd`는 **다른 이름**이라 비어 있다(2026-10-25에 Claude가 "함께 잡힌다"고 잘못 안내했다가 바로잡음).

## 확인하지 않은 것

2026-10-12에 부채 목록에서 옮긴 것입니다.

- `AriadneNSD`의 상표 등록 여부는 확인하지 않음. 공개 출시 전에 KIPRIS(한국) · USPTO(미국) · EUIPO(유럽)에서 무료로 검색해 볼 것(2026-10-25에 추천, backlog). 도메인은 등록 기록 조회만 함 (보고: 2026-10-10) → [[dr-0005-product-name|DR-0005]]

## 더 읽을거리

- [npm Docs: About scopes](https://docs.npmjs.com/about-scopes)
- [GitHub Docs: About GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages)
- [GitHub Docs: Renaming a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository)
- [Obsidian: Submit your plugin](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin)
