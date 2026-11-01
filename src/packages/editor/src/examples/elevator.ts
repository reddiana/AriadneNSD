// Prototype M41 example 3 (journal/assets/2026-10-10-ns-prototype.html, `MORE`).
import type { DiagramSpec } from './build-example';
import { event, method } from './build-example';

/** Elevator: a Case with four branches, a named fold region and two calls. */
export const elevator: ReadonlyArray<DiagramSpec> = [
  event('층 버튼이 눌리면', [
    '눌린 층을 요청 목록에 더한다',
    '버튼에 불을 켠다',
    ['if', '엘리베이터가 서 있는가?', [['call', '다음 행선지를 정한다']], ['']],
  ]),
  event('제어 주기마다 (100ms)', [
    [
      'case',
      '상태',
      [
        [
          '올라감',
          [['if', '행선지에 닿았는가?', ['멈춘다', '상태 = 문 열림'], ['한 층 올라간다']]],
        ],
        [
          '내려감',
          [['if', '행선지에 닿았는가?', ['멈춘다', '상태 = 문 열림'], ['한 층 내려간다']]],
        ],
        [
          '문 열림',
          [
            [
              'range',
              '문 열고 닫기',
              [
                '문을 연다',
                '3초 기다린다',
                ['while', '문 사이에 사람이 있는 동안', ['1초 더 기다린다']],
                '문을 닫는다',
              ],
            ],
            '이 층의 요청을 지운다',
            ['call', '다음 행선지를 정한다'],
          ],
        ],
        ['서 있음', ['']],
      ],
    ],
  ]),
  method('다음 행선지를 정한다', [
    [
      'if',
      '요청 목록이 비었는가?',
      ['상태 = 서 있음'],
      [
        '진행 방향에서 가장 가까운 요청을 고른다',
        ['if', '행선지 > 지금 층?', ['상태 = 올라감'], ['상태 = 내려감']],
      ],
    ],
  ]),
];
