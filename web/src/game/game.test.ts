import { describe, expect, it } from 'vitest';
import { chain, fewest, graph, luck, reaches, sources, starsFor, SKY_H, SKY_W, type Shell, type Sky } from './sim';
import { CHAPTERS, LEVELS, levelIndex } from './levels';
import { freshSave, isUnlocked, parseSave, recordResult, totalStars } from '../state/save';

const P = (x: number, y: number, r = 1.35): Shell => ({ x, y, kind: 'peony', r });
const none = (n: number) => new Array(n).fill(false);

describe('bursts', () => {
  it('a peony reaches all round within its radius', () => {
    expect(reaches(P(0, 0), P(1, 0.9))).toBe(true); expect(reaches(P(0, 0), P(1.2, 1.2))).toBe(false);
  });
  it('a comet reaches only along its line, one way', () => {
    const c: Shell = { x: 0, y: 0, kind: 'comet', r: 4, dir: 0 };
    expect(reaches(c, P(3.5, 0.3))).toBe(true); expect(reaches(c, P(-1, 0))).toBe(false); expect(reaches(c, P(2, 1))).toBe(false); expect(reaches(c, P(4.5, 0))).toBe(false);
    expect(reaches({ ...c, dir: 1 }, P(2, 2))).toBe(true);
  });
  it('a crossette reaches four ways', () => {
    const x: Shell = { x: 0, y: 0, kind: 'crossette', r: 2.3, dir: 0 };
    for (const [a, b] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) expect(reaches(x, P(a, b))).toBe(true);
    expect(reaches(x, P(1.4, 1.4))).toBe(false); expect(reaches({ ...x, dir: 1 }, P(1.4, 1.4))).toBe(true);
  });
});

describe('chains', () => {
  // a line of peonies 1 apart: any lights all; plus a comet pointing away that nothing reaches
  const sky: Sky = { shells: [P(0, 0), P(1, 0), P(2, 0), { x: 0, y: 5, kind: 'comet', r: 4, dir: 0 }] };
  const G = graph(sky);
  it('runs through the sky in time order', () => {
    const c = chain(sky, G, 0, none(4));
    expect(c.map((e) => e.i)).toEqual([0, 1, 2]); expect(c[2].from).toBe(1); expect(c[2].at).toBeGreaterThan(c[1].at);
    expect(chain(sky, G, 0, [false, true, false, false]).map((e) => e.i)).toEqual([0]); // spent shells don't relay
  });
  it('counts the fewest matches as the groups nothing else can light', () => {
    expect(fewest(sky, G, none(4))).toBe(2);
    expect(sources(sky, G, none(4)).map((g) => g.length).sort()).toEqual([1, 3]);
    expect(fewest(sky, G, [true, true, true, false])).toBe(1);
  });
  it('luck is a probability', () => { let s = 1; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647); const s2: Sky = { shells: [{ x: -3, y: 0, kind: 'comet', r: 4, dir: 0 }, P(0, 0), P(1, 0), P(2, 0)] }, G2 = graph(s2); expect(fewest(s2, G2, none(4))).toBe(1); const l = luck(s2, G2, 400, rnd); expect(l).toBeGreaterThan(0.15); expect(l).toBeLessThan(0.35); expect(luck(sky, G, 50, rnd)).toBe(1); });
  it('stars', () => { expect(starsFor(1, 0)).toBe(3); expect(starsFor(2, 0)).toBe(2); expect(starsFor(4, 0)).toBe(1); expect(starsFor(1, 1)).toBe(2); expect(starsFor(1, 2)).toBe(1); });
});

describe('nights', () => {
  it('has 24 skies in three chapters of eight, with unique ids and names', () => {
    expect(LEVELS).toHaveLength(24); expect(CHAPTERS).toHaveLength(3);
    for (let c = 0; c < 3; c++) expect(LEVELS.filter((l) => l.chapter === c)).toHaveLength(8);
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(24); expect(new Set(LEVELS.map((l) => l.name)).size).toBe(24);
    expect(levelIndex(LEVELS[9].id)).toBe(9);
  });
  it('kinds arrive chapter by chapter', () => {
    for (const l of LEVELS) { const k = new Set(l.shells.map((s) => s.kind)); expect(k.has('comet')).toBe(l.chapter >= 1); expect(k.has('crossette')).toBe(l.chapter === 2); }
  });
  it('gets harder through each chapter', () => {
    for (let c = 0; c < 3; c++) { const ls = LEVELS.filter((l) => l.chapter === c); for (let i = 1; i < 8; i++) { expect(ls[i].luck).toBeLessThanOrEqual(ls[i - 1].luck * 1.1); expect(ls[i].matches).toBeGreaterThanOrEqual(ls[i - 1].matches); } }
  });
});

describe('every sky', () => {
  for (const l of LEVELS) {
    it(`${l.id} ${l.name}: exactly its matches light it all; shells inside the sky, apart, none alone`, () => {
      const G = graph(l), n = l.shells.length;
      expect(fewest(l, G, none(n))).toBe(l.matches);
      const spent = none(n); for (const g of sources(l, G, spent)) for (const e of chain(l, G, g[0], spent)) spent[e.i] = true;
      expect(spent.every(Boolean)).toBe(true);
      const indeg = new Array(n).fill(0); G.forEach((js) => js.forEach((j) => indeg[j]++));
      l.shells.forEach((s, i) => {
        expect(s.x).toBeGreaterThan(0.4); expect(s.x).toBeLessThan(SKY_W - 0.4); expect(s.y).toBeGreaterThan(0.4); expect(s.y).toBeLessThan(SKY_H - 0.4);
        expect(G[i].length + indeg[i]).toBeGreaterThan(0);
        for (let j = i + 1; j < n; j++) expect(Math.hypot(s.x - l.shells[j].x, s.y - l.shells[j].y)).toBeGreaterThanOrEqual(1.0);
      });
    });
  }
});

describe('save', () => {
  it('parses safely and records the best', () => {
    expect(parseSave(null)).toEqual(freshSave()); expect(parseSave('{bad')).toEqual(freshSave());
    let t = recordResult(freshSave(), LEVELS[0].id, 2, 3); t = recordResult(t, LEVELS[0].id, 3, 1);
    expect(t.stars[LEVELS[0].id]).toBe(3); expect(t.best[LEVELS[0].id]).toBe(1); expect(totalStars(t)).toBe(3);
  });
  it('unlocks in order', () => { const s = freshSave(); expect(isUnlocked(s, 1)).toBe(false); expect(isUnlocked(recordResult(s, LEVELS[0].id, 1, 2), 1)).toBe(true); });
});
