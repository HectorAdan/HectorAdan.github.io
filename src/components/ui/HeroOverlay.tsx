import { ArrowRight, Orbit, Compass } from 'lucide-react';
import { PERSONAL_INFO } from '../../data/portfolioData';
import { SectorId } from '../../types/portfolio';

interface HeroOverlayProps {
  onMeetHector: () => void;
  onExplore: (sector: SectorId) => void;
  isIntroPlaying: boolean;
}

export function HeroOverlay({ onMeetHector, onExplore, isIntroPlaying }: HeroOverlayProps) {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-6 sm:p-10 lg:p-14">
      {/* Top spacing below header */}
      <div className="h-16" />

      {/* Hero Content: Framed cleanly in the lower-left quadrant to let the 3D avatar breathe */}
      <div className="max-w-xl pointer-events-auto transition-all duration-700">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 backdrop-blur-md mb-4 shadow-[0_0_15px_rgba(0,240,255,0.12)] animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-mono text-[11px] text-cyan-200 tracking-wider font-semibold">
            DIGITAL TWIN // ONLINE
          </span>
        </div>

        {/* Name & Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-2 font-display drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
          <span className="bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
            {PERSONAL_INFO.name}
          </span>
        </h1>

        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs sm:text-sm mb-4 tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>{PERSONAL_INFO.title}</span>
        </div>

        {/* Short Introduction */}
        <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-6 max-w-lg backdrop-blur-md bg-black/40 p-3.5 rounded-xl border border-cyan-950/60 shadow-xl">
          "{PERSONAL_INFO.tagline}"
        </p>

        {/* Primary Call to Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Obvious "Meet Hector" Button */}
          <button
            onClick={onMeetHector}
            disabled={isIntroPlaying}
            className={`relative group px-6 py-3 rounded-xl font-mono text-xs sm:text-sm font-semibold tracking-wider inline-flex items-center gap-2.5 w-auto flex-shrink-0 transition-all duration-300 overflow-hidden ${
              isIntroPlaying
                ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200 shadow-[0_0_25px_rgba(0,240,255,0.6)] animate-pulse'
                : 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.7)] hover:scale-[1.02] active:scale-[0.98]'
            }`}
            aria-label="Initiate Meet Hector introduction animation"
          >
            <Orbit className={`w-4 h-4 ${isIntroPlaying ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            <span>{isIntroPlaying ? 'NEURAL LOCK ENGAGED...' : 'MEET HECTOR'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Explore Matrix / About Button */}
          <button
            onClick={() => onExplore('about')}
            className="px-5 py-3 rounded-xl font-mono text-xs sm:text-sm text-cyan-300 bg-black/60 border border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-950/50 backdrop-blur-md transition-all inline-flex items-center gap-2 w-auto flex-shrink-0"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>EXPLORE MATRIX</span>
          </button>
        </div>

        {/* Minimal Telemetry Highlights */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-cyan-900/30 max-w-md font-mono text-xs">
          <div>
            <div className="text-cyan-400 font-bold text-sm">8+ YEARS</div>
            <div className="text-gray-400 text-[10px]">PRODUCTION DEV</div>
          </div>
          <div>
            <div className="text-cyan-400 font-bold text-sm">M.S. & B.S.</div>
            <div className="text-gray-400 text-[10px]">COMPUTER SCIENCE</div>
          </div>
          <div>
            <div className="text-cyan-400 font-bold text-sm">FULLSTACK</div>
            <div className="text-gray-400 text-[10px]">REACT • TYPESCRIPT</div>
          </div>
        </div>
      </div>

      {/* Bottom Exploration Cue */}
      <div className="flex items-center justify-between text-[11px] font-mono text-cyan-500/70 pointer-events-auto">
        <div className="hidden sm:flex items-center gap-2 backdrop-blur-md bg-black/40 px-3 py-1.5 rounded-lg border border-cyan-900/40">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>DRAG TO ROTATE 3D VIEW • CLICK SPATIAL BEACONS • SCROLL TO ZOOM</span>
        </div>
        <div className="flex items-center gap-1.5 text-cyan-400/80 font-mono text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>SPATIAL MATRIX STABLE</span>
        </div>
      </div>
    </div>
  );
}
