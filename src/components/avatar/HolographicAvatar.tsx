import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { sampleAvatar } from './sampleAvatar';
import { avatarLineFragment, avatarLineVertex, avatarPointFragment, avatarPointVertex, avatarShellFragment, avatarShellVertex, avatarSolidFragment } from './avatarShaders';
import { glowFragment, glowVertex } from '../canvas/neuralGeometry';
import { identityCoreLayout, type IdentityPresentation } from '../../utils/identityIntroduction';
import { MORPH_CHANNELS, type AvatarMorphPose } from './morphChannels';

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
  emergingIdentity?: boolean;
  morphPose?: AvatarMorphPose;
  particles?: boolean;
  solid?: boolean;
  portraitParticles?: boolean;
  faceContoursVisible?: boolean;
}

export function HolographicAvatar({ surface, compact, paused, shell, pathways, onSampled, presentation, surfaceOpacity = 1, projector = true, emergingIdentity = false, morphPose, particles = true, solid = false, portraitParticles = false, faceContoursVisible = true }: Props) {
  const { gl, size } = useThree();
  const samples = useMemo(() => sampleAvatar(surface, compact, emergingIdentity, portraitParticles), [surface, compact, emergingIdentity, portraitParticles]);
  const pointMaterial = useRef<THREE.ShaderMaterial>(null);
  const shellMaterial = useRef<THREE.ShaderMaterial>(null);
  const lineMaterial = useRef<THREE.ShaderMaterial>(null);
  const time = useRef(0);
  const defines = useMemo(() => morphPose ? { AVATAR_MORPHS: 1 } : {}, [morphPose]);
  const styleUniforms = useMemo(() => {
    surface.computeBoundingBox();
    const size = surface.boundingBox!.getSize(new THREE.Vector3());
    return { uEmergence: { value: emergingIdentity ? 1 : 0 }, uPortrait: { value: portraitParticles ? 1 : 0 }, uContours: { value: faceContoursVisible ? 1 : 0 }, uFaceExtent: { value: new THREE.Vector2(size.x * .5, size.y * .5) }, uMorphWeights: { value: new Float32Array(MORPH_CHANNELS.length) } };
  }, [surface, emergingIdentity, portraitParticles, faceContoursVisible]);
  const pointUniforms = useMemo(() => ({ ...styleUniforms, uTime: { value: 0 }, uPixelRatio: { value: gl.getPixelRatio() }, uReveal: { value: presentation ? 0 : 1 }, uAssembly: { value: 0 }, uCoreAssembly: { value: presentation ? 1 : 0 }, uCoreOrigin: { value: new THREE.Vector3() }, uCoreRadius: { value: 1.92 }, uIntensity: { value: portraitParticles ? compact ? 2.8 : 2.4 : presentation ? compact ? 1.7 : 1.3 : 1 } }), [gl, presentation, compact, portraitParticles, styleUniforms]);
  const shellUniforms = useMemo(() => ({ ...styleUniforms, uTime: { value: 0 }, uReveal: { value: presentation ? 0 : 1 }, uSurfaceOpacity: { value: surfaceOpacity },
    uSolidBlue: { value: new THREE.Color('#316b9a') }, uSolidCyan: { value: new THREE.Color('#82d9ee') }, uSolidViolet: { value: new THREE.Color('#9280c7') } }), [presentation, surfaceOpacity, styleUniforms]);
  const lineUniforms = useMemo(() => ({ ...styleUniforms, uTime: { value: 0 }, uMotion: { value: 1 }, uReveal: { value: presentation ? 0 : 1 }, uOpacity: { value: emergingIdentity ? .5 : .09 }, uColor: { value: new THREE.Color(emergingIdentity ? '#65b7cd' : '#43849e') } }), [presentation, emergingIdentity, styleUniforms]);
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
    const merge = presentation?.current.merge ?? 0;
    // The source cloud follows the retained Core in the face's local coordinates.
    const layout = identityCoreLayout(merge, size.width < 768);
    pointUniforms.uCoreOrigin.value.set(0, 0, -merge * .75 / .86);
    pointUniforms.uCoreRadius.value = layout.radius / .86;
    shellUniforms.uReveal.value = reveal * (1 - assembly);
    lineUniforms.uReveal.value = reveal * THREE.MathUtils.smoothstep(1 - assembly, .5, 1);
    lineUniforms.uMotion.value = paused ? 0 : 1;
    if (morphPose) for (const material of [pointMaterial.current, shellMaterial.current, lineMaterial.current]) {
      if (!material) continue;
      MORPH_CHANNELS.forEach((channel, i) => { material.uniforms.uMorphWeights.value[i] = THREE.MathUtils.clamp(morphPose?.current[channel.name] ?? 0, 0, 1); });
    }
    // Update the mounted materials; R3F can replace uniform containers on reconciliation.
    if (pointMaterial.current) {
      pointMaterial.current.uniforms.uTime.value = time.current;
      pointMaterial.current.uniforms.uPixelRatio.value = gl.getPixelRatio();
      pointMaterial.current.uniforms.uReveal.value = reveal;
      pointMaterial.current.uniforms.uAssembly.value = assembly;
      pointMaterial.current.uniforms.uCoreOrigin.value.copy(pointUniforms.uCoreOrigin.value);
      pointMaterial.current.uniforms.uCoreRadius.value = pointUniforms.uCoreRadius.value;
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
      <shaderMaterial key={solid ? 'solid' : 'holographic'} ref={shellMaterial} defines={defines} vertexShader={avatarShellVertex} fragmentShader={solid ? avatarSolidFragment : avatarShellFragment} uniforms={shellUniforms}
        transparent depthWrite={false} side={THREE.FrontSide} />
    </mesh>}
    {particles && <points renderOrder={2}>
      <primitive object={samples.points} attach="geometry" />
      <shaderMaterial ref={pointMaterial} defines={defines} vertexShader={avatarPointVertex} fragmentShader={avatarPointFragment} uniforms={pointUniforms}
        transparent vertexColors depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>}
    {pathways && <lineSegments renderOrder={1}>
      <primitive object={samples.pathways} attach="geometry" />
      <shaderMaterial ref={lineMaterial} defines={defines} vertexShader={avatarLineVertex} fragmentShader={avatarLineFragment} uniforms={lineUniforms}
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
