import Phaser from 'phaser';
import * as A from './art';
import { LEVELS, type Level } from './levels';
import { BEAM, chain, DIRS, graph, rays, sources, SKY_H, SKY_W, starsFor } from './sim';
import { sound } from '../audio/sound';

export type Result = { tries: number; matches: number; stars: number; hinted: boolean };
export type Finish = { level: Level; result: Result };
type Hooks = { onFinish?: (f: Finish) => void; onFirstAction?: () => void; onHaptic?: (s: 'light' | 'medium' | 'success' | 'warning') => void };
export type HudState = { phase: 'play' | 'busy' | 'done'; matches: number; total: number; dark: number; tries: number; hints: number; used: boolean; msg: string; msgId: number };

/** Bridge between React and the Phaser scene. */
export const sky = {
  hooks: {} as Hooks,
  scene: null as SkyScene | null,
  reducedMotion: false,
  show(mode: 'menu' | 'play', level: Level) { this.scene?.show(mode, level); },
  setPaused(p: boolean) { this.scene?.setPaused(p); },
  state(): HudState | null { return this.scene?.hudState() ?? null; },
  hint() { this.scene?.hint(); },
  restart() { this.scene?.restart(); },
  debug() { return this.scene?.debugState(); },
  /** QA only: the CSS centre of a shell, and shells that light the rest of the sky from here (one per match). */
  qaShell(i: number) { return this.scene?.qaShell(i); },
  solvePath(): number[] | null { return this.scene?.remaining() ?? null; },
};
(window as unknown as { __sky: typeof sky }).__sky = sky;

const VIEW_W = 360;
const SHOWCASE = ['c3', 'b6', 'a8', 'c8'];
type Fuse = { x0: number; y0: number; x1: number; y1: number; t0: number; t1: number; col: number };

export class SkyScene extends Phaser.Scene {
  level: Level = LEVELS[0];
  private G: number[][] = [];
  private mode: 'menu' | 'play' = 'menu';
  private phase: 'play' | 'busy' | 'done' = 'play';
  private paused = false;
  private acted = false;
  private texSeq = 0;
  private r = 2;
  private viewW = VIEW_W; private viewH = 700;
  private u = 40; private ox = 0; private oy = 0;
  private spent: boolean[] = [];
  private matches = 0; private tries = 1; private hints = 0;
  private sel = -1; private hintShell = -1; private hintT = -9;
  private imgs: Phaser.GameObjects.Image[] = [];
  private cols: string[] = [];
  private fx!: Phaser.GameObjects.Graphics; private pre!: Phaser.GameObjects.Graphics;
  private fuses: Fuse[] = [];
  private parts: { x: number; y: number; vx: number; vy: number; age: number; life: number; col: number; size: number; g: number; tw: boolean }[] = [];
  private msg = ''; private msgId = 0;
  private clock = 0;
  private gen = 0;
  private demoT = 0;

  constructor() { super('sky'); }

  create() {
    sky.scene = this;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.down(p));
    this.scale.on('resize', () => this.rebuild());
    this.show('menu', LEVELS.find((l) => l.id === SHOWCASE[0])!);
  }
  isMenu() { return this.mode === 'menu'; }
  setPaused(p: boolean) { this.paused = p; if (p) this.time.paused = true; else this.time.paused = false; this.tweens.timeScale = p ? 0 : 1; }
  hudState(): HudState { return { phase: this.phase, matches: this.matches, total: this.level.matches, dark: this.spent.filter((s) => !s).length, tries: this.tries, hints: this.hints, used: this.matches < this.level.matches, msg: this.msg, msgId: this.msgId }; }
  debugState() { return { ...this.hudState(), mode: this.mode, sel: this.sel, spent: this.spent.slice() }; }
  private css() { const z = this.cameras.main.zoom, kk = (this.game.canvas.clientWidth || VIEW_W) / this.scale.width; return z * kk; }
  qaShell(i: number) { const p = this.pos(i), k = this.css(); return { x: p.x * k, y: p.y * k }; }
  remaining() { return sources(this.level, this.G, this.spent).map((g) => this.bestOf(g)); }
  private say(m: string) { this.msg = m; this.msgId++; }
  private later(ms: number, fn: () => void) { const g = this.gen; this.time.delayedCall(ms, () => { if (g === this.gen) fn(); }); }

  show(mode: 'menu' | 'play', level: Level) {
    this.mode = mode; this.level = level; this.gen++;
    this.G = graph(level);
    this.tries = 1; this.hints = 0; this.acted = false; this.paused = false; this.time.paused = false; this.tweens.timeScale = 1;
    this.reset();
  }
  /** Every shell back in the sky and the matches back in the box. */
  private reset() {
    this.spent = this.level.shells.map(() => false); this.matches = this.level.matches;
    this.phase = 'play'; this.sel = -1; this.hintShell = -1; this.msg = ''; this.fuses = []; this.parts = []; this.demoT = 1.4;
    this.rebuild();
  }
  restart() {
    if (this.mode !== 'play' || this.phase === 'done' || this.matches === this.level.matches) return;
    this.gen++; this.tries++; sound.undo(); this.reset(); this.fadeIn();
  }
  private fadeIn() { if (sky.reducedMotion) return; this.imgs.forEach((im, i) => { const s = im.scale; im.setAlpha(0).setScale(s * 0.6); this.tweens.add({ targets: im, alpha: 1, scale: s, duration: 420, delay: i * 25, ease: 'Back.easeOut' }); }); }

  // ── layout ────────────────────────────────────────────────────────────
  private tex(prefix: string, c: HTMLCanvasElement) { const key = `${prefix}-${++this.texSeq}`; this.textures.addCanvas(key, c); return key; }
  private rebuild() {
    const stale = this.textures.getTextureKeys().filter((k) => /-\d+$/.test(k));
    this.tweens.killAll();
    this.children.removeAll(true);
    if (stale.length) this.events.once('postrender', () => stale.forEach((k) => this.textures.exists(k) && this.textures.remove(k)));
    const pw = this.scale.width, ph = this.scale.height, dpr = Math.min(2, window.devicePixelRatio || 1);
    const zoom = Math.min(pw / VIEW_W, ph / 640);
    this.r = Math.min(2, Math.max(1, zoom));
    this.viewW = pw / zoom; this.viewH = ph / zoom;
    this.cameras.main.setZoom(zoom).centerOn(this.viewW / 2, this.viewH / 2);
    const css = zoom / dpr, play = this.mode === 'play', W = this.viewW, H = this.viewH, l = this.level, m = A.MOODS[l.chapter], r = this.r;
    const top = (play ? 84 : 236) / css, bottom = (play ? 100 : 200) / css, availH = H - top - bottom;
    this.u = Math.min((W - 20) / SKY_W, availH / SKY_H, 62);
    this.ox = (W - SKY_W * this.u) / 2; this.oy = top + (availH - SKY_H * this.u) / 2;
    const ground = Math.min(H - 24, this.oy + SKY_H * this.u + this.u * 0.45);
    this.add.image(0, 0, this.tex('nt', A.night(m, W, H, Math.min(r, 1.5), 11 + l.chapter * 7, ground))).setOrigin(0, 0).setScale(1 / Math.min(r, 1.5));
    if (!this.textures.exists('bloom')) this.textures.addCanvas('bloom', A.bloom(128));
    this.pre = this.add.graphics().setDepth(2);
    this.cols = l.shells.map((_, i) => m.shells[(i * 5 + l.id.charCodeAt(1)) % m.shells.length]);
    this.imgs = l.shells.map((s, i) => {
      const p = this.pos(i), im = this.add.image(p.x, p.y, this.tex('sh', A.shell(s, this.cols[i], this.u, r))).setScale(1 / r).setDepth(5);
      if (s.kind === 'comet') im.setAngle((s.dir ?? 0) * 45);
      if (s.kind === 'crossette') im.setAngle((s.dir ?? 0) * 45);
      if (this.spent[i]) im.setVisible(false);
      return im;
    });
    this.fx = this.add.graphics().setDepth(8).setBlendMode(Phaser.BlendModes.ADD);
  }
  private pos(i: number) { const s = this.level.shells[i]; return { x: this.ox + s.x * this.u, y: this.oy + s.y * this.u }; }
  private shellAt(x: number, y: number) {
    let best = -1, bd = this.u * 0.55;
    this.level.shells.forEach((_, i) => { if (this.spent[i]) return; const p = this.pos(i), d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  /** Of a group of shells that light each other, the one whose burst lights the most. */
  private bestOf(g: number[]) { let best = g[0], n = -1; for (const i of g) { const c = chain(this.level, this.G, i, this.spent).length; if (c > n) { n = c; best = i; } } return best; }

  // ── playing ───────────────────────────────────────────────────────────
  private down(p: Phaser.Input.Pointer) {
    if (this.mode !== 'play' || this.paused || this.phase !== 'play') return;
    const w = this.cameras.main.getWorldPoint(p.x, p.y), i = this.shellAt(w.x, w.y);
    if (!this.acted) { this.acted = true; sky.hooks.onFirstAction?.(); }
    if (i < 0) { if (this.sel >= 0) { this.sel = -1; sound.tap(); } return; }
    if (i === this.sel) { this.light(i); return; }
    this.sel = i; this.hintShell = -1; sound.pick(); sky.hooks.onHaptic?.('light');
  }
  /** Strike a match: the shell bursts, and its burst runs through the sky. */
  private light(i: number) {
    this.sel = -1; this.hintShell = -1; this.matches--; this.phase = 'busy';
    sound.strike(); sky.hooks.onHaptic?.('medium');
    const events = chain(this.level, this.G, i, this.spent);
    let last = 0;
    for (const e of events) {
      this.spent[e.i] = true;
      const at = 0.25 + e.at; last = Math.max(last, at);
      if (e.from >= 0) { const a = this.pos(e.from), b = this.pos(e.i); this.fuses.push({ x0: a.x, y0: a.y, x1: b.x, y1: b.y, t0: this.clock + 0.25 + this.atOf(events, e.from), t1: this.clock + at, col: A.toInt(this.cols[e.from]) }); }
      this.later(at * 1000, () => this.burst(e.i));
    }
    this.later((last + 1.0) * 1000, () => this.settle());
  }
  private atOf(events: { i: number; at: number }[], i: number) { return events.find((e) => e.i === i)?.at ?? 0; }
  /** After the last burst of a chain: won, out of matches, or on to the next match. */
  private settle() {
    this.fuses = [];
    if (this.spent.every(Boolean)) { this.win(); return; }
    if (this.matches > 0) { this.phase = 'play'; if (this.mode === 'play' && sources(this.level, this.G, this.spent).length > this.matches) this.say('Not enough matches left for every dark shell. Start again when you’re ready.'); return; }
    this.phase = 'busy';
    if (this.mode !== 'play') return;
    sound.dud(); sky.hooks.onHaptic?.('warning');
    const dark = this.spent.filter((s) => !s).length;
    this.say(`Out of matches with ${dark} ${dark === 1 ? 'shell' : 'shells'} still dark. The night begins again.`);
    this.later(2000, () => { this.tries++; this.reset(); this.fadeIn(); });
  }
  private burst(i: number) {
    const s = this.level.shells[i], p = this.pos(i), col = A.toInt(this.cols[i]), u = this.u, im = this.imgs[i];
    im?.setVisible(false);
    const big = s.kind === 'peony' && s.r > 1.6;
    sound.boom(s.kind, big);
    const reduced = sky.reducedMotion;
    // the flash
    const fl = this.add.image(p.x, p.y, 'bloom').setTint(col).setBlendMode(Phaser.BlendModes.ADD).setDepth(7).setScale((u * (big ? 2.4 : 1.8)) / 128).setAlpha(0.9);
    this.tweens.add({ targets: fl, alpha: 0, scale: fl.scale * 1.5, duration: reduced ? 300 : 700, ease: 'Cubic.easeOut', onComplete: () => fl.destroy() });
    const R = s.r * u, n = reduced ? 0.4 : 1;
    if (s.kind === 'peony') {
      this.spray(p.x, p.y, Math.round((big ? 110 : 80) * n), col, R, null, 1.2, 1.7, u * 0.05, 0.5);
      if (!reduced) this.spray(p.x, p.y, big ? 50 : 34, 0xfff0c0, R * 0.75, null, 1.8, 2.8, u * 0.03, 1.6, true);
    } else {
      for (const d of rays(s)) this.spray(p.x, p.y, Math.round((s.kind === 'comet' ? 70 : 34) * n), col, R, d * 45, 1.0, 1.5, u * 0.05, 0.25, false, true);
      if (!reduced) this.spray(p.x, p.y, 20, col, u * 0.8, null, 0.9, 1.4, u * 0.035, 0.6);
    }
    // a drift of smoke where it was
    const sm = this.add.image(p.x, p.y, 'bloom').setTint(0x8a8aa0).setDepth(3).setScale((u * 1.2) / 128).setAlpha(0.18);
    this.tweens.add({ targets: sm, alpha: 0, y: p.y - u * 0.5, scale: sm.scale * 1.8, duration: 2600, onComplete: () => sm.destroy() });
  }
  /**
   * Throw `count` sparks from (x, y). Drag slows them so they come to rest about `reach` away (spread all round, or
   * along `angle` in degrees, filling the line when `line`), then gravity draws them down as they fade.
   */
  private spray(x: number, y: number, count: number, col: number, reach: number, angle: number | null, life0: number, life1: number, size: number, grav: number, twinkle = false, line = false) {
    const K = 2.4;
    for (let k = 0; k < count; k++) {
      const a = angle === null ? Math.random() * Math.PI * 2 : ((angle + (Math.random() - 0.5) * 4) * Math.PI) / 180;
      const f = line ? 0.12 + Math.random() * 0.88 : 0.78 + Math.random() * 0.22, v = reach * K * f;
      this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, age: 0, life: life0 + Math.random() * (life1 - life0), col: Math.random() < 0.2 ? 0xffffff : col, size: size * (0.7 + Math.random() * 0.6), g: grav * this.u, tw: twinkle });
    }
    if (this.parts.length > 2400) this.parts.splice(0, this.parts.length - 2400);
  }
  private drawParts(dt: number) {
    const fx = this.fx, K = 2.4, damp = Math.exp(-K * dt);
    this.parts = this.parts.filter((q) => (q.age += dt) < q.life);
    for (const q of this.parts) {
      q.vx *= damp; q.vy = q.vy * damp + q.g * dt; const px = q.x, py = q.y; q.x += q.vx * dt; q.y += q.vy * dt;
      const k = q.age / q.life, a = (1 - k) * (1 - k) * (q.tw ? 0.5 + 0.5 * Math.sin(q.age * 40 + q.x) : 1);
      fx.lineStyle(q.size * 0.9, q.col, a * 0.5); fx.lineBetween(px - (q.x - px) * 2, py - (q.y - py) * 2, q.x, q.y);
      fx.fillStyle(q.col, a * 0.22); fx.fillCircle(q.x, q.y, q.size * 2.2);
      fx.fillStyle(0xffffff, a * 0.9); fx.fillCircle(q.x, q.y, q.size * 0.6);
    }
  }
  /** A hint chooses a shell that belongs in the answer, or says if too few matches are left. */
  hint() {
    if (this.mode !== 'play' || this.phase !== 'play') return;
    if (!this.acted) { this.acted = true; sky.hooks.onFirstAction?.(); }
    let groups = sources(this.level, this.G, this.spent);
    this.hints++;
    let restarted = false;
    if (groups.length > this.matches) { this.gen++; this.tries++; this.reset(); this.fadeIn(); restarted = true; groups = sources(this.level, this.G, this.spent); }
    const pick = this.bestOf(groups.sort((a, b) => chain(this.level, this.G, this.bestOf(b), this.spent).length - chain(this.level, this.G, this.bestOf(a), this.spent).length)[0]);
    this.sel = pick; this.hintShell = pick; this.hintT = this.clock;
    sound.hint(); this.say(restarted ? 'Too few matches were left, so the night begins again. Start with this shell: tap it again to light it.' : 'This shell needs a match of its own. Tap it again to light it.');
  }
  private win() {
    this.phase = 'done'; this.sel = -1;
    sound.whole(); sky.hooks.onHaptic?.('success');
    // a finale: shells of every colour high over the sky
    const m = A.MOODS[this.level.chapter];
    if (!sky.reducedMotion) for (let k = 0; k < 5; k++) this.later(250 + k * 260, () => {
      const x = this.ox + (0.8 + Math.random() * (SKY_W - 1.6)) * this.u, y = this.oy + (0.6 + Math.random() * 3) * this.u, col = A.toInt(m.shells[k % m.shells.length]);
      this.spray(x, y, 90, col, this.u * 1.8, null, 1.2, 1.8, this.u * 0.05, 0.6); this.spray(x, y, 30, 0xfff0c0, this.u * 1.3, null, 1.8, 2.6, this.u * 0.03, 1.4, true);
      sound.boom('peony', k === 4);
    });
    const st = starsFor(this.tries, this.hints);
    if (this.mode === 'play') this.later(2900, () => sky.hooks.onFinish?.({ level: this.level, result: { tries: this.tries, matches: this.level.matches, stars: st, hinted: this.hints > 0 } }));
    else this.later(3600, () => { const i = (SHOWCASE.indexOf(this.level.id) + 1) % SHOWCASE.length; this.show('menu', LEVELS.find((x) => x.id === SHOWCASE[i])!); });
  }

  update(_t: number, dms: number) {
    const dt = Math.min(0.05, dms / 1000);
    if (this.paused) return;
    this.clock += dt;
    const u = this.u, pre = this.pre, fx = this.fx; pre.clear(); fx.clear();
    // shells breathe gently
    if (!sky.reducedMotion) this.imgs.forEach((im, i) => { if (!this.spent[i]) im.y = this.pos(i).y + Math.sin(this.clock * 1.3 + i * 1.7) * u * 0.035; });
    if (this.mode === 'menu') this.runDemo(dt);
    this.drawParts(dt);
    // the chosen shell: its reach, and the shells it would light directly
    if (this.sel >= 0 && this.phase === 'play') {
      const s = this.level.shells[this.sel], p = this.pos(this.sel), col = A.toInt(this.cols[this.sel]);
      const pulse = sky.reducedMotion ? 1 : 0.75 + 0.25 * Math.sin(this.clock * 5);
      if (s.kind === 'peony') { pre.fillStyle(col, 0.1); pre.fillCircle(p.x, p.y, s.r * u); pre.lineStyle(2, col, 0.75 * pulse); pre.strokeCircle(p.x, p.y, s.r * u); }
      else for (const d of rays(s)) {
        const [dx, dy] = DIRS[d], nx = -dy, ny = dx, L = s.r * u, b = BEAM * u;
        const pts = [{ x: p.x + nx * b, y: p.y + ny * b }, { x: p.x + dx * L + nx * b, y: p.y + dy * L + ny * b }, { x: p.x + dx * L - nx * b, y: p.y + dy * L - ny * b }, { x: p.x - nx * b, y: p.y - ny * b }];
        pre.fillStyle(col, 0.12); pre.fillPoints(pts, true); pre.lineStyle(2, col, 0.7 * pulse); pre.strokePoints(pts, true);
      }
      pre.lineStyle(2.5, 0xffffff, 0.9); pre.strokeCircle(p.x, p.y, u * 0.42);
      for (const j of this.G[this.sel]) { if (this.spent[j]) continue; const q = this.pos(j); pre.lineStyle(2, col, 0.9); pre.strokeCircle(q.x, this.imgs[j].y, u * 0.36); }
      if (this.hintShell === this.sel) { const e = this.clock - this.hintT; pre.lineStyle(3, 0xffe08a, Math.max(0.3, 1 - e / 4)); pre.strokeCircle(p.x, p.y, u * (0.5 + 0.06 * Math.sin(e * 6))); }
    }
    // fuses running from burst to shell
    for (const f of this.fuses) {
      if (this.clock < f.t0 || this.clock > f.t1) continue;
      const k = (this.clock - f.t0) / Math.max(0.01, f.t1 - f.t0), x = f.x0 + (f.x1 - f.x0) * k, y = f.y0 + (f.y1 - f.y0) * k, tk = Math.max(0, k - 0.25);
      fx.lineStyle(2, f.col, 0.55); fx.lineBetween(f.x0 + (f.x1 - f.x0) * tk, f.y0 + (f.y1 - f.y0) * tk, x, y);
      fx.fillStyle(0xffffff, 0.95); fx.fillCircle(x, y, 2.4); fx.fillStyle(f.col, 0.5); fx.fillCircle(x, y, 5);
    }
  }
  /** The menu demo: light the sky the right way, one match at a time. */
  private runDemo(dt: number) {
    if (this.phase !== 'play') return;
    this.demoT -= dt; if (this.demoT > 0) return;
    const pick = this.remaining()[0]; if (pick === undefined) return;
    this.light(pick); this.demoT = 0.4;
  }
}

export function startGame(parent: HTMLElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#0b0f24',
    scale: { mode: Phaser.Scale.NONE, width: parent.clientWidth * dpr, height: parent.clientHeight * dpr, zoom: 1 / dpr },
    render: { antialias: true, pixelArt: false, powerPreference: 'high-performance' },
    audio: { noAudio: true },
    fps: { target: 60, smoothStep: false },
    input: { activePointers: 1 },
    scene: [SkyScene],
    banner: false,
  });
  const onResize = () => {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    game.scale.setZoom(1 / d);
    game.scale.resize(parent.clientWidth * d, parent.clientHeight * d);
  };
  window.addEventListener('resize', onResize);
  return () => { window.removeEventListener('resize', onResize); game.destroy(true); };
}
