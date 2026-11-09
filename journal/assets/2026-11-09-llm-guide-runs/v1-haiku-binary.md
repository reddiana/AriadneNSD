이진 탐색(binary search)을 NS 차트로 그렸습니다. 아래 링크를 열면 편집기에서 보기 모드로 열립니다. 편집하려면 Edit을 누르면 됩니다.

https://ariadnensd.com/#ns1.u.%7B%22name%22:%22binary-search.ns.svg%22,%22model%22:%7B%22format%22:%22ariadne-nsd%22,%22version%22:1,%22settings%22:%7B%22textKind%22:%22plain%22,%22theme%22:%22default%22,%22headStyle%22:%22title%22,%22locale%22:%22ko%22%7D,%22diagrams%22:%5B%7B%22id%22:%22d1%22,%22head%22:%7B%22kind%22:%22method%22,%22text%22:%22binarySearch%28a,%20n,%20x%29%22%7D,%22body%22:%5B%7B%22id%22:%22b1%22,%22kind%22:%22process%22,%22text%22:%22lo%20=%200%22%7D,%7B%22id%22:%22b2%22,%22kind%22:%22process%22,%22text%22:%22hi%20=%20n%20-%201%22%7D,%7B%22id%22:%22b3%22,%22kind%22:%22process%22,%22text%22:%22result%20=%20-1%22%7D,%7B%22id%22:%22b4%22,%22kind%22:%22while%22,%22text%22:%22lo%20%3C=%20hi%20and%20result%20==%20-1%22,%22body%22:%5B%7B%22id%22:%22b5%22,%22kind%22:%22process%22,%22text%22:%22mid%20=%20%28lo%20+%20hi%29%20/%202%22%7D,%7B%22id%22:%22b6%22,%22kind%22:%22if%22,%22text%22:%22a%5Bmid%5D%20==%20x%22,%22yes%22:%7B%22id%22:%22r1%22,%22body%22:%5B%7B%22id%22:%22b7%22,%22kind%22:%22process%22,%22text%22:%22result%20=%20mid%22%7D%5D%7D,%22no%22:%7B%22id%22:%22r2%22,%22body%22:%5B%7B%22id%22:%22b8%22,%22kind%22:%22if%22,%22text%22:%22a%5Bmid%5D%20%3C%20x%22,%22yes%22:%7B%22id%22:%22r3%22,%22body%22:%5B%7B%22id%22:%22b9%22,%22kind%22:%22process%22,%22text%22:%22lo%20=%20mid%20+%201%22%7D%5D%7D,%22no%22:%7B%22id%22:%22r4%22,%22body%22:%5B%7B%22id%22:%22b10%22,%22kind%22:%22process%22,%22text%22:%22hi%20=%20mid%20-%201%22%7D%5D%7D%7D%5D%7D%7D%5D%7D,%7B%22id%22:%22b11%22,%22kind%22:%22process%22,%22text%22:%22return%20result%22%7D%5D%7D%5D,%22view%22:%7B%22folded%22:%5B%5D,%22opened%22:%5B%5D,%22bands%22:true,%22resultSymbol%22:%22←%22%7D%7D%7D

모델 JSON(링크가 잘리면 이것을 편집기에 붙여 넣으면 됩니다):

```json
{
  "format": "ariadne-nsd",
  "version": 1,
  "settings": { "textKind": "plain", "theme": "default", "headStyle": "title", "locale": "ko" },
  "diagrams": [
    {
      "id": "d1",
      "head": { "kind": "method", "text": "binarySearch(a, n, x)" },
      "body": [
        { "id": "b1", "kind": "process", "text": "lo = 0" },
        { "id": "b2", "kind": "process", "text": "hi = n - 1" },
        { "id": "b3", "kind": "process", "text": "result = -1" },
        {
          "id": "b4", "kind": "while", "text": "lo <= hi and result == -1",
          "body": [
            { "id": "b5", "kind": "process", "text": "mid = (lo + hi) / 2" },
            {
              "id": "b6", "kind": "if", "text": "a[mid] == x",
              "yes": { "id": "r1", "body": [ { "id": "b7", "kind": "process", "text": "result = mid" } ] },
              "no": {
                "id": "r2",
                "body": [
                  {
                    "id": "b8", "kind": "if", "text": "a[mid] < x",
                    "yes": { "id": "r3", "body": [ { "id": "b9", "kind": "process", "text": "lo = mid + 1" } ] },
                    "no": { "id": "r4", "body": [ { "id": "b10", "kind": "process", "text": "hi = mid - 1" } ] }
                  }
                ]
              }
            }
          ]
        },
        { "id": "b11", "kind": "process", "text": "return result" }
      ]
    }
  ],
  "view": { "folded": [], "opened": [], "bands": true, "resultSymbol": "←" }
}
```

참고: 이 링크는 사람이 손으로 퍼센트 인코딩했고, 코드를 실행해 검증하지는 않았습니다. 링크가 열리지 않으면 위 모델 JSON을 편집기의 열기 기능에 맞는 `.ns.svg` 파일로 저장해 열어 보세요.
