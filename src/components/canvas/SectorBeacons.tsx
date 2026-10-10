import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { SectorId } from '../../types/portfolio';
import { SECTORS } from '../../data/portfolioData';

interface SectorBeaconsProps {
  activeSector: SectorId;
  onSelectSector: (sector: SectorId) => void;
  reducedMotion?: boolean;
}

export function SectorBeacons({ activeSector, onSelectSector, reducedMotion = false }: SectorBeaconsProps) {
  const sectorList = ['about', 'projects', 'experience', 'contact'] as SectorId[];

  return (
    <group>
      {sectorList.map((secId) => (
        <SingleBeacon
          key={secId}
          sectorId={secId}
          isActive={activeSector === secId}
          onSelect={() => onSelectSector(secId)}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  );
}

function SingleBeacon({
  sectorId,
  isActive,
  onSelect,
  reducedMotion,
}: {
  sectorId: SectorId;
  isActive: boolean;
  onSelect: () => void;
  reducedMotion: boolean;
}) {
  const config = SECTORS[sectorId];
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (reducedMotion) return;
    const t = state.clock.elapsedTime;

    if (coreRef.current) {
      coreRef.current.rotation.y += delta * (isActive ? 1.5 : hovered ? 2.0 : 0.8);
      coreRef.current.rotation.x = Math.sin(t * 1.5) * 0.2;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * (isActive ? 1.8 : hovered ? 2.2 : 0.6);
    }

    if (groupRef.current) {
      groupRef.current.position.y = config.position[1] + Math.sin(t * 1.2 + config.position[0]) * 0.15;
    }
  });

  const baseColor = config.color;
  const isSelectedOrHovered = isActive || hovered;

  return (
    <group
      ref={groupRef}
      position={config.position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* Central Spinning Crystal Octahedron */}
      <mesh ref={coreRef} scale={isSelectedOrHovered ? 1.3 : 1.0}>
        <octahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={isSelectedOrHovered ? 3.0 : 1.4}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Orbiting Telemetry Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.75, 0.015, 16, 48]} />
        <meshStandardMaterial
          color={config.accentColor}
          emissive={config.accentColor}
          emissiveIntensity={isSelectedOrHovered ? 2.5 : 1.0}
        />
      </mesh>

      {/* Outer Pulse Corona */}
      <mesh scale={isSelectedOrHovered ? 1.4 : 1.0}>
        <sphereGeometry args={[0.85, 16, 16]} />
        <meshBasicMaterial
          color={baseColor}
          transparent
          opacity={isSelectedOrHovered ? 0.22 : 0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Interactive 3D Beacon Label */}
      <Html
        position={[0, -0.9, 0]}
        center
        distanceFactor={11}
        className="pointer-events-none select-none"
      >
        <div
          className={`flex flex-col items-center px-3 py-1.5 rounded border transition-all duration-300 font-mono text-xs backdrop-blur-md ${
            isSelectedOrHovered
              ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.4)] scale-105'
              : 'bg-black/60 border-cyan-900/60 text-cyan-400/80 hover:border-cyan-500'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold tracking-wider uppercase text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            {config.label}
          </div>
          <span className="text-[9px] text-cyan-500/70">{config.code}</span>
        </div>
      </Html>
    </group>
  );
}
