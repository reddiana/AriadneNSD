// Prototype M41 example 1 (journal/assets/2026-10-10-ns-prototype.html, `MORE`).
import type { DiagramSpec } from './build-example';
import { event, method } from './build-example';

/** Vending machine: written in sentences, two Events and a Method. */
export const vendingMachine: ReadonlyArray<DiagramSpec> = [
  event('동전이 들어오면', [
    '동전의 종류를 알아본다',
    [
      'if',
      '받는 동전인가?',
      [
        '잔액에 동전의 값을 더한다',
        '잔액을 화면에 보인다',
        ['call', '살 수 있는 음료에 불을 켠다'],
      ],
      ['동전을 반환구로 돌려보낸다'],
    ],
  ]),
  event('음료 버튼을 누르면', [
    [
      'case',
      '고른 음료',
      [
        ['커피', ['값 = 1,200원']],
        ['녹차', ['값 = 1,000원']],
        ['생수', ['값 = 800원']],
        ['default', ['알림음을 낸다', '끝낸다']],
      ],
    ],
    [
      'if',
      '잔액 ≥ 값?',
      [
        '음료를 내보낸다',
        '잔액에서 값을 뺀다',
        ['while', '잔액 > 0', ['가장 큰 동전으로 거스름을 낸다', '잔액에서 그 동전의 값을 뺀다']],
        '화면을 처음으로 되돌린다',
      ],
      ['"잔액이 모자랍니다"를 보인다'],
    ],
  ]),
  method('살 수 있는 음료에 불을 켠다', [
    [
      'while',
      '버튼마다',
      [['if', '값 ≤ 잔액이고 재고가 있는가?', ['버튼의 불을 켠다'], ['버튼의 불을 끈다']]],
    ],
  ]),
];
