/**
 * Hanabi art, painted with Canvas 2D: a summer night over a harbour, a river and a temple hill, with stars, a moon,
 * thin cloud and lantern-lit silhouettes reflected in the water; paper-wrapped firework shells (round peonies,
 * teardrop comets, four-armed crossettes) with a twist of fuse; and the soft sparks the bursts are made of.
 */
import type { Shell } from './sim';

export type Mood = { name: string; sky: [string, string, string]; land: string; glow: string; water: boolean; shells: string[] };
export const MOODS: Mood[] = [
  { name: 'harbour', sky: ['#050a22', '#10204e', '#2a3a74'], land: '#050814', glow: '#ffb860', water: true, shells: ['#ff5a6a', '#ffcf4a', '#5ad0ff', '#c58aff', '#7dffb0', '#ff9a4a'] },
  { name: 'river', sky: ['#0a0620', '#24154e', '#4a2a6e'], land: '#08051a', glow: '#ff9ad0', water: true, shells: ['#ff7ab8', '#8ae0ff', '#fff07a', '#b48cff', '#ff8a5a', '#9affd8'] },
  { name: 'temple', sky: ['#12040e', '#36102a', '#6a2236'], land: '#0c0308', glow: '#ff7a3a', water: false, shells: ['#ffd25a', '#ff5a4a', '#ffa0e0', '#7ab8ff', '#ffffff', '#ff9a3a'] },
];
export function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return { c, g: c.getContext('2d')! };
}
export const hash = (a: number, b: number) => { let h = Math.imul(a + 0x9e3779b9, 374761393) ^ Math.imul(b + 7, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const TAU = Math.PI * 2;
export function hexA(hex: string, a: number) { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
export function mix(a: string, b: string, t: number) {
  const p = parseInt(a.slice(1), 16), q = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((p >> s) & 255) * (1 - t) + ((q >> s) & 255) * t);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
}
export const toInt = (hex: string) => parseInt(hex.slice(1), 16);

// ── the night ─────────────────────────────────────────────────────────────
/** The whole backdrop. `ground` is where the land starts (in px from the top). */
export function night(m: Mood, W: number, H: number, r: number, seed: number, ground = H * 0.86, moon = true) {
  const { c, g } = canvas(W * r, H * r); g.scale(r, r);
  const bg = g.createLinearGradient(0, 0, 0, ground); bg.addColorStop(0, m.sky[0]); bg.addColorStop(0.65, m.sky[1]); bg.addColorStop(1, m.sky[2]);
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // stars, a few bright
  for (let i = 0; i < (W * H) / 900; i++) {
    const x = hash(i, seed) * W, y = hash(i, seed + 1) * ground * 0.92, b = hash(i, seed + 2), s = b > 0.97 ? 1.4 : b > 0.85 ? 0.9 : 0.55;
    g.fillStyle = `rgba(255,248,230,${0.25 + b * 0.6 * (1 - y / ground)})`; g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill();
    if (b > 0.985) { g.strokeStyle = 'rgba(255,248,230,0.35)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x + 4, y); g.moveTo(x, y - 4); g.lineTo(x, y + 4); g.stroke(); }
  }
  // the moon, low and soft
  if (moon) {
    const mx = W * (0.8 + hash(1, seed) * 0.08), my = ground * 0.14, mr = Math.min(W, H) * 0.045;
    const halo = g.createRadialGradient(mx, my, mr, mx, my, mr * 6); halo.addColorStop(0, 'rgba(255,240,210,0.16)'); halo.addColorStop(1, 'rgba(255,240,210,0)'); g.fillStyle = halo; g.fillRect(mx - mr * 6, my - mr * 6, mr * 12, mr * 12);
    g.fillStyle = '#fff3d8'; g.beginPath(); g.arc(mx, my, mr, 0, TAU); g.fill();
    g.fillStyle = 'rgba(200,180,150,0.25)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(mx + (hash(i, 9) - 0.5) * mr, my + (hash(i, 10) - 0.5) * mr, mr * (0.12 + hash(i, 11) * 0.18), 0, TAU); g.fill(); }
  }
  // thin clouds
  for (let i = 0; i < 7; i++) {
    const cx = hash(i, seed + 5) * W, cy = ground * (0.15 + hash(i, seed + 6) * 0.6), w = W * (0.3 + hash(i, seed + 7) * 0.4);
    const cg = g.createRadialGradient(cx, cy, 0, cx, cy, w / 2); cg.addColorStop(0, hexA(m.sky[2], 0.22)); cg.addColorStop(1, hexA(m.sky[2], 0));
    g.save(); g.translate(cx, cy); g.scale(1, 0.16); g.translate(-cx, -cy); g.fillStyle = cg; g.beginPath(); g.arc(cx, cy, w / 2, 0, TAU); g.fill(); g.restore();
  }
  // a warm glow over the town
  const tg = g.createLinearGradient(0, ground - H * 0.16, 0, ground); tg.addColorStop(0, hexA(m.glow, 0)); tg.addColorStop(1, hexA(m.glow, 0.2)); g.fillStyle = tg; g.fillRect(0, ground - H * 0.16, W, H * 0.16);
  land(g, m, W, H, ground, seed);
  return c;
}
function land(g: CanvasRenderingContext2D, m: Mood, W: number, H: number, y0: number, seed: number) {
  const lights: [number, number][] = [];
  g.fillStyle = m.land;
  if (m.name === 'harbour') {
    // a row of rooftops and a lighthouse
    g.beginPath(); g.moveTo(0, y0);
    let x = 0; while (x < W) { const w = 14 + hash(x | 0, seed) * 26, h = 8 + hash(x | 0, seed + 1) * 22; g.lineTo(x, y0 - h); if (hash(x | 0, 4) < 0.4) g.lineTo(x + w / 2, y0 - h - 7); g.lineTo(x + w, y0 - h); for (let k = 0; k < 2; k++) if (hash(x + k, 5) < 0.6) lights.push([x + 4 + hash(x + k, 6) * (w - 8), y0 - h + 4 + hash(x + k, 7) * (h - 6)]); x += w; }
    g.lineTo(W, y0); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
    const lx = W * 0.86; g.fillRect(lx - 4, y0 - 54, 8, 54); g.beginPath(); g.moveTo(lx - 7, y0 - 54); g.lineTo(lx, y0 - 64); g.lineTo(lx + 7, y0 - 54); g.fill(); lights.push([lx, y0 - 58]);
  } else if (m.name === 'river') {
    // willows on the banks and an arched bridge
    g.beginPath(); g.moveTo(0, y0 - 6); for (let x = 0; x <= W; x += 10) g.lineTo(x, y0 - 6 - Math.sin(x * 0.03 + seed) * 3); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
    for (const wx of [W * 0.1, W * 0.88]) { g.beginPath(); g.arc(wx, y0 - 34, 26, Math.PI, 0); g.fill(); g.strokeStyle = m.land; g.lineWidth = 1.2; for (let k = 0; k < 24; k++) { const a = Math.PI + (k / 23) * Math.PI, sx = wx + Math.cos(a) * 24, sy = y0 - 34 + Math.sin(a) * 24; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(sx + 2, sy + 20, sx, sy + 30 + hash(k, 3) * 10); g.stroke(); } g.fillRect(wx - 3, y0 - 34, 6, 30); }
    g.lineWidth = 6; g.strokeStyle = m.land; g.beginPath(); g.ellipse(W / 2, y0 - 2, W * 0.22, 26, 0, Math.PI, 0); g.stroke();
    g.lineWidth = 2; for (let k = -4; k <= 4; k++) { const x = W / 2 + k * W * 0.045, yy = y0 - 2 - Math.sqrt(Math.max(0, 1 - (k / 4.9) ** 2)) * 26; g.beginPath(); g.moveTo(x, yy - 8); g.lineTo(x, yy); g.stroke(); if (k % 2 === 0) lights.push([x, yy - 10]); }
  } else {
    // a hill with a pagoda and a torii, lanterns up the steps
    g.beginPath(); g.moveTo(0, H); g.lineTo(0, y0); g.quadraticCurveTo(W * 0.3, y0 - 34, W * 0.55, y0 - 46); g.quadraticCurveTo(W * 0.8, y0 - 54, W, y0 - 20); g.lineTo(W, H); g.closePath(); g.fill();
    const px = W * 0.66, py = y0 - 50;
    for (let k = 0; k < 4; k++) { const w = 34 - k * 6, y = py - k * 15; g.beginPath(); g.moveTo(px - w / 2 - 6, y); g.quadraticCurveTo(px, y - 5, px + w / 2 + 6, y); g.lineTo(px + w / 2 - 2, y - 5); g.lineTo(px - w / 2 + 2, y - 5); g.closePath(); g.fill(); g.fillRect(px - w / 2 + 6, y - 15, w - 12, 10); lights.push([px - 3, y - 9]); }
    g.fillRect(px - 1, py - 76, 2, 16);
    const tx = W * 0.22, ty = y0 - 22; g.fillRect(tx - 15, ty - 24, 3, 24); g.fillRect(tx + 12, ty - 24, 3, 24); g.fillRect(tx - 19, ty - 27, 38, 3); g.fillRect(tx - 16, ty - 20, 32, 2);
    for (let k = 0; k < 7; k++) lights.push([W * (0.3 + k * 0.05), y0 - 30 - k * 3]);
  }
  for (const [x, y] of lights) {
    const lg = g.createRadialGradient(x, y, 0, x, y, 6); lg.addColorStop(0, hexA(m.glow, 0.9)); lg.addColorStop(1, hexA(m.glow, 0)); g.fillStyle = lg; g.fillRect(x - 6, y - 6, 12, 12);
    g.fillStyle = '#fff0c8'; g.fillRect(x - 0.8, y - 0.8, 1.6, 1.6);
  }
  if (m.water) {
    // water below, with the lights broken into ripples
    const wy = y0 + 4, wg = g.createLinearGradient(0, wy, 0, H); wg.addColorStop(0, mix(m.sky[2], '#000000', 0.45)); wg.addColorStop(1, mix(m.sky[0], '#000000', 0.3));
    g.fillStyle = wg; g.fillRect(0, wy, W, H - wy);
    for (const [x, y] of lights) for (let k = 0; k < 6; k++) { const ry = wy + (y0 - y) * 0.6 + k * 4 + 3; if (ry > H) break; g.fillStyle = hexA(m.glow, 0.32 - k * 0.045); g.fillRect(x - 3 + hash(k, x | 0) * 2, ry, 5 - k * 0.5, 1.2); }
    g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 1; for (let y = wy + 6; y < H; y += 7) { g.beginPath(); g.moveTo(hash(y | 0, 1) * W * 0.3, y); g.lineTo(W - hash(y | 0, 2) * W * 0.3, y); g.stroke(); }
  }
}

// ── shells ────────────────────────────────────────────────────────────────
/** A paper-wrapped firework shell, size `u` (one sky unit) at resolution r. Comets point right; turn the image. */
export function shell(s: Shell, col: string, u: number, r: number) {
  const big = s.kind === 'peony' && s.r > 1.6, R = u * (big ? 0.34 : 0.27) * r, S = Math.ceil(u * 1.1 * r);
  const { c, g } = canvas(S, S), cx = S / 2, cy = S / 2;
  const paper = (path: () => void) => {
    const pg = g.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R * 1.25);
    pg.addColorStop(0, mix(col, '#ffffff', 0.55)); pg.addColorStop(0.45, col); pg.addColorStop(1, mix(col, '#000000', 0.55));
    g.fillStyle = pg; path(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = R * 0.06; path(); g.stroke();
  };
  // a soft glow of the colour it will burst in
  const gl = g.createRadialGradient(cx, cy, R * 0.6, cx, cy, S / 2); gl.addColorStop(0, hexA(col, 0.32)); gl.addColorStop(1, hexA(col, 0)); g.fillStyle = gl; g.fillRect(0, 0, S, S);
  if (s.kind === 'comet') {
    // a tail of sparks behind, so it's clear which way it will fly
    const tl = g.createLinearGradient(cx - R * 2.1, cy, cx, cy); tl.addColorStop(0, hexA(col, 0)); tl.addColorStop(1, hexA(mix(col, '#ffffff', 0.4), 0.75));
    g.fillStyle = tl; g.beginPath(); g.moveTo(cx - R * 2.1, cy); g.lineTo(cx - R * 0.4, cy - R * 0.45); g.lineTo(cx - R * 0.4, cy + R * 0.45); g.closePath(); g.fill();
    for (let k = 0; k < 6; k++) { g.fillStyle = hexA('#fff6d8', 0.7 - k * 0.1); g.beginPath(); g.arc(cx - R * (1.0 + k * 0.2), cy + (hash(k, 3) - 0.5) * R * 0.6, R * 0.06, 0, TAU); g.fill(); }
    paper(() => { g.beginPath(); g.moveTo(cx + R * 1.35, cy); g.quadraticCurveTo(cx + R * 0.2, cy - R * 1.05, cx - R * 0.7, cy - R * 0.72); g.arc(cx - R * 0.55, cy, R * 0.74, -Math.PI / 2 - 0.2, Math.PI / 2 + 0.2, true); g.quadraticCurveTo(cx + R * 0.2, cy + R * 1.05, cx + R * 1.35, cy); g.closePath(); });
    g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = R * 0.08; for (const k of [-0.3, 0.15]) { g.beginPath(); g.moveTo(cx + R * k, cy - R * 0.62); g.quadraticCurveTo(cx + R * (k + 0.12), cy, cx + R * k, cy + R * 0.62); g.stroke(); }
  } else if (s.kind === 'crossette') {
    paper(() => { g.beginPath(); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, b = a + Math.PI / 4; g.lineTo(cx + Math.cos(a) * R * 1.3, cy + Math.sin(a) * R * 1.3); g.lineTo(cx + Math.cos(b) * R * 0.62, cy + Math.sin(b) * R * 0.62); } g.closePath(); });
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(cx, cy, R * 0.22, 0, TAU); g.fill();
  } else {
    paper(() => { g.beginPath(); g.arc(cx, cy, R, 0, TAU); });
    // the paper's pasted strips
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip();
    g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = R * 0.07;
    for (let k = -2; k <= 2; k++) { g.beginPath(); g.ellipse(cx, cy, Math.abs(k) * R * 0.38 + 0.01, R, 0, 0, TAU); g.stroke(); }
    g.strokeStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.ellipse(cx, cy, R, R * 0.3, 0, 0, TAU); g.stroke();
    g.restore();
    if (big) { g.strokeStyle = hexA('#fff6d8', 0.75); g.lineWidth = R * 0.07; g.setLineDash([R * 0.14, R * 0.1]); g.beginPath(); g.arc(cx, cy, R * 1.18, 0, TAU); g.stroke(); g.setLineDash([]); }
  }
  // the fuse
  if (s.kind !== 'comet') {
    g.strokeStyle = '#d8c090'; g.lineWidth = R * 0.12; g.lineCap = 'round';
    const top = s.kind === 'crossette' ? cy - R * 0.25 : cy - R * 0.95;
    g.beginPath(); g.moveTo(cx, top); g.bezierCurveTo(cx + R * 0.3, top - R * 0.3, cx - R * 0.25, top - R * 0.45, cx + R * 0.12, top - R * 0.7); g.stroke();
  }
  // a glint
  g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(cx - R * 0.38, cy - R * 0.42, R * 0.2, R * 0.12, -0.6, 0, TAU); g.fill();
  return c;
}
/** A soft round spark for particles: white, tinted at run time. */
export function spark(size: number) {
  const { c, g } = canvas(size, size), h = size / 2, d = g.createRadialGradient(h, h, 0, h, h, h);
  d.addColorStop(0, 'rgba(255,255,255,1)'); d.addColorStop(0.25, 'rgba(255,255,255,0.85)'); d.addColorStop(0.6, 'rgba(255,255,255,0.22)'); d.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = d; g.fillRect(0, 0, size, size);
  return c;
}
/** A long glow for flashes. */
export function bloom(size: number) {
  const { c, g } = canvas(size, size), h = size / 2, d = g.createRadialGradient(h, h, 0, h, h, h);
  d.addColorStop(0, 'rgba(255,255,255,0.9)'); d.addColorStop(0.2, 'rgba(255,255,255,0.35)'); d.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = d; g.fillRect(0, 0, size, size);
  return c;
}
