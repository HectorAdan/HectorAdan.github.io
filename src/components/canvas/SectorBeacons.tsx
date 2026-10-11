import { useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { SectorId } from '../../types/portfolio';
import { SECTORS } from '../../data/portfolioData';
import { SPATIAL_SECTORS, getBeaconPosition } from './SectorPaths';

interface SectorBeaconsProps {
  activeSector: SectorId;
  previewSector: SectorId | null;
  onPreviewSector: (sector: SectorId | null) => void;
  onSelectSector: (sector: SectorId) => void;
  reducedMotion?: boolean;
  portal: RefObject<HTMLDivElement | null>;
}
export function SectorBeacons({ activeSector, previewSector, onPreviewSector, onSelectSector, reducedMotion = false, portal }: SectorBeaconsProps) {
  return <group>{SPATIAL_SECTORS.map(id => <Beacon key={id} sectorId={id} active={activeSector === id} highlighted={previewSector === id} onPreview={onPreviewSector} onSelect={() => onSelectSector(id)} reducedMotion={reducedMotion} portal={portal} />)}</group>;
}
function Beacon({ sectorId, active, highlighted, onPreview, onSelect, reducedMotion, portal }: {
  sectorId: SectorId; active: boolean; highlighted: boolean;
  onPreview: (sector: SectorId | null) => void; onSelect: () => void;
  reducedMotion: boolean; portal: RefObject<HTMLDivElement | null>;
}) {
  const config = SECTORS[sectorId];
  const basePosition = useMemo(() => getBeaconPosition(sectorId), [sectorId]);
  const group = useRef<THREE.Group>(null);
  const marker = useRef<THREE.Mesh>(null);
  useFrame(({ clock }, delta) => {
    if (group.current && !reducedMotion) group.current.position.y = basePosition.y + Math.sin(clock.elapsedTime * .3 + basePosition.x) * .035;
    if (marker.current) {
      const target = active || highlighted ? 1.8 : 1;
      marker.current.scale.setScalar(reducedMotion ? target : THREE.MathUtils.damp(marker.current.scale.x, target, 7, Math.min(delta, .05)));
    }
  });
  return <group ref={group} position={basePosition}>
    <mesh onClick={e => { e.stopPropagation(); onSelect(); }}
      onPointerOver={e => { e.stopPropagation(); onPreview(sectorId); }} onPointerOut={() => onPreview(null)}>
      <sphereGeometry args={[.34, 12, 8]} />
      <meshBasicMaterial visible={false} />
    </mesh>
    <mesh ref={marker}>
      <sphereGeometry args={[.04, 10, 8]} />
      <meshBasicMaterial color={active || highlighted ? '#d5f4fa' : sectorId === 'experience' ? '#9c8cc7' : '#96d5df'} />
    </mesh>
    <Html portal={portal as RefObject<HTMLElement>} position={[0, -.24, 0]} center zIndexRange={[9, 0]}>
      <button className={`spatial-label ${active ? 'is-active' : ''} ${highlighted ? 'is-preview' : ''}`} onClick={onSelect}
        onPointerEnter={e => { if (e.pointerType === 'mouse') onPreview(sectorId); }}
        onPointerLeave={e => { if (document.activeElement !== e.currentTarget) onPreview(null); }}
        onFocus={() => onPreview(sectorId)} onBlur={() => onPreview(null)}
        aria-label={`Open ${config.label} section`} aria-pressed={active}>
        <span>{config.label}</span><span aria-hidden="true">↗</span>
      </button>
    </Html>
  </group>;
}
