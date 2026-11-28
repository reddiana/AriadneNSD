// The German table of messages.ts (keys from messages.en.ts), fetched when the screen first shows German (core `lazyCatalog`).

import type { ShellMessageKey } from './messages.en';

export const german: Record<ShellMessageKey, string> = {
  'file.recent.empty': 'Keine zuletzt verwendeten Dateien',
  'file.recent.browserCopy': 'Browserkopie',
  'file.recent.browser': 'Browser',
  'file.recent.missing': 'Die Datei wurde verschoben oder gelöscht.',
  'file.untitled': 'Unbenannt',
  'notice.downloadInstead':
    'Dieser Browser kann nicht in die Originaldatei schreiben, daher lädt Speichern eine Kopie in Ihren Download-Ordner herunter.',
  'notice.askName': 'Dateiname für den Download:',
  'notice.restore':
    'In „{name}“ gibt es nicht gespeicherte Änderungen vom letzten Mal. Wiederherstellen?',
  'notice.notSavedToFile':
    'Die Änderungen an „{name}“ wurden nicht in der Datei gespeichert. Sie bleiben in diesem Browser erhalten.',
  'notice.otherTab':
    'Ein anderer Tab bearbeitet diese Datei. In diesem Tab können Sie sie nur ansehen.',
  'notice.otherTabClosed':
    'Der andere Tab wurde geschlossen. Sie können diese Datei jetzt bearbeiten.',
  'notice.autosaveStopped':
    'Automatisches Speichern angehalten: keine Berechtigung zum Schreiben der Datei. Drücken Sie Strg+S, um zu speichern und es wieder zu erlauben.',
  'notice.exported': '„{name}“ exportiert.',
  'notice.exportFailed': 'PNG konnte nicht exportiert werden.',
  'notice.exportSvgFailed': 'SVG konnte nicht exportiert werden.',
  'notice.exportPdfFailed': 'PDF konnte nicht exportiert werden.',
  'notice.printFailed': 'Die Seiten konnten nicht für den Druck vorbereitet werden.',
  'notice.readFailed': '„{name}“ konnte nicht gelesen werden.',
  'notice.dropOne': 'Legen Sie jeweils nur eine Datei ab.',
  'open.noModel': '„{name}“ enthält kein AriadneNSD-Modell und lässt sich daher nicht bearbeiten.',
  'open.prototype':
    '„{name}“ wurde mit dem AriadneNSD-Prototyp erstellt. Diese Version kann sein Format nicht öffnen.',
  'open.damaged':
    '„{name}“ ist beschädigt und lässt sich nicht bearbeiten. Die Datei wurde nicht verändert.',
  'open.newerVersion':
    '„{name}“ wurde mit einer neueren Version von AriadneNSD gespeichert. Laden Sie die Seite neu und öffnen Sie die Datei erneut.',
  'notice.saveNewFirst':
    '„{name}“ ist ein neues Dokument, das noch nie gespeichert wurde. Sobald ein anderes Dokument geöffnet wird, lässt es sich nicht zurückholen. Zuerst speichern?',
  'choice.restore': 'Wiederherstellen',
  'choice.discard': 'Verwerfen',
  'choice.save': 'Speichern',
  'choice.discardAndOpen': 'Verwerfen und öffnen',
  'drop.hint': 'Legen Sie eine .ns.svg- oder .ns-Datei ab, um sie zu öffnen',
  'command.share': 'Freigabelink kopieren',
  'notice.shareCopied': 'Freigabelink kopiert. Jeder mit dem Link kann dieses Diagramm ansehen.',
  'notice.shareLong':
    'Freigabelink kopiert, aber er ist lang ({size} KB): Manche Apps kürzen lange Links. Die Datei zu teilen ist sicherer.',
  'notice.shareTooLong':
    'Dieses Diagramm ist zu groß für einen Link ({size} KB). Teilen Sie stattdessen die Datei (Datei › Speichern).',
  'notice.shareFailed': 'Der Freigabelink konnte nicht erstellt werden.',
  'share.copyManually': 'Die Zwischenablage ist nicht verfügbar. Kopieren Sie diesen Freigabelink:',
  'link.newerVersion':
    'Dieser Freigabelink wurde mit einer neueren Version von AriadneNSD erstellt. Laden Sie die Seite neu, um ihn zu öffnen.',
  'link.tooLarge': 'Dieser Freigabelink ist zu groß zum Öffnen.',
  'link.unsupported':
    'Dieser Browser kann komprimierte Freigabelinks nicht öffnen. Öffnen Sie den Link in einer aktuellen Version von Chrome, Edge, Firefox oder Safari.',
  'link.damaged':
    'Dieser Freigabelink ist beschädigt (vielleicht abgeschnitten) und lässt sich nicht öffnen.',
  'link.failed':
    '{message}\nGrund: {detail}\nWenn eine KI diesen Link erstellt hat, kopieren Sie den Grund und fügen Sie ihn bei dieser KI ein: Sie kann den Link korrigieren.',
  'link.copyReasonManually': 'Die Zwischenablage ist nicht verfügbar. Kopieren Sie diesen Grund:',
  'notice.reasonCopied': 'Grund kopiert. Fügen Sie ihn bei der KI ein, die den Link erstellt hat.',
  'choice.copyReason': 'Grund kopieren',
  'choice.close': 'Schließen',
  'command.openPasted': 'Aus eingefügtem JSON öffnen…',
  'paste.title': 'Aus eingefügtem JSON öffnen',
  'paste.prompt':
    'Fügen Sie das Modell-JSON oder den Freigabelink ein, den Ihnen eine KI gegeben hat.',
  'choice.open': 'Öffnen',
  'paste.notDocument': 'Dieser Text ist kein AriadneNSD-Dokument (Modell-JSON oder Freigabelink).',
  'paste.newerVersion':
    'Dieses Dokument wurde mit einer neueren Version von AriadneNSD erstellt. Laden Sie die Seite neu, um es zu öffnen.',
  'paste.damaged': 'Dieses Modell-JSON ist beschädigt und lässt sich nicht öffnen.',
  'notice.pasteReasonCopied':
    'Grund kopiert. Fügen Sie ihn bei der KI ein, die den Text geschrieben hat.',
  'paste.failed':
    '{message}\nGrund: {detail}\nWenn eine KI diesen Text geschrieben hat, kopieren Sie den Grund und fügen Sie ihn bei dieser KI ein: Sie kann das JSON korrigieren.',
  'notice.browserFull':
    'Der Speicher des Browsers ist voll, daher konnte nicht gespeichert werden. Speichern Sie stattdessen in einer Datei.',
  'notice.replace': '„{name}“ existiert bereits in diesem Browser. Ersetzen?',
  'notice.deleteBrowser':
    '„{name}“ aus diesem Browser löschen? Das lässt sich nicht rückgängig machen.',
  'notice.renamePrompt': 'Neuer Name:',
  'notice.nameTaken': '„{name}“ existiert bereits in diesem Browser.',
  'notice.browserMissing': '„{name}“ ist nicht mehr in diesem Browser.',
  'notice.savedInBrowser': '„{name}“ in diesem Browser gespeichert.',
  'notice.deletedOpen':
    '„{name}“ wurde aus diesem Browser gelöscht. Das Diagramm auf dem Bildschirm ist jetzt ein neues, nicht gespeichertes Dokument.',
  'notice.exportedAll': 'Dokumente nach „{name}“ exportiert: {count}.',
  'notice.exportDocumentFailed': '„{name}“ konnte nicht exportiert werden.',
  'notice.imported': 'Dokumente in diesen Browser importiert: {count}.',
  'notice.importSkipped': 'Nicht importiert, da nicht bearbeitbar: {names}',
  'choice.replace': 'Ersetzen',
  'choice.delete': 'Löschen',
  'choice.saveInBrowser': 'Im Browser speichern',
};
