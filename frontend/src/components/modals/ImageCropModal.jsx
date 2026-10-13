import React, { useState, useRef, useEffect, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Crop, X, Check, RotateCcw, Square, RectangleHorizontal, RectangleVertical } from 'lucide-react';
import Portal from '../widgets/Portal';
import { cn } from '../../lib/utils';

export default function ImageCropModal({
  isOpen,
  imageUrl,
  onCropComplete,
  onClose
}) {
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // Crop box in pixels relative to displayed image: { x, y, w, h }
  const [crop, setCrop] = useState({ x: 20, y: 20, w: 180, h: 180 });
  const [aspectRatio, setAspectRatio] = useState('free'); // 'free', '1:1', '4:3', '3:4'
  const [displayedSize, setDisplayedSize] = useState({ width: 0, height: 0 });

  // Reset when image changes or modal opens
  const initCrop = useCallback(() => {
    if (!imgRef.current) return;
    const w = imgRef.current.clientWidth;
    const h = imgRef.current.clientHeight;
    if (w > 0 && h > 0) {
      setDisplayedSize({ width: w, height: h });
      const cropW = Math.round(w * 0.8);
      const cropH = Math.round(h * 0.8);
      setCrop({
        x: Math.round((w - cropW) / 2),
        y: Math.round((h - cropH) / 2),
        w: cropW,
        h: cropH
      });
    }
  }, []);

  const handleImageLoad = () => {
    initCrop();
  };

  useEffect(() => {
    if (isOpen) {
      // Delay slightly to ensure layout dimension has computed
      const timer = setTimeout(initCrop, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen, imageUrl, initCrop]);

  // Dragging or resizing state
  const dragRef = useRef({
    isDragging: false,
    mode: null, // 'move', 'nw', 'ne', 'sw', 'se'
    startX: 0,
    startY: 0,
    startCrop: { x: 0, y: 0, w: 0, h: 0 }
  });

  const handleStartDrag = (e, mode) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      isDragging: true,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...crop }
    };

    const handleMouseMove = (moveEvent) => {
      if (!dragRef.current.isDragging) return;
      const dx = moveEvent.clientX - dragRef.current.startX;
      const dy = moveEvent.clientY - dragRef.current.startY;
      const { startCrop, mode } = dragRef.current;
      const imgW = displayedSize.width;
      const imgH = displayedSize.height;

      if (mode === 'move') {
        const nextX = Math.max(0, Math.min(imgW - startCrop.w, startCrop.x + dx));
        const nextY = Math.max(0, Math.min(imgH - startCrop.h, startCrop.y + dy));
        setCrop(prev => ({ ...prev, x: Math.round(nextX), y: Math.round(nextY) }));
      } else if (mode === 'se') {
        let newW = Math.max(40, Math.min(imgW - startCrop.x, startCrop.w + dx));
        let newH = Math.max(40, Math.min(imgH - startCrop.y, startCrop.h + dy));
        if (aspectRatio === '1:1') {
          const side = Math.min(newW, newH);
          newW = side;
          newH = side;
        } else if (aspectRatio === '4:3') {
          newH = Math.round(newW * 0.75);
        } else if (aspectRatio === '3:4') {
          newH = Math.round(newW * 1.333);
        }
        setCrop(prev => ({ ...prev, w: Math.round(newW), h: Math.round(newH) }));
      } else if (mode === 'sw') {
        let newW = Math.max(40, Math.min(startCrop.x + startCrop.w, startCrop.w - dx));
        let newX = startCrop.x + (startCrop.w - newW);
        let newH = Math.max(40, Math.min(imgH - startCrop.y, startCrop.h + dy));
        if (aspectRatio === '1:1') {
          const side = Math.min(newW, newH);
          newW = side;
          newH = side;
          newX = startCrop.x + (startCrop.w - newW);
        }
        setCrop(prev => ({ ...prev, x: Math.round(newX), w: Math.round(newW), h: Math.round(newH) }));
      } else if (mode === 'ne') {
        let newW = Math.max(40, Math.min(imgW - startCrop.x, startCrop.w + dx));
        let newH = Math.max(40, Math.min(startCrop.y + startCrop.h, startCrop.h - dy));
        let newY = startCrop.y + (startCrop.h - newH);
        if (aspectRatio === '1:1') {
          const side = Math.min(newW, newH);
          newW = side;
          newH = side;
          newY = startCrop.y + (startCrop.h - newH);
        }
        setCrop(prev => ({ ...prev, y: Math.round(newY), w: Math.round(newW), h: Math.round(newH) }));
      } else if (mode === 'nw') {
        let newW = Math.max(40, Math.min(startCrop.x + startCrop.w, startCrop.w - dx));
        let newX = startCrop.x + (startCrop.w - newW);
        let newH = Math.max(40, Math.min(startCrop.y + startCrop.h, startCrop.h - dy));
        let newY = startCrop.y + (startCrop.h - newH);
        if (aspectRatio === '1:1') {
          const side = Math.min(newW, newH);
          newW = side;
          newH = side;
          newX = startCrop.x + (startCrop.w - newW);
          newY = startCrop.y + (startCrop.h - newH);
        }
        setCrop(prev => ({ ...prev, x: Math.round(newX), y: Math.round(newY), w: Math.round(newW), h: Math.round(newH) }));
      }
    };

    const handleMouseUp = () => {
      dragRef.current.isDragging = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleApplyPreset = (ratio) => {
    setAspectRatio(ratio);
    if (!imgRef.current) return;
    const imgW = displayedSize.width;
    const imgH = displayedSize.height;

    if (ratio === 'free') return;

    let targetW = crop.w;
    let targetH = crop.h;

    if (ratio === '1:1') {
      const side = Math.min(crop.w, crop.h);
      targetW = side;
      targetH = side;
    } else if (ratio === '4:3') {
      targetH = Math.round(targetW * 0.75);
      if (targetH > imgH - crop.y) {
        targetH = imgH - crop.y;
        targetW = Math.round(targetH * (4 / 3));
      }
    } else if (ratio === '3:4') {
      targetH = Math.round(targetW * (4 / 3));
      if (targetH > imgH - crop.y) {
        targetH = imgH - crop.y;
        targetW = Math.round(targetH * 0.75);
      }
    }

    setCrop(prev => ({
      ...prev,
      w: Math.min(imgW - prev.x, targetW),
      h: Math.min(imgH - prev.y, targetH)
    }));
  };

  const handleSaveCrop = () => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;

    const scaleX = img.naturalWidth / displayedSize.width;
    const scaleY = img.naturalHeight / displayedSize.height;

    const cropX = Math.max(0, crop.x * scaleX);
    const cropY = Math.max(0, crop.y * scaleY);
    const cropW = Math.min(img.naturalWidth - cropX, crop.w * scaleX);
    const cropH = Math.min(img.naturalHeight - cropY, crop.h * scaleY);

    if (cropW <= 0 || cropH <= 0) return;

    // Giới hạn max 280px để sticker nhẹ máy và không nặng localStorage
    const maxDim = 280;
    let targetW = cropW;
    let targetH = cropH;
    if (targetW > maxDim || targetH > maxDim) {
      if (targetW > targetH) {
        targetH = Math.round((targetH * maxDim) / targetW);
        targetW = maxDim;
      } else {
        targetW = Math.round((targetW * maxDim) / targetH);
        targetH = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(targetW);
    canvas.height = Math.round(targetH);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);
    }

    let outUrl = canvas.toDataURL('image/webp', 0.85);
    if (!outUrl.startsWith('data:image/webp')) {
      outUrl = canvas.toDataURL('image/png');
    }

    onCropComplete(outUrl, Math.round(targetW), Math.round(targetH));
    onClose();
  };

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <m.div
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#FAF7F2] dark:bg-[#1E231B] border border-[#E0D7C5] dark:border-[#384334] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E6DDCC] dark:border-[#333E2F]">
                <div className="flex items-center gap-2 text-stone-800 dark:text-stone-100">
                  <div className="w-8 h-8 rounded-xl bg-[#DE8C5A]/15 text-[#DE8C5A] flex items-center justify-center">
                    <Crop size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-serif">Cắt ảnh (Crop)</h3>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400">Kéo khung để chọn vùng ảnh muốn giữ lại</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-7 h-7 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-stone-500 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Crop Canvas Display Area */}
              <div className="p-4 flex items-center justify-center bg-[#F2EDE4]/60 dark:bg-[#151912]/60 overflow-hidden select-none min-h-[300px] max-h-[420px]">
                <div
                  ref={containerRef}
                  className="relative inline-block select-none overflow-hidden rounded-xl border border-stone-300 dark:border-stone-700 shadow-inner"
                  style={{ maxHeight: '380px' }}
                >
                  <img
                    ref={imgRef}
                    src={imageUrl}
                    alt="To Crop"
                    onLoad={handleImageLoad}
                    className="max-h-[380px] max-w-full block object-contain pointer-events-none select-none"
                    draggable={false}
                  />

                  {/* Interactive Crop Rectangle */}
                  {displayedSize.width > 0 && (
                    <div
                      onMouseDown={(e) => handleStartDrag(e, 'move')}
                      style={{
                        position: 'absolute',
                        left: `${crop.x}px`,
                        top: `${crop.y}px`,
                        width: `${crop.w}px`,
                        height: `${crop.h}px`,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
                        cursor: 'move'
                      }}
                      className="border-2 border-white cursor-move select-none"
                    >
                      {/* Grid Lines (Rule of Thirds) */}
                      <div className="absolute inset-0 pointer-events-none flex flex-col justify-evenly opacity-30">
                        <div className="w-full border-b border-dashed border-white" />
                        <div className="w-full border-b border-dashed border-white" />
                      </div>
                      <div className="absolute inset-0 pointer-events-none flex justify-evenly opacity-30">
                        <div className="h-full border-r border-dashed border-white" />
                        <div className="h-full border-r border-dashed border-white" />
                      </div>

                      {/* 4 Corner Resize Handles */}
                      <div
                        onMouseDown={(e) => handleStartDrag(e, 'nw')}
                        className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border border-stone-800 shadow-md cursor-nwse-resize rounded-xs hover:scale-125 transition-transform"
                      />
                      <div
                        onMouseDown={(e) => handleStartDrag(e, 'ne')}
                        className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border border-stone-800 shadow-md cursor-nesw-resize rounded-xs hover:scale-125 transition-transform"
                      />
                      <div
                        onMouseDown={(e) => handleStartDrag(e, 'sw')}
                        className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border border-stone-800 shadow-md cursor-nesw-resize rounded-xs hover:scale-125 transition-transform"
                      />
                      <div
                        onMouseDown={(e) => handleStartDrag(e, 'se')}
                        className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border border-stone-800 shadow-md cursor-nwse-resize rounded-xs hover:scale-125 transition-transform"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Aspect Ratio Presets Toolbar */}
              <div className="px-5 py-2.5 border-t border-[#E6DDCC] dark:border-[#333E2F] flex items-center justify-between text-xs gap-2 bg-[#FAF7F2] dark:bg-[#1E231B]">
                <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                  <span className="text-[10px] uppercase font-bold text-stone-400">Tỉ lệ:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('free')}
                    className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                      aspectRatio === 'free'
                        ? "bg-[#7D8B6E] text-white"
                        : "bg-black/5 dark:bg-white/5 hover:bg-black/10 text-stone-600 dark:text-stone-300"
                    )}
                  >
                    Tự do
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('1:1')}
                    className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer",
                      aspectRatio === '1:1'
                        ? "bg-[#7D8B6E] text-white"
                        : "bg-black/5 dark:bg-white/5 hover:bg-black/10 text-stone-600 dark:text-stone-300"
                    )}
                  >
                    <Square size={10} />
                    <span>1:1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('4:3')}
                    className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer",
                      aspectRatio === '4:3'
                        ? "bg-[#7D8B6E] text-white"
                        : "bg-black/5 dark:bg-white/5 hover:bg-black/10 text-stone-600 dark:text-stone-300"
                    )}
                  >
                    <RectangleHorizontal size={10} />
                    <span>4:3</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('3:4')}
                    className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer",
                      aspectRatio === '3:4'
                        ? "bg-[#7D8B6E] text-white"
                        : "bg-black/5 dark:bg-white/5 hover:bg-black/10 text-stone-600 dark:text-stone-300"
                    )}
                  >
                    <RectangleVertical size={10} />
                    <span>3:4</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={initCrop}
                  className="px-2 py-1 text-[10px] font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Đặt lại khung cắt toàn bộ ảnh"
                >
                  <RotateCcw size={11} />
                  <span>Đặt lại</span>
                </button>
              </div>

              {/* Modal Footer Actions */}
              <div className="px-5 py-3 border-t border-[#E6DDCC] dark:border-[#333E2F] flex items-center justify-end gap-2 bg-[#F6F1E8]/50 dark:bg-[#191E16]/50">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-black/5 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSaveCrop}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#DE8C5A] to-[#CF7E4C] hover:from-[#D4814E] hover:to-[#BE6E3D] text-white text-xs font-bold flex items-center gap-1 shadow-sm hover:shadow-md cursor-pointer active:scale-95 transition-all"
                >
                  <Check size={14} />
                  <span>Cắt & Lưu ảnh</span>
                </button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
