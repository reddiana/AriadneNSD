// Adds up the tokens and the session time of this project from Claude Code's local transcripts and
// writes atelier/sessions/usage.md. Run at every wrap-up:  node .claude/scripts/session-usage.mjs
//
// Claude Code removes old transcripts, so each day's numbers are kept in atelier/sessions/usage.json:
// a day is replaced only when the transcripts now show at least as many requests for it.
import { createReadStream, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const storePath = join(repo, 'atelier/sessions/usage.json');
const pagePath = join(repo, 'atelier/sessions/usage.md');
const projects = join(homedir(), '.claude', 'projects');

/** A pause longer than this is not session time. */
const idleMinutes = 30;

const dayOf = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });

function* transcripts(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* transcripts(path);
    else if (name.endsWith('.jsonl')) yield path;
  }
}

const emptyDay = () => ({ requests: 0, input: 0, cacheWrite: 0, cacheRead: 0, output: 0, minutes: 0, sessions: new Set() });

async function readTranscripts() {
  const days = new Map();
  const day = (key) => days.get(key) ?? days.set(key, emptyDay()).get(key);
  const seen = new Set();
  const times = new Set();
  const folders = readdirSync(projects).filter((name) => /AriadneNSD|ariadne-nsd|NSDrawing/i.test(name));
  for (const folder of folders) {
    for (const file of transcripts(join(projects, folder))) {
      const isMain = !/[\\/]subagents[\\/]/.test(file);
      for await (const line of createInterface({ input: createReadStream(file) })) {
        if (!line.includes('"timestamp"')) continue;
        let entry;
        try {
          entry = JSON.parse(line);
        } catch {
          continue;
        }
        if ((entry.type !== 'assistant' && entry.type !== 'user') || typeof entry.timestamp !== 'string') continue;
        const at = Date.parse(entry.timestamp);
        if (Number.isNaN(at)) continue;
        times.add(at);
        if (isMain && entry.sessionId) day(dayOf.format(at)).sessions.add(entry.sessionId);
        const usage = entry.type === 'assistant' ? entry.message?.usage : undefined;
        if (!usage || entry.message?.model === '<synthetic>') continue;
        // One response is written on several lines, and resumed sessions repeat earlier lines.
        const id = entry.message?.id ?? entry.uuid;
        if (seen.has(id)) continue;
        seen.add(id);
        const row = day(dayOf.format(at));
        row.requests += 1;
        row.input += usage.input_tokens ?? 0;
        row.cacheWrite += usage.cache_creation_input_tokens ?? 0;
        row.cacheRead += usage.cache_read_input_tokens ?? 0;
        row.output += usage.output_tokens ?? 0;
      }
    }
  }
  // Session time: the union over all transcripts, so agents running side by side count once.
  const sorted = [...times].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i += 1) {
    const gap = sorted[i] - sorted[i - 1];
    if (gap <= idleMinutes * 60_000) day(dayOf.format(sorted[i])).minutes += gap / 60_000;
  }
  return days;
}

const count = (n) => Math.round(n).toLocaleString('en-US');
const hours = (minutes) => (minutes / 60).toFixed(1);
const total = (r) => r.input + r.cacheWrite + r.cacheRead + r.output;

const store = existsSync(storePath) ? JSON.parse(readFileSync(storePath, 'utf8')) : { days: {} };
for (const [key, row] of await readTranscripts()) {
  if (row.requests >= (store.days[key]?.requests ?? 0)) {
    store.days[key] = {
      sessions: row.sessions.size,
      minutes: Math.round(row.minutes),
      requests: row.requests,
      input: row.input,
      cacheWrite: row.cacheWrite,
      cacheRead: row.cacheRead,
      output: row.output,
    };
  }
}
const keys = Object.keys(store.days).sort();
const sorted = Object.fromEntries(keys.map((key) => [key, store.days[key]]));
writeFileSync(storePath, `${JSON.stringify({ days: sorted }, null, 2)}\n`);

const records = readdirSync(join(repo, 'atelier/sessions')).filter((name) => /^\d{4}-\d{2}-\d{2}-\d{2}-.*\.md$/.test(name));
const first = keys[0];
const missing = records.filter((name) => name.slice(0, 10) < first);
const lastMissing = missing.map((name) => name.slice(0, 10)).sort().at(-1);

const sum = { sessions: 0, minutes: 0, requests: 0, input: 0, cacheWrite: 0, cacheRead: 0, output: 0 };
let runningMinutes = 0;
let runningTokens = 0;
const rows = keys.map((key) => {
  const r = store.days[key];
  for (const field of Object.keys(sum)) sum[field] += r[field];
  runningMinutes += r.minutes;
  runningTokens += total(r);
  return `| ${key} | ${r.sessions} | ${hours(r.minutes)} | ${count(r.input + r.cacheWrite)} | ${count(r.cacheRead)} | ${count(r.output)} | ${hours(runningMinutes)} | ${count(runningTokens)} |`;
});

const page = `---
title: 토큰과 세션 시간
tags:
  - plan
updated: ${keys.at(-1)}
---

# 토큰과 세션 시간

(← [[atelier/sessions/README|세션 기록]])

AriadneNSD를 만들면서 쓴 토큰과 세션 시간의 누적입니다. 마무리와 매듭 때 \`node .claude/scripts/session-usage.mjs\`가 Claude Code의 로컬 대화 기록에서 집계해 이 문서를 다시 만듭니다. 손으로 고치지 않습니다.

> [!warning] 집계하지 못한 기간
> 대화 기록은 ${first}부터 남아 있습니다. 그 전의 세션 기록 ${missing.length}개(2026-10-07 ~ ${lastMissing})는 토큰과 시간을 알 수 없어 **아래 누적에 들어 있지 않습니다.** 실제 누적은 이 값보다 큽니다.

## 누적 (${first} ~ ${keys.at(-1)})

| 항목 | 값 |
| --- | --- |
| 세션 시간 | **${hours(sum.minutes)}시간** |
| 작업한 날 | ${keys.length}일 |
| 모델 요청 | ${count(sum.requests)}회 |
| 입력 토큰 (캐시 쓰기 포함) | ${count(sum.input + sum.cacheWrite)} |
| 출력 토큰 | ${count(sum.output)} |
| 캐시 읽기 토큰 | ${count(sum.cacheRead)} |
| 토큰 합계 | **${count(sum.input + sum.cacheWrite + sum.cacheRead + sum.output)}** |

## 세는 법

- **세션 시간:** 메인테이너와 Claude, 에이전트의 활동 기록을 시간순으로 합쳐, 활동 사이의 간격을 더한 값입니다. ${idleMinutes}분이 넘게 쉰 간격은 빼고, 나란히 돈 에이전트의 시간은 한 번만 셉니다. 메인테이너가 화면을 보거나 생각한 시간은 ${idleMinutes}분 안이면 들어가고, 앱을 따로 써 본 시간처럼 대화 밖의 작업은 들어가지 않습니다.
- **토큰:** 메인 세션과 에이전트의 모든 모델 응답을 응답 하나당 한 번씩 셉니다.
- **캐시 읽기 토큰:** 대화가 이어질 때마다 앞의 내용을 다시 읽은 양이라 합계의 대부분을 차지합니다. 새로 처리한 양은 입력과 출력 토큰으로 보세요.
- **날짜:** 한국 시간 기준입니다. 첫 날(${first})은 그날의 기록이 일부만 남았을 수 있습니다.

## 날짜별

| 날짜 | 세션 | 시간 | 입력 (캐시 쓰기 포함) | 캐시 읽기 | 출력 | 누적 시간 | 누적 토큰 |
| --- | --- | --- | --- | --- | --- | --- | --- |
${rows.join('\n')}
`;
writeFileSync(pagePath, page);
console.log(`days ${keys.length}, hours ${hours(sum.minutes)}, requests ${count(sum.requests)}, tokens ${count(sum.input + sum.cacheWrite + sum.cacheRead + sum.output)}, missing records ${missing.length}`);
