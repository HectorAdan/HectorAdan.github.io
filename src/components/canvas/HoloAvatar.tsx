import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { seededRandom, neuralGraph, corePointVertex, neuralPointFragment, neuralLineVertex, neuralLineFragment, glowVertex, glowFragment } from './neuralGeometry';
import type { EntrancePhase } from '../../utils/entrance';
import { soundManager } from '../../utils/soundEffects';
import { identityCoreLayout, type IdentityPresentation } from '../../utils/identityIntroduction';

// Keep the existing public component and appearance controls; Phase 1 renders a core, not an avatar.
export type AvatarRenderMode = 'hologram' | 'silhouette' | 'matrix';
interface HoloAvatarProps {
  isIntroPlaying?: boolean;
  onAvatarClick?: () => void;
  reducedMotion?: boolean;
  avatarMode?: AvatarRenderMode;
  compact?: boolean;
  engaged?: boolean;
  entrancePhase?: EntrancePhase;
  presentation?: IdentityPresentation;
}

export function HoloAvatar({ isIntroPlaying = false, onAvatarClick, reducedMotion = false, avatarMode = 'hologram', compact = false, engaged = false, entrancePhase = 'done', presentation }: HoloAvatarProps) {
  const group = useRef<THREE.Group>(null);
  const root = useRef<THREE.Group>(null);
  const points = useRef<THREE.ShaderMaterial>(null);
  const lines = useRef<THREE.ShaderMaterial>(null);
  const glow = useRef<THREE.ShaderMaterial>(null), heart = useRef<THREE.ShaderMaterial>(null);
  const hovered = useRef(false);
  const time = useRef(0);
  const entranceElapsed = useRef(0);
  useEffect(() => { entranceElapsed.current = 0; }, [entrancePhase]);
  const { size, gl, invalidate } = useThree();
  useEffect(() => () => { gl.domElement.style.cursor = ''; }, [gl]);
  const portrait = size.width < 768;
  const data = useMemo(() => {
    const random = seededRandom(42);
    const vertices: THREE.Vector3[] = [];
    const colors: number[] = [];
    const cyan = new THREE.Color('#82d9ee');
    const blue = new THREE.Color('#316b9a');
    const violet = new THREE.Color('#9280c7');
    const layers = compact ? [240, 110, 45] : [390, 160, 65];
    layers.forEach((count, layer) => {
      const radius = [1.65, 1.15, .5][layer];
      for (let i = 0; i < count; i++) {
        const y = 1 - (i + .5) / count * 2;
        const theta = i * Math.PI * (3 - Math.sqrt(5)) + layer * .8;
        const r = radius * (.96 + random() * .08);
        const p = new THREE.Vector3(Math.cos(theta) * Math.sqrt(1 - y * y), y, Math.sin(theta) * Math.sqrt(1 - y * y)).multiplyScalar(r);
        vertices.push(p);
        const color = blue.clone().lerp(p.x < -.25 ? violet : cyan, .28 + random() * .65);
        color.multiplyScalar(p.z > 0 ? 1 : .55);
        colors.push(color.r, color.g, color.b);
      }
    });
    return { positions: new Float32Array(vertices.flatMap(p => p.toArray())), colors: new Float32Array(colors), graph: neuralGraph(vertices, 3, .56) };
  }, [compact]);
  const pointUniforms = useMemo(() => ({ uReveal: { value: 1 }, uPresence: { value: 1 }, uTime: { value: 0 }, uMotion: { value: 0 }, uSize: { value: compact ? 3.8 : 3.6 }, uPixelRatio: { value: gl.getPixelRatio() } }), [compact, gl]);
  const lineUniforms = useMemo(() => ({ uTime: { value: 0 }, uMotion: { value: 0 }, uOpacity: { value: .22 }, uColor: { value: new THREE.Color('#508ba5') } }), []);
  const glowUniforms = useMemo(() => ({ uColor: { value: new THREE.Color('#428fc0') }, uOpacity: { value: .22 } }), []);
  const heartUniforms = useMemo(() => ({ uColor: { value: new THREE.Color('#a1e9ff') }, uOpacity: { value: .7 } }), []);

  useFrame((_, delta) => {
    if (!group.current || !points.current || !lines.current) return;
    if (entrancePhase === 'playing') entranceElapsed.current += Math.min(delta, .05);
    const progress = reducedMotion || entrancePhase === 'done' ? 1 : entrancePhase === 'waiting' ? 0 : Math.min(1, entranceElapsed.current / 1.9);
    const presence = presentation?.current.core ?? 1;
    const merge = presentation?.current.merge ?? 0;
    const layout = identityCoreLayout(merge, portrait);
    if (root.current) {
      root.current.visible = presence > .001;
      root.current.position.set(portrait ? 0 : 1.15, (portrait ? 1.5 : .25) + layout.y + (reducedMotion ? 0 : Math.sin(time.current * .35) * .025 * merge), layout.z);
      // Expand and remain around the whole face, rather than sinking below it.
      root.current.scale.setScalar(layout.scale);
    }
    const reveal = THREE.MathUtils.smoothstep(progress, 0, 1);
    pointUniforms.uReveal.value = reveal;
    pointUniforms.uPresence.value = presence;
    heartUniforms.uOpacity.value = (.12 + reveal * .58) * presence * (1 - merge * .7);
    if (!reducedMotion) {
      time.current += Math.min(delta, .05);
      group.current.rotation.y = time.current * .045;
      group.current.rotation.z = Math.sin(time.current * .11) * .045;
    }
    group.current.scale.setScalar((portrait ? .92 : 1) * (1 + (reducedMotion ? 0 : Math.sin(time.current * .65) * .012)));
    points.current.uniforms.uTime.value = lines.current.uniforms.uTime.value = time.current;
    points.current.uniforms.uMotion.value = reducedMotion ? 0 : 1;
    lines.current.uniforms.uMotion.value = reducedMotion ? 0 : reveal * presence;
    points.current.uniforms.uPixelRatio.value = gl.getPixelRatio();
    lines.current.uniforms.uOpacity.value = (avatarMode === 'silhouette' ? .06 : avatarMode === 'matrix' ? .3 : .22) * THREE.MathUtils.smoothstep(reveal, .2, 1) * presence;
    const lit = hovered.current || isIntroPlaying || engaged;
    const opacity = (lit ? .33 : .22) * reveal * presence * (1 - merge * .45);
    glowUniforms.uOpacity.value = reducedMotion ? opacity : THREE.MathUtils.damp(glowUniforms.uOpacity.value, opacity, 5, Math.min(delta, .05));
    const pointSize = (compact ? 3.8 : 3.6) + (lit ? .45 : 0);
    pointUniforms.uSize.value = reducedMotion ? pointSize : THREE.MathUtils.damp(pointUniforms.uSize.value, pointSize, 5, Math.min(delta, .05));
    points.current.uniforms.uReveal.value = reveal;
    points.current.uniforms.uPresence.value = presence;
    points.current.uniforms.uSize.value = pointUniforms.uSize.value;
    points.current.uniforms.uPixelRatio.value = gl.getPixelRatio();
    lines.current.uniforms.uOpacity.value = lineUniforms.uOpacity.value;
    if (glow.current) glow.current.uniforms.uOpacity.value = glowUniforms.uOpacity.value;
    if (heart.current) heart.current.uniforms.uOpacity.value = heartUniforms.uOpacity.value;
  });

  return (
    <group ref={root} position={portrait ? [0, 1.5, 0] : [1.15, .25, 0]}>
      {/* Radial shader glows are confined to the nucleus: no full-scene bloom pass. */}
      <sprite scale={[5.6, 5.6, 1]}>
        <shaderMaterial ref={glow} uniforms={glowUniforms} vertexShader={glowVertex} fragmentShader={glowFragment} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite scale={[1.35, 1.35, 1]}>
        <shaderMaterial ref={heart} uniforms={heartUniforms} vertexShader={glowVertex} fragmentShader={glowFragment} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <group ref={group} rotation={[.18, 0, -.15]} scale={portrait ? .92 : 1}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[data.colors, 3]} />
          </bufferGeometry>
          <shaderMaterial ref={points} uniforms={pointUniforms} vertexShader={corePointVertex} fragmentShader={neuralPointFragment} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[data.graph.positions, 3]} />
            <bufferAttribute attach="attributes-aProgress" args={[data.graph.progress, 1]} />
            <bufferAttribute attach="attributes-aPhase" args={[data.graph.phase, 1]} />
          </bufferGeometry>
          <shaderMaterial ref={lines} uniforms={lineUniforms} vertexShader={neuralLineVertex} fragmentShader={neuralLineFragment} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </lineSegments>
      </group>
      {/* One invisible hit target keeps core inspection easy without per-point raycasts. */}
      <mesh onClick={e => { e.stopPropagation(); onAvatarClick?.(); }}
        onPointerOver={e => { e.stopPropagation(); if (!hovered.current) soundManager.playHover(); hovered.current = true; gl.domElement.style.cursor = 'pointer'; invalidate(); }}
        onPointerOut={() => { hovered.current = false; gl.domElement.style.cursor = ''; invalidate(); }}>
        <sphereGeometry args={[1.72, 16, 12]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}
