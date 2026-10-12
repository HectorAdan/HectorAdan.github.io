export type FaceStyle = 'neural' | 'particles' | 'solid';
export const FACE_STYLE_LABELS: Record<FaceStyle, string> = { neural: 'Neural', particles: 'Particles', solid: 'Solid' };
export function nextFaceStyle(style: FaceStyle): FaceStyle {
  return style === 'neural' ? 'particles' : style === 'particles' ? 'solid' : 'neural';
}
