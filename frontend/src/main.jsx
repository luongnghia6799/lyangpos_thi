import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Native Tauri Fullscreen & Escape Hotkey Handler
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F11') {
      e.preventDefault();
      if (window.__TAURI__) {
        window.__TAURI__.core.invoke('toggle_fullscreen')
          .then(() => {
            window.dispatchEvent(new CustomEvent('tauri-fullscreenchange'));
          })
          .catch(console.error);
      }
    }
  }, true); // useCapture to intercept early and reliably
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
