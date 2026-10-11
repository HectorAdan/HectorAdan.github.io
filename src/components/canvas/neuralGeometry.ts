import type * as THREE from 'three';

// Repeatable compositions keep the scene beautiful at rest and stable across mounts.
export function seededRandom(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function neuralGraph(points: THREE.Vector3[], neighbors: number, maxDistance: number) {
  const pairs = new Set<string>();
  points.forEach((point, i) => {
    points.map((other, j) => ({ j, d: point.distanceToSquared(other) }))
      .filter(({ j, d }) => j !== i && d < maxDistance * maxDistance)
      .sort((a, b) => a.d - b.d).slice(0, neighbors)
      .forEach(({ j }) => pairs.add(`${Math.min(i, j)}:${Math.max(i, j)}`));
  });
  const edges = Array.from(pairs, pair => pair.split(':').map(Number));
  const positions = new Float32Array(edges.length * 6);
  const progress = new Float32Array(edges.length * 2);
  const phase = new Float32Array(edges.length * 2);
  edges.forEach(([a, b], i) => {
    points[a].toArray(positions, i * 6);
    points[b].toArray(positions, i * 6 + 3);
    progress[i * 2 + 1] = 1;
    phase[i * 2] = phase[i * 2 + 1] = (i * 0.618033) % 1;
  });
  return { positions, progress, phase };
}

// Shared displacement keeps the points, connections and moving energy attached.
const displacement = `
  uniform float uTime;
  uniform float uMotion;
  vec3 organic(vec3 p) {
    float wave = sin(p.y * 2.1 + uTime * .35) * cos(p.x * 1.7 - uTime * .22);
    return p * (1.0 + wave * .026 * uMotion);
  }
`;

function pointVertex(assemble: boolean) { return `
  ${displacement}
  uniform float uSize;
  ${assemble ? 'uniform float uReveal;' : ''}
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vDepth;
  void main() {
    vColor = color ${assemble ? '* uReveal' : ''};
    vec4 mv = modelViewMatrix * vec4(organic(position) ${assemble ? '* mix(1.45, 1.0, uReveal)' : ''}, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(uSize * uPixelRatio * (8.0 / -mv.z), 1.0, 12.0);
  }
`; }
export const neuralPointVertex = pointVertex(false);
export const corePointVertex = pointVertex(true);

export const neuralPointFragment = `
  varying vec3 vColor;
  varying float vDepth;
  void main() {
    float d = length(gl_PointCoord - .5) * 2.0;
    if (d > 1.0) discard;
    float glow = exp(-d * d * 5.0);
    float fog = exp(-vDepth * vDepth * .0007);
    gl_FragColor = vec4(vColor, glow * fog);
  }
`;

export const neuralLineVertex = `
  ${displacement}
  attribute float aProgress;
  attribute float aPhase;
  varying float vProgress;
  varying float vPhase;
  varying float vDepth;
  void main() {
    vProgress = aProgress;
    vPhase = aPhase;
    vec4 mv = modelViewMatrix * vec4(organic(position), 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

export const neuralLineFragment = `
  uniform float uTime;
  uniform float uMotion;
  uniform float uOpacity;
  uniform vec3 uColor;
  varying float vProgress;
  varying float vPhase;
  varying float vDepth;
  void main() {
    float head = fract(uTime * .12 + vPhase);
    float pulse = exp(-pow((vProgress - head) * 22.0, 2.0));
    // Only a small subset of pathways carries luminous energy at any moment.
    float gate = pow(max(0.0, sin(vPhase * 61.0 + uTime * .23)), 14.0);
    float energy = pulse * gate * uMotion;
    float fog = exp(-vDepth * vDepth * .0007);
    gl_FragColor = vec4(mix(uColor, vec3(.65, .95, 1.0), energy),
      (uOpacity + energy * .65) * fog);
  }
`;

export const glowVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
export const glowFragment = `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - .5) * 2.0;
    float glow = exp(-d * d * 6.0) * (1.0 - smoothstep(.65, 1.0, d));
    gl_FragColor = vec4(uColor, glow * uOpacity);
  }
`;
