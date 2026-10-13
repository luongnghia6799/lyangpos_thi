import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useLocation } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Plus, Trash2, Check, RotateCw, Move, 
  Maximize2, Layers, Eye, EyeOff, Upload, X, SlidersHorizontal, Leaf
} from 'lucide-react';
import { 
  DECORATION_TEMPLATES, 
  getStoredDecorations, 
  saveStoredDecorations 
} from '../../lib/decorations';
import { cn } from '../../lib/utils';
import Portal from './Portal';

// Single Drag-and-Drop Decoration Item
const DraggableDecorationItem = memo(({
  item,
  isEditing,
  isSelected,
  onSelect,
  onUpdate,
  onDelete
}) => {
  const containerRef = useRef(null);
  const template = DECORATION_TEMPLATES.find(t => t.id === item.templateId);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: item.x, posY: item.y });

  const handleMouseDown = (e) => {
    if (!isEditing) return;
    e.stopPropagation();
    onSelect(item.id);
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: item.x,
      posY: item.y
    };

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.x;
      const deltaY = moveEvent.clientY - dragStartRef.current.y;
      onUpdate(item.id, {
        x: Math.max(0, Math.min(window.innerWidth - (item.width || 120), dragStartRef.current.posX + deltaX)),
        y: Math.max(0, Math.min(window.innerHeight - (item.height || 120), dragStartRef.current.posY + deltaY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const width = item.width || template?.defaultWidth || 150;
  const height = item.height || template?.defaultHeight || 150;
  const rotate = item.rotate || 0;
  const opacity = (item.opacity ?? 100) / 100;
  const isBackground = item.isBackground ?? false;

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed',
        left: `${item.x}px`,
        top: `${item.y}px`,
        width: `${width}px`,
        height: `${height}px`,
        transform: `rotate(${rotate}deg)`,
        opacity: opacity,
        zIndex: isEditing ? 99990 : (isBackground ? 1 : 20),
        pointerEvents: isEditing ? 'auto' : 'none',
        userSelect: 'none'
      }}
      className={cn(
        "transition-[box-shadow,border-color] duration-150 select-none",
        isEditing && "cursor-grab active:cursor-grabbing",
        isEditing && isSelected && "ring-2 ring-[#7D8B6E] ring-offset-2 rounded-2xl shadow-xl",
        isEditing && !isSelected && "hover:ring-1 hover:ring-[#7D8B6E]/50 rounded-2xl"
      )}
    >
      {/* Content Rendering: SVG Template or Custom Image */}
      {item.customImgUrl ? (
        <img
          src={item.customImgUrl}
          alt="Decoration"
          className="w-full h-full object-contain pointer-events-none select-none drop-shadow-sm"
          draggable={false}
        />
      ) : template?.svg ? (
        <div
          dangerouslySetInnerHTML={{ __html: template.svg }}
          className="w-full h-full pointer-events-none select-none drop-shadow-sm flex items-center justify-center"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[#7D8B6E]/20 rounded-2xl">
          <Leaf className="text-[#7D8B6E]" size={32} />
        </div>
      )}

      {/* Editing Badges & Quick Action handles */}
      {isEditing && isSelected && (
        <div className="absolute -top-3 -right-3 flex items-center gap-1 z-50 pointer-events-auto">
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => onDelete(item.id)}
            className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            title="Xóa vật phẩm này"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
});

export default function PageDecorationsOverlay({ forcedPageKey }) {
  const location = useLocation();
  const pageKey = forcedPageKey || (location.pathname.replace(/^\//, '') || 'dashboard');

  const [decorations, setDecorations] = useState(() => getStoredDecorations(pageKey));
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showPalette, setShowPalette] = useState(false);

  // Sync when page route changes
  useEffect(() => {
    setDecorations(getStoredDecorations(pageKey));
    setSelectedId(null);
  }, [pageKey]);

  // Save changes
  const updateDecorations = useCallback((newList) => {
    setDecorations(newList);
    saveStoredDecorations(pageKey, newList);
  }, [pageKey]);

  // Shortcut Alt + D to toggle edit mode, or custom event
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        setIsEditing(prev => !prev);
      }
    };
    const handleToggleEvent = (e) => {
      if (e.detail?.action === 'open') {
        setIsEditing(true);
        if (e.detail?.openPalette) setShowPalette(true);
      } else {
        setIsEditing(prev => !prev);
      }
    };
    const handleSyncBroadcast = (e) => {
      if (e.data?.type === 'DECORATIONS_UPDATED' && e.data?.pageKey === pageKey) {
        setDecorations(e.data.list);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('toggle_page_decorations_mode', handleToggleEvent);
    
    let chan;
    try {
      chan = new BroadcastChannel('pos_data_sync');
      chan.addEventListener('message', handleSyncBroadcast);
    } catch {}

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('toggle_page_decorations_mode', handleToggleEvent);
      if (chan) chan.close();
    };
  }, [pageKey]);

  const handleUpdateItem = useCallback((id, updates) => {
    setDecorations(prev => {
      const next = prev.map(item => item.id === id ? { ...item, ...updates } : item);
      saveStoredDecorations(pageKey, next);
      return next;
    });
  }, [pageKey]);

  const handleDeleteItem = useCallback((id) => {
    setDecorations(prev => {
      const next = prev.filter(item => item.id !== id);
      saveStoredDecorations(pageKey, next);
      return next;
    });
    if (selectedId === id) setSelectedId(null);
  }, [pageKey, selectedId]);

  const handleAddTemplate = (template) => {
    const defaultX = Math.round(window.innerWidth / 2 - template.defaultWidth / 2);
    const defaultY = Math.round(window.innerHeight / 2 - template.defaultHeight / 2);

    const newItem = {
      id: `dec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      templateId: template.id,
      x: defaultX,
      y: defaultY,
      width: template.defaultWidth,
      height: template.defaultHeight,
      rotate: 0,
      opacity: 100,
      isBackground: false
    };

    const next = [...decorations, newItem];
    updateDecorations(next);
    setSelectedId(newItem.id);
    setShowPalette(false);
  };

  const handleUploadImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 240;
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }

        const newItem = {
          id: `dec_${Date.now()}`,
          customImgUrl: event.target.result,
          x: Math.round(window.innerWidth / 2 - w / 2),
          y: Math.round(window.innerHeight / 2 - h / 2),
          width: w,
          height: h,
          rotate: 0,
          opacity: 100,
          isBackground: false
        };

        const next = [...decorations, newItem];
        updateDecorations(next);
        setSelectedId(newItem.id);
        setShowPalette(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const selectedItem = decorations.find(d => d.id === selectedId);

  return (
    <>
      {/* 1. All Rendered Decoration Items on Page */}
      {decorations.map((item) => (
        <DraggableDecorationItem
          key={item.id}
          item={item}
          isEditing={isEditing}
          isSelected={selectedId === item.id}
          onSelect={setSelectedId}
          onUpdate={handleUpdateItem}
          onDelete={handleDeleteItem}
        />
      ))}

      {/* 2. Editing Control Dock Bar */}
      {isEditing && (
        <Portal>
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999999] flex flex-col items-center gap-3">
            {/* Context Toolset for Currently Selected Decoration */}
            {selectedItem && (
              <m.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/95 dark:bg-[#1E231B]/95 backdrop-blur-xl border border-[#7D8B6E]/30 dark:border-[#3D4C38] rounded-2xl p-3 shadow-2xl flex items-center gap-4 text-xs select-none"
              >
                {/* Size Scale Slider */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cỡ:</span>
                  <input
                    type="range"
                    min="60"
                    max="450"
                    value={selectedItem.width || 150}
                    onChange={(e) => {
                      const newW = parseInt(e.target.value, 10);
                      const ratio = (selectedItem.height || 150) / (selectedItem.width || 150);
                      handleUpdateItem(selectedItem.id, {
                        width: newW,
                        height: Math.round(newW * ratio)
                      });
                    }}
                    className="w-24 accent-[#7D8B6E] cursor-pointer"
                  />
                  <span className="font-mono text-[10px] w-8">{selectedItem.width}px</span>
                </div>

                <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

                {/* Rotate Slider */}
                <div className="flex items-center gap-2">
                  <RotateCw size={13} className="text-[#7D8B6E]" />
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={selectedItem.rotate || 0}
                    onChange={(e) => handleUpdateItem(selectedItem.id, { rotate: parseInt(e.target.value, 10) })}
                    className="w-20 accent-[#7D8B6E] cursor-pointer"
                  />
                  <span className="font-mono text-[10px] w-8">{selectedItem.rotate || 0}°</span>
                </div>

                <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

                {/* Opacity Slider */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Độ mờ:</span>
                  <input
                    type="range"
                    min="15"
                    max="100"
                    value={selectedItem.opacity ?? 100}
                    onChange={(e) => handleUpdateItem(selectedItem.id, { opacity: parseInt(e.target.value, 10) })}
                    className="w-20 accent-[#7D8B6E] cursor-pointer"
                  />
                  <span className="font-mono text-[10px] w-7">{selectedItem.opacity ?? 100}%</span>
                </div>

                <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

                {/* Layer toggle: Background or Foreground */}
                <button
                  type="button"
                  onClick={() => handleUpdateItem(selectedItem.id, { isBackground: !selectedItem.isBackground })}
                  className={cn(
                    "px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer",
                    selectedItem.isBackground
                      ? "bg-[#7D8B6E]/20 text-[#556945] border border-[#7D8B6E]/40"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  )}
                  title="Chìm dưới nền giỏ hàng hay nổi lên trên"
                >
                  <Layers size={12} />
                  <span>{selectedItem.isBackground ? "Dưới nền" : "Nổi lên"}</span>
                </button>
              </m.div>
            )}

            {/* Main Floating Toolstrip */}
            <div className="bg-[#FAF7F2]/95 dark:bg-[#1E231B]/95 backdrop-blur-xl border-2 border-[#7D8B6E] rounded-full px-4 py-2 shadow-2xl flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#3B3224] dark:text-[#EAE5DC] pl-1">
                <Leaf size={16} className="text-[#7D8B6E]" />
                <span className="hidden sm:inline">Chế độ Trang Trí Tự Do (Alt+D)</span>
              </div>

              <div className="w-px h-5 bg-[#7D8B6E]/30" />

              {/* Add Plant Button */}
              <button
                type="button"
                onClick={() => setShowPalette(true)}
                className="px-3 py-1.5 rounded-full bg-[#7D8B6E] hover:bg-[#6C7B5D] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Thêm cây kiểng 🪴</span>
              </button>

              {/* Upload Custom Image Button */}
              <label className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 hover:bg-gray-50 border border-[#7D8B6E]/30 text-xs font-bold text-[#4B3F30] dark:text-[#E8E2D8] flex items-center gap-1.5 transition-all cursor-pointer">
                <Upload size={13} className="text-[#DE8C5A]" />
                <span>Thêm ảnh máy</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadImage}
                  className="hidden"
                />
              </label>

              {/* Clear All Decorations */}
              {decorations.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Bạn có chắc muốn xóa toàn bộ cây trang trí trên trang này không?')) {
                      updateDecorations([]);
                      setSelectedId(null);
                    }
                  }}
                  className="p-1.5 rounded-full text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Xóa tất cả trang trí"
                >
                  <Trash2 size={16} />
                </button>
              )}

              {/* Finish / Save Button */}
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedId(null);
                }}
                className="px-3.5 py-1.5 rounded-full bg-[#DE8C5A] hover:bg-[#CF7E4C] text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
              >
                <Check size={14} />
                <span>Hoàn tất</span>
              </button>
            </div>
          </div>
        </Portal>
      )}

      {/* 3. Plant & Decor Selection Drawer / Modal */}
      {showPalette && (
        <Portal>
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]">
            <div className="bg-[#FAF7F2] dark:bg-[#1E231B] border border-[#E0D7C5] dark:border-[#384334] rounded-[28px] w-full max-w-xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E6DDCC] dark:border-[#333E2F]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#7D8B6E]/20 text-[#556945] dark:text-[#B2C5A1] flex items-center justify-center">
                    <Leaf size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-[#3B3224] dark:text-[#EDE8DF]">
                      Chọn Cây Kiểng & Họa Tiết Trang Trí
                    </h3>
                    <p className="text-[11px] text-[#7A6E5D] dark:text-[#A79D8E]">
                      Bấm vào mẫu bạn thích để thêm vào màn hình, sau đó kéo thả vị trí tùy ý
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPalette(false)}
                  className="w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center text-gray-500 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Grid of Templates */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[380px] overflow-y-auto no-scrollbar p-1">
                {DECORATION_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleAddTemplate(tmpl)}
                    className="p-3 bg-white dark:bg-[#252C21] hover:bg-[#F2ECE0] dark:hover:bg-[#2F372B] border border-[#E6DECE] dark:border-[#3D4939] rounded-2xl flex flex-col items-center gap-2 text-center group hover:scale-102 hover:border-[#7D8B6E] transition-all cursor-pointer shadow-xs"
                  >
                    <div className="w-24 h-24 flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
                      <div
                        dangerouslySetInnerHTML={{ __html: tmpl.svg }}
                        className="w-full h-full pointer-events-none"
                      />
                    </div>
                    <span className="text-xs font-serif font-bold text-[#3B3224] dark:text-[#EDE8DF] line-clamp-1">
                      {tmpl.name}
                    </span>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-[#E6DDCC] dark:border-[#333E2F] flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowPalette(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-black/5 cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
