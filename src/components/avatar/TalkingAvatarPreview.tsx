import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ArrowLeft, Play, Pause, RotateCcw, Upload } from 'lucide-react';
import { HolographicAvatar } from './HolographicAvatar';
import { loadTalkingSurface } from './talkingSurface';
import { analyzeSpeech, blinkSchedule, captionAtTime, INTRO_CAPTIONS, parseCaptions, speechPose, type CaptionCue, type MotionPose, type SpeechTrack } from './talkingMotion';
import './TalkingAvatarPreview.css';

const TALK_CAMERA = { position: [0, 0, 7.1] as [number, number, number], fov: 37, near: .1, far: 40 };

function useMedia(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => { const media = window.matchMedia(query), update = () => setMatches(media.matches); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, [query]);
  return matches;
}

class TalkingBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function TalkingScene({ audio, track, playing, reducedMotion, compact, particles, time, originalMorphs, onFailure }: {
  audio: RefObject<HTMLAudioElement | null>; track: SpeechTrack | null; playing: boolean; reducedMotion: boolean; compact: boolean; particles: boolean; time: number; originalMorphs: boolean; onFailure: () => void;
}) {
  const { camera, size, gl, invalidate } = useThree();
  const [surface, setSurface] = useState<THREE.BufferGeometry | null>(null);
  const group = useRef<THREE.Group>(null);
  const pose = useRef<MotionPose>({ weights: { jawOpen: 0, eyeBlinkLeft: 0, eyeBlinkRight: 0 }, head: [0, 0, 0] });
  const morphs = useMemo(() => ({ current: pose.current.weights }), []);
  const blinks = useMemo(() => blinkSchedule(track?.duration ?? 28), [track]);
  useEffect(() => {
    let cancelled = false, owned: THREE.BufferGeometry | null = null;
    setSurface(null);
    loadTalkingSurface(`${import.meta.env.BASE_URL}models/hector-mediapipe-poc.glb`, !originalMorphs).then(geometry => {
      if (cancelled) { geometry.dispose(); return; }
      owned = geometry; setSurface(geometry); invalidate();
    }).catch(() => { if (!cancelled) onFailure(); });
    return () => { cancelled = true; owned?.dispose(); };
  }, [invalidate, onFailure, originalMorphs]);
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => gl.domElement.removeEventListener('webglcontextlost', lost);
  }, [gl, onFailure]);
  useEffect(() => {
    const distance = Math.max(7.1, 3.8 / (size.width / size.height));
    camera.position.set(0, 0, distance); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix(); invalidate();
  }, [camera, size.width, size.height, invalidate]);
  useEffect(() => { invalidate(); }, [playing, particles, track, reducedMotion, time, invalidate]);
  useFrame(() => {
    const time = audio.current?.currentTime ?? 0;
    if (track) speechPose(track, time, blinks, reducedMotion, pose.current);
    else { Object.keys(pose.current.weights).forEach(name => { pose.current.weights[name] = 0; }); pose.current.head.fill(0); }
    if (group.current) group.current.rotation.set(...pose.current.head);
  }, -1);
  return surface ? <group ref={group}>
    <HolographicAvatar surface={surface} compact={compact} paused={!playing || reducedMotion} shell pathways={particles} particles={particles}
      surfaceOpacity={particles ? .06 : .85} projector={false} emergingIdentity morphPose={morphs} />
  </group> : null;
}

export default function TalkingAvatarPreview() {
  const audio = useRef<HTMLAudioElement>(null), input = useRef<HTMLInputElement>(null), captionInput = useRef<HTMLInputElement>(null);
  const compact = useMedia('(max-width: 767px), (pointer: coarse)'), reducedMotion = useMedia('(prefers-reduced-motion: reduce)');
  const dpr = useMemo<[number, number]>(() => [1, compact ? 1.15 : 1.5], [compact]);
  const glOptions = useMemo(() => ({ alpha: true, antialias: !compact }), [compact]);
  const [file, setFile] = useState<File | null>(null), [source, setSource] = useState('');
  const [track, setTrack] = useState<SpeechTrack | null>(null), [playing, setPlaying] = useState(false), [time, setTime] = useState(0);
  const [error, setError] = useState(''), [failed, setFailed] = useState(false), [particles, setParticles] = useState(true);
  const [originalMorphs, setOriginalMorphs] = useState(false);
  const [cues, setCues] = useState<CaptionCue[]>(INTRO_CAPTIONS);
  const customCaptions = useRef(false);
  const [visible, setVisible] = useState(() => !document.hidden);
  const onFailure = useCallback(() => setFailed(true), []);
  useEffect(() => {
    const update = () => { setVisible(!document.hidden); if (document.hidden) audio.current?.pause(); };
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    const url = URL.createObjectURL(file), context = new AudioContext();
    setSource(url); setTrack(null); setError(''); setTime(0); setPlaying(false);
    file.arrayBuffer().then(bytes => context.decodeAudioData(bytes)).then(buffer => {
      if (cancelled) return;
      const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));
      const next = analyzeSpeech(channels, buffer.sampleRate);
      setTrack(next);
      if (!customCaptions.current && Math.abs(next.duration - 28.01) > .5) setCues([]);
      else if (!customCaptions.current) setCues(INTRO_CAPTIONS);
    }).catch(() => { if (!cancelled) setError('This browser could not decode the recording. Choose a WAV, MP3 or M4A audio file instead.'); })
      .finally(() => { void context.close().catch(() => {}); });
    const element = audio.current;
    return () => { cancelled = true; element?.pause(); URL.revokeObjectURL(url); void context.close().catch(() => {}); };
    // Caption edits must not reload or restart the recording.
  }, [file]);
  const play = async (replay = false) => {
    const element = audio.current;
    if (!element || !track) return;
    if (replay || element.ended) { element.currentTime = 0; setTime(0); }
    try { await element.play(); setError(''); }
    catch { setError('Playback could not start. Press Play introduction again.'); }
  };
  const caption = captionAtTime(cues, time);
  const duration = track?.duration ?? 0;
  const clock = (value: number) => `${Math.floor(value / 60)}:${Math.floor(value % 60).toString().padStart(2, '0')}`;
  return <main className="talking-study">
    <header className="talking-header">
      <a href={import.meta.env.BASE_URL}><ArrowLeft size={16} /> Portfolio</a><span>THE INTELLIGENCE INTERFACE</span><span>SPEECH STUDY / 03</span>
    </header>
    <section className="talking-copy" aria-labelledby="talking-title">
      <p className="talking-eyebrow">HOLOGRAPHIC IDENTITY</p>
      <h1 id="talking-title">A voice,<br />rendered as light<span>.</span></h1>
      <p>Your recording. A first exploration of speech, presence, and neural motion.</p>
      <input ref={input} type="file" accept="audio/*,video/mp4,video/quicktime,.mp4,.wav,.mp3,.m4a" hidden onChange={event => {
        const next = event.currentTarget.files?.[0]; if (next) { audio.current?.pause(); setFile(next); } event.currentTarget.value = '';
      }} />
      <button className="talking-load" onClick={() => input.current?.click()}><Upload size={15} />{file ? 'Change recording' : 'Choose introduction recording'}</button>
      <p className="talking-private">The file stays on this device. Audio and video are never uploaded.</p>
      <p className="talking-source" role="status">{file ? track ? `${file.name} · ${clock(duration)}` : error ? 'The recording could not be prepared.' : 'Preparing the recording…' : 'Choose your recorded introduction video or audio to begin.'}</p>
      {error && <p className="talking-error" role="alert">{error}</p>}
    </section>
    <div className="talking-viewport" role="img" aria-label="Mostly front-facing holographic facial mask, animated from the recording's audio">
      {!failed && <TalkingBoundary onFailure={onFailure}><Canvas camera={TALK_CAMERA}
        dpr={dpr} frameloop={playing && visible ? 'always' : 'demand'} gl={glOptions}
        fallback={<p className="talking-fallback">3D is unavailable. Audio and captions still work.</p>}>
        <TalkingScene audio={audio} track={track} playing={playing} reducedMotion={reducedMotion} compact={compact} particles={particles} time={time} originalMorphs={originalMorphs} onFailure={onFailure} />
      </Canvas></TalkingBoundary>}
      {failed && <p className="talking-fallback" role="status">The 3D face could not load. Audio playback and captions are still available.</p>}
    </div>
    <div className="talking-captions" aria-label="Introduction captions" aria-live="off">
      <span>{caption || (track ? playing ? '…' : time >= duration - .1 ? 'Introduction complete.' : time > 0 ? 'Paused' : 'Press play to begin.' : 'Your introduction, in your own words.')}</span>
    </div>
    <footer className="talking-footer">
      <audio ref={audio} src={source || undefined} preload="auto" onPlay={() => setPlaying(true)} onPause={() => { setPlaying(false); setTime(audio.current?.currentTime ?? 0); }} onEnded={() => { setPlaying(false); setTime(audio.current?.currentTime ?? 0); }}
        onTimeUpdate={() => setTime(audio.current?.currentTime ?? 0)} onSeeked={() => setTime(audio.current?.currentTime ?? 0)} onError={() => { if (source) setError('The recording could not be played. Choose a supported audio file.'); }} />
      <div className="talking-progress">
        <span>{clock(time)}</span><input type="range" aria-label="Introduction playback position" min={0} max={duration || 1} step={.01} value={Math.min(time, duration)} disabled={!track}
          onChange={event => { const next = Number(event.currentTarget.value); if (audio.current) audio.current.currentTime = next; setTime(next); }} /><span>{clock(duration)}</span>
      </div>
      <div className="talking-controls">
        <button disabled={!track} onClick={() => { if (playing) audio.current?.pause(); else void play(); }} aria-label={playing ? 'Pause introduction' : 'Play introduction'}>
          {playing ? <Pause size={16} /> : <Play size={16} />}{playing ? 'Pause' : 'Play introduction'}</button>
        <button disabled={!track} onClick={() => void play(true)}><RotateCcw size={15} />Replay</button>
        <button disabled={failed} onClick={() => setParticles(value => !value)} aria-pressed={particles} aria-label="Toggle holographic particles">{particles ? 'Particles on' : 'Particles off'}</button>
        <input ref={captionInput} type="file" accept=".vtt,text/vtt" hidden onChange={event => {
          const next = event.currentTarget.files?.[0]; if (next) void next.text().then(text => { setCues(parseCaptions(text)); customCaptions.current = true; setError(''); }).catch(e => setError(e instanceof Error ? e.message : 'Captions could not be loaded.'));
          event.currentTarget.value = '';
        }} />
        <button onClick={() => captionInput.current?.click()}>Load captions</button>
      </div>
      <p className="talking-method">Jaw follows measured audio energy. Captions use your transcript with estimated sentence timing.{reducedMotion && ' Reduced motion: head movement, blinking and pulses are off.'}</p>
      <details className="talking-limitations"><summary>About this speech study</summary>
        <p>The original GLB is unchanged. Its three nonzero morphs are simple translations. The preview localizes jaw movement to the lower lip and chin and adjusts the actual eyelid boundaries to close together. These are small in-memory corrections to the same three shapes, not a new rig. Speech still follows amplitude rather than phonemes.</p>
        <label className="talking-original"><input type="checkbox" checked={originalMorphs} onChange={event => setOriginalMorphs(event.currentTarget.checked)} />Use original GLB morph shapes for comparison</label>
        <p>The supplied captions match the 28-second reference recording. For a different recording, load a timed WebVTT file. Play, pause, replay and seeking share the audio playback clock.</p>
      </details>
    </footer>
  </main>;
}
