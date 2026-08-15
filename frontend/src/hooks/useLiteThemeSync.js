import { useState, useEffect } from 'react';

export function useLiteThemeSync() {
  const [config, setConfig] = useState(() => {
    return {
      bgColor: localStorage.getItem('pos_lite_bg_color') || "#f4ecd8",
      fontSize: localStorage.getItem('pos_lite_font_size') || "16px",
      soundMuted: localStorage.getItem('pos_lite_sounds_muted') === 'true',
      graphicsMode: localStorage.getItem('pos_lite_graphics_mode') || 'high'
    };
  });

  // Apply eco-mode globally
  useEffect(() => {
    if (config.graphicsMode === 'eco') {
      document.body.classList.add('lite-eco-mode');
    } else {
      document.body.classList.remove('lite-eco-mode');
    }
  }, [config.graphicsMode]);

  useEffect(() => {
    const handleStorage = (e) => {
      if (['pos_lite_bg_color', 'pos_lite_font_size', 'pos_lite_sounds_muted', 'pos_lite_graphics_mode'].includes(e.key)) {
        setConfig({
          bgColor: localStorage.getItem('pos_lite_bg_color') || "#f4ecd8",
          fontSize: localStorage.getItem('pos_lite_font_size') || "16px",
          soundMuted: localStorage.getItem('pos_lite_sounds_muted') === 'true',
          graphicsMode: localStorage.getItem('pos_lite_graphics_mode') || 'high'
        });
      }
    };
    
    const handleCustomEvent = (e) => {
      if (e.detail) {
        setConfig(prev => ({ ...prev, ...e.detail }));
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('liteThemeChange', handleCustomEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('liteThemeChange', handleCustomEvent);
    };
  }, []);

  const changeTheme = (newColor) => {
    localStorage.setItem('pos_lite_bg_color', newColor);
    setConfig(prev => {
      const next = { ...prev, bgColor: newColor };
      window.dispatchEvent(new CustomEvent('liteThemeChange', { detail: next }));
      return next;
    });
  };

  const changeFontSize = (newSize) => {
    localStorage.setItem('pos_lite_font_size', newSize);
    setConfig(prev => {
      const next = { ...prev, fontSize: newSize };
      window.dispatchEvent(new CustomEvent('liteThemeChange', { detail: next }));
      return next;
    });
  };

  const toggleSound = (muted) => {
    localStorage.setItem('pos_lite_sounds_muted', muted ? 'true' : 'false');
    setConfig(prev => {
      const next = { ...prev, soundMuted: muted };
      window.dispatchEvent(new CustomEvent('liteThemeChange', { detail: next }));
      return next;
    });
  };

  const setGraphicsMode = (mode) => {
    localStorage.setItem('pos_lite_graphics_mode', mode);
    setConfig(prev => {
      const next = { ...prev, graphicsMode: mode };
      window.dispatchEvent(new CustomEvent('liteThemeChange', { detail: next }));
      return next;
    });
  };

  return { 
    bgColor: config.bgColor, 
    fontSize: config.fontSize, 
    soundMuted: config.soundMuted,
    graphicsMode: config.graphicsMode,
    changeTheme,
    changeFontSize,
    toggleSound,
    setGraphicsMode
  };
}
