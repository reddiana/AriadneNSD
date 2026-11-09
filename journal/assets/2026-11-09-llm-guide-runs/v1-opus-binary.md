이진 탐색(정렬된 배열 `a`에서 `key`를 찾아 그 위치를, 없으면 -1을 돌려줌)을 NS 차트로 그렸습니다.

**링크 (누르면 AriadneNSD에서 바로 열립니다):**

https://ariadnensd.com/#ns1.u.%7B%22name%22:%22binary-search.ns.svg%22,%22model%22:%7B%22format%22:%22ariadne-nsd%22,%22version%22:1,%22settings%22:%7B%22textKind%22:%22plain%22,%22theme%22:%22default%22,%22headStyle%22:%22title%22,%22locale%22:%22ko%22%7D,%22diagrams%22:%5B%7B%22id%22:%22d1%22,%22head%22:%7B%22kind%22:%22method%22,%22text%22:%22binarySearch%28a,%20n,%20key%29%22%7D,%22body%22:%5B%7B%22id%22:%22b1%22,%22kind%22:%22process%22,%22text%22:%22low%20=%200%5Cnhigh%20=%20n%20-%201%22%7D,%7B%22id%22:%22b2%22,%22kind%22:%22while%22,%22text%22:%22low%20%3C=%20high%22,%22body%22:%5B%7B%22id%22:%22b3%22,%22kind%22:%22process%22,%22text%22:%22mid%20=%20%28low%20+%20high%29%20/%202%22%7D,%7B%22id%22:%22b4%22,%22kind%22:%22if%22,%22text%22:%22a%5Bmid%5D%20==%20key%22,%22yes%22:%7B%22id%22:%22r1%22,%22body%22:%5B%7B%22id%22:%22b5%22,%22kind%22:%22process%22,%22text%22:%22return%20mid%22%7D%5D%7D,%22no%22:%7B%22id%22:%22r2%22,%22body%22:%5B%7B%22id%22:%22b6%22,%22kind%22:%22if%22,%22text%22:%22a%5Bmid%5D%20%3C%20key%22,%22yes%22:%7B%22id%22:%22r3%22,%22body%22:%5B%7B%22id%22:%22b7%22,%22kind%22:%22process%22,%22text%22:%22low%20=%20mid%20+%201%22%7D%5D%7D,%22no%22:%7B%22id%22:%22r4%22,%22body%22:%5B%7B%22id%22:%22b8%22,%22kind%22:%22process%22,%22text%22:%22high%20=%20mid%20-%201%22%7D%5D%7D%7D%5D%7D%7D%5D%7D,%7B%22id%22:%22b9%22,%22kind%22:%22process%22,%22text%22:%22return%20-1%22%7D%5D%7D%5D,%22view%22:%7B%22folded%22:%5B%5D,%22opened%22:%5B%5D,%22bands%22:true,%22resultSymbol%22:%22←%22%7D%7D%7D

링크는 보기 모드로 열립니다. 고치려면 **편집**을 누르고, 거기서 파일로 저장할 수 있습니다.

**차트의 구조:**

- `low = 0`, `high = n - 1`
- 반복 `low <= high` 동안
  - `mid = (low + high) / 2`
  - 만약 `a[mid] == key` → `return mid`
  - 아니면, 만약 `a[mid] < key` → `low = mid + 1`, 아니면 `high = mid - 1`
- `return -1`

**모델 JSON** (링크가 잘리면 이것으로 고칠 수 있습니다):

```json
{"format":"ariadne-nsd","version":1,"settings":{"textKind":"plain","theme":"default","headStyle":"title","locale":"ko"},"diagrams":[{"id":"d1","head":{"kind":"method","text":"binarySearch(a, n, key)"},"body":[{"id":"b1","kind":"process","text":"low = 0\nhigh = n - 1"},{"id":"b2","kind":"while","text":"low <= high","body":[{"id":"b3","kind":"process","text":"mid = (low + high) / 2"},{"id":"b4","kind":"if","text":"a[mid] == key","yes":{"id":"r1","body":[{"id":"b5","kind":"process","text":"return mid"}]},"no":{"id":"r2","body":[{"id":"b6","kind":"if","text":"a[mid] < key","yes":{"id":"r3","body":[{"id":"b7","kind":"process","text":"low = mid + 1"}]},"no":{"id":"r4","body":[{"id":"b8","kind":"process","text":"high = mid - 1"}]}}]}}]},{"id":"b9","kind":"process","text":"return -1"}]}],"view":{"folded":[],"opened":[],"bands":true,"resultSymbol":"←"}}
```

`mid`는 정수 나눗셈(소수점 버림)으로 생각하시면 됩니다.
