// The document layer (03-editor 1.2): the rendering's SVG in the DOM. A new rendering changes only
// the elements that differ from the drawn one, so the browser keeps the rest as it is (QA-07,
// AT-05: replacing the whole SVG of a large document made each edit slow). The DOM ends the same
// as when the whole markup is parsed again, element for element and attribute for attribute.
//
// The rendering's content is one element per line between the opening and closing lines of its
// group (`toSvg`). Two lines are paired by a key: the line with the numbers of its start tag
// taken out. A block below an edit moves, so its lines change only in their coordinates and keep
// their keys. The paired lines that differ get the new attribute values; the others are new
// elements.
import type { RenderedSvg } from '@ariadne-nsd/core';

const svgNamespace = 'http://www.w3.org/2000/svg';

/** The whole markup of a rendering, as the document layer holds it. */
export function drawingMarkup(svg: RenderedSvg): string {
  return `<svg xmlns="${svgNamespace}" width="${String(svg.width)}" height="${String(svg.height)}" viewBox="${svg.viewBox}"><rect width="100%" height="100%" fill="${svg.paper}"/>${svg.content}</svg>`;
}

/** The key that pairs a line of the old drawing with one of the new: numbers of the start tag out. */
export function elementKey(line: string): string {
  const end = line.indexOf('>');
  return end < 0 ? line : line.slice(0, end).replace(/\d+/g, '') + line.slice(end);
}

/** How the element lines of two drawings pair up. */
export type LinePairing = {
  /** Lines at the start paired one to one: old index = new index. */
  readonly prefix: number;
  /** Lines at the end paired one to one, counted from the end. */
  readonly suffix: number;
};

/**
 * Pairs the lines at the start and at the end whose keys are the same. What lies between is
 * changed: paired one by one when both sides have as many lines, otherwise replaced.
 */
export function pairLines(
  before: ReadonlyArray<string>,
  beforeKeys: ReadonlyArray<string>,
  after: ReadonlyArray<string>,
  afterKey: (index: number) => string,
): LinePairing {
  const shorter = Math.min(before.length, after.length);
  const isPaired = (old: number, next: number): boolean =>
    before[old] === after[next] || beforeKeys[old] === afterKey(next);
  let prefix = 0;
  while (prefix < shorter && isPaired(prefix, prefix)) {
    prefix += 1;
  }
  let suffix = 0;
  while (
    suffix < shorter - prefix &&
    isPaired(before.length - 1 - suffix, after.length - 1 - suffix)
  ) {
    suffix += 1;
  }
  return { prefix, suffix };
}

/** What a drawing holds in the DOM. */
type Drawn = {
  readonly svg: SVGSVGElement;
  readonly paper: Element;
  readonly group: Element;
  /** The group's opening line. */
  readonly head: string;
  readonly lines: ReadonlyArray<string>;
  readonly keys: ReadonlyArray<string>;
  /** The element of each line. */
  readonly nodes: ReadonlyArray<Element>;
};

/** The element lines of a rendering's content, or `null` when it is not one element per line. */
function contentLines(content: string): { head: string; lines: string[] } | null {
  const lines = content.split('\n');
  const head = lines[0] ?? '';
  if (lines.length < 2 || !head.startsWith('<g ') || lines.at(-1) !== '</g>') {
    return null;
  }
  const body = lines.slice(1, -1);
  return body.every((line) => line.startsWith('<')) ? { head, lines: body } : null;
}

/** The SVG of the document layer, changed element by element. */
export class DocumentLayer {
  private drawn: Drawn | null = null;
  private content: string | null = null;

  constructor(private readonly container: HTMLElement) {}

  /**
   * Draws a rendering. Returns the elements it added or changed, or `null` when it drew the whole
   * layer again (the first drawing, or content it cannot pair).
   */
  draw(svg: RenderedSvg): ReadonlyArray<Element> | null {
    const parts = contentLines(svg.content);
    const drawn = this.drawn;
    if (parts === null || parts.head !== drawn?.head) {
      this.drawWhole(svg, parts);
      return null;
    }
    setAttribute(drawn.svg, 'width', String(svg.width));
    setAttribute(drawn.svg, 'height', String(svg.height));
    setAttribute(drawn.svg, 'viewBox', svg.viewBox);
    setAttribute(drawn.paper, 'fill', svg.paper);
    if (svg.content === this.content) {
      return [];
    }
    const changed = this.change(drawn, parts.lines);
    if (changed === null) {
      this.drawWhole(svg, parts);
      return null;
    }
    this.content = svg.content;
    return changed;
  }

  private drawWhole(svg: RenderedSvg, parts: { head: string; lines: string[] } | null): void {
    this.container.innerHTML = drawingMarkup(svg);
    this.content = svg.content;
    this.drawn = null;
    const root = this.container.firstElementChild;
    const paper = root?.firstElementChild ?? null;
    const group = paper?.nextElementSibling ?? null;
    if (
      !(root instanceof SVGSVGElement) ||
      paper === null ||
      group?.children.length !== parts?.lines.length ||
      parts === null ||
      group === null
    ) {
      return;
    }
    this.drawn = {
      svg: root,
      paper,
      group,
      head: parts.head,
      lines: parts.lines,
      keys: parts.lines.map(elementKey),
      nodes: [...group.children],
    };
  }

  /**
   * Changes the drawn elements into those of `lines`. `null` when the new lines do not parse one
   * element each (the caller draws the whole layer then).
   */
  private change(drawn: Drawn, lines: ReadonlyArray<string>): Element[] | null {
    const keys: (string | undefined)[] = [];
    const keyOf = (index: number): string => (keys[index] ??= elementKey(lines[index] ?? ''));
    const { prefix, suffix } = pairLines(drawn.lines, drawn.keys, lines, keyOf);
    const oldCount = drawn.lines.length;
    const newCount = lines.length;
    const isMiddlePaired = oldCount - prefix - suffix === newCount - prefix - suffix;
    // Each new line that differs from the line it pairs with (or pairs with none), and the old
    // line it changes (-1: a new element).
    const work: { readonly line: number; readonly old: number }[] = [];
    const pair = (old: number, line: number): void => {
      if (drawn.lines[old] !== lines[line]) {
        work.push({ line, old });
      }
    };
    for (let index = 0; index < prefix; index += 1) {
      pair(index, index);
    }
    for (let index = prefix; index < newCount - suffix; index += 1) {
      if (isMiddlePaired) {
        pair(index, index);
      } else {
        work.push({ line: index, old: -1 });
      }
    }
    for (let back = 1; back <= suffix; back += 1) {
      pair(oldCount - back, newCount - back);
    }
    const nodes = drawn.nodes;
    const next: Element[] = [...nodes.slice(0, prefix)];
    const middle: Element[] = isMiddlePaired ? [...nodes.slice(prefix, oldCount - suffix)] : [];
    const tail: Element[] = [...nodes.slice(oldCount - suffix)];
    const changed: Element[] = [];
    const inserted: Element[] = [];
    // Paired lines with the same key take the new values straight from the text (most of them:
    // the blocks that moved). Only the others are parsed.
    const isSameKey = (item: { readonly line: number; readonly old: number }): boolean =>
      item.old >= 0 && drawn.keys[item.old] === keyOf(item.line);
    const rest = work.filter((item) => {
      const old = nodes[item.old];
      if (old !== undefined && isSameKey(item) && patchFromLine(old, lines[item.line] ?? '')) {
        changed.push(old);
        return false;
      }
      return true;
    });
    const parsed = this.parse(rest.map((item) => lines[item.line] ?? ''));
    if (parsed === null) {
      return null;
    }
    rest.forEach((item, at) => {
      const element = parsed[at];
      if (element === undefined) {
        return;
      }
      const old = nodes[item.old];
      if (old === undefined) {
        changed.push(element);
        inserted.push(element);
        return;
      }
      // Lines paired by place in the middle may differ in more than numbers: those are replaced.
      const placed = isSameKey(item) && patch(old, element) ? old : element;
      if (placed !== old) {
        old.replaceWith(element);
      }
      changed.push(placed);
      if (item.line < prefix) {
        next[item.line] = placed;
      } else if (item.line < newCount - suffix) {
        middle[item.line - prefix] = placed;
      } else {
        tail[item.line - (newCount - suffix)] = placed;
      }
    });
    if (!isMiddlePaired) {
      for (const old of nodes.slice(prefix, oldCount - suffix)) {
        old.previousSibling?.remove();
        old.remove();
      }
      const document = drawn.group.ownerDocument;
      const fragment = document.createDocumentFragment();
      for (const element of inserted) {
        fragment.append(document.createTextNode('\n'), element);
      }
      // Each element follows its line break; the group ends with one.
      const before = tail[0]?.previousSibling ?? drawn.group.lastChild;
      drawn.group.insertBefore(fragment, before);
      middle.push(...inserted);
    }
    this.drawn = {
      ...drawn,
      lines,
      keys: lines.map((_, index) => keyOf(index)),
      nodes: [...next, ...middle, ...tail],
    };
    return changed;
  }

  /** The elements of some lines, parsed apart from the page; `null` unless one each. */
  private parse(lines: ReadonlyArray<string>): Element[] | null {
    if (lines.length === 0) {
      return [];
    }
    const scratch = this.container.ownerDocument.createElementNS(svgNamespace, 'g');
    scratch.innerHTML = lines.join('\n');
    const elements = [...scratch.children];
    return elements.length === lines.length ? elements : null;
  }
}

function setAttribute(element: Element, name: string, value: string): void {
  if (element.getAttribute(name) !== value) {
    element.setAttribute(name, value);
  }
}

/**
 * `patch` from the line's text: its start tag's attributes, when none holds a character reference
 * (then the line is parsed).
 */
function patchFromLine(old: Element, line: string): boolean {
  const end = line.indexOf('>');
  const tag = end < 0 ? '' : line.slice(0, end);
  if (tag === '' || tag.includes('&')) {
    return false;
  }
  const attributes = [...tag.matchAll(/\s([^\s="]+)="([^"]*)"/g)];
  const names = old.getAttributeNames().filter((name) => name !== 'style');
  if (
    names.length !== attributes.length ||
    names.some((name, index) => name !== attributes[index]?.[1])
  ) {
    return false;
  }
  for (const [, name = '', value = ''] of attributes) {
    setAttribute(old, name, value);
  }
  return true;
}

/**
 * Gives `old` the attribute values of `next` when both have the same attributes in the same order
 * (the snapped stroke's `style` aside: the caller snaps the changed elements again). Returns whether it did; the
 * children are the same, as the elements' keys are.
 */
function patch(old: Element, next: Element): boolean {
  const names = old.getAttributeNames().filter((name) => name !== 'style');
  const nextNames = next.getAttributeNames();
  if (names.length !== nextNames.length || names.some((name, index) => name !== nextNames[index])) {
    return false;
  }
  for (const name of nextNames) {
    setAttribute(old, name, next.getAttribute(name) ?? '');
  }
  return true;
}
