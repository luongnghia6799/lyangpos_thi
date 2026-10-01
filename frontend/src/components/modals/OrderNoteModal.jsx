import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion as m, AnimatePresence } from 'framer-motion';
import { Leaf, X, Trash2, Check } from 'lucide-react';

/**
 * Isolated OrderNoteModal with local state & smooth exit animation
 */
const OrderNoteModal = React.memo(function OrderNoteModal({
  isOpen,
  initialNote = '',
  partnerName = '',
  title = 'Ghi chú đơn hàng',
  subtitle = '',
  placeholder = 'Nhập ghi chú chi tiết cho đơn hàng tại đây...\n(Ví dụ: Giao hàng buổi chiều, bọc hàng cẩn thận, chiết khấu đặc biệt...)',
  onClose,
  onSave
}) {
  const [localNote, setLocalNote] = useState(initialNote);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setLocalNote(initialNote || '');
    }
  }, [isOpen, initialNote]);

  const handleClose = () => {
    onSave?.(localNote);
    onClose?.();
  };

  const handleClear = () => {
    setLocalNote('');
    onSave?.('');
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <m.div 
          key="order-note-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeInOut" }}
          className="fixed inset-0 z-[300000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 select-none font-sans"
          onClick={handleClose}
        >
          <m.div
            key="order-note-modal-card"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={{ scale: 1, opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ 
              scale: 0.9, 
              opacity: 0, 
              y: 16, 
              filter: "blur(6px)",
              transition: { duration: 0.18, ease: [0.32, 0, 0.67, 0] }
            }}
            transition={{ 
              type: 'spring', 
              stiffness: 380, 
              damping: 26,
              mass: 0.8
            }}
            className="bg-[#fcfbf9]/95 dark:bg-[#1a1612]/95 backdrop-blur-2xl w-full max-w-lg rounded-[2rem] border border-[#8b6f47]/30 dark:border-white/15 shadow-2xl overflow-hidden p-6 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#8b6f47]/15 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Leaf size={18} />
                </div>
                <div>
                  <h3 className="font-black text-base uppercase tracking-tight text-[#2d5016] dark:text-emerald-300">
                    {title}
                  </h3>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {subtitle || (partnerName ? `Áp dụng cho đơn của: ${partnerName}` : "Ghi chú sẽ được in lên hoá đơn")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 hover:bg-rose-500/15 text-slate-400 hover:text-rose-500 rounded-xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                autoFocus
                rows={5}
                value={localNote}
                onChange={(e) => setLocalNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    handleClose();
                  } else if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    handleClose();
                  }
                }}
                placeholder={placeholder}
                className="w-full p-4 bg-white/70 dark:bg-slate-900/70 border border-[#8b6f47]/25 dark:border-white/10 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:italic focus:border-[#8b6f47]/60 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-[#8b6f47]/10 transition-all resize-none leading-relaxed custom-scrollbar shadow-inner"
              />
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between pt-1">
              {localNote ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={14} />
                  Xóa ghi chú
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  Đóng (Esc)
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2 text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 rounded-xl shadow-md hover:shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={14} strokeWidth={3} />
                  Xong
                </button>
              </div>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body
  );
});

export default OrderNoteModal;
