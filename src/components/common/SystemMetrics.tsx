import { SectorId } from '../../types/portfolio';
import { SECTORS, PERSONAL_INFO } from '../../data/portfolioData';
export function SystemMetrics({ activeSector, previewSector }: { activeSector: SectorId; previewSector: SectorId | null }) {
  return <footer className="interface-footer">
    <span className="availability"><span />Available for collaboration</span>
    <span className="footer-location">{PERSONAL_INFO.location}</span>
    <span className="footer-hint">{activeSector === 'home' ? (previewSector && previewSector !== 'home' ? `Explore ${SECTORS[previewSector].label}` : 'Select a node to explore') : `${SECTORS[activeSector].label} · Esc to return`}<span aria-hidden="true">↗</span></span>
  </footer>;
}
