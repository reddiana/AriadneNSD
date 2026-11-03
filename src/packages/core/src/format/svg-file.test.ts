import { describe, expect, it } from 'vitest';

import type { Doc } from '../model/types';
import { findModelElement } from './model-element';
import type { Drawing } from './svg-file';
import { assembleImageSvg, assembleSvgFile, checkDrawing, openSvgFile } from './svg-file';
import { sha256Hex } from './sha256';

const docWithText = (text: string): Doc => ({
  content: {
    settings: { textKind: 'plain', theme: 'default', headStyle: 'shape', locale: 'en' },
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
  settings: { textKind: 'plain', theme: 'default', headStyle: 'shape', locale: 'en' },
  diagrams: [{ id: 'd1', body: [{ id: 'b1', kind: 'process', text: 'a < b' }] }],
  view: { folded: [], opened: [], bands: true, resultSymbol: '←' },
});

describe('SVG file', () => {
  it('T-0425: 01-file-format 2: assembles the documented structure', () => {
    const file = assembleSvgFile({
      doc: docWithText('x'),
      drawing,
      fonts: [{ family: 'AriadneNSD Mono', woff: new Uint8Array([119, 79, 70, 70]) }],
    });
    const lines = file.split('\n');
    expect(lines[0]).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="120" height="40" viewBox="0 0 120 40">',
    );
    expect(lines[1]).toBe('  <metadata>');
    expect(lines[2]).toMatch(
      /^ {4}<ans:document xmlns:ans="https:\/\/github\.com\/reddiana\/AriadneNSD" version="1" drawing-sha256="[0-9a-f]{64}"><!\[CDATA\[$/,
    );
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

  it('T-0426 · R-FMT-03: the same parts give the same bytes', () => {
    const parts = { doc: docWithText('같은 글'), drawing, fonts: [] };
    expect(assembleSvgFile(parts)).toBe(assembleSvgFile(parts));
  });

  it('T-0427 · R-FMT-04: splits CDATA around ]]> and reads the text back whole', () => {
    const text = 'a]]>b]]>]]>c';
    const file = assembleSvgFile({ doc: docWithText(text), drawing, fonts: [] });
    expect(file).toContain('a]]]]><![CDATA[>b');
    const opened = openSvgFile(file);
    expect(opened.ok && opened.value.doc).toEqual(docWithText(text));
  });

  it('T-0428: writes characters XML does not allow as JSON escapes', () => {
    const text = `x${String.fromCharCode(0xfffe)}y${String.fromCharCode(0xffff, 1, 0xd800)}`;
    const file = assembleSvgFile({ doc: docWithText(text), drawing, fonts: [] });
    for (const code of [0xfffe, 0xffff, 1]) {
      expect(file).not.toContain(String.fromCharCode(code));
    }
    const opened = openSvgFile(file);
    expect(opened.ok && opened.value.doc).toEqual(docWithText(text));
  });

  it('T-0429 · QA-04: opening and saving again gives the same model part', () => {
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

  it('T-0430: 01-file-format 1: opens a .ns file the same way (the content is the same)', () => {
    expect(openSvgFile(wrap(model(`<![CDATA[${minimalJson}]]>`))).ok).toBe(true);
    expect(
      openSvgFile(
        `${String.fromCharCode(0xfeff)}<?xml version="1.0"?>\n<!-- saved -->\n${wrap(model(`<![CDATA[${minimalJson}]]>`))}\n`,
      ).ok,
    ).toBe(true);
  });

  it('T-0431: 01-file-format 3.2: joins CDATA sections and escaped text in the model element', () => {
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

  it('T-0432: does not take block text that looks like markup for a model element', () => {
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

  it('T-0433: accepts the model namespace with another prefix or declared on the root', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:m="https://github.com/reddiana/AriadneNSD"><metadata><m:document version="1">${minimalJson.replaceAll('<', '&lt;')}</m:document></metadata></svg>`;
    expect(openSvgFile(svg).ok).toBe(true);
  });

  it('T-0434 · R-FMT-06: a plain SVG without a model element cannot be edited', () => {
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

  it('T-0435: ADR-0035: a prototype file is told apart, and cannot be edited', () => {
    const prototype = `<svg xmlns="http://www.w3.org/2000/svg"><metadata id="ariadne-nsd-model">{"version":0}</metadata></svg>`;
    expect(openSvgFile(prototype)).toMatchObject({ ok: false, reason: 'prototype' });
    const versionZero = wrap(model('{"format":"ariadne-nsd","version":0}', '0'));
    expect(openSvgFile(versionZero)).toMatchObject({ ok: false, reason: 'prototype' });
  });

  it('T-0436 · QA-02: broken files are refused as damaged, never thrown', () => {
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

  it('T-0437: 01-file-format 5: a file of a newer version asks for an update', () => {
    const newer = minimalJson.replace('"version":1', '"version":2');
    expect(openSvgFile(wrap(model(newer.replaceAll('<', '&lt;'), '2')))).toMatchObject({
      ok: false,
      reason: 'newerVersion',
    });
  });

  it('T-0438: finds the model element and its version', () => {
    expect(findModelElement(wrap(model('<![CDATA[{}]]>')))).toEqual({
      ok: true,
      element: { version: '1', text: '{}', drawingSha256: null, metadata: { start: 40, end: 167 } },
    });
  });
});

describe('pure SVG (R-EXP-02)', () => {
  const fonts = [{ family: 'AriadneNSD Mono', woff: new Uint8Array([119, 79, 70, 70]) }];

  it('is the saved file without its metadata, so it has no model and does not open', () => {
    const file = assembleSvgFile({ doc: docWithText('x'), drawing, fonts });
    const image = assembleImageSvg(drawing, fonts);
    expect(image).not.toContain('<metadata>');
    expect(image).not.toContain('ans:document');
    expect(image).toContain('@font-face');
    expect(image).toContain(drawing.content);
    expect(openSvgFile(image)).toMatchObject({ ok: false, reason: 'noModel' });
    expect(file.replace(/\n {2}<metadata>[\s\S]*<\/metadata>/, '')).toBe(image);
  });

  it('is what the saved file fingerprints', () => {
    const file = assembleSvgFile({ doc: docWithText('x'), drawing, fonts });
    const image = assembleImageSvg(drawing, fonts);
    expect(file).toContain(`drawing-sha256="${sha256Hex(image)}"`);
  });
});

describe('drawing check (R-FMT-09)', () => {
  const saved = (text = 'x'): string =>
    assembleSvgFile({ doc: docWithText(text), drawing, fonts: [] });

  it('finds a saved file unchanged, also with CRLF line ends or a byte order mark', () => {
    expect(checkDrawing(saved())).toBe('unchanged');
    expect(checkDrawing(saved().replaceAll('\n', '\r\n'))).toBe('unchanged');
    expect(checkDrawing(`\ufeff${saved()}`)).toBe('unchanged');
  });

  it('finds a drawing edited by another tool', () => {
    expect(checkDrawing(saved().replace('width="104"', 'width="90"'))).toBe('edited');
    expect(checkDrawing(saved().replace('</svg>', '<circle r="3"/></svg>'))).toBe('edited');
    expect(checkDrawing(saved().replace('fill="#ffffff"', 'fill="#000000"'))).toBe('edited');
  });

  it('does not count a change to the model as a drawing edit', () => {
    const edited = saved('x').replace('"text": "x"', '"text": "y"');
    expect(edited).not.toBe(saved('x'));
    expect(checkDrawing(edited)).toBe('unchanged');
  });

  it('cannot tell for a file without a fingerprint or without a model', () => {
    expect(checkDrawing(saved().replace(/ drawing-sha256="[0-9a-f]+"/, ''))).toBe('unknown');
    expect(checkDrawing(assembleImageSvg(drawing, []))).toBe('unknown');
    expect(checkDrawing('not xml')).toBe('unknown');
  });

  it('cuts only the metadata element when it shares its line with other markup', () => {
    const oneLine = saved().replace('>\n  <metadata>', '><metadata>');
    expect(oneLine).not.toBe(saved());
    expect(checkDrawing(oneLine)).toBe('unchanged');
    expect(checkDrawing(oneLine.replace('<style>', '<style> '))).toBe('edited');
  });
});
