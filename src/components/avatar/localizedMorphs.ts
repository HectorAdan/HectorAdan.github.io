import * as THREE from 'three';

// Canonical MediaPipe face topology, used only for this named 478-vertex POC.
// The neutral face is untouched. These corrections stay in the loaded rendering copy.
const LEFT_LIDS = [[246, 7], [161, 163], [160, 144], [159, 145], [158, 153], [157, 154], [173, 155]];
const RIGHT_LIDS = [[466, 249], [388, 390], [387, 373], [386, 374], [385, 380], [384, 381], [398, 382]];
const UPPER_LIP = new Set([185, 40, 39, 37, 0, 267, 269, 270, 409, 191, 80, 81, 82, 13, 312, 311, 310, 415]);
const LOWER_LIP = new Set([146, 91, 181, 84, 17, 314, 405, 321, 375, 95, 88, 178, 87, 14, 317, 402, 318, 324]);
const LIP_CORNERS = new Set([61, 291, 78, 308]);

export function localizeMorph(name: string, positions: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, original: Float32Array) {
  if (positions.count !== 478) return original;
  if (name === 'jawOpen') {
    const result = original.slice(), mouthY = positions.getY(13);
    for (let i = 0; i < positions.count; i++) {
      let weight = THREE.MathUtils.smoothstep(mouthY - positions.getY(i), .015, .22);
      if (UPPER_LIP.has(i)) weight = 0;
      if (LOWER_LIP.has(i)) weight = 1;
      if (LIP_CORNERS.has(i)) weight = .25;
      for (let axis = 0; axis < 3; axis++) result[i * 3 + axis] *= weight;
    }
    return result;
  }
  const pairs = name === 'eyeBlinkLeft' ? LEFT_LIDS : name === 'eyeBlinkRight' ? RIGHT_LIDS : null;
  if (!pairs) return original;
  const result = new Float32Array(original.length), anchors = new Map<number, THREE.Vector3>();
  const upper = new THREE.Vector3(), lower = new THREE.Vector3();
  for (const [a, b] of pairs) {
    upper.fromBufferAttribute(positions, a); lower.fromBufferAttribute(positions, b);
    anchors.set(a, lower.clone().sub(upper).multiplyScalar(.65));
    anchors.set(b, upper.clone().sub(lower).multiplyScalar(.35));
  }
  const corners = new Set(name === 'eyeBlinkLeft' ? [33, 133] : [263, 362]);
  const point = new THREE.Vector3(), anchor = new THREE.Vector3();
  for (let i = 0; i < positions.count; i++) {
    if (corners.has(i)) continue;
    const exact = anchors.get(i);
    if (exact) { exact.toArray(result, i * 3); continue; }
    point.fromBufferAttribute(positions, i);
    let nearest = Infinity, delta: THREE.Vector3 | null = null;
    for (const [vertex, candidate] of anchors) {
      const distance = point.distanceToSquared(anchor.fromBufferAttribute(positions, vertex));
      if (distance < nearest) { nearest = distance; delta = candidate; }
    }
    if (delta) delta.clone().multiplyScalar(.22 * Math.exp(-nearest / .028)).toArray(result, i * 3);
  }
  return result;
}
