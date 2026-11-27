# Model JSON reference

The full format: https://github.com/reddiana/AriadneNSD/blob/main/docs/05-spec/01-file-format.md (Korean). Its JSON Schema: https://ariadnensd.com/model.schema.json. The script's `check` applies both the shape and the rules (unique ids, no empty bodies, references that point somewhere).

## Fields

Keys go in this order (the app writes them so; it reads any order). "May be left out" means the key is not written when it has that value.

| Node | Fields | May be left out |
| --- | --- | --- |
| Document | `format` (always `"ariadne-nsd"`), `version` (`1`), `settings`, `diagrams`, `view` | nothing |
| `settings` | `textKind`, `theme`, `headStyle` (`"title"` or `"shape"`), `locale` (`"en"` or `"ko"`), `textOutlines` (`true`: text drawn as outlines in the saved file) | `textOutlines` when off |
| Diagram | `id`, `head`, `body`, `folds` | `head` when there is no header, `folds` when empty |
| `head` | `kind` (`"method"` or `"event"`), `text` | nothing |
| Process | `id`, `kind: "process"`, `text` | nothing (an empty block has `"text": ""`) |
| If | `id`, `kind: "if"`, `text`, `yes`, `no` | nothing |
| Case | `id`, `kind: "case"`, `text`, `arms`, `otherwise` | `otherwise` when there is no default branch |
| Branch (`yes`, `no`, `otherwise`) | `id`, `label`, `body`, `folds` | `label` when it is the default ("True", "False", "default"), `folds` when empty |
| Case arm (in `arms`) | `id`, `label`, `body`, `folds` | `folds` when empty |
| While, Do-While, For | `id`, `kind` (`"while"`, `"doWhile"`, `"for"`), `text`, `body`, `folds` | `folds` when empty |
| Endless loop | `id`, `kind: "endless"`, `body`, `folds` (no `text`) | `folds` when empty |
| Exit | `id`, `kind: "exit"`, `text` | nothing |
| Parallel | `id`, `kind: "parallel"`, `text`, `branches` (two or more) | nothing (`"text": ""` for none) |
| Parallel branch (in `branches`) | `id`, `body`, `folds` (no `label`) | `folds` when empty |
| Call | `id`, `kind: "call"`, `target`, `args`, `result`, `siteFolds` | `siteFolds` when empty (leave it to the app) |
| `target` | `{"kind":"local","diagram":"d2"}` (a Method in this document) or `{"kind":"named","name":"print"}` (anything else) | nothing |
| Fold region (in `folds`) | `id`, `first`, `last`, `name` | `name` when it has none |
| `view` | `folded`, `opened`, `bands`, `resultSymbol` (`"←"` or `"="`) | nothing (write empty lists too) |

## Fold regions

A fold region names a run of blocks in one body: `first` and `last` are the ids of its first and last block (the same id for one block). It is a field of the body's owner (the diagram, branch, arm or loop), next to `body`. Put its id in `view.folded` to show it folded, as one block with its name. The regions in one body must not overlap.

```json
{"format":"ariadne-nsd","version":1,"settings":{"textKind":"python","theme":"default","headStyle":"title","locale":"en"},"diagrams":[{"id":"d1","head":{"kind":"method","text":"load(path)"},"body":[{"id":"b1","kind":"process","text":"f = open(path)"},{"id":"b2","kind":"process","text":"text = f.read()"},{"id":"b3","kind":"process","text":"f.close()"},{"id":"b4","kind":"process","text":"return parse(text)"}],"folds":[{"id":"f1","first":"b1","last":"b3","name":"read the file"}]}],"view":{"folded":["f1"],"opened":[],"bands":true,"resultSymbol":"←"}}
```

## Methods that call each other

Each function is a diagram with a `method` head. A call block with a `local` target names the diagram it calls; the call is drawn with that Method's name, so renaming the Method renames every call. A Method may call itself.

```json
{"format":"ariadne-nsd","version":1,"settings":{"textKind":"plain","theme":"default","headStyle":"title","locale":"en"},"diagrams":[{"id":"d1","head":{"kind":"method","text":"quicksort(a, lo, hi)"},"body":[{"id":"b1","kind":"if","text":"lo < hi","yes":{"id":"r1","body":[{"id":"b2","kind":"call","target":{"kind":"local","diagram":"d2"},"args":"a, lo, hi","result":"p"},{"id":"b3","kind":"call","target":{"kind":"local","diagram":"d1"},"args":"a, lo, p - 1","result":""},{"id":"b4","kind":"call","target":{"kind":"local","diagram":"d1"},"args":"a, p + 1, hi","result":""}]},"no":{"id":"r2","body":[{"id":"b5","kind":"process","text":""}]}}]},{"id":"d2","head":{"kind":"method","text":"partition(a, lo, hi)"},"body":[{"id":"b6","kind":"process","text":"pivot = a[hi]\ni = lo"},{"id":"b7","kind":"for","text":"for j = lo to hi - 1","body":[{"id":"b8","kind":"if","text":"a[j] < pivot","yes":{"id":"r3","body":[{"id":"b9","kind":"call","target":{"kind":"named","name":"swap"},"args":"a, i, j","result":""},{"id":"b10","kind":"process","text":"i = i + 1"}]},"no":{"id":"r4","body":[{"id":"b11","kind":"process","text":""}]}}]},{"id":"b12","kind":"call","target":{"kind":"named","name":"swap"},"args":"a, i, hi","result":""},{"id":"b13","kind":"process","text":"return i"}]}],"view":{"folded":[],"opened":[],"bands":true,"resultSymbol":"←"}}
```

## Labels, Korean, and an event

Branch labels replace "True"/"False". With `"locale":"ko"` the editor draws Korean words ("참", "거짓"); block text may be Korean in any locale.

```json
{"format":"ariadne-nsd","version":1,"settings":{"textKind":"plain","theme":"default","headStyle":"shape","locale":"ko"},"diagrams":[{"id":"d1","head":{"kind":"event","text":"로그인 버튼을 누름"},"body":[{"id":"b1","kind":"if","text":"비밀번호가 맞나?","yes":{"id":"r1","label":"맞음","body":[{"id":"b2","kind":"process","text":"첫 화면으로"}]},"no":{"id":"r2","label":"틀림","body":[{"id":"b3","kind":"process","text":"오류를 보임"}]}}]}],"view":{"folded":[],"opened":[],"bands":true,"resultSymbol":"←"}}
```

## The view

Copy `"view":{"folded":[],"opened":[],"bands":true,"resultSymbol":"←"}` unless you fold regions (`folded` lists their ids). `opened` lists call blocks the user opened in place to see the callee; leave it as you found it when you edit a diagram you read. `bands: false` hides the colored bands of loops and branches.
