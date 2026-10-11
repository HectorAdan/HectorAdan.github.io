import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { seededRandom, neuralPointVertex, neuralPointFragment } from './neuralGeometry';

export function ParticleField({ reducedMotion = false, compact = false }: { reducedMotion?: boolean; compact?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { gl } = useThree();
  const data = useMemo(() => {
    const random = seededRandom(12);
    const count = compact ? 180 : 420;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions.set([(random() - .5) * 55, (random() - .5) * 36, -4 - random() * 30], i * 3);
      const c = new THREE.Color(i % 8 === 0 ? '#696184' : '#5c7f94').multiplyScalar(.35 + random() * .5);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    return { positions, colors };
  }, [compact]);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uMotion: { value: 0 }, uSize: { value: 2.5 }, uPixelRatio: { value: gl.getPixelRatio() } }), [gl]);
  useFrame((_, delta) => {
    uniforms.uPixelRatio.value = gl.getPixelRatio();
    if (reducedMotion || !group.current) return;
    group.current.rotation.y += Math.min(delta, .05) * .002;
  });
  return <group ref={group}><points>
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
      <bufferAttribute attach="attributes-color" args={[data.colors, 3]} />
    </bufferGeometry>
    <shaderMaterial uniforms={uniforms} vertexShader={neuralPointVertex} fragmentShader={neuralPointFragment} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} />
  </points></group>;
}
