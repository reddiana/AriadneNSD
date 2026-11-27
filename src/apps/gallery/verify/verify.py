"""Checks the algorithm gallery diagrams by running their code text against references.
Usage: python verify.py [-v]   (run.sh dumps specs.json first)"""
import contextlib
import io
import itertools
import random
import sys
import unittest
from collections import defaultdict, deque
from heapq import heappop, heappush
from math import gcd as math_gcd

import transpile

SPECS = transpile.load()
INF = float('inf')
# Names the diagrams share through module scope without saying so.
SHARED = {
    'dfs': {'dfs_all': 'visited, order'},
    'union-find': {'make_sets': 'parent, rank'},
    'segment-tree': {'main': 'a, n, tree'},
    'n-queens': {'main': 'n, board, solutions, cols, diag1, diag2'},
    'producer-consumer': {'main': 'buf, empty, full, mutex'},
}


def load(algo, locale='en', extra=None):
    src = transpile.transpile(SPECS[algo][locale], SHARED.get(algo))
    ns = {'INF': INF, 'deque': deque, 'heappop': heappop, 'heappush': heappush}
    ns.update(extra or {})
    exec(compile(src, f'{algo}.{locale}.py', 'exec'), ns)
    return ns


def run_main(ns):
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        ns['main']()
    return buf.getvalue().split('\n')[:-1]


def random_graph(rnd, max_n=9, max_e=14):
    n = rnd.randint(0, max_n)
    g = {v: [] for v in range(n)}
    for _ in range(rnd.randint(0, max_e)):
        if n:
            g[rnd.randrange(n)].append(rnd.randrange(n))
    return n, g


class Locales(unittest.TestCase):
    def test_ko_code_equals_en_code(self):
        for algo, spec in SPECS.items():
            ko = transpile.strip_comments(transpile.transpile(spec['ko']))
            en = transpile.strip_comments(transpile.transpile(spec['en']))
            if algo == 'hanoi':  # only the printed sentence is localized
                ko = ko.replace('원반 {n}', 'disk {n}')
            if algo == 'producer-consumer':  # and here
                ko = ko.replace('둘 다 끝남', 'both done')
            self.assertEqual(ko, en, algo)

    def test_all_locales_compile(self):
        for algo in SPECS:
            for loc in ('ko', 'en'):
                load(algo, loc)


class Gcd(unittest.TestCase):
    ns = load('gcd')

    def test_main(self):
        self.assertEqual(run_main(self.ns), ['2', '-9 47'])

    def test_random(self):
        rnd = random.Random(1)
        pairs = [(0, 0), (0, 5), (5, 0), (1, 1), (7, 7), (240, 46), (46, 240)]
        pairs += [(rnd.randint(0, 10**6), rnd.randint(0, 10**6)) for _ in range(2000)]
        for a, b in pairs:
            self.assertEqual(self.ns['gcd'](a, b), math_gcd(a, b))
            g, x, y = self.ns['ext_gcd'](a, b)
            self.assertEqual(g, math_gcd(a, b))
            self.assertEqual(a * x + b * y, g, (a, b))


class HeapSort(unittest.TestCase):
    ns = load('heap-sort')

    def test_random(self):
        rnd = random.Random(2)
        cases = [[], [1], [2, 1], [1, 2], [3, 3, 3], list(range(10)), list(range(10, 0, -1))]
        for _ in range(1500):
            cases.append([rnd.randint(-5, 5) for _ in range(rnd.randint(0, 40))])
        for c in cases:
            a = list(c)
            self.ns['heap_sort'](a)
            self.assertEqual(a, sorted(c), c)

    def test_sift_down_builds_max_heap(self):
        rnd = random.Random(3)
        for _ in range(300):
            a = [rnd.randint(0, 50) for _ in range(rnd.randint(0, 30))]
            n = len(a)
            for i in range(n // 2 - 1, -1, -1):
                self.ns['sift_down'](a, i, n)
            for i in range(1, n):
                self.assertGreaterEqual(a[(i - 1) // 2], a[i])


def brute_find(text, pat):
    return [i for i in range(len(text) - len(pat) + 1) if text[i:i + len(pat)] == pat]


class Kmp(unittest.TestCase):
    ns = load('kmp')

    def test_fixed(self):
        s = self.ns['kmp_search']
        self.assertEqual(s('aaaa', 'aa'), [0, 1, 2])
        self.assertEqual(s('abababab', 'abab'), [0, 2, 4])
        self.assertEqual(s('abc', 'abcd'), [])
        self.assertEqual(s('', 'a'), [])
        self.assertEqual(s('a', 'a'), [0])
        self.assertEqual(s('ababcabcabababd', 'ababd'), [10])

    def test_empty_pattern_is_not_supported(self):
        with self.assertRaises(IndexError):
            self.ns['kmp_search']('abc', '')

    def test_random(self):
        rnd = random.Random(4)
        for _ in range(4000):
            alphabet = rnd.choice(['ab', 'abc'])
            text = ''.join(rnd.choice(alphabet) for _ in range(rnd.randint(0, 25)))
            pat = ''.join(rnd.choice(alphabet) for _ in range(rnd.randint(1, 6)))
            self.assertEqual(self.ns['kmp_search'](text, pat), brute_find(text, pat), (text, pat))

    def test_prefix_function(self):
        rnd = random.Random(5)
        for _ in range(1000):
            p = ''.join(rnd.choice('ab') for _ in range(rnd.randint(1, 12)))
            exp = [max((k for k in range(i + 1) if p[:k] == p[i + 1 - k:i + 1]), default=0) for i in range(len(p))]
            self.assertEqual(self.ns['prefix_function'](p), exp, p)


class UnionFind(unittest.TestCase):
    ns = load('union-find')

    @staticmethod
    def components(n, edges):
        p = list(range(n))

        def f(x):
            while p[x] != x:
                x = p[x]
            return x
        for _, u, v in edges:
            p[f(u)] = f(v)
        return len({f(i) for i in range(n)})

    @staticmethod
    def prim_weight(n, edges):
        adj = defaultdict(list)
        for w, u, v in edges:
            adj[u].append((w, v))
            adj[v].append((w, u))
        seen, total = set(), 0
        for s in range(n):
            if s in seen:
                continue
            h = [(0, s)]
            while h:
                w, u = heappop(h)
                if u in seen:
                    continue
                seen.add(u)
                total += w
                for w2, v in adj[u]:
                    if v not in seen:
                        heappush(h, (w2, v))
        return total

    def test_kruskal_random(self):
        rnd = random.Random(6)
        for _ in range(1500):
            n = rnd.randint(1, 12)
            edges = [(rnd.randint(1, 6), rnd.randrange(n), rnd.randrange(n)) for _ in range(rnd.randint(0, 25))]
            mst = self.ns['kruskal'](n, edges)
            self.assertEqual(len(mst), n - self.components(n, edges))
            as_edges = [(w, u, v) for u, v, w in mst]
            self.assertEqual(self.components(n, as_edges), self.components(n, edges))
            self.assertEqual(sum(w for u, v, w in mst), self.prim_weight(n, edges))
            for e in as_edges:
                self.assertIn(e, edges)

    def test_union_find_semantics(self):
        rnd = random.Random(7)
        for _ in range(300):
            n = rnd.randint(1, 30)
            self.ns['make_sets'](n)
            label = list(range(n))
            for _ in range(60):
                x, y = rnd.randrange(n), rnd.randrange(n)
                merged = self.ns['union'](x, y)
                self.assertEqual(merged, label[x] != label[y])
                lx, ly = label[x], label[y]
                label = [lx if c == ly else c for c in label]
                for i in range(n):
                    self.assertEqual(self.ns['find'](i) == self.ns['find'](x), label[i] == label[x])
            # union by rank: rank never exceeds log2(n)
            self.assertLessEqual(max(self.ns['rank']), max(0, n.bit_length() - 1))

    def test_rank_grows_only_on_equal_rank_merges(self):
        self.ns['make_sets'](16)
        for step in (1, 2, 4, 8):
            for i in range(0, 16, 2 * step):
                self.ns['union'](i, i + step)
        self.assertEqual(self.ns['rank'][self.ns['find'](0)], 4)


def has_cycle(g):
    color = {v: 0 for v in g}

    def visit(u):
        color[u] = 1
        for v in g[u]:
            if color[v] == 1 or (color[v] == 0 and visit(v)):
                return True
        color[u] = 2
        return False
    return any(color[v] == 0 and visit(v) for v in g)


class TopoSort(unittest.TestCase):
    ns = load('topological-sort')

    def test_fixed(self):
        t = self.ns['topo_sort']
        self.assertEqual(t({}), [])
        self.assertEqual(t({'a': []}), ['a'])
        self.assertIsNone(t({'a': ['a']}))
        self.assertIsNone(t({'a': ['b'], 'b': ['a']}))
        self.assertIsNone(t({'a': ['b'], 'b': ['c'], 'c': ['b'], 'd': []}))
        self.assertEqual(t({'a': ['b'], 'b': ['c'], 'c': []}), ['a', 'b', 'c'])

    def test_random(self):
        rnd = random.Random(8)
        for _ in range(3000):
            n, g = random_graph(rnd)
            res = self.ns['topo_sort'](g)
            if has_cycle(g):
                self.assertIsNone(res, g)
            else:
                self.assertEqual(sorted(res), list(range(n)))
                pos = {v: i for i, v in enumerate(res)}
                for u in g:
                    for v in g[u]:
                        self.assertLess(pos[u], pos[v])


class Dfs(unittest.TestCase):
    ns = load('dfs')

    def test_random(self):
        rnd = random.Random(9)
        for _ in range(3000):
            n, g = random_graph(rnd)
            res = self.ns['dfs_all'](g)
            self.assertEqual(sorted(res), list(range(n)))
            if not has_cycle(g):
                pos = {v: i for i, v in enumerate(res)}
                for u in g:
                    for v in g[u]:
                        self.assertLess(pos[u], pos[v], g)

    def test_repeat_call_same_result(self):
        g = {0: [1], 1: []}
        self.assertEqual(self.ns['dfs_all'](g), self.ns['dfs_all'](g))


class Bfs(unittest.TestCase):
    ns = load('bfs', extra={'N': -1j, 'E': 1, 'S': 1j, 'W': -1})
    DIRS = (-1j, 1, 1j, -1)

    class Grid:
        def __init__(self, rows):
            self.rows = rows

        def open(self, p):
            r, c = int(p.imag), int(p.real)
            return 0 <= r < len(self.rows) and 0 <= c < len(self.rows[0]) and self.rows[r][c] == '.'

    def ref(self, rows, s, g):
        cells = [complex(c, r) for r, row in enumerate(rows) for c, ch in enumerate(row) if ch == '.']
        d = {x: INF for x in cells}
        d[s] = 0
        for _ in cells:  # Bellman-Ford style relaxation
            for x in cells:
                for dd in self.DIRS:
                    if x + dd in d and d[x] + 1 < d[x + dd]:
                        d[x + dd] = d[x] + 1
        return -1 if d[g] == INF else d[g]

    def test_random(self):
        rnd = random.Random(10)
        for _ in range(1500):
            h, w = rnd.randint(1, 6), rnd.randint(1, 6)
            rows = [''.join(rnd.choice('..#') for _ in range(w)) for _ in range(h)]
            cells = [complex(c, r) for r in range(h) for c in range(w) if rows[r][c] == '.']
            if not cells:
                continue
            s, g = rnd.choice(cells), rnd.choice(cells)
            self.assertEqual(self.ns['bfs'](self.Grid(rows), s, g), self.ref(rows, s, g), rows)

    def test_fixed(self):
        grid = self.Grid(['..#', '.##', '...'])
        self.assertEqual(self.ns['bfs'](grid, 0j, 0j), 0)
        self.assertEqual(self.ns['bfs'](grid, 0j, complex(2, 2)), 4)
        self.assertEqual(self.ns['bfs'](self.Grid(['.#.']), 0j, complex(2, 0)), -1)


class Knapsack(unittest.TestCase):
    ns = load('knapsack')

    def test_random(self):
        rnd = random.Random(11)
        for _ in range(2500):
            n = rnd.randint(0, 8)
            w = [rnd.randint(0, 7) for _ in range(n)]
            v = [rnd.randint(0, 9) for _ in range(n)]
            W = rnd.randint(0, 15)
            best = max(
                sum(v[i] for i in sub)
                for k in range(n + 1)
                for sub in itertools.combinations(range(n), k)
                if sum(w[i] for i in sub) <= W
            )
            val, items = self.ns['knapsack'](w, v, W)
            self.assertEqual(val, best, (w, v, W))
            self.assertEqual(len(set(items)), len(items))
            self.assertLessEqual(sum(w[i] for i in items), W)
            self.assertEqual(sum(v[i] for i in items), val)

    def test_fixed(self):
        self.assertEqual(self.ns['knapsack']([], [], 0), (0, []))
        self.assertEqual(self.ns['knapsack']([5], [9], 4), (0, []))
        self.assertEqual(self.ns['knapsack']([1, 3, 4, 5], [1, 4, 5, 7], 7)[0], 9)


def is_subseq(s, t):
    it = iter(t)
    return all(c in it for c in s)


class Lcs(unittest.TestCase):
    ns = load('lcs')

    @staticmethod
    def ref_len(a, b):
        best = 0
        for k in range(len(a) + 1):
            for sub in itertools.combinations(a, k):
                if is_subseq(sub, b):
                    best = k
        return best

    def test_random(self):
        rnd = random.Random(12)
        for _ in range(1500):
            a = ''.join(rnd.choice('abc') for _ in range(rnd.randint(0, 9)))
            b = ''.join(rnd.choice('abc') for _ in range(rnd.randint(0, 9)))
            res = self.ns['lcs'](a, b)
            self.assertEqual(len(res), self.ref_len(a, b), (a, b))
            self.assertTrue(is_subseq(res, a) and is_subseq(res, b), (a, b, res))

    def test_fixed(self):
        self.assertEqual(self.ns['lcs']('', ''), '')
        self.assertEqual(self.ns['lcs']('abc', ''), '')
        self.assertEqual(self.ns['lcs']('abc', 'abc'), 'abc')
        self.assertEqual(len(self.ns['lcs']('AGGTAB', 'GXTXAYB')), 4)


class RedBlackTree(unittest.TestCase):
    RED, BLACK = 'RED', 'BLACK'

    class Node:
        def __init__(self, key=None, color='BLACK'):
            self.key, self.color = key, color
            self.left = self.right = self.parent = None

    class Tree:
        pass

    ns = load('red-black-tree', extra={'RED': 'RED', 'BLACK': 'BLACK'})

    def new_tree(self):
        t = self.Tree()
        t.nil = self.Node()
        t.nil.left = t.nil.right = t.nil.parent = t.nil
        t.root = t.nil
        return t

    def check(self, t):
        """All red-black invariants plus BST order and parent links; returns the in-order keys."""
        nil = t.nil
        self.assertEqual(t.root.color, self.BLACK)
        self.assertEqual(nil.color, self.BLACK)
        self.assertIs(t.root.parent, nil)

        def walk(x, lo, hi):
            if x is nil:
                return 1, []
            self.assertTrue(lo is None or lo <= x.key)
            self.assertTrue(hi is None or x.key <= hi)
            if x.color == self.RED:
                self.assertEqual(x.left.color, self.BLACK)
                self.assertEqual(x.right.color, self.BLACK)
            for ch in (x.left, x.right):
                if ch is not nil:
                    self.assertIs(ch.parent, x)
            bl, kl = walk(x.left, lo, x.key)
            br, kr = walk(x.right, x.key, hi)
            self.assertEqual(bl, br, 'black height')
            return bl + (x.color == self.BLACK), kl + [x.key] + kr
        return walk(t.root, None, None)[1]

    def test_random_inserts(self):
        rnd = random.Random(13)
        orders = [list(range(40)), list(range(40, 0, -1)), [5] * 10, [1]]
        orders += [[rnd.randint(0, 30) for _ in range(rnd.randint(1, 80))] for _ in range(400)]
        orders += [rnd.sample(range(200), 120) for _ in range(100)]
        for keys in orders:
            t = self.new_tree()
            self.check(t)
            for i, k in enumerate(keys):
                self.ns['rb_insert'](t, self.Node(k, 'RED'))
                self.assertEqual(self.check(t), sorted(keys[:i + 1]))

            def height(x):
                return 0 if x is t.nil else 1 + max(height(x.left), height(x.right))
            self.assertLessEqual(height(t.root), 2 * (len(keys) + 1).bit_length())


class AStar(unittest.TestCase):
    ns = load('a-star')

    @staticmethod
    def dijkstra(graph, s):
        d = {s: 0}
        h = [(0, s)]
        while h:
            c, u = heappop(h)
            if c > d[u]:
                continue
            for v, w in graph[u]:
                if c + w < d.get(v, INF):
                    d[v] = c + w
                    heappush(h, (c + w, v))
        return d

    def check(self, graph, s, g, h):
        d = self.dijkstra(graph, s)
        path = self.ns['a_star'](graph, s, g, h)
        if g not in d:
            self.assertIsNone(path, graph)
            return
        self.assertEqual(path[0], s)
        self.assertEqual(path[-1], g)
        cost = 0
        for u, v in zip(path, path[1:]):
            cost += min(w for x, w in graph[u] if x == v)
        self.assertEqual(cost, d[g], (graph, s, g))

    def test_random_graphs(self):
        rnd = random.Random(14)
        for _ in range(2500):
            n = rnd.randint(1, 9)
            graph = {v: [] for v in range(n)}
            for _ in range(rnd.randint(0, 22)):
                graph[rnd.randrange(n)].append((rnd.randrange(n), rnd.randint(1, 9)))
            s, g = rnd.randrange(n), rnd.randrange(n)
            rev = {v: [] for v in range(n)}
            for u in graph:
                for v, w in graph[u]:
                    rev[v].append((u, w))
            dg = self.dijkstra(rev, g)  # distances to g: a perfect, consistent heuristic
            kind = rnd.choice(['zero', 'perfect', 'admissible-inconsistent'])
            frac = {v: rnd.random() for v in range(n)}
            if kind == 'zero':
                def h(v): return 0
            elif kind == 'perfect':
                def h(v): return dg.get(v, 0)
            else:
                def h(v): return int(dg.get(v, 0) * frac[v])
            self.check(graph, s, g, h)

    def test_grid_manhattan(self):
        rnd = random.Random(15)
        for _ in range(300):
            w, hh = rnd.randint(1, 7), rnd.randint(1, 7)
            ok = {(x, y) for x in range(w) for y in range(hh) if rnd.random() < 0.75}
            if not ok:
                continue
            graph = {p: [((p[0] + dx, p[1] + dy), 1) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
                         if (p[0] + dx, p[1] + dy) in ok] for p in ok}
            s, g = rnd.choice(sorted(ok)), rnd.choice(sorted(ok))
            self.check(graph, s, g, lambda p: abs(p[0] - g[0]) + abs(p[1] - g[1]))

    def test_fixed(self):
        self.assertEqual(self.ns['a_star']({0: []}, 0, 0, lambda v: 0), [0])
        self.assertIsNone(self.ns['a_star']({0: [], 1: []}, 0, 1, lambda v: 0))


class MaxFlow(unittest.TestCase):
    ns = load('max-flow')

    @staticmethod
    def ref(n, edges, s, t):
        """Ford-Fulkerson with DFS augmenting paths on a plain matrix."""
        c = [[0] * n for _ in range(n)]
        for u, v, w in edges:
            c[u][v] += w
        flow = 0
        while True:
            seen = {s}
            stack = [(s, INF)]
            par = {}
            found = None
            while stack and found is None:
                u, b = stack.pop()
                for v in range(n):
                    if v not in seen and c[u][v] > 0:
                        seen.add(v)
                        par[v] = u
                        nb = min(b, c[u][v])
                        if v == t:
                            found = nb
                            break
                        stack.append((v, nb))
            if found is None:
                return flow
            v = t
            while v != s:
                c[par[v]][v] -= found
                c[v][par[v]] += found
                v = par[v]
            flow += found

    @staticmethod
    def mincut(n, edges, s, t):
        best = INF
        others = [v for v in range(n) if v not in (s, t)]
        for k in range(len(others) + 1):
            for side in itertools.combinations(others, k):
                S = {s, *side}
                best = min(best, sum(w for u, v, w in edges if u in S and v not in S))
        return best

    def test_random(self):
        rnd = random.Random(16)
        for _ in range(2000):
            n = rnd.randint(2, 7)
            edges = [(rnd.randrange(n), rnd.randrange(n), rnd.randint(1, 9)) for _ in range(rnd.randint(0, 16))]
            edges = [e for e in edges if e[0] != e[1]]
            s, t = rnd.sample(range(n), 2)
            cap = defaultdict(lambda: defaultdict(int))
            for u, v, w in edges:
                cap[u][v] += w
            got = self.ns['max_flow'](cap, s, t)
            self.assertEqual(got, self.ref(n, edges, s, t), edges)
            self.assertEqual(got, self.mincut(n, edges, s, t), edges)

    # Precondition s != t: with s == t the diagram never terminates (flow += INF forever).
    def test_no_path(self):
        cap = defaultdict(lambda: defaultdict(int))
        cap[0][1] = 5
        self.assertEqual(self.ns['max_flow'](cap, 1, 0), 0)

    def test_clrs_example(self):
        cap = defaultdict(lambda: defaultdict(int))
        for u, v, w in [(0, 1, 16), (0, 2, 13), (1, 2, 10), (2, 1, 4), (1, 3, 12), (3, 2, 9),
                        (2, 4, 14), (4, 3, 7), (3, 5, 20), (4, 5, 4)]:
            cap[u][v] = w
        self.assertEqual(self.ns['max_flow'](cap, 0, 5), 23)


class SegmentTree(unittest.TestCase):
    ns = load('segment-tree')

    def test_main(self):
        self.assertEqual(run_main(self.ns), ['18', '25'])

    def test_random(self):
        rnd = random.Random(17)
        ns = self.ns
        for _ in range(600):
            n = rnd.randint(1, 20)
            a = [rnd.randint(-9, 9) for _ in range(n)]
            ns['a'], ns['tree'] = list(a), [0] * (4 * n)
            ns['build'](1, 0, n - 1)
            for _ in range(40):
                if rnd.random() < 0.4:
                    i, x = rnd.randrange(n), rnd.randint(-9, 9)
                    a[i] = x
                    ns['update'](1, 0, n - 1, i, x)
                l = rnd.randrange(n)
                r = rnd.randint(l, n - 1)
                self.assertEqual(ns['query'](1, 0, n - 1, l, r), sum(a[l:r + 1]), (a, l, r))
            self.assertEqual(ns['tree'][1], sum(a))


class Hanoi(unittest.TestCase):
    ns = load('hanoi')

    def moves(self, n):
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            self.ns['hanoi'](n, 'A', 'C', 'B')
        return buf.getvalue().split('\n')[:-1]

    def test_main(self):
        lines = run_main(self.ns)
        self.assertEqual(len(lines), 7)
        self.assertEqual(lines[0], 'disk 1: A -> C')
        self.assertEqual(lines[3], 'disk 3: A -> C')

    def test_legal_and_complete(self):
        for n in range(0, 10):
            pegs = {'A': list(range(n, 0, -1)), 'B': [], 'C': []}
            lines = self.moves(n)
            self.assertEqual(len(lines), 2 ** n - 1)
            for line in lines:
                rest = line.split(' ', 1)[1]
                disk, move = rest.split(': ')
                src, dst = move.split(' -> ')
                disk = int(disk)
                self.assertEqual(pegs[src][-1], disk)
                self.assertTrue(not pegs[dst] or pegs[dst][-1] > disk)
                pegs[dst].append(pegs[src].pop())
            self.assertEqual(pegs, {'A': [], 'B': [], 'C': list(range(n, 0, -1))})


class NQueens(unittest.TestCase):
    ns = load('n-queens')

    def test_main(self):
        self.assertEqual(run_main(self.ns), ['92'])

    def test_counts_and_validity(self):
        known = {1: 1, 2: 0, 3: 0, 4: 2, 5: 10, 6: 4, 7: 40, 8: 92, 9: 352}
        ns = self.ns
        for n, count in known.items():
            ns['n'], ns['board'], ns['solutions'] = n, [], []
            ns['cols'], ns['diag1'], ns['diag2'] = set(), set(), set()
            ns['place'](0)
            sols = ns['solutions']
            self.assertEqual(len(sols), count, n)
            self.assertEqual(len({tuple(s) for s in sols}), count)
            for s in sols:
                self.assertEqual(len(set(s)), n)
                self.assertEqual(len({r - c for r, c in enumerate(s)}), n)
                self.assertEqual(len({r + c for r, c in enumerate(s)}), n)
            self.assertEqual((ns['board'], ns['cols'], ns['diag1'], ns['diag2']), ([], set(), set(), set()))


class GameOfLife(unittest.TestCase):
    ns = load('game-of-life')

    @staticmethod
    def ref(grid):
        R, C = len(grid), len(grid[0])
        out = [[0] * C for _ in range(R)]
        for r in range(R):
            for c in range(C):
                n = sum(grid[(r + dr) % R][(c + dc) % C]
                        for dr in (-1, 0, 1) for dc in (-1, 0, 1) if (dr, dc) != (0, 0))
                out[r][c] = 1 if n == 3 or (n == 2 and grid[r][c]) else 0
        return out

    def test_random(self):
        rnd = random.Random(18)
        for _ in range(1500):
            R, C = rnd.randint(3, 8), rnd.randint(3, 8)
            g = [[rnd.randint(0, 1) for _ in range(C)] for _ in range(R)]
            self.assertEqual(self.ns['life_step'](g), self.ref(g))

    def test_patterns(self):
        step = self.ns['life_step']
        blinker = [[0] * 5 for _ in range(5)]
        for c in (1, 2, 3):
            blinker[2][c] = 1
        self.assertEqual(step(step(blinker)), blinker)
        self.assertNotEqual(step(blinker), blinker)
        block = [[0] * 4 for _ in range(4)]
        for r, c in ((1, 1), (1, 2), (2, 1), (2, 2)):
            block[r][c] = 1
        self.assertEqual(step(block), block)
        glider = [[0] * 6 for _ in range(6)]
        for r, c in ((0, 1), (1, 2), (2, 0), (2, 1), (2, 2)):
            glider[r][c] = 1
        g = glider
        for _ in range(4):
            g = step(g)
        shifted = [[glider[(r - 1) % 6][(c - 1) % 6] for c in range(6)] for r in range(6)]
        self.assertEqual(g, shifted)

    def test_input_not_mutated(self):
        g = [[1, 0, 1], [0, 1, 0], [1, 1, 0]]
        copy = [row[:] for row in g]
        self.ns['life_step'](g)
        self.assertEqual(g, copy)


class ProducerConsumer(unittest.TestCase):
    def run_with(self, items, slots, seed):
        from threading import Lock, Semaphore
        import time

        rnd = random.Random(seed)
        made, used, most = iter(list(items) + [None]), [], [0]

        def produce():
            time.sleep(rnd.random() / 2000)
            return next(made)

        def consume(item):
            most[0] = max(most[0], len(ns['buf']))
            time.sleep(rnd.random() / 2000)
            used.append(item)

        extra = {'N': slots, 'Semaphore': Semaphore, 'Lock': Lock,
                 'produce': produce, 'consume': consume}
        ns = load('producer-consumer', extra=extra)
        self.assertEqual(run_main(ns), ['both done'])
        return used, most[0]

    def test_every_item_in_order(self):
        for seed in range(20):
            rnd = random.Random(seed)
            items = [rnd.randrange(100) for _ in range(rnd.randint(0, 30))]
            slots = rnd.randint(1, 4)
            used, most = self.run_with(items, slots, seed)
            self.assertEqual(used, items)
            self.assertLessEqual(most, slots)

    def test_korean_prints_its_own_words(self):
        from threading import Lock, Semaphore
        made = iter([1, 2, None])
        extra = {'N': 2, 'Semaphore': Semaphore, 'Lock': Lock,
                 'produce': lambda: next(made), 'consume': lambda item: None}
        ns = load('producer-consumer', 'ko', extra)
        self.assertEqual(run_main(ns), ['둘 다 끝남'])


if __name__ == '__main__':
    unittest.main(argv=[sys.argv[0]] + sys.argv[1:], verbosity=2 if '-v' in sys.argv else 1)
