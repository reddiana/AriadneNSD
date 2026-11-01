// The examples a user can open as a new document (R-EDIT-25): from Help › Examples… and the
// first-visit modal. Moved from the prototype (journal/assets/2026-10-10-ns-prototype.html).
// Block text stays as written whatever the UI language; only the name and the summary are
// translated.

import type { Doc, Settings } from '@ariadne-nsd/core';

import { binarySearch } from './binary-search';
import type { DiagramSpec } from './build-example';
import { buildExample } from './build-example';
import { dijkstra } from './dijkstra';
import { elevator } from './elevator';
import { maze } from './maze';
import { mergeSort } from './merge-sort';
import { quicksort } from './quicksort';
import { raft } from './raft';
import { timerInterrupt } from './timer-interrupt';
import { uartCase } from './uart-case';
import { vendingMachine } from './vending-machine';

/** A text in both UI languages. */
export type ExampleText = {
  readonly ko: string;
  readonly en: string;
};

/** One example: its name and summary for the picker, and how to build it as a new document. */
export type ExampleInfo = {
  /** A stable kebab-case id, for example `merge-sort`. */
  readonly id: string;
  readonly name: ExampleText;
  /** What the example shows, in one short line. */
  readonly what: ExampleText;
  /** Builds a new document with the header shape the user chose last (UX HS1). */
  readonly build: (headStyle: Settings['headStyle']) => Doc;
};

function example(
  id: string,
  name: ExampleText,
  what: ExampleText,
  diagrams: ReadonlyArray<DiagramSpec>,
): ExampleInfo {
  return { id, name, what, build: (headStyle) => buildExample(diagrams, headStyle) };
}

/** The examples, in the order the picker shows them. */
export const examples: ReadonlyArray<ExampleInfo> = [
  example(
    'merge-sort',
    { ko: '병합 정렬', en: 'Merge sort' },
    { ko: 'Method 하나 · 자기를 부르는 호출', en: 'One Method · calls itself' },
    mergeSort,
  ),
  example(
    'dijkstra',
    { ko: '다익스트라 최단 경로', en: "Dijkstra's shortest path" },
    { ko: '겹친 While · For · If', en: 'Nested While · For · If' },
    dijkstra,
  ),
  example(
    'uart-case',
    { ko: 'UART 명령', en: 'UART commands' },
    { ko: '갈래 넷의 Case', en: 'Case with four branches' },
    uartCase,
  ),
  example(
    'timer-interrupt',
    { ko: '타이머 인터럽트', en: 'Timer interrupt' },
    { ko: 'Event 헤더 · Do-While', en: 'Event header · Do-While' },
    timerInterrupt,
  ),
  example(
    'binary-search',
    { ko: '이진 탐색', en: 'Binary search' },
    { ko: 'Event와 Method · 결과를 받는 호출', en: 'Event and Method · call with a result' },
    binarySearch,
  ),
  example(
    'quicksort',
    { ko: '퀵소트', en: 'Quicksort' },
    { ko: 'Method 둘이 서로 부름', en: 'Two Methods call each other' },
    quicksort,
  ),
  example(
    'maze',
    { ko: '미로 찾기 (아리아드네의 실)', en: "Maze (Ariadne's thread)" },
    { ko: '되추적 · 재귀', en: 'Backtracking · recursion' },
    maze,
  ),
  example(
    'vending-machine',
    { ko: '자판기', en: 'Vending machine' },
    { ko: '문장으로 적기 · Event 둘', en: 'Written in sentences · two Events' },
    vendingMachine,
  ),
  example(
    'elevator',
    { ko: '엘리베이터', en: 'Elevator' },
    { ko: '갈래 넷 · 호출 둘 · 가장 넓음', en: 'Four branches · two calls · the widest' },
    elevator,
  ),
  example(
    'raft',
    { ko: 'Raft 합의', en: 'Raft consensus' },
    { ko: 'Event 일곱 · Method 셋 · 가장 큼', en: 'Seven Events · three Methods · the largest' },
    raft,
  ),
];
