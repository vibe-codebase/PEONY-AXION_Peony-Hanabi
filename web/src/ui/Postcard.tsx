import { useEffect, useRef } from 'react';
import { canvas, MOODS, hexA } from '../game/art';
import type { Level } from '../game/levels';
import { SKY_H, SKY_W } from '../game/sim';

const cache = new Map<string, HTMLCanvasElement>();
/** The night in miniature: its shells as coloured beads; once lit, as little chrysanthemums. */
function paintCard(level: Level, solved: boolean, w: number, h: number, dpr: number) {
  const m = MOODS[level.chapter], { c, g } = canvas(w * dpr, h * dpr);
  g.scale(dpr, dpr);
  g.save(); g.beginPath(); g.roundRect(0, 0, w, h, 8); g.clip();
  const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, m.sky[0]); bg.addColorStop(0.7, m.sky[1]); bg.addColorStop(1, m.sky[2]); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = m.land; g.fillRect(0, h * 0.92, w, h * 0.08);
  const u = Math.min((w - 8) / SKY_W, (h * 0.9 - 6) / SKY_H), ox = (w - SKY_W * u) / 2, oy = 4;
  level.shells.forEach((s, i) => {
    const x = ox + s.x * u, y = oy + s.y * u, col = m.shells[(i * 5 + level.id.charCodeAt(1)) % m.shells.length];
    if (solved) {
      const R = u * (s.kind === 'peony' ? 0.75 : 0.55);
      const gl = g.createRadialGradient(x, y, 0, x, y, R); gl.addColorStop(0, hexA(col, 0.55)); gl.addColorStop(1, hexA(col, 0)); g.fillStyle = gl; g.fillRect(x - R, y - R, R * 2, R * 2);
      g.strokeStyle = col; g.lineWidth = 0.8; for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; g.beginPath(); g.moveTo(x + Math.cos(a) * R * 0.3, y + Math.sin(a) * R * 0.3); g.lineTo(x + Math.cos(a) * R * 0.85, y + Math.sin(a) * R * 0.85); g.stroke(); }
    } else { g.fillStyle = col; g.beginPath(); g.arc(x, y, Math.max(1.5, u * 0.2), 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(x - u * 0.06, y - u * 0.06, Math.max(0.6, u * 0.06), 0, Math.PI * 2); g.fill(); }
  });
  g.restore();
  return c;
}

export function Postcard({ level, solved, locked, width }: { level: Level; solved: boolean; locked: boolean; width: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const height = Math.round(width * 1.25);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), key = `${level.id}|${solved}|${locked}|${width}|${dpr}`;
    let src = cache.get(key);
    if (!src) { src = paintCard(level, solved && !locked, width, height, dpr); cache.set(key, src); }
    el.width = src.width; el.height = src.height; el.getContext('2d')!.drawImage(src, 0, 0);
  }, [level, solved, locked, width, height]);
  return <canvas ref={ref} className="postcard" style={{ width, height }} aria-hidden />;
}
