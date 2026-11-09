버블 정렬을 NSD 그림으로 그렸습니다. 아래 링크를 누르면 앱에서 보기 모드로 열리고, 편집하기 버튼을 누르면 고칠 수 있습니다.

[버블 정렬 NSD 그림 열기](https://ariadnensd.com/#ns1.u.%7B%22name%22:%22버블정렬.ns.svg%22,%22model%22:%7B%22format%22:%22ariadne-nsd%22,%22version%22:1,%22settings%22:%7B%22textKind%22:%22plain%22,%22theme%22:%22default%22,%22headStyle%22:%22title%22,%22locale%22:%22ko%22%7D,%22diagrams%22:%5B%7B%22id%22:%22d1%22,%22head%22:%7B%22kind%22:%22method%22,%22text%22:%22bubbleSort%28a,%20n%29%22%7D,%22body%22:%5B%7B%22id%22:%22b1%22,%22kind%22:%22for%22,%22text%22:%22i%20=%200%20to%20n%20-%202%22,%22body%22:%5B%7B%22id%22:%22b2%22,%22kind%22:%22for%22,%22text%22:%22j%20=%200%20to%20n%20-%20i%20-%202%22,%22body%22:%5B%7B%22id%22:%22b3%22,%22kind%22:%22if%22,%22text%22:%22a%5Bj%5D%20%3E%20a%5Bj+1%5D%22,%22yes%22:%7B%22id%22:%22r1%22,%22body%22:%5B%7B%22id%22:%22b4%22,%22kind%22:%22process%22,%22text%22:%22tmp%20=%20a%5Bj%5D%22%7D,%7B%22id%22:%22b5%22,%22kind%22:%22process%22,%22text%22:%22a%5Bj%5D%20=%20a%5Bj+1%5D%22%7D,%7B%22id%22:%22b6%22,%22kind%22:%22process%22,%22text%22:%22a%5Bj+1%5D%20=%20tmp%22%7D%5D%7D,%22no%22:%7B%22id%22:%22r2%22,%22body%22:%5B%7B%22id%22:%22b7%22,%22kind%22:%22process%22,%22text%22:%22%22%7D%5D%7D%7D%5D%7D%5D%7D%5D%7D,%7B%22id%22:%22b8%22,%22kind%22:%22process%22,%22text%22:%22return%20a%22%7D%5D%7D%5D,%22view%22:%7B%22folded%22:%5B%5D,%22opened%22:%5B%5D,%22bands%22:true,%22resultSymbol%22:%22←%22%7D%7D%7D)

링크가 잘리면 아래 모델 JSON을 사용해 주세요. 봉투는 `{"name":"버블정렬.ns.svg","model":...}` 형태입니다.

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
        { "id": "b1", "kind": "for", "text": "i = 0 to n - 2", "body": [
          { "id": "b2", "kind": "for", "text": "j = 0 to n - i - 2", "body": [
            { "id": "b3", "kind": "if", "text": "a[j] > a[j+1]",
              "yes": { "id": "r1", "body": [
                { "id": "b4", "kind": "process", "text": "tmp = a[j]" },
                { "id": "b5", "kind": "process", "text": "a[j] = a[j+1]" },
                { "id": "b6", "kind": "process", "text": "a[j+1] = tmp" }
              ] },
              "no": { "id": "r2", "body": [ { "id": "b7", "kind": "process", "text": "" } ] } }
          ] }
        ] },
        { "id": "b8", "kind": "process", "text": "return a" }
      ]
    }
  ],
  "view": { "folded": [], "opened": [], "bands": true, "resultSymbol": "←" }
}
```

알고리즘은 바깥 반복문(i)이 n - 1번 돌고, 안쪽 반복문(j)이 이미 정렬된 뒤쪽 구간을 뺀 나머지를 이웃끼리 비교해 순서가 거꾸로면 교환합니다. 교환은 임시 변수 tmp로 합니다.

고친 뒤에는 파일 › 공유 링크 복사로 새 링크를 만들어 보내 주세요. 파일 › 저장으로 파일로도 보관할 수 있습니다.
