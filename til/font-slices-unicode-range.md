---
title: 글꼴을 조각으로 나눠 받기 (unicode-range)
tags:
  - til
updated: 2026-11-03
---

# 글꼴을 조각으로 나눠 받기 (unicode-range)

## 한 줄 요약

글꼴 파일 하나를 글자 범위마다 여러 조각으로 나누고, 조각마다 "이 조각은 어떤 글자를 담는가"(CSS `unicode-range`)를 브라우저에 알려 주면, 브라우저는 **화면에 실제로 나온 글자가 든 조각만** 받는다.

## 백엔드로 비유하면

큰 테이블을 통째로 내려주지 않고, 파티션으로 나눠 두고 쿼리에 걸리는 파티션만 읽는 것(partition pruning)과 같다. 파티션 키가 글자의 코드 포인트이고, `unicode-range`가 파티션의 범위 정의다. 다른 점은, 어느 파티션이 필요한지를 브라우저가 화면에 그릴 글자를 보고 스스로 정한다는 것이다.

## 어떻게 쓰나

같은 글꼴 이름으로 조각마다 `@font-face`(또는 JS의 `FontFace`)를 하나씩 등록한다.

```css
@font-face { font-family: "AriadneNSD Mono"; src: url(mono.00.woff2); unicode-range: U+20-7E, U+A0-FF; }
@font-face { font-family: "AriadneNSD Mono"; src: url(mono.03.woff2); unicode-range: U+AC00, U+B2E4, U+C815; }
```

- 페이지는 글꼴 하나(`AriadneNSD Mono`)를 쓰는 것처럼 쓴다. 나뉜 것을 모른다
- 어떤 글자가 화면에 나오면, 브라우저가 그 글자를 담은 조각을 찾아 받는다. 받는 동안은 다음 대체 글꼴로 보인다(`font-display: swap`)
- Google Fonts가 한국어 · 중국어 · 일본어 글꼴을 100여 조각으로 나눠 보내는 방법이다

## 어떻게 나누나

조각이 크면 쓰지 않는 글자까지 받고, 조각이 작으면 요청이 많아진다. 그래서 **함께 쓰이는 글자끼리** 묶는다.

- 라틴 · 숫자 · 기호는 거의 모든 문서에 나와 한 조각으로 시작할 때 받는다
- 한글은 자주 쓰는 순서로 줄을 세워 작게 나눈다. 흔한 문장은 앞쪽 몇 조각으로 끝난다
- 드문 글자는 크게 묶는다. 잘 받지 않으니 요청 수를 줄이는 쪽이 낫다

## AriadneNSD에서 어디에 쓰나

웹 앱의 화면 글꼴(한글 11,172자를 모두 담은 320 KB)을 38조각으로 나눴다. 시작할 때는 기호 조각 24 KB만 받고, 예제 열 개를 모두 열어도 한글 조각은 9개(77 KB)다. 첫 내려받기가 465 KB에서 176 KB로 줄었다 → [[0040-screen-font-slices|ADR-0040]]

글자의 폭은 글꼴 파일이 아니라 번들한 폭 테이블로 세므로([[text-width-and-bundled-fonts]]), 조각이 늦게 와도 블록의 크기는 바뀌지 않는다. 글자 모양만 대체 글꼴에서 바뀐다.

## 함정

- 조각 목록(어느 조각이 어떤 글자인가)도 내려받아야 한다. 글자를 하나씩 적으면 목록이 커진다. 연속된 범위로 적거나 짧게 적어 계산한다
- 아주 작은 조각은 빌드 도구(Vite)가 파일로 두지 않고 JS 안에 끼워 넣을 수 있다
- 시작 시간은 받는 양만으로 정해지지 않는다. 이번에는 받는 양이 3분의 1로 줄었는데 첫 화면은 그대로였다. 그 시간은 JS 실행과 그리기에 들었다 → [[benchmark-numbers]]

## 더 읽을거리

- MDN, `unicode-range`: https://developer.mozilla.org/docs/Web/CSS/@font-face/unicode-range
- [[web-font-formats]]: 조각 하나하나는 woff2 파일이다
