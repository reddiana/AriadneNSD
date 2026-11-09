// The co-change check (coding guide 13): pairs of places that must change together, such as the
// key table and the keymap document. The pairs are data, scripts/co-change.json. When a change
// touches a rule's `when` side and none of its `then` side, the rule is reported; a commit that
// has a reason not to touch the other side says so in a trailer of its message, one line per id:
//
//   Co-change-skip: C2 — only the wording of the spec changed
//
// (maintainer, 2026-11-10: "작업이 커져서 앞으로 문서나 `/llms.txt`의 정합성이 안 맞을 것이
// 걱정됩니다." and on the survey: "함께 고치게 하세요")
//
// Run in src/:
//   node scripts/co-change.mjs                      the staged changes (git diff --cached)
//   node scripts/co-change.mjs --range A..B         every change from A to B, with their messages
//   node scripts/co-change.mjs --range A..B --warn  the same, as GitHub warnings, never failing
//   node scripts/co-change.mjs --write              writes the rule table into the coding guide
//   node scripts/co-change.mjs --check              fails if that table or the rules are stale
// `--message <text>` or `--message-file <path>` gives the commit message for the staged check.
//
// Test files are left out of `when`: a test that changes alone does not ask for documents.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const src = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = join(src, '..');
const rulesFile = join(src, 'scripts/co-change.json');
const guideFile = join(repo, 'docs/07-coding-guide/07-coding-guide.md');
const tableStart = '<!-- co-change:start -->';
const tableEnd = '<!-- co-change:end -->';

/** The rules of scripts/co-change.json. */
export function loadRules() {
  return JSON.parse(readFileSync(rulesFile, 'utf8')).rules;
}

const escapeRegExp = (text) => text.replace(/[.+^$()|[\]\\]/g, '\\$&');

/** A glob of repository paths as a regular expression: `*`, `**`, `?` and `{a,b}`. */
export function globToRegExp(glob) {
  let pattern = '';
  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i];
    if (char === '*' && glob[i + 1] === '*') {
      i += 1;
      if (glob[i + 1] === '/') {
        i += 1;
        pattern += '(?:.*/)?';
      } else {
        pattern += '.*';
      }
    } else if (char === '*') {
      pattern += '[^/]*';
    } else if (char === '?') {
      pattern += '[^/]';
    } else if (char === '{') {
      const end = glob.indexOf('}', i);
      if (end === -1) throw new Error(`unclosed { in ${glob}`);
      pattern += `(?:${glob
        .slice(i + 1, end)
        .split(',')
        .map((part) => escapeRegExp(part))
        .join('|')})`;
      i = end;
    } else {
      pattern += escapeRegExp(char);
    }
  }
  return new RegExp(`^${pattern}$`);
}

const matchesAny = (path, globs) => globs.some((glob) => globToRegExp(glob).test(path));

/** Tests and their data: a test that changes alone does not ask for the documents. */
export function isTestFile(path) {
  return /\.(test|spec|bench)\.[cm]?[jt]sx?$/.test(path) || /(^|\/)e2e\//.test(path);
}

/**
 * The `Co-change-skip:` trailers of a commit message: the rule ids skipped with a reason, and the
 * trailers that are not well formed (no reason, `*`, several ids, an id with no rule).
 */
export function readSkips(message, rules) {
  const ids = new Set(rules.map((rule) => rule.id));
  const skipped = new Map();
  const problems = [];
  for (const line of message.split(/\r?\n/)) {
    const trailer = /^\s*Co-change-skip:\s*(.*)$/i.exec(line);
    if (trailer === null) continue;
    const parts = /^(\S+?)\s*(?:—|–|--|-)\s*(\S.*)$/.exec(trailer[1].trim());
    if (parts === null) {
      problems.push(`"${line.trim()}": write one id and its reason, "Co-change-skip: C2 — why"`);
    } else if (!ids.has(parts[1])) {
      problems.push(`"${line.trim()}": ${parts[1]} is not a rule (one id per line, no *)`);
    } else {
      skipped.set(parts[1], parts[2].trim());
    }
  }
  return { skipped, problems };
}

/**
 * The rules a set of changed paths breaks: a path of `when` changed (tests left out) and no path
 * of `then` did, and the commit message does not skip the rule.
 */
export function checkChanges(paths, message, rules) {
  const { skipped, problems } = readSkips(message, rules);
  const broken = [];
  for (const rule of rules) {
    const causes = paths.filter((path) => !isTestFile(path) && matchesAny(path, rule.when));
    if (causes.length === 0 || paths.some((path) => matchesAny(path, rule.then))) continue;
    if (skipped.has(rule.id)) continue;
    broken.push({ rule, causes });
  }
  return { broken, problems };
}

/** One broken rule as lines of text. */
export function describe({ rule, causes }) {
  return [
    `${rule.id}: ${causes.join(', ')} changed, but none of: ${rule.then.join(', ')}`,
    `  why: ${rule.why}`,
    `  If they need no change, add to the commit message: Co-change-skip: ${rule.id} — <reason>`,
  ].join('\n');
}

const git = (...args) =>
  execFileSync('git', args, { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const lines = (text) => text.split('\n').filter((line) => line !== '');

/** A table cell for a path: a link for a document of the vault, the path otherwise. */
function pathCell(path) {
  const adr = /^atelier\/adr\/((\d{4})-[^/*{]+)\.md$/.exec(path);
  if (adr !== null) return `[[${adr[1]}\\|ADR-${adr[2]}]]`;
  const doc = /^(?:docs|atelier)\/(?:[^/]+\/)*([^/*{]+)\.md$/.exec(path);
  if (doc !== null && doc[1] !== 'README') return `[[${doc[1]}]]`;
  return `\`${path}\``;
}

/** The rule table of coding guide 13, between its two markers. */
export function ruleTable(rules) {
  return [
    tableStart,
    '',
    '| ID | 이것이 바뀌면 | 이것도 본다 | 까닭 |',
    '| --- | --- | --- | --- |',
    ...rules.map(
      (rule) =>
        `| ${rule.id} | ${rule.when.map(pathCell).join('<br>')} | ${rule.then
          .map(pathCell)
          .join('<br>')} | ${rule.why.replace(/\|/g, '\\|')} |`,
    ),
    '',
    tableEnd,
  ].join('\n');
}

/** The rules' own problems: ids, fields, and globs that match no file of the repository. */
function ruleProblems(rules) {
  const files = lines(git('ls-files'));
  const problems = [];
  const seen = new Set();
  for (const rule of rules) {
    if (!/^C\d+$/.test(rule.id ?? '')) problems.push(`${String(rule.id)}: an id is C and a number`);
    if (seen.has(rule.id)) problems.push(`${rule.id}: used twice`);
    seen.add(rule.id);
    if (typeof rule.why !== 'string' || rule.why === '') problems.push(`${rule.id}: no why`);
    for (const side of ['when', 'then']) {
      if (!Array.isArray(rule[side]) || rule[side].length === 0)
        problems.push(`${rule.id}: no ${side}`);
      for (const glob of rule[side] ?? []) {
        const pattern = globToRegExp(glob);
        if (!files.some((file) => pattern.test(file)))
          problems.push(`${rule.id}: ${side} "${glob}" matches no file`);
      }
    }
  }
  return problems;
}

function withTable(text, rules) {
  const start = text.indexOf(tableStart);
  const end = text.indexOf(tableEnd);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`${guideFile}: no ${tableStart} … ${tableEnd} markers`);
  }
  return text.slice(0, start) + ruleTable(rules) + text.slice(end + tableEnd.length);
}

function argument(name) {
  const at = process.argv.indexOf(name);
  return at === -1 ? null : (process.argv[at + 1] ?? null);
}

function main() {
  const rules = loadRules();
  const args = process.argv.slice(2);

  if (args.includes('--write') || args.includes('--check')) {
    const problems = ruleProblems(rules);
    const before = readFileSync(guideFile, 'utf8').replaceAll('\r\n', '\n');
    const after = withTable(before, rules);
    if (args.includes('--write')) {
      if (after !== before) writeFileSync(guideFile, after);
      console.log(
        `Wrote the co-change table of docs/07-coding-guide: ${String(rules.length)} rules.`,
      );
    } else if (after !== before) {
      problems.push(
        'The co-change table in docs/07-coding-guide is out of date. Run `node scripts/co-change.mjs --write` in src/.',
      );
    }
    if (problems.length > 0) {
      console.error(problems.join('\n'));
      process.exit(1);
    }
    if (args.includes('--check'))
      console.log('The co-change rules and their table are up to date.');
    return;
  }

  const range = argument('--range');
  let paths;
  let message;
  if (range !== null) {
    // The whole range at once: a document may follow its code in a later commit of the same push.
    const [from, to] = range.split('..');
    paths = lines(git('diff', '--name-only', from, to));
    message = git('log', '--format=%B', range);
  } else {
    paths = lines(git('diff', '--cached', '--name-only'));
    const file = argument('--message-file');
    message = argument('--message') ?? (file === null ? '' : readFileSync(file, 'utf8'));
  }

  const { broken, problems } = checkChanges(paths, message, rules);
  if (args.includes('--warn')) {
    for (const problem of problems) console.log(`::warning title=co-change trailer::${problem}`);
    for (const each of broken) {
      const text = describe(each).replaceAll('\n', '%0A');
      console.log(`::warning title=co-change ${each.rule.id}::${text}`);
    }
    console.log(
      `co-change: ${String(paths.length)} files, ${String(broken.length)} rules to look at.`,
    );
    return;
  }
  if (broken.length > 0 || problems.length > 0) {
    console.error([...problems, ...broken.map(describe)].join('\n'));
    process.exit(1);
  }
  console.log(`co-change: ${String(paths.length)} files, nothing to look at.`);
}

const isMain =
  process.argv[1] !== undefined &&
  resolve(fileURLToPath(import.meta.url)).toLowerCase() === resolve(process.argv[1]).toLowerCase();
if (isMain) {
  main();
}
