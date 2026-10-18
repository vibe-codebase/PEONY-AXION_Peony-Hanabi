/**
 * Sky generator. Shells are scattered across the sky with room between them; each chapter brings its own kinds.
 * A sky is kept if it needs exactly the template's number of matches, no shell stands alone (reaching nothing and
 * reached by nothing), and every shell is in the sky. Its difficulty is its luck: how often a player striking
 * shells at random lights it all. For every level the candidate whose luck is nearest the target is kept.
 * Run: npx esbuild tools/gen.ts --bundle --platform=node --format=esm --outfile=tools/.gen.mjs && node tools/.gen.mjs
 */
import fs from 'node:fs';
import { fewest, graph, luck, SKY_H, SKY_W, type Kind, type Shell, type Sky } from '../src/game/sim';

type T = { id: string; n: number; k: number; mix: Partial<Record<Kind | 'big', number>>; luck: number; seed: number };
const A: T[] = [[8, 1, 0.3], [9, 1, 0.2], [10, 2, 0.2], [11, 2, 0.12], [12, 2, 0.08], [13, 3, 0.06], [14, 3, 0.04], [15, 3, 0.025]].map(([n, k, l], i) => ({ id: `a${i + 1}`, n, k, mix: { peony: 3, big: 2 }, luck: l, seed: 100 + i }));
const B: T[] = [[9, 2, 0.25], [10, 2, 0.15], [11, 2, 0.1], [12, 3, 0.08], [13, 3, 0.05], [14, 3, 0.035], [15, 4, 0.025], [16, 4, 0.015]].map(([n, k, l], i) => ({ id: `b${i + 1}`, n, k, mix: { peony: 3, big: 1, comet: 3 }, luck: l, seed: 200 + i }));
const C: T[] = [[11, 2, 0.15], [12, 3, 0.1], [13, 3, 0.06], [14, 3, 0.04], [15, 4, 0.03], [16, 4, 0.02], [17, 4, 0.012], [18, 5, 0.008]].map(([n, k, l], i) => ({ id: `c${i + 1}`, n, k, mix: { peony: 3, big: 1, comet: 2, crossette: 3 }, luck: l, seed: 300 + i }));

function rng(seed: number) { let s = Math.imul(seed + 0x9e3779b9, 2654435761) >>> 0 || 1; for (let i = 0; i < 8; i++) { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; } return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const round = (v: number) => Math.round(v * 20) / 20;

function attempt(T: T, rnd: () => number): Sky | null {
  const bag: (Kind | 'big')[] = []; for (const [k, w] of Object.entries(T.mix)) for (let i = 0; i < (w ?? 0); i++) bag.push(k as Kind | 'big');
  const shells: Shell[] = [];
  for (let tries = 0; shells.length < T.n && tries < 4000; tries++) {
    const x = round(0.6 + rnd() * (SKY_W - 1.2)), y = round(0.7 + rnd() * (SKY_H - 1.4));
    if (shells.some((s) => Math.hypot(s.x - x, s.y - y) < 1.05)) continue;
    const pick = bag[Math.floor(rnd() * bag.length)];
    if (pick === 'peony') shells.push({ x, y, kind: 'peony', r: 1.35 });
    else if (pick === 'big') shells.push({ x, y, kind: 'peony', r: 2.0 });
    else if (pick === 'comet') shells.push({ x, y, kind: 'comet', r: 4.2, dir: Math.floor(rnd() * 8) });
    else shells.push({ x, y, kind: 'crossette', r: 2.3, dir: rnd() < 0.5 ? 0 : 1 });
  }
  if (shells.length < T.n) return null;
  // the ones nearest the top come first, so shells are numbered roughly as they read
  shells.sort((a, b) => a.y - b.y || a.x - b.x);
  return { shells };
}

const out: Record<string, unknown> = {};
for (const T of [...A, ...B, ...C]) {
  const rnd = rng(T.seed * 7919);
  let best: { sky: Sky; luck: number } | null = null;
  for (let a = 0, found = 0; a < 20000 && found < 160; a++) {
    const sky = attempt(T, rnd); if (!sky) continue;
    const G = graph(sky), n = sky.shells.length;
    if (fewest(sky, G, new Array(n).fill(false)) !== T.k) continue;
    const indeg = new Array(n).fill(0); G.forEach((js) => js.forEach((j) => indeg[j]++));
    if (G.some((js, i) => !js.length && !indeg[i])) continue;
    // every kind in the mix appears at least once
    if (Object.keys(T.mix).some((k) => k !== 'big' && !sky.shells.some((s) => s.kind === k))) continue;
    found++;
    const L = luck(sky, G, 600, rnd);
    if (L === 0) continue;
    if (!best || Math.abs(Math.log(L / T.luck)) < Math.abs(Math.log(best.luck / T.luck))) best = { sky, luck: L };
  }
  if (!best) throw new Error(`no sky for ${T.id}`);
  out[T.id] = { shells: best.sky.shells, matches: T.k, luck: best.luck };
  console.log(T.id, 'shells', T.n, 'matches', T.k, 'luck', best.luck.toFixed(3), 'target', T.luck);
}
fs.writeFileSync(new URL('../src/game/skies.json', import.meta.url), JSON.stringify(out));
