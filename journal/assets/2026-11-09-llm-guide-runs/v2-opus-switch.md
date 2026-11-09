switch 문(Case 블록)으로 연산자를 나누고, 나눗셈 칸 안에서 0으로 나누는 경우를 If로 처리한 계산기 NS 차트입니다.

👉 [계산기 NS 차트 열기](https://ariadnensd.com/#ns1.u.%7B%22name%22%3A%22계산기.ns.svg%22%2C%22model%22%3A%7B%22format%22%3A%22ariadne-nsd%22%2C%22version%22%3A1%2C%22settings%22%3A%7B%22textKind%22%3A%22plain%22%2C%22theme%22%3A%22default%22%2C%22headStyle%22%3A%22title%22%2C%22locale%22%3A%22ko%22%7D%2C%22diagrams%22%3A%5B%7B%22id%22%3A%22d1%22%2C%22head%22%3A%7B%22kind%22%3A%22method%22%2C%22text%22%3A%22calc%28a%2C%20op%2C%20b%29%22%7D%2C%22body%22%3A%5B%7B%22id%22%3A%22b1%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22입력%20a%2C%20op%2C%20b%22%7D%2C%7B%22id%22%3A%22b2%22%2C%22kind%22%3A%22case%22%2C%22text%22%3A%22op%22%2C%22arms%22%3A%5B%7B%22id%22%3A%22r1%22%2C%22label%22%3A%22'%2B'%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b3%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22출력%20a%20%2B%20b%22%7D%5D%7D%2C%7B%22id%22%3A%22r2%22%2C%22label%22%3A%22'-'%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b4%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22출력%20a%20-%20b%22%7D%5D%7D%2C%7B%22id%22%3A%22r3%22%2C%22label%22%3A%22'*'%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b5%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22출력%20a%20*%20b%22%7D%5D%7D%2C%7B%22id%22%3A%22r4%22%2C%22label%22%3A%22'%2F'%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b6%22%2C%22kind%22%3A%22if%22%2C%22text%22%3A%22b%20%3D%3D%200%22%2C%22yes%22%3A%7B%22id%22%3A%22r5%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b7%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22오류%20출력%3A%200으로%20나눌%20수%20없음%22%7D%5D%7D%2C%22no%22%3A%7B%22id%22%3A%22r6%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b8%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22출력%20a%20%2F%20b%22%7D%5D%7D%7D%5D%7D%5D%2C%22otherwise%22%3A%7B%22id%22%3A%22r7%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b9%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22오류%20출력%3A%20알%20수%20없는%20연산자%22%7D%5D%7D%7D%5D%7D%5D%2C%22view%22%3A%7B%22folded%22%3A%5B%5D%2C%22opened%22%3A%5B%5D%2C%22bands%22%3Atrue%2C%22resultSymbol%22%3A%22%E2%86%90%22%7D%7D%7D)

구성:

- `calc(a, op, b)`: a, op, b를 입력받음
- `switch (op)`
  - `'+'` → a + b 출력
  - `'-'` → a - b 출력
  - `'*'` → a * b 출력
  - `'/'` → `b == 0`이면 "0으로 나눌 수 없음" 오류 출력, 아니면 a / b 출력
  - default → "알 수 없는 연산자" 오류 출력

링크가 잘리면 아래 모델 JSON으로 고칠 수 있습니다.

```json
{"format":"ariadne-nsd","version":1,"settings":{"textKind":"plain","theme":"default","headStyle":"title","locale":"ko"},"diagrams":[{"id":"d1","head":{"kind":"method","text":"calc(a, op, b)"},"body":[{"id":"b1","kind":"process","text":"입력 a, op, b"},{"id":"b2","kind":"case","text":"op","arms":[{"id":"r1","label":"'+'","body":[{"id":"b3","kind":"process","text":"출력 a + b"}]},{"id":"r2","label":"'-'","body":[{"id":"b4","kind":"process","text":"출력 a - b"}]},{"id":"r3","label":"'*'","body":[{"id":"b5","kind":"process","text":"출력 a * b"}]},{"id":"r4","label":"'/'","body":[{"id":"b6","kind":"if","text":"b == 0","yes":{"id":"r5","body":[{"id":"b7","kind":"process","text":"오류 출력: 0으로 나눌 수 없음"}]},"no":{"id":"r6","body":[{"id":"b8","kind":"process","text":"출력 a / b"}]}}]}],"otherwise":{"id":"r7","body":[{"id":"b9","kind":"process","text":"오류 출력: 알 수 없는 연산자"}]}}]}],"view":{"folded":[],"opened":[],"bands":true,"resultSymbol":"←"}}
```

링크를 누르면 보기 모드로 열리고, **편집하기** 버튼을 누르면 고칠 수 있습니다. 고친 뒤 **파일 › 공유 링크 복사**로 새 링크를 만들어 보관·공유하거나 저에게 다시 붙여 주시면 이어서 고쳐 드리고, **파일 › 저장**으로 파일로 남길 수도 있습니다.
