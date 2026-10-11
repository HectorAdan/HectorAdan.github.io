import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SectorId } from '../../types/portfolio';
import { ENTRANCE_DURATION, type EntrancePhase } from '../../utils/entrance';

interface CameraControllerProps {
  activeSector: SectorId;
  isIntroPlaying: boolean;
  onIntroComplete?: () => void;
  reducedMotion?: boolean;
  entrancePhase?: EntrancePhase;
}
export function CameraController({ activeSector, isIntroPlaying, reducedMotion = false, entrancePhase = 'done' }: CameraControllerProps) {
  const { camera, pointer, size, invalidate } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 9.5));
  const look = useRef(new THREE.Vector3());
  const currentLook = useRef(new THREE.Vector3());
  const startPosition = useRef(new THREE.Vector3());
  const startLook = useRef(new THREE.Vector3());
  const desired = useRef(new THREE.Vector3());
  const parallax = useRef(new THREE.Vector2());
  const elapsed = useRef(1.1);
  const portrait = size.width < 768;
  useEffect(() => {
    startPosition.current.copy(camera.position);
    startPosition.current.x -= parallax.current.x;
    startPosition.current.y -= parallax.current.y;
    startLook.current.copy(currentLook.current);
    elapsed.current = 0;
    const distance = portrait ? Math.max(10, 4.2 / (size.width / size.height)) : 9.5;
    if (entrancePhase === 'waiting' && !reducedMotion) {
      target.current.set(portrait ? 0 : 1.15, portrait ? 1.5 : .25, distance + 2.5);
      look.current.set(portrait ? 0 : 1.15, portrait ? 1.5 : .25, 0);
      camera.position.copy(target.current);
      currentLook.current.copy(look.current);
      startPosition.current.copy(target.current);
      startLook.current.copy(look.current);
      parallax.current.set(0, 0);
      camera.lookAt(currentLook.current);
      invalidate();
      return;
    }
    if (isIntroPlaying) {
      target.current.set(portrait ? 0 : 1.15, portrait ? 1.5 : .25, portrait ? distance : 7);
      look.current.set(portrait ? 0 : 1.15, portrait ? 1.5 : .25, 0);
    } else if (activeSector === 'home' || portrait) {
      target.current.set(0, 0, distance);
      look.current.set(0, 0, 0);
    } else {
      const drawerWidth = size.width >= 1024 ? 650 : 580;
      const availableWidth = Math.max(size.width - drawerWidth, 140);
      const halfFov = THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov / 2);
      const depth = Math.max(9.5, 3.9 * size.height / (2 * Math.tan(halfFov) * availableWidth));
      const worldPerPixel = 2 * Math.tan(halfFov) * depth / size.height;
      const center = 1.15 + drawerWidth * worldPerPixel / 2;
      target.current.set(center, .25, depth);
      look.current.set(center, .25, 0);
    }
    if (reducedMotion) {
      camera.position.copy(target.current);
      currentLook.current.copy(look.current);
      camera.lookAt(currentLook.current);
    }
    invalidate();
  }, [activeSector, isIntroPlaying, reducedMotion, entrancePhase, camera, portrait, size.width, size.height, invalidate]);
  useFrame((_, delta) => {
    if (reducedMotion) return;
    const dt = Math.min(delta, .05);
    const duration = entrancePhase === 'playing' ? ENTRANCE_DURATION / 1000 : 1.1;
    elapsed.current = Math.min(duration, elapsed.current + dt);
    const progress = elapsed.current / duration;
    // Quintic easing has zero velocity and acceleration at both ends.
    const ease = progress * progress * progress * (progress * (progress * 6 - 15) + 10);
    desired.current.lerpVectors(startPosition.current, target.current, ease);
    const canParallax = activeSector === 'home' && !portrait && !isIntroPlaying && entrancePhase === 'done';
    parallax.current.x = THREE.MathUtils.damp(parallax.current.x, canParallax ? pointer.x * .16 : 0, 3.5, dt);
    parallax.current.y = THREE.MathUtils.damp(parallax.current.y, canParallax ? pointer.y * .11 : 0, 3.5, dt);
    desired.current.x += parallax.current.x;
    desired.current.y += parallax.current.y;
    camera.position.copy(desired.current);
    currentLook.current.lerpVectors(startLook.current, look.current, ease);
    camera.lookAt(currentLook.current);
  });
  return null;
}
