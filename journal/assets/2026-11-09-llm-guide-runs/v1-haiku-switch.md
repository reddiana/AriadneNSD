# switch 계산기 NS 차트

`calc(a, b, op)` 함수 하나로, `op`에 따라 `switch`(Case 블록)로 사칙연산을 나눴습니다. `/` 분기에서는 `b = 0`인지 If 블록으로 먼저 확인해 0으로 나누기를 막습니다. `op`가 네 가지 중 어느 것도 아니면 `otherwise` 분기에서 오류를 냅니다.

**링크:**

https://ariadnensd.com/#ns1.u.%7B%22name%22:%22calc.ns.svg%22,%22model%22:%7B%22format%22:%22ariadne-nsd%22,%22version%22:1,%22settings%22:%7B%22textKind%22:%22plain%22,%22theme%22:%22default%22,%22headStyle%22:%22title%22,%22locale%22:%22en%22%7D,%22diagrams%22:%5B%7B%22id%22:%22d1%22,%22head%22:%7B%22kind%22:%22method%22,%22text%22:%22calc%28a,%20b,%20op%29%22%7D,%22body%22:%5B%7B%22id%22:%22b1%22,%22kind%22:%22process%22,%22text%22:%22read%20a,%20b,%20op%22%7D,%7B%22id%22:%22b2%22,%22kind%22:%22case%22,%22text%22:%22op%22,%22arms%22:%5B%7B%22id%22:%22r1%22,%22label%22:%22'+'%22,%22body%22:%5B%7B%22id%22:%22b3%22,%22kind%22:%22process%22,%22text%22:%22result%20=%20a%20+%20b%22%7D%5D%7D,%7B%22id%22:%22r2%22,%22label%22:%22'-'%22,%22body%22:%5B%7B%22id%22:%22b4%22,%22kind%22:%22process%22,%22text%22:%22result%20=%20a%20-%20b%22%7D%5D%7D,%7B%22id%22:%22r3%22,%22label%22:%22'*'%22,%22body%22:%5B%7B%22id%22:%22b5%22,%22kind%22:%22process%22,%22text%22:%22result%20=%20a%20*%20b%22%7D%5D%7D,%7B%22id%22:%22r4%22,%22label%22:%22'/'%22,%22body%22:%5B%7B%22id%22:%22b6%22,%22kind%22:%22if%22,%22text%22:%22b%20=%200%22,%22yes%22:%7B%22id%22:%22r5%22,%22body%22:%5B%7B%22id%22:%22b7%22,%22kind%22:%22process%22,%22text%22:%22error:%20division%20by%20zero%22%7D%5D%7D,%22no%22:%7B%22id%22:%22r6%22,%22body%22:%5B%7B%22id%22:%22b8%22,%22kind%22:%22process%22,%22text%22:%22result%20=%20a%20/%20b%22%7D%5D%7D%7D%5D%7D%5D,%22otherwise%22:%7B%22id%22:%22r7%22,%22body%22:%5B%7B%22id%22:%22b9%22,%22kind%22:%22process%22,%22text%22:%22error:%20unknown%20operator%22%7D%5D%7D%7D,%7B%22id%22:%22b10%22,%22kind%22:%22process%22,%22text%22:%22show%20result%20or%20error%22%7D%5D%7D%5D,%22view%22:%7B%22folded%22:%5B%5D,%22opened%22:%5B%5D,%22bands%22:true,%22resultSymbol%22:%22%E2%86%90%22%7D%7D%7D

링크는 보기 모드로 열립니다. 편집은 화면의 Edit을 누르면 됩니다.

링크가 잘리거나 열리지 않으면 아래 모델 JSON을 AriadneNSD에서 직접 만들면 됩니다.

```json
{
  "format": "ariadne-nsd",
  "version": 1,
  "settings": { "textKind": "plain", "theme": "default", "headStyle": "title", "locale": "en" },
  "diagrams": [
    {
      "id": "d1",
      "head": { "kind": "method", "text": "calc(a, b, op)" },
      "body": [
        { "id": "b1", "kind": "process", "text": "read a, b, op" },
        {
          "id": "b2", "kind": "case", "text": "op",
          "arms": [
            { "id": "r1", "label": "'+'", "body": [ { "id": "b3", "kind": "process", "text": "result = a + b" } ] },
            { "id": "r2", "label": "'-'", "body": [ { "id": "b4", "kind": "process", "text": "result = a - b" } ] },
            { "id": "r3", "label": "'*'", "body": [ { "id": "b5", "kind": "process", "text": "result = a * b" } ] },
            {
              "id": "r4", "label": "'/'", "body": [
                {
                  "id": "b6", "kind": "if", "text": "b = 0",
                  "yes": { "id": "r5", "body": [ { "id": "b7", "kind": "process", "text": "error: division by zero" } ] },
                  "no": { "id": "r6", "body": [ { "id": "b8", "kind": "process", "text": "result = a / b" } ] }
                }
              ]
            }
          ],
          "otherwise": { "id": "r7", "body": [ { "id": "b9", "kind": "process", "text": "error: unknown operator" } ] }
        },
        { "id": "b10", "kind": "process", "text": "show result or error" }
      ]
    }
  ],
  "view": { "folded": [], "opened": [], "bands": true, "resultSymbol": "←" }
}
```
