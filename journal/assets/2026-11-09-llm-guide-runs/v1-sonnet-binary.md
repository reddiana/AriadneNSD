이진 탐색을 NS 차트로 그렸습니다. 아래 링크를 열면 AriadneNSD 편집기에서 바로 보입니다 (보기 모드이며, Edit을 누르면 고칠 수 있습니다).

https://ariadnensd.com/#ns1.u.%7B%22name%22%3A%22binary-search.ns.svg%22%2C%22model%22%3A%7B%22format%22%3A%22ariadne-nsd%22%2C%22version%22%3A1%2C%22settings%22%3A%7B%22textKind%22%3A%22plain%22%2C%22theme%22%3A%22default%22%2C%22headStyle%22%3A%22title%22%2C%22locale%22%3A%22en%22%7D%2C%22diagrams%22%3A%5B%7B%22id%22%3A%22d1%22%2C%22head%22%3A%7B%22kind%22%3A%22method%22%2C%22text%22%3A%22binarySearch%28a%2C%20n%2C%20key%29%22%7D%2C%22body%22%3A%5B%7B%22id%22%3A%22b1%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22low%20%3D%200%22%7D%2C%7B%22id%22%3A%22b2%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22high%20%3D%20n%20-%201%22%7D%2C%7B%22id%22%3A%22b3%22%2C%22kind%22%3A%22while%22%2C%22text%22%3A%22low%20%3C%3D%20high%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b4%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22mid%20%3D%20floor%28%28low%20%2B%20high%29%20/%202%29%22%7D%2C%7B%22id%22%3A%22b5%22%2C%22kind%22%3A%22if%22%2C%22text%22%3A%22a%5Bmid%5D%20%3D%3D%20key%22%2C%22yes%22%3A%7B%22id%22%3A%22r1%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b6%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22return%20mid%22%7D%5D%7D%2C%22no%22%3A%7B%22id%22%3A%22r2%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b7%22%2C%22kind%22%3A%22if%22%2C%22text%22%3A%22a%5Bmid%5D%20%3C%20key%22%2C%22yes%22%3A%7B%22id%22%3A%22r3%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b8%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22low%20%3D%20mid%20%2B%201%22%7D%5D%7D%2C%22no%22%3A%7B%22id%22%3A%22r4%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b9%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22high%20%3D%20mid%20-%201%22%7D%5D%7D%7D%5D%7D%7D%5D%7D%2C%7B%22id%22%3A%22b10%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22return%20-1%22%7D%5D%7D%5D%2C%22view%22%3A%7B%22folded%22%3A%5B%5D%2C%22opened%22%3A%5B%5D%2C%22bands%22%3Atrue%2C%22resultSymbol%22%3A%22%E2%86%90%22%7D%7D%7D

링크가 잘리거나 열리지 않을 때를 대비해 모델 JSON도 함께 드립니다.

```json
{"format":"ariadne-nsd","version":1,"settings":{"textKind":"plain","theme":"default","headStyle":"title","locale":"en"},"diagrams":[{"id":"d1","head":{"kind":"method","text":"binarySearch(a, n, key)"},"body":[{"id":"b1","kind":"process","text":"low = 0"},{"id":"b2","kind":"process","text":"high = n - 1"},{"id":"b3","kind":"while","text":"low <= high","body":[{"id":"b4","kind":"process","text":"mid = floor((low + high) / 2)"},{"id":"b5","kind":"if","text":"a[mid] == key","yes":{"id":"r1","body":[{"id":"b6","kind":"process","text":"return mid"}]},"no":{"id":"r2","body":[{"id":"b7","kind":"if","text":"a[mid] < key","yes":{"id":"r3","body":[{"id":"b8","kind":"process","text":"low = mid + 1"}]},"no":{"id":"r4","body":[{"id":"b9","kind":"process","text":"high = mid - 1"}]}}]}}]},{"id":"b10","kind":"process","text":"return -1"}]}],"view":{"folded":[],"opened":[],"bands":true,"resultSymbol":"←"}}
```

차트의 구성은 다음과 같습니다.

1. `low = 0`, `high = n - 1`로 탐색 범위를 정합니다.
2. `low <= high`인 동안 반복합니다 (While).
   - `mid = floor((low + high) / 2)`로 가운데를 구합니다.
   - `a[mid] == key`이면 `return mid`로 찾은 위치를 돌려줍니다.
   - 아니면서 `a[mid] < key`이면 `low = mid + 1`, 그렇지 않으면 `high = mid - 1`입니다.
3. 반복이 끝나도록 못 찾으면 `return -1`입니다.

참고로 이 링크는 손으로 퍼센트 인코딩을 했습니다. 혹시 열리지 않으면 위 JSON을 그대로 쓰시면 됩니다.
