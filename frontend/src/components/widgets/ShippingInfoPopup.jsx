import React, { useState, useEffect } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { Truck, X, Phone } from 'lucide-react';

const ShippingInfoPopup = React.memo(function ShippingInfoPopup({
  isOpen,
  initialAddress = '',
  initialPhone = '',
  onClose,
  onSave
}) {
  const [address, setAddress] = useState(initialAddress);
  const [phone, setPhone] = useState(initialPhone);

  useEffect(() => {
    if (isOpen) {
      setAddress(initialAddress || '');
      setPhone(initialPhone || '');
    }
  }, [isOpen, initialAddress, initialPhone]);

  const handleClose = (e) => {
    e?.stopPropagation?.();
    onSave?.({ address, phone });
    onClose?.();
  };

  const handleBlur = () => {
    onSave?.({ address, phone });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          key="shipping-info-popup"
          initial={{
            opacity: 0,
            scale: 0.85,
            x: -8,
            y: 16,
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
            scale: 0.85,
            x: -8,
            y: 16,
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
          className="absolute bottom-full left-0 mb-3 w-[320px] bg-[#fbf9f4] dark:bg-[#1c1916] backdrop-blur-2xl p-5 rounded-3xl border-2 border-[#8b6f47]/40 dark:border-[#d4a574]/40 shadow-2xl z-[100]"
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-[#2d5016] dark:text-emerald-400" />
              <div className="text-[10px] font-black text-[#2d5016] dark:text-emerald-400 uppercase tracking-widest">
                Thông tin giao hàng
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
            >
              <X size={14} strokeWidth={3} />
            </button>
          </div>
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
});

export default ShippingInfoPopup;
