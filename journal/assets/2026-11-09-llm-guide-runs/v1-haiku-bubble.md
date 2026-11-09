버블 정렬을 AriadneNSD 다이어그램으로 그렸습니다. 아래 링크를 열면 편집기에 그림이 나옵니다(보기 모드이고, Edit을 누르면 고칠 수 있습니다).

https://ariadnensd.com/#ns1.u.%7B%22name%22%3A%22bubble-sort.ns.svg%22%2C%22model%22%3A%7B%22format%22%3A%22ariadne-nsd%22%2C%22version%22%3A1%2C%22settings%22%3A%7B%22textKind%22%3A%22plain%22%2C%22theme%22%3A%22default%22%2C%22headStyle%22%3A%22title%22%2C%22locale%22%3A%22ko%22%7D%2C%22diagrams%22%3A%5B%7B%22id%22%3A%22d1%22%2C%22head%22%3A%7B%22kind%22%3A%22method%22%2C%22text%22%3A%22bubbleSort%28a%2C%20n%29%22%7D%2C%22body%22%3A%5B%7B%22id%22%3A%22b1%22%2C%22kind%22%3A%22for%22%2C%22text%22%3A%22for%20i%20%3D%200%20to%20n%20-%202%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b2%22%2C%22kind%22%3A%22for%22%2C%22text%22%3A%22for%20j%20%3D%200%20to%20n%20-%202%20-%20i%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b3%22%2C%22kind%22%3A%22if%22%2C%22text%22%3A%22a%5Bj%5D%20%3E%20a%5Bj%2B1%5D%22%2C%22yes%22%3A%7B%22id%22%3A%22r1%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b4%22%2C%22kind%22%3A%22call%22%2C%22target%22%3A%7B%22kind%22%3A%22named%22%2C%22name%22%3A%22swap%22%7D%2C%22args%22%3A%22a%5Bj%5D%2C%20a%5Bj%2B1%5D%22%2C%22result%22%3A%22%22%7D%5D%7D%2C%22no%22%3A%7B%22id%22%3A%22r2%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b5%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22%22%7D%5D%7D%7D%5D%7D%5D%7D%2C%7B%22id%22%3A%22b6%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22return%20a%22%7D%5D%7D%5D%2C%22view%22%3A%7B%22folded%22%3A%5B%5D%2C%22opened%22%3A%5B%5D%2C%22bands%22%3Atrue%2C%22resultSymbol%22%3A%22%E2%86%90%22%7D%7D%7D

링크가 잘리면 아래 모델 JSON을 편집기에서 직접 붙여 넣으면 됩니다.

```json
{
  "format": "ariadne-nsd",
  "version": 1,
  "settings": { "textKind": "plain", "theme": "default", "headStyle": "title", "locale": "ko" },
  "diagrams": [
    {
      "id": "d1",
      "head": { "kind": "method", "text": "bubbleSort(a, n)" },
      "body": [
        {
          "id": "b1", "kind": "for", "text": "for i = 0 to n - 2",
          "body": [
            {
              "id": "b2", "kind": "for", "text": "for j = 0 to n - 2 - i",
              "body": [
                {
                  "id": "b3", "kind": "if", "text": "a[j] > a[j+1]",
                  "yes": { "id": "r1", "body": [
                    { "id": "b4", "kind": "call", "target": { "kind": "named", "name": "swap" }, "args": "a[j], a[j+1]", "result": "" }
                  ] },
                  "no": { "id": "r2", "body": [
                    { "id": "b5", "kind": "process", "text": "" }
                  ] }
                }
              ]
            }
          ]
        },
        { "id": "b6", "kind": "process", "text": "return a" }
      ]
    }
  ],
  "view": { "folded": [], "opened": [], "bands": true, "resultSymbol": "←" }
}
```

그림의 구조는 이렇습니다.

- 바깥 `for i = 0 to n - 2` 안에 `for j = 0 to n - 2 - i`가 있습니다.
- 안쪽에서 `a[j] > a[j+1]`이면 `swap(a[j], a[j+1])`을 부르고, 아니면 아무것도 하지 않습니다.
- 두 루프가 끝나면 `return a`로 정렬된 배열을 돌려줍니다.

참고로 이 구현은 교환이 없었던 패스를 건너뛰는 `swapped` 최적화는 넣지 않았습니다. 필요하면 그 플래그를 추가한 그림으로 바꿔 드리겠습니다.
