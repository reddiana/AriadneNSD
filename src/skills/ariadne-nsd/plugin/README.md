# AriadneNSD skill for Claude

Draw, read, explain and edit Nassi–Shneiderman diagrams (NS charts, structograms) with [AriadneNSD](https://ariadnensd.com/), a free NS diagram editor that runs in the browser.

Ask Claude to "explain quicksort as an NS chart" or "draw this function as an NS diagram", and it gives you two things:

- a **`.ns.svg` file**: an SVG picture that shows anywhere (Markdown, GitHub, a browser), with the diagram inside so the AriadneNSD editor opens it for editing;
- a **share link** (`https://ariadnensd.com/#ns1.d.…`) that opens the diagram in the browser.

You can also give Claude a share link or a `.ns.svg` file and ask it to explain, review or change the diagram. Once installed, Claude uses the skill on its own when it fits.

## What it contains and what it runs

The plugin holds one skill, `ariadne-nsd`. There are no hooks, agents, MCP servers or commands.

| File | What it is |
| --- | --- |
| `skills/ariadne-nsd/SKILL.md` | Instructions for Claude |
| `skills/ariadne-nsd/references/*.md` | The model JSON format, how code maps to blocks, editing recipes |
| `skills/ariadne-nsd/scripts/nsd.mjs` | The script Claude runs with `node` (20 or later) |
| `skills/ariadne-nsd/LICENSE`, `NOTICE`, `OFL.txt` | Licenses (Apache-2.0; the bundled font under the SIL Open Font License 1.1) |

`nsd.mjs` has four commands: `check` (validate a diagram), `link` (print a share link), `save` (write a `.ns.svg` file) and `read` (turn a link or file back into JSON). Claude runs it only on diagrams it writes or that you give it.

- **No network.** The script makes no network requests, starts no other processes and reads no environment variables. It imports only Node's `fs`, `zlib` and `module`.
- **Files.** It reads the input file you or Claude name, and writes only with `save`: one `.ns.svg` file, at the path given by `-o`, or else in the current folder under the diagram's name.
- **No data collection.** The skill sends nothing anywhere. A share link keeps the whole diagram in the part after `#`, which browsers do not send to the server, so opening the link does not upload the diagram. The ariadnensd.com site counts visits with Cloudflare Web Analytics (no cookies, and it does not receive the part after `#`).

## About the large script

`nsd.mjs` is about 1 MB because it is a single self-contained file: Claude.ai and plugin installs do not run a build step, and the claude.ai sandbox has no network. It is a readable (not minified) bundle of the editor's own TypeScript code, so files and links it makes are exactly what the app makes. Two parts are embedded as base64 of brotli-compressed bytes and decoded at run time with `node:zlib`:

- a subset of the font [D2Coding](https://github.com/naver/d2codingfont) (OFL 1.1), used to measure and outline text;
- the [HarfBuzz](https://github.com/harfbuzz/harfbuzzjs) `hb-subset` WebAssembly module, used to cut the font down to the characters a diagram uses.

The source is in this repository: the script's entry points are in [`src/skills/ariadne-nsd/src/`](https://github.com/reddiana/AriadneNSD/tree/main/src/skills/ariadne-nsd/src), the bundled code in [`src/packages/`](https://github.com/reddiana/AriadneNSD/tree/main/src/packages), and the build in [`src/skills/ariadne-nsd/scripts/build.mjs`](https://github.com/reddiana/AriadneNSD/blob/main/src/skills/ariadne-nsd/scripts/build.mjs). A test checks that the committed `nsd.mjs` is the build of the current source.

## Status

AriadneNSD is in beta (0.x). Until 1.0 the file format may change; a later editor may not open a file made now. See the [roadmap](https://github.com/reddiana/AriadneNSD#roadmap).

## Install

- **Claude Code:** `/plugin marketplace add reddiana/AriadneNSD`, then `/plugin install ariadne-nsd@ariadne-nsd`.
- **claude.ai:** in Plugins, choose Add › Add marketplace › Add from repository, enter `reddiana/AriadneNSD`, then add the AriadneNSD plugin. "Code execution and file creation" must be on (Settings › Capabilities).

## Support

Report problems and ask questions in [GitHub Issues](https://github.com/reddiana/AriadneNSD/issues). The editor's user manual is at <https://ariadnensd.com/manual/>.

## License

Apache-2.0. The bundled D2Coding font subset is under the SIL Open Font License 1.1 (`skills/ariadne-nsd/OFL.txt`).
