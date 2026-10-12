import * as THREE from 'three';

export interface ContourSample { a: number; b: number; mix: number }

/** Small, evenly spaced dots along actual mouth/eyelid openings of this mask. */
export function particleContours(surface: THREE.BufferGeometry, compact: boolean): ContourSample[] {
  const p = surface.getAttribute('position'), index = surface.index;
  if (!index || p.count !== 478) return [];
  const boxes = [[61, 291, 0, 17], [33, 133, 159, 145], [263, 362, 386, 374]].map(([a, b, upper, lower]) => ({
    minX: Math.min(p.getX(a), p.getX(b)) - .055,
    maxX: Math.max(p.getX(a), p.getX(b)) + .055,
    minY: Math.min(p.getY(upper), p.getY(lower)) - .055,
    maxY: Math.max(p.getY(upper), p.getY(lower)) + .055,
  }));
  const edges = new Map<string, { a: number; b: number; uses: number }>();
  for (let i = 0; i < index.count; i += 3) {
    for (let j = 0; j < 3; j++) {
      const a = Math.min(index.getX(i + j), index.getX(i + (j + 1) % 3));
      const b = Math.max(index.getX(i + j), index.getX(i + (j + 1) % 3));
      const key = `${a}:${b}`, previous = edges.get(key);
      if (previous) previous.uses++; else edges.set(key, { a, b, uses: 1 });
    }
  }
  const samples: ContourSample[] = [], a = new THREE.Vector3(), b = new THREE.Vector3();
  const spacing = compact ? .065 : .045;
  for (const edge of edges.values()) {
    if (edge.uses !== 1) continue;
    a.fromBufferAttribute(p, edge.a); b.fromBufferAttribute(p, edge.b);
    const x = (a.x + b.x) * .5, y = (a.y + b.y) * .5;
    if (!boxes.some(box => x >= box.minX && x <= box.maxX && y >= box.minY && y <= box.maxY)) continue;
    const divisions = Math.max(1, Math.round(a.distanceTo(b) / spacing));
    for (let i = 0; i < divisions; i++) samples.push({ a: edge.a, b: edge.b, mix: (i + .5) / divisions });
  }
  return samples;
}
