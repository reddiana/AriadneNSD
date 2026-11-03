import re, sys

# usage: pick.tmp.py file choice1 choice2 ...   one choice per conflict hunk, in order.
# choice: o (ours) | t (theirs) | b (both) | tb (theirs then ours) | lines like o1,o2,t3 (1-based)
p, choices = sys.argv[1], sys.argv[2:]
s = open(p, encoding='utf-8').read()
pat = re.compile(r'<<<<<<< [^\n]*\n(.*?)=======\n(.*?)>>>>>>> [^\n]*\n', re.S)
hunks = list(pat.finditer(s))
assert len(hunks) == len(choices), (len(hunks), len(choices))
out, last = [], 0
for m, c in zip(hunks, choices):
    o, t = m.group(1), m.group(2)
    out.append(s[last:m.start()])
    if c == 'o':
        out.append(o)
    elif c == 't':
        out.append(t)
    elif c == 'b':
        out.append(o + t)
    elif c == 'tb':
        out.append(t + o)
    else:
        ol, tl = o.splitlines(True), t.splitlines(True)
        for part in c.split(','):
            out.append((ol if part[0] == 'o' else tl)[int(part[1:]) - 1])
    last = m.end()
out.append(s[last:])
open(p, 'w', encoding='utf-8', newline='').write(''.join(out))
print(p, len(hunks))
