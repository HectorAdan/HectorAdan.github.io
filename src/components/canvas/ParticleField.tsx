import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleFieldProps {
  reducedMotion?: boolean;
}

export function ParticleField({ reducedMotion = false }: ParticleFieldProps) {
  const foregroundRef = useRef<THREE.Points>(null);
  const midgroundRef = useRef<THREE.Points>(null);
  const deepCosmosRef = useRef<THREE.Points>(null);

  // 1. FOREGROUND PARTICLES (Large, soft bokeh particles floating close to camera)
  const foregroundData = useMemo(() => {
    const count = 75;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const cyan = new THREE.Color('#38bdf8');
    const blue = new THREE.Color('#00f0ff');

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = 2.5 + Math.random() * 5.0; // Close to camera (z: 2.5 to 7.5)

      const mixed = new THREE.Color().copy(cyan).lerp(blue, Math.random());
      col[i * 3 + 0] = mixed.r;
      col[i * 3 + 1] = mixed.g;
      col[i * 3 + 2] = mixed.b;
    }
    return { pos, col, count };
  }, []);

  // 2. MIDGROUND PARTICLES (Synaptic dust clustered around the neural network)
  const midgroundData = useMemo(() => {
    const count = 750;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const cyan = new THREE.Color('#00f0ff');
    const sky = new THREE.Color('#38bdf8');
    const indigo = new THREE.Color('#6366f1');

    for (let i = 0; i < count; i++) {
      const radius = 2.0 + Math.pow(Math.random(), 0.7) * 16;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      pos[i * 3 + 0] = radius * Math.cos(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * 0.75;
      pos[i * 3 + 2] = radius * Math.cos(phi) * Math.sin(theta) * 0.9;

      const mix = Math.random();
      const mixed = mix < 0.6
        ? new THREE.Color().copy(cyan).lerp(sky, mix / 0.6)
        : new THREE.Color().copy(sky).lerp(indigo, (mix - 0.6) / 0.4);

      col[i * 3 + 0] = mixed.r;
      col[i * 3 + 1] = mixed.g;
      col[i * 3 + 2] = mixed.b;
    }
    return { pos, col, count };
  }, []);

  // 3. DEEP BACKGROUND PARTICLES (Distant cosmic neural starfield)
  const deepCosmosData = useMemo(() => {
    const count = 950;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const deepBlue = new THREE.Color('#1e3a8a');
    const deepCyan = new THREE.Color('#0284c7');
    const violet = new THREE.Color('#4338ca');

    for (let i = 0; i < count; i++) {
      const radius = 18 + Math.random() * 28;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      pos[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.8;
      pos[i * 3 + 2] = -radius * Math.abs(Math.cos(phi)) - 4; // Bias deep into background

      const mixed = Math.random() < 0.5
        ? new THREE.Color().copy(deepBlue).lerp(deepCyan, Math.random())
        : new THREE.Color().copy(deepBlue).lerp(violet, Math.random());

      col[i * 3 + 0] = mixed.r;
      col[i * 3 + 1] = mixed.g;
      col[i * 3 + 2] = mixed.b;
    }
    return { pos, col, count };
  }, []);

  useFrame((state, delta) => {
    if (reducedMotion) return;
    const t = state.clock.elapsedTime;

    // Foreground subtle float
    if (foregroundRef.current) {
      foregroundRef.current.position.y = Math.sin(t * 0.25) * 0.2;
      foregroundRef.current.position.x = Math.cos(t * 0.2) * 0.15;
    }

    // Midground slow cosmic spin
    if (midgroundRef.current) {
      midgroundRef.current.rotation.y += delta * 0.012;
      midgroundRef.current.rotation.x = Math.sin(t * 0.08) * 0.02;
    }

    // Deep cosmos very slow drift
    if (deepCosmosRef.current) {
      deepCosmosRef.current.rotation.y += delta * 0.004;
    }
  });

  return (
    <group>
      {/* 1. Foreground Bokeh Particles (Large, Soft, Additive) */}
      <points ref={foregroundRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[foregroundData.pos, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[foregroundData.col, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.28}
          vertexColors
          transparent
          opacity={0.32}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* 2. Midground Synaptic Dust */}
      <points ref={midgroundRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[midgroundData.pos, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[midgroundData.col, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.09}
          vertexColors
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* 3. Deep Background Cosmos */}
      <points ref={deepCosmosRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[deepCosmosData.pos, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[deepCosmosData.col, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          vertexColors
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
}
