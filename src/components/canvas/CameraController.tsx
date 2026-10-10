import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SectorId } from '../../types/portfolio';
import { SECTORS } from '../../data/portfolioData';

interface CameraControllerProps {
  activeSector: SectorId;
  isIntroPlaying: boolean;
  onIntroComplete?: () => void;
  reducedMotion?: boolean;
}

export function CameraController({
  activeSector,
  isIntroPlaying,
  reducedMotion = false,
}: CameraControllerProps) {
  const { camera, pointer } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 7.5));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));
  const currentLook = useRef(new THREE.Vector3(0, 0, 0));
  const smoothedPointer = useRef({ x: 0, y: 0 });

  // Update target coordinates based on active sector and intro inspection mode
  useEffect(() => {
    if (isIntroPlaying) {
      // Zoom close into avatar for dedicated focal inspection
      targetPos.current.set(0, 0.12, 3.4);
      targetLook.current.set(0, 0.05, 0);
    } else if (activeSector === 'home') {
      // Wide hero overview
      targetPos.current.set(0, 0, 7.5);
      targetLook.current.set(0, 0, 0);
    } else {
      const config = SECTORS[activeSector];
      const secPos = new THREE.Vector3(...config.position);

      // Frame sector with an offset so the UI drawer leaves room for the 3D scene
      const cameraOffset = new THREE.Vector3(
        secPos.x * 0.42,
        secPos.y * 0.42,
        4.8
      );
      targetPos.current.copy(cameraOffset);
      targetLook.current.copy(secPos);
    }
  }, [activeSector, isIntroPlaying]);

  useFrame((state, delta) => {
    // 1. Damped Mouse Parallax Tracking
    const pointerInertia = 0.06;
    smoothedPointer.current.x += (pointer.x - smoothedPointer.current.x) * pointerInertia;
    smoothedPointer.current.y += (pointer.y - smoothedPointer.current.y) * pointerInertia;

    // Subtler parallax during close-up intro so avatar stays centered
    const parallaxMultiplier = isIntroPlaying ? 0.25 : 0.75;
    const parallaxX = reducedMotion ? 0 : smoothedPointer.current.x * parallaxMultiplier;
    const parallaxY = reducedMotion ? 0 : smoothedPointer.current.y * (parallaxMultiplier * 0.7);

    const desiredCamX = targetPos.current.x + parallaxX;
    const desiredCamY = targetPos.current.y + parallaxY;
    const desiredCamZ = targetPos.current.z;

    // Cinematic Spring (smooth lerp)
    const dampFactor = isIntroPlaying
      ? 0.09
      : reducedMotion
      ? 0.25
      : Math.min(delta * 3.2, 0.09);

    camera.position.x += (desiredCamX - camera.position.x) * dampFactor;
    camera.position.y += (desiredCamY - camera.position.y) * dampFactor;
    camera.position.z += (desiredCamZ - camera.position.z) * dampFactor;

    currentLook.current.lerp(targetLook.current, dampFactor);
    camera.lookAt(currentLook.current);
  });

  return null;
}
