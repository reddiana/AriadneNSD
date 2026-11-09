공유 링크를 읽어 보니 바깥 `for i` 반복 안에 `for j` 반복이 있고, 그 안에서 `a[j] > a[j + 1]`이면 세 줄로 맞바꾸는 버블 정렬이었습니다. NSD에는 `break`가 없어서, 바깥 반복을 "검사를 끝에서 하는 반복(Do-While)"으로 바꾸고 `swapped` 플래그를 더했습니다.

바꾼 내용:

- 바깥 반복 `for i = 0 to n - 2`를 `while swapped`(Do-While)로 바꿨습니다.
- 반복의 맨 앞에 `swapped = false`를 넣었습니다. 한 바퀴를 시작할 때마다 초기화하므로 따로 처음 값을 줄 필요가 없습니다.
- 맞바꾼 직후(`a[j + 1] = temp` 다음)에 `swapped = true`를 넣었습니다.
- 바깥 반복에서 `i`가 없어졌으므로 안쪽 반복은 `for j = 0 to n - 2`로 바꿨습니다. 이전의 `n - 2 - i`처럼 한 바퀴마다 범위를 줄이는 것은 빠집니다. 줄이는 것까지 원하면 `i` 카운터를 따로 두는 식으로 다시 고칠 수 있으니 말씀해 주세요.

고친 다이어그램의 링크입니다.

[고친 버블 정렬 열기](https://ariadnensd.com/#ns1.u.%7B%22name%22:%22bubble-sort.ns.svg%22,%22model%22:%7B%22format%22:%22ariadne-nsd%22,%22version%22:1,%22settings%22:%7B%22textKind%22:%22plain%22,%22theme%22:%22default%22,%22headStyle%22:%22title%22,%22locale%22:%22ko%22%7D,%22diagrams%22:%5B%7B%22id%22:%22d1%22,%22head%22:%7B%22kind%22:%22method%22,%22text%22:%22bubbleSort%28a,%20n%29%22%7D,%22body%22:%5B%7B%22id%22:%22b1%22,%22kind%22:%22doWhile%22,%22text%22:%22while%20swapped%22,%22body%22:%5B%7B%22id%22:%22b8%22,%22kind%22:%22process%22,%22text%22:%22swapped%20=%20false%22%7D,%7B%22id%22:%22b2%22,%22kind%22:%22for%22,%22text%22:%22for%20j%20=%200%20to%20n%20-%202%22,%22body%22:%5B%7B%22id%22:%22b3%22,%22kind%22:%22if%22,%22text%22:%22a%5Bj%5D%20%3E%20a%5Bj%20+%201%5D%22,%22yes%22:%7B%22id%22:%22r1%22,%22body%22:%5B%7B%22id%22:%22b4%22,%22kind%22:%22process%22,%22text%22:%22temp%20=%20a%5Bj%5D%22%7D,%7B%22id%22:%22b5%22,%22kind%22:%22process%22,%22text%22:%22a%5Bj%5D%20=%20a%5Bj%20+%201%5D%22%7D,%7B%22id%22:%22b6%22,%22kind%22:%22process%22,%22text%22:%22a%5Bj%20+%201%5D%20=%20temp%22%7D,%7B%22id%22:%22b9%22,%22kind%22:%22process%22,%22text%22:%22swapped%20=%20true%22%7D%5D%7D,%22no%22:%7B%22id%22:%22r2%22,%22body%22:%5B%7B%22id%22:%22b7%22,%22kind%22:%22process%22,%22text%22:%22%22%7D%5D%7D%7D%5D%7D%5D%7D%5D%7D%5D,%22view%22:%7B%22folded%22:%5B%5D,%22opened%22:%5B%5D,%22bands%22:true,%22resultSymbol%22:%22←%22%7D%7D%7D)

링크가 잘리는 경우를 대비해 모델 JSON도 함께 드립니다.

```json
{"format":"ariadne-nsd","version":1,"settings":{"textKind":"plain","theme":"default","headStyle":"title","locale":"ko"},"diagrams":[{"id":"d1","head":{"kind":"method","text":"bubbleSort(a, n)"},"body":[{"id":"b1","kind":"doWhile","text":"while swapped","body":[{"id":"b8","kind":"process","text":"swapped = false"},{"id":"b2","kind":"for","text":"for j = 0 to n - 2","body":[{"id":"b3","kind":"if","text":"a[j] > a[j + 1]","yes":{"id":"r1","body":[{"id":"b4","kind":"process","text":"temp = a[j]"},{"id":"b5","kind":"process","text":"a[j] = a[j + 1]"},{"id":"b6","kind":"process","text":"a[j + 1] = temp"},{"id":"b9","kind":"process","text":"swapped = true"}]},"no":{"id":"r2","body":[{"id":"b7","kind":"process","text":""}]}}]}]}]}],"view":{"folded":[],"opened":[],"bands":true,"resultSymbol":"←"}}
```

링크는 보기 모드로 열리며, 편집하기(Edit) 버튼을 누르면 고칠 수 있습니다. 고친 뒤에는 파일 › 공유 링크 복사로 새 링크를 만들어 보관하거나 저에게 다시 붙여 넣어 더 고치게 할 수 있고, 파일 › 저장으로 파일로 남길 수도 있습니다.
