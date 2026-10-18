/**
 * Hanabi: chain-reaction fireworks. Shells hang in the night sky. Light one with a match and it bursts, and its
 * burst lights every unlit shell it reaches, which burst in turn. A peony reaches all round it, a comet shoots one
 * way, a crossette splits four ways. You have just enough matches to light the whole sky, if you choose well.
 * Coordinates are in sky units: the sky is 6 wide and 9 tall.
 */
export type Kind = 'peony' | 'comet' | 'crossette';
export type Shell = { x: number; y: number; kind: Kind; r: number; dir?: number };
export type Sky = { shells: Shell[] };
export const SKY_W = 6, SKY_H = 9;
/** A ray's half-width: shells closer than this to a comet's or crossette's line are caught by it. */
export const BEAM = 0.42;
export const DIRS: [number, number][] = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]].map(([x, y]) => { const l = Math.hypot(x, y); return [x / l, y / l] as [number, number]; });
/** The directions a shell sends its burst along (none for a peony, which bursts all round). */
export function rays(s: Shell): number[] { return s.kind === 'comet' ? [s.dir ?? 0] : s.kind === 'crossette' ? [0, 2, 4, 6].map((d) => (d + (s.dir ?? 0)) % 8) : []; }
export function reaches(a: Shell, b: Shell) {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (a.kind === 'peony') return Math.hypot(dx, dy) <= a.r;
  return rays(a).some((d) => { const [ux, uy] = DIRS[d], t = dx * ux + dy * uy, p = Math.abs(dx * uy - dy * ux); return t > 0 && t <= a.r && p <= BEAM; });
}
export function graph(sky: Sky): number[][] { const S = sky.shells; return S.map((a, i) => S.map((b, j) => (i !== j && reaches(a, b) ? j : -1)).filter((j) => j >= 0)); }

/** Fuse timing: a burst reaches a shell this many seconds after it goes off. */
export const delay = (a: Shell, b: Shell) => 0.32 + Math.hypot(b.x - a.x, b.y - a.y) * 0.1;
/** Light shell `start` among the unspent ones: when each shell goes off, and which burst lit it. */
export function chain(sky: Sky, G: number[][], start: number, spent: boolean[]) {
  const t = sky.shells.map(() => Infinity), from = sky.shells.map(() => -1), done = sky.shells.map(() => false);
  if (spent[start]) return [];
  t[start] = 0;
  for (;;) {
    let i = -1; for (let k = 0; k < t.length; k++) if (!done[k] && t[k] < Infinity && (i < 0 || t[k] < t[i])) i = k;
    if (i < 0) break; done[i] = true;
    for (const j of G[i]) { if (spent[j] || done[j]) continue; const tj = t[i] + delay(sky.shells[i], sky.shells[j]); if (tj < t[j]) { t[j] = tj; from[j] = i; } }
  }
  return t.map((at, i) => ({ i, at, from: from[i] })).filter((e) => e.at < Infinity).sort((a, b) => a.at - b.at);
}

/** Strongly connected groups among the unspent shells, and which groups nothing else can light. */
export function sources(sky: Sky, G: number[][], spent: boolean[]) {
  const n = sky.shells.length, idx = new Array(n).fill(-1), low = new Array(n).fill(0), on = new Array(n).fill(false), comp = new Array(n).fill(-1), st: number[] = [];
  let k = 0, nc = 0;
  const visit = (v: number) => {
    idx[v] = low[v] = k++; st.push(v); on[v] = true;
    for (const w of G[v]) { if (spent[w]) continue; if (idx[w] < 0) { visit(w); low[v] = Math.min(low[v], low[w]); } else if (on[w]) low[v] = Math.min(low[v], idx[w]); }
    if (low[v] === idx[v]) { for (;;) { const w = st.pop()!; on[w] = false; comp[w] = nc; if (w === v) break; } nc++; }
  };
  for (let v = 0; v < n; v++) if (!spent[v] && idx[v] < 0) visit(v);
  const lit = new Array(nc).fill(false);
  for (let v = 0; v < n; v++) if (!spent[v]) for (const w of G[v]) if (!spent[w] && comp[w] !== comp[v]) lit[comp[w]] = true;
  const groups: number[][] = [];
  for (let c = 0; c < nc; c++) if (!lit[c]) groups.push([...Array(n).keys()].filter((v) => comp[v] === c));
  return groups;
}
/** The fewest matches that light every unspent shell. */
export const fewest = (sky: Sky, G: number[][], spent: boolean[]) => sources(sky, G, spent).length;

/** How often a player striking random unlit shells, with exactly enough matches, lights the whole sky. */
export function luck(sky: Sky, G: number[][], trials: number, rnd: () => number) {
  const n = sky.shells.length, need = fewest(sky, G, new Array(n).fill(false)); let wins = 0;
  for (let t = 0; t < trials; t++) {
    const spent = new Array(n).fill(false);
    for (let m = 0; m < need; m++) { const left = [...Array(n).keys()].filter((i) => !spent[i]); if (!left.length) break; const s = left[Math.floor(rnd() * left.length)]; for (const e of chain(sky, G, s, spent)) spent[e.i] = true; }
    if (spent.every(Boolean)) wins++;
  }
  return wins / trials;
}
/** Stars: three for lighting the sky first time, two after a retry or two or with a hint. */
export function starsFor(tries: number, hints: number) { if (hints >= 2) return 1; const s = tries <= 1 ? 3 : tries <= 3 ? 2 : 1; return hints ? Math.min(2, s) : s; }
