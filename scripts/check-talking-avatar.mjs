import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const dir = await mkdtemp(join(tmpdir(), 'talking-avatar-check-'));
const names = ['avatarSurface', 'sampleAvatar', 'morphChannels', 'talkingSurface', 'talkingMotion', 'localizedMorphs', 'neuralGeometry'];
const urls = Object.fromEntries(names.map(name => [name, pathToFileURL(join(dir, `${name}.mjs`)).href]));
try {
  for (const name of names) {
    let source = await readFile(name === 'neuralGeometry' ? 'src/components/canvas/neuralGeometry.ts' : `src/components/avatar/${name}.ts`, 'utf8');
    for (const module of names) source = source.replaceAll(`'./${module}'`, `'${urls[module]}'`).replaceAll(`'../canvas/${module}'`, `'${urls[module]}'`);
    source = source.replaceAll("'three'", `'${pathToFileURL(resolve('node_modules/three/build/three.module.js')).href}'`)
      .replace(/'three\/addons\/([^']+)'/g, (_, path) => `'${pathToFileURL(resolve('node_modules/three/examples/jsm', path)).href}'`);
    await writeFile(join(dir, `${name}.mjs`), ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
  }
  const { prepareTalkingSurface } = await import(urls.talkingSurface);
  const { sampleAvatar } = await import(urls.sampleAvatar);
  const { MORPH_CHANNELS } = await import(urls.morphChannels);
  const { analyzeSpeech, jawAtTime, blinkSchedule, speechPose, recordedPose, captionAtTime, parseCaptions, INTRO_CAPTIONS } = await import(urls.talkingMotion);
  const bytes = await readFile('public/models/hector-mediapipe-poc.glb');
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const original = prepareTalkingSurface(gltf.scene), surface = prepareTalkingSurface(gltf.scene, true);
  assert.deepEqual(surface.getAttribute('position').array, original.getAttribute('position').array, 'Localized corrections must preserve the neutral face');
  const jaw = surface.getAttribute('aJawDelta');
  assert.equal(Math.abs(jaw.getY(13)), 0); assert.equal(Math.abs(jaw.getY(1)), 0); assert.ok(jaw.getY(14) < -.01, 'Only the lower lip should open while the nose and upper lip remain still');
  for (const [upper, lower, channel] of [[159, 145, 'aBlinkLeftDelta'], [386, 374, 'aBlinkRightDelta']]) {
    const delta = surface.getAttribute(channel), base = surface.getAttribute('position');
    for (let axis = 0; axis < 3; axis++) assert.ok(Math.abs(base.array[upper * 3 + axis] + delta.array[upper * 3 + axis] - base.array[lower * 3 + axis] - delta.array[lower * 3 + axis]) < .00001, 'A full blink must close the actual eyelid boundary');
  }
  original.dispose();
  assert.equal(surface.getAttribute('position').count, 478);
  for (const channel of MORPH_CHANNELS) {
    const delta = surface.getAttribute(channel.position);
    assert.ok(Array.from(delta.array).some(value => Math.abs(value) > .00001), `${channel.name} must be nonzero`);
    assert.ok(Array.from(surface.getAttribute(channel.normal).array).every(Number.isFinite));
  }
  for (const compact of [false, true]) {
    const samples = sampleAvatar(surface, compact, true), bindings = samples.bindings;
    assert.ok(bindings, 'Animated samples require surface bindings');
    const weights = [.8, .35, .6];
    for (const [geometry, vertices, bary] of [[samples.points, bindings.pointVertices, bindings.pointWeights], [samples.pathways, bindings.pathVertices, bindings.pathWeights]]) {
      const points = geometry.getAttribute('position');
      assert.equal(vertices.length, points.count * 3); assert.equal(bary.length, vertices.length);
      for (let i = 0; i < points.count; i++) {
        const sum = bary[i * 3] + bary[i * 3 + 1] + bary[i * 3 + 2];
        assert.ok(Math.abs(sum - 1) < .00001, 'Barycentric weights must sum to one');
        for (let axis = 0; axis < 3; axis++) {
          let shader = points.array[i * 3 + axis], expected = 0;
          for (let channel = 0; channel < MORPH_CHANNELS.length; channel++) shader += geometry.getAttribute(MORPH_CHANNELS[channel].position).array[i * 3 + axis] * weights[channel];
          for (let corner = 0; corner < 3; corner++) {
            const vertex = vertices[i * 3 + corner];
            let posed = surface.getAttribute('position').array[vertex * 3 + axis];
            for (let channel = 0; channel < MORPH_CHANNELS.length; channel++) posed += surface.getAttribute(MORPH_CHANNELS[channel].position).array[vertex * 3 + axis] * weights[channel];
            expected += posed * bary[i * 3 + corner];
          }
          assert.ok(Number.isFinite(shader) && Math.abs(shader - expected) < .00001, 'Particles and line endpoints must follow the same deformed triangles as the source mesh');
        }
      }
    }
    samples.dispose();
    console.log(`${compact ? 'Compact' : 'Desktop'}: barycentric particle and pathway morph bindings valid`);
  }
  surface.dispose(); gltf.scene.traverse(object => { if (object.isMesh) { object.geometry.dispose(); object.material.dispose(); } });

  const sampleRate = 8000, silence = analyzeSpeech([new Float32Array(sampleRate * 2)], sampleRate);
  assert.ok(Array.from(silence.jaw).every(value => value === 0), 'Silence must never invent jaw motion');
  const signal = new Float32Array(sampleRate * 2);
  for (let i = sampleRate * .4; i < sampleRate * 1.2; i++) signal[i] = Math.sin(i * .21) * .1;
  const track = analyzeSpeech([signal], sampleRate);
  assert.equal(jawAtTime(track, .2), 0); assert.ok(jawAtTime(track, .8) > .5); assert.ok(jawAtTime(track, 1.9) < .001);
  assert.equal(jawAtTime(track, 0), 0); assert.equal(jawAtTime(track, track.duration), 0);
  const pose = { weights: {}, head: [0, 0, 0] }, events = blinkSchedule(28);
  speechPose(track, .8, events, true, pose);
  assert.ok(pose.weights.jawOpen > .5); assert.equal(pose.weights.eyeBlinkLeft, 0); assert.deepEqual(pose.head, [0, 0, 0]);
  const snapshot = JSON.stringify(pose); speechPose(track, .8, events, true, pose); assert.equal(JSON.stringify(pose), snapshot, 'A paused media clock must freeze the pose');
  recordedPose([{ time: 0, weights: { jawOpen: .2 }, head: [0, 0, 0] }, { time: 1, weights: { jawOpen: .8 }, head: [.02, .04, 0] }], .5, pose);
  assert.equal(pose.weights.jawOpen, .5); assert.equal(pose.head[1], .02);
  const cues = parseCaptions('WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nHello Hector.\n');
  assert.equal(captionAtTime(cues, 1.5), 'Hello Hector.'); assert.equal(captionAtTime(cues, 2), '');
  assert.throws(() => parseCaptions('not timed captions'), /No valid/);
  assert.ok(INTRO_CAPTIONS.every((cue, i) => cue.start >= 0 && cue.end > cue.start && cue.end <= 28.01 && (!i || cue.start >= INTRO_CAPTIONS[i - 1].end)));
  console.log('Audio-derived jaw, silence, deterministic pause/seek, reduced motion, recorded-motion adapter and timed captions: valid');
} finally { await rm(dir, { recursive: true, force: true }); }
