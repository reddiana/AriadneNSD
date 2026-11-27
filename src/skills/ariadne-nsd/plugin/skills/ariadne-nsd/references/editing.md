# Changing a diagram

Change the model JSON the script's `read` printed, then `check`, `save` and `link`. Three rules keep the user's diagram theirs:

- Keep every id that stays, even when you move the block or change its text. The app keeps fold state and opened calls by id.
- New things take the next free ids. `check` prints them (`Next free ids: d3 b17 r5 f1`); count on from there for more (`b17`, `b18` …). Never reuse an id you deleted in the same change.
- A `body` never ends up empty: put one empty process block in it (`{"id":"b20","kind":"process","text":""}`).

## Recipes

| The user asks | What to do in the JSON |
| --- | --- |
| Add a step | A new block with the next `b` id, in the `body` where it goes |
| Remove a step | Delete the block (with everything inside it). If its body is now empty, add an empty process |
| Put steps in a loop or an If | A new `for` / `while` / `if` block with the steps (same ids) as its `body` / `yes` |
| Take the loop or If away, keep its steps | Put its body's blocks (same ids) where the block was |
| Turn an else-if chain into a Case | One `case` block (new id) whose arms hold the branches' blocks (same ids). Arms and `otherwise` take new `r` ids |
| Rename a Method | Change its `head.text`. Calls with a `local` target show the new name by themselves |
| Extract repeated steps into a Method | See below |
| Inline a Method | Replace each call block to it with a copy of its body (the first copy keeps the ids, other copies take new ids), then delete the diagram if nothing else calls it |
| Name and fold a part | A fold region on the body that holds it (see [model.md](model.md)) |

## Extract the repeated part into a Method

1. Find the sequences that are the same up to some values. Those values become parameters.
2. Add a diagram with the next `d` id and a `method` head: `{"kind":"method","text":"swap(a, i, j)"}`. Its body is the first copy's blocks, keeping their ids, with the values replaced by the parameters.
3. Put a call block (new `b` id) where each copy was: `{"kind":"call","target":{"kind":"local","diagram":"d2"},"args":"a, 0, 1","result":""}`. If the copy assigned a result, put that variable in `result`. Delete the other copies' blocks.
4. Tell the user which parts became the Method and what each call passes.

Before (`check` says `Next free ids: d2 b7 r5 f1`):

```json
{"format":"ariadne-nsd","version":1,"settings":{"textKind":"plain","theme":"default","headStyle":"title","locale":"en"},"diagrams":[{"id":"d1","head":{"kind":"method","text":"sortPairs(a)"},"body":[{"id":"b1","kind":"if","text":"a[0] > a[1]","yes":{"id":"r1","body":[{"id":"b2","kind":"process","text":"t = a[0]\na[0] = a[1]\na[1] = t"}]},"no":{"id":"r2","body":[{"id":"b3","kind":"process","text":""}]}},{"id":"b4","kind":"if","text":"a[2] > a[3]","yes":{"id":"r3","body":[{"id":"b5","kind":"process","text":"t = a[2]\na[2] = a[3]\na[3] = t"}]},"no":{"id":"r4","body":[{"id":"b6","kind":"process","text":""}]}}]}],"view":{"folded":[],"opened":[],"bands":true,"resultSymbol":"←"}}
```

After: `b2` moved into the new Method `d2`, `b5` deleted, two call blocks `b7` and `b8`:

```json
{"format":"ariadne-nsd","version":1,"settings":{"textKind":"plain","theme":"default","headStyle":"title","locale":"en"},"diagrams":[{"id":"d1","head":{"kind":"method","text":"sortPairs(a)"},"body":[{"id":"b1","kind":"if","text":"a[0] > a[1]","yes":{"id":"r1","body":[{"id":"b7","kind":"call","target":{"kind":"local","diagram":"d2"},"args":"a, 0, 1","result":""}]},"no":{"id":"r2","body":[{"id":"b3","kind":"process","text":""}]}},{"id":"b4","kind":"if","text":"a[2] > a[3]","yes":{"id":"r3","body":[{"id":"b8","kind":"call","target":{"kind":"local","diagram":"d2"},"args":"a, 2, 3","result":""}]},"no":{"id":"r4","body":[{"id":"b6","kind":"process","text":""}]}}]},{"id":"d2","head":{"kind":"method","text":"swap(a, i, j)"},"body":[{"id":"b2","kind":"process","text":"t = a[i]\na[i] = a[j]\na[j] = t"}]}],"view":{"folded":[],"opened":[],"bands":true,"resultSymbol":"←"}}
```

## Reviewing

Things worth pointing out, with the block's text so the user finds it:

- A `while` whose body never changes what its condition tests (an endless loop), an `endless` loop with no `exit` in it where the description says it ends, or a `for` that should be a `while` (it does not count).
- An If whose two branches hold the same steps, or whose condition is always true or false where it stands.
- An empty branch that the description says should do something, or an If with an empty `no` that would read better as a guard.
- A Case without `otherwise` where a value can fall through.
- The same sequence of steps in two or more places: offer to extract it into a Method.
- Text that does not say what the step does, or a step that does several things.
