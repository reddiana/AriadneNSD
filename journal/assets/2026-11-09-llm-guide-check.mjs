// M56 experiment: checks what other LLMs made from the draft guide (llms.txt) with AriadneNSD's own
// parser, the same `parseModel` path the web shell runs on a share link or a file.
//
//   node journal/assets/2026-11-09-llm-guide-check.mjs            check every answer in …-runs/
//   node journal/assets/2026-11-09-llm-guide-check.mjs --encode <envelope.json>
//                                                                 print the u / j / d links of it
//
// The proposed `u` packing (`#ns1.u.<encodeURIComponent(JSON)>`) does not exist in the app yet;
// it is read here as the browser would: `new URL(link).hash` (the browser percent-encodes what is
// left raw), then decodeURIComponent. `j` and `d` go through the app's own readShareLink.
// core and the web app's share-link module are TypeScript, so they are loaded through Vite.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..');
const web = join(repo, 'src', 'apps', 'web');
const runsDirectory = join(here, '2026-11-09-llm-guide-runs');
const resultsFile = join(here, '2026-11-09-llm-guide-results.json');

const require = createRequire(join(web, 'package.json'));
const vite = await import(pathToFileURL(require.resolve('vite')).href);
const server = await vite.createServer({
  root: web,
  configFile: false,
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
});

try {
  const core = await server.ssrLoadModule('@ariadne-nsd/core');
  const fonts = await server.ssrLoadModule('@ariadne-nsd/fonts');
  const fontsNode = await server.ssrLoadModule('@ariadne-nsd/fonts/node');
  const share = await server.ssrLoadModule('/src/files/share-link.ts');
  const deflate = share.browserDeflate();
  const subsetter = await fontsNode.createNodeSubsetter();
  const ttf = await fontsNode.readFontFile(fonts.blockFont.files.ttf);

  const linksOf = async (envelope) => {
    const json = JSON.stringify(envelope);
    const modelJson = JSON.stringify(envelope.model);
    return {
      u: `https://ariadnensd.com/#ns1.u.${encodeURIComponent(json)}`,
      j: `https://ariadnensd.com/#${await share.writeShareLink(modelJson, envelope.name, null)}`,
      d: `https://ariadnensd.com/#${await share.writeShareLink(modelJson, envelope.name, deflate)}`,
    };
  };

  /** The picture of a document, as "Export ▸ SVG" writes it (subset font inside). */
  const pictureOf = (doc) => {
    const rendering = core.renderDoc(doc);
    const woff = subsetter.subsetToWoff(ttf, rendering.codePoints);
    return core.assembleImageSvg(rendering.svg, [{ family: fonts.blockFont.familyName, woff }]);
  };

  /** Opens a model value as the shell does: parseModel with the opener's language. */
  const openModel = (model) => {
    const parsed = core.parseModel(model, { locale: 'ko' });
    return parsed.ok
      ? { ok: true, doc: parsed.value.doc }
      : { ok: false, reason: parsed.reason, detail: parsed.detail };
  };

  /** Characters that chat apps' link detection stops at or mangles when left raw. */
  const unsafeRaw = (fragment) => [...new Set(fragment.match(/[\s"<>`{}|\\^[\]()]/g) ?? [])];

  /** Reads one share link (any packing) to a model, or says why not. */
  const readLink = async (link) => {
    let url;
    try {
      url = new URL(link);
    } catch (error) {
      return { ok: false, stage: 'url', detail: String(error) };
    }
    const fragment = url.hash.slice(1);
    if (fragment.startsWith('ns1.u.')) {
      let text;
      try {
        text = decodeURIComponent(fragment.slice('ns1.u.'.length));
      } catch (error) {
        return { ok: false, stage: 'percent-decoding', detail: String(error) };
      }
      let envelope;
      try {
        envelope = JSON.parse(text);
      } catch (error) {
        return { ok: false, stage: 'envelope JSON', detail: String(error) };
      }
      const keys = Object.keys(envelope ?? {}).sort().join(',');
      if (keys !== 'model,name' || typeof envelope.name !== 'string') {
        return { ok: false, stage: 'envelope', detail: `keys ${keys}` };
      }
      return { ok: true, name: envelope.name, model: envelope.model };
    }
    const read = await share.readShareLink(fragment, deflate);
    return read.ok
      ? { ok: true, name: read.name, model: read.model }
      : { ok: false, stage: 'readShareLink', detail: `${read.reason}: ${read.detail}` };
  };

  if (process.argv[2] === '--encode') {
    const envelope = JSON.parse(await readFile(process.argv[3], 'utf8'));
    const opened = openModel(envelope.model);
    console.log(opened.ok ? 'model: ok' : `model: ${opened.reason}: ${opened.detail}`);
    console.log(JSON.stringify(await linksOf(envelope), null, 2));
  } else {
    await checkRuns();
  }

  async function checkRuns() {
    const files = (await readdir(runsDirectory)).filter((file) => file.endsWith('.md')).sort();
    const results = [];
    for (const file of files) {
      const answer = await readFile(join(runsDirectory, file), 'utf8');
      const result = { run: file.replace(/\.md$/, ''), links: [], json: null };
      // The links, cut where a chat app's link detection would cut them.
      for (const match of answer.matchAll(/https:\/\/ariadnensd\.com\/#ns1\.[a-z]\.[^\s<>`]*/g)) {
        let link = match[0];
        const before = answer.slice(Math.max(0, match.index - 2), match.index);
        if (before === '](') {
          // A markdown link ends at the `)` that balances its `(`, as CommonMark reads it.
          let depth = 0;
          for (let index = 0; index < link.length; index += 1) {
            if (link[index] === '(') {
              depth += 1;
            } else if (link[index] === ')') {
              if (depth === 0) {
                link = link.slice(0, index);
                break;
              }
              depth -= 1;
            }
          }
        }
        if (link.length <= 'https://ariadnensd.com/#ns1.u.'.length) {
          continue; // the bare prefix, quoted when the answer explains the format
        }
        const packing = link.slice('https://ariadnensd.com/#ns1.'.length)[0];
        const read = await readLink(link);
        const entry = { packing, length: link.length };
        if (packing === 'u') {
          entry.rawUnsafe = unsafeRaw(link.slice(link.indexOf('#') + 1));
        }
        if (!read.ok) {
          Object.assign(entry, { ok: false, stage: read.stage, detail: read.detail });
        } else {
          const opened = openModel(read.model);
          Object.assign(
            entry,
            opened.ok
              ? { ok: true, name: read.name }
              : { ok: false, stage: 'parseModel', detail: `${opened.reason}: ${opened.detail}` },
          );
          if (opened.ok) {
            entry.model = read.model;
          }
        }
        result.links.push(entry);
      }
      // The model JSON in the first ```json block, as a user would paste it.
      const block = /```json\s*\n([\s\S]*?)```/.exec(answer);
      if (block !== null) {
        // Some answers show the envelope rather than the model: check the model inside it.
        let text = block[1];
        try {
          const value = JSON.parse(text);
          if (value !== null && typeof value === 'object' && 'model' in value) {
            text = JSON.stringify(value.model);
            result.jsonIsEnvelope = true;
          }
        } catch {
          // parseModelJson reports it
        }
        const parsed = core.parseModelJson(text, { locale: 'ko' });
        result.json = parsed.ok
          ? { ok: true }
          : { ok: false, detail: `${parsed.reason}: ${parsed.detail}` };
      }
      // The picture and the real j / d links, from the first link that opens.
      const good = result.links.find((entry) => entry.ok);
      if (good !== undefined) {
        const opened = openModel(good.model);
        result.svg = pictureOf(opened.doc);
        result.real = await linksOf({ name: good.name, model: good.model });
        result.blocks = countBlocks(good.model);
      }
      for (const entry of result.links) {
        delete entry.model;
      }
      results.push(result);
      const summary = result.links
        .map((e) => `${e.packing}:${e.ok ? 'ok' : `FAIL(${e.stage}: ${e.detail})`}`)
        .join(' ');
      console.log(
        `${result.run}  ${summary || 'no link'}  json:${result.json === null ? '-' : result.json.ok ? 'ok' : `FAIL(${result.json.detail})`}`,
      );
    }
    await writeFile(resultsFile, `${JSON.stringify(results, null, 2)}\n`);
  }

  function countBlocks(value) {
    if (Array.isArray(value)) {
      return value.reduce((sum, item) => sum + countBlocks(item), 0);
    }
    if (value === null || typeof value !== 'object') {
      return 0;
    }
    const own = typeof value.kind === 'string' && /^b\d+$/.test(String(value.id)) ? 1 : 0;
    return own + Object.values(value).reduce((sum, item) => sum + countBlocks(item), 0);
  }
} finally {
  await server.close();
}
