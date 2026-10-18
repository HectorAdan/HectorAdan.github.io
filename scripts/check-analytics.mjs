import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = await readFile('src/utils/analytics.ts', 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function harness({ hostname = 'hectoradan.github.io', search = '', failAppend = false } = {}) {
  const scripts = [], hits = [], exports = {};
  const window = { location: { hostname, search, pathname: '/' } };
  const document = {
    title: 'The Intelligence Interface',
    createElement(tag) { assert.equal(tag, 'script'); return { dataset: {} }; },
    head: { appendChild(script) { if (failAppend) throw new Error('blocked'); scripts.push(script); } },
  };
  runInNewContext(compiled, { exports, window, document, URLSearchParams });
  return { ...exports, scripts, hits, window,
    load() {
      window.goatcounter.count = hit => hits.push(JSON.parse(JSON.stringify(hit)));
      scripts[0].onload();
    },
  };
}

for (const options of [
  { hostname: 'localhost' }, { hostname: '127.0.0.1' }, { hostname: '192.168.1.20' },
  { hostname: 'preview.example.com' }, { hostname: 'hectoradan.github.io.evil.test' },
  { search: '?avatar=prototype' }, { search: '?avatar=talking' },
]) {
  const app = harness(options);
  app.initializeAnalytics(true);
  app.trackAnalyticsEvent('meet-hector', 'Meet Hector');
  assert.equal(app.scripts.length, 0, 'Non-production domains and avatar studies must never load analytics');
  assert.equal(app.hits.length, 0);
}
{
  const app = harness();
  app.initializeAnalytics(false);
  assert.equal(app.scripts.length, 0, 'A dev build must never track, even on the production hostname');
}
{
  const app = harness({ hostname: 'HectorAdan.github.io', search: '?utm_source=test&message=private-test-value' });
  app.initializeAnalytics(true);
  app.initializeAnalytics(true);
  assert.equal(app.scripts.length, 1, 'Repeated initialization must not load duplicate trackers');
  const script = app.scripts[0];
  assert.equal(script.async, true);
  assert.equal(script.src, 'https://gc.zgo.at/count.js');
  assert.equal(script.dataset.goatcounter, 'https://hectorportfolio.goatcounter.com/count');
  assert.equal(app.window.goatcounter.no_onload, true, 'Initial count must be under our control');
  app.trackAnalyticsEvent('meet-hector', 'Meet Hector');
  assert.equal(app.hits.length, 0, 'An early interaction must wait for the script');
  app.load();
  assert.deepEqual(app.hits, [
    { path: '/', title: 'The Intelligence Interface' },
    { path: 'meet-hector', title: 'Meet Hector', event: true },
  ]);
  app.trackAnalyticsEvent('case-study-simfinanzas', 'Read case study: SimFinanzas');
  assert.equal(app.hits.length, 3);
  assert.ok(!JSON.stringify(app.hits).includes('private-test-value'), 'URL query data must not be collected');
  app.window.goatcounter.count = () => { throw new Error('tracker unavailable'); };
  assert.doesNotThrow(() => app.trackAnalyticsEvent('section-contact', 'Open contact section'));
}
{
  const app = harness();
  app.initializeAnalytics(true);
  for (let i = 0; i < 50; i++) app.trackAnalyticsEvent('meet-hector', 'Meet Hector');
  app.load();
  assert.equal(app.hits.length, 21, 'Loading queue is bounded to 20 interactions plus the page visit');
}
for (const failure of ['network', 'missing-api', 'append']) {
  const app = harness({ failAppend: failure === 'append' });
  assert.doesNotThrow(() => app.initializeAnalytics(true));
  app.trackAnalyticsEvent('meet-hector', 'Meet Hector');
  if (failure === 'network') app.scripts[0].onerror();
  if (failure === 'missing-api') app.scripts[0].onload();
  assert.doesNotThrow(() => app.trackAnalyticsEvent('section-contact', 'Open contact section'));
  assert.equal(app.hits.length, 0, 'Unavailable analytics must not report or interrupt the application');
}
console.log('Analytics: production-only loading, preview exclusion, one page visit, query omission, queued events and graceful failures passed. No network requests sent.');
