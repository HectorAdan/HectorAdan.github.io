import { Volume2, VolumeX, Eye, Terminal, Sparkles, Orbit } from 'lucide-react';
import { SectorId } from '../../types/portfolio';
import { SECTORS } from '../../data/portfolioData';
import { AvatarRenderMode } from '../canvas/HoloAvatar';

interface HeaderHUDProps {
  activeSector: SectorId;
  onSelectSector: (sector: SectorId) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  avatarMode: AvatarRenderMode;
  onCycleAvatarMode: () => void;
  onTriggerIntro: () => void;
}

export function HeaderHUD({
  activeSector,
  onSelectSector,
  isMuted,
  onToggleMute,
  avatarMode,
  onCycleAvatarMode,
  onTriggerIntro,
}: HeaderHUDProps) {
  const navItems: { id: SectorId; label: string; num: string }[] = [
    { id: 'home', label: 'Core', num: '00' },
    { id: 'about', label: 'About', num: '01' },
    { id: 'projects', label: 'Projects', num: '02' },
    { id: 'experience', label: 'Experience', num: '03' },
    { id: 'contact', label: 'Contact', num: '04' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 md:px-8 py-4 pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Brand Identity / Neural Interface Telemetry */}
        <div className="pointer-events-auto flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => onSelectSector('home')}
            className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-black/60 border border-cyan-500/30 backdrop-blur-md hover:border-cyan-400 hover:bg-cyan-950/40 transition-all text-left group w-auto flex-shrink-0"
            aria-label="Return to central neural core"
          >
            <div className="relative w-3 h-3 flex items-center justify-center flex-shrink-0">
              <span className="absolute w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-75" />
              <span className="relative w-2 h-2 rounded-full bg-cyan-300" />
            </div>
            <div>
              <div className="font-mono text-xs font-bold text-cyan-200 tracking-wider flex items-center gap-1.5">
                <span>HECTOR MORALES</span>
                <span className="text-[10px] text-cyan-500 font-normal hidden sm:inline">// v2.5</span>
              </div>
              <div className="text-[10px] font-mono text-cyan-400/70 hidden sm:block">
                NEURAL INTELLIGENCE INTERFACE
              </div>
            </div>
          </button>
        </div>

        {/* Center: Sector Navigation */}
        <nav
          className="pointer-events-auto hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 border border-cyan-500/20 backdrop-blur-md shadow-[0_0_20px_rgba(0,240,255,0.08)] w-auto flex-shrink-0"
          aria-label="Neural Sector Navigation"
        >
          {navItems.map((item) => {
            const isActive = activeSector === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectSector(item.id)}
                className={`px-3 py-1 rounded-full font-mono text-xs transition-all inline-flex items-center gap-1.5 w-auto flex-shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-[0_0_12px_rgba(0,240,255,0.3)] font-bold'
                    : 'text-gray-400 hover:text-cyan-200 hover:bg-white/5 border border-transparent'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="text-[10px] opacity-60">{item.num}</span>
                <span className="font-medium tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Controls (Audio, Avatar Render Mode, Intro Trigger) */}
        <div className="pointer-events-auto flex items-center gap-2 flex-shrink-0">
          {/* Quick Intro / Meet Hector button in header */}
          <button
            onClick={onTriggerIntro}
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-900/60 font-mono text-xs transition-all w-auto flex-shrink-0"
            title="Replay Meet Hector Neural Intro"
          >
            <Orbit className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
            <span>INTRO</span>
          </button>

          {/* Avatar Render Mode Cycle */}
          <button
            onClick={onCycleAvatarMode}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-black/60 border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-950/50 font-mono text-xs transition-all backdrop-blur-md w-auto flex-shrink-0"
            title={`Avatar Mode: ${avatarMode.toUpperCase()} (Click to switch)`}
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline uppercase text-[11px]">{avatarMode}</span>
          </button>

          {/* Synthetic Web Audio Toggle */}
          <button
            onClick={onToggleMute}
            className={`p-2 rounded border font-mono text-xs transition-all backdrop-blur-md inline-flex items-center justify-center w-auto flex-shrink-0 ${
              !isMuted
                ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                : 'bg-black/60 border-gray-800 text-gray-500 hover:text-cyan-400 hover:border-cyan-600'
            }`}
            aria-label={isMuted ? 'Enable procedural spatial audio' : 'Mute spatial audio'}
            title={isMuted ? 'Enable procedural audio' : 'Mute audio'}
          >
            {!isMuted ? <Volume2 className="w-4 h-4 text-cyan-300" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Row */}
      <div className="md:hidden mt-3 pointer-events-auto flex items-center justify-center w-full">
        <nav className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/80 border border-cyan-500/30 backdrop-blur-md overflow-x-auto w-auto max-w-full">
          {navItems.map((item) => {
            const isActive = activeSector === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectSector(item.id)}
                className={`px-2.5 py-1 rounded-full font-mono text-[11px] transition-all whitespace-nowrap inline-flex items-center w-auto flex-shrink-0 ${
                  isActive
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/60 font-bold'
                    : 'text-gray-400 hover:text-cyan-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
