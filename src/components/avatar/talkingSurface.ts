import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { disposeSource } from './avatarSurface';
import { MORPH_CHANNELS } from './morphChannels';
import { localizeMorph } from './localizedMorphs';

export function prepareTalkingSurface(root: THREE.Object3D, localized = false): THREE.BufferGeometry {
  root.updateMatrixWorld(true);
  const meshes: THREE.Mesh[] = [];
  root.traverseVisible(object => { if (object instanceof THREE.Mesh) meshes.push(object); });
  if (meshes.length !== 1 || meshes[0] instanceof THREE.SkinnedMesh) throw new Error('This study expects one unskinned facial mesh.');
  const mesh = meshes[0], source = mesh.geometry, original = source.getAttribute('position');
  const geometry = new THREE.BufferGeometry();
  const base = new Float32Array(original.count * 3), point = new THREE.Vector3();
  for (let i = 0; i < original.count; i++) point.fromBufferAttribute(original, i).applyMatrix4(mesh.matrixWorld).toArray(base, i * 3);
  geometry.setAttribute('position', new THREE.BufferAttribute(base, 3));
  geometry.setIndex(source.index ? source.index.clone() : Array.from({ length: original.count }, (_, i) => i));
  if (mesh.matrixWorld.determinant() < 0) {
    for (let i = 0; i < geometry.index!.count; i += 3) {
      const b = geometry.index!.getX(i + 1); geometry.index!.setX(i + 1, geometry.index!.getX(i + 2)); geometry.index!.setX(i + 2, b);
    }
  }
  geometry.computeBoundingBox();
  const size = geometry.boundingBox!.getSize(new THREE.Vector3()), center = geometry.boundingBox!.getCenter(new THREE.Vector3());
  if (![size.x, size.y, size.z].every(Number.isFinite) || size.y < .0001) { geometry.dispose(); throw new Error('Invalid facial dimensions.'); }
  const scale = 3.8 / size.y;
  geometry.translate(-center.x, -center.y, -center.z).scale(scale, scale, scale);
  geometry.computeVertexNormals();
  const normalized = geometry.getAttribute('position'), normals = geometry.getAttribute('normal');
  const linear = new THREE.Matrix3().setFromMatrix4(mesh.matrixWorld);
  try {
    for (const channel of MORPH_CHANNELS) {
      const index = mesh.morphTargetDictionary?.[channel.name];
      const target = index === undefined ? undefined : source.morphAttributes.position?.[index];
      if (!target || target.count !== original.count) throw new Error(`Missing morph target: ${channel.name}`);
      let deltas: Float32Array = new Float32Array(base.length);
      let affected = 0;
      for (let i = 0; i < target.count; i++) {
        point.fromBufferAttribute(target, i);
        if (!source.morphTargetsRelative) point.sub(new THREE.Vector3().fromBufferAttribute(original, i));
        point.applyMatrix3(linear).multiplyScalar(scale);
        if (!Number.isFinite(point.lengthSq())) throw new Error(`Invalid morph target: ${channel.name}`);
        if (point.lengthSq() > 1e-12) affected++;
        point.toArray(deltas, i * 3);
      }
      if (!affected) throw new Error(`Empty morph target: ${channel.name}`);
      if (localized && mesh.name.toLowerCase().includes('mediapipe')) deltas = localizeMorph(channel.name, normalized, deltas);
      geometry.setAttribute(channel.position, new THREE.BufferAttribute(deltas, 3));
      const posed = new THREE.BufferGeometry(), positions = new Float32Array(base.length);
      for (let i = 0; i < positions.length; i++) positions[i] = normalized.array[i] + deltas[i];
      posed.setAttribute('position', new THREE.BufferAttribute(positions, 3)); posed.setIndex(geometry.index!.clone()); posed.computeVertexNormals();
      const posedNormals = posed.getAttribute('normal'), normalDelta = new Float32Array(base.length);
      for (let i = 0; i < normalDelta.length; i++) normalDelta[i] = posedNormals.array[i] - normals.array[i];
      geometry.setAttribute(channel.normal, new THREE.BufferAttribute(normalDelta, 3));
      posed.dispose();
    }
    geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    // Custom attributes carry the morphs; no native morph texture or per-frame bake.
    return geometry;
  } catch (error) { geometry.dispose(); throw error; }
}

export async function loadTalkingSurface(url: string, localized = false) {
  const gltf = await new GLTFLoader().loadAsync(url);
  try { return prepareTalkingSurface(gltf.scene, localized); }
  finally { disposeSource(gltf.scene); }
}
