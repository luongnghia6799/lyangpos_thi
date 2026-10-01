import React, { useState, useEffect } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const OrderNotePopup = React.memo(function OrderNotePopup({
  isOpen,
  initialNote = '',
  onClose,
  onSave
}) {
  const [localNote, setLocalNote] = useState(initialNote);

  useEffect(() => {
    if (isOpen) {
      setLocalNote(initialNote || '');
    }
  }, [isOpen, initialNote]);

  const handleClose = (e) => {
    e?.stopPropagation?.();
    onSave?.(localNote);
    onClose?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          key="order-note-popup"
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
          className="absolute bottom-full left-0 mb-3 w-[280px] bg-[#fbf9f4] dark:bg-[#1c1916] backdrop-blur-2xl p-4 rounded-3xl border-2 border-[#8b6f47]/40 dark:border-[#d4a574]/40 shadow-2xl z-[100]"
        >
          <div className="flex justify-between items-center mb-2">
            <div className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-widest">
              Ghi chú đơn
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X size={14} strokeWidth={3} />
            </button>
          </div>
          <textarea
            autoFocus
            placeholder="Nhập ghi chú cho hóa đơn này..."
            rows={3}
            value={localNote}
            onChange={(e) => setLocalNote(e.target.value)}
            onBlur={() => onSave?.(localNote)}
            className="w-full px-4 py-3 bg-white/80 dark:bg-slate-900/60 border border-[#8b6f47]/25 dark:border-white/10 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#8b6f47]/30 transition-all resize-none shadow-none custom-scrollbar text-slate-800 dark:text-white placeholder:text-slate-400"
          />
        </m.div>
      )}
    </AnimatePresence>
  );
});

export default OrderNotePopup;
