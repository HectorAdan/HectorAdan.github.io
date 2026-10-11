import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { HoloAvatar, type AvatarRenderMode } from './HoloAvatar';
import { HolographicAvatar } from '../avatar/HolographicAvatar';
import { loadAvatarSurface } from '../avatar/avatarSurface';
import { avatarPointFragment, avatarPointVertex } from '../avatar/avatarShaders';
import { seededRandom } from './neuralGeometry';
import { identityFrame, type IdentityPresentation, type IdentityStatus } from '../../utils/identityIntroduction';
import type { EntrancePhase } from '../../utils/entrance';

// Replace this self-contained, neutral GLB when the next personalized model is ready.
export const IDENTITY_MODEL_PATH = 'models/hector-mediapipe-poc.glb';
interface Props {
  isIntroPlaying: boolean;
  introRun: number;
  reducedMotion: boolean;
  compact: boolean;
  engaged: boolean;
  entrancePhase: EntrancePhase;
  avatarMode: AvatarRenderMode;
  onAvatarClick?: () => void;
  onIdentityStatus?: (status: IdentityStatus) => void;
}

function IdentityAtmosphere({ surface, compact, presentation, reducedMotion }: { surface: THREE.BufferGeometry; compact: boolean; presentation: IdentityPresentation; reducedMotion: boolean }) {
  const { gl } = useThree();
  const material = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(() => {
    const random = seededRandom(271), count = compact ? 72 : 180;
    const positions: number[] = [], normals: number[] = [], colors: number[] = [], seeds: number[] = [];
    const size = surface.boundingBox!.getSize(new THREE.Vector3());
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2, radius = 1.12 + random() * .4;
      positions.push(Math.cos(angle) * size.x * .5 * radius, Math.sin(angle) * size.y * .5 * radius, -.35 - random() * .9);
      normals.push(0, 0, 1); seeds.push(random());
      const color = new THREE.Color(i % 8 === 0 ? '#726793' : '#49899f').multiplyScalar(.38);
      colors.push(color.r, color.g, color.b);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1));
    g.computeBoundingSphere(); return g;
  }, [surface, compact]);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uPixelRatio: { value: gl.getPixelRatio() }, uReveal: { value: 0 }, uAssembly: { value: 0 }, uIntensity: { value: .65 } }), [gl]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((_, delta) => {
    if (!reducedMotion) uniforms.uTime.value += Math.min(delta, .05);
    uniforms.uReveal.value = presentation.current.face;
    uniforms.uPixelRatio.value = gl.getPixelRatio();
    if (material.current) {
      material.current.uniforms.uTime.value = uniforms.uTime.value;
      material.current.uniforms.uReveal.value = presentation.current.face;
      material.current.uniforms.uPixelRatio.value = gl.getPixelRatio();
    }
  });
  return <points>
    <primitive object={geometry} attach="geometry" />
    <shaderMaterial ref={material} uniforms={uniforms} vertexShader={avatarPointVertex} fragmentShader={avatarPointFragment} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} />
  </points>;
}

export function NeuralIdentity({ isIntroPlaying, introRun, reducedMotion, compact, onIdentityStatus, ...coreProps }: Props) {
  const { size, pointer, invalidate } = useThree();
  const [surface, setSurface] = useState<THREE.BufferGeometry | null>(null);
  const presentation = useRef({ core: 1, face: 0, assembly: 1 });
  const face = useRef<THREE.Group>(null);
  const elapsed = useRef(0), idle = useRef(0);
  useEffect(() => { elapsed.current = 0; invalidate(); }, [introRun, invalidate]);
  useEffect(() => {
    let cancelled = false, owned: THREE.BufferGeometry | null = null;
    onIdentityStatus?.('loading');
    loadAvatarSurface(`${import.meta.env.BASE_URL}${IDENTITY_MODEL_PATH}`).then(geometry => {
      if (cancelled) { geometry.dispose(); return; }
      owned = geometry; setSurface(geometry); onIdentityStatus?.('ready'); invalidate();
    }).catch(() => { if (!cancelled) onIdentityStatus?.('unavailable'); });
    return () => { cancelled = true; owned?.dispose(); };
  }, [onIdentityStatus, invalidate]);
  useFrame((_, delta) => {
    const dt = Math.min(delta, .05);
    if (isIntroPlaying && surface) elapsed.current += dt;
    const next = identityFrame(elapsed.current, isIntroPlaying, Boolean(surface), reducedMotion);
    const current = presentation.current;
    for (const key of ['core', 'face', 'assembly'] as const) {
      current[key] = reducedMotion ? next[key] : THREE.MathUtils.damp(current[key], next[key], 8, dt);
    }
    if (face.current) {
      face.current.visible = current.face > .001;
      if (!reducedMotion && face.current.visible) idle.current += dt;
      face.current.rotation.set(0, reducedMotion ? 0 : Math.sin(idle.current * .18) * .025 + (compact ? 0 : pointer.x * .025), reducedMotion ? 0 : Math.sin(idle.current * .13) * .008);
      face.current.position.y = reducedMotion ? 0 : Math.sin(idle.current * .35) * .025;
    }
  }, -1);
  const portrait = size.width < 768;
  return <>
    <HoloAvatar {...coreProps} compact={compact} isIntroPlaying={isIntroPlaying} reducedMotion={reducedMotion} presentation={presentation} />
    {surface && <group position={portrait ? [0, 1.5, 0] : [1.15, .25, 0]}>
      <group ref={face} scale={.86} visible={false}>
        <HolographicAvatar surface={surface} compact={compact} paused={reducedMotion} shell pathways presentation={presentation} surfaceOpacity={.16} projector={false} />
        <IdentityAtmosphere surface={surface} compact={compact} presentation={presentation} reducedMotion={reducedMotion} />
      </group>
    </group>}
  </>;
}
