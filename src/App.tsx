import { useState, useEffect, useCallback, useRef } from 'react';
import { SectorId } from './types/portfolio';
import { Environment } from './components/ui/Environment';
import { HeaderHUD } from './components/ui/HeaderHUD';
import { HeroOverlay } from './components/ui/HeroOverlay';
import { SectorDetailPanel } from './components/ui/SectorDetailPanel';
import { WebGLFallback } from './components/ui/WebGLFallback';
import { SystemMetrics } from './components/common/SystemMetrics';
import { soundManager } from './utils/soundEffects';
import { OpeningSequence } from './components/ui/OpeningSequence';
import { initialEntrancePhase } from './utils/entrance';
import { isWebGLAvailable } from './utils/webglDetect';
import type { AvatarRenderMode } from './components/canvas/HoloAvatar';
import { useIntroductionVoice } from './utils/useIntroductionVoice';
import type { IdentityStatus } from './utils/identityIntroduction';

function storedMotionPreference() {
  try { return localStorage.getItem('portfolio-motion') === 'reduced'; }
  catch { return false; }
}

export default function App() {
  const [activeSector, setActiveSector] = useState<SectorId>('home');
  const [previewSector, setPreviewSector] = useState<SectorId | null>(null);
  const lastPreviewSector = useRef<SectorId | null>(null);
  const dialogOpener = useRef<HTMLElement | null>(null);
  const dialogOpenerSelector = useRef<string | null>(null);
  const rememberDialogOpener = useCallback(() => {
    if (dialogOpener.current) return;
    const opener = document.activeElement as HTMLElement | null;
    if (!opener || opener === document.body || opener.closest('[role="dialog"]')) return;
    dialogOpener.current = opener;
    // Hero actions are remounted after leaving a section.
    dialogOpenerSelector.current = ['.hero-primary', '.hero-secondary'].find(selector => opener.matches(selector)) ?? null;
  }, []);
  const [isIntroPlaying, setIsIntroPlaying] = useState<boolean>(false);
  const [introRun, setIntroRun] = useState(0);
  const [identityStatus, setIdentityStatus] = useState<IdentityStatus>('loading');
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [avatarMode, setAvatarMode] = useState<AvatarRenderMode>('hologram');
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [motionPaused, setMotionPaused] = useState(storedMotionPreference);
  const motionReduced = reducedMotion || motionPaused;
  const [webglSupported, setWebglSupported] = useState<boolean>(() => isWebGLAvailable());
  const introduction = useIntroductionVoice(isIntroPlaying, isMuted, webglSupported ? identityStatus : 'unavailable', motionReduced);
  const [entrancePhase, setEntrancePhase] = useState(initialEntrancePhase);
  const [environmentReady, setEnvironmentReady] = useState(() => !webglSupported);
  const entranceOpen = entrancePhase !== 'done' && !motionReduced;
  const handleEnvironmentReady = useCallback(() => setEnvironmentReady(true), []);
  const finishEntrance = useCallback(() => {
    setEntrancePhase('done');
  }, []);
  const skipEntrance = useCallback(() => {
    soundManager.playClose();
    finishEntrance();
  }, [finishEntrance]);
  const replayEntrance = useCallback(() => {
    if (motionReduced) return;
    setPreviewSector(null);
    lastPreviewSector.current = null;
    setEntrancePhase('waiting');
    soundManager.playAvatarActivate();
  }, [motionReduced]);
  useEffect(() => {
    if (motionReduced) { finishEntrance(); return; }
    if (entrancePhase !== 'waiting') return;
    if (environmentReady) { setEntrancePhase('playing'); return; }
    // The lightweight preview can carry the entrance if the scene loads slowly.
    const timer = setTimeout(() => setEntrancePhase('playing'), 2000);
    return () => clearTimeout(timer);
  }, [entrancePhase, environmentReady, motionReduced, finishEntrance]);

  // Initialize environment & accessibility checks
  useEffect(() => {
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
      if (sector !== 'home') rememberDialogOpener();
      if (sector === 'home' && (activeSector !== 'home' || isIntroPlaying)) {
        soundManager.playClose();
      } else if (sector !== activeSector) {
        soundManager.playNavigationWarp();
      }
      setPreviewSector(null);
      lastPreviewSector.current = null;
      introduction.voice.stop();
      setIsIntroPlaying(false);
      setActiveSector(sector);
    },
    [activeSector, isIntroPlaying, rememberDialogOpener, introduction.voice]
  );

  const handlePreviewSector = useCallback((sector: SectorId | null) => {
    if (sector && sector !== lastPreviewSector.current) soundManager.playHover();
    lastPreviewSector.current = sector;
    setPreviewSector(sector);
  }, []);

  // Trigger "Meet Hector" Intro Sequence
  const handleTriggerIntro = useCallback(() => {
    rememberDialogOpener();
    setPreviewSector(null);
    lastPreviewSector.current = null;
    setActiveSector('home');
    setIsIntroPlaying(true);
    setIntroRun(value => value + 1);
    soundManager.setMuted(false, false);
    setIsMuted(false);
    introduction.voice.setMuted(false);
    introduction.start();
    soundManager.playAvatarActivate();
  }, [rememberDialogOpener, introduction.start, introduction.voice]);

  const handleReplayIntro = useCallback(() => {
    introduction.start();
    setIntroRun(value => value + 1);
    soundManager.playAvatarActivate();
  }, [introduction.start]);

  const handleIntroComplete = useCallback(() => {
    introduction.voice.stop();
    setIsIntroPlaying(false);
  }, [introduction.voice]);

  const handleCloseIntro = useCallback(() => {
    if (isIntroPlaying) soundManager.playClose();
    introduction.voice.stop();
    setIsIntroPlaying(false);
  }, [isIntroPlaying, introduction.voice]);

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

  const handleToggleMotion = useCallback(() => {
    if (!reducedMotion) {
      soundManager.playNeuralClick();
      setMotionPaused(previous => !previous);
    }
  }, [reducedMotion]);
  useEffect(() => {
    try { localStorage.setItem('portfolio-motion', motionPaused ? 'reduced' : 'full'); }
    catch { /* Motion control still works when storage is unavailable. */ }
  }, [motionPaused]);

  // Keep keyboard focus in the existing drawers / introduction while they are open.
  useEffect(() => {
    if (activeSector === 'home' && !isIntroPlaying) return;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    if (!dialog) return;
    // Keep the original opener when moving between sections of the same dialog.
    if (!dialogOpener.current) dialogOpener.current = document.activeElement as HTMLElement | null;
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input, textarea, select, [tabindex="0"]'
    )).filter(element => element.getClientRects().length > 0);
    focusable()[0]?.focus();
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const elements = focusable();
      const first = elements[0], last = elements[elements.length - 1];
      if (!first) return;
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', trapFocus);
    return () => {
      document.removeEventListener('keydown', trapFocus);
      requestAnimationFrame(() => {
        // A section change or another dialog keeps focus inside the interface.
        if (document.querySelector('[role="dialog"]')) return;
        const opener = dialogOpener.current;
        const restoredOpener = opener?.isConnected ? opener : dialogOpenerSelector.current ? document.querySelector<HTMLElement>(dialogOpenerSelector.current) : null;
        dialogOpener.current = null;
        dialogOpenerSelector.current = null;
        if (restoredOpener && restoredOpener !== document.body) restoredOpener.focus({ preventScroll: true });
        else document.querySelector<HTMLElement>('.interface-brand')?.focus({ preventScroll: true });
      });
    };
  }, [activeSector, isIntroPlaying]);

  // Keyboard navigation & accessibility shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing) return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (entranceOpen && e.key !== 'm' && e.key !== 'M' && e.key !== 'p' && e.key !== 'P') {
        if (e.key === 'Escape') { e.preventDefault(); skipEntrance(); }
        return;
      }
      // Ignore if user is typing inside an input or textarea
      if (e.key !== 'Escape' && ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.key) {
        case 'Escape':
          if (isIntroPlaying) {
            handleCloseIntro();
          } else {
            handleSelectSector('home');
          }
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
        case 'p':
        case 'P':
          handleToggleMotion();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectSector, handleToggleMute, handleToggleMotion, handleCloseIntro, isIntroPlaying, entranceOpen, skipEntrance]);

  return (
    <main data-sector={activeSector} data-intro={isIntroPlaying} data-motion={motionReduced ? 'reduced' : 'full'} data-entrance={entranceOpen ? entrancePhase : 'done'} className="portfolio-shell relative w-screen h-screen overflow-hidden bg-[#02040a] text-white select-none">
      {/* 1. 3D Canvas Scene or Graceful WebGL Fallback */}
      <div className="portfolio-environment" inert={entranceOpen}>
      {webglSupported ? (
        <Environment
          activeSector={activeSector}
          onSelectSector={handleSelectSector}
          isIntroPlaying={isIntroPlaying}
          introRun={introRun}
          introductionVoice={introduction.voice}
          speechActive={introduction.active}
          onIdentityStatus={setIdentityStatus}
          previewSector={isIntroPlaying ? null : previewSector}
          onPreviewSector={handlePreviewSector}
          onIntroComplete={handleIntroComplete}
          reducedMotion={motionReduced}
          avatarMode={avatarMode}
          onAvatarClick={handleTriggerIntro}
          entrancePhase={entranceOpen ? entrancePhase : 'done'}
          onReady={handleEnvironmentReady}
        />
      ) : (
        <WebGLFallback
          activeSector={activeSector}
          onSelectSector={handleSelectSector}
          reducedMotion={motionReduced}
        />
      )}
      </div>

      {/* 2. Cinematic Vignette Falloff */}
      <div className="vignette-overlay" />

      {/* 3. Top HUD Navigation */}
      <div className="portfolio-interface" inert={entranceOpen}>
      <HeaderHUD
        activeSector={activeSector}
        onSelectSector={handleSelectSector}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        avatarMode={avatarMode}
        onCycleAvatarMode={handleCycleAvatarMode}
        onTriggerIntro={handleTriggerIntro}
        previewSector={previewSector}
        onPreviewSector={handlePreviewSector}
        motionReduced={motionReduced}
        motionLocked={reducedMotion}
        onToggleMotion={handleToggleMotion}
      />

      {/* 3. Hero Overlay Landing Experience */}
      {activeSector === 'home' && (
        <HeroOverlay
          onMeetHector={handleTriggerIntro}
          onCloseIntro={handleCloseIntro}
          onExplore={handleSelectSector}
          isIntroPlaying={isIntroPlaying}
          introRun={introRun}
          identityStatus={webglSupported ? identityStatus : 'unavailable'}
          onReplayIntro={handleReplayIntro}
          voiceStatus={introduction.status}
          onToggleVoice={introduction.toggle}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onReplayEntrance={motionReduced ? undefined : replayEntrance}
        />
      )}

      {/* 4. Sliding Sector Details Panel (About, Projects, Experience, Contact) */}
      <SectorDetailPanel
        activeSector={activeSector}
        onClose={() => handleSelectSector('home')}
        onSelectSector={handleSelectSector}
      />

      {/* 5. Bottom System Telemetry Ticker */}
      <SystemMetrics activeSector={activeSector} previewSector={previewSector} />
      </div>
      {entranceOpen && <OpeningSequence phase={entrancePhase} onComplete={finishEntrance} onSkip={skipEntrance} />}
    </main>
  );
}
