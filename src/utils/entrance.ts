export type EntrancePhase = 'waiting' | 'playing' | 'done';
export const ENTRANCE_DURATION = 3600;

export function initialEntrancePhase(): EntrancePhase {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'done';
  try {
    if (localStorage.getItem('portfolio-motion') === 'reduced') return 'done';
  } catch { /* The entrance remains usable when storage is restricted. */ }
  return 'waiting';
}

