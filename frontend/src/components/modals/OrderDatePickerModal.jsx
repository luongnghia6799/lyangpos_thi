import React, { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Calendar, X, RotateCcw, Check } from 'lucide-react';
import Portal from '../widgets/Portal';
import CustomDatePicker from '../forms/CustomDatePicker';

export default function OrderDatePickerModal({
  isOpen,
  initialDate = '',
  onClose,
  onConfirm
}) {
  const [selectedDate, setSelectedDate] = useState('');

  // Synchronize internal draft date when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDate(initialDate || '');
    }
  }, [isOpen, initialDate]);

  const handleResetToday = () => {
    setSelectedDate('');
    onConfirm?.('');
    onClose?.();
  };

  const handleConfirm = () => {
    onConfirm?.(selectedDate);
    onClose?.();
  };

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 select-none">
            {/* Backdrop with smooth fade in/out */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transform-gpu will-change-transform"
            />

            {/* Modal Dialog with smooth hardware-accelerated zoom & fade */}
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-sm bg-[#faf8f3] dark:bg-[#121614] rounded-3xl shadow-2xl border border-[#8b6f47]/30 dark:border-white/10 flex flex-col overflow-hidden transform-gpu will-change-transform"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-[#2d5016]/10 via-[#2d5016]/5 to-transparent dark:from-emerald-950/40 border-b border-[#8b6f47]/15 dark:border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#2d5016] dark:bg-emerald-600 text-white flex items-center justify-center shadow-md">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#2d5016] dark:text-emerald-400 uppercase tracking-wide">
                      Chọn Ngày Hóa Đơn
                    </h3>
                    <p className="text-[11px] font-bold text-[#8b6f47] dark:text-[#d4a574]/80">
                      Đổi ngày tạo hoặc cập nhật hóa đơn
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-[#8b6f47]/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-[#2d5016] dark:text-emerald-400">
                    Ngày Giao Dịch
                  </label>
                  <CustomDatePicker
                    value={selectedDate}
                    onChange={(val) => {
                      const finalVal = val?.target ? val.target.value : val;
                      setSelectedDate(finalVal || '');
                    }}
                    placeholder="Hôm nay (mặc định)..."
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="p-4 bg-black/5 dark:bg-white/5 border-t border-[#8b6f47]/15 dark:border-white/10 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={handleResetToday}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 hover:bg-[#8b6f47]/10 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={14} />
                  Đặt lại hôm nay
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white hover:bg-[#8b6f47]/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="px-4 py-2 bg-[#2d5016] dark:bg-emerald-600 hover:bg-[#3d6b20] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check size={14} />
                    Xác nhận
                  </button>
                </div>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
