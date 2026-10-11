export type IdentityStatus = 'loading' | 'ready' | 'unavailable';
export interface IdentityFrame { core: number; face: number; assembly: number }
export interface IdentityPresentation { current: IdentityFrame }

// Bounded local rotations keep the open facial surface mostly front-facing.
export function identityLookTarget(pointerX: number, pointerY: number, centerX: number, centerY: number) {
  return {
    yaw: Math.max(-.22, Math.min(.22, (pointerX - centerX) * .20)),
    pitch: Math.max(-.14, Math.min(.14, -(pointerY - centerY) * .12)),
  };
}

// Seconds from activation. A staged handoff keeps the existing Core geometry intact.
export const IDENTITY_TIMING = { coreFadeStart: 1.0, coreFadeEnd: 3.1, faceStart: .8, faceEnd: 3.4, assemblyEnd: 4.6 };
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
