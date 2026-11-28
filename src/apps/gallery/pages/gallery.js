/* global document, window, history, location, DOMParser, galleryText, snapCrispStrokes -- runs in the browser (the gallery page); build.mjs puts galleryText and crisp-lines.js before it */
// The algorithm gallery (M70, option G3): picks an entry from the list, shows its diagram and
// links, and keeps the choice in the address hash (#kmp) so a post can link to one diagram.
// The build inlines this file at the end of <body>, so the right picture is the first one asked for.
// The picture is the .ns.svg itself, put into the page rather than shown as an <img>, so its lines
// can be snapped to whole device pixels at the display scale like in the editor (M88,
// crisp-lines.js). The <img> is only the fallback when the file cannot be read.
const links = [...document.querySelectorAll('.list a[data-id]')];
const select = document.querySelector('.pick select');
const picture = document.getElementById('diagram');
const pic = document.getElementById('pic');
const wide = document.getElementById('wide');
const nameEl = document.getElementById('name');
const whatEl = document.getElementById('what');
const open = document.getElementById('open');
const download = document.getElementById('download');
// The language switch keeps the selected diagram.
const langLink = document.querySelector('.links .lang');
const langBase = langLink.getAttribute('href');

const byId = (id) => links.find((a) => a.dataset.id === id);
const fromHash = () => byId(decodeURIComponent(location.hash.slice(1)));

let current = null;
/** The diagram shown in the page (an <svg>), or null while there is none or the <img> shows it. */
let inline = null;
let shownWidth = picture.width;
const texts = new Map();
picture.hidden = true;

/** The text of a diagram file, read once. */
function readDiagram(file) {
  if (!texts.has(file)) {
    const text = fetch(file).then((response) => {
      if (!response.ok) throw new Error(`${file}: ${String(response.status)}`);
      return response.text();
    });
    texts.set(file, text);
    text.catch(() => texts.delete(file));
  }
  return texts.get(file);
}

/** Shows the diagram's own <svg> in the page, with its lines snapped to the display scale. */
function showInline(text, alt) {
  const parsed = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement;
  if (parsed.localName !== 'svg' || parsed.namespaceURI !== 'http://www.w3.org/2000/svg') {
    throw new Error('not an SVG file');
  }
  const svg = document.importNode(parsed, true);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', alt);
  snapCrispStrokes(svg, window.devicePixelRatio);
  if (inline === null) picture.after(svg);
  else inline.replaceWith(svg);
  inline = svg;
  picture.hidden = true;
}

/** Shows the file as an <img> when it cannot be put into the page. */
function showImage(file) {
  inline?.remove();
  inline = null;
  picture.hidden = false;
  picture.src = file;
}

// The display scale changes with the browser zoom and when the window moves to another screen.
function watchScale() {
  window.matchMedia(`(resolution: ${String(window.devicePixelRatio)}dppx)`).addEventListener(
    'change',
    () => {
      if (inline !== null) snapCrispStrokes(inline, window.devicePixelRatio);
      watchScale();
    },
    { once: true },
  );
}
watchScale();

function show(link) {
  if (link === current) return;
  current = link;
  const { id, what, file, link: share, w, h } = link.dataset;
  for (const a of links) {
    if (a === link) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  }
  select.value = id;
  langLink.setAttribute('href', `${langBase}#${id}`);
  nameEl.textContent = link.textContent;
  whatEl.textContent = what;
  open.href = share;
  download.href = file;
  download.setAttribute('download', `${id}.ns.svg`);
  const alt = galleryText.alt.replace('{name}', link.textContent);
  picture.alt = alt;
  picture.width = Number(w);
  picture.height = Number(h);
  shownWidth = Number(w);
  readDiagram(file)
    .then((text) => {
      if (current === link) showInline(text, alt);
    })
    .catch(() => {
      if (current === link) showImage(file);
    });
  pic.scrollLeft = 0;
  document.title = `${link.textContent} – ${galleryText.title}`;
  updateWide();
  // Keep the selected entry visible in a list that scrolls on its own.
  link.scrollIntoView({ block: 'nearest' });
}

function updateWide() {
  wide.hidden = shownWidth <= pic.clientWidth;
}

/** Selects an entry from a click or key: the hash follows without adding history on every key. */
function choose(link, { push }) {
  if (link === undefined) return;
  const hash = `#${link.dataset.id}`;
  if (location.hash !== hash) {
    if (push) history.pushState(null, '', hash);
    else history.replaceState(null, '', hash);
  }
  show(link);
}

for (const a of links) {
  a.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    choose(a, { push: true });
  });
  // Fetch the picture early while the pointer rests on the entry.
  a.addEventListener(
    'pointerenter',
    () => {
      const hint = document.createElement('link');
      hint.rel = 'prefetch';
      hint.href = a.dataset.file;
      document.head.append(hint);
    },
    { once: true },
  );
}

select.addEventListener('change', () => {
  choose(byId(select.value), { push: true });
});

window.addEventListener('hashchange', () => {
  show(fromHash() ?? byId(galleryText.defaultId));
});
window.addEventListener('popstate', () => {
  show(fromHash() ?? byId(galleryText.defaultId));
});
window.addEventListener('resize', updateWide);

// ↑ ↓ (and Home, End) move through the list, from the list or from nowhere in particular. Inside
// the picture the keys scroll it, and in the select they belong to the select.
document.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const target = event.target;
  const inList = target instanceof window.Element && target.closest('.list') !== null;
  if (!inList && target !== document.body) return;
  const index = links.indexOf(current);
  let next;
  if (event.key === 'ArrowDown') next = links[Math.min(index + 1, links.length - 1)];
  else if (event.key === 'ArrowUp') next = links[Math.max(index - 1, 0)];
  else if (event.key === 'Home' && inList) next = links[0];
  else if (event.key === 'End' && inList) next = links[links.length - 1];
  else return;
  event.preventDefault();
  choose(next, { push: false });
  if (inList) next.focus();
});

show(fromHash() ?? byId(galleryText.defaultId));
