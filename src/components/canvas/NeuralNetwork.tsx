import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SectorId } from '../../types/portfolio';
import { SECTORS } from '../../data/portfolioData';
import { seededRandom, neuralGraph, neuralPointVertex, neuralPointFragment, neuralLineVertex, neuralLineFragment } from './neuralGeometry';

interface NeuralNetworkProps {
  activeSector: SectorId;
  onSelectSector: (sector: SectorId) => void;
  reducedMotion?: boolean;
  compact?: boolean;
}

export function NeuralNetwork({ activeSector, onSelectSector, reducedMotion = false, compact = false }: NeuralNetworkProps) {
  const group = useRef<THREE.Group>(null);
  const pointMaterial = useRef<THREE.ShaderMaterial>(null);
  const lineMaterial = useRef<THREE.ShaderMaterial>(null);
  const time = useRef(0);
  const { gl } = useThree();
  const data = useMemo(() => {
    const random = seededRandom(83);
    const vertices: THREE.Vector3[] = [];
    const colors: number[] = [];
    for (let i = 0; i < (compact ? 48 : 78); i++) {
      // Leave an open center; three distant layers frame the identity, rather than cross it.
      const theta = random() * Math.PI * 2;
      const radius = 5 + random() * 7;
      vertices.push(new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius * .65, -3 - random() * 13));
      const c = new THREE.Color(i % 6 === 0 ? '#69558e' : '#346780');
      colors.push(c.r, c.g, c.b);
    }
    return { vertices, positions: new Float32Array(vertices.flatMap(p => p.toArray())), colors: new Float32Array(colors), graph: neuralGraph(vertices, 2, 4.6) };
  }, [compact]);
  const pointUniforms = useMemo(() => ({ uTime: { value: 0 }, uMotion: { value: 0 }, uSize: { value: 3 }, uPixelRatio: { value: gl.getPixelRatio() } }), [gl]);
  const lineUniforms = useMemo(() => ({ uTime: { value: 0 }, uMotion: { value: 0 }, uOpacity: { value: .1 }, uColor: { value: new THREE.Color('#25465d') } }), []);
  useFrame((_, delta) => {
    if (!group.current || !pointMaterial.current || !lineMaterial.current) return;
    if (!reducedMotion) {
      time.current += Math.min(delta, .05);
      group.current.rotation.y = Math.sin(time.current * .06) * .06;
      group.current.position.y = Math.sin(time.current * .08) * .12;
    }
    pointUniforms.uTime.value = lineUniforms.uTime.value = time.current;
    pointUniforms.uMotion.value = lineUniforms.uMotion.value = reducedMotion ? 0 : 1;
    pointUniforms.uPixelRatio.value = gl.getPixelRatio();
  });
  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[data.colors, 3]} />
        </bufferGeometry>
        <shaderMaterial ref={pointMaterial} uniforms={pointUniforms} vertexShader={neuralPointVertex} fragmentShader={neuralPointFragment} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.graph.positions, 3]} />
          <bufferAttribute attach="attributes-aProgress" args={[data.graph.progress, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[data.graph.phase, 1]} />
        </bufferGeometry>
        <shaderMaterial ref={lineMaterial} uniforms={lineUniforms} vertexShader={neuralLineVertex} fragmentShader={neuralLineFragment} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      {/* Preserve navigation from environmental nodes, with a small number of shared instances. */}
      <RelayNodes activeSector={activeSector} onSelectSector={onSelectSector} />
    </group>
  );
}

function RelayNodes({ activeSector, onSelectSector }: Pick<NeuralNetworkProps, 'activeSector' | 'onSelectSector'>) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const sectors: SectorId[] = ['about', 'projects', 'experience', 'contact'];
  const matrices = useMemo(() => sectors.map(id => {
    const p = new THREE.Vector3(...SECTORS[id].position).multiplyScalar(1.2);
    return new THREE.Matrix4().compose(p, new THREE.Quaternion(), new THREE.Vector3(.025, .025, .025));
  }), []);
  return <instancedMesh ref={mesh} args={[undefined, undefined, 4]} onUpdate={m => { matrices.forEach((matrix, i) => m.setMatrixAt(i, matrix)); m.instanceMatrix.needsUpdate = true; }}
    onClick={e => { if (e.instanceId !== undefined) { e.stopPropagation(); onSelectSector(sectors[e.instanceId]); } }}>
    <sphereGeometry args={[1, 8, 6]} />
    <meshBasicMaterial color={activeSector === 'home' ? '#527589' : '#78c4d5'} />
  </instancedMesh>;
}
