import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'


registerSW({
  onNeedRefresh() { /* prompt user, then call updateSW() */ },
  onOfflineReady() { /* notify “ready offline” */ }
});

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);