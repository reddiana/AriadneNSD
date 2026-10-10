---
title: 사용자 의견 받기와 후원 채널
tags:
  - ariadne-nsd
  - tech-notes
updated: 2026-10-10
---

# 사용자 의견 받기와 후원 채널

## 한 줄 요약

GitHub는 버그용 **Issues**와 대화용 **Discussions**를 따로 두고, 둘 다 **양식(form)**으로 입력을 거를 수 있습니다. 후원·광고는 배포 대상마다 쓸 수 있는 자리가 다릅니다.

## 백엔드로 비유하면

- **Issues** = 개발팀의 작업 큐(Jira 티켓). 들어온 것은 모두 처리할 일이 됩니다.
- **Discussions** = 고객 지원 게시판. 질문·착각은 여기서 답하고, 진짜 버그만 작업 큐로 옮깁니다 (Discussions 글에서 "Create issue from discussion"으로 옮길 수 있습니다).
- **양식** = API의 입력 검증. 저장소의 `.github/ISSUE_TEMPLATE/*.yml`(이슈)이나 `.github/DISCUSSION_TEMPLATE/*.yml`(Discussions 분류별)에 필수 칸과 체크박스를 정하면, 빠진 것이 있을 때 올릴 수 없습니다.

## AriadneNSD에서 어디에 쓰나

- 문제 알리기([[01-requirements#^rep-issue]]): 공개는 Discussions + 양식, 비공개는 이메일·폼. 반복되는 문제는 FAQ 페이지로 정리.
- 후원 링크([[01-requirements#^all-donate]]):
	- Obsidian 플러그인은 `manifest.json`의 `fundingUrl`에 주소를 적으면, 커뮤니티 플러그인 화면에 후원 버튼이 저절로 보입니다.
	- 웹·데스크톱은 직접 화면에 둡니다.
- 웹 광고([[01-requirements#^web-ads]]): Google AdSense 같은 광고 네트워크는 실수로 누르게 만드는 배치나 팝업 안의 광고를 정책으로 막는 경우가 많습니다. 그래서 "저장할 때만 보이는 광고"가 허용되는지 네트워크를 고를 때 확인해야 합니다.

## 더 읽을거리

- [GitHub Docs: Syntax for issue forms](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)
- [GitHub Docs: Creating discussion category forms](https://docs.github.com/en/discussions/managing-discussions-for-your-community/creating-discussion-category-forms)
- [Obsidian: Manifest (fundingUrl)](https://docs.obsidian.md/Reference/Manifest)
