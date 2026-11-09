ChatGPT로 해 본 시험 (2026-11-10, 메인테이너)

/llms.txt와 첫 화면의 AI용 안내를 배포한 뒤(커밋 d2fc3a4), 메인테이너가 ChatGPT에게
"https://ariadnensd.com 으로 하노이탑 알고리즘을 nsd로 그려주세요"라고 했다.

1. ChatGPT는 안내서를 읽고 공유 링크를 주었다(11-09에는 "로딩 화면으로만 확인되어" 그리지 못했다).
2. 첫 링크는 열리지 않았다: 호출 블록에 text를 넣음.
   AriadneNSD could not open the share link (damaged): diagrams[0].body[0].no.body[0]: unknown key "text"
3. 메인테이너가 모달의 "까닭 복사"로 그 글을 붙이자, ChatGPT가 안내서를 다시 보고 target · args로 고쳐
   압축 링크(ns1.d)를 다시 주었다.
4. 고친 모델은 앱의 parseModel을 통과한다(envelope.json, 검사: journal/assets/2026-11-09-llm-guide-check.mjs --encode).

고친 것: 안내서 src/apps/web/guide/llms.txt의 Call 설명에 "call block has no text"와 재귀 호출을 더함.
덧붙임: ChatGPT의 첫 답에 웹 검색으로 찾은 다른 사이트의 그림 링크가 섞였다(우리와 무관).

ChatGPT의 답 원문은 answer.txt.
