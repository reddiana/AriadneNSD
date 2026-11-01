// Reading a header's name and parameters from its text (01-model 1.2, ADR-0022).
// They are derived values, so they are not stored.
import type { Head } from './types';

/**
 * The name of a header, without surrounding spaces. An Event's name is its whole text; a Method's
 * name is the text before the first '(' (ADR-0022). Names are compared in this form, case
 * sensitive (interaction rules "Event 헤더").
 */
export function headName(head: Head): string {
  if (head.kind === 'event') {
    return head.text.trim();
  }
  const open = head.text.indexOf('(');
  return (open < 0 ? head.text : head.text.slice(0, open)).trim();
}

/**
 * What a Method receives: the text inside its parentheses, without surrounding spaces, or `null`
 * when the header has no parentheses (an Event never receives anything). The inside runs from the
 * first '(' to the last ')' after it, or to the end when the ')' is missing.
 */
export function headParams(head: Head): string | null {
  if (head.kind === 'event') {
    return null;
  }
  const open = head.text.indexOf('(');
  if (open < 0) {
    return null;
  }
  const close = head.text.lastIndexOf(')');
  return (close > open ? head.text.slice(open + 1, close) : head.text.slice(open + 1)).trim();
}
