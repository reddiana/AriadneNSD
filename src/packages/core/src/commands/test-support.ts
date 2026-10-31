// Builders and checks for the command tests. Not part of the public API.
import { expect } from 'vitest';

import { checkInvariants } from '../model/invariants';
import type { Arm, Block, Branch, Case, Content, FoldMark, Id, If, Seq } from '../model/types';
import { indexContent } from './tree';
import type { OkResult, Result } from './types';

export const seq = (blocks: ReadonlyArray<Block>, folds: ReadonlyArray<FoldMark> = []): Seq => ({
  blocks,
  folds,
});

export const proc = (id: Id, text = id): Block => ({ id, kind: 'process', text });

export const empty = (id: Id): Block => ({ id, kind: 'process', text: '' });

export const branch = (id: Id, blocks: ReadonlyArray<Block>, label?: string): Branch =>
  label === undefined ? { id, body: seq(blocks) } : { id, label, body: seq(blocks) };

export const ifBlock = (id: Id, yes: Branch, no: Branch, text = 'c'): If => ({
  id,
  kind: 'if',
  text,
  yes,
  no,
});

export const arm = (id: Id, label: string, blocks: ReadonlyArray<Block>): Arm => ({
  id,
  label,
  body: seq(blocks),
});

export const caseBlock = (
  id: Id,
  arms: ReadonlyArray<Arm>,
  otherwise: Branch | null,
  text = 'k',
): Case => ({ id, kind: 'case', text, arms, otherwise });

export const whileBlock = (id: Id, body: Seq | ReadonlyArray<Block>, text = 'w'): Block => ({
  id,
  kind: 'while',
  text,
  body: 'blocks' in body ? body : seq(body),
});

/** A content with one headerless diagram `d1` whose body is `body`. */
export const contentOf = (body: Seq | ReadonlyArray<Block>): Content => ({
  settings: { textKind: 'plain', theme: 'default', headStyle: 'title' },
  diagrams: [{ id: 'd1', head: null, body: 'blocks' in body ? body : seq(body) }],
});

/** The block ids of the sequence owned by `owner`. */
export function idsIn(content: Content, owner: Id): ReadonlyArray<Id> {
  const entry = indexContent(content).seqs.get(owner);
  if (entry === undefined) {
    throw new Error(`no sequence owned by ${owner}`);
  }
  return entry.seq.blocks.map((block) => block.id);
}

/** The fold regions of the sequence owned by `owner`, as `id:first-last`. */
export function foldsIn(content: Content, owner: Id): ReadonlyArray<string> {
  const entry = indexContent(content).seqs.get(owner);
  if (entry === undefined) {
    throw new Error(`no sequence owned by ${owner}`);
  }
  return entry.seq.folds.map((fold) => `${fold.id}:${fold.first}-${fold.last}`);
}

/** The block with this id. */
export function blockOf(content: Content, id: Id): Block {
  const entry = indexContent(content).blocks.get(id);
  if (entry === undefined) {
    throw new Error(`no block ${id}`);
  }
  return entry.block;
}

/** Freezes a value and everything in it, so a command that mutates its input throws. */
export function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const inner of Object.values(value)) {
      deepFreeze(inner);
    }
  }
  return value;
}

/**
 * Runs a command the way the editor does and checks what every command must keep:
 * the input is not changed (so undo, which restores the previous content, gets it back exactly),
 * a success keeps the invariants, and running again gives the same result (redo is
 * deterministic).
 */
export function run<A>(
  command: (content: Content, args: A) => Result,
  content: Content,
  args: A,
): Result {
  deepFreeze(content);
  const before: unknown = JSON.parse(JSON.stringify(content));
  const result = command(content, args);
  expect(content).toEqual(before);
  if (result.ok) {
    expect(checkInvariants(result.content)).toEqual([]);
    const hasOwnIds = typeof args === 'object' && args !== null && 'ids' in args;
    if (!hasOwnIds) {
      expect(command(content, args)).toEqual(result);
    }
  }
  return result;
}

/** Like `run`, and expects success. */
export function runOk<A>(
  command: (content: Content, args: A) => Result,
  content: Content,
  args: A,
): OkResult {
  const result = run(command, content, args);
  if (!result.ok) {
    throw new Error(`expected success, got ${result.reason.code}`);
  }
  return result;
}

/** Like `run`, and expects a refusal with this code. */
export function expectRefused<A>(
  command: (content: Content, args: A) => Result,
  content: Content,
  args: A,
  code: string,
): void {
  const result = run(command, content, args);
  expect(result.ok ? 'ok' : result.reason.code).toBe(code);
}
