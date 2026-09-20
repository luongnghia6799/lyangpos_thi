import React, { useState, useEffect, useRef } from 'react';
import { MASCOT_LIST, MASCOT_QUOTES, DEFAULT_MASCOT_CONFIG, playPopSound } from '../lib/mascots';
import { Settings, Volume2, VolumeX } from 'lucide-react';

const DIRECTIONS = [
  'up-left',
  'up',
  'up-right',
  'left',
  'center',
  'right',
  'down-left',
  'down',
  'down-right',
];

const REACTIONS = [
  'blink',
  'heart',
  'sparkle',
  'surprised',
  'wink',
  'bashful',
  'sleepy',
  'dizzy',
  'delighted',
];

const CLOCKWISE = [
  'right',
  'down-right',
  'down',
  'down-left',
  'left',
  'up-left',
  'up',
  'up-right',
];

const SECTOR = (Math.PI * 2) / CLOCKWISE.length;
const HYSTERESIS = 0.16;
const DEAD_ZONE = 70;

const PAYOFFS = ['heart', 'sparkle', 'delighted', 'wink', 'surprised'];
const BOOP_PAYOFF = 130;
const BOOP_END = 580;
const DIZZY_AFTER = 4;
const DIZZY_WINDOW = 1600;
const DIZZY_END = 1100;

function getCellPos(index) {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return `${col * 50}% ${row * 50}%`;
}

function wrapAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

const PageMascot = ({ onOpenSettings }) => {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('lyang_mascot_config');
      if (saved) return { ...DEFAULT_MASCOT_CONFIG, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_MASCOT_CONFIG;
  });

  const [pos, setPos] = useState(() => {
    if (config.position && typeof config.position.x === 'number' && typeof config.position.y === 'number') {
      return config.position;
    }
    const defaultX = typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 160) : 800;
    const defaultY = typeof window !== 'undefined' ? Math.max(20, window.innerHeight - 200) : 500;
    return { x: defaultX, y: defaultY };
  });

  const [quote, setQuote] = useState('');
  const [showQuote, setShowQuote] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef(null);
  const spriteRef = useRef(null);
  const timersRef = useRef([]);
  const boopsRef = useRef({ count: 0, at: 0 });
  const dragStartRef = useRef({ x: 0, y: 0, startPosX: 0, startPosY: 0, moved: false });
  const quoteTimerRef = useRef(null);
  const sectorRef = useRef(-1);
  const isReactingRef = useRef(false);
  const posRef = useRef(pos);
  posRef.current = pos;

  const currentChar = MASCOT_LIST.find((c) => c.id === config.characterId) || MASCOT_LIST[0];

  // Sync external config updates
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
    return () => window.removeEventListener('lyang_mascot_config_updated', handleStorageChange);
  }, []);

  // Window resize bounds clamping
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
            const cur = JSON.parse(localStorage.getItem('lyang_mascot_config') || '{}');
            localStorage.setItem('lyang_mascot_config', JSON.stringify({ ...cur, position: updated }));
          } catch (e) {}
          return updated;
        }
        return prev;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [config.size]);

  // ULTRA LOW POWER (0% GPU) THROTTLED POINTER TRACKING
  useEffect(() => {
    if (!config.enabled) return;

    let lastRun = 0;
    let lastX = -999;
    let lastY = -999;

    const handlePointerMove = (e) => {
      if (isReactingRef.current || dragStartRef.current.moved || !spriteRef.current) return;

      const now = performance.now();
      // Ultra-efficient throttle: 65ms interval (~15fps) and 18px delta threshold
      if (now - lastRun < 65) return;
      if (Math.abs(e.clientX - lastX) < 18 && Math.abs(e.clientY - lastY) < 18) return;

      lastRun = now;
      lastX = e.clientX;
      lastY = e.clientY;

      const currentPos = posRef.current;
      const size = config.size || 110;
      const centerX = currentPos.x + size / 2;
      const centerY = currentPos.y + size / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;

      // Fast rectangular deadzone check (avoids Math.hypot & trigonometry)
      if (Math.abs(dx) < 55 && Math.abs(dy) < 55) {
        if (sectorRef.current !== -1) {
          sectorRef.current = -1;
          spriteRef.current.style.backgroundPosition = '50% 50%';
        }
        return;
      }

      const angle = Math.atan2(dy, dx);
      const currentSector = sectorRef.current;

      // Hysteresis threshold
      if (
        currentSector !== -1 &&
        Math.abs(wrapAngle(angle - currentSector * SECTOR)) < SECTOR / 2 + HYSTERESIS
      ) {
        return;
      }

      const newSector = (Math.round(angle / SECTOR) + CLOCKWISE.length) % CLOCKWISE.length;
      if (newSector !== sectorRef.current) {
        sectorRef.current = newSector;
        const dirName = CLOCKWISE[newSector];
        const dirIdx = DIRECTIONS.indexOf(dirName);
        if (dirIdx >= 0) {
          spriteRef.current.style.backgroundPosition = getCellPos(dirIdx);
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [config.enabled, config.size]);

  // Clean up timers
  useEffect(() => {
    return () => {
      timersRef.current.forEach(window.clearTimeout);
      if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current);
    };
  }, []);

  // Interactive Boop / Reaction logic
  const handleBoop = () => {
    timersRef.current.forEach(window.clearTimeout);
    timersRef.current = [];

    if (config.soundEnabled) {
      playPopSound();
    }

    if (config.showQuotes) {
      const randomQuote = MASCOT_QUOTES[Math.floor(Math.random() * MASCOT_QUOTES.length)];
      setQuote(randomQuote);
      setShowQuote(true);
      if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current);
      quoteTimerRef.current = setTimeout(() => setShowQuote(false), 4000);
    }

    const setReactFrame = (reactionName) => {
      if (!spriteRef.current) return;
      if (!reactionName) {
        // Return to directions
        isReactingRef.current = false;
        spriteRef.current.style.backgroundImage = `url("${currentChar.directions}")`;
        const dirIdx = sectorRef.current >= 0 ? DIRECTIONS.indexOf(CLOCKWISE[sectorRef.current]) : 4;
        spriteRef.current.style.backgroundPosition = getCellPos(dirIdx >= 0 ? dirIdx : 4);
      } else {
        isReactingRef.current = true;
        spriteRef.current.style.backgroundImage = `url("${currentChar.reactions}")`;
        const rIdx = REACTIONS.indexOf(reactionName);
        spriteRef.current.style.backgroundPosition = getCellPos(rIdx >= 0 ? rIdx : 0);
      }
    };

    const later = (ms, next) => {
      timersRef.current.push(window.setTimeout(() => setReactFrame(next), ms));
    };

    const now = Date.now();
    const boops = boopsRef.current;
    boops.count = now - boops.at < DIZZY_WINDOW ? boops.count + 1 : 1;
    boops.at = now;

    if (boops.count >= DIZZY_AFTER) {
      boops.count = 0;
      setReactFrame('dizzy');
      later(DIZZY_END, null);
    } else {
      setReactFrame('blink');
      later(BOOP_PAYOFF, PAYOFFS[(boops.count - 1) % PAYOFFS.length]);
      later(BOOP_END, null);
    }
  };

  // Dragging logic
  const handlePointerDown = (e) => {
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
    if (dragStartRef.current.moved) {
      dragStartRef.current.moved = false;
      return;
    }
    handleBoop();
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (onOpenSettings) onOpenSettings();
  };

  if (!config.enabled) return null;

  const size = config.size || 110;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: `${size}px`,
        height: `${size}px`,
        zIndex: 99999,
        touchAction: 'none',
        userSelect: 'none'
      }}
      className="group select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={handleContextMenu}
    >
      {/* Speech Bubble / Quote */}
      {showQuote && quote && (
        <div
          className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/95 dark:bg-slate-900/95 px-3.5 py-1.5 rounded-2xl shadow-md border border-amber-200/80 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 pointer-events-none flex items-center gap-1.5 z-10"
          style={{ maxWidth: '280px', whiteSpace: 'normal', textAlign: 'center' }}
        >
          <span>{quote}</span>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-900 rotate-45 border-r border-b border-amber-200/80 dark:border-slate-700" />
        </div>
      )}

      {/* Hover Action Badges */}
      <div
        className={`absolute -top-3 -right-2 flex items-center gap-1 z-20 ${
          isHovered && !isDragging ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenSettings) onOpenSettings();
          }}
          title="Cài đặt Mascot (Chuột phải)"
          className="w-6 h-6 rounded-full bg-slate-900/90 text-white flex items-center justify-center shadow-md hover:scale-110 cursor-pointer"
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
          className="w-6 h-6 rounded-full bg-slate-900/90 text-white flex items-center justify-center shadow-md hover:scale-110 cursor-pointer"
        >
          {config.soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} className="text-red-400" />}
        </button>
      </div>

      {/* Single Ultra-Lightweight Sprite Element */}
      <div
        ref={spriteRef}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: `url("${currentChar.directions}")`,
          backgroundSize: '300% 300%',
          backgroundPosition: '50% 50%',
          backgroundRepeat: 'no-repeat',
          cursor: config.locked ? 'pointer' : isDragging ? 'grabbing' : 'grab',
          opacity: config.opacity ?? 1
        }}
        title={`${currentChar.name} - Kéo thả để di chuyển | Nhấp để chọc | Chuột phải để cài đặt`}
      >
        {/* Drag indicator border */}
        {isDragging && (
          <div className="w-full h-full rounded-full border-2 border-emerald-400 pointer-events-none" />
        )}
      </div>
    </div>
  );
};

export default PageMascot;
