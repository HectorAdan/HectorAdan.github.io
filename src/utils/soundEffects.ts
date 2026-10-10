// Web Audio API Synthesizer - 100% self-contained procedural audio, zero external files required
class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false; // Default unmuted on interaction

  constructor() {
    const saved = localStorage.getItem('hector_audio_enabled');
    if (saved !== null) {
      this.isMuted = saved === 'false';
    } else {
      this.isMuted = false;
    }
  }

  public initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('hector_audio_enabled', (!muted).toString());
    if (!muted) {
      this.initCtx();
      this.playNeuralClick();
    }
  }

  public playNeuralClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // AudioContext policy safe fallback
    }
  }

  public playNavigationWarp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.25);
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.45);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(2400, this.ctx.currentTime + 0.2);
      filter.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.45);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch {
      // AudioContext policy safe fallback
    }
  }

  public playAvatarActivate() {
    // Unmute on explicit user interaction
    if (this.isMuted) {
      this.isMuted = false;
      localStorage.setItem('hector_audio_enabled', 'true');
    }
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Warm Sub-Bass Whoosh Sweep
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(90, now);
      subOsc.frequency.exponentialRampToValueAtTime(180, now + 0.35);
      subOsc.frequency.exponentialRampToValueAtTime(60, now + 0.9);

      subGain.gain.setValueAtTime(0.08, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.9);

      // 2. Rising Cyber Crystal Harmonic Chimes (E major arpeggio)
      const freqs = [329.63, 415.30, 493.88, 659.25, 830.61, 987.77, 1318.51];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(freq * 1.5, now + idx * 0.09);
        filter.Q.setValueAtTime(4.0, now + idx * 0.09);

        gain.gain.setValueAtTime(0.001, now + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.07, now + idx * 0.09 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + idx * 0.09 + 0.65);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.65);
      });
    } catch {
      // AudioContext safe fallback
    }
  }
}

export const soundManager = new SoundManager();
