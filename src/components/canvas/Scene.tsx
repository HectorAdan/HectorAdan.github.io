import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { SectorId } from '../../types/portfolio';
import { ParticleField } from './ParticleField';
import { NeuralNetwork } from './NeuralNetwork';
import type { AvatarRenderMode } from './HoloAvatar';
import { NeuralIdentity } from './NeuralIdentity';
import type { IntroductionVoice } from '../../utils/introductionVoice';
import type { IdentityStatus } from '../../utils/identityIntroduction';
import { SectorBeacons } from './SectorBeacons';
import { SectorPaths } from './SectorPaths';
import { CameraController } from './CameraController';
import { WebGLFallback } from '../ui/WebGLFallback';
import type { EntrancePhase } from '../../utils/entrance';

const CAMERA = { position: [0, 0, 9.5] as [number, number, number], fov: 44, near: .1, far: 80 };

export interface SceneProps {
  activeSector: SectorId;
  previewSector: SectorId | null;
  onPreviewSector: (sector: SectorId | null) => void;
  onSelectSector: (sector: SectorId) => void;
  isIntroPlaying: boolean;
  introRun?: number;
  introductionVoice?: IntroductionVoice;
  speechActive?: boolean;
  onIdentityStatus?: (status: IdentityStatus) => void;
  onIntroComplete?: () => void;
  reducedMotion?: boolean;
  avatarMode?: AvatarRenderMode;
  onAvatarClick?: () => void;
  onReady?: () => void;
  entrancePhase?: EntrancePhase;
}
class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode; onFailure?: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure?.(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

// A one-time downshift after warm-up; no React state updates inside the render loop.
function AdaptiveQuality() {
  const { setDpr } = useThree();
  const sample = useRef({ frames: 0, slow: 0, done: false });
  useFrame((_, delta) => {
    const s = sample.current;
    if (s.done || document.hidden) return;
    s.frames++;
    if (s.frames > 60 && delta > 1 / 35) s.slow++;
    if (s.frames === 240) {
      if (s.slow > 90) setDpr(.85);
      s.done = true;
    }
  });
  return null;
}
function ContextGuard({ onLost }: { onLost: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onLost(); };
    canvas.addEventListener('webglcontextlost', lost);
    return () => canvas.removeEventListener('webglcontextlost', lost);
  }, [gl, onLost]);
  return null;
}

function FirstFrame({ onReady }: { onReady?: () => void }) {
  const reported = useRef(false);
  useFrame(() => {
    if (reported.current) return;
    reported.current = true;
    onReady?.();
  });
  return null;
}

export function Scene({ activeSector, onSelectSector, isIntroPlaying, introRun = 0, introductionVoice, speechActive = false, onIdentityStatus, onIntroComplete, reducedMotion = false, avatarMode = 'hologram', onAvatarClick, previewSector, onPreviewSector, onReady, entrancePhase = 'done' }: SceneProps) {
  const labelPortal = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const handleContextLost = useCallback(() => { setFailed(true); onIdentityStatus?.('unavailable'); onReady?.(); }, [onReady, onIdentityStatus]);
  const [visible, setVisible] = useState(() => !document.hidden);
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 767px), (pointer: coarse)').matches);
  const dpr = useMemo<[number, number]>(() => [1, compact ? 1.15 : 1.65], [compact]);
  const glOptions = useMemo(() => ({ antialias: !compact, alpha: false, powerPreference: 'high-performance' as const, toneMapping: THREE.ACESFilmicToneMapping }), [compact]);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px), (pointer: coarse)');
    const update = () => setCompact(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  const fallback = <WebGLFallback activeSector={activeSector} onSelectSector={onSelectSector} reducedMotion={reducedMotion} />;
  if (failed) return fallback;
  return <SceneBoundary fallback={fallback} onFailure={handleContextLost}>
    <div className="absolute inset-0 w-full h-full pointer-events-auto" aria-label="Interactive neural environment">
      <div ref={labelPortal} className="absolute inset-0 pointer-events-none" />
      <Canvas camera={CAMERA}
        dpr={dpr} frameloop={!visible || (reducedMotion && !speechActive) ? 'demand' : 'always'}
        gl={glOptions}
        onCreated={({ gl }) => { gl.setClearColor('#03060c', 1); }} fallback={<span>3D view unavailable. Use the portfolio navigation to explore.</span>}>
        <ambientLight intensity={.2} color="#24324c" />
        <directionalLight position={[4, 5, 3]} intensity={.7} color="#85cbdc" />
        <fogExp2 attach="fog" args={['#03060c', .025]} />
        <Suspense fallback={null}>
          <ParticleField reducedMotion={reducedMotion} compact={compact} />
          <NeuralNetwork activeSector={activeSector} onSelectSector={onSelectSector} reducedMotion={reducedMotion} compact={compact} />
          <NeuralIdentity introductionVoice={introductionVoice} introRun={introRun} onIdentityStatus={onIdentityStatus} entrancePhase={entrancePhase} engaged={Boolean(previewSector) || activeSector !== 'home'} isIntroPlaying={isIntroPlaying} onAvatarClick={onAvatarClick} reducedMotion={reducedMotion} avatarMode={avatarMode} compact={compact} />
          {!compact && <SectorBeacons previewSector={previewSector} onPreviewSector={onPreviewSector} activeSector={activeSector} onSelectSector={onSelectSector} reducedMotion={reducedMotion} portal={labelPortal} />}
          {!compact && <SectorPaths highlightedSector={activeSector === 'home' ? previewSector : activeSector} reducedMotion={reducedMotion} />}
          <CameraController introRun={introRun} entrancePhase={entrancePhase} activeSector={activeSector} isIntroPlaying={isIntroPlaying} onIntroComplete={onIntroComplete} reducedMotion={reducedMotion} />
          <AdaptiveQuality />
          <ContextGuard onLost={handleContextLost} />
          <FirstFrame onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  </SceneBoundary>;
}
