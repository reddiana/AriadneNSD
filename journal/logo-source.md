---
title: 로고의 바탕 그림
tags:
  - ariadne-nsd
  - journal
updated: 2026-10-11
---

# 로고의 바탕 그림

AriadneNSD의 로고는 크노소스 궁전의 벽화 "푸른 옷의 여인들"에서 **가운데 여인**을 옮겨 그린 것입니다. 이 문서는 그 바탕 그림이 무엇이고 어디서 왔는지, 로고가 거기서 어떻게 나왔는지를 적어 둡니다.

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

라이선스와 소장처는 2026-10-11에 Wikimedia Commons의 파일 정보에서 확인했습니다. 메트로폴리탄 미술관의 소장품 페이지는 직접 열어 보지 않았습니다.

## 로고가 나온 과정

![[2026-10-10-logo-aegean-lady-rounded.svg|160]]

1. 바탕 그림에서 가운데 여인의 머리를 정사각형으로 자릅니다 (왼쪽 위 `(1215, 48)`, 한 변 830픽셀).
2. 색을 일곱 무리로 묶고, 무리마다 로고의 네 가지 색(주홍 바탕, 검은 머리, 석고색 살, 옅은 갈색 선) 가운데 하나를 줍니다.
3. 같은 색끼리 이어진 덩어리의 테두리를 따서 벡터 면으로 만듭니다.
4. 눈과 눈썹은 가는 선이라 뭉개지므로, 벽화의 자리와 모양을 재어 또렷한 선으로 다시 그립니다.
5. 16~24px용 작은 판은 진주 줄, 이마의 고수머리, 리본을 덜어 내고 머리·얼굴·눈만 남깁니다.

| 파일 | 내용 |
| --- | --- |
| `journal/assets/2026-10-10-logo-aegean-lady.svg` | 큰 판 (32px부터) |
| `journal/assets/2026-10-10-logo-aegean-lady-rounded.svg` | 큰 판, 모서리를 둥글게 자른 것 (README용) |
| `journal/assets/2026-10-10-logo-aegean-lady-tiny.svg` | 작은 판 (16~24px) |
| `journal/assets/2026-10-10-logo-trace-fresco.py` | 2~3단계를 하는 스크립트 |
| `journal/assets/2026-10-10-logo-trace-small.py` | 5단계를 하는 스크립트 |
| `journal/assets/2026-10-10-logo-concepts.html` | 시안을 견주어 본 페이지 |

## 문자 로고

![[2026-10-10-wordmark-light.svg|320]]

문자 로고에서만 이름을 `Ariadne’s NSD`로 적습니다 (2026-10-11, 메인테이너의 제안). "Ariadne's Thread"(아리아드네의 실)와 같은 꼴이라, 코드라는 미궁을 빠져나오는 실이라는 뜻이 전해집니다.

- **글로 적는 이름은 언제나 `AriadneNSD`입니다.** `Ariadne’s NSD`는 이 그림에서만 씁니다. 그림의 대체 글자도 `AriadneNSD`입니다. → [[0019-product-name|ADR-0019]]
- **글자:** `Ariadne`는 먹색 GFS Didot, 소유격 `’s`는 주홍 GFS Didot, `NSD`는 주홍 IBM Plex Mono입니다. 주홍은 그림 로고의 바탕색이자 실의 색입니다. 두 글꼴 모두 OFL 라이선스입니다.
- **파일:** `journal/assets/2026-10-10-wordmark-light.svg`(밝은 화면용), `…-dark.svg`(어두운 화면용). 글자를 윤곽선으로 바꿔서 글꼴이 없어도 보입니다. 만든 스크립트는 `journal/assets/2026-10-10-logo-wordmark.py`입니다.
- **견주어 본 시안:** 붙여 쓴 `AriadneNSD`(W1), 소유격을 먹색으로(W2), 소유격을 주홍으로(W3). W3으로 정했습니다. → `journal/assets/2026-10-10-logo-concepts.html`

## 바탕 그림을 바꾼 일

처음(2026-10-10)에는 메인테이너가 inbox에 붙여 넣은 사진에서 로고를 뽑았습니다. 그 사진은 출처를 알 수 없었습니다. 메인테이너가 "공개 사진으로 거의 동일한 사진이 있을 것 같아요"라고 해서 찾아보니 위의 CC0 사진이 있었고, 2026-10-11에 이 사진으로 로고를 다시 뽑았습니다. 구도는 거의 같고 사진이 커서 진주 줄이 더 또렷해졌습니다. inbox의 사진 9장은 저장소에서 지웠습니다. → [[2026-10-10-06-logo]]

## 남은 확인

- **그리스 문화재법: 닿을 가능성이 낮다고 봄 (2026-10-11).** 그리스의 문화재법(3028/2002) 46조는 그리스 유물의 묘사를 상업·광고에 쓸 때 문화부의 허가와 수수료를 요구합니다. 해설에 따르면 여기서 묘사는 원칙적으로 유물의 실제 모습을 재현한 사진이나 영상입니다. 우리 바탕 그림은 그리스 박물관에 있는 벽화의 사진이 아니라 뉴욕의 미술관이 가진 모사화의 사진이고, 로고는 그것을 색 면으로 다시 그린 것이며, 한국에서 만들어 GitHub에 올립니다. 그리스 밖의 재현물까지 이 법이 미친다고 한 자료는 찾지 못했습니다. **그리스 안에서 사업을 하게 될 때만 다시 봅니다.**
- 위 판단은 Claude가 조문 원문이 아니라 그리스 문화부의 신청 양식과 로펌의 해설 글([Greek monuments in advertising](https://www.ilnipinsider.com/2025/02/greek-monuments-in-advertising/))을 보고 내린 것이고, 법률 자문이 아닙니다.
