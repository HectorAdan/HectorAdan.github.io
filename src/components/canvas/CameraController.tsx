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
  onIntroComplete,
  reducedMotion = false,
}: CameraControllerProps) {
  const { camera, pointer } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 7.6));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));
  const currentLook = useRef(new THREE.Vector3(0, 0, 0));
  const smoothedPointer = useRef({ x: 0, y: 0 });
  const introStartTime = useRef<number | null>(null);

  // Set destination coordinates based on active sector
  useEffect(() => {
    if (activeSector === 'home') {
      targetPos.current.set(0, 0, 7.5);
      targetLook.current.set(0, 0, 0);
    } else {
      const config = SECTORS[activeSector];
      const secPos = new THREE.Vector3(...config.position);

      // Frame sector with an offset so the UI drawer leaves ample room for the 3D scene
      const cameraOffset = new THREE.Vector3(
        secPos.x * 0.42,
        secPos.y * 0.42,
        4.8
      );
      targetPos.current.copy(cameraOffset);
      targetLook.current.copy(secPos);
    }
  }, [activeSector]);

  // Intro sequence trigger
  useEffect(() => {
    if (isIntroPlaying) {
      introStartTime.current = performance.now();
    }
  }, [isIntroPlaying]);

  useFrame((state, delta) => {
    // 1. Intro Animation Sequence (Smooth S-curve surge, focal hold, graceful pullback)
    if (isIntroPlaying && introStartTime.current) {
      const elapsedSec = (performance.now() - introStartTime.current) / 1000;
      const totalDuration = 3.6;
      const progress = elapsedSec / totalDuration;

      if (progress < 1.0) {
        if (progress < 0.45) {
          // Surge towards avatar focal lock
          const t = progress / 0.45;
          const ease = t * t * (3 - 2 * t); // Smoothstep easing
          targetPos.current.set(
            Math.sin(ease * Math.PI) * 0.4,
            0.12,
            7.5 - ease * 3.35 // Glide in to 4.15
          );
          targetLook.current.set(0, 0.08, 0);
        } else if (progress < 0.72) {
          // Hold focal lock with subtle orbit
          const holdPhase = (progress - 0.45) / 0.27;
          targetPos.current.set(
            Math.sin(holdPhase * Math.PI * 0.8) * 0.6,
            0.12,
            4.15
          );
          targetLook.current.set(0, 0, 0);
        } else {
          // Return smoothly to hero overview
          const t = (progress - 0.72) / 0.28;
          const ease = t * t * (3 - 2 * t);
          targetPos.current.set(0, 0, 4.15 + ease * 3.35);
          targetLook.current.set(0, 0, 0);
        }
      } else {
        introStartTime.current = null;
        targetPos.current.set(0, 0, 7.5);
        targetLook.current.set(0, 0, 0);
        onIntroComplete?.();
      }
    }

    // 2. Heavy Steadicam Parallax Inertia (Damped pointer tracking)
    const pointerInertia = 0.06;
    smoothedPointer.current.x += (pointer.x - smoothedPointer.current.x) * pointerInertia;
    smoothedPointer.current.y += (pointer.y - smoothedPointer.current.y) * pointerInertia;

    const parallaxX = reducedMotion ? 0 : smoothedPointer.current.x * 0.75;
    const parallaxY = reducedMotion ? 0 : smoothedPointer.current.y * 0.5;

    const desiredCamX = targetPos.current.x + parallaxX;
    const desiredCamY = targetPos.current.y + parallaxY;
    const desiredCamZ = targetPos.current.z;

    // Cinematic Damped Camera Spring (smooth lerp with delta compensation)
    const dampFactor = reducedMotion ? 0.25 : Math.min(delta * 2.8, 0.08);
    camera.position.x += (desiredCamX - camera.position.x) * dampFactor;
    camera.position.y += (desiredCamY - camera.position.y) * dampFactor;
    camera.position.z += (desiredCamZ - camera.position.z) * dampFactor;

    currentLook.current.lerp(targetLook.current, dampFactor);
    camera.lookAt(currentLook.current);
  });

  return null;
}
