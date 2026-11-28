// Builds the algorithm gallery (M70, option G3) into dist/: the English page dist/index.html
// (/gallery/), the Korean one dist/ko/index.html (/gallery/ko/) and the German one
// dist/de/index.html (/gallery/de/), the same split as the user guide (DR-0020). A list of the algorithms on the left, the selected diagram large on the right.
//
// The entries come from generated/gallery.json and the pictures from generated/*.ns.svg, which
// `pnpm --filter @ariadne-nsd/web gallery-images` writes. They are read here at build time, so a
// regenerated diagram flows through without touching this script.
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';

const root = new URL('./', import.meta.url);
const dist = new URL('dist/', root);
const generated = new URL('generated/', root);
const journalAssets = new URL('../../../journal/assets/', root);

/** The site's address, for the Open Graph tags (they need absolute URLs). */
const site = 'https://ariadnensd.com';
const github = 'https://github.com/reddiana/AriadneNSD';
/** Selected when the address has no hash (or one that names no entry). */
const defaultId = 'dijkstra';
const categories = ['classic', 'hard', 'fun'];
/** The page languages, English first; each page links to the others under these names. */
const langs = ['en', 'ko', 'de'];
const langNames = { en: 'English', ko: '한국어', de: 'Deutsch' };
const ogLocales = { en: 'en_US', ko: 'ko_KR', de: 'de_DE' };

const text = {
  en: {
    title: 'Algorithm Gallery',
    description: (n) =>
      `${n} algorithms, from binary search to Raft, drawn as Nassi–Shneiderman diagrams. Open any of them in the AriadneNSD editor and change it.`,
    lead: (n) =>
      `${n} algorithms, from binary search to Raft, drawn as Nassi–Shneiderman diagrams (NS charts). Open any of them in the editor and change it.`,
    category: { classic: 'Classics', hard: 'The hard ones', fun: 'For fun' },
    listLabel: 'Algorithms',
    pick: 'Algorithm',
    keys: '↑ ↓ to browse',
    open: 'Open in editor',
    download: 'Download .ns.svg',
    about:
      'An .ns.svg file is a picture that shows anywhere, and AriadneNSD opens it again for editing.',
    wide: 'Wide diagram: scroll sideways.',
    alt: (name) => `${name}, as a Nassi–Shneiderman diagram`,
    editor: 'Editor',
    guide: 'User guide',
    made: 'Every diagram here was drawn with AriadneNSD, a free NS chart editor.',
  },
  ko: {
    title: '알고리즘 갤러리',
    description: (n) =>
      `이진 탐색부터 Raft까지 알고리즘 ${n}개를 NS 차트(Nassi–Shneiderman 다이어그램)로 그렸습니다. 어느 것이든 AriadneNSD 편집기에서 열어 고쳐 볼 수 있습니다.`,
    lead: (n) =>
      `이진 탐색부터 Raft까지 알고리즘 ${n}개를 NS 차트(Nassi–Shneiderman 다이어그램)로 그렸습니다. 어느 것이든 편집기에서 열어 고쳐 볼 수 있습니다.`,
    category: { classic: '고전', hard: '어려운 것', fun: '재미' },
    listLabel: '알고리즘',
    pick: '알고리즘',
    keys: '↑ ↓ 로 넘겨 보기',
    open: '편집기에서 열기',
    download: '.ns.svg 받기',
    about:
      '.ns.svg 파일은 어디서나 보이는 그림이면서, AriadneNSD에서 다시 열어 편집할 수 있습니다.',
    wide: '넓은 그림: 옆으로 스크롤해 보세요.',
    alt: (name) => `${name}의 NS 차트`,
    editor: '편집기',
    guide: '사용법',
    made: '여기의 그림은 모두 무료 NS 차트 편집기 AriadneNSD로 그렸습니다.',
  },
  de: {
    title: 'Algorithmengalerie',
    description: (n) =>
      `${n} Algorithmen, von der binären Suche bis Raft, als Struktogramme (Nassi-Shneiderman-Diagramme) gezeichnet. Öffnen Sie jeden davon im Editor AriadneNSD und ändern Sie ihn.`,
    lead: (n) =>
      `${n} Algorithmen, von der binären Suche bis Raft, als Struktogramme (Nassi-Shneiderman-Diagramme) gezeichnet. Öffnen Sie jeden davon im Editor und ändern Sie ihn.`,
    category: { classic: 'Klassiker', hard: 'Die schweren', fun: 'Zum Spaß' },
    listLabel: 'Algorithmen',
    pick: 'Algorithmus',
    keys: '↑ ↓ zum Blättern',
    open: 'Im Editor öffnen',
    download: '.ns.svg herunterladen',
    about:
      'Eine .ns.svg-Datei ist ein Bild, das überall angezeigt wird, und AriadneNSD öffnet sie wieder zum Bearbeiten.',
    wide: 'Breites Diagramm: seitlich scrollen.',
    alt: (name) => `${name} als Struktogramm`,
    editor: 'Editor',
    guide: 'Benutzerhandbuch',
    made: 'Alle Diagramme hier wurden mit AriadneNSD gezeichnet, einem kostenlosen Struktogramm-Editor.',
  },
};

/** Where each page sits, relative paths from it, and its absolute address. */
const pages = [
  {
    lang: 'en',
    out: 'index.html',
    up: '',
    app: '../',
    manual: '../manual/',
    url: `${site}/gallery/`,
  },
  {
    lang: 'ko',
    out: 'ko/index.html',
    up: '../',
    app: '../../',
    manual: '../../manual/ko/',
    url: `${site}/gallery/ko/`,
  },
  {
    lang: 'de',
    out: 'de/index.html',
    up: '../',
    app: '../../',
    manual: '../../manual/de/',
    url: `${site}/gallery/de/`,
  },
];

/** The relative address of the page in `lang` from `page`. */
const pathTo = (page, lang) => `${page.up}${lang === 'en' ? '' : `${lang}/`}` || './';

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

/** Reads gallery.json and fails loudly on an entry the page cannot show. */
async function readEntries() {
  const entries = JSON.parse(await readFile(new URL('gallery.json', generated), 'utf8'));
  if (!Array.isArray(entries) || entries.length === 0)
    throw new Error('gallery.json has no entries');
  for (const entry of entries) {
    if (!categories.includes(entry.category)) {
      throw new Error(`gallery.json: ${entry.id} has an unknown category "${entry.category}"`);
    }
    for (const lang of langs) {
      for (const field of ['name', 'what', 'files', 'links']) {
        if (typeof entry[field]?.[lang] !== 'string') {
          throw new Error(`gallery.json: ${entry.id} has no ${field}.${lang}`);
        }
      }
      if (typeof entry.sizes?.[lang]?.width !== 'number') {
        throw new Error(`gallery.json: ${entry.id} has no sizes.${lang}`);
      }
    }
  }
  if (!entries.some((entry) => entry.id === defaultId)) {
    throw new Error(`gallery.json has no ${defaultId} (the default entry)`);
  }
  return entries;
}

function render(page, entries, css, script) {
  const t = text[page.lang];
  const n = entries.length;
  const groups = categories
    .map((category) => ({ category, items: entries.filter((e) => e.category === category) }))
    .filter((group) => group.items.length > 0);

  const item = (entry) => {
    const size = entry.sizes[page.lang];
    return `<li><a href="#${escapeHtml(entry.id)}" data-id="${escapeHtml(entry.id)}" data-what="${escapeHtml(entry.what[page.lang])}" data-file="${page.up}files/${escapeHtml(entry.files[page.lang])}" data-link="${escapeHtml(entry.links[page.lang])}" data-w="${String(size.width)}" data-h="${String(size.height)}">${escapeHtml(entry.name[page.lang])}</a></li>`;
  };
  const list = groups
    .map(
      ({ category, items }) =>
        `<h2>${escapeHtml(t.category[category])}</h2>\n<ul>\n${items.map(item).join('\n')}\n</ul>`,
    )
    .join('\n');
  const options = groups
    .map(
      ({ category, items }) =>
        `<optgroup label="${escapeHtml(t.category[category])}">${items
          .map(
            (entry) =>
              `<option value="${escapeHtml(entry.id)}">${escapeHtml(entry.name[page.lang])}</option>`,
          )
          .join('')}</optgroup>`,
    )
    .join('');

  const first = entries.find((entry) => entry.id === defaultId);
  const firstSize = first.sizes[page.lang];
  const firstFile = `${page.up}files/${first.files[page.lang]}`;
  const description = t.description(n);
  const ogImage = `${site}/gallery/og-image.png`;
  const others = pages.filter((p) => p.lang !== page.lang);
  const alternates = others
    .map((p) => `<link rel="alternate" hreflang="${p.lang}" href="${p.url}" />`)
    .join('\n');
  const langLinks = others
    .map(
      (p) =>
        `<a class="lang" href="${pathTo(page, p.lang)}" hreflang="${p.lang}" lang="${p.lang}">${escapeHtml(langNames[p.lang])}</a>`,
    )
    .join('');

  return `<!doctype html>
<html lang="${page.lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(t.title)} – AriadneNSD</title>
<meta name="description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${page.url}" />
<link rel="alternate" hreflang="${page.lang}" href="${page.url}" />
${alternates}
<link rel="icon" href="${page.up}logo.svg" type="image/svg+xml" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="AriadneNSD" />
<meta property="og:title" content="${escapeHtml(t.title)} – AriadneNSD" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${page.url}" />
<meta property="og:image" content="${ogImage}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="${ogLocales[page.lang]}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(t.title)} – AriadneNSD" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${ogImage}" />
<style>
${css.trim()}
</style>
</head>
<body>
<header class="top">
<a class="brand" href="${page.app}"><img src="${page.up}logo.svg" width="30" height="30" alt="" /><img class="word" src="${page.up}wordmark.svg" width="149" height="19" alt="AriadneNSD" /></a>
<nav class="links"><a href="${page.app}">${escapeHtml(t.editor)}</a><a href="${page.manual}">${escapeHtml(t.guide)}</a><a href="${github}">GitHub</a>${langLinks}</nav>
</header>
<div class="intro">
<h1>${escapeHtml(t.title)}</h1>
<p class="lead">${escapeHtml(t.lead(n))}</p>
</div>
<div class="split">
<nav class="list" aria-label="${escapeHtml(t.listLabel)}">
${list}
<p class="keys" aria-hidden="true">${escapeHtml(t.keys)}</p>
</nav>
<main class="view">
<label class="pick"><span>${escapeHtml(t.pick)}</span><select>${options}</select></label>
<div class="head">
<h2 id="name">${escapeHtml(first.name[page.lang])}</h2>
<p id="what">${escapeHtml(first.what[page.lang])}</p>
</div>
<div class="actions">
<a id="open" class="button fill" href="${escapeHtml(first.links[page.lang])}">${escapeHtml(t.open)}</a>
<a id="download" class="button" href="${escapeHtml(firstFile)}" download="${escapeHtml(first.id)}.ns.svg">${escapeHtml(t.download)}</a>
</div>
<p class="wide-note" id="wide" hidden>${escapeHtml(t.wide)}</p>
<div class="pic" id="pic" tabindex="0">
<img id="diagram" width="${String(firstSize.width)}" height="${String(firstSize.height)}" alt="${escapeHtml(t.alt(first.name[page.lang]))}" />
<noscript><img src="${escapeHtml(firstFile)}" width="${String(firstSize.width)}" height="${String(firstSize.height)}" alt="${escapeHtml(t.alt(first.name[page.lang]))}" /></noscript>
</div>
<p class="about">${escapeHtml(t.about)}</p>
</main>
</div>
<footer class="foot">
<p>${escapeHtml(t.made)}</p>
<p><a href="${page.app}">${escapeHtml(t.editor)}</a> · <a href="${page.manual}">${escapeHtml(t.guide)}</a> · <a href="${github}">GitHub</a></p>
</footer>
<script>
const galleryText = ${JSON.stringify({ title: `${t.title} – AriadneNSD`, alt: t.alt('{name}'), defaultId })};
${script.trim()}
</script>
<!-- Cloudflare Web Analytics: counts page views without cookies. Loaded only on the real site, never on localhost or in tests. -->
<script>
  // ?nocount keeps this browser out of the count, ?count counts it again.
  var cfOff = false;
  try {
    var cfKey = 'ariadne-nsd.setting.nocount', cfQuery = new URLSearchParams(location.search);
    if (cfQuery.has('nocount')) localStorage.setItem(cfKey, 'true');
    else if (cfQuery.has('count')) localStorage.removeItem(cfKey);
    cfOff = localStorage.getItem(cfKey) === 'true';
  } catch (e) {}
  if (!cfOff && /(^|[.])ariadnensd[.]com$/.test(location.hostname)) {
    var cfBeacon = document.createElement('script');
    cfBeacon.type = 'module';
    cfBeacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    cfBeacon.setAttribute('data-cf-beacon', '{"token": "b248de05a82341d081728426e6cc5878"}');
    document.body.appendChild(cfBeacon);
  }
</script>
<!-- End Cloudflare Web Analytics -->
</body>
</html>
`;
}

const entries = await readEntries();
const css = await readFile(new URL('pages/style.css', root), 'utf8');
const script = await readFile(new URL('pages/gallery.js', root), 'utf8');

// Empties dist/ rather than removing it, so a local server started in it keeps serving.
await mkdir(dist, { recursive: true });
for (const name of await readdir(dist)) {
  await rm(new URL(name, dist), { recursive: true, force: true });
}
for (const folder of ['ko/', 'de/', 'files/']) {
  await mkdir(new URL(folder, dist), { recursive: true });
}
for (const entry of entries) {
  for (const lang of langs) {
    const file = entry.files[lang];
    await cp(new URL(file, generated), new URL(`files/${file}`, dist));
  }
}
await cp(new URL('2026-10-10-logo-aegean-lady-tiny.svg', journalAssets), new URL('logo.svg', dist));
await cp(
  new URL('2026-10-11-wordmark-n1-warm-grey.svg', journalAssets),
  new URL('wordmark.svg', dist),
);
await cp(new URL('pages/og-image.png', root), new URL('og-image.png', dist));
for (const page of pages) {
  await writeFile(new URL(page.out, dist), render(page, entries, css, script));
}
process.stdout.write(
  `gallery: ${String(entries.length)} entries → dist/index.html (en), dist/ko/index.html (ko), dist/de/index.html (de)\n`,
);
