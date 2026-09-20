import React, { useState, useEffect, useMemo } from 'react';
import { MASCOT_LIST, MASCOT_CATEGORIES, DEFAULT_MASCOT_CONFIG, playPopSound } from '../lib/mascots';
import { X, Sparkles, Volume2, VolumeX, Lock, Unlock, RotateCcw, Eye, MessageSquare, Check, Search } from 'lucide-react';

const MascotSettingsModal = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('lyang_mascot_config');
      if (saved) return { ...DEFAULT_MASCOT_CONFIG, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_MASCOT_CONFIG;
  });

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                Bộ Sưu Tập Linh Vật ({MASCOT_LIST.length} Nhân Vật)
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                  Page-Mascot
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tương tác, theo dõi chuột & kéo thả tự do
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* Main Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Eye size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Bật Linh Vật Toàn Trang</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Hiện mascot theo dõi trên mọi màn hình</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => updateConfig({ ...config, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
            </label>
          </div>

          {/* Character Library */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span>Chọn Nhân Vật</span>
                <span className="text-xs font-normal text-slate-400">
                  (Đang chọn: <b className="text-amber-600 dark:text-amber-400">{MASCOT_LIST.find(c => c.id === config.characterId)?.name}</b>)
                </span>
              </label>

              {/* Search input */}
              <div className="relative w-full sm:w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm mascot..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500 transition-colors"
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Mascot Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-[260px] overflow-y-auto p-1 custom-scrollbar rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/80">
              {filteredMascots.map((char) => {
                const isSelected = config.characterId === char.id;
                return (
                  <button
                    key={char.id}
                    onClick={() => handleSelectCharacter(char.id)}
                    className={`relative flex flex-col items-center p-2.5 rounded-2xl border transition-all text-center cursor-pointer group ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/30 shadow-md ring-2 ring-amber-500/20'
                        : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4.5 h-4.5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm">
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

                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate w-full">
                      {char.name}
                    </span>
                    <span className="text-[9.5px] text-slate-500 dark:text-slate-400 truncate w-full mt-0.5">
                      {char.desc}
                    </span>
                  </button>
                );
              })}

              {filteredMascots.length === 0 && (
                <div className="col-span-full py-8 text-center text-xs text-slate-400">
                  Không tìm thấy nhân vật nào phù hợp với từ khóa "{searchQuery}"
                </div>
              )}
            </div>
          </div>

          {/* Size & Opacity Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">Kích thước Mascot</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{config.size || 110}px</span>
              </div>
              <input
                type="range"
                min="60"
                max="180"
                step="5"
                value={config.size || 110}
                onChange={(e) => updateConfig({ ...config, size: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Nhỏ (60px)</span>
                <span>Vừa (110px)</span>
                <span>Lớn (180px)</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">Độ mờ / Trong suốt</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{Math.round((config.opacity ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="1"
                step="0.05"
                value={config.opacity ?? 1}
                onChange={(e) => updateConfig({ ...config, opacity: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Trong suốt</span>
                <span>Rõ nét</span>
              </div>
            </div>
          </div>

          {/* Behavior Toggles */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              Tùy Chọn Tương Tác
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Lock Drag */}
              <button
                type="button"
                onClick={() => updateConfig({ ...config, locked: !config.locked })}
                className={`p-3 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  config.locked
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {config.locked ? <Lock size={15} /> : <Unlock size={15} className="text-slate-400" />}
                  <span className="text-xs font-semibold">{config.locked ? 'Đã khóa vị trí' : 'Kéo thả tự do'}</span>
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
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {config.soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} className="text-slate-400" />}
                  <span className="text-xs font-semibold">{config.soundEnabled ? 'Bật âm thanh' : 'Tắt âm thanh'}</span>
                </div>
              </button>

              {/* Quotes */}
              <button
                type="button"
                onClick={() => updateConfig({ ...config, showQuotes: !config.showQuotes })}
                className={`p-3 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  config.showQuotes
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={15} className={config.showQuotes ? 'text-blue-500' : 'text-slate-400'} />
                  <span className="text-xs font-semibold">Lời chúc & Mẹo</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={handleResetPosition}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
            Đặt lại vị trí góc dưới
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
};

export default MascotSettingsModal;
