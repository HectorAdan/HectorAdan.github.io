import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { sampleAvatar } from './sampleAvatar';
import { avatarLineFragment, avatarLineVertex, avatarPointFragment, avatarPointVertex, avatarShellFragment, avatarShellVertex } from './avatarShaders';
import { glowFragment, glowVertex } from '../canvas/neuralGeometry';
import type { IdentityPresentation } from '../../utils/identityIntroduction';

interface Props {
  surface: THREE.BufferGeometry;
  compact: boolean;
  paused: boolean;
  shell: boolean;
  pathways: boolean;
  onSampled?: (particles: number, connections: number) => void;
  presentation?: IdentityPresentation;
  surfaceOpacity?: number;
  projector?: boolean;
}

export function HolographicAvatar({ surface, compact, paused, shell, pathways, onSampled, presentation, surfaceOpacity = 1, projector = true }: Props) {
  const { gl } = useThree();
  const samples = useMemo(() => sampleAvatar(surface, compact), [surface, compact]);
  const pointMaterial = useRef<THREE.ShaderMaterial>(null);
  const shellMaterial = useRef<THREE.ShaderMaterial>(null);
  const lineMaterial = useRef<THREE.ShaderMaterial>(null);
  const time = useRef(0);
  const pointUniforms = useMemo(() => ({ uTime: { value: 0 }, uPixelRatio: { value: gl.getPixelRatio() }, uReveal: { value: presentation ? 0 : 1 }, uAssembly: { value: 0 }, uIntensity: { value: presentation ? compact ? 1.55 : 1.15 : 1 } }), [gl, presentation, compact]);
  const shellUniforms = useMemo(() => ({ uTime: { value: 0 }, uReveal: { value: presentation ? 0 : 1 }, uSurfaceOpacity: { value: surfaceOpacity } }), [presentation, surfaceOpacity]);
  const lineUniforms = useMemo(() => ({ uTime: { value: 0 }, uMotion: { value: 1 }, uReveal: { value: presentation ? 0 : 1 }, uOpacity: { value: .09 }, uColor: { value: new THREE.Color('#43849e') } }), [presentation]);
  const glowUniforms = useMemo(() => ({ uColor: { value: new THREE.Color('#164365') }, uOpacity: { value: .3 } }), []);
  useEffect(() => {
    onSampled?.(samples.particleCount, samples.connectionCount);
    return () => samples.dispose();
  }, [samples, onSampled]);
  useFrame((_, delta) => {
    if (!paused) time.current += Math.min(delta, .05);
    pointUniforms.uTime.value = time.current;
    pointUniforms.uPixelRatio.value = gl.getPixelRatio();
    shellUniforms.uTime.value = time.current;
    lineUniforms.uTime.value = time.current;
    const reveal = presentation?.current.face ?? 1;
    const assembly = presentation?.current.assembly ?? 0;
    pointUniforms.uReveal.value = reveal;
    pointUniforms.uAssembly.value = assembly;
    shellUniforms.uReveal.value = reveal * (1 - assembly);
    lineUniforms.uReveal.value = reveal * THREE.MathUtils.smoothstep(1 - assembly, .5, 1);
    lineUniforms.uMotion.value = paused ? 0 : 1;
    // Update the mounted materials; R3F can replace uniform containers on reconciliation.
    if (pointMaterial.current) {
      pointMaterial.current.uniforms.uTime.value = time.current;
      pointMaterial.current.uniforms.uPixelRatio.value = gl.getPixelRatio();
      pointMaterial.current.uniforms.uReveal.value = reveal;
      pointMaterial.current.uniforms.uAssembly.value = assembly;
      pointMaterial.current.uniforms.uIntensity.value = pointUniforms.uIntensity.value;
    }
    if (shellMaterial.current) {
      shellMaterial.current.uniforms.uTime.value = time.current;
      shellMaterial.current.uniforms.uReveal.value = shellUniforms.uReveal.value;
    }
    if (lineMaterial.current) {
      lineMaterial.current.uniforms.uTime.value = time.current;
      lineMaterial.current.uniforms.uReveal.value = lineUniforms.uReveal.value;
      lineMaterial.current.uniforms.uMotion.value = paused ? 0 : 1;
    }
  });
  return <group>
    {/* The source surface is owned by the loader, not by R3F's auto-disposal. */}
    {shell && <mesh renderOrder={0}>
      <primitive object={surface} attach="geometry" />
      <shaderMaterial ref={shellMaterial} vertexShader={avatarShellVertex} fragmentShader={avatarShellFragment} uniforms={shellUniforms}
        transparent depthWrite={false} side={THREE.FrontSide} />
    </mesh>}
    <points renderOrder={2}>
      <primitive object={samples.points} attach="geometry" />
      <shaderMaterial ref={pointMaterial} vertexShader={avatarPointVertex} fragmentShader={avatarPointFragment} uniforms={pointUniforms}
        transparent vertexColors depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
    {pathways && <lineSegments renderOrder={1}>
      <primitive object={samples.pathways} attach="geometry" />
      <shaderMaterial ref={lineMaterial} vertexShader={avatarLineVertex} fragmentShader={avatarLineFragment} uniforms={lineUniforms}
        transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </lineSegments>}
    {projector && <><mesh position={[0, -1.94, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.71, 1.715, compact ? 64 : 100]} />
      <meshBasicMaterial color="#417187" transparent opacity={.26} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, -1.935, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[5, 5]} />
      <shaderMaterial vertexShader={glowVertex} fragmentShader={glowFragment} uniforms={glowUniforms}
        transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
    </mesh></>}
  </group>;
}
