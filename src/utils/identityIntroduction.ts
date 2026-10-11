export type IdentityStatus = 'loading' | 'ready' | 'unavailable';
export interface IdentityFrame { core: number; face: number; assembly: number }
export interface IdentityPresentation { current: IdentityFrame }

// Seconds from activation. A staged handoff keeps the existing Core geometry intact.
export const IDENTITY_TIMING = { coreFadeStart: .65, coreFadeEnd: 2.25, faceStart: 1.1, faceEnd: 2.8, assemblyEnd: 3.3 };
const smooth = (value: number, start: number, end: number) => {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
};
export function identityFrame(elapsed: number, active: boolean, ready: boolean, reducedMotion: boolean): IdentityFrame {
  if (!active || !ready) return { core: 1, face: 0, assembly: 1 };
  if (reducedMotion) return { core: 0, face: 1, assembly: 0 };
  return {
    core: 1 - smooth(elapsed, IDENTITY_TIMING.coreFadeStart, IDENTITY_TIMING.coreFadeEnd),
    face: smooth(elapsed, IDENTITY_TIMING.faceStart, IDENTITY_TIMING.faceEnd),
    assembly: 1 - smooth(elapsed, IDENTITY_TIMING.faceStart, IDENTITY_TIMING.assemblyEnd),
  };
}
