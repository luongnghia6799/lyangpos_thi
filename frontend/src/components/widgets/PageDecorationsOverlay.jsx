import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useLocation } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Plus, Trash2, Check, RotateCw, Move, 
  Maximize2, Layers, Eye, EyeOff, Upload, X, SlidersHorizontal, Leaf,
  ChevronDown, ChevronUp, Copy, ArrowUpDown, Minimize2, Wand2, Undo2
} from 'lucide-react';
import { 
  DECORATION_TEMPLATES, 
  getStoredDecorations, 
  saveStoredDecorations,
  removeImageBackground
} from '../../lib/decorations';
import { cn } from '../../lib/utils';
import Portal from './Portal';
import ConfirmModal from '../modals/ConfirmModal';

function areDecorationItemPropsEqual(prev, next) {
  return (
    prev.item === next.item &&
    prev.isEditing === next.isEditing &&
    prev.isPreview === next.isPreview &&
    prev.isSelected === next.isSelected
  );
}

// Single Drag-and-Drop Decoration Item
const DraggableDecorationItem = memo(({
  item,
  isEditing,
  isPreview,
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
    if (!isEditing || isPreview) return;
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
  const canInteract = isEditing && !isPreview;

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
        transform: `translate3d(0, 0, 0) rotate(${rotate}deg)`,
        willChange: canInteract ? 'transform, left, top' : 'auto',
        contain: 'layout style',
        opacity: opacity,
        zIndex: canInteract ? 99990 : (isBackground ? 1 : 20),
        pointerEvents: canInteract ? 'auto' : 'none',
        userSelect: 'none'
      }}
      className={cn(
        "transition-[box-shadow,border-color] duration-150 select-none",
        canInteract && "cursor-grab active:cursor-grabbing",
        canInteract && isSelected && "ring-2 ring-[#7D8B6E] ring-offset-2 rounded-2xl shadow-xl",
        canInteract && !isSelected && "hover:ring-1 hover:ring-[#7D8B6E]/50 rounded-2xl"
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
      {canInteract && isSelected && (
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
}, areDecorationItemPropsEqual);

export default function PageDecorationsOverlay({ forcedPageKey }) {
  const location = useLocation();
  const pageKey = forcedPageKey || (location.pathname.replace(/^\//, '') || 'dashboard');

  const [decorations, setDecorations] = useState(() => getStoredDecorations(pageKey));
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showPalette, setShowPalette] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dockPosition, setDockPosition] = useState('bottom'); // 'bottom' | 'top'
  const [isPreview, setIsPreview] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Sync when page route changes
  useEffect(() => {
    setDecorations(getStoredDecorations(pageKey));
    setSelectedId(null);
    setIsPreview(false);
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
        setIsEditing(prev => {
          const next = !prev;
          if (next) {
            setIsMinimized(false);
            setIsPreview(false);
          }
          return next;
        });
      }
    };
    const handleToggleEvent = (e) => {
      if (e.detail?.action === 'open') {
        setIsEditing(true);
        setIsMinimized(false);
        setIsPreview(false);
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
    setSelectedId(curr => (curr === id ? null : curr));
  }, [pageKey]);

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

  const [autoRemoveBg, setAutoRemoveBg] = useState(false);

  const handleRemoveBg = async (id) => {
    const item = decorations.find(d => d.id === id);
    if (!item || !item.customImgUrl) return;

    const sourceUrl = item.originalImgUrl || item.customImgUrl;
    try {
      const cutUrl = await removeImageBackground(sourceUrl, 32);
      handleUpdateItem(id, {
        customImgUrl: cutUrl,
        originalImgUrl: sourceUrl,
        isBgRemoved: true
      });
    } catch (e) {
      console.error('Lỗi khi tách nền:', e);
    }
  };

  const handleRestoreOriginalBg = (id) => {
    const item = decorations.find(d => d.id === id);
    if (!item || !item.originalImgUrl) return;

    handleUpdateItem(id, {
      customImgUrl: item.originalImgUrl,
      isBgRemoved: false
    });
  };

  const processAndAddImageFile = useCallback((file, customPos) => {
    if (!file) return;

    // Giới hạn file ban đầu tối đa 15MB
    if (file.size > 15 * 1024 * 1024) {
      alert("File ảnh quá lớn (trên 15MB). Vui lòng chọn ảnh nhẹ hơn.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        // Tối đa 280px để sticker vừa vặn, siêu nhẹ cho RAM và localStorage
        const maxDim = 280;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        // Dùng Canvas HTML5 nén kích thước & tối ưu dung lượng
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, w, h);
        }

        // Xuất WebP chất lượng 82% (giữ nền trong suốt, dung lượng chỉ còn ~15KB - 30KB)
        let compressedBase64 = canvas.toDataURL('image/webp', 0.82);
        if (!compressedBase64.startsWith('data:image/webp')) {
          compressedBase64 = canvas.toDataURL('image/png');
        }

        let finalImgUrl = compressedBase64;
        let isBgRemoved = false;

        // Nếu bật tự động tách nền ngay khi dán/upload
        if (autoRemoveBg) {
          try {
            finalImgUrl = await removeImageBackground(compressedBase64, 32);
            isBgRemoved = true;
          } catch (err) {
            console.error("Lỗi khi tách nền tự động", err);
          }
        }

        const posX = customPos?.x 
          ? Math.max(20, Math.min(window.innerWidth - w - 20, customPos.x - w / 2))
          : Math.round(window.innerWidth / 2 - w / 2);
        const posY = customPos?.y 
          ? Math.max(20, Math.min(window.innerHeight - h - 20, customPos.y - h / 2))
          : Math.round(window.innerHeight / 2 - h / 2);

        const newItem = {
          id: `dec_${Date.now()}`,
          customImgUrl: finalImgUrl,
          originalImgUrl: compressedBase64,
          isBgRemoved: isBgRemoved,
          x: Math.round(posX),
          y: Math.round(posY),
          width: w,
          height: h,
          rotate: 0,
          opacity: 100,
          isBackground: false
        };

        setDecorations(prev => {
          const next = [...prev, newItem];
          saveStoredDecorations(pageKey, next);
          return next;
        });
        setSelectedId(newItem.id);
        setShowPalette(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }, [autoRemoveBg, pageKey]);

  const handleUploadImage = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndAddImageFile(file);
    }
    // Reset input để có thể chọn lại cùng 1 file
    e.target.value = '';
  };

  // Lắng nghe phím tắt Ctrl + V để dán ảnh từ clipboard trực tiếp thành sticker
  useEffect(() => {
    let lastMousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const handleMouseMove = (e) => {
      lastMousePos = { x: e.clientX, y: e.clientY };
    };

    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            setIsEditing(true);
            setIsMinimized(false);
            processAndAddImageFile(file, lastMousePos);
            break;
          }
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('paste', handlePaste);
    };
  }, [processAndAddImageFile]);

  const handleDuplicateItem = useCallback((id) => {
    setDecorations(prev => {
      const target = prev.find(d => d.id === id);
      if (!target) return prev;
      const newItem = {
        ...target,
        id: `dec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        x: Math.min(window.innerWidth - (target.width || 120), (target.x || 100) + 24),
        y: Math.min(window.innerHeight - (target.height || 120), (target.y || 100) + 24),
      };
      const next = [...prev, newItem];
      saveStoredDecorations(pageKey, next);
      setSelectedId(newItem.id);
      return next;
    });
  }, [pageKey]);

  const selectedItem = decorations.find(d => d.id === selectedId);

  return (
    <>
      {/* 1. All Rendered Decoration Items on Page */}
      {decorations.map((item) => (
        <DraggableDecorationItem
          key={item.id}
          item={item}
          isEditing={isEditing}
          isPreview={isPreview}
          isSelected={selectedId === item.id}
          onSelect={setSelectedId}
          onUpdate={handleUpdateItem}
          onDelete={handleDeleteItem}
        />
      ))}

      {/* 2. Editing Control Dock Bar */}
      <Portal>
        <AnimatePresence>
          {isEditing && (
            <m.div
              key="decorations-main-floating-dock"
              initial={{ opacity: 0, y: dockPosition === 'top' ? -35 : 35, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: dockPosition === 'top' ? -35 : 35, scale: 0.94 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{ willChange: 'transform, opacity' }}
              className={cn(
                "fixed left-1/2 -translate-x-1/2 z-[999999] flex flex-col items-center gap-2.5 select-none pointer-events-none",
                dockPosition === 'top' ? "top-5" : "bottom-6"
              )}
            >
              {/* Context Toolset for Currently Selected Decoration */}
              <AnimatePresence>
                {selectedItem && !isPreview && !isMinimized && (
                  <m.div
                    key="selected-tools"
                    initial={{ opacity: 0, y: dockPosition === 'top' ? -10 : 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: dockPosition === 'top' ? -10 : 10, scale: 0.96 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    style={{ willChange: 'transform, opacity' }}
                    className="pointer-events-auto bg-white/95 dark:bg-[#1E231B]/95 backdrop-blur-2xl border border-[#7D8B6E]/30 dark:border-[#3D4C38]/70 rounded-full py-1.5 px-3 shadow-xl flex items-center gap-2.5 text-xs text-[#3B3224] dark:text-[#E8E2D8]"
                  >
                    {/* Size Scale Slider */}
                    <div className="flex items-center gap-1.5" title="Kích thước sticker">
                      <Maximize2 size={13} className="text-[#7D8B6E]" />
                      <input
                        type="range"
                        min="50"
                        max="480"
                        value={selectedItem.width || 150}
                        onChange={(e) => {
                          const newW = parseInt(e.target.value, 10);
                          const ratio = (selectedItem.height || 150) / (selectedItem.width || 150);
                          handleUpdateItem(selectedItem.id, {
                            width: newW,
                            height: Math.round(newW * ratio)
                          });
                        }}
                        className="w-16 accent-[#7D8B6E] cursor-pointer h-1.5 rounded-lg bg-gray-200 dark:bg-gray-700"
                      />
                      <span className="font-mono text-[10px] w-7 font-bold">{selectedItem.width}p</span>
                    </div>

                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />

                    {/* Rotate Slider */}
                    <div className="flex items-center gap-1.5" title="Góc xoay">
                      <RotateCw size={12} className="text-[#7D8B6E]" />
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={selectedItem.rotate || 0}
                        onChange={(e) => handleUpdateItem(selectedItem.id, { rotate: parseInt(e.target.value, 10) })}
                        className="w-14 accent-[#7D8B6E] cursor-pointer h-1.5 rounded-lg bg-gray-200 dark:bg-gray-700"
                      />
                      <span className="font-mono text-[10px] w-6 font-bold">{selectedItem.rotate || 0}°</span>
                    </div>

                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />

                    {/* Opacity Slider */}
                    <div className="flex items-center gap-1.5" title="Độ mờ / trong suốt">
                      <SlidersHorizontal size={12} className="text-[#7D8B6E]" />
                      <input
                        type="range"
                        min="15"
                        max="100"
                        value={selectedItem.opacity ?? 100}
                        onChange={(e) => handleUpdateItem(selectedItem.id, { opacity: parseInt(e.target.value, 10) })}
                        className="w-14 accent-[#7D8B6E] cursor-pointer h-1.5 rounded-lg bg-gray-200 dark:bg-gray-700"
                      />
                      <span className="font-mono text-[10px] w-6 font-bold">{selectedItem.opacity ?? 100}%</span>
                    </div>

                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />

                    {/* Layer toggle: Background or Foreground */}
                    <button
                      type="button"
                      onClick={() => handleUpdateItem(selectedItem.id, { isBackground: !selectedItem.isBackground })}
                      className={cn(
                        "w-7 h-7 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95",
                        selectedItem.isBackground
                          ? "bg-[#7D8B6E]/20 text-[#556945] dark:text-[#A3B891] border border-[#7D8B6E]/40"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                      )}
                      title={selectedItem.isBackground ? "Đang chìm dưới nền (Click để nổi lên)" : "Đang nổi lên trên (Click để chìm dưới nền)"}
                    >
                      <Layers size={13} />
                    </button>

                    {/* Duplicate item button */}
                    <button
                      type="button"
                      onClick={() => handleDuplicateItem(selectedItem.id)}
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all flex items-center justify-center cursor-pointer active:scale-95"
                      title="Nhân đôi (Sao chép)"
                    >
                      <Copy size={13} />
                    </button>

                    {/* Smart Background Removal Button for custom images */}
                    {selectedItem.customImgUrl && (
                      selectedItem.isBgRemoved ? (
                        <button
                          type="button"
                          onClick={() => handleRestoreOriginalBg(selectedItem.id)}
                          className="w-7 h-7 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition-all flex items-center justify-center cursor-pointer active:scale-95 border border-amber-500/30"
                          title="Khôi phục lại nền gốc ban đầu"
                        >
                          <Undo2 size={13} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemoveBg(selectedItem.id)}
                          className="w-7 h-7 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-xs"
                          title="Tách bỏ nền trắng / màu đơn sắc"
                        >
                          <Wand2 size={13} />
                        </button>
                      )
                    )}

                    {/* Delete item button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(selectedItem.id)}
                      className="w-7 h-7 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center justify-center cursor-pointer"
                      title="Xóa vật phẩm này"
                    >
                      <Trash2 size={13} />
                    </button>
                  </m.div>
                )}
              </AnimatePresence>

              {/* Main Floating Toolstrip / Island */}
              <AnimatePresence mode="wait">
                {isMinimized ? (
                  <m.div
                    key="minimized-dock"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    style={{ willChange: 'transform, opacity' }}
                    onClick={() => setIsMinimized(false)}
                    className="pointer-events-auto group px-3 py-1.5 rounded-full bg-[#FAF7F2]/95 dark:bg-[#1A2017]/95 backdrop-blur-2xl border border-[#7D8B6E]/40 hover:border-[#7D8B6E] shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:shadow-xl flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                    title="Bấm để mở rộng thanh công cụ trang trí"
                  >
                    <Leaf size={14} className="text-[#7D8B6E] group-hover:rotate-12 transition-transform" />
                    <span className="text-[11px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[#7D8B6E]/15 text-[#556945] dark:text-[#B2C5A1]">
                      {decorations.length}
                    </span>
                    <ChevronUp size={13} className={cn("text-gray-400 transition-transform", dockPosition === 'top' && "rotate-180")} />
                  </m.div>
                ) : (
                  <m.div
                    key="expanded-dock"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    style={{ willChange: 'transform, opacity' }}
                    className={cn(
                      "pointer-events-auto bg-[#FAF7F2]/95 dark:bg-[#1A2017]/95 backdrop-blur-2xl border border-[#7D8B6E]/40 dark:border-[#3E4F38]/80 rounded-full px-2 py-1 shadow-[0_12px_36px_rgba(28,25,23,0.16),0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.08)] flex items-center gap-1.5 transition-opacity duration-150",
                      isPreview && "opacity-60 hover:opacity-100"
                    )}
                  >
                    {/* Header: Leaf Icon + Item Counter Badge */}
                    <div className="flex items-center gap-1 pl-1.5 pr-0.5" title={`Đang có ${decorations.length} vật phẩm trang trí`}>
                      <Leaf size={15} className="text-[#7D8B6E] animate-pulse" />
                      <span className="text-[11px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[#7D8B6E]/15 text-[#556945] dark:text-[#B2C5A1] min-w-[18px] text-center">
                        {decorations.length}
                      </span>
                    </div>

                    <div className="w-px h-5 bg-[#7D8B6E]/20 dark:bg-white/10" />

                    {/* Add Plant Button (Icon only) */}
                    <button
                      type="button"
                      onClick={() => setShowPalette(true)}
                      title="Thêm cây kiểng & họa tiết trang trí"
                      className="w-8 h-8 rounded-full bg-gradient-to-r from-[#7D8B6E] to-[#667756] hover:from-[#6E7D5F] hover:to-[#5B6B4C] text-white flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                    >
                      <Plus size={16} />
                    </button>

                    {/* Upload Custom Image Button (Icon only) */}
                    <label
                      title="Tải ảnh từ máy tính (hoặc bấm Ctrl+V để dán trực tiếp)"
                      className="w-8 h-8 rounded-full bg-white/90 dark:bg-[#252E22] hover:bg-white border border-[#DE8C5A]/40 hover:border-[#DE8C5A] text-[#DE8C5A] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-2xs"
                    >
                      <Upload size={14} />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadImage}
                        className="hidden"
                      />
                    </label>

                    {/* Auto Remove Background Toggle (Icon only) */}
                    <button
                      type="button"
                      onClick={() => setAutoRemoveBg(prev => !prev)}
                      title={autoRemoveBg ? "Tự động tách nền khi tải ảnh: ĐANG BẬT (Bấm để tắt)" : "Tự động tách nền khi tải ảnh: ĐANG TẮT (Bấm để bật)"}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-95 border cursor-pointer",
                        autoRemoveBg
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-white/80 dark:bg-[#252E22] text-[#6E6352] dark:text-[#A79D8E] border-gray-200 dark:border-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <Wand2 size={14} className={autoRemoveBg ? "text-white" : "text-emerald-600"} />
                    </button>

                    {/* Preview Toggle Button (Icon only) */}
                    <button
                      type="button"
                      onClick={() => setIsPreview(prev => !prev)}
                      title={isPreview ? "Đang xem trước (Bấm để hiện lại viền)" : "Xem trước bố cục không viền"}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-transform cursor-pointer active:scale-95",
                        isPreview
                          ? "bg-[#7D8B6E] text-white shadow-xs"
                          : "text-[#6E6352] dark:text-[#A79D8E] hover:bg-black/5 dark:hover:bg-white/10"
                      )}
                    >
                      {isPreview ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>

                    {/* Change Position (Top/Bottom) Toggle (Icon only) */}
                    <button
                      type="button"
                      onClick={() => setDockPosition(prev => prev === 'bottom' ? 'top' : 'bottom')}
                      title={dockPosition === 'bottom' ? "Chuyển thanh lên trên" : "Chuyển thanh xuống dưới"}
                      className="w-8 h-8 rounded-full text-[#6E6352] dark:text-[#A79D8E] hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ArrowUpDown size={15} />
                    </button>

                    {/* Minimize / Collapse Bar (Icon only) */}
                    <button
                      type="button"
                      onClick={() => setIsMinimized(true)}
                      title="Thu nhỏ thanh điều khiển"
                      className="w-8 h-8 rounded-full text-[#6E6352] dark:text-[#A79D8E] hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Minimize2 size={14} />
                    </button>

                    {/* Clear All Decorations (Icon only) */}
                    {decorations.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(true)}
                        title="Xóa tất cả trang trí"
                        className="w-8 h-8 rounded-full text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}

                    <div className="w-px h-5 bg-[#7D8B6E]/20 dark:bg-white/10" />

                    {/* Finish / Save Button (Icon only) */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedId(null);
                        setIsPreview(false);
                      }}
                      title="Hoàn tất và lưu trang trí (Alt+D)"
                      className="w-8 h-8 rounded-full bg-gradient-to-r from-[#DE8C5A] to-[#CF7E4C] hover:from-[#D4814E] hover:to-[#BE6E3D] text-white flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                    >
                      <Check size={16} strokeWidth={2.5} />
                    </button>
                  </m.div>
                )}
              </AnimatePresence>
            </m.div>
          )}
        </AnimatePresence>
      </Portal>

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

      {/* 4. Custom Confirm Modal for Clearing Decorations */}
      <ConfirmModal
        isOpen={showClearConfirm}
        type="danger"
        title="Xóa toàn bộ trang trí?"
        message={`Bạn có chắc muốn xóa tất cả ${decorations.length} cây kiểng và sticker trang trí trên trang này không? Thao tác này không thể hoàn tác.`}
        confirmText="Xóa tất cả"
        cancelText="Giữ lại"
        onConfirm={() => {
          updateDecorations([]);
          setSelectedId(null);
          setShowClearConfirm(false);
        }}
        onCancel={() => setShowClearConfirm(false)}
      />
    </>
  );
}
