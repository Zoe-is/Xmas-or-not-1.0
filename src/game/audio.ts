import type { AudioSettings, DayNightPhase } from './types';

const AUDIO_STORAGE_KEY = 'santa_worldwide_audio_v1';

class ChristmasAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private muted = false;
  private musicVolume = 0.7;
  private sfxVolume = 0.85;
  private musicPlaying = false;
  private musicMode: DayNightPhase = 'day';
  private stepIndex = 0;
  private timerId: number | null = null;

  // Cheerful Daytime Christmas Sleigh Bells Melody (C major)
  private readonly dayMelody: Array<number | null> = [
    659.25, 659.25, 659.25, null,
    659.25, 659.25, 659.25, null,
    659.25, 783.99, 523.25, 587.33,
    659.25, null, null, null,
    698.46, 698.46, 698.46, 698.46,
    698.46, 659.25, 659.25, 659.25,
    659.25, 587.33, 587.33, 659.25,
    587.33, null, 783.99, null,
  ];

  private readonly dayBass: Array<number | null> = [
    130.81, null, 196.0, null,
    130.81, null, 196.0, null,
    130.81, null, 196.0, null,
    130.81, null, 164.81, 196.0,
    174.61, null, 130.81, null,
    130.81, null, 196.0, null,
    146.83, null, 196.0, null,
    196.0, null, 196.0, null,
  ];

  // Mysterious Nighttime Music-Box / Nocturnal Winter Chimes (A minor / E7)
  private readonly nightMelody: Array<number | null> = [
    440.0, null, 523.25, 659.25,
    587.33, null, 523.25, null,
    493.88, null, 440.0, 392.0,
    329.63, null, null, null,
    440.0, null, 523.25, 698.46,
    659.25, null, 587.33, null,
    523.25, 493.88, 440.0, 392.0,
    329.63, null, 440.0, null,
  ];

  private readonly nightBass: Array<number | null> = [
    110.0, null, null, null,
    130.81, null, null, null,
    98.0, null, null, null,
    82.41, null, 123.47, null,
    110.0, null, null, null,
    146.83, null, null, null,
    130.81, null, 98.0, null,
    82.41, null, 110.0, null,
  ];

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(AUDIO_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AudioSettings>;
        if (typeof parsed.muted === 'boolean') this.muted = parsed.muted;
        if (typeof parsed.musicVolume === 'number') {
          this.musicVolume = Math.max(0, Math.min(1, parsed.musicVolume));
        }
        if (typeof parsed.sfxVolume === 'number') {
          this.sfxVolume = Math.max(0, Math.min(1, parsed.sfxVolume));
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  private saveSettings(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        AUDIO_STORAGE_KEY,
        JSON.stringify({
          muted: this.muted,
          musicVolume: this.musicVolume,
          sfxVolume: this.sfxVolume,
        }),
      );
    } catch {
      // Ignore storage errors
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.75;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.28 * this.musicVolume;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.65 * this.sfxVolume;
      this.sfxGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public getSettings(): AudioSettings {
    return {
      muted: this.muted,
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
    };
  }

  public updateSettings(partial: Partial<AudioSettings>): AudioSettings {
    if (typeof partial.muted === 'boolean') this.muted = partial.muted;
    if (typeof partial.musicVolume === 'number') {
      this.musicVolume = Math.max(0, Math.min(1, partial.musicVolume));
    }
    if (typeof partial.sfxVolume === 'number') {
      this.sfxVolume = Math.max(0, Math.min(1, partial.sfxVolume));
    }
    if (this.ctx) {
      const t = this.ctx.currentTime;
      this.masterGain?.gain.setTargetAtTime(this.muted ? 0 : 0.75, t, 0.03);
      this.musicGain?.gain.setTargetAtTime(0.28 * this.musicVolume, t, 0.03);
      this.sfxGain?.gain.setTargetAtTime(0.65 * this.sfxVolume, t, 0.03);
    }
    this.saveSettings();
    return this.getSettings();
  }

  public setMuted(muted: boolean): void {
    this.updateSettings({ muted });
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMusicPhase(phase: DayNightPhase): void {
    if (this.musicMode === phase) return;
    this.musicMode = phase;
    if (this.musicPlaying) {
      this.restartMusicLoop();
    }
  }

  private restartMusicLoop(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    const stepMs = this.musicMode === 'night' ? 310 : 225;
    this.timerId = window.setInterval(() => {
      if (!this.musicPlaying || this.muted || this.musicVolume <= 0.01) return;
      if (!this.ctx || this.ctx.state !== 'running') return;
      this.playMusicStep();
    }, stepMs);
  }

  public startMusic(phase?: DayNightPhase): void {
    if (phase) this.musicMode = phase;
    if (this.musicPlaying) return;
    this.musicPlaying = true;
    this.restartMusicLoop();
  }

  public stopMusic(): void {
    this.musicPlaying = false;
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private playMusicStep(): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;
    const now = ctx.currentTime;
    const isNight = this.musicMode === 'night';
    const melody = isNight ? this.nightMelody : this.dayMelody;
    const bass = isNight ? this.nightBass : this.dayBass;
    const idx = this.stepIndex % melody.length;
    this.stepIndex++;

    const melFreq = melody[idx];
    if (melFreq) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = isNight ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(melFreq, now);
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(isNight ? 0.16 : 0.2, now + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, now + (isNight ? 0.36 : 0.24));
      osc.connect(g);
      g.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + (isNight ? 0.38 : 0.25));

      const bell = ctx.createOscillator();
      const bg = ctx.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(melFreq * 2, now);
      bg.gain.setValueAtTime(0.001, now);
      bg.gain.linearRampToValueAtTime(isNight ? 0.08 : 0.06, now + 0.01);
      bg.gain.exponentialRampToValueAtTime(0.001, now + (isNight ? 0.28 : 0.16));
      bell.connect(bg);
      bg.connect(this.musicGain);
      bell.start(now);
      bell.stop(now + (isNight ? 0.3 : 0.17));
    }

    const bassFreq = bass[idx];
    if (bassFreq) {
      const bassOsc = ctx.createOscillator();
      const bg = ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(bassFreq, now);
      bg.gain.setValueAtTime(0.001, now);
      bg.gain.linearRampToValueAtTime(isNight ? 0.22 : 0.24, now + 0.02);
      bg.gain.exponentialRampToValueAtTime(0.001, now + (isNight ? 0.45 : 0.28));
      bassOsc.connect(bg);
      bg.connect(this.musicGain);
      bassOsc.start(now);
      bassOsc.stop(now + (isNight ? 0.46 : 0.3));
    }
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay = 0,
    slideToFreq?: number,
  ): void {
    if (this.muted || this.sfxVolume <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideToFreq) {
      osc.frequency.exponentialRampToValueAtTime(slideToFreq, t + duration);
    }
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  public playPresent(): void {
    const jitter = 0.96 + Math.random() * 0.08;
    this.playTone(523.25 * jitter, 0.12, 'triangle', 0.35, 0);
    this.playTone(659.25 * jitter, 0.14, 'triangle', 0.35, 0.06);
    this.playTone(783.99 * jitter, 0.2, 'sine', 0.3, 0.12);
  }

  public playDeliver(): void {
    this.playTone(523.25, 0.15, 'triangle', 0.4, 0);
    this.playTone(659.25, 0.15, 'triangle', 0.4, 0.07);
    this.playTone(783.99, 0.18, 'triangle', 0.4, 0.14);
    this.playTone(1046.5, 0.32, 'sine', 0.38, 0.21);
  }

  public playCookie(): void {
    const jitter = 0.94 + Math.random() * 0.12;
    this.playTone(587.33 * jitter, 0.1, 'sine', 0.32, 0);
    this.playTone(880.0 * jitter, 0.18, 'triangle', 0.28, 0.05);
  }

  public playHealTick(): void {
    this.playTone(783.99, 0.1, 'sine', 0.14, 0);
    this.playTone(1046.5, 0.14, 'sine', 0.12, 0.05);
  }

  public playFakeCookie(): void {
    this.playTone(680, 0.22, 'sawtooth', 0.22, 0, 210);
    this.playTone(320, 0.24, 'triangle', 0.3, 0.12, 520);
    this.playTone(460, 0.28, 'sawtooth', 0.18, 0.24, 160);
  }

  public playKey(): void {
    this.playTone(1046.5, 0.1, 'sine', 0.35, 0);
    this.playTone(1318.5, 0.18, 'sine', 0.35, 0.06);
  }

  public playGateOpen(): void {
    this.playTone(392.0, 0.14, 'triangle', 0.35, 0);
    this.playTone(523.25, 0.16, 'triangle', 0.35, 0.08);
    this.playTone(783.99, 0.26, 'sine', 0.38, 0.16);
  }

  public playStar(): void {
    this.playTone(783.99, 0.11, 'sine', 0.32, 0);
    this.playTone(987.77, 0.11, 'sine', 0.32, 0.06);
    this.playTone(1174.66, 0.14, 'sine', 0.34, 0.12);
    this.playTone(1567.98, 0.26, 'triangle', 0.3, 0.18);
  }

  public playGoldenCookie(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.28, 'triangle', 0.34, idx * 0.07);
    });
  }

  public playPortalUnlock(): void {
    this.playTone(440, 0.2, 'sine', 0.3, 0);
    this.playTone(554.37, 0.22, 'sine', 0.3, 0.08);
    this.playTone(659.25, 0.25, 'sine', 0.32, 0.16);
    this.playTone(880, 0.45, 'triangle', 0.36, 0.24);
  }

  public playEnemyDetect(): void {
    this.playTone(480, 0.09, 'triangle', 0.26, 0, 760);
    this.playTone(880, 0.12, 'sine', 0.22, 0.07);
  }

  public playHazardHit(): void {
    this.playTone(220, 0.18, 'sawtooth', 0.28, 0, 95);
    this.playTone(150, 0.22, 'square', 0.16, 0.05, 80);
  }

  public playGameOver(): void {
    this.playTone(392.0, 0.24, 'triangle', 0.34, 0);
    this.playTone(349.23, 0.24, 'triangle', 0.34, 0.2);
    this.playTone(311.13, 0.26, 'triangle', 0.34, 0.4);
    this.playTone(261.63, 0.55, 'sawtooth', 0.22, 0.62, 196);
  }

  public playVictory(): void {
    const fanfare = [
      { f: 523.25, d: 0.16, t: 0 },
      { f: 659.25, d: 0.16, t: 0.12 },
      { f: 783.99, d: 0.16, t: 0.24 },
      { f: 1046.5, d: 0.32, t: 0.36 },
      { f: 783.99, d: 0.14, t: 0.6 },
      { f: 1046.5, d: 0.55, t: 0.74 },
    ];
    for (const n of fanfare) {
      this.playTone(n.f, n.d, 'triangle', 0.38, n.t);
      this.playTone(n.f * 1.5, n.d * 0.8, 'sine', 0.18, n.t);
    }
  }
}

export const audioEngine = new ChristmasAudioEngine();
