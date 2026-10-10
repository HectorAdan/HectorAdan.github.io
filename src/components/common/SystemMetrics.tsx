import { useEffect, useState } from 'react';
import { SectorId } from '../../types/portfolio';
import { SECTORS } from '../../data/portfolioData';

interface SystemMetricsProps {
  activeSector: SectorId;
}

export function SystemMetrics({ activeSector }: SystemMetricsProps) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(
        d.toLocaleTimeString('en-US', { hour12: false }) +
          '.' +
          Math.floor(d.getMilliseconds() / 100)
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 200);
    return () => clearInterval(interval);
  }, []);

  const config = SECTORS[activeSector];

  return (
    <div className="fixed bottom-3 left-6 z-20 hidden lg:flex items-center gap-4 text-[10px] font-mono text-cyan-500/70 pointer-events-none select-none">
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/60 border border-cyan-900/40 backdrop-blur-md">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        <span className="text-cyan-300">{config.code}</span>
        <span className="text-gray-500">|</span>
        <span>X:{config.position[0].toFixed(1)} Y:{config.position[1].toFixed(1)} Z:{config.position[2].toFixed(1)}</span>
      </div>

      <div className="px-2.5 py-1 rounded bg-black/60 border border-cyan-900/40 backdrop-blur-md text-gray-400">
        SYS.CLK: <span className="text-cyan-300">{timeStr}</span>
      </div>

      <div className="px-2.5 py-1 rounded bg-black/60 border border-cyan-900/40 backdrop-blur-md text-gray-400">
        STATUS: <span className="text-green-400">NOMINAL</span>
      </div>
    </div>
  );
}
