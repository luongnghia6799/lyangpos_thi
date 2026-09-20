import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MASCOT_LIST, MASCOT_QUOTES, DEFAULT_MASCOT_CONFIG, playPopSound } from '../lib/mascots';
import { Settings, Volume2, VolumeX, Sparkles, Move, X, Lock, Unlock, RefreshCw } from 'lucide-react';

const PageMascot = ({ onOpenSettings }) => {
  // Load config from localStorage
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('lyang_mascot_config');
      if (saved) {
        return { ...DEFAULT_MASCOT_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_MASCOT_CONFIG;
  });

  // Calculate default position
  const [pos, setPos] = useState(() => {
    if (config.position && typeof config.position.x === 'number' && typeof config.position.y === 'number') {
      return config.position;
    }
    const defaultX = typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 160) : 800;
    const defaultY = typeof window !== 'undefined' ? Math.max(20, window.innerHeight - 200) : 500;
    return { x: defaultX, y: defaultY };
  });

  const [currentChar, setCurrentChar] = useState(() => {
    return MASCOT_LIST.find((c) => c.id === config.characterId) || MASCOT_LIST[0];
  });

  // Direction grid: [col, row] in 3x3 grid (0, 1, 2)
  const [direction, setDirection] = useState([1, 1]); // [col, row]
  const [isReacting, setIsReacting] = useState(false);
  const [reactionFrame, setReactionFrame] = useState(0);
  const [quote, setQuote] = useState('');
  const [showQuote, setShowQuote] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const mascotRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0, startPosX: 0, startPosY: 0, moved: false });
  const quoteTimerRef = useRef(null);
  const reactionTimerRef = useRef(null);

  // Sync config character change
  useEffect(() => {
    const char = MASCOT_LIST.find((c) => c.id === config.characterId) || MASCOT_LIST[0];
    setCurrentChar(char);
  }, [config.characterId]);

  // Sync config updates with external trigger (e.g. from modal)
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('lyang_mascot_config');
        if (saved) {
          const parsed = JSON.parse(saved);
          setConfig((prev) => ({ ...prev, ...parsed }));
          if (parsed.position) {
            setPos(parsed.position);
          }
        }
      } catch (e) {}
    };

    window.addEventListener('lyang_mascot_config_updated', handleStorageChange);
    return () => {
      window.removeEventListener('lyang_mascot_config_updated', handleStorageChange);
    };
  }, []);

  // Ensure mascot stays inside screen when resizing
  useEffect(() => {
    const handleResize = () => {
      setPos((prev) => {
        const size = config.size || 110;
        const maxX = Math.max(10, window.innerWidth - size - 10);
        const maxY = Math.max(10, window.innerHeight - size - 10);
        const newX = Math.min(Math.max(10, prev.x), maxX);
        const newY = Math.min(Math.max(10, prev.y), maxY);
        if (newX !== prev.x || newY !== prev.y) {
          const updated = { x: newX, y: newY };
          try {
            const current = JSON.parse(localStorage.getItem('lyang_mascot_config') || '{}');
            localStorage.setItem('lyang_mascot_config', JSON.stringify({ ...current, position: updated }));
          } catch (e) {}
          return updated;
        }
        return prev;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [config.size]);

  // Mouse tracking calculation for 3x3 direction sheet
  useEffect(() => {
    if (!config.enabled || isReacting) return;

    let rafId = null;

    const handleMouseMove = (e) => {
      if (isDragging) return;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!mascotRef.current) return;
        const rect = mascotRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const distance = Math.hypot(dx, dy);

        // Dead-zone: if cursor is right on or near the mascot, look straight ahead
        const deadZone = (config.size || 110) * 0.35;
        if (distance < deadZone) {
          setDirection([1, 1]);
          return;
        }

        // Angle in radians (-PI to PI)
        const angle = Math.atan2(dy, dx);
        // Normalize angle to 0..2PI
        const normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle;

        // 8 directional sectors (each 45 degrees = PI/4)
        // 0: Right, 1: Bottom-Right, 2: Bottom, 3: Bottom-Left, 4: Left, 5: Top-Left, 6: Top, 7: Top-Right
        const sector = Math.round(normalizedAngle / (Math.PI / 4)) % 8;

        let col = 1;
        let row = 1;

        switch (sector) {
          case 0: // Right
            col = 2; row = 1; break;
          case 1: // Bottom-Right
            col = 2; row = 2; break;
          case 2: // Bottom
            col = 1; row = 2; break;
          case 3: // Bottom-Left
            col = 0; row = 2; break;
          case 4: // Left
            col = 0; row = 1; break;
          case 5: // Top-Left
            col = 0; row = 0; break;
          case 6: // Top
            col = 1; row = 0; break;
          case 7: // Top-Right
            col = 2; row = 0; break;
          default:
            col = 1; row = 1;
        }

        setDirection([col, row]);
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [config.enabled, config.size, isReacting, isDragging]);

  // Trigger poke / reaction animation
  const triggerReaction = useCallback(() => {
    if (isReacting) return;
    setIsReacting(true);

    if (config.soundEnabled) {
      playPopSound();
    }

    // Show funny/motivational quote
    if (config.showQuotes) {
      const randomQuote = MASCOT_QUOTES[Math.floor(Math.random() * MASCOT_QUOTES.length)];
      setQuote(randomQuote);
      setShowQuote(true);

      if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current);
      quoteTimerRef.current = setTimeout(() => {
        setShowQuote(false);
      }, 4000);
    }

    // Cycle through reaction frames (3x3 grid = 9 frames)
    // Plays animated expressive sequence
    const frames = [0, 1, 2, 4, 7, 8, 5, 3, 1, 0];
    let frameIndex = 0;

    if (reactionTimerRef.current) clearInterval(reactionTimerRef.current);

    reactionTimerRef.current = setInterval(() => {
      frameIndex++;
      if (frameIndex >= frames.length) {
        clearInterval(reactionTimerRef.current);
        setIsReacting(false);
        setReactionFrame(0);
      } else {
        setReactionFrame(frames[frameIndex]);
      }
    }, 85);
  }, [isReacting, config.soundEnabled, config.showQuotes]);

  // Dragging logic
  const handlePointerDown = (e) => {
    // Only primary mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (config.locked) return;

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
      moved: false
    };

    const handlePointerMove = (moveEvent) => {
      const dx = moveEvent.clientX - dragStartRef.current.x;
      const dy = moveEvent.clientY - dragStartRef.current.y;

      if (!dragStartRef.current.moved && Math.hypot(dx, dy) > 5) {
        dragStartRef.current.moved = true;
        setIsDragging(true);
      }

      if (dragStartRef.current.moved) {
        const size = config.size || 110;
        const newX = Math.min(Math.max(10, dragStartRef.current.startPosX + dx), window.innerWidth - size - 10);
        const newY = Math.min(Math.max(10, dragStartRef.current.startPosY + dy), window.innerHeight - size - 10);
        setPos({ x: newX, y: newY });
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      if (dragStartRef.current.moved) {
        setIsDragging(false);
        // Persist position
        setPos((latestPos) => {
          try {
            const current = JSON.parse(localStorage.getItem('lyang_mascot_config') || '{}');
            const updated = { ...current, position: latestPos };
            localStorage.setItem('lyang_mascot_config', JSON.stringify(updated));
          } catch (e) {}
          return latestPos;
        });
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleClick = (e) => {
    // If was dragging, do not trigger reaction
    if (dragStartRef.current.moved) {
      dragStartRef.current.moved = false;
      return;
    }
    triggerReaction();
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (onOpenSettings) {
      onOpenSettings();
    }
  };

  if (!config.enabled) return null;

  const size = config.size || 110;

  // Background position for 3x3 sheet
  // Col: 0 -> 0%, 1 -> 50%, 2 -> 100%
  // Row: 0 -> 0%, 1 -> 50%, 2 -> 100%
  let bgPos = '50% 50%';
  let currentSheet = currentChar.directions;

  if (isReacting) {
    currentSheet = currentChar.reactions;
    const rCol = reactionFrame % 3;
    const rRow = Math.floor(reactionFrame / 3);
    bgPos = `${rCol * 50}% ${rRow * 50}%`;
  } else {
    bgPos = `${direction[0] * 50}% ${direction[1] * 50}%`;
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        zIndex: 99999,
        touchAction: 'none',
        userSelect: 'none'
      }}
      className="group transition-transform select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={handleContextMenu}
    >
      {/* Speech Bubble / Quote */}
      {showQuote && quote && (
        <div
          className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-xl border border-amber-200/80 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200 pointer-events-none flex items-center gap-1.5 z-10"
          style={{ maxWidth: '280px', whiteSpace: 'normal', textAlign: 'center' }}
        >
          <span>{quote}</span>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-900 rotate-45 border-r border-b border-amber-200/80 dark:border-slate-700" />
        </div>
      )}

      {/* Hover Action Badges */}
      <div
        className={`absolute -top-3 -right-2 flex items-center gap-1 transition-opacity duration-200 ${
          isHovered && !isDragging ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
        }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenSettings) onOpenSettings();
          }}
          title="Cài đặt Mascot (Chuột phải)"
          className="w-6 h-6 rounded-full bg-slate-900/85 hover:bg-slate-900 text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
        >
          <Settings size={12} />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const updated = { ...config, soundEnabled: !config.soundEnabled };
            setConfig(updated);
            localStorage.setItem('lyang_mascot_config', JSON.stringify(updated));
          }}
          title={config.soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          className="w-6 h-6 rounded-full bg-slate-900/85 hover:bg-slate-900 text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
        >
          {config.soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} className="text-red-400" />}
        </button>
      </div>

      {/* Mascot Sprite Avatar */}
      <div
        ref={mascotRef}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundImage: `url("${currentSheet}")`,
          backgroundSize: '300% 300%',
          backgroundPosition: bgPos,
          backgroundRepeat: 'no-repeat',
          opacity: config.opacity ?? 1,
          cursor: config.locked ? 'pointer' : isDragging ? 'grabbing' : 'grab',
          filter: isDragging ? 'drop-shadow(0 15px 25px rgba(0,0,0,0.35))' : 'drop-shadow(0 8px 16px rgba(0,0,0,0.18))',
          imageRendering: '-webkit-optimize-contrast'
        }}
        className={`transition-all duration-75 relative rounded-full ${
          isReacting ? 'scale-105' : 'hover:scale-102 active:scale-95'
        }`}
        title={`${currentChar.name} - Kéo thả để di chuyển | Nhấp để chọc | Chuột phải để cài đặt`}
      >
        {/* Subtle glow indicator during drag */}
        {isDragging && (
          <div className="absolute inset-0 rounded-full ring-2 ring-emerald-400 ring-offset-2 ring-offset-transparent animate-pulse" />
        )}
      </div>
    </div>
  );
};

export default PageMascot;
