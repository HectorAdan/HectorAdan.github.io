import { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { ENTRANCE_DURATION, type EntrancePhase } from '../../utils/entrance';
import './OpeningSequence.css';

export function OpeningSequence({ phase, onComplete, onSkip }: {
  phase: EntrancePhase;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const skip = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    skip.current?.focus({ preventScroll: true });
    return () => {
      // Restore focus after the portfolio's inert state has been removed.
      requestAnimationFrame(() => {
        const target = previous?.isConnected && previous !== document.body ? previous : document.querySelector<HTMLElement>('.hero-primary');
        target?.focus({ preventScroll: true });
      });
    };
  }, []);
  useEffect(() => {
    if (phase !== 'playing') return;
    const timer = setTimeout(onComplete, ENTRANCE_DURATION);
    return () => clearTimeout(timer);
  }, [phase, onComplete]);

  return <div className="opening-sequence" data-phase={phase} role="dialog" aria-modal="true" aria-label="Portfolio entrance"
    onKeyDown={event => { if (event.key === 'Tab') { event.preventDefault(); skip.current?.focus(); } }}>
    <div className="opening-veil" aria-hidden="true" />
    <div className="opening-wordmark" aria-hidden="true">h<span>.</span></div>
    <button ref={skip} className="opening-skip" onClick={onSkip} title="Skip intro (Esc)">Skip intro<ArrowRight size={15} aria-hidden="true" /></button>
    <div className="opening-copy">
      <span className="opening-eyebrow">The Intelligence Interface</span>
      <p>Hector Morales<span>.</span></p>
      <span className="opening-caption">An evolving digital identity</span>
    </div>
    <div className="opening-progress" aria-hidden="true"><span /></div>
  </div>;
}
