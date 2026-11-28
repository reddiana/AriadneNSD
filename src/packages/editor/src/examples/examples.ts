// The examples a user can open as a new document (R-EDIT-25): from Help › Examples… and the
// first-visit modal. Moved from the prototype (journal/assets/2026-10-10-ns-prototype.html).
// Each opens in the screen language: the name, the summary and, where the example has words in
// it (sentences, comments, messages, header names), the block text too. Code stays code.
// Maintainer, 2026-11-03: "영어판은 영어가 나와야지요".

import type { Doc, Locale, Settings } from '@ariadne-nsd/core';

import { binarySearch } from './binary-search';
import type { DiagramSpec, LocalizedSpec } from './build-example';
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

/** A text in every UI language. */
export type ExampleText = Readonly<Record<Locale, string>>;

/** One example: its name and summary for the picker, and how to build it as a new document. */
export type ExampleInfo = {
  /** A stable kebab-case id, for example `merge-sort`. */
  readonly id: string;
  readonly name: ExampleText;
  /** What the example shows, in one short line. */
  readonly what: ExampleText;
  /**
   * Builds a new document with the header shape the user chose last (UX HS1), drawn in the
   * opener's screen language like any new document (ADR-0041). The locale also picks the
   * example's text: an English screen gets the English example.
   */
  readonly build: (settings: Pick<Settings, 'headStyle' | 'locale'>) => Doc;
};

/** The diagrams of an example for one screen language. Code-only examples have one version. */
function diagramsFor(
  diagrams: ReadonlyArray<DiagramSpec> | LocalizedSpec,
  locale: Locale,
): ReadonlyArray<DiagramSpec> {
  return 'en' in diagrams ? diagrams[locale] : diagrams;
}

function example(
  id: string,
  name: ExampleText,
  what: ExampleText,
  diagrams: ReadonlyArray<DiagramSpec> | LocalizedSpec,
): ExampleInfo {
  return {
    id,
    name,
    what,
    build: (settings) => buildExample(diagramsFor(diagrams, settings.locale), settings),
  };
}

/** The examples, in the order the picker shows them. */
export const examples: ReadonlyArray<ExampleInfo> = [
  example(
    'merge-sort',
    { ko: '병합 정렬', en: 'Merge sort', de: 'Mergesort' },
    {
      ko: 'Method 하나 · 자기를 부르는 호출',
      en: 'One Method · calls itself',
      de: 'Eine Methode · ruft sich selbst auf',
    },
    mergeSort,
  ),
  example(
    'dijkstra',
    {
      ko: '다익스트라 최단 경로',
      en: "Dijkstra's shortest path",
      de: 'Kürzester Weg nach Dijkstra',
    },
    {
      ko: '겹친 While · For · If',
      en: 'Nested While · For · If',
      de: 'Verschachtelte Schleifen und Verzweigungen',
    },
    dijkstra,
  ),
  example(
    'uart-case',
    { ko: 'UART 명령', en: 'UART commands', de: 'UART-Befehle' },
    { ko: '분기 넷의 Case', en: 'Case with four branches', de: 'Fallauswahl mit vier Zweigen' },
    uartCase,
  ),
  example(
    'timer-interrupt',
    { ko: '타이머 인터럽트', en: 'Timer interrupt', de: 'Timer-Interrupt' },
    {
      ko: 'Event 헤더 · Do-While',
      en: 'Event header · Do-While',
      de: 'Ereigniskopf · Do-While-Schleife',
    },
    timerInterrupt,
  ),
  example(
    'binary-search',
    { ko: '이진 탐색', en: 'Binary search', de: 'Binäre Suche' },
    {
      ko: 'Event와 Method · 결과를 받는 호출',
      en: 'Event and Method · call with a result',
      de: 'Ereignis und Methode · Aufruf mit Ergebnis',
    },
    binarySearch,
  ),
  example(
    'quicksort',
    { ko: '퀵소트', en: 'Quicksort', de: 'Quicksort' },
    {
      ko: 'Method 둘이 서로 부름',
      en: 'Two Methods call each other',
      de: 'Zwei Methoden rufen einander auf',
    },
    quicksort,
  ),
  example(
    'maze',
    {
      ko: '미로 찾기 (아리아드네의 실)',
      en: "Maze (Ariadne's thread)",
      de: 'Labyrinth (Ariadnefaden)',
    },
    { ko: '되추적 · 재귀', en: 'Backtracking · recursion', de: 'Backtracking · Rekursion' },
    maze,
  ),
  example(
    'vending-machine',
    { ko: '자판기', en: 'Vending machine', de: 'Getränkeautomat' },
    {
      ko: '문장으로 적기 · Event 둘',
      en: 'Written in sentences · two Events',
      de: 'In Sätzen geschrieben · zwei Ereignisse',
    },
    vendingMachine,
  ),
  example(
    'elevator',
    { ko: '엘리베이터', en: 'Elevator', de: 'Aufzug' },
    {
      ko: '분기 넷 · 호출 둘 · 가장 넓음',
      en: 'Four branches · two calls · the widest',
      de: 'Vier Zweige · zwei Aufrufe · das breiteste',
    },
    elevator,
  ),
  example(
    'raft',
    { ko: 'Raft 합의', en: 'Raft consensus', de: 'Raft-Konsens' },
    {
      ko: 'Event 일곱 · Method 셋 · 가장 큼',
      en: 'Seven Events · three Methods · the largest',
      de: 'Sieben Ereignisse · drei Methoden · das größte',
    },
    raft,
  ),
];
