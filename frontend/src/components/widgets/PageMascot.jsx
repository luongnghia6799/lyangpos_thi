import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { MASCOT_LIST, MASCOT_QUOTES, DEFAULT_MASCOT_CONFIG, playPopSound } from '../../lib/mascots';

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
const HYSTERESIS = 0.08;
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

const PageMascot = ({ onOpenSettings, onPosChange, onOpenAiConsultant }) => {
  const [currentHash, setCurrentHash] = useState(() => (typeof window !== 'undefined' ? window.location.hash : ''));
  useEffect(() => {
    const handleHash = () => setCurrentHash(window.location.hash || '');
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('lyang_mascot_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.characterId === 'cheobingo' || !parsed.characterId) {
          parsed.characterId = 'lyang';
          localStorage.setItem('lyang_mascot_config', JSON.stringify(parsed));
        }
        return { ...DEFAULT_MASCOT_CONFIG, ...parsed };
      }
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
  const blinkTimerRef = useRef(null);
  const rafRef = useRef(null);
  const lastPointerRef = useRef((typeof window !== 'undefined' && window.__lyangLastPointer) ? { ...window.__lyangLastPointer } : { x: -999, y: -999 });
  const sectorRef = useRef(-1);
  const isReactingRef = useRef(false);
  const updateHeadRef = useRef(null);
  const currentBgPosRef = useRef('50% 50%');
  const posRef = useRef(pos);
  posRef.current = pos;

  const currentChar = MASCOT_LIST.find((c) => c.id === config.characterId) || MASCOT_LIST[0];

  // Tính toán biên kéo: cho phép phần hiển thị nhân vật chạm sát mép màn hình (bù trừ khoảng đệm trong suốt của sprite)
  const getBounds = (curSize) => {
    if (typeof window === 'undefined') return { minX: 0, maxX: 1000, minY: 0, maxY: 1000 };
    const padX = Math.round(curSize * 0.22);
    const padY = Math.round(curSize * 0.12);
    const minX = -padX;
    const maxX = window.innerWidth - curSize + padX;
    const minY = -padY;
    const maxY = window.innerHeight - curSize + padY;
    return { minX, maxX, minY, maxY };
  };

  // Update background sprite immediately when character changes
  useEffect(() => {
    if (spriteRef.current && currentChar?.directions && !isReactingRef.current) {
      spriteRef.current.style.backgroundImage = `url("${currentChar.directions}")`;
    }
  }, [currentChar]);

  // Sync external config updates
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('lyang_mascot_config');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.characterId === 'cheobingo') {
            parsed.characterId = 'lyang';
          }
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

  // Notify parent of initial pos
  useEffect(() => {
    if (onPosChange) onPosChange(pos, config.size || 110);
  }, [pos, config.size]);

  // Window resize bounds clamping
  useEffect(() => {
    const handleResize = () => {
      setPos((prev) => {
        const size = config.size || 110;
        const { minX, maxX, minY, maxY } = getBounds(size);
        const newX = Math.min(Math.max(minX, prev.x), maxX);
        const newY = Math.min(Math.max(minY, prev.y), maxY);
        if (newX !== prev.x || newY !== prev.y) {
          const updated = { x: newX, y: newY };
          try {
            const cur = JSON.parse(localStorage.getItem('lyang_mascot_config') || '{}');
            localStorage.setItem('lyang_mascot_config', JSON.stringify({ ...cur, position: updated }));
          } catch (e) {}
          if (onPosChange) onPosChange(updated, size);
          return updated;
        }
        return prev;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [config.size]);

  // BUTTERY-SMOOTH rAF POINTER TRACKING & 2.5D HEAD MICRO-TILT
  const updateHead = useCallback(() => {
    rafRef.current = null;
    if (isReactingRef.current || dragStartRef.current.moved || !spriteRef.current) return;

    let px = lastPointerRef.current.x;
    let py = lastPointerRef.current.y;
    if (px < 0 || py < 0) {
      if (typeof window !== 'undefined' && window.__lyangLastPointer) {
        px = window.__lyangLastPointer.x;
        py = window.__lyangLastPointer.y;
        lastPointerRef.current = { x: px, y: py };
      } else {
        return;
      }
    }

    const currentPos = posRef.current;
    const size = config.size || 110;
    const centerX = currentPos.x + size / 2;
    const centerY = currentPos.y + size / 2;

    const dx = px - centerX;
    const dy = py - centerY;
    const distSq = dx * dx + dy * dy;

    // Smooth micro 2.5D perspective tilt towards mouse cursor
    const maxDist = Math.max(window.innerWidth || 1200, window.innerHeight || 800);
    const dist = Math.sqrt(distSq);
    const factor = Math.min(1, dist / (maxDist * 0.35));
    const tiltX = dist > 0 ? (dx / dist) * factor * 3.2 : 0;
    const tiltY = dist > 0 ? (dy / dist) * factor * 3.2 : 0;
    const tiltRotate = dist > 0 ? (dx / dist) * factor * 4.2 : 0;

    spriteRef.current.style.transform = `translate3d(${tiltX.toFixed(2)}px, ${tiltY.toFixed(2)}px, 0px) rotate(${tiltRotate.toFixed(2)}deg)`;

    // Deadzone check: looking directly at user when mouse is on mascot
    const deadzoneRadius = Math.max(38, size * 0.35);
    if (distSq < deadzoneRadius * deadzoneRadius) {
      if (sectorRef.current !== -1) {
        sectorRef.current = -1;
        currentBgPosRef.current = '50% 50%';
        spriteRef.current.style.backgroundPosition = '50% 50%';
      }
      return;
    }

    const angle = Math.atan2(dy, dx);
    const currentSector = sectorRef.current;

    // Hysteresis threshold to prevent jittering on sector boundaries
    if (
      currentSector !== -1 &&
      Math.abs(wrapAngle(angle - currentSector * SECTOR)) < SECTOR / 2 + HYSTERESIS
    ) {
      if (spriteRef.current.style.backgroundPosition !== currentBgPosRef.current) {
        spriteRef.current.style.backgroundPosition = currentBgPosRef.current;
      }
      return;
    }

    const newSector = (Math.round(angle / SECTOR) + CLOCKWISE.length) % CLOCKWISE.length;
    sectorRef.current = newSector;
    const dirName = CLOCKWISE[newSector];
    const dirIdx = DIRECTIONS.indexOf(dirName);
    if (dirIdx >= 0 && spriteRef.current) {
      const pos = getCellPos(dirIdx);
      currentBgPosRef.current = pos;
      spriteRef.current.style.backgroundPosition = pos;
    }
  }, [config.size]);

  useEffect(() => {
    updateHeadRef.current = updateHead;
  }, [updateHead]);

  useEffect(() => {
    if (!config.enabled) return;

    const handlePointerMove = (e) => {
      lastPointerRef.current.x = e.clientX;
      lastPointerRef.current.y = e.clientY;
      if (typeof window !== 'undefined') {
        window.__lyangLastPointer = { x: e.clientX, y: e.clientY };
      }

      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(updateHead);
      }
    };

    // If pointer position is already known in session, sync head angle immediately
    if (typeof window !== 'undefined' && window.__lyangLastPointer) {
      lastPointerRef.current = { ...window.__lyangLastPointer };
      updateHead();
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [config.enabled, updateHead]);



  // Clean up timers
  useEffect(() => {
    return () => {
      timersRef.current.forEach(window.clearTimeout);
      if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current);
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
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
        spriteRef.current.style.backgroundPosition = currentBgPosRef.current || '50% 50%';
        updateHeadRef.current?.();
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

  // Lắng nghe sự kiện cảm xúc từ Lí An AI Chatbot
  useEffect(() => {
    const handleReactEvent = (e) => {
      const reaction = e.detail?.reaction || 'sparkle';
      if (!spriteRef.current || !currentChar?.reactions) return;
      isReactingRef.current = true;
      spriteRef.current.style.backgroundImage = `url("${currentChar.reactions}")`;
      const rIdx = REACTIONS.indexOf(reaction);
      spriteRef.current.style.backgroundPosition = getCellPos(rIdx >= 0 ? rIdx : 0);

      if (e.detail?.quote) {
        setQuote(e.detail.quote);
        setShowQuote(true);
        if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current);
        quoteTimerRef.current = setTimeout(() => setShowQuote(false), 3500);
      }

      window.setTimeout(() => {
        isReactingRef.current = false;
        if (spriteRef.current) {
          spriteRef.current.style.backgroundImage = `url("${currentChar.directions}")`;
          spriteRef.current.style.backgroundPosition = currentBgPosRef.current || '50% 50%';
        }
      }, e.detail?.duration || 1400);
    };

    window.addEventListener('lyang_mascot_react', handleReactEvent);
    return () => window.removeEventListener('lyang_mascot_react', handleReactEvent);
  }, [currentChar]);

  // Scroll wheel để phóng to / thu nhỏ Mascot
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaY;
      const step = delta > 0 ? -5 : 5; // Lăn xuống -> thu nhỏ, lăn lên -> phóng to

      setConfig((prevConfig) => {
        const curSize = prevConfig.size || 110;
        const nextSize = Math.min(240, Math.max(50, curSize + step));
        if (nextSize === curSize) return prevConfig;

        const updated = { ...prevConfig, size: nextSize };
        try {
          const cur = JSON.parse(localStorage.getItem('lyang_mascot_config') || '{}');
          localStorage.setItem('lyang_mascot_config', JSON.stringify({ ...cur, size: nextSize }));
        } catch (err) {}

        // Điều chỉnh lại toạ độ nếu kích thước mới vượt quá viền màn hình
        setPos((curPos) => {
          const { minX, maxX, minY, maxY } = getBounds(nextSize);
          const clampedX = Math.min(Math.max(minX, curPos.x), maxX);
          const clampedY = Math.min(Math.max(minY, curPos.y), maxY);
          const updatedPos = { x: clampedX, y: clampedY };
          if (onPosChange) onPosChange(updatedPos, nextSize);
          return updatedPos;
        });

        window.dispatchEvent(new Event('lyang_mascot_config_updated'));
        return updated;
      });
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [onPosChange]);

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
        const { minX, maxX, minY, maxY } = getBounds(size);
        const newX = Math.min(Math.max(minX, dragStartRef.current.startPosX + dx), maxX);
        const newY = Math.min(Math.max(minY, dragStartRef.current.startPosY + dy), maxY);
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
          if (onPosChange) onPosChange(latestPos, config.size || 110);
          return latestPos;
        });
        setTimeout(() => {
          updateHeadRef.current?.();
        }, 50);
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
    if (onOpenAiConsultant) {
      onOpenAiConsultant({ pos, size: config.size || 110 });
    } else {
      window.dispatchEvent(new CustomEvent('lyang_open_ai_consultant', { detail: { pos, size: config.size || 110 } }));
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onOpenSettings) onOpenSettings({ pos, size: config.size || 110 });
    return false;
  };

  const isHiddenRoute = currentHash.includes('bacsisauquy') || currentHash.includes('packing-display') || currentHash.includes('print-only');
  if (!config.enabled || isHiddenRoute) return null;

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

      {/* Single Ultra-Lightweight Sprite Element */}
      <div
        ref={spriteRef}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: `url("${currentChar.directions}")`,
          backgroundSize: '300% 300%',
          backgroundPosition: currentBgPosRef.current || '50% 50%',
          backgroundRepeat: 'no-repeat',
          cursor: config.locked ? 'pointer' : isDragging ? 'grabbing' : 'grab',
          opacity: config.opacity ?? 1
        }}
        className="pointer-events-auto select-none transition-transform duration-100 ease-out"
      />
    </div>
  );
};

export default memo(PageMascot);
