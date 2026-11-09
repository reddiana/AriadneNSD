Gemini로 해 본 시험 (2026-11-10, 메인테이너)

"https://ariadnensd.com 으로 버블소트 알고리즘을 nsd로 그려주세요"

- Gemini는 안내서를 읽고 u 링크와 코드 블록의 모델 JSON을 주었다.
- 링크는 열리지 않았다. 둘이 걸림:
  1. Gemini 앱이 링크를 https://www.google.com/search?q=… 로 감쌌다(link-google.txt). 누르면 Google 검색이 먼저 뜬다.
  2. 링크 속 JSON의 마지막 블록 {"id":"b6","kind":"process","text":"return arr"}가 "return arr"} 로 망가짐
     (손으로 퍼센트 인코딩하다 생긴 실수, M56의 haiku 실패와 같은 꼴):
     Expected ',' or ']' after array element in JSON at position 585
- 코드 블록의 JSON은 parseModel을 통과한다(envelope.json).
- 덧붙임: 횟수를 세는 반복을 for가 아니라 while로 적음("i = 0 to n - 2").

Claude의 제안(메인테이너가 claude.ai의 결과까지 보고 정하기로 함): 앱에서 모델 JSON을 붙여 넣어 열기,
안내서에 "링크를 코드 블록에도 적어라", "세는 반복은 for".
