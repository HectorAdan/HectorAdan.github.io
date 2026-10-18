const ENDPOINT = 'https://hectorportfolio.goatcounter.com/count';

interface AnalyticsHit { path: string; title: string; event?: boolean }
interface GoatCounter {
  no_onload?: boolean;
  endpoint?: string;
  count?: (hit: AnalyticsHit) => void;
}
declare global { interface Window { goatcounter?: GoatCounter } }

let status: 'idle' | 'loading' | 'ready' | 'disabled' = 'idle';
const pending: AnalyticsHit[] = [];

function send(hit: AnalyticsHit) {
  // Analytics must never interrupt navigation, audio or the 3D experience.
  try { window.goatcounter?.count?.(hit); } catch { /* Best effort only. */ }
}

export function initializeAnalytics(production: boolean) {
  if (status !== 'idle') return;
  if (!production || window.location.hostname.toLowerCase() !== 'hectoradan.github.io'
    || new URLSearchParams(window.location.search).has('avatar')) {
    status = 'disabled';
    return;
  }
  status = 'loading';
  try {
    // Manual initial counting prevents duplicate pageviews and excludes query data.
    window.goatcounter = { no_onload: true, endpoint: ENDPOINT };
    const script = document.createElement('script');
    script.id = 'portfolio-analytics';
    script.async = true;
    script.src = 'https://gc.zgo.at/count.js';
    script.dataset.goatcounter = ENDPOINT;
    script.onload = () => {
      if (!window.goatcounter?.count) { status = 'disabled'; pending.length = 0; return; }
      status = 'ready';
      send({ path: window.location.pathname, title: document.title });
      for (const hit of pending.splice(0)) send(hit);
    };
    script.onerror = () => { status = 'disabled'; pending.length = 0; };
    document.head.appendChild(script);
  } catch { status = 'disabled'; pending.length = 0; }
}

/** Only call with fixed event names and public portfolio labels, never form input. */
export function trackAnalyticsEvent(path: string, title: string) {
  const hit = { path, title, event: true };
  if (status === 'ready') send(hit);
  else if (status === 'loading' && pending.length < 20) pending.push(hit);
}
