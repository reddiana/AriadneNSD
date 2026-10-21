%% 1레벨 제목은 지우지 않습니다. 항목은 글머리표(- …)나 "## 짧은 제목"으로 적어 주세요. 제목은 글이 결국 가는 곳 기준입니다: 일하는 방식 → CLAUDE.md·atelier/, 배포 대상 → 요구사항 2장, 기능 → 요구사항 3장, 나의 결정 → ADR·요구사항, 질문/요청 → Claude에게 하는 모든 질문과 요청(세션에서 답하고, 기술 설명이면 tech-notes/에도 정리), 기타 → 그 밖의 모든 것 %%

> [!abstract] 이 문서는
> 세션과 세션 사이에 메인테이너가 떠오른 생각, 요청, 질문을 적어 두는 메모장(inbox)입니다.
> - 다음 세션을 시작할 때 Claude가 이 문서를 읽고, 항목마다 메인테이너와 함께 검토해 그 세션에서 할 일을 정합니다.
> - 처리 방향이 정해진 항목은 원문을 세션 기록(`atelier/sessions/`)에 그대로 옮긴 뒤 여기서 지웁니다. 그래서 **여기에 남아 있는 글은 아직 다루지 않았거나 정하지 못한 것**입니다. 비어 있으면 밀린 것이 없다는 뜻입니다.
> - 제목 여섯 개는 글이 결국 가는 곳을 기준으로 나눈 것이고, 늘 그대로 둡니다.

> [!tip] 자주 여는 주소
> 프로토타입과 답을 기다리는 페이지의 주소는 [[status#바로 가기]]에, 시안과 스파이크 전체의 목록은 [[sketchbook]]에 있습니다.

# 1. 일하는 방식
- `backlog` / `debt` 구분 기준은 무엇인가? 둘 다 필요할까요?
- `study-pages` 페이지 명을 바꾸고 싶어요. 내용에 어울리지 않습니다. 재검토해주세요.
- 대화나 이 문서에서 편하게 부를 당신의 이름을 지어주세요.
- `requirements-review` 어느샌가 생겼는데, 이 문서(`inbox`)가 내가 당신에게 보내는 메시지라면 `requirements-review`는 당신이 내게 보내는 메세지인가요? 역시 문서 제목을 재검토해야겠습니다.
- 유즈케이스나 사용자스토리를 도입하는 것을 검토하고 의견 주세요.
- 비기능요건에 대한 품질속성시나리오(QAS)들을 도출해주세요. 아키텍처는 QAS를 만족하도록 구성되어야하고, QAS를 확인할 테스트도 작성해야합니다.
# 2. 배포 대상

# 3. 기능
## 프로토타입

### 추가/변경 요건

# 4. 나의 결정

# 5. 질문/요청
- MVP를 하기 전에 뭐가 결정되어야 하나요?
- [[0031-shell-interfaces]]과 [[0033-command-list-for-shells]]은 같은 내용 아닌가요?
# 6. 기타
- [[0033-command-list-for-shells]] "명령의 목록을 내놓는다"는 표현은 `interface`를 말하는 것 같습니다. ADR은 아키텍처 문서이니만큼 독자인 SW엔지니어의 언어를 쓰면 좋겠습니다. 이처럼 SW엔지니어의 용어와 표현을 쓰는 것이 좋을 부분을 찾아서 고쳐주세요. 이미 승인된 결정이라도 의미가 바뀌지 않는 범위 내에서 SW엔지니어의 언어로 고쳐주세요.
- 03-architecture와  04-design, 05-spec 문서의 독자는 SW엔지니어입니다. UML을 적극 활용해주세요. UML이 아닌 다이어그램에서 화살표의 의미, 실선/점선의 의미가 애매합니다. UML처럼 알려진 노테이션이 아니라면 의미를 분명하게 설명해야합니다.
- 변경된 내용이 없는 문서가 git status에 modified라고 나옵니다. 왜죠?
```
C:\myProject\AriadneNSD>git status
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   atelier/inbox.md
        modified:   docs/03-architecture/03-architecture.md
        modified:   docs/04-design/02-layout.md

no changes added to commit (use "git add" and/or "git commit -a")

C:\myProject\AriadneNSD>git diff docs/04-design/02-layout.md

C:\myProject\AriadneNSD>
```
