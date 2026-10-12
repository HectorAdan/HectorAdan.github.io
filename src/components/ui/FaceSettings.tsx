import { useEffect, useId, useRef, useState } from 'react';
import { ScanFace, Settings, X } from 'lucide-react';
import { FaceStyleButton } from './FaceStyleButton';
import { FACE_STYLE_LABELS, nextFaceStyle, type FaceStyle } from '../../utils/faceStyle';

interface Props {
  style: FaceStyle;
  onSelectStyle: (style: FaceStyle) => void;
  contoursVisible: boolean;
  onToggleContours: () => void;
}

function ContourButton({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return <button className="face-settings-contours" onClick={onToggle} aria-pressed={visible}
    aria-label={visible ? 'Hide face contours' : 'Show face contours'}>
    <ScanFace size={16} aria-hidden="true" /><span>Contours {visible ? 'on' : 'off'}</span>
  </button>;
}

export function FaceSettings({ style, onSelectStyle, contoursVisible, onToggleContours }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), select = useRef<HTMLSelectElement>(null);
  const panelId = useId();
  const close = () => { setOpen(false); trigger.current?.focus(); };

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const resize = () => { if (!query.matches) setOpen(false); };
    query.addEventListener('change', resize);
    return () => query.removeEventListener('change', resize);
  }, []);
  useEffect(() => {
    if (!open) return;
    select.current?.focus();
    const outside = (event: MouseEvent) => {
      if (root.current?.contains(event.target as Node)) return;
      setOpen(false);
      // Dismiss the settings first when tapping the introduction backdrop.
      if (event.target instanceof Element && event.target.classList.contains('identity-introduction')) event.stopPropagation();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus();
    };
    document.addEventListener('click', outside, true);
    document.addEventListener('keydown', escape, true);
    return () => { document.removeEventListener('click', outside, true); document.removeEventListener('keydown', escape, true); };
  }, [open]);

  return <div className="face-settings" ref={root}>
    <div className="face-settings-desktop" role="group" aria-label="Face appearance controls">
      <FaceStyleButton style={style} onClick={() => onSelectStyle(nextFaceStyle(style))} showLabel />
      {style !== 'solid' && <ContourButton visible={contoursVisible} onToggle={onToggleContours} />}
    </div>
    <div className="face-settings-mobile">
      <button ref={trigger} onClick={() => setOpen(value => !value)} aria-label="Face settings" title="Face settings"
        aria-expanded={open} aria-controls={open ? panelId : undefined}>
        <Settings size={18} aria-hidden="true" />
      </button>
      {open && <div id={panelId} className="face-settings-popover" role="group" aria-label="Face settings">
        <div className="face-settings-heading"><span>Face settings</span>
          <button onClick={close} aria-label="Close face settings"><X size={14} aria-hidden="true" /></button>
        </div>
        <label className="face-settings-field">Appearance
          <select ref={select} aria-label="Face style" value={style} onChange={event => onSelectStyle(event.target.value as FaceStyle)}>
            {Object.entries(FACE_STYLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {style !== 'solid' && <ContourButton visible={contoursVisible} onToggle={onToggleContours} />}
      </div>}
    </div>
  </div>;
}
