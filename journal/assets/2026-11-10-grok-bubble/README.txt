Grok으로 해 본 시험 (2026-11-10, 메인테이너)

/llms.txt와 첫 화면의 AI용 안내를 배포한 뒤(커밋 d2fc3a4), 메인테이너가 Grok에게
"https://ariadnensd.com 으로 버블소트 알고리즘을 nsd로 그려주세요"라고 했다.

- Grok은 링크를 주지 않았다. 의사코드, 상자 문자로 그린 NSD, 손으로 따라 할 순서("Blank document" 선택,
  While 도구 …, "Export as PNG")를 주었다. "사이트 특성상 중첩 편집이 조금 까다로워"라고 했다.
- "Blank document"(예제 모달)와 "Export as PNG"(파일 메뉴)는 앱이 그린 화면의 글자다. Grok은 자바스크립트를
  돌리는 브라우저로 열어 조작하려 했던 것으로 보인다.
- 첫 화면의 AI용 안내(<section id="for-ai" hidden>)는 #root 안에 있어, 앱이 뜨면 React가 #root를 바꾸며 사라진다.
  HTML만 읽는 ChatGPT는 보았고, 화면을 띄우는 Grok은 보지 못했다.

정한 것(메인테이너: 둘 다): 안내를 #root 밖의 보이지 않는 글(visually-hidden)로 남기고, 도움말 메뉴에
"AI에게 그려 달라고 하기"를 더한다.

Grok의 답 원문은 answer.txt.
