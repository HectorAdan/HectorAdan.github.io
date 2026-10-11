import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const AvatarPrototype = React.lazy(() => import('./components/avatar/AvatarPrototype'));
const TalkingAvatarPreview = React.lazy(() => import('./components/avatar/TalkingAvatarPreview'));
const avatarMode = new URLSearchParams(window.location.search).get('avatar');
const isAvatarPrototype = avatarMode === 'prototype';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {avatarMode === 'talking'
      ? <React.Suspense fallback={<div role="status" style={{ padding: 32 }}>Preparing speech study…</div>}><TalkingAvatarPreview /></React.Suspense>
      : isAvatarPrototype
      ? <React.Suspense fallback={<div role="status" style={{ padding: 32 }}>Preparing holographic study…</div>}><AvatarPrototype /></React.Suspense>
      : <App />}
  </React.StrictMode>
);
