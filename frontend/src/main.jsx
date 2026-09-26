import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/layout/ErrorBoundary.jsx'
import { applyCartThemeToDom } from './components/modals/CartColorCustomizerModal.jsx'

// Native Tauri Fullscreen & Escape Hotkey Handler & Theme Sync
if (typeof window !== 'undefined') {
  applyCartThemeToDom();
  try {
    const syncChannel = new BroadcastChannel('pos_data_sync');
    syncChannel.addEventListener('message', (e) => {
      if (e.data?.type === 'CART_COLOR_CONFIG_UPDATED' || (e.data?.type === 'UI_SETTING_UPDATED' && e.data?.key === 'pos_cart_color_config')) {
        try {
          const parsed = typeof e.data.value === 'string' ? JSON.parse(e.data.value) : e.data.value;
          applyCartThemeToDom(parsed);
        } catch (err) {
          applyCartThemeToDom();
        }
      }
    });
  } catch (e) {}

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
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
)
