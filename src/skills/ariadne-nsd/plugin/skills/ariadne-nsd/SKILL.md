---
name: ariadne-nsd
description: Draw, read, explain and edit Nassi–Shneiderman diagrams (NSD, NS charts, structograms) with AriadneNSD. Use when the user asks to explain an algorithm as an NS diagram or structogram, to draw a chart of a function or of code ("draw this function", "NS 차트로 그려줘"), or gives an AriadneNSD share link (ariadnensd.com/#ns1.…) or a .ns.svg file to explain, review or change. Makes .ns.svg files (an SVG picture that shows anywhere, with the diagram inside so the AriadneNSD editor opens it for editing) and share links that open the diagram in the browser.
---

# AriadneNSD

AriadneNSD (https://ariadnensd.com/) is a free Nassi–Shneiderman diagram editor that runs in the browser. You write a diagram as **model JSON**; this skill's script turns it into the two things the user gets:

- a **share link** `https://ariadnensd.com/#ns1.d.…`: the whole diagram is inside the link. It opens in view mode, and Edit (편집하기) makes it editable. No upload, no account.
- a **saved file** `name.ns.svg`: an SVG picture (it shows in Markdown, on GitHub, in a browser) with the model inside, so AriadneNSD opens it for editing (Open, or drag it onto the page).

Both are exactly what the app itself writes (File › Copy Share Link, File › Save).

## The script

`scripts/nsd.mjs` in this skill's folder. One file, plain `node` (20 or later), no network, no install.

```sh
node scripts/nsd.mjs check model.json          # validate; prints the next free ids
node scripts/nsd.mjs link  model.json          # print the share link
node scripts/nsd.mjs save  model.json -o max.ns.svg
node scripts/nsd.mjs read  'https://ariadnensd.com/#ns1.d.…'   # print the model JSON
```

- The input of every command is a file path, `-` (stdin, the default), or a share link. A file may hold model JSON, an envelope `{"name": "max.ns.svg", "model": {…}}`, or a saved `.ns.svg` / `.ns` file. So `read` and `save` also convert: link → file, file → link.
- `--name max.ns.svg` names the document in the link (and the file, without `-o`). Default: the first Method's name + `.ns.svg`.
- `--json` prints one JSON object, errors too. `read --envelope` prints `{"name", "model"}`.
- Exit code 1 means the model is not valid. The message gives the parser's reason with a path (`diagrams[0].body[2]: unknown key "text"`) and what to do. Fix the JSON and run `check` again until it says `OK`. Never hand out a link or file that `check` did not pass.
- Run it from this skill's folder, or give its full path. On claude.ai the skill folder is in the sandbox (for example `/mnt/skills/user/ariadne-nsd/`). In Claude Code it is the base directory shown when the skill loads: the plugin's folder when installed from the plugin marketplace, else `~/.claude/skills/ariadne-nsd/` or `.claude/skills/ariadne-nsd/` in the project.

## A. Explain an algorithm as a diagram

1. Write the model JSON (below). Text in blocks may be in the user's language or code; set `settings.locale` to `ko` when the user writes Korean, else `en`.
2. Write it to a file and run `check`. Fix until `OK`.
3. Run `save` (the `.ns.svg` file) and `link`.
4. Give the user the file, and the link as a markdown link and again as plain text in a code block (some chat apps rewrite links). Say in one or two sentences: the link opens in view mode and Edit makes it editable; File › Copy Share Link in the app makes a new link to keep, share or paste back to you; File › Save keeps it as a file.
5. Keep your explanation of the algorithm next to it, short: the diagram is the explanation.

## B. Draw code as a diagram (Claude Code)

When the user asks to draw a function, a file or a module:

1. Read the code. Each function you draw becomes one diagram with a `method` head: `{"kind":"method","text":"partition(a, lo, hi)"}`. Draw the function the user named; draw a function it calls too when the user asks for "the whole flow" or the callee is short and in the same file.
2. Map the statements to blocks with [references/code-to-blocks.md](references/code-to-blocks.md). Keep the code's own words in the blocks (`i < n`, not "i is less than n"), shortened where a line is long. Set `settings.textKind` to the code's language (`python`, `java` …) for syntax colors.
3. A call that is a statement of its own becomes a call block: `local` target when the callee is drawn in the same document, else `named`. Calls inside an expression stay in the process text.
4. `check`, then `save` the `.ns.svg` into the user's repository: beside the code, or where the repository keeps documents (`docs/`). Name it after the function: `partition.ns.svg`. Also give the share link.
5. Show how to use it: Markdown `![partition](docs/partition.ns.svg)` shows the picture on GitHub; AriadneNSD opens the same file for editing, and saving from the app keeps it a valid picture.
6. If the user changes the code later and asks again, read the old file (`read`), keep the ids of the blocks that stay, and save over it.

## C. Read, explain, review and change a diagram

The user gives a share link (`#ns1.d.…`, `#ns1.j.…`, `#ns1.u.…`) or a `.ns.svg` file.

1. `read` it: `node scripts/nsd.mjs read '<link>'` or `read file.ns.svg`. You get the model JSON. Never guess what a `d` link holds; read it with the script.
2. To explain: walk the diagrams top to bottom, in the user's language. A call block with a `local` target calls the diagram with that id.
3. To review: look for loops that never change their condition, an If whose branches do the same thing, empty branches that should hold something, a Case without `otherwise` where one is needed, repeated block sequences that could be one Method, and text that does not match what it does.
4. To change: edit the model JSON. Keep every id that stays. New diagrams, blocks, branches and folds take the next free ids, which `check` prints (`Next free ids: d3 b17 r5 f1`, then count on: `b18`, `b19` …). Recipes, including "extract the repeated part into a Method": [references/editing.md](references/editing.md).
5. `check`, then give a new file (`save`, under the same name if it came as a file) and a new link (`link`), and say what you changed.

## Model JSON

The outline of a model (full field list and more examples: [references/model.md](references/model.md)):

<!-- doctest: skip: the outline of a model, with ...blocks... in place of the blocks -->
```json
{
  "format": "ariadne-nsd",
  "version": 1,
  "settings": { "textKind": "plain", "theme": "default", "headStyle": "title", "locale": "en" },
  "diagrams": [
    { "id": "d1", "head": { "kind": "method", "text": "max(a, n)" }, "body": [ ...blocks... ] }
  ],
  "view": { "folded": [], "opened": [], "bands": true, "resultSymbol": "←" }
}
```

- `settings.textKind`: the language of the block text, for syntax colors only: `plain`, `c`, `cpp`, `java`, `javascript`, `python`, `bash`.
- `settings.theme`: `default`, `dark`, `high-contrast` or `print`. `settings.headStyle`: `title` or `shape`. `settings.locale`: `en` or `ko` (the words the editor draws, "True"/"False" or "참"/"거짓").
- `view`: copy it as above.
- `diagrams[].head` is optional: `{"kind":"method","text":"name(params)"}` for a function, `{"kind":"event","text":"On click"}` for a handler. Leave it out for a plain diagram.

### Blocks

A body is an array of blocks, drawn top to bottom. The block kinds are `process`, `if`, `case`, `while`, `doWhile`, `for`, `call`.

| Block | JSON |
| --- | --- |
| Process (a statement) | `{"id":"b1","kind":"process","text":"x = 0"}` |
| If | `{"id":"b2","kind":"if","text":"x > 0","yes":{"id":"r1","body":[...]},"no":{"id":"r2","body":[...]}}` |
| Case (switch) | `{"id":"b3","kind":"case","text":"op","arms":[{"id":"r3","label":"'+'","body":[...]}],"otherwise":{"id":"r4","body":[...]}}` |
| While (test first) | `{"id":"b4","kind":"while","text":"i < n","body":[...]}` |
| Do-While (test last) | `{"id":"b5","kind":"doWhile","text":"while swapped","body":[...]}` |
| For | `{"id":"b6","kind":"for","text":"for i = 0 to n - 1","body":[...]}` |
| Call | `{"id":"b7","kind":"call","target":{"kind":"named","name":"swap"},"args":"a[i], a[j]","result":""}` |

- `text` is what is written in the block: one statement per process block. Use `\n` only to break one long statement or condition into lines.
- A loop that counts (`i = 0 to n - 2`) is a `for` block; `while` is for a loop that tests a condition.
- If: both `yes` and `no` are required. A branch may have `"label"` to replace "True"/"False".
- Case: every arm needs `label`. `otherwise` (the default branch) is optional.
- Call: a call block has **no `text`**. The callee goes in `target`, the arguments in `args` (a string), the variable that receives the result in `result` (`""` for none); it is drawn as `result ← name(args)`. `"target":{"kind":"local","diagram":"d2"}` calls the Method of diagram `d2` in the same document (a Method may call itself); `"target":{"kind":"named","name":"print"}` calls anything else.

### Rules (`check` refuses a model that breaks one)

1. Ids: diagrams `d1, d2, …`, blocks `b1, b2, …`, branches and arms `r1, r2, …`, fold regions `f1, f2, …`. A prefix and a whole number from 1, no leading zeros. Every id is used once in the whole document.
2. Every `body` holds at least one block. An empty branch holds an empty process block: `{"id":"b9","kind":"process","text":""}`.
3. Only the keys shown here and in the reference. No other keys, no comments, no trailing commas.
4. Plain JSON strings: escape `"` and `\` as `\"` and `\\`.

### Example: find the largest value

```json
{"format":"ariadne-nsd","version":1,"settings":{"textKind":"plain","theme":"default","headStyle":"title","locale":"en"},"diagrams":[{"id":"d1","head":{"kind":"method","text":"max(a, n)"},"body":[{"id":"b1","kind":"process","text":"m = a[0]"},{"id":"b2","kind":"for","text":"for i = 1 to n - 1","body":[{"id":"b3","kind":"if","text":"a[i] > m","yes":{"id":"r1","body":[{"id":"b4","kind":"process","text":"m = a[i]"}]},"no":{"id":"r2","body":[{"id":"b5","kind":"process","text":""}]}}]},{"id":"b6","kind":"process","text":"return m"}]}],"view":{"folded":[],"opened":[],"bands":true,"resultSymbol":"←"}}
```

### Example: a Case

```json
{"id":"b1","kind":"case","text":"light","arms":[{"id":"r1","label":"red","body":[{"id":"b2","kind":"process","text":"stop"}]},{"id":"r2","label":"green","body":[{"id":"b3","kind":"process","text":"go"}]}],"otherwise":{"id":"r3","body":[{"id":"b4","kind":"process","text":"slow down"}]}}
```

## If the script cannot run

Where no code runs, follow https://ariadnensd.com/llms.txt instead: it makes an uncompressed `ns1.u.` link by hand. Prefer the script whenever it runs; it makes the same link and file the app makes, and checks the model with the app's own parser.
