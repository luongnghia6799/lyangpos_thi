import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion as m, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  X, 
  Trash2, 
  Check, 
  Search, 
  Move, 
  Compass, 
  RotateCcw,
  Palette,
  Bot
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { 
  MASCOT_LIST, 
  MASCOT_CATEGORIES, 
  playPopSound 
} from '../../lib/mascots';
import { 
  setButtonMascot, 
  removeButtonMascot, 
  getMascotImageInfo,
  DEFAULT_BUTTON_MASCOT_CONFIG
} from '../../lib/buttonMascots';

export default function ButtonMascotPromptModal({
  isOpen,
  buttonInfo, // { element, signature, label, existingMascot }
  position, // { x, y }
  onClose,
  onOpenSystemMenu,
  onActivateEditMode
}) {
  const [activeTab, setActiveTab] = useState('prompt'); // 'prompt' | 'characters'
  const [selectedCharId, setSelectedCharId] = useState('active_pill');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const hasExistingMascot = Boolean(buttonInfo?.existingMascot);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('prompt');
      setSelectedCharId(buttonInfo?.existingMascot?.characterId || 'active_pill');
      setSearchQuery('');
      setSelectedCategory('all');
    }
  }, [isOpen, buttonInfo]);

  // Bộ lọc danh sách 60 Mascot
  const filteredMascots = useMemo(() => {
    const list = [
      {
        id: 'active_pill',
        name: 'Bé Lyang Chibi (Sidebar)',
        category: 'human',
        emoji: '🌾',
        desc: 'Bé Lyang ngồi vẫy tay cute siêu cấp như trên thanh điều hướng',
        isSidebarPill: true,
        imageUrl: '/assets/images/mascot_active_pill.png'
      },
      ...MASCOT_LIST
    ];

    return list.filter((char) => {
      const matchCat = selectedCategory === 'all' || char.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        char.name.toLowerCase().includes(q) || 
        (char.desc && char.desc.toLowerCase().includes(q)) ||
        char.id.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Tính toán vị trí popout thông minh cạnh nút bấm được click chuột phải
  const popoutStyle = useMemo(() => {
    const popW = activeTab === 'characters' ? 330 : 295;
    const popH = activeTab === 'characters' ? 390 : (hasExistingMascot ? 250 : 220);
    const gap = 10;
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const screenH = typeof window !== 'undefined' ? window.innerHeight : 1080;

    let targetLeft = position?.x ?? (screenW / 2 - popW / 2);
    let targetTop = position?.y ?? (screenH / 2 - popH / 2);
    let originY = '50%';

    if (buttonInfo?.element && typeof buttonInfo.element.getBoundingClientRect === 'function') {
      const rect = buttonInfo.element.getBoundingClientRect();

      // Nếu nút nằm ở nửa dưới màn hình: Đặt popout nổi LÊN TRÊN nút
      if (rect.top >= popH + gap) {
        targetTop = rect.top - popH - gap;
        originY = '100%';
      }
      // Nếu nút ở nửa trên màn hình: Đặt popout XUỐNG DƯỚI nút
      else if (screenH - rect.bottom >= popH + gap) {
        targetTop = rect.bottom + gap;
        originY = '0%';
      }
      // Nếu cả 2 đều hẹp: căn sát trên hoặc dưới trong màn hình
      else {
        targetTop = Math.max(12, Math.min(screenH - popH - 12, rect.top));
        originY = '50%';
      }

      // Canh giữa theo chiều ngang so với nút bấm
      const centerX = rect.left + rect.width / 2;
      targetLeft = centerX - popW / 2;
    } else if (position?.x != null && position?.y != null) {
      // Fallback vị trí click chuột
      if (position.y >= popH + gap) {
        targetTop = position.y - popH - gap;
        originY = '100%';
      } else {
        targetTop = position.y + gap;
        originY = '0%';
      }
      targetLeft = position.x - popW / 2;
    }

    // Đảm bảo không tràn viền màn hình
    targetLeft = Math.max(12, Math.min(screenW - popW - 12, targetLeft));
    targetTop = Math.max(12, Math.min(screenH - popH - 12, targetTop));

    return {
      top: `${Math.round(targetTop)}px`,
      left: `${Math.round(targetLeft)}px`,
      width: `${popW}px`,
      originY
    };
  }, [buttonInfo, position, activeTab, hasExistingMascot]);

  if (!isOpen || !buttonInfo) return null;

  const currentMascotInfo = getMascotImageInfo(selectedCharId);

  // Xử lý tạo Mascot
  const handleConfirmCreate = (charId = selectedCharId) => {
    playPopSound();
    const isPill = charId === 'active_pill';
    const mascotConfig = {
      characterId: charId,
      imageUrl: isPill ? '/assets/images/mascot_active_pill.png' : undefined,
      buttonLabel: buttonInfo.label,
      size: DEFAULT_BUTTON_MASCOT_CONFIG.size,
      top: DEFAULT_BUTTON_MASCOT_CONFIG.top,
      right: DEFAULT_BUTTON_MASCOT_CONFIG.right
    };

    setButtonMascot(buttonInfo.signature, mascotConfig);
    onClose();

    // Kích hoạt chế độ chỉnh sửa ngay để người dùng thấy và có thể kéo dời nếu muốn
    if (onActivateEditMode) {
      setTimeout(() => {
        onActivateEditMode(buttonInfo.signature);
      }, 100);
    }
  };

  // Xử lý gỡ Mascot
  const handleRemove = () => {
    playPopSound();
    removeButtonMascot(buttonInfo.signature);
    onClose();
  };

  // Xử lý bật chỉnh sửa
  const handleEdit = () => {
    onClose();
    if (onActivateEditMode) {
      onActivateEditMode(buttonInfo.signature);
    }
  };

  return createPortal(
    <AnimatePresence>
      {/* Lớp nền trong suốt bắt click ra ngoài (không làm tối màn hình như modal) */}
      <div 
        className="fixed inset-0 z-[999998] no-print"
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      >
        <m.div
          initial={{ opacity: 0, scale: 0.9, y: popoutStyle.originY === '100%' ? 8 : -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: popoutStyle.originY === '100%' ? 6 : -6 }}
          transition={{ type: "spring", stiffness: 450, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: popoutStyle.top,
            left: popoutStyle.left,
            width: popoutStyle.width,
            transformOrigin: `50% ${popoutStyle.originY}`
          }}
          className="bg-[#faf8f3] dark:bg-[#1a1e17] rounded-2xl border-2 border-[#8b6f47]/30 dark:border-[#d4a574]/30 shadow-[0_16px_45px_rgba(0,0,0,0.28)] text-slate-800 dark:text-slate-100 overflow-hidden select-none z-[999999] pointer-events-auto"
        >
          {/* Header gọn gàng */}
          <div className="px-3.5 py-2.5 border-b border-[#8b6f47]/20 dark:border-white/10 bg-[#f4efe4]/90 dark:bg-white/[0.04] flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#2d5016] to-[#477a27] dark:from-emerald-700 dark:to-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Sparkles size={13} />
              </div>
              <div className="min-w-0">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-[#2d5016] dark:text-emerald-400 leading-tight">
                  {hasExistingMascot ? 'Mascot Nút Bấm' : 'Tạo Mascot Cho Nút'}
                </h3>
                <p className="text-[11px] font-bold text-[#8b6f47] dark:text-[#d4a574] truncate max-w-[190px] leading-tight">
                  {buttonInfo.label}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-stone-400 hover:text-stone-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {/* Body Content */}
          {activeTab === 'prompt' ? (
            <div className="p-3 flex flex-col gap-2.5">
              {/* Preview Mascot Hero Gọn */}
              <div className="bg-[#f4efe4] dark:bg-[#23271f] rounded-xl p-2.5 border border-[#8b6f47]/20 dark:border-[#d4a574]/20 flex items-center gap-3">
                <div className="relative w-12 h-12 shrink-0 flex items-center justify-center bg-[#faf8f3] dark:bg-[#1a1e17] rounded-xl border border-[#8b6f47]/25 dark:border-[#d4a574]/25 shadow-xs overflow-hidden">
                  {currentMascotInfo.isSprite ? (
                    <div
                      className="w-10 h-10"
                      style={{
                        backgroundImage: `url("${currentMascotInfo.url}")`,
                        backgroundPosition: '50% 50%',
                        backgroundSize: '300% 300%',
                        backgroundRepeat: 'no-repeat'
                      }}
                    />
                  ) : (
                    <img
                      src={currentMascotInfo.url}
                      alt="Mascot Preview"
                      className="w-10 h-10 object-contain drop-shadow-xs pointer-events-none"
                    />
                  )}
                  <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-[#2d5016] dark:bg-emerald-600 text-white text-[8px] font-black uppercase">
                    {currentMascotInfo.emoji || '🌾'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-[#2d5016]/10 dark:bg-emerald-500/20 text-[#2d5016] dark:text-emerald-300 text-[9.5px] font-bold mb-1 border border-[#2d5016]/20">
                    {currentMascotInfo.name}
                  </span>
                  <p className="text-[11px] font-medium text-stone-700 dark:text-stone-200 leading-snug">
                    {hasExistingMascot 
                      ? 'Bé Mascot đang ngồi canh gác nút này!' 
                      : 'Gắn bé Lyang ngồi canh nút này nhé?'}
                  </p>
                </div>
              </div>

              {/* Action Buttons Gọn Gàng */}
              <div className="flex flex-col gap-1.5 pt-0.5">
                {!hasExistingMascot ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleConfirmCreate('active_pill')}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#2d5016] to-[#3d6b20] hover:from-[#234011] hover:to-[#2d5016] dark:from-emerald-700 dark:to-emerald-600 text-white font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-all transform active:scale-[0.98] cursor-pointer border border-[#2d5016]/40"
                    >
                      <Sparkles size={13} />
                      Tạo Bé Lyang (Sidebar)
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('characters')}
                      className="w-full py-1.5 px-3 rounded-xl bg-[#8b6f47]/10 hover:bg-[#8b6f47]/20 dark:bg-white/5 dark:hover:bg-white/10 text-[#8b6f47] dark:text-[#d4a574] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-[#8b6f47]/20 dark:border-white/10"
                    >
                      <Palette size={13} className="text-[#8b6f47] dark:text-[#d4a574]" />
                      Chọn Mẫu Khác (60 Mascot)
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleEdit}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#2d5016] to-[#3d6b20] hover:from-[#234011] hover:to-[#2d5016] dark:from-emerald-700 dark:to-emerald-600 text-white font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-all transform active:scale-[0.98] cursor-pointer border border-[#2d5016]/40"
                    >
                      <Move size={13} />
                      Chỉnh Sửa Vị Trí & Size
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('characters')}
                      className="w-full py-1.5 px-3 rounded-xl bg-[#8b6f47]/10 hover:bg-[#8b6f47]/20 dark:bg-white/5 dark:hover:bg-white/10 text-[#8b6f47] dark:text-[#d4a574] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-[#8b6f47]/20 dark:border-white/10"
                    >
                      <Palette size={13} className="text-[#8b6f47] dark:text-[#d4a574]" />
                      Đổi Sang Nhân Vật Khác
                    </button>

                    <button
                      type="button"
                      onClick={handleRemove}
                      className="w-full py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-rose-500/20"
                    >
                      <Trash2 size={13} />
                      Gỡ Mascot Khỏi Nút
                    </button>
                  </>
                )}

                {/* Sub Action: Fallback to System Context Menu */}
                {onOpenSystemMenu && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSystemMenu();
                    }}
                    className="w-full py-1 px-2 rounded-lg text-[#8b6f47]/75 hover:text-[#2d5016] dark:text-stone-400 dark:hover:text-stone-200 text-[10.5px] font-medium flex items-center justify-center gap-1 transition-colors mt-0.5 cursor-pointer"
                  >
                    <Compass size={12} />
                    Mở menu điều hướng trang
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Tab: Danh Sách 60 Nhân Vật (Gọn Gàng) */
            <div className="p-3 flex flex-col gap-2 max-h-[380px]">
              {/* Search & Filter Header */}
              <div className="flex flex-col gap-1.5">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8b6f47]/60 dark:text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm linh vật..."
                    className="w-full pl-7.5 pr-2.5 py-1 text-[11px] bg-[#f4efe4] dark:bg-[#23271f] rounded-xl border border-[#8b6f47]/20 dark:border-white/10 focus:outline-hidden focus:ring-1 focus:ring-[#2d5016] dark:focus:ring-emerald-500 font-medium text-stone-800 dark:text-stone-100 placeholder:text-[#8b6f47]/50"
                  />
                </div>

                {/* Categories */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                  {MASCOT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        "px-2 py-0.5 rounded-lg text-[9.5px] font-bold whitespace-nowrap transition-all cursor-pointer",
                        selectedCategory === cat.id
                          ? "bg-[#2d5016] text-white dark:bg-emerald-600 shadow-xs"
                          : "bg-[#8b6f47]/10 dark:bg-white/5 text-[#8b6f47] dark:text-[#d4a574] hover:bg-[#8b6f47]/20"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Characters Grid */}
              <div className="grid grid-cols-4 gap-1.5 overflow-y-auto max-h-[220px] p-0.5 pr-1 custom-scrollbar">
                {filteredMascots.map((char) => {
                  const isSelected = selectedCharId === char.id;
                  const isPill = char.id === 'active_pill';
                  return (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => {
                        setSelectedCharId(char.id);
                        handleConfirmCreate(char.id);
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all text-center group cursor-pointer relative",
                        isSelected
                          ? "bg-[#2d5016]/15 dark:bg-emerald-500/20 border-[#2d5016] dark:border-emerald-500 ring-1 ring-[#2d5016]/30"
                          : "bg-[#f4efe4]/60 dark:bg-white/[0.03] border-[#8b6f47]/15 dark:border-white/5 hover:border-[#2d5016]/40 hover:bg-[#8b6f47]/10"
                      )}
                    >
                      {isPill ? (
                        <div className="w-8 h-8 flex items-center justify-center">
                          <img
                            src="/assets/images/mascot_active_pill.png"
                            alt="Bé Lyang"
                            className="w-7 h-7 object-contain group-hover:scale-110 transition-transform"
                          />
                        </div>
                      ) : (
                        <div
                          className="w-8 h-8 group-hover:scale-110 transition-transform"
                          style={{
                            backgroundImage: `url("${char.directions || '/mascots/lyang-directions.webp'}")`,
                            backgroundPosition: '50% 50%',
                            backgroundSize: '300% 300%',
                            backgroundRepeat: 'no-repeat'
                          }}
                        />
                      )}
                      <span className="text-[9px] font-bold text-stone-700 dark:text-stone-200 truncate w-full mt-0.5">
                        {char.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Footer Back Button */}
              <div className="pt-1.5 border-t border-[#8b6f47]/20 dark:border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('prompt')}
                  className="px-2.5 py-1 rounded-lg bg-[#8b6f47]/10 hover:bg-[#8b6f47]/20 text-[10.5px] font-bold text-[#8b6f47] dark:text-[#d4a574] transition-colors cursor-pointer"
                >
                  ← Quay lại
                </button>
                <span className="text-[9.5px] text-[#8b6f47]/70 dark:text-stone-400 font-medium">
                  Click để chọn ngay
                </span>
              </div>
            </div>
          )}
        </m.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
