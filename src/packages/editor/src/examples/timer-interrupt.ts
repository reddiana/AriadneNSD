// Prototype `loadExample('code')` (journal/assets/2026-10-10-ns-prototype.html).
import type { DiagramSpec } from './build-example';
import { event } from './build-example';

/** Timer interrupt: an Event header, two named fold regions and a Do-While. */
export const timerInterrupt: ReadonlyArray<DiagramSpec> = [
  event('TIM2 인터럽트 (1ms)', [
    'tick++;',
    [
      'if',
      'btn_read(BTN1) == PRESSED',
      [
        'debounce_cnt++;',
        [
          'if',
          'debounce_cnt >= 20',
          ['led_toggle(LED1);  // 누름 확정', 'debounce_cnt = 0;'],
          [''],
        ],
      ],
      ['debounce_cnt = 0;'],
    ],
    [
      'range',
      '센서 읽기',
      ['adc_start(CH0);', ['while', '!adc_done()', ['wait_us(10);']], 'temp = adc_value() * 0.1f;'],
    ],
    ['range', '로그 남기기', ['log_buf[log_i] = temp;', 'log_i = (log_i + 1) % LOG_SIZE;']],
    ['doWhile', 'uart_busy()', ['uart_flush();']],
    'return;',
  ]),
];
