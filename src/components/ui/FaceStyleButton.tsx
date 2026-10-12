import { Eye } from 'lucide-react';
import { FACE_STYLE_LABELS, type FaceStyle } from '../../utils/faceStyle';

export function FaceStyleButton({ style, onClick, showLabel = false, open = false }: {
  style: FaceStyle; onClick: () => void; showLabel?: boolean; open?: boolean;
}) {
  const label = FACE_STYLE_LABELS[style];
  return <button onClick={onClick} aria-label={open ? `Show face. Current style: ${label}` : `Face style: ${label}. Change style`}
    title={open ? `Show face (${label})` : `Change face style (${label})`}>
    <Eye size={16} aria-hidden="true" />{showLabel && <span>{label}</span>}
  </button>;
}
