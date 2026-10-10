import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PERSONAL_INFO } from '../../data/portfolioData';

export type AvatarRenderMode = 'hologram' | 'silhouette' | 'matrix';

interface HoloAvatarProps {
  isIntroPlaying?: boolean;
  onAvatarClick?: () => void;
  reducedMotion?: boolean;
  avatarMode?: AvatarRenderMode;
  videoSrc?: string;
  modelUrl?: string;
}

export function HoloAvatar({
  isIntroPlaying = false,
  onAvatarClick,
  reducedMotion = false,
  avatarMode = 'hologram',
  videoSrc,
}: HoloAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const midRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const backlightRef = useRef<THREE.Mesh>(null);
  const orbitalMotesRef = useRef<THREE.Points>(null);
  const [hovered, setHovered] = useState(false);

  // Load avatar photo texture safely with fallback
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    try {
      const tex = loader.load(PERSONAL_INFO.avatarUrl);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = true;
      return tex;
    } catch {
      return null;
    }
  }, []);

  // Video texture support hook for future talking avatar
  const videoTexture = useMemo(() => {
    if (!videoSrc) return null;
    const vid = document.createElement('video');
    vid.src = videoSrc;
    vid.crossOrigin = 'anonymous';
    vid.loop = true;
    vid.muted = true;
    vid.play();
    return new THREE.VideoTexture(vid);
  }, [videoSrc]);

  // Procedural canvas texture for neural silhouette fallback
  const silhouetteTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#020512';
      ctx.fillRect(0, 0, 512, 512);

      // Radial energy core
      const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 240);
      grad.addColorStop(0, 'rgba(0, 240, 255, 0.6)');
      grad.addColorStop(0.45, 'rgba(14, 165, 233, 0.25)');
      grad.addColorStop(1, 'rgba(2, 5, 18, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      // Stylized humanoid silhouette
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.arc(256, 165, 52, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(140, 420);
      ctx.quadraticCurveTo(165, 260, 256, 250);
      ctx.quadraticCurveTo(347, 260, 372, 420);
      ctx.closePath();
      ctx.fill();

      // Cybernetic scanlines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 2;
      for (let y = 0; y < 512; y += 8) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }

      // Telemetry rings
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(50, 50, 412, 412);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  // Orbital energy motes circling the avatar
  const orbitalMotes = useMemo(() => {
    const count = 48;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 1.7 + Math.random() * 0.4;
      pos[i * 3 + 0] = r * Math.cos(angle);
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.6;
      pos[i * 3 + 2] = r * Math.sin(angle);
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (!groupRef.current) return;

    if (!reducedMotion) {
      groupRef.current.position.y = Math.sin(t * 1.1) * 0.1;
      groupRef.current.rotation.y = Math.sin(t * 0.35) * 0.06;
    }

    const speed = isIntroPlaying ? 3.5 : hovered ? 1.8 : 1.0;

    if (outerRingRef.current && !reducedMotion) {
      outerRingRef.current.rotation.z += delta * 0.35 * speed;
    }
    if (midRingRef.current && !reducedMotion) {
      midRingRef.current.rotation.z -= delta * 0.6 * speed;
      midRingRef.current.rotation.x = Math.sin(t * 0.7) * 0.2;
    }
    if (innerRingRef.current && !reducedMotion) {
      innerRingRef.current.rotation.z += delta * 0.9 * speed;
      innerRingRef.current.rotation.y = Math.cos(t * 0.9) * 0.15;
    }

    // Backlight breathing glow
    if (backlightRef.current) {
      const s = 1.0 + Math.sin(t * 2.2) * 0.08 + (isIntroPlaying ? 0.3 : 0);
      backlightRef.current.scale.setScalar(s);
    }

    // Orbital motes spin
    if (orbitalMotesRef.current && !reducedMotion) {
      orbitalMotesRef.current.rotation.y += delta * 0.5 * speed;
    }
  });

  const activeTexture = videoTexture || (avatarMode === 'hologram' && texture ? texture : silhouetteTexture);

  return (
    <group
      ref={groupRef}
      position={[0, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onAvatarClick?.();
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
      {/* 1. Volumetric Backlight Halo Disc (Creates Radiant Silhouette Rim) */}
      <mesh ref={backlightRef} position={[0, 0, -0.35]}>
        <planeGeometry args={[4.2, 4.2]} />
        <meshBasicMaterial
          color="#00f0ff"
          transparent
          opacity={isIntroPlaying ? 0.45 : hovered ? 0.35 : 0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 2. Outer Gimbal Segmented Ring */}
      <mesh ref={outerRingRef}>
        <torusGeometry args={[2.0, 0.02, 16, 64]} />
        <meshStandardMaterial
          color="#00f0ff"
          emissive="#00f0ff"
          emissiveIntensity={hovered || isIntroPlaying ? 3.5 : 1.8}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* 3. Mid Tilted Energy Ring */}
      <mesh ref={midRingRef} rotation={[0.45, 0.2, 0]}>
        <torusGeometry args={[1.75, 0.016, 16, 64]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={hovered || isIntroPlaying ? 3.0 : 1.4}
          roughness={0.15}
          metalness={0.85}
        />
      </mesh>

      {/* 4. Inner Counter-Rotating Ring */}
      <mesh ref={innerRingRef} rotation={[-0.3, 0.4, 0]}>
        <torusGeometry args={[1.5, 0.012, 16, 48]} />
        <meshStandardMaterial
          color="#60a5fa"
          emissive="#60a5fa"
          emissiveIntensity={2.0}
        />
      </mesh>

      {/* 5. Orbital Energy Motes */}
      <points ref={orbitalMotesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[orbitalMotes, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#00f0ff"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* 6. Floating Holographic Brackets & Alignment Ticks */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        const rad = 1.55;
        return (
          <mesh
            key={i}
            position={[rad * Math.cos(angle), rad * Math.sin(angle), 0.04]}
            rotation={[0, 0, angle]}
          >
            <boxGeometry args={[0.26, 0.03, 0.03]} />
            <meshStandardMaterial
              color="#00f0ff"
              emissive="#00f0ff"
              emissiveIntensity={2.6}
            />
          </mesh>
        );
      })}

      {/* 7. Central Holographic Portal & Avatar Display Plane */}
      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[1.38, 64]} />
        <meshStandardMaterial
          map={activeTexture}
          color="#bae6fd"
          emissive="#0284c7"
          emissiveIntensity={hovered ? 1.1 : 0.55}
          roughness={0.2}
          metalness={0.2}
          transparent
          opacity={0.94}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 8. Luminous Edge Corona Ring */}
      <mesh position={[0, 0, 0.02]}>
        <ringGeometry args={[1.35, 1.39, 64]} />
        <meshBasicMaterial
          color="#00f0ff"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 9. Pedestal Hologram Emitter Plinth */}
      <mesh position={[0, -2.05, 0]}>
        <cylinderGeometry args={[0.35, 0.75, 0.2, 32]} />
        <meshStandardMaterial
          color="#0369a1"
          emissive="#0284c7"
          emissiveIntensity={1.4}
          roughness={0.25}
          metalness={0.9}
        />
      </mesh>
      <mesh position={[0, -2.05, 0]}>
        <torusGeometry args={[0.7, 0.02, 16, 48]} />
        <meshBasicMaterial color="#00f0ff" />
      </mesh>
    </group>
  );
}
