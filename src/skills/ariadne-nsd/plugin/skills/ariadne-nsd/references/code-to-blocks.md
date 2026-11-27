# From code to blocks

How the statements of a function become blocks. The aim is a diagram a reader follows faster than the code: the same control flow, the code's own words, less noise. When a construct has no block of its own (try, goto), draw the nearest honest shape and tell the user what you approximated.

| Code | Blocks |
| --- | --- |
| A function `f(a, b)` | One diagram with `"head":{"kind":"method","text":"f(a, b)"}`. A handler (`onClick`) may take an `event` head instead |
| A plain statement, an assignment | `process` with the statement as text: `x = x + 1` |
| Several statements in a row | One `process` per statement, even short ones that do one thing together (`lo = 0`, then `hi = n - 1`). Never join statements with `\n` in one block; `\n` is only for breaking one long statement or condition |
| `if (c) A else B` | `if`: `text` `c`, `yes` A, `no` B |
| `if (c) A` without `else` | `if` with `no` holding one empty process `{"kind":"process","text":""}` |
| `else if` chain | `if` nested in the `no` branch of the one before. When every test compares one value with constants (`x == 1`, `x == 2` …), a `case` reads better |
| `switch` / `match` / `when` | `case`: `text` the value, one arm per label (`label` `'+'`), `default` → `otherwise`. Labels that share a body go in one arm (`"label":"1, 2"`); `break` is left out |
| `while (c)` | `while`, `text` `c` |
| `while (true)` / `for (;;)` / `loop { }` | `endless` (no `text`) with the body; its exits are `exit` blocks |
| `do … while (c)` / `repeat … until` | `doWhile`, `text` `while c` (or `until c`) |
| Counting loop `for (i = 0; i < n; i++)` | `for`, `text` `for i = 0 to n - 1`, or the loop's own head (`for i in range(n)`) when `textKind` is the code's language |
| `for x in xs` / for-each | `for`, `text` `for each x in xs` (or the code's own head) |
| `break`, `continue` | `exit` with the word as `text` (`break`) where it happens, usually in a branch of an If |
| `goto` | A `process` holding the word where it happens. NS diagrams have no jumps; say so if the flow depends on it |
| `return x` | At the end of the function, `process` `return x`. An early return (in an `if`, inside a loop) is an `exit` with `text` `return x`, inside that branch |
| Guard clause `if (bad) return;` then the rest | `if` with an `exit` `return` in `yes` and an empty process in `no`, then the rest below it. When the rest is short, put it in `no` instead |
| `throw e` / `raise e` | `exit` `throw e` |
| Work started together and joined: `Promise.all([a(), b()])`, threads started then joined, `parallel for` | `parallel` with one branch per task; `text` names the join (`Promise.all`) or is `""` |
| `try { A } catch (E e) { B } finally { C }` | A, then an `if` with `text` `E thrown in the above?`, `yes` B and `no` empty, then C. For a long `try`, put A in a fold region named `try` (see [model.md](model.md)) |
| A call as a statement: `swap(a, i, j)` | `call` block: `"target":{"kind":"named","name":"swap"}`, `"args":"a, i, j"`, `"result":""` |
| `p = partition(a, lo, hi)` | `call` block with `"result":"p"` |
| A call to a function drawn in the same document | `call` block with `"target":{"kind":"local","diagram":"d2"}` (the callee's diagram); recursion targets its own diagram |
| A call inside an expression: `x = f(y) + 1`, `if (isEmpty(q))` | Stays in the `process` or condition text |
| Method calls on objects: `list.add(x)` | `call` with `"name":"list.add"`, or a `process` when it is a one-line detail |
| `await`, `yield`, `async` | Keep the word in the text (`await save(doc)`) |
| Ternary `a = c ? x : y` | `process` as it is; an `if` only when the branches do more than pick a value |
| Lambdas, local functions, nested classes | A `process` naming them; draw a long one as its own diagram |
| Comments, logging, asserts | Leave out, unless they explain a step the blocks do not. A comment that names a group of statements can name a fold region over them |
| Declarations without a value (`int i;`) | Leave out |

## Size

- One diagram per function. When a function is longer than about 40 blocks, draw its big parts as their own Methods (call blocks with `local` targets) or as named fold regions, and say which.
- Text is drawn as written, one line per `\n`. Break a long condition into lines at `&&` / `||`.

## Settings for code

- `settings.textKind`: the code's language when it is one of `c`, `cpp`, `java`, `javascript`, `python`, `bash` (TypeScript: `javascript`; C#, Kotlin, Go, Rust: `java` or `c` is close enough, or `plain`).
- `settings.headStyle`: `title` (the Method's signature as a title above the diagram).
- `settings.locale`: `en`, or `ko` when the user works in Korean. Block text stays in the code's words either way.
