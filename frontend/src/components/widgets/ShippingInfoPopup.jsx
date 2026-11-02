import React, { useState, useEffect, useRef } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { Truck, X, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

const ShippingInfoPopup = React.memo(function ShippingInfoPopup({
  isOpen,
  initialAddress = '',
  initialPhone = '',
  hasFertilizer = false,
  fertilizerCount = 1,
  onOpenDeliveryReminder,
  onClose,
  onSave,
  onDisableShipping,
  placement = 'bottom',
  className = ''
}) {
  const [address, setAddress] = useState(initialAddress);
  const [phone, setPhone] = useState(initialPhone);
  const popupRef = useRef(null);
  const prevOpenRef = useRef(false);

  // Sync ref values to avoid tearing/re-attaching listeners on every keystroke
  const valuesRef = useRef({ address, phone });
  valuesRef.current = { address, phone };

  const callbacksRef = useRef({ onSave, onClose, onOpenDeliveryReminder, onDisableShipping });
  callbacksRef.current = { onSave, onClose, onOpenDeliveryReminder, onDisableShipping };

  // Only sync when popup opens (transition from closed to open)
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setAddress(initialAddress || '');
      setPhone(initialPhone || '');
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, initialAddress, initialPhone]);

  const handleClose = (e) => {
    e?.stopPropagation?.();
    callbacksRef.current.onSave?.(valuesRef.current);
    callbacksRef.current.onClose?.();
  };

  const handleBlur = () => {
    callbacksRef.current.onSave?.(valuesRef.current);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      // Don't close if clicked inside the popup
      if (popupRef.current && popupRef.current.contains(e.target)) {
        return;
      }
      // Don't close if clicked on the toggle trigger button (avoids immediate re-toggle)
      if (e.target && e.target.closest && e.target.closest('[data-shipping-trigger="true"]')) {
        return;
      }
      callbacksRef.current.onSave?.(valuesRef.current);
      callbacksRef.current.onClose?.();
    };

    // Use bubbling phase instead of capture to play nice with other handlers
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const isTop = placement === 'top';

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          key="shipping-info-popup"
          ref={popupRef}
          initial={{
            opacity: 0,
            scale: 0.9,
            x: isTop ? 0 : -8,
            y: isTop ? -10 : 16,
            filter: "blur(6px)"
          }}
          animate={{
            opacity: 1,
            scale: 1,
            x: 0,
            y: 0,
            filter: "blur(0px)"
          }}
          exit={{
            opacity: 0,
            scale: 0.9,
            x: isTop ? 0 : -8,
            y: isTop ? -10 : 16,
            filter: "blur(6px)",
            transition: {
              duration: 0.16,
              ease: "easeOut"
            }
          }}
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 26
          }}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "w-[330px] bg-[#fbf9f4] dark:bg-[#1c1916] backdrop-blur-2xl p-5 rounded-3xl border-2 border-[#8b6f47]/40 dark:border-[#d4a574]/40 shadow-2xl z-[3500]",
            isTop ? "absolute right-0 top-full mt-2" : "absolute bottom-full left-0 mb-3",
            className
          )}
        >
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-[#2d5016] dark:text-emerald-400" />
              <div className="text-[10px] font-black text-[#2d5016] dark:text-emerald-400 uppercase tracking-widest">
                Thông tin giao hàng
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onDisableShipping && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    callbacksRef.current.onDisableShipping?.();
                  }}
                  className="text-[9px] font-black text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
                  title="Tắt chế độ giao hàng"
                >
                  Tắt giao hàng
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <X size={14} strokeWidth={3} />
              </button>
            </div>
          </div>

          {hasFertilizer && (
            <div className="mb-3.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  callbacksRef.current.onSave?.(valuesRef.current);
                  callbacksRef.current.onOpenDeliveryReminder?.();
                  callbacksRef.current.onClose?.();
                }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-[#2d5016] to-[#1d380e] hover:brightness-110 active:scale-[0.98] text-white shadow-md border border-emerald-400/40 cursor-pointer transition-all duration-150 group"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0 shadow-xs" />
                  <Truck size={13} strokeWidth={2.6} className="shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-wider truncate">
                    Tạo Nhắc Chở Phân ({fertilizerCount})
                  </span>
                </div>
                <span className="text-[8px] font-black uppercase tracking-tight bg-white/20 px-1.5 py-0.5 rounded-md shrink-0">
                  Mở nhắc ➔
                </span>
              </button>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 ml-1">
                Địa chỉ giao hàng
              </label>
              <textarea
                placeholder="Nhập địa chỉ nhận hàng..."
                rows={2}
                className="w-full px-4 py-3 bg-white/80 dark:bg-slate-900/60 border border-[#8b6f47]/25 dark:border-white/10 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#2d5016]/20 transition-all resize-none text-slate-800 dark:text-white placeholder:text-slate-400"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onBlur={handleBlur}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 ml-1">
                Số điện thoại nhận
              </label>
              <div className="relative">
                <Phone size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="SĐT người nhận..."
                  className="w-full h-10 pl-9 pr-4 bg-white/80 dark:bg-slate-900/60 border border-[#8b6f47]/25 dark:border-white/10 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#2d5016]/20 transition-all text-slate-800 dark:text-white placeholder:text-slate-400"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={handleBlur}
                />
              </div>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}, (prevProps, nextProps) => {
  // If both closed, skip re-render
  if (!prevProps.isOpen && !nextProps.isOpen) {
    return true;
  }
  // If open state changed, must re-render
  if (prevProps.isOpen !== nextProps.isOpen) {
    return false;
  }
  // If fertilizer state or count changed while open, re-render
  if (prevProps.hasFertilizer !== nextProps.hasFertilizer) return false;
  if (prevProps.fertilizerCount !== nextProps.fertilizerCount) return false;
  if (prevProps.placement !== nextProps.placement) return false;
  if (prevProps.className !== nextProps.className) return false;

  // While staying open, protect from unnecessary parent re-renders
  return true;
});

export default ShippingInfoPopup;
