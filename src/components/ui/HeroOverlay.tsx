import { ArrowRight, RotateCcw, X, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { PERSONAL_INFO } from '../../data/portfolioData';
import { SectorId } from '../../types/portfolio';
import type { IdentityStatus } from '../../utils/identityIntroduction';
import type { VoiceStatus } from '../../utils/introductionVoice';

interface HeroOverlayProps {
  onMeetHector: () => void;
  onCloseIntro: () => void;
  onExplore: (sector: SectorId) => void;
  isIntroPlaying: boolean;
  introRun: number;
  identityStatus: IdentityStatus;
  onReplayIntro: () => void;
  onReplayEntrance?: () => void;
  voiceStatus: VoiceStatus;
  onToggleVoice: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export function HeroOverlay({ onMeetHector, onCloseIntro, onExplore, isIntroPlaying, introRun, identityStatus, onReplayIntro, onReplayEntrance, voiceStatus, onToggleVoice, isMuted, onToggleMute }: HeroOverlayProps) {
  const voiceActive = voiceStatus === 'playing' || voiceStatus === 'waiting' || voiceStatus === 'loading';
  return <>
    <div className="hero-layout pointer-events-none" inert={isIntroPlaying} aria-hidden={isIntroPlaying || undefined}>
      <div className="hero-copy pointer-events-auto">
        <div className="hero-eyebrow"><span /> THE INTELLIGENCE INTERFACE</div>
        <h1>{PERSONAL_INFO.name.split(' ')[0]}<br /><span>{PERSONAL_INFO.name.split(' ').slice(1).join(' ')}</span><span className="name-period">.</span></h1>
        <p className="hero-role">{PERSONAL_INFO.title}</p>
        <p className="hero-description">{PERSONAL_INFO.tagline}</p>
        <div className="hero-actions">
          <button className="hero-primary" onClick={() => onExplore('projects')}>Explore projects <ArrowRight size={16} /></button>
          <button className="hero-secondary" onClick={onMeetHector} aria-label="Meet Hector">Meet Hector <span aria-hidden="true">↗</span></button>
        </div>
        <div className="hero-credentials">
          <div><strong>8+ years</strong><span>Production development</span></div>
          <div><strong>M.S. & B.S.</strong><span>Computer science</span></div>
          <div><strong>Fullstack</strong><span>React · TypeScript</span></div>
        </div>
        {onReplayEntrance && <button className="hero-replay" onClick={onReplayEntrance}><RotateCcw size={12} aria-hidden="true" />Replay intro</button>}
      </div>
      <div className="core-caption" aria-hidden="true"><span className="caption-line" /><span>01 / NEURAL CORE</span><span className="caption-sub">An evolving digital identity</span></div>
      <div className="hero-index" aria-hidden="true">ENGINEERING<br />WITH IMAGINATION</div>
    </div>
    {isIntroPlaying && <div role="dialog" aria-modal="true" aria-labelledby="identity-greeting" aria-describedby="identity-description" className="intro-overlay identity-introduction" data-voice-status={voiceStatus} onClick={event => { if (event.target === event.currentTarget) onCloseIntro(); }}>
      <header className="identity-toolbar">
        <span className="identity-wordmark">THE INTELLIGENCE INTERFACE</span>
        <div className="identity-toolbar-actions">
        <button onClick={onToggleMute} aria-label={isMuted ? 'Unmute introduction' : 'Mute introduction'} aria-pressed={isMuted}>
          {isMuted ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
        </button>
        <button onClick={onCloseIntro} aria-label="Close introduction" title="Close introduction (Escape)"><span>Close</span><X size={18} aria-hidden="true" /></button>
        </div>
      </header>
      <div className="identity-copy">
        <div className="identity-text" key={introRun}>
        <span className="identity-eyebrow">A DIGITAL INTRODUCTION</span>
        <h2 id="identity-greeting" className="identity-line identity-line-first">Hey, I'm Hector<span>.</span></h2>
        <p id="identity-description" className="identity-line identity-line-second">I'm a software engineer passionate about building intuitive digital experiences.</p>
        <p className="identity-line identity-line-third">Welcome to my digital world.</p>
        </div>
        <div className="identity-actions">
          <button className="hero-secondary" onClick={onToggleVoice} aria-label={voiceActive ? 'Pause introduction voice' : voiceStatus === 'error' ? 'Retry introduction voice' : 'Play introduction voice'}>
            {voiceActive ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
            {voiceActive ? 'Pause voice' : voiceStatus === 'error' ? 'Retry voice' : 'Play voice'}
          </button>
          <button className="hero-secondary" onClick={onReplayIntro} aria-label="Replay introduction"><RotateCcw size={14} aria-hidden="true" />Replay introduction</button>
          <button className="hero-secondary" onClick={() => onExplore('projects')}>Explore projects <ArrowRight size={14} aria-hidden="true" /></button>
          <button className="hero-secondary" onClick={() => onExplore('about')}>About me <ArrowRight size={14} aria-hidden="true" /></button>
        </div>
        {voiceStatus === 'error' && <p className="identity-voice-status" role="status">The voice couldn’t play. Try again using “Retry voice”.</p>}
      </div>
      {identityStatus !== 'ready' && <p className="identity-loading" role="status">{identityStatus === 'loading' ? 'Preparing my digital presence…' : 'A lightweight introduction. The 3D identity is unavailable on this visit.'}</p>}
    </div>}
  </>;
}
