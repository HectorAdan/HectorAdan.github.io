import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const dir = await mkdtemp(join(tmpdir(), 'introduction-voice-check-'));
const names = ['introductionVoice', 'talkingMotion', 'neuralGeometry'];
const urls = Object.fromEntries(names.map(name => [name, pathToFileURL(join(dir, `${name}.mjs`)).href]));
const contexts = [];
class FakeContext {
  currentTime = 0; state = 'suspended'; sources = []; gain = null;
  constructor() { contexts.push(this); }
  createGain() { return this.gain = { gain: { value: 1 }, connect() {} }; }
  resume() { this.state = 'running'; return Promise.resolve(); }
  close() { this.state = 'closed'; return Promise.resolve(); }
  decodeAudioData() {
    const channel = new Float32Array(16000);
    for (let i = 1000; i < 15000; i++) channel[i] = Math.sin(i * .13) * .12;
    return Promise.resolve({ duration: 2, numberOfChannels: 1, sampleRate: 8000, getChannelData: () => channel });
  }
  createBufferSource() {
    const source = { buffer: null, stopped: false, onended: null, connect() {}, disconnect() {}, start(time, offset) { this.startTime = time; this.offset = offset; }, stop() { this.stopped = true; } };
    this.sources.push(source); return source;
  }
}
globalThis.window = { AudioContext: FakeContext };
let requests = 0;
globalThis.fetch = async () => { requests++; return { ok: true, arrayBuffer: async () => new ArrayBuffer(1) }; };
let voice;
try {
  for (const name of names) {
    const path = name === 'introductionVoice' ? 'src/utils/introductionVoice.ts' : name === 'talkingMotion' ? 'src/components/avatar/talkingMotion.ts' : 'src/components/canvas/neuralGeometry.ts';
    let source = await readFile(path, 'utf8');
    source = source.replace("'../components/avatar/talkingMotion'", `'${urls.talkingMotion}'`).replace("'../canvas/neuralGeometry'", `'${urls.neuralGeometry}'`)
      .replaceAll("'three'", `'${pathToFileURL(resolve('node_modules/three/build/three.module.js')).href}'`);
    await writeFile(join(dir, `${name}.mjs`), ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
  }
  const { IntroductionVoice } = await import(urls.introductionVoice);
  voice = new IntroductionVoice('/portfolio/audio/hector-introduction.mp3');
  const states = [], unsubscribe = voice.subscribe(status => states.push(status));
  voice.setFaceReady(true);
  const first = voice.start(4.6);
  assert.equal(contexts[0].state, 'running', 'Audio context must unlock synchronously within the gesture');
  await first;
  const context = contexts[0];
  assert.equal(voice.status, 'waiting'); assert.equal(context.sources.length, 1);
  assert.ok(Math.abs(context.sources[0].startTime - 4.6) < .1, 'Voice must wait for face assembly');
  context.currentTime = 2;
  voice.pause(); assert.equal(voice.status, 'paused'); assert.equal(voice.time, 0);
  const pausedWaitingSource = context.sources[0];
  await voice.resume();
  assert.equal(pausedWaitingSource.stopped, true); assert.equal(voice.status, 'waiting');
  assert.ok(Math.abs(context.sources[1].startTime - 4.6) < .1, 'Pause must preserve remaining assembly delay');
  voice.stop(); assert.equal(voice.status, 'idle'); assert.ok(context.sources.every(source => source.stopped));

  await voice.start(0);
  assert.equal(requests, 1, 'Decoded MP3 and analysis must be reused on replay');
  assert.equal(voice.status, 'playing');
  const startTime = context.currentTime; context.currentTime = startTime + .7;
  const pose = { weights: {}, head: [0, 0, 0] };
  voice.sample(false, pose); assert.ok(pose.weights.jawOpen > .4, 'Jaw follows the exact audio clock');
  voice.pause(); const pausedTime = voice.time; const snapshot = JSON.stringify(pose);
  let subscribedStatus;
  const detachSnapshot = voice.subscribe(status => { subscribedStatus = status; });
  assert.equal(subscribedStatus, 'paused', 'A remounted control must receive the current playback status immediately');
  detachSnapshot();
  context.currentTime += 5; voice.sample(false, pose);
  assert.equal(voice.time, pausedTime); assert.equal(JSON.stringify(pose), snapshot, 'Pausing freezes facial motion and audio position');
  await voice.resume(); assert.equal(context.sources.at(-1).offset, pausedTime);
  voice.sample(true, pose); assert.ok(pose.weights.jawOpen > .4); assert.equal(pose.weights.eyeBlinkLeft, 0); assert.deepEqual(pose.head, [0, 0, 0]);
  voice.setMuted(true); assert.equal(context.gain.gain.value, 0);
  voice.setMuted(false); assert.equal(context.gain.gain.value, 1);
  context.sources.at(-1).onended(); assert.equal(voice.status, 'ended');
  voice.sample(false, pose); assert.equal(pose.weights.jawOpen, 0, 'Mouth must close when speech ends');

  voice.setFaceReady(false); await voice.start(0);
  assert.equal(voice.status, 'waiting'); const count = context.sources.length;
  voice.setFaceReady(true); assert.equal(voice.status, 'playing'); assert.equal(context.sources.length, count + 1);
  voice.stop(); unsubscribe(); voice.dispose();

  let resolveFetch;
  globalThis.fetch = () => new Promise(resolve => { resolveFetch = resolve; });
  voice = new IntroductionVoice('/audio/hector-introduction.mp3'); voice.setFaceReady(true);
  const pending = voice.start(0); const nextContext = contexts.at(-1);
  voice.stop(); resolveFetch({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }); await pending;
  assert.equal(voice.status, 'idle'); assert.equal(nextContext.sources.length, 0, 'Closing during loading must never start a late voice');
  await voice.start(0); const obsolete = nextContext.sources.at(-1);
  await voice.start(0); assert.equal(obsolete.stopped, true);
  voice.stop(); assert.ok(nextContext.sources.every(source => source.stopped), 'Replay/close cannot leave overlapping voices'); voice.dispose();

  globalThis.fetch = async () => ({ ok: false });
  voice = new IntroductionVoice('/audio/hector-introduction.mp3'); voice.setFaceReady(true);
  await voice.start(0); assert.equal(voice.status, 'error');
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) });
  await voice.start(0); assert.equal(voice.status, 'playing', 'Failed downloads can be retried');
  voice.stop(); voice.dispose();
  const mp3 = await readFile('public/audio/hector-introduction.mp3'); assert.ok(mp3.length > 1000);
  console.log('Introduction voice: gesture unlock, assembly delay, pause/resume, exact morph clock, mute, reduced motion, replay, end, loading cancellation and retry passed.');
} finally { voice?.dispose(); await rm(dir, { recursive: true, force: true }); }
