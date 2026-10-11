import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ArrowLeft, Pause, Play } from 'lucide-react';
import { createStudyBust, loadAvatarSurface } from './avatarSurface';
import { HolographicAvatar } from './HolographicAvatar';
import './AvatarPrototype.css';

type View = 'front' | 'quarter' | 'profile';
const VIEWS: { id: View; label: string; angle: number }[] = [
  { id: 'front', label: 'Front', angle: 0 }, { id: 'quarter', label: 'Three-quarter', angle: .46 },
  { id: 'profile', label: 'Profile', angle: Math.PI / 2 },
];

function useMedia(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query), update = () => setMatches(media.matches);
    media.addEventListener('change', update); update();
    return () => media.removeEventListener('change', update);
  }, [query]);
  return matches;
}

class PreviewBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

// Controls run outside React state. Demand rendering still supports dragging and presets.
function PreviewCamera({ view, request, paused, compact, faceMask, onLost, onExplore }: { view: View; request: number; paused: boolean; compact: boolean; faceMask: boolean; onLost: () => void; onExplore: () => void }) {
  const { camera, gl, invalidate, size, setDpr } = useThree();
  const controls = useRef<OrbitControls | null>(null);
  const destination = useRef(new THREE.Vector3());
  const moving = useRef(false);
  const pauseRef = useRef(paused);
  pauseRef.current = paused;
  const quality = useRef({ frames: 0, slow: 0, done: false });
  useEffect(() => {
    const orbit = new OrbitControls(camera, gl.domElement);
    orbit.enablePan = false; orbit.enableZoom = false;
    orbit.enableDamping = !pauseRef.current; orbit.dampingFactor = .09; orbit.rotateSpeed = .45;
    orbit.minPolarAngle = Math.PI * .40; orbit.maxPolarAngle = Math.PI * .60;
    orbit.target.set(0, -.03, 0);
    const changed = () => invalidate(), start = () => { moving.current = false; onExplore(); };
    const lost = (event: Event) => { event.preventDefault(); onLost(); };
    orbit.addEventListener('change', changed); orbit.addEventListener('start', start);
    gl.domElement.addEventListener('webglcontextlost', lost);
    controls.current = orbit;
    return () => {
      orbit.removeEventListener('change', changed); orbit.removeEventListener('start', start); orbit.dispose();
      gl.domElement.removeEventListener('webglcontextlost', lost); controls.current = null;
    };
  }, [camera, gl, invalidate, onLost, onExplore]);
  useEffect(() => {
    const orbit = controls.current;
    if (orbit) { orbit.enableDamping = !paused; orbit.update(); }
    if (paused && moving.current) {
      camera.position.copy(destination.current); camera.lookAt(0, -.03, 0); orbit?.update(); moving.current = false;
    }
    invalidate();
  }, [paused, camera, invalidate]);
  useEffect(() => {
    const orbit = controls.current;
    // Clear any pending drag inertia before moving to a specific camera view.
    if (orbit) { orbit.enableDamping = false; orbit.update(); orbit.enableDamping = !pauseRef.current; }
    // Fit the complete bust at every aspect ratio; reserve room for the projector.
    const radius = compact ? Math.max(size.height < 320 ? 6.9 : 8.1, 3.9 / (size.width / size.height)) : 7.8;
    const angle = faceMask && view === 'quarter' ? Math.PI / 4 : VIEWS.find(item => item.id === view)!.angle;
    destination.current.set(Math.sin(angle) * radius, .22, Math.cos(angle) * radius);
    moving.current = true;
    if (pauseRef.current) {
      camera.position.copy(destination.current); camera.lookAt(0, -.03, 0); orbit?.update(); moving.current = false;
    }
    invalidate();
  }, [view, request, compact, faceMask, size.width, size.height, camera, invalidate]);
  useFrame((_, delta) => {
    if (moving.current) {
      camera.position.lerp(destination.current, 1 - Math.exp(-Math.min(delta, .05) * 5));
      camera.lookAt(0, -.03, 0);
      if (camera.position.distanceToSquared(destination.current) < .00001) moving.current = false;
      else invalidate();
    }
    controls.current?.update();
    const sample = quality.current;
    if (!paused && !sample.done && !document.hidden) {
      sample.frames++;
      if (sample.frames > 60 && delta > 1 / 35) sample.slow++;
      if (sample.frames === 240) { if (sample.slow > 90) setDpr(.85); sample.done = true; }
    }
  });
  return null;
}

export default function AvatarPrototype() {
  const model = new URLSearchParams(window.location.search).get('model');
  const faceMask = model === 'mediapipe';
  const personalized = model === 'hector';
  const [localFile, setLocalFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const compact = useMedia('(max-width: 767px), (pointer: coarse)');
  const reducedMotion = useMedia('(prefers-reduced-motion: reduce)');
  const [manualPause, setManualPause] = useState(false);
  const [visible, setVisible] = useState(() => !document.hidden);
  const [surface, setSurface] = useState<THREE.BufferGeometry | null>(null);
  const [source, setSource] = useState(faceMask ? 'Choose the local MediaPipe facial mask GLB' : 'Preparing temporary geometry…');
  const [failed, setFailed] = useState(false);
  const [counts, setCounts] = useState({ particles: 0, connections: 0 });
  const [view, setView] = useState<View>('quarter');
  const [customView, setCustomView] = useState(false);
  const [request, setRequest] = useState(0);
  const [shell, setShell] = useState(true), [pathways, setPathways] = useState(true);
  const paused = reducedMotion || manualPause;
  const onLost = useCallback(() => setFailed(true), []);
  const onExplore = useCallback(() => setCustomView(true), []);
  const onSampled = useCallback((particles: number, connections: number) => setCounts({ particles, connections }), []);
  useEffect(() => {
    let cancelled = false, owned: THREE.BufferGeometry | null = null;
    const prepare = async () => {
      let geometry: THREE.BufferGeometry;
      let label = 'Temporary study mesh · not a personal likeness';
      if (faceMask) {
        if (!localFile) return;
        const url = URL.createObjectURL(localFile);
        try { geometry = await loadAvatarSurface(url); label = 'Photo-derived MediaPipe facial mask · estimated depth'; }
        catch { if (!cancelled) { setSource('Facial mask could not be loaded · choose a self-contained GLB'); onLost(); } return; }
        finally { URL.revokeObjectURL(url); }
      } else if (personalized) {
        try { geometry = await loadAvatarSurface(`${import.meta.env.BASE_URL}hector-avatar.glb`); label = 'Personalized model · local GLB'; }
        catch { geometry = createStudyBust(); label = 'GLB unavailable · showing temporary study mesh'; }
      } else geometry = createStudyBust();
      if (cancelled) { geometry.dispose(); return; }
      owned = geometry; setSurface(geometry); setSource(label);
    };
    prepare().catch(() => { if (!cancelled) onLost(); });
    return () => { cancelled = true; owned?.dispose(); };
  }, [personalized, faceMask, localFile, onLost]);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  const selectView = (next: View) => { setCustomView(false); setView(next); setRequest(value => value + 1); };
  return <main className="avatar-study" data-motion={paused ? 'reduced' : 'full'} data-model={faceMask ? 'mask' : 'bust'}>
    <header className="avatar-study-header">
      <a href={import.meta.env.BASE_URL} className="avatar-return"><ArrowLeft size={16} /> Portfolio</a>
      <span className="avatar-study-wordmark">THE INTELLIGENCE INTERFACE</span>
      <span className="avatar-study-number">{faceMask ? 'FACIAL MASK / 02' : 'STUDY / 01'}</span>
    </header>
    <section className="avatar-study-copy" aria-labelledby="avatar-study-title">
      <p className="avatar-eyebrow">DIGITAL HUMAN / PROTOTYPE</p>
      <h1 id="avatar-study-title">Identity,<br />{' '}rendered as light<span>.</span></h1>
      <p className="avatar-study-description">{faceMask ? <>A facial surface estimated from one photograph.<br />Exploring likeness through light and neural pathways.</> : <>A human form woven from points of light.<br />A first exploration of presence in the interface.</>}</p>
    </section>
    <div className="avatar-viewport" role={failed ? 'region' : 'img'} aria-label={failed ? 'Hologram unavailable' : faceMask ? 'Interactive three-dimensional holographic facial mask. Drag to rotate, or use the view buttons below.' : 'Interactive three-dimensional holographic head and shoulders. Drag to rotate, or use the view buttons below.'}>
      {!failed && <PreviewBoundary onFailure={onLost}>
        <Canvas camera={{ position: [3.46, .22, 6.99], fov: 37, near: .1, far: 50 }}
          dpr={[1, compact ? 1.15 : 1.6]} frameloop={paused || !visible ? 'demand' : 'always'}
          gl={{ antialias: !compact, alpha: true, powerPreference: 'high-performance' }} fallback={<p>3D view unavailable.</p>}>
          {surface && <HolographicAvatar surface={surface} compact={compact} paused={paused} shell={shell} pathways={pathways} onSampled={onSampled} />}
          <PreviewCamera view={view} request={request} paused={paused} compact={compact} faceMask={faceMask} onLost={onLost} onExplore={onExplore} />
        </Canvas>
      </PreviewBoundary>}
      {failed && <div className="avatar-unavailable" role="status"><strong>3D preview unavailable</strong><p>{faceMask ? 'The facial mask could not be displayed. Try another self-contained GLB.' : 'This device could not display the hologram.'}</p><a href={import.meta.env.BASE_URL}>Explore the portfolio <span aria-hidden="true">↗</span></a></div>}
    </div>
    <aside className="avatar-study-note">
      <span className="avatar-signal" aria-hidden="true" /><span>Holographic presence</span>
      <p role="status">{source}</p>
    </aside>
    <footer className="avatar-study-footer">
      <div className="avatar-view-controls" role="group" aria-label="Avatar camera views">
        {VIEWS.map(item => <button key={item.id} aria-pressed={!customView && view === item.id} disabled={failed} onClick={() => selectView(item.id)}>{item.label}</button>)}
      </div>
      <div className="avatar-layer-controls" role="group" aria-label="Hologram display">
        {faceMask && <>
          <input ref={fileInput} type="file" accept=".glb,model/gltf-binary" hidden onChange={event => {
            const file = event.currentTarget.files?.[0];
            if (file) { setFailed(false); setSurface(null); setCounts({ particles: 0, connections: 0 }); setSource('Preparing local facial mask…'); setLocalFile(file); }
            event.currentTarget.value = '';
          }} />
          <button onClick={() => fileInput.current?.click()}>Load facial mask</button>
        </>}
        <button aria-pressed={shell} disabled={failed} onClick={() => setShell(value => !value)}>Surface</button>
        <button aria-pressed={pathways} disabled={failed} onClick={() => setPathways(value => !value)}>Pathways</button>
        <button className="avatar-motion" aria-label={paused ? 'Resume hologram animation' : 'Pause hologram animation'} aria-pressed={paused}
          disabled={reducedMotion || failed} title={reducedMotion ? 'Your reduced motion preference is active' : undefined} onClick={() => setManualPause(value => !value)}>
          {paused ? <Play size={15} /> : <Pause size={15} />}<span>{paused ? 'Paused' : 'Motion'}</span>
        </button>
      </div>
      <p className="avatar-study-hint">{failed ? '3D unavailable' : counts.particles ? `${counts.particles.toLocaleString()} particles` : 'Preparing surface'}<span>{failed ? 'Use the portfolio link above' : 'Drag to explore'}</span></p>
    </footer>
  </main>;
}
