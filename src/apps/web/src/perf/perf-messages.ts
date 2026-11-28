// The screen strings of the check mode (`?perf`, 06-web 9). They live here, not in the shell
// catalog (shell/messages.ts), so that they are fetched only with the check mode: a first visit
// downloads none of them (QA-09). The rules are the shell catalog's (coding guide 8).

import type { CatalogEntry, Locale } from '@ariadne-nsd/core';
import { catalogEntriesOf } from '@ariadne-nsd/core';

const english = {
  'perf.title': 'Check mode: edit response time (AT-05)',
  'perf.intro':
    'This page measures how fast the editor answers in a document of {blocks} blocks. It makes the document itself, runs {commands} common commands {rounds} times each at the start, the middle and the end, and times each from the key to the frame after the drawing changed.',
  'perf.criterion': 'A command passes when its p95 is {limit} ms or less (QA-07).',
  'perf.advice':
    'Close the other tabs and apps, plug in the charger, and do not touch the page while it measures. It takes about a minute; longer on a slow device.',
  'perf.safe':
    'Nothing is saved: the measured document is thrown away, and your files, local backup, recent files and documents in this browser are left as they are.',
  'perf.start': 'Start Measuring',
  'perf.again': 'Measure Again',
  'perf.back': 'Back to the Editor',
  'perf.preparing': 'Making the document of {blocks} blocks…',
  'perf.progress': 'Measuring “{command}” ({done} of {total})…',
  'perf.failed': 'The measurement stopped: {reason}',
  'perf.verdict.pass': 'Pass. Every command’s p95 is {limit} ms or less.',
  'perf.verdict.fail': 'Fail. {count} of {total} commands have a p95 over {limit} ms.',
  'perf.column.command': 'Command',
  'perf.column.keys': 'Keys',
  'perf.column.median': 'Median (ms)',
  'perf.column.p95': 'p95 (ms)',
  'perf.column.max': 'Max (ms)',
  'perf.column.verdict': 'Verdict',
  'perf.pass': 'Pass',
  'perf.fail': 'Fail',
  'perf.copy': 'Copy Results',
  'perf.copied': 'Copied the results as a Markdown table.',
  'perf.copyManually': 'The clipboard is not available. Copy the results from here:',
  'perf.report.verdict': 'Verdict',
  'perf.report.version': 'App version',
  'perf.report.date': 'Date',
  'perf.report.document': 'Document',
  'perf.report.documentValue':
    '{blocks} blocks; {samples} times per command ({warmup} warm-up runs left out)',
  'perf.report.browser': 'Browser',
  'perf.report.device': 'Device',
  'perf.report.deviceValue': 'CPU cores: {cores} · memory: {memory} · screen: {screen}',
  'perf.report.unknown': 'unknown',
  'perf.command.insert': 'Insert a process block',
  'perf.command.delete': 'Delete a block',
  'perf.command.undo': 'Undo',
  'perf.command.redo': 'Redo',
  'perf.command.wrap': 'Wrap in If',
  'perf.command.move': 'Move down',
  'perf.command.paste': 'Paste a block',
  'perf.command.text': 'Accept an edited text',
  'perf.segments.title': 'Segments (p95, ms)',
  'perf.segments.note':
    'The same runs split along the path of an edit (QA-07, the connectors of the C&C view under each title). Each column is that segment’s own p95, so a row does not add up to the command’s p95.',
  'perf.segment.input': 'Key',
  'perf.segment.command': 'Edit',
  'perf.segment.check': 'Check',
  'perf.segment.layout': 'Layout',
  'perf.segment.draw': 'Drawing',
  'perf.segment.notify': 'Notify',
  'perf.segment.dom': 'DOM',
  'perf.segment.paint': 'Browser',
} as const;

/** The key of a check mode screen string. */
export type PerfMessageKey = keyof typeof english;

const korean: Record<PerfMessageKey, string> = {
  'perf.title': '점검 모드: 편집 응답 시간 (AT-05)',
  'perf.intro':
    '블록 {blocks}개 문서에서 편집기가 얼마나 빨리 답하는지 잽니다. 문서를 스스로 만들고, 자주 쓰는 명령 {commands}가지를 문서의 앞 · 가운데 · 끝에서 각각 {rounds}번씩 실행해, 키를 누른 때부터 그림이 바뀐 다음 프레임까지를 잽니다.',
  'perf.criterion': '명령마다 p95가 {limit}ms 이하이면 합격입니다(QA-07).',
  'perf.advice':
    '다른 탭과 앱을 닫고, 충전기를 꽂고, 재는 동안에는 화면을 건드리지 마세요. 1분쯤 걸리고, 느린 기기에서는 더 걸립니다.',
  'perf.safe':
    '아무것도 저장하지 않습니다. 잰 문서는 버리고, 파일 · 로컬 백업 · 최근 파일 · 이 브라우저의 문서는 그대로 둡니다.',
  'perf.start': '측정 시작',
  'perf.again': '다시 측정',
  'perf.back': '편집기로 돌아가기',
  'perf.preparing': '블록 {blocks}개 문서를 만드는 중…',
  'perf.progress': '“{command}”을(를) 재는 중 ({total}번 중 {done}번)…',
  'perf.failed': '측정이 멈췄습니다: {reason}',
  'perf.verdict.pass': '합격. 모든 명령의 p95가 {limit}ms 이하입니다.',
  'perf.verdict.fail': '불합격. 명령 {total}가지 중 {count}가지의 p95가 {limit}ms를 넘습니다.',
  'perf.column.command': '명령',
  'perf.column.keys': '키',
  'perf.column.median': '중앙값 (ms)',
  'perf.column.p95': 'p95 (ms)',
  'perf.column.max': '최댓값 (ms)',
  'perf.column.verdict': '판정',
  'perf.pass': '합격',
  'perf.fail': '불합격',
  'perf.copy': '결과 복사',
  'perf.copied': '결과를 마크다운 표로 복사했습니다.',
  'perf.copyManually': '클립보드를 쓸 수 없습니다. 여기서 결과를 복사하세요:',
  'perf.report.verdict': '판정',
  'perf.report.version': '앱 판',
  'perf.report.date': '날짜',
  'perf.report.document': '문서',
  'perf.report.documentValue': '블록 {blocks}개, 명령마다 {samples}번 (웜업 {warmup}번은 버림)',
  'perf.report.browser': '브라우저',
  'perf.report.device': '기기',
  'perf.report.deviceValue': 'CPU 코어: {cores} · 메모리: {memory} · 화면: {screen}',
  'perf.report.unknown': '모름',
  'perf.command.insert': '처리 블록 넣기',
  'perf.command.delete': '블록 지우기',
  'perf.command.undo': '실행 취소',
  'perf.command.redo': '다시 실행',
  'perf.command.wrap': '조건 블록으로 감싸기',
  'perf.command.move': '아래로 이동',
  'perf.command.paste': '블록 붙여넣기',
  'perf.command.text': '고친 글자 받아들이기',
  'perf.segments.title': '구간별 p95 (ms)',
  'perf.segments.note':
    '같은 실행을 편집의 길을 따라 나눈 것입니다(QA-07, 제목 아래는 C&C 뷰의 커넥터). 칸마다 그 구간만의 p95라서, 한 줄을 더해도 명령의 p95가 되지 않습니다.',
  'perf.segment.input': '입력',
  'perf.segment.command': '편집 명령',
  'perf.segment.check': '불변식 검사',
  'perf.segment.layout': '레이아웃',
  'perf.segment.draw': '그림',
  'perf.segment.notify': '알림',
  'perf.segment.dom': 'DOM 반영',
  'perf.segment.paint': '브라우저',
};

const german: Record<PerfMessageKey, string> = {
  'perf.title': 'Prüfmodus: Antwortzeit beim Bearbeiten (AT-05)',
  'perf.intro':
    'Diese Seite misst, wie schnell der Editor in einem Dokument mit {blocks} Blöcken reagiert. Sie erstellt das Dokument selbst, führt {commands} häufige Befehle jeweils {rounds}-mal am Anfang, in der Mitte und am Ende aus und misst jeweils die Zeit vom Tastendruck bis zum Frame nach der Änderung der Zeichnung.',
  'perf.criterion': 'Ein Befehl besteht, wenn sein p95 höchstens {limit} ms beträgt (QA-07).',
  'perf.advice':
    'Schließen Sie die anderen Tabs und Apps, schließen Sie das Ladegerät an und berühren Sie die Seite während der Messung nicht. Sie dauert etwa eine Minute, auf einem langsamen Gerät länger.',
  'perf.safe':
    'Es wird nichts gespeichert: Das gemessene Dokument wird verworfen, und Ihre Dateien, die lokale Sicherung, die zuletzt verwendeten Dateien und die Dokumente in diesem Browser bleiben unverändert.',
  'perf.start': 'Messung starten',
  'perf.again': 'Erneut messen',
  'perf.back': 'Zurück zum Editor',
  'perf.preparing': 'Dokument mit {blocks} Blöcken wird erstellt…',
  'perf.progress': '„{command}“ wird gemessen ({done} von {total})…',
  'perf.failed': 'Die Messung wurde abgebrochen: {reason}',
  'perf.verdict.pass': 'Bestanden. Der p95 jedes Befehls beträgt höchstens {limit} ms.',
  'perf.verdict.fail':
    'Nicht bestanden. {count} von {total} Befehlen haben einen p95 über {limit} ms.',
  'perf.column.command': 'Befehl',
  'perf.column.keys': 'Tasten',
  'perf.column.median': 'Median (ms)',
  'perf.column.p95': 'p95 (ms)',
  'perf.column.max': 'Max. (ms)',
  'perf.column.verdict': 'Ergebnis',
  'perf.pass': 'Bestanden',
  'perf.fail': 'Nicht bestanden',
  'perf.copy': 'Ergebnisse kopieren',
  'perf.copied': 'Ergebnisse als Markdown-Tabelle kopiert.',
  'perf.copyManually':
    'Die Zwischenablage ist nicht verfügbar. Kopieren Sie die Ergebnisse von hier:',
  'perf.report.verdict': 'Ergebnis',
  'perf.report.version': 'App-Version',
  'perf.report.date': 'Datum',
  'perf.report.document': 'Dokument',
  'perf.report.documentValue':
    '{blocks} Blöcke; {samples} Läufe pro Befehl ({warmup} Aufwärmläufe nicht gezählt)',
  'perf.report.browser': 'Browser',
  'perf.report.device': 'Gerät',
  'perf.report.deviceValue':
    'CPU-Kerne: {cores} · Arbeitsspeicher: {memory} · Bildschirm: {screen}',
  'perf.report.unknown': 'unbekannt',
  'perf.command.insert': 'Anweisung einfügen',
  'perf.command.delete': 'Block löschen',
  'perf.command.undo': 'Rückgängig',
  'perf.command.redo': 'Wiederholen',
  'perf.command.wrap': 'Mit Verzweigung umschließen',
  'perf.command.move': 'Nach unten verschieben',
  'perf.command.paste': 'Block einfügen',
  'perf.command.text': 'Bearbeiteten Text übernehmen',
  'perf.segments.title': 'Abschnitte (p95, ms)',
  'perf.segments.note':
    'Dieselben Läufe, aufgeteilt entlang des Wegs einer Bearbeitung (QA-07, die Konnektoren der C&C-Sicht unter jedem Titel). Jede Spalte ist der eigene p95 dieses Abschnitts, daher ergibt eine Zeile in der Summe nicht den p95 des Befehls.',
  'perf.segment.input': 'Taste',
  'perf.segment.command': 'Bearbeitung',
  'perf.segment.check': 'Prüfung',
  'perf.segment.layout': 'Layout',
  'perf.segment.draw': 'Zeichnen',
  'perf.segment.notify': 'Benachrichtigung',
  'perf.segment.dom': 'DOM',
  'perf.segment.paint': 'Browser',
};

const catalogs: Record<Locale, Record<PerfMessageKey, string>> = {
  en: english,
  ko: korean,
  de: german,
};

/** Returns a check mode string in `locale`, with `{name}`-style placeholders filled. */
export function perfMessage(
  locale: Locale,
  key: PerfMessageKey,
  values: Readonly<Record<string, string | number>> = {},
): string {
  return catalogs[locale][key].replaceAll(/\{(\w+)\}/g, (match, name: string) => {
    const value = values[name];
    return value === undefined ? match : String(value);
  });
}

/** Every key of the check mode catalog in every screen language, for checks (QA-13). */
export function perfCatalogEntries(): ReadonlyArray<CatalogEntry> {
  return catalogEntriesOf(catalogs);
}
