import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import * as THREE from 'three';

// Validate the source-independent geometry boundary without a browser or test dependency.
const temporary = await mkdtemp(join(tmpdir(), 'avatar-check-'));
const files = ['avatarSurface', 'sampleAvatar', 'neuralGeometry', 'morphChannels', 'particleContours'];
const urls = Object.fromEntries(files.map(name => [name, pathToFileURL(join(temporary, `${name}.mjs`)).href]));
try {
  for (const name of files) {
    const sourcePath = name === 'neuralGeometry' ? 'src/components/canvas/neuralGeometry.ts' : `src/components/avatar/${name}.ts`;
    let source = await readFile(resolve(sourcePath), 'utf8');
    source = source.replace("'../canvas/neuralGeometry'", `'${urls.neuralGeometry}'`)
      .replace("'./particleContours'", `'${urls.particleContours}'`)
      .replace("'./morphChannels'", `'${urls.morphChannels}'`)
      .replaceAll("'three'", `'${pathToFileURL(resolve('node_modules/three/build/three.module.js')).href}'`)
      .replace(/'three\/addons\/([^']+)'/g, (_, path) => `'${pathToFileURL(resolve('node_modules/three/examples/jsm', path)).href}'`);
    const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
    await writeFile(join(temporary, `${name}.mjs`), compiled);
  }
  const { createStudyBust, prepareAvatarSurface } = await import(urls.avatarSurface);
  const { sampleAvatar } = await import(urls.sampleAvatar);
  const surface = createStudyBust();
  const size = surface.boundingBox.getSize(new THREE.Vector3());
  assert.ok(Math.abs(size.y - 3.8) < .00001, 'Models must normalize to the same height');
  assert.ok(surface.boundingBox.getCenter(new THREE.Vector3()).length() < .00001, 'Models must be centered');
  assert.ok(size.z > 1, 'Bust must have physical depth');
  const allFinite = geometry => {
    for (const attribute of Object.values(geometry.attributes)) assert.ok(Array.from(attribute.array).every(Number.isFinite), 'All attributes must be finite');
  };
  allFinite(surface);
  for (const compact of [false, true]) {
    const first = sampleAvatar(surface, compact), second = sampleAvatar(surface, compact);
    assert.equal(first.particleCount, compact ? 4500 : 11000);
    assert.ok(first.connectionCount > 0 && first.connectionCount <= (compact ? 430 : 1000));
    allFinite(first.points); allFinite(first.pathways);
    assert.deepEqual(first.points.getAttribute('position').array, second.points.getAttribute('position').array, 'Samples must be deterministic');
    assert.deepEqual(first.pathways.getAttribute('position').array, second.pathways.getAttribute('position').array, 'Pathways must be deterministic');
    const normal = first.points.getAttribute('normal'), p = first.points.getAttribute('position');
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      assert.ok(surface.boundingBox.clone().expandByScalar(.00001).containsPoint(v.fromBufferAttribute(p, i)), 'Particles must remain within model bounds');
      assert.ok(Math.abs(v.fromBufferAttribute(normal, i).length() - 1) < .00001, 'Sampled normals must be normalized');
    }
    const edges = first.pathways.getAttribute('position'), degrees = new Map();
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    for (let i = 0; i < edges.count; i += 2) {
      a.fromBufferAttribute(edges, i); b.fromBufferAttribute(edges, i + 1);
      assert.ok(a.distanceTo(b) <= .23001 && a.distanceTo(b) > .04999, 'Connections must be sparse and local');
      for (const point of [a, b]) { const key = point.toArray().join(':'); degrees.set(key, (degrees.get(key) ?? 0) + 1); }
    }
    assert.ok([...degrees.values()].every(degree => degree <= 2), 'No particle can become a dense connection hub');
    console.log(`${compact ? 'Compact' : 'Desktop'}: ${first.particleCount} particles, ${first.connectionCount} connections — valid`);
    first.dispose(); second.dispose();
  }

  // Mixed indexed/non-indexed surfaces and baked nested transforms exercise the GLB boundary.
  const group = new THREE.Group(); group.position.set(5, -3, 9); group.scale.set(2, 3, 1.5);
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8)); sphere.scale.x = -1;
  const box = new THREE.Mesh(new THREE.BoxGeometry(.4, .5, .2).toNonIndexed()); box.position.y = -1.5;
  group.add(sphere, box);
  const prepared = prepareAvatarSurface(group); allFinite(prepared);
  assert.ok(Math.abs(prepared.boundingBox.getSize(new THREE.Vector3()).y - 3.8) < .00001);
  assert.ok(prepared.boundingBox.getCenter(new THREE.Vector3()).length() < .00001);
  assert.throws(() => prepareAvatarSurface(new THREE.Group()), /no visible mesh/);
  prepared.dispose(); sphere.geometry.dispose(); box.geometry.dispose(); sphere.material.dispose(); box.material.dispose();

  // A facial mask has no torso. Its lower features must not inherit the bust's
  // sampling bias toward the upper half of the normalized model.
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const model = await readFile('public/models/hector-mediapipe-poc.glb');
  const gltf = await new GLTFLoader().parseAsync(model.buffer.slice(model.byteOffset, model.byteOffset + model.byteLength), '');
  const facialSurface = prepareAvatarSurface(gltf.scene);
  for (const compact of [false, true]) {
    const facialSamples = sampleAvatar(facialSurface, compact, true);
    allFinite(facialSamples.points); allFinite(facialSamples.pathways);
    const p = facialSamples.points.getAttribute('position');
    let lower = 0;
    for (let i = 0; i < p.count; i++) if (p.getY(i) < 0) lower++;
    assert.ok(lower / p.count > .4 && lower / p.count < .7, 'The facial mask must retain balanced coverage below the eyes');
    assert.equal(facialSamples.particleCount, compact ? 2200 : 3800);
    assert.ok(facialSamples.connectionCount > 0 && facialSamples.connectionCount <= (compact ? 1200 : 2200));
    const anchors = facialSamples.points.getAttribute('aAnchor');
    const linkedNodes = Array.from(anchors.array).filter(value => value === 1).length;
    assert.ok(linkedNodes > p.count * .25 && linkedNodes <= p.count * .5, 'The face must have a visible network of linked nodes, with quieter unconnected samples');
    const edges = facialSamples.pathways.getAttribute('position'), degrees = new Map();
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    for (let i = 0; i < edges.count; i += 2) {
      a.fromBufferAttribute(edges, i); b.fromBufferAttribute(edges, i + 1);
      assert.ok(a.distanceTo(b) <= .23001, 'Neural face connections must remain local, including subdivided source contours');
      for (const point of [a, b]) {
        assert.ok(facialSurface.boundingBox.clone().expandByScalar(.00001).containsPoint(point), 'Connections must remain within facial model bounds');
        const key = point.toArray().join(':'); degrees.set(key, (degrees.get(key) ?? 0) + 1);
      }
    }
    assert.ok([...degrees.values()].every(degree => degree <= 3), 'The neural face must retain a bounded node degree');
    facialSamples.dispose();
  }
  facialSurface.dispose();
  gltf.scene.traverse(object => { if (object.isMesh) { object.geometry.dispose(); object.material.dispose(); } });
  console.log('Facial mask: balanced upper/lower surface coverage within existing particle and edge budgets — valid');

  // Optional disposable self-contained GLB fixture for the browser loader smoke check.
  const fixtureArg = process.argv.indexOf('--fixture');
  if (fixtureArg >= 0) {
    const arrays = [surface.getAttribute('position').array, surface.getAttribute('normal').array, surface.index.array];
    const views = []; let offset = 0;
    for (const [i, array] of arrays.entries()) { views.push({ buffer: 0, byteOffset: offset, byteLength: array.byteLength, target: i < 2 ? 34962 : 34963 }); offset += Math.ceil(array.byteLength / 4) * 4; }
    const bin = Buffer.alloc(offset); arrays.forEach((array, i) => Buffer.from(array.buffer, array.byteOffset, array.byteLength).copy(bin, views[i].byteOffset));
    const document = { asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
      meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2 }] }], buffers: [{ byteLength: offset }], bufferViews: views,
      accessors: [{ bufferView: 0, componentType: 5126, count: arrays[0].length / 3, type: 'VEC3', min: surface.boundingBox.min.toArray(), max: surface.boundingBox.max.toArray() },
        { bufferView: 1, componentType: 5126, count: arrays[1].length / 3, type: 'VEC3' },
        { bufferView: 2, componentType: arrays[2] instanceof Uint32Array ? 5125 : 5123, count: arrays[2].length, type: 'SCALAR' }] };
    const raw = Buffer.from(JSON.stringify(document)), json = Buffer.alloc(Math.ceil(raw.length / 4) * 4, 32); raw.copy(json);
    const result = Buffer.alloc(28 + json.length + bin.length);
    result.writeUInt32LE(0x46546c67, 0); result.writeUInt32LE(2, 4); result.writeUInt32LE(result.length, 8);
    result.writeUInt32LE(json.length, 12); result.writeUInt32LE(0x4e4f534a, 16); json.copy(result, 20);
    result.writeUInt32LE(bin.length, 20 + json.length); result.writeUInt32LE(0x004e4942, 24 + json.length); bin.copy(result, 28 + json.length);
    await writeFile(resolve(process.argv[fixtureArg + 1]), result);
    console.log('Disposable GLB fixture written');
  }
  surface.dispose();
  console.log('Geometry, density, sparsity, determinism, and model preparation checks passed.');
} finally { await rm(temporary, { recursive: true, force: true }); }
