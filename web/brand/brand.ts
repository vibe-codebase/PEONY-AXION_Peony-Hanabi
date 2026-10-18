// Store icon, adaptive-icon layers, splash and feature graphic: chrysanthemum fireworks over a summer night.
import * as A from '../src/game/art';
import type { Shell } from '../src/game/sim';

const H0 = A.MOODS[0], T0 = A.MOODS[2];
function rnd(seed: number) { let s = seed * 9301 + 49297; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }
/** A painted firework: streaks fading outwards from the heart, bright tips, a halo, falling glitter. */
function burst(g: CanvasRenderingContext2D, x: number, y: number, R: number, col: string, seed: number, rays = 64, inner?: string) {
  const r = rnd(seed);
  const halo = g.createRadialGradient(x, y, 0, x, y, R * 1.3); halo.addColorStop(0, A.hexA(col, 0.35)); halo.addColorStop(0.5, A.hexA(col, 0.12)); halo.addColorStop(1, A.hexA(col, 0));
  g.fillStyle = halo; g.fillRect(x - R * 1.3, y - R * 1.3, R * 2.6, R * 2.6);
  g.globalCompositeOperation = 'lighter';
  const ring = (n: number, RR: number, c: string, w: number) => {
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + r() * 0.08, l = RR * (0.82 + r() * 0.18), sag = l * 0.08;
      const ex = x + Math.cos(a) * l, ey = y + Math.sin(a) * l + sag;
      const gr = g.createLinearGradient(x, y, ex, ey); gr.addColorStop(0, A.hexA(c, 0)); gr.addColorStop(0.55, A.hexA(c, 0.5)); gr.addColorStop(1, A.hexA('#ffffff', 0.95));
      g.strokeStyle = gr; g.lineWidth = w; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x + Math.cos(a) * RR * 0.18, y + Math.sin(a) * RR * 0.18); g.quadraticCurveTo(x + Math.cos(a) * l * 0.7, y + Math.sin(a) * l * 0.7, ex, ey); g.stroke();
      const tip = g.createRadialGradient(ex, ey, 0, ex, ey, w * 3); tip.addColorStop(0, 'rgba(255,255,255,0.95)'); tip.addColorStop(0.4, A.hexA(c, 0.6)); tip.addColorStop(1, A.hexA(c, 0));
      g.fillStyle = tip; g.fillRect(ex - w * 3, ey - w * 3, w * 6, w * 6);
    }
  };
  ring(rays, R, col, Math.max(1.2, R * 0.022));
  if (inner) ring(Math.round(rays * 0.6), R * 0.5, inner, Math.max(1, R * 0.018));
  for (let k = 0; k < rays * 1.2; k++) { const a = r() * Math.PI * 2, l = R * (0.3 + r() * 1.0), gx = x + Math.cos(a) * l, gy = y + Math.sin(a) * l + R * 0.25 * r(); g.fillStyle = `rgba(255,240,200,${0.3 + r() * 0.5})`; g.beginPath(); g.arc(gx, gy, Math.max(0.6, R * 0.008), 0, Math.PI * 2); g.fill(); }
  const core = g.createRadialGradient(x, y, 0, x, y, R * 0.16); core.addColorStop(0, 'rgba(255,255,255,0.9)'); core.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = core; g.fillRect(x - R * 0.2, y - R * 0.2, R * 0.4, R * 0.4);
  g.globalCompositeOperation = 'source-over';
}
function shellAt(g: CanvasRenderingContext2D, s: Shell, col: string, u: number, x: number, y: number) {
  const c = A.shell(s, col, u, 1); g.save(); g.translate(x, y); if (s.kind !== 'peony') g.rotate(((s.dir ?? 0) * Math.PI) / 4); g.drawImage(c, -c.width / 2, -c.height / 2); g.restore();
}
function fuse(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, col: string, w: number) {
  const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, A.hexA(col, 0)); gr.addColorStop(1, A.hexA(col, 0.9));
  g.strokeStyle = gr; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x1, y1, w * 1.4, 0, Math.PI * 2); g.fill();
}
function iconArt(g: CanvasRenderingContext2D, S: number, bg: boolean) {
  if (bg) g.drawImage(A.night(T0, S, S, 1, 4, S * 0.93, false), 0, 0);
  burst(g, S * 0.5, S * 0.44, S * 0.34, '#ff5a4a', 7, 56, '#ffd25a');
  burst(g, S * 0.8, S * 0.2, S * 0.12, '#ffa0e0', 3, 30);
  burst(g, S * 0.2, S * 0.24, S * 0.09, '#7ab8ff', 5, 26);
}
export function icon() { const { c, g } = A.canvas(1024, 1024); iconArt(g, 1024, true); return c; }
export function adaptive() { const { c, g } = A.canvas(1024, 1024); g.translate(512, 512); g.scale(0.68, 0.68); g.translate(-512, -512); iconArt(g, 1024, false); return c; }
export function adaptiveBg() { const { c, g } = A.canvas(1024, 1024); g.drawImage(A.night(T0, 1024, 1024, 1, 4, 980, false), 0, 0); return c; }
export function splash() {
  const W = 1284, H = 2778, { c, g } = A.canvas(W, H);
  g.drawImage(A.night(H0, W, H, 1, 9, H * 0.84), 0, 0);
  burst(g, W * 0.5, H * 0.5, 420, '#ffcf4a', 2, 70, '#ff5a6a'); burst(g, W * 0.2, H * 0.36, 200, '#5ad0ff', 4, 40); burst(g, W * 0.8, H * 0.62, 240, '#c58aff', 6, 44);
  const sh = g.createLinearGradient(0, 0, 0, 1000); sh.addColorStop(0, 'rgba(4,6,20,0.85)'); sh.addColorStop(1, 'rgba(4,6,20,0)'); g.fillStyle = sh; g.fillRect(0, 0, W, 1000);
  g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = '800 190px "Shippori Mincho", serif'; g.fillStyle = '#fbf6ff'; g.shadowColor = 'rgba(255,140,90,0.5)'; g.shadowBlur = 40; g.fillText('Hanabi', W / 2, 720); g.shadowBlur = 0;
  g.font = '700 64px "M PLUS Rounded 1c", sans-serif'; g.fillStyle = '#ffcf6a'; try { g.letterSpacing = '36px'; } catch { /* */ } g.fillText('PEONY', W / 2 + 18, 500); try { g.letterSpacing = '0px'; } catch { /* */ }
  return c;
}
/** The feature graphic: a chain of bursts running across the harbour sky, fuses still burning; the words on the left. */
export function feature() {
  const W = 1024, H = 500, { c, g } = A.canvas(W, H);
  g.drawImage(A.night(H0, W, H, 1, 5, H * 0.86, false), 0, 0);
  burst(g, 640, 170, 120, '#ffcf4a', 1, 60, '#ff5a6a');
  burst(g, 860, 120, 90, '#5ad0ff', 2, 48);
  burst(g, 800, 330, 70, '#c58aff', 3, 40);
  fuse(g, 640, 170, 760, 300, '#ffcf4a', 2.4); fuse(g, 860, 120, 945, 250, '#5ad0ff', 2.2);
  shellAt(g, { x: 0, y: 0, kind: 'peony', r: 1.35 }, '#ff9a4a', 64, 945, 262);
  shellAt(g, { x: 0, y: 0, kind: 'comet', r: 4, dir: 7 }, '#7dffb0', 64, 690, 370);
  shellAt(g, { x: 0, y: 0, kind: 'crossette', r: 2.3, dir: 0 }, '#ff5a6a', 64, 560, 330);
  const shade = g.createLinearGradient(0, 0, 560, 0); shade.addColorStop(0, 'rgba(4,6,20,0.92)'); shade.addColorStop(0.7, 'rgba(4,6,20,0.6)'); shade.addColorStop(1, 'rgba(4,6,20,0)'); g.fillStyle = shade; g.fillRect(0, 0, 560, H);
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.fillStyle = '#fbf6ff'; g.shadowColor = 'rgba(255,140,90,0.55)'; g.shadowBlur = 24; g.font = '800 80px "Shippori Mincho", serif'; g.fillText('Hanabi', 50, 170); g.shadowBlur = 0;
  g.font = '700 22px "M PLUS Rounded 1c", sans-serif'; g.fillStyle = '#ffcf6a'; try { g.letterSpacing = '12px'; } catch { /* */ } g.fillText('PEONY', 54, 94); try { g.letterSpacing = '0px'; } catch { /* */ }
  g.fillStyle = '#ffcf6a'; g.font = '800 29px "Shippori Mincho", serif'; g.fillText('One match. A whole night sky.', 54, 218);
  g.fillStyle = '#ff8a5a'; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(60 + k * 14, 243, 2.4, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = 'rgba(251,246,255,0.9)'; g.font = '700 18px "M PLUS Rounded 1c", sans-serif';
  g.fillText('Choose which shells to light, and watch', 56, 282);
  g.fillText('each burst set off the next. 24 nights of', 56, 308);
  g.fillText('chain-reaction puzzles, no timers.', 56, 334);
  return c;
}
(window as unknown as { brand: unknown }).brand = { icon, adaptive, adaptiveBg, splash, feature };
