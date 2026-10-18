/**
 * Hanabi sound, synthesised with Web Audio: a summer night of crickets, a breathy bamboo flute playing slow
 * pentatonic phrases over a soft taiko heartbeat; the scratch of a match, a deep boom and a long crackle for each
 * burst, a rising whistle for comets and a sharp split for crossettes; a finale of booms when the sky is lit.
 */
const SCALE = [0, 2, 4, 7, 9]; // major pentatonic
export function noteHz(degree: number) { const o = Math.floor(degree / 5), s = SCALE[((degree % 5) + 5) % 5] + o * 12; return 293.66 * Math.pow(2, s / 12); }

export class Sound {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private music!: GainNode;
  private sfx!: GainNode;
  private verb!: ConvolverNode;
  private noise!: AudioBuffer;
  private timer: number | null = null;
  private next = 0;
  private beatN = 0;
  private chapter = 0;
  private musicVol = 0.6;
  private sfxVol = 0.8;
  private ducked = false;
  private lastBoom = 0;

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      this.ctx = ctx;
      this.master = ctx.createGain(); this.master.gain.value = 0.9;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4;
      this.master.connect(comp).connect(ctx.destination);
      this.music = ctx.createGain(); this.sfx = ctx.createGain();
      this.verb = ctx.createConvolver(); this.verb.buffer = this.impulse(2.6);
      const wet = ctx.createGain(); wet.gain.value = 0.34;
      this.verb.connect(wet).connect(this.master);
      this.music.connect(this.master); this.music.connect(this.verb);
      this.sfx.connect(this.master); this.sfx.connect(this.verb);
      this.noise = this.makeNoise();
      this.applyVolumes();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }
  setVolumes(music: number, sfx: number) { this.musicVol = music; this.sfxVol = sfx; this.applyVolumes(); }
  private applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.music.gain.setTargetAtTime(this.musicVol * 0.6 * (this.ducked ? 0.6 : 1), t, 0.3);
    this.sfx.gain.setTargetAtTime(this.sfxVol, t, 0.05);
  }
  duck(on: boolean) { this.ducked = on; this.applyVolumes(); }
  suspend() { void this.ctx?.suspend(); }
  resume() { if (this.ctx?.state === 'suspended') void this.ctx.resume(); }

  startMusic(chapter: number) {
    if (!this.ctx) return;
    if (this.timer !== null && chapter === this.chapter) return;
    this.chapter = chapter;
    this.next = this.ctx.currentTime + 0.4;
    if (this.timer === null) this.timer = window.setInterval(() => this.schedule(), 150);
  }
  /** Crickets every beat, a taiko heartbeat, and a flute phrase every other bar of eight. */
  private schedule() {
    const ctx = this.ctx!;
    const phrases = [[[4, 0.9], [3, 0.5], [2, 1.4], [-1, 0.6], [3, 0.5], [4, 0.5], [5, 2]], [[2, 0.6], [4, 0.6], [5, 1.6], [4, 0.6], [2, 2]], [[7, 1.2], [5, 0.5], [4, 0.5], [2, 1.2], [3, 0.6], [2, 2.2]]];
    const beat = 0.5;
    while (this.next < ctx.currentTime + 0.8) {
      const t = this.next, bar = Math.floor(this.beatN / 8), pos = this.beatN % 8;
      if (pos % 2 === 0) this.cricket(t + Math.random() * 0.1);
      if (pos === 0 || pos === 3) this.taiko(t, pos === 0 ? 0.08 : 0.05, this.music);
      if (bar % 2 === 1 && pos === 0) {
        let at = t; const ph = phrases[(bar >> 1) % 3].map(([d, l]) => [d + this.chapter, l] as [number, number]);
        for (const [d, l] of ph) { if (d >= 0) this.flute(at, noteHz(d), l * beat * 1.6); at += l * beat; }
      }
      this.next += beat; this.beatN++;
    }
  }
  private cricket(t: number) {
    const ctx = this.ctx!, f = 4200 + Math.random() * 400;
    for (let k = 0; k < 3; k++) { const o = ctx.createOscillator(), g = ctx.createGain(), t0 = t + k * 0.045; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(0.004, t0 + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.035); o.connect(g).connect(this.music); o.start(t0); o.stop(t0 + 0.05); }
  }
  /** A bamboo flute: a sine with slow vibrato, breath noise, and a soft attack. */
  private flute(t: number, f: number, dur: number) {
    const ctx = this.ctx!, o = ctx.createOscillator(), g = ctx.createGain(), vib = ctx.createOscillator(), vg = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f * 0.97, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.12);
    vib.frequency.value = 5; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * 0.012, t + dur * 0.6); vib.connect(vg).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.04, t + 0.12); g.gain.setValueAtTime(0.04, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.music); o.start(t); vib.start(t); o.stop(t + dur + 0.05); vib.stop(t + dur + 0.05);
    this.hiss(t, dur * 0.8, 0.006, f * 2, 2, this.music);
  }
  private taiko(t: number, vol: number, bus: GainNode) {
    const ctx = this.ctx!, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.25);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); o.connect(g).connect(bus); o.start(t); o.stop(t + 0.55);
    this.hiss(t, 0.06, vol * 0.4, 400, 0.8, bus);
  }
  private hiss(t: number, dur: number, vol: number, freq: number, q = 1, bus?: GainNode, sweep?: number, type: BiquadFilterType = 'bandpass') {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource(); src.buffer = this.noise;
    const bp = ctx.createBiquadFilter(); bp.type = type; bp.Q.value = q; bp.frequency.setValueAtTime(freq, t); if (sweep) bp.frequency.exponentialRampToValueAtTime(sweep, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.01, dur * 0.2)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(bus ?? this.sfx); src.start(t, Math.random()); src.stop(t + dur + 0.05);
  }
  /** A burst: a low boom (quieter when many go off together) and a long, thinning crackle. */
  boom(kind: 'peony' | 'comet' | 'crossette', big: boolean, delaySec = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delaySec, crowd = t - this.lastBoom < 0.25 ? 0.55 : 1; this.lastBoom = t;
    const v = (big ? 0.34 : 0.26) * crowd;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(big ? 90 : 120, t); o.frequency.exponentialRampToValueAtTime(34, t + 0.5);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9); o.connect(g).connect(this.sfx); o.start(t); o.stop(t + 0.95);
    this.hiss(t, 0.7, v * 0.8, 300, 0.6, undefined, 80, 'lowpass');
    const n = kind === 'peony' ? 18 : kind === 'crossette' ? 10 : 6;
    for (let k = 0; k < n; k++) { const at = t + 0.25 + Math.random() * (big ? 1.3 : 0.9); this.hiss(at, 0.015, (0.02 + Math.random() * 0.03) * crowd, 2500 + Math.random() * 4000, 3); }
    if (kind === 'crossette') for (const d of [0.32, 0.36]) this.hiss(t + d, 0.05, 0.12 * crowd, 1800, 1);
    if (kind === 'comet') this.hiss(t, 0.5, 0.06 * crowd, 900, 4, undefined, 4200);
  }
  /** The match: a scratch and a fizz. */
  strike() { if (this.ctx) { const t = this.ctx.currentTime; this.hiss(t, 0.09, 0.08, 3200, 1.5, undefined, 1200); this.hiss(t + 0.08, 0.35, 0.03, 5000, 0.8); } }
  /** Choosing a shell: a soft wooden tock. */
  pick() { if (this.ctx) { const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.frequency.setValueAtTime(820, t); o.frequency.exponentialRampToValueAtTime(600, t + 0.04); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); o.connect(g).connect(this.sfx); o.start(t); o.stop(t + 0.1); } }
  tap() { if (this.ctx) this.hiss(this.ctx.currentTime, 0.04, 0.03, 2600, 2); }
  /** Out of matches with shells still dark. */
  dud() { if (this.ctx) { const t = this.ctx.currentTime; this.flute(t, noteHz(1) * 0.94, 0.6); this.flute(t + 0.3, noteHz(-1) * 0.94, 0.9); } }
  undo() { if (this.ctx) this.hiss(this.ctx.currentTime, 0.25, 0.03, 1500, 1, undefined, 600); }
  hint() { if (this.ctx) { const t = this.ctx.currentTime; this.flute(t, noteHz(7), 0.5); this.flute(t + 0.18, noteHz(9), 0.8); } }
  /** The whole sky lit: a heartbeat of taiko under a flute's rising phrase. */
  whole() { if (this.ctx) { const t = this.ctx.currentTime; [0, 0.3, 0.6, 0.75, 0.9].forEach((d, i) => this.taiko(t + d, 0.12 + i * 0.02, this.sfx)); [4, 5, 7, 9, 10].forEach((d, i) => this.flute(t + 0.2 + i * 0.22, noteHz(d), 1.1 + i * 0.2)); } }
  star(i: number) { if (this.ctx) { const t = this.ctx.currentTime; this.flute(t, noteHz([7, 9, 12][i] ?? 12), 0.9); this.hiss(t, 0.3, 0.02, 6000, 1); } }

  private makeNoise() {
    const ctx = this.ctx!;
    const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  private impulse(seconds: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2); }
    return b;
  }
}
export const sound = new Sound();
