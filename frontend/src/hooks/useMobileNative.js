import { useEffect, useCallback, useMemo } from 'react';

/**
 * Custom hook to interface with Android Native App & Webview functionality
 */
export function useMobileNative() {
  const isAndroid = useMemo(() => {
    return /Android/i.test(navigator.userAgent) || Boolean(window.LyangNative);
  }, []);

  const triggerHaptic = useCallback((pattern = 'medium') => {
    try {
      if (window.LyangNative?.vibrate) {
        window.LyangNative.vibrate(pattern);
        return;
      }

      if (typeof window !== 'undefined' && window.navigator?.vibrate) {
        switch (pattern) {
          case 'light':
            window.navigator.vibrate(10);
            break;
          case 'medium':
            window.navigator.vibrate(18);
            break;
          case 'heavy':
            window.navigator.vibrate([30, 40, 30]);
            break;
          case 'success':
            window.navigator.vibrate([12, 30, 12]);
            break;
          case 'warning':
            window.navigator.vibrate([20, 50, 20]);
            break;
          default:
            window.navigator.vibrate(15);
        }
      }
    } catch {
      // Ignore vibration unsupported errors
    }
  }, []);

  const setStatusBarColor = useCallback((color) => {
    try {
      if (window.LyangNative?.setStatusBarColor) {
        window.LyangNative.setStatusBarColor(color);
      }
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', color);
    } catch {
      // Ignore meta tag errors
    }
  }, []);

  return {
    isAndroid,
    triggerHaptic,
    setStatusBarColor
  };
}

export default useMobileNative;
