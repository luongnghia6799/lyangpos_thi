import React, { useState, useEffect, useMemo, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { MASCOT_LIST, MASCOT_CATEGORIES, DEFAULT_MASCOT_CONFIG, playPopSound } from '../../lib/mascots';
import { X, Sparkles, Volume2, VolumeX, Lock, Unlock, RotateCcw, Eye, MessageSquare, Check, Search } from 'lucide-react';

const MascotPopover = ({ isOpen, onClose, mascotPos, mascotSize = 110 }) => {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('lyang_mascot_config');
      if (saved) return { ...DEFAULT_MASCOT_CONFIG, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_MASCOT_CONFIG;
  });

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const popoverRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('lyang_mascot_config');
        if (saved) setConfig({ ...DEFAULT_MASCOT_CONFIG, ...JSON.parse(saved) });
      } catch (e) {}
    }
  }, [isOpen]);

  const updateConfig = (newConfig) => {
    setConfig(newConfig);
    localStorage.setItem('lyang_mascot_config', JSON.stringify(newConfig));
    window.dispatchEvent(new Event('lyang_mascot_config_updated'));
  };

  const handleSelectCharacter = (charId) => {
    const updated = { ...config, characterId: charId };
    updateConfig(updated);
    if (config.soundEnabled) playPopSound();
  };

  const handleResetPosition = () => {
    const defaultX = typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 160) : 800;
    const defaultY = typeof window !== 'undefined' ? Math.max(20, window.innerHeight - 200) : 500;
    const updated = { ...config, position: { x: defaultX, y: defaultY } };
    updateConfig(updated);
    if (config.soundEnabled) playPopSound();
  };

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDownOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        // Check if click was on mascot itself to avoid immediate reopen
        const mascotEl = document.querySelector('.group.select-none');
        if (mascotEl && mascotEl.contains(e.target)) return;
        onClose();
      }
    };
    window.addEventListener('pointerdown', handlePointerDownOutside);
    return () => window.removeEventListener('pointerdown', handlePointerDownOutside);
  }, [isOpen, onClose]);

  // Filter mascots by category and search
  const filteredMascots = useMemo(() => {
    return MASCOT_LIST.filter((char) => {
      const matchesCategory = selectedCategory === 'all' || char.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        char.name.toLowerCase().includes(q) ||
        char.desc.toLowerCase().includes(q) ||
        char.id.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Dynamic positioning relative to Mascot
  const popoverStyle = useMemo(() => {
    if (typeof window === 'undefined') return { top: 100, left: 100 };
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const popW = Math.min(420, winW - 32);
    const popH = Math.min(540, winH - 32);

    let left = mascotPos.x;
    let top = mascotPos.y;
    let originX = '50%';
    let originY = '50%';

    // Horizontal placement: place left or right depending on mascot position
    if (mascotPos.x + mascotSize + popW + 16 <= winW) {
      // Place to the right
      left = mascotPos.x + mascotSize + 12;
      originX = '0%';
    } else if (mascotPos.x - popW - 12 >= 10) {
      // Place to the left
      left = mascotPos.x - popW - 12;
      originX = '100%';
    } else {
      // Center horizontally and clamp
      left = Math.max(16, Math.min(mascotPos.x - (popW - mascotSize) / 2, winW - popW - 16));
    }

    // Vertical placement: place above or below depending on mascot position
    if (mascotPos.y + popH + 16 <= winH) {
      top = Math.max(16, mascotPos.y - 40);
      originY = '20%';
    } else if (mascotPos.y - popH + mascotSize >= 16) {
      top = Math.max(16, mascotPos.y - popH + mascotSize + 40);
      originY = '80%';
    } else {
      top = Math.max(16, Math.min(mascotPos.y, winH - popH - 16));
    }

    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${popW}px`,
      maxHeight: `${popH}px`,
      originX,
      originY
    };
  }, [mascotPos, mascotSize]);

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          ref={popoverRef}
          key="mascot-popover"
          initial={{
            opacity: 0,
            scale: 0.85,
            y: popoverStyle.originY === '80%' ? 12 : -12
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            scale: 0.88,
            y: popoverStyle.originY === '80%' ? 8 : -8
          }}
          transition={{
            type: 'spring',
            damping: 26,
            stiffness: 380,
            mass: 0.6
          }}
          style={{
            position: 'fixed',
            left: popoverStyle.left,
            top: popoverStyle.top,
            width: popoverStyle.width,
            maxHeight: popoverStyle.maxHeight,
            zIndex: 100000,
            transformOrigin: `${popoverStyle.originX} ${popoverStyle.originY}`
          }}
          className="bg-[#faf8f3] dark:bg-[#1a1e17] backdrop-blur-xl border-2 border-[#8b6f47]/30 dark:border-[#d4a574]/30 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden text-stone-800 dark:text-stone-100 select-none ring-1 ring-[#8b6f47]/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#8b6f47]/20 dark:border-white/10 flex items-center justify-between bg-[#f4efe4]/80 dark:bg-white/[0.03] shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#2d5016] to-[#477a27] dark:from-emerald-700 dark:to-emerald-600 flex items-center justify-center text-white shadow-md shadow-[#2d5016]/20">
                <Sparkles size={14} />
              </div>
              <div>
                <h3 className="font-black text-xs uppercase tracking-wider text-[#2d5016] dark:text-emerald-400 flex items-center gap-1.5">
                  Linh Vật ({MASCOT_LIST.length})
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Reset button */}
              <button
                type="button"
                onClick={handleResetPosition}
                title="Đặt lại vị trí góc dưới"
                className="w-7 h-7 rounded-xl bg-[#8b6f47]/10 dark:bg-white/10 hover:bg-[#8b6f47]/20 dark:hover:bg-white/15 flex items-center justify-center text-[#8b6f47] dark:text-[#d4a574] hover:text-[#2d5016] dark:hover:text-white transition-colors cursor-pointer border border-[#8b6f47]/15 dark:border-white/10"
              >
                <RotateCcw size={12} />
              </button>

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-xl bg-[#8b6f47]/10 dark:bg-white/10 hover:bg-[#8b6f47]/20 dark:hover:bg-white/15 flex items-center justify-center text-[#8b6f47] dark:text-[#d4a574] hover:text-[#2d5016] dark:hover:text-white transition-colors cursor-pointer border border-[#8b6f47]/15 dark:border-white/10"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-3.5 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
            {/* Search Input */}
            <div className="relative w-full">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8b6f47]/60 dark:text-stone-400" />
              <input
                type="text"
                placeholder="Tìm nhân vật..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-[11px] rounded-xl bg-[#f4efe4] dark:bg-[#23271f] border border-[#8b6f47]/25 dark:border-white/10 outline-none focus:ring-1 focus:ring-[#2d5016] dark:focus:ring-emerald-500 font-medium text-stone-800 dark:text-stone-100 placeholder:text-[#8b6f47]/50 transition-colors"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
              {MASCOT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#2d5016] dark:bg-emerald-600 text-white shadow-xs'
                      : 'bg-[#8b6f47]/10 dark:bg-white/5 text-[#8b6f47] dark:text-[#d4a574] hover:bg-[#8b6f47]/20 dark:hover:bg-white/10 border border-[#8b6f47]/15 dark:border-white/5'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Character Grid */}
            <div className="grid grid-cols-4 gap-1.5 max-h-[190px] overflow-y-auto p-1.5 custom-scrollbar rounded-2xl bg-[#f4efe4]/60 dark:bg-[#23271f]/60 border border-[#8b6f47]/20 dark:border-white/10">
              {filteredMascots.map((char) => {
                const isSelected = config.characterId === char.id;
                return (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => handleSelectCharacter(char.id)}
                    className={`relative flex flex-col items-center p-1.5 rounded-xl border transition-all text-center cursor-pointer group ${
                      isSelected
                        ? 'border-[#2d5016] dark:border-emerald-500 bg-[#2d5016]/10 dark:bg-emerald-950/40 shadow-xs ring-1 ring-[#2d5016]/40 dark:ring-emerald-500/40'
                        : 'border-[#8b6f47]/20 dark:border-white/10 hover:border-[#8b6f47]/40 dark:hover:border-white/20 bg-[#faf8f3] dark:bg-[#1a1e17] hover:bg-white dark:hover:bg-[#262c21]'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#2d5016] dark:bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Check size={8} strokeWidth={3} />
                      </div>
                    )}

                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        backgroundImage: `url("${char.directions}")`,
                        backgroundSize: '300% 300%',
                        backgroundPosition: '50% 50%',
                        backgroundRepeat: 'no-repeat'
                      }}
                      className="rounded-full mb-1 group-hover:scale-110 transition-transform duration-150"
                    />

                    <span className="text-[9.5px] font-bold text-stone-800 dark:text-stone-200 truncate w-full">
                      {char.name}
                    </span>
                  </button>
                );
              })}

              {filteredMascots.length === 0 && (
                <div className="col-span-full py-6 text-center text-[11px] text-[#8b6f47]/60 dark:text-stone-400">
                  Không tìm thấy "{searchQuery}"
                </div>
              )}
            </div>

            {/* Quick Sliders */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-[#f4efe4] dark:bg-[#23271f] border border-[#8b6f47]/20 dark:border-white/10 space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-stone-600 dark:text-stone-400">Kích thước</span>
                  <span className="text-[#2d5016] dark:text-emerald-400 font-mono font-black">{config.size || 110}px</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="240"
                  step="5"
                  value={config.size || 110}
                  onChange={(e) => updateConfig({ ...config, size: Number(e.target.value) })}
                  className="w-full accent-[#2d5016] dark:accent-emerald-500 cursor-pointer h-1"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-[#f4efe4] dark:bg-[#23271f] border border-[#8b6f47]/20 dark:border-white/10 space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-stone-600 dark:text-stone-400">Độ rõ nét</span>
                  <span className="text-[#2d5016] dark:text-emerald-400 font-mono font-black">{Math.round((config.opacity ?? 1) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1"
                  step="0.05"
                  value={config.opacity ?? 1}
                  onChange={(e) => updateConfig({ ...config, opacity: Number(e.target.value) })}
                  className="w-full accent-[#2d5016] dark:accent-emerald-500 cursor-pointer h-1"
                />
              </div>
            </div>

            {/* Quick Action Toggles */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => updateConfig({ ...config, locked: !config.locked })}
                className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer ${
                  config.locked
                    ? 'border-amber-600/50 bg-amber-500/10 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-bold'
                    : 'border-[#8b6f47]/20 dark:border-white/10 bg-[#faf8f3] dark:bg-[#1a1e17] text-stone-700 dark:text-stone-300 hover:border-[#8b6f47]/40 font-medium'
                }`}
              >
                {config.locked ? <Lock size={13} /> : <Unlock size={13} className="text-[#8b6f47]/60 dark:text-stone-400" />}
                <span className="text-[9.5px]">{config.locked ? 'Đã khóa' : 'Kéo tự do'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const updated = { ...config, soundEnabled: !config.soundEnabled };
                  updateConfig(updated);
                  if (updated.soundEnabled) playPopSound();
                }}
                className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer ${
                  config.soundEnabled
                    ? 'border-[#2d5016] dark:border-emerald-600 bg-[#2d5016]/10 dark:bg-emerald-950/30 text-[#2d5016] dark:text-emerald-300 font-bold'
                    : 'border-[#8b6f47]/20 dark:border-white/10 bg-[#faf8f3] dark:bg-[#1a1e17] text-stone-700 dark:text-stone-300 hover:border-[#8b6f47]/40 font-medium'
                }`}
              >
                {config.soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} className="text-[#8b6f47]/60 dark:text-stone-400" />}
                <span className="text-[9.5px]">{config.soundEnabled ? 'Âm thanh' : 'Tắt âm'}</span>
              </button>

              <button
                type="button"
                onClick={() => updateConfig({ ...config, showQuotes: !config.showQuotes })}
                className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer ${
                  config.showQuotes
                    ? 'border-[#8b6f47] dark:border-[#d4a574] bg-[#8b6f47]/10 dark:bg-[#d4a574]/15 text-[#8b6f47] dark:text-[#d4a574] font-bold'
                    : 'border-[#8b6f47]/20 dark:border-white/10 bg-[#faf8f3] dark:bg-[#1a1e17] text-stone-700 dark:text-stone-300 hover:border-[#8b6f47]/40 font-medium'
                }`}
              >
                <MessageSquare size={13} className={config.showQuotes ? 'text-[#8b6f47] dark:text-[#d4a574]' : 'text-[#8b6f47]/60 dark:text-stone-400'} />
                <span className="text-[9.5px]">Lời chúc</span>
              </button>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
};

export default MascotPopover;
