import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { SectorId } from '../../types/portfolio';
interface HeaderHUDProps {
  activeSector: SectorId;
  previewSector: SectorId | null;
  onPreviewSector: (sector: SectorId | null) => void;
  onSelectSector: (sector: SectorId) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  motionReduced: boolean;
  motionLocked: boolean;
  onToggleMotion: () => void;
}
const navigation: { id: SectorId; label: string }[] = [
  { id: 'home', label: 'Core' }, { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' }, { id: 'experience', label: 'Experience' }, { id: 'contact', label: 'Contact' },
];
export function HeaderHUD({ activeSector, onSelectSector, isMuted, onToggleMute, previewSector, onPreviewSector, motionReduced, motionLocked, onToggleMotion }: HeaderHUDProps) {
  return <header className="interface-header">
    <button className="interface-brand" onClick={() => onSelectSector('home')} aria-label="Return to central neural core">
      <span className="brand-symbol" aria-hidden="true">h<span>.</span></span>
      <span className="brand-wordmark">HECTOR MORALES<span>SOFTWARE ENGINEER</span></span>
    </button>
    <nav className="interface-nav" aria-label="Portfolio navigation">
      {navigation.map(({ id, label }, index) => <button key={id} aria-keyshortcuts={String(index)} className={previewSector === id ? 'is-preview' : undefined}
        onPointerEnter={event => { if (event.pointerType === 'mouse') onPreviewSector(id); }}
        onPointerLeave={event => { if (document.activeElement !== event.currentTarget) onPreviewSector(null); }}
        onFocus={() => onPreviewSector(id)} onBlur={() => onPreviewSector(null)}
        onClick={() => onSelectSector(id)} aria-current={activeSector === id ? 'page' : undefined}>{label}</button>)}
    </nav>
    <div className="interface-controls">
      <button onClick={onToggleMotion} aria-keyshortcuts="P" aria-pressed={motionReduced} disabled={motionLocked}
        aria-label={motionLocked ? 'Motion reduced by system preference' : motionReduced ? 'Restore motion' : 'Reduce motion'}
        title={motionLocked ? 'Reduced motion follows your system preference' : motionReduced ? 'Restore motion (P)' : 'Reduce motion (P)'}>
        {motionReduced ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
      </button>
      <button onClick={onToggleMute} aria-keyshortcuts="M" aria-pressed={!isMuted} aria-label={isMuted ? 'Enable procedural spatial audio' : 'Mute spatial audio'} title={isMuted ? 'Enable audio (M)' : 'Mute audio (M)'}>{isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
    </div>
  </header>;
}
