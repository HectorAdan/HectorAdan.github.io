import { useState, useEffect, useCallback } from 'react';
import { SectorId } from './types/portfolio';
import { Scene } from './components/canvas/Scene';
import { HeaderHUD } from './components/ui/HeaderHUD';
import { HeroOverlay } from './components/ui/HeroOverlay';
import { SectorDetailPanel } from './components/ui/SectorDetailPanel';
import { WebGLFallback } from './components/ui/WebGLFallback';
import { SystemMetrics } from './components/common/SystemMetrics';
import { soundManager } from './utils/soundEffects';
import { isWebGLAvailable } from './utils/webglDetect';
import { AvatarRenderMode } from './components/canvas/HoloAvatar';

export default function App() {
  const [activeSector, setActiveSector] = useState<SectorId>('home');
  const [isIntroPlaying, setIsIntroPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [avatarMode, setAvatarMode] = useState<AvatarRenderMode>('hologram');
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  // Initialize environment & accessibility checks
  useEffect(() => {
    setWebglSupported(isWebGLAvailable());
    setIsMuted(soundManager.getMuted());

    // Respect user's motion preferences
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionQuery.matches);
    const motionHandler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    motionQuery.addEventListener('change', motionHandler);

    return () => {
      motionQuery.removeEventListener('change', motionHandler);
    };
  }, []);

  // Handle Sector Navigation
  const handleSelectSector = useCallback(
    (sector: SectorId) => {
      if (sector !== activeSector) {
        soundManager.playNavigationWarp();
      }
      setActiveSector(sector);
    },
    [activeSector]
  );

  // Trigger "Meet Hector" Intro Sequence
  const handleTriggerIntro = useCallback(() => {
    setActiveSector('home');
    setIsIntroPlaying(true);
    soundManager.setMuted(false);
    setIsMuted(false);
    soundManager.playAvatarActivate();
  }, []);

  const handleIntroComplete = useCallback(() => {
    setIsIntroPlaying(false);
  }, []);

  // Cycle avatar modes (Hologram -> Silhouette -> Matrix)
  const handleCycleAvatarMode = useCallback(() => {
    soundManager.playNeuralClick();
    setAvatarMode((prev) => {
      if (prev === 'hologram') return 'silhouette';
      if (prev === 'silhouette') return 'matrix';
      return 'hologram';
    });
  }, []);

  // Audio Toggle
  const handleToggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.setMuted(nextMuted);
  }, [isMuted]);

  // Keyboard navigation & accessibility shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing inside an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.key) {
        case 'Escape':
          if (isIntroPlaying) {
            setIsIntroPlaying(false);
          } else {
            setActiveSector('home');
          }
          soundManager.playNeuralClick();
          break;
        case '0':
          handleSelectSector('home');
          break;
        case '1':
          handleSelectSector('about');
          break;
        case '2':
          handleSelectSector('projects');
          break;
        case '3':
          handleSelectSector('experience');
          break;
        case '4':
          handleSelectSector('contact');
          break;
        case 'm':
        case 'M':
          handleToggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectSector, handleToggleMute, isIntroPlaying]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#02040a] text-white select-none">
      {/* 1. 3D Canvas Scene or Graceful WebGL Fallback */}
      {webglSupported ? (
        <Scene
          activeSector={activeSector}
          onSelectSector={handleSelectSector}
          isIntroPlaying={isIntroPlaying}
          onIntroComplete={handleIntroComplete}
          reducedMotion={reducedMotion}
          avatarMode={avatarMode}
          onAvatarClick={handleTriggerIntro}
        />
      ) : (
        <WebGLFallback
          activeSector={activeSector}
          onSelectSector={handleSelectSector}
        />
      )}

      {/* 2. Cinematic Vignette Falloff */}
      <div className="vignette-overlay" />

      {/* 3. Top HUD Navigation */}
      <HeaderHUD
        activeSector={activeSector}
        onSelectSector={handleSelectSector}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        avatarMode={avatarMode}
        onCycleAvatarMode={handleCycleAvatarMode}
        onTriggerIntro={handleTriggerIntro}
      />

      {/* 3. Hero Overlay Landing Experience */}
      {activeSector === 'home' && (
        <HeroOverlay
          onMeetHector={handleTriggerIntro}
          onCloseIntro={() => setIsIntroPlaying(false)}
          onExplore={(sec) => {
            setIsIntroPlaying(false);
            handleSelectSector(sec);
          }}
          isIntroPlaying={isIntroPlaying}
        />
      )}

      {/* 4. Sliding Sector Details Panel (About, Projects, Experience, Contact) */}
      <SectorDetailPanel
        activeSector={activeSector}
        onClose={() => handleSelectSector('home')}
        onSelectSector={handleSelectSector}
      />

      {/* 5. Bottom System Telemetry Ticker */}
      <SystemMetrics activeSector={activeSector} />
    </main>
  );
}
