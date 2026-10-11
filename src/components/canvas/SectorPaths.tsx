import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SectorId } from '../../types/portfolio';
import { SECTORS } from '../../data/portfolioData';

export const SPATIAL_SECTORS: SectorId[] = ['about', 'projects', 'experience', 'contact'];
export function getBeaconPosition(id: SectorId) {
  const [x, y, z] = SECTORS[id].position;
  return new THREE.Vector3(x, y + (id === 'about' ? 1.1 : 0), z);
}
const vertexShader = `
  attribute float aProgress;
  varying float vProgress;
  void main() {
    vProgress = aProgress;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragmentShader = `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uMotion;
  uniform vec3 uColor;
  varying float vProgress;
  void main() {
    float head = fract(uTime * .23);
    float pulse = exp(-pow((vProgress - head) * 24.0, 2.0)) * uMotion;
    float edge = smoothstep(0.0, .08, vProgress);
    gl_FragColor = vec4(mix(uColor, vec3(.65, .91, 1.0), pulse),
      uOpacity * (.4 + pulse * .55) * edge);
  }
`;

export function SectorPaths({ highlightedSector, reducedMotion }: { highlightedSector: SectorId | null; reducedMotion: boolean }) {
  return <group>{SPATIAL_SECTORS.map(id => <Path key={id} sector={id} highlighted={id === highlightedSector} reducedMotion={reducedMotion} />)}</group>;
}
function Path({ sector, highlighted, reducedMotion }: { sector: SectorId; highlighted: boolean; reducedMotion: boolean }) {
  const line = useRef<THREE.LineSegments>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const time = useRef(0);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uOpacity: { value: 0 }, uMotion: { value: 0 }, uColor: { value: new THREE.Color(sector === 'experience' ? '#a094cd' : '#8ac7d5') } }), [sector]);
  const data = useMemo(() => {
    const center = new THREE.Vector3(1.15, .25, 0);
    const end = getBeaconPosition(sector);
    const direction = end.clone().sub(center).normalize();
    const start = center.clone().addScaledVector(direction, 1.65);
    const bend = end.y > 0 ? .6 : -.6;
    const c1 = start.clone().lerp(end, .3).add(new THREE.Vector3(0, bend, -.8));
    const c2 = start.clone().lerp(end, .72).add(new THREE.Vector3(0, bend * .4, -.4));
    const curve = new THREE.CubicBezierCurve3(start, c1, c2, end);
    // Batch the complete pathway into one draw call.
    const points = curve.getPoints(72);
    return {
      positions: new Float32Array(points.slice(0, -1).flatMap((point, i) => [...point.toArray(), ...points[i + 1].toArray()])),
      progress: new Float32Array(points.slice(0, -1).flatMap((_, i) => [i / 72, (i + 1) / 72])),
    };
  }, [sector]);
  useFrame((_, delta) => {
    if (!material.current) return;
    const values = material.current.uniforms;
    if (!reducedMotion) time.current += Math.min(delta, .05);
    values.uTime.value = time.current;
    values.uMotion.value = reducedMotion ? 0 : 1;
    values.uOpacity.value = reducedMotion ? (highlighted ? .85 : 0) : THREE.MathUtils.damp(values.uOpacity.value, highlighted ? .85 : 0, 7, Math.min(delta, .05));
    if (line.current) line.current.visible = values.uOpacity.value > .002;
  });
  return <lineSegments ref={line}>
    <bufferGeometry attach="geometry">
      <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
      <bufferAttribute attach="attributes-aProgress" args={[data.progress, 1]} />
    </bufferGeometry>
    <shaderMaterial ref={material} attach="material" uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
  </lineSegments>;
}
