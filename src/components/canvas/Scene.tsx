import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { SectorId } from '../../types/portfolio';
import { ParticleField } from './ParticleField';
import { NeuralNetwork } from './NeuralNetwork';
import { HoloAvatar, AvatarRenderMode } from './HoloAvatar';
import { SectorBeacons } from './SectorBeacons';
import { CameraController } from './CameraController';

interface SceneProps {
  activeSector: SectorId;
  onSelectSector: (sector: SectorId) => void;
  isIntroPlaying: boolean;
  onIntroComplete?: () => void;
  reducedMotion?: boolean;
  avatarMode?: AvatarRenderMode;
  onAvatarClick?: () => void;
}

export function Scene({
  activeSector,
  onSelectSector,
  isIntroPlaying,
  onIntroComplete,
  reducedMotion = false,
  avatarMode = 'hologram',
  onAvatarClick,
}: SceneProps) {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-auto">
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 44, near: 0.1, far: 120 }}
        dpr={[1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 2, 2)]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.setClearColor('#010309', 1);
        }}
      >
        {/* Cinematic Atmospheric Lighting Scheme */}
        <ambientLight intensity={0.7} color="#050e26" />

        {/* Key Light (Restrained Cyan from top-front) */}
        <directionalLight position={[6, 9, 6]} intensity={2.2} color="#00f0ff" />

        {/* Dedicated Avatar Backlight / Rim Light (Creates Radiant Silhouette) */}
        <pointLight position={[0, 0, -1.0]} intensity={3.5} color="#00f0ff" distance={10} />

        {/* Left Fill Accent (Electric Sky Blue) */}
        <pointLight position={[-8, 4, 3]} intensity={1.8} color="#38bdf8" distance={24} />

        {/* Bottom-Right Deep Counter-Light (Soft Indigo Depth) */}
        <pointLight position={[6, -6, 2]} intensity={1.4} color="#6366f1" distance={22} />

        {/* Spatial Atmospheric Fog for Cinematic Depth Falloff */}
        <fog attach="fog" args={['#010309', 6, 35]} />

        <Suspense fallback={null}>
          {/* Layered Multi-Tier Particle System (Foreground, Midground, Deep Cosmos) */}
          <ParticleField reducedMotion={reducedMotion} />

          {/* Layered Neural Graph & Luminous Arterial Conduits */}
          <NeuralNetwork
            activeSector={activeSector}
            onSelectSector={onSelectSector}
            reducedMotion={reducedMotion}
          />

          {/* Central Main Character - Holographic Avatar Nexus */}
          <HoloAvatar
            isIntroPlaying={isIntroPlaying}
            onAvatarClick={onAvatarClick}
            reducedMotion={reducedMotion}
            avatarMode={avatarMode}
          />

          {/* Interactive Navigation Sector Beacons */}
          <SectorBeacons
            activeSector={activeSector}
            onSelectSector={onSelectSector}
            reducedMotion={reducedMotion}
          />

          {/* Cinematic Inertia Camera Controller */}
          <CameraController
            activeSector={activeSector}
            isIntroPlaying={isIntroPlaying}
            onIntroComplete={onIntroComplete}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
