import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const AvatarPrototype = React.lazy(() => import('./components/avatar/AvatarPrototype'));
const isAvatarPrototype = new URLSearchParams(window.location.search).get('avatar') === 'prototype';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isAvatarPrototype
      ? <React.Suspense fallback={<div role="status" style={{ padding: 32 }}>Preparing holographic study…</div>}><AvatarPrototype /></React.Suspense>
      : <App />}
  </React.StrictMode>
);
