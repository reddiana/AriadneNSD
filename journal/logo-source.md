---
title: 로고의 바탕 그림
tags:
  - journal
updated: 2026-10-14
---

# 로고의 바탕 그림

AriadneNSD의 로고는 크노소스 궁전의 벽화 "푸른 옷의 여인들"에서 **가운데 여인**을 옮겨 그린 것입니다. 이 문서는 **지금의 로고**를 적어 둡니다: 바탕 그림이 무엇이고 어디서 왔는지, 로고를 어떻게 만드는지, 파일이 어디 있는지.

> [!info] 고른 과정은 시안 페이지에
> 어떤 안들을 견주었고 왜 이것을 골랐는지는 이 문서에 적지 않고 시안 페이지에 둡니다.
> - [로고 시안](https://claude.ai/artifact/JZBq5xrGFdfhQzcRNgmiyD) (저장소의 사본 `journal/assets/2026-10-10-logo-concepts.html`): 그림 로고의 안 A~F, 미소의 선, 문자 로고의 글자 모양이 정해진 차례, 바탕 그림을 바꾼 일
> - [문자 로고 바탕 시안](https://claude.ai/artifact/VmPiuJk7cLMYDMA2ePKKs7) (`journal/assets/2026-10-11-wordmark-any-background.html`): 어느 바탕에서나 읽히게 하는 안 P1~P3, N1 · N2
> - 시안 페이지 전체의 목록은 [[sketchbook]]에 있습니다.

## 바탕 그림

![[2026-10-11-ladies-in-blue-met-cc0.jpg]]

| 항목 | 내용 |
| --- | --- |
| 작품 | "푸른 옷의 여인들"(Ladies in Blue) 벽화의 모사화 |
| 그린 사람 | Emile Gilliéron. 20세기 초 크노소스 벽화를 복원한 화가 |
| 원래 벽화 | 크레타 크노소스 궁전, 기원전 16~15세기 무렵. 조각만 남은 것을 복원했다 |
| 소장 | 메트로폴리탄 미술관(The Metropolitan Museum of Art), 소장품 번호 258137 |
| 라이선스 | **CC0** (조건 없는 공개). 출처를 밝히지 않아도 되고 돈 버는 데 써도 된다 |
| 받은 곳 | [Wikimedia Commons: Reproduction of the "Ladies in Blue" fresco MET DP234770.jpg](https://commons.wikimedia.org/wiki/File:Reproduction_of_the_%22Ladies_in_Blue%22_fresco_MET_DP234770.jpg) |
| 크기 | 3905 × 2451 |
| 저장소의 파일 | `journal/assets/2026-10-11-ladies-in-blue-met-cc0.jpg` (받은 그대로) |
| 쓰기 시작한 날 | 2026-10-11. 그 전날의 첫 로고는 출처를 알 수 없는 사진에서 뽑았고, 이 사진으로 다시 뽑았다 |

라이선스와 소장처는 2026-10-11에 Wikimedia Commons의 파일 정보에서 확인했습니다. 메트로폴리탄 미술관의 소장품 페이지는 직접 열어 보지 않았습니다.

## 로고를 만드는 법

![[2026-10-10-logo-aegean-lady-rounded.svg|160]]

1. 바탕 그림에서 가운데 여인의 머리를 정사각형으로 자릅니다 (왼쪽 위 `(1215, 48)`, 한 변 830픽셀).
2. 색을 일곱 무리로 묶고, 무리마다 로고의 네 가지 색(주홍 바탕, 검은 머리, 석고색 살, 옅은 갈색 선) 가운데 하나를 줍니다.
3. 같은 색끼리 이어진 덩어리의 테두리를 따서 벡터 면으로 만듭니다.
4. 눈과 눈썹은 가는 선이라 뭉개지므로, 벽화의 자리와 모양을 재어 또렷한 선으로 다시 그립니다. 입꼬리의 선(미소)도 같은 방법으로 2026-10-12에 넣었습니다 → [[#미소 (2026-10-12)]]
5. 16~24px용 작은 판은 진주 줄, 이마의 고수머리, 리본을 덜어 내고 머리·얼굴·눈만 남깁니다.

| 파일 | 내용 |
| --- | --- |
| `journal/assets/2026-10-10-logo-aegean-lady.svg` | 큰 판 (32px부터) |
| `journal/assets/2026-10-10-logo-aegean-lady-rounded.svg` | 큰 판, 모서리를 둥글게 자른 것 (README용) |
| `journal/assets/2026-10-10-logo-aegean-lady-tiny.svg` | 작은 판 (16~24px) |
| `journal/assets/2026-10-10-logo-trace-fresco.py` | 2~3단계를 하는 스크립트 |
| `journal/assets/2026-10-10-logo-trace-small.py` | 5단계를 하는 스크립트 |

## 미소 (2026-10-12)

입꼬리에 옅은 갈색의 짧은 선 하나가 있습니다. 벽화의 미소선과 같은 모양(거의 곧은 선)을 절반쯤으로 줄인 것이고, 색은 귀와 머리띠의 선과 같습니다. 작은 판(16~24px)에는 없습니다. 견준 안과 고른 까닭은 [로고 시안](https://claude.ai/artifact/JZBq5xrGFdfhQzcRNgmiyD)의 "미소" 단락에 있습니다. → [[dr-0006-logo|DR-0006]] "이후 변경"

## 문자 로고

![[2026-10-11-wordmark-n1-warm-grey.svg|320]]

문자 로고에서만 이름을 `Ariadne’s NSD`로 적습니다 (2026-10-11, 메인테이너의 제안). 이름의 뜻과 내력은 [[name-story]]에 따로 적었습니다. "Ariadne's Thread"(아리아드네의 실)와 같은 꼴이라, 코드라는 미궁을 빠져나오는 실이라는 뜻이 전해집니다.

- **글로 적는 이름은 언제나 `AriadneNSD`입니다.** `Ariadne’s NSD`는 이 그림에서만 씁니다. 그림의 대체 글자도 `AriadneNSD`입니다. → [[dr-0005-product-name|DR-0005]]
- **글자:** `Ariadne`는 회갈색(`#8C8079`) GFS Didot, 소유격 `’s`는 주홍(`#DD5530`)의 기울인 글씨(Playfair Display Italic)로 조금 작게, `NSD`는 주홍의 고딕(Josefin Sans, 굵기 600)으로 자간 없이 적습니다. 주홍은 그림 로고의 바탕색에서 가져왔습니다. 두 색 모두 흰 바탕과 검은 바탕의 중간 밝기로 맞췄습니다(아래 "파일 하나로 바꾼 일"). 세 글꼴 모두 OFL 라이선스입니다.
- **파일:** `journal/assets/2026-10-11-wordmark-n1-warm-grey.svg` 하나. 밝은 화면과 어두운 화면에 같은 파일을 씁니다. 글자를 윤곽선으로 바꿔서 글꼴이 없어도 보입니다. 윤곽선은 `journal/assets/2026-10-10-logo-wordmark.py`로 만들고, 색은 `journal/assets/2026-10-11-wordmark-variants.py`로 바꿉니다.
- **견준 시안:** 글자 모양이 정해진 차례(W1 → W4-6b)는 [로고 시안](https://claude.ai/artifact/JZBq5xrGFdfhQzcRNgmiyD)에, 바탕과 색(N1)은 [문자 로고 바탕 시안](https://claude.ai/artifact/VmPiuJk7cLMYDMA2ePKKs7)에 있습니다.
### 파일 하나로 바꾼 일 (2026-10-11)

밝은 화면용과 어두운 화면용을 따로 두면 GitHub와 Obsidian이 잘못 고를 때가 있습니다. 기술 설명은 [[theme-aware-images]]에, 겪은 일과 고른 과정은 로고 시안에 있습니다. 옛 두 파일(`2026-10-10-wordmark-light.svg`, `…-dark.svg`)은 시안 페이지가 쓰므로 남겨 두었습니다. → [[dr-0006-logo|DR-0006]] "이후 변경"

## 남은 확인

- **그리스 문화재법: 저촉될 가능성이 낮다고 봄 (2026-10-11).** 그리스의 문화재법(3028/2002) 46조는 그리스 유물의 묘사를 상업·광고에 쓸 때 문화부의 허가와 수수료를 요구합니다. 해설에 따르면 여기서 묘사는 원칙적으로 유물의 실제 모습을 재현한 사진이나 영상입니다. 우리 바탕 그림은 그리스 박물관에 있는 벽화의 사진이 아니라 뉴욕의 미술관이 가진 모사화의 사진이고, 로고는 그것을 색 면으로 다시 그린 것이며, 한국에서 만들어 GitHub에 올립니다. 그리스 밖의 재현물까지 이 법이 미친다고 한 자료는 찾지 못했습니다. **그리스 안에서 사업을 하게 될 때만 다시 봅니다.**
- 위 판단은 Claude가 조문 원문이 아니라 그리스 문화부의 신청 양식과 로펌의 해설 글([Greek monuments in advertising](https://www.ilnipinsider.com/2025/02/greek-monuments-in-advertising/))을 보고 내린 것이고, 법률 자문이 아닙니다.

2026-10-12에 부채 목록에서 옮긴 것입니다. 답이 필요한 것은 아니고, 확인하지 못한 채로 있다는 기록입니다.

- CC0 표시는 Wikimedia Commons의 파일 정보에서 확인함. 메트로폴리탄 미술관의 소장품 페이지는 직접 열어 보지 않음 (보고: 2026-10-11)
- 시안 페이지(claude.ai 아티팩트)의 옛 판에는 흉상 시안과 옛 사진에서 뽑은 그림이 남아 있음. 시안 페이지는 2026-10-14부터 공개 페이지이고([[dr-0010-study-pages-cc-by|DR-0010]]), 저장소와는 별개 (보고: 2026-10-11)
- 흉상의 공개 사진을 찾지 못함. Commons의 "Arianna"(아리아드네의 이탈리아어 이름. 로마 카피톨리노 박물관의 조각이라 이탈리아어로 올라 있음)는 다른 조각이었음. inbox의 흉상이 디오니소스로도 불린다는 것은 검색 결과에 따른 것 (보고: 2026-10-10)
- 로고 시안 페이지는 밝은 화면의 윗부분만 찍어 확인함. 어두운 화면과 휴대폰 폭은 보지 못함 (보고: 2026-10-10)
