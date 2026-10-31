import { describe, expect, it } from 'vitest';

import { baseName, documentFileName, isOpenableName, pngFileName, windowTitle } from './file-name';

describe('file names', () => {
  it('R-WEB-02: opens .ns.svg and .ns files, whatever the case', () => {
    expect(isOpenableName('예제.ns.svg')).toBe(true);
    expect(isOpenableName('Example.NS')).toBe(true);
    expect(isOpenableName('picture.svg')).toBe(false);
    expect(isOpenableName('notes.txt')).toBe(false);
  });

  it('removes the document extension to get the base name', () => {
    expect(baseName('예제.ns.svg')).toBe('예제');
    expect(baseName('a.b.ns')).toBe('a.b');
    expect(baseName('plain.svg')).toBe('plain');
    expect(baseName('.ns')).toBe('.ns');
    expect(baseName('readme')).toBe('readme');
  });

  it('R-WEB-02: keeps .ns.svg and .ns, and adds .ns.svg to other names', () => {
    expect(documentFileName('예제.ns.svg', 'Untitled')).toBe('예제.ns.svg');
    expect(documentFileName('old.ns', 'Untitled')).toBe('old.ns');
    expect(documentFileName('drawing', 'Untitled')).toBe('drawing.ns.svg');
    expect(documentFileName('drawing.svg', 'Untitled')).toBe('drawing.ns.svg');
  });

  it('replaces characters file systems refuse and falls back on an empty name', () => {
    expect(documentFileName('a/b:c?', 'Untitled')).toBe('a_b_c_.ns.svg');
    expect(documentFileName('  ', '제목 없음')).toBe('제목 없음.ns.svg');
    expect(documentFileName('name. ', 'Untitled')).toBe('name.ns.svg');
  });

  it('R-EXP-01: names the PNG after the document', () => {
    expect(pngFileName('예제.ns.svg')).toBe('예제.png');
    expect(pngFileName('old.ns')).toBe('old.png');
  });

  it('UX W3: puts ● before the name in the tab title while unsaved', () => {
    expect(windowTitle('예제.ns.svg', true, 'AriadneNSD')).toBe('● 예제.ns.svg – AriadneNSD');
    expect(windowTitle('예제.ns.svg', false, 'AriadneNSD')).toBe('예제.ns.svg – AriadneNSD');
  });
});
