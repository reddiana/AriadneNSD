# 버블 정렬 NS 차트

버블 정렬을 NS 차트로 그렸습니다. 아래 링크를 누르면 보기 모드로 열리고, **편집하기** 버튼을 누르면 고칠 수 있습니다.

[버블 정렬 차트 열기](https://ariadnensd.com/#ns1.u.%7B%22name%22:%22버블정렬.ns.svg%22,%22model%22:%7B%22format%22:%22ariadne-nsd%22,%22version%22:1,%22settings%22:%7B%22textKind%22:%22plain%22,%22theme%22:%22default%22,%22headStyle%22:%22title%22,%22locale%22:%22ko%22%7D,%22diagrams%22:%5B%7B%22id%22:%22d1%22,%22head%22:%7B%22kind%22:%22method%22,%22text%22:%22bubbleSort%28a,%20n%29%22%7D,%22body%22:%5B%7B%22id%22:%22b1%22,%22kind%22:%22for%22,%22text%22:%22for%20i%20=%200%20to%20n%20-%202%22,%22body%22:%5B%7B%22id%22:%22b2%22,%22kind%22:%22for%22,%22text%22:%22for%20j%20=%200%20to%20n%20-%202%20-%20i%22,%22body%22:%5B%7B%22id%22:%22b3%22,%22kind%22:%22if%22,%22text%22:%22a%5Bj%5D%20%3E%20a%5Bj+1%5D%22,%22yes%22:%7B%22id%22:%22r1%22,%22body%22:%5B%7B%22id%22:%22b4%22,%22kind%22:%22process%22,%22text%22:%22swap%20a%5Bj%5D,%20a%5Bj+1%5D%22%7D%5D%7D,%22no%22:%7B%22id%22:%22r2%22,%22body%22:%5B%7B%22id%22:%22b5%22,%22kind%22:%22process%22,%22text%22:%22%22%7D%5D%7D%7D%7D%5D%7D%5D%7D%5D%7D%5D,%22view%22:%7B%22folded%22:%5B%5D,%22opened%22:%5B%5D,%22bands%22:true,%22resultSymbol%22:%22%E2%86%90%22%7D%7D%7D)

모델 JSON (링크가 잘리면 이 내용으로 다시 만들 수 있습니다):

```json
{"format":"ariadne-nsd","version":1,"settings":{"textKind":"plain","theme":"default","headStyle":"title","locale":"ko"},"diagrams":[{"id":"d1","head":{"kind":"method","text":"bubbleSort(a, n)"},"body":[{"id":"b1","kind":"for","text":"for i = 0 to n - 2","body":[{"id":"b2","kind":"for","text":"for j = 0 to n - 2 - i","body":[{"id":"b3","kind":"if","text":"a[j] > a[j+1]","yes":{"id":"r1","body":[{"id":"b4","kind":"process","text":"swap a[j], a[j+1]"}]},"no":{"id":"r2","body":[{"id":"b5","kind":"process","text":""}]}}]}]}]}],"view":{"folded":[],"opened":[],"bands":true,"resultSymbol":"←"}}
```

- 바깥 반복은 i = 0부터 n - 2까지, 안쪽 반복은 j = 0부터 n - 2 - i까지입니다.
- 이웃한 두 원소를 비교해 순서가 거꾸로면 자리를 바꿉니다. 바꾸지 않는 쪽은 빈 블록입니다.

링크를 열어 고친 뒤에는 **파일 › 공유 링크 복사**로 새 링크를 만들어 보관하거나 다시 붙여 넣어 주시면 됩니다. **파일 › 저장**으로 파일로 남길 수도 있습니다.
