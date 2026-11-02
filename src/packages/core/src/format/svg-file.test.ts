import { describe, expect, it } from 'vitest';

import type { Doc } from '../model/types';
import { findModelElement } from './model-element';
import type { Drawing } from './svg-file';
import { assembleSvgFile, openSvgFile } from './svg-file';

const docWithText = (text: string): Doc => ({
  content: {
    settings: { textKind: 'plain', theme: 'default', headStyle: 'shape' },
    diagrams: [
      { id: 'd1', head: null, body: { blocks: [{ id: 'b1', kind: 'process', text }], folds: [] } },
    ],
  },
  view: { folded: [], opened: [], bands: true, resultSymbol: '←' },
});

const drawing: Drawing = {
  width: 120,
  height: 40,
  viewBox: '0 0 120 40',
  paper: '#ffffff',
  content: '<g class="ans-render"><rect x="8" y="8" width="104" height="24"/></g>',
};

const wrap = (metadata: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg"><metadata>${metadata}</metadata></svg>`;

const model = (json: string, version = '1'): string =>
  `<ans:document xmlns:ans="https://github.com/reddiana/AriadneNSD" version="${version}">${json}</ans:document>`;

const minimalJson = JSON.stringify({
  format: 'ariadne-nsd',
  version: 1,
  settings: { textKind: 'plain', theme: 'default', headStyle: 'shape' },
  diagrams: [{ id: 'd1', body: [{ id: 'b1', kind: 'process', text: 'a < b' }] }],
  view: { folded: [], opened: [], bands: true, resultSymbol: '←' },
});

describe('SVG file', () => {
  it('01-file-format 2: assembles the documented structure', () => {
    const file = assembleSvgFile({
      doc: docWithText('x'),
      drawing,
      fonts: [{ family: 'AriadneNSD Mono', woff: new Uint8Array([119, 79, 70, 70]) }],
    });
    const lines = file.split('\n');
    expect(lines[0]).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="120" height="40" viewBox="0 0 120 40">',
    );
    expect(lines.slice(1, 3)).toEqual([
      '  <metadata>',
      '    <ans:document xmlns:ans="https://github.com/reddiana/AriadneNSD" version="1"><![CDATA[',
    ]);
    expect(lines[3]).toBe('{');
    expect(lines.slice(-10)).toEqual([
      '}',
      '    ]]></ans:document>',
      '  </metadata>',
      '  <style>',
      '    @font-face { font-family: "AriadneNSD Mono"; src: url(data:font/woff;base64,d09GRg==); }',
      '  </style>',
      '  <rect width="100%" height="100%" fill="#ffffff"/>',
      '  <g class="ans-render"><rect x="8" y="8" width="104" height="24"/></g>',
      '</svg>',
      '',
    ]);
    expect(file).not.toContain('\r');
  });

  it('R-FMT-03: the same parts give the same bytes', () => {
    const parts = { doc: docWithText('같은 글'), drawing, fonts: [] };
    expect(assembleSvgFile(parts)).toBe(assembleSvgFile(parts));
  });

  it('R-FMT-04: splits CDATA around ]]> and reads the text back whole', () => {
    const text = 'a]]>b]]>]]>c';
    const file = assembleSvgFile({ doc: docWithText(text), drawing, fonts: [] });
    expect(file).toContain('a]]]]><![CDATA[>b');
    const opened = openSvgFile(file);
    expect(opened.ok && opened.value.doc).toEqual(docWithText(text));
  });

  it('writes characters XML does not allow as JSON escapes', () => {
    const text = `x${String.fromCharCode(0xfffe)}y${String.fromCharCode(0xffff, 1, 0xd800)}`;
    const file = assembleSvgFile({ doc: docWithText(text), drawing, fonts: [] });
    for (const code of [0xfffe, 0xffff, 1]) {
      expect(file).not.toContain(String.fromCharCode(code));
    }
    const opened = openSvgFile(file);
    expect(opened.ok && opened.value.doc).toEqual(docWithText(text));
  });

  it('QA-04: opening and saving again gives the same model part', () => {
    const file = assembleSvgFile({
      doc: docWithText('i ← i + 1'),
      kept: { textKind: 'c99' },
      drawing,
      fonts: [],
    });
    const opened = openSvgFile(file);
    if (!opened.ok) {
      throw new Error(opened.detail);
    }
    expect(
      assembleSvgFile({ doc: opened.value.doc, kept: opened.value.kept, drawing, fonts: [] }),
    ).toBe(file);
  });

  it('01-file-format 1: opens a .ns file the same way (the content is the same)', () => {
    expect(openSvgFile(wrap(model(`<![CDATA[${minimalJson}]]>`))).ok).toBe(true);
    expect(
      openSvgFile(
        `${String.fromCharCode(0xfeff)}<?xml version="1.0"?>\n<!-- saved -->\n${wrap(model(`<![CDATA[${minimalJson}]]>`))}\n`,
      ).ok,
    ).toBe(true);
  });

  it('01-file-format 3.2: joins CDATA sections and escaped text in the model element', () => {
    const escaped = minimalJson.replaceAll('<', '&lt;');
    const half = Math.floor(escaped.length / 2);
    const svg = wrap(
      model(
        `<![CDATA[${minimalJson.slice(0, 10)}]]>${escaped.slice(10, half)}<!-- c --><![CDATA[${escaped.slice(half).replaceAll('&lt;', '<')}]]>`,
      ),
    );
    const opened = openSvgFile(svg);
    expect(opened.ok && opened.value.doc.content.diagrams[0]?.body.blocks[0]).toEqual({
      id: 'b1',
      kind: 'process',
      text: 'a < b',
    });
  });

  it('does not take block text that looks like markup for a model element', () => {
    const file = assembleSvgFile({
      doc: docWithText('<metadata><ans:document version="1"></ans:document></metadata>'),
      drawing: {
        ...drawing,
        content: '<g class="ans-render"><text>&lt;ans:document&gt;</text></g>',
      },
      fonts: [],
    });
    expect(openSvgFile(file).ok).toBe(true);
  });

  it('accepts the model namespace with another prefix or declared on the root', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:m="https://github.com/reddiana/AriadneNSD"><metadata><m:document version="1">${minimalJson.replaceAll('<', '&lt;')}</m:document></metadata></svg>`;
    expect(openSvgFile(svg).ok).toBe(true);
  });

  it('R-FMT-06: a plain SVG without a model element cannot be edited', () => {
    const cases = [
      '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>',
      wrap('<title>x</title>'),
      // The model element must be inside <metadata>.
      `<svg xmlns="http://www.w3.org/2000/svg">${model(`<![CDATA[${minimalJson}]]>`)}</svg>`,
      '<html><body/></html>',
      'not xml at all',
      '',
    ];
    for (const svg of cases) {
      expect(openSvgFile(svg)).toMatchObject({ ok: false, reason: 'noModel' });
    }
  });

  it('ADR-0035: a prototype file is told apart, and cannot be edited', () => {
    const prototype = `<svg xmlns="http://www.w3.org/2000/svg"><metadata id="ariadne-nsd-model">{"version":0}</metadata></svg>`;
    expect(openSvgFile(prototype)).toMatchObject({ ok: false, reason: 'prototype' });
    const versionZero = wrap(model('{"format":"ariadne-nsd","version":0}', '0'));
    expect(openSvgFile(versionZero)).toMatchObject({ ok: false, reason: 'prototype' });
  });

  it('QA-02: broken files are refused as damaged, never thrown', () => {
    const cases = [
      wrap(model('{ "format": ')),
      wrap(model(`<![CDATA[${minimalJson}]]>`, '2')),
      wrap(
        `<ans:document xmlns:ans="https://github.com/reddiana/AriadneNSD">${minimalJson.replaceAll('<', '&lt;')}</ans:document>`,
      ),
      wrap(model(minimalJson.replaceAll('<', '&lt;')) + model(minimalJson.replaceAll('<', '&lt;'))),
      wrap(model('<x/>')),
      wrap(model('&bogus;')),
      '<svg xmlns="http://www.w3.org/2000/svg"><metadata>',
      '<svg xmlns="http://www.w3.org/2000/svg"><g></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg"><![CDATA[',
      '<svg xmlns="http://www.w3.org/2000/svg"><g a="1" a="2"/></svg>',
    ];
    for (const svg of cases) {
      expect(openSvgFile(svg)).toMatchObject({ ok: false, reason: 'damaged' });
    }
  });

  it('01-file-format 5: a file of a newer version asks for an update', () => {
    const newer = minimalJson.replace('"version":1', '"version":2');
    expect(openSvgFile(wrap(model(newer.replaceAll('<', '&lt;'), '2')))).toMatchObject({
      ok: false,
      reason: 'newerVersion',
    });
  });

  it('finds the model element and its version', () => {
    expect(findModelElement(wrap(model('<![CDATA[{}]]>')))).toEqual({
      ok: true,
      element: { version: '1', text: '{}' },
    });
  });
});
