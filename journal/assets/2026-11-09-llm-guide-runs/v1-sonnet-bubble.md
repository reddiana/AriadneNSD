버블 정렬을 AriadneNSD(NS 차트 편집기)로 그렸습니다. 아래 링크를 열면 편집기에서 바로 다이어그램이 보입니다. 제가 편집기를 직접 조작할 수는 없어서, 다이어그램 전체를 링크 안에 담았습니다.

https://ariadnensd.com/#ns1.u.%7B%22name%22%3A%22bubble-sort.ns.svg%22%2C%22model%22%3A%7B%22format%22%3A%22ariadne-nsd%22%2C%22version%22%3A1%2C%22settings%22%3A%7B%22textKind%22%3A%22plain%22%2C%22theme%22%3A%22default%22%2C%22headStyle%22%3A%22title%22%2C%22locale%22%3A%22ko%22%7D%2C%22diagrams%22%3A%5B%7B%22id%22%3A%22d1%22%2C%22head%22%3A%7B%22kind%22%3A%22method%22%2C%22text%22%3A%22bubbleSort%28a%2C%20n%29%22%7D%2C%22body%22%3A%5B%7B%22id%22%3A%22b1%22%2C%22kind%22%3A%22doWhile%22%2C%22text%22%3A%22while%20swapped%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b2%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22swapped%20%3D%20false%22%7D%2C%7B%22id%22%3A%22b3%22%2C%22kind%22%3A%22for%22%2C%22text%22%3A%22for%20i%20%3D%200%20to%20n%20-%202%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b4%22%2C%22kind%22%3A%22if%22%2C%22text%22%3A%22a%5Bi%5D%20%3E%20a%5Bi%20%2B%201%5D%22%2C%22yes%22%3A%7B%22id%22%3A%22r1%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b5%22%2C%22kind%22%3A%22call%22%2C%22target%22%3A%7B%22kind%22%3A%22named%22%2C%22name%22%3A%22swap%22%7D%2C%22args%22%3A%22a%5Bi%5D%2C%20a%5Bi%20%2B%201%5D%22%2C%22result%22%3A%22%22%7D%2C%7B%22id%22%3A%22b6%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22swapped%20%3D%20true%22%7D%5D%7D%2C%22no%22%3A%7B%22id%22%3A%22r2%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b7%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22%22%7D%5D%7D%7D%5D%7D%5D%7D%5D%7D%5D%2C%22view%22%3A%7B%22folded%22%3A%5B%5D%2C%22opened%22%3A%5B%5D%2C%22bands%22%3Atrue%2C%22resultSymbol%22%3A%22%E2%86%90%22%7D%7D%7D

링크는 보기 모드로 열립니다. 고치려면 Edit를 누르고, 파일로 저장하려면 편집기에서 저장하세요.

## 다이어그램의 구조

- 머리: `bubbleSort(a, n)`
- Do-While (`while swapped`): 본문을 먼저 실행하고 마지막에 검사합니다.
  - `swapped = false`
  - For (`for i = 0 to n - 2`)
    - If (`a[i] > a[i + 1]`)
      - True: `swap(a[i], a[i + 1])` 호출, 그다음 `swapped = true`
      - False: 비어 있음

한 바퀴 도는 동안 자리를 바꾼 적이 없으면 정렬이 끝난 것이므로 반복을 멈춥니다.

## 모델 JSON

링크가 잘렸을 때 고칠 수 있도록 JSON도 함께 드립니다.

```json
{"format":"ariadne-nsd","version":1,"settings":{"textKind":"plain","theme":"default","headStyle":"title","locale":"ko"},"diagrams":[{"id":"d1","head":{"kind":"method","text":"bubbleSort(a, n)"},"body":[{"id":"b1","kind":"doWhile","text":"while swapped","body":[{"id":"b2","kind":"process","text":"swapped = false"},{"id":"b3","kind":"for","text":"for i = 0 to n - 2","body":[{"id":"b4","kind":"if","text":"a[i] > a[i + 1]","yes":{"id":"r1","body":[{"id":"b5","kind":"call","target":{"kind":"named","name":"swap"},"args":"a[i], a[i + 1]","result":""},{"id":"b6","kind":"process","text":"swapped = true"}]},"no":{"id":"r2","body":[{"id":"b7","kind":"process","text":""}]}}]}]}]}],"view":{"folded":[],"opened":[],"bands":true,"resultSymbol":"←"}}
```

링크는 손으로 인코딩해서 만들었습니다. 열리지 않으면 위 JSON을 `{"name":"bubble-sort.ns.svg","model":<JSON>}` 형태로 감싸서 `https://ariadnensd.com/#ns1.u.` 뒤에 붙여 쓰세요.
