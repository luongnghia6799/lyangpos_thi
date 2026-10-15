import React, { useState, useEffect, useMemo, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { MASCOT_LIST, DEFAULT_MASCOT_CONFIG, playPopSound } from '../../lib/mascots';
import { 
    X, Sparkles, Volume2, VolumeX, Lock, Unlock, RotateCcw, 
    MessageSquare, Check, Search, Bot 
} from 'lucide-react';
import { cn } from '../../lib/utils';

const MascotPopover = ({ isOpen, onClose, mascotPos, mascotSize = 110 }) => {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('lyang_mascot_config');
      if (saved) return { ...DEFAULT_MASCOT_CONFIG, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_MASCOT_CONFIG;
  });

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
    window.dispatchEvent(new Event('sidebar_logo_updated'));
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

  // Filter mascots by search query
  const filteredMascots = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return MASCOT_LIST;
    return MASCOT_LIST.filter((char) =>
      char.name.toLowerCase().includes(q) ||
      (char.desc && char.desc.toLowerCase().includes(q)) ||
      char.id.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Dynamic positioning relative to Mascot
  const popoverStyle = useMemo(() => {
    if (typeof window === 'undefined') return { top: 100, left: 100, width: '410px', maxHeight: '510px' };
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const popW = Math.min(410, winW - 32);
    const popH = Math.min(510, winH - 32);

    const pos = mascotPos || { x: winW - 160, y: winH - 200 };
    let left = pos.x;
    let top = pos.y;
    let originX = '50%';
    let originY = '50%';

    // Horizontal placement: place beside mascot with safe margin
    if (pos.x + mascotSize + popW + 20 <= winW) {
      // Place to the right of mascot with 18px gap
      left = pos.x + mascotSize + 18;
      originX = '0%';
    } else if (pos.x - popW - 18 >= 16) {
      // Place to the left of mascot with 18px gap
      left = pos.x - popW - 18;
      originX = '100%';
    } else {
      // Screen is tight horizontally, center-clamp
      left = Math.max(16, Math.min(pos.x - (popW - mascotSize) / 2, winW - popW - 16));
    }

    // Vertical placement: ensure it never covers the mascot and never goes off-screen
    if (pos.x + mascotSize + popW + 20 <= winW || pos.x - popW - 18 >= 16) {
      // Placed beside mascot
      if (pos.y + mascotSize >= winH / 2) {
        // Mascot in lower half: align bottom of popover with bottom of mascot, clamped to screen bottom
        top = Math.max(16, Math.min(pos.y + mascotSize - popH, winH - popH - 16));
        originY = '100%';
      } else {
        // Mascot in upper half: align top of popover with top of mascot
        top = Math.max(16, Math.min(pos.y, winH - popH - 16));
        originY = '0%';
      }
    } else {
      // Screen is tight horizontally: place directly above or below mascot to avoid overlapping it
      if (pos.y - popH - 16 >= 16) {
        top = pos.y - popH - 16;
        originY = '100%';
      } else {
        top = Math.min(winH - popH - 16, pos.y + mascotSize + 16);
        originY = '0%';
      }
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
        <div className="fixed inset-0 z-[600000] pointer-events-none select-none">
          {/* Subtle dismiss backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/25 dark:bg-black/50 backdrop-blur-[3px] pointer-events-auto"
          />

          {/* Sleek Popup Panel anchored beside Mascot */}
          <m.div
            ref={popoverRef}
            key="mascot-popover"
            initial={{ opacity: 0, scale: 0.88, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.88, filter: 'blur(4px)', transition: { duration: 0.16 } }}
            transition={{ type: "spring", stiffness: 440, damping: 28 }}
            style={{
              position: 'fixed',
              left: popoverStyle.left,
              top: popoverStyle.top,
              width: popoverStyle.width,
              maxHeight: popoverStyle.maxHeight,
              transformOrigin: `${popoverStyle.originX} ${popoverStyle.originY}`
            }}
            className="pointer-events-auto bg-[#fcfaf6]/95 dark:bg-[#161a14]/95 backdrop-blur-2xl border-2 border-[#8b6f47]/30 dark:border-emerald-500/35 rounded-3xl shadow-[0_24px_60px_-10px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-[#8b6f47]/15 dark:border-white/10 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#2d5016] to-emerald-500 text-white flex items-center justify-center shadow-md shadow-[#2d5016]/20 shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
                    Linh Vật AI ({MASCOT_LIST.length})
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    Tùy chỉnh nhân vật & tương tác linh vật
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Reset position button */}
                <button
                  type="button"
                  onClick={handleResetPosition}
                  title="Đặt lại vị trí góc dưới"
                  className="w-7.5 h-7.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer border border-[#8b6f47]/15 dark:border-white/10"
                >
                  <RotateCcw size={13} />
                </button>

                {/* Close button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-7.5 h-7.5 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer border border-[#8b6f47]/15 dark:border-white/10"
                >
                  <X size={15} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Body Content */}
            <div className="p-3.5 sm:p-4 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-3">
              {/* Search Input */}
              <div className="relative w-full">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Tìm nhân vật..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#ede8dc] dark:bg-[#20251c] border border-[#8b6f47]/20 dark:border-white/10 outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition-all"
                />
              </div>

              {/* Character Grid */}
              <div className="grid grid-cols-3 gap-2 max-h-[190px] overflow-y-auto p-0.5 custom-scrollbar shrink-0">
                {filteredMascots.map((char) => {
                  const isSelected = config.characterId === char.id;
                  const avatarSrc = char.avatar || `/mascots/avatar-${char.id}.webp`;
                  return (
                    <div
                      key={char.id}
                      onClick={() => handleSelectCharacter(char.id)}
                      className={cn(
                        "p-2 min-h-[92px] rounded-2xl border-2 flex flex-col items-center justify-center gap-1 text-center cursor-pointer transition-all group relative overflow-hidden select-none",
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 shadow-md shadow-emerald-500/15 ring-2 ring-emerald-500/30"
                          : "border-[#8b6f47]/20 dark:border-white/10 hover:border-emerald-400/60 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                      )}
                    >
                      <div className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center relative bg-white/60 dark:bg-black/40 border border-black/5 shadow-xs shrink-0">
                        <img
                          src={avatarSrc}
                          alt={char.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="flex flex-col items-center w-full min-w-0 px-0.5">
                        <span className="text-[10.5px] font-black text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate w-full" title={char.name}>
                          {char.name}
                        </span>
                        <span className="text-[8.5px] font-bold text-slate-500 dark:text-slate-400 truncate w-full" title={char.desc || char.category}>
                          {char.desc || char.category || 'Mascot 2.5D'}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredMascots.length === 0 && (
                  <div className="col-span-full py-6 text-center text-xs font-bold text-slate-400">
                    Không tìm thấy "{searchQuery}"
                  </div>
                )}
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-2xl bg-[#ede8dc] dark:bg-[#20251c] border border-[#8b6f47]/20 dark:border-white/10 flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-600 dark:text-slate-400">Kích thước</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black">{config.size || 110}px</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="240"
                    step="5"
                    value={config.size || 110}
                    onChange={(e) => updateConfig({ ...config, size: Number(e.target.value) })}
                    className="w-full accent-emerald-600 cursor-pointer h-1.5"
                  />
                </div>

                <div className="p-2.5 rounded-2xl bg-[#ede8dc] dark:bg-[#20251c] border border-[#8b6f47]/20 dark:border-white/10 flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-600 dark:text-slate-400">Độ rõ nét</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black">{Math.round((config.opacity ?? 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="1"
                    step="0.05"
                    value={config.opacity ?? 1}
                    onChange={(e) => updateConfig({ ...config, opacity: Number(e.target.value) })}
                    className="w-full accent-emerald-600 cursor-pointer h-1.5"
                  />
                </div>
              </div>

              {/* Quick Action Toggles */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => updateConfig({ ...config, locked: !config.locked })}
                  className={cn(
                    "p-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer",
                    config.locked
                      ? "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-black"
                      : "border-[#8b6f47]/20 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-slate-700 dark:text-slate-300 hover:border-emerald-400/60 font-bold"
                  )}
                >
                  {config.locked ? <Lock size={14} /> : <Unlock size={14} className="text-slate-400" />}
                  <span className="text-[10px]">{config.locked ? 'Đã khóa' : 'Kéo tự do'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...config, soundEnabled: !config.soundEnabled };
                    updateConfig(updated);
                    if (updated.soundEnabled) playPopSound();
                  }}
                  className={cn(
                    "p-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer",
                    config.soundEnabled
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-black"
                      : "border-[#8b6f47]/20 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-slate-700 dark:text-slate-300 hover:border-emerald-400/60 font-bold"
                  )}
                >
                  {config.soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} className="text-slate-400" />}
                  <span className="text-[10px]">{config.soundEnabled ? 'Âm thanh' : 'Tắt âm'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateConfig({ ...config, showQuotes: !config.showQuotes })}
                  className={cn(
                    "p-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer",
                    config.showQuotes
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-black"
                      : "border-[#8b6f47]/20 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-slate-700 dark:text-slate-300 hover:border-emerald-400/60 font-bold"
                  )}
                >
                  <MessageSquare size={14} className={config.showQuotes ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"} />
                  <span className="text-[10px]">{config.showQuotes ? 'Lời chúc: Bật' : 'Lời chúc: Tắt'}</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-t border-[#8b6f47]/15 dark:border-white/10 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02] shrink-0">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                💡 Chuột phải vào mascot để mở lại
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#2d5016] to-emerald-600 hover:from-[#244211] hover:to-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-[#2d5016]/20 transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MascotPopover;
