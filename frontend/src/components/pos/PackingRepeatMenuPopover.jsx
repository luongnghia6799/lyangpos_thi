import React from 'react';
import { motion as m } from 'framer-motion';
import { RotateCcw, X, VolumeX, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import Portal from '@/components/widgets/Portal';

/**
 * Popover chọn số lần lặp đọc soạn hàng
 */
export default function PackingRepeatMenuPopover({
  isOpen,
  onClose,
  position = { x: 100, y: 100 },
  isPackingSpeaking = false,
  packingSpeakingLoop = { current: 1, total: 1 },
  packingRepeatCount = 1,
  onSelectRepeat
}) {
  if (!isOpen) return null;

  const options = [
    { value: 1, label: "Đọc 1 lần", desc: "Mặc định, đọc hết danh sách rồi dừng", badge: "1x" },
    { value: 2, label: "Lặp lại 2 lần", desc: "Đọc lại danh sách 2 lượt liên tiếp", badge: "2x" },
    { value: 3, label: "Lặp lại 3 lần", desc: "Đọc lại danh sách 3 lượt liên tiếp", badge: "3x" },
    { value: 5, label: "Lặp lại 5 lần", desc: "Đọc lại danh sách 5 lượt liên tiếp", badge: "5x" },
    { value: Infinity, label: "Lặp liên tục", desc: "Phát vòng lặp vô hạn cho tới khi bấm dừng", badge: "∞" },
  ];

  const left = typeof window !== "undefined" 
    ? Math.max(12, Math.min(window.innerWidth - 300, position.x - 20)) 
    : 100;
  const top = typeof window !== "undefined" 
    ? Math.max(12, Math.min(window.innerHeight - 380, position.y)) 
    : 100;

  return (
    <Portal>
      <div 
        className="fixed inset-0 z-[99999] bg-black/25 backdrop-blur-[1px] select-none no-print"
        onClick={onClose}
        onContextMenu={e => { e.preventDefault(); onClose(); }}
      >
        <m.div
          initial={{ opacity: 0, scale: 0.92, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: -4 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            position: "fixed",
            left,
            top,
          }}
          className="w-[280px] bg-white/95 dark:bg-[#1a1c23]/95 backdrop-blur-xl border border-amber-500/25 dark:border-white/15 rounded-2xl shadow-2xl p-2.5 overflow-hidden ring-1 ring-black/5"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-2 py-1.5 mb-1.5 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <RotateCcw size={15} strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-[12px] font-black tracking-tight text-slate-800 dark:text-slate-100">
                  Lặp Đọc Soạn Hàng
                </div>
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-400">
                  {isPackingSpeaking 
                    ? `Đang đọc lượt ${packingSpeakingLoop?.current || 1}/${(packingSpeakingLoop?.total === Infinity || packingSpeakingLoop?.total === 'Infinity') ? '∞' : (packingSpeakingLoop?.total || 1)}` 
                    : "Chọn số lần phát lại danh sách"}
                </div>
              </div>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {/* Options */}
          <div className="space-y-1">
            {options.map((opt) => {
              const isSelected = packingRepeatCount === opt.value || (opt.value === Infinity && (packingRepeatCount === Infinity || packingRepeatCount === 'Infinity'));
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSelectRepeat(opt.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all duration-150 group cursor-pointer",
                    isSelected
                      ? "bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30"
                      : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={cn(
                      "w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 border",
                      isSelected
                        ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                        : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 group-hover:border-amber-500/40"
                    )}>
                      {opt.badge}
                    </span>
                    <div className="truncate">
                      <div className="text-[12px] leading-tight font-black">{opt.label}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-400 font-normal truncate">{opt.desc}</div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check size={14} strokeWidth={3} className="text-amber-600 dark:text-amber-400 shrink-0 ml-1.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* If currently speaking or stop button */}
          {isPackingSpeaking && (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => onSelectRepeat("stop")}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white dark:text-red-400 dark:hover:text-white font-bold text-xs transition-all duration-150 border border-red-500/20 cursor-pointer"
              >
                <VolumeX size={14} strokeWidth={2.5} />
                <span>Dừng đọc danh sách ngay</span>
              </button>
            </div>
          )}

          {/* Footnote */}
          <div className="mt-2 px-1 text-[9.5px] text-slate-400 dark:text-slate-400 text-center font-medium">
            💡 Đè nút soạn ({'>'} 400ms) để chọn nhanh số lần đọc
          </div>
        </m.div>
      </div>
    </Portal>
  );
}
