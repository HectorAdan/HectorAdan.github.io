import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const dir = await mkdtemp(join(tmpdir(), 'identity-check-'));
try {
  const source = await readFile('src/utils/identityIntroduction.ts', 'utf8');
  const file = join(dir, 'timing.mjs');
  await writeFile(file, ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
  const { identityFrame, identityLookTarget } = await import(pathToFileURL(file).href);
  const center = identityLookTarget(.32, .4, .32, .4);
  assert.equal(center.yaw, 0); assert.equal(Math.abs(center.pitch), 0);
  assert.deepEqual(identityLookTarget(-100, -100, 0, 0), { yaw: -.22, pitch: .14 });
  assert.deepEqual(identityLookTarget(100, 100, 0, 0), { yaw: .22, pitch: -.14 });
  assert.ok(identityLookTarget(.5, .5, 0, 0).yaw > 0 && identityLookTarget(.5, .5, 0, 0).pitch < 0, 'The face must turn toward the cursor');
  assert.deepEqual(identityFrame(0, true, true, false), {core: 1, face: 0, assembly: 1});
  assert.deepEqual(identityFrame(5, true, true, false), {core: 0, face: 1, assembly: 0});
  assert.deepEqual(identityFrame(0, true, true, true), {core: 0, face: 1, assembly: 0});
  for (const ready of [false, true]) assert.deepEqual(identityFrame(4, false, ready, false), {core: 1, face: 0, assembly: 1});
  assert.deepEqual(identityFrame(4, true, false, false), {core: 1, face: 0, assembly: 1});
  let previous = identityFrame(0, true, true, false);
  for (let t = .05; t < 5; t += .05) {
    const frame = identityFrame(t, true, true, false);
    for (const value of Object.values(frame)) assert.ok(Number.isFinite(value) && value >= 0 && value <= 1);
    assert.ok(frame.core <= previous.core && frame.face >= previous.face && frame.assembly <= previous.assembly);
    previous = frame;
  }
  const overlap = identityFrame(1.7, true, true, false);
  assert.ok(overlap.face > 0 && overlap.core > 0, 'Core and face must overlap during the handoff');
  const emergence = identityFrame(2.5, true, true, false);
  assert.ok(emergence.face > .6 && emergence.assembly > .5, 'The face must be visible while its structure is still assembling');

  const model = await readFile('public/models/hector-mediapipe-poc.glb');
  const document = JSON.parse(model.subarray(20, 20 + model.readUInt32LE(12)).toString());
  assert.equal(document.images?.length ?? 0, 0, 'Identity asset must not contain photograph textures');
  const gltf = await new GLTFLoader().parseAsync(model.buffer.slice(model.byteOffset, model.byteOffset + model.byteLength), '');
  let meshes = 0;
  gltf.scene.traverse(object => {
    if (!object.isMesh) return;
    meshes++;
    assert.equal(object.geometry.attributes.position.count, 478);
    assert.equal(object.geometry.index.count / 3, 852);
    assert.ok(Array.from(object.geometry.attributes.position.array).every(Number.isFinite));
    assert.ok(object.morphTargetInfluences.every(value => value === 0), 'Load in neutral pose');
    object.geometry.dispose(); object.material.dispose();
  });
  assert.equal(meshes, 1, 'This prototype must load only the facial surface');
  console.log('Identity handoff, closing/loading fallback, reduced motion and neutral untextured facial GLB: valid');
} finally { await rm(dir, { recursive: true, force: true }); }
