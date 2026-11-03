---
title: 이름을 잡아 두는 곳들
tags:
  - til
updated: 2026-11-03
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
| GitHub 조직 | **`AriadneNSD`와 `ariadne-nsd` (둘 다 2026-10-25에 만듦)**. 대소문자만 다른 `ariadnensd`는 `AriadneNSD`와 함께 잡힌다. 붙임표가 든 `ariadne-nsd`는 다른 이름이라 따로 만들었고, 저장소 없이 소개와 URL에 공식 주소를 적은 이정표로 둔다 | 무료 | 저장소를 옮길지, 옮긴다면 어느 이름으로 갈지는 컨트리뷰터가 생길 때 정함 |
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

npm 조직과 GitHub 조직은 무료이고, 패키지나 저장소 없이 이름만 만들어 둘 수 있다. GitHub의 이름은 대소문자를 가리지 않아 `AriadneNSD`를 만들면 `ariadnensd`도 함께 잡힌다. 그러나 붙임표가 든 `ariadne-nsd`는 **다른 이름**이다(2026-10-25에 Claude가 "함께 잡힌다"고 잘못 안내했다가 바로잡음). 그래서 같은 날 `ariadne-nsd`도 만들었다. 두 조직이 모두 살아 있어 보이면 어느 쪽이 공식인지 헷갈리므로, 하나는 저장소 없이 소개에 공식 주소만 적은 **이정표**로 둔다.

## 확인하지 않은 것

2026-10-12에 부채 목록에서 옮긴 것입니다.

- `AriadneNSD`의 상표 등록 여부는 확인하지 않음. 웹 베타 전에 KIPRIS(한국) · USPTO(미국) · EUIPO(유럽)에서 무료로 검색해 볼 것(2026-10-25에 추천, backlog). 도메인은 등록 기록 조회만 함 (보고: 2026-10-10) → [[dr-0005-product-name|DR-0005]]
	- 2026-11-03에 KIPRIS · USPTO · WIPO Madrid Monitor는 검색했다. EUIPO는 직접 조회하지 못했다 → 아래 "상표 검색 (2026-11-03)"

## 상표 검색 (2026-11-03)

> [!warning] 법률 자문이 아닙니다
> Claude가 공개 데이터베이스를 조회하고 읽은 결과입니다. 상표가 "헷갈릴 만큼 비슷한가"는 심사관과 법원이 상품 · 서비스, 시장, 표기 전체를 놓고 판단합니다. 크게 알리기 전이나 상표를 출원하려 할 때는 변리사에게 확인받는 것이 안전합니다.

### 결론

- 충돌 위험은 **낮음~중간**으로 봅니다. `AriadneNSD` · `Ariadne NSD`와 같거나 거의 같은 상표는 어느 등록부에서도 찾지 못했습니다.
- 다만 앞부분 `Ariadne`만 놓고 보면 소프트웨어 분류(9류 · 42류)에 살아 있는 상표가 있습니다. 가장 가까운 것은 독일 Ariadne GmbH의 `Ariadne`(9 · 35 · 41 · 42류, 2026-02 출원, EU · 미국 · 영국 · 스위스)와 한국의 도형 상표 `Ariadne`(42류, 등록)입니다.
- 위험이 낮은 쪽으로 보는 까닭: 우리 이름은 `Ariadne` 홀로가 아니라 `NSD`가 붙은 한 단어이고, 그들의 분야(품질경영 · 문서관리 SaaS, IT 정보제공업)는 NS 차트 편집기와 다릅니다. 무료 공개 소프트웨어라는 점은 위험을 줄이지만 없애지는 않습니다(무료 배포도 상표법의 "사용"이 될 수 있음).
- 중간까지 보는 까닭: 9류 "Software; application software; computer software"처럼 소프트웨어 전체를 덮는 넓은 지정상품이 EU에서 심사 중이고, `Ariadne`는 흔한 이름이라 앞부분이 같은 상표끼리는 다툼이 나기도 합니다.

### 추천

1. 이름은 그대로 `AriadneNSD`로 둡니다. 바꿀 까닭은 찾지 못했습니다.
2. 글로 적을 때 `Ariadne`만 따로 쓰지 않습니다. 언제나 `AriadneNSD` 한 단어로 씁니다(지금 규칙 그대로, [[dr-0005-product-name|DR-0005]]). 문자 로고 `Ariadne’s NSD`는 그림 안의 표기라 괜찮다고 보지만, 앱 이름 · 스토어 이름 · 플러그인 이름은 `AriadneNSD`로 둡니다.
3. 웹 베타를 크게 알리기 전에 메인테이너가 아래 "직접 확인하는 법"의 EUIPO 두 가지를 한 번 봅니다(5분쯤).
4. 상표를 출원할지는 지금 정하지 않아도 됩니다. 출원하려면 그때 변리사 상담을 추천합니다. 출원료는 분류마다 따로 듭니다.

### 어디서 무엇을 검색했나

| 등록부 | 직접 조회 | 검색어 | 결과 |
| --- | --- | --- | --- |
| [KIPRIS](https://www.kipris.or.kr) (한국) | 됨 | `ariadne`, `아리아드네`, `ariadnensd`, `ariadne nsd` | `ariadne` 32건, `아리아드네` 29건, 나머지 0건. 살아 있는 소프트웨어 관련은 1건(아래) |
| [USPTO Trademark Search](https://tmsearch.uspto.gov) (미국) | 됨 | `ariadne*`, `*nsd*`, `ariadnensd`, `"ariadne nsd"` | `ariadne*` 35건 가운데 살아 있는 소프트웨어 관련 2건(아래). `NSD`가 든 9류 상표는 일본 NDK의 전자부품(SAW 소자) 하나로 무관 |
| [WIPO Madrid Monitor](https://www3.wipo.int/madrid/monitor/en/) (국제등록) | 됨(레코드 한 건) | IR 1915790 | Ariadne GmbH의 국제등록. 지정국은 CH · GB · JE · US, 한국은 지정하지 않음 |
| [EUIPO eSearch](https://euipo.europa.eu/eSearch/) · [TMview](https://www.tmdn.org/tmview/) (EU) | 안 됨 | — | 자동 조회를 막음("Request Rejected"). 위 국제등록의 기초 출원으로 EU 상표 019318528이 있음은 확인 |
| [WIPO Global Brand Database](https://branddb.wipo.int) | 안 됨 | — | 화면이 JS이고 API는 인증이 필요함 |

### 눈여겨볼 상표

| 상표 | 등록부 · 번호 | 권리자 | 분류 | 상태 | 지정상품 · 서비스 (줄임) | 우리와의 거리 |
| --- | --- | --- | --- | --- | --- | --- |
| `Ariadne` (문자) | 국제등록 [IR 1915790](https://www3.wipo.int/madrid/monitor/en/showData.jsp?ID=ROM.1915790), EU 019318528(2026-02-17), 미국 [79449230](https://tsdr.uspto.gov/#caseNumber=79449230&caseType=SERIAL_NO&searchType=statusSearch) | Ariadne GmbH (독일 아헨, 품질경영 SaaS `Q.wiki`를 파는 회사) | 9, 35, 41, 42 | 심사 중(미국은 2026년 의견제출통지가 나감) | 소프트웨어 · 업무용 소프트웨어 · 품질 · 문서 · 프로세스 관리 소프트웨어, SaaS, 교육 | 가장 가까움. 지정상품이 넓다. 다만 이름 전체(`AriadneNSD`)와 분야가 다름 |
| `Ariadne` (도형 복합, 미로 무늬와 "A") | KIPRIS 40-1885120 (출원 40-2020-0216331) | 개인(김덕호) | 42 | 등록(2022-07-02) | 웹사이트 색인 제작, 컴퓨터 프로그래밍 · 소프트웨어 개발 관련 정보제공업, 컴퓨터 시스템 개발 설계 서비스 | 한국에서 가장 가까움. 서비스업이고 9류(소프트웨어 상품)는 아님. 우리 로고는 미로가 아니라 벽화의 여인이라 그림은 닮지 않음 |
| `ARIADNE SOFTWARE` | USPTO 6228521 | BioData Solutions, LLC | 42 | 등록 | 신약 개발용 바이오 분석 데이터의 클라우드 소프트웨어 | 분야가 멂 |
| `ARIADNE LABS` | USPTO 7002831 | Brigham and Women's Hospital | 42 | 등록 | 의료 연구 | 분야가 멂 |
| `ARIADNE` | USPTO 8056178 | Ariadne Maps GmbH | 35 | 등록 | 매장 방문자 데이터 분석 | 분야가 멂 |

- 그 밖의 `Ariadne`는 소멸 · 포기했거나(Ariadne Genomics의 9 · 42류, Fuji Xerox의 9류 등) 화장품 · 의류 · 와인 · 장미 같은 먼 분류입니다. 한국의 "아리아드네스 쓰레드 홀딩"은 회사 이름만 같고 상표는 `IMMEREX` · `fatbaby`입니다.
- 41류(교육)에 살아 있는 `Ariadne`는 Ariadne GmbH의 것뿐입니다.

### 이름이 같은 소프트웨어 (상표가 아니라 헷갈림의 문제)

| 이름 | 무엇 | 헷갈릴 가능성 |
| --- | --- | --- |
| [Ariadne](https://github.com/mirumee/ariadne) (Python, PyPI `ariadne`) | GraphQL 서버 라이브러리, GitHub 별 2천여 개 | 개발자 검색에서 먼저 나옴. 분야가 달라 혼동은 적음 |
| [ariadne](https://github.com/zesterer/ariadne) (Rust, crates.io) | 컴파일러 오류 보고 라이브러리, 내려받기 1400만 회 | 위와 같음 |
| npm `ariadne` | Thrift 래퍼(오래됨). `@ariadnejs/*` 등 비슷한 이름이 여럿 | `ariadne-nsd` · `@ariadne-nsd/*`는 비어 있고 조직은 우리 것 |
| Obsidian `ariadne-autocomplete` | 접근성 플러그인 "Ariadne Autocomplete Accessibility" | 플러그인 목록에서 이름이 나란히 보일 수 있음. id는 다름. NS 차트 플러그인은 아직 없음 |
| VS Code `tallbreadstick.ariadne-extension-vscode` | 학생용 코드 보안 리뷰 확장 "ariadne" | 마켓플레이스 검색에서 함께 나옴. 게시자 `ariadne-nsd`는 비어 있음 |
| Q.wiki by Ariadne | 위 Ariadne GmbH의 품질경영 SaaS | 상표 표의 첫 줄 |

등록소의 식별자(2026-11-03 다시 조회): npm `ariadne-nsd` · `ariadnensd` · `@ariadne-nsd/core` 없음, Open VSX 네임스페이스 `ariadne-nsd` 없음, VS Code 게시자 `ariadne-nsd` 없음, GitHub 저장소 검색 `ariadne-nsd` · `ariadnensd`는 이 저장소 하나, 웹 검색에서 `AriadneNSD` · `Ariadne NSD`라는 다른 제품은 없음.

### 직접 확인하는 법 (조회하지 못한 곳)

1. **EUIPO eSearch**: [euipo.europa.eu/eSearch](https://euipo.europa.eu/eSearch/)에서 "Trade marks" → 검색어 `ariadne`, Nice class `9`, `42`로 거르고 상태 "Filed · Registered"만 봅니다. 019318528(Ariadne GmbH)의 지정상품이 그대로 등록되는지, 다른 `Ariadne` 9류가 있는지 봅니다.
2. **TMview**: [tmdn.org/tmview](https://www.tmdn.org/tmview/)에서 `ariadne`, Nice class `9`, `42`. EU 각국 특허청과 영국 · 스위스까지 한 번에 나옵니다.
3. **WIPO Global Brand Database**: [branddb.wipo.int](https://branddb.wipo.int)에서 Brand name `ariadne*`, Nice class `9`. 다른 나라(일본, 중국 등)를 볼 때 씁니다.
4. KIPRIS와 USPTO는 위에서 조회했지만, 다시 볼 때는 KIPRIS 상표 검색에 `ariadne`(분류 9 · 42), USPTO Trademark Search에 `ariadne*`를 넣으면 같은 목록이 나옵니다.

## 더 읽을거리

- [npm Docs: About scopes](https://docs.npmjs.com/about-scopes)
- [GitHub Docs: About GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages)
- [GitHub Docs: Renaming a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository)
- [Obsidian: Submit your plugin](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin)
