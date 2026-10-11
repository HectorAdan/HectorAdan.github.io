import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { seededRandom } from '../canvas/neuralGeometry';
import { MORPH_CHANNELS } from './morphChannels';

// r174 ships this public method, but its matching @types/three omits the signature.
declare module 'three/addons/math/MeshSurfaceSampler.js' {
  interface MeshSurfaceSampler { setRandomGenerator(random: () => number): this; }
}

export interface AvatarSamples {
  points: THREE.BufferGeometry;
  pathways: THREE.BufferGeometry;
  particleCount: number;
  connectionCount: number;
  bindings?: { pointVertices: Uint32Array; pointWeights: Float32Array; pathVertices: Uint32Array; pathWeights: Float32Array };
  dispose: () => void;
}

export function sampleAvatar(surface: THREE.BufferGeometry, compact: boolean, facialMask = false): AvatarSamples {
  const count = facialMask ? compact ? 2200 : 3800 : compact ? 4500 : 11000;
  const random = seededRandom(731);
  // The bust needs more samples on its face. A face-only mask needs even coverage
  // instead, or the old upper-body weighting starves the lips, cheeks and jaw.
  const weighted = surface.clone();
  const sourcePositions = weighted.getAttribute('position'), sourceNormals = weighted.getAttribute('normal');
  const density = new Float32Array(sourcePositions.count);
  for (let i = 0; i < density.length; i++) {
    density[i] = facialMask ? 1 : .75 + (sourcePositions.getY(i) > .15 ? 1.1 : 0)
      + (sourcePositions.getY(i) > .15 && sourceNormals.getZ(i) > .25 ? 1.6 : 0);
  }
  weighted.setAttribute('density', new THREE.BufferAttribute(density, 1));
  const material = new THREE.MeshBasicMaterial();
  const sampler = new MeshSurfaceSampler(new THREE.Mesh(weighted, material)).setWeightAttribute('density').setRandomGenerator(random).build();
  const positions = new Float32Array(count * 3), normals = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3), seeds = new Float32Array(count);
  const position = new THREE.Vector3(), normal = new THREE.Vector3(), color = new THREE.Color();
  const channels = MORPH_CHANNELS.filter(c => surface.hasAttribute(c.position) && surface.hasAttribute(c.normal)).map(channel => ({
    channel, delta: surface.getAttribute(channel.position), normalDelta: surface.getAttribute(channel.normal),
    points: new Float32Array(count * 3), normals: new Float32Array(count * 3), paths: [] as number[],
  }));
  const pointVertices = channels.length ? new Uint32Array(count * 3) : null;
  const pointWeights = channels.length ? new Float32Array(count * 3) : null;
  const pathVertices: number[] = [], pathWeights: number[] = [];
  const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3(), bary = new THREE.Vector3();
  const cyan = new THREE.Color('#80e9f3'), blue = new THREE.Color('#417ac6'), violet = new THREE.Color('#9c90d6');
  for (let i = 0; i < count; i++) {
    if (pointVertices && pointWeights && sampler.distribution) {
      const distribution = sampler.distribution;
      const faceIndex = sampler.binarySearch(random() * distribution[distribution.length - 1]);
      sampler.sampleFace(faceIndex, position, normal);
      const a = weighted.index?.getX(faceIndex * 3) ?? faceIndex * 3;
      const b = weighted.index?.getX(faceIndex * 3 + 1) ?? faceIndex * 3 + 1;
      const c = weighted.index?.getX(faceIndex * 3 + 2) ?? faceIndex * 3 + 2;
      va.fromBufferAttribute(sourcePositions, a); vb.fromBufferAttribute(sourcePositions, b); vc.fromBufferAttribute(sourcePositions, c);
      THREE.Triangle.getBarycoord(position, va, vb, vc, bary);
      pointVertices.set([a, b, c], i * 3); bary.toArray(pointWeights, i * 3);
      for (const data of channels) {
        for (let axis = 0; axis < 3; axis++) {
          data.points[i * 3 + axis] = data.delta.array[a * 3 + axis] * bary.x + data.delta.array[b * 3 + axis] * bary.y + data.delta.array[c * 3 + axis] * bary.z;
          data.normals[i * 3 + axis] = data.normalDelta.array[a * 3 + axis] * bary.x + data.normalDelta.array[b * 3 + axis] * bary.y + data.normalDelta.array[c * 3 + axis] * bary.z;
        }
      }
    } else sampler.sample(position, normal);
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
  for (const data of channels) {
    points.setAttribute(data.channel.position, new THREE.BufferAttribute(data.points, 3));
    points.setAttribute(data.channel.normal, new THREE.BufferAttribute(data.normals, 3));
  }
  points.computeBoundingSphere();

  // A spatial hash limits neighbor searches to nearby cells, and only a subset
  // of particles participates. Degree and edge caps prevent a dense wire cage.
  const stride = facialMask ? 2 : compact ? 10 : 12;
  const radius = .23, limit = facialMask ? compact ? 1200 : 2200 : compact ? 430 : 1000;
  const maxDegree = facialMask ? 3 : 2;
  const cells = new Map<string, number[]>();
  const cellKey = (x: number, y: number, z: number) => `${x}:${y}:${z}`;
  const coordinate = (i: number, axis: number) => Math.floor(positions[i * 3 + axis] / radius);
  for (let i = 0; i < count; i += stride) {
    const key = cellKey(coordinate(i, 0), coordinate(i, 1), coordinate(i, 2));
    const bucket = cells.get(key) ?? []; bucket.push(i); cells.set(key, bucket);
  }
  const edges: number[] = [], progress: number[] = [], phases: number[] = [], degree = new Uint8Array(count);
  if (facialMask && surface.index) {
    // Source boundary edges trace the actual eyelids, lip opening and silhouette.
    // These segments follow existing topology and do not fill the openings.
    const boundary = new Map<string, { a: number; b: number; uses: number }>();
    const index = surface.index, source = surface.getAttribute('position');
    for (let i = 0; i < index.count; i += 3) {
      const triangle = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
      for (let j = 0; j < 3; j++) {
        const a = Math.min(triangle[j], triangle[(j + 1) % 3]), b = Math.max(triangle[j], triangle[(j + 1) % 3]);
        const key = `${a}:${b}`, existing = boundary.get(key);
        if (existing) existing.uses++; else boundary.set(key, { a, b, uses: 1 });
      }
    }
    const a = new THREE.Vector3(), b = new THREE.Vector3(), start = new THREE.Vector3(), end = new THREE.Vector3();
    const contourLimit = Math.floor(limit * .2);
    for (const edge of boundary.values()) {
      if (edge.uses !== 1 || edges.length / 6 >= contourLimit) continue;
      a.fromBufferAttribute(source, edge.a); b.fromBufferAttribute(source, edge.b);
      const segments = Math.max(1, Math.ceil(a.distanceTo(b) / .2)), phase = random();
      for (let s = 0; s < segments && edges.length / 6 < contourLimit; s++) {
        start.copy(a).lerp(b, s / segments); end.copy(a).lerp(b, (s + 1) / segments);
        edges.push(...start.toArray(), ...end.toArray());
        progress.push(s / segments, (s + 1) / segments); phases.push(phase, phase);
        if (channels.length) {
          for (const fraction of [s / segments, (s + 1) / segments]) {
            pathVertices.push(edge.a, edge.b, edge.b); pathWeights.push(1 - fraction, fraction, 0);
            for (const data of channels) for (let axis = 0; axis < 3; axis++) {
              data.paths.push(data.delta.array[edge.a * 3 + axis] * (1 - fraction) + data.delta.array[edge.b * 3 + axis] * fraction);
            }
          }
        }
      }
    }
  }
  for (let i = 0; i < count && edges.length / 6 < limit; i += stride) {
    const cx = coordinate(i, 0), cy = coordinate(i, 1), cz = coordinate(i, 2);
    const neighbors: { j: number; distance: number }[] = [];
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
      for (const j of cells.get(cellKey(cx + x, cy + y, cz + z)) ?? []) {
        if (j <= i || degree[j] >= maxDegree) continue;
        let distance = 0, alignment = 0;
        for (let a = 0; a < 3; a++) {
          distance += (positions[i * 3 + a] - positions[j * 3 + a]) ** 2;
          alignment += normals[i * 3 + a] * normals[j * 3 + a];
        }
        if (distance < radius ** 2 && distance > .0025 && alignment > (facialMask ? .65 : .35)) neighbors.push({ j, distance });
      }
    }
    neighbors.sort((a, b) => a.distance - b.distance);
    for (const { j } of neighbors) {
      if (degree[i] >= maxDegree || edges.length / 6 >= limit) break;
      edges.push(...positions.subarray(i * 3, i * 3 + 3), ...positions.subarray(j * 3, j * 3 + 3));
      progress.push(0, 1); const phase = random(); phases.push(phase, phase);
      if (pointVertices && pointWeights) for (const endpoint of [i, j]) {
        pathVertices.push(...pointVertices.subarray(endpoint * 3, endpoint * 3 + 3));
        pathWeights.push(...pointWeights.subarray(endpoint * 3, endpoint * 3 + 3));
        for (const data of channels) data.paths.push(...data.points.subarray(endpoint * 3, endpoint * 3 + 3));
      }
      degree[i]++; degree[j]++;
    }
  }
  const pathways = new THREE.BufferGeometry();
  pathways.setAttribute('position', new THREE.Float32BufferAttribute(edges, 3));
  pathways.setAttribute('aProgress', new THREE.Float32BufferAttribute(progress, 1));
  pathways.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1));
  for (const data of channels) pathways.setAttribute(data.channel.position, new THREE.Float32BufferAttribute(data.paths, 3));
  pathways.computeBoundingSphere();
  // Connected nodes read as the network; unconnected samples remain faint depth dust.
  points.setAttribute('aAnchor', new THREE.Float32BufferAttribute(Array.from(degree, d => d > 0 ? 1 : 0), 1));
  const bindings = pointVertices && pointWeights ? { pointVertices, pointWeights, pathVertices: new Uint32Array(pathVertices), pathWeights: new Float32Array(pathWeights) } : undefined;
  return { points, pathways, particleCount: count, connectionCount: edges.length / 6, bindings,
    dispose: () => { points.dispose(); pathways.dispose(); } };
}
