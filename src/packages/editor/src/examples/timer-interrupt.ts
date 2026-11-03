// Prototype `loadExample('code')` (journal/assets/2026-10-10-ns-prototype.html).
import type { DiagramSpec, LocalizedSpec } from './build-example';
import { event } from './build-example';

/** The words of the example in one language. */
type TimerWords = {
  readonly head: string;
  readonly pressed: string;
  readonly readSensor: string;
  readonly writeLog: string;
};

function timerInterruptWith(words: TimerWords): ReadonlyArray<DiagramSpec> {
  return [
    event(words.head, [
      'tick++;',
      [
        'if',
        'btn_read(BTN1) == PRESSED',
        [
          'debounce_cnt++;',
          [
            'if',
            'debounce_cnt >= 20',
            [`led_toggle(LED1);  // ${words.pressed}`, 'debounce_cnt = 0;'],
            [''],
          ],
        ],
        ['debounce_cnt = 0;'],
      ],
      [
        'range',
        words.readSensor,
        [
          'adc_start(CH0);',
          ['while', '!adc_done()', ['wait_us(10);']],
          'temp = adc_value() * 0.1f;',
        ],
      ],
      ['range', words.writeLog, ['log_buf[log_i] = temp;', 'log_i = (log_i + 1) % LOG_SIZE;']],
      ['doWhile', 'uart_busy()', ['uart_flush();']],
      'return;',
    ]),
  ];
}

/** Timer interrupt: an Event header, two named fold regions and a Do-While. */
export const timerInterrupt: LocalizedSpec = {
  ko: timerInterruptWith({
    head: 'TIM2 인터럽트 (1ms)',
    pressed: '누름 확정',
    readSensor: '센서 읽기',
    writeLog: '로그 남기기',
  }),
  en: timerInterruptWith({
    head: 'TIM2 interrupt (1ms)',
    pressed: 'press confirmed',
    readSensor: 'Read the sensor',
    writeLog: 'Log the reading',
  }),
};
