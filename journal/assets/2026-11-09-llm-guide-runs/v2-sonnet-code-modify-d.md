버블 정렬을 고쳤습니다. 바깥쪽 `for i` 반복을 `while swapped`(Do-While) 반복으로 바꿨습니다. 한 바퀴를 시작할 때 `swapped = false`로 두고, 두 값을 맞바꿀 때마다 `swapped = true`로 표시합니다. 한 바퀴 동안 바꾼 것이 없으면 `swapped`가 false로 남아 반복이 끝납니다.

바깥 반복에서 `i`를 더는 쓰지 않으므로 안쪽 반복의 끝값은 `n - 2 - i`에서 `n - 2`로 바꿨습니다. 이미 제자리를 찾은 뒤쪽 원소까지 비교하지만 결과는 같습니다.

[고친 버블 정렬 열기](https://ariadnensd.com/#ns1.d.jZNNTsMwEIWvYs0KRFqR8h-pXIBlFyyqLpx60rh17Mh2W6IqW9ackZMwTgOuKIpQIjkez_feeOwcQPMKIYN8m-cKR85YP9Zu7HYrSKAyAhVkByiMrbinNG4lFxpH2gla36F10mjI0gQcei_1yoV0j2_-RWpBQK241JTqS-x8BBZ8qzxFSuRi5hsVol56GhNQZsm7wMZAm4CQfGV5RZrzA8ggJ9KeDDabo0WFvjShnGD7s5UZ7eSCJ0xfBqXciCaq5EGlp4V5LWVn3uP7MGVuz-sag-ov9DGitTVLdC6iPcSmrODKIRl_U5NIUS8jQRO2pvxr5g3TbMQm5443kZVFRPl8vWDPjAZ2xdIFLTTYdb-jbHoudDtQuseqpjqC6EnZdwNE5z-N_pG6H6a6dCKD5Qn19K_Gerulvi7oSLWJm_2jaw8DckGA3u6hWyxxf7zkStCJZ3OKmRr193fOtaDGBucELDq6vrOmyg39GfD5_gFt234B)

링크를 열면 보기 모드로 열립니다. 편집하기 버튼을 누르면 고칠 수 있습니다. 더 고친 뒤에는 파일 › 공유 링크 복사로 새 링크를 만들어 보관하거나 저에게 다시 붙여 넣어 주세요. 파일 › 저장으로 파일로 남길 수도 있습니다.

링크가 잘렸을 때 쓸 수 있도록 모델 JSON도 적어 둡니다.

```json
{"format":"ariadne-nsd","version":1,"settings":{"textKind":"plain","theme":"default","headStyle":"title","locale":"ko"},"diagrams":[{"id":"d1","head":{"kind":"method","text":"bubbleSort(a, n)"},"body":[{"id":"b1","kind":"doWhile","text":"while swapped","body":[{"id":"b8","kind":"process","text":"swapped = false"},{"id":"b2","kind":"for","text":"for j = 0 to n - 2","body":[{"id":"b3","kind":"if","text":"a[j] > a[j + 1]","yes":{"id":"r1","body":[{"id":"b4","kind":"process","text":"temp = a[j]"},{"id":"b5","kind":"process","text":"a[j] = a[j + 1]"},{"id":"b6","kind":"process","text":"a[j + 1] = temp"},{"id":"b9","kind":"process","text":"swapped = true"}]},"no":{"id":"r2","body":[{"id":"b7","kind":"process","text":""}]}}]}]}]}],"view":{"folded":[],"opened":[],"bands":true,"resultSymbol":"←"}}
```
