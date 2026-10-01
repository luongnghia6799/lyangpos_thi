import React, { useRef, useEffect } from 'react';
import { motion as m } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import Portal from '@/components/widgets/Portal';

/**
 * QuickProductCreateModal (F6 shortcut) for adding custom/external non-inventory items
 */
const QuickProductCreateModal = React.memo(function QuickProductCreateModal({
  isOpen = false,
  onClose,
  initialName = '',
  initialPrice = '',
  onConfirm
}) {
  const nameInputRef = useRef(null);
  const priceInputRef = useRef(null);
  const [name, setName] = React.useState(initialName);
  const [price, setPrice] = React.useState(initialPrice);

  useEffect(() => {
    if (isOpen) {
      setName(initialName || '');
      setPrice(initialPrice || '');
      setTimeout(() => nameInputRef.current?.focus(), 80);
    }
  }, [isOpen, initialName, initialPrice]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const numPrice = parseFloat(price.toString().replace(/,/g, '')) || 0;
    onConfirm(name, numPrice);
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[500000] flex items-center justify-center p-4 bg-slate-950/40 dark:bg-black/60 overflow-y-auto">
        <m.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="bg-[#faf8f3]/95 dark:bg-[#0f172a]/95 backdrop-blur-2xl w-full max-w-md rounded-2xl border border-[#8b6f47]/30 dark:border-white/15 shadow-2xl flex flex-col relative z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 flex items-center justify-between border-b border-[#8b6f47]/15 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2d5016]/10 dark:bg-[#d4a574]/15 rounded-xl flex items-center justify-center border border-[#8b6f47]/20 text-[#2d5016] dark:text-[#d4a574]">
                <Plus size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-[#2d5016] dark:text-[#d4a574] uppercase tracking-wide leading-tight">
                  Thêm món ngoài
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                  Phím tắt F6
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-transparent hover:bg-rose-500/15 text-slate-400 hover:text-rose-500 transition-colors"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* Form */}
          <div className="p-5 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider ml-1">
                Tên món / Nội dung
              </label>
              <input
                ref={nameInputRef}
                type="text"
                className="w-full h-12 px-4 bg-white/70 dark:bg-slate-900/70 border border-[#8b6f47]/25 dark:border-white/10 focus:border-[#2d5016] dark:focus:border-[#d4a574] rounded-xl font-bold text-foreground outline-none transition-all placeholder:text-muted-foreground uppercase shadow-inner"
                placeholder="GÕ TÊN MÓN..."
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    priceInputRef.current?.focus();
                  }
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider ml-1">
                Giá tiền
              </label>
              <input
                ref={priceInputRef}
                type="text"
                className="w-full h-12 px-4 bg-white/70 dark:bg-slate-900/70 border border-[#8b6f47]/25 dark:border-white/10 focus:border-[#2d5016] dark:focus:border-[#d4a574] rounded-xl font-black text-xl text-[#2d5016] dark:text-[#d4a574] outline-none transition-all shadow-inner"
                placeholder="0"
                value={price ? parseFloat(price.toString().replace(/,/g, '')).toLocaleString("en-US") : ""}
                onChange={e => {
                  const raw = e.target.value.replace(/,/g, "");
                  if (/^\d*$/.test(raw)) {
                    setPrice(raw);
                  }
                }}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="p-5 border-t border-[#8b6f47]/15 dark:border-white/10 flex flex-col items-center">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full py-3.5 bg-[#2d5016] hover:bg-[#3d6820] text-white rounded-xl font-black uppercase text-xs tracking-wider transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-md shadow-[#2d5016]/20 cursor-pointer"
            >
              <Plus size={18} /> THÊM VÀO GIỎ (ENTER)
            </button>
          </div>
        </m.div>
      </div>
    </Portal>
  );
});

export default QuickProductCreateModal;
