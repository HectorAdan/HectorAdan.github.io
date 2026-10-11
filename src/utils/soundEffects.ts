// Procedural interface audio: no downloads, dependencies, or continuous background loop.
type Cue = 'hover' | 'click' | 'close' | 'navigation' | 'activate';
type Voice = {
  type?: OscillatorType;
  frequency: number;
  endFrequency?: number;
  duration: number;
  level: number;
  delay?: number;
  pan?: number;
  endPan?: number;
  cutoff?: number;
  peakFrequency?: number;
  filterType?: BiquadFilterType;
  attack?: number;
  swell?: boolean;
};

export class SoundManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bus: GainNode | null = null;
  private echo: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private voices = new Set<AudioScheduledSourceNode>();
  private lastCue = new Map<Cue, number>();
  private isMuted = false;
  private readonly cooldowns: Record<Cue, number> = { hover: 0.18, click: 0.09, close: 0.18, navigation: 0.32, activate: 2 };

  constructor() {
    try {
      this.isMuted = localStorage.getItem('hector_audio_enabled') === 'false';
    } catch { /* Restricted storage should not prevent the portfolio from opening. */ }
  }

  private savePreference() {
    try { localStorage.setItem('hector_audio_enabled', (!this.isMuted).toString()); }
    catch { /* Audio remains usable without persisting its preference. */ }
  }

  public initCtx() {
    try {
      if (!this.ctx && typeof window !== 'undefined') {
        const Context = window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Context) return;
        const ctx = new Context();
        this.ctx = ctx;
        this.bus = ctx.createGain();
        this.master = ctx.createGain();
        this.master.gain.value = this.isMuted ? 0 : 0.6;
        const limiter = ctx.createDynamicsCompressor();
        limiter.threshold.value = -18;
        limiter.knee.value = 12;
        limiter.ratio.value = 5;
        limiter.attack.value = 0.003;
        limiter.release.value = 0.12;
        this.bus.connect(limiter);
        limiter.connect(this.master);
        this.master.connect(ctx.destination);

        // A short, diffuse space keeps the neural textures soft, without rhythmic echoes.
        this.echo = ctx.createGain();
        this.echo.gain.value = 0.18;
        const space = ctx.createConvolver();
        const air = ctx.createBiquadFilter();
        const impulse = ctx.createBuffer(2, Math.ceil(ctx.sampleRate * 0.42), ctx.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
          const samples = impulse.getChannelData(channel);
          let smoothed = 0;
          for (let index = 0; index < samples.length; index++) {
            smoothed = smoothed * 0.7 + (Math.random() * 2 - 1) * 0.3;
            const progress = index / samples.length;
            samples[index] = smoothed * Math.min(1, progress / 0.035) * Math.pow(1 - progress, 3);
          }
        }
        space.buffer = impulse;
        air.type = 'lowpass';
        air.frequency.value = 1800;
        this.echo.connect(space);
        space.connect(air);
        air.connect(this.bus);
        this.noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 1.6), ctx.sampleRate);
        const samples = this.noise.getChannelData(0);
        for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;
      }
      if (this.ctx?.state === 'suspended') void this.ctx.resume().catch(() => {});
    } catch { /* Audio support or autoplay restrictions must never interrupt navigation. */ }
  }

  public getMuted(): boolean { return this.isMuted; }

  public setMuted(muted: boolean, feedback = true) {
    this.isMuted = muted;
    this.savePreference();
    if (muted && this.ctx && this.master) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(0, now, 0.004);
      for (const source of this.voices) {
        try { source.stop(now + 0.02); } catch { /* Already ended. */ }
      }
      this.lastCue.clear();
    } else if (!muted) {
      this.initCtx();
      if (this.ctx && this.master) {
        this.master.gain.cancelScheduledValues(this.ctx.currentTime);
        this.master.gain.setTargetAtTime(0.6, this.ctx.currentTime, 0.008);
      }
      if (feedback) this.playNeuralClick();
    }
  }

  private begin(cue: Cue): number | null {
    if (this.isMuted || (typeof document !== 'undefined' && document.hidden)) return null;
    this.initCtx();
    if (!this.ctx || !this.bus || !this.echo || !this.noise || this.ctx.state === 'closed') return null;
    const now = this.ctx.currentTime;
    if (now - (this.lastCue.get(cue) ?? -Infinity) < this.cooldowns[cue]) return null;
    this.lastCue.set(cue, now);
    return now + 0.006;
  }

  private connectVoice(source: AudioScheduledSourceNode, start: number, options: Voice, noise = false) {
    const ctx = this.ctx!;
    const end = start + options.duration;
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner();
    filter.type = options.filterType ?? (noise ? 'bandpass' : 'lowpass');
    filter.Q.value = noise ? 0.85 : 0.7;
    filter.frequency.setValueAtTime(options.cutoff ?? 3600, start);
    const attack = options.attack ?? 0.003;
    if (noise) {
      if (options.peakFrequency) filter.frequency.exponentialRampToValueAtTime(options.peakFrequency, start + attack);
      filter.frequency.exponentialRampToValueAtTime(options.endFrequency ?? 650, end);
    }
    pan.pan.value = options.pan ?? 0;
    if (options.endPan !== undefined) pan.pan.linearRampToValueAtTime(options.endPan, end);
    gain.gain.setValueAtTime(0, start);
    if (options.swell) {
      const envelope = Float32Array.from({ length: 64 }, (_, index) => options.level * Math.pow(index / 63, 2));
      gain.gain.setValueCurveAtTime(envelope, start, attack);
      gain.gain.setValueAtTime(options.level, start + attack);
    } else {
      gain.gain.linearRampToValueAtTime(options.level, start + attack);
    }
    gain.gain.exponentialRampToValueAtTime(0.0001, end - 0.004);
    gain.gain.linearRampToValueAtTime(0, end);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(pan);
    pan.connect(this.bus!);
    pan.connect(this.echo!);
    source.onended = () => {
      this.voices.delete(source);
      source.disconnect(); filter.disconnect(); gain.disconnect(); pan.disconnect();
    };
    // Bound the number of active and scheduled voices during rapid interactions.
    if (this.voices.size >= 32) {
      const oldest = this.voices.values().next().value;
      try { oldest?.stop(); } catch { /* Already ended. */ }
      if (oldest) this.voices.delete(oldest);
    }
    this.voices.add(source);
    source.start(start);
    source.stop(end);
  }

  private tone(now: number, options: Voice) {
    const start = now + (options.delay ?? 0);
    const oscillator = this.ctx!.createOscillator();
    oscillator.type = options.type ?? 'sine';
    oscillator.frequency.setValueAtTime(options.frequency, start);
    if (options.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, start + options.duration);
    this.connectVoice(oscillator, start, options);
  }

  private burst(now: number, options: Voice) {
    const source = this.ctx!.createBufferSource();
    source.buffer = this.noise;
    this.connectVoice(source, now + (options.delay ?? 0), options, true);
  }

  public playHover() {
    // Hover cannot unlock audio; avoid queuing sounds before the first user gesture.
    if (this.ctx?.state !== 'running') return;
    const now = this.begin('hover');
    if (now === null) return;
    // A barely audible synaptic texture, rather than a pitched notification.
    this.burst(now, { frequency: 1600, cutoff: 1600, endFrequency: 1450, duration: 0.085, attack: 0.018, level: 0.022, pan: -0.08, endPan: 0.08 });
  }

  public playNeuralClick() {
    const now = this.begin('click');
    if (now === null) return;
    this.burst(now, { frequency: 2100, cutoff: 2100, endFrequency: 1800, duration: 0.09, attack: 0.006, level: 0.06 });
    this.burst(now, { frequency: 780, cutoff: 780, endFrequency: 730, duration: 0.15, attack: 0.02, level: 0.035, pan: 0.1 });
    this.tone(now, { frequency: 178, endFrequency: 175, duration: 0.16, attack: 0.012, level: 0.022, cutoff: 450 });
  }

  public playNavigationWarp() {
    const now = this.begin('navigation');
    if (now === null) return;
    // A field opening: gentle resonance and air drifting across the stereo image.
    this.tone(now, { frequency: 88, endFrequency: 72, duration: 0.65, level: 0.05, attack: 0.11, cutoff: 300 });
    this.burst(now, { frequency: 690, cutoff: 690, peakFrequency: 1350, endFrequency: 580, duration: 0.55, level: 0.065, attack: 0.18, swell: true, pan: -0.28, endPan: 0.28 });
    this.burst(now, { frequency: 2600, cutoff: 2600, endFrequency: 2350, delay: 0.07, duration: 0.43, level: 0.022, attack: 0.07, pan: 0.18, endPan: -0.12 });
    this.tone(now, { frequency: 334, endFrequency: 337, duration: 0.45, delay: 0.035, level: 0.006, attack: 0.09, pan: 0.12 });
  }

  public playClose() {
    const now = this.begin('close');
    if (now === null) return;
    // A brief inward sweep, resolving into a quiet low-frequency fade.
    this.burst(now, { frequency: 1550, cutoff: 1550, endFrequency: 360, duration: 0.28, level: 0.047, attack: 0.022, pan: -0.24, endPan: 0 });
    this.burst(now, { frequency: 950, cutoff: 950, endFrequency: 300, duration: 0.24, delay: 0.025, level: 0.025, attack: 0.018, pan: 0.24, endPan: 0 });
    this.tone(now, { frequency: 96, endFrequency: 55, duration: 0.34, level: 0.045, attack: 0.025, cutoff: 240 });
  }

  public playAvatarActivate() {
    const now = this.begin('activate');
    if (now === null) return;
    // Descend into the core: dark resonance, a muted pressure wave, then deep stillness.
    this.tone(now, { frequency: 136, endFrequency: 43, duration: 1.45, level: 0.085, attack: 0.28, swell: true, cutoff: 220 });
    this.tone(now, { frequency: 52, endFrequency: 32, duration: 1.75, level: 0.075, attack: 0.33, swell: true, cutoff: 120 });
    // Quiet upper harmonics retain some body on smaller speakers.
    this.tone(now, { type: 'triangle', frequency: 76, endFrequency: 38, duration: 1.65, delay: 0.08, level: 0.024, attack: 0.38, swell: true, cutoff: 190, pan: -0.08, endPan: 0 });
    this.tone(now, { frequency: 138, endFrequency: 69, duration: 1.4, delay: 0.13, level: 0.026, attack: 0.3, swell: true, cutoff: 240, pan: 0.08, endPan: 0 });
    this.burst(now, { frequency: 560, cutoff: 560, peakFrequency: 900, endFrequency: 180, filterType: 'lowpass', duration: 1.35, level: 0.045, attack: 0.28, swell: true, pan: -0.2, endPan: 0 });
    this.burst(now, { frequency: 850, cutoff: 850, endFrequency: 320, duration: 0.75, delay: 0.04, level: 0.018, attack: 0.16, pan: 0.2, endPan: 0 });
  }
}

export const soundManager = new SoundManager();
