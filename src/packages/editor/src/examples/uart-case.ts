// Prototype `loadCaseExample()` (journal/assets/2026-10-10-ns-prototype.html).
import type { DiagramSpec, LocalizedSpec } from './build-example';
import { event } from './build-example';

function uartCaseWith(head: string): ReadonlyArray<DiagramSpec> {
  return [
    event(head, [
      'cmd = uart_read();',
      [
        'case',
        'cmd',
        [
          ['CMD_START', ['motor_on();', 'state = RUN;']],
          [
            'CMD_STOP',
            ['motor_off();', ['if', 'brake_enabled', ['brake_on();'], ['']], 'state = IDLE;'],
          ],
          ['CMD_SPEED', ['speed = uart_read();', 'pwm_set(speed);']],
          ['default', ['error_cnt++;']],
        ],
      ],
      'uart_write(ACK);',
    ]),
  ];
}

/** UART commands: a Case with four branches. */
export const uartCase: LocalizedSpec = {
  ko: uartCaseWith('UART 수신 인터럽트'),
  en: uartCaseWith('UART receive interrupt'),
};
