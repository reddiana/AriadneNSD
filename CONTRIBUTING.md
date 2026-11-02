# AriadneNSD에 기여하기

관심을 가져 주셔서 고맙습니다. AriadneNSD는 **지금 첫 출시(MVP)인 웹 버전을 개발하고 있습니다.** 지금 가장 반가운 기여는 MVP를 써 보고 알려 주시는 것과, 설계를 읽고 의견을 주시는 것입니다.

## 지금 할 수 있는 것

- **MVP 써 보기:** https://ariadnensd.com/ 에서 설치 없이 열립니다. 버그나 불편한 곳을 [이슈](https://github.com/reddiana/AriadneNSD/issues)로 알려 주세요. 다이어그램을 공개하고 싶지 않으면 `report@ariadnensd.com`으로 보내 주세요(사용법의 [문제 알리기](https://ariadnensd.com/manual/ko/#report)). 브라우저와 OS, 한 일의 순서를 적어 주시면 재현하기 쉽습니다.
- **설계 문서 읽기:** https://ariadnensd.com/about 에서 요구사항, UX 설계, 아키텍처, 상세 설계, 결정 기록과 작업 공간(`atelier/`), 배운 것(`til/`, Today I Learned)을 읽을 수 있습니다. 저장소를 받아 [Obsidian](https://obsidian.md/)으로 열어도 됩니다(→ [README](README.md#이-저장소를-읽는-법)).
- **이슈 열기:** 물음, 제안, 문서의 틀린 곳, 시안을 보고 든 생각을 [이슈](https://github.com/reddiana/AriadneNSD/issues)로 남겨 주세요. 한국어든 영어든 괜찮습니다.
- **문서 고치기:** 오타나 깨진 링크 같은 작은 고침은 바로 Pull Request를 보내셔도 됩니다. 결정을 바꾸는 고침은 먼저 이슈에서 이야기해 주세요. 결정의 근거는 `atelier/adr/`(ADR)와 `atelier/decisions/`(DR)에 있습니다.

문서를 쓰는 규칙(파일 이름, 번호, 위키링크, 결정 기록의 형식)은 [CLAUDE.md](CLAUDE.md)의 "문서 작성 규칙"에 있습니다.

## 코드

코드는 [`src/`](src/README.md)의 pnpm 모노레포이고, 개발 환경을 갖추고 빌드 · 테스트하는 법은 [`src/README.md`](src/README.md)에 있습니다. 코드를 쓰는 규칙(도구와 그 설정, 이름 짓기, 오류 처리, 주석, 테스트, 커밋 메시지)은 [코딩 가이드](docs/07-coding-guide/07-coding-guide.md)에 있습니다. 쓰는 기술과 개발 도구는 [아키텍처 개요의 기술 스택](docs/03-architecture/03-architecture.md#8-기술-스택)에 있습니다. 코드 Pull Request는 아직 받지 않습니다. 고칠 곳을 찾으셨으면 이슈로 알려 주세요. 받기 시작하면 이 문서에 적겠습니다.

## 라이선스

보내 주신 기여는 이 저장소의 라이선스를 따릅니다: 코드는 [Apache License 2.0](LICENSE), 글은 [CC BY 4.0](LICENSE-docs). 이름과 로고는 라이선스에 들어 있지 않습니다(→ [README](README.md#라이선스)).

---

## Contributing (English summary)

AriadneNSD is a Nassi–Shneiderman diagram editor, **currently developing its first release (MVP), the web version**. The documents are written in Korean.

- Try the MVP at https://ariadnensd.com/ and report bugs as issues (browser, OS and steps help). To report privately, email `report@ariadnensd.com` (see [Reporting a problem](https://ariadnensd.com/manual/#report)).
- Read the design documents at https://ariadnensd.com/about (or open the repository as an Obsidian vault).
- Questions, ideas and corrections are welcome as [issues](https://github.com/reddiana/AriadneNSD/issues), in English or Korean.
- Small fixes (typos, broken links) can go straight to a pull request. Please discuss changes to decisions in an issue first.
- The code lives in [`src/`](src/README.md) (pnpm monorepo); see that README to build and test. Code pull requests are not accepted yet; this file will say when they are.
- Contributions are licensed under Apache-2.0 (code) and CC BY 4.0 (text). The name and logo are not licensed.
