버블 정렬을 NS 차트로 그렸습니다. 아래 링크를 누르면 AriadneNSD에서 열립니다(보기 모드이고, 고치려면 Edit를 누르세요).

[버블 정렬 NSD 열기](https://ariadnensd.com/#ns1.u.%7B%22name%22%3A%22bubble-sort.ns.svg%22%2C%22model%22%3A%7B%22format%22%3A%22ariadne-nsd%22%2C%22version%22%3A1%2C%22settings%22%3A%7B%22textKind%22%3A%22plain%22%2C%22theme%22%3A%22default%22%2C%22headStyle%22%3A%22title%22%2C%22locale%22%3A%22ko%22%7D%2C%22diagrams%22%3A%5B%7B%22id%22%3A%22d1%22%2C%22head%22%3A%7B%22kind%22%3A%22method%22%2C%22text%22%3A%22bubbleSort%28a%2C%20n%29%22%7D%2C%22body%22%3A%5B%7B%22id%22%3A%22b1%22%2C%22kind%22%3A%22for%22%2C%22text%22%3A%22for%20i%20%3D%200%20to%20n%20-%202%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b2%22%2C%22kind%22%3A%22for%22%2C%22text%22%3A%22for%20j%20%3D%200%20to%20n%20-%20i%20-%202%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b3%22%2C%22kind%22%3A%22if%22%2C%22text%22%3A%22a%5Bj%5D%20%3E%20a%5Bj%20%2B%201%5D%22%2C%22yes%22%3A%7B%22id%22%3A%22r1%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b4%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22tmp%20%3D%20a%5Bj%5D%22%7D%2C%7B%22id%22%3A%22b5%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22a%5Bj%5D%20%3D%20a%5Bj%20%2B%201%5D%22%7D%2C%7B%22id%22%3A%22b6%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22a%5Bj%20%2B%201%5D%20%3D%20tmp%22%7D%5D%7D%2C%22no%22%3A%7B%22id%22%3A%22r2%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b7%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22%22%7D%5D%7D%7D%5D%7D%5D%7D%5D%7D%5D%2C%22view%22%3A%7B%22folded%22%3A%5B%5D%2C%22opened%22%3A%5B%5D%2C%22bands%22%3Atrue%2C%22resultSymbol%22%3A%22%E2%86%90%22%7D%7D%7D)

구조는 다음과 같습니다.

- 바깥 반복문: `for i = 0 to n - 2`
- 안쪽 반복문: `for j = 0 to n - i - 2`
- 조건: `a[j] > a[j + 1]`이면 `tmp`를 써서 두 값을 교환하고, 아니면 아무것도 하지 않습니다.

링크가 잘릴 때를 대비해 모델 JSON도 함께 드립니다.

```json
{"format":"ariadne-nsd","version":1,"settings":{"textKind":"plain","theme":"default","headStyle":"title","locale":"ko"},"diagrams":[{"id":"d1","head":{"kind":"method","text":"bubbleSort(a, n)"},"body":[{"id":"b1","kind":"for","text":"for i = 0 to n - 2","body":[{"id":"b2","kind":"for","text":"for j = 0 to n - i - 2","body":[{"id":"b3","kind":"if","text":"a[j] > a[j + 1]","yes":{"id":"r1","body":[{"id":"b4","kind":"process","text":"tmp = a[j]"},{"id":"b5","kind":"process","text":"a[j] = a[j + 1]"},{"id":"b6","kind":"process","text":"a[j + 1] = tmp"}]},"no":{"id":"r2","body":[{"id":"b7","kind":"process","text":""}]}}]}]}]}],"view":{"folded":[],"opened":[],"bands":true,"resultSymbol":"←"}}
```
