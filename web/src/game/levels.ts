import type { Sky } from './sim';
import DATA from './skies.json';

export type Level = Sky & { id: string; name: string; chapter: number; hint?: string; matches: number; luck: number };
export const CHAPTERS = [
  { name: 'Peony Harbour', short: 'Harbour', blurb: 'A peony bursts all round, lighting every shell within its reach.' },
  { name: 'River of Comets', short: 'River', blurb: 'Comets shoot one way only, lighting every shell along their trail.' },
  { name: 'Temple Hill', short: 'Temple', blurb: 'Crossettes split four ways, along the arms of a plus or an X.' },
];
const NAMES: [string, string, string?][] = [
  ['a1', 'First Spark', 'Tap a shell to see how far its burst will reach. Tap it again to light it.'],
  ['a2', 'Lantern Pier'],
  ['a3', 'Paper Moon', 'Two matches tonight. A shell nothing else can reach will need one of its own.'],
  ['a4', 'Summer Yukata'], ['a5', 'Goldfish Stall'], ['a6', 'Harbour Lights'], ['a7', 'Sparkler'], ['a8', 'Grand Peony'],
  ['b1', 'Riverbank', 'A comet shoots one way only. Its trail lights every shell along the line.'],
  ['b2', 'Kingfisher'], ['b3', 'Shooting Star'], ['b4', 'Willow Bend'], ['b5', 'Night Ferry'], ['b6', 'Firefly Path'], ['b7', 'Meteor Shower'], ['b8', 'Milky Way'],
  ['c1', 'Stone Steps', 'A crossette splits four ways, along a plus or an X.'],
  ['c2', 'Torii Gate'], ['c3', 'Temple Bell'], ['c4', 'Paper Crane'], ['c5', 'Lotus Pond'], ['c6', 'Pagoda'], ['c7', 'Thousand Lanterns'], ['c8', 'Grand Finale'],
];
const D = DATA as unknown as Record<string, Sky & { matches: number; luck: number }>;
/** Skies come in the generator's order: within each chapter, from luckiest to least lucky for a random player. */
export const LEVELS: Level[] = NAMES.map(([id, name, hint], i) => ({ ...D[id], id, name, hint, chapter: Math.floor(i / 8) }));
export const levelIndex = (id: string) => LEVELS.findIndex((l) => l.id === id);
