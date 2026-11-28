// Producer–consumer for the algorithm gallery (Dijkstra's bounded buffer): two threads that run
// at the same time, each in an endless loop that ends on the end marker. It shows the parallel,
// endless loop and exit blocks (R-BLK-13 · R-BLK-15 · R-BLK-12).
import type { DiagramSpec, LocalizedSpec } from '../examples/build-example';
import { event, method } from '../examples/build-example';

type ProducerConsumerWords = {
  readonly freeSlots: string;
  readonly fullSlots: string;
  readonly noneAtEnd: string;
  readonly waitFree: string;
  readonly waitFull: string;
  readonly markerSent: string;
  readonly markerSeen: string;
  readonly bothDone: string;
};

function producerConsumerWith(words: ProducerConsumerWords): ReadonlyArray<DiagramSpec> {
  return [
    event('main()', [
      'buf = deque()',
      `empty = Semaphore(N)    # ${words.freeSlots}`,
      `full = Semaphore(0)     # ${words.fullSlots}`,
      'mutex = Lock()',
      ['parallel', '', [[['call', 'producer()']], [['call', 'consumer()']]]],
      `print("${words.bothDone}")`,
    ]),
    method('producer()', [
      [
        'endless',
        [
          `item = produce()    # ${words.noneAtEnd}`,
          `empty.acquire()     # ${words.waitFree}`,
          'with mutex: buf.append(item)',
          'full.release()',
          ['if', 'item is None', [['exit', `break    # ${words.markerSent}`]], ['']],
        ],
      ],
    ]),
    method('consumer()', [
      [
        'endless',
        [
          `full.acquire()    # ${words.waitFull}`,
          'with mutex: item = buf.popleft()',
          'empty.release()',
          ['if', 'item is None', [['exit', `break    # ${words.markerSeen}`]], ['']],
          'consume(item)',
        ],
      ],
    ]),
  ];
}

/** Producer–consumer: a bounded buffer of N slots guarded by two semaphores and a lock. */
export const producerConsumer: LocalizedSpec = {
  ko: producerConsumerWith({
    freeSlots: '빈 칸 수',
    fullSlots: '찬 칸 수',
    noneAtEnd: '다 만들면 None',
    waitFree: '빈 칸이 날 때까지 기다린다',
    waitFull: '찬 칸이 생길 때까지 기다린다',
    markerSent: '끝 표시까지 넣었다',
    markerSeen: '끝 표시를 받았다',
    bothDone: '둘 다 끝남',
  }),
  en: producerConsumerWith({
    freeSlots: 'free slots',
    fullSlots: 'filled slots',
    noneAtEnd: 'None when done',
    waitFree: 'wait for a free slot',
    waitFull: 'wait for an item',
    markerSent: 'the end marker is in',
    markerSeen: 'got the end marker',
    bothDone: 'both done',
  }),
  de: producerConsumerWith({
    freeSlots: 'freie Plätze',
    fullSlots: 'belegte Plätze',
    noneAtEnd: 'None am Ende',
    waitFree: 'auf einen freien Platz warten',
    waitFull: 'auf ein Element warten',
    markerSent: 'die Endmarke ist drin',
    markerSeen: 'Endmarke erhalten',
    bothDone: 'beide fertig',
  }),
};
