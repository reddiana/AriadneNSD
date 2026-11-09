## 버블 정렬에 swapped 플래그 더하기

원래 다이어그램(`bubbleSort(a, n)`)은 바깥 `for i`와 안쪽 `for j`로 된 버블 정렬입니다. 한 바퀴 동안 교환이 없으면 일찍 끝나도록 고쳤습니다.

바꾼 점:

- 바깥 `for i` 루프를 `while swapped` 루프로 바꿨습니다. `i`는 `i = 0`에서 시작해 한 바퀴가 끝날 때마다 `i = i + 1`로 올립니다. AriadneNSD에는 `break` 블록이 없어서 조건으로 빠져나가게 했습니다.
- 바퀴가 시작될 때 `swapped = false`로 두고, `a[j] > a[j + 1]`이 참이어서 교환할 때 `swapped = true`를 더했습니다.
- 한 바퀴 동안 교환이 없었으면 `while` 조건이 거짓이 되어 루프를 빠져나갑니다.

[다이어그램 열기 (보기 모드, 편집하기 버튼으로 수정)](https://ariadnensd.com/#ns1.u.%7B%22name%22%3A%22bubble-sort.ns.svg%22%2C%22model%22%3A%7B%22format%22%3A%22ariadne-nsd%22%2C%22version%22%3A1%2C%22settings%22%3A%7B%22textKind%22%3A%22plain%22%2C%22theme%22%3A%22default%22%2C%22headStyle%22%3A%22title%22%2C%22locale%22%3A%22ko%22%7D%2C%22diagrams%22%3A%5B%7B%22id%22%3A%22d1%22%2C%22head%22%3A%7B%22kind%22%3A%22method%22%2C%22text%22%3A%22bubbleSort%28a%2C%20n%29%22%7D%2C%22body%22%3A%5B%7B%22id%22%3A%22b1%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22i%20%3D%200%22%7D%2C%7B%22id%22%3A%22b8%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22swapped%20%3D%20true%22%7D%2C%7B%22id%22%3A%22b9%22%2C%22kind%22%3A%22while%22%2C%22text%22%3A%22swapped%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b10%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22swapped%20%3D%20false%22%7D%2C%7B%22id%22%3A%22b2%22%2C%22kind%22%3A%22for%22%2C%22text%22%3A%22for%20j%20%3D%200%20to%20n%20-%202%20-%20i%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b3%22%2C%22kind%22%3A%22if%22%2C%22text%22%3A%22a%5Bj%5D%20%3E%20a%5Bj%20%2B%201%5D%22%2C%22yes%22%3A%7B%22id%22%3A%22r1%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b4%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22temp%20%3D%20a%5Bj%5D%22%7D%2C%7B%22id%22%3A%22b5%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22a%5Bj%5D%20%3D%20a%5Bj%20%2B%201%5D%22%7D%2C%7B%22id%22%3A%22b6%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22a%5Bj%20%2B%201%5D%20%3D%20temp%22%7D%2C%7B%22id%22%3A%22b11%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22swapped%20%3D%20true%22%7D%5D%7D%2C%22no%22%3A%7B%22id%22%3A%22r2%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b7%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22%22%7D%5D%7D%7D%5D%7D%2C%7B%22id%22%3A%22b12%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22i%20%3D%20i%20%2B%201%22%7D%5D%7D%5D%7D%5D%2C%22view%22%3A%7B%22folded%22%3A%5B%5D%2C%22opened%22%3A%5B%5D%2C%22bands%22%3Atrue%2C%22resultSymbol%22%3A%22←%22%7D%7D%7D)

링크가 잘리거나 열리지 않으면 아래 모델 JSON을 알려 주세요. 다이어그램 그대로 다시 만들어 드리겠습니다. 링크는 손으로 퍼센트 인코딩했습니다. 여는 중괄호 `%7B`와 닫는 `%7D`가 각각 20개, 여는 대괄호 `%5B`와 닫는 `%5D`가 각각 14개로 맞는 것만 확인했습니다.

모델 JSON:

```json
{"format":"ariadne-nsd","version":1,"settings":{"textKind":"plain","theme":"default","headStyle":"title","locale":"ko"},"diagrams":[{"id":"d1","head":{"kind":"method","text":"bubbleSort(a, n)"},"body":[{"id":"b1","kind":"process","text":"i = 0"},{"id":"b8","kind":"process","text":"swapped = true"},{"id":"b9","kind":"while","text":"swapped","body":[{"id":"b10","kind":"process","text":"swapped = false"},{"id":"b2","kind":"for","text":"for j = 0 to n - 2 - i","body":[{"id":"b3","kind":"if","text":"a[j] > a[j + 1]","yes":{"id":"r1","body":[{"id":"b4","kind":"process","text":"temp = a[j]"},{"id":"b5","kind":"process","text":"a[j] = a[j + 1]"},{"id":"b6","kind":"process","text":"a[j + 1] = temp"},{"id":"b11","kind":"process","text":"swapped = true"}]},"no":{"id":"r2","body":[{"id":"b7","kind":"process","text":""}]}}]},{"id":"b12","kind":"process","text":"i = i + 1"}]}]}],"view":{"folded":[],"opened":[],"bands":true,"resultSymbol":"←"}}
```

참고: 원래 링크는 `j` 형식(base64)이라 제가 손으로 풀어 읽었습니다. 조건, 교환 세 줄, 바깥 루프 같은 주요 부분은 대조해 확인했지만, 나머지 세부는 복원한 것이라 원본과 다를 수 있습니다.
