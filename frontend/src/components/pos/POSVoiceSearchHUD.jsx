import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Mic, Sparkles, X, CornerDownLeft, Loader2 } from 'lucide-react';
import Portal from '../widgets/Portal';
import { cn } from '../../lib/utils';

export default function POSVoiceSearchHUD({
  isOpen,
  isListening,
  isProcessing = false,
  audioLevel = 0,
  interimText = '',
  parsedData = null,
  matchedProduct = null,
  error = null,
  onClose,
  onConfirmApply
}) {
  if (!isOpen) return null;

  // Multipliers for audio visualization bars
  const barWeights = [0.4, 0.7, 1.0, 1.3, 1.5, 1.4, 1.1, 0.8, 0.5];

  return (
    <Portal>
      <AnimatePresence>
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center p-4"
        >
          {/* Subtle backdrop highlight */}
          <div 
            className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-[2px] pointer-events-auto"
            onClick={onClose}
          />

          <m.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="relative pointer-events-auto w-full max-w-lg bg-white/95 dark:bg-[#1a2315]/95 border-2 border-emerald-500/40 dark:border-[#34d399]/40 rounded-3xl shadow-2xl p-5 backdrop-blur-xl overflow-hidden"
          >
            {/* Top Glowing Ambient Orb */}
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-500/20 dark:bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header: Title & Close */}
            <div className="flex items-center justify-between pb-3 border-b border-[#8b6f47]/15 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "w-9 h-9 rounded-2xl flex items-center justify-center transition-all shadow-md",
                  isProcessing
                    ? "bg-amber-500 text-slate-950 animate-spin"
                    : isListening
                    ? "bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-emerald-500/30 animate-pulse"
                    : "bg-[#8b6f47]/10 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                )}>
                  {isProcessing ? (
                    <Loader2 size={18} strokeWidth={2.5} className="animate-spin" />
                  ) : (
                    <Mic size={18} strokeWidth={2.5} />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Tìm kiếm giọng nói thông minh</span>
                    <Sparkles size={14} className="text-amber-500" />
                  </h3>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {isProcessing 
                      ? "Đang nhận diện câu nói qua AI..." 
                      : isListening 
                      ? "Đang lắng nghe... Nói tên thuốc / phân bón" 
                      : "Đã nhận diện"}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Body: Live Soundwave & Transcript */}
            <div className="py-4">
              {/* Soundwave Animation */}
              {isListening && (
                <div className="flex items-center justify-center gap-1.5 py-3 h-12">
                  {barWeights.map((weight, idx) => {
                    // Reactive height calculated from live audioLevel (0-100)
                    const dynamicHeight = Math.max(6, Math.min(42, Math.round((audioLevel / 100) * 34 * weight + 6)));
                    return (
                      <m.div
                        key={idx}
                        animate={{
                          height: dynamicHeight,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30
                        }}
                        className="w-1.5 bg-gradient-to-t from-emerald-600 to-teal-400 dark:from-emerald-400 dark:to-teal-300 rounded-full"
                      />
                    );
                  })}
                </div>
              )}

              {/* AI Processing indicator */}
              {isProcessing && (
                <div className="flex items-center justify-center gap-2 py-3 text-xs font-bold text-amber-600 dark:text-amber-400 animate-pulse">
                  <Loader2 size={15} className="animate-spin" />
                  <span>AI đang giải mã giọng nói sang tên sản phẩm...</span>
                </div>
              )}

              {/* Transcript Display Box */}
              <div className="min-h-[56px] px-4 py-3 rounded-2xl bg-[#8b6f47]/[0.06] dark:bg-white/[0.05] border border-[#8b6f47]/20 dark:border-white/10 flex items-center justify-center text-center">
                {interimText ? (
                  <p className="text-[15px] font-black text-slate-900 dark:text-emerald-300 leading-snug">
                    "{interimText}"
                  </p>
                ) : (
                  <p className="text-xs font-bold text-slate-400 italic">
                    Nói tên sản phẩm, ví dụ: "5 bao mười sáu đầu trâu" hoặc "2 chai a rô bát"...
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-3 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold text-center">
                  {error}
                </div>
              )}

              {/* Matched Product Preview Card */}
              {matchedProduct && (
                <m.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/30 dark:border-emerald-400/30 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">
                        Khớp sản phẩm
                      </span>
                      {parsedData?.qty && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                          SL: {parsedData.qty} {parsedData.uom || matchedProduct.unit || ''}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                      {matchedProduct.name}
                    </h4>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {matchedProduct.alias && <span className="text-emerald-700 dark:text-emerald-400 mr-2">Biệt danh: {matchedProduct.alias}</span>}
                      <span>ĐVT: {matchedProduct.unit}</span>
                      <span className="mx-1.5">•</span>
                      <span className="text-slate-900 dark:text-white font-mono">
                        {Number(matchedProduct.sale_price || 0).toLocaleString('vi-VN')} đ
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={() => onConfirmApply?.(matchedProduct, parsedData)}
                    className="shrink-0 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Áp dụng</span>
                    <CornerDownLeft size={13} strokeWidth={2.6} />
                  </button>
                </m.div>
              )}
            </div>

            {/* Footer Hints */}
            <div className="pt-3 border-t border-[#8b6f47]/15 dark:border-white/10 flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[9px]">F7</kbd>
                <span>Bật / Dừng mic</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[9px]">Esc</kbd>
                <span>Đóng</span>
              </span>
            </div>
          </m.div>
        </m.div>
      </AnimatePresence>
    </Portal>
  );
}
