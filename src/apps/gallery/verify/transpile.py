"""Turns the gallery's block specs (specs.json) into real Python, block by block, with no
interpretation: every condition, bound, index expression and call comes straight from the diagram."""
import json
import re
from pathlib import Path

SPECS = Path(__file__).with_name('specs.json')


def load():
    return json.loads(SPECS.read_text(encoding='utf-8'))


def body(blocks, depth, out):
    start = len(out)
    for b in blocks:
        block(b, depth, out)
    if len(out) == start:
        out.append('    ' * depth + 'pass')


def block(b, depth, out):
    pad = '    ' * depth
    if isinstance(b, str):
        if b != '':
            out.append(pad + b)
        return
    kind = b[0]
    if kind == 'if':
        out.append(f'{pad}if {b[1]}:')
        body(b[2], depth + 1, out)
        if any(x != '' for x in b[3]):
            out.append(f'{pad}else:')
            body(b[3], depth + 1, out)
    elif kind == 'case':
        first = True
        for label, arm in b[2]:
            if label == 'default':
                out.append(f'{pad}else:')
            else:
                out.append(f'{pad}{"if" if first else "elif"} {b[1]} == {label}:')
            first = False
            body(arm, depth + 1, out)
    elif kind in ('while', 'doWhile'):
        assert kind == 'while', 'doWhile not used in the gallery'
        out.append(f'{pad}while {b[1]}:')
        body(b[2], depth + 1, out)
    elif kind == 'for':
        code, sep, note = b[1].partition('    #')
        out.append(f'{pad}{code}:{sep}{note}')
        body(b[2], depth + 1, out)
    elif kind == 'call':
        name = b[1].split('(')[0]
        args = b[2] if len(b) > 2 and b[2] else ''
        result = b[3] if len(b) > 3 and b[3] else ''
        out.append(f'{pad}{result + " = " if result else ""}{name}({args})')
    elif kind == 'range':
        for x in b[2]:
            block(x, depth, out)
    else:
        raise ValueError(kind)


def transpile(diagrams, globals_by_func=None):
    """Returns Python source for all diagrams of one locale. globals_by_func maps a function name
    to the names it shares through module scope (the diagrams leave that implicit)."""
    globals_by_func = globals_by_func or {}
    out = []
    for d in diagrams:
        head = d['head']['text']
        name = head.split('(')[0]
        out.append(f'def {head}:')
        if name in globals_by_func:
            out.append(f'    global {globals_by_func[name]}')
        body(d['body'], 1, out)
        out.append('')
    return '\n'.join(out)


def strip_comments(src):
    """Drops the diagram comments (`    # ...`), the part that differs between locales."""
    return '\n'.join(re.sub(r'\s+#.*$', '', line) for line in src.split('\n'))
