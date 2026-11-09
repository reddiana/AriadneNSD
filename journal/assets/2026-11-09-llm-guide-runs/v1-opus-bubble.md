버블 정렬을 AriadneNSD의 NS 차트로 만들었습니다. 아래 링크를 열면 편집기에 차트가 바로 뜹니다. 링크 안에 차트가 다 들어 있어서 업로드나 로그인은 필요 없습니다.

**▶ [AriadneNSD에서 버블 정렬 열기](https://ariadnensd.com/#ns1.u.%7B%22name%22%3A%22bubble-sort.ns.svg%22%2C%22model%22%3A%7B%22format%22%3A%22ariadne-nsd%22%2C%22version%22%3A1%2C%22settings%22%3A%7B%22textKind%22%3A%22plain%22%2C%22theme%22%3A%22default%22%2C%22headStyle%22%3A%22title%22%2C%22locale%22%3A%22ko%22%7D%2C%22diagrams%22%3A%5B%7B%22id%22%3A%22d1%22%2C%22head%22%3A%7B%22kind%22%3A%22method%22%2C%22text%22%3A%22bubbleSort%28a%2C%20n%29%22%7D%2C%22body%22%3A%5B%7B%22id%22%3A%22b1%22%2C%22kind%22%3A%22for%22%2C%22text%22%3A%22for%20i%20%3D%200%20to%20n%20-%202%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b2%22%2C%22kind%22%3A%22for%22%2C%22text%22%3A%22for%20j%20%3D%200%20to%20n%20-%202%20-%20i%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b3%22%2C%22kind%22%3A%22if%22%2C%22text%22%3A%22a%5Bj%5D%20%3E%20a%5Bj%20%2B%201%5D%22%2C%22yes%22%3A%7B%22id%22%3A%22r1%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b4%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22temp%20%3D%20a%5Bj%5D%22%7D%2C%7B%22id%22%3A%22b5%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22a%5Bj%5D%20%3D%20a%5Bj%20%2B%201%5D%22%7D%2C%7B%22id%22%3A%22b6%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22a%5Bj%20%2B%201%5D%20%3D%20temp%22%7D%5D%7D%2C%22no%22%3A%7B%22id%22%3A%22r2%22%2C%22body%22%3A%5B%7B%22id%22%3A%22b7%22%2C%22kind%22%3A%22process%22%2C%22text%22%3A%22%22%7D%5D%7D%7D%5D%7D%5D%7D%5D%7D%5D%2C%22view%22%3A%7B%22folded%22%3A%5B%5D%2C%22opened%22%3A%5B%5D%2C%22bands%22%3Atrue%2C%22resultSymbol%22%3A%22%E2%86%90%22%7D%7D%7D)**

링크로 열면 보기 모드입니다. **편집**을 누르면 고칠 수 있고, 거기서 파일(`bubble-sort.ns.svg`)로 저장할 수 있습니다.

### 차트의 구성

- **머리**: `bubbleSort(a, n)`
- **바깥 반복**: `for i = 0 to n - 2` (패스 n − 1번)
  - **안쪽 반복**: `for j = 0 to n - 2 - i` (뒤쪽 i개는 이미 정렬된 자리라 건너뜀)
    - **조건**: `a[j] > a[j + 1]`
      - 참: `temp = a[j]` → `a[j] = a[j + 1]` → `a[j + 1] = temp` (두 값을 맞바꿈)
      - 거짓: 아무것도 하지 않음 (빈 칸)

### 모델 JSON

링크가 잘려서 열리지 않으면, 아래 JSON을 고쳐 쓰거나 다시 링크로 만들 수 있습니다.

```json
{"format":"ariadne-nsd","version":1,"settings":{"textKind":"plain","theme":"default","headStyle":"title","locale":"ko"},"diagrams":[{"id":"d1","head":{"kind":"method","text":"bubbleSort(a, n)"},"body":[{"id":"b1","kind":"for","text":"for i = 0 to n - 2","body":[{"id":"b2","kind":"for","text":"for j = 0 to n - 2 - i","body":[{"id":"b3","kind":"if","text":"a[j] > a[j + 1]","yes":{"id":"r1","body":[{"id":"b4","kind":"process","text":"temp = a[j]"},{"id":"b5","kind":"process","text":"a[j] = a[j + 1]"},{"id":"b6","kind":"process","text":"a[j + 1] = temp"}]},"no":{"id":"r2","body":[{"id":"b7","kind":"process","text":""}]}}]}]}]}],"view":{"folded":[],"opened":[],"bands":true,"resultSymbol":"←"}}
```

한 패스 동안 교환이 한 번도 없으면 일찍 끝내는 개선판(`swapped` 플래그와 Do-While 반복)이 필요하시면 말씀해 주세요. 그 버전으로도 그려 드리겠습니다.
