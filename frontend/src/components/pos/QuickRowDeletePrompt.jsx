import React from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { Trash2, X } from 'lucide-react';
import Portal from '@/components/widgets/Portal';

/**
 * Prompt nhập số thứ tự dòng để xóa nhanh khỏi giỏ hàng
 */
export default function QuickRowDeletePrompt({
  isOpen,
  value,
  onChange,
  onSubmit,
  onClose
}) {
  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 right-6 z-[2000000] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border border-rose-500/20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl no-print overflow-hidden select-none"
          >
            <div className="p-2 rounded-xl text-white shadow-lg bg-rose-500 shadow-rose-500/25 shrink-0">
              <Trash2 size={20} />
            </div>

            <div className="flex flex-col min-w-[140px] max-w-[180px]">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 opacity-70">
                Hành động
              </span>
              <span className="font-bold text-xs tracking-tight text-slate-800 dark:text-white/95 leading-snug">
                Xóa dòng thứ mấy?
              </span>
            </div>

            <input
              type="text"
              autoFocus
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSubmit();
                } else if (e.key === "Escape") {
                  onClose();
                }
              }}
              placeholder="Số..."
              className="w-16 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-sm font-black text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
            />

            <button
              type="button"
              onClick={onClose}
              className="ml-2 p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
