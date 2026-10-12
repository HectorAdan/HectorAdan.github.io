import { analyzeSpeech, blinkSchedule, speechPose, type MotionPose, type SpeechTrack } from '../components/avatar/talkingMotion';

export type VoiceStatus = 'idle' | 'loading' | 'waiting' | 'playing' | 'paused' | 'ended' | 'error';

/** One local audio buffer and clock shared by playback and the holographic morphs. */
export class IntroductionVoice {
  status: VoiceStatus = 'idle';
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private buffer: AudioBuffer | null = null;
  private loading: Promise<void> | null = null;
  private source: AudioBufferSourceNode | null = null;
  private track: SpeechTrack | null = null;
  private blinks: number[] = [];
  private listeners = new Set<(status: VoiceStatus) => void>();
  private run = 0;
  private active = false;
  private faceReady = false;
  private delay = 0;
  private deadline: number | null = null;
  private startTime = 0;
  private offset = 0;
  private remainingDelay = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private muted = false;

  constructor(private url: string) {}

  subscribe(listener: (status: VoiceStatus) => void) {
    this.listeners.add(listener);
    listener(this.status);
    return () => { this.listeners.delete(listener); };
  }

  private update(status: VoiceStatus) {
    this.status = status;
    this.listeners.forEach(listener => listener(status));
  }

  private init() {
    if (this.context) return this.context;
    const Context = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) throw new Error('Audio is unavailable');
    const context = new Context();
    this.context = context;
    this.gain = context.createGain();
    this.gain.gain.value = this.muted ? 0 : 1;
    this.gain.connect(context.destination);
    return context;
  }

  private load(context: AudioContext) {
    if (this.buffer) return Promise.resolve();
    if (this.loading) return this.loading;
    const promise = fetch(this.url).then(response => {
      if (!response.ok) throw new Error('Introduction audio unavailable');
      return response.arrayBuffer();
    }).then(bytes => context.decodeAudioData(bytes)).then(buffer => {
      if (context !== this.context) return;
      this.track = analyzeSpeech(Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i)), buffer.sampleRate);
      this.blinks = blinkSchedule(this.track.duration);
      this.buffer = buffer;
    }).finally(() => { if (this.loading === promise) this.loading = null; });
    this.loading = promise;
    return promise;
  }

  /** Called directly from a click: unlock Web Audio before fetching/decoding. */
  async start(delaySeconds = 0) {
    this.stop();
    this.active = true;
    this.delay = delaySeconds;
    this.deadline = this.faceReady ? performance.now() + delaySeconds * 1000 : null;
    const run = this.run;
    this.update('loading');
    try {
      const context = this.init();
      await Promise.all([context.resume(), this.load(context)]);
      if (run !== this.run || !this.active) return;
      if (context.state !== 'running') throw new Error('Playback requires a click');
      this.schedule();
    } catch {
      if (run === this.run && this.active) { this.active = false; this.update('error'); }
    }
  }

  setFaceReady(ready: boolean) {
    this.faceReady = ready;
    if (!ready || !this.active || this.status === 'paused') return;
    if (this.deadline === null) this.deadline = performance.now() + this.delay * 1000;
    if (this.buffer && this.status === 'waiting' && !this.source) this.schedule();
  }

  private schedule() {
    if (!this.active || !this.buffer || !this.context) return;
    this.clearTimer();
    if (!this.faceReady) {
      this.update('waiting');
      // A stalled model download must not indefinitely prevent the audio/text fallback.
      this.timer = setTimeout(() => {
        this.faceReady = true; this.deadline = performance.now(); this.schedule();
      }, 8000);
      return;
    }
    const wait = this.remainingDelay || Math.max(0, ((this.deadline ?? performance.now()) - performance.now()) / 1000);
    this.remainingDelay = 0;
    this.deadline = null;
    const source = this.context.createBufferSource();
    source.buffer = this.buffer;
    source.connect(this.gain!);
    this.startTime = this.context.currentTime + wait;
    const run = this.run;
    source.onended = () => {
      source.disconnect();
      if (run !== this.run || source !== this.source) return;
      this.source = null; this.active = false;
      this.offset = this.buffer?.duration ?? 0;
      this.clearTimer(); this.update('ended');
    };
    this.source = source;
    source.start(this.startTime, this.offset);
    this.update(wait > 0 ? 'waiting' : 'playing');
    if (wait > 0) this.timer = setTimeout(() => {
      if (run === this.run && this.active && this.source === source) this.update('playing');
    }, wait * 1000);
  }

  private clearTimer() {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }

  private stopSource() {
    this.clearTimer();
    if (!this.source) return;
    this.source.onended = null;
    try { this.source.stop(); } catch { /* A source can already have ended. */ }
    this.source.disconnect(); this.source = null;
  }

  pause() {
    if (!this.active || this.status === 'paused') return;
    if (this.context && this.source) {
      this.remainingDelay = Math.max(0, this.startTime - this.context.currentTime);
      this.offset = this.time;
    } else this.remainingDelay = Math.max(0, ((this.deadline ?? performance.now()) - performance.now()) / 1000);
    this.run++; this.stopSource(); this.update('paused');
  }

  async resume() {
    if (this.status !== 'paused') return;
    const run = this.run;
    this.update('loading');
    try {
      const context = this.init();
      await Promise.all([context.resume(), this.load(context)]);
      if (run !== this.run || !this.active) return;
      if (context.state !== 'running') throw new Error('Playback requires a click');
      this.schedule();
    } catch { if (run === this.run && this.active) { this.active = false; this.update('error'); } }
  }

  get time() {
    if (!this.source || !this.context) return this.offset;
    return Math.min(this.buffer?.duration ?? Infinity, this.offset + Math.max(0, this.context.currentTime - this.startTime));
  }

  sample(reducedMotion: boolean, output: MotionPose) {
    if (this.track && (this.status === 'playing' || this.status === 'paused')) {
      speechPose(this.track, this.time, this.blinks, reducedMotion, output);
    } else {
      output.weights.jawOpen = output.weights.eyeBlinkLeft = output.weights.eyeBlinkRight = 0;
      output.head.fill(0);
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.gain) this.gain.gain.value = muted ? 0 : 1;
  }

  stop() {
    this.run++; this.active = false; this.stopSource();
    this.offset = this.remainingDelay = 0; this.deadline = null;
    this.update('idle');
  }

  dispose() {
    this.stop();
    const context = this.context;
    this.context = null; this.gain = null; this.buffer = null; this.track = null; this.loading = null;
    if (context) void context.close().catch(() => {});
  }
}
