import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion as m, AnimatePresence } from 'framer-motion';
import { RotateCcw, Trash2, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { playPopSound } from '../../lib/mascots';
import { 
  getStoredButtonMascots, 
  setButtonMascot, 
  removeButtonMascot, 
  findButtonBySignature,
  getMascotImageInfo,
  DEFAULT_BUTTON_MASCOT_CONFIG
} from '../../lib/buttonMascots';

/**
 * Mascot từng nút bấm (Được gắn cố định vào nút tương ứng)
 */
const SingleButtonMascot = memo(({ 
  mascotKey, 
  config, 
  buttonEl, 
  isEditing, 
  onStartEdit, 
  onStopEdit,
  onChangeConfig,
  onRemove
}) => {
  const mascotRef = useRef(null);
  const tooltipRef = useRef(null);
  const [coords, setCoords] = useState(null);

  const charInfo = getMascotImageInfo(config.characterId);
  const size = config.size || DEFAULT_BUTTON_MASCOT_CONFIG.size;
  const topOffset = config.top ?? DEFAULT_BUTTON_MASCOT_CONFIG.top;
  const rightOffset = config.right ?? DEFAULT_BUTTON_MASCOT_CONFIG.right;

  // Tính toán tọa độ chính xác neo vào nút bấm
  const updatePosition = useCallback(() => {
    if (!buttonEl || !document.body.contains(buttonEl)) {
      setCoords(null);
      return;
    }

    const rect = buttonEl.getBoundingClientRect();
    // Kiểm tra xem nút có đang hiển thị trên viewport không
    const isVisible = (
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom >= -50 &&
      rect.top <= window.innerHeight + 50 &&
      rect.right >= -50 &&
      rect.left <= window.innerWidth + 50
    );

    if (!isVisible) {
      setCoords(null);
      return;
    }

    // Mascot ngồi ở góc trên bên phải của nút (tương tự như pill trên sidebar)
    const mascotTop = Math.round(rect.top + topOffset);
    const mascotLeft = Math.round(rect.right - rightOffset - size);

    setCoords({
      top: mascotTop,
      left: mascotLeft,
      btnRect: rect
    });
  }, [buttonEl, topOffset, rightOffset, size]);

  useEffect(() => {
    updatePosition();
    const handleScrollOrResize = () => {
      requestAnimationFrame(updatePosition);
    };

    window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [updatePosition]);

  // Cuộn chuột để phóng to / thu nhỏ kích thước khi đang ở chế độ Edit
  useEffect(() => {
    if (!isEditing || !mascotRef.current) return;
    const el = mascotRef.current;

    const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY < 0 ? 2 : -2;
      const newSize = Math.max(18, Math.min(110, size + delta));
      if (newSize !== size) {
        onChangeConfig(mascotKey, { size: newSize }, true);
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [isEditing, size, mascotKey, onChangeConfig]);

  // Kéo chuột để dời vị trí
  const handleMouseDown = (e) => {
    if (!isEditing) return;
    if (e.button !== 0) return; // Chỉ chuột trái
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startTop = topOffset;
    const startRight = rightOffset;

    let rafId = null;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const newTop = Math.round(startTop + deltaY);
      const newRight = Math.round(startRight - deltaX);

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        onChangeConfig(mascotKey, { top: newTop, right: newRight });
      });
    };

    const handleMouseUp = (upEvent) => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      const deltaX = upEvent.clientX - startX;
      const deltaY = upEvent.clientY - startY;
      const finalTop = Math.round(startTop + deltaY);
      const finalRight = Math.round(startRight - deltaX);

      onChangeConfig(mascotKey, { top: finalTop, right: finalRight }, true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Click chuột phải vào Mascot để bật/tắt chế độ Edit
  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isEditing) {
      onStopEdit();
    } else {
      onStartEdit(mascotKey);
    }
  };

  // Click chuột trái vào Mascot để phát tiếng pop vui tai
  const handleClick = (e) => {
    if (isEditing) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
    playPopSound();
  };

  // Đóng chế độ Edit khi click ra ngoài hoặc bấm ESC
  useEffect(() => {
    if (!isEditing) return;
    const handleOutside = (e) => {
      if (
        mascotRef.current && !mascotRef.current.contains(e.target) &&
        tooltipRef.current && !tooltipRef.current.contains(e.target)
      ) {
        onStopEdit();
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') onStopEdit();
    };

    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleOutside);
      window.addEventListener('keydown', handleKey);
    }, 100);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [isEditing, onStopEdit]);

  // Tính toán vị trí thông minh cho Tooltip để không bao giờ đè lên Mascot (kể cả khi ở sát góc màn hình)
  const tooltipPos = useMemo(() => {
    if (!coords) return null;

    const tooltipW = 280;
    const tooltipH = 135;
    const gap = 14;

    const screenW = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const screenH = typeof window !== 'undefined' ? window.innerHeight : 1080;

    const mascotLeft = coords.left;
    const mascotTop = coords.top;
    const mascotRight = mascotLeft + size;
    const mascotBottom = mascotTop + size;

    let targetLeft;
    let targetTop = mascotTop - 8;

    // 1. Nếu bên phải còn đủ chỗ (không bị tràn mép phải): đặt sang bên phải mascot
    if (screenW - mascotRight >= tooltipW + gap) {
      targetLeft = mascotRight + gap;
    } 
    // 2. Nếu ở góc phải màn hình: đặt sang bên trái của mascot để không bao giờ đè lên mascot
    else if (mascotLeft >= tooltipW + gap) {
      targetLeft = mascotLeft - tooltipW - gap;
    } 
    // 3. Nếu cả 2 bên hẹp: đặt bên dưới hoặc bên trên mascot
    else {
      targetLeft = Math.max(12, Math.min(screenW - tooltipW - 12, mascotLeft + (size / 2) - (tooltipW / 2)));
      if (screenH - mascotBottom >= tooltipH + gap) {
        targetTop = mascotBottom + gap;
      } else {
        targetTop = Math.max(12, mascotTop - tooltipH - gap);
      }
    }

    // Đảm bảo không bị tràn mép trên hoặc dưới màn hình
    targetTop = Math.max(12, Math.min(screenH - tooltipH - 12, targetTop));

    return { top: targetTop, left: targetLeft };
  }, [coords, size]);

  if (!coords) return null;

  return (
    <>
      <m.div
        ref={mascotRef}
        initial={{ opacity: 0, scale: 0.7, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.6 }}
        whileHover={!isEditing ? { scale: 1.15, rotate: 3, transition: { duration: 0.18 } } : {}}
        transition={{ type: "spring", stiffness: 420, damping: 26 }}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        style={{
          position: 'fixed',
          top: `${coords.top}px`,
          left: `${coords.left}px`,
          width: `${size}px`,
          height: `${size}px`,
          zIndex: 99998
        }}
        className={cn(
          "select-none flex items-end pointer-events-auto transition-shadow",
          isEditing
            ? "cursor-grab active:cursor-grabbing ring-2 ring-emerald-400 ring-offset-2 ring-offset-black/30 rounded-2xl shadow-xl shadow-emerald-500/25"
            : "cursor-pointer group/btn-mascot"
        )}
        title={isEditing ? "Kéo để dời vị trí | Cuộn chuột để đổi kích thước" : "Click chuột phải để chỉnh sửa vị trí/kích thước"}
      >
        {charInfo.isSprite ? (
          <div
            className="w-full h-full pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
            style={{
              backgroundImage: `url("${charInfo.url}")`,
              backgroundPosition: '50% 50%',
              backgroundSize: '300% 300%',
              backgroundRepeat: 'no-repeat'
            }}
          />
        ) : (
          <img
            src={charInfo.url}
            alt="Mascot"
            className="w-full h-full object-contain pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.22)]"
            draggable="false"
          />
        )}
      </m.div>

      {/* Tooltip chỉnh sửa khi đang ở chế độ Edit */}
      {isEditing && tooltipPos && (
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            top: `${tooltipPos.top}px`,
            left: `${tooltipPos.left}px`,
            zIndex: 999999
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto bg-[#faf8f3] dark:bg-[#1a1e17] text-stone-800 dark:text-stone-100 text-[11px] font-bold p-3.5 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.25)] border-2 border-[#8b6f47]/30 dark:border-[#d4a574]/30 whitespace-nowrap backdrop-blur-xl flex flex-col gap-2.5 select-none animate-in fade-in zoom-in-95"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-4 text-[#2d5016] dark:text-emerald-400 font-black">
            <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2d5016] dark:bg-emerald-400" />
              CHỈNH SỬA MASCOT
            </span>
            <span className="text-[10px] bg-[#2d5016]/10 dark:bg-white/10 px-2 py-0.5 rounded-full text-[#2d5016] dark:text-[#d4a574] font-mono border border-[#2d5016]/20 dark:border-white/10">
              {size}px
            </span>
          </div>

          {/* Description */}
          <div className="text-[10px] text-stone-600 dark:text-stone-300 font-medium leading-relaxed bg-[#f4efe4]/80 dark:bg-white/[0.04] p-2 rounded-xl border border-[#8b6f47]/15 dark:border-white/5 flex flex-col gap-0.5">
            <div>• 🖱️ <b>Kéo chuột:</b> Dời vị trí (<span className="font-mono font-bold text-stone-800 dark:text-stone-100">Top: {topOffset}px, Right: {rightOffset}px</span>)</div>
            <div>• 🔄 <b>Cuộn chuột:</b> Phóng to / Thu nhỏ size</div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#8b6f47]/20 dark:border-white/10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playPopSound();
                onChangeConfig(mascotKey, {
                  top: DEFAULT_BUTTON_MASCOT_CONFIG.top,
                  right: DEFAULT_BUTTON_MASCOT_CONFIG.right,
                  size: DEFAULT_BUTTON_MASCOT_CONFIG.size
                }, true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-[#8b6f47]/10 hover:bg-[#8b6f47]/20 text-[#8b6f47] dark:bg-white/10 dark:hover:bg-white/15 dark:text-[#d4a574] text-[10px] font-bold transition-all border border-[#8b6f47]/25 dark:border-white/10 cursor-pointer active:scale-95 flex items-center gap-1"
            >
              <RotateCcw size={12} />
              Đặt lại
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playPopSound();
                onRemove(mascotKey);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold transition-all border border-rose-500/25 cursor-pointer active:scale-95 flex items-center gap-1"
            >
              <Trash2 size={12} />
              Gỡ bỏ
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playPopSound();
                onStopEdit();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#2d5016] to-[#3d6b20] hover:from-[#234011] hover:to-[#2d5016] dark:from-emerald-700 dark:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-[#2d5016]/20 transition-all border border-[#2d5016]/40 cursor-pointer active:scale-95 flex items-center gap-1"
            >
              <Check size={12} />
              Xong
            </button>
          </div>
        </div>
      )}
    </>
  );
});

/**
 * Overlay tổng quản lý các Mascot của tất cả các nút
 */
export default function ButtonMascotOverlay() {
  const [mascots, setMascots] = useState(() => getStoredButtonMascots());
  const [editingKey, setEditingKey] = useState(null);
  const [, setTick] = useState(0);

  // Đồng bộ danh sách Mascot từ localStorage & sự kiện CustomEvent
  useEffect(() => {
    const handleSync = (e) => {
      if (e?.detail) {
        setMascots(e.detail);
      } else {
        setMascots(getStoredButtonMascots());
      }
    };

    const handleStorage = (e) => {
      if (e.key === 'pos_button_mascots') {
        try {
          setMascots(JSON.parse(e.newValue || '{}'));
        } catch (err) {}
      }
    };

    const handleActivateEdit = (e) => {
      if (e?.detail?.signature) {
        setEditingKey(e.detail.signature);
      }
    };

    window.addEventListener('pos_button_mascots_updated', handleSync);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('activate_button_mascot_edit_mode', handleActivateEdit);

    let chan;
    try {
      chan = new BroadcastChannel('pos_button_mascots_sync');
      chan.addEventListener('message', (msg) => {
        if (msg.data?.type === 'BUTTON_MASCOTS_UPDATED') {
          setMascots(msg.data.value || {});
        }
      });
    } catch (err) {}

    return () => {
      window.removeEventListener('pos_button_mascots_updated', handleSync);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('activate_button_mascot_edit_mode', handleActivateEdit);
      if (chan) chan.close();
    };
  }, []);

  // Lắng nghe thay đổi DOM (khi chuyển tab, mở modal hoặc tải nội dung mới) để re-bind các button
  useEffect(() => {
    let timeoutId = null;
    const observer = new MutationObserver(() => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setTick((t) => t + 1);
      }, 120);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleChangeConfig = useCallback((key, patch, saveToStorage = false) => {
    setMascots((prev) => {
      const cur = prev[key] || {};
      const updated = {
        ...prev,
        [key]: { ...cur, ...patch }
      };
      if (saveToStorage) {
        setButtonMascot(key, { ...cur, ...patch });
      }
      return updated;
    });
  }, []);

  const handleRemove = useCallback((key) => {
    removeButtonMascot(key);
    setMascots((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    setEditingKey(null);
  }, []);

  const mascotEntries = Object.entries(mascots);
  if (mascotEntries.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[99997] no-print">
      {mascotEntries.map(([key, config]) => {
        if (config.visible === false) return null;
        const buttonEl = findButtonBySignature(key);
        if (!buttonEl) return null;

        return (
          <SingleButtonMascot
            key={key}
            mascotKey={key}
            config={config}
            buttonEl={buttonEl}
            isEditing={editingKey === key}
            onStartEdit={(k) => setEditingKey(k)}
            onStopEdit={() => setEditingKey(null)}
            onChangeConfig={handleChangeConfig}
            onRemove={handleRemove}
          />
        );
      })}
    </div>,
    document.body
  );
}
