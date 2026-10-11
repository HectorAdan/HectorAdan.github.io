import { Component, Suspense, lazy, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { SceneProps } from '../canvas/Scene';
import { WebGLFallback } from './WebGLFallback';

const LazyScene = lazy(() => import('../canvas/Scene').then(module => ({ default: module.Scene })));

// Catch download failures as well as renderer failures, keeping navigation usable.
class EnvironmentBoundary extends Component<{ children: ReactNode; fallback: ReactNode; onFailure?: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure?.(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function LoadingScene(props: SceneProps) {
  const [ready, setReady] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const handleReady = useCallback(() => { setReady(true); props.onReady?.(); }, [props.onReady]);
  useEffect(() => {
    if (!ready) return;
    if (props.reducedMotion) { setShowPreview(false); return; }
    const timer = setTimeout(() => setShowPreview(false), 650);
    return () => clearTimeout(timer);
  }, [ready, props.reducedMotion]);
  return <div className="environment-stage" data-ready={ready}>
    {showPreview && <div className="environment-preview">
      <WebGLFallback activeSector={props.activeSector} onSelectSector={props.onSelectSector} reducedMotion isLoading />
      {!ready && <span className="environment-loading" role="status">Preparing the neural environment<span aria-hidden="true">…</span></span>}
    </div>}
    <div className="environment-scene">
      <Suspense fallback={null}><LazyScene {...props} onReady={handleReady} /></Suspense>
    </div>
  </div>;
}

export function Environment(props: SceneProps) {
  const onFailure = useCallback(() => { props.onIdentityStatus?.('unavailable'); props.onReady?.(); }, [props.onIdentityStatus, props.onReady]);
  return <EnvironmentBoundary onFailure={onFailure} fallback={<WebGLFallback activeSector={props.activeSector} onSelectSector={props.onSelectSector} reducedMotion={props.reducedMotion} />}>
    <LoadingScene {...props} />
  </EnvironmentBoundary>;
}
