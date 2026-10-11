import { ArrowRight, RotateCcw, Volume2, X } from 'lucide-react';
import { useState } from 'react';
import { PERSONAL_INFO } from '../../data/portfolioData';
import { SectorId } from '../../types/portfolio';

interface HeroOverlayProps {
  onMeetHector: () => void;
  onCloseIntro: () => void;
  onExplore: (sector: SectorId) => void;
  isIntroPlaying: boolean;
  onReplayEntrance?: () => void;
}

export function HeroOverlay({ onMeetHector, onCloseIntro, onExplore, isIntroPlaying, onReplayEntrance }: HeroOverlayProps) {
  const [portraitAvailable, setPortraitAvailable] = useState(true);
  return (
    <>
      <div className="hero-layout pointer-events-none">
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

      {/* Persistent Holographic Introduction Overlay Card when "Meet Hector" is active */}
      {isIntroPlaying && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) onCloseIntro();
          }}
          role="dialog" aria-modal="true" aria-label="Meet Hector" className="intro-overlay fixed inset-0 z-50 pointer-events-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div className="max-w-lg w-full bg-black/95 backdrop-blur-2xl border-2 border-cyan-400 rounded-2xl p-6 sm:p-8 shadow-[0_0_60px_rgba(0,240,255,0.6)] animate-slide-left text-left relative">
            {/* Top Header Bar with Telemetry on Left and Close Button on Right */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-cyan-900/60 font-mono text-xs">
              {/* Telemetry Status on the Left Side */}
              <div className="flex items-center gap-2 text-cyan-300">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="tracking-widest font-bold text-[11px]">MEET HECTOR</span>
              </div>

              {/* Close Button on the Right Side */}
              <button
                onClick={onCloseIntro}
                className="p-1.5 px-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-900/80 hover:border-cyan-400 transition-all font-mono text-xs inline-flex items-center gap-1.5"
                title="Close Inspection (Esc)"
                aria-label="Close introduction"
              >
                <span>ESC / CLOSE</span>
                <X className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </div>

            {/* Avatar Header & Welcome Greeting */}
            <div className="flex items-center gap-4 mb-4">
              <div className="intro-portrait relative w-16 h-16 rounded-full border-2 border-cyan-400 overflow-hidden flex-shrink-0 shadow-[0_0_20px_rgba(0,240,255,0.5)]">
                {portraitAvailable ? <img
                  src={PERSONAL_INFO.avatarUrl}
                  alt={PERSONAL_INFO.name}
                  width={64} height={64} decoding="async"
                  onError={() => setPortraitAvailable(false)}
                  className="w-full h-full object-cover filter contrast-110"
                /> : <span className="intro-monogram" aria-hidden="true">hm<span>.</span></span>}
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/60 via-transparent to-transparent" />
              </div>

              <div>
                <div className="text-[11px] font-mono text-cyan-400 tracking-wider uppercase mb-0.5">
                  SOFTWARE ENGINEER
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                  Hector Morales
                </h3>
                <div className="text-xs text-gray-400 font-mono">
                  Software Engineer & Senior FullStack Developer
                </div>
              </div>
            </div>

            {/* Personal Statement */}
            <p className="text-gray-200 text-xs sm:text-sm leading-relaxed mb-5 bg-cyan-950/30 p-3.5 rounded-xl border border-cyan-900/60">
              "Welcome to The Intelligence Interface. I specialize in building high-scale production web architectures, cross-platform React Native apps, and GPU-accelerated spatial interfaces at the intersection of engineering and creative design."
            </p>

            {/* Credentials Pills */}
            <div className="grid grid-cols-2 gap-2 mb-5 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-black/60 border border-cyan-900/40">
                <div className="text-[10px] text-gray-400 uppercase">EXPERIENCE</div>
                <div className="text-cyan-300 font-bold">8+ Years Production</div>
              </div>
              <div className="p-2.5 rounded-lg bg-black/60 border border-cyan-900/40">
                <div className="text-[10px] text-gray-400 uppercase">ACADEMICS</div>
                <div className="text-cyan-300 font-bold">M.S. & B.S. in Comp Sci</div>
              </div>
            </div>

            {/* Direct Exploration Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onExplore('projects');
                }}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-black font-mono text-xs font-bold hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center justify-center gap-1.5"
              >
                <span>EXPLORE PROJECTS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  onExplore('about');
                }}
                className="flex-1 py-2.5 rounded-xl bg-black/60 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold hover:border-cyan-400 hover:bg-cyan-950/40 transition-all flex items-center justify-center gap-1.5"
              >
                <span>VIEW PROFILE</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
