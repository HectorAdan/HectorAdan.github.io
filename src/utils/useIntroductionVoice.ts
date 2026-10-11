import { useCallback, useEffect, useMemo, useState } from 'react';
import { IntroductionVoice, type VoiceStatus } from './introductionVoice';
import { IDENTITY_TIMING, type IdentityStatus } from './identityIntroduction';

export function useIntroductionVoice(open: boolean, muted: boolean, identityStatus: IdentityStatus, reducedMotion: boolean) {
  const voice = useMemo(() => new IntroductionVoice(`${import.meta.env.BASE_URL}audio/hector-introduction.mp3`), []);
  const [status, setStatus] = useState<VoiceStatus>('idle');
  useEffect(() => {
    const unsubscribe = voice.subscribe(setStatus);
    const hidden = () => { if (document.hidden) voice.pause(); };
    document.addEventListener('visibilitychange', hidden);
    return () => { unsubscribe(); document.removeEventListener('visibilitychange', hidden); voice.dispose(); };
  }, [voice]);
  useEffect(() => { voice.setFaceReady(identityStatus !== 'loading'); }, [identityStatus, voice]);
  useEffect(() => { voice.setMuted(muted); }, [muted, voice]);
  useEffect(() => { if (!open) voice.stop(); }, [open, voice]);
  const start = useCallback(() => {
    void voice.start(reducedMotion || identityStatus === 'unavailable' ? 0 : IDENTITY_TIMING.assemblyEnd);
  }, [voice, reducedMotion, identityStatus]);
  const toggle = useCallback(() => {
    if (status === 'paused') void voice.resume();
    else if (status === 'playing' || status === 'waiting' || status === 'loading') voice.pause();
    else void voice.start(0);
  }, [voice, status]);
  return { voice, status, start, toggle, active: open && (status === 'playing' || status === 'waiting' || status === 'loading') };
}
