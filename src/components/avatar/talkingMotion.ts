import { seededRandom } from '../canvas/neuralGeometry';

export interface CaptionCue { start: number; end: number; text: string }
export interface SpeechTrack { duration: number; frameRate: number; jaw: Float32Array }
export interface RecordedMotionFrame { time: number; weights: Record<string, number>; head?: [number, number, number] }
export interface MotionPose { weights: Record<string, number>; head: [number, number, number] }

// Hector supplied this transcript. Sentence boundaries were estimated from the
// private recording's measured silence intervals, not from speech recognition.
export const INTRO_CAPTIONS: CaptionCue[] = [
  { start: 1.28, end: 3.99, text: 'Hey, my name is Hector.' },
  { start: 4.44, end: 7.15, text: "I'm a software engineer." },
  { start: 7.49, end: 10.45, text: 'I love building awesome and intuitive digital experiences.' },
  { start: 10.94, end: 12.3, text: 'Welcome to my world.' },
  { start: 12.69, end: 15.3, text: 'Here you can explore my projects,' },
  { start: 15.59, end: 17.6, text: 'learn a little bit about myself,' },
  { start: 17.9, end: 20.85, text: "and discover why I'm passionate about building things." },
  { start: 21.84, end: 23.0, text: 'Welcome to my world.' },
  { start: 23.15, end: 26.13, text: 'Explore it, let me know if you need anything.' },
  { start: 26.37, end: 27.65, text: "I'll be around here." },
];

export function analyzeSpeech(channels: readonly Float32Array[], sampleRate: number): SpeechTrack {
  if (!channels.length || sampleRate <= 0 || !channels[0].length) throw new Error('The recording has no audio samples.');
  const frameRate = 50, duration = channels[0].length / sampleRate;
  const count = Math.ceil(duration * frameRate), rms = new Float32Array(count), jaw = new Float32Array(count);
  for (let frame = 0; frame < count; frame++) {
    const start = Math.floor(frame / frameRate * sampleRate), end = Math.min(channels[0].length, Math.floor((frame + 1) / frameRate * sampleRate));
    let sum = 0;
    for (const channel of channels) for (let i = start; i < end; i++) sum += channel[i] * channel[i];
    rms[frame] = Math.sqrt(sum / Math.max(1, (end - start) * channels.length));
  }
  const sorted = Array.from(rms).sort((a, b) => a - b);
  const peak = sorted[Math.floor((count - 1) * .95)];
  const floor = Math.min(peak * .25, sorted[Math.floor((count - 1) * .12)] * 2.4 + .001);
  let value = 0;
  for (let frame = 0; frame < count; frame++) {
    const normalized = Math.max(0, Math.min(1, (rms[frame] - floor) / Math.max(.005, peak - floor)));
    const target = Math.pow(normalized, .75) * .8;
    const tau = target > value ? .035 : .085;
    value += (target - value) * (1 - Math.exp(-1 / frameRate / tau));
    jaw[frame] = value;
  }
  return { duration, frameRate, jaw };
}

export function jawAtTime(track: SpeechTrack, time: number) {
  if (time <= 0 || time >= track.duration) return 0;
  const frame = time * track.frameRate, a = Math.min(track.jaw.length - 1, Math.floor(frame)), b = Math.min(track.jaw.length - 1, a + 1);
  return track.jaw[a] + (track.jaw[b] - track.jaw[a]) * (frame - a);
}

export function blinkSchedule(duration: number) {
  const random = seededRandom(413), events: number[] = [];
  for (let t = 2.2 + random(); t < duration - .4; t += 3.2 + random() * 2.5) events.push(t);
  return events;
}

function blinkWeight(time: number, events: readonly number[]) {
  for (const start of events) {
    const t = time - start;
    if (t < 0 || t > .22) continue;
    // Quick closing, a brief hold, and a gentler reopening.
    if (t < .065) return Math.sin(t / .065 * Math.PI / 2) ** 2;
    if (t < .095) return 1;
    return Math.cos((t - .095) / .125 * Math.PI / 2) ** 2;
  }
  return 0;
}

export function speechPose(track: SpeechTrack, time: number, events: readonly number[], reducedMotion: boolean, output: MotionPose) {
  output.weights.jawOpen = jawAtTime(track, time);
  output.weights.eyeBlinkLeft = reducedMotion ? 0 : blinkWeight(time, events);
  output.weights.eyeBlinkRight = reducedMotion ? 0 : blinkWeight(time - .012, events);
  const ramp = Math.min(1, Math.max(0, time * .7)) * Math.min(1, Math.max(0, (track.duration - time) * .7));
  output.head[0] = reducedMotion ? 0 : Math.sin(time * .53) * .015 * ramp;
  output.head[1] = reducedMotion ? 0 : Math.sin(time * .31) * .028 * ramp;
  output.head[2] = reducedMotion ? 0 : Math.sin(time * .27) * .006 * ramp;
}

// An adapter boundary for later, locally extracted MediaPipe blendshape tracks.
export function recordedPose(frames: readonly RecordedMotionFrame[], time: number, output: MotionPose) {
  if (!frames.length) return;
  let low = 0, high = frames.length - 1;
  while (low < high) { const mid = Math.ceil((low + high) / 2); if (frames[mid].time <= time) low = mid; else high = mid - 1; }
  const a = frames[low], b = frames[Math.min(low + 1, frames.length - 1)];
  const mix = Math.max(0, Math.min(1, (time - a.time) / Math.max(.0001, b.time - a.time)));
  for (const name of new Set([...Object.keys(output.weights), ...Object.keys(a.weights), ...Object.keys(b.weights)])) {
    output.weights[name] = Math.max(0, Math.min(1, (a.weights[name] ?? 0) * (1 - mix) + (b.weights[name] ?? 0) * mix));
  }
  for (let i = 0; i < 3; i++) output.head[i] = (a.head?.[i] ?? 0) * (1 - mix) + (b.head?.[i] ?? 0) * mix;
}

export function captionAtTime(cues: readonly CaptionCue[], time: number) {
  return cues.find(cue => time >= cue.start && time < cue.end)?.text ?? '';
}

export function parseCaptions(vtt: string): CaptionCue[] {
  const seconds = (value: string) => value.split(':').reduce((total, part) => total * 60 + Number(part), 0);
  const cues: CaptionCue[] = [];
  for (const block of vtt.replace(/\r/g, '').split(/\n\s*\n/)) {
    const lines = block.split('\n'), index = lines.findIndex(line => line.includes('-->'));
    if (index < 0) continue;
    const match = lines[index].match(/([\d:.]+)\s+-->\s+([\d:.]+)/);
    if (!match) continue;
    const start = seconds(match[1]), end = seconds(match[2]), text = lines.slice(index + 1).join(' ').replace(/<[^>]*>/g, '').trim();
    if (Number.isFinite(start) && Number.isFinite(end) && start >= 0 && end > start && text) cues.push({ start, end, text });
  }
  if (!cues.length) throw new Error('No valid timed captions were found. Choose a WebVTT caption file.');
  return cues.sort((a, b) => a.start - b.start);
}
