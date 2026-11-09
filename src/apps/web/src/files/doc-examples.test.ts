// The examples in the documents, run as tests (doctest): /llms.txt and the short guide in the first
// page (R-WEB-10, UX LG1 ~ LG3), and the file format spec (docs/05-spec/). Models copy these
// examples, so when the format changes and an example no longer opens, `pnpm test` fails.
//
// Every ```json block is opened with the app's parser (`parseModel`): a whole model as it is, a
// share link's envelope by its model, and a single block inside a model around it. A block that is
// not one of these (an outline with "…") must say so on the line before it:
//   <!-- doctest: skip: why -->
// Every share link (`ns1.u.` · `ns1.j.` · `ns1.d.`) is read as the app reads one (`readShareLink`).
// The guide's lists of values come from core when it is filled (llms-guide.ts), as the build does.

import { blockKinds, openSvgFile, parseModel, parseModelJson } from '@ariadne-nsd/core';
import schema from '@ariadne-nsd/core/model.schema.json';
import { Ajv2020 } from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';

import pageTemplate from '../../index.html?raw';
import guideTemplate from '../../guide/llms.txt?raw';
import { shellMessage } from '../shell/messages';
import { fillGuide, guideValues } from './llms-guide';
import { browserDeflate, readShareLink } from './share-link';

const validate = new Ajv2020({ strict: true }).compile(schema);
const site = 'https://ariadnensd.com/';
const guide = fillGuide(guideTemplate);
const page = fillGuide(pageTemplate);
const specs = import.meta.glob<string>('../../../../../docs/05-spec/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

type Example = { readonly line: number; readonly text: string; readonly skip: string | null };

/** The ```json blocks of a text, with the reason when the line before says to skip it. */
function jsonExamples(text: string): Example[] {
  const lines = text.split('\n');
  const examples: Example[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index]?.trim() !== '```json') {
      continue;
    }
    const end = lines.findIndex((line, at) => at > index && line.trim() === '```');
    const before = [...lines.slice(0, index)].reverse().find((line) => line.trim() !== '') ?? '';
    const skip = /<!-- doctest: skip: (.+?) -->/.exec(before)?.[1] ?? null;
    examples.push({ line: index + 1, text: lines.slice(index + 1, end).join('\n'), skip });
    index = end;
  }
  return examples;
}

/** The share links of a text, each up to the first character that cannot be in one. */
function linksIn(text: string): string[] {
  return [...text.matchAll(/#(ns1\.[ujd]\.[^\s<>`)"]+)/g)].map((match) => match[1] ?? '');
}

/** A whole model around one block, as the guide's "Model JSON" shows it. */
function modelAround(block: unknown): unknown {
  return {
    format: 'ariadne-nsd',
    version: 1,
    settings: { textKind: 'plain', theme: 'default', headStyle: 'title', locale: 'en' },
    diagrams: [{ id: 'd1', body: [block] }],
    view: { folded: [], opened: [], bands: true, resultSymbol: '←' },
  };
}

/** The model an example stands for: itself, the model of an envelope, or one around a block. */
function modelOf(example: Example): unknown {
  const value = JSON.parse(example.text) as Record<string, unknown>;
  if ('format' in value) {
    return value;
  }
  if ('name' in value && 'model' in value) {
    return value.model;
  }
  if ('kind' in value) {
    return modelAround(value);
  }
  throw new Error(`line ${String(example.line)}: not a model, an envelope or a block`);
}

/** Opens every example of a text; returns how many were opened and how many skipped. */
function checkExamples(text: string, where: string): { opened: number; skipped: number } {
  let opened = 0;
  let skipped = 0;
  for (const example of jsonExamples(text)) {
    const at = `${where}:${String(example.line)}`;
    if (example.skip !== null) {
      skipped += 1;
      continue;
    }
    const model = modelOf(example);
    const parsed = parseModelJson(JSON.stringify(model));
    expect(parsed.ok ? '' : `${parsed.reason}: ${parsed.detail}`, at).toBe('');
    expect(validate(model) ? '' : JSON.stringify(validate.errors), at).toBe('');
    opened += 1;
  }
  return { opened, skipped };
}

async function checkLinks(text: string, where: string): Promise<number> {
  const links = linksIn(text);
  for (const fragment of links) {
    const read = await readShareLink(fragment, browserDeflate());
    const at = `${where}: ${fragment.slice(0, 40)}…`;
    expect(read.ok ? '' : `${read.reason}: ${read.detail}`, at).toBe('');
    if (read.ok) {
      const parsed = parseModel(read.model);
      expect(parsed.ok ? '' : `${parsed.reason}: ${parsed.detail}`, at).toBe('');
      expect(validate(read.model) ? '' : JSON.stringify(validate.errors), at).toBe('');
    }
  }
  return links.length;
}

describe('the examples in the documents (doctest)', () => {
  it('T-1132 · R-WEB-10 · UX LG1: every share link in /llms.txt and in the first page opens and passes the schema', async () => {
    expect(await checkLinks(guide, 'llms.txt')).toBe(1);
    expect(await checkLinks(page, 'index.html')).toBe(1);
  });

  it('T-1134 · R-WEB-10 · UX LG3: every JSON example in /llms.txt opens, or says why it is not checked', () => {
    expect(checkExamples(guide, 'llms.txt')).toEqual({ opened: 2, skipped: 1 });
  });

  it('T-1144 · R-FMT-02: every JSON example and share link in the file format spec opens, or says why it is not checked', async () => {
    const files = Object.entries(specs);
    expect(files.length).toBeGreaterThan(0);
    let opened = 0;
    for (const [path, text] of files) {
      opened += checkExamples(text, path).opened;
      await checkLinks(text, path);
    }
    expect(opened).toBeGreaterThan(0);
  });

  it('T-1145: a JSON example that is broken or not a model fails, unless marked to skip', () => {
    const broken = '```json\n{"format":"ariadne-nsd","version":1}\n```\n';
    expect(() => {
      checkExamples(broken, 'test');
    }).toThrow();
    expect(() => {
      checkExamples('```json\n[1, 2]\n```\n', 'test');
    }).toThrow(/not a model/);
    const skipped = `<!-- doctest: skip: an outline -->\n\n\`\`\`json\n{ … }\n\`\`\`\n`;
    expect(checkExamples(skipped, 'test')).toEqual({ opened: 0, skipped: 1 });
  });
});

describe('the guide for AI assistants', () => {
  it('T-1133 · R-WEB-10 · UX LG1: each example link is made from the exact model shown beside it', async () => {
    const [shown] = jsonExamples(guide).filter((example) => example.text.startsWith('{"format"'));
    const read = await readShareLink(linksIn(guide)[0] ?? '', null);
    expect(read.ok && read.model).toEqual(JSON.parse(shown?.text ?? 'null'));
    const pageModel =
      /MODEL, smallest example, and its link:<\/p>\s*<pre>\s*(\{.*\})\s*<\/pre>/.exec(page)?.[1];
    const pageRead = await readShareLink(linksIn(page)[0] ?? '', null);
    expect(pageRead.ok && pageRead.model).toEqual(JSON.parse(pageModel ?? 'null'));
  });

  it('T-1146 · R-WEB-10: its lists of values are filled from core’s lists, and its block table has every kind', () => {
    for (const values of Object.values(guideValues)) {
      expect(values.length).toBeGreaterThan(1);
    }
    expect(guide).toContain(
      `The block kinds are ${blockKinds.map((kind) => `\`${kind}\``).join(', ')}.`,
    );
    expect(page).toContain(`Blocks (${blockKinds.join(', ')})`);
    const table = guide.slice(
      guide.indexOf('| Block | JSON |'),
      guide.indexOf('\n\n', guide.indexOf('| Block | JSON |')),
    );
    const kinds = [...table.matchAll(/"kind":"(\w+)"/g)].map((match) => match[1]);
    expect(kinds.filter((kind) => kind !== 'named')).toEqual([...blockKinds]);
    expect(() => fillGuide('{{nothing}}')).toThrow(/unknown list/);
    expect(() => fillGuide('{{textKinds|bold}}')).toThrow(/unknown style/);
    expect(fillGuide('{{locales|or}}, {{locales|plain}}')).toBe('`en` or `ko`, en, ko');
  });

  it('T-1135 · R-WEB-10: the file the guide offers instead of a link opens', () => {
    const template = /```xml\n([\s\S]*?)```/.exec(guide)?.[1] ?? '';
    const [model] = jsonExamples(guide).filter((example) => example.text.startsWith('{"format"'));
    const file = template.replace('...model JSON...', model?.text.trim() ?? '');
    expect(openSvgFile(file)).toMatchObject({ ok: true });
  });

  it('T-1136 · R-WEB-10 · UX LG1: the first page points to the guide and keeps the short one hidden in the app’s root', () => {
    expect(page).toMatch(/<link rel="alternate" type="text\/markdown" href="\/llms\.txt"/);
    expect(page).toMatch(/<meta\s+name="description"\s+content="[^"]*\/llms\.txt/);
    const root = page.slice(page.indexOf('<div id="root">'), page.indexOf('<script'));
    expect(root).toContain('<section id="for-ai" hidden>');
    expect(root).toContain('You cannot operate this editor. Give the user a share link instead');
    expect(root).toContain(`${site}llms.txt`);
  });

  it('T-1137 · R-WEB-10: quotes the menu and button names the app shows', () => {
    for (const locale of ['en', 'ko'] as const) {
      expect(guide).toContain(shellMessage(locale, 'command.share'));
      expect(guide).toContain(shellMessage(locale, 'choice.copyReason'));
    }
    expect(guide).toContain(`${site}model.schema.json`);
  });
});
