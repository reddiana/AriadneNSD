// How much of the code the tests run, the unit and the browser tests together (07-testing).
// Runs each package's Vitest tests with V8 coverage, then the browser tests with coverage
// (apps/web `e2e:coverage`), and joins the two by source line: a line is covered when either ran
// it. Prints a table per package and the files with the most lines that no test runs.
//   pnpm coverage            run everything, then report
//   pnpm coverage --report   report the last run again
//   pnpm coverage --files 40 list 40 files instead of 20
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const packages = ['packages/core', 'packages/editor', 'packages/fonts', 'apps/web'];
const unitDir = 'coverage';
const e2eFile = 'apps/web/coverage-e2e/coverage-final.json';
const argument = (name) => process.argv[process.argv.indexOf(name) + 1];
const fileCount = process.argv.includes('--files') ? Number(argument('--files')) : 20;

function run(command, cwd) {
  const result = spawnSync(command, { cwd, stdio: 'inherit', shell: true });
  if (result.status !== 0) console.error(`"${command}" in ${cwd} failed; the coverage is partial.`);
}

if (!process.argv.includes('--report')) {
  for (const dir of packages) {
    run(
      [
        // Coverage slows the tests down; the property-based ones need more than the usual 5 s.
        'pnpm exec vitest run --testTimeout=60000 --coverage.enabled --coverage.provider=v8',
        '--coverage.reporter=json',
        `--coverage.reportsDirectory=${unitDir}`,
        "--coverage.include='src/**'",
        "--coverage.exclude='**/*.test.*'",
        "--coverage.exclude='**/*.bench.ts'",
      ].join(' '),
      dir,
    );
  }
  run('pnpm e2e:coverage', 'apps/web');
}

/** Test helpers are not the product: they are left out of the counts. */
const isHelper = (path) => /\.test\.|test-support|\/testing\.ts$/.test(path);

/** Source path from the workspace root (`packages/core/src/…`) → { lines with code, covered lines }. */
function linesOf(file, prefix = '') {
  const out = new Map();
  if (!existsSync(file)) {
    console.error(`${file} is missing; run without --report first.`);
    return out;
  }
  const data = JSON.parse(readFileSync(file, 'utf8'));
  for (const [key, entry] of Object.entries(data)) {
    const slashed = key.replaceAll('\\', '/');
    const at = slashed.indexOf(`${prefix}src/`);
    const path = /^[A-Za-z]:|^\//.test(slashed)
      ? prefix + slashed.slice(at + prefix.length)
      : slashed;
    if (isHelper(path)) continue;
    const code = new Set();
    const covered = new Set();
    for (const [id, location] of Object.entries(entry.statementMap)) {
      code.add(location.start.line);
      if (entry.s[id] > 0) covered.add(location.start.line);
    }
    out.set(path, { code, covered });
  }
  return out;
}

const unit = new Map();
for (const dir of packages) {
  for (const [path, lines] of linesOf(join(dir, unitDir, 'coverage-final.json'), `${dir}/`)) {
    unit.set(path, lines);
  }
}
const e2e = linesOf(e2eFile);

const none = { code: new Set(), covered: new Set() };
const totals = new Map(packages.map((dir) => [dir, { code: 0, unit: 0, e2e: 0, both: 0 }]));
const files = [];
for (const path of new Set([...unit.keys(), ...e2e.keys()])) {
  const u = unit.get(path) ?? none;
  const e = e2e.get(path) ?? none;
  // The unit run's statement lines when there are any: the two tools split statements a little
  // differently, and the unit run sees every file of the package.
  const code = u.code.size > 0 ? u.code : e.code;
  if (code.size === 0) continue;
  const count = (set) => [...set].filter((line) => code.has(line)).length;
  const row = {
    path,
    code: code.size,
    unit: count(u.covered),
    e2e: count(e.covered),
    both: count(new Set([...u.covered, ...e.covered])),
  };
  files.push(row);
  const total = totals.get(packages.find((dir) => path.startsWith(`${dir}/`)));
  if (total === undefined) continue;
  for (const key of ['code', 'unit', 'e2e', 'both']) total[key] += row[key];
}

const pct = (part, whole) => `${((100 * part) / whole).toFixed(1).padStart(5)}%`;
console.log('\nLines run by the tests (unit, browser, either)');
console.log('package           lines   unit    e2e    both');
for (const [dir, t] of totals) {
  if (t.code === 0) continue;
  console.log(
    `${dir.padEnd(16)} ${String(t.code).padStart(6)} ${pct(t.unit, t.code)} ${pct(t.e2e, t.code)} ${pct(t.both, t.code)}`,
  );
}
console.log(`\nThe ${String(fileCount)} files with the most lines no test runs`);
console.log('  missed / lines   either   unit    e2e   file');
files.sort((a, b) => b.code - b.both - (a.code - a.both));
for (const f of files.slice(0, fileCount)) {
  console.log(
    `  ${String(f.code - f.both).padStart(6)} / ${String(f.code).padEnd(5)} ${pct(f.both, f.code)} ${pct(f.unit, f.code)} ${pct(f.e2e, f.code)}   ${f.path}`,
  );
}
