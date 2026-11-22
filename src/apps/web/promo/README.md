# 홍보 동영상

LinkedIn에 올릴 화면 동영상(웹 편집기가 빈 문서에서 갤러리의 힙 정렬(영어)을 키보드로 그려 가는 모습)을 녹화하는 스크립트입니다. 테스트가 아니어서 `pnpm e2e` · `pnpm check`는 이 폴더를 보지 않습니다. `src/`에서 `node apps/web/promo/record.mjs`로 실행하면 포트 5190에 개발 서버를 띄우고(이미 떠 있으면 그것을 씀) `journal/assets/2026-11-22-linkedin-heap-sort.mp4`(H.264, 1080x1080, 30 fps)와 끝 장면 `…-final.png`를 만듭니다. libx264가 든 ffmpeg가 필요합니다(`PATH`에 있거나 환경 변수 `FFMPEG`).
