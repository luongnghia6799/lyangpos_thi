import React, { useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Mic, Sparkles, X, CornerDownLeft, Loader2, GripHorizontal } from 'lucide-react';
import Portal from '../widgets/Portal';
import { cn } from '../../lib/utils';

/**
 * POSVoiceSearchHUD - Popup tìm kiếm giọng nói thông minh dạng floating non-blocking.
 * Không che khuất hay khóa toàn bộ màn hình, cho phép thu gọn, kéo thả di chuyển.
 */
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
  const popupRef = useRef(null);

  // Multipliers for audio visualization bars
  const barWeights = [0.4, 0.7, 1.1, 1.4, 1.6, 1.3, 1.0, 0.7, 0.4];

  // Hỗ trợ phím Enter để áp dụng và Esc để đóng
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      } else if (e.key === 'Enter' && matchedProduct) {
        e.preventDefault();
        onConfirmApply?.(matchedProduct, parsedData);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, matchedProduct, parsedData, onClose, onConfirmApply]);

  if (!isOpen) return null;

  return (
    <Portal>
      <AnimatePresence>
        {/* Floating wrapper: pointer-events-none để KHÔNG chặn click chuột trên POS */}
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none select-none">
          <m.div
            ref={popupRef}
            drag
            dragMomentum={false}
            initial={{ scale: 0.9, opacity: 0, y: -16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -16 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="pointer-events-auto w-[420px] max-w-[calc(100vw-24px)] bg-white/95 dark:bg-[#182315]/95 border-2 border-emerald-500/50 dark:border-emerald-400/40 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_45px_rgba(0,0,0,0.5)] p-3.5 backdrop-blur-xl ring-1 ring-black/5 overflow-hidden"
          >
            {/* Top Glowing Ambient Orb */}
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/20 dark:bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />

            {/* Drag Handle & Header Row */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#8b6f47]/15 dark:border-white/10 cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-7 h-7 rounded-xl flex items-center justify-center transition-all shadow-sm",
                  isProcessing
                    ? "bg-amber-500 text-slate-950 animate-spin"
                    : isListening
                    ? "bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-emerald-500/30 animate-pulse"
                    : "bg-[#8b6f47]/10 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                )}>
                  {isProcessing ? (
                    <Loader2 size={15} strokeWidth={2.5} className="animate-spin" />
                  ) : (
                    <Mic size={15} strokeWidth={2.5} />
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1 leading-none">
                    <span>Tìm giọng nói</span>
                    <Sparkles size={12} className="text-amber-500" />
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 leading-none">
                    {isProcessing 
                      ? "Đang nhận diện AI..." 
                      : isListening 
                      ? "Đang nghe... Nói tên hàng" 
                      : "Đã nhận diện"}
                  </p>
                </div>
              </div>

              {/* Soundwave Animation ngay trên header row */}
              {isListening && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20 h-6">
                  {barWeights.map((weight, idx) => {
                    const dynamicHeight = Math.max(4, Math.min(18, Math.round((audioLevel / 100) * 16 * weight + 4)));
                    return (
                      <m.div
                        key={idx}
                        animate={{ height: dynamicHeight }}
                        transition={{ type: "spring", stiffness: 600, damping: 25 }}
                        className="w-1 bg-gradient-to-t from-emerald-600 to-teal-400 dark:from-emerald-400 dark:to-teal-300 rounded-full"
                      />
                    );
                  })}
                </div>
              )}

              {/* Drag indicator & Close */}
              <div className="flex items-center gap-1">
                <div className="text-slate-300 dark:text-slate-600 hover:text-slate-500 transition-colors p-1" title="Kéo để di chuyển">
                  <GripHorizontal size={14} />
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Đóng (Esc)"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Transcript Display Box */}
            <div className="px-3 py-2 rounded-xl bg-[#8b6f47]/[0.05] dark:bg-white/[0.04] border border-[#8b6f47]/15 dark:border-white/10 flex items-center justify-center text-center min-h-[42px]">
              {isProcessing ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 animate-pulse">
                  <Loader2 size={13} className="animate-spin shrink-0" />
                  <span>Đang giải mã giọng nói qua AI...</span>
                </div>
              ) : interimText ? (
                <p className="text-[13.5px] font-black text-slate-900 dark:text-emerald-300 leading-snug line-clamp-2">
                  "{interimText}"
                </p>
              ) : (
                <p className="text-[11px] font-bold text-slate-400 italic">
                  Nói: "5 bao đầu trâu", "2 chai an vin", "3 gói a rô bát"...
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-[11px] font-bold text-center">
                {error}
              </div>
            )}

            {/* Matched Product Preview Card */}
            {matchedProduct && (
              <m.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2.5 p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/12 via-teal-500/10 to-transparent border border-emerald-500/35 dark:border-emerald-400/35 flex items-center justify-between gap-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider">
                      Khớp
                    </span>
                    {parsedData?.qty && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider">
                        SL: {parsedData.qty} {parsedData.uom || matchedProduct.unit || ''}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {matchedProduct.name}
                  </h4>
                  <p className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span>ĐVT: {matchedProduct.unit}</span>
                    <span>•</span>
                    <span className="text-slate-900 dark:text-white font-mono font-black">
                      {Number(matchedProduct.sale_price || 0).toLocaleString('vi-VN')} đ
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onConfirmApply?.(matchedProduct, parsedData)}
                  className="shrink-0 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[11px] flex items-center gap-1 shadow-md shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
                  title="Nhấn Enter hoặc bấm vào đây để nạp vào giỏ hàng"
                >
                  <span>Áp dụng</span>
                  <CornerDownLeft size={11} strokeWidth={2.8} />
                </button>
              </m.div>
            )}

            {/* Footer Hints */}
            <div className="mt-2 pt-1.5 border-t border-[#8b6f47]/10 dark:border-white/10 flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.2 rounded bg-black/10 dark:bg-white/10 font-mono text-[8.5px]">F7</kbd>
                <span>Bật/Tắt</span>
              </span>
              {matchedProduct && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <kbd className="px-1 py-0.2 rounded bg-emerald-500/20 font-mono text-[8.5px]">Enter</kbd>
                  <span>Nạp giỏ</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.2 rounded bg-black/10 dark:bg-white/10 font-mono text-[8.5px]">Esc</kbd>
                <span>Đóng</span>
              </span>
            </div>
          </m.div>
        </div>
      </AnimatePresence>
    </Portal>
  );
}
