import React, { useRef } from 'react';
import { motion as m } from 'framer-motion';
import { X, Upload, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Portal from '@/components/widgets/Portal';

/**
 * MascotWatermarkCustomizer - Draggable Live Floating Panel to customize POS Mascot Watermark
 */
const MascotWatermarkCustomizer = React.memo(function MascotWatermarkCustomizer({
  isOpen = false,
  onClose,
  visible = true,
  onToggleVisible,
  customImage = '',
  isCompressing = false,
  onUploadImage,
  onResetImage,
  pos = 'bottom-right',
  onPosChange,
  scale = 100,
  onScaleChange,
  opacity = 15,
  onOpacityChange,
  offsetX = 10,
  onOffsetXChange,
  offsetY = 10,
  onOffsetYChange,
  rotate = -6,
  onRotateChange,
  onResetAll
}) {
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  return (
    <Portal>
      <m.div
        drag={true}
        dragMomentum={false}
        initial={{ opacity: 0, x: 40, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 40, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="fixed right-5 bottom-5 z-[9999] w-[350px] bg-[#fcfbf9]/95 dark:bg-[#071510]/95 backdrop-blur-2xl rounded-[2rem] border border-[#8b6f47]/30 dark:border-emerald-500/30 shadow-[0_25px_70px_rgba(0,0,0,0.4)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.7)] p-4 text-foreground flex flex-col gap-3 font-sans ring-1 ring-black/5 dark:ring-white/10 select-none cursor-default"
        onClick={e => e.stopPropagation()}
      >
        {/* Header & Drag Handle */}
        <div className="flex items-center justify-between pb-2 border-b border-[#8b6f47]/15 dark:border-white/10 cursor-move active:cursor-grabbing">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#8b6f47]/15 dark:bg-emerald-500/20 text-[#8b6f47] dark:text-emerald-400 flex items-center justify-center text-base shrink-0 shadow-inner">
              🎨
            </div>
            <div>
              <h4 className="font-black text-xs text-slate-800 dark:text-white uppercase tracking-tight leading-none mb-0.5 flex items-center gap-1.5">
                <span>Tùy Biến Mascot Chìm</span>
                <span className="text-[9px] font-bold text-slate-400 font-mono">(Kéo thả di chuyển)</span>
              </h4>
              <p className="text-[10px] font-bold text-[#8b6f47]/80 dark:text-emerald-400/80">Live preview ngay trên giỏ hàng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-[65vh] pr-1 custom-scrollbar">
          {/* Bật / Tắt */}
          <div className="p-2.5 bg-[#fbf8f2] dark:bg-[#0a1f16]/60 rounded-xl border border-[#8b6f47]/20 dark:border-emerald-500/20 flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 dark:text-white">Hiện Mascot Khắc Chìm</span>
            <button
              type="button"
              onClick={onToggleVisible}
              className={cn(
                "w-11 h-6 rounded-full transition-colors p-0.5 flex items-center shadow-inner cursor-pointer",
                visible ? "bg-[#2d5016] dark:bg-emerald-600 justify-end" : "bg-slate-300 dark:bg-slate-700 justify-start"
              )}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
            </button>
          </div>

          {/* Nguồn ảnh Mascot / Upload từ PC */}
          <div className="p-2.5 bg-[#fbf8f2] dark:bg-[#0a1f16]/60 rounded-xl border border-[#8b6f47]/20 dark:border-emerald-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#8b6f47] dark:text-emerald-400 flex items-center gap-1">
                <Upload size={12} />
                <span>Nguồn ảnh Mascot</span>
              </span>
              {customImage ? (
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Ảnh tự tải (Đã nén)
                </span>
              ) : (
                <span className="text-[9px] font-bold text-slate-400 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">
                  Mặc định
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-[#8b6f47]/20 dark:border-white/10 p-1 flex items-center justify-center shrink-0 shadow-inner overflow-hidden relative">
                <img 
                  src={customImage || "/assets/images/user_mascot.png"} 
                  alt="Mascot Thumbnail" 
                  className="w-full h-full object-contain filter grayscale contrast-150"
                />
                {isCompressing && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center text-white text-[8px] font-bold text-center px-0.5">
                    Nén...
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={onUploadImage}
                  />
                  <button
                    type="button"
                    disabled={isCompressing}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-1.5 px-2.5 bg-gradient-to-r from-[#2d5016] to-emerald-600 hover:from-[#234011] hover:to-emerald-700 text-white rounded-lg font-black text-[10px] uppercase tracking-tight flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Upload size={12} />
                    <span>{customImage ? "Đổi ảnh PC" : "Upload ảnh PC"}</span>
                  </button>

                  {customImage && (
                    <button
                      type="button"
                      onClick={onResetImage}
                      className="py-1.5 px-2 bg-black/10 dark:bg-white/10 hover:bg-rose-500/15 hover:text-rose-600 text-slate-600 dark:text-slate-300 rounded-lg font-bold text-[10px] flex items-center gap-0.5 transition-all cursor-pointer"
                      title="Về mặc định"
                    >
                      <Trash2 size={11} />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
                <p className="text-[9px] font-medium text-slate-400 dark:text-slate-500 leading-tight">
                  Tự động scale & nén tối ưu bộ nhớ (&lt;80KB).
                </p>
              </div>
            </div>
          </div>

          {/* Vị trí góc neo */}
          <div className="space-y-1.5 p-2.5 bg-[#fbf8f2] dark:bg-[#0a1f16]/60 rounded-xl border border-[#8b6f47]/20 dark:border-emerald-500/20">
            <label className="text-[11px] font-black uppercase tracking-wider text-[#8b6f47] dark:text-emerald-400 flex items-center justify-between">
              <span>Góc neo</span>
              <span className="text-[9.5px] text-slate-500 font-mono font-bold">{pos}</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
              {[
                { id: "bottom-right", label: "Dưới Phải" },
                { id: "bottom-left", label: "Dưới Trái" },
                { id: "center", label: "Chính Giữa" },
                { id: "top-right", label: "Trên Phải" },
                { id: "top-left", label: "Trên Trái" },
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onPosChange(item.id)}
                  className={cn(
                    "py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer text-[10px] font-black",
                    pos === item.id
                      ? "bg-[#8b6f47] dark:bg-emerald-600 text-white shadow-xs border-[#8b6f47] dark:border-emerald-500"
                      : "bg-white dark:bg-[#06140e] border-[#8b6f47]/15 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:border-[#8b6f47]/40"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Kích thước & Độ mờ */}
          <div className="grid grid-cols-2 gap-2">
            {/* Scale */}
            <div className="space-y-1 bg-[#fbf8f2] dark:bg-[#0a1f16]/60 p-2.5 rounded-xl border border-[#8b6f47]/20 dark:border-emerald-500/20">
              <div className="flex justify-between items-center text-[10.5px] font-black">
                <span className="text-slate-700 dark:text-slate-300">Cỡ ({scale}%)</span>
              </div>
              <input
                type="range"
                min="40"
                max="200"
                step="5"
                value={scale}
                onChange={e => onScaleChange(parseFloat(e.target.value))}
                className="w-full accent-[#8b6f47] dark:accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
            </div>

            {/* Opacity */}
            <div className="space-y-1 bg-[#fbf8f2] dark:bg-[#0a1f16]/60 p-2.5 rounded-xl border border-[#8b6f47]/20 dark:border-emerald-500/20">
              <div className="flex justify-between items-center text-[10.5px] font-black">
                <span className="text-slate-700 dark:text-slate-300">Độ đậm ({opacity}%)</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="1"
                value={opacity}
                onChange={e => onOpacityChange(parseFloat(e.target.value))}
                className="w-full accent-[#8b6f47] dark:accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
            </div>
          </div>

          {/* Tinh chỉnh tọa độ X / Y (Offset) & Góc xoay */}
          <div className="space-y-2 p-2.5 bg-[#fbf8f2] dark:bg-[#0a1f16]/60 rounded-xl border border-[#8b6f47]/20 dark:border-emerald-500/20">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-black text-[#8b6f47] dark:text-emerald-400 uppercase">Dịch tọa độ & Góc xoay</span>
              <button
                type="button"
                onClick={onResetAll}
                className="text-[9.5px] font-black text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Mặc định
              </button>
            </div>

            {/* Trục X */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-black text-slate-600 dark:text-slate-300">
                <span>Ngang (X):</span>
                <span className="font-mono text-[#8b6f47] dark:text-emerald-400">{offsetX > 0 ? `+${offsetX}` : offsetX}px</span>
              </div>
              <input
                type="range"
                min="-120"
                max="120"
                step="2"
                value={offsetX}
                onChange={e => onOffsetXChange(parseFloat(e.target.value))}
                className="w-full accent-[#8b6f47] dark:accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
            </div>

            {/* Trục Y */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-black text-slate-600 dark:text-slate-300">
                <span>Dọc (Y):</span>
                <span className="font-mono text-[#8b6f47] dark:text-emerald-400">{offsetY > 0 ? `+${offsetY}` : offsetY}px</span>
              </div>
              <input
                type="range"
                min="-120"
                max="120"
                step="2"
                value={offsetY}
                onChange={e => onOffsetYChange(parseFloat(e.target.value))}
                className="w-full accent-[#8b6f47] dark:accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
            </div>

            {/* Góc xoay */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-black text-slate-600 dark:text-slate-300">
                <span>Góc xoay:</span>
                <span className="font-mono text-[#8b6f47] dark:text-emerald-400">{rotate}°</span>
              </div>
              <input
                type="range"
                min="-45"
                max="45"
                step="1"
                value={rotate}
                onChange={e => onRotateChange(parseFloat(e.target.value))}
                className="w-full accent-[#8b6f47] dark:accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Nút đóng hoàn tất */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 bg-[#2d5016] dark:bg-emerald-600 hover:bg-[#234011] dark:hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer text-center"
        >
          Xong / Đóng bảng
        </button>
      </m.div>
    </Portal>
  );
});

export default MascotWatermarkCustomizer;
