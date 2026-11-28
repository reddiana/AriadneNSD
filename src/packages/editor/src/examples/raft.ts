// Prototype `loadRaftExample()` (journal/assets/2026-10-10-ns-prototype.html).
import type { BlockSpec, DiagramSpec, LocalizedSpec } from './build-example';
import { event, method } from './build-example';

function koRaft(): ReadonlyArray<DiagramSpec> {
  const down: BlockSpec = ['call', '팔로워로 물러난다'];
  const apply: BlockSpec = ['call', '커밋된 항목을 상태 기계에 적용한다'];
  const send: BlockSpec = ['call', '모든 피어에게 로그를 보낸다'];
  return [
    event('선거 타이머가 끝나면', [
      [
        'if',
        '내가 리더인가?',
        [''],
        [
          '후보가 된다',
          '임기를 하나 올린다',
          '나에게 투표한다\n(받은 표 = 1)',
          '선거 타이머를 무작위 시간으로 다시 맞춘다',
          '모든 피어에게 투표 요청을 보낸다\n(임기, 내 마지막 항목의 번호와 임기)',
        ],
      ],
    ]),
    event('투표 요청을 받으면', [
      ['if', '요청의 임기 > 내 임기?', [down], ['']],
      [
        'if',
        '요청의 임기 < 내 임기?',
        ['거절한다고 답한다'],
        [
          [
            'if',
            '이번 임기에 아직 투표하지 않았거나\n이미 이 후보에게 투표했는가?',
            [
              [
                'if',
                '후보의 로그가 내 로그만큼 최신인가?',
                [
                  '이 후보에게 투표했다고 적어 둔다',
                  '선거 타이머를 다시 맞춘다',
                  '투표한다고 답한다',
                ],
                ['거절한다고 답한다'],
              ],
            ],
            ['거절한다고 답한다'],
          ],
        ],
      ],
    ]),
    event('투표 응답을 받으면', [
      [
        'if',
        '응답의 임기 > 내 임기?',
        [down],
        [
          [
            'if',
            '나는 아직 후보이고\n이번 임기의 찬성표인가?',
            [
              '받은 표를 하나 늘린다',
              [
                'if',
                '받은 표가 과반인가?',
                ['리더가 된다', '피어마다 다음에 보낼 번호를\n내 마지막 번호 + 1로 둔다', send],
                [''],
              ],
            ],
            [''],
          ],
        ],
      ],
    ]),
    event('하트비트 타이머가 끝나면', [['if', '내가 리더인가?', [send], ['']]]),
    event('클라이언트 요청을 받으면', [
      [
        'if',
        '내가 리더인가?',
        ['명령을 이번 임기의 새 항목으로\n로그에 붙인다', send],
        ['리더의 주소를 알려 준다'],
      ],
    ]),
    event('로그 복제 요청을 받으면', [
      [
        'if',
        '요청의 임기 < 내 임기?',
        ['실패라고 답한다\n(내 임기를 함께)'],
        [
          ['if', '요청의 임기 > 내 임기\n또는 내가 후보인가?', [down], ['']],
          '선거 타이머를 다시 맞춘다',
          [
            'if',
            '앞 항목의 번호와 임기가 내 로그와 맞는가?',
            [
              '내 로그와 어긋나는 항목부터 뒤를 지운다',
              '새 항목을 로그에 붙인다',
              [
                'if',
                '리더의 커밋 번호 > 내 커밋 번호?',
                ['커밋 번호를 올린다\n(리더의 커밋 번호와 내 마지막 번호 중 작은 쪽)', apply],
                [''],
              ],
              '성공이라고 답한다',
            ],
            ['실패라고 답한다'],
          ],
        ],
      ],
    ]),
    event('로그 복제 응답을 받으면', [
      [
        'if',
        '응답의 임기 > 내 임기?',
        [down],
        [
          [
            'if',
            '성공인가?',
            [
              '그 피어의 맞춘 번호와 다음 번호를 올린다',
              [
                'if',
                '과반이 가진 이번 임기의 항목 가운데\n아직 커밋하지 않은 것이 있는가?',
                ['커밋 번호를 거기까지 올린다', apply],
                [''],
              ],
            ],
            ['그 피어의 다음 번호를 하나 줄인다\n(다음 하트비트 때 다시 보낸다)'],
          ],
        ],
      ],
    ]),
    method('모든 피어에게 로그를 보낸다', [
      [
        'while',
        '아직 보내지 않은 피어가 있는 동안',
        [
          '그 피어에게 보낼 항목을 고른다\n(다음 번호부터 끝까지, 없으면 빈 하트비트)',
          '로그 복제 요청을 보낸다\n(임기, 앞 항목의 번호와 임기, 항목들, 커밋 번호)',
        ],
      ],
    ]),
    method('커밋된 항목을 상태 기계에 적용한다', [
      [
        'while',
        '적용한 번호 < 커밋 번호',
        [
          '적용한 번호를 하나 올린다',
          '그 항목의 명령을 상태 기계에 적용한다',
          ['if', '내가 리더인가?', ['클라이언트에게 결과를 답한다'], ['']],
        ],
      ],
    ]),
    method('팔로워로 물러난다', [
      [
        'if',
        '상대의 임기 > 내 임기?',
        ['내 임기를 상대의 임기로 올린다', '이번 임기의 투표 기록을 지운다'],
        [''],
      ],
      '팔로워가 된다',
    ]),
  ];
}

function enRaft(): ReadonlyArray<DiagramSpec> {
  const down: BlockSpec = ['call', 'Step down to follower'];
  const apply: BlockSpec = ['call', 'Apply committed entries to the state machine'];
  const send: BlockSpec = ['call', 'Send the log to every peer'];
  return [
    event('When the election timer runs out', [
      [
        'if',
        'Am I the leader?',
        [''],
        [
          'Become a candidate',
          'Increase the term by one',
          'Vote for myself\n(votes = 1)',
          'Reset the election timer to a random time',
          'Send a vote request to every peer\n(term, index and term of my last entry)',
        ],
      ],
    ]),
    event('When a vote request arrives', [
      ['if', 'Request term > my term?', [down], ['']],
      [
        'if',
        'Request term < my term?',
        ['Reply: rejected'],
        [
          [
            'if',
            'Not voted yet in this term,\nor already voted for this candidate?',
            [
              [
                'if',
                "Is the candidate's log as up to date as mine?",
                [
                  'Note that I voted for this candidate',
                  'Reset the election timer',
                  'Reply: vote granted',
                ],
                ['Reply: rejected'],
              ],
            ],
            ['Reply: rejected'],
          ],
        ],
      ],
    ]),
    event('When a vote reply arrives', [
      [
        'if',
        'Reply term > my term?',
        [down],
        [
          [
            'if',
            'Still a candidate, and a vote\nfor me in this term?',
            [
              'Add one to the votes',
              [
                'if',
                'Do the votes make a majority?',
                ['Become the leader', "Set each peer's next index\nto my last index + 1", send],
                [''],
              ],
            ],
            [''],
          ],
        ],
      ],
    ]),
    event('When the heartbeat timer runs out', [['if', 'Am I the leader?', [send], ['']]]),
    event('When a client request arrives', [
      [
        'if',
        'Am I the leader?',
        ['Append the command to the log\nas a new entry of this term', send],
        ["Tell the client the leader's address"],
      ],
    ]),
    event('When a log replication request arrives', [
      [
        'if',
        'Request term < my term?',
        ['Reply: failure\n(with my term)'],
        [
          ['if', 'Request term > my term,\nor am I a candidate?', [down], ['']],
          'Reset the election timer',
          [
            'if',
            "Do the previous entry's index and term match my log?",
            [
              'Delete my entries from the first conflict on',
              'Append the new entries to the log',
              [
                'if',
                "Leader's commit index > mine?",
                [
                  "Raise my commit index\n(to the smaller of the leader's commit index\nand my last index)",
                  apply,
                ],
                [''],
              ],
              'Reply: success',
            ],
            ['Reply: failure'],
          ],
        ],
      ],
    ]),
    event('When a log replication reply arrives', [
      [
        'if',
        'Reply term > my term?',
        [down],
        [
          [
            'if',
            'Success?',
            [
              "Raise the peer's match index and next index",
              [
                'if',
                'Is an entry of this term held by a majority\nnot committed yet?',
                ['Raise the commit index up to it', apply],
                [''],
              ],
            ],
            ["Lower the peer's next index by one\n(it is sent again at the next heartbeat)"],
          ],
        ],
      ],
    ]),
    method('Send the log to every peer', [
      [
        'while',
        'While a peer is left to send to',
        [
          'Pick the entries for that peer\n(from its next index to the end,\nor none for a heartbeat)',
          'Send a log replication request\n(term, previous index and term,\nentries, commit index)',
        ],
      ],
    ]),
    method('Apply committed entries to the state machine', [
      [
        'while',
        'applied index < commit index',
        [
          'Increase the applied index by one',
          "Apply that entry's command to the state machine",
          ['if', 'Am I the leader?', ['Reply to the client with the result'], ['']],
        ],
      ],
    ]),
    method('Step down to follower', [
      [
        'if',
        "Other side's term > my term?",
        ["Raise my term to the other side's term", 'Clear my vote for this term'],
        [''],
      ],
      'Become a follower',
    ]),
  ];
}

function deRaft(): ReadonlyArray<DiagramSpec> {
  const down: BlockSpec = ['call', 'Zum Follower zurückstufen'];
  const apply: BlockSpec = ['call', 'Festgeschriebene Einträge auf die Zustandsmaschine anwenden'];
  const send: BlockSpec = ['call', 'Log an alle Peers senden'];
  return [
    event('Wenn der Wahl-Timer abläuft', [
      [
        'if',
        'Bin ich der Leader?',
        [''],
        [
          'Kandidat werden',
          'Amtszeit um eins erhöhen',
          'Für mich selbst stimmen\n(Stimmen = 1)',
          'Wahl-Timer auf eine zufällige Zeit zurücksetzen',
          'Wahlanfrage an alle Peers senden\n(Amtszeit, Index und Amtszeit meines letzten Eintrags)',
        ],
      ],
    ]),
    event('Wenn eine Wahlanfrage eintrifft', [
      ['if', 'Amtszeit der Anfrage > meine Amtszeit?', [down], ['']],
      [
        'if',
        'Amtszeit der Anfrage < meine Amtszeit?',
        ['Antworten: abgelehnt'],
        [
          [
            'if',
            'In dieser Amtszeit noch nicht gewählt\noder schon für diesen Kandidaten?',
            [
              [
                'if',
                'Ist das Log des Kandidaten mindestens so aktuell wie meines?',
                [
                  'Vermerken, dass ich für diesen Kandidaten gestimmt habe',
                  'Wahl-Timer zurücksetzen',
                  'Antworten: Stimme erteilt',
                ],
                ['Antworten: abgelehnt'],
              ],
            ],
            ['Antworten: abgelehnt'],
          ],
        ],
      ],
    ]),
    event('Wenn eine Wahlantwort eintrifft', [
      [
        'if',
        'Amtszeit der Antwort > meine Amtszeit?',
        [down],
        [
          [
            'if',
            'Noch Kandidat und eine Stimme\nfür mich in dieser Amtszeit?',
            [
              'Stimmen um eins erhöhen',
              [
                'if',
                'Haben die Stimmen die Mehrheit?',
                [
                  'Leader werden',
                  'Nächsten Index jedes Peers\nauf meinen letzten Index + 1 setzen',
                  send,
                ],
                [''],
              ],
            ],
            [''],
          ],
        ],
      ],
    ]),
    event('Wenn der Heartbeat-Timer abläuft', [['if', 'Bin ich der Leader?', [send], ['']]]),
    event('Wenn eine Client-Anfrage eintrifft', [
      [
        'if',
        'Bin ich der Leader?',
        ['Befehl als neuen Eintrag dieser Amtszeit\nan das Log anhängen', send],
        ['Dem Client die Adresse des Leaders mitteilen'],
      ],
    ]),
    event('Wenn eine Log-Replikationsanfrage eintrifft', [
      [
        'if',
        'Amtszeit der Anfrage < meine Amtszeit?',
        ['Antworten: fehlgeschlagen\n(mit meiner Amtszeit)'],
        [
          ['if', 'Amtszeit der Anfrage > meine Amtszeit\noder bin ich Kandidat?', [down], ['']],
          'Wahl-Timer zurücksetzen',
          [
            'if',
            'Passen Index und Amtszeit des vorigen Eintrags zu meinem Log?',
            [
              'Meine Einträge ab dem ersten Konflikt löschen',
              'Neue Einträge an das Log anhängen',
              [
                'if',
                'Commit-Index des Leaders > meiner?',
                [
                  'Meinen Commit-Index erhöhen\n(auf den kleineren Wert von Commit-Index\ndes Leaders und meinem letzten Index)',
                  apply,
                ],
                [''],
              ],
              'Antworten: erfolgreich',
            ],
            ['Antworten: fehlgeschlagen'],
          ],
        ],
      ],
    ]),
    event('Wenn eine Log-Replikationsantwort eintrifft', [
      [
        'if',
        'Amtszeit der Antwort > meine Amtszeit?',
        [down],
        [
          [
            'if',
            'Erfolgreich?',
            [
              'Match-Index und nächsten Index des Peers erhöhen',
              [
                'if',
                'Hält eine Mehrheit einen noch nicht\nfestgeschriebenen Eintrag dieser Amtszeit?',
                ['Commit-Index bis dorthin erhöhen', apply],
                [''],
              ],
            ],
            [
              'Nächsten Index des Peers um eins verringern\n(beim nächsten Heartbeat wird erneut gesendet)',
            ],
          ],
        ],
      ],
    ]),
    method('Log an alle Peers senden', [
      [
        'while',
        'Solange noch ein Peer übrig ist',
        [
          'Einträge für diesen Peer auswählen\n(von seinem nächsten Index bis zum Ende,\nbeim Heartbeat keine)',
          'Log-Replikationsanfrage senden\n(Amtszeit, vorheriger Index und Amtszeit,\nEinträge, Commit-Index)',
        ],
      ],
    ]),
    method('Festgeschriebene Einträge auf die Zustandsmaschine anwenden', [
      [
        'while',
        'angewandter Index < Commit-Index',
        [
          'Angewandten Index um eins erhöhen',
          'Befehl dieses Eintrags auf die Zustandsmaschine anwenden',
          ['if', 'Bin ich der Leader?', ['Dem Client mit dem Ergebnis antworten'], ['']],
        ],
      ],
    ]),
    method('Zum Follower zurückstufen', [
      [
        'if',
        'Amtszeit der Gegenseite > meine Amtszeit?',
        [
          'Meine Amtszeit auf die der Gegenseite anheben',
          'Meine Stimme für diese Amtszeit löschen',
        ],
        [''],
      ],
      'Follower werden',
    ]),
  ];
}

/** Raft consensus: seven Event handlers and three Methods. */
export const raft: LocalizedSpec = { ko: koRaft(), en: enRaft(), de: deRaft() };
