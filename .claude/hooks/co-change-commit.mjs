// Claude Code hook (PreToolUse, Bash and PowerShell): before a `git commit` runs, checks the
// changes it will commit against the co-change rules (src/scripts/co-change.json, coding guide 13).
// When a rule's `when` side changed and none of its `then` side, the commit is stopped (exit 2)
// and the message tells Claude what to look at: change the other side too, or add a trailer to
// the commit message, one line per rule, with the reason:
//
//   Co-change-skip: C2 — only the wording of the spec changed
//
// The trailers are read from the command itself (`-m "…"`, a here-string or `-F <file>`).
// Any other command passes untouched. If the check itself cannot run, the commit passes too:
// CI runs the same check on every push.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return null;
  }
}

const input = readStdin();
const command = typeof input?.tool_input?.command === 'string' ? input.tool_input.command : '';
// `git commit`, also after `cd … &&` or with options before `commit` (`git -c x=y commit`).
const commit = /(?:^|[\s;&|(])git(?:\s+-[^\s]+(?:\s+[^\s-][^\s]*)?)*\s+commit(?=\s|$)/m.exec(
  command,
);
if (commit === null) process.exit(0);

const git = (...args) =>
  execFileSync('git', args, { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const lines = (text) => text.split('\n').filter((line) => line !== '');

try {
  const { checkChanges, describe, loadRules } = await import(
    pathToFileURL(join(repo, 'src/scripts/co-change.mjs')).href
  );
  const after = command.slice(commit.index);
  const paths = new Set(lines(git('diff', '--cached', '--name-only')));
  // `-a` / `--all` (also `-am`) commits every changed tracked file.
  if (/\s(?:--all|-[a-zA-Z]*a[a-zA-Z]*)(?=\s|$)/.test(after)) {
    for (const path of lines(git('diff', '--name-only', 'HEAD'))) paths.add(path);
  }
  let message = command;
  // `--amend` rewrites the last commit: its files and message are part of the new one.
  if (/\s--amend(?=\s|$)/.test(after)) {
    for (const path of lines(git('diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD')))
      paths.add(path);
    message += `\n${git('log', '-1', '--format=%B')}`;
  }
  const file = /\s(?:-F|--file)(?:\s+|=)("[^"]+"|'[^']+'|\S+)/.exec(after)?.[1];
  if (file !== undefined) {
    try {
      message += `\n${readFileSync(resolve(repo, file.replace(/^["']|["']$/g, '')), 'utf8')}`;
    } catch {
      // A message file we cannot read: only the command's own text is checked.
    }
  }

  const { broken, problems } = checkChanges([...paths], message, loadRules());
  if (broken.length > 0 || problems.length > 0) {
    process.stderr.write(
      [
        'co-change (coding guide 13): this commit changes one side of a pair and not the other.',
        ...problems,
        ...broken.map(describe),
      ].join('\n') + '\n',
    );
    process.exit(2);
  }
} catch (error) {
  process.stderr.write(`co-change hook could not run: ${String(error)}\n`);
}
process.exit(0);
