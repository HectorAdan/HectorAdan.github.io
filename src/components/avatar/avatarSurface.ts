import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Original study geometry, deliberately unrelated to Hector's facial likeness.
export function createStudyBust(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const gaussian = (x: number, y: number, cx: number, cy: number, sx: number, sy: number) =>
    Math.exp(-(((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2));
  const head = new THREE.SphereGeometry(1, 128, 96);
  const p = head.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const sy = p.getY(i), front = Math.max(0, p.getZ(i));
    const jaw = THREE.MathUtils.smoothstep(sy, -.92, -.18);
    // Fill out the mandible below the cheekbones rather than tapering to a cone.
    const x = p.getX(i) * (.67 + .075 * jaw + .075 * Math.exp(-(((sy + .72) / .20) ** 2)));
    const y = sy * 1.12;
    let z = p.getZ(i) * (.64 + .045 * sy);
    const features =
      .38 * gaussian(x, y, 0, -.08, .115, .17) + // nose tip
      .19 * gaussian(x, y, 0, .22, .085, .36) + // bridge
      .065 * gaussian(x, y, -.12, -.17, .075, .07) +
      .065 * gaussian(x, y, .12, -.17, .075, .07) +
      -.17 * gaussian(x, y, -.29, .23, .135, .09) + // eye sockets
      -.17 * gaussian(x, y, .29, .23, .135, .09) +
      .08 * gaussian(x, y, -.30, .39, .23, .075) + // brows
      .08 * gaussian(x, y, .30, .39, .23, .075) +
      .09 * gaussian(x, y, -.37, -.12, .20, .20) + // cheeks
      .09 * gaussian(x, y, .37, -.12, .20, .20) +
      .075 * gaussian(x, y, 0, -.48, .23, .065) + // lips
      .06 * gaussian(x, y, 0, -.59, .22, .065) +
      -.05 * gaussian(x, y, 0, -.535, .21, .022) +
      .07 * gaussian(x, y, 0, -.82, .27, .14);
    z += features * THREE.MathUtils.smoothstep(front, .15, .60);
    p.setXYZ(i, x, y + 1.04, z);
  }
  parts.push(head);
  for (const side of [-1, 1]) {
    const ear = new THREE.SphereGeometry(1, 24, 20);
    ear.scale(.105, .23, .13).translate(side * .73, .94, -.04);
    parts.push(ear);
  }
  // Smooth elliptical rings form shoulders and an upper chest, rather than a flat silhouette.
  const rings = [
    { y: .08, w: .28, d: .23 }, { y: -.20, w: .29, d: .26 },
    { y: -.42, w: .36, d: .30 }, { y: -.58, w: .70, d: .36 },
    { y: -.79, w: 1.24, d: .43 }, { y: -1.02, w: 1.59, d: .49 },
    { y: -1.27, w: 1.66, d: .54 }, { y: -1.63, w: 1.56, d: .54 },
  ];
  const vertices: number[] = [], indices: number[] = [], segments = 80;
  rings.forEach(({ y, w, d }) => {
    for (let s = 0; s <= segments; s++) {
      const angle = s / segments * Math.PI * 2;
      vertices.push(Math.sin(angle) * w, y, Math.cos(angle) * d - .06);
    }
  });
  for (let r = 0; r < rings.length - 1; r++) {
    for (let s = 0; s < segments; s++) {
      const a = r * (segments + 1) + s, b = a + segments + 1;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const chest = new THREE.BufferGeometry();
  chest.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  chest.setIndex(indices);
  parts.push(chest);
  const root = new THREE.Group();
  const material = new THREE.MeshBasicMaterial();
  parts.forEach(geometry => root.add(new THREE.Mesh(geometry, material)));
  const result = prepareAvatarSurface(root);
  parts.forEach(geometry => geometry.dispose());
  material.dispose();
  return result;
}

// Source-independent boundary: bake node transforms and the current skin/morph pose.
// The renderer never needs to know whether this geometry came from a GLB or the study mesh.
export function prepareAvatarSurface(root: THREE.Object3D): THREE.BufferGeometry {
  root.updateMatrixWorld(true);
  const parts: THREE.BufferGeometry[] = [];
  const vertex = new THREE.Vector3();
  root.traverseVisible(object => {
    if (!(object instanceof THREE.Mesh) || !object.geometry.getAttribute('position')) return;
    if (object instanceof THREE.SkinnedMesh) object.skeleton.update();
    const original = object.geometry;
    const positions = new Float32Array(original.getAttribute('position').count * 3);
    for (let i = 0; i < positions.length / 3; i++) {
      object.getVertexPosition(i, vertex).applyMatrix4(object.matrixWorld).toArray(positions, i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    // All parts must agree on indexing before merge; non-indexed meshes are indexed trivially.
    geometry.setIndex(original.index ? original.index.clone() : Array.from({ length: positions.length / 3 }, (_, i) => i));
    if (object.matrixWorld.determinant() < 0) {
      const index = geometry.index!;
      for (let i = 0; i < index.count; i += 3) {
        const b = index.getX(i + 1); index.setX(i + 1, index.getX(i + 2)); index.setX(i + 2, b);
      }
    }
    parts.push(geometry);
  });
  if (!parts.length) throw new Error('Avatar model contains no visible mesh surfaces.');
  const surface = mergeGeometries(parts, false);
  parts.forEach(part => part.dispose());
  if (!surface) throw new Error('Avatar surfaces could not be combined.');
  surface.computeBoundingBox();
  const box = surface.boundingBox!;
  const size = box.getSize(new THREE.Vector3());
  if (![size.x, size.y, size.z].every(Number.isFinite) || size.y < .0001) {
    surface.dispose();
    throw new Error('Avatar model has invalid dimensions.');
  }
  const center = box.getCenter(new THREE.Vector3());
  surface.translate(-center.x, -center.y, -center.z).scale(3.8 / size.y, 3.8 / size.y, 3.8 / size.y);
  surface.computeVertexNormals();
  surface.computeBoundingBox();
  surface.computeBoundingSphere();
  return surface;
}

export function disposeSource(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    const list = Array.isArray(object.material) ? object.material : [object.material];
    list.forEach(material => {
      materials.add(material);
      Object.values(material).forEach(value => { if (value instanceof THREE.Texture) textures.add(value); });
    });
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
  textures.forEach(texture => { texture.dispose(); if (typeof ImageBitmap !== 'undefined' && texture.image instanceof ImageBitmap) texture.image.close(); });
}

export async function loadAvatarSurface(url: string): Promise<THREE.BufferGeometry> {
  const gltf = await new GLTFLoader().loadAsync(url);
  try { return prepareAvatarSurface(gltf.scene); }
  finally { disposeSource(gltf.scene); }
}
