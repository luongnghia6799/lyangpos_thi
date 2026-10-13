import React from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { Trash2, X } from 'lucide-react';
import Portal from '@/components/widgets/Portal';
import { cn } from '@/lib/utils';

/**
 * Prompt nhập số thứ tự dòng để xóa nhanh khỏi giỏ hàng
 * Thiết kế chuẩn theo phong cách Zen / Botanical / Terracotta của LyangPOS
 */
export default function QuickRowDeletePrompt({
  isOpen,
  value,
  onChange,
  onSubmit,
  onClose,
  cartColorConfig
}) {
  const accentColor = cartColorConfig?.accentColor && cartColorConfig.accentColor !== 'default' 
    ? cartColorConfig.accentColor 
    : null;

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0, y: -20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            className="fixed top-6 right-6 z-[2000000] flex items-center gap-3.5 px-5 py-3.5 rounded-2xl shadow-[0_14px_40px_rgba(45,80,22,0.18)] dark:shadow-[0_16px_45px_rgba(0,0,0,0.65)] border border-[#8b6f47]/30 dark:border-[#384334] bg-[#FAF7F2]/95 dark:bg-[#1E231B]/95 backdrop-blur-2xl no-print select-none ring-1 ring-black/5 dark:ring-white/5"
          >
            {/* Action Icon Badge */}
            <div 
              style={accentColor ? { backgroundColor: accentColor } : undefined}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DE8C5A] to-[#C85A32] text-white flex items-center justify-center shadow-md shadow-[#C85A32]/25 shrink-0 ring-1 ring-white/20"
            >
              <Trash2 size={18} strokeWidth={2.2} />
            </div>

            {/* Labels */}
            <div className="flex flex-col min-w-[130px] max-w-[170px]">
              <span className="text-[9.5px] font-black uppercase tracking-[0.25em] text-[#8b6f47] dark:text-[#d4a574] opacity-80 leading-tight mb-0.5">
                Hành động
              </span>
              <span className="font-serif font-black text-sm tracking-tight text-[#3B3224] dark:text-[#EDE8DF] leading-tight">
                Xóa dòng thứ mấy?
              </span>
            </div>

            {/* Input field */}
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
              className="w-16 px-2.5 py-1.5 bg-white dark:bg-[#252E22] border border-[#8b6f47]/30 dark:border-[#384334] rounded-xl text-center text-sm font-mono font-black text-[#3B3224] dark:text-[#EDE8DF] placeholder:text-[#8b6f47]/40 dark:placeholder:text-[#a89c8a]/40 focus:outline-none focus:border-[#7D8B6E] focus:ring-2 focus:ring-[#7D8B6E]/20 transition-all shadow-inner"
            />

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#8b6f47]/10 dark:hover:bg-white/10 transition-colors text-[#8b6f47] dark:text-[#A79D8E] hover:text-[#3B3224] dark:hover:text-white cursor-pointer active:scale-95"
              title="Đóng (Esc)"
            >
              <X size={16} />
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
