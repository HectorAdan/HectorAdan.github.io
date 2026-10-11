import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { seededRandom } from '../canvas/neuralGeometry';

// r174 ships this public method, but its matching @types/three omits the signature.
declare module 'three/addons/math/MeshSurfaceSampler.js' {
  interface MeshSurfaceSampler { setRandomGenerator(random: () => number): this; }
}

export interface AvatarSamples {
  points: THREE.BufferGeometry;
  pathways: THREE.BufferGeometry;
  particleCount: number;
  connectionCount: number;
  dispose: () => void;
}

export function sampleAvatar(surface: THREE.BufferGeometry, compact: boolean): AvatarSamples {
  const count = compact ? 4500 : 11000;
  const random = seededRandom(731);
  // Weight the forward facial region while retaining the back of the head and torso.
  const weighted = surface.clone();
  const sourcePositions = weighted.getAttribute('position'), sourceNormals = weighted.getAttribute('normal');
  const density = new Float32Array(sourcePositions.count);
  for (let i = 0; i < density.length; i++) {
    density[i] = .75 + (sourcePositions.getY(i) > .15 ? 1.1 : 0)
      + (sourcePositions.getY(i) > .15 && sourceNormals.getZ(i) > .25 ? 1.6 : 0);
  }
  weighted.setAttribute('density', new THREE.BufferAttribute(density, 1));
  const material = new THREE.MeshBasicMaterial();
  const sampler = new MeshSurfaceSampler(new THREE.Mesh(weighted, material)).setWeightAttribute('density').setRandomGenerator(random).build();
  const positions = new Float32Array(count * 3), normals = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3), seeds = new Float32Array(count);
  const position = new THREE.Vector3(), normal = new THREE.Vector3(), color = new THREE.Color();
  const cyan = new THREE.Color('#80e9f3'), blue = new THREE.Color('#417ac6'), violet = new THREE.Color('#9c90d6');
  for (let i = 0; i < count; i++) {
    sampler.sample(position, normal);
    position.toArray(positions, i * 3); normal.normalize().toArray(normals, i * 3);
    const tone = random();
    color.copy(blue).lerp(cyan, .38 + random() * .62);
    if (tone < .08) color.lerp(violet, .7);
    color.toArray(colors, i * 3); seeds[i] = random();
  }
  weighted.dispose(); material.dispose();
  const points = new THREE.BufferGeometry();
  points.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  points.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  points.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  points.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  points.computeBoundingSphere();

  // A spatial hash limits neighbor searches to nearby cells, and only a subset
  // of particles participates. Degree and edge caps prevent a dense wire cage.
  const stride = compact ? 10 : 12, radius = .23, limit = compact ? 430 : 1000;
  const cells = new Map<string, number[]>();
  const cellKey = (x: number, y: number, z: number) => `${x}:${y}:${z}`;
  const coordinate = (i: number, axis: number) => Math.floor(positions[i * 3 + axis] / radius);
  for (let i = 0; i < count; i += stride) {
    const key = cellKey(coordinate(i, 0), coordinate(i, 1), coordinate(i, 2));
    const bucket = cells.get(key) ?? []; bucket.push(i); cells.set(key, bucket);
  }
  const edges: number[] = [], progress: number[] = [], phases: number[] = [], degree = new Uint8Array(count);
  for (let i = 0; i < count && edges.length / 6 < limit; i += stride) {
    const cx = coordinate(i, 0), cy = coordinate(i, 1), cz = coordinate(i, 2);
    const neighbors: { j: number; distance: number }[] = [];
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
      for (const j of cells.get(cellKey(cx + x, cy + y, cz + z)) ?? []) {
        if (j <= i || degree[j] >= 2) continue;
        let distance = 0, alignment = 0;
        for (let a = 0; a < 3; a++) {
          distance += (positions[i * 3 + a] - positions[j * 3 + a]) ** 2;
          alignment += normals[i * 3 + a] * normals[j * 3 + a];
        }
        if (distance < radius ** 2 && distance > .0025 && alignment > .35) neighbors.push({ j, distance });
      }
    }
    neighbors.sort((a, b) => a.distance - b.distance);
    for (const { j } of neighbors) {
      if (degree[i] >= 2 || edges.length / 6 >= limit) break;
      edges.push(...positions.subarray(i * 3, i * 3 + 3), ...positions.subarray(j * 3, j * 3 + 3));
      progress.push(0, 1); const phase = random(); phases.push(phase, phase);
      degree[i]++; degree[j]++;
    }
  }
  const pathways = new THREE.BufferGeometry();
  pathways.setAttribute('position', new THREE.Float32BufferAttribute(edges, 3));
  pathways.setAttribute('aProgress', new THREE.Float32BufferAttribute(progress, 1));
  pathways.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1));
  pathways.computeBoundingSphere();
  return { points, pathways, particleCount: count, connectionCount: edges.length / 6,
    dispose: () => { points.dispose(); pathways.dispose(); } };
}
