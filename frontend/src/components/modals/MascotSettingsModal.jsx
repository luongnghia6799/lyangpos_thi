import React, { useState, useEffect, useMemo } from 'react';
import { MASCOT_LIST, MASCOT_CATEGORIES, DEFAULT_MASCOT_CONFIG, playPopSound } from '../../lib/mascots';
import { X, Sparkles, Volume2, VolumeX, Lock, Unlock, RotateCcw, Eye, MessageSquare, Check, Search } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import Portal from '../widgets/Portal';

const MascotSettingsModal = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('lyang_mascot_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.characterId === 'cheobingo' || !parsed.characterId) {
          parsed.characterId = 'lyang';
        }
        return { ...DEFAULT_MASCOT_CONFIG, ...parsed };
      }
    } catch (e) {}
    return DEFAULT_MASCOT_CONFIG;
  });

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('lyang_mascot_config');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.characterId === 'cheobingo' || !parsed.characterId) {
            parsed.characterId = 'lyang';
          }
          setConfig({ ...DEFAULT_MASCOT_CONFIG, ...parsed });
        }
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

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 select-none">
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transform-gpu will-change-transform"
            />
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#faf8f3] dark:bg-[#1a1e17] border-2 border-[#8b6f47]/30 dark:border-[#d4a574]/30 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.3)] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-stone-800 dark:text-stone-100 relative z-10 transform-gpu will-change-transform select-none"
              onClick={(e) => e.stopPropagation()}
            >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#8b6f47]/20 dark:border-white/10 flex items-center justify-between bg-[#f4efe4]/80 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#2d5016] to-[#477a27] dark:from-emerald-700 dark:to-emerald-600 flex items-center justify-center text-white shadow-md shadow-[#2d5016]/20">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-[#2d5016] dark:text-emerald-400 flex items-center gap-2">
                Bộ Sưu Tập Linh Vật ({MASCOT_LIST.length} Nhân Vật)
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2d5016]/10 text-[#2d5016] dark:bg-white/10 dark:text-[#d4a574] border border-[#2d5016]/20 dark:border-white/10">
                  Page-Mascot
                </span>
              </h3>
              <p className="text-xs text-[#8b6f47] dark:text-[#d4a574]/80 font-medium">
                Tương tác, theo dõi chuột & kéo thả tự do
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#8b6f47]/10 dark:bg-white/10 hover:bg-[#8b6f47]/20 dark:hover:bg-white/15 flex items-center justify-center text-[#8b6f47] dark:text-[#d4a574] hover:text-[#2d5016] dark:hover:text-white transition-colors cursor-pointer border border-[#8b6f47]/15 dark:border-white/10"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* Main Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#f4efe4] dark:bg-[#23271f] border border-[#8b6f47]/25 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#2d5016]/10 dark:bg-emerald-500/20 text-[#2d5016] dark:text-emerald-400 flex items-center justify-center">
                <Eye size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-stone-900 dark:text-white">Bật Linh Vật Toàn Trang</div>
                <div className="text-xs text-[#8b6f47] dark:text-stone-400 font-medium">Hiện mascot theo dõi trên mọi màn hình</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => updateConfig({ ...config, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2d5016] dark:peer-checked:bg-emerald-600" />
            </label>
          </div>

          {/* Character Library */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <label className="text-sm font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                <span>Chọn Nhân Vật</span>
                <span className="text-xs font-normal text-[#8b6f47] dark:text-stone-400">
                  (Đang chọn: <b className="text-[#2d5016] dark:text-emerald-400 font-bold">{MASCOT_LIST.find(c => c.id === config.characterId)?.name}</b>)
                </span>
              </label>

              {/* Search input */}
              <div className="relative w-full sm:w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b6f47]/60 dark:text-stone-400" />
                <input
                  type="text"
                  placeholder="Tìm mascot..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl bg-[#f4efe4] dark:bg-[#23271f] border border-[#8b6f47]/25 dark:border-white/10 outline-none focus:ring-1 focus:ring-[#2d5016] dark:focus:ring-emerald-500 font-medium text-stone-800 dark:text-stone-100 placeholder:text-[#8b6f47]/50 transition-colors"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
              {MASCOT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#2d5016] dark:bg-emerald-600 text-white shadow-xs'
                      : 'bg-[#8b6f47]/10 dark:bg-white/5 text-[#8b6f47] dark:text-[#d4a574] hover:bg-[#8b6f47]/20 dark:hover:bg-white/10 border border-[#8b6f47]/15 dark:border-white/5'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Mascot Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-[260px] overflow-y-auto p-1.5 custom-scrollbar rounded-2xl bg-[#f4efe4]/60 dark:bg-[#23271f]/60 border border-[#8b6f47]/20 dark:border-white/10">
              {filteredMascots.map((char) => {
                const isSelected = config.characterId === char.id;
                return (
                  <button
                    key={char.id}
                    onClick={() => handleSelectCharacter(char.id)}
                    className={`relative flex flex-col items-center p-2.5 rounded-2xl border transition-all text-center cursor-pointer group ${
                      isSelected
                        ? 'border-[#2d5016] dark:border-emerald-500 bg-[#2d5016]/10 dark:bg-emerald-950/40 shadow-xs ring-1 ring-[#2d5016]/40 dark:ring-emerald-500/40'
                        : 'border-[#8b6f47]/20 dark:border-white/10 hover:border-[#8b6f47]/40 dark:hover:border-white/20 bg-[#faf8f3] dark:bg-[#1a1e17] hover:bg-white dark:hover:bg-[#262c21]'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4.5 h-4.5 rounded-full bg-[#2d5016] dark:bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                    
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        backgroundImage: `url("${char.directions}")`,
                        backgroundSize: '300% 300%',
                        backgroundPosition: '50% 50%',
                        backgroundRepeat: 'no-repeat'
                      }}
                      className="rounded-full mb-1.5 group-hover:scale-110 transition-transform duration-200"
                    />

                    <span className="text-[11px] font-bold text-stone-800 dark:text-stone-200 truncate w-full">
                      {char.name}
                    </span>
                    <span className="text-[9.5px] text-[#8b6f47] dark:text-stone-400 truncate w-full mt-0.5">
                      {char.desc}
                    </span>
                  </button>
                );
              })}

              {filteredMascots.length === 0 && (
                <div className="col-span-full py-8 text-center text-xs text-[#8b6f47]/60 dark:text-stone-400">
                  Không tìm thấy nhân vật nào phù hợp với từ khóa "{searchQuery}"
                </div>
              )}
            </div>
          </div>

          {/* Size & Opacity Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#f4efe4] dark:bg-[#23271f] border border-[#8b6f47]/20 dark:border-white/10 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-stone-700 dark:text-stone-300">Kích thước Mascot</span>
                <span className="text-[#2d5016] dark:text-emerald-400 font-mono font-black">{config.size || 110}px</span>
              </div>
              <input
                type="range"
                min="60"
                max="180"
                step="5"
                value={config.size || 110}
                onChange={(e) => updateConfig({ ...config, size: Number(e.target.value) })}
                className="w-full accent-[#2d5016] dark:accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#8b6f47]/70 dark:text-stone-400 font-medium">
                <span>Nhỏ (60px)</span>
                <span>Vừa (110px)</span>
                <span>Lớn (180px)</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#f4efe4] dark:bg-[#23271f] border border-[#8b6f47]/20 dark:border-white/10 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-stone-700 dark:text-stone-300">Độ mờ / Trong suốt</span>
                <span className="text-[#2d5016] dark:text-emerald-400 font-mono font-black">{Math.round((config.opacity ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="1"
                step="0.05"
                value={config.opacity ?? 1}
                onChange={(e) => updateConfig({ ...config, opacity: Number(e.target.value) })}
                className="w-full accent-[#2d5016] dark:accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#8b6f47]/70 dark:text-stone-400 font-medium">
                <span>Trong suốt</span>
                <span>Rõ nét</span>
              </div>
            </div>
          </div>

          {/* Behavior Toggles */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-[#8b6f47] dark:text-[#d4a574] px-1">
              Tùy Chọn Tương Tác
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Lock Drag */}
              <button
                type="button"
                onClick={() => updateConfig({ ...config, locked: !config.locked })}
                className={`p-3 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  config.locked
                    ? 'border-amber-600/50 bg-amber-500/10 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 font-bold'
                    : 'border-[#8b6f47]/20 dark:border-white/10 bg-[#faf8f3] dark:bg-[#1a1e17] text-stone-700 dark:text-stone-300 font-medium'
                }`}
              >
                <div className="flex items-center gap-2">
                  {config.locked ? <Lock size={15} /> : <Unlock size={15} className="text-[#8b6f47]/60 dark:text-stone-400" />}
                  <span className="text-xs">{config.locked ? 'Đã khóa vị trí' : 'Kéo thả tự do'}</span>
                </div>
              </button>

              {/* Sound */}
              <button
                type="button"
                onClick={() => {
                  const updated = { ...config, soundEnabled: !config.soundEnabled };
                  updateConfig(updated);
                  if (updated.soundEnabled) playPopSound();
                }}
                className={`p-3 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  config.soundEnabled
                    ? 'border-[#2d5016] dark:border-emerald-600 bg-[#2d5016]/10 dark:bg-emerald-950/20 text-[#2d5016] dark:text-emerald-300 font-bold'
                    : 'border-[#8b6f47]/20 dark:border-white/10 bg-[#faf8f3] dark:bg-[#1a1e17] text-stone-700 dark:text-stone-300 font-medium'
                }`}
              >
                <div className="flex items-center gap-2">
                  {config.soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} className="text-[#8b6f47]/60 dark:text-stone-400" />}
                  <span className="text-xs">{config.soundEnabled ? 'Bật âm thanh' : 'Tắt âm thanh'}</span>
                </div>
              </button>

              {/* Quotes */}
              <button
                type="button"
                onClick={() => updateConfig({ ...config, showQuotes: !config.showQuotes })}
                className={`p-3 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  config.showQuotes
                    ? 'border-[#8b6f47] dark:border-[#d4a574] bg-[#8b6f47]/10 dark:bg-[#d4a574]/15 text-[#8b6f47] dark:text-[#d4a574] font-bold'
                    : 'border-[#8b6f47]/20 dark:border-white/10 bg-[#faf8f3] dark:bg-[#1a1e17] text-stone-700 dark:text-stone-300 font-medium'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={15} className={config.showQuotes ? 'text-[#8b6f47] dark:text-[#d4a574]' : 'text-[#8b6f47]/60 dark:text-stone-400'} />
                  <span className="text-xs">Lời chúc & Mẹo</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#8b6f47]/20 dark:border-white/10 flex items-center justify-between bg-[#f4efe4]/80 dark:bg-white/[0.03]">
          <button
            type="button"
            onClick={handleResetPosition}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#8b6f47] dark:text-[#d4a574] hover:bg-[#8b6f47]/15 dark:hover:bg-white/10 flex items-center gap-1.5 transition-colors cursor-pointer border border-[#8b6f47]/20 dark:border-white/10"
          >
            <RotateCcw size={14} />
            Đặt lại vị trí góc dưới
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#2d5016] to-[#3d6b20] hover:from-[#234011] hover:to-[#2d5016] dark:from-emerald-700 dark:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-500 text-white shadow-md shadow-[#2d5016]/20 transition-all cursor-pointer border border-[#2d5016]/40 active:scale-95"
          >
            Xong ✓
          </button>
        </div>
      </m.div>
    </div>
        )}
      </AnimatePresence>
    </Portal>
  );
};

export default MascotSettingsModal;
