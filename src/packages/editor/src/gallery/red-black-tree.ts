// Red-black tree insertion for the algorithm gallery, as CLRS presents it: a plain BST insert with a
// sentinel T.nil, then the fix-up's three cases on each side, and the two rotations.
import type { BlockSpec, DiagramSpec, LocalizedSpec } from '../examples/build-example';
import { method } from '../examples/build-example';

type RedBlackWords = {
  readonly uncle: string;
  readonly case1: string;
  readonly case2: string;
  readonly case3: string;
  readonly bstInsert: string;
  readonly rootBlack: string;
};

type Side = 'left' | 'right';

const other: Readonly<Record<Side, Side>> = { left: 'right', right: 'left' };

/** The fix-up's three cases when z's parent is the `side` child of its grandparent. */
function fixupCases(side: Side, words: RedBlackWords): ReadonlyArray<BlockSpec> {
  const far = other[side];
  return [
    `y = z.parent.parent.${far}    # ${words.uncle}`,
    [
      'if',
      'y.color == RED',
      [
        `z.parent.color = BLACK    # ${words.case1}`,
        'y.color = BLACK',
        'z.parent.parent.color = RED',
        'z = z.parent.parent',
      ],
      [
        [
          'if',
          `z == z.parent.${far}`,
          [`z = z.parent    # ${words.case2}`, ['call', `${side}_rotate(T, x)`, 'T, z']],
          [''],
        ],
        `z.parent.color = BLACK    # ${words.case3}`,
        'z.parent.parent.color = RED',
        ['call', `${far}_rotate(T, x)`, 'T, z.parent.parent'],
      ],
    ],
  ];
}

/** A rotation that lifts x's `far` child into x's place (`side` is the way x goes down). */
function rotate(side: Side): DiagramSpec {
  const far = other[side];
  return method(`${side}_rotate(T, x)`, [
    `y = x.${far}`,
    `x.${far} = y.${side}`,
    ['if', `y.${side} != T.nil`, [`y.${side}.parent = x`], ['']],
    'y.parent = x.parent',
    [
      'if',
      'x.parent == T.nil',
      ['T.root = y'],
      [['if', 'x == x.parent.left', ['x.parent.left = y'], ['x.parent.right = y']]],
    ],
    `y.${side} = x`,
    'x.parent = y',
  ]);
}

function redBlackWith(words: RedBlackWords): ReadonlyArray<DiagramSpec> {
  return [
    method('rb_insert(T, z)', [
      [
        'range',
        words.bstInsert,
        [
          'y = T.nil',
          'x = T.root',
          [
            'while',
            'x != T.nil',
            ['y = x', ['if', 'z.key < x.key', ['x = x.left'], ['x = x.right']]],
          ],
          'z.parent = y',
          [
            'if',
            'y == T.nil',
            ['T.root = z'],
            [['if', 'z.key < y.key', ['y.left = z'], ['y.right = z']]],
          ],
        ],
      ],
      'z.left = z.right = T.nil',
      'z.color = RED',
      ['call', 'rb_insert_fixup(T, z)', 'T, z'],
    ]),
    method('rb_insert_fixup(T, z)', [
      [
        'while',
        'z.parent.color == RED',
        [
          [
            'if',
            'z.parent == z.parent.parent.left',
            fixupCases('left', words),
            fixupCases('right', words),
          ],
        ],
      ],
      `T.root.color = BLACK    # ${words.rootBlack}`,
    ]),
    rotate('left'),
    rotate('right'),
  ];
}

/** Red-black tree insert: the fix-up's cases 1–3 on both sides, and left and right rotations. */
export const redBlackTree: LocalizedSpec = {
  ko: redBlackWith({
    uncle: '삼촌',
    case1: '경우 1: 삼촌이 빨강',
    case2: '경우 2: 꺾인 모양을 편다',
    case3: '경우 3',
    bstInsert: '이진 탐색 트리처럼 넣기',
    rootBlack: '뿌리는 늘 검정',
  }),
  en: redBlackWith({
    uncle: 'uncle',
    case1: 'case 1: red uncle',
    case2: 'case 2: straighten the zigzag',
    case3: 'case 3',
    bstInsert: 'Insert as in a binary search tree',
    rootBlack: 'the root is always black',
  }),
};
